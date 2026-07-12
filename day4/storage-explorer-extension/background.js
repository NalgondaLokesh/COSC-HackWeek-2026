// Service worker for background tasks
chrome.runtime.onInstalled.addListener(() => {
  console.log('Storage Explorer installed');
});

// Optional: Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStorageData') {
    // This is handled by content script directly
    sendResponse({ success: true });
  }
  return true;
});