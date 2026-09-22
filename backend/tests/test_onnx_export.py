"""
Automated Test Suite for Pillar 4: Offline Edge Inference (ONNX Runtime Web / WebGL).
Validates:
1. Integrity of exported ONNX model files in backend and client app public stores.
2. Tensor input/output shapes and ONNX Runtime execution.
3. Numerical consistency between PyTorch source models and ONNX Runtime predictions.
4. Edge latency benchmarking.
"""
import sys
import os
import time
import numpy as np

# Ensure UTF-8 console encoding on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import torch
import onnx
import onnxruntime as ort
from app.ml_engine.inference import load_model as load_convnext_model
from app.ml_engine.segmentation_inference import AttentionUNet


def test_exported_files_exist():
    """Verify that all deployed ONNX model assets exist in public and backend stores."""
    repo_root = os.path.dirname(backend_dir)
    required_paths = [
        os.path.join(backend_dir, "app", "ml_engine", "weights", "wound_detect_convnext.onnx"),
        os.path.join(backend_dir, "app", "ml_engine", "weights", "wound_segment_edge_unet.onnx"),
        os.path.join(repo_root, "heal6-patient-app", "public", "models", "wound_detect_convnext.onnx"),
        os.path.join(repo_root, "heal6-patient-app", "public", "models", "wound_segment_edge_unet.onnx"),
        os.path.join(repo_root, "doctor_web_frontend", "public", "models", "wound_detect_convnext.onnx"),
        os.path.join(repo_root, "doctor_web_frontend", "public", "models", "wound_segment_edge_unet.onnx"),
    ]

    for p in required_paths:
        assert os.path.exists(p), f"Missing ONNX model at: {p}"
        size_mb = os.path.getsize(p) / (1024 * 1024)
        print(f"  [PASS] Found ONNX model: {os.path.basename(p)} ({size_mb:.2f} MB)")


def test_convnext_edge_inference():
    """Test ConvNeXt ONNX model execution, tensor shapes, and parity with PyTorch."""
    model_path = os.path.join(backend_dir, "app", "ml_engine", "weights", "wound_detect_convnext.onnx")
    onnx_model = onnx.load(model_path)
    onnx.checker.check_model(onnx_model)

    ort_session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    dummy_input = np.random.randn(1, 3, 224, 224).astype(np.float32)

    # Benchmark ONNX execution time
    t0 = time.perf_counter()
    outputs = ort_session.run(["logits"], {"input": dummy_input})
    onnx_elapsed_ms = (time.perf_counter() - t0) * 1000

    logits = outputs[0]
    assert logits.shape == (1, 2), f"Expected shape (1, 2), got {logits.shape}"
    print(f"  [PASS] ConvNeXt ONNX Inference Output Shape: {logits.shape} (Latency: {onnx_elapsed_ms:.1f}ms)")

    # Verify PyTorch parity
    pt_model = load_convnext_model()
    pt_model.eval()
    pt_model.cpu()
    with torch.no_grad():
        pt_out = pt_model(torch.from_numpy(dummy_input)).numpy()

    max_diff = np.max(np.abs(pt_out - logits))
    print(f"  [PASS] ConvNeXt Max Abs Difference vs PyTorch: {max_diff:.2e}")
    assert max_diff < 1e-3, f"Parity difference too large: {max_diff}"


def test_unet_edge_inference():
    """Test Attention U-Net ONNX model execution, tensor shapes, and parity with PyTorch."""
    model_path = os.path.join(backend_dir, "app", "ml_engine", "weights", "wound_segment_edge_unet.onnx")
    onnx_model = onnx.load(model_path)
    onnx.checker.check_model(onnx_model)

    ort_session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    dummy_input = np.random.randn(1, 3, 224, 224).astype(np.float32)

    # Benchmark ONNX execution time
    t0 = time.perf_counter()
    outputs = ort_session.run(["output"], {"input": dummy_input})
    onnx_elapsed_ms = (time.perf_counter() - t0) * 1000

    mask = outputs[0]
    assert mask.shape == (1, 1, 224, 224), f"Expected shape (1, 1, 224, 224), got {mask.shape}"
    print(f"  [PASS] Attention U-Net ONNX Output Shape: {mask.shape} (Latency: {onnx_elapsed_ms:.1f}ms)")

    # Verify PyTorch parity
    weights_path = os.path.join(backend_dir, "app", "ml_engine", "weights", "wound_segment_attention_unet.pth")
    pt_model = AttentionUNet(in_channels=3, out_channels=1)
    if os.path.exists(weights_path):
        state_dict = torch.load(weights_path, map_location="cpu", weights_only=True)
        pt_model.load_state_dict(state_dict, strict=False)
    pt_model.eval()
    pt_model.cpu()

    with torch.no_grad():
        pt_out = pt_model(torch.from_numpy(dummy_input)).numpy()

    max_diff = np.max(np.abs(pt_out - mask))
    print(f"  [PASS] Attention U-Net Max Abs Difference vs PyTorch: {max_diff:.2e}")
    assert max_diff < 1e-3, f"Parity difference too large: {max_diff}"


if __name__ == "__main__":
    print("================================================================")
    print("🔬 RUNNING HEAL6 OFFLINE EDGE INFERENCE TEST SUITE (PILLAR 4)")
    print("================================================================")
    test_exported_files_exist()
    test_convnext_edge_inference()
    test_unet_edge_inference()
    print("================================================================")
    print("🎉 ALL OFFLINE EDGE INFERENCE TESTS PASSED PERFECTLY!")
    print("================================================================")
