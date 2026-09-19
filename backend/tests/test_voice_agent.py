"""
Automated Unit Tests for Autonomous Multilingual Voice Telemetry (Phase 12)
"""

import pytest
from app.ml_engine.voice_agent import clinical_voice_agent

def test_prompt_script_multilingual():
    """Verify script bank returns correct regional translations"""
    hi_script = clinical_voice_agent.get_prompt_script("hi", "Ramesh")
    assert "Ramesh" in hi_script["greeting"]
    assert "पैर" in hi_script["question_pain_fever"]

    mr_script = clinical_voice_agent.get_prompt_script("mr", "Sunita")
    assert "Sunita" in mr_script["greeting"]
    assert "ठसठस" in mr_script["question_pain_fever"]

    en_script = clinical_voice_agent.get_prompt_script("en", "John")
    assert "throbbing pain" in en_script["question_pain_fever"]

def test_speech_nlp_distress_extraction():
    """Verify NLP correctly flags fever, throbbing pain, and high distress"""
    speech_text = "Doctor, I have severe throbbing pain since night and high fever with chills."
    analysis = clinical_voice_agent.analyze_patient_speech(speech_text, language="en", sinbad_score=4)

    assert "fever" in analysis["detected_symptoms"]
    assert "throbbing_pain" in analysis["detected_symptoms"]
    assert analysis["distress_score"] >= 0.65
    assert analysis["urgency"] in ["HIGH", "CRITICAL"]
    assert analysis["requires_physician_callback"] is True

def test_fhir_resource_generation():
    """Verify valid HL7 FHIR Condition and Observation structures are built"""
    analysis = {
        "transcript": "Severe throbbing pain and fever",
        "detected_symptoms": ["fever", "throbbing_pain"],
        "distress_score": 0.85,
        "urgency": "CRITICAL",
        "triage_level": "EMERGENCY_SEPSIS_ALERT"
    }
    fhir_data = clinical_voice_agent.generate_fhir_telemetry_resources("PT-9901", analysis)

    assert fhir_data["observation"]["resourceType"] == "Observation"
    assert fhir_data["observation"]["code"]["coding"][0]["code"] == "80352-8"
    assert fhir_data["condition"] is not None
    assert fhir_data["condition"]["resourceType"] == "Condition"
    assert fhir_data["condition"]["code"]["coding"][0]["code"] == "128045006"

def test_simulated_call_end_to_end():
    """Verify complete simulated call returns dialogue and telemetry"""
    call_record = clinical_voice_agent.simulate_call(
        patient_id="PT-1234",
        patient_name="Aarav Sharma",
        language="hi",
        sinbad_score=5,
        scenario="infection_spike"
    )

    assert call_record["patient_id"] == "PT-1234"
    assert len(call_record["dialogue"]) == 4
    assert call_record["analysis"]["urgency"] in ["HIGH", "CRITICAL"]
    assert "observation" in call_record["fhir_telemetry"]
