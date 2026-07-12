// ─── CONFIGURATION ─────────
const API_URL = 'http://localhost:3000/api/analyze';

// ─── STATE ─────────
let selectedFiles = [];
let analysisResults = null;
let isAnalyzing = false;
let selectedImageIndices = new Set();
let currentFilter = 'all'; // 'all', 'duplicates', 'unique'

// ─── DOM REFS ─────────
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const fileCount = document.getElementById('fileCount');
const resultsSection = document.getElementById('resultsSection');
const imageGrid = document.getElementById('imageGrid');
const groupsContainer = document.getElementById('groupsContainer');
const totalImages = document.getElementById('totalImages');
const duplicateGroups = document.getElementById('duplicateGroups');
const selectedCount = document.getElementById('selectedCount');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const loadingSubtext = document.getElementById('loadingSubtext');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const actionBar = document.getElementById('actionBar');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const keepBestBtn = document.getElementById('keepBestBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const filterBar = document.getElementById('filterBar');
const filterAll = document.getElementById('filterAll');
const filterDuplicates = document.getElementById('filterDuplicates');
const filterUnique = document.getElementById('filterUnique');

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
function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
        showToast('⚠️ Please select image files only');
        return;
    }

    selectedFiles = selectedFiles.concat(imageFiles);
    updateFileCount();
    showToast(`📸 ${imageFiles.length} image(s) added`);
}

function updateFileCount() {
    fileCount.textContent = `${selectedFiles.length} file(s) selected`;
    analyzeBtn.disabled = selectedFiles.length === 0;
}

function clearFiles() {
    selectedFiles = [];
    selectedImageIndices.clear();
    fileInput.value = '';
    updateFileCount();
    resultsSection.style.display = 'none';
    actionBar.style.display = 'none';
    analysisResults = null;
    showToast('🗑️ All files cleared');
}

// ─── ANALYZE IMAGES ─────────
async function analyzeImages() {
    if (selectedFiles.length === 0) {
        showToast('⚠️ Please select images first');
        return;
    }

    if (isAnalyzing) return;
    isAnalyzing = true;
    analyzeBtn.disabled = true;
    loadingOverlay.classList.add('show');

    // Show progress bar
    progressBar.style.display = 'block';
    progressText.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    loadingText.textContent = 'Uploading images...';
    loadingSubtext.textContent = `${selectedFiles.length} image(s) to process`;

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });

    try {
        // Simulate progress during upload
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 30) {
                progress += 5;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            }
        }, 100);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressFill.style.width = '60%';
        progressText.textContent = '60%';
        loadingText.textContent = 'Processing images...';
        loadingSubtext.textContent = 'Computing perceptual hashes';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Analysis failed');
        }

        const data = await response.json();
        
        // Complete progress
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        loadingText.textContent = 'Analysis complete!';
        
        analysisResults = data;
        renderResults(data);
        showToast(`✅ Analysis complete! ${data.total} images analyzed`);

    } catch (error) {
        console.error('Error:', error);
        showToast(`❌ Error: ${error.message}`);
    } finally {
        isAnalyzing = false;
        analyzeBtn.disabled = false;
        setTimeout(() => {
            loadingOverlay.classList.remove('show');
            progressBar.style.display = 'none';
            progressText.style.display = 'none';
            loadingText.textContent = 'Analyzing images...';
            loadingSubtext.textContent = 'Using perceptual hashing (pHash)';
        }, 500);
    }
}

// ─── RENDER RESULTS ─────────
function renderResults(data) {
    resultsSection.style.display = 'block';
    totalImages.textContent = data.total;
    duplicateGroups.textContent = data.groups.length;
    selectedImageIndices.clear();
    currentFilter = 'all';
    updateSelectedCount();
    updateFilterButtons();

    // Show filter bar
    filterBar.style.display = 'block';

    // Render image grid
    renderImageGrid(data.images);

    // Render groups
    renderGroups(data.images, data.groups);
}

