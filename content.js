// Function to check if an ad is playing
function isAdPlaying() {
    // YouTube ad indicators
    const adModule = document.querySelector('.ad-showing');
    const adOverlay = document.querySelector('.ytp-ad-player-overlay');
    return adModule || adOverlay;
  }
  
  // Function to mute/unmute the video
  function setMuteState(shouldMute) {
    const video = document.querySelector('video');
    if (video) {
      video.muted = shouldMute;
    }
  }
  
  // Main logic to monitor ad state
  function monitorAds() {
    let lastState = false; // Track previous ad state
    setInterval(() => {
      const adPlaying = isAdPlaying();
      if (adPlaying !== lastState) { // State changed
        setMuteState(adPlaying);     // Mute if ad, unmute if not
        console.log(adPlaying ? 'Ad detected: muted' : 'Content resumed: unmuted');
        lastState = adPlaying;
      }
    }, 500); // Check every 500ms
  }
  
  // Start monitoring when the page loads
  monitorAds();