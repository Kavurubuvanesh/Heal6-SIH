"""
Routes for Computational Thermal Ischemia Prediction
Phase 13: GAN-Driven Cross-Spectral Infrared Synthesizer
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import base64

from app.ml_engine.thermal_gan import thermal_ischemia_engine

router = APIRouter(prefix="/api/v1/thermal", tags=["Thermal Ischemia"])

class ThermalBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded RGB foot photograph")
    baseline_temp_c: float = Field(31.8, description="Contralateral limb baseline reference in Celsius")

@router.post("/predict")
async def predict_thermal_heatmap(
    file: Optional[UploadFile] = File(None),
    baseline_temp_c: float = Form(31.8)
):
    """
    Accepts standard RGB image upload, generates synthesized FLIR Ironbow thermal infrared heatmap,
    identifies pre-ulcerative cold ischemic zones and hot acute infection zones.
    """
    try:
        if not file:
            raise HTTPException(status_code=400, detail="An RGB image file must be uploaded.")

        image_bytes = await file.read()
        results = thermal_ischemia_engine.predict_thermal_telemetry(
            image_bytes=image_bytes,
            baseline_temp_c=baseline_temp_c
        )
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thermal GAN processing error: {str(e)}")

@router.post("/predict-base64")
async def predict_thermal_base64(request: ThermalBase64Request):
    """
    Accepts Base64 RGB dataURI for direct workstation canvas synthesis.
    """
    try:
        raw_b64 = request.image_base64
        if "base64," in raw_b64:
            raw_b64 = raw_b64.split("base64,")[1]

        image_bytes = base64.b64decode(raw_b64)
        results = thermal_ischemia_engine.predict_thermal_telemetry(
            image_bytes=image_bytes,
            baseline_temp_c=request.baseline_temp_c
        )
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thermal Base64 error: {str(e)}")

@router.get("/reference-scale")
async def get_reference_scale():
    """Returns the clinical thermal reference scale and color ranges"""
    return {
        "unit": "Celsius (°C)",
        "min_temperature": 24.0,
        "max_temperature": 38.0,
        "baseline_physiologic": 31.8,
        "ischemia_threshold_delta": -2.2,
        "infection_threshold_delta": +2.2,
        "palette": "FLIR Ironbow (Medical Grade)"
    }