function renderImageGrid(images) {
    imageGrid.innerHTML = '';

    // Get indices of images in duplicate groups
    const duplicateIndices = new Set();
    if (analysisResults && analysisResults.groups) {
        analysisResults.groups.forEach(group => {
            group.images.forEach(idx => duplicateIndices.add(idx));
        });
    }

    // Filter images based on current filter
    const filteredIndices = [];
    images.forEach((img, index) => {
        if (currentFilter === 'all') {
            filteredIndices.push(index);
        } else if (currentFilter === 'duplicates') {
            if (duplicateIndices.has(index)) {
                filteredIndices.push(index);
            }
        } else if (currentFilter === 'unique') {
            if (!duplicateIndices.has(index)) {
                filteredIndices.push(index);
            }
        }
    });

    // Show message if no images match filter
    if (filteredIndices.length === 0) {
        const message = currentFilter === 'duplicates' 
            ? 'No duplicate images found' 
            : 'No unique images found';
        imageGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${currentFilter === 'duplicates' ? '🔗' : '✨'}</div>
                <p>${message}</p>
                <small>Try a different filter</small>
            </div>
        `;
        return;
    }

    // Render filtered images
    filteredIndices.forEach((originalIndex) => {
        const img = images[originalIndex];
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.index = originalIndex;

        const hasError = img.error || !img.thumbnail;
        const isDuplicate = duplicateIndices.has(originalIndex);

        card.innerHTML = `
            <div class="image-index">#${originalIndex + 1}</div>
            ${isDuplicate ? '<div class="badge duplicate-badge">🔗</div>' : '<div class="badge unique-badge">✨</div>'}
            <div class="checkbox-wrapper">
                <input type="checkbox" class="image-checkbox" data-index="${originalIndex}" />
            </div>
            ${hasError ? `
                <div style="height:150px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.8rem;background:var(--bg-primary);">
                    ⚠️ ${img.error || 'No preview'}
                </div>
            ` : `
                <img src="${img.thumbnail}" alt="${img.filename}" loading="lazy" />
            `}
            <div class="image-info">
                <div class="name" title="${img.filename}">${img.filename}</div>
                <div class="size">${(img.size / 1024).toFixed(1)} KB · ${img.width}×${img.height}</div>
            </div>
        `;

        // Add click handler for card selection
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-checkbox')) return;
            const checkbox = card.querySelector('.image-checkbox');
            checkbox.checked = !checkbox.checked;
            toggleImageSelection(originalIndex, checkbox.checked);
        });

        // Add change handler for checkbox
        const checkbox = card.querySelector('.image-checkbox');
        checkbox.addEventListener('change', (e) => {
            toggleImageSelection(originalIndex, e.target.checked);
        });

        imageGrid.appendChild(card);
    });
}

function renderGroups(images, groups) {
    groupsContainer.innerHTML = '';

    if (groups.length === 0) {
        groupsContainer.innerHTML = `
            <div style="text-align:center;padding:2rem;color:var(--text-muted);">
                <div style="font-size:2rem;margin-bottom:0.5rem;">✨</div>
                <p>No duplicate or similar images found</p>
                <small>All images are unique</small>
            </div>
        `;
        return;
    }

    groups.forEach((group, groupIndex) => {
        const card = document.createElement('div');
        card.className = 'group-card';

        const groupImages = group.images.map(idx => images[idx]);

        card.innerHTML = `
            <div class="group-header">
                <span class="group-id">Group #${groupIndex + 1} · ${groupImages.length} images</span>
                <span class="group-similarity">🔗 ${group.averageSimilarity || 0}% similar</span>
            </div>
            <div class="group-images">
                ${groupImages.map((img, idx) => {
                    const sim = group.similarities.find(s =>
                        s.index1 === group.images[0] && s.index2 === group.images[idx] ||
                        s.index1 === group.images[idx] && s.index2 === group.images[0]
                    );
                    const simPercent = sim ? sim.similarity : 100;
                    return `
                        <div class="group-image-item">
                            <img src="${img.thumbnail || ''}" alt="${img.filename}" />
                            ${idx > 0 ? `<div class="sim-label">${simPercent}%</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        groupsContainer.appendChild(card);
    });
}

// ─── IMAGE SELECTION ─────────
function toggleImageSelection(index, isSelected) {
    if (isSelected) {
        selectedImageIndices.add(index);
    } else {
        selectedImageIndices.delete(index);
    }
    updateSelectedCount();
    updateCardSelectionStyles();
}

function updateSelectedCount() {
    selectedCount.textContent = selectedImageIndices.size;
    actionBar.style.display = selectedImageIndices.size > 0 ? 'block' : 'none';
}

function updateCardSelectionStyles() {
    const cards = document.querySelectorAll('.image-card');
    cards.forEach(card => {
        const index = parseInt(card.dataset.index);
        const checkbox = card.querySelector('.image-checkbox');
        if (selectedImageIndices.has(index)) {
            card.classList.add('selected');
            checkbox.checked = true;
        } else {
            card.classList.remove('selected');
            checkbox.checked = false;
        }
    });
}

function selectAllImages() {
    if (!analysisResults) return;
    for (let i = 0; i < analysisResults.images.length; i++) {
        selectedImageIndices.add(i);
    }
    updateSelectedCount();
    updateCardSelectionStyles();
    showToast(`✓ All ${analysisResults.images.length} images selected`);
}

function deselectAllImages() {
    selectedImageIndices.clear();
    updateSelectedCount();
    updateCardSelectionStyles();
    showToast('✗ All images deselected');
}

function deleteSelectedImages() {
    if (selectedImageIndices.size === 0) {
        showToast('⚠️ No images selected');
        return;
    }

    if (!confirm(`Are you sure you want to remove ${selectedImageIndices.size} selected image(s)?`)) {
        return;
    }

    // Remove selected images from results
    const indicesToDelete = Array.from(selectedImageIndices).sort((a, b) => b - a);
    indicesToDelete.forEach(index => {
        analysisResults.images.splice(index, 1);
    });

    // Update groups to remove deleted images
    analysisResults.groups = analysisResults.groups.map(group => {
        const remainingImages = group.images.filter(idx => !selectedImageIndices.has(idx));
        const remainingSimilarities = group.similarities.filter(s =>
            !selectedImageIndices.has(s.index1) && !selectedImageIndices.has(s.index2)
        );
        return {
            ...group,
            images: remainingImages,
            similarities: remainingSimilarities
        };
    }).filter(group => group.images.length > 1);

    // Clear selection and re-render
    selectedImageIndices.clear();
    updateSelectedCount();
    renderResults(analysisResults);
    showToast(`🗑️ ${indicesToDelete.length} image(s) removed`);
}

function keepBestQuality() {
    if (!analysisResults || analysisResults.groups.length === 0) {
        showToast('⚠️ No duplicate groups found');
        return;
    }

    // Clear current selection
    selectedImageIndices.clear();

    // For each group, select all images except the best quality one
    analysisResults.groups.forEach(group => {
        if (group.images.length < 2) return;

        const groupImages = group.images.map(idx => analysisResults.images[idx]);
        // Find best quality image (highest resolution)
        let bestIndex = group.images[0];
        let maxPixels = 0;

        groupImages.forEach((img, idx) => {
            const pixels = img.width * img.height;
            if (pixels > maxPixels) {
                maxPixels = pixels;
                bestIndex = group.images[idx];
            }
        });

        // Select all images except the best one
        group.images.forEach(idx => {
            if (idx !== bestIndex) {
                selectedImageIndices.add(idx);
            }
        });
    });

    updateSelectedCount();
    updateCardSelectionStyles();
    showToast(`⭐ Selected ${selectedImageIndices.size} lower quality images for deletion`);
}

// ─── FILTER FUNCTIONS ─────────
function updateFilterButtons() {
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === currentFilter) {
            btn.classList.add('active');
        }
    });
}

