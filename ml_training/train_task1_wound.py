import os
import time
import copy
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, Subset

# ==========================================
# 1. HYPERPARAMETERS & SETUP
# ==========================================
BATCH_SIZE = 32
NUM_EPOCHS = 20
LEARNING_RATE = 5e-4
WEIGHT_DECAY = 1e-2
IMAGE_SIZE = 224

# Data Augmentation (Simulating harsh real-world smartphone conditions)
train_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.5),
    transforms.RandomRotation(degrees=20),
    transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.2),
    transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def get_dataloaders(patches_dir: str):
    full_dataset_train = datasets.ImageFolder(root=patches_dir, transform=train_transforms)
    full_dataset_val = datasets.ImageFolder(root=patches_dir, transform=val_transforms)

    total_size = len(full_dataset_train)
    train_size = int(0.8 * total_size)

    torch.manual_seed(42)
    indices = torch.randperm(total_size).tolist()

    train_dataset = Subset(full_dataset_train, indices[:train_size])
    val_dataset = Subset(full_dataset_val, indices[train_size:])

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    return train_loader, val_loader, full_dataset_train.classes


# ==========================================
# 2. MODEL FACTORY (ConvNeXt Architecture)
# ==========================================
def build_wound_classifier(num_classes: int = 2) -> nn.Module:
    """
    Builds a ConvNeXt-Tiny classifier with a custom clinical head.
    """
    # Load ImageNet-1k pre-trained weights
    weights = models.ConvNeXt_Tiny_Weights.DEFAULT
    model = models.convnext_tiny(weights=weights)

    # Freeze early feature extractors, train deeper blocks
    for param in model.features[:4].parameters():
        param.requires_grad = False

    # Replace classifier head with normalized regularization
    in_features = model.classifier[2].in_features
    model.classifier = nn.Sequential(
        model.classifier[0],  # LayerNorm2d
        model.classifier[1],  # Flatten
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 256),
        nn.GELU(),
        nn.Dropout(p=0.2),
        nn.Linear(256, num_classes)
    )
    return model


# ==========================================
# 3. TRAINING ENGINE
# ==========================================
def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler, device, num_epochs, save_path):
    print(f"\n🚀 Training High-Standard ConvNeXt Classifier on: {device}")
    start_time = time.time()

    best_acc = 0.0
    best_model_wts = copy.deepcopy(model.state_dict())

    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch+1}/{num_epochs}")
        print("-" * 25)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
                dataloader = train_loader
            else:
                model.eval()
                dataloader = val_loader

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloader:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        # Gradient clipping for stable convergence
                        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = running_corrects.double() / len(dataloader.dataset)

            current_lr = optimizer.param_groups[0]['lr']
            print(f"[{phase.upper()}] Loss: {epoch_loss:.4f} | Acc: {epoch_acc:.4f} | LR: {current_lr:.6f}")

            # Save best validation weights
            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())
                torch.save(best_model_wts, save_path)
                print(f"🌟 SOTA Weights Checkpoint Saved: {save_path} (Acc: {best_acc:.4f})")

        # Step Cosine Annealing Scheduler after each epoch
        scheduler.step()

    time_elapsed = time.time() - start_time
    print(f"\n✅ Training Complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s")
    print(f"🏆 Best Validation Accuracy: {best_acc:.4f}")

    model.load_state_dict(best_model_wts)
    return model


# ==========================================
# 4. EXECUTION
# ==========================================
if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.basename(script_dir) == "data":
        patches_path = os.path.join(script_dir, "data/task1_wound_detect", "Patches")
        root_dir = os.path.abspath(os.path.join(script_dir, "../"))
    else:
        patches_path = os.path.join(script_dir, "data", "data/task1_wound_detect", "Patches")
        root_dir = os.path.abspath(os.path.join(script_dir, "/"))

    weights_dir = os.path.join(root_dir, "backend", "app", "ml_engine", "weights")
    os.makedirs(weights_dir, exist_ok=True)
    model_save_path = os.path.join(weights_dir, "wound_detect_convnext.pth")

    try:
        train_loader, val_loader, classes = get_dataloaders(patches_path)
        print(f"Classes: {classes}")

        model = build_wound_classifier(num_classes=len(classes)).to(device)

        # Label Smoothing prevents overconfidence in clinical edge cases
        criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

        # AdamW with decoupled weight decay for modern transformer/convnext architectures
        optimizer = optim.AdamW(
            filter(lambda p: p.requires_grad, model.parameters()),
            lr=LEARNING_RATE,
            weight_decay=WEIGHT_DECAY
        )

        # Cosine Annealing learning rate schedule
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-6)

        trained_model = train_model(
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            criterion=criterion,
            optimizer=optimizer,
            scheduler=scheduler,
            device=device,
            num_epochs=NUM_EPOCHS,
            save_path=model_save_path
        )

    except Exception as e:
        print(f"Training Execution Error: {e}")