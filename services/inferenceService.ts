/**
 * AarogyaVani – Gemini AI Audio & OCR Service
 * ============================================
 * Uses @google/generative-ai to perform OCR on handwritten prescriptions,
 * decode medical jargon, and return the translated instructions as JSON.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PrescriptionItem {
    medicineName: string;
    usedFor: string;
    translatedDosage: string;
    warning: string;
}

export interface DecodeResult {
    items: PrescriptionItem[];
    rawSummary: string;
    processingTimeMs: number;
}

const SYSTEM_PROMPT = `
You are a highly skilled pharmacist AI specializing in deciphering handwritten doctor prescriptions.
Your goal is to extract the medicines, understand complex medical abbreviations (like 1 Tab BD, SOS, TDS),
and translate the usage instructions clearly into the user's requested language.

Output your response STRICTLY as a valid JSON object matching this structure:
{
    "items": [
        {
            "medicineName": "Paracetamol 500mg",
            "usedFor": "Fever and mild pain",
            "translatedDosage": "Take 1 tablet twice a day after meals",
            "warning": "Do not exceed 4 tablets in 24 hours"
        }
    ],
    "rawSummary": "A brief 1-2 sentence summary of the prescription in the requested language."
}

Important Rules:
- If an abbreviation implies a time (e.g., BD = twice daily, PC = after meals, BBF = before breakfast), translate it fully.
- Keep the warning practical and brief.
- Output ONLY valid JSON, do not include markdown blocks like \`\`\`json.
`;

export async function decodePrescription(
    base64Image: string,
    language: string,
    apiKey: string
): Promise<DecodeResult> {
    const t0 = performance.now();

    if (!apiKey || apiKey.trim() === '') {
        throw new Error('API_KEY_MISSING');
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.5-flash as it's the current fast/capable multimodal model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `${SYSTEM_PROMPT}\n\nThe user's requested output language is: ${language}.
        Please decipher the attached prescription image.`;

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // Clean up potential markdown formatting from Gemini
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
        jsonStr = jsonStr.trim();

        const data = JSON.parse(jsonStr);

        return {
            items: data.items || [],
            rawSummary: data.rawSummary || "",
            processingTimeMs: Math.round(performance.now() - t0)
        };

    } catch (e: any) {
        console.error("Gemini Decoding Error:", e);
        throw new Error(e?.message || 'Failed to decode prescription');
    }
}
