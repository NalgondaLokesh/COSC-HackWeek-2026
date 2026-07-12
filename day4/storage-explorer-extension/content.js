// Content script for interacting with page storage
// This can be used for additional functionality if needed

// Helper function to get storage data (used by popup)
function getStorageData() {
  // This is defined in popup.js but kept here for reference
  // The popup injects this function dynamically
}

// Listen for storage events to update the UI
window.addEventListener('storage', (e) => {
  // Optional: Send message to popup if open
  chrome.runtime.sendMessage({
    action: 'storageUpdated',
    data: { key: e.key, oldValue: e.oldValue, newValue: e.newValue }
  });
});