
import fetch from 'node-fetch'; // or built-in in newer node
// If node-fetch isn't available, we can use http module or assume Node 18+

async function run() {
  try {
    // 1. Create a case
    const caseData = {
        title: "Test Case " + Date.now(),
        content: "Test Content",
        plaintiffId: 1, // Assumes user 1 exists
        defendantId: 2, // Assumes user 2 exists
        juryEnabled: false,
        juryMode: 'RANDOM',
        lawType: 'general'
    };
    
    console.log("Creating case...");
    const createRes = await fetch('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
    });
    
    if (!createRes.ok) {
        console.error("Create failed:", await createRes.text());
        return;
    }
    
    const createJson = await createRes.json();
    const caseId = createJson.caseId; // Adjust based on actual response structure
    console.log(`Case created with ID: ${caseId}`);

    // Wait a bit?
    
    // 2. Submit Defense
    console.log(`Attempting to submit defense with evidence for case ${caseId}...`);
    
    const response = await fetch(`http://localhost:3000/api/cases/${caseId}/defense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: "This is a test defense statement with evidence.",
        evidences: [
            {
                type: 'image',
                content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
            },
            {
                type: 'text',
                content: 'This is a text evidence.'
            }
        ]
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log("Body:", text);

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
