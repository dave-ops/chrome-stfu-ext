document.getElementById('save').addEventListener('click', () => {
    const rules = {
      regionX: parseInt(document.getElementById('regionX').value),
      regionY: parseInt(document.getElementById('regionY').value),
      regionWidth: parseInt(document.getElementById('regionWidth').value),
      regionHeight: parseInt(document.getElementById('regionHeight').value),
      threshold: parseFloat(document.getElementById('threshold').value)
    };
  
    chrome.storage.local.get(['rules'], (result) => {
      const currentUrl = new URL(chrome.runtime.getURL('')).hostname; // Get current site
      const updatedRules = {
        ...result.rules,
        [currentUrl]: rules
      };
      chrome.storage.local.set({ rules: updatedRules }, () => {
        alert('Rules saved!');
      });
    });
  });