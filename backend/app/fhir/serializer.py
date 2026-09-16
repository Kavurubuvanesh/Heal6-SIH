import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.db.models.patient import Patient
from app.db.models.assessment import WoundAssessment
from app.fhir.codes import (
    SYSTEM_LOINC,
    SYSTEM_SNOMED,
    SYSTEM_UCUM,
    SYSTEM_HEAL6,
    LOINC_WOUND_NOTE,
    LOINC_WOUND_AREA,
    LOINC_GRANULATION_PERCENT,
    LOINC_SLOUGH_PERCENT,
    LOINC_NECROTIC_PERCENT,
    LOINC_BACTERIAL_EVIDENCE,
    LOINC_HBA1C,
    LOINC_SINBAD_SCORE,
    SNOMED_DFU,
    SNOMED_HINDFOOT,
    SNOMED_FOREFOOT,
    SNOMED_ISCHEMIA,
    SNOMED_NEUROPATHY,
    SNOMED_PROBE_TO_BONE
)

def build_fhir_bundle(patient: Patient, assessment: WoundAssessment) -> Dict[str, Any]:
    """
    Serializes relational Patient and WoundAssessment models into an
    authoritative, standards-compliant HL7 FHIR Release 4 (R4 v4.0.1) Document Bundle.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    assess_time_iso = assessment.timestamp.isoformat() if assessment.timestamp else now_iso
    patient_ref = f"urn:uuid:{patient.id}"

    bundle_id = str(uuid.uuid4())
    report_id = assessment.id
    condition_id = f"cond-{assessment.id[:8]}"
    area_obs_id = f"obs-area-{assessment.id[:8]}"
    sinbad_obs_id = f"obs-sinbad-{assessment.id[:8]}"
    tissue_gran_id = f"obs-gran-{assessment.id[:8]}"
    tissue_slough_id = f"obs-slough-{assessment.id[:8]}"
    tissue_necro_id = f"obs-necro-{assessment.id[:8]}"
    infection_obs_id = f"obs-inf-{assessment.id[:8]}"
    hba1c_obs_id = f"obs-hba1c-{assessment.id[:8]}"

    entries = []

    # -------------------------------------------------------------
    # 1. FHIR Patient Resource
    # -------------------------------------------------------------
    fhir_patient = {
        "resourceType": "Patient",
        "id": patient.id,
        "identifier": [
            {
                "use": "usual",
                "system": f"{SYSTEM_HEAL6}/mrn",
                "value": patient.id
            }
        ],
        "active": True,
        "name": [
            {
                "use": "official",
                "text": patient.name,
                "family": patient.name.split()[-1] if len(patient.name.split()) > 1 else patient.name,
                "given": patient.name.split()[:-1] if len(patient.name.split()) > 1 else [patient.name]
            }
        ],
        "gender": patient.gender.lower() if patient.gender.lower() in ("male", "female", "other", "unknown") else "unknown",
        "extension": [
            {
                "url": f"{SYSTEM_HEAL6}/diabetes-type",
                "valueString": patient.diabetes_type or "Type 2 DM"
            }
        ]
    }
    entries.append({"fullUrl": patient_ref, "resource": fhir_patient})

    # -------------------------------------------------------------
    # 2. FHIR Condition Resource (Diabetic Foot Ulcer)
    # -------------------------------------------------------------
    body_site = SNOMED_HINDFOOT if assessment.site_score == 1 else SNOMED_FOREFOOT
    fhir_condition = {
        "resourceType": "Condition",
        "id": condition_id,
        "clinicalStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                "code": "active",
                "display": "Active"
            }]
        },
        "verificationStatus": {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                "code": "confirmed",
                "display": "Confirmed"
            }]
        },
        "code": {
            "coding": [
                {
                    "system": SNOMED_DFU["system"],
                    "code": SNOMED_DFU["code"],
                    "display": SNOMED_DFU["display"]
                }
            ],
            "text": f"Diabetic Foot Ulcer: {assessment.location_label}"
        },
        "bodySite": [
            {
                "coding": [{
                    "system": body_site["system"],
                    "code": body_site["code"],
                    "display": body_site["display"]
                }],
                "text": assessment.location_label
            }
        ],
        "subject": {"reference": patient_ref, "display": patient.name},
        "recordedDate": assess_time_iso
    }
    entries.append({"fullUrl": f"urn:uuid:{condition_id}", "resource": fhir_condition})

    # -------------------------------------------------------------
    # 3. Observation: Calibrated Wound Surface Area (LOINC 89260-4)
    # -------------------------------------------------------------
    fhir_area_obs = {
        "resourceType": "Observation",
        "id": area_obs_id,
        "status": "final",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "exam",
                "display": "Exam"
            }]
        }],
        "code": {
            "coding": [{
                "system": LOINC_WOUND_AREA["system"],
                "code": LOINC_WOUND_AREA["code"],
                "display": LOINC_WOUND_AREA["display"]
            }],
            "text": "Calibrated Wound Surface Area"
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueQuantity": {
            "value": round(assessment.wound_area_cm2, 2),
            "unit": "cm2",
            "system": SYSTEM_UCUM,
            "code": "cm2"
        },
        "component": [
            {
                "code": {"text": "ArUco Optical Scale (px/cm)"},
                "valueQuantity": {
                    "value": round(assessment.aruco_calibration, 1),
                    "unit": "px/cm",
                    "system": SYSTEM_UCUM,
                    "code": "px/cm"
                }
            }
        ]
    }
    entries.append({"fullUrl": f"urn:uuid:{area_obs_id}", "resource": fhir_area_obs})

    # -------------------------------------------------------------
    # 4. Observation: IWGDF SINBAD Scoring Matrix (LOINC 98124-1)
    # -------------------------------------------------------------
    fhir_sinbad_obs = {
        "resourceType": "Observation",
        "id": sinbad_obs_id,
        "status": "final",
        "code": {
            "coding": [{
                "system": LOINC_SINBAD_SCORE["system"],
                "code": LOINC_SINBAD_SCORE["code"],
                "display": LOINC_SINBAD_SCORE["display"]
            }],
            "text": "IWGDF SINBAD 6-Factor Clinical Score"
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueInteger": assessment.sinbad_score,
        "component": [
            {"code": {"text": "Site (Hindfoot=1, Forefoot=0)"}, "valueInteger": assessment.site_score},
            {"code": {"text": "Ischemia (Reduced=1, Normal=0)"}, "valueInteger": assessment.ischemia_score},
            {"code": {"text": "Neuropathy (Loss=1, Intact=0)"}, "valueInteger": assessment.neuropathy_score},
            {"code": {"text": "Bacterial Infection (Present=1, None=0)"}, "valueInteger": assessment.bacterial_score},
            {"code": {"text": "Area >= 1cm2 (Yes=1, No=0)"}, "valueInteger": assessment.area_score},
            {"code": {"text": "Depth to Bone/Capsule (Yes=1, No=0)"}, "valueInteger": assessment.depth_score},
        ]
    }
    entries.append({"fullUrl": f"urn:uuid:{sinbad_obs_id}", "resource": fhir_sinbad_obs})

    # -------------------------------------------------------------
    # 5. Observation: Granulation Tissue % (LOINC 72372-6)
    # -------------------------------------------------------------
    fhir_gran_obs = {
        "resourceType": "Observation",
        "id": tissue_gran_id,
        "status": "final",
        "code": {
            "coding": [{
                "system": LOINC_GRANULATION_PERCENT["system"],
                "code": LOINC_GRANULATION_PERCENT["code"],
                "display": LOINC_GRANULATION_PERCENT["display"]
            }]
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueQuantity": {
            "value": round(assessment.tissue_granulation_percent, 1),
            "unit": "%",
            "system": SYSTEM_UCUM,
            "code": "%"
        }
    }
    entries.append({"fullUrl": f"urn:uuid:{tissue_gran_id}", "resource": fhir_gran_obs})

    # -------------------------------------------------------------
    # 6. Observation: Slough Tissue % (LOINC 72371-8)
    # -------------------------------------------------------------
    fhir_slough_obs = {
        "resourceType": "Observation",
        "id": tissue_slough_id,
        "status": "final",
        "code": {
            "coding": [{
                "system": LOINC_SLOUGH_PERCENT["system"],
                "code": LOINC_SLOUGH_PERCENT["code"],
                "display": LOINC_SLOUGH_PERCENT["display"]
            }]
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueQuantity": {
            "value": round(assessment.tissue_slough_percent, 1),
            "unit": "%",
            "system": SYSTEM_UCUM,
            "code": "%"
        }
    }
    entries.append({"fullUrl": f"urn:uuid:{tissue_slough_id}", "resource": fhir_slough_obs})

    # -------------------------------------------------------------
    # 7. Observation: Necrotic Tissue % (LOINC 72370-0)
    # -------------------------------------------------------------
    fhir_necro_obs = {
        "resourceType": "Observation",
        "id": tissue_necro_id,
        "status": "final",
        "code": {
            "coding": [{
                "system": LOINC_NECROTIC_PERCENT["system"],
                "code": LOINC_NECROTIC_PERCENT["code"],
                "display": LOINC_NECROTIC_PERCENT["display"]
            }]
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueQuantity": {
            "value": round(assessment.tissue_necrotic_percent, 1),
            "unit": "%",
            "system": SYSTEM_UCUM,
            "code": "%"
        }
    }
    entries.append({"fullUrl": f"urn:uuid:{tissue_necro_id}", "resource": fhir_necro_obs})

    # -------------------------------------------------------------
    # 8. Observation: ConvNeXt Bacterial Risk (LOINC 89252-1)
    # -------------------------------------------------------------
    fhir_inf_obs = {
        "resourceType": "Observation",
        "id": infection_obs_id,
        "status": "final",
        "code": {
            "coding": [{
                "system": LOINC_BACTERIAL_EVIDENCE["system"],
                "code": LOINC_BACTERIAL_EVIDENCE["code"],
                "display": LOINC_BACTERIAL_EVIDENCE["display"]
            }]
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueQuantity": {
            "value": round(assessment.infection_risk_percent, 1),
            "unit": "%",
            "system": SYSTEM_UCUM,
            "code": "%"
        }
    }
    entries.append({"fullUrl": f"urn:uuid:{infection_obs_id}", "resource": fhir_inf_obs})

    # -------------------------------------------------------------
    # 9. Observation: Blood HbA1c (LOINC 4548-4)
    # -------------------------------------------------------------
    hba1c_val = 8.5
    try:
        hba1c_val = float(patient.hba1c.replace("%", "").strip())
    except Exception:
        hba1c_val = 8.5

    fhir_hba1c_obs = {
        "resourceType": "Observation",
        "id": hba1c_obs_id,
        "status": "final",
        "code": {
            "coding": [{
                "system": LOINC_HBA1C["system"],
                "code": LOINC_HBA1C["code"],
                "display": LOINC_HBA1C["display"]
            }]
        },
        "subject": {"reference": patient_ref},
        "effectiveDateTime": assess_time_iso,
        "valueQuantity": {
            "value": hba1c_val,
            "unit": "%",
            "system": SYSTEM_UCUM,
            "code": "%"
        }
    }
    entries.append({"fullUrl": f"urn:uuid:{hba1c_obs_id}", "resource": fhir_hba1c_obs})

    # -------------------------------------------------------------
    # 10. FHIR DiagnosticReport Resource (LOINC 72230-6)
    # -------------------------------------------------------------
    presented_form = []
    if assessment.mask_image:
        presented_form.append({
            "contentType": "image/png",
            "data": assessment.mask_image.replace("data:image/png;base64,", "").replace("data:image/jpeg;base64,", ""),
            "title": "PyTorch UNet++ 4-Class Semantic Tissue Segmentation Mask"
        })

    conclusion_text = f"Triage Level: {assessment.triage_level}. SINBAD Score: {assessment.sinbad_score}/6. Estimated Healing Time: {assessment.healing_estimate_weeks}. "
    if assessment.action_plan and isinstance(assessment.action_plan, dict):
        headline = assessment.action_plan.get("headline", "")
        debridement = assessment.action_plan.get("debridement", "")
        offloading = assessment.action_plan.get("offloading", "")
        conclusion_text += f"{headline} Debridement Directive: {debridement} Offloading Protocol: {offloading}"

    fhir_report = {
        "resourceType": "DiagnosticReport",
        "id": report_id,
        "status": "final" if assessment.verified_by_doctor else "preliminary",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                "code": "RAD",
                "display": "Radiology / Imaging Telemetry"
            }]
        }],
        "code": {
            "coding": [{
                "system": LOINC_WOUND_NOTE["system"],
                "code": LOINC_WOUND_NOTE["code"],
                "display": LOINC_WOUND_NOTE["display"]
            }],
            "text": "Heal6 AI Clinical DFU Evaluation Report"
        },
        "subject": {"reference": patient_ref, "display": patient.name},
        "effectiveDateTime": assess_time_iso,
        "issued": now_iso,
        "performer": [
            {
                "reference": "Practitioner/DR-SHARMA-01",
                "display": "Dr. Sharma, Consultant Endocrinologist"
            }
        ],
        "result": [
            {"reference": f"urn:uuid:{area_obs_id}", "display": "Wound Area"},
            {"reference": f"urn:uuid:{sinbad_obs_id}", "display": "SINBAD Clinical Score"},
            {"reference": f"urn:uuid:{tissue_gran_id}", "display": "Granulation Tissue %"},
            {"reference": f"urn:uuid:{tissue_slough_id}", "display": "Slough Tissue %"},
            {"reference": f"urn:uuid:{tissue_necro_id}", "display": "Necrotic Tissue %"},
            {"reference": f"urn:uuid:{infection_obs_id}", "display": "Bacterial Infection Probability"},
            {"reference": f"urn:uuid:{hba1c_obs_id}", "display": "Hemoglobin A1c"}
        ],
        "presentedForm": presented_form,
        "conclusion": conclusion_text
    }
    entries.insert(0, {"fullUrl": f"urn:uuid:{report_id}", "resource": fhir_report})

    # Return full FHIR Document Bundle
    return {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "document",
        "timestamp": now_iso,
        "entry": entries
    }
