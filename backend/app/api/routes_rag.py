"""
Heal6 Clinical RAG Agent & IWGDF Scribe API Routes (Phase 9)
=============================================================
Endpoints:
1. POST /api/v1/rag/generate-scribe-note: Ingests patient telemetry, synthesizes EHR SOAP note with citations.
2. POST /api/v1/rag/query-guidelines: Physician Q&A chat endpoint querying IWGDF 2023 Guidelines.
3. GET /api/v1/rag/guideline-catalog: Returns full catalog of vectorized IWGDF evidence.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from app.ml_engine.clinical_rag import (
    generate_autonomous_clinical_note,
    query_clinical_guidelines_rag,
    IWGDF_GUIDELINES_CORPUS
)
from app.core.security import get_current_doctor, oauth2_scheme

router = APIRouter()

class ScribeNoteRequest(BaseModel):
    patient_id: Optional[str] = "DFU-SAMPLE"
    name: Optional[str] = "Walk-In Patient"
    age: Optional[int] = 60
    gender: Optional[str] = "Male"
    diabetesType: Optional[str] = "Type 2 DM (14 yrs)"
    hba1c: Optional[str] = "8.9%"
    locationLabel: Optional[str] = "Right Plantar Forefoot"
    calculatedSinbad: Optional[int] = 3
    siteScore: Optional[int] = 0
    ischemiaScore: Optional[int] = 0
    neuropathyScore: Optional[int] = 1
    depthScore: Optional[int] = 0
    woundAreaCm2: Optional[float] = 2.45
    infectionRiskPercent: Optional[float] = 75.0
    maxDepthMm: Optional[float] = 3.2
    meanDepthMm: Optional[float] = 1.8
    woundVolumeCm3: Optional[float] = 0.22
    arucoCalibration: Optional[float] = 42.0
    tissueBreakdown: Optional[Dict[str, float]] = None

class GuidelineQueryRequest(BaseModel):
    query: str
    patient_context: Optional[Dict[str, Any]] = None

@router.post("/generate-scribe-note", summary="Synthesize Autonomous IWGDF SOAP Clinical Note")
async def generate_scribe_note(payload: ScribeNoteRequest):
    """
    Ingests multimodal patient telemetry and generates an EHR-ready SOAP clinical progress note
    cross-referenced with IWGDF 2023 evidence-based guidelines.
    """
    try:
        patient_dict = payload.model_dump()
        # Remap snake_case / camelCase for clinical rag generator
        patient_dict["id"] = payload.patient_id
        note_report = generate_autonomous_clinical_note(patient_dict)
        return {
            "status": "success",
            "data": note_report
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical RAG Scribe Generation Error: {str(e)}"
        )

@router.post("/query-guidelines", summary="Physician IWGDF Guidelines Query Assistant")
async def query_guidelines(payload: GuidelineQueryRequest):
    """
    Direct physician semantic Q&A endpoint querying the IWGDF 2023 Guidelines corpus.
    """
    try:
        result = query_clinical_guidelines_rag(
            query=payload.query,
            patient_context=payload.patient_context
        )
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Guideline RAG Query Error: {str(e)}"
        )

@router.get("/guideline-catalog", summary="Get IWGDF 2023 Guidelines Catalog")
async def get_guideline_catalog():
    """
    Returns the complete structured index of authoritative IWGDF 2023 recommendations.
    """
    return {
        "edition": "IWGDF Guidelines on the Prevention and Management of Diabetic Foot Disease (2023 Update)",
        "total_recommendations": len(IWGDF_GUIDELINES_CORPUS),
        "guidelines": IWGDF_GUIDELINES_CORPUS
    }
