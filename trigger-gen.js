// Remove require, use native fetch
async function triggerGeneration() {
    try {
        console.log("Triggering generation...");
        const response = await fetch('http://localhost:3000/api/automation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start',
                config: {
                    targetCount: 1,
                    textModelId: 'google/gemini-2.0-flash-exp:free',  // Ensure this ID matches models.ts
                    imageModelId: 'unsplash'
                }
            })
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (error) {
        console.error("Error:", error);
    }
}

triggerGeneration();
