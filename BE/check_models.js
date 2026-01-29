import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function main() {
  console.log("Fetching models via HTTP...");
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    if (data.models) {
        console.log("\nPassed Models:");
        data.models.forEach(m => {
            // Filter slightly to keep it clean, or show all
            if (m.name.includes("gemini")) {
                console.log(`- ${m.name.replace('models/', '')} (${m.version}) [Methods: ${m.supportedGenerationMethods?.join(', ')}]`);
            }
        });
    } else {
        console.log("No 'models' field in response:", data);
    }

  } catch (e) {
      console.error("FAILED TO FETCH MODELS:", e.message);
  }
}

main();
