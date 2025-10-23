document.addEventListener("DOMContentLoaded", () => {

  const statusElement = document.getElementById("status");
  const accountList = document.getElementById("account-list");

  // Function to show status message
  function showStatus(message, isSuccess) {
    statusElement.textContent = message;
    statusElement.className = `status ${isSuccess ? "success" : "error"}`;
    statusElement.style.display = "block";
    setTimeout(() => {
      statusElement.style.display = "none";
    }, 3000);
  }

  // Function to fetch account data
  async function fetchAccountData(accountName) {
    try {
      const response = await fetch(`https://api.fxtwitter.com/${accountName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error("Failed to fetch account data:", error);
      return null;
    }
  }

  // Function to save account locally
  async function saveAccountLocally(accountData) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = accountData.avatar_url;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        accountData.avatar_url = dataUrl; // Change to local URL
        resolve(accountData);
      };
      img.onerror = reject;
    });
  }

  // Function to render accounts with drag-and-drop capability
  function renderAccounts(accounts) {
    accountList.innerHTML = "";
    
    // Add instructions for drag-and-drop if there are accounts
    if (accounts.length > 1) {
      const instructions = document.createElement("div");
      instructions.className = "drag-instructions";
      instructions.textContent = "Drag to reorder accounts";
      accountList.appendChild(instructions);
    }
    
    accounts.forEach((account, index) => {
      const card = document.createElement("div");
      card.className = "account-card";
      card.draggable = true;
      card.dataset.index = index;
      card.dataset.username = account.screen_name;
      
      // Add drag handle
      card.innerHTML = `
        <div class="drag-handle">::</div>
        <img class="account-avatar" src="${account.avatar_url}" alt="${account.name}" />
        <div class="account-info">
          <div class="account-name">${account.name}</div>
          <div class="account-username">@${account.screen_name}</div>
        </div>
        <div class="account-actions">
          <button class="remove" data-username="${account.screen_name}">Remove</button>
        </div>
      `;
      
      // Add drag event listeners
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragover", handleDragOver);
      card.addEventListener("dragenter", handleDragEnter);
      card.addEventListener("dragleave", handleDragLeave);
      card.addEventListener("dragend", handleDragEnd);
      card.addEventListener("drop", handleDrop);
      
      accountList.appendChild(card);
    });
  }

  // Function to remove duplicate accounts from storage
  function cleanupDuplicateAccounts(callback) {
    chrome.storage.local.get("accounts", (data) => {
      const accounts = data.accounts || [];
      if (accounts.length === 0) {
        if (callback) callback(accounts);
        return;
      }
      
      // Find unique accounts (case insensitive screen_name)
      const screenNameMap = new Map();
      const uniqueAccounts = [];
      
      accounts.forEach(account => {
        const lowerScreenName = account.screen_name.toLowerCase();
        if (!screenNameMap.has(lowerScreenName)) {
          screenNameMap.set(lowerScreenName, true);
          uniqueAccounts.push(account);
        }
      });
      
      // If we found duplicates, update the storage
      if (uniqueAccounts.length < accounts.length) {
        console.log(`Cleaned up ${accounts.length - uniqueAccounts.length} duplicate accounts`);
        chrome.storage.local.set({ accounts: uniqueAccounts }, () => {
          if (callback) callback(uniqueAccounts);
        });
      } else {
        if (callback) callback(accounts);
      }
    });
  }
  
  // Fetch, clean up duplicates, and render stored accounts
  cleanupDuplicateAccounts((accounts) => {
    renderAccounts(accounts);
  });

  // Extract username from different input formats
  function extractUsername(input) {
    // Handle full URL format: https://x.com/username
    if (input.includes('x.com/')) {
      const urlMatch = input.match(/x\.com\/([^/\s]+)/);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }
    }
    
    // Handle @username format
    if (input.startsWith('@')) {
      return input.substring(1);
    }
    
    // Already just the username
    return input;
  }

  // Add account on click
  document.getElementById("add-account").addEventListener("click", async () => {
    const accountInput = document.getElementById("account-input");
    const rawInput = accountInput.value.trim();
    if (!rawInput) {
      showStatus("Please enter an account name.", false);
      return;
    }
    
    // Extract the username from whatever format was entered
    const accountName = extractUsername(rawInput);
    console.log("Extracted username:", accountName);
    
    showStatus("Adding account...", true);
    const accountData = await fetchAccountData(accountName);
    if (!accountData) {
      showStatus("Failed to fetch account. Please try again.", false);
      return;
    }

    try {
      const enrichedData = await saveAccountLocally(accountData);
      chrome.storage.local.get("accounts", (data) => {
        const accounts = data.accounts || [];
        
        // Check if this account already exists in the list
        const isDuplicate = accounts.some(account => 
          account.screen_name.toLowerCase() === enrichedData.screen_name.toLowerCase());
        
        if (isDuplicate) {
          showStatus(`Account @${enrichedData.screen_name} already exists in your list.`, false);
          return;
        }
        
        accounts.push(enrichedData);
        chrome.storage.local.set({ accounts }, () => {
          renderAccounts(accounts);
          showStatus(`Account @${enrichedData.screen_name} added.`, true);
          // Clear input field after successful add
          accountInput.value = "";
        });
      });
    } catch (error) {
      showStatus("Failed to load avatar image.", false);
    }
  });

  // Handle drag and drop events
  let draggedElement = null;

  function handleDragStart(event) {
    this.style.opacity = '0.4';
    draggedElement = this;
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event) {
    if (event.preventDefault) {
      event.preventDefault();
    }
    event.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter(event) {
    this.classList.add('over');
  }

  function handleDragLeave(event) {
    this.classList.remove('over');
  }

  function handleDrop(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    
    if (draggedElement !== this) {
      const fromIndex = parseInt(draggedElement.dataset.index, 10);
      const toIndex = parseInt(this.dataset.index, 10);
      
      chrome.storage.local.get("accounts", (data) => {
        const accounts = data.accounts || [];
        const movedAccount = accounts.splice(fromIndex, 1)[0];
        accounts.splice(toIndex, 0, movedAccount);
        
        // Save updated order
        chrome.storage.local.set({ accounts }, () => {
          renderAccounts(accounts);
          showStatus("Account order updated", true);
        });
      });
    }
    return false;
  }

  function handleDragEnd(event) {
    this.style.opacity = '1';
    document.querySelectorAll('.account-card').forEach(card => {
      card.classList.remove('over');
    });
  }

  // Remove account on click
  accountList.addEventListener("click", (event) => {
    if (event.target.matches("button.remove")) {
      const username = event.target.getAttribute("data-username");
      chrome.storage.local.get("accounts", (data) => {
        const accounts = data.accounts || [];
        const updatedAccounts = accounts.filter(account => account.screen_name !== username);
        chrome.storage.local.set({ accounts: updatedAccounts }, () => {
          renderAccounts(updatedAccounts);
          showStatus("Account removed.", true);
        });
      });
    }
  });

  // Export accounts to JSON
  document.getElementById("export-accounts").addEventListener("click", () => {
    chrome.storage.local.get("accounts", (data) => {
      const accounts = data.accounts || [];
      if (accounts.length === 0) {
        showStatus("No accounts to export.", false);
        return;
      }

      const jsonString = JSON.stringify(accounts, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `xbar-accounts-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showStatus(`Exported ${accounts.length} account(s).`, true);
    });
  });

  // Import accounts from JSON
  document.getElementById("import-accounts").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document.getElementById("import-file").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedAccounts = JSON.parse(e.target.result);
        
        // Validate imported data
        if (!Array.isArray(importedAccounts)) {
          showStatus("Invalid JSON format. Expected an array of accounts.", false);
          return;
        }

        // Validate account structure
        const isValid = importedAccounts.every(account => 
          account.name && account.screen_name && account.avatar_url
        );
        
        if (!isValid) {
          showStatus("Invalid account data. Each account must have name, screen_name, and avatar_url.", false);
          return;
        }

        chrome.storage.local.get("accounts", (data) => {
          const existingAccounts = data.accounts || [];
          const existingScreenNames = new Set(
            existingAccounts.map(acc => acc.screen_name.toLowerCase())
          );
          
          // Filter out duplicates from imported accounts
          const newAccounts = importedAccounts.filter(account => 
            !existingScreenNames.has(account.screen_name.toLowerCase())
          );
          
          if (newAccounts.length === 0) {
            showStatus("All imported accounts already exist.", false);
            return;
          }
          
          const mergedAccounts = [...existingAccounts, ...newAccounts];
          chrome.storage.local.set({ accounts: mergedAccounts }, () => {
            renderAccounts(mergedAccounts);
            showStatus(`Imported ${newAccounts.length} new account(s). ${importedAccounts.length - newAccounts.length} duplicate(s) skipped.`, true);
          });
        });
      } catch (error) {
        showStatus("Failed to parse JSON file. Please check the file format.", false);
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = "";
  });
});
