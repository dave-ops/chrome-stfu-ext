function monitorAdsWithObserver() {
    const video = document.querySelector('video');
    if (!video) return;
  
    const observer = new MutationObserver(() => {
      const adPlaying = isAdPlaying();
      setMuteState(adPlaying);
      console.log(adPlaying ? 'Ad detected: muted' : 'Content resumed: unmuted');
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  monitorAdsWithObserver();