function extractPageText() {
    try {
        // Clone the current document since Readability modifies the DOM
        const clonedDoc = document.cloneNode(true);

        // Parse the article with Readability
        const article = new Readability(clonedDoc).parse();

        // If Readability fails, fallback to body text
        if (!article) {
            console.warn("Readability could not parse an article. Falling back to body text.");
            const fallbackText = document.body.innerText || "";
            return `URL: ${window.location.href}\n\nFallback text:\n${fallbackText}`;
        }

        // Build formatted output with article metadata and content
        const output = `URL: ${window.location.href}\n\nTitle: ${article.title || ""}\nByline: ${article.byline || ""}\nSite Name: ${article.siteName || ""}\nExcerpt: ${article.excerpt || ""}\nPublished Time: ${article.publishedTime || ""}\nDirection: ${article.dir || ""}\nLanguage: ${article.lang || ""}\n\n*** EXTRACTED ARTICLE TEXT ***\n${article.textContent}`;

        return output;
    } catch (error) {
        console.error("Readability extraction error:", error);
        return `Error extracting content: ${error.message}`;
    }
}

// Listen for extraction requests from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "extract text") {
        console.log("Readability extraction request received in content script.");
        try {
            // Extract the content
            const extractedContent = extractPageText();

            // Send the extracted content directly back to the sender
            sendResponse({
                status: "success",
                text: extractedContent,
            });
        } catch (error) {
            sendResponse({
                status: "error",
                message: error.message,
            });
        }
        return true; // To make sure the connection channel keep open
    }
});