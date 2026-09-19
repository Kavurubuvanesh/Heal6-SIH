import os
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import httpx
from app.db import execute, fetchone, init_db
from app.security import hash_password, verify_password, sign_token

router = APIRouter()

class TestLoginRequest(BaseModel):
    email: str
    password: str
class GoogleLoginRequest(BaseModel):
    id_token: str

def _user_response(row):
    return {'id': row['id'], 'email': row['email'], 'name': row['name'], 'authProvider': row['auth_provider']}

def _ensure_test_account():
    init_db();
    row = fetchone('SELECT * FROM users WHERE email=?', ('test@heal6.app',))
    if not row:
        now=datetime.now(timezone.utc).isoformat(); execute('INSERT INTO users(email,name,password_hash,auth_provider,created_at) VALUES(?,?,?,?,?)', ('test@heal6.app','Test User',hash_password('Heal6@123'),'test',now))
    return fetchone('SELECT * FROM users WHERE email=?', ('test@heal6.app',))

@router.post('/test-login')
async def test_login(body: TestLoginRequest):
    _ensure_test_account(); row=fetchone('SELECT * FROM users WHERE email=?',(body.email.lower().strip(),))
    if not row or not row['password_hash'] or not verify_password(body.password,row['password_hash']): raise HTTPException(status_code=401, detail='Invalid test account credentials')
    return {'accessToken': sign_token(row['id'], row['email']), 'user': _user_response(row)}

@router.post('/google')
async def google_login(body: GoogleLoginRequest):
    allowed = {x.strip() for x in os.getenv('HEAL6_GOOGLE_CLIENT_IDS','').split(',') if x.strip()}
    if not allowed: raise HTTPException(status_code=503, detail='Google authentication is not configured. Set HEAL6_GOOGLE_CLIENT_IDS on the backend.')
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': body.id_token})
        if response.status_code != 200: raise ValueError('tokeninfo rejected token')
        info=response.json()
        if info.get('aud') not in allowed: raise ValueError('unexpected Google client id')
        email=info.get('email'); sub=info.get('sub'); name=info.get('name') or email
        if not email or not sub: raise ValueError('missing identity claims')
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f'Google token verification failed: {exc}')
    row=fetchone('SELECT * FROM users WHERE google_sub=?',(sub,)) or fetchone('SELECT * FROM users WHERE email=?',(email.lower(),))
    now=datetime.now(timezone.utc).isoformat()
    if row:
        execute('UPDATE users SET name=?,google_sub=?,auth_provider=? WHERE id=?',(name,sub,'google',row['id']))
    else:
        execute('INSERT INTO users(email,name,auth_provider,google_sub,created_at) VALUES(?,?,?,?,?)',(email.lower(),name,'google',sub,now))
    row=fetchone('SELECT * FROM users WHERE email=?',(email.lower(),))
    return {'accessToken': sign_token(row['id'], row['email']), 'user': _user_response(row)}
