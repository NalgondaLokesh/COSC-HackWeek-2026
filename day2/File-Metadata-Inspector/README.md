# File Metadata Inspector

A lightweight web app for uploading image files and extracting metadata such as camera details, timestamps, and GPS information.

## Features

- Drag-and-drop file upload
- Extracts EXIF and related metadata from supported images
- Clean, modern glassmorphism-style interface
- Dark/light theme toggle

## Technologies

- HTML5
- CSS3
- JavaScript
- EXIF.js

## Usage

1. Open the app in a browser.
2. Upload an image file.
3. View the extracted metadata details.

## Setup Instructions

### Option 1: Open directly

- Clone or download this repository.
- Open the project folder.
- Double-click index.html to open it in your browser.

### Option 2: Run with a local server

If you prefer to serve the app locally, run one of the following commands from the project folder:

- Python: `python -m http.server 8000`
- Node.js: `npx http-server . -p 8000`

Then open http://localhost:8000 in your browser.

## Notes

- The app uses EXIF.js to read metadata from supported image files.
- Some images may not contain metadata, in which case the app will show no relevant fields.
