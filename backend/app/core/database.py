import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.db.base import Base
from app.db.models import Patient, WoundAssessment, PhysicianValidation, ReverificationRequest

logger = logging.getLogger("heal6.database")

# Build async engine according to DB dialect
connect_args = {}
engine_kwargs = {"echo": False, "future": True}

db_url = settings.async_database_url
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # Production PostgreSQL connection pool configurations
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 3600
    })

engine = create_async_engine(db_url, connect_args=connect_args, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an isolated async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initializes database schema and seeds baseline clinical cases if table is empty.
    Ensures zero downtime and continuous operation with existing frontend clients.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed baseline patients if table is empty
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count(Patient.id)))
        count = result.scalar()
        if count == 0:
            print("🌱 [DATABASE] Seeding baseline clinical cases into relational database...")
            
            # Baseline Case 1: Robert Vance (DFU-8842, SINBAD 4)
            p1 = Patient(
                id="DFU-8842",
                name="Robert Vance",
                age=61,
                gender="Male",
                diabetes_type="Type 2 DM (14 yrs)",
                hba1c="9.2%"
            )
            a1 = WoundAssessment(
                patient=p1,
                location_label="Right Plantar Hindfoot / Heel",
                site_score=1,
                ischemia_score=1,
                neuropathy_score=1,
                bacterial_score=1,
                area_score=1,
                depth_score=1,
                sinbad_score=4,
                wound_area_cm2=2.45,
                aruco_calibration=42.0,
                aruco_detected=True,
                infection_risk_percent=78.4,
                convnext_confidence=62.0,
                tissue_granulation_percent=45.0,
                tissue_slough_percent=35.0,
                tissue_necrotic_percent=20.0,
                healing_estimate_weeks="12 - 16 Weeks",
                triage_level="URGENT TRIAGE",
                triage_color="#f43f5e",
                triage_bg="#fff1f2",
                radar_data=[
                    { "axis": "Site (Hindfoot)", "value": 100, "label": "Hindfoot (1)" },
                    { "axis": "Ischemia", "value": 100, "label": "Reduced (1)" },
                    { "axis": "Neuropathy", "value": 100, "label": "Present (1)" },
                    { "axis": "Bacterial Load", "value": 85, "label": "High (1)" },
                    { "axis": "Area (≥1cm²)", "value": 90, "label": "2.45cm² (1)" },
                    { "axis": "Depth (Bone/Fascia)", "value": 100, "label": "Deep (1)" },
                ],
                trajectory_data=[
                    { "week": "W0 (Today)", "actual": 2.45, "projectedStandard": 2.45, "projectedMulti": 2.45 },
                    { "week": "W2", "projectedStandard": 2.30, "projectedMulti": 1.95 },
                    { "week": "W4", "projectedStandard": 2.10, "projectedMulti": 1.40 },
                    { "week": "W6", "projectedStandard": 1.85, "projectedMulti": 0.90 },
                    { "week": "W8", "projectedStandard": 1.55, "projectedMulti": 0.45 },
                    { "week": "W10", "projectedStandard": 1.20, "projectedMulti": 0.15 },
                    { "week": "W12", "projectedStandard": 0.90, "projectedMulti": 0.00 },
                ],
                action_plan={
                    "headline": "Standard wound care, multidisciplinary intervention.",
                    "debridement": "Sharp mechanical debridement of slough margin required.",
                    "offloading": "Immediate non-weight bearing Total Contact Casting (TCC) or Pneumatic Walker.",
                    "dressing": "Hydrofiber silver antimicrobials with alginate barrier changed q48h.",
                    "consultation": "Urgent Vascular Surgery Consult for ABI/Duplex Angiography within 24-48 hours."
                }
            )

            # Baseline Case 2: Elena Rostova (DFU-5104, SINBAD 2)
            p2 = Patient(
                id="DFU-5104",
                name="Elena Rostova",
                age=54,
                gender="Female",
                diabetes_type="Type 1 DM (22 yrs)",
                hba1c="8.4%"
            )
            a2 = WoundAssessment(
                patient=p2,
                location_label="Left 1st Metatarsal Head (Forefoot)",
                site_score=0,
                ischemia_score=0,
                neuropathy_score=1,
                bacterial_score=0,
                area_score=1,
                depth_score=0,
                sinbad_score=2,
                wound_area_cm2=1.20,
                aruco_calibration=42.0,
                aruco_detected=True,
                infection_risk_percent=34.2,
                convnext_confidence=89.5,
                tissue_granulation_percent=75.0,
                tissue_slough_percent=20.0,
                tissue_necrotic_percent=5.0,
                healing_estimate_weeks="6 - 8 Weeks",
                triage_level="MODERATE RISK",
                triage_color="#f59e0b",
                triage_bg="#fffbeb",
                radar_data=[
                    { "axis": "Site (Forefoot)", "value": 20, "label": "Forefoot (0)" },
                    { "axis": "Ischemia", "value": 10, "label": "Intact (0)" },
                    { "axis": "Neuropathy", "value": 100, "label": "Present (1)" },
                    { "axis": "Bacterial Load", "value": 30, "label": "Mild (0)" },
                    { "axis": "Area (≥1cm²)", "value": 65, "label": "1.20cm² (1)" },
                    { "axis": "Depth (Superficial)", "value": 20, "label": "Superficial (0)" },
                ],
                trajectory_data=[
                    { "week": "W0 (Today)", "actual": 1.20, "projectedStandard": 1.20, "projectedMulti": 1.20 },
                    { "week": "W2", "projectedStandard": 1.05, "projectedMulti": 0.85 },
                    { "week": "W4", "projectedStandard": 0.80, "projectedMulti": 0.40 },
                    { "week": "W6", "projectedStandard": 0.45, "projectedMulti": 0.10 },
                    { "week": "W8", "projectedStandard": 0.15, "projectedMulti": 0.00 },
                ],
                action_plan={
                    "headline": "Outpatient podiatric wound management & offloading footwear.",
                    "debridement": "Callus and hyperkeratotic rim reduction.",
                    "offloading": "Custom molded neuropathic orthotics with metatarsal relief.",
                    "dressing": "Collagen matrix dressing with secondary polyurethane foam.",
                    "consultation": "Routine 2-week podiatry follow-up."
                }
            )

            # Baseline Case 3: Arthur Pendelton (DFU-9311, SINBAD 6)
            p3 = Patient(
                id="DFU-9311",
                name="Arthur Pendelton",
                age=72,
                gender="Male",
                diabetes_type="Type 2 DM (28 yrs)",
                hba1c="10.8%"
            )
            a3 = WoundAssessment(
                patient=p3,
                location_label="Left Midfoot Charcot Joint Collapse",
                site_score=1,
                ischemia_score=1,
                neuropathy_score=1,
                bacterial_score=1,
                area_score=1,
                depth_score=1,
                sinbad_score=6,
                wound_area_cm2=4.80,
                aruco_calibration=42.0,
                aruco_detected=True,
                infection_risk_percent=94.6,
                convnext_confidence=96.2,
                tissue_granulation_percent=20.0,
                tissue_slough_percent=45.0,
                tissue_necrotic_percent=35.0,
                healing_estimate_weeks="20 - 28 Weeks (High Amputation Risk)",
                triage_level="CRITICAL SURGICAL EMERGENCY",
                triage_color="#f43f5e",
                triage_bg="#fff1f2",
                radar_data=[
                    { "axis": "Site (Midfoot)", "value": 100, "label": "Midfoot (1)" },
                    { "axis": "Ischemia", "value": 100, "label": "Severe (1)" },
                    { "axis": "Neuropathy", "value": 100, "label": "Dense (1)" },
                    { "axis": "Bacterial Load", "value": 100, "label": "Systemic (1)" },
                    { "axis": "Area (≥1cm²)", "value": 100, "label": "4.80cm² (1)" },
                    { "axis": "Depth (Probe-to-Bone)", "value": 100, "label": "Bone (1)" },
                ],
                trajectory_data=[
                    { "week": "W0 (Today)", "actual": 4.80, "projectedStandard": 4.80, "projectedMulti": 4.80 },
                    { "week": "W2", "projectedStandard": 4.60, "projectedMulti": 3.80 },
                    { "week": "W4", "projectedStandard": 4.30, "projectedMulti": 2.70 },
                    { "week": "W6", "projectedStandard": 3.90, "projectedMulti": 1.80 },
                    { "week": "W8", "projectedStandard": 3.40, "projectedMulti": 1.10 },
                    { "week": "W10", "projectedStandard": 2.80, "projectedMulti": 0.50 },
                    { "week": "W12", "projectedStandard": 2.20, "projectedMulti": 0.10 },
                ],
                action_plan={
                    "headline": "Urgent limb salvage protocol & immediate hospital admission.",
                    "debridement": "Operative debridement & deep tissue bone cultures.",
                    "offloading": "Strict non-weight bearing immobilization (bivalved TCC).",
                    "dressing": "Negative Pressure Wound Therapy (NPWT / VAC) post-op.",
                    "consultation": "Emergency Vascular Surgery + Orthopedic Foot & Ankle consult."
                }
            )

            session.add_all([p1, a1, p2, a2, p3, a3])
            await session.commit()
            print("✅ [DATABASE] 3 Baseline clinical cases successfully committed to DB.")
