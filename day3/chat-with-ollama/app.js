// ─── CONFIGURATION ─────────
const API_URL = 'http://localhost:3000/api/chat';
const STATUS_URL = 'http://localhost:3000/api/status';
const STORAGE_KEY = 'lmstudio_chat_history';

// ─── STATE ─────────
let messages = [];
let isProcessing = false;
let currentModel = 'qwen2.5:7b';
let availableModels = ['qwen2.5:7b', 'qwen2.5:7b-instruct', 'tinyllama-1.1b-chat-v1.0', 'local-model', 'llama3', 'mistral', 'phi3', 'gemma'];

// ─── DOM REFS ─────────
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const modelBtn = document.getElementById('modelBtn');
const modelName = document.getElementById('modelName');
const welcomeModel = document.getElementById('welcomeModel');
const charCount = document.getElementById('charCount');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// ─── CHECK LM STUDIO CONNECTION ─────────
async function checkConnection() {
    try {
        const response = await fetch(STATUS_URL);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'connected') {
                statusDot.className = 'dot connected';
                statusText.textContent = 'Connected to Ollama';
                return true;
            }
        }
    } catch (error) {
        console.error('Connection error:', error);
    }

    statusDot.className = 'dot error';
    statusText.textContent = 'Disconnected - Start Ollama and ensure your model is available';
    return false;
}

// ─── FETCH AVAILABLE MODELS ─────────
async function fetchModels() {
    try {
        const response = await fetch('http://localhost:3000/api/models');
        if (response.ok) {
            const data = await response.json();
            if (data.models && data.models.length > 0) {
                availableModels = data.models.map(m => m.id);
                // Use the preferred Qwen Ollama model when available, otherwise fall back to the first result.
                if (!availableModels.includes(currentModel)) {
                    const preferredModel = availableModels.find(model => model === 'qwen2.5:7b' || model === 'qwen2.5:7b-instruct' || model === 'tinyllama-1.1b-chat-v1.0') || availableModels[0];
                    currentModel = preferredModel;
                    modelName.textContent = currentModel;
                    welcomeModel.textContent = currentModel;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

// ─── LOAD HISTORY ─────────
function loadHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            messages = JSON.parse(saved);
            renderMessages();
            return true;
        }
    } catch (e) {
        console.error('Error loading history:', e);
    }
    return false;
}

// ─── SAVE HISTORY ─────────
function saveHistory() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
        console.error('Error saving history:', e);
    }
}

// ─── RENDER MESSAGES ─────────
function renderMessages() {
    messagesContainer.innerHTML = '';

    if (messages.length === 0) {
        const div = document.createElement('div');
        div.className = 'welcome-message';
        div.innerHTML = `
            <div class="welcome-icon">🤖</div>
            <h2>Ollama Chat</h2>
            <p>Chat with your local AI models running through Ollama.</p>
            <small>Model: <span id="welcomeModel">${currentModel}</span></small>
        `;
        messagesContainer.appendChild(div);
        return;
    }

    messages.forEach((msg, index) => {
        const messageEl = createMessageElement(msg, index);
        messagesContainer.appendChild(messageEl);
    });

    scrollToBottom();
}

// ─── CREATE MESSAGE ELEMENT ─────────
function createMessageElement(message, index) {
    const div = document.createElement('div');
    div.className = `message ${message.role}`;
    div.dataset.index = index;

    const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '';

    div.innerHTML = `
        <div class="message-header">
            <span>${message.role === 'user' ? '🧑 You' : '🤖 Assistant'}</span>
            <span>${time}</span>
        </div>
        <div class="message-text">${formatMessage(message.content)}</div>
    `;

    return div;
}

// ─── FORMAT MESSAGE ─────────
function formatMessage(text) {
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    formatted = formatted.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
        return `<code>${code}</code>`;
    });

    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
}

// ─── SCROLL TO BOTTOM ─────────
function scrollToBottom() {
    const container = document.querySelector('.chat-container');
    container.scrollTop = container.scrollHeight;
}

// ─── SHOW LOADING ─────────
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.id = 'loadingIndicator';
    loading.innerHTML = `
        <div class="dots">
            <span class="dot-loading"></span>
            <span class="dot-loading"></span>
            <span class="dot-loading"></span>
        </div>
        <span class="label">Generating response...</span>
    `;
    messagesContainer.appendChild(loading);
    scrollToBottom();
}

// ─── HIDE LOADING ─────────
function hideLoading() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) loading.remove();
}

// ─── ADD MESSAGE ─────────
function addMessage(role, content) {
    const message = {
        role: role,
        content: content,
        timestamp: new Date().toISOString()
    };
    messages.push(message);
    saveHistory();

    const welcome = messagesContainer.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    renderMessages();
    return message;
}

// ─── SEND MESSAGE ─────────
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isProcessing) return;

    isProcessing = true;
    messageInput.disabled = true;
    sendBtn.disabled = true;
    messageInput.value = '';
    updateCharCount();

    addMessage('user', text);
    showLoading();

    try {
        const history = messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: history,
                model: currentModel,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.message && data.message.content) {
            addMessage('assistant', data.message.content);
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Error:', error);
        let errorMsg = error.message || 'Something went wrong. Please try again.';

        if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('connect')) {
            errorMsg = 'Cannot connect to the local AI backend. Start Ollama with "ollama serve" and confirm the model is available, then try again.';
        }

        addMessage('assistant', `❌ Error: ${errorMsg}`);
    } finally {
        hideLoading();
        isProcessing = false;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// ─── CLEAR CHAT ─────────
function clearChat() {
    if (messages.length === 0) return;

    if (confirm('Are you sure you want to clear all messages?')) {
        messages = [];
        saveHistory();
        renderMessages();
        messageInput.focus();
        statusText.textContent = 'Chat cleared';
        setTimeout(() => {
            statusText.textContent = 'Connected to Ollama';
        }, 2000);
    }
}

// ─── CHANGE MODEL ─────────
async function changeModel() {
    try {
        // Simple rotation through available models
        const currentIndex = availableModels.indexOf(currentModel);
        const nextIndex = (currentIndex + 1) % availableModels.length;
        currentModel = availableModels[nextIndex];
        modelName.textContent = currentModel;
        welcomeModel.textContent = currentModel;

        statusText.textContent = `Model: ${currentModel}`;
        setTimeout(() => {
            statusText.textContent = 'Connected to Ollama';
        }, 2000);

    } catch (error) {
        alert('Error switching model.');
        console.error('Error:', error);
    }
}

// ─── UPDATE CHARACTER COUNT ─────────
function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count} / 4000`;
}

// ─── AUTO-RESIZE TEXTAREA ─────────
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
}

// ─── KEYBOARD SHORTCUTS ─────────
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
    }
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        messageInput.value = messageInput.value.substring(0, start) + '\n' + messageInput.value.substring(end);
        messageInput.selectionStart = messageInput.selectionEnd = start + 1;
        autoResizeTextarea();
        updateCharCount();
    }
});

// ─── EVENT LISTENERS ─────────
messageInput.addEventListener('input', () => {
    updateCharCount();
    autoResizeTextarea();
});

sendBtn.addEventListener('click', sendMessage);
clearBtn.addEventListener('click', clearChat);
modelBtn.addEventListener('click', changeModel);

// ─── INIT ─────────
async function init() {
    await checkConnection();
    await fetchModels();
    loadHistory();
    messageInput.focus();
    updateCharCount();

    console.log('🤖 Ollama Chat ready!');
    console.log(`📦 Model: ${currentModel}`);
    console.log(`💬 Messages: ${messages.length}`);

    // Check Ollama status periodically
    setInterval(checkConnection, 30000);
}

// Start the application
init();