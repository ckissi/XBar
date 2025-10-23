# X Bar – Account Sidebar

## Overview

X Bar is a Chrome extension that adds a compact account launcher to every page on `x.com`. The extension renders a fixed sidebar showing the avatars and handles you care about most so you can jump between profiles without opening extra tabs or navigating menus.

## Key Features

- **Account sidebar on every X page** – The content script in `xbar-content.js` injects a persistent sidebar that stays in view while you browse.
- **Drag-and-drop ordering** – Rearrange accounts directly in the options page (`options.html`/`options.js`) with native HTML5 drag-and-drop support.
- **Duplicate prevention** – Prevents adding the same account twice (case insensitive) to keep the sidebar tidy.
- **Quick profile switching** – Clicking an entry navigates to `https://x.com/<handle>` immediately.
- **Configurable placement** – Choose whether the sidebar pins to the left or right edge via the popup (`popup.html`/`popup.js`).
- **Enable/disable toggle** – Temporarily hide the sidebar without uninstalling, using the popup toggle backed by `chrome.storage.local`.
- **Dark mode** – Toggle a darker theme for the sidebar from the popup. Persisted per-browser via `chrome.storage.local`.
- **Multi-column layout** – View more accounts at once with an optional multi-column sidebar layout.
- **Name display preference** – Choose whether to show the profile’s real name or @handle in the sidebar.
- **Import/Export accounts** – Backup or migrate your list as JSON from the Options page; duplicates are skipped on import.

## Installation

1. Clone or download this repository.
2. Visit `chrome://extensions/` in Chrome.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the project directory.
5. The "X Bar – Account Sidebar" extension should now appear in the toolbar.

## Usage Guide

### 1. Enable the sidebar

- Open the extensions toolbar icon and click X Bar.
- Use the **Enable XBar** button to activate the sidebar (enabled by default).
- Choose **Left** or **Right** placement from the dropdown.
- Toggle the **Dark mode** checkbox to switch the sidebar theme.
- Configure multi-column layout and name/@handle display from the Options page.
- Any change reloads open `x.com` tabs so the sidebar reflects updated position, theme, layout, and name display.

### 2. Add accounts

- From the popup, click **Open Options** or right-click the extension icon and select **Options**.
- Enter a handle (`username`, `@username`, or full `https://x.com/username` URL) and press **Add Account**.
- X Bar fetches display information from the public `api.fxtwitter.com` endpoint and caches avatar images locally for offline use.

### 3. Manage your list

- **Reorder**: Drag the handle (`::`) beside any account card to rearrange the sidebar order.
- **Remove**: Click **Remove** to delete an entry from storage.
- **Export**: Click **Export Accounts** to download a JSON backup of your list.
- **Import**: Click **Import Accounts** and choose a previously exported JSON file; existing entries are preserved and duplicates are skipped.
- The extension automatically filters exact duplicates when loading or adding accounts.

### 4. Browse with the sidebar

- Navigate to any page on `x.com`.
- The sidebar appears on first load (or after a refresh when settings change).
- Click any avatar/handle to jump straight to that profile in the current tab.

## Settings & Storage

- Preferences (enabled state, sidebar position, theme, layout, and name/@handle display) and the account list persist in `chrome.storage.local`.
- On install, the background service worker (`background.js`) initializes sensible defaults and never overwrites existing preferences.
- Open `x.com` tabs are reloaded when settings change so the injected UI updates immediately.

## Permissions Explained

- `storage`: Save enabled state, sidebar placement, and your account list.
- `tabs`: Refresh matching `x.com` tabs so the sidebar reflects the latest settings.
- Host permissions `*://x.com/*`, `*://*.x.com/*`: Allow the content script to run on X pages.
- Host permission `*://api.fxtwitter.com/*`: Fetch public profile metadata used in the sidebar cards.

## Privacy & Data Handling

- All configuration data and cached avatars are stored locally in your browser. Nothing is transmitted to external services beyond the single profile metadata request to `api.fxtwitter.com` when you add an account.
- The extension does not collect analytics or share information with third parties.

## Troubleshooting

- **Sidebar not visible**: Open the popup and ensure the toggle is set to **Disable XBar** (meaning it is currently enabled). Refresh the current `x.com` tab.
- **Accounts missing**: Reopen the options page to confirm your accounts are listed. If not, re-add them or check Chrome's site-storage settings.
- **Profile info fails to load**: Verify internet connectivity. Retry adding the account later.
- **Dark mode not applying**: Toggle the Dark mode checkbox off/on in the popup or refresh the tab.

## Support

For questions, feature requests, or issues, open a GitHub issue in this repository or contact the maintainer directly.
