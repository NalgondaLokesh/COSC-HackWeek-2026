// ─── CONFIGURATION ─────────
const API_URL = 'http://localhost:3000/api/compress';

// ─── STATE ─────────
let currentFile = null;
let currentResult = null;
let currentFormat = 'jpeg';
let currentQuality = 70;
let isProcessing = false;

// ─── DOM REFS ─────────
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const compressBtn = document.getElementById('compressBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelpModal = document.getElementById('closeHelpModal');

const controlsSection = document.getElementById('controlsSection');
const resultsSection = document.getElementById('resultsSection');

const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalMeta = document.getElementById('originalMeta');
const compressedMeta = document.getElementById('compressedMeta');
const originalFooter = document.getElementById('originalFooter');
const compressedFooter = document.getElementById('compressedFooter');

const metricOriginalSize = document.getElementById('metricOriginalSize');
const metricCompressedSize = document.getElementById('metricCompressedSize');
const metricReduction = document.getElementById('metricReduction');
const metricRatio = document.getElementById('metricRatio');
const metricQuality = document.getElementById('metricQuality');
const metricDimensions = document.getElementById('metricDimensions');

const barOriginalSize = document.getElementById('barOriginalSize');
const barCompressedSize = document.getElementById('barCompressedSize');
const barReduction = document.getElementById('barReduction');
const barRatio = document.getElementById('barRatio');
const barQuality = document.getElementById('barQuality');

const loadingOverlay = document.getElementById('loadingOverlay');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// ─── SLIDER COMPARISON ─────────
const sliderOriginal = document.getElementById('sliderOriginal');
const sliderCompressed = document.getElementById('sliderCompressed');
const sliderHandle = document.getElementById('sliderHandle');
const compressedWrapper = document.querySelector('.compressed-wrapper');
const sliderView = document.getElementById('sliderView');
const sideBySideView = document.getElementById('sideBySideView');

let isDragging = false;

// ─── TOAST ─────────
function showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ─── FILE HANDLING ─────────
function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('⚠️ Please select an image file');
        return;
    }

    currentFile = file;
    controlsSection.style.display = 'flex';
    showToast(`📸 Loaded: ${file.name}`);

    // Show preview of original
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage.innerHTML = `<img src="${e.target.result}" alt="Original" />`;
        originalMeta.textContent = `${(file.size / 1024).toFixed(1)} KB · ${file.type}`;
        originalFooter.textContent = `📁 ${file.name}`;
    };
    reader.readAsDataURL(file);

    // Auto-compress
    compressImage();
}

// ─── COMPRESS IMAGE ─────────
async function compressImage() {
    if (!currentFile) {
        showToast('⚠️ Please upload an image first');
        return;
    }

    if (isProcessing) return;
    isProcessing = true;
    compressBtn.disabled = true;
    loadingOverlay.classList.add('show');

    // Reset progress
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    // Simulate progress (since we can't track real progress from the API)
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }, 200);

    const formData = new FormData();
    formData.append('image', currentFile);

    try {
        const response = await fetch(
            `${API_URL}?format=${currentFormat}&quality=${currentQuality}`,
            {
                method: 'POST',
                body: formData
            }
        );

        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressText.textContent = '100%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Compression failed');
        }

        const data = await response.json();
        currentResult = data;
        renderResults(data);
        showToast(`✅ Compression complete! ${data.metrics.compressionPercent}% reduction`);

    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        showToast(`❌ Error: ${error.message}`);
    } finally {
        isProcessing = false;
        compressBtn.disabled = false;
        setTimeout(() => {
            loadingOverlay.classList.remove('show');
        }, 500);
    }
}

