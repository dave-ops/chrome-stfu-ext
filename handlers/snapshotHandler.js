// Create a canvas to analyze the snapshot
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
        video.muted = isBlackFrame;
        console.log(isBlackFrame ? 'Black frame detected: muted' : 'Content resumed: unmuted');
      }
    };
    img.src = snapshotUrl;
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
    }
  
    // Check every 500ms (adjust for performance)
    setInterval(captureAndCheck, 500);
  }
  
  // Run when the page loads
  document.addEventListener('DOMContentLoaded', monitorPage);