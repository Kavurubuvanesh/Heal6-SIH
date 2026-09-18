"""
Unit and Integration Tests for Heal6 Cryptographic Security & JWT Auth
======================================================================
Tests bcrypt work factors, HS256 JWT claim signing, expiration logic,
and HTTP status codes on auth routes.
"""

import unittest
import sys
from pathlib import Path
from datetime import timedelta

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient

from app.main import app
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    VERIFIED_STAFF_REGISTRY
)

client = TestClient(app)

def test_password_hashing_and_verification():
    raw_pass = "Heal6@Podiatry2026"
    hashed = hash_password(raw_pass)
    
    assert hashed.startswith("$2b$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False

def test_jwt_issuance_and_decoding():
    data = {
        "sub": "dr.sharma@heal6.health",
        "name": "Dr. Sharma",
        "role": "Consultant Endocrinologist"
    }
    token = create_access_token(data, expires_delta=timedelta(minutes=30))
    assert isinstance(token, str)
    assert len(token) > 40
    
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "dr.sharma@heal6.health"
    assert payload["name"] == "Dr. Sharma"
    assert "exp" in payload
    assert "iat" in payload

def test_jwt_expired_token_handling():
    data = {"sub": "dr.sharma@heal6.health"}
    # Token expired 10 minutes ago
    expired_token = create_access_token(data, expires_delta=timedelta(minutes=-10))
    payload = decode_access_token(expired_token)
    assert payload is None

def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "dr.sharma@heal6.health",
            "password": "Heal6@Podiatry2026",
            "department": "Endocrinology & Diabetic Foot Unit (Suite B)"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_hours"] == 24
    assert data["doctor"]["name"] == "Dr. Sharma"
    assert data["doctor"]["email"] == "dr.sharma@heal6.health"

def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "dr.sharma@heal6.health",
            "password": "IncorrectPassword123"
        }
    )
    assert response.status_code == 401
    assert "Invalid clinical authentication password" in response.json()["detail"]

def test_login_unknown_physician():
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "fake.doctor@unknown.org",
            "password": "Heal6@Podiatry2026"
        }
    )
    assert response.status_code == 401
    assert "not recognized" in response.json()["detail"]

def test_verify_active_session():
    # First login to acquire genuine token
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "dr.chen@heal6.health",
            "password": "Vascular@STAT2026"
        }
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    
    # Verify with valid Bearer token
    verify_res = client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_res.status_code == 200
    doc = verify_res.json()
    assert doc["email"] == "dr.chen@heal6.health"
    assert "Marcus Chen" in doc["name"]
    
    # Verify with invalid Bearer token
    fail_res = client.get(
        "/api/v1/auth/verify",
        headers={"Authorization": "Bearer forged_invalid_jwt_token"}
    )
    assert fail_res.status_code == 401

def test_staff_directory_endpoint():
    response = client.get("/api/v1/auth/staff-directory")
    assert response.status_code == 200
    staff = response.json()["staff"]
    assert len(staff) >= 3
    emails = [s["email"] for s in staff]
    assert "dr.sharma@heal6.health" in emails
    assert "dr.chen@heal6.health" in emails


if __name__ == "__main__":
    print("Running Security & JWT Authentication Tests...")
    test_password_hashing_and_verification()
    print("[PASS] Password hashing and verification")
    test_jwt_issuance_and_decoding()
    print("[PASS] JWT issuance and decoding")
    test_jwt_expired_token_handling()
    print("[PASS] JWT expiration handling")
    test_login_success()
    print("[PASS] Physician login success")
    test_login_invalid_password()
    print("[PASS] Invalid password rejection")
    test_login_unknown_physician()
    print("[PASS] Unknown physician rejection")
    test_verify_active_session()
    print("[PASS] Session token verification")
    test_staff_directory_endpoint()
    print("[PASS] Staff directory endpoint")
    print("ALL SECURITY & AUTHENTICATION TESTS PASSED!")

