# Cat Image Replacer

A Chrome extension that replaces all images on a webpage with random cat images from [cataas.com](https://cataas.com/).

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked` and select `c:\COSC-2026\my-first-extension`.

## Files

- `manifest.json` - Extension manifest and permissions.
- `background.js` - Background service worker.
- `content.js` - Content script that replaces images.
- `popup.html` - Popup UI.
- `popup.js` - Popup logic.
- `icons/` - Extension icon assets.

## Notes

This extension uses the `activeTab` permission and `https://cataas.com/*` host permission to replace images with cat pictures.
