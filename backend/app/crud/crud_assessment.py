from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.db.models.assessment import WoundAssessment
from app.db.models.patient import Patient
from app.db.models.validation import PhysicianValidation

async def get_active_triage_queue(db: AsyncSession) -> List[Dict[str, Any]]:
    """
    Returns the active patient triage queue sorted by SINBAD severity descending.
    Eager-loads patient relationship to eliminate N+1 queries.
    """
    stmt = (
        select(WoundAssessment)
        .options(
            selectinload(WoundAssessment.patient),
            selectinload(WoundAssessment.validation)
        )
        .join(WoundAssessment.patient)
        .where(Patient.is_archived == False)
        .order_by(desc(WoundAssessment.sinbad_score), desc(WoundAssessment.timestamp))
    )
    result = await db.execute(stmt)
    assessments = result.scalars().all()

    # De-duplicate by patient ID keeping only the latest assessment per patient
    seen_patient_ids = set()
    queue = []
    for a in assessments:
        if a.patient_id not in seen_patient_ids:
            seen_patient_ids.add(a.patient_id)
            queue.append(a.to_dict())

    return queue


async def get_patient_latest_assessment(db: AsyncSession, patient_id: str) -> Optional[WoundAssessment]:
    """Retrieve the most recent assessment for a given patient."""
    stmt = (
        select(WoundAssessment)
        .options(
            selectinload(WoundAssessment.patient),
            selectinload(WoundAssessment.validation)
        )
        .where(WoundAssessment.patient_id == patient_id)
        .order_by(desc(WoundAssessment.timestamp))
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_assessment_by_id(db: AsyncSession, assessment_id: str) -> Optional[WoundAssessment]:
    """Retrieve an assessment by its primary key ID with patient eager loaded."""
    stmt = (
        select(WoundAssessment)
        .options(
            selectinload(WoundAssessment.patient),
            selectinload(WoundAssessment.validation)
        )
        .where(WoundAssessment.id == assessment_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_wound_assessment(db: AsyncSession, patient: Patient, data: dict) -> WoundAssessment:
    """Persist a newly computed clinical wound assessment entity."""
    sinbad_val = data.get("sinbadScore")
    if sinbad_val is None:
        sinbad_val = data.get("calculatedSinbad", 0)

    tissue_dict = data.get("tissueBreakdown") or {}
    gran_pct = data.get("granulationPct") or data.get("tissueGranulation") or tissue_dict.get("granulation", 50.0)
    slough_pct = data.get("sloughPct") or data.get("tissueSlough") or tissue_dict.get("slough", 30.0)
    necrotic_pct = data.get("necroticPct") or data.get("tissueNecrotic") or tissue_dict.get("necrotic", 20.0)

    assessment = WoundAssessment(
        patient=patient,
        location_label=data.get("locationLabel") or data.get("location_label", "Right Plantar Hindfoot / Heel"),
        site_score=data.get("siteScore", 0),
        ischemia_score=data.get("ischemiaScore", 0),
        neuropathy_score=data.get("neuropathyScore", 0),
        bacterial_score=data.get("bacterialScore", 0),
        area_score=data.get("areaScore", 0),
        depth_score=data.get("depthScore", 0),
        sinbad_score=int(sinbad_val),
        wound_area_cm2=float(data.get("woundAreaCm2", 0.0) or 0.0),
        aruco_calibration=float(data.get("arucoCalibration", 42.0) or 42.0),
        aruco_detected=bool(data.get("arucoDetected", True)),
        infection_risk_percent=float(data.get("infectionRiskPercent", 0.0) or 0.0),
        convnext_confidence=float(data.get("convnextConfidence") or data.get("confidenceScore", 0.0) or 0.0),
        tissue_granulation_percent=float(gran_pct or 0.0),
        tissue_slough_percent=float(slough_pct or 0.0),
        tissue_necrotic_percent=float(necrotic_pct or 0.0),
        original_image=data.get("image") or data.get("originalImage"),
        mask_image=data.get("maskImage") or data.get("aiMaskImage"),
        healing_estimate_weeks=data.get("healingEstimateWeeks", "8 - 12 Weeks"),
        triage_level=data.get("urgencyLevel") or data.get("riskCategory") or data.get("triageLevel", "MODERATE RISK"),
        triage_color=data.get("triageColor", "#f59e0b"),
        triage_bg=data.get("triageBg", "#fffbeb"),
        radar_data=data.get("radarData"),
        trajectory_data=data.get("trajectoryData"),
        action_plan=data.get("aiAnalysis") or data.get("actionPlan")
    )
    db.add(assessment)
    await db.flush()
    return assessment


async def verify_patient_assessment(
    db: AsyncSession,
    patient_id: str,
    final_score: int,
    verified_ischemia: bool,
    verified_depth: bool,
    doctor_notes: Optional[str] = None,
    physician_name: Optional[str] = "Dr. Sharma, MD",
    review_status: Optional[str] = "Reviewed & Prescribed",
    prescriptions: Optional[list] = None,
    precautions: Optional[list] = None,
    follow_up_date: Optional[str] = None,
    call_back_days: Optional[int] = None
) -> Optional[WoundAssessment]:
    """Records physician digital validation sign-off and clinical prescriptions in the database."""
    assessment = await get_patient_latest_assessment(db, patient_id)
    if not assessment:
        return None

    assessment.verified_by_doctor = True
    assessment.doctor_verification_notes = doctor_notes
    assessment.final_verified_score = final_score

    # Insert or update PhysicianValidation record
    existing_stmt = select(PhysicianValidation).where(PhysicianValidation.assessment_id == assessment.id)
    existing_res = await db.execute(existing_stmt)
    validation = existing_res.scalar_one_or_none()

    if validation:
        validation.physician_name = physician_name or "Dr. Sharma, MD"
        validation.verified_ischemia = verified_ischemia
        validation.verified_depth = verified_depth
        validation.final_verified_score = final_score
        validation.doctor_notes = doctor_notes
        validation.review_status = review_status or "Reviewed & Prescribed"
        validation.prescriptions = prescriptions or []
        validation.precautions = precautions or []
        validation.follow_up_date = follow_up_date
        validation.call_back_days = call_back_days
    else:
        validation = PhysicianValidation(
            assessment=assessment,
            physician_name=physician_name or "Dr. Sharma, MD",
            verified_ischemia=verified_ischemia,
            verified_depth=verified_depth,
            final_verified_score=final_score,
            doctor_notes=doctor_notes,
            review_status=review_status or "Reviewed & Prescribed",
            prescriptions=prescriptions or [],
            precautions=precautions or [],
            follow_up_date=follow_up_date,
            call_back_days=call_back_days
        )
        db.add(validation)

    await db.flush()
    return assessment
