// Create a canvas to sample video pixels
function setupCanvas(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.display = 'none'; // Hide it
    document.body.appendChild(canvas);
    return canvas.getContext('2d');
  }
  
  // Check if a color is black (or very dark)
  function isBlack(r, g, b) {
    // Define black: low RGB values (e.g., all below 30)
    return r < 30 && g < 30 && b < 30;
  }
  
  // Sample pixels from the bottom region and decide mute state
  function checkRegion(video, ctx) {
    // Define sample region (e.g., bottom 50px horizontally across the width)
    const regionX = 0;
    const regionY = video.videoHeight - 50; // 50px from the bottom
    const regionWidth = video.videoWidth;
    const regionHeight = 50;
  
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  
    // Get pixel data from the region
    const imageData = ctx.getImageData(regionX, regionY, regionWidth, regionHeight);
    const pixels = imageData.data; // RGBA array
  
    // Calculate if the region is mostly black
    let blackCount = 0;
    const pixelCount = regionWidth * regionHeight;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (isBlack(r, g, b)) {
        blackCount++;
      }
    }
  
    // If more than 80% of pixels are black, consider it a black frame
    return blackCount / pixelCount > 0.8;
  }
  
  // Main monitoring function
  function monitorVideo() {
    const video = document.querySelector('video');
    if (!video) {
      console.log('No video found on page.');
      return;
    }
  
    const ctx = setupCanvas(video);
    let lastState = null;
  
    function checkFrame() {
      if (video.paused || video.ended) return; // Skip if not playing
  
      const isBlackFrame = checkRegion(video, ctx);
      if (isBlackFrame !== lastState) { // State changed
        video.muted = isBlackFrame;    // Mute if black, unmute if not
        console.log(isBlackFrame ? 'Black frame detected: muted' : 'Content resumed: unmuted');
        lastState = isBlackFrame;
      }
      requestAnimationFrame(checkFrame); // Run on next frame
    }
  
    video.addEventListener('play', () => requestAnimationFrame(checkFrame));
  }
  
  // Load rules from storage and apply
  async function loadRules() {
    const currentUrl = window.location.hostname;
    const rules = await new Promise(resolve => {
      chrome.storage.local.get(['rules'], (result) => {
        resolve(result.rules || {});
      });
    });
  
    const siteRules = rules[currentUrl] || {
      regionX: 0,
      regionY: video.videoHeight - 50, // Default: bottom 50px
      regionWidth: video.videoWidth,
      regionHeight: 50,
      threshold: 0.8 // Default: 80% black pixels
    };
  
    // Update checkRegion to use siteRules
    checkRegion = function(video, ctx) {
      // Use siteRules for region and threshold
      const { regionX, regionY, regionWidth, regionHeight, threshold } = siteRules;
  
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageData = ctx.getImageData(regionX, regionY, regionWidth, regionHeight);
      const pixels = imageData.data;
  
      let blackCount = 0;
      const pixelCount = regionWidth * regionHeight;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        if (isBlack(r, g, b)) {
          blackCount++;
        }
      }
  
      return blackCount / pixelCount > threshold;
    };
  
    monitorVideo();
  }
  
  // Run when the page loads
  document.addEventListener('DOMContentLoaded', loadRules);