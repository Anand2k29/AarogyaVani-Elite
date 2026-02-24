import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AarogyaResponse, PillAnalysisResult } from "../types";

const apiKey = (import.meta as any).env.VITE_API_KEY || ""; // Use import.meta.env for Vite

// Define the response schema
const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    structured_data: {
      type: SchemaType.OBJECT,
      properties: {
        medicines: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: "Name of the medicine" },
              dosage: { type: SchemaType.STRING, description: "Dosage quantity (e.g., 1 tablet)" },
              timing: { type: SchemaType.STRING, description: "When to take it (e.g., Before Breakfast)" },
              notes: { type: SchemaType.STRING, description: "Any special instructions or safety warnings" },
            },
            required: ["name", "dosage", "timing"],
          },
        },
        patientNotes: {
          type: SchemaType.STRING,
          description: "General advice or warnings about illegible text",
        },
        interactions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              severity: {
                type: SchemaType.STRING,
                description: "Severity of the interaction (HIGH, MODERATE, LOW)"
              },
              description: {
                type: SchemaType.STRING,
                description: "Simple explanation of the interaction risk"
              },
              medicines: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "List of medicine names involved in this interaction"
              }
            },
            required: ["severity", "description", "medicines"]
          }
        }
      },
      required: ["medicines"],
    },
    voice_script_english: {
      type: SchemaType.STRING,
      description: "A simple English script summarizing the instructions and any critical warnings.",
    },
    voice_script_native: {
      type: SchemaType.STRING,
      description: "The translated script in the target language, ready for Text-to-Speech.",
    },
    success_message: {
      type: SchemaType.STRING,
      description: "A short, friendly, and reassuring confirmation in the target language.",
    },
  },
  required: ["structured_data", "voice_script_english", "voice_script_native", "success_message"],
};

const pillAnalysisSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    visualDescription: {
      type: SchemaType.STRING,
      description: "Description of the pill appearance.",
    },
    matchStatus: {
      type: SchemaType.STRING,
      description: "Match quality (LIKELY_MATCH, POSSIBLE_MISMATCH, UNCERTAIN)",
    },
    analysis: {
      type: SchemaType.STRING,
      description: "Detailed analysis.",
    },
    voiceSummary: {
      type: SchemaType.STRING,
      description: "Spoken summary of findings.",
    },
  },
  required: ["visualDescription", "matchStatus", "analysis", "voiceSummary"],
};

export const analyzePrescription = async (
  base64Image: string,
  targetLanguage: string,
  previousMedicines: string[] = []
): Promise<AarogyaResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env file and ensure VITE_API_KEY is set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  }, { apiVersion: 'v1beta' });

  const previousContext = previousMedicines.length > 0
    ? `\n\nCRITICAL SAFETY CHECK: The patient is already taking these medicines: [${previousMedicines.join(', ')}]. \nCheck for any interactions between the NEW medicines in the image and these PREVIOUS medicines.`
    : '';

  const prompt = `Analyze this prescription. The target language for the voice script is: ${targetLanguage}.${previousContext}`;

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      }
    });

    const result = response.response;
    const text = result.text();
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    try {
      const data = JSON.parse(text) as Omit<AarogyaResponse, 'language'>;
      return { ...data, language: targetLanguage };
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, text);
      throw new Error("We couldn't read the prescription clearly. Please ensure the image is focused, well-lit, and contains a visible prescription.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg: string = error?.message || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error("API quota limit reached. Please try again later.");
    }
    throw new Error(msg || "Failed to analyze prescription.");
  }
};

export const identifyPill = async (
  base64Image: string,
  expectedMedicineName: string,
  language: string
): Promise<PillAnalysisResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  }, { apiVersion: 'v1beta' });

  const prompt = `
    The patient claims this pill is "${expectedMedicineName}". 
    Analyze the image of the pill/strip. 
    1. Describe its color, shape, and any visible imprints or text.
    2. Compare it to known visual characteristics of "${expectedMedicineName}" or its common generics in India.
    3. Determine if it is a 'LIKELY_MATCH', 'POSSIBLE_MISMATCH' (if it looks completely different), or 'UNCERTAIN' (if image is unclear).
    4. Provide the result in ${language}.
    
    IMPORTANT: Provide a strict disclaimer that visual identification is not 100% accurate.
  `;

  try {
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: pillAnalysisSchema,
      }
    });

    const result = response.response;
    const text = result.text();
    if (!text) throw new Error("No response");
    return JSON.parse(text) as PillAnalysisResult;

  } catch (error: any) {
    console.error("Pill Identification Error:", error);
    const msg: string = error?.message || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error("API quota limit reached.");
    }
    throw new Error("Failed to identify pill.");
  }
};