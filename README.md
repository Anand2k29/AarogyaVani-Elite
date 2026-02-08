# AarogyaVani - AI Virtual Pharmacist

AarogyaVani is an AI-powered "voice companion" designed to bridge the literacy and language gap for patients. It interprets handwritten medical prescriptions and converts them into clear, spoken-word style instructions in the patient's native language.

## Key Features

*   **Prescription OCR & Translation**: Deciphers messy handwriting and translates instructions into 8+ Indian languages (Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, English).
*   **Voice Companion**: Generates audio scripts for patients who cannot read, explaining dosages and timings simply.
*   **Drug Interaction Checker**: Analyzes prescriptions for potential harmful interactions with previously known medicines.
*   **Pill Identifier**: Uses visual recognition to verify if a physical pill matches the prescribed medicine name.
*   **History Management**: Locally stores recent scans for quick access.

## Tech Stack

*   **Frontend**: React (v19), Tailwind CSS
*   **AI Model**: Google Gemini 2.0 Flash / 3.0 Flash Preview (via `@google/genai` SDK)
*   **Icons**: Heroicons (SVG)
*   **Audio**: Web Speech API (SpeechSynthesis)

## Setup & Configuration

1.  **Environment Variables**:
    You must provide a valid Google Gemini API Key.
    The application expects the key to be available via `process.env.API_KEY`.

2.  **Dependencies**:
    This project uses ES modules imported directly via `importmap` in `index.html`. No heavy `node_modules` installation is required for the runtime logic presented here, but in a standard development environment, you would run:
    ```bash
    npm install
    npm start
    ```

## Usage

1.  Select your preferred language.
2.  Upload or take a photo of a doctor's prescription.
3.  Wait for the AI to analyze the text.
4.  Listen to the audio instructions or read the simplified table.
5.  (Optional) Tap the scan icon next to a medicine to visually verify pills.

## Disclaimer

**AarogyaVani is an AI tool and not a replacement for professional medical advice.**
AI interpretations of handwriting and pill visuals can be inaccurate. Always consult a doctor or pharmacist to confirm dosages and medication details.
