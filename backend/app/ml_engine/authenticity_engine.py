"""
Heal6 Clinical Authenticity Engine
====================================
Purpose: Veto false-positive ulcer detections caused by rough/dry/dusty skin,
         bare feet, background clutter, and poor lighting artefacts.

Decision tree:
  1. Spatial Cohesion Gate  -- scattered blobs / tiny mask -> reject
  2. Brightness Sanity Gate -- very bright, washed-out region can't be necrotic
  3. Edge Energy Gate       -- real ulcers have a crater boundary; rough skin doesn't
  4. ConvNeXt Concordance   -- if ConvNeXt says Normal, override segmentation

Returns
-------
is_authentic : bool   -- True if the wound is real, False = false positive
reason       : str    -- human-readable rejection reason for logging
"""

from __future__ import annotations
import logging
from typing import Tuple, Dict, Any

import numpy as np

logger = logging.getLogger(__name__)

# Rejection Thresholds (tuned for mobile phone photos)
MIN_BLOB_AREA_PX       = 300
MAX_FRAGMENTATION      = 6
MIN_EDGE_ENERGY        = 0.012
MIN_WOUND_PIXELS       = 400
NECROTIC_MAX_L_STAR    = 135.0
MIN_COHERENT_BLOB_FRAC = 0.55


def _clean_seg() -> Dict[str, Any]:
    return {
        'mask_pixel_count': 0,
        'coverage_percentage': 0.0,
        'is_wound_detected': False,
        'tissue_breakdown': {
            'intact_epithelium': 100,
            'granulation': 0.0,
            'slough': 0.0,
            'necrotic': 0.0,
        },
        'mask_image_base64': '',
    }


def _spatial_cohesion_gate(mask_pixels: int, tissue_breakdown: Dict[str, float]) -> Tuple[bool, str]:
    if mask_pixels < MIN_WOUND_PIXELS:
        return False, (
            f"Mask too small ({mask_pixels} px < {MIN_WOUND_PIXELS} px minimum) -- "
            "likely noise/artefact, not an ulcer."
        )
    return True, "ok"


def _fragmentation_gate(mask_array=None) -> Tuple[bool, str]:
    if mask_array is None:
        return True, "skipped (no mask array)"
    try:
        from scipy import ndimage as ndi
        labelled, n_blobs = ndi.label(mask_array > 0)
        if n_blobs == 0:
            return False, "No connected wound blobs found in segmentation mask."
        if n_blobs > MAX_FRAGMENTATION:
            return False, (
                f"Wound mask fragmented into {n_blobs} blobs (>{MAX_FRAGMENTATION}) -- "
                "typical of rough/dry skin texture."
            )
        blob_sizes = np.array([np.sum(labelled == i) for i in range(1, n_blobs + 1)])
        largest_frac = blob_sizes.max() / blob_sizes.sum()
        if largest_frac < MIN_COHERENT_BLOB_FRAC:
            return False, (
                f"Largest blob only {largest_frac:.1%} of mask area -- scattered texture, not a wound."
            )
    except ImportError:
        pass
    return True, "ok"


def _necrotic_sanity_gate(open_cv_bgr, tissue_breakdown: Dict[str, float]) -> Tuple[bool, str]:
    necrotic_pct = float(tissue_breakdown.get('necrotic', 0.0))
    if necrotic_pct < 20.0:
        return True, "ok"
    if open_cv_bgr is None:
        return True, "skipped (no image)"
    try:
        import cv2
        lab = cv2.cvtColor(open_cv_bgr, cv2.COLOR_BGR2Lab).astype(float)
        mean_L = float(np.mean(lab[:, :, 0]))
        l_star = mean_L / 2.55
        if l_star > NECROTIC_MAX_L_STAR:
            return False, (
                f"Region too bright (L*={l_star:.1f} > {NECROTIC_MAX_L_STAR}) "
                "for necrotic label -- likely dusty/dry skin mis-classified."
            )
    except Exception as e:
        logger.debug(f"Necrotic sanity gate skipped: {e}")
    return True, "ok"


def _edge_energy_gate(open_cv_bgr, mask_pixels: int) -> Tuple[bool, str]:
    if open_cv_bgr is None or mask_pixels == 0:
        return True, "skipped"
    try:
        import cv2
        gray = cv2.cvtColor(open_cv_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        edge_mag = np.sqrt(sobel_x ** 2 + sobel_y ** 2)
        edge_energy_ratio = float(np.mean(edge_mag))
        if edge_energy_ratio < MIN_EDGE_ENERGY:
            return False, (
                f"Edge energy too low ({edge_energy_ratio:.4f} < {MIN_EDGE_ENERGY}) -- "
                "no distinct wound crater boundary; likely rough skin texture."
            )
    except Exception as e:
        logger.debug(f"Edge energy gate skipped: {e}")
    return True, "ok"


def verify_ulcer_authenticity(
    seg: Dict[str, Any],
    convnext_is_ulcer: bool,
    open_cv_bgr=None,
    mask_array=None,
    has_ulcer_clinical_override: bool = False,
) -> Tuple[bool, str]:
    """
    Run all gates in order. Returns (is_authentic, reason).

    Parameters
    ----------
    seg                         : raw output from predict_wound_mask()
    convnext_is_ulcer           : bool from predict_wound()['is_ulcer']
    open_cv_bgr                 : OpenCV BGR image array (optional)
    mask_array                  : binary segmentation mask array (optional)
    has_ulcer_clinical_override : True if clinician manually flagged ulcer in triage

    Returns
    -------
    (True,  reason) -> wound is real, proceed normally
    (False, reason) -> false positive, caller should zero-out seg
    """
    if has_ulcer_clinical_override:
        return True, "clinical_override"

    # ConvNeXt says Normal skin -> immediately reject UNet++ noise
    if not convnext_is_ulcer:
        return False, (
            "ConvNeXt classifier predicts Normal (Healthy skin). "
            "UNet++ segmentation overridden -- no active ulcer."
        )

    mask_pixels = int(seg.get('mask_pixel_count', 0))
    tissue_breakdown = seg.get('tissue_breakdown', {})

    ok, reason = _spatial_cohesion_gate(mask_pixels, tissue_breakdown)
    if not ok:
        return False, reason

    ok, reason = _fragmentation_gate(mask_array)
    if not ok:
        return False, reason

    ok, reason = _necrotic_sanity_gate(open_cv_bgr, tissue_breakdown)
    if not ok:
        return False, reason

    ok, reason = _edge_energy_gate(open_cv_bgr, mask_pixels)
    if not ok:
        return False, reason

    return True, "authentic"
