
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001"
    ];

    for (const m of modelsToTry) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello");
            console.log(`SUCCESS: ${m}`);
            console.log(result.response.text());
            process.exit(0);
        } catch (e) {
            console.log(`FAILED: ${m} - ${e.message}`);
        }
    }
}

listModels();
