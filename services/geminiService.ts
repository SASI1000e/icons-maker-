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
  retries = 2
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct parts: images first, then text
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

        // Check candidates
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Gemini.");
        }

        const firstCandidate = candidates[0];
        const responseParts = firstCandidate.content?.parts;

        if (!responseParts || responseParts.length === 0) {
            throw new Error("No content parts returned.");
        }

        // Look for inlineData (image)
        const imagePart = responseParts.find(p => p.inlineData);

        if (imagePart && imagePart.inlineData) {
            const base64Data = imagePart.inlineData.data;
            return `data:image/png;base64,${base64Data}`; 
        }

        throw new Error("No image data found in the response.");

    } catch (apiError: any) {
        // Check for 429 or Resource Exhausted to retry
        if (
            (apiError.status === 429 || 
             apiError.code === 429 || 
             apiError.message?.includes('429') || 
             apiError.message?.includes('RESOURCE_EXHAUSTED')) && 
            retries > 0
        ) {
            console.warn(`Quota exceeded. Retrying in 4s... (${retries} attempts left)`);
            await wait(4000); // Wait 4 seconds before retrying
            return generateImageEdit(images, prompt, retries - 1);
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