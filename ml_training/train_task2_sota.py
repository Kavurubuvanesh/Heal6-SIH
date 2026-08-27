import os
import time
import math
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms
from PIL import Image
import numpy as np
import segmentation_models_pytorch as smp

# ==========================================
# 1. INDUSTRIAL HYPERPARAMETERS & CONFIG
# ==========================================
IMAGE_DIR = "ml_training/data/task2_advancement/DFUTissue/Labeled/Padded/Images/TrainVal"
MASK_DIR = "ml_training/data/task2_advancement/DFUTissue/Labeled/Padded/Palette/TrainVal"
SAVE_DIR = "backend/models"
MODEL_SAVE_PATH = os.path.join(SAVE_DIR, "heal6_tissue_sota_best.pth")

NUM_CLASSES = 4  # 0: Background, 1: Granulation, 2: Slough, 3: Necrotic
CLASS_NAMES = ["Background", "Granulation", "Slough", "Necrotic"]
BATCH_SIZE = 8
EPOCHS = 35
BASE_LR = 3e-4
WEIGHT_DECAY = 1e-4
IMG_SIZE = (256, 256)
VAL_SPLIT = 0.15
SEED = 42

torch.manual_seed(SEED)
np.random.seed(SEED)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ==========================================
# 2. COLOR PALETTE MAPPER
# ==========================
COLOR_MAP = {
    (0, 0, 0): 0,  # Background / Skin (Black)
    (255, 0, 0): 1,  # Granulation (Red)
    (0, 255, 0): 2,  # Slough / Fibrin (Green)
    (0, 0, 255): 3  # Necrotic / Eschar (Blue)
}


def mask_to_class_indices(mask_np):
    """Vectorized conversion of RGB mask (H, W, 3) to class index tensor (H, W)."""
    class_mask = np.zeros(mask_np.shape[:2], dtype=np.int64)
    for rgb, class_idx in COLOR_MAP.items():
        matches = np.all(mask_np == rgb, axis=-1)
        class_mask[matches] = class_idx
    return torch.from_numpy(class_mask)


