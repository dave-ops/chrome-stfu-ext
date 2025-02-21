// Create a canvas to analyze snapshots
function setupCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    return canvas.getContext('2d');
  }
  
  // Check if a color is black (or very dark)
  function isBlack(r, g, b) {
    // Define black: low RGB values (e.g., all below 30)
    return r < 30 && g < 30 && b < 30;
  }
  
  // Analyze snapshot for black frame in a specific region (e.g., bottom 50px)
  function checkBlackFrame(snapshotUrl, ctx) {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Handle CORS if needed
    img.onload = () => {
      ctx.canvas.width = img.width;
      ctx.canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
  
      // Sample bottom 50px horizontally across the width
      const regionY = img.height - 50;
      const regionWidth = img.width;
      const regionHeight = 50;
  
      const imageData = ctx.getImageData(0, regionY, regionWidth, regionHeight);
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
  
      const isBlackFrame = blackCount / pixelCount > 0.8; // 80% black pixels
      const video = document.querySelector('video');
      if (video) {
        handleMuteState(isBlackFrame, video);
      }
    };
    img.src = snapshotUrl;
  }
  
  // Monitor video state as a proxy for audio cues
  function monitorVideoState(video) {
    let lastVolume = video.volume;
    let lastTime = video.currentTime;
    let isCommercial = false;
  
    const checkState = () => {
      if (video.paused || video.ended) return;
  
      // Proxy for audio cue: sudden volume change or pause/resume pattern
      const volumeSpike = Math.abs(video.volume - lastVolume) > 0.3; // Significant volume change
      const timeJump = Math.abs(video.currentTime - lastTime) > 5;   // Large time jump (e.g., ad skip)
  
      if (volumeSpike || timeJump) {
        isCommercial = true;
        handleMuteState(true, video);
        console.log('Potential commercial detected (volume/time change): muted');
      } else if (isCommercial && !volumeSpike && !timeJump) {
        isCommercial = false;
        handleMuteState(false, video);
        console.log('Content resumed: unmuted');
      }
  
      lastVolume = video.volume;
      lastTime = video.currentTime;
      requestAnimationFrame(checkState);
    };
  
    video.addEventListener('play', () => requestAnimationFrame(checkState));
  }
  
  // Handle muting/unmuting based on state
  function handleMuteState(shouldMute, video) {
    video.muted = shouldMute;
  }
  
  // Main monitoring function
  function monitorPage() {
    const ctx = setupCanvas();
    let lastState = null;
  
    function captureAndCheck() {
      chrome.runtime.sendMessage({ action: "captureSnapshot" }, (response) => {
        if (response.snapshot) {
          checkBlackFrame(response.snapshot, ctx);
        }
      });
  
      const video = document.querySelector('video');
      if (video) {
        monitorVideoState(video);
      }
    }
  
    // Check every 500ms (adjust for performance)
    setInterval(captureAndCheck, 500);
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
      regionY: -50, // Bottom 50px offset from height
      regionWidth: '100%', // Full width
      regionHeight: 50,
      threshold: 0.8, // 80% black pixels
      volumeThreshold: 0.3, // Volume change threshold for audio proxy
      timeJumpThreshold: 5 // Time jump threshold (seconds) for audio proxy
    };
  
    // Update checkBlackFrame and monitorVideoState to use siteRules
    checkBlackFrame = function(snapshotUrl, ctx) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        ctx.canvas.width = img.width;
        ctx.canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
  
        const regionY = img.height + siteRules.regionY;
        const regionWidth = img.width * (siteRules.regionWidth === '100%' ? 1 : parseFloat(siteRules.regionWidth) / 100);
        const regionHeight = siteRules.regionHeight;
  
        const imageData = ctx.getImageData(0, regionY, regionWidth, regionHeight);
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
  
        const isBlackFrame = blackCount / pixelCount > siteRules.threshold;
        const video = document.querySelector('video');
        if (video) {
          handleMuteState(isBlackFrame, video);
        }
      };
      img.src = snapshotUrl;
    };
  
    monitorVideoState = function(video) {
      let lastVolume = video.volume;
      let lastTime = video.currentTime;
      let isCommercial = false;
  
      const checkState = () => {
        if (video.paused || video.ended) return;
  
        const volumeSpike = Math.abs(video.volume - lastVolume) > siteRules.volumeThreshold;
        const timeJump = Math.abs(video.currentTime - lastTime) > siteRules.timeJumpThreshold;
  
        if (volumeSpike || timeJump) {
          isCommercial = true;
          handleMuteState(true, video);
          console.log('Potential commercial detected (volume/time change): muted');
        } else if (isCommercial && !volumeSpike && !timeJump) {
          isCommercial = false;
          handleMuteState(false, video);
          console.log('Content resumed: unmuted');
        }
  
        lastVolume = video.volume;
        lastTime = video.currentTime;
        requestAnimationFrame(checkState);
      };
  
      video.addEventListener('play', () => requestAnimationFrame(checkState));
    };
  
    monitorPage();
  }
  
  // Run when the page loads
  document.addEventListener('DOMContentLoaded', loadRules);