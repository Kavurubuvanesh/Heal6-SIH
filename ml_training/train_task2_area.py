import os
import time
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.transforms import functional as F
from PIL import Image

# ==========================================
# 1. HYPERPARAMETERS
# ==========================================
BATCH_SIZE = 16
NUM_EPOCHS = 25
LEARNING_RATE = 5e-4
WEIGHT_DECAY = 1e-4
IMAGE_SIZE = 224

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ==========================================
# 2. DATASET LOADER
# ==========================================
class DFUSegmentationDataset(Dataset):
    def __init__(self, root_dir, is_train=True):
        self.images_dir = os.path.join(root_dir, "images")
        self.labels_dir = os.path.join(root_dir, "labels")
        self.is_train = is_train

        img_names = set(os.listdir(self.images_dir))
        lbl_names = set(os.listdir(self.labels_dir))
        self.valid_files = list(img_names.intersection(lbl_names))

    def __len__(self):
        return len(self.valid_files)

    def __getitem__(self, idx):
        img_name = self.valid_files[idx]
        image = Image.open(os.path.join(self.images_dir, img_name)).convert("RGB")
        mask = Image.open(os.path.join(self.labels_dir, img_name)).convert("L")

        image = image.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.BILINEAR)
        mask = mask.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.NEAREST)

        image = F.to_tensor(image)
        mask = F.to_tensor(mask)

        image = F.normalize(image, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        return image, mask


# ==========================================
# 3. INDUSTRY-GRADE ATTENTION U-NET
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
    """
    The Wow Factor: Dynamically suppresses background noise and highlights wound features.
    """

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

        # Encoder
        self.e1 = ConvBlock(in_channels, 64)
        self.e2 = ConvBlock(64, 128)
        self.e3 = ConvBlock(128, 256)

        # Bottleneck
        self.bottleneck = ConvBlock(256, 512)

        # Decoder with Attention
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
# 4. ADVANCED MEDICAL LOSS FUNCTION
# ==========================================
class DiceBCELoss(nn.Module):
    """Combines Cross Entropy with Dice Score for flawless boundary tracking."""

    def __init__(self):
        super().__init__()
        self.bce = nn.BCEWithLogitsLoss()

    def forward(self, inputs, targets, smooth=1):
        bce_loss = self.bce(inputs, targets)
        inputs = torch.sigmoid(inputs).view(-1)
        targets = targets.view(-1)

        intersection = (inputs * targets).sum()
        dice_loss = 1 - ((2. * intersection + smooth) / (inputs.sum() + targets.sum() + smooth))

        return bce_loss + dice_loss


def calculate_iou(preds, masks, threshold=0.5):
    preds = (torch.sigmoid(preds) > threshold).float()
    intersection = (preds * masks).sum()
    union = (preds + masks).sum() - intersection
    if union == 0:
        return 1.0
    return (intersection / union).item()


# ==========================================
# 5. TRAINING ENGINE
# ==========================================
def train_model(model, train_loader, val_loader, optimizer, scheduler, device, num_epochs, save_path):
    print(f"\n🚀 Training Clinical Attention U-Net on: {device}")

    criterion = DiceBCELoss()
    best_iou = 0.0
    best_model_wts = copy.deepcopy(model.state_dict())

    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch + 1}/{num_epochs}")
        print("-" * 35)

        for phase in ['train', 'val']:
            model.train() if phase == 'train' else model.eval()
            dataloader = train_loader if phase == 'train' else val_loader

            running_loss = 0.0
            running_iou = 0.0

            for inputs, masks in dataloader:
                inputs, masks = inputs.to(device), masks.to(device)
                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    loss = criterion(outputs, masks)
                    iou = calculate_iou(outputs, masks)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_iou += iou * inputs.size(0)

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_iou = running_iou / len(dataloader.dataset)

            lr = optimizer.param_groups[0]['lr']
            print(f"[{phase.upper()}] Loss: {epoch_loss:.4f} | IoU Score: {epoch_iou:.4f} | LR: {lr:.6f}")

            # Save strictly based on IoU performance, not loss
            if phase == 'val' and epoch_iou > best_iou:
                best_iou = epoch_iou
                best_model_wts = copy.deepcopy(model.state_dict())
                torch.save(best_model_wts, save_path)
                print(f"🌟 SOTA Weights Checkpoint Saved! New Best IoU: {best_iou:.4f}")

        scheduler.step()

    print("\n✅ Training Complete!")
    return model


# ==========================================
# 6. EXECUTION
# ==========================================
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Automatically search candidate locations for task2_area_segment
    candidate_paths = [
        os.path.join(current_dir, "task2_area_segment"),
        os.path.join(current_dir, "data", "task2_area_segment"),
        os.path.abspath(os.path.join(current_dir, "..", "data", "task2_area_segment")),
        os.path.abspath(os.path.join(current_dir, "..", "ml_training", "data", "task2_area_segment")),
    ]

    data_root = None
    for path in candidate_paths:
        if os.path.exists(path):
            data_root = path
            break

    if data_root is None:
        raise FileNotFoundError(
            f"Could not locate 'task2_area_segment' folder. Checked:\n" + "\n".join(candidate_paths)
        )

    train_dir = os.path.join(data_root, "train")
    val_dir = os.path.join(data_root, "validation")

    # Locate backend weights directory by searching upwards for 'backend'
    search_dir = current_dir
    backend_dir = None
    for _ in range(4):
        check_path = os.path.join(search_dir, "backend")
        if os.path.exists(check_path):
            backend_dir = check_path
            break
        search_dir = os.path.dirname(search_dir)

    if backend_dir is None:
        # Fallback to standard relative path
        backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))

    weights_dir = os.path.join(backend_dir, "app", "ml_engine", "weights")
    os.makedirs(weights_dir, exist_ok=True)
    model_save_path = os.path.join(weights_dir, "wound_segment_attention_unet.pth")

    print(f"📁 Dataset Directory: {data_root}")
    print(f"💾 Model Target:     {model_save_path}")

    try:
        train_dataset = DFUSegmentationDataset(train_dir, is_train=True)
        val_dataset = DFUSegmentationDataset(val_dir, is_train=False)

        train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
        val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

        print(f"📊 Training Pairs: {len(train_dataset)} | Validation Pairs: {len(val_dataset)}")

        model = AttentionUNet(in_channels=3, out_channels=1).to(device)

        optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-6)

        train_model(model, train_loader, val_loader, optimizer, scheduler, device, NUM_EPOCHS, model_save_path)

    except Exception as e:
        print(f"Execution Error: {e}")