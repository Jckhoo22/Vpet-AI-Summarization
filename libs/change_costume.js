document.addEventListener("DOMContentLoaded", () => {
    setupCostumeChange();
    messageBox = document.getElementById("message-box");
});

// Track click count and folder state globally
let clickCount = 0;
window.folder_path = "0"; // Default folder, accessible globally

// Set up the costume change button
function setupCostumeChange() {
    const changeCostumeButton = document.getElementById("menu-change-costume");
    if (!changeCostumeButton) {
        console.warn("Costume change button not found");
        return;
    }

    changeCostumeButton.addEventListener("click", changeCostume);
}

// Handle costume change logic (only toggle folder)
function changeCostume() {
    clickCount++;
    window.folder_path = clickCount % 2 === 1 ? "1" : "0";
}