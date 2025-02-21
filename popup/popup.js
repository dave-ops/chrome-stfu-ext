document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save');
    const newProviderForm = document.getElementById('newProviderForm');
  
    saveBtn.addEventListener('click', () => {
      const rules = {
        regionX: 0,
        regionY: parseInt(document.getElementById('regionY').value) || -50,
        regionWidth: document.getElementById('regionWidth').value === '100%' ? '100%' : parseInt(document.getElementById('regionWidth').value) || '100%',
        regionHeight: parseInt(document.getElementById('regionHeight').value) || 50,
        threshold: parseFloat(document.getElementById('threshold').value) || 0.8,
        volumeThreshold: parseFloat(document.getElementById('volumeThreshold').value) || 0.3,
        timeJumpThreshold: parseFloat(document.getElementById('timeJumpThreshold').value) || 5,
        detectionMethod: document.querySelector('input[name="detectionMethod"]:checked').value || 'pixel'
      };
  
      const currentUrl = new URL(chrome.runtime.getURL('')).hostname;
      chrome.storage.local.get(['rules'], (result) => {
        const updatedRules = {
          ...result.rules,
          [currentUrl]: rules
        };
        chrome.storage.local.set({ rules: updatedRules }, () => {
          alert('Rules saved for new provider!');
          window.close();
        });
      });
    });
  
    // Show form for new provider
    chrome.runtime.sendMessage({ action: "getCurrentUrl" }, (response) => {
      if (response.url) {
        document.getElementById('providerUrl').textContent = response.url;
        newProviderForm.style.display = 'block';
      }
    });
  });