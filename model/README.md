# AarogyaVani – Model Training Guide

## Overview
This folder contains scripts to train a **YOLOv8 nano segmentation** model on the Roboflow medicaments-counting dataset and export it to ONNX for in-browser inference.

```
model/
├── requirements.txt   # Python deps
├── train.py           # Step 1 – download dataset & train
└── export_onnx.py     # Step 2 – export .pt → .onnx
```

---

## Step-by-Step

### 1. Install dependencies
```bash
cd model
pip install -r requirements.txt
```

### 2. Train the model
```bash
python train.py
```
- Downloads the Roboflow dataset automatically
- Trains for 50 epochs (takes ~10–30 min on GPU, longer on CPU)
- Best weights saved at: `runs/segment/pill_seg/weights/best.pt`

> **Tip**: If you have no GPU, edit `train.py` and change `device=0` → `device="cpu"`

### 3. Export to ONNX
```bash
python export_onnx.py
```
- Exports `best.pt` → `best.onnx`
- Copies it to `../public/models/pill_detection.onnx`
- The React app loads from `/models/pill_detection.onnx` at runtime

---

## What the Model Does
Detects and segments individual medicine tablets/capsules in an image.  
Input: 640×640 image | Output: bounding boxes + segmentation masks + class labels + confidence scores
