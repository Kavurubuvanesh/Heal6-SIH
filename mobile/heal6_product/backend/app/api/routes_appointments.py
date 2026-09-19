from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.db import execute, fetchall
from app.security import current_user

router=APIRouter()
class Appointment(BaseModel):
    reason: str
    preferred_date: str
    notes: str = ''

@router.post('')
async def create(body: Appointment, user_id:int=Depends(current_user)):
    execute('INSERT INTO appointments(user_id,reason,preferred_date,notes,created_at) VALUES(?,?,?,?,?)',(user_id,body.reason,body.preferred_date,body.notes,datetime.now(timezone.utc).isoformat()))
    return {'status':'stored'}

@router.get('')
async def list_for_user(user_id:int=Depends(current_user)):
    return [dict(x) for x in fetchall('SELECT id,reason,preferred_date,notes,created_at FROM appointments WHERE user_id=? ORDER BY id DESC',(user_id,))]
