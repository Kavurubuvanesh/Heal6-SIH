import json
import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Optional

DB_PATH = os.getenv('HEAL6_DB_PATH', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'heal6.db'))
os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)

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
  name TEXT NOT NULL DEFAULT '', age TEXT NOT NULL DEFAULT '', gender TEXT NOT NULL DEFAULT '', date_of_birth TEXT NOT NULL DEFAULT '',
  height_cm TEXT NOT NULL DEFAULT '', weight_kg TEXT NOT NULL DEFAULT '', blood_group TEXT NOT NULL DEFAULT '', diabetes_type TEXT NOT NULL DEFAULT 'type2',
  diabetes_duration_years TEXT NOT NULL DEFAULT '', previous_ulcer INTEGER NOT NULL DEFAULT 0, symptoms TEXT NOT NULL DEFAULT '', allergies TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', emergency_contact TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reports (
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
'''

@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db():
    with connect() as conn:
        conn.executescript(SCHEMA)

def execute(query: str, params: tuple[Any, ...] = ()) -> None:
    with connect() as conn: conn.execute(query, params)

def fetchone(query: str, params: tuple[Any, ...] = ()) -> Optional[sqlite3.Row]:
    with connect() as conn: return conn.execute(query, params).fetchone()

def fetchall(query: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
    with connect() as conn: return conn.execute(query, params).fetchall()

def profile_row(user_id: int) -> Optional[sqlite3.Row]:
    return fetchone('SELECT * FROM profiles WHERE user_id=?', (user_id,))

def profile_dict(user_id: int) -> Optional[dict[str, Any]]:
    row = profile_row(user_id)
    if not row: return None
    return {
        'id': row['user_id'], 'name': row['name'], 'age': row['age'], 'gender': row['gender'], 'dateOfBirth': row['date_of_birth'],
        'heightCm': row['height_cm'], 'weightKg': row['weight_kg'], 'bloodGroup': row['blood_group'], 'diabetesType': row['diabetes_type'],
        'diabetesDurationYears': row['diabetes_duration_years'], 'previousUlcer': bool(row['previous_ulcer']), 'symptoms': row['symptoms'],
        'allergies': row['allergies'], 'phone': row['phone'], 'emergencyContact': row['emergency_contact']
    }
