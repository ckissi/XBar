// Content script to add a sidebar on x.com (Twitter) domain
(() => {
  // Only execute on x.com domain
  if (!window.location.hostname.includes('x.com')) {
    return;
  }

  // Helper function to safely access Chrome APIs with logging
  function safelyAccessChromeAPI(callback, operationDescription = "") {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        console.log(`Accessing Chrome API: ${operationDescription}`);
        callback();
      }
    } catch (error) {
      console.error(`Error accessing Chrome API during ${operationDescription}:`, error);
    }
  }
  
  // Check if the XBar feature is enabled
  safelyAccessChromeAPI(() => {
    chrome.storage.local.get(["xbarEnabled", "sidebarPosition", "darkModeEnabled"], (data) => {
      console.log("XBar enabled state:", data.xbarEnabled);
      console.log("Sidebar position:", data.sidebarPosition);
      console.log("Dark mode:", data.darkModeEnabled);
      // If xbarEnabled is undefined (first install) or true, create the sidebar
      if (data.xbarEnabled === undefined || data.xbarEnabled) {
        createSidebar(data.sidebarPosition || 'left', !!data.darkModeEnabled);
      }
    });
  }, "checking if XBar is enabled");

  // Function to create and insert the sidebar
  function createSidebar(position = 'left', dark = false) {
    // Check if sidebar already exists to avoid duplicates
    if (document.getElementById('xbar-sidebar')) {
      return;
    }

    // Create the sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'xbar-sidebar';
    if (dark) sidebar.classList.add('dark');
    
    // Add the styles for the sidebar
    const style = document.createElement('style');
    style.textContent = `
      #xbar-sidebar {
        --xbar-bg: #ffffff;
        --xbar-border: #e6ecf0;
        --xbar-hover: #f5f8fa;
        --xbar-text: #14171a;
        position: fixed;
        top: 0;
        ${position === 'right' ? 'right: 0;' : 'left: 0;'}
        height: 100vh;
        width: 70px;
        background-color: var(--xbar-bg);
        border-${position === 'right' ? 'left' : 'right'}: 1px solid var(--xbar-border);
        z-index: 9999;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }

      #xbar-sidebar.dark {
        --xbar-bg: #0f1419;
        --xbar-border: #273340;
        --xbar-hover: #161d26;
        --xbar-text: #e6edf3;
      }
      
      .xbar-account {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 15px;
        cursor: pointer;
        width: 100%;
        padding: 5px 0;
        transition: background-color 0.2s;
      }
      
      .xbar-account:hover {
        background-color: var(--xbar-hover);
      }
      
      .xbar-account-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-size: cover;
        background-position: center;
        margin-bottom: 5px;
        border: 1px solid var(--xbar-border);
      }
      
      .xbar-account-name {
        font-size: 10px;
        color: var(--xbar-text);
        text-align: center;
        max-width: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      /* Adjust the main content to make room for sidebar */
      body {
        margin-${position === 'right' ? 'right' : 'left'}: 70px !important;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(sidebar);
    
    // Load accounts from storage
    function loadAccounts() {
      safelyAccessChromeAPI(() => {
        chrome.storage.local.get("accounts", (data) => {
          const allAccounts = data.accounts || [];
          
          // Ensure accounts are unique based on screen_name (case insensitive)
          const screenNameMap = new Map();
          const uniqueAccounts = [];
          
          // Process accounts in reverse to keep the first occurrence (which is likely most important)
          for (let i = allAccounts.length - 1; i >= 0; i--) {
            const account = allAccounts[i];
            const lowerScreenName = account.screen_name.toLowerCase();
            
            if (!screenNameMap.has(lowerScreenName)) {
              screenNameMap.set(lowerScreenName, true);
              uniqueAccounts.unshift(account); // Add to beginning to maintain original order
            }
          }
          
          // Clear sidebar content
          sidebar.innerHTML = '';
          
          if (uniqueAccounts.length === 0) {
            // If no accounts are added, show a message
            const placeholderElement = document.createElement('div');
            placeholderElement.className = 'xbar-account';
            placeholderElement.innerHTML = `
              <div class="xbar-account-name" style="padding: 15px 5px; text-align: center;">No accounts added. Open extension options to add accounts.</div>
            `;
            sidebar.appendChild(placeholderElement);
          } else {
            // Add accounts to the sidebar
            uniqueAccounts.forEach(account => {
              const accountElement = document.createElement('div');
              accountElement.className = 'xbar-account';
              accountElement.title = account.name;
              
              const iconElement = document.createElement('div');
              iconElement.className = 'xbar-account-icon';
              iconElement.style.backgroundImage = `url(${account.avatar_url})`;
              
              const nameElement = document.createElement('div');
              nameElement.className = 'xbar-account-name';
              nameElement.textContent = account.screen_name;
              
              accountElement.appendChild(iconElement);
              accountElement.appendChild(nameElement);
              sidebar.appendChild(accountElement);
              
              // Add click handler to visit profile
              accountElement.addEventListener('click', () => {
                window.location.href = `https://x.com/${account.screen_name}`;
              });
            });
          }
        });
      }, "loading accounts");
    }
    
    // Initial loading of accounts
    loadAccounts();
    
    // Set up a mutation observer to detect changes in the sidebar
    const observer = new MutationObserver((mutations) => {
      // Check if new accounts have been added to the page
      const accountsContainer = document.querySelector('#xbar-sidebar');
      if (accountsContainer && accountsContainer.children.length === 0) {
        loadAccounts();
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Create the sidebar when DOM is fully loaded is now handled in the chrome.storage.local.get callback
  
  // Handle navigation between pages (for SPAs like x.com)
  window.addEventListener('popstate', () => {
    safelyAccessChromeAPI(() => {
      chrome.storage.local.get(["xbarEnabled", "sidebarPosition", "darkModeEnabled"], (data) => {
        if (data.xbarEnabled === undefined || data.xbarEnabled) {
          createSidebar(data.sidebarPosition || 'left', !!data.darkModeEnabled);
        }
      });
    }, "handling page navigation");
  });
  
  // Also look for dynamic content changes that might indicate page navigation
  const contentObserver = new MutationObserver((mutations) => {
    safelyAccessChromeAPI(() => {
      chrome.storage.local.get(["xbarEnabled", "sidebarPosition", "darkModeEnabled"], (data) => {
        if (data.xbarEnabled === undefined || data.xbarEnabled) {
          createSidebar(data.sidebarPosition || 'left', !!data.darkModeEnabled);
        }
      });
    }, "checking after DOM mutation");
  });
  
  // Start observing once the body is available
  if (document.body) {
    contentObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      contentObserver.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
