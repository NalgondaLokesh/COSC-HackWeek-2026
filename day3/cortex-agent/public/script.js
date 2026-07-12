// DOM references
const taskCards = document.querySelectorAll('.task-card');
const taskInput = document.getElementById('task-input');
const inputLabel = document.getElementById('input-label');
const inputGroup = document.getElementById('input-group');
const runBtn = document.getElementById('run-btn');
const btnIcon = runBtn.querySelector('.btn-icon');
const btnText = runBtn.querySelector('.btn-text');
const btnLoading = runBtn.querySelector('.btn-loading');
const logArea = document.getElementById('log-area');
const clearBtn = document.getElementById('clear-btn');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const taskDescription = document.getElementById('task-description');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const closeResults = document.getElementById('close-results');
const logCount = document.getElementById('log-count');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');

let currentTask = 'search';
let logEntryCount = 0;

// Task descriptions and input labels for each task type
const taskConfig = {
  search: {
    label: 'Search Query',
    placeholder: 'e.g. best programming languages 2026',
    description: 'The agent will search the web for your query and extract the top results.',
    needsInput: true
  },
  screenshot: {
    label: 'URL to Capture',
    placeholder: 'e.g. https://github.com',
    description: 'The agent will navigate to the URL and capture a full-page screenshot.',
    needsInput: true
  },
  extract: {
    label: 'URL to Analyze',
    placeholder: 'e.g. https://news.ycombinator.com',
    description: 'The agent will extract all headings, links, and images from the page.',
    needsInput: true
  },
  form: {
    label: '',
    placeholder: '',
    description: 'The agent will navigate to a test form, fill every field with realistic data, and submit it.',
    needsInput: false
  },
  wiki: {
    label: 'Topic',
    placeholder: 'e.g. Artificial Intelligence',
    description: 'The agent will search Wikipedia for your topic and extract the article summary.',
    needsInput: true
  },
  email: {
    label: 'URL to Scrape',
    placeholder: 'e.g. https://example.com',
    description: 'The agent will scan the page and extract all email addresses found.',
    needsInput: true
  },
  seo: {
    label: 'URL to Analyze',
    placeholder: 'e.g. https://example.com',
    description: 'The agent will analyze SEO factors including meta tags, headings, images, and calculate an SEO score.',
    needsInput: true
  }
};

// Handle task card selection
taskCards.forEach(card => {
  card.addEventListener('click', () => {
    const task = card.dataset.task;
    currentTask = task;
    
    // Update active state
    taskCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    // Update form based on selected task
    const config = taskConfig[task];
    
    if (config.needsInput) {
      inputGroup.style.display = 'flex';
      inputLabel.textContent = config.label;
      taskInput.placeholder = config.placeholder;
      taskInput.value = '';
    } else {
      inputGroup.style.display = 'none';
    }
    
    taskDescription.querySelector('span').textContent = config.description;
  });
});

// Initialize first card as active
taskCards[0].classList.add('active');

// Theme toggle functionality
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
  if (theme === 'dark') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

themeToggle.addEventListener('click', toggleTheme);

// Initialize theme on load
initTheme();

// Clear the log area
clearBtn.addEventListener('click', () => {
  logArea.innerHTML = '<p class="log-line system">Log cleared.</p>';
  resultsSection.classList.add('hidden');
  logEntryCount = 0;
  updateLogCount();
});

// Close results panel
closeResults.addEventListener('click', () => {
  resultsSection.classList.add('hidden');
});

