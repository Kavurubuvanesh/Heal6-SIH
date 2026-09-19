from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


# ==========================================
# 1. INDUSTRY-GRADE DATA SCHEMAS
# ==========================================
class TriageLevel(str, Enum):
    ROUTINE = "ROUTINE"  # Green
    URGENT = "URGENT"  # Yellow
    EMERGENCY = "EMERGENCY"  # Red


class ClinicalInput(BaseModel):
    """
    Accepts raw values and AI probabilities rather than simple booleans.
    This allows the engine to calculate confidence and flag uncertain predictions.
    """
    # Clinical inputs (Doctor provided)
    is_hindfoot: bool = Field(..., description="True if ulcer is on the hindfoot.")
    has_ischemia: bool = Field(..., description="True if pedal blood flow is reduced.")
    has_neuropathy: bool = Field(..., description="True if protective sensation is lost.")
    is_deep: bool = Field(..., description="True if ulcer reaches muscle/bone.")

    # AI inputs (Auto-populated by Task 1 & Task 2)
    ai_infection_prob: float = Field(..., ge=0.0, le=1.0, description="Task 1 confidence score.")
    ai_area_cm2: float = Field(..., ge=0.0, description="Task 2 calculated surface area.")

    # Thresholds for AI logic
    INFECTION_THRESHOLD: float = 0.75
    AREA_THRESHOLD: float = 1.0


# ==========================================
# 2. CLINICAL LOGIC & PROGNOSTICS
# ==========================================
class SinbadEngine:
    def __init__(self, data: ClinicalInput):
        self.data = data
        self.flags: List[str] = []
        self.requires_human_review: bool = False

    def _evaluate_ai_confidence(self) -> tuple[bool, bool]:
        """Evaluates AI inputs and triggers human-in-the-loop if confidence is marginal."""
        # Evaluate Infection
        has_infection = self.data.ai_infection_prob >= self.data.INFECTION_THRESHOLD
        if 0.40 < self.data.ai_infection_prob < 0.75:
            self.requires_human_review = True
            self.flags.append(
                f"AI uncertain about infection (Confidence: {self.data.ai_infection_prob * 100:.1f}%). Clinical review required.")

        # Evaluate Area
        is_large = self.data.ai_area_cm2 >= self.data.AREA_THRESHOLD
        if 0.8 < self.data.ai_area_cm2 < 1.2:
            self.flags.append(f"Area ({self.data.ai_area_cm2:.2f} cm²) is borderline. Monitor closely.")

        return has_infection, is_large

    def _determine_prognosis(self, score: int) -> Dict[str, Any]:
        """Maps standard SINBAD scores to clinical outcomes and triage codes."""
        if score <= 2:
            return {
                "triage": TriageLevel.ROUTINE,
                "healing_probability": "85-95%",
                "est_healing_time_weeks": "4-8",
                "action": "Standard offloading and debridement."
            }
        elif score <= 4:
            return {
                "triage": TriageLevel.URGENT,
                "healing_probability": "50-60%",
                "est_healing_time_weeks": "12-16",
                "action": "Multidisciplinary team intervention. Vascular and infectious disease consults recommended."
            }
        else:
            return {
                "triage": TriageLevel.EMERGENCY,
                "healing_probability": "< 30%",
                "est_healing_time_weeks": "24+",
                "action": "Immediate hospitalization. High risk of major amputation. Aggressive surgical intervention required."
            }

    def generate_report(self) -> Dict[str, Any]:
        """Builds the comprehensive JSON payload for the frontend_pratyusha_archive dashboard."""
        has_infection, is_large = self._evaluate_ai_confidence()

        # Calculate strict SINBAD Score
        components = {
            "S_Site": 1 if self.data.is_hindfoot else 0,
            "I_Ischemia": 1 if self.data.has_ischemia else 0,
            "N_Neuropathy": 1 if self.data.has_neuropathy else 0,
            "B_Bacterial": 1 if has_infection else 0,
            "A_Area": 1 if is_large else 0,
            "D_Depth": 1 if self.data.is_deep else 0,
        }

        total_score = sum(components.values())
        prognosis = self._determine_prognosis(total_score)

        # Add critical physiological flags
        if components["I_Ischemia"]: self.flags.append("Vascular compromise limits healing potential.")
        if components["D_Depth"]: self.flags.append("Osteomyelitis (bone infection) risk is critical.")

        return {
            "timestamp": "auto-generated",  # Will be handled by FastAPI route
            "score_summary": {
                "total": total_score,
                "max": 6,
                "is_critical": total_score >= 4
            },
            "clinical_prognosis": prognosis,
            "system_warnings": {
                "human_override_requested": self.requires_human_review,
                "alerts": self.flags
            },
            # Perfectly formatted for a frontend_pratyusha_archive Radar/Spider Chart (Values 0 or 1)
            "radar_chart_data": components,
            "raw_measurements": {
                "ai_wound_area_cm2": round(self.data.ai_area_cm2, 2),
                "ai_infection_confidence": round(self.data.ai_infection_prob, 3)
            }
        }


# ==========================================
# 3. LOCAL TESTING
# ==========================================
if __name__ == "__main__":
    # Simulating an API request from the frontend_pratyusha_archive
    mock_request = ClinicalInput(
        is_hindfoot=False,
        has_ischemia=False,
        has_neuropathy=True,
        is_deep=False,
        ai_infection_prob=0.62,  # AI is unsure! Triggers human review.
        ai_area_cm2=1.05  # Borderline area trigger
    )

    engine = SinbadEngine(mock_request)
    report = engine.generate_report()

    import json

    print(json.dumps(report, indent=2))