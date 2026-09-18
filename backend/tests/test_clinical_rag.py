"""
Unit and Integration Tests for Phase 9: Autonomous Clinical RAG Agent & IWGDF Scribe
=====================================================================================
Tests:
1. Retrieval of authoritative IWGDF 2023 evidence based on ulcer presentation.
2. Formulation of structured SOAP clinical chart documentation.
3. Citation validation and evidence grading.
4. Interactive physician guideline Q&A search.
5. FastAPI RAG endpoints.
"""

import pytest
import sys
from pathlib import Path

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.ml_engine.clinical_rag import (
    get_rag_retriever,
    generate_autonomous_clinical_note,
    query_clinical_guidelines_rag,
    IWGDF_GUIDELINES_CORPUS
)

client = TestClient(app)

def test_rag_corpus_integrity():
    assert len(IWGDF_GUIDELINES_CORPUS) >= 8
    for doc in IWGDF_GUIDELINES_CORPUS:
        assert "id" in doc
        assert "title" in doc
        assert "recommendation" in doc
        assert "grade" in doc
        assert "evidence" in doc
        assert "keywords" in doc
        assert doc["id"].startswith("IWGDF-2023-")

def test_vector_retriever_infection():
    retriever = get_rag_retriever()
    results = retriever.retrieve("bacterial infection erythema antibiotic", top_k=2)
    assert len(results) > 0
    top = results[0]
    assert "INF" in top["id"]
    assert top["relevance_score"] > 0.1

def test_vector_retriever_offloading():
    retriever = get_rag_retriever()
    results = retriever.retrieve("plantar pressure total contact casting offloading", top_k=2)
    assert len(results) > 0
    ids = [r["id"] for r in results]
    assert any("OFF" in rid for rid in ids)

def test_autonomous_soap_note_generation():
    patient_sample = {
        "id": "DFU-8842",
        "name": "Robert Vance",
        "age": 61,
        "gender": "Male",
        "diabetesType": "Type 2 DM (14 yrs)",
        "hba1c": "9.2%",
        "locationLabel": "Right Plantar Hindfoot",
        "calculatedSinbad": 4,
        "siteScore": 1,
        "ischemiaScore": 1,
        "neuropathyScore": 1,
        "depthScore": 1,
        "woundAreaCm2": 2.45,
        "infectionRiskPercent": 78.4,
        "maxDepthMm": 5.8,
        "meanDepthMm": 3.6,
        "woundVolumeCm3": 0.38,
        "arucoCalibration": 42.0,
        "tissueBreakdown": {"granulation": 45, "slough": 35, "necrotic": 20}
    }

    note = generate_autonomous_clinical_note(patient_sample)
    
    assert "report_id" in note
    assert "soap_note" in note
    soap = note["soap_note"]
    assert "subjective" in soap and len(soap["subjective"]) > 50
    assert "objective" in soap and "2.45 cm²" in soap["objective"]
    assert "assessment" in soap and "SINBAD" in soap["assessment"]
    assert "plan" in soap and "IWGDF" in soap["plan"]
    
    assert "guideline_citations" in note
    assert len(note["guideline_citations"]) > 0
    assert "prescribed_orders" in note
    assert "patient_instructions" in note

def test_guideline_qa_assistant():
    res = query_clinical_guidelines_rag("What offloading is recommended for plantar neuropathic ulcer?")
    assert "answer" in res
    assert "citations" in res
    assert len(res["citations"]) > 0
    assert "IWGDF" in res["answer"]

def test_api_generate_scribe_note():
    payload = {
        "patient_id": "DFU-TEST-99",
        "name": "Carlos Gomez",
        "age": 58,
        "woundAreaCm2": 3.1,
        "calculatedSinbad": 5,
        "depthScore": 1,
        "infectionRiskPercent": 82.0
    }
    response = client.post("/api/v1/rag/generate-scribe-note", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "soap_note" in data["data"]
    assert "guideline_citations" in data["data"]

def test_api_query_guidelines():
    response = client.post(
        "/api/v1/rag/query-guidelines",
        json={"query": "when is sharp debridement indicated for slough?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "debridement" in data["data"]["answer"].lower()

def test_api_guideline_catalog():
    response = client.get("/api/v1/rag/guideline-catalog")
    assert response.status_code == 200
    data = response.json()
    assert data["total_recommendations"] >= 8


if __name__ == "__main__":
    print("Running Clinical RAG Agent & IWGDF Scribe Tests...")
    test_rag_corpus_integrity()
    print("[PASS] IWGDF Corpus Integrity")
    test_vector_retriever_infection()
    print("[PASS] Vector Semantic Retriever (Infection)")
    test_vector_retriever_offloading()
    print("[PASS] Vector Semantic Retriever (Offloading)")
    test_autonomous_soap_note_generation()
    print("[PASS] Autonomous SOAP Note Formulation")
    test_guideline_qa_assistant()
    print("[PASS] Interactive Guideline Q&A")
    test_api_generate_scribe_note()
    print("[PASS] API /generate-scribe-note")
    test_api_query_guidelines()
    print("[PASS] API /query-guidelines")
    test_api_guideline_catalog()
    print("[PASS] API /guideline-catalog")
    print("ALL CLINICAL RAG SCRIBE TESTS PASSED!")
