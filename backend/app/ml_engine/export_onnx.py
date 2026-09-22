"""
Heal6 Neural Model Export Pipeline to ONNX for WebGL / Wasm Edge Inference.
Converts:
1. ConvNeXt-Tiny Ulcer & Infection Classifier -> wound_detect_convnext.onnx
2. Attention U-Net Edge Wound Segmenter -> wound_segment_edge_unet.onnx
Validates parity between PyTorch and ONNX Runtime.
Deploys exported models to public/models directories for client-side edge execution.
"""
import os
import sys
import shutil

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import torch
import numpy as np
import onnx
import onnxruntime as ort

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.ml_engine.inference import load_model as load_convnext_model
from app.ml_engine.segmentation_inference import AttentionUNet


def export_convnext_to_onnx(output_path: str):
    """Exports ConvNeXt classifier to ONNX format."""
    print("📦 [1/4] Loading PyTorch ConvNeXt model...")
    model = load_convnext_model()
    model.eval()
    model.cpu()

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    print(f"🔄 [2/4] Exporting ConvNeXt to ONNX: {output_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}},
        dynamo=False
    )

    # Validate ONNX graph
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("✅ ConvNeXt ONNX graph verified.")

    # Numerical Parity Check
    with torch.no_grad():
        pt_out = model(dummy_input).numpy()

    ort_session = ort.InferenceSession(output_path, providers=["CPUExecutionProvider"])
    ort_inputs = {"input": dummy_input.numpy()}
    ort_out = ort_session.run(["logits"], ort_inputs)[0]

    max_diff = np.max(np.abs(pt_out - ort_out))
    print(f"📊 ConvNeXt Max Absolute Difference (PyTorch vs ONNX): {max_diff:.2e}")
    assert max_diff < 1e-3, f"Parity difference too large: {max_diff}"
    print("✅ ConvNeXt numerical parity check passed!\n")


def export_unet_to_onnx(output_path: str):
    """Exports Attention U-Net segmenter to ONNX format."""
    print("📦 [3/4] Loading PyTorch Attention U-Net model...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(script_dir, "weights", "wound_segment_attention_unet.pth")

    model = AttentionUNet(in_channels=3, out_channels=1)
    if os.path.exists(weights_path):
        state_dict = torch.load(weights_path, map_location="cpu", weights_only=True)
        model.load_state_dict(state_dict, strict=False)
        print("✅ Loaded trained weights into AttentionUNet.")
    else:
        print("⚠️ AttentionUNet weights not found, exporting baseline architecture.")

    model.eval()
    model.cpu()

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    print(f"🔄 [4/4] Exporting Attention U-Net to ONNX: {output_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        dynamo=False
    )

    # Validate ONNX graph
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("✅ Attention U-Net ONNX graph verified.")

    # Numerical Parity Check
    with torch.no_grad():
        pt_out = model(dummy_input).numpy()

    ort_session = ort.InferenceSession(output_path, providers=["CPUExecutionProvider"])
    ort_inputs = {"input": dummy_input.numpy()}
    ort_out = ort_session.run(["output"], ort_inputs)[0]

    max_diff = np.max(np.abs(pt_out - ort_out))
    print(f"📊 Attention U-Net Max Absolute Difference (PyTorch vs ONNX): {max_diff:.2e}")
    assert max_diff < 1e-3, f"Parity difference too large: {max_diff}"
    print("✅ Attention U-Net numerical parity check passed!\n")


def deploy_to_client_apps(exported_files: list):
    """Copies exported ONNX models into frontend public directories."""
    repo_root = os.path.dirname(backend_dir)
    target_dirs = [
        os.path.join(repo_root, "heal6-patient-app", "public", "models"),
        os.path.join(repo_root, "doctor_web_frontend", "public", "models")
    ]

    for target_dir in target_dirs:
        os.makedirs(target_dir, exist_ok=True)
        for src in exported_files:
            dest = os.path.join(target_dir, os.path.basename(src))
            shutil.copyfile(src, dest)
            size_mb = os.path.getsize(dest) / (1024 * 1024)
            print(f"🚀 Deployed {os.path.basename(src)} ({size_mb:.2f} MB) -> {dest}")


if __name__ == "__main__":
    print("================================================================")
    print("🚀 HEAL6 NEURAL MODEL ONNX EDGE CONVERSION PIPELINE")
    print("================================================================")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    weights_dir = os.path.join(script_dir, "weights")
    os.makedirs(weights_dir, exist_ok=True)

    convnext_onnx = os.path.join(weights_dir, "wound_detect_convnext.onnx")
    unet_onnx = os.path.join(weights_dir, "wound_segment_edge_unet.onnx")

    export_convnext_to_onnx(convnext_onnx)
    export_unet_to_onnx(unet_onnx)

    deploy_to_client_apps([convnext_onnx, unet_onnx])

    print("================================================================")
    print("🎉 ALL MODELS EXPORTED & DEPLOYED FOR CLIENT-SIDE EDGE INFERENCE!")
    print("================================================================")
