from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.event_bus import event_bus
from app.crud import (
    get_active_triage_queue,
    get_patient_latest_assessment,
    upsert_patient,
    create_wound_assessment,
    flag_patient_reverify,
    verify_patient_assessment
)

router = APIRouter()

# ---------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------
class VerificationPayload(BaseModel):
    finalScore: Optional[int] = 2
    verifiedIschemia: Optional[bool] = False
    verifiedDepth: Optional[bool] = False
    physicianName: Optional[str] = "Dr. Sharma, MD"
    doctorNotes: Optional[str] = None
    reviewStatus: Optional[str] = "Reviewed & Prescribed"
    prescriptions: Optional[List[str]] = None
    precautions: Optional[List[str]] = None
    followUpDate: Optional[str] = None
    callBackDays: Optional[int] = None


class ReverifyPayload(BaseModel):
    patientNotes: Optional[str] = None


async def add_or_update_patient_in_db(db: AsyncSession, patient_data: dict) -> dict:
    """
    Persists patient and clinical wound assessment to relational database.
    Returns the unified telemetry dictionary contract.
    """
    p_id = patient_data.get("id") or f"DFU-{abs(hash(patient_data.get('name', 'Patient')))%9000 + 1000}"
    name = patient_data.get("name", "New Patient")
    age = int(patient_data.get("age", 58))
    gender = patient_data.get("gender", "Male")
    diabetes_type = patient_data.get("diabetesType", "Type 2 DM")
    hba1c = patient_data.get("hba1c", "8.5%")

    patient = await upsert_patient(
        db=db,
        patient_id=p_id,
        name=name,
        age=age,
        gender=gender,
        diabetes_type=diabetes_type,
        hba1c=hba1c
    )

    assessment = await create_wound_assessment(db=db, patient=patient, data=patient_data)
    await db.commit()
    return assessment.to_dict()


# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------
@router.get("/queue", summary="Fetch active patient triage queue from Relational DB")
async def get_patient_queue(db: AsyncSession = Depends(get_db)):
    """Returns the current list of patients awaiting physician review, sorted by SINBAD severity."""
    queue = await get_active_triage_queue(db)
    return queue


@router.get("/{patient_id}", summary="Get specific patient telemetry by ID")
async def get_patient_by_id(patient_id: str, db: AsyncSession = Depends(get_db)):
    """Returns telemetry data for a specific patient."""
    assessment = await get_patient_latest_assessment(db, patient_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")
    return assessment.to_dict()


@router.post("/intake", summary="Add or update a patient in the database triage queue")
async def intake_patient(patient_data: dict, db: AsyncSession = Depends(get_db)):
    """Directly inserts/updates patient clinical case into the relational database."""
    updated = await add_or_update_patient_in_db(db, patient_data)
    await event_bus.broadcast_patient_intake(updated)
    return {"status": "success", "patient": updated}


@router.post("/{patient_id}/reverify", summary="Patient Requests Manual Physician Re-verification")
async def request_patient_reverify(
    patient_id: str,
    payload: ReverifyPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Flags the patient in the relational database as requesting manual physician re-verification
    and attaches any additional patient clinical notes.
    """
    patient = await flag_patient_reverify(db, patient_id, payload.patientNotes)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")
    await db.commit()
    
    latest_assessment = await get_patient_latest_assessment(db, patient_id)
    await event_bus.broadcast_reverify_requested(patient_id, payload.patientNotes or "")
    return {
        "status": "success",
        "message": f"Patient {patient_id} flagged for physician re-verification in relational database.",
        "patient": latest_assessment.to_dict() if latest_assessment else patient.to_dict()
    }


@router.post("/{patient_id}/verify", summary="Physician Sign-Off & Execute Directive")
async def verify_patient_report(
    patient_id: str,
    payload: VerificationPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts final physician validation of AI parameters and persists the digital signature,
    prescriptions, precautions, and follow-up appointment in the relational and clinical databases.
    """
    import json
    from datetime import datetime, timezone
    from app.db.patient_db import execute

    assessment = await verify_patient_assessment(
        db=db,
        patient_id=patient_id,
        final_score=payload.finalScore,
        verified_ischemia=payload.verifiedIschemia,
        verified_depth=payload.verifiedDepth,
        doctor_notes=payload.doctorNotes,
        physician_name=payload.physicianName,
        review_status=payload.reviewStatus,
        prescriptions=payload.prescriptions,
        precautions=payload.precautions,
        follow_up_date=payload.followUpDate,
        call_back_days=payload.callBackDays
    )

    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found in active database queue.")

    await db.commit()

    # Also persist to SQLite doctor_reviews for instant cross-frontend lookup
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        execute(
            '''INSERT INTO doctor_reviews(patient_identifier, physician_name, doctor_notes,
                                         review_status, prescriptions_json, precautions_json,
                                         follow_up_date, call_back_days, created_at)
               VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                patient_id,
                payload.physicianName or "Dr. Sharma, MD",
                payload.doctorNotes or "",
                payload.reviewStatus or "Reviewed & Prescribed",
                json.dumps(payload.prescriptions or []),
                json.dumps(payload.precautions or []),
                payload.followUpDate or "",
                payload.callBackDays or 7,
                now_iso
            )
        )
    except Exception as db_err:
        print(f"⚠️ [SQLITE WARNING] Could not record doctor review in sqlite: {db_err}")

    await event_bus.broadcast_patient_verified(patient_id, payload.dict())
    return {
        "status": "success",
        "message": f"Report for {patient_id} verified and dispatched to Central HIS Database.",
        "verified_data": payload.dict()
    }


@router.get("/{patient_id}/doctor-review", summary="Fetch Latest Doctor Review & Prescriptions for Patient")
async def get_patient_doctor_review(patient_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves the latest verified doctor assessment, prescriptions, precautions, and appointment date."""
    import json
    from app.db.patient_db import fetchone

    # Check relational DB first
    assessment = await get_patient_latest_assessment(db, patient_id)
    if assessment and assessment.verified_by_doctor:
        return {
            "patientId": patient_id,
            "hasReview": True,
            "verifiedByDoctor": True,
            "physicianName": assessment.validation.physician_name if assessment.validation else "Dr. Sharma, MD",
            "doctorNotes": assessment.doctor_verification_notes or (assessment.validation.doctor_notes if assessment.validation else ""),
            "reviewStatus": assessment.validation.review_status if assessment.validation else "Reviewed & Prescribed",
            "prescriptions": assessment.validation.prescriptions if (assessment.validation and assessment.validation.prescriptions) else [],
            "precautions": assessment.validation.precautions if (assessment.validation and assessment.validation.precautions) else [],
            "followUpDate": assessment.validation.follow_up_date if assessment.validation else None,
            "callBackDays": assessment.validation.call_back_days if assessment.validation else None,
            "verifiedAt": assessment.validation.verified_at.isoformat() if (assessment.validation and assessment.validation.verified_at) else None
        }

    # Fallback to SQLite doctor_reviews
    row = fetchone(
        "SELECT * FROM doctor_reviews WHERE patient_identifier = ? ORDER BY id DESC LIMIT 1",
        (patient_id,)
    )
    if row:
        return {
            "patientId": patient_id,
            "hasReview": True,
            "verifiedByDoctor": True,
            "physicianName": row["physician_name"],
            "doctorNotes": row["doctor_notes"],
            "reviewStatus": row["review_status"],
            "prescriptions": json.loads(row["prescriptions_json"] or "[]"),
            "precautions": json.loads(row["precautions_json"] or "[]"),
            "followUpDate": row["follow_up_date"],
            "callBackDays": row["call_back_days"],
            "verifiedAt": row["created_at"]
        }

    return {
        "patientId": patient_id,
        "hasReview": False,
        "verifiedByDoctor": False,
        "reviewStatus": "Awaiting Doctor Review",
        "prescriptions": [],
        "precautions": []
    }