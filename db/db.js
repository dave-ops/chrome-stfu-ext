// Example: Save rules for the current site
function saveRules(rules) {
    const currentUrl = window.location.hostname;
    chrome.storage.local.get(['rules'], (result) => {
      const updatedRules = {
        ...result.rules,
        [currentUrl]: rules
      };
      chrome.storage.local.set({ rules: updatedRules }, () => {
        console.log('Rules saved for', currentUrl);
      });
    });
  }
  
  // Example rule object for CNBC or YouTube
  const cnbcRules = {
    regionX: 0,
    regionY: video.videoHeight - 50, // Bottom 50px
    regionWidth: video.videoWidth,
    regionHeight: 50,
    threshold: 0.8 // 80% black pixels
  };
  
  // Call saveRules(cnbcRules) when needed