// ─── RENDER RESULTS ─────────
function renderResults(data) {
    resultsSection.style.display = 'block';

    // Compressed image - side by side view
    if (data.compressed.thumbnail) {
        compressedImage.innerHTML = `<img src="${data.compressed.thumbnail}" alt="Compressed" />`;
        compressedMeta.textContent = `${data.compressed.sizeKB} KB · ${data.compressed.format}`;
        compressedFooter.textContent = `Quality: ${data.metrics.quality}% · ${data.compressed.width}×${data.compressed.height}`;

        // Slider view images
        sliderCompressed.src = data.compressed.thumbnail;
        sliderOriginal.src = originalImage.querySelector('img')?.src || '';
    }

    // Update metrics
    metricOriginalSize.textContent = `${data.original.sizeKB} KB`;
    metricOriginalSize.className = 'metric-value';

    metricCompressedSize.textContent = `${data.compressed.sizeKB} KB`;
    metricCompressedSize.className = 'metric-value';

    const reduction = parseFloat(data.metrics.sizeReductionKB);
    const reductionPercent = data.metrics.compressionPercent;

    metricReduction.textContent = `${reductionPercent}%`;
    metricReduction.className = 'metric-value';
    if (reductionPercent > 70) metricReduction.classList.add('green');
    else if (reductionPercent > 40) metricReduction.classList.add('orange');
    else metricReduction.classList.add('red');

    metricRatio.textContent = `${data.metrics.compressionRatio}x`;
    metricRatio.className = 'metric-value accent';

    metricQuality.textContent = `${data.metrics.qualityScore}%`;
    metricQuality.className = 'metric-value';
    if (data.metrics.qualityScore > 85) metricQuality.classList.add('green');
    else if (data.metrics.qualityScore > 70) metricQuality.classList.add('orange');
    else metricQuality.classList.add('red');

    metricDimensions.textContent = `${data.compressed.width}×${data.compressed.height}`;
    metricDimensions.className = 'metric-value accent';

    // Update visual bars
    updateMetricBars(data);

    // Enable download
    downloadBtn.disabled = false;
}

// ─── UPDATE METRIC BARS ─────────
function updateMetricBars(data) {
    // Original size bar (relative to a max of 10MB for visualization)
    const originalSizeKB = parseFloat(data.original.sizeKB);
    const maxSizeKB = 10240; // 10MB
    const originalPercent = Math.min((originalSizeKB / maxSizeKB) * 100, 100);
    barOriginalSize.innerHTML = `<div class="metric-bar-fill accent" style="width: ${originalPercent}%"></div>`;

    // Compressed size bar
    const compressedSizeKB = parseFloat(data.compressed.sizeKB);
    const compressedPercent = Math.min((compressedSizeKB / maxSizeKB) * 100, 100);
    barCompressedSize.innerHTML = `<div class="metric-bar-fill green" style="width: ${compressedPercent}%"></div>`;

    // Reduction bar
    const reductionPercent = data.metrics.compressionPercent;
    let reductionColor = 'red';
    if (reductionPercent > 70) reductionColor = 'green';
    else if (reductionPercent > 40) reductionColor = 'orange';
    barReduction.innerHTML = `<div class="metric-bar-fill ${reductionColor}" style="width: ${reductionPercent}%"></div>`;

    // Ratio bar (relative to max 10x)
    const ratio = parseFloat(data.metrics.compressionRatio);
    const maxRatio = 10;
    const ratioPercent = Math.min((ratio / maxRatio) * 100, 100);
    barRatio.innerHTML = `<div class="metric-bar-fill accent" style="width: ${ratioPercent}%"></div>`;

    // Quality bar
    const qualityScore = data.metrics.qualityScore;
    let qualityColor = 'red';
    if (qualityScore > 85) qualityColor = 'green';
    else if (qualityScore > 70) qualityColor = 'orange';
    barQuality.innerHTML = `<div class="metric-bar-fill ${qualityColor}" style="width: ${qualityScore}%"></div>`;
}

// ─── DOWNLOAD COMPRESSED IMAGE ─────────
function downloadImage() {
    if (!currentResult || !currentResult.compressed.data) {
        showToast('⚠️ No compressed image available');
        console.error('Download failed: No compressed data');
        return;
    }

    try {
        const data = currentResult.compressed.data;
        const format = currentResult.metrics.format || currentFormat;
        const mimeType = format === 'jpeg' ? 'image/jpeg' :
                         format === 'png' ? 'image/png' :
                         format === 'webp' ? 'image/webp' :
                         format === 'gif' ? 'image/gif' : 'image/jpeg';

        console.log('Downloading image:', { format, mimeType, dataSize: data.length });

        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const originalName = currentFile ? currentFile.name.replace(/\.[^.]+$/, '') : 'compressed';
        link.download = `${originalName}_compressed.${format}`;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('⬇️ Image downloaded!');
    } catch (error) {
        console.error('Download error:', error);
        showToast('❌ Download failed: ' + error.message);
    }
}

// ─── RESET ─────────
function resetAll() {
    currentFile = null;
    currentResult = null;
    controlsSection.style.display = 'none';
    resultsSection.style.display = 'none';
    fileInput.value = '';
    originalImage.innerHTML = '<div class="placeholder-text">No image</div>';
    compressedImage.innerHTML = '<div class="placeholder-text">No image</div>';
    sliderOriginal.src = '';
    sliderCompressed.src = '';
    downloadBtn.disabled = true;
    showToast('🔄 Reset complete');
}

// ─── SLIDER FUNCTIONALITY ─────────
function initSlider() {
    const container = document.querySelector('.slider-container');

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateSlider(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateSlider(e);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch support
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateSlider(e.touches[0]);
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateSlider(e.touches[0]);
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

function updateSlider(e) {
    const container = document.querySelector('.slider-container');
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = (x / rect.width) * 100;

    compressedWrapper.style.width = `${percent}%`;
    sliderHandle.style.left = `${percent}%`;
}

// ─── VIEW TOGGLE ─────────
function initViewToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.dataset.view;
            if (view === 'slider') {
                sliderView.style.display = 'block';
                sideBySideView.style.display = 'none';
            } else {
                sliderView.style.display = 'none';
                sideBySideView.style.display = 'grid';
            }
        });
    });
}

// ─── EVENT LISTENERS ─────────
// File input
fileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
        handleFile(this.files[0]);
    }
    this.value = '';
});

// Drag and drop
dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Quality slider
qualitySlider.addEventListener('input', function() {
    currentQuality = parseInt(this.value);
    qualityValue.textContent = `${currentQuality}%`;
});

// Auto-compress on slider change (debounced)
let sliderTimeout;
qualitySlider.addEventListener('change', function() {
    clearTimeout(sliderTimeout);
    sliderTimeout = setTimeout(() => {
        if (currentFile) {
            compressImage();
        }
    }, 500);
});

// Format buttons
document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFormat = this.dataset.format;

        // Auto-compress when format changes
        if (currentFile) {
            compressImage();
        }
    });
});

// Compress button
compressBtn.addEventListener('click', compressImage);

// Download button
downloadBtn.addEventListener('click', downloadImage);

// Reset button
resetBtn.addEventListener('click', resetAll);

// Help modal
helpBtn.addEventListener('click', () => {
    helpModal.classList.add('show');
});

closeHelpModal.addEventListener('click', () => {
    helpModal.classList.remove('show');
});

helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
        helpModal.classList.remove('show');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        compressImage();
    }
    if (e.key === 'Escape') {
        helpModal.classList.remove('show');
    }
});

// ─── IMAGE ZOOM ─────────
function initImageZoom() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('zoomed')) {
            e.target.classList.remove('zoomed');
        } else if (e.target.tagName === 'IMG' && e.target.closest('.compare-image')) {
            e.target.classList.add('zoomed');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.zoomed').forEach(img => {
                img.classList.remove('zoomed');
            });
        }
    });
}

// ─── INIT ─────────
initSlider();
initViewToggle();
initImageZoom();
console.log('📦 Image Compressor ready!');
console.log('📸 Upload an image to compare compression levels');