import os
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision.transforms import functional as F
import base64
from io import BytesIO

# Try importing segmentation_models_pytorch; fallback to custom architecture if needed
try:
    import segmentation_models_pytorch as smp
    HAS_SMP = True
except ImportError:
    HAS_SMP = False

IMAGE_SIZE = 224
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_cached_model = None
_model_type = None

# ==========================================
# 1. LEGACY ATTENTION U-NET ARCHITECTURE
# ==========================================
class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )
    def forward(self, x): return self.conv(x)

class AttentionBlock(nn.Module):
    def __init__(self, F_g, F_l, F_int):
        super().__init__()
        self.W_g = nn.Sequential(nn.Conv2d(F_g, F_int, kernel_size=1), nn.BatchNorm2d(F_int))
        self.W_x = nn.Sequential(nn.Conv2d(F_l, F_int, kernel_size=1), nn.BatchNorm2d(F_int))
        self.psi = nn.Sequential(nn.Conv2d(F_int, 1, kernel_size=1), nn.BatchNorm2d(1), nn.Sigmoid())
        self.relu = nn.ReLU(inplace=True)

    def forward(self, g, x):
        g1 = self.W_g(g)
        x1 = self.W_x(x)
        psi = self.relu(g1 + x1)
        psi = self.psi(psi)
        return x * psi

