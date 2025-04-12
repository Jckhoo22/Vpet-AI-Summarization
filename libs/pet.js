// -------------------- Virtual Pet Setup --------------------
let messageTimeout; // Declare globally
let focusTime = 0; // Declare globally
let interval; // Declare globally for cleanup
let messageBox, messageText; // DOM elements

document.addEventListener("DOMContentLoaded", () => {
    // Initialize DOM elements
    messageBox = document.getElementById("message-box");
    messageText = document.getElementById("message-text");

    // Setup the pet functionality
    initializePet();
});

function initializePet() {
    // Load messages and set up interactions
    loadMessages()
        .then(messages => {
            clickInteractions(messages);
            timeBasedInteractions(messages);
        })
        .catch(err => console.error("Error loading messages:", err));

    // Initialize functionality
    startFocusTracking();
    listenForUrlChanges();
}


// ------------- Load Messages from JSON file ----------------
async function loadMessages() {
    try {
        const response = await fetch(chrome.runtime.getURL("pet_brain.json"));
        return await response.json();
    } catch (error) {
        console.error("Failed to load messages:", error);
        return {};
    }
}

// -------------------- Cat Messages -------------------------
async function clickInteractions(messages) {
    if(!messages.click || !Array.isArray(messages.click)) return;

    // Setup click events for interactive elements
    for (const item of messages.click) {
        const elements = document.querySelectorAll(item.selector);
        let messageIndex = 0;
        
        elements.forEach(element => {
            element.addEventListener("click", () => {
                const message = item.text[messageIndex];
                messageBox.style.background = "linear-gradient(135deg, #ff9800, #ff5e62)";
                showMessage(message);
                messageIndex = (messageIndex + 1) % item.text.length;
            });
        });
    }
}

// -------------------- Cat Greetings ------------------------
function timeBasedInteractions(messages) {
    if (!messages.time || !Array.isArray(messages.time)) return;
    
    const currentHour = new Date().getHours();
    
    // Find appropriate time-based message
    for (const item of messages.time) {
        const [start, end] = item.hour.split("-").map(Number);
        if (currentHour >= start && currentHour <= end) {
            messageBox.style.background = "linear-gradient(135deg, #ff9800, #ff5e62)";
            showMessage(item.text);
            break;
        }
    }
}


// -------------------- Detect User Focus --------------------
function startFocusTracking() {
    const focusCheckpoints = [
        { time: 180, message: "It's been 3 minutes! Need help generating notes?" },
        { time: 300, message: "5 minutes have passed! How about taking some notes?" },
        { time: 600, message: "You've been focused for 10 minutes! Great work!" }
    ];

    // Clear any existing interval
    if (interval) clearInterval(interval);
    

    focusTime = 0;

    // Start new tracking interval
    interval = setInterval(() => {
        focusTime += 1;
        for (const checkpoint of focusCheckpoints) {
            if (focusTime === checkpoint.time) {
                messageBox.style.background = "linear-gradient(135deg, #4CAF50, #45a049)"; // Green gradient
                showMessage(checkpoint.message);
                break;
            }
        }
    }, 1000);
}

function listenForUrlChanges() {
    console.log("Setting up URL change listener");

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "url_changed") {
            console.log("URL changed detected:", request.url);
            window.safeURL = true;
            // Set blue gradient for valid URL change
            messageBox.style.background = "linear-gradient(135deg, #2196F3, #00BCD4)";
            showMessage("I noticed you changed pages! Let me know if you need help.");

            // Reset focus tracking when page changes
            startFocusTracking();
            sendResponse({ status: "received", type: "url_changed" });

        }
        else if (request.type == "unsupported_url"){
            window.safeURL = false;
             // Set red gradient for unsupported URLs
            messageBox.style.background = "linear-gradient(135deg, #f44336, #e91e63)";
            showMessage("Navigation is not to a valid HTTP/HTTPS page");
            
            // Reset focus tracking when page changes
            startFocusTracking();
            sendResponse({ status: "received", type: "unsupported_url" });
        }
        else if (request.type == "click_tab"){
            console.log("Click Tab.");
            window.safeURL = true;
            
            // Reset focus tracking when page changes
            startFocusTracking();
            sendResponse({ status: " ", type: "click_tab" });
            
        }
        
        return true;
    });
}


// -------------------- Display and Hide Messages --------------------
window.showMessage = function(text) {
    // Clear any existing timeout
    clearTimeout(messageTimeout);

    // Update message and show it
    messageText.textContent = text;
    messageBox.style.display = "block";

    // Update pet image to GIF based on current folder_path
    const petImage = document.getElementById("pet");
    if (petImage) {
        const basePath = `./img/${window.folder_path}`;
        const gifName = window.folder_path === "0" ? "cat-spin.gif" : "pop-cat.gif";
        petImage.src = `${basePath}/${gifName}`;
    } else {
        console.warn("Pet image element not found");
    }

    // Add show class after a small delay for transition
    setTimeout(() => {
        messageBox.classList.add("show-message");
    }, 10);

    // Auto-hide after delay
    messageTimeout = setTimeout(hideMessage, 5500);
}

window.hideMessage = function() {
    clearTimeout(messageTimeout);
    messageBox.classList.remove("show-message");

    // Revert pet image to PNG when message hides
    const petImage = document.getElementById("pet");
    if (petImage) {
        const basePath = `./img/${window.folder_path}`;
        const pngName = window.folder_path === "0" ? "cat-spin.png" : "pop-cat.png";
        petImage.src = `${basePath}/${pngName}`;
    }

    // Hide after transition completes
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 500);
}



// Clean up resources when extension is unloaded
function cleanup() {
    if (interval) {
        clearInterval(interval);
    }
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
}

// Add unload listener
window.addEventListener('unload', cleanup);
window.safeURL = false;