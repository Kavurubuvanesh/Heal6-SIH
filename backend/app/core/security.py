"""
Heal6 Cryptographic Security & JWT Authentication Subsystem
===========================================================
Production-grade security module providing:
1. Bcrypt password hashing and verification with adaptive salt work factor.
2. JSON Web Token (JWT) cryptographic signing with HS256 algorithm and 24h expiration.
3. Fast authorization bearer token parsing and claim validation.
"""

import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def hash_password(password: str) -> str:
    """
    Cryptographically hashes a plain-text password using bcrypt with standard salt rounds.
    Truncates to 72 bytes per bcrypt standard specification.
    """
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a stored bcrypt hash in constant time.
    """
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a cryptographically signed HS256 JWT access token.
    """
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(hours=settings.JWT_EXPIRATION_HOURS)

    to_encode.update({
        "exp": expire,
        "iat": now_utc,
        "iss": "Heal6 Clinical Telemetry Security Engine"
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and cryptographically verifies an HS256 JWT token.
    Returns None if expired, malformed, or forged.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None

# Canonical verified medical staff registry (Pre-seeded with hashed credentials for HIPAA-compliant clinic access)
VERIFIED_STAFF_REGISTRY = {
    "dr.sharma@heal6.health": {
        "name": "Dr. Sharma",
        "email": "dr.sharma@heal6.health",
        "password_hash": "",
        "plain_fallback": "Heal6@Podiatry2026",
        "role": "Consultant Endocrinologist & DFU Specialist",
        "department": "Endocrinology & Diabetic Foot Unit (Suite B)",
        "license": "MED-IND-2018-84920",
        "facility": "Heal6 Podiatric & Limb Preservation Center"
    },
    "dr.chen@heal6.health": {
        "name": "Dr. Marcus Chen",
        "email": "dr.chen@heal6.health",
        "password_hash": "",
        "plain_fallback": "Vascular@STAT2026",
        "role": "Chief of Vascular Surgery & Limb Salvage",
        "department": "Vascular Surgery & Limb Salvage Team",
        "license": "MED-IND-2014-49281",
        "facility": "Heal6 Podiatric & Limb Preservation Center"
    },
    "dr.alvarez@heal6.health": {
        "name": "Dr. Elena Alvarez",
        "email": "dr.alvarez@heal6.health",
        "password_hash": "",
        "plain_fallback": "Podiatry@Clinic2026",
        "role": "Senior Podiatric Surgeon",
        "department": "Podiatric Surgical Clinic (Terminal 04)",
        "license": "MED-IND-2016-72819",
        "facility": "Heal6 Podiatric & Limb Preservation Center"
    }
}

# Precompute authentic bcrypt hashes for all staff upon module initialization
for staff in VERIFIED_STAFF_REGISTRY.values():
    if not staff["password_hash"] or not staff["password_hash"].startswith("$2b$"):
        staff["password_hash"] = hash_password(staff["plain_fallback"])

async def get_current_doctor(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and validate the authenticated physician from the Authorization header.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate medical credentials or session token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: Optional[str] = payload.get("sub")
    if email is None or email not in VERIFIED_STAFF_REGISTRY:
        raise credentials_exception

    doctor = VERIFIED_STAFF_REGISTRY[email]
    return {
        "name": doctor["name"],
        "email": doctor["email"],
        "role": doctor["role"],
        "department": payload.get("department", doctor["department"]),
        "license": doctor["license"],
        "facility": doctor["facility"]
    }
