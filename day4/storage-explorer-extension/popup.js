let currentData = [];
let currentFilter = 'all';
let searchTerm = '';

// Initialize extension
document.addEventListener('DOMContentLoaded', async () => {
  await loadStorageData();
  setupEventListeners();
});

async function loadStorageData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute content script to get storage data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getStorageData
    });

    if (results && results[0] && results[0].result) {
      currentData = results[0].result;
      renderData(currentData);
      updateStats(currentData);
    }
  } catch (error) {
    console.error('Error loading storage data:', error);
    showError('Failed to load storage data. Please try again.');
  }
}

function getStorageData() {
  const data = [];

  // Get localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    data.push({
      key: key,
      value: value,
      type: 'localStorage',
      size: new Blob([value]).size
    });
  }

  // Get sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    data.push({
      key: key,
      value: value,
      type: 'sessionStorage',
      size: new Blob([value]).size
    });
  }

  // Get cookies
  const cookies = document.cookie.split(';').filter(c => c.trim());
  cookies.forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    data.push({
      key: decodeURIComponent(key),
      value: decodeURIComponent(value || ''),
      type: 'cookie',
      size: new Blob([cookie]).size
    });
  });

  return data;
}

function renderData(data) {
  const container = document.getElementById('storageList');
  
  // Apply filters
  let filtered = data;
  if (currentFilter !== 'all') {
    filtered = filtered.filter(item => item.type === currentFilter);
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item => 
      item.key.toLowerCase().includes(term) || 
      item.value.toLowerCase().includes(term)
    );
  }

  // Sort by type then key
  filtered.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.key.localeCompare(b.key);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>🔍 No entries found</h3>
        <p>Try adjusting your search or filter</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="storage-item" data-key="${item.key}" data-type="${item.type}">
      <div class="key-row">
        <span class="key">${escapeHtml(item.key)}</span>
        <span class="badge badge-${item.type === 'localStorage' ? 'local' : item.type === 'sessionStorage' ? 'session' : 'cookie'}">${item.type}</span>
      </div>
      <div class="value">${escapeHtml(item.value)}</div>
      <div class="meta">
        <span>Size: ${formatSize(item.size)}</span>
        <button class="delete-btn" data-key="${item.key}" data-type="${item.type}">🗑️</button>
      </div>
    </div>
  `).join('');

  // Add delete functionality to each item
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const key = btn.dataset.key;
      const type = btn.dataset.type;
      if (confirm(`Delete "${key}" from ${type}?`)) {
        await deleteStorageItem(key, type);
        await loadStorageData();
      }
    });
  });
}

function updateStats(data) {
  const totalSize = data.reduce((sum, item) => sum + item.size, 0);
  document.getElementById('totalCount').textContent = `Total: ${data.length} items`;
  document.getElementById('totalSize').textContent = `Size: ${formatSize(totalSize)}`;
}

function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderData(currentData);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.type;
      renderData(currentData);
    });
  });

  // Refresh
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadStorageData();
  });

  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', async () => {
    if (confirm('⚠️ Are you sure you want to clear ALL storage data for this website?')) {
      await clearAllStorage();
      await loadStorageData();
    }
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', exportData);

  // Import
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', importData);
}

async function deleteStorageItem(key, type) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: deleteItem,
      args: [key, type]
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete item. Please try again.');
  }
}

function deleteItem(key, type) {
  if (type === 'localStorage') {
    localStorage.removeItem(key);
  } else if (type === 'sessionStorage') {
    sessionStorage.removeItem(key);
  } else if (type === 'cookie') {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

async function clearAllStorage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clearStorage
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
    alert('Failed to clear storage. Please try again.');
  }
}

function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
  // Clear cookies
  document.cookie.split(';').forEach(cookie => {
    const [key] = cookie.trim().split('=');
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

function exportData() {
  if (currentData.length === 0) {
    alert('No data to export.');
    return;
  }

  const dataStr = JSON.stringify(currentData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!Array.isArray(data) || data.length === 0) {
      alert('Invalid data format. Please provide a valid JSON array.');
      return;
    }

    if (!confirm(`Import ${data.length} items? This will overwrite existing data.`)) {
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: importStorageData,
      args: [data]
    });

    await loadStorageData();
    alert('Data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
    alert('Failed to import data. Please check the file format.');
  }
  e.target.value = '';
}

function importStorageData(data) {
  // Clear existing
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(';').forEach(cookie => {
    const [key] = cookie.trim().split('=');
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  // Import new data
  data.forEach(item => {
    if (item.type === 'localStorage') {
      localStorage.setItem(item.key, item.value);
    } else if (item.type === 'sessionStorage') {
      sessionStorage.setItem(item.key, item.value);
    } else if (item.type === 'cookie') {
      document.cookie = `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}; path=/;`;
    }
  });
}

// Utility functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function showError(message) {
  const container = document.getElementById('storageList');
  container.innerHTML = `
    <div class="empty-state">
      <h3>⚠️ Error</h3>
      <p>${message}</p>
    </div>
  `;
}