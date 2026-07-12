// background.js
console.log('🐱 Cat Replacer background service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Cat Replacer installed! 🐱');
    
    chrome.storage.sync.get(['autoReplace'], (result) => {
        if (result.autoReplace === undefined) {
            chrome.storage.sync.set({ autoReplace: true });
        }
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'statusUpdate') {
        // Only send if there's a listener (popup might be closed)
        try {
            chrome.runtime.sendMessage(message).catch(() => {
                // Ignore - popup might be closed
            });
        } catch (e) {
            // Ignore
        }
        sendResponse({ received: true });
    }
    return true;
});

// Set badge text when extension starts
chrome.runtime.onStartup.addListener(() => {
    try {
        chrome.action.setBadgeText({ text: '🐱' });
        chrome.action.setBadgeBackgroundColor({ color: '#1a5bbf' });
    } catch (e) {
        // Ignore
    }
});