# Image Compression Analyzer

A real-time image compression comparison tool built with Node.js, Express, and Sharp. Upload images, adjust compression settings, and compare original vs compressed results with an interactive before/after slider.

## Features

- **Real-time Compression**: Compress images instantly using Sharp's powerful image processing
- **Interactive Comparison**: Drag-to-compare slider for detailed before/after analysis
- **Multiple Formats**: Support for JPEG, PNG, WebP, and GIF output formats
- **Quality Control**: Adjustable compression quality slider (10-100%)
- **Detailed Metrics**: Visual dashboard showing compression statistics:
  - Original vs compressed file size
  - Size reduction percentage
  - Compression ratio
  - Quality score
  - Image dimensions
- **Visual Progress**: Animated progress bar during compression
- **Image Zoom**: Click to zoom images for detailed inspection
- **Keyboard Shortcuts**: Quick actions for power users
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Screenshots

### Main Interface
- Upload zone with drag-and-drop support
- Quality slider and format selection
- Real-time compression results

### Comparison Views
- **Slider Mode**: Interactive drag-to-compare slider
- **Side-by-Side Mode**: Traditional side-by-side comparison

### Metrics Dashboard
- Color-coded metric bars
- Visual representation of compression efficiency

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd image-compression-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser:
```
http://localhost:3000
```

## Usage

### Basic Workflow

1. **Upload an Image**
   - Drag and drop an image into the upload zone
   - Or click to browse and select a file
   - Supported formats: JPEG, PNG, WebP, GIF, TIFF

2. **Adjust Compression Settings**
   - Use the quality slider to set compression level (10-100%)
   - Select output format (JPEG, PNG, WebP, GIF)
   - Click "Compress" to apply changes

3. **Compare Results**
   - Use the slider comparison to see before/after
   - Toggle between slider and side-by-side views
   - Click images to zoom for detailed inspection

4. **Review Metrics**
   - Check the metrics dashboard for compression statistics
   - Color-coded bars indicate compression efficiency

5. **Download**
   - Click "Download Compressed Image" to save the result

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Compress image
- `Esc` - Close modal or zoomed image

## API Endpoints

### POST /api/compress

Compress an uploaded image.

**Query Parameters:**
- `format` (string): Output format (jpeg, png, webp, gif)
- `quality` (number): Compression quality (10-100)

**Request Body:**
- `image` (file): Image file to compress

**Response:**
```json
{
  "original": {
    "sizeKB": 1024.5,
    "width": 1920,
    "height": 1080
  },
  "compressed": {
    "sizeKB": 512.3,
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "thumbnail": "data:image/jpeg;base64,...",
    "data": "base64-encoded-image-data"
  },
  "metrics": {
    "sizeReductionKB": 512.2,
    "compressionPercent": 50,
    "compressionRatio": 2.0,
    "qualityScore": 85,
    "quality": 70
  }
}
```

## Project Structure

```
image-compression-analyzer/
├── server.js           # Express server and Sharp integration
├── index.html          # Main HTML interface
├── style.css           # Styling and animations
├── app.js              # Frontend logic and interactions
├── package.json        # Dependencies and scripts
└── README.MD          # This file
```

## Technologies Used

- **Backend**: Node.js, Express
- **Image Processing**: Sharp (high-performance image processor)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Custom CSS with CSS variables and animations

## Configuration

### Port

Default port is 3000. To change, modify the `PORT` constant in `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Maximum File Size

Default max file size is 10MB. Adjust in `server.js`:

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

The application is production-ready as-is. For deployment:

1. Set `NODE_ENV=production`
2. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name image-compressor
```

## Troubleshooting

### Images not compressing
- Ensure Sharp is properly installed
- Check server logs for errors
- Verify image format is supported

### Upload fails
- Check file size doesn't exceed limit
- Ensure file is a valid image format
- Verify server is running

### Comparison slider not working
- Ensure JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Built as a COSC-2026 project for image compression analysis and comparison.
