import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = await ai.models.list({ config: { pageSize: 50 } });
for await (const m of models) {
  console.log(m.name);
}
