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
        print("✅ [STARTUP] Relational Database initialized & baseline clinical cases verified.")
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
    description="Edge-to-Cloud Diabetic Foot Ulcer Triage & CV Telemetry Engine",
    version="2.4.0",
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

# 2. Attach Modular Sub-Routers
app.include_router(sinbad_router, prefix="/api/v1/sinbad", tags=["SINBAD Diagnostic Protocol"])
app.include_router(patients_router, prefix="/api/v1/patients", tags=["Triage Queue"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(stream_router, prefix="/api/v1/stream", tags=["Real-Time Triage Streaming"])
app.include_router(fhir_router, prefix="/api/v1/fhir", tags=["HL7 / FHIR R4 Interoperability"])
app.include_router(rag_router, prefix="/api/v1/rag", tags=["Clinical RAG & IWGDF Scribe"])
app.include_router(federated_router, prefix="/api/v1/federated", tags=["Federated Multi-Center AI"])

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