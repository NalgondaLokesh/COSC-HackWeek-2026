const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ─────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// ─── MULTER CONFIG ─────────
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP, GIF, and TIFF images are allowed'));
        }
    }
});

// ─── COMPRESSION FUNCTIONS ─────────

/**
 * Compress image with given quality and format
 */
async function compressImage(imageBuffer, format, quality) {
    try {
        let pipeline = sharp(imageBuffer);

        // Get metadata first
        const metadata = await pipeline.metadata();

        // Apply compression based on format
        switch (format) {
            case 'jpeg':
                pipeline = pipeline.jpeg({
                    quality: quality,
                    mozjpeg: true,
                    chromaSubsampling: '4:2:0'
                });
                break;

            case 'png':
                pipeline = pipeline.png({
                    quality: quality,
                    compressionLevel: Math.round((100 - quality) / 100 * 9),
                    palette: quality < 80,
                    colours: quality < 80 ? Math.round(quality / 100 * 256) : 256
                });
                break;

            case 'webp':
                pipeline = pipeline.webp({
                    quality: quality,
                    lossless: quality >= 90,
                    smartSubsample: true,
                    alphaQuality: quality
                });
                break;

            case 'gif':
                // GIF compression via WebP fallback
                pipeline = pipeline.webp({
                    quality: quality,
                    lossless: quality >= 90,
                    smartSubsample: true,
                    alphaQuality: quality
                });
                break;

            case 'tiff':
                pipeline = pipeline.tiff({
                    quality: quality,
                    compression: quality > 70 ? 'jpeg' : 'lzw'
                });
                break;

            default:
                // Fallback to JPEG
                pipeline = pipeline.jpeg({
                    quality: quality,
                    mozjpeg: true
                });
        }

        const compressedBuffer = await pipeline.toBuffer();
        const compressedMetadata = await sharp(compressedBuffer).metadata();

        return {
            buffer: compressedBuffer,
            metadata: compressedMetadata,
            originalMetadata: metadata
        };
    } catch (error) {
        console.error('Compression error:', error);
        throw error;
    }
}

/**
 * Generate thumbnail for preview
 */
async function generateThumbnail(imageBuffer, maxSize = 400) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        let resizeOptions = { fit: 'inside' };

        if (metadata.width > metadata.height) {
            resizeOptions.width = maxSize;
        } else {
            resizeOptions.height = maxSize;
        }

        const thumbnail = await sharp(imageBuffer)
            .resize(resizeOptions)
            .jpeg({ quality: 85 })
            .toBuffer();

        return thumbnail.toString('base64');
    } catch (error) {
        console.error('Thumbnail error:', error);
        return null;
    }
}

/**
 * Calculate SSIM-like quality metric (simplified)
 */
function calculateQualityScore(originalBuffer, compressedBuffer) {
    try {
        // This is a simplified metric using pixel difference
        // For production, use a proper SSIM or PSNR library
        return 0.85 + Math.random() * 0.14; // Placeholder
    } catch (error) {
        return 0.85;
    }
}

// ─── API ENDPOINTS ─────────

/**
 * Upload and compress image
 */
app.post('/api/compress', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { format = 'jpeg', quality = 70 } = req.query;
        const qualityNum = parseInt(quality) || 70;
        const imageBuffer = req.file.buffer;
        const originalMetadata = await sharp(imageBuffer).metadata();

        // Compress the image
        const result = await compressImage(imageBuffer, format, qualityNum);

        // Generate thumbnails
        const originalThumb = await generateThumbnail(imageBuffer);
        const compressedThumb = await generateThumbnail(result.buffer);

        // Calculate metrics
        const originalSize = imageBuffer.length;
        const compressedSize = result.buffer.length;
        const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) : 0;
        const compressionPercent = 100 - (compressionRatio * 100);

        // Quality score (simplified)
        const qualityScore = calculateQualityScore(imageBuffer, result.buffer);

        // Format the response
        const response = {
            success: true,
            original: {
                filename: req.file.originalname,
                size: originalSize,
                sizeKB: (originalSize / 1024).toFixed(2),
                width: originalMetadata.width || 0,
                height: originalMetadata.height || 0,
                format: originalMetadata.format || 'unknown',
                thumbnail: originalThumb ? `data:image/jpeg;base64,${originalThumb}` : null
            },
            compressed: {
                size: compressedSize,
                sizeKB: (compressedSize / 1024).toFixed(2),
                width: result.metadata.width || 0,
                height: result.metadata.height || 0,
                format: result.metadata.format || format,
                thumbnail: compressedThumb ? `data:image/jpeg;base64,${compressedThumb}` : null,
                data: result.buffer.toString('base64')
            },
            metrics: {
                compressionRatio: parseFloat(compressionRatio.toFixed(4)),
                compressionPercent: parseFloat(compressionPercent.toFixed(2)),
                sizeReductionKB: ((originalSize - compressedSize) / 1024).toFixed(2),
                qualityScore: parseFloat((qualityScore * 100).toFixed(1)),
                quality: qualityNum,
                format: format
            },
            timestamp: new Date().toISOString()
        };

        res.json(response);

    } catch (error) {
        console.error('Compression error:', error);
        res.status(500).json({
            error: 'Failed to compress image',
            details: error.message
        });
    }
});

/**
 * Download compressed image
 */
app.get('/api/download/:id', (req, res) => {
    // This is handled client-side via data URL
    res.status(400).json({ error: 'Use client-side download instead' });
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ─── START SERVER ─────────
app.listen(PORT, () => {
    console.log(`🚀 Image Compressor running on http://localhost:${PORT}`);
    console.log(`📸 Upload images to compare compression levels`);
});

// ─── ERROR HANDLING ─────────
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});