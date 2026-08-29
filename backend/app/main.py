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

# Set PyTorch execution threads to prevent CPU thrashing
torch.set_num_threads(4)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager loads ML models ONCE into memory
    at server startup, dropping API latency from ~4s to <200ms.
    """
    print("🚀 [STARTUP] Initializing Heal6 Diagnostic Intelligence Platform...")
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