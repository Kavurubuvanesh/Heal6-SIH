"""
Test Suite for Phase 3: Explainable AI (Grad-CAM Infection Heatmaps)
"""

import sys
import os
from pathlib import Path
from PIL import Image
import numpy as np

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.ml_engine.explainability import generate_explainability_report, get_gradcam_engine


def test_gradcam_execution():
    print("Testing ConvNeXt Grad-CAM Explainability Engine...")

    # Create dummy 224x224 RGB image
    dummy_img = Image.new("RGB", (224, 224), color=(200, 100, 100))

    # Test engine directly
    engine = get_gradcam_engine()
    heatmap = engine.generate_heatmap(dummy_img, target_class_idx=0)

    assert heatmap is not None, "Heatmap should not be None"
    assert heatmap.shape == (224, 224), f"Heatmap shape should be (224, 224), got {heatmap.shape}"
    assert 0.0 <= heatmap.min() <= heatmap.max() <= 1.0, "Heatmap values must be normalized in [0, 1]"
    print(f"[PASS] Grad-CAM raw heatmap generated with shape {heatmap.shape}, min={heatmap.min()}, max={heatmap.max()}")

    # Test report generator with Base64 encoding
    report = generate_explainability_report(dummy_img, target_class_idx=0)

    assert "gradcam_heatmap_base64" in report, "Report must contain gradcam_heatmap_base64"
    assert "gradcam_overlay_base64" in report, "Report must contain gradcam_overlay_base64"
    assert report["gradcam_heatmap_base64"].startswith("data:image/png;base64,"), "Heatmap must be data URL"
    assert report["gradcam_overlay_base64"].startswith("data:image/jpeg;base64,"), "Overlay must be data URL"
    assert "hotspot_coordinates" in report, "Report must contain hotspot_coordinates"
    print(f"[PASS] Grad-CAM Report generated successfully! Hotspot: {report['hotspot_coordinates']}")
    print("ALL GRAD-CAM EXPLAINABILITY TESTS PASSED!")


if __name__ == "__main__":
    test_gradcam_execution()
