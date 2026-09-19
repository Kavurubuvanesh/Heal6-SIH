import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class PhysicianValidation(Base):
    __tablename__ = "physician_validations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("wound_assessments.id", ondelete="CASCADE"),
        unique=True,
        index=True
    )
    physician_id: Mapped[str] = mapped_column(String(64), default="DR-SHARMA-01")
    physician_name: Mapped[str] = mapped_column(String(128), default="Dr. Sharma")
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    verified_ischemia: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_depth: Mapped[bool] = mapped_column(Boolean, default=False)
    final_verified_score: Mapped[int] = mapped_column(Integer, nullable=False)
    doctor_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    review_status: Mapped[Optional[str]] = mapped_column(String(64), default="Reviewed & Prescribed")
    prescriptions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    precautions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    follow_up_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    call_back_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_dispatched_to_his: Mapped[bool] = mapped_column(Boolean, default=True)

    assessment: Mapped["WoundAssessment"] = relationship("WoundAssessment", back_populates="validation")
