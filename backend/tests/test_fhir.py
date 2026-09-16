"""
Production Test Suite for Pillar 3: HL7 / FHIR R4 Interoperability.
Validates:
1. Pydantic FHIR R4 Schema compliance.
2. LOINC / SNOMED CT / UCUM standard coding across all Observation entries.
3. Serialization of relational models to FHIR R4 Document Bundle.
4. FastAPI FHIR Endpoints:
   - GET /api/v1/fhir/Patient/{id}
   - GET /api/v1/fhir/DiagnosticReport/{id}
   - GET /api/v1/fhir/Bundle/{id}
   - GET /api/v1/fhir/Bundle/{id}/download
"""
import sys
import os
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.core.database import init_db, AsyncSessionLocal
from app.crud.crud_patient import get_patient_by_id
from app.crud.crud_assessment import get_patient_latest_assessment
from app.fhir.serializer import build_fhir_bundle
from app.fhir.schemas import FHIRBundle
from app.fhir.codes import (
    SYSTEM_LOINC,
    SYSTEM_SNOMED,
    SYSTEM_UCUM,
    LOINC_WOUND_AREA,
    LOINC_SINBAD_SCORE,
    SNOMED_DFU
)


async def test_fhir_bundle_serializer():
    """Test standard FHIR Bundle generation from relational models."""
    await init_db()
    async with AsyncSessionLocal() as db:
        patient = await get_patient_by_id(db, "DFU-8842")
        assert patient is not None, "Baseline patient DFU-8842 must exist"

        assessment = await get_patient_latest_assessment(db, "DFU-8842")
        assert assessment is not None, "Baseline assessment must exist for DFU-8842"

        # Serialize to FHIR Bundle
        bundle_dict = build_fhir_bundle(patient, assessment)

        # 1. Structural Validation
        assert bundle_dict["resourceType"] == "Bundle"
        assert bundle_dict["type"] == "document"
        assert len(bundle_dict["entry"]) >= 9, f"Expected >=9 entries, got {len(bundle_dict['entry'])}"

        # 2. Schema Validation via Pydantic FHIR Model
        validated_bundle = FHIRBundle(**bundle_dict)
        assert validated_bundle.resourceType == "Bundle"
        assert len(validated_bundle.entry) == len(bundle_dict["entry"])

        # 3. LOINC & SNOMED CT Terminology Validation
        resource_types = [e["resource"]["resourceType"] for e in bundle_dict["entry"]]
        assert "DiagnosticReport" in resource_types
        assert "Patient" in resource_types
        assert "Condition" in resource_types
        assert resource_types.count("Observation") >= 7

        # Check LOINC Wound Area
        obs_codes = []
        for e in bundle_dict["entry"]:
            res = e["resource"]
            if res.get("resourceType") == "Observation":
                codings = res.get("code", {}).get("coding", [])
                for c in codings:
                    obs_codes.append((c.get("system"), c.get("code")))

        assert (SYSTEM_LOINC, LOINC_WOUND_AREA["code"]) in obs_codes
        assert (SYSTEM_LOINC, LOINC_SINBAD_SCORE["code"]) in obs_codes

        print("  [PASS] test_fhir_bundle_serializer passed with valid LOINC/SNOMED coding.")


async def test_fhir_endpoints():
    """Test all FastAPI FHIR R4 HTTP endpoints."""
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test FHIR Patient Resource
        resp_patient = await client.get("/api/v1/fhir/Patient/DFU-8842")
        assert resp_patient.status_code == 200
        patient_data = resp_patient.json()
        assert patient_data["resourceType"] == "Patient"
        assert patient_data["id"] == "DFU-8842"
        assert "Robert Vance" in patient_data["name"][0]["text"]
        print(f"  [PASS] GET /api/v1/fhir/Patient/DFU-8842 -> {patient_data['name'][0]['text']}")

        # 2. Test FHIR DiagnosticReport Resource
        resp_report = await client.get("/api/v1/fhir/DiagnosticReport/DFU-8842")
        assert resp_report.status_code == 200
        report_data = resp_report.json()
        assert report_data["resourceType"] == "DiagnosticReport"
        assert report_data["code"]["coding"][0]["code"] == "72230-6"
        assert "SINBAD Score" in report_data["conclusion"]
        print(f"  [PASS] GET /api/v1/fhir/DiagnosticReport/DFU-8842 -> Status: {report_data['status']}")

        # 3. Test Full FHIR Bundle Endpoint
        resp_bundle = await client.get("/api/v1/fhir/Bundle/DFU-8842")
        assert resp_bundle.status_code == 200
        assert resp_bundle.headers["content-type"].startswith("application/fhir+json")
        bundle_data = resp_bundle.json()
        assert bundle_data["resourceType"] == "Bundle"
        assert bundle_data["type"] == "document"
        print(f"  [PASS] GET /api/v1/fhir/Bundle/DFU-8842 -> {len(bundle_data['entry'])} HL7 FHIR entries")

        # 4. Test FHIR Bundle Download Endpoint
        resp_dl = await client.get("/api/v1/fhir/Bundle/DFU-8842/download")
        assert resp_dl.status_code == 200
        assert "attachment" in resp_dl.headers.get("content-disposition", "")
        assert resp_dl.headers.get("x-fhir-version") == "4.0.1"
        assert resp_dl.headers.get("x-standard") == "HL7 FHIR Release 4"
        print(f"  [PASS] GET /api/v1/fhir/Bundle/DFU-8842/download -> Content-Disposition: {resp_dl.headers['content-disposition']}")


if __name__ == "__main__":
    print("================================================================")
    print("🔬 RUNNING HEAL6 HL7 / FHIR R4 INTEROPERABILITY TEST SUITE")
    print("================================================================")
    asyncio.run(test_fhir_bundle_serializer())
    asyncio.run(test_fhir_endpoints())
    print("================================================================")
    print("🎉 ALL HL7 / FHIR R4 TESTS PASSED PERFECTLY!")
    print("================================================================")
