# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Chrome Extension (Manifest V3) that injects an account sidebar on x.com.
- No Node toolchain; plain HTML/JS/CSS with Chrome APIs. Packaging is zip-based; development uses Chrome’s Load unpacked.

Key commands
- Package a release zip (excludes screenshots). Requires jq to read version from manifest.
```bash path=null start=null
mkdir -p dist
VERSION=$(jq -r .version manifest.json)
zip -r "dist/xbar-$VERSION.zip" \
  manifest.json background.js popup.html popup.js options.html options.js xbar-content.js assets \
  -x "assets/screenshot*.jpg"
```
- Validate manifest.json syntax quickly
```bash path=null start=null
jq . manifest.json > /dev/null
```
- Clean generated artifacts
```bash path=null start=null
rm -rf dist
```

How to run locally (no build step)
- In Chrome: chrome://extensions → enable Developer mode → Load unpacked → select this folder.
- Use the toolbar popup to enable XBar and choose sidebar position; options page manages accounts.

High-level architecture
- manifest.json (MV3)
  - action.default_popup: popup.html
  - options_page: options.html
  - background.service_worker: background.js
  - content_scripts: xbar-content.js runs on *://x.com/* and subdomains
  - permissions: storage, tabs; host_permissions for x.com and api.fxtwitter.com
- background.js
  - On install, initializes storage with xbarEnabled: true
- popup.html / popup.js
  - UI to toggle xbarEnabled and set sidebarPosition (left|right)
  - Persists to chrome.storage.local; reloads all open x.com tabs after changes via chrome.tabs.reload
  - Link to open options page
- options.html / options.js
  - Add accounts by handle/@handle/URL; fetches metadata from https://api.fxtwitter.com/<handle>
  - Caches avatars as data URLs (canvas) for offline/local use
  - Renders list with drag-and-drop reordering; persists ordered accounts
  - Prevents duplicates by screen_name (case-insensitive); supports removal
- xbar-content.js (content script)
  - Guards to only run on x.com; reads xbarEnabled and sidebarPosition from storage
  - Injects fixed sidebar UI and inline styles; shifts page content margin-left/right by 70px
  - Loads accounts from storage; de-duplicates by screen_name case-insensitive; renders avatar/name; click navigates to https://x.com/<screen_name>
  - Uses MutationObserver and popstate listeners to cope with SPA navigation and ensure the sidebar remains present
- Data model (chrome.storage.local)
  - xbarEnabled: boolean; sidebarPosition: "left"|"right"; accounts: Array<{ name, screen_name, avatar_url(data URL) }>

Development notes
- No test or lint configuration exists in-repo. Use the jq check above for manifest validation and package with zip when distributing.
- When changing sidebarPosition or toggling enablement, popup.js triggers reloads of all open x.com tabs to apply changes.
- Both options.js and xbar-content.js include duplicate-account prevention logic to keep storage and UI clean.

Release checklist
- Bump version in manifest.json.
- Build zip via the command above and upload to the Chrome Web Store (exclude screenshots from the package).