// Run the agent
runBtn.addEventListener('click', () => {
  const task = currentTask;
  const input = taskInput.value.trim();
  const config = taskConfig[task];

  // Validate input
  if (config.needsInput && !input) {
    addLog('Please provide an input before running the agent.', 'error');
    return;
  }

  // Set loading state
  setLoading(true);
  statusBadge.classList.add('running');
  statusText.textContent = 'Running...';
  resultsSection.classList.add('hidden');

  addLog(`Task "${task}" started.`, 'system');

  // Connect to the server using Server-Sent Events (SSE)
  const params = new URLSearchParams({ task, input });
  const eventSource = new EventSource(`/api/run?${params}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'log') {
      addLog(data.message, 'agent');
    }

    if (data.type === 'result') {
      addLog('Task completed successfully!', 'system');
      renderResults(data.data);
      finish();
      eventSource.close();
    }

    if (data.type === 'error') {
      addLog(`Error: ${data.message}`, 'error');
      finish();
      eventSource.close();
    }
  };

  eventSource.onerror = () => {
    addLog('Connection to agent lost.', 'error');
    finish();
    eventSource.close();
  };
});

// Add a log line to the terminal
function addLog(message, type) {
  const p = document.createElement('p');
  p.className = `log-line ${type}`;
  
  // Add a timestamp
  const time = new Date().toLocaleTimeString();
  p.textContent = `[${time}] ${message}`;
  
  logArea.appendChild(p);
  // Auto-scroll to the bottom
  logArea.scrollTop = logArea.scrollHeight;
  
  // Update log count
  logEntryCount++;
  updateLogCount();
}

// Update log count display
function updateLogCount() {
  logCount.textContent = `${logEntryCount} ${logEntryCount === 1 ? 'entry' : 'entries'}`;
}

// Set loading state for button
function setLoading(isLoading) {
  runBtn.disabled = isLoading;
  if (isLoading) {
    btnIcon.style.display = 'none';
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
  } else {
    btnIcon.style.display = 'inline';
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// Re-enable the run button
function finish() {
  setLoading(false);
  statusBadge.classList.remove('running');
  statusText.textContent = 'Ready';
}

// Render results based on the task type
function renderResults(data) {
  resultsSection.classList.remove('hidden');
  resultsContent.innerHTML = '';

  if (data.type === 'search') {
    // Show search results as cards
    data.results.forEach((item, i) => {
      resultsContent.innerHTML += `
        <div class="result-item">
          <h4>${i + 1}. ${item.title}</h4>
          <a href="${item.url}" target="_blank">${item.url}</a>
          <p>${item.snippet}</p>
        </div>
      `;
    });
    if (data.screenshot) {
      resultsContent.innerHTML += `<img src="${data.screenshot}" class="result-screenshot" alt="Screenshot">`;
    }
  }

  else if (data.type === 'screenshot') {
    resultsContent.innerHTML = `
      <div class="result-item">
        <h4>${data.pageTitle}</h4>
        <a href="${data.url}" target="_blank">${data.url}</a>
      </div>
      <img src="${data.screenshot}" class="result-screenshot" alt="Full page screenshot">
    `;
  }

  else if (data.type === 'extract') {
    let html = `<div class="result-item"><h4>Page: ${data.data.title}</h4>
      <p>Meta Description: ${data.data.metaDescription}</p>
      <table class="result-table">
        <tr><td>Headings Found</td><td>${data.data.headingCount}</td></tr>
        <tr><td>Links Found</td><td>${data.data.linkCount}</td></tr>
        <tr><td>Images Found</td><td>${data.data.imageCount}</td></tr>
      </table></div>`;

    // Show extracted headings
    html += '<div class="result-item"><h4>Headings</h4>';
    data.data.headings.forEach(h => {
      html += `<p><strong>${h.tag}:</strong> ${h.text}</p>`;
    });
    html += '</div>';

    if (data.screenshot) {
      html += `<img src="${data.screenshot}" class="result-screenshot" alt="Screenshot">`;
    }
    resultsContent.innerHTML = html;
  }

  else if (data.type === 'form') {
    let html = '<div class="result-item"><h4>Form Fields Filled</h4><table class="result-table">';
    data.filledFields.forEach(f => {
      html += `<tr><td>${f.field}</td><td>${f.value}</td></tr>`;
    });
    html += '</table></div>';
    
    if (data.screenshotBefore) {
      html += '<div class="result-item"><h4>Filled Form (Before Submit)</h4>';
      html += `<img src="${data.screenshotBefore}" class="result-screenshot" alt="Before submit"></div>`;
    }
    if (data.screenshotAfter) {
      html += '<div class="result-item"><h4>Submission Response</h4>';
      html += `<img src="${data.screenshotAfter}" class="result-screenshot" alt="After submit"></div>`;
    }
    resultsContent.innerHTML = html;
  }

  else if (data.type === 'wiki') {
    let html = `<div class="result-item">
      <h4>${data.article.title}</h4>
      <a href="${data.article.url}" target="_blank">${data.article.url}</a>
      <p style="margin-top:1rem;color:#e2e8f0;line-height:1.7">${data.article.summary}</p>
    </div>`;

    if (data.article.sections.length > 0) {
      html += '<div class="result-item"><h4>Table of Contents</h4>';
      data.article.sections.forEach(s => {
        html += `<p>• ${s}</p>`;
      });
      html += '</div>';
    }

    if (data.screenshot) {
      html += `<img src="${data.screenshot}" class="result-screenshot" alt="Wikipedia article">`;
    }
    resultsContent.innerHTML = html;
  }

  else if (data.type === 'email') {
    let html = `<div class="result-item">
      <h4>${data.pageTitle}</h4>
      <a href="${data.url}" target="_blank">${data.url}</a>
      <p style="margin-top:1rem">Found ${data.emailCount} unique email address(es)</p>
    </div>`;

    if (data.emails.length > 0) {
      html += '<div class="result-item"><h4>Email Addresses</h4>';
      data.emails.forEach(email => {
        html += `<p style="font-family:monospace;color:var(--primary)">${email}</p>`;
      });
      html += '</div>';
    }

    if (data.screenshot) {
      html += `<img src="${data.screenshot}" class="result-screenshot" alt="Email scraping results">`;
    }
    resultsContent.innerHTML = html;
  }

  else if (data.type === 'seo') {
    const score = data.data.seoScore;
    const scoreColor = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
    
    let html = `<div class="result-item">
      <h4>${data.pageTitle}</h4>
      <a href="${data.url}" target="_blank">${data.url}</a>
      <div style="margin-top:1rem;display:flex;align-items:center;gap:1rem">
        <span style="font-size:2rem;font-weight:700;color:${scoreColor}">${score}/100</span>
        <span style="color:var(--text-muted)">SEO Score</span>
      </div>
    </div>`;

    html += '<div class="result-item"><h4>Meta Tags</h4><table class="result-table">';
    html += `<tr><td>Title</td><td>${data.data.title} (${data.data.titleLength} chars)</td></tr>`;
    html += `<tr><td>Description</td><td>${data.data.meta.description} (${data.data.meta.descriptionLength} chars)</td></tr>`;
    html += `<tr><td>Viewport</td><td>${data.data.meta.viewport}</td></tr>`;
    html += `<tr><td>Canonical</td><td>${data.data.meta.canonical}</td></tr>`;
    html += '</table></div>';

    html += '<div class="result-item"><h4>Heading Structure</h4><table class="result-table">';
    html += `<tr><td>H1 Tags</td><td>${data.data.headingStructure.h1Count} - ${data.data.headingStructure.h1Status}</td></tr>`;
    html += `<tr><td>Total Headings</td><td>${data.data.headingStructure.totalHeadings}</td></tr>`;
    html += '</table></div>';

    html += '<div class="result-item"><h4>Images</h4><table class="result-table">';
    html += `<tr><td>Total Images</td><td>${data.data.imageAnalysis.total}</td></tr>`;
    html += `<tr><td>With Alt Text</td><td>${data.data.imageAnalysis.withAlt} (${data.data.imageAnalysis.altPercentage}%)</td></tr>`;
    html += '</table></div>';

    html += '<div class="result-item"><h4>Links</h4><table class="result-table">';
    html += `<tr><td>Total Links</td><td>${data.data.linkAnalysis.total}</td></tr>`;
    html += `<tr><td>Internal</td><td>${data.data.linkAnalysis.internal}</td></tr>`;
    html += `<tr><td>External</td><td>${data.data.linkAnalysis.external}</td></tr>`;
    html += '</table></div>';

    html += '<div class="result-item"><h4>Content</h4><table class="result-table">';
    html += `<tr><td>Word Count</td><td>${data.data.contentAnalysis.wordCount}</td></tr>`;
    html += `<tr><td>Load Time</td><td>${data.data.loadTime}ms</td></tr>`;
    html += '</table></div>';

    if (data.screenshot) {
      html += `<img src="${data.screenshot}" class="result-screenshot" alt="SEO analysis results">`;
    }
    resultsContent.innerHTML = html;
  }
}
