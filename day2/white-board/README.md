# Collaborative Whiteboard

A real-time collaborative whiteboard application built with HTML, CSS, JavaScript, and Socket.IO. Multiple users can draw simultaneously on the same canvas with instant synchronization.

## Features

### Core Functionality
- **Real-time Drawing**: Multiple users can draw simultaneously with instant sync
- **Drawing Tools**: Pen, eraser, line, rectangle, circle, and text tools
- **Color Picker**: 7 preset colors (black, red, blue, green, yellow, purple, pink) + custom color picker
- **Brush Sizes**: 4 sizes available (2px, 5px, 12px, 20px)
- **Clear Board**: One-click clear with confirmation dialog
- **Undo/Redo**: Full undo/redo functionality with keyboard shortcuts
- **Save as Image**: Download canvas as PNG

### Collaboration Features
- **User Count**: Display number of active users online
- **Drawing Indicator**: Shows "Someone is drawing..." when any user is active
- **Auto-sync**: Canvas state syncs every 5 seconds
- **State Restoration**: New users receive current canvas state on connection

### UI/UX
- **Modern Design**: Glass-morphism effects with clean, polished interface
- **Dark Mode**: Toggle with localStorage persistence
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Touch Support**: Full touch support for mobile drawing
- **Toast Notifications**: Visual feedback for connections, clears, and errors
- **Connection Status**: Real-time connected/disconnected indicator
- **Brush Preview**: Shows brush size and color following cursor

### Keyboard Shortcuts
- `C` - Clear board (with confirmation)
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+S` - Save as image

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO v4.x
- **Deployment**: Render, Railway, or Heroku

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd White-Board
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

## Deployment

### Option 1: Render (Recommended - Free Tier)

Render supports WebSockets and has a free tier.

1. Create a `render.yaml` file (already included in this repo):
```yaml
services:
  - type: web
    name: whiteboard
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 10000
```

2. Push your code to GitHub
3. Go to [render.com](https://render.com) and import your repository
4. Render will automatically detect the `render.yaml` configuration
5. Click Deploy

### Option 2: Railway (Free Tier)

Railway supports WebSockets with a free tier.

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

### Option 3: Heroku (Free Tier)

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Create and deploy:
```bash
heroku create your-app-name
heroku buildpacks:set heroku/nodejs
git push heroku master
```

### Option 4: Local Development

For local development with full WebSocket support:

```bash
npm install
npm start
```

Open `http://localhost:3000` in multiple browser tabs to test collaboration.

## Project Structure

```
White-Board/
├── index.html          # Client-side application (HTML, CSS, JS)
├── server.js           # Node.js server with Socket.IO
├── package.json        # Dependencies and scripts
├── render.yaml         # Render deployment configuration
└── README.md           # Documentation
```

## API Endpoints

### Socket.IO Events

#### Client → Server
- `draw` - Send drawing coordinates
- `dot` - Send single dot (for clicks)
- `draw-line` - Draw line shape
- `draw-rect` - Draw rectangle shape
- `draw-circle` - Draw circle shape
- `draw-text` - Add text to canvas
- `clear` - Request to clear the board
- `canvas-data` - Sync canvas state
- `drawing-status` - Update drawing activity status

#### Server → Client
- `draw` - Broadcast drawing to other clients
- `dot` - Broadcast dot to other clients
- `draw-line` - Broadcast line to other clients
- `draw-rect` - Broadcast rectangle to other clients
- `draw-circle` - Broadcast circle to other clients
- `draw-text` - Broadcast text to other clients
- `clear` - Broadcast clear command
- `canvas-data` - Send current canvas state
- `user-count` - Update active user count
- `drawing-status` - Notify if someone is drawing

### HTTP Endpoints
- `GET /` - Serve the whiteboard application
- `GET /health` - Health check endpoint

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### Socket.IO Configuration
- CORS enabled for all origins
- Auto-reconnection enabled
- Max 5 reconnection attempts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Connection Issues
- Check if the server is running
- Verify the SERVER_URL in index.html matches your server address
- Check browser console for Socket.IO errors

### Canvas Not Drawing
- Ensure you're using a supported browser
- Check if touch events are working on mobile
- Verify JavaScript is enabled

### Deployment Issues
- Ensure all dependencies are in package.json
- Check Vercel deployment logs
- Verify vercel.json configuration

## Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Save canvas as image
- [ ] User cursors with names
- [ ] Chat functionality
- [ ] Multiple boards/rooms
- [ ] Export/import canvas data
- [ ] Shape tools (rectangle, circle, line)
- [ ] Text tool

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
