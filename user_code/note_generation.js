document.addEventListener("DOMContentLoaded", () => {
    setupNotesGeneration();
});

// Note Generation
function setupNotesGeneration() {
    const generateNotesButton = document.getElementById("menu-generate-notes");
    if (!generateNotesButton) return;

    generateNotesButton.addEventListener("click", generateNotes);
}

async function generateNotes() {
    if (window.safeUrl === false) {
        messageBox.style.background = "linear-gradient(135deg, #f44336, #e91e63)";
        showMessage("Note generation is disabled on this page.");
        return;
    }

    messageBox.style.background = "linear-gradient(135deg, #4CAF50, #45a049)";
    showMessage("Generating notes... Please wait.");

    // Extract text from current page
    chrome.runtime.sendMessage({ type: "note" }, async (response) => {
        const prompt = `Summarize the content into a topic followed by its main points.
Use plain text only (no formatting or styling).
Keep the summary under 200 words.`;

        // Call Gemini API
        try {
            const result = await callGeminiAPI(response.text + prompt);
            showMessage("Notes generated successfully!");

            chrome.runtime.sendMessage({
                type: "save_text_file",
                content: result.text,
            }, () => console.log("Sent extracted data to background.js"));

            console.log(result.usage.totalTokens);
        } catch (error) {
            showMessage("Error generating notes. Please try again.");
            console.error("API Error:", error);
        }
    });
}

async function callGeminiAPI(text) {
    const API_KEY = "AIzaSyAJF48sSzGnIv3H1enFRaCWLhKHhd3vhFk"; // Replace with your actual API key
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: text }
                ]
            }
        ]
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API response: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        return {
            text: result?.candidates?.[0]?.content?.parts?.[0]?.text || "No text found in response",
            usage: result?.usageMetadata?.totalTokenCount || 0
        };
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}