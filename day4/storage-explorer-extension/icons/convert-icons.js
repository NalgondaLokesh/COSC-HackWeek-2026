const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];

async function convertIcons() {
  for (const size of sizes) {
    const svgPath = path.join(__dirname, `icon${size}.svg`);
    const pngPath = path.join(__dirname, `icon${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`Created icon${size}.png`);
    } catch (error) {
      console.error(`Error converting icon${size}:`, error);
    }
  }
  
  console.log('Icon conversion complete!');
}

convertIcons();
