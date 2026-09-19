"""
Automated Unit Tests for Computational Thermal Ischemia Prediction (Phase 13)
"""

import io
from PIL import Image
import numpy as np
import pytest

from app.ml_engine.thermal_gan import thermal_ischemia_engine

def test_thermal_inference_and_metrics():
    """Verify standard RGB generates calibrated thermal metrics within physiological range"""
    # Create synthetic test foot image (256x256 RGB)
    synthetic_arr = np.random.randint(80, 200, (256, 256, 3), dtype=np.uint8)
    pil_img = Image.fromarray(synthetic_arr)
    buffer = io.BytesIO()
    pil_img.save(buffer, format="JPEG")
    img_bytes = buffer.getvalue()

    result = thermal_ischemia_engine.predict_thermal_telemetry(img_bytes, baseline_temp_c=31.8)

    assert "thermal_heatmap_base64" in result
    assert result["thermal_heatmap_base64"].startswith("data:image/jpeg;base64,")

    metrics = result["metrics"]
    # Check physiological bounds (24°C - 38°C)
    assert 24.0 <= metrics["min_temperature_c"] <= 38.0
    assert 24.0 <= metrics["max_temperature_c"] <= 38.0
    assert 24.0 <= metrics["mean_temperature_c"] <= 38.0
    assert "ischemic_area_percent" in metrics
    assert "inflammatory_area_percent" in metrics

    diagnostics = result["diagnostics"]
    assert "clinical_status" in diagnostics
    assert "ischemia_grade" in diagnostics
    assert diagnostics["early_pre_ulcer_risk"] in ["HIGH", "LOW"]

def test_ironbow_colormap_mapping():
    """Verify Ironbow colormap generator produces valid 3-channel RGB array"""
    norm_temp_map = np.linspace(0, 1, 100).reshape((10, 10))
    rgb_output = thermal_ischemia_engine._apply_ironbow_colormap(norm_temp_map)

    assert rgb_output.shape == (10, 10, 3)
    assert rgb_output.dtype == np.uint8
