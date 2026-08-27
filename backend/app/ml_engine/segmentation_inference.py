import os
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision.transforms import functional as F


# ==========================================
# 1. MODEL ARCHITECTURE (Matches Training)
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
# 2. INFERENCE ENGINE WITH TTA
# ==========================================
IMAGE_SIZE = 224
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_seg_model = None


def load_segmentation_model():
    """Loads Attention U-Net weights into memory."""
    global _seg_model
    if _seg_model is not None:
        return _seg_model

    script_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(script_dir, "weights", "wound_segment_attention_unet.pth")

    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Segmentation weights not found at: {weights_path}")

    model = AttentionUNet(in_channels=3, out_channels=1)
    model.load_state_dict(torch.load(weights_path, map_location=device, weights_only=True))
    model = model.to(device)
    model.eval()

    _seg_model = model
    return _seg_model


def predict_wound_mask(image: Image.Image, threshold: float = 0.5) -> dict:
    """
    Accepts a PIL Image, runs Test-Time Augmentation (TTA) for max accuracy,
    and returns pixel metrics scaled to the original image dimensions.
    """
    orig_w, orig_h = image.size
    model = load_segmentation_model()

    # Preprocess
    resized_img = image.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.BILINEAR)
    input_tensor = F.to_tensor(resized_img)
    input_tensor = F.normalize(input_tensor, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    input_tensor = input_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        # 1. Original Prediction
        out_orig = torch.sigmoid(model(input_tensor))

        # 2. Horizontal Flip TTA
        input_hf = torch.flip(input_tensor, [3])
        out_hf = torch.sigmoid(model(input_hf))
        out_hf_rev = torch.flip(out_hf, [3])

        # 3. Vertical Flip TTA
        input_vf = torch.flip(input_tensor, [2])
        out_vf = torch.sigmoid(model(input_vf))
        out_vf_rev = torch.flip(out_vf, [2])

        # 4. Ensembled Average
        prob_map = ((out_orig + out_hf_rev + out_vf_rev) / 3.0).squeeze().cpu().numpy()

    # Binary thresholding
    binary_mask_224 = (prob_map > threshold).astype(np.uint8)

    # Scale back to original resolution
    mask_pil = Image.fromarray(binary_mask_224 * 255).resize((orig_w, orig_h), Image.Resampling.NEAREST)
    full_res_mask = np.array(mask_pil) > 0

    total_wound_pixels = int(np.sum(full_res_mask))
    total_image_pixels = orig_w * orig_h
    wound_coverage_percent = round((total_wound_pixels / total_image_pixels) * 100, 2)

    return {
        "mask_pixel_count": total_wound_pixels,
        "coverage_percentage": wound_coverage_percent,
        "is_wound_detected": total_wound_pixels > 50
    }


# ==========================================
# 3. TEST INFERENCE LOCALLY
# ==========================================
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_img = os.path.abspath(os.path.join(
        script_dir, "../../../ml_training/data/task2_area_segment/validation/images/0001.png"
    ))

    try:
        sample = Image.open(test_img).convert("RGB")
        res = predict_wound_mask(sample)
        print("\n🔍 Segmentation Inference Result (with TTA):")
        print(f"Mask Pixel Count:    {res['mask_pixel_count']} px")
        print(f"Coverage Percentage: {res['coverage_percentage']}%")
        print(f"Wound Detected:      {res['is_wound_detected']}")
    except Exception as e:
        print(f"Segmentation Test Error: {e}")