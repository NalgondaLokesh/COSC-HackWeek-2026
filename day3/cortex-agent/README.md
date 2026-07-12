# Cortex - Autonomous Browser Agent

Cortex is a powerful web-based browser automation agent that can **autonomously navigate real websites, interact with DOM elements, extract structured data, and complete real-world tasks** — all with a modern, sleek control panel that streams step-by-step activity logs in real time.

---

## 🛠️ Tech Stack
**Node.js, Express, Puppeteer (Headless Chrome), Server-Sent Events (SSE), HTML5, CSS3, Vanilla JavaScript**

---

## 🤖 Agent Skills (7 Tasks)

| # | Skill | What the Agent Does |
|---|-------|-------------------|
| 1 | **Web Search** | Opens Google → Types search query → Submits form → Extracts top 5 results (title, URL, snippet) |
| 2 | **Full-Page Screenshot** | Opens any URL → Waits for full render → Captures a full-page screenshot |
| 3 | **Page Data Extractor** | Opens any URL → Traverses the entire DOM → Extracts all headings, links, images, and metadata into a structured report |
| 4 | **Auto Form Filler** | Opens a real test form (httpbin.org) → Fills text inputs, radio buttons, checkboxes, textarea → Submits → Captures before/after screenshots |
| 5 | **Wikipedia Lookup** | Opens Wikipedia → Searches for topic → Navigates to article → Extracts summary paragraphs and table of contents |
| 6 | **Email Scraper** | Scans webpages for email addresses using regex pattern matching → Extracts unique emails from text, mailto links, and data attributes |
| 7 | **SEO Analyzer** | Performs comprehensive SEO analysis → Analyzes meta tags, heading structure, image alt text, links → Calculates SEO score (0-100) |

---

## ✨ Key Technical Features

### Server-Sent Events (SSE) for Real-Time Logs
Instead of the user clicking "Run" and waiting for a response, Cortex uses **Server-Sent Events**. This opens a persistent one-way connection from the server to the browser, allowing the agent to stream step-by-step log messages in real time as Puppeteer performs each action.

### Modular Task Architecture
Each task is a standalone Node.js module in the `/tasks` directory. The server routes the user's request to the correct module. This design makes it trivial to add new tasks without modifying the core server logic.

### Screenshot Proof
Every task captures at least one screenshot of the browser during execution. These screenshots are saved to the `/screenshots` folder and displayed directly in the UI as visual proof of the agent's actions.

### Modern UI/UX with Theme Support
- **Card-based task selection** with intuitive visual design
- **Dark/Light theme toggle** with smooth transitions and localStorage persistence
- **Real-time activity log** with color-coded entries and entry counter
- **Responsive design** that works on desktop and mobile devices
- **Loading states** with animated spinners for better user feedback

---

## 🚀 How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/your-username/cortex.git

# 2. Navigate to the project
cd cortex

# 3. Install dependencies (this will download Puppeteer + Chromium)
npm install

# 4. Start the server
npm start

# 5. Open in browser
# Visit http://localhost:3005
```

> **Note:** `npm install` will automatically download a bundled Chromium browser (~150MB). This is required for Puppeteer to function.

---

## 🏗️ Architecture

```
cortex/
├── server.js              ← Express + SSE streaming + task routing
├── package.json
├── .gitignore
├── tasks/
│   ├── searchGoogle.js    ← Google search skill
│   ├── screenshotPage.js  ← Screenshot skill
│   ├── extractData.js     ← Data extraction skill
│   ├── fillForm.js        ← Form filling skill
│   ├── wikiLookup.js      ← Wikipedia lookup skill
│   ├── scrapeEmails.js    ← Email scraping skill
│   └── analyzeSEO.js      ← SEO analysis skill
├── screenshots/           ← Auto-created screenshot storage
├── public/
│   ├── index.html         ← Modern control panel with theme support
│   ├── style.css          ← Responsive styling with dark/light themes
│   └── script.js          ← SSE client + result rendering + theme logic
└── README.md
```

---

## 🎨 Features Overview

### Email Scraper
- Uses regex pattern matching to find email addresses
- Scans text content, mailto links, input fields, and data attributes
- Returns unique email addresses with screenshot proof
- Perfect for lead generation and contact discovery

### SEO Analyzer
- Comprehensive SEO analysis including:
  - Meta tags (title, description, keywords, viewport, canonical)
  - Heading structure (H1-H6 analysis)
  - Image alt text coverage
  - Link analysis (internal vs external)
  - Content word count
  - Page load time
- Calculates SEO score (0-100) based on best practices
- Color-coded score display (green for good, yellow for fair, red for poor)
- Detailed breakdown with actionable insights

### Theme System
- Dark theme (default) with deep dark background and cyan accents
- Light theme with clean white background and slate accents
- Smooth transitions between themes
- Theme preference saved to localStorage
- Automatic theme initialization on page load

---

## 📸 Demo

The interface features:
- **Modern card-based task selection** with hover effects
- **Real-time log streaming** with timestamps and color coding
- **Screenshot display** for visual proof of agent actions
- **Responsive design** for all screen sizes
- **Theme toggle** in the header for personalized experience

---

## 🔧 Customization

### Adding New Tasks
1. Create a new file in `/tasks/` directory
2. Export an async function that accepts `url` and `logCallback` parameters
3. Add the task route in `server.js`
4. Add the task card to `index.html`
5. Add task configuration to `script.js`
6. Add result rendering logic in `script.js`

### Modifying Themes
- Edit CSS variables in `style.css` under `[data-theme="dark"]` and `[data-theme="light"]`
- Primary color is set in the `:root` variables
- All components use CSS custom properties for easy theming

---

## 📝 License

This project is open source and available for educational and commercial use.

---

## 🙏 Acknowledgments

Built with modern web technologies and powered by Puppeteer for browser automation.
