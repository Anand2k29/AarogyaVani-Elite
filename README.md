# AarogyaVani — On-Device Medicine Identifier

AarogyaVani is a 100% offline, privacy-first web application that identifies medicines from images using local AI models. It runs entirely in your browser via ONNX Runtime — no data ever leaves your device and no API keys are required.

## Features

- **Local AI Inference** — YOLOv8 models served as ONNX, running in-browser with `onnxruntime-web`.
- **Private Identification** — Upload photos of medicine strips or pills to get instant identification and usage advice.
- **Zero Internet Required** — Fully functional offline healthy companion after the first page load.
- **Elderly Care Companion** — Integrated SOS emergency button, medication reminders, and caregiver dashboard.
- **Accessibility-First** — Built with large buttons, high contrast, and simplified interactions for ease of use.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Bundler | Vite 6 |
| AI Inference | `onnxruntime-web` (WebAssembly) |
| Model | Custom YOLOv8 ONNX (Served locally) |
| Storage | LocalStorage (On-device persistence) |

## Quick Start

1. **Install Dependencies**:
```bash
npm install
```

2. **Run Locally**:
```bash
npm run dev
```

3. **Train the Model** (Optional):
The app requires an ONNX model at `public/models/pill_detection.onnx`. If you want to train it on your own dataset:
```bash
cd model
pip install -r requirements.txt
python train.py
python export_onnx.py
```

## Disclaimer

**AarogyaVani is NOT a medical device.** AI identification can be inaccurate. Never take medication based solely on an automated scan. Always verify with a licensed healthcare professional.

---
**Repository:** [github.com/Anand2k29/AarogyaVani-Elite](https://github.com/Anand2k29/AarogyaVani-Elite)
