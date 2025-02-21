// Monitor the active tab and wake up on URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      chrome.tabs.sendMessage(tabId, { action: "checkMedia" });
    }
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "captureSnapshot") {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        sendResponse({ snapshot: dataUrl });
      });
      return true; // Keep message channel open for async response
    } else if (message.action === "unknownProvider") {
      chrome.action.openPopup(); // Open popup for user input
    } else if (message.action === "muteTabAudio") {
      chrome.tabs.update(sender.tab.id, { muted: true }, () => {
        sendResponse({ success: true });
      });
      return true;
    } else if (message.action === "unmuteTabAudio") {
      chrome.tabs.update(sender.tab.id, { muted: false }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  });