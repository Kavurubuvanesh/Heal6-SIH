from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.patient import Patient

async def get_patient_by_id(db: AsyncSession, patient_id: str) -> Optional[Patient]:
    """Retrieve patient record by ID."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    return result.scalar_one_or_none()


async def get_all_patients(db: AsyncSession) -> List[Patient]:
    """Retrieve all active patients."""
    result = await db.execute(select(Patient).where(Patient.is_archived == False))
    return list(result.scalars().all())


async def upsert_patient(db: AsyncSession, patient_id: str, name: str, age: int, gender: str, diabetes_type: Optional[str] = None, hba1c: Optional[str] = None) -> Patient:
    """Inserts a new patient or updates existing patient demographics."""
    patient = await get_patient_by_id(db, patient_id)
    if patient is None:
        patient = Patient(
            id=patient_id,
            name=name,
            age=age,
            gender=gender,
            diabetes_type=diabetes_type,
            hba1c=hba1c
        )
        db.add(patient)
    else:
        patient.name = name
        patient.age = age
        patient.gender = gender
        if diabetes_type:
            patient.diabetes_type = diabetes_type
        if hba1c:
            patient.hba1c = hba1c
    await db.flush()
    return patient


async def flag_patient_reverify(db: AsyncSession, patient_id: str, patient_notes: Optional[str] = None) -> Optional[Patient]:
    """Marks patient as requesting manual physician re-verification."""
    patient = await get_patient_by_id(db, patient_id)
    if patient:
        patient.reverification_requested = True
        patient.patient_notes = patient_notes
        await db.flush()
    return patient
