from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.db.patient_db import execute, profile_dict, init_patient_db
from app.core.patient_auth import get_current_patient_id

router = APIRouter()
init_patient_db()

class Profile(BaseModel):
    name: str = ''
    age: str = ''
    gender: str = ''
    dateOfBirth: str = ''
    heightCm: str = ''
    weightKg: str = ''
    bloodGroup: str = ''
    diabetesType: str = 'type2'
    diabetesDurationYears: str = ''
    previousUlcer: bool = False
    symptoms: str = ''
    allergies: str = ''
    phone: str = ''
    emergencyContact: str = ''

@router.get('/me', summary="Get Current Patient Profile")
async def get_profile(user_id: int = Depends(get_current_patient_id)):
    return profile_dict(user_id) or {}

@router.put('/me', summary="Update Current Patient Profile")
async def save_profile(body: Profile, user_id: int = Depends(get_current_patient_id)):
    now = datetime.now(timezone.utc).isoformat()
    execute('''
    INSERT INTO profiles(user_id, name, age, gender, date_of_birth, height_cm, weight_kg, blood_group,
                         diabetes_type, diabetes_duration_years, previous_ulcer, symptoms, allergies,
                         phone, emergency_contact, updated_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
        name = excluded.name,
        age = excluded.age,
        gender = excluded.gender,
        date_of_birth = excluded.date_of_birth,
        height_cm = excluded.height_cm,
        weight_kg = excluded.weight_kg,
        blood_group = excluded.blood_group,
        diabetes_type = excluded.diabetes_type,
        diabetes_duration_years = excluded.diabetes_duration_years,
        previous_ulcer = excluded.previous_ulcer,
        symptoms = excluded.symptoms,
        allergies = excluded.allergies,
        phone = excluded.phone,
        emergency_contact = excluded.emergency_contact,
        updated_at = excluded.updated_at
    ''', (
        user_id, body.name, body.age, body.gender, body.dateOfBirth, body.heightCm, body.weightKg, body.bloodGroup,
        body.diabetesType, body.diabetesDurationYears, int(body.previousUlcer), body.symptoms, body.allergies,
        body.phone, body.emergencyContact, now
    ))
    return profile_dict(user_id)
