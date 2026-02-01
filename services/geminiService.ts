
import { GoogleGenAI, Type } from "@google/genai";

// Always use the API key from process.env.API_KEY as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartTaskBreakdown = async (taskTitle: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down this task into 3-5 sub-tasks and estimate time (in minutes) for each: Task: "${taskTitle}" Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedMinutes: { type: Type.NUMBER }
                },
                required: ["title", "estimatedMinutes"]
              }
            },
            suggestedCategory: { type: Type.STRING }
          },
          required: ["subtasks", "suggestedCategory"]
        }
      }
    });

    // Access the text property directly (not a method).
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
