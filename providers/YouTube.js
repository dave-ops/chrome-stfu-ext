// Create a canvas to sample video pixels
function setupCanvas(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.display = 'none'; // Hide it
    document.body.appendChild(canvas);
    return canvas.getContext('2d');
  }
  
  // Check if a color is "blue-ish"
  function isBlueish(r, g, b) {
    // Define blue-ish: high blue (b), lower red/green (r, g)
    return b > 100 && b > r * 1.5 && b > g * 1.5;
  }
  
  // Sample pixels from a region and decide mute state
  function checkRegion(video, ctx) {
    // Define sample region (e.g., top-left 50x50px)
    const regionX = 0;
    const regionY = 0;
    const regionWidth = 50;
    const regionHeight = 50;
  
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  
    // Get pixel data from the region
    const imageData = ctx.getImageData(regionX, regionY, regionWidth, regionHeight);
    const pixels = imageData.data; // RGBA array
  
    // Calculate average RGB
    let rTotal = 0, gTotal = 0, bTotal = 0;
    const pixelCount = regionWidth * regionHeight;
    for (let i = 0; i < pixels.length; i += 4) {
      rTotal += pixels[i];     // Red
      gTotal += pixels[i + 1]; // Green
      bTotal += pixels[i + 2]; // Blue
      // Ignore alpha (pixels[i + 3])
    }
  
    const avgR = rTotal / pixelCount;
    const avgG = gTotal / pixelCount;
    const avgB = bTotal / pixelCount;
  
    return isBlueish(avgR, avgG, avgB);
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
  
      const isBlue = checkRegion(video, ctx);
      if (isBlue !== lastState) { // State changed
        video.muted = !isBlue;    // Mute if not blue, unmute if blue
        console.log(isBlue ? 'Blue detected: unmuted' : 'Non-blue detected: muted');
        lastState = isBlue;
      }
      requestAnimationFrame(checkFrame); // Run on next frame
    }
  
    video.addEventListener('play', () => requestAnimationFrame(checkFrame));
  }
  
  monitorVideo();