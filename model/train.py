"""
AarogyaVani – Pill Detection Model Training
============================================
Dataset : Roboflow – medicaments-counting (COCO segmentation)
Model   : YOLOv8n-seg  (nano segmentation – fast + browser-friendly)
Output  : runs/segment/train/weights/best.pt

Usage:
  pip install -r requirements.txt
  python train.py
"""

from ultralytics import YOLO
import os

# ── 1. Dataset path ────────────────────────────────────────────────────────────
LOCAL_YAML = os.path.join(os.path.dirname(__file__), "medicaments-counting-1", "data.yaml")

if os.path.exists(LOCAL_YAML):
    dataset_yaml = LOCAL_YAML
    print(f"✅ Using cached dataset: {dataset_yaml}")
else:
    # Download only if not already present
    from roboflow import Roboflow
    rf = Roboflow(api_key="zgj03i2Iflfbu1msTp0Q")
    project = rf.workspace("anands-workspace").project("medicaments-counting-bpg0r-dyyub")
    version = project.version(1)
    dataset = version.download("yolov8")
    dataset_yaml = os.path.join(dataset.location, "data.yaml")
    print(f"✅ Dataset downloaded to: {dataset_yaml}")

# ── 2. Load pre-trained YOLOv8 nano segmentation model ────────────────────────
model = YOLO("yolov8n-seg.pt")        # nano = smallest & fastest; good for browser

# ── 3. Train ──────────────────────────────────────────────────────────────────
results = model.train(
    data=dataset_yaml,
    epochs=10,           # quick run; increase to 50+ for better accuracy with GPU
    imgsz=320,           # smaller image = much faster on CPU
    batch=4,
    name="pill_seg",
    patience=5,
    device="0" if __import__("torch").cuda.is_available() else "cpu",
    amp=False,           # disable AMP on CPU
)

print("\n✅ Training complete!")
print(f"   Best weights: runs/segment/pill_seg/weights/best.pt")
