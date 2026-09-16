import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class WoundAssessment(Base):
    __tablename__ = "wound_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(32), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    location_label: Mapped[str] = mapped_column(String(128), default="Right Plantar Hindfoot / Heel")

    # Authoritative IWGDF SINBAD 6-Factor Sub-Scores (0 or 1)
    site_score: Mapped[int] = mapped_column(Integer, default=0)
    ischemia_score: Mapped[int] = mapped_column(Integer, default=0)
    neuropathy_score: Mapped[int] = mapped_column(Integer, default=0)
    bacterial_score: Mapped[int] = mapped_column(Integer, default=0)
    area_score: Mapped[int] = mapped_column(Integer, default=0)
    depth_score: Mapped[int] = mapped_column(Integer, default=0)
    sinbad_score: Mapped[int] = mapped_column(Integer, default=0, index=True)

    # Computer Vision & Metrology Telemetry
    wound_area_cm2: Mapped[float] = mapped_column(Float, default=0.0)
    aruco_calibration: Mapped[float] = mapped_column(Float, default=42.0)
    aruco_detected: Mapped[bool] = mapped_column(Boolean, default=True)
    infection_risk_percent: Mapped[float] = mapped_column(Float, default=0.0)
    convnext_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    
    # 4-Class Sub-Tissue Composition Breakdown
    tissue_granulation_percent: Mapped[float] = mapped_column(Float, default=50.0)
    tissue_slough_percent: Mapped[float] = mapped_column(Float, default=30.0)
    tissue_necrotic_percent: Mapped[float] = mapped_column(Float, default=20.0)

    # Clinical Imagery & Heatmap Overlays
    original_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mask_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Prognostics & Directives
    healing_estimate_weeks: Mapped[str] = mapped_column(String(64), default="8 - 12 Weeks")
    triage_level: Mapped[str] = mapped_column(String(64), default="MODERATE RISK")
    triage_color: Mapped[str] = mapped_column(String(16), default="#f59e0b")
    triage_bg: Mapped[str] = mapped_column(String(16), default="#fffbeb")

    # Structured JSON Telemetry
    radar_data: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    trajectory_data: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    action_plan: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Doctor Verification Flags
    verified_by_doctor: Mapped[bool] = mapped_column(Boolean, default=False)
    doctor_verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    final_verified_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="assessments")
    validation: Mapped[Optional["PhysicianValidation"]] = relationship(
        "PhysicianValidation",
        back_populates="assessment",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        """Converts assessment entity into standard Heal6 clinical telemetry contract."""
        p = self.patient
        return {
            "id": p.id if p else "DFU-UNKNOWN",
            "assessmentId": self.id,
            "name": p.name if p else "Anonymous",
            "age": p.age if p else 58,
            "gender": p.gender if p else "Unknown",
            "diabetesType": p.diabetes_type if p else "Type 2 DM",
            "hba1c": p.hba1c if p else "8.5%",
            "locationLabel": self.location_label,
            "siteScore": self.site_score,
            "ischemiaScore": self.ischemia_score,
            "neuropathyScore": self.neuropathy_score,
            "depthScore": self.depth_score,
            "calculatedSinbad": self.sinbad_score,
            "woundAreaCm2": self.wound_area_cm2,
            "arucoCalibration": self.aruco_calibration,
            "infectionRiskPercent": self.infection_risk_percent,
            "convnextConfidence": self.convnext_confidence,
            "tissueBreakdown": {
                "granulation": self.tissue_granulation_percent,
                "slough": self.tissue_slough_percent,
                "necrotic": self.tissue_necrotic_percent
            },
            "originalImage": self.original_image,
            "aiMaskImage": self.mask_image,
            "maskImage": self.mask_image,
            "healingEstimateWeeks": self.healing_estimate_weeks,
            "triageLevel": self.triage_level,
            "triageColor": self.triage_color,
            "triageBg": self.triage_bg,
            "radarData": self.radar_data,
            "trajectoryData": self.trajectory_data,
            "actionPlan": self.action_plan,
            "verifiedByDoctor": self.verified_by_doctor,
            "doctorVerificationNotes": self.doctor_verification_notes,
            "finalVerifiedScore": self.final_verified_score,
            "reverificationRequested": p.reverification_requested if p else False,
            "patientNotes": p.patient_notes if p else None,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
