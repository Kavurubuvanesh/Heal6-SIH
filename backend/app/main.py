import sys
import os

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import torch
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Pre-warm ML Models at Application Startup
from app.ml_engine.segmentation_inference import load_segmentation_model

# 🚨 STRICT IMPORTS: No try/except blocks. If a file is broken, the server MUST crash and tell us.
from app.api.routes_sinbad import router as sinbad_router
from app.api.routes_patients import router as patients_router
from app.api.routes_auth import router as auth_router
from app.api.routes_stream import router as stream_router
from app.api.routes_fhir import router as fhir_router
from app.api.routes_rag import router as rag_router
from app.api.routes_federated import router as federated_router
from app.api.routes_screenings import router as screenings_router
from app.api.routes_profile import router as profile_router
from app.api.routes_appointments import router as appointments_router
from app.api.routes_voice import router as voice_router
from app.api.routes_thermal import router as thermal_router
from app.api.routes_telemetry import router as telemetry_router
from app.core.telemetry import clinical_telemetry
import time
from app.db.patient_db import init_patient_db

# Set PyTorch execution threads to prevent CPU thrashing
torch.set_num_threads(4)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager initializes relational database and
    loads ML models ONCE into memory at server startup, dropping API latency to <200ms.
    """
    print("🚀 [STARTUP] Initializing Heal6 Diagnostic Intelligence Platform...")
    try:
        from app.core.database import init_db
        await init_db()
        init_patient_db()
        print("✅ [STARTUP] Relational Database & Mobile Patient DB initialized.")
    except Exception as db_err:
        print(f"⚠️ [STARTUP WARNING] Database initialization failed: {db_err}")

    try:
        load_segmentation_model()
        print("✅ [STARTUP] PyTorch UNet++ Diagnostic Models loaded into memory.")
    except Exception as e:
        print(f"⚠️ [STARTUP WARNING] Model pre-warming failed: {e}")
    yield
    print("🛑 [SHUTDOWN] Releasing diagnostic pipeline resources...")

# Initialize Enterprise FastAPI Application
app = FastAPI(
    title="Heal6 Industrial Clinical Intelligence API",
    description="Edge-to-Cloud Diabetic Foot Ulcer Triage, Mobile Telemetry & CV Engine",
    version="3.1.0",
    lifespan=lifespan
)

# 1. High-Performance CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1.5. Enterprise APM Latency & Prometheus Middleware
@app.middleware("http")
async def apm_latency_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    clinical_telemetry.record_request(request.url.path, request.method, duration, response.status_code)
    return response

# 2. Attach Modular Sub-Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication & Access"])
app.include_router(screenings_router, prefix="/api/v1", tags=["Mobile Patient Screenings & PDF Reports"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["Mobile Patient Profile"])
app.include_router(appointments_router, prefix="/api/v1/appointments", tags=["Clinical Appointments"])
app.include_router(sinbad_router, prefix="/api/v1/sinbad", tags=["SINBAD Diagnostic Protocol"])
app.include_router(patients_router, prefix="/api/v1/patients", tags=["Doctor Triage Queue"])
app.include_router(stream_router, prefix="/api/v1/stream", tags=["Real-Time Triage Streaming"])
app.include_router(fhir_router, prefix="/api/v1/fhir", tags=["HL7 / FHIR R4 Interoperability"])
app.include_router(rag_router, prefix="/api/v1/rag", tags=["Clinical RAG & IWGDF Scribe"])
app.include_router(federated_router, prefix="/api/v1/federated", tags=["Federated Multi-Center AI"])
app.include_router(voice_router, tags=["Multilingual Voice Telemetry"])
app.include_router(thermal_router, tags=["Thermal Ischemia GAN"])
app.include_router(telemetry_router, tags=["Enterprise Observability & Metrics"])

# 3. System Health Check Endpoint
@app.get("/health", tags=["System Telemetry"])
@app.get("/api/v1/health", tags=["System Telemetry"])
async def health_check():
    return {
        "status": "ONLINE",
        "service": "Heal6 AI Engine",
        "version": "2.4.0",
        "cuda_available": torch.cuda.is_available(),
        "device": "CUDA (GPU)" if torch.cuda.is_available() else "CPU High-Performance"
    }