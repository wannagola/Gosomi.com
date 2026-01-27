
import fetch from 'node-fetch'; // or use native fetch if node 18+

async function main() {
    try {
        const response = await fetch('http://localhost:3000/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Test Case",
                content: "Test Content",
                plaintiffId: 1,
                defendantId: 4,
                lawType: "1",
                juryEnabled: true,
                juryMode: "INVITE",
                juryInvitedUserIds: ["3"]
            })
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}

main();
