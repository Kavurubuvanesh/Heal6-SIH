"""
Standardized Medical Terminology & Coding Systems for Heal6 DFU Platform.
Compliant with HL7 FHIR R4 (v4.0.1), LOINC, SNOMED CT, and UCUM.
"""

# Terminology Systems URIs
SYSTEM_LOINC = "http://loinc.org"
SYSTEM_SNOMED = "http://snomed.info/sct"
SYSTEM_UCUM = "http://unitsofmeasure.org"
SYSTEM_ICD10 = "http://hl7.org/fhir/sid/icd-10"
SYSTEM_HEAL6 = "https://heal6.health/identifiers"

# LOINC Standard Observations
LOINC_WOUND_NOTE = {
    "system": SYSTEM_LOINC,
    "code": "72230-6",
    "display": "Wound assessment and evaluation note"
}

LOINC_WOUND_AREA = {
    "system": SYSTEM_LOINC,
    "code": "89260-4",
    "display": "Area of wound"
}

LOINC_GRANULATION_PERCENT = {
    "system": SYSTEM_LOINC,
    "code": "72372-6",
    "display": "Granulation tissue % in wound bed"
}

LOINC_SLOUGH_PERCENT = {
    "system": SYSTEM_LOINC,
    "code": "72371-8",
    "display": "Slough tissue % in wound bed"
}

LOINC_NECROTIC_PERCENT = {
    "system": SYSTEM_LOINC,
    "code": "72370-0",
    "display": "Necrotic tissue % in wound bed"
}

LOINC_BACTERIAL_EVIDENCE = {
    "system": SYSTEM_LOINC,
    "code": "89252-1",
    "display": "Evidence of bacterial infection in wound"
}

LOINC_HBA1C = {
    "system": SYSTEM_LOINC,
    "code": "4548-4",
    "display": "Hemoglobin A1c/Hemoglobin.total in Blood"
}

LOINC_SINBAD_SCORE = {
    "system": SYSTEM_LOINC,
    "code": "98124-1",
    "display": "Diabetic foot ulcer SINBAD clinical scoring system total"
}

# SNOMED CT Diagnostic & Anatomical Concepts
SNOMED_DFU = {
    "system": SYSTEM_SNOMED,
    "code": "280137004",
    "display": "Diabetic foot ulcer"
}

SNOMED_HINDFOOT = {
    "system": SYSTEM_SNOMED,
    "code": "76505004",
    "display": "Structure of hindfoot"
}

SNOMED_FOREFOOT = {
    "system": SYSTEM_SNOMED,
    "code": "362846001",
    "display": "Structure of forefoot"
}

SNOMED_ISCHEMIA = {
    "system": SYSTEM_SNOMED,
    "code": "18155000",
    "display": "Peripheral arterial ischemia"
}

SNOMED_NEUROPATHY = {
    "system": SYSTEM_SNOMED,
    "code": "84628003",
    "display": "Diabetic peripheral neuropathy"
}

SNOMED_PROBE_TO_BONE = {
    "system": SYSTEM_SNOMED,
    "code": "426177001",
    "display": "Ulcer probing to bone"
}
