chrome.runtime.onInstalled.addListener(() => {
  // Initialize defaults without overwriting user preferences
  chrome.storage.local.get(["xbarEnabled", "sidebarPosition", "darkModeEnabled", "columns", "useFirstName"], (data) => {
    const initial = {};
    if (data.xbarEnabled === undefined) initial.xbarEnabled = true;
    if (data.sidebarPosition === undefined) initial.sidebarPosition = "left";
    if (data.darkModeEnabled === undefined) initial.darkModeEnabled = false;
    if (data.columns === undefined) initial.columns = 1; // default columns
    if (data.useFirstName === undefined) initial.useFirstName = false; // default to screen name
    if (Object.keys(initial).length) {
      chrome.storage.local.set(initial);
    }
  });
});
