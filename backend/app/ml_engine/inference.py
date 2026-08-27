import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# ==========================================
# 1. SETUP & CONFIGURATION
# ==========================================
IMAGE_SIZE = 224
CLASSES = ['Abnormal(Ulcer)', 'Normal(Healthy skin)']
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

inference_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

_model = None


# ==========================================
# 2. DYNAMIC MODEL LOADER
# ==========================================
def load_model():
    """Loads the trained ConvNeXt-Tiny model dynamically based on checkpoint architecture."""
    global _model
    if _model is not None:
        return _model

    script_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(script_dir, "weights", "wound_detect_convnext.pth")

    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Model weights not found at: {weights_path}")

    # Load the raw weights into memory first
    state_dict = torch.load(weights_path, map_location=device, weights_only=True)

    # Initialize base ConvNeXt-Tiny architecture
    model = models.convnext_tiny(weights=None)

    # DYNAMIC CHECK: Did the training script use a custom multi-layer head?
    if "classifier.3.weight" in state_dict and "classifier.6.weight" in state_dict:
        # Read the hidden dimensions directly from the saved tensor shapes
        hidden_dim = state_dict["classifier.3.weight"].shape[0]
        num_classes = state_dict["classifier.6.weight"].shape[0]

        # Reconstruct the exact custom head used during training
        model.classifier = nn.Sequential(
            model.classifier[0],  # 0: LayerNorm2d (Original)
            model.classifier[1],  # 1: Flatten (Original)
            nn.Dropout(p=0.5),  # 2: Dropout (Has no weights to load)
            nn.Linear(768, hidden_dim),  # 3: Linear
            nn.GELU(),  # 4: Activation (Has no weights to load)
            nn.Dropout(p=0.5),  # 5: Dropout
            nn.Linear(hidden_dim, num_classes)  # 6: Linear
        )
    else:
        # Fallback for standard 1-layer PyTorch head
        in_features = model.classifier[2].in_features
        model.classifier[2] = nn.Linear(in_features, len(CLASSES))

    # Safely load the weights now that the structure matches perfectly
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    _model = model
    return _model


# ==========================================
# 3. PREDICTION ENGINE
# ==========================================
def predict_wound(image: Image.Image) -> dict:
    """Takes a PIL Image and returns class predictions with confidence scores."""
    model = load_model()

    input_tensor = inference_transforms(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, 0)

    predicted_class = CLASSES[predicted_idx.item()]
    confidence_score = round(confidence.item() * 100, 2)

    return {
        "prediction": predicted_class,
        "confidence": confidence_score,
        "is_ulcer": predicted_class == 'Abnormal(Ulcer)'
    }


# ==========================================
# 4. QUICK LOCAL TEST
# ==========================================
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    test_img_path = os.path.abspath(
        os.path.join(script_dir, "../../../ml_training/data/task1_wound_detect/TestSet/0.jpg")
    )

    try:
        img = Image.open(test_img_path).convert("RGB")
        result = predict_wound(img)
        print("\n🔍 Inference Test Result:")
        print(f"Prediction:  {result['prediction']}")
        print(f"Confidence:  {result['confidence']}%")
        print(f"Is Ulcer:    {result['is_ulcer']}")
    except Exception as e:
        print(f"Inference Error: {e}")