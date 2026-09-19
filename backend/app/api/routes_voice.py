"""
Routes for Autonomous Multilingual Voice Telemetry
Phase 12: Agentic AI Voice Engine
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.ml_engine.voice_agent import clinical_voice_agent
from app.core.event_bus import event_bus

router = APIRouter(prefix="/api/v1/voice", tags=["Voice Telemetry"])

class CallSimulationRequest(BaseModel):
    patient_id: str = Field(..., example="PT-8841")
    patient_name: str = Field(..., example="Ramesh Patel")
    language: str = Field("hi", description="Language code: hi, mr, or, bn, ta, en")
    sinbad_score: int = Field(4, ge=0, le=6)
    scenario: str = Field("infection_spike", description="infection_spike or stable")

class DirectSpeechAnalysisRequest(BaseModel):
    patient_id: str = Field(..., example="PT-8841")
    transcript: str = Field(..., example="मुझे पैर में तेज दर्द और बुखार लग रहा है")
    language: str = Field("hi")
    sinbad_score: int = Field(3, ge=0, le=6)

@router.post("/simulate-call")
async def simulate_outbound_call(request: CallSimulationRequest, background_tasks: BackgroundTasks):
    """
    Executes an outbound agentic voice consultation in chosen regional language,
    analyzes patient verbal responses, generates FHIR resources, and emits real-time alert.
    """
    try:
        call_record = clinical_voice_agent.simulate_call(
            patient_id=request.patient_id,
            patient_name=request.patient_name,
            language=request.language,
            sinbad_score=request.sinbad_score,
            scenario=request.scenario
        )

        # Broadcast critical alert over WebSocket if infection or high distress is flagged
        if call_record["analysis"]["urgency"] in ["HIGH", "CRITICAL"]:
            alert_payload = {
                "type": "VOICE_TELEMETRY_ALERT",
                "patient_id": request.patient_id,
                "patient_name": request.patient_name,
                "urgency": call_record["analysis"]["urgency"],
                "triage_level": call_record["analysis"]["triage_level"],
                "symptoms": call_record["analysis"]["detected_symptoms"],
                "distress_score": call_record["analysis"]["distress_score"],
                "timestamp": call_record["timestamp"]
            }
            background_tasks.add_task(event_bus.publish, "clinical_events", alert_payload)

        return {
            "success": True,
            "call_record": call_record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice call simulation error: {str(e)}")

@router.post("/analyze-speech")
async def analyze_speech(request: DirectSpeechAnalysisRequest):
    """
    Analyzes raw transcribed speech for distress, throbbing pain, and infection indicators.
    """
    analysis = clinical_voice_agent.analyze_patient_speech(
        transcript_text=request.transcript,
        language=request.language,
        sinbad_score=request.sinbad_score
    )
    fhir_data = clinical_voice_agent.generate_fhir_telemetry_resources(
        patient_id=request.patient_id,
        analysis=analysis
    )
    return {
        "analysis": analysis,
        "fhir_telemetry": fhir_data
    }

@router.get("/logs")
async def get_call_logs():
    """Returns recent voice telemetry calls and transcript histories"""
    return {
        "total_calls": len(clinical_voice_agent.call_history),
        "calls": clinical_voice_agent.call_history[:20]
    }

@router.get("/scripts/{language}")
async def get_scripts_for_language(language: str = "en"):
    """Fetches prompt trees and clinical queries for target regional language"""
    script = clinical_voice_agent.get_prompt_script(language=language)
    return {
        "language": language,
        "script": script
    }
