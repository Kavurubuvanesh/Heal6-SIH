import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Optional, Dict, List

# Locate the clinical database in the backend directory
DB_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(DB_DIR, 'heal6_clinical.db')

SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'test',
  google_sub TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  date_of_birth TEXT NOT NULL DEFAULT '',
  height_cm TEXT NOT NULL DEFAULT '',
  weight_kg TEXT NOT NULL DEFAULT '',
  blood_group TEXT NOT NULL DEFAULT '',
  diabetes_type TEXT NOT NULL DEFAULT 'type2',
  diabetes_duration_years TEXT NOT NULL DEFAULT '',
  previous_ulcer INTEGER NOT NULL DEFAULT 0,
  symptoms TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  emergency_contact TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mobile_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  report_number TEXT UNIQUE NOT NULL,
  assessment_id TEXT UNIQUE NOT NULL,
  patient_identifier TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  image_path TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  payload_json TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pdf_tokens (
  token TEXT PRIMARY KEY,
  report_number TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctor_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_identifier TEXT NOT NULL,
  report_number TEXT,
  physician_name TEXT NOT NULL,
  doctor_notes TEXT,
  review_status TEXT NOT NULL,
  prescriptions_json TEXT,
  precautions_json TEXT,
  follow_up_date TEXT,
  call_back_days INTEGER,
  created_at TEXT NOT NULL
);
'''

@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_patient_db():
    with connect() as conn:
        conn.executescript(SCHEMA)
        conn.commit()

def execute(sql: str, params: tuple = ()) -> int:
    with connect() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur.lastrowid or 0

def fetchone(sql: str, params: tuple = ()) -> Optional[sqlite3.Row]:
    with connect() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.fetchone()

def fetchall(sql: str, params: tuple = ()) -> List[sqlite3.Row]:
    with connect() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.fetchall()

def profile_dict(user_id: int) -> Optional[Dict[str, Any]]:
    row = fetchone('SELECT * FROM profiles WHERE user_id = ?', (user_id,))
    if not row:
        return None
    return {
        'name': row['name'],
        'age': row['age'],
        'gender': row['gender'],
        'dateOfBirth': row['date_of_birth'],
        'heightCm': row['height_cm'],
        'weightKg': row['weight_kg'],
        'bloodGroup': row['blood_group'],
        'diabetesType': row['diabetes_type'],
        'diabetesDurationYears': row['diabetes_duration_years'],
        'previousUlcer': bool(row['previous_ulcer']),
        'symptoms': [s for s in row['symptoms'].split(',') if s] if row['symptoms'] else [],
        'allergies': row['allergies'],
        'phone': row['phone'],
        'emergencyContact': row['emergency_contact'],
    }
