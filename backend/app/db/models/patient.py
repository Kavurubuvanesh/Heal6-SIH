from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(32), nullable=False)
    diabetes_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    hba1c: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    
    # Active Triage Status Flags
    reverification_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    patient_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship to longitudinal wound assessments
    assessments: Mapped[List["WoundAssessment"]] = relationship(
        "WoundAssessment",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(WoundAssessment.timestamp)"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "diabetesType": self.diabetes_type,
            "hba1c": self.hba1c,
            "reverificationRequested": self.reverification_requested,
            "patientNotes": self.patient_notes
        }
