console.log("✅ gemini_post.js loaded successfully!");

document.getElementById("menu-generate-notes").addEventListener("click", async () => {
    const API_KEY = "AIzaSyCpcCxWOKgeiRbStxgmsGmTqwXcRm1kv1s";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const requestBody = {
    contents: [
        {
        parts: [
            {
            text: "What is AI."
            }
        ]
        }
    ]
    };

    fetch(endpoint, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Gemini response:", data);
    })
    .catch(error => {
        console.error("Error:", error);
    });
});


// async function callGeminiAPI(text) {
//     const API_KEY = "AIzaSyCpcCxWOKgeiRbStxgmsGmTqwXcRm1kv1s";
//     const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

//     const requestBody = {
//         contents: [
//             {
//             parts: [
//                 {
//                 text: text
//                 }
//             ]
//             }
//         ]
//         };

//     return fetch(endpoint, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify(requestBody)
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`API response: ${response.status} ${response.statusText}`);
//         }

//         return response.json();
            
//     })
//     .then(data => {
//         console.log("Gemini response:", data);
//         // Extract the text content and token usage
//         const result = {
//             text: data.candidates?.[0]?.content?.parts?.[0]?.text || "No text found in response",
//             tokenUsage: {
//                 promptTokens: data.usageMetadata?.promptTokenCount || 0,
//                 responseTokens: data.usageMetadata?.candidatesTokenCount || 0,
//                 totalTokens: data.usageMetadata?.totalTokenCount || 0
//             }
//         };
//         console.log(result);
//         return result;
//     })
//     .catch(error => {
//         console.error("Error:", error);
//         throw error;
//     });
// }