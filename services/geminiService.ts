import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AarogyaResponse, PillAnalysisResult } from "../types";

const apiKey = process.env.API_KEY;

// Define the response schema using the Type enum
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    structured_data: {
      type: Type.OBJECT,
      properties: {
        medicines: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the medicine" },
              dosage: { type: Type.STRING, description: "Dosage quantity (e.g., 1 tablet)" },
              timing: { type: Type.STRING, description: "When to take it (e.g., Before Breakfast)" },
              notes: { type: Type.STRING, description: "Any special instructions or safety warnings" },
            },
            required: ["name", "dosage", "timing"],
          },
        },
        patientNotes: {
          type: Type.STRING,
          description: "General advice or warnings about illegible text",
        },
        interactions: {
          type: Type.ARRAY,
          description: "List of potential drug interactions found.",
          items: {
            type: Type.OBJECT,
            properties: {
              severity: { 
                type: Type.STRING, 
                enum: ['HIGH', 'MODERATE', 'LOW'],
                description: "Severity of the interaction"
              },
              description: { 
                type: Type.STRING,
                description: "Simple explanation of the interaction risk"
              },
              medicines: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
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
      type: Type.STRING,
      description: "A simple English script summarizing the instructions and any critical warnings.",
    },
    voice_script_native: {
      type: Type.STRING,
      description: "The translated script in the target language, ready for Text-to-Speech.",
    },
    success_message: {
      type: Type.STRING,
      description: "A short, friendly, and reassuring confirmation in the target language that the prescription was successfully read. Example: 'I have read your prescription and found 3 medicines.'",
    },
  },
  required: ["structured_data", "voice_script_english", "voice_script_native", "success_message"],
};

const pillAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualDescription: {
      type: Type.STRING,
      description: "A description of the pill's physical appearance (shape, color, markings).",
    },
    matchStatus: {
      type: Type.STRING,
      enum: ['LIKELY_MATCH', 'POSSIBLE_MISMATCH', 'UNCERTAIN'],
      description: "Assessment of whether the pill image matches the expected medicine name.",
    },
    analysis: {
      type: Type.STRING,
      description: "Detailed analysis explaining why it matches or doesn't match, including generic equivalents.",
    },
    voiceSummary: {
      type: Type.STRING,
      description: "A short, spoken summary of the findings in the requested language.",
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
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use the correct model name for multimodal tasks to avoid 404 errors
  const modelName = "gemini-3-flash-preview"; 

  const previousContext = previousMedicines.length > 0 
    ? `\n\nCRITICAL SAFETY CHECK: The patient is already taking these medicines: [${previousMedicines.join(', ')}]. \nCheck for any interactions between the NEW medicines in the image and these PREVIOUS medicines.` 
    : '';

  const prompt = `Analyze this prescription. The target language for the voice script is: ${targetLanguage}.${previousContext}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, can be dynamic
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4, // Keep it relatively deterministic for medical data
      },
    });

    const text = response.text;
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
    
    // Check for common 404/Not Found errors indicating incorrect model name or region issues
    if (error.message && (error.message.includes("404") || error.message.includes("not found"))) {
      throw new Error("AI Model unavailable. This may be due to regional restrictions or temporary service outages.");
    }
    
    throw error;
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

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";

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
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
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
      config: {
        responseMimeType: "application/json",
        responseSchema: pillAnalysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as PillAnalysisResult;

  } catch (error: any) {
    console.error("Pill Identification Error:", error);
    throw new Error("Failed to identify pill.");
  }
};