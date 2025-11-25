import { GoogleGenAI, Type } from "@google/genai";
import { CropArea } from '../types';

// Convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getSmartCropSuggestion = async (
  file: File, 
  apiKey: string
): Promise<CropArea | null> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await blobToBase64(file);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Detect the main subject of this image. Return a bounding box that encompasses the most important visual element. The values should be percentages (0-100) relative to the image dimensions."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            y: { type: Type.NUMBER, description: "Top Y position in percentage (0-100)" },
            x: { type: Type.NUMBER, description: "Left X position in percentage (0-100)" },
            width: { type: Type.NUMBER, description: "Width in percentage (0-100)" },
            height: { type: Type.NUMBER, description: "Height in percentage (0-100)" }
          },
          required: ["x", "y", "width", "height"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const result = JSON.parse(text);

    return {
      unit: '%',
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height
    };

  } catch (error) {
    console.error("Gemini Smart Crop Error:", error);
    throw error;
  }
};
