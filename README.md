# AarogyaVani — AI Prescription Voice Companion

AarogyaVani is a privacy-first, accessibility-focused web application designed to bridge the literacy and language gap for patients. It deciphers handwritten medical prescriptions and explains dosage instructions in the user's native language using AI-powered voice output.

## The Concept

Rural patients, the elderly, and non-English speakers often struggle with:
1. **Deciphering Difficulty**: Understanding doctor's cursive handwriting.
2. **Language Barrier**: Medical abbreviations like "1 Tab BD" or "BBF" are unintelligible.
3. **Literacy Gap**: Text-based results are inaccessible to the visually impaired or illiterate.

AarogyaVani solves this by:
- **Scanning**: Capturing an image of the prescription.
- **Decoding**: Using Gemini 1.5 Flash to extract handwriting and interpret medical shorthand (e.g., "BD" → "Twice a day").
- **Localizing**: Translating instructions into dialects (Hindi, Kannada, etc.).
- **Voice Output**: Speaking instructions naturally for immediate understanding.

## Core Features

- **Prescription OCR & Interpretation** — Decipher messy handwriting and abbreviations.
- **Native Voice Reminders** — Auditory explanations in 8+ Indian languages.
- **Drug Interaction Safety** — Checks for potential risks between multiple prescribed medicines.
- **Care Companion Module** — Includes Medication Reminders, Appointment Scheduling, and a one-tap SOS Emergency button.
- **Privacy-First** — All health logs and care data are stored locally on-device.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Bundler | Vite 6 |
| AI (Cloud) | Google Gemini 1.5 Flash (OCR + LLM) |
| Voice | Web Speech API (Native TTS) |
| Persistence | LocalStorage (On-device) |

## Quick Start

1. **Prerequisites**: Ensure you have a Google Gemini API Key.
2. **Installation**:
```bash
npm install
```
3. **Environment**: Add your `API_KEY` to a `.env` file.
4. **Run**:
```bash
npm run dev
```

Then open `http://localhost:3000`.

## Elderly Care Companion

AarogyaVani includes a **Care Companion** module:
- 💊 **Medication Reminders**: Health log + voice alerts.
- 📅 **Appointment Calendar**: Manage visit schedules.
- 🆘 **SOS Button**: Quick-dial emergency contacts with haptic feedback.
- 👨‍👩‍👧 **Caregiver Dashboard**: adherence summary for family members.

## Disclaimer

**AarogyaVani is an AI-powered translation tool and is NOT a medical device.** AI can make mistakes. Always verify instructions with a licensed pharmacist or doctor before taking medication.

---
**Repository:** [github.com/Anand2k29/AarogyaVani-Elite](https://github.com/Anand2k29/AarogyaVani-Elite)
