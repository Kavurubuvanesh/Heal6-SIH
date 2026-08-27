import os
import redivis
import pandas as pd

# 1. PASTE YOUR TOKEN HERE (Remember to revoke this token later!)
os.environ["REDIVIS_API_TOKEN"] = "AAAJZ4Je/s9jYcimmv0K5vc7GVvQL8F9"

print("🚀 Connecting to Stanford AIMI Redivis...")

# 2. Connect to the LERA dataset
dataset = redivis.organization("stanford").dataset("0jyf-46kmqh2vf")

# 3. Download the ACTUAL metadata table
print("📊 Downloading clinical metadata labels...")

# THE FIX: Dynamically grab the table instead of hardcoding the name
tables = dataset.list_tables()
if not tables:
    raise Exception("No tables found! Your Stanford access might still be pending approval.")

table = tables[0]
print(f"Target locked on table: {table.name}")

df = table.to_pandas_dataframe()

# Ensure the directory exists before saving the CSV
os.makedirs("ml_training/data/task2_advancement", exist_ok=True)
df.to_csv("ml_training/data/task2_advancement/lera_actual_metadata.csv", index=False)
print(f"✅ Metadata saved! Found {len(df)} rows.")

# 4. Bulk Download all 1,298 Images
print("📥 Downloading 2GB of X-Ray images... (This might take a few minutes)")
download_dir = "ml_training/data/task2_advancement/LERA_Raw_Images"
os.makedirs(download_dir, exist_ok=True)

# The file_index allows for bulk automated downloads
file_index = dataset.file_index()
file_index.download(path=download_dir)

print("\n🎉 All LERA data successfully downloaded to your project!")