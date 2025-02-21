// Listen for messages from content script to capture a snapshot
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "captureSnapshot") {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        sendResponse({ snapshot: dataUrl });
      });
      return true; // Keep message channel open for async response
    }
  });