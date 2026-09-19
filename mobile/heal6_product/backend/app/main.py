import torch
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.api.routes_auth import router as auth_router, _ensure_test_account
from app.api.routes_profile import router as profile_router
from app.api.routes_appointments import router as appointments_router
from app.api.routes_screenings import router as screenings_router
from app.ml_engine.inference import load_model
from app.ml_engine.segmentation_inference import load_segmentation_model

torch.set_num_threads(4)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print('[STARTUP] Initializing Heal6 API...')
    init_db(); _ensure_test_account()
    for label, loader in [('ConvNeXt', load_model), ('segmentation', load_segmentation_model)]:
        try:
            loader(); print(f'[STARTUP] {label} model ready.')
        except Exception as exc:
            print(f'[STARTUP WARNING] {label} model not loaded: {exc}')
    yield
    print('[SHUTDOWN] Heal6 API stopped.')

app = FastAPI(title='Heal6 Screening API', version='3.0.0', description='Heal6 diabetic-foot early-warning screening, profile storage and PDF reporting API.')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

app.include_router(auth_router, prefix='/api/v1/auth', tags=['Auth'])
app.include_router(profile_router, prefix='/api/v1/profile', tags=['Profile'])
app.include_router(appointments_router, prefix='/api/v1/appointments', tags=['Appointments'])
app.include_router(screenings_router, prefix='/api/v1', tags=['Screenings & Reports'])

@app.get('/health', tags=['System'])
@app.get('/api/v1/health', tags=['System'])
async def health():
    return {'status':'ONLINE','service':'Heal6 API','version':'3.0.0','cuda_available':torch.cuda.is_available(),'device':'CUDA' if torch.cuda.is_available() else 'CPU'}
