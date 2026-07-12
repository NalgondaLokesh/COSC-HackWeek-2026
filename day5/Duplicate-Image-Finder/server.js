
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ─── IMAGE HASHING FUNCTIONS ─────────

/**
 * Compute perceptual hash (pHash) of an image
 * Uses DCT-based hashing for robust similarity detection
 */
async function computePHash(imageBuffer) {
    try {
        // 1. Resize to 32x32 (for DCT)
        const resized = await sharp(imageBuffer)
            .resize(32, 32, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        // 2. Convert to 2D array
        const size = 32;
        const pixels = [];
        for (let i = 0; i < size; i++) {
            pixels[i] = [];
            for (let j = 0; j < size; j++) {
                pixels[i][j] = resized[i * size + j];
            }
        }

        // 3. Apply DCT (Discrete Cosine Transform)
        // Simplified DCT for 32x32 -> 8x8 low-frequency coefficients
        const dctSize = 8;
        const dct = [];

        for (let u = 0; u < dctSize; u++) {
            dct[u] = [];
            for (let v = 0; v < dctSize; v++) {
                let sum = 0;
                for (let x = 0; x < size; x++) {
                    for (let y = 0; y < size; y++) {
                        const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
                        const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
                        const cos1 = Math.cos((2 * x + 1) * u * Math.PI / (2 * size));
                        const cos2 = Math.cos((2 * y + 1) * v * Math.PI / (2 * size));
                        sum += pixels[x][y] * cos1 * cos2;
                    }
                }
                const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
                const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
                dct[u][v] = sum * cu * cv / Math.sqrt(2 * size);
            }
        }

        // 4. Compute average of DCT coefficients (excluding DC)
        let sum = 0;
        for (let u = 0; u < dctSize; u++) {
            for (let v = 0; v < dctSize; v++) {
                if (u === 0 && v === 0) continue;
                sum += dct[u][v];
            }
        }
        const avg = sum / (dctSize * dctSize - 1);

        // 5. Generate hash bits
        let hash = '';
        for (let u = 0; u < dctSize; u++) {
            for (let v = 0; v < dctSize; v++) {
                if (u === 0 && v === 0) continue;
                hash += dct[u][v] > avg ? '1' : '0';
            }
        }

        return hash;
    } catch (error) {
        console.error('Error computing pHash:', error);
        // Fallback: use simple hash
        return computeSimpleHash(imageBuffer);
    }
}

/**
 * Fallback: Simple average hash (aHash)
 */
async function computeSimpleHash(imageBuffer) {
    try {
        const resized = await sharp(imageBuffer)
            .resize(8, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        const avg = resized.reduce((a, b) => a + b, 0) / resized.length;
        let hash = '';
        for (let i = 0; i < resized.length; i++) {
            hash += resized[i] > avg ? '1' : '0';
        }
        return hash;
    } catch (error) {
        console.error('Error computing simple hash:', error);
        return '';
    }
}

/**
 * Compute Hamming distance between two hash strings
 */
function hammingDistance(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) {
        return hash1 === hash2 ? 0 : Math.max(hash1.length, hash2.length);
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
}

/**
 * Calculate similarity percentage from Hamming distance
 */
function calculateSimilarity(hash1, hash2) {
    if (!hash1 || !hash2) return 0;
    const distance = hammingDistance(hash1, hash2);
    const maxDistance = Math.max(hash1.length, hash2.length);
    if (maxDistance === 0) return 100;
    return ((maxDistance - distance) / maxDistance) * 100;
}

/**
 * Generate thumbnail for preview
 */
async function generateThumbnail(imageBuffer, maxSize = 200) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 200;
        const height = metadata.height || 200;

        let resizeOptions = { fit: 'inside' };
        if (width > height) {
            resizeOptions.width = maxSize;
        } else {
            resizeOptions.height = maxSize;
        }

        const thumbnail = await sharp(imageBuffer)
            .resize(resizeOptions)
            .jpeg({ quality: 80 })
            .toBuffer();

        return thumbnail.toString('base64');
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
    }
}

// ─── API ENDPOINTS ─────────

/**
 * Upload and analyze images
 */
app.post('/api/analyze', upload.array('images', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const results = [];

        // Process each image
        for (const file of req.files) {
            try {
                const imageBuffer = file.buffer;

                // Compute perceptual hash
                const phash = await computePHash(imageBuffer);

                // Generate thumbnail
                const thumbnail = await generateThumbnail(imageBuffer);

                // Get image metadata
                const metadata = await sharp(imageBuffer).metadata();

                results.push({
                    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    filename: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    width: metadata.width || 0,
                    height: metadata.height || 0,
                    phash: phash,
                    thumbnail: thumbnail ? `data:image/jpeg;base64,${thumbnail}` : null,
                    uploadedAt: new Date().toISOString()
                });
            } catch (error) {
                console.error(`Error processing ${file.originalname}:`, error);
                results.push({
                    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    filename: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    error: error.message,
                    phash: '',
                    thumbnail: null
                });
            }
        }

        // Find duplicate/similar images
        const groups = findSimilarImages(results);

        res.json({
            success: true,
            total: results.length,
            images: results,
            groups: groups,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error analyzing images:', error);
        res.status(500).json({
            error: 'Failed to analyze images',
            details: error.message
        });
    }
});

/**
 * Find similar images using perceptual hashing
 */
function findSimilarImages(images) {
    const groups = [];
    const processed = new Set();

    // Filter out images with errors
    const validImages = images.filter(img => img.phash && !img.error);

    for (let i = 0; i < validImages.length; i++) {
        if (processed.has(i)) continue;

        const group = {
            id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            images: [i],
            similarities: []
        };

        for (let j = i + 1; j < validImages.length; j++) {
            if (processed.has(j)) continue;

            const similarity = calculateSimilarity(
                validImages[i].phash,
                validImages[j].phash
            );

            // 70% threshold for similarity
            if (similarity >= 70) {
                group.images.push(j);
                group.similarities.push({
                    index1: i,
                    index2: j,
                    similarity: Math.round(similarity * 100) / 100
                });
                processed.add(j);
            }
        }

        if (group.images.length > 1) {
            processed.add(i);
            // Calculate average similarity for the group
            const totalSim = group.similarities.reduce((sum, s) => sum + s.similarity, 0);
            group.averageSimilarity = group.similarities.length > 0 ?
                Math.round((totalSim / group.similarities.length) * 100) / 100 :
                100;
            groups.push(group);
        }
    }

    return groups;
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// ─── START SERVER ─────────
app.listen(PORT, () => {
    console.log(`🚀 Image Similarity Detector running on http://localhost:${PORT}`);
    console.log(`📸 Upload images to detect duplicates and similar images`);
});

// ─── ERROR HANDLING ─────────
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});