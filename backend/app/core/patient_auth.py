from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.security import decode_access_token

async def get_current_patient_id(authorization: Optional[str] = Header(default=None)) -> int:
    """
    Validates Bearer token for mobile patient sessions.
    Strict production enforcement: requires valid JWT token signed by Heal6.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required."
        )

    parts = authorization.split(' ', 1)
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'."
        )

    token = parts[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired patient access token."
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Subject claim missing from token."
        )

    try:
        return int(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid patient identifier in token."
        )

async def get_optional_patient_id(authorization: Optional[str] = Header(default=None)) -> Optional[int]:
    """
    Validates Bearer token if provided.
    If no authorization header is present (e.g. walk-in web patient intake in heal6-patient-app),
    returns None to allow diagnostic intake to proceed seamlessly.
    """
    if not authorization:
        return None

    parts = authorization.split(' ', 1)
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None

    token = parts[1].strip()
    payload = decode_access_token(token)
    if not payload:
        return None

    sub = payload.get("sub")
    if not sub:
        return None

    try:
        return int(sub)
    except ValueError:
        return None

