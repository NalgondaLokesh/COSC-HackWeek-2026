const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const LM_STUDIO_URL = (process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234').replace(/\/$/, '');
const BACKEND_MODE = (process.env.BACKEND || 'auto').toLowerCase();

async function fetchWithTimeout(url, options = {}, timeoutMs = 300000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function isAbortError(error) {
    return Boolean(error && (error.name === 'AbortError' || error.type === 'aborted' || error.code === 'ABORT_ERR'));
}

async function detectBackend() {
    const candidates = [];

    if (BACKEND_MODE === 'ollama' || BACKEND_MODE === 'auto') {
        candidates.push({ name: 'ollama', url: OLLAMA_URL, healthPath: '/api/tags' });
    }

    if (BACKEND_MODE === 'lmstudio' || BACKEND_MODE === 'auto') {
        candidates.push({ name: 'lmstudio', url: LM_STUDIO_URL, healthPath: '/v1/models' });
    }

    const healthTimeoutMs = Number(process.env.HEALTH_TIMEOUT_MS || 10000);

    for (const candidate of candidates) {
        try {
            const response = await fetchWithTimeout(`${candidate.url}${candidate.healthPath}`, {}, healthTimeoutMs);
            if (response.ok) {
                return candidate;
            }
        } catch (error) {
            // Continue to the next backend candidate.
        }
    }

    return null;
}

// ─── MIDDLEWARE ─────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ─── HEALTH CHECK ─────────
app.get('/health', async (req, res) => {
    const backend = await detectBackend();

    res.json({
        status: backend ? 'ok' : 'disconnected',
        backend: backend ? backend.name : 'none',
        timestamp: new Date().toISOString()
    });
});

// ─── CHAT ENDPOINT ─────────
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model = 'local-model', stream = false } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const backend = await detectBackend();
        if (!backend) {
            return res.status(503).json({
                error: 'No local AI backend is reachable. Start Ollama with "ollama serve" and confirm your model is available, then try again.'
            });
        }

        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        if (backend.name === 'ollama') {
            const response = await fetchWithTimeout(`${backend.url}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: formattedMessages,
                    stream,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        num_predict: 2048
                    }
                })
            }, Number(process.env.OLLAMA_TIMEOUT_MS || 300000));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ollama error:', errorText);
                return res.status(response.status).json({
                    error: `Ollama error: ${response.status}`,
                    details: errorText
                });
            }

            const data = await response.json();
            const content = data.message && data.message.content
                ? data.message.content
                : 'No response from model';

            return res.json({
                message: {
                    role: 'assistant',
                    content
                },
                model: data.model || model,
                created_at: new Date().toISOString()
            });
        }

        const response = await fetchWithTimeout(`${backend.url}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: formattedMessages,
                stream,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2048,
                frequency_penalty: 0.0,
                presence_penalty: 0.0
            })
        }, Number(process.env.LM_STUDIO_TIMEOUT_MS || 300000));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LM Studio error:', errorText);
            return res.status(response.status).json({
                error: `LM Studio error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        const content = data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : 'No response from model';

        return res.json({
            message: {
                role: 'assistant',
                content
            },
            model: data.model || model,
            created_at: new Date().toISOString()
        });

    } catch (error) {
        if (isAbortError(error)) {
            return res.status(503).json({
                error: 'The local AI backend did not respond in time. The model may still be loading or generating. Please wait a moment and try again.'
            });
        }

        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// ─── MODEL LIST ENDPOINT ─────────
app.get('/api/models', async (req, res) => {
    try {
        const backend = await detectBackend();

        if (backend && backend.name === 'ollama') {
            const response = await fetchWithTimeout(`${backend.url}/api/tags`);
            if (!response.ok) {
                throw new Error('Unable to list Ollama models');
            }

            const data = await response.json();
            const models = (data.models || []).map(model => ({
                id: model.name,
                name: model.name
            }));

            return res.json({ models: models.length > 0 ? models : [{ id: 'local-model', name: 'Local Model' }] });
        }

        res.json({
            models: [
                { id: 'local-model', name: 'Local Model' },
                { id: 'llama3', name: 'Llama 3' },
                { id: 'mistral', name: 'Mistral' },
                { id: 'phi3', name: 'Phi 3' },
                { id: 'gemma', name: 'Gemma' }
            ]
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── BACKEND STATUS ─────────
app.get('/api/status', async (req, res) => {
    try {
        const backend = await detectBackend();
        if (backend) {
            return res.json({ status: 'connected', backend: backend.name, url: backend.url });
        }

        res.json({
            status: 'disconnected',
            url: { ollama: OLLAMA_URL, lmStudio: LM_STUDIO_URL },
            error: 'No local AI backend is reachable. Start Ollama with "ollama serve" and confirm your model is available.'
        });
    } catch (error) {
        res.json({ status: 'disconnected', url: { ollama: OLLAMA_URL, lmStudio: LM_STUDIO_URL }, error: error.message });
    }
});

// ─── START SERVER ─────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Ollama URL: ${OLLAMA_URL}`);
    console.log(`📡 LM Studio URL: ${LM_STUDIO_URL}`);
    console.log(`📦 Start Ollama with "ollama serve" and confirm your model is available, then open the app`);
    console.log(`🔗 Open http://localhost:${PORT} in your browser`);
});

// ─── ERROR HANDLING ─────────
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});