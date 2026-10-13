from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.db.patient_db import execute, fetchall, init_patient_db
from app.core.patient_auth import get_current_patient_id

router = APIRouter()
init_patient_db()

class AppointmentRequest(BaseModel):
    reason: str
    preferred_date: str
    notes: str = ''

@router.post('', summary="Book Clinical Appointment Request")
async def create_appointment(body: AppointmentRequest, user_id: int = Depends(get_current_patient_id)):
    now = datetime.now(timezone.utc).isoformat()
    apt_id = execute(
        'INSERT INTO appointments(user_id, reason, preferred_date, notes, created_at) VALUES(?, ?, ?, ?, ?)',
        (user_id, body.reason, body.preferred_date, body.notes, now)
    )
    return {
        'status': 'CONFIRMED',
        'appointmentId': apt_id,
        'message': 'Your appointment request has been registered in the clinic system.'
    }

@router.get('', summary="List Patient Appointments")
async def list_appointments(user_id: int = Depends(get_current_patient_id)):
    rows = fetchall('SELECT * FROM appointments WHERE user_id = ? ORDER BY id DESC', (user_id,))
    return [
        {
            'id': r['id'],
            'reason': r['reason'],
            'preferredDate': r['preferred_date'],
            'notes': r['notes'],
            'createdAt': r['created_at']
        }
        for r in rows
    ]

@router.get('/doctor', summary="List Clinic Appointments by Date for Doctor")
async def list_doctor_appointments(date: Optional[str] = None):
    if date:
        rows = fetchall('''
            SELECT a.id, a.user_id, a.reason, a.preferred_date, a.notes, a.created_at,
                   p.name, p.age, p.gender, p.diabetes_type, p.phone
            FROM appointments a
            LEFT JOIN profiles p ON a.user_id = p.user_id
            WHERE a.preferred_date LIKE ? OR a.preferred_date = ?
            ORDER BY a.id DESC
        ''', (f"{date}%", date))
    else:
        rows = fetchall('''
            SELECT a.id, a.user_id, a.reason, a.preferred_date, a.notes, a.created_at,
                   p.name, p.age, p.gender, p.diabetes_type, p.phone
            FROM appointments a
            LEFT JOIN profiles p ON a.user_id = p.user_id
            ORDER BY a.id DESC
        ''')
    return [
        {
            'id': r['id'],
            'userId': r['user_id'],
            'name': r['name'] or f"Patient #{r['user_id']}",
            'age': r['age'] or 55,
            'gender': r['gender'] or 'Unknown',
            'diabetesType': r['diabetes_type'] or 'Type 2',
            'phone': r['phone'] or '',
            'reason': r['reason'],
            'preferredDate': r['preferred_date'],
            'notes': r['notes'],
            'createdAt': r['created_at']
        }
        for r in rows
    ]

