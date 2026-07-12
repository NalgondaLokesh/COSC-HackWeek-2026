// content.js
(() => {
    'use strict';

    // State
    let isAutoReplaceEnabled = true;
    let originalImageData = new Map();
    let isCatMode = false;
    let isReplacing = false;

    // Check auto-replace setting from storage
    chrome.storage.sync.get(['autoReplace'], (result) => {
        isAutoReplaceEnabled = result.autoReplace !== false;
        if (isAutoReplaceEnabled && document.readyState === 'complete') {
            replaceAllImages();
        }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.autoReplace) {
            isAutoReplaceEnabled = changes.autoReplace.newValue !== false;
            if (isAutoReplaceEnabled && !isCatMode) {
                replaceAllImages();
            }
        }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
            case 'replaceImages':
                replaceAllImages()
                    .then(() => {
                        const count = document.querySelectorAll('img').length;
                        sendResponse({ count: count });
                    })
                    .catch(() => {
                        sendResponse({ count: 0 });
                    });
                break;

            case 'restoreImages':
                restoreAllImages();
                sendResponse({ success: true });
                break;

            case 'toggleAutoReplace':
                isAutoReplaceEnabled = !isAutoReplaceEnabled;
                sendResponse({ state: isAutoReplaceEnabled });
                break;

            default:
                sendResponse({ error: 'Unknown action' });
        }
        return true; // Keep message channel open for async response
    });

    // ---- Core functions ----

    async function replaceAllImages() {
        if (isReplacing) return;
        isReplacing = true;

        try {
            const images = document.querySelectorAll('img');
            if (images.length === 0) {
                sendStatus('No images found on this page');
                isReplacing = false;
                return;
            }

            // Store original srcs if not already stored
            images.forEach(img => {
                if (!originalImageData.has(img)) {
                    originalImageData.set(img, {
                        src: img.src,
                        srcset: img.srcset,
                        style: img.style.cssText,
                        width: img.width,
                        height: img.height
                    });
                }
            });

            // Replace each image with a random cat image
            const replacePromises = Array.from(images).map((img, index) => {
                return getRandomCatImage(index)
                    .then(catUrl => {
                        img.src = catUrl;
                        img.srcset = '';
                        img.style.width = img.style.width || 'auto';
                        img.style.height = img.style.height || 'auto';
                    })
                    .catch(() => {
                        img.src = 'https://cataas.com/cat?t=' + Date.now() + index;
                    });
            });

            await Promise.allSettled(replacePromises);
            isCatMode = true;
            sendStatus(`🐱 Replaced ${images.length} images with cats!`);
        } catch (error) {
            console.error('Error replacing images:', error);
            sendStatus('⚠️ Error replacing images');
        } finally {
            isReplacing = false;
        }
    }

    function restoreAllImages() {
        originalImageData.forEach((data, img) => {
            if (data.src) {
                img.src = data.src;
            }
            if (data.srcset) {
                img.srcset = data.srcset;
            }
            if (data.style) {
                img.style.cssText = data.style;
            }
            if (data.width) {
                img.width = data.width;
            }
            if (data.height) {
                img.height = data.height;
            }
        });
        isCatMode = false;
        sendStatus('↩️ Original images restored');
    }

    // ---- API helper ----

    function getRandomCatImage(seed) {
        const url = `https://cataas.com/cat?t=${Date.now() + seed}`;
        return fetch(url, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    return url;
                }
                throw new Error('Cat API error');
            })
            .catch(() => {
                return `https://cataas.com/cat?t=${Date.now() + seed}`;
            });
    }

    // ---- Status updates ----

    function sendStatus(text) {
        try {
            chrome.runtime.sendMessage({
                type: 'statusUpdate',
                text: text
            }).catch(() => {
                // Ignore - popup might be closed
            });
        } catch (e) {
            // Ignore
        }
    }

    // ---- Observe for new images ----

    const observer = new MutationObserver((mutations) => {
        if (!isAutoReplaceEnabled || !isCatMode || isReplacing) return;

        let newImages = [];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeName === 'IMG') {
                    newImages.push(node);
                }
                if (node.querySelectorAll) {
                    node.querySelectorAll('img').forEach(img => newImages.push(img));
                }
            });
        });

        if (newImages.length > 0) {
            // Store originals for new images
            newImages.forEach(img => {
                if (!originalImageData.has(img)) {
                    originalImageData.set(img, {
                        src: img.src,
                        srcset: img.srcset,
                        style: img.style.cssText,
                        width: img.width,
                        height: img.height
                    });
                }
            });

            // Replace new images with cats
            newImages.forEach((img, index) => {
                getRandomCatImage(index + Date.now())
                    .then(catUrl => {
                        img.src = catUrl;
                        img.srcset = '';
                    })
                    .catch(() => {
                        img.src = 'https://cataas.com/cat?t=' + Date.now() + index;
                    });
            });
        }
    });

    // Start observing once body is available
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });
        });
    }

    // ---- Initial replacement ----

    if (document.readyState === 'complete') {
        if (isAutoReplaceEnabled) {
            replaceAllImages();
        }
    } else {
        window.addEventListener('load', () => {
            if (isAutoReplaceEnabled) {
                replaceAllImages();
            }
        });
    }

    console.log('🐱 Cat Image Replacer loaded!');
})();