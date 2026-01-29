import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("NO API KEY FOUND IN ENV");
    process.exit(1);
}

console.log(`API Key hash: ${apiKey.substring(0, 4)}...`);

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const model = "gemini-1.5-flash";
  console.log(`Testing ${model}...`);
  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: [{ text: "hi" }]
    });
    console.log(`[WORKS] ${model}`);
    console.log(response.text.substring(0, 20));
  } catch (e) {
      console.log(`[FAILS] ${model}`);
      console.log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
  }
}

main();