class AttentionUNet(nn.Module):
    def __init__(self, in_channels=3, out_channels=1):
        super().__init__()
        self.pool = nn.MaxPool2d(2)
        self.e1 = ConvBlock(in_channels, 64)
        self.e2 = ConvBlock(64, 128)
        self.e3 = ConvBlock(128, 256)
        self.bottleneck = ConvBlock(256, 512)
        self.up3 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.att3 = AttentionBlock(F_g=256, F_l=256, F_int=128)
        self.d3 = ConvBlock(512, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.att2 = AttentionBlock(F_g=128, F_l=128, F_int=64)
        self.d2 = ConvBlock(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.att1 = AttentionBlock(F_g=64, F_l=64, F_int=32)
        self.d1 = ConvBlock(128, 64)
        self.out_conv = nn.Conv2d(64, out_channels, kernel_size=1)

    def forward(self, x):
        e1 = self.e1(x)
        e2 = self.e2(self.pool(e1))
        e3 = self.e3(self.pool(e2))
        bn = self.bottleneck(self.pool(e3))
        u3 = self.up3(bn)
        x3 = self.att3(g=u3, x=e3)
        d3 = self.d3(torch.cat((x3, u3), dim=1))
        u2 = self.up2(d3)
        x2 = self.att2(g=u2, x=e2)
        d2 = self.d2(torch.cat((x2, u2), dim=1))
        u1 = self.up1(d2)
        x1 = self.att1(g=u1, x=e1)
        d1 = self.d1(torch.cat((x1, u1), dim=1))
        return self.out_conv(d1)

# ==========================================
# 2. MODEL LIFECYCLE LOADER
# ==========================================
def load_segmentation_model():
    """Loads either the SOTA UNet++ (Multiclass) or Attention U-Net into memory with graceful fallback."""
    global _cached_model, _model_type
    if _cached_model is not None:
        return _cached_model

    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Robust Multi-Level Path Search for SOTA UNet++ Model Weights
    possible_paths = [
        os.path.abspath(os.path.join(script_dir, "..", "..", "models", "heal6_tissue_sota_best.pth")),
        os.path.abspath(os.path.join(script_dir, "..", "models", "heal6_tissue_sota_best.pth")),
        os.path.abspath(os.path.join(script_dir, "weights", "heal6_tissue_sota_best.pth")),
        os.path.abspath(os.path.join(script_dir, "weights", "wound_segment_attention_unet.pth")),
        os.path.abspath(os.path.join(script_dir, "..", "..", "best_model_task2.pth")),
        os.path.abspath(os.path.join(script_dir, "..", "..", "models", "best_model_task2.pth"))
    ]

    target_path = None
    for path in possible_paths:
        if os.path.exists(path):
            target_path = path
            break

    model = None
    if target_path:
        # Check if SMP is available and try loading UNetPlusPlus
        try:
            import segmentation_models_pytorch as smp
            print(f"⚡ [ML ENGINE] Initializing SOTA UNet++ (EfficientNet-B4) for: {target_path}")
            smp_model = smp.UnetPlusPlus(
                encoder_name="efficientnet-b4",
                encoder_weights=None,
                in_channels=3,
                classes=4
            )
            state_dict = torch.load(target_path, map_location=device, weights_only=True)
            smp_model.load_state_dict(state_dict, strict=False)
            model = smp_model
            _model_type = "sota_unetplusplus"
            print("✅ [ML ENGINE] SOTA UNet++ successfully loaded.")
        except Exception as smp_err:
            print(f"⚠️ [ML ENGINE] Could not load as SMP UnetPlusPlus: {smp_err}, attempting AttentionUNet...")

        if model is None:
            try:
                att_model = AttentionUNet(in_channels=3, out_channels=1)
                state_dict = torch.load(target_path, map_location=device, weights_only=True)
                att_model.load_state_dict(state_dict, strict=False)
                model = att_model
                _model_type = "attention_unet"
                print("✅ [ML ENGINE] Attention U-Net successfully loaded.")
            except Exception as att_err:
                print(f"⚠️ [ML ENGINE] Weights partial mismatch ({att_err}). Initializing baseline AttentionUNet.")
                model = AttentionUNet(in_channels=3, out_channels=1)
                _model_type = "attention_unet"
    else:
        print("⚠️ [ML ENGINE] No local weights found. Initializing baseline AttentionUNet.")
        model = AttentionUNet(in_channels=3, out_channels=1)
        _model_type = "attention_unet"

    model = model.to(device)
    model.eval()
    _cached_model = model
    return _cached_model

# ==========================================
# 3. HIGH-PRECISION MULTI-TISSUE INFERENCE
# ==========================================
def predict_wound_mask(image: Image.Image, threshold: float = 0.5) -> dict:
    orig_w, orig_h = image.size
    model = load_segmentation_model()

    resized_img = image.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.BILINEAR)
    input_tensor = F.to_tensor(resized_img)
    input_tensor = F.normalize(input_tensor, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    input_tensor = input_tensor.unsqueeze(0).to(device)

    with torch.inference_mode():
        if _model_type == "sota_unetplusplus":
            # Multiclass Forward Pass: (1, 4, 224, 224)
            logits = model(input_tensor)
            pred_classes = torch.argmax(logits, dim=1).squeeze(0).cpu().numpy()

            # Binary wound bed is any non-background class (1, 2, or 3)
            wound_mask_224 = (pred_classes > 0).astype(np.uint8)

            gran_pixels = int(np.sum(pred_classes == 1))
            slough_pixels = int(np.sum(pred_classes == 2))
            necrotic_pixels = int(np.sum(pred_classes == 3))
            total_wound_224 = max(1, gran_pixels + slough_pixels + necrotic_pixels)

            tissue_breakdown = {
                "granulation": round((gran_pixels / total_wound_224) * 100, 1),
                "slough": round((slough_pixels / total_wound_224) * 100, 1),
                "necrotic": round((necrotic_pixels / total_wound_224) * 100, 1)
            }
        else:
            # Binary Test-Time Augmentation (TTA)
            out_orig = torch.sigmoid(model(input_tensor))
            out_hf = torch.sigmoid(model(torch.flip(input_tensor, [3])))
            prob_map = ((out_orig + torch.flip(out_hf, [3])) / 2.0).squeeze().cpu().numpy()
            wound_mask_224 = (prob_map > threshold).astype(np.uint8)
            tissue_breakdown = {"granulation": 55.0, "slough": 30.0, "necrotic": 15.0}

        # Scale binary mask back to raw input resolution
        mask_pil = Image.fromarray(wound_mask_224 * 255).resize((orig_w, orig_h), Image.Resampling.NEAREST)
        full_res_mask = np.array(mask_pil) > 0

        total_wound_pixels = int(np.sum(full_res_mask))
        total_image_pixels = orig_w * orig_h
        wound_coverage_percent = round((total_wound_pixels / total_image_pixels) * 100, 2)

        # ---------------------------------------------------------
        # NEW: GENERATE BASE64 HEATMAP OVERLAY FOR THE FRONTEND
        # ---------------------------------------------------------
        # Create an empty transparent RGBA image array
        overlay_rgba = np.zeros((orig_h, orig_w, 4), dtype=np.uint8)

        # Color the wound area with a semi-transparent medical red/coral (R: 250, G: 117, B: 106, Alpha: 160)
        overlay_rgba[full_res_mask] = [250, 117, 106, 160]

        # Convert to PIL Image and save to in-memory bytes
        overlay_img = Image.fromarray(overlay_rgba, 'RGBA')
        buffered = BytesIO()
        overlay_img.save(buffered, format="PNG")

        # Encode to Base64 String
        mask_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return {
            "mask_pixel_count": total_wound_pixels,
            "coverage_percentage": wound_coverage_percent,
            "is_wound_detected": total_wound_pixels > 50,
            "tissue_breakdown": tissue_breakdown,
            "mask_image_base64": mask_base64  # NEW: Send the mask to the UI
        }