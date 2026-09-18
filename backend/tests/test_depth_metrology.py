"""
Unit Tests for Phase 8: 3D Volumetric Depth Metrology
=====================================================
Tests ulcer crater depth calculations, volume numerical integration,
1D transect profiling, and 3D heightmap mesh topology.
"""

import sys
from pathlib import Path
import numpy as np
from PIL import Image

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.ml_engine.depth_metrology import compute_volumetric_depth_metrology

def test_depth_metrology_superficial_wound():
    img = Image.new("RGB", (224, 224), color=(200, 150, 140))
    mask = np.zeros((224, 224), dtype=np.uint8)
    mask[80:144, 80:144] = 255 # 64x64 square ulcer

    result = compute_volumetric_depth_metrology(
        image=img,
        mask=mask,
        pixels_per_cm=42.0,
        is_deep=False
    )

    assert "max_depth_mm" in result
    assert "wound_volume_cm3" in result
    assert "cross_section_profile" in result
    assert "mesh_3d" in result
    assert "depth_map_base64" in result

    assert result["max_depth_mm"] > 0.0
    assert result["max_depth_mm"] <= 4.0 # Superficial depth
    assert result["mean_depth_mm"] <= result["max_depth_mm"]
    assert result["wound_volume_cm3"] > 0.0
    assert result["depth_classification"] == "Superficial Dermal Ulcer"
    assert result["sinbad_depth_points"] == 0

    # Cross section
    cs = result["cross_section_profile"]
    assert len(cs) == 50
    assert cs[25]["depth_mm"] >= cs[0]["depth_mm"] # Crater center is deeper than edge

    # 3D Mesh
    mesh = result["mesh_3d"]
    assert mesh["grid_size"] == 32
    assert len(mesh["vertices"]) == 32 * 32 * 3
    assert len(mesh["faces"]) > 0

def test_depth_metrology_deep_subcutaneous_ulcer():
    img = Image.new("RGB", (300, 300), color=(180, 120, 110))
    mask = np.zeros((300, 300), dtype=np.uint8)
    mask[100:200, 100:200] = 255

    result = compute_volumetric_depth_metrology(
        image=img,
        mask=mask,
        pixels_per_cm=40.0,
        is_deep=True,
        tissue_breakdown={"granulation": 30.0, "slough": 40.0, "necrotic": 30.0}
    )

    assert result["max_depth_mm"] >= 4.0
    assert result["depth_classification"] == "Probe-to-Bone / Deep Fascia"
    assert result["sinbad_depth_points"] == 1
    assert result["wound_volume_cm3"] > 0.05
