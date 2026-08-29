import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import requests
import os
import io
from PIL import Image

API_URL = "http://127.0.0.1:8000/api/v1/sinbad/analyze-wound"


def run_integration_test():
    print("🚀 [TEST RUNNER] Initiating End-to-End API Contract Verification...")

    # 1. Create a GENUINE dummy JPEG file using PIL
    dummy_image_path = "temp_mock_ulcer.jpg"
    img = Image.new('RGB', (224, 224), color=(255, 100, 100))
    img.save(dummy_image_path, format='JPEG')

    try:
        # 2. Construct the exact multipart form data Ariba's app will send
        with open(dummy_image_path, "rb") as img_file:
            files = {"file": ("mock_ulcer.jpg", img_file, "image/jpeg")}

            # String booleans mapping exactly to your FastAPI Form definitions
            form_data = {
                "is_hindfoot": "true",
                "has_ischemia": "false",
                "has_neuropathy": "true",
                "is_deep": "false"
            }

            print(f"📡 [TEST RUNNER] POSTing clinical payload to {API_URL}...")
            response = requests.post(API_URL, files=files, data=form_data)

            # 3. Assert and Output
            print(f"✅ [STATUS] HTTP {response.status_code}")
            if response.status_code == 200:
                print("📊 [RESPONSE PAYLOAD]")
                import json
                print(json.dumps(response.json(), indent=2))
            else:
                print(f"❌ [ERROR] {response.text}")

    finally:
        # 4. Clean up the dummy file
        if os.path.exists(dummy_image_path):
            os.remove(dummy_image_path)
            print("🧹 [TEST RUNNER] Cleanup complete.")


if __name__ == "__main__":
    run_integration_test()