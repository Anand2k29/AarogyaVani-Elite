# AarogyaVani — On-Device Pill Detector

AarogyaVani is a privacy-first web app that counts and identifies pills from a photo using a custom-trained YOLOv8 model running entirely in the browser via ONNX Runtime. No data ever leaves your device.

## Features

- **Local AI Inference** — YOLOv8 segmentation model served as ONNX, runs in-browser with `onnxruntime-web`.
- **Instant Pill Count** — Upload or photograph your medicines; the model detects, counts, and labels every pill with confidence scores.
- **Zero Internet Required** — Works fully offline after the first page load.
- **No API Keys** — No cloud calls, no Gemini, no backend.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Bundler | Vite 6 |
| AI Inference | `onnxruntime-web` (WASM) |
| Model | Custom YOLOv8 segmentation → ONNX |

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

> **Note:** The app requires a trained ONNX model at `public/models/`. If it's missing, the UI will guide you through training.

## Training the Model

```bash
cd model
pip install -r requirements.txt
python train.py          # trains YOLOv8 on your dataset
python export_onnx.py    # exports model → public/models/
```

After export, refresh the app — it will automatically pick up the new model.

## Disclaimer

**AarogyaVani is not a medical device.** AI detection can be inaccurate. Always confirm medications with a licensed pharmacist or doctor.

---

## � Elderly Care Companion

AarogyaVani goes beyond pill detection — it includes a **Care Companion** module designed specifically for elderly users who need help managing their daily health routines. Everything runs offline in the browser; no account, no cloud, no installation required.

### Why It Matters
India has 140 million+ elderly citizens, many of whom live alone or with limited family support. Medication non-adherence accounts for ~30% of hospital admissions in seniors. AarogyaVani's Care Companion bridges this gap — accessible on any smartphone browser, in any connectivity condition.

### Care Companion Features

| # | Feature | Description |
|---|---|---|
| 1 | 💊 **Medication Reminders** | Add medicines with name, dosage & daily schedule; browser notifications alert the user at the right time; one-tap Taken / Skipped health log |
| 2 | 📅 **Appointment Scheduling** | Full calendar view of upcoming doctor visits; add/edit/delete appointments with doctor name, location & time |
| 3 | 🆘 **SOS / Emergency Button** | Store up to 3 emergency contacts; a single large SOS button triggers a call link and an alert — works fully offline |
| 4 | 👨‍👩‍👧 **Family / Caregiver Dashboard** | At-a-glance summary of today's medications, upcoming appointments and recent health logs — exportable to clipboard for sharing |

### Accessibility-First Design
- Large fonts & high-contrast UI built for low vision
- Single-tap interactions — no complex multi-step flows
- Text-to-speech audio cues for medication alerts
- Optimised for budget Android phones on any browser

### Architecture
All Care Companion data is stored in `localStorage` on the device — the same privacy-first, no-backend approach as the pill detector. No account, no server, no data ever leaves the phone.

### Technology Roadmap
```
Phase 1 ✅  Pill Detector        — on-device YOLOv8 ONNX inference
Phase 2 ✅  Elderly Care Companion — medication, appointments, SOS, caregiver dashboard
Phase 3 🔜  Voice reminders      — Web Speech API (speak medicine names aloud)
Phase 4 🔜  Volunteer matching   — QR-code pairing with local caregivers
Phase 5 🔜  Multilingual alerts  — 8+ Indian languages for medication reminders
```
