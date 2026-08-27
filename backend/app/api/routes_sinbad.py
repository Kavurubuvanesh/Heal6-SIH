import io
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image

# Import ML Engines
from app.ml_engine.inference import predict_wound
from app.ml_engine.segmentation_inference import predict_wound_mask
from app.ml_engine.sinbad_engine import SinbadEngine, ClinicalInput
from app.ml_engine.calibration import detect_marker_and_calculate_ratio, calculate_real_world_area

router = APIRouter()


@router.post("/analyze-wound")
async def analyze_wound(
        file: UploadFile = File(...),
        is_hindfoot: bool = Form(..., description="True if ulcer is on the hindfoot"),
        has_ischemia: bool = Form(..., description="True if pedal blood flow is reduced"),
        has_neuropathy: bool = Form(..., description="True if protective sensation is lost"),
        is_deep: bool = Form(..., description="True if ulcer reaches muscle/bone")
):
    try:
        # Step 1: Memory Stream
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

        image_bytes = await file.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        open_cv_image = np.array(pil_image)[:, :, ::-1].copy()

        # Step 2: ArUco Marker Calibration
        pixels_per_cm, _, _ = detect_marker_and_calculate_ratio(open_cv_image)

        if pixels_per_cm is None:
            raise HTTPException(
                status_code=422,
                detail="ArUco calibration marker not detected. Please capture the image with the marker visible."
            )

        # Step 3: Task 1 - ConvNeXt Infection / Classification
        task1_results = predict_wound(pil_image)
        ai_infection_prob = task1_results["confidence"] / 100.0

        # Step 4: Task 2 - Attention U-Net Wound Area Segmentation (ACTIVE)
        seg_results = predict_wound_mask(pil_image)
        real_mask_pixels = seg_results["mask_pixel_count"]

        # Real-World Area Calculation (cm²)
        calculated_area_cm2 = calculate_real_world_area(real_mask_pixels, pixels_per_cm)

        # Step 5: SINBAD Scoring Engine
        clinical_data = ClinicalInput(
            is_hindfoot=is_hindfoot,
            has_ischemia=has_ischemia,
            has_neuropathy=has_neuropathy,
            is_deep=is_deep,
            ai_infection_prob=ai_infection_prob,
            ai_area_cm2=calculated_area_cm2
        )

        engine = SinbadEngine(clinical_data)
        final_report = engine.generate_report()

        final_report["ai_diagnostics"] = {
            "task1_classification": task1_results["prediction"],
            "task2_coverage_percentage": seg_results["coverage_percentage"],
            "pixels_per_cm": round(pixels_per_cm, 2),
            "calculated_area_cm2": round(calculated_area_cm2, 2)
        }

        return final_report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Analysis Error: {str(e)}")