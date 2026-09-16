"""
HL7 / FHIR R4 (Release 4, v4.0.1) Clinical Interoperability API Routes.
Provides standardized, LOINC / SNOMED CT coded healthcare exchange endpoints for Heal6 DFU telemetry.
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud.crud_patient import get_patient_by_id
from app.crud.crud_assessment import get_assessment_by_id, get_patient_latest_assessment
from app.fhir.serializer import build_fhir_bundle
from app.fhir.codes import SYSTEM_HEAL6

router = APIRouter()

async def _resolve_assessment_and_patient(identifier: str, db: AsyncSession):
    """
    Helper to resolve (patient, assessment) either by assessment_id or patient_id.
    """
    # 1. Try finding by assessment ID directly
    assessment = await get_assessment_by_id(db, identifier)
    if assessment and assessment.patient:
        return assessment.patient, assessment

    # 2. Try finding patient and getting their latest assessment
    patient = await get_patient_by_id(db, identifier)
    if patient:
        assessment = await get_patient_latest_assessment(db, identifier)
        if assessment:
            return patient, assessment
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{identifier}' found, but no wound assessments have been recorded yet."
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"No clinical record found for assessment or patient identifier '{identifier}'."
    )


@router.get("/Patient/{patient_id}", summary="Get HL7 FHIR R4 Patient Resource")
async def get_fhir_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns an HL7 FHIR R4 compliant Patient resource with demographic extensions
    and MRN identifiers.
    """
    patient = await get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found in registry."
        )

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
        "active": not patient.is_archived,
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
            },
            {
                "url": f"{SYSTEM_HEAL6}/hba1c",
                "valueString": patient.hba1c or "8.5%"
            }
        ]
    }
    return JSONResponse(
        content=fhir_patient,
        media_type="application/fhir+json"
    )


@router.get("/DiagnosticReport/{identifier}", summary="Get HL7 FHIR R4 DiagnosticReport Resource")
async def get_fhir_diagnostic_report(identifier: str, db: AsyncSession = Depends(get_db)):
    """
    Returns an HL7 FHIR R4 DiagnosticReport resource (LOINC 72230-6: Wound note)
    for the specified assessment or latest patient assessment.
    """
    patient, assessment = await _resolve_assessment_and_patient(identifier, db)
    bundle = build_fhir_bundle(patient, assessment)

    # Find the DiagnosticReport inside the bundle
    for entry in bundle.get("entry", []):
        resource = entry.get("resource", {})
        if resource.get("resourceType") == "DiagnosticReport":
            return JSONResponse(
                content=resource,
                media_type="application/fhir+json"
            )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="DiagnosticReport resource could not be extracted from the synthesized bundle."
    )


@router.get("/Bundle/{identifier}", summary="Get complete HL7 FHIR R4 Document Bundle")
async def get_fhir_bundle(identifier: str, db: AsyncSession = Depends(get_db)):
    """
    Returns a complete, authoritative HL7 FHIR R4 Document Bundle containing:
    - DiagnosticReport (LOINC 72230-6)
    - Patient Demographics
    - Condition (SNOMED CT 280137004: Diabetic Foot Ulcer)
    - Observations:
      * Wound Surface Area (LOINC 89260-4 with UCUM cm2)
      * IWGDF SINBAD Scoring Matrix (LOINC 98124-1)
      * Granulation Tissue % (LOINC 72372-6)
      * Slough Tissue % (LOINC 72371-8)
      * Necrotic Tissue % (LOINC 72370-0)
      * Bacterial Risk % (LOINC 89252-1)
      * HbA1c (LOINC 4548-4)
    """
    patient, assessment = await _resolve_assessment_and_patient(identifier, db)
    bundle = build_fhir_bundle(patient, assessment)
    return JSONResponse(
        content=bundle,
        media_type="application/fhir+json"
    )


@router.get("/Bundle/{identifier}/download", summary="Download FHIR R4 Document Bundle as JSON file")
async def download_fhir_bundle(identifier: str, db: AsyncSession = Depends(get_db)):
    """
    Streams the FHIR R4 Document Bundle as a downloadable JSON file for seamless
    EHR import (Epic, Cerner, Allscripts, OpenEMR).
    """
    patient, assessment = await _resolve_assessment_and_patient(identifier, db)
    bundle = build_fhir_bundle(patient, assessment)
    payload = json.dumps(bundle, indent=2)

    filename = f"Heal6_FHIR_R4_{patient.id}_{assessment.id[:8]}.json"
    return Response(
        content=payload,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-FHIR-Version": "4.0.1",
            "X-Standard": "HL7 FHIR Release 4"
        }
    )
