console.log("Load Background");
let lastUrl = null;
let hasSentInitialStartup = false;
// Call this only once on service worker start
handleStartupTab();

// Listen for OCR service messages and forward them
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background message received:", request);
    
    switch(request.type){
        case "note":
            // Forward request to content script
            chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
                const tab = tabs[0];
                
                if (!tab || !tab.id) {
                    sendResponse({
                        status: "error",
                        message: "No active tab found or " + (chrome.runtime.lastError?.message || "unknown error")
                    });
                    return;
                }
                
                chrome.tabs.sendMessage(tab.id, {type: "extract_text"}, function(contentResponse) {

                    if (chrome.runtime.lastError) {
                        console.warn("Message failed:", chrome.runtime.lastError.message);
                        sendResponse({
                            status: "error",
                            message: chrome.runtime.lastError.message
                        });
                        return;
                    }

                    console.log("Readability response:", contentResponse);
                    // Forward the response back to the original sender
                    sendResponse(contentResponse);
                });
            });
            return true; // Keep message channel open for async response
        case "save_text_file":
            if (!request.content) {
                sendResponse({ error: "No content provided to save." });
                return;
            }

            // Convert the text content into a .txt Blob, then to a data URL
            const blob = new Blob([request.content], { type: "text/plain" });
            const reader = new FileReader();
            
            reader.onload = function () {
                const dataUrl = reader.result;
                chrome.downloads.download({
                    url: dataUrl,
                    filename: "notes.txt",
                });
            };

            reader.onerror = function (err) {
                sendResponse({ error: err.message });
            };

            // This starts reading the blob as a data URL
            reader.readAsDataURL(blob);

            // Return true to indicate we'll send an async response
            return true;    

        default: 
            console.warn("Unknown request type:", request.type);
            sendResponse({ status: "error", message: "Invalid request type." });
    }
});

function handleStartupTab() {
    if (hasSentInitialStartup) return;

    chrome.windows.getLastFocused({ populate: true }, (window) => {
        if (chrome.runtime.lastError || !window) {
            console.warn("No focused window found:", chrome.runtime.lastError?.message);
            return;
        }

        const activeTab = window.tabs.find(tab => tab.active);
        if (activeTab?.id && activeTab.url) {
            if (activeTab.url.startsWith("http://") || activeTab.url.startsWith("https://")) {
                console.log("Sending initial startup URL to pet.js");
                notifyPetScript(activeTab.id, activeTab.url);
                hasSentInitialStartup = true;
            } else {
                console.log("Startup tab is not HTTP/HTTPS, skipping notify:", activeTab.url);
            }
        } else {
            console.warn("No active tab found in focused window:", window.id);
        }
    });
}



chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (!tab || chrome.runtime.lastError) {
            console.warn("Could not get activated tab:", chrome.runtime.lastError?.message);
            return;
        }
        notifyPetScript(tab.id, tab.url, true); // noMessage = true so it sends a click_tab event
    });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;

    chrome.tabs.query({ active: true, windowId }, function(tabs) {
        const tab = tabs[0];
        if (tab && tab.id && tab.url) {
            notifyPetScript(tab.id, tab.url, true); 
        }
    });
});


// Detect tab updates (URL changes, reloads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        notifyPetScript(tab.id, tab.url);
    }
});

// Detect newly created tabs
chrome.tabs.onCreated.addListener((tab) => {
    if (!tab.id || !tab.url) return;
    notifyPetScript(tab.id, tab.url);
});



// Function to send the URL to pet.js
function notifyPetScript(tabId, url, noMessage = false) {
    if (!tabId || !url) {
        console.warn("Invalid tabId or empty URL.");
        return;
    }

    const isHttp = url.startsWith("http://") || url.startsWith("https://");

    const searchEngineUrls = [
        "https://www.google.com",
        "https://www.bing.com",
        "https://search.yahoo.com",
        "https://duckduckgo.com",
        "https://www.baidu.com",
        "https://yandex.com",
        "https://www.startpage.com",
        "https://www.ecosia.org"
    ];
    
    // This code will find the match, if found then it stop and return True
    const isSearchEngine = searchEngineUrls.some(engine => url.startsWith(engine));


    // Ensure URL is valid (only HTTP or HTTPS)
    if (isHttp && !isSearchEngine && !noMessage) {

        // Send URL to pet.js
        chrome.runtime.sendMessage({
            type: "url_changed",
            url: url
        }, 
        function () {
            if (chrome.runtime.lastError) {
                console.warn("No pet listener available:", chrome.runtime.lastError.message);
            }
        });
    } 
    else if (isHttp && !isSearchEngine && noMessage){
        // Just Update don't send message
        chrome.runtime.sendMessage({
            type: "click_tab",
            url: url
        },
        function () {
            if (chrome.runtime.lastError) {
                console.warn("No pet listener available:", chrome.runtime.lastError.message);
            }
    });
    }
    else {
        
        // Invalid or unsupported scheme — alert pet.js
        chrome.runtime.sendMessage({
            type: "unsupported_url",
            reason: "Navigation is not to a valid HTTP/HTTPS page",
            url: url
        },
        function () {
            if (chrome.runtime.lastError) {
                console.warn(`Skipping notification for non-HTTP/HTTPS URL: ${url}`);
            }
        });
        
    }
}
