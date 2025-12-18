import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSuggestions = async (userQuery: string): Promise<{ suggestions: string[], message: string }> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock suggestions.");
    return {
      suggestions: ['UI Kits', 'Templates', 'Vectors'],
      message: 'נראה שאין מפתח API מוגדר, אך הנה כמה רעיונות כלליים:'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful assistant for an Israeli digital design marketplace. 
      The user is looking for: "${userQuery}".
      Suggest 3 specific, short search terms (in Hebrew or English) that would help them find relevant digital assets (UI kits, templates, icons, etc.).
      Also write a very short, encouraging sentence in Hebrew addressing the user.
      Output strictly JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 short search terms"
            },
            message: {
              type: Type.STRING,
              description: "A short encouraging message in Hebrew"
            }
          },
          required: ["suggestions", "message"]
        }
      }
    });

    const text = response.text;
    if (!text) return { suggestions: [], message: "" };
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      suggestions: ['Design', 'Startup', 'Minimal'],
      message: 'נתקלנו בבעיה זמנית, נסה שוב מאוחר יותר.'
    };
  }
};