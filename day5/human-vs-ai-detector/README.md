# Human vs AI Detector Game

An interactive educational game that challenges players to distinguish between human-created and AI-generated content across multiple formats: text, code, images, and audio.

## Features

- **Multiple Content Types**: Text, code, images, and voice/audio clips
- **Educational Explanations**: Learn why content is human or AI-generated after each guess
- **Score Tracking**: Earn points for correct guesses and track your lives
- **Leaderboard**: Compete with other players and submit your high scores
- **Modern UI**: Glassmorphism design with smooth animations
- **Responsive**: Works on desktop and mobile devices

## Game Mechanics

- **Scoring**: +100 points for each correct guess
- **Lives**: Start with 3 lives, lose 1 for each incorrect guess
- **Game Over**: When lives reach 0 or all items are exhausted
- **Leaderboard**: Top 10 scores are tracked and displayed

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Styling**: CSS Variables, Glassmorphism design
- **API**: RESTful endpoints for leaderboard management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Benadic90/hackweek-2026.git
cd hackweek-2026/human-vs-ai-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
human-vs-ai-game/
├── public/
│   ├── index.html      # Main HTML structure
│   ├── style.css       # Styling and UI components
│   └── app.js          # Game logic and state management
├── server.js           # Express server and API endpoints
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## API Endpoints

### GET /api/leaderboard
Retrieves the top 10 scores from the leaderboard.

**Response:**
```json
[
  { "name": "Player1", "score": 500 },
  { "name": "Player2", "score": 300 }
]
```

### POST /api/leaderboard
Submits a new score to the leaderboard.

**Request Body:**
```json
{
  "name": "PlayerName",
  "score": 400
}
```

**Response:**
```json
[
  { "name": "PlayerName", "score": 400 },
  { "name": "Player1", "score": 500 }
]
```

## Adding New Content

To add new game items, edit the `database` array in `public/app.js`:

```javascript
{
    type: 'text', // or 'code', 'image', 'voice'
    content: 'Your content here',
    author: 'human', // or 'ai'
    explanation: 'Explanation of why this is human or AI-generated'
}
```

## Customization

### Colors and Theme
Edit the CSS variables in `public/style.css`:

```css
:root {
    --bg-main: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --primary: #6366f1;
    --accent: #f472b6;
    /* ... more variables */
}
```

### Game Settings
Modify game parameters in `public/app.js`:

```javascript
let lives = 3;           // Starting lives
score += 100;           // Points per correct guess
```

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
