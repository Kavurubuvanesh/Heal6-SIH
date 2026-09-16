from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class FHIRCoding(BaseModel):
    system: str
    code: str
    display: Optional[str] = None

class FHIRCodeableConcept(BaseModel):
    coding: List[FHIRCoding]
    text: Optional[str] = None

class FHIRQuantity(BaseModel):
    value: float
    unit: str
    system: str = "http://unitsofmeasure.org"
    code: str

class FHIRReference(BaseModel):
    reference: str
    display: Optional[str] = None

class FHIRAttachment(BaseModel):
    contentType: str
    data: Optional[str] = None
    title: Optional[str] = None

class FHIRObservationComponent(BaseModel):
    code: FHIRCodeableConcept
    valueInteger: Optional[int] = None
    valueQuantity: Optional[FHIRQuantity] = None
    valueString: Optional[str] = None

class FHIRObservation(BaseModel):
    resourceType: str = "Observation"
    id: str
    status: str = "final"
    category: Optional[List[FHIRCodeableConcept]] = None
    code: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime: Optional[str] = None
    valueQuantity: Optional[FHIRQuantity] = None
    valueInteger: Optional[int] = None
    valueString: Optional[str] = None
    component: Optional[List[FHIRObservationComponent]] = None

class FHIRCondition(BaseModel):
    resourceType: str = "Condition"
    id: str
    clinicalStatus: FHIRCodeableConcept
    verificationStatus: FHIRCodeableConcept
    code: FHIRCodeableConcept
    bodySite: Optional[List[FHIRCodeableConcept]] = None
    subject: FHIRReference
    recordedDate: Optional[str] = None

class FHIRPatient(BaseModel):
    resourceType: str = "Patient"
    id: str
    identifier: List[Dict[str, Any]]
    active: bool = True
    name: List[Dict[str, Any]]
    gender: str
    extension: Optional[List[Dict[str, Any]]] = None

class FHIRDiagnosticReport(BaseModel):
    resourceType: str = "DiagnosticReport"
    id: str
    status: str = "final"
    category: Optional[List[FHIRCodeableConcept]] = None
    code: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime: str
    issued: str
    performer: Optional[List[FHIRReference]] = None
    result: List[FHIRReference]
    presentedForm: Optional[List[FHIRAttachment]] = None
    conclusion: Optional[str] = None

class FHIRBundleEntry(BaseModel):
    fullUrl: str
    resource: Dict[str, Any]

class FHIRBundle(BaseModel):
    resourceType: str = "Bundle"
    id: str
    type: str = "document"
    timestamp: str
    entry: List[FHIRBundleEntry]
