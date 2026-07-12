// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const replaceBtn = document.getElementById('replaceBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const toggleBtn = document.getElementById('toggleBtn');
    const statusDisplay = document.getElementById('statusDisplay');
    const autoToggle = document.getElementById('autoReplaceToggle');

    // Load auto-replace setting
    chrome.storage.sync.get(['autoReplace'], (result) => {
        const isEnabled = result.autoReplace !== false;
        autoToggle.checked = isEnabled;
        updateStatus(isEnabled ? '🟢 Auto-replace enabled' : '⏸️ Auto-replace paused');
    });

    // Save auto-replace setting
    autoToggle.addEventListener('change', () => {
        const isEnabled = autoToggle.checked;
        chrome.storage.sync.set({ autoReplace: isEnabled });
        updateStatus(isEnabled ? '🟢 Auto-replace enabled' : '⏸️ Auto-replace paused');
    });

    // Replace images on current tab
    replaceBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                updateStatus('⚠️ No active tab found');
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'replaceImages' 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    updateStatus('⚠️ Refresh the page and try again');
                    return;
                }
                if (response && response.count !== undefined) {
                    updateStatus(`✅ Replaced ${response.count} images with cats! 🐱`);
                } else {
                    updateStatus('✅ Cat images applied!');
                }
            });
        });
    });

    // Restore original images
    restoreBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                updateStatus('⚠️ No active tab found');
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'restoreImages' 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    updateStatus('⚠️ Refresh the page and try again');
                    return;
                }
                updateStatus('↩️ Original images restored');
            });
        });
    });

    // Toggle auto-replace on current page
    toggleBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                updateStatus('⚠️ No active tab found');
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'toggleAutoReplace' 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    updateStatus('⚠️ Refresh the page and try again');
                    return;
                }
                if (response && response.state !== undefined) {
                    const state = response.state ? 'enabled' : 'disabled';
                    updateStatus(`⏸️ Auto-replace ${state} on this page`);
                }
            });
        });
    });

    function updateStatus(message) {
        statusDisplay.innerHTML = message;
    }

    // Listen for status updates from content script via background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'statusUpdate') {
            updateStatus(message.text);
        }
    });
});