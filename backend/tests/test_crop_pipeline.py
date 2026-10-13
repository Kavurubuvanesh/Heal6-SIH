import pytest
import io
import json
import numpy as np
from PIL import Image
from app.ml_engine.calibration import calculate_real_world_area, get_fallback_pixels_per_cm
from app.services.report_service import build_pdf
import tempfile
import os

def test_crop_math_and_scaling():
    # Simulate a full camera frame: 3000 x 4000
    full_img = Image.new("RGB", (3000, 4000), color=(200, 150, 150))
    
    # Simulate a reticle bounding box crop
    crop_data = {"x": 300, "y": 500, "width": 2400, "height": 3200}
    
    cx = max(0, int(crop_data.get('x', 0)))
    cy = max(0, int(crop_data.get('y', 0)))
    cw = int(crop_data.get('width', 0))
    ch = int(crop_data.get('height', 0))
    
    cx2 = min(full_img.width, cx + cw)
    cy2 = min(full_img.height, cy + ch)
    
    cropped = full_img.crop((cx, cy, cx2, cy2))
    assert cropped.width == 2400
    assert cropped.height == 3200
    # Aspect ratio should be 3:4
    assert round(cropped.width / cropped.height, 2) == 0.75

def test_report_service_with_cropped_roi():
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = os.path.join(tmpdir, "test_report.pdf")
        
        # Create dummy sample image
        img = Image.new("RGB", (400, 400), color=(180, 120, 120))
        img_path = os.path.join(tmpdir, "sample.jpg")
        img.save(img_path, format="JPEG")
        
        # Tiny 1x1 png base64 for cropped mask and image
        import base64
        buf = io.BytesIO()
        img.resize((100, 100)).save(buf, format="JPEG")
        cropped_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        
        payload = {
            "reportNumber": "H6-TEST-001",
            "assessmentId": "ASMT-TEST-001",
            "generatedAt": "2026-09-22T06:00:00Z",
            "riskLevel": "Moderate Risk",
            "sinbadBreakdown": {"totalScore": 2, "maxPossibleScore": 6},
            "findings": ["Test finding"],
            "clinicalProtocol": {"recommendation": "Follow up in 7 days", "actionDeadline": "1 week", "doctorFeedback": "Monitor"},
            "aiDiagnostics": {
                "task1Classification": "Normal (Healthy skin)",
                "convnextConfidence": 94.2,
                "infectionRiskPercent": 12.0,
                "calculatedAreaCm2": 0.0,
                "arucoDetected": False,
                "pixelsPerCm": 42.0,
                "coveragePercentage": 0.0,
                "tissueBreakdown": {"granulation": 0, "slough": 0, "necrotic": 0},
                "maskImageBase64": "",
                "croppedImageBase64": cropped_b64,
                "woundRoi": {"x": 50, "y": 50, "width": 100, "height": 100, "has_focused_roi": True}
            },
            "profile": {"name": "Test Patient", "age": "50"}
        }
        
        build_pdf(pdf_path, payload, img_path)
        assert os.path.exists(pdf_path)
        assert os.path.getsize(pdf_path) > 1000
