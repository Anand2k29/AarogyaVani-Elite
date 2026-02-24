"""
AarogyaVani – Export Trained Model to ONNX
===========================================
Run this AFTER train.py completes.

Output: model/pill_detection.onnx   (copy this into public/ for the web app)

Usage:
  python export_onnx.py
"""

from ultralytics import YOLO
import shutil, os

WEIGHTS_PATH = "runs/segment/pill_seg/weights/best.pt"
OUTPUT_DIR   = "."            # exports next to this script
PUBLIC_DIR   = "../public/models"  # React public folder

if not os.path.exists(WEIGHTS_PATH):
    raise FileNotFoundError(
        f"Weights not found at {WEIGHTS_PATH}\n"
        "Please run train.py first."
    )

model = YOLO(WEIGHTS_PATH)

# Export to ONNX (opset 12 = good browser compatibility)
model.export(
    format="onnx",
    imgsz=640,
    opset=12,
    simplify=True,
    dynamic=False,
)

onnx_src = WEIGHTS_PATH.replace(".pt", ".onnx")

# Copy to public/models/ so Vite serves it statically
os.makedirs(PUBLIC_DIR, exist_ok=True)
onnx_dst = os.path.join(PUBLIC_DIR, "pill_detection.onnx")
shutil.copy(onnx_src, onnx_dst)

print(f"\n✅ ONNX model exported!")
print(f"   Source      : {onnx_src}")
print(f"   Copied to   : {onnx_dst}")
print(f"\n   The React app will load it from /models/pill_detection.onnx")