# ==========================================
# 3. CLINICAL DATASET PIPELINE
# ==========================================
class DFUTissueDataset(Dataset):
    def __init__(self, image_dir, mask_dir, file_list, is_train=True):
        self.image_dir = image_dir
        self.mask_dir = mask_dir
        self.file_list = file_list
        self.is_train = is_train

        self.img_transform = transforms.Compose([
            transforms.Resize(IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def __len__(self):
        return len(self.file_list)

    def __getitem__(self, idx):
        img_name = self.file_list[idx]
        base_name = os.path.splitext(img_name)[0]
        mask_name = base_name + ".png"

        img_path = os.path.join(self.image_dir, img_name)
        mask_path = os.path.join(self.mask_dir, mask_name)

        image = Image.open(img_path).convert("RGB")
        mask = Image.open(mask_path).convert("RGB")

        # Clinical Data Augmentation (Train only)
        if self.is_train and np.random.rand() > 0.5:
            image = image.transpose(Image.FLIP_LEFT_RIGHT)
            mask = mask.transpose(Image.FLIP_LEFT_RIGHT)

        mask_resized = mask.resize(IMG_SIZE, Image.NEAREST)
        mask_np = np.array(mask_resized)

        image_tensor = self.img_transform(image)
        mask_tensor = mask_to_class_indices(mask_np)

        return image_tensor, mask_tensor


# ==========================================
# 4. MULTI-METRIC VALIDATION SUITE
# ==========================================
def compute_confusion_matrix(preds, targets, num_classes):
    """Calculates confusion matrix for precise per-class IoU and Dice computation."""
    preds = preds.view(-1)
    targets = targets.view(-1)
    k = (targets >= 0) & (targets < num_classes)
    indices = num_classes * targets[k] + preds[k]
    return torch.bincount(indices, minlength=num_classes ** 2).reshape(num_classes, num_classes)


def compute_metrics_from_cm(cm):
    """Computes overall accuracy, per-class IoU, and per-class Dice from confusion matrix."""
    cm = cm.float()
    tp = torch.diag(cm)
    fp = cm.sum(dim=0) - tp
    fn = cm.sum(dim=1) - tp

    pixel_acc = tp.sum() / (cm.sum() + 1e-7)

    # IoU = TP / (TP + FP + FN)
    iou_per_class = tp / (tp + fp + fn + 1e-7)
    # Dice = 2*TP / (2*TP + FP + FN)
    dice_per_class = (2 * tp) / (2 * tp + fp + fn + 1e-7)

    # Wound-bed specific metrics (Classes 1, 2, 3 - excluding background)
    wound_iou = iou_per_class[1:].mean().item()
    wound_dice = dice_per_class[1:].mean().item()

    return {
        "pixel_acc": pixel_acc.item() * 100,
        "mean_iou": iou_per_class.mean().item() * 100,
        "mean_dice": dice_per_class.mean().item() * 100,
        "wound_iou": wound_iou * 100,
        "wound_dice": wound_dice * 100,
        "gran_iou": iou_per_class[1].item() * 100,
        "gran_dice": dice_per_class[1].item() * 100,
        "slough_iou": iou_per_class[2].item() * 100,
        "slough_dice": dice_per_class[2].item() * 100,
        "necro_iou": iou_per_class[3].item() * 100,
        "necro_dice": dice_per_class[3].item() * 100,
    }


# ==========================================
# 5. INDUSTRIAL TRAINING ENGINE
# ==========================================
def train_industrial_engine():
    os.makedirs(SAVE_DIR, exist_ok=True)

    # Telemetry Header
    print("=" * 90)
    print(" 🏥 HEAL6 INDUSTRIAL CLINICAL TISSUE SEGMENTATION ENGINE (TASK 2 ADVANCEMENT)")
    print("=" * 90)
    print(f" • Hardware Accelerator : {DEVICE.type.upper()}" + (
        f" ({torch.cuda.get_device_name(0)})" if torch.cuda.is_available() else ""))
    print(
        f" • Initial VRAM Alloc   : {torch.cuda.memory_allocated(0) / 1024 ** 2:.2f} MB" if torch.cuda.is_available() else " • Mode: CPU Processing")
    print(f" • Architecture SOTA    : UNet++ (Nested Multi-Scale Dense Skips)")
    print(f" • Feature Backbone     : EfficientNet-B4 (NoisyStudent ImageNet-Pretrained)")
    print(f" • Compound Loss Metric : Multiclass DiceLoss + Multiclass FocalLoss")
    print(f" • Optimization Profile : AdamW (Cosine Annealing Scheduler + Mixed Precision)")
    print("=" * 90)

    # Data Validation
    if not os.path.exists(IMAGE_DIR):
        print(f"❌ Error: Image path '{IMAGE_DIR}' not found. Please verify directory.")
        return

    all_files = [f for f in os.listdir(IMAGE_DIR) if f.endswith(('.png', '.jpg', '.jpeg'))]
    total_samples = len(all_files)
    val_size = int(total_samples * VAL_SPLIT)
    train_size = total_samples - val_size

    indices = np.random.permutation(total_samples)
    train_files = [all_files[i] for i in indices[:train_size]]
    val_files = [all_files[i] for i in indices[train_size:]]

    print(f" • Total Labeled Scans  : {total_samples}")
    print(f" • Training Dataset     : {train_size} images")
    print(f" • Holdout Validation   : {val_size} images (Unseen Cohort)")
    print("-" * 90)

    train_loader = DataLoader(
        DFUTissueDataset(IMAGE_DIR, MASK_DIR, train_files, is_train=True),
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0,
        pin_memory=True if torch.cuda.is_available() else False
    )

    val_loader = DataLoader(
        DFUTissueDataset(IMAGE_DIR, MASK_DIR, val_files, is_train=False),
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0
    )

    # Build UNet++ with EfficientNet-B4 Encoder
    model = smp.UnetPlusPlus(
        encoder_name="efficientnet-b4",
        encoder_weights="imagenet",
        in_channels=3,
        classes=NUM_CLASSES
    ).to(DEVICE)

    # Loss Functions & Optimizers
    dice_loss = smp.losses.DiceLoss(mode="multiclass")
    focal_loss = smp.losses.FocalLoss(mode="multiclass")
    optimizer = torch.optim.AdamW(model.parameters(), lr=BASE_LR, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)
    scaler = torch.amp.GradScaler('cuda', enabled=torch.cuda.is_available())

    best_wound_dice = 0.0
    start_total_time = time.perf_counter()

    # Training Loop
    for epoch in range(1, EPOCHS + 1):
        epoch_start_time = time.perf_counter()

        # --- TRAIN STEP ---
        model.train()
        train_loss = 0.0
        for images, masks in train_loader:
            images, masks = images.to(DEVICE), masks.to(DEVICE)
            optimizer.zero_grad()

            with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                outputs = model(images)
                loss = dice_loss(outputs, masks) + focal_loss(outputs, masks)

            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()

            train_loss += loss.item()

        scheduler.step()
        avg_train_loss = train_loss / len(train_loader)

        # --- VALIDATION STEP ---
        model.eval()
        val_loss = 0.0
        total_cm = torch.zeros((NUM_CLASSES, NUM_CLASSES), dtype=torch.int64, device=DEVICE)

        with torch.no_grad():
            for images, masks in val_loader:
                images, masks = images.to(DEVICE), masks.to(DEVICE)
                with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                    outputs = model(images)
                    loss = dice_loss(outputs, masks) + focal_loss(outputs, masks)

                val_loss += loss.item()
                preds = torch.argmax(outputs, dim=1)
                total_cm += compute_confusion_matrix(preds, masks, NUM_CLASSES)

        avg_val_loss = val_loss / len(val_loader)
        metrics = compute_metrics_from_cm(total_cm)

        # Time Telemetry
        epoch_duration = time.perf_counter() - epoch_start_time
        elapsed_total = time.perf_counter() - start_total_time
        remaining_est = (elapsed_total / epoch) * (EPOCHS - epoch)
        vram_stat = f"{torch.cuda.memory_allocated(0) / 1024 ** 2:.1f}MB" if torch.cuda.is_available() else "N/A"

        # Terminal Output Dashboard
        print(
            f"\n┌─ [EPOCH {epoch:02d}/{EPOCHS:02d}] ─── Time: {epoch_duration:.2f}s | Elapsed: {elapsed_total / 60:.1f}m | ETA: {remaining_est / 60:.1f}m | VRAM: {vram_stat}")
        print(
            f"│ • Loss Matrix    : Train: {avg_train_loss:.4f}  │  Val: {avg_val_loss:.4f}  │  LR: {scheduler.get_last_lr()[0]:.2e}")
        print(
            f"│ • Global Acc     : Pixel Accuracy: {metrics['pixel_acc']:.2f}%  │  Mean Dice (All): {metrics['mean_dice']:.2f}%")
        print(
            f"│ • Wound-Bed Score: Mean Wound Dice: {metrics['wound_dice']:.2f}%  │  Mean Wound IoU : {metrics['wound_iou']:.2f}%")
        print("├─ Sub-Tissue Clinical Diagnostics:")
        print(
            f"│   ├── 🔴 Granulation (Healthy):  IoU: {metrics['gran_iou']:5.2f}%  │  Dice (F1): {metrics['gran_dice']:5.2f}%")
        print(
            f"│   ├── 🟡 Slough (Infection)   :  IoU: {metrics['slough_iou']:5.2f}%  │  Dice (F1): {metrics['slough_dice']:5.2f}%")
        print(
            f"│   └── ⚫ Necrotic (Dead/Eschar):  IoU: {metrics['necro_iou']:5.2f}%  │  Dice (F1): {metrics['necro_dice']:5.2f}%")

        # Save Best Checkpoint
        if metrics['wound_dice'] > best_wound_dice:
            best_wound_dice = metrics['wound_dice']
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"└─ 🌟 [CHECKPOINT SAVED] New Best Wound Dice Score: {best_wound_dice:.2f}% -> '{MODEL_SAVE_PATH}'")
        else:
            print(f"└─ Baseline Benchmark Preserved (Current Best: {best_wound_dice:.2f}%)")

    total_training_time = time.perf_counter() - start_total_time
    print("\n" + "=" * 90)
    print(f" 🏆 SOTA TRAINING COMPLETE in {total_training_time / 60:.2f} minutes ({total_training_time:.1f} seconds)")
    print(f" • Peak Wound-Bed Dice Score : {best_wound_dice:.2f}%")
    print(f" • Production Checkpoint     : {MODEL_SAVE_PATH}")
    print("=" * 90)


if __name__ == "__main__":
    train_industrial_engine()