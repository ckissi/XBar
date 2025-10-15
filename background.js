chrome.runtime.onInstalled.addListener(() => {
  // Initialize defaults without overwriting user preferences
  chrome.storage.local.get(["xbarEnabled", "sidebarPosition", "darkModeEnabled"], (data) => {
    const initial = {};
    if (data.xbarEnabled === undefined) initial.xbarEnabled = true;
    if (data.sidebarPosition === undefined) initial.sidebarPosition = "left";
    if (data.darkModeEnabled === undefined) initial.darkModeEnabled = false;
    if (Object.keys(initial).length) {
      chrome.storage.local.set(initial);
    }
  });
});
