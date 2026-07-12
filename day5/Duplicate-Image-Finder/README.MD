# Image Similarity Detector

A web-based tool for detecting duplicate and visually similar images using perceptual hashing (pHash) algorithm. Upload multiple images and instantly find duplicates based on visual content rather than just file metadata.

## Features

- **Visual Similarity Detection**: Uses perceptual hashing to identify similar images based on visual content
- **Drag & Drop Interface**: Easy-to-use web interface with drag-and-drop file upload
- **Batch Processing**: Analyze up to 50 images at once
- **Similarity Groups**: Automatically groups similar images with similarity percentages
- **Thumbnail Previews**: Generates thumbnails for easy visual comparison
- **Real-time Analysis**: Fast processing with immediate results
- **Multiple Format Support**: Supports JPEG, PNG, GIF, WebP, BMP, and TIFF

## How It Works

The application uses **perceptual hashing (pHash)** to detect similar images:

1. **Image Processing**: Each image is resized to 32x32 pixels and converted to grayscale
2. **DCT Transformation**: Discrete Cosine Transform is applied to extract frequency information
3. **Hash Generation**: A 64-bit hash is generated based on low-frequency DCT coefficients
4. **Similarity Comparison**: Hamming distance between hashes determines similarity percentage
5. **Grouping**: Images with 70%+ similarity are grouped together

This approach is robust against:
- Resizing
- Color changes
- Minor edits
- Compression artifacts
- Format conversions

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Upload Images**: 
   - Click "Select Images" or drag and drop image files onto the drop zone
   - Supported formats: JPEG, PNG, GIF, WebP, BMP, TIFF
   - Maximum file size: 50MB per image
   - Maximum images: 50 per batch

2. **Analyze**: 
   - Click the "Analyze Images" button or press `Ctrl+Enter`
   - Wait for processing to complete

3. **View Results**:
   - See all uploaded images in a grid with metadata
   - View groups of similar images with similarity percentages
   - Each group shows how similar images are to each other

4. **Clear**: 
   - Click "Clear All" to reset and start over

## Project Structure

```
duplicate-image-finder/
├── server.js          # Express backend with image processing
├── app.js             # Frontend JavaScript logic
├── index.html         # Main HTML interface
├── style.css          # Styling and layout
├── package.json       # Dependencies and scripts
└── README.MD          # This file
```

## API Endpoints

### POST /api/analyze
Upload and analyze images for similarity.

**Request**: 
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with 'images' field containing image files

**Response**:
```json
{
  "success": true,
  "total": 10,
  "images": [
    {
      "id": "img_123456_abc",
      "filename": "image1.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080,
      "phash": "1011001010...",
      "thumbnail": "data:image/jpeg;base64,...",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "groups": [
    {
      "id": "group_123456_xyz",
      "images": [0, 1, 2],
      "similarities": [
        {"index1": 0, "index2": 1, "similarity": 95.5},
        {"index1": 0, "index2": 2, "similarity": 92.3}
      ],
      "averageSimilarity": 93.9
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/health
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Dependencies

- **express**: Web framework for the backend server
- **cors**: Cross-Origin Resource Sharing support
- **multer**: Middleware for handling multipart/form-data (file uploads)
- **sharp**: High-performance image processing library
- **jpeg-js**: JPEG encoder/decoder
- **pngjs**: PNG encoder/decoder
- **nodemon**: Development tool for auto-restarting the server

## Configuration

### Port
Default port is 3000. To change:
```bash
PORT=8080 npm start
```

### Similarity Threshold
The default similarity threshold is 70%. To adjust, modify the threshold in `server.js` line 287:
```javascript
if (similarity >= 70) { // Change this value
```

### File Size Limit
Default max file size is 50MB. To adjust, modify in `server.js` line 22:
```javascript
fileSize: 50 * 1024 * 1024 // Change this value
```

## Technical Details

### Perceptual Hashing Algorithm

The pHash algorithm used in this project:

1. **Resize**: Image is resized to 32x32 pixels
2. **Grayscale**: Converted to grayscale to reduce complexity
3. **DCT**: Discrete Cosine Transform applied to get frequency domain representation
4. **Hash**: 64-bit hash generated from 8x8 low-frequency DCT coefficients
5. **Comparison**: Hamming distance between hashes determines similarity

### Hamming Distance

The Hamming distance counts the number of differing bits between two hashes:
- Distance 0 = Identical images
- Distance 1-5 = Very similar
- Distance 6-10 = Similar
- Distance 11+ = Different

Similarity percentage is calculated as:
```
similarity = (1 - hamming_distance / hash_length) * 100
```

## Limitations

- Images must be visually similar to be detected (exact duplicates are 100% similar)
- Very small images may produce less accurate results
- Images with significant cropping or major edits may not be detected as similar
- Processing time increases with the number of images (O(n²) complexity for comparisons)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Opera: Full support

Requires modern browser with:
- File API
- Fetch API
- ES6+ JavaScript support

## License

This project is open source and available for educational purposes.

## Contributing

Contributions are welcome! Areas for improvement:
- Add support for more image formats
- Implement additional hashing algorithms (dHash, aHash)
- Add image deletion/management features
- Improve UI/UX
- Add export functionality for results
- Optimize performance for large batches

## Troubleshooting

**Server won't start**: Ensure port 3000 is not in use, or specify a different PORT environment variable.

**Images not uploading**: Check file size (max 50MB) and format (must be image file).

**No similar images found**: Try adjusting the similarity threshold in server.js or upload more visually similar images.

**Processing is slow**: Reduce the number of images in a batch or consider implementing a more efficient comparison algorithm.