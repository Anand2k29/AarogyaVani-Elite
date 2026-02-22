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

from roboflow import Roboflow
from ultralytics import YOLO
import os

# ── 1. Download dataset from Roboflow ─────────────────────────────────────────
rf = Roboflow(api_key="zgj03i2Iflfbu1msTp0Q")
project = rf.workspace("anands-workspace").project("medicaments-counting-bpg0r-dyyub")
version = project.version(1)
dataset = version.download("yolov8")          # YOLOv8 format (not COCO) for direct training

dataset_yaml = os.path.join(dataset.location, "data.yaml")
print(f"\n✅ Dataset downloaded to: {dataset.location}")
print(f"   YAML config: {dataset_yaml}\n")

# ── 2. Load pre-trained YOLOv8 nano segmentation model ────────────────────────
model = YOLO("yolov8n-seg.pt")        # nano = smallest & fastest; good for browser

# ── 3. Train ──────────────────────────────────────────────────────────────────
results = model.train(
    data=dataset_yaml,
    epochs=50,           # increase to 100+ for better accuracy
    imgsz=640,
    batch=8,
    name="pill_seg",
    patience=10,         # early stopping – stops if no improvement for 10 epochs
    device=0,            # use GPU (cuda:0); set to "cpu" if no GPU available
    amp=True,            # automatic mixed precision – speeds up training
)

print("\n✅ Training complete!")
print(f"   Best weights: runs/segment/pill_seg/weights/best.pt")
