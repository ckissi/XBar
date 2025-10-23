document.addEventListener("DOMContentLoaded", () => {
  const xbarToggle = document.getElementById("xbarToggle");
  const positionSelector = document.getElementById("position-selector");
  const columnsSelector = document.getElementById("columns-selector");
  const darkModeToggle = document.getElementById("darkmode-toggle");
  const firstNameToggle = document.getElementById("firstname-toggle");

  // Check current state of the XBar feature, position, columns, dark mode, and name preference
  chrome.storage.local.get(["xbarEnabled", "sidebarPosition", "darkModeEnabled", "columns", "useFirstName"], (data) => {
    updateXbarToggleState(data.xbarEnabled);
    
    // Set position selector to saved value or default to left
    if (data.sidebarPosition) {
      positionSelector.value = data.sidebarPosition;
    }

    // Set columns selector (default 1)
    if (columnsSelector) {
      const cols = Math.min(3, Math.max(1, parseInt(data.columns || 1, 10)));
      columnsSelector.value = String(cols);
    }

    // Set dark mode checkbox
    if (darkModeToggle) {
      darkModeToggle.checked = !!data.darkModeEnabled;
    }

    // Set first name checkbox
    if (firstNameToggle) {
      firstNameToggle.checked = !!data.useFirstName;
    }
  });
  
  // Add event listener for XBar toggle button
  xbarToggle.addEventListener("click", () => {
    chrome.storage.local.get("xbarEnabled", (data) => {
      const newState = !data.xbarEnabled;
      
      chrome.storage.local.set({ xbarEnabled: newState }, () => {
        updateXbarToggleState(newState);
        
        // Show status message
        showStatusMessage(newState ? "XBar Enabled!" : "XBar Disabled!");
        
        // Reload any open x.com tabs to apply/remove the sidebar
        reloadXComTabs();
      });
    });
  });
  
  // Add event listener for position selector
  positionSelector.addEventListener("change", () => {
    const position = positionSelector.value;
    
    chrome.storage.local.set({ sidebarPosition: position }, () => {
      showStatusMessage(`XBar position set to ${position}!`);
      
      // Reload any open x.com tabs to apply the new position
      reloadXComTabs();
    });
  });

  // Add event listener for columns selector
  if (columnsSelector) {
    columnsSelector.addEventListener("change", () => {
      let cols = parseInt(columnsSelector.value, 10) || 1;
      cols = Math.min(3, Math.max(1, cols));
      chrome.storage.local.set({ columns: cols }, () => {
        showStatusMessage(`Columns set to ${cols}`);
        reloadXComTabs();
      });
    });
  }

  // Add event listener for dark mode toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", () => {
      const enabled = darkModeToggle.checked;
      chrome.storage.local.set({ darkModeEnabled: enabled }, () => {
        showStatusMessage(enabled ? "Dark mode enabled" : "Dark mode disabled");
        reloadXComTabs();
      });
    });
  }

  // Add event listener for first name toggle
  if (firstNameToggle) {
    firstNameToggle.addEventListener("change", () => {
      const useFirstName = firstNameToggle.checked;
      chrome.storage.local.set({ useFirstName }, () => {
        showStatusMessage(useFirstName ? "Showing first name" : "Showing screen name");
        reloadXComTabs();
      });
    });
  }
  
  // Open options page on link click
  document.getElementById("options-link").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // Helper function to show status message
  function showStatusMessage(message) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = "status success";
    status.style.display = "block";
    
    // Hide message after 2 seconds
    setTimeout(() => {
      status.style.display = "none";
    }, 2000);
  }
  
  // Helper function to reload X.com tabs
  function reloadXComTabs() {
    chrome.tabs.query({ url: ["*://x.com/*", "*://*.x.com/*"] }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });
  }
});

function updateXbarToggleState(xbarEnabled) {
  const button = document.getElementById("xbarToggle");
  if (!button) return;
  
  button.textContent = xbarEnabled ? "Disable XBar" : "Enable XBar";
  // Toggle danger style when disabled request is next
  if (xbarEnabled) {
    button.classList.remove("inactive");
  } else {
    button.classList.add("inactive");
  }
}
