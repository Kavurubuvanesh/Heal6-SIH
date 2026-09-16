import asyncio
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from app.core.database import init_db, AsyncSessionLocal
from app.crud import (
    get_active_triage_queue,
    get_patient_latest_assessment,
    upsert_patient,
    create_wound_assessment,
    verify_patient_assessment,
    flag_patient_reverify
)
from app.db.models import Patient, WoundAssessment

async def run_persistence_tests():
    print("🧪 [TEST 1/5] Initializing database schema & baseline seeding...")
    await init_db()
    print("✅ Database initialized.")

    async with AsyncSessionLocal() as db:
        print("🧪 [TEST 2/5] Verifying baseline patients in triage queue...")
        queue = await get_active_triage_queue(db)
        print(f"📊 Current Triage Queue Count: {len(queue)}")
        assert len(queue) >= 3, f"Expected at least 3 baseline patients, got {len(queue)}"
        
        # Verify ordering by SINBAD score descending
        sinbad_scores = [p["calculatedSinbad"] for p in queue]
        print(f"📊 Queue SINBAD Scores (descending): {sinbad_scores}")
        assert sinbad_scores == sorted(sinbad_scores, reverse=True), "Queue must be sorted by SINBAD descending!"
        print("✅ Baseline patients and SINBAD sorting verified.")

        print("🧪 [TEST 3/5] Inserting test patient and clinical wound assessment...")
        test_patient = await upsert_patient(
            db=db,
            patient_id="DFU-TEST-999",
            name="Alexander Vance",
            age=64,
            gender="Male",
            diabetes_type="Type 2 DM (18 yrs)",
            hba1c="9.8%"
        )
        
        test_data = {
            "locationLabel": "Right Plantar Heel Ulcer",
            "siteScore": 1,
            "ischemiaScore": 1,
            "neuropathyScore": 1,
            "bacterialScore": 1,
            "areaScore": 1,
            "depthScore": 1,
            "calculatedSinbad": 6,
            "woundAreaCm2": 3.85,
            "arucoCalibration": 42.0,
            "arucoDetected": True,
            "infectionRiskPercent": 92.4,
            "convnextConfidence": 95.0,
            "tissueBreakdown": {
                "granulation": 25.0,
                "slough": 45.0,
                "necrotic": 30.0
            },
            "triageLevel": "CRITICAL SURGICAL EMERGENCY",
            "triageColor": "#f43f5e",
            "healingEstimateWeeks": "20 - 28 Weeks"
        }
        
        assessment = await create_wound_assessment(db=db, patient=test_patient, data=test_data)
        await db.commit()
        print(f"✅ Created assessment ID: {assessment.id} for patient: {test_patient.id}")

        print("🧪 [TEST 4/5] Testing patient reverification flag...")
        await flag_patient_reverify(db, "DFU-TEST-999", "Patient notes severe nocturnal throbbing pain.")
        await db.commit()
        
        updated_assessment = await get_patient_latest_assessment(db, "DFU-TEST-999")
        telemetry = updated_assessment.to_dict()
        assert telemetry["reverificationRequested"] == True
        assert telemetry["patientNotes"] == "Patient notes severe nocturnal throbbing pain."
        print("✅ Reverification flag and patient notes verified in database.")

        print("🧪 [TEST 5/5] Testing physician sign-off & validation persistence...")
        verified = await verify_patient_assessment(
            db=db,
            patient_id="DFU-TEST-999",
            final_score=6,
            verified_ischemia=True,
            verified_depth=True,
            doctor_notes="Confirmed probe-to-calcaneus. Admitted for immediate surgical debridement."
        )
        await db.commit()
        
        telemetry_after_verify = (await get_patient_latest_assessment(db, "DFU-TEST-999")).to_dict()
        assert telemetry_after_verify["verifiedByDoctor"] == True
        assert telemetry_after_verify["finalVerifiedScore"] == 6
        assert "probe-to-calcaneus" in telemetry_after_verify["doctorVerificationNotes"]
        print("✅ Physician validation & digital sign-off successfully persisted.")

    print("\n🎉 ALL 5 PERSISTENCE & RELATIONAL INTEGRITY TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(run_persistence_tests())
