chrome.runtime.onInstalled.addListener(() => {
  // Initialize state - enable X sidebar by default
  chrome.storage.local.set({ 
    xbarEnabled: true 
  });
});
