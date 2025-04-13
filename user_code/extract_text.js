console.log("Content script loaded");

// Listen for extraction requests from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.type === "extract_text") {
    console.log("Readability extraction request received in content script.");
    
    try {
      // Extract the content
      const extractedContent = extractPageText();
      
      // Send the extracted content directly back to the sender
      sendResponse({ 
        status: "success", 
        text: extractedContent 
      });
    } catch (error) {
      sendResponse({
        status: "error",
        message: error.message
      });
    }
    
    return true; 
  }
});

function extractPageText(wordLimit = 1000) {
  try {
    // Clone the current document since Readability modifies the DOM
    let clonedDoc = document.cloneNode(true);

    // Parse the article with Readability
    let article = new Readability(clonedDoc).parse();

    // If Readability fails, fallback to body text
    if (!article) {
      console.warn("Readability could not parse an article. Falling back to body text.");
      let fallbackText = document.body.innerText || "";
      return `URL: ${window.location.href}\n\nFallback text:\n${fallbackText}`;
    }

    // Build formatted output with article metadata and content
    let output = `
        URL: ${window.location.href}

        Title: ${article.title}
        Byline: ${article.byline || ""}
        Site Name: ${article.siteName || ""}
        Excerpt: ${article.excerpt || ""}
        Published Time: ${article.publishedTime || ""}
        Direction: ${article.dir || ""}
        Language: ${article.lang || ""}

        === EXTRACTED ARTICLE TEXT ===
        ${limitWords(article.textContent, wordLimit)}

        `;

    return output;

  } catch (error) {
    console.error("Readability extraction error:", error);
    return `Error extracting content: ${error.message}`;
  }
}

// Function to limit the number of words in a text
function limitWords(text, maxWords) {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}