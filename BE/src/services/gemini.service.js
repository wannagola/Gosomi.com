import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { verdictJsonSchema } from "../schemas/verdict.schema.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = process.env.GEMINI_MODEL || "models/gemini-2.0-flash";

export async function requestVerdictFromGemini(prompt) {
  const resp = await ai.models.generateContent({
    model: MODEL,
    contents: [{ text: prompt }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: verdictJsonSchema,
    },
  });

  return JSON.parse(resp.text);
}