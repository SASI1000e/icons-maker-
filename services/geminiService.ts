import { GoogleGenAI, Modality } from "@google/genai";
import { MODEL_NAME } from "../constants";

export interface ImageInput {
  base64: string;
  mimeType: string;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateImageEdit = async (
  images: ImageInput[],
  prompt: string,
  apiKey: string, // Pass API key dynamically
  retries = 2
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing. Please configure it in Admin Panel.");

  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts = [
      ...images.map(img => ({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType,
        },
      })),
      {
        text: prompt,
      },
    ];

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) throw new Error("No candidates returned from Gemini.");

        const imagePart = candidates[0].content?.parts?.find(p => p.inlineData);

        if (imagePart && imagePart.inlineData) {
            return `data:image/png;base64,${imagePart.inlineData.data}`; 
        }

        throw new Error("No image data found in the response.");

    } catch (apiError: any) {
        if (
            (apiError.status === 429 || apiError.message?.includes('429') || apiError.message?.includes('RESOURCE_EXHAUSTED')) && 
            retries > 0
        ) {
            console.warn(`Quota exceeded. Retrying in 4s... (${retries} attempts left)`);
            await wait(4000);
            return generateImageEdit(images, prompt, apiKey, retries - 1);
        }
        throw apiError;
    }

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("System is busy (Quota Exceeded). Please try again in a moment.");
    }
    throw new Error(error.message || "Failed to process image.");
  }
};