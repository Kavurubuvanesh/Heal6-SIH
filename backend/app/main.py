from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI(title="Heal6 Clinical Diagnostic API", version="1.0.0")

# 1. Enable CORS for the Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. The Main Integration Endpoint
@app.post("/api/v1/sinbad/analyze-wound")
async def analyze_wound(
        file: UploadFile = File(...),
        is_deep: str = Form("false"),
        has_ischemia: str = Form("false"),
        has_neuropathy: str = Form("false"),
        is_hindfoot: str = Form("false")
):
    # Convert string booleans from JavaScript FormData
    is_deep_bool = is_deep.lower() == "true"
    has_ischemia_bool = has_ischemia.lower() == "true"
    has_neuropathy_bool = has_neuropathy.lower() == "true"
    is_hindfoot_bool = is_hindfoot.lower() == "true"

    # --- AI INFERENCE ENGINE ---
    # (We are temporarily mocking the U-Net area calculation for the UI test)
    calculated_area = round(random.uniform(0.5, 5.5), 1)

    # --- SINBAD SCORING LOGIC ---
    score = 0
    if is_deep_bool: score += 1
    if has_ischemia_bool: score += 1
    if has_neuropathy_bool: score += 1
    if is_hindfoot_bool: score += 1
    if calculated_area > 1.0: score += 1

    # If it's deep, we assume infection for the hackathon logic
    if is_deep_bool: score += 1

    # Cap score at 6
    score = min(score, 6)

    # --- CLINICAL DECISION SUPPORT ---
    if score >= 4:
        tier = "High Risk / Critical"
        rec = "Immediate Surgical Debridement & Antibiotics"
        infection_class = "Positive (Severe)"
    elif score >= 2:
        tier = "Moderate Risk"
        rec = "Specialist Offloading & Close Monitoring"
        infection_class = "Positive (Mild)"
    else:
        tier = "Low Risk"
        rec = "Routine Wound Care & Standard Offloading"
        infection_class = "Negative (Clean)"

    # 3. Return the JSON Payload
    return {
        "sinbad_score": score,
        "severity_tier": tier,
        "ai_diagnostics": {
            "calculated_area_cm2": calculated_area,
            "task1_classification": infection_class
        },
        "clinical_recommendation": rec
    }