from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# ---------------------------------------------------------
# IN-MEMORY DATABASE: Pre-populated with baseline telemetry
# ---------------------------------------------------------
triage_queue = [
    {
        "id": "DFU-8842",
        "name": "Robert Vance",
        "age": 61,
        "gender": "Male",
        "diabetesType": "Type 2 DM (14 yrs)",
        "hba1c": "9.2%",
        "locationLabel": "Right Plantar Hindfoot / Heel",
        "siteScore": 1, # Hindfoot
        "ischemiaScore": 1, # Reduced pulses
        "neuropathyScore": 1, # Loss of sensation
        "depthScore": 1, # Deep tissue
        "calculatedSinbad": 4, 
        "woundAreaCm2": 2.45,
        "arucoCalibration": 42,
        "infectionRiskPercent": 78.4,
        "convnextConfidence": 62.0,
        "tissueBreakdown": {
            "granulation": 45,
            "slough": 35,
            "necrotic": 20,
        },
        "healingEstimateWeeks": "12 - 16 Weeks",
        "triageLevel": "URGENT TRIAGE",
        "triageColor": "#f43f5e",
        "triageBg": "#fff1f2",
        "radarData": [
            { "axis": "Site (Hindfoot)", "value": 100, "label": "Hindfoot (1)" },
            { "axis": "Ischemia", "value": 100, "label": "Reduced (1)" },
            { "axis": "Neuropathy", "value": 100, "label": "Present (1)" },
            { "axis": "Bacterial Load", "value": 85, "label": "High (1)" },
            { "axis": "Area (≥1cm²)", "value": 90, "label": "2.45cm² (1)" },
            { "axis": "Depth (Bone/Fascia)", "value": 100, "label": "Deep (1)" },
        ],
        "trajectoryData": [
            { "week": "W0 (Today)", "actual": 2.45, "projectedStandard": 2.45, "projectedMulti": 2.45 },
            { "week": "W2", "projectedStandard": 2.30, "projectedMulti": 1.95 },
            { "week": "W4", "projectedStandard": 2.10, "projectedMulti": 1.40 },
            { "week": "W6", "projectedStandard": 1.85, "projectedMulti": 0.90 },
            { "week": "W8", "projectedStandard": 1.55, "projectedMulti": 0.45 },
            { "week": "W10", "projectedStandard": 1.20, "projectedMulti": 0.15 },
            { "week": "W12", "projectedStandard": 0.90, "projectedMulti": 0.00 },
        ],
        "actionPlan": {
            "headline": "Standard wound care, multidisciplinary intervention.",
            "debridement": "Sharp mechanical debridement of slough margin required.",
            "offloading": "Immediate non-weight bearing Total Contact Casting (TCC) or Pneumatic Walker.",
            "dressing": "Hydrofiber silver antimicrobials with alginate barrier changed q48h.",
            "consultation": "Urgent Vascular Surgery Consult for ABI/Duplex Angiography within 24-48 hours."
        }
    },
    {
        "id": "DFU-5104",
        "name": "Elena Rostova",
        "age": 54,
        "gender": "Female",
        "diabetesType": "Type 1 DM (22 yrs)",
        "hba1c": "8.4%",
        "locationLabel": "Left 1st Metatarsal Head (Forefoot)",
        "siteScore": 0, # Forefoot
        "ischemiaScore": 0, # Palpable pulses intact
        "neuropathyScore": 1, # Severe sensory neuropathy
        "depthScore": 0, # Superficial dermis
        "calculatedSinbad": 2, 
        "woundAreaCm2": 1.20,
        "arucoCalibration": 42,
        "infectionRiskPercent": 34.2,
        "convnextConfidence": 89.5,
        "tissueBreakdown": {
            "granulation": 75,
            "slough": 20,
            "necrotic": 5,
        },
        "healingEstimateWeeks": "6 - 8 Weeks",
        "triageLevel": "MODERATE RISK",
        "triageColor": "#f59e0b",
        "triageBg": "#fffbeb",
        "radarData": [
            { "axis": "Site (Forefoot)", "value": 20, "label": "Forefoot (0)" },
            { "axis": "Ischemia", "value": 10, "label": "Intact (0)" },
            { "axis": "Neuropathy", "value": 100, "label": "Present (1)" },
            { "axis": "Bacterial Load", "value": 30, "label": "Mild (0)" },
            { "axis": "Area (≥1cm²)", "value": 65, "label": "1.20cm² (1)" },
            { "axis": "Depth (Superficial)", "value": 20, "label": "Superficial (0)" },
        ],
        "trajectoryData": [
            { "week": "W0 (Today)", "actual": 1.20, "projectedStandard": 1.20, "projectedMulti": 1.20 },
            { "week": "W2", "projectedStandard": 1.05, "projectedMulti": 0.85 },
            { "week": "W4", "projectedStandard": 0.80, "projectedMulti": 0.40 },
            { "week": "W6", "projectedStandard": 0.45, "projectedMulti": 0.10 },
            { "week": "W8", "projectedStandard": 0.15, "projectedMulti": 0.00 },
        ],
        "actionPlan": {
            "headline": "Outpatient podiatric wound management & offloading footwear.",
            "debridement": "Callus and hyperkeratotic rim reduction.",
            "offloading": "Custom molded neuropathic orthotics with metatarsal relief.",
            "dressing": "Collagen matrix dressing with secondary polyurethane foam.",
            "consultation": "Routine 2-week podiatry follow-up."
        }
    },
    {
        "id": "DFU-9311",
        "name": "Arthur Pendelton",
        "age": 72,
        "gender": "Male",
        "diabetesType": "Type 2 DM (28 yrs)",
        "hba1c": "10.8%",
        "locationLabel": "Left Midfoot Charcot Joint Collapse",
        "siteScore": 1, 
        "ischemiaScore": 1, 
        "neuropathyScore": 1, 
        "depthScore": 1, 
        "calculatedSinbad": 6,
        "woundAreaCm2": 4.80,
        "arucoCalibration": 42,
        "infectionRiskPercent": 94.6,
        "convnextConfidence": 96.2,
        "tissueBreakdown": {
            "granulation": 20,
            "slough": 45,
            "necrotic": 35,
        },
        "healingEstimateWeeks": "20 - 28 Weeks (High Amputation Risk)",
        "triageLevel": "CRITICAL SURGICAL EMERGENCY",
        "triageColor": "#f43f5e",
        "triageBg": "#fff1f2",
        "radarData": [
            { "axis": "Site (Midfoot)", "value": 100, "label": "Midfoot (1)" },
            { "axis": "Ischemia", "value": 100, "label": "Severe (1)" },
            { "axis": "Neuropathy", "value": 100, "label": "Dense (1)" },
            { "axis": "Bacterial Load", "value": 100, "label": "Systemic (1)" },
            { "axis": "Area (≥1cm²)", "value": 100, "label": "4.80cm² (1)" },
            { "axis": "Depth (Probe-to-Bone)", "value": 100, "label": "Bone (1)" },
        ],
        "trajectoryData": [
            { "week": "W0 (Today)", "actual": 4.80, "projectedStandard": 4.80, "projectedMulti": 4.80 },
            { "week": "W2", "projectedStandard": 4.60, "projectedMulti": 3.80 },
            { "week": "W4", "projectedStandard": 4.30, "projectedMulti": 2.70 },
            { "week": "W6", "projectedStandard": 3.90, "projectedMulti": 1.80 },
            { "week": "W8", "projectedStandard": 3.40, "projectedMulti": 1.10 },
            { "week": "W10", "projectedStandard": 2.80, "projectedMulti": 0.50 },
            { "week": "W12", "projectedStandard": 2.20, "projectedMulti": 0.10 },
        ],
        "actionPlan": {
            "headline": "Urgent limb salvage protocol & immediate hospital admission.",
            "debridement": "Operative debridement & deep tissue bone cultures.",
            "offloading": "Strict non-weight bearing immobilization (bivalved TCC).",
            "dressing": "Negative Pressure Wound Therapy (NPWT / VAC) post-op.",
            "consultation": "Emergency Vascular Surgery + Orthopedic Foot & Ankle consult."
        }
    }
]


# ---------------------------------------------------------
# PYDANTIC MODELS
# ---------------------------------------------------------
class VerificationPayload(BaseModel):
    finalScore: int
    verifiedIschemia: bool
    verifiedDepth: bool
    doctorNotes: Optional[str] = None


class ReverifyPayload(BaseModel):
    patientNotes: Optional[str] = None


def add_or_update_patient_in_queue(patient_data: dict) -> dict:
    """
    Inserts or updates a patient in the triage queue.
    If the patient ID already exists, it updates their record.
    Otherwise, it prepends the new patient so they appear at the top of the queue.
    """
    global triage_queue
    p_id = patient_data.get("id")
    for i, p in enumerate(triage_queue):
        if p["id"] == p_id:
            triage_queue[i] = {**p, **patient_data}
            return triage_queue[i]
    triage_queue.insert(0, patient_data)
    return patient_data


# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------
@router.get("/queue", summary="Fetch active patient triage queue")
async def get_patient_queue():
    """Returns the current list of patients awaiting physician review."""
    return triage_queue


@router.get("/{patient_id}", summary="Get specific patient telemetry by ID")
async def get_patient_by_id(patient_id: str):
    """Returns telemetry data for a specific patient."""
    for p in triage_queue:
        if p["id"] == patient_id:
            return p
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient {patient_id} not found.")


@router.post("/intake", summary="Add or update a patient in the triage queue")
async def intake_patient(patient_data: dict):
    """Directly inserts/updates patient clinical case into the triage queue."""
    updated = add_or_update_patient_in_queue(patient_data)
    return {"status": "success", "patient": updated}


@router.post("/{patient_id}/reverify", summary="Patient Requests Manual Physician Re-verification")
async def request_patient_reverify(patient_id: str, payload: ReverifyPayload):
    """
    Flags the patient in the triage queue as requesting manual physician re-verification
    and attaches any additional patient clinical notes.
    """
    global triage_queue
    for p in triage_queue:
        if p["id"] == patient_id:
            p["reverificationRequested"] = True
            p["patientNotes"] = payload.patientNotes
            p["triageLevel"] = "MANUAL RE-VERIFY REQUESTED"
            p["triageColor"] = "#e11d48"
            return {
                "status": "success",
                "message": f"Patient {patient_id} flagged for physician re-verification.",
                "patient": p
            }
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")


@router.post("/{patient_id}/verify", summary="Physician Sign-Off & Execute Directive")
async def verify_patient_report(patient_id: str, payload: VerificationPayload):
    """
    Accepts final physician validation of AI parameters and marks the patient
    as verified in the active triage queue, simulating HIS dispatch.
    """
    global triage_queue
    patient_exists = any(p["id"] == patient_id for p in triage_queue)

    if not patient_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found in active queue.")

    # Mark as verified and store doctor sign-off details
    for p in triage_queue:
        if p["id"] == patient_id:
            p["verifiedByDoctor"] = True
            p["doctorVerificationNotes"] = payload.doctorNotes
            p["finalVerifiedScore"] = payload.finalScore

    # Keep in queue with verified status or remove based on filter
    triage_queue = [p for p in triage_queue if p["id"] != patient_id]

    return {
        "status": "success",
        "message": f"Report for {patient_id} verified and dispatched to Central Registry.",
        "verified_data": payload.dict()
    }