function setFilter(filterType) {
    currentFilter = filterType;
    updateFilterButtons();
    renderImageGrid(analysisResults.images);
    
    const filterNames = {
        'all': 'All Images',
        'duplicates': 'Duplicates',
        'unique': 'Unique'
    };
    showToast(`🔍 Showing ${filterNames[filterType]}`);
}

// ─── EVENT LISTENERS ─────────
// File input
fileInput.addEventListener('change', function(e) {
    if (this.files.length > 0) {
        handleFiles(this.files);
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
        handleFiles(e.dataTransfer.files);
    }
});

// Buttons
analyzeBtn.addEventListener('click', analyzeImages);
clearBtn.addEventListener('click', clearFiles);
deleteSelectedBtn.addEventListener('click', deleteSelectedImages);
keepBestBtn.addEventListener('click', keepBestQuality);
selectAllBtn.addEventListener('click', selectAllImages);
deselectAllBtn.addEventListener('click', deselectAllImages);

// Filter buttons
filterAll.addEventListener('click', () => setFilter('all'));
filterDuplicates.addEventListener('click', () => setFilter('duplicates'));
filterUnique.addEventListener('click', () => setFilter('unique'));

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        analyzeImages();
    }
});

// ─── INIT ─────────
console.log('🔍 Image Similarity Detector ready!');
console.log('📸 Upload images to detect duplicates using pHash');
updateFileCount();