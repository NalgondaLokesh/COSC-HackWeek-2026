/**
 * @fileoverview Frontend Game Engine for Human vs AI Detector
 * 
 * This module manages the state machine, DOM updates, and API interactions
 * for the core gameplay loop. It dynamically injects content and validates user guesses.
 */

/**
 * @typedef {Object} GameItem
 * @property {'text'|'code'|'image'|'voice'} type - The format of the content snippet.
 * @property {string} content - The actual text, code, image URL, or audio URL to be analyzed.
 * @property {'human'|'ai'} author - The true origin of the content.
 * @property {string} explanation - Educational feedback explaining the psychological or technical tells.
 */

/**
 * Static database containing the curated game levels.
 * @type {Array<GameItem>}
 */
const database = [
    {
        type: 'text',
        content: '"The city skyline was a jagged graph of neon and glass against the bruising purple twilight, humming with a frequency I could feel in my teeth."',
        author: 'human',
        explanation: 'Humans often use visceral, sensory metaphors (feeling a hum in teeth) that AI tends to avoid in favor of logical descriptors.'
    },
    {
        type: 'text',
        content: '"The city skyline featured many tall buildings illuminated by bright neon lights. The sky above was a deep shade of purple as evening approached."',
        author: 'ai',
        explanation: 'This is classic AI output: technically correct, grammatically perfect, but highly descriptive and lacking emotional depth.'
    },
    {
        type: 'code',
        content: 'const dedup = arr => [...new Set(arr)];',
        author: 'human',
        explanation: 'A classic, concise ES6 one-liner heavily favored by experienced JavaScript developers for quick deduplication.'
    },
    {
        type: 'code',
        content: `function removeDuplicates(array) {
    const uniqueArray = [];
    for (let i = 0; i < array.length; i++) {
        if (!uniqueArray.includes(array[i])) {
            uniqueArray.push(array[i]);
        }
    }
    return uniqueArray;
}`,
        author: 'ai',
        explanation: 'AI often defaults to highly explicit, verbose procedural loops with perfectly descriptive variable names rather than concise modern syntax.'
    },
    {
        type: 'text',
        content: '"I stared at the blinking cursor. It mocked me. Three hours of debugging, and the issue was a missing comma. I hate programming. I love programming."',
        author: 'human',
        explanation: 'The paradoxical emotional swing and dramatic personification of a cursor is a very human expression of frustration.'
    },
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
        author: 'human',
        explanation: 'This photograph shows natural lighting, imperfections, and artistic composition choices typical of human photography.'
    },
    {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
        author: 'ai',
        explanation: 'AI-generated images often have perfect symmetry, unnatural color combinations, and lack subtle imperfections found in real photos.'
    },
    {
        type: 'voice',
        content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        author: 'human',
        explanation: 'Human voices have natural variations in pitch, breathing patterns, and subtle imperfections that make them authentic.'
    },
    {
        type: 'voice',
        content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        author: 'ai',
        explanation: 'AI-generated voices often sound too perfect, with consistent pacing and lack of natural breaths or hesitations.'
    }
];

// State
let currentRound = 0;
let score = 0;
let lives = 3;
let currentItem = null;
let gamePool = [];

// DOM Elements
const screenStart = document.getElementById('screen-start');
const screenGame = document.getElementById('screen-game');
const screenReveal = document.getElementById('screen-reveal');
const screenEnd = document.getElementById('screen-end');
const statsBar = document.getElementById('stats-bar');

const contentCard = document.getElementById('content-card');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const roundDisplay = document.getElementById('round-display');

const revealTitle = document.getElementById('reveal-title');
const revealBadge = document.getElementById('reveal-badge');
const revealExplanation = document.getElementById('reveal-explanation');
const finalScore = document.getElementById('final-score');
const leaderboardList = document.getElementById('leaderboard-list');

// Initialize Game
document.getElementById('btn-start').addEventListener('click', startGame);

function startGame() {
    score = 0;
    lives = 3;
    currentRound = 0;
    // Clone and shuffle database
    gamePool = [...database].sort(() => Math.random() - 0.5);
    
    updateStats();
    screenStart.classList.add('hidden');
    screenEnd.classList.add('hidden');
    statsBar.classList.remove('hidden');
    
    nextRound();
}

function nextRound() {
    if (lives <= 0 || gamePool.length === 0) {
        return endGame();
    }
    
    currentRound++;
    currentItem = gamePool.pop();
    
    roundDisplay.textContent = currentRound;
    
    if (currentItem.type === 'code') {
        contentCard.innerHTML = `<pre><code>${escapeHTML(currentItem.content)}</code></pre>`;
    } else if (currentItem.type === 'image') {
        contentCard.innerHTML = `<img src="${currentItem.content}" alt="Guess if this image is human or AI created" class="content-image">`;
    } else if (currentItem.type === 'voice') {
        contentCard.innerHTML = `
            <div class="audio-container">
                <audio controls class="content-audio">
                    <source src="${currentItem.content}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <p class="audio-hint">🎧 Listen to the audio and guess if it's human or AI-generated</p>
            </div>
        `;
    } else {
        contentCard.innerHTML = `<p>${currentItem.content}</p>`;
    }
    
    screenReveal.classList.add('hidden');
    screenGame.classList.remove('hidden');
}

// Guessing Logic
document.getElementById('btn-guess-human').addEventListener('click', () => handleGuess('human'));
document.getElementById('btn-guess-ai').addEventListener('click', () => handleGuess('ai'));

function handleGuess(guess) {
    screenGame.classList.add('hidden');
    screenReveal.classList.remove('hidden');
    
    const isCorrect = guess === currentItem.author;
    
    if (isCorrect) {
        score += 100;
        revealTitle.textContent = "🎯 Correct!";
        revealTitle.className = "text-success";
    } else {
        lives--;
        revealTitle.textContent = "❌ Incorrect!";
        revealTitle.className = "text-danger";
    }
    
    updateStats();
    
    revealBadge.textContent = currentItem.author === 'human' ? 'Created by Human' : 'Created by AI';
    revealBadge.className = `reveal-badge badge-${currentItem.author}`;
    
    revealExplanation.textContent = currentItem.explanation;
}

document.getElementById('btn-next').addEventListener('click', nextRound);

function updateStats() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = '❤️'.repeat(lives) + '💔'.repeat(3 - lives);
}

// End Game & Leaderboard
async function endGame() {
    screenGame.classList.add('hidden');
    screenReveal.classList.add('hidden');
    statsBar.classList.add('hidden');
    screenEnd.classList.remove('hidden');
    
    finalScore.textContent = score;
    document.getElementById('submit-section').classList.remove('hidden');
    
    await fetchLeaderboard();
}

async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        renderLeaderboard(data);
    } catch (e) {
        console.error('Failed to fetch leaderboard');
    }
}

function renderLeaderboard(data) {
    leaderboardList.innerHTML = data.map((entry, index) => `
        <li>
            <span><strong>#${index + 1}</strong> ${entry.name}</span>
            <span class="highlight">${entry.score} pts</span>
        </li>
    `).join('');
}

document.getElementById('btn-submit').addEventListener('click', async () => {
    const name = document.getElementById('player-name').value;
    if (!name) return alert('Enter a name!');
    
    try {
        const res = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });
        const data = await res.json();
        renderLeaderboard(data);
        document.getElementById('submit-section').classList.add('hidden');
    } catch (e) {
        console.error('Failed to submit score');
    }
});

document.getElementById('btn-restart').addEventListener('click', startGame);

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
