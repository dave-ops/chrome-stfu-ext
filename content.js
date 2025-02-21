// Known providers and their observers
const KNOWN_PROVIDERS = {
  'cnbc.com': { observer: 'cnbcObserver', detection: 'pixel' },
  'youtube.com': { observer: 'youtubeObserver', detection: 'dom' },
  'amazon.com': { observer: 'primeObserver', detection: 'pixel' },
  'tubi.tv': { observer: 'tubiObserver', detection: 'pixel' }
};

// Create a canvas to analyze snapshots
function setupCanvas() {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  document.body.appendChild(canvas);
  return canvas.getContext('2d');
}

// Check if a color is black (or very dark)
function isBlack(r, g, b) {
  return r < 30 && g < 30 && b < 30;
}

// Analyze snapshot for black frame in a specific region
function checkBlackFrame(snapshotUrl, ctx, rules) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { regionX, regionY, regionWidth, regionHeight, threshold } = rules;
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

    const isBlackFrame = blackCount / pixelCount > threshold;
    const video = document.querySelector('video');
    if (video) {
      video.muted = isBlackFrame;
      console.log(isBlackFrame ? 'Black frame detected: muted' : 'Content resumed: unmuted');
    }
  };
  img.src = snapshotUrl;
}

// Monitor video state as a proxy for audio cues
function monitorVideoState(video, rules) {
  let lastVolume = video.volume;
  let lastTime = video.currentTime;
  let isCommercial = false;

  const checkState = () => {
    if (video.paused || video.ended) return;

    const volumeSpike = Math.abs(video.volume - lastVolume) > rules.volumeThreshold;
    const timeJump = Math.abs(video.currentTime - lastTime) > rules.timeJumpThreshold;

    if (volumeSpike || timeJump) {
      isCommercial = true;
      video.muted = true;
      console.log('Potential commercial detected (volume/time change): muted');
    } else if (isCommercial && !volumeSpike && !timeJump) {
      isCommercial = false;
      video.muted = false;
      console.log('Content resumed: unmuted');
    }

    lastVolume = video.volume;
    lastTime = video.currentTime;
    requestAnimationFrame(checkState);
  };

  video.addEventListener('play', () => requestAnimationFrame(checkState));
}

// CNBC Observer (Pixel Detection)
function cnbcObserver(video, ctx) {
  const rules = {
    regionX: 0,
    regionY: video.videoHeight - 50,
    regionWidth: video.videoWidth,
    regionHeight: 50,
    threshold: 0.8,
    volumeThreshold: 0.3,
    timeJumpThreshold: 5
  };

  function captureAndCheck() {
    chrome.runtime.sendMessage({ action: "captureSnapshot" }, (response) => {
      if (response.snapshot) {
        checkBlackFrame(response.snapshot, ctx, rules);
      }
    });
  }

  setInterval(captureAndCheck, 1000); // Throttle to 1 second for performance
  monitorVideoState(video, rules);
}

// YouTube Observer (DOM Detection)
function youtubeObserver(video) {
  let isAdPlaying = false;

  function checkAd() {
    const adModule = document.querySelector('.ad-showing');
    const adOverlay = document.querySelector('.ytp-ad-player-overlay');
    const adPlaying = adModule || adOverlay;

    if (adPlaying !== isAdPlaying) {
      video.muted = adPlaying;
      console.log(adPlaying ? 'YouTube ad detected: muted' : 'Content resumed: unmuted');
      isAdPlaying = adPlaying;
    }
    requestAnimationFrame(checkAd);
  }

  video.addEventListener('play', () => requestAnimationFrame(checkAd));
}

// Amazon Prime Observer (Pixel Detection, default)
function primeObserver(video, ctx) {
  const rules = {
    regionX: 0,
    regionY: video.videoHeight - 50,
    regionWidth: video.videoWidth,
    regionHeight: 50,
    threshold: 0.8,
    volumeThreshold: 0.3,
    timeJumpThreshold: 5
  };

  function captureAndCheck() {
    chrome.runtime.sendMessage({ action: "captureSnapshot" }, (response) => {
      if (response.snapshot) {
        checkBlackFrame(response.snapshot, ctx, rules);
      }
    });
  }

  setInterval(captureAndCheck, 1000); // Throttle to 1 second for performance
  monitorVideoState(video, rules);
}

// Tubi Observer (Pixel Detection, default)
function tubiObserver(video, ctx) {
  const rules = {
    regionX: 0,
    regionY: video.videoHeight - 50,
    regionWidth: video.videoWidth,
    regionHeight: 50,
    threshold: 0.8,
    volumeThreshold: 0.3,
    timeJumpThreshold: 5
  };

  function captureAndCheck() {
    chrome.runtime.sendMessage({ action: "captureSnapshot" }, (response) => {
      if (response.snapshot) {
        checkBlackFrame(response.snapshot, ctx, rules);
      }
    });
  }

  setInterval(captureAndCheck, 1000); // Throttle to 1 second for performance
  monitorVideoState(video, rules);
}

// Load rules from storage
async function loadRules() {
  const currentUrl = window.location.hostname;
  const rules = await new Promise(resolve => {
    chrome.storage.local.get(['rules'], (result) => {
      resolve(result.rules || {});
    });
  });
  return rules[currentUrl] || {};
}

// Main function to handle the workflow
async function initializeExtension() {
  const video = document.querySelector('video');
  if (!video) {
    // Check for audio-only content (e.g., <audio> or tab audio)
    const audio = document.querySelector('audio');
    if (!audio) {
      console.log('No media found, going to sleep.');
      return; // Go to sleep
    }
    // Attempt to mute tab audio if no video
    chrome.runtime.sendMessage({ action: "muteTabAudio" }, (response) => {
      if (response.success) {
        console.log('Tab audio muted (audio-only content).');
      }
    });
    return;
  }

  const currentHost = window.location.hostname;
  const provider = KNOWN_PROVIDERS[currentHost];

  if (provider) {
    const ctx = setupCanvas();
    const observer = provider.observer;
    if (observer === 'cnbcObserver') {
      cnbcObserver(video, ctx);
    } else if (observer === 'youtubeObserver') {
      youtubeObserver(video);
    } else if (observer === 'primeObserver') {
      primeObserver(video, ctx);
    } else if (observer === 'tubiObserver') {
      tubiObserver(video, ctx);
    }
  } else {
    // Unknown provider, prompt user via popup
    chrome.runtime.sendMessage({ action: "unknownProvider" }, (response) => {
      console.log('Prompting user to create new provider.');
    });
  }
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkMedia") {
    initializeExtension();
  }
});

// Run when the page loads or tab updates
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: "checkMedia" });
});