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
    finalScore: int
    verifiedIschemia: bool
    verifiedDepth: bool
    doctorNotes: Optional[str] = None


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
    Accepts final physician validation of AI parameters and persists the digital signature
    and sign-off in the relational database.
    """
    assessment = await verify_patient_assessment(
        db=db,
        patient_id=patient_id,
        final_score=payload.finalScore,
        verified_ischemia=payload.verifiedIschemia,
        verified_depth=payload.verifiedDepth,
        doctor_notes=payload.doctorNotes
    )

    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found in active database queue.")

    await db.commit()
    await event_bus.broadcast_patient_verified(patient_id, payload.dict())
    return {
        "status": "success",
        "message": f"Report for {patient_id} verified and dispatched to Central HIS Database.",
        "verified_data": payload.dict()
    }