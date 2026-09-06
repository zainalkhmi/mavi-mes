/**
 * Icon Generator Script for Mavi Builder
 *
 * Run: node generate-icons.js
 *
 * Requires: npm install sharp (optional) or use placeholder icons
 */

const fs = require('fs');
const path = require('path');

// Create icons directory if not exists
const iconsDir = path.join(__dirname, 'src-tauri', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG icon as base
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#714b67"/>
      <stop offset="100%" style="stop-color:#4a2f45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">M</text>
</svg>`;

// Write SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

console.log('✅ Icon SVG created at src-tauri/icons/icon.svg');

// For PNG icons, you'll need to use a tool like:
// - sharp: npm install sharp && node scripts/generate-png-icons.js
// - ImageMagick: convert icon.svg -resize 32x32 icon.png
// - Online converter: https://cloudconvert.com/svg-to-png

console.log('');
console.log('📋 Next steps for icons:');
console.log('1. Convert icon.svg to PNG using ImageMagick or sharp');
console.log('2. Or download default icons from: https://www.tauri.app/docs/distribute/icons/');
console.log('');
console.log('Required icon sizes:');
console.log('  - 32x32.png');
console.log('  - 128x128.png');
console.log('  - 128x128@2x.png (256x256)');
console.log('  - icon.ico (Windows)');
console.log('  - icon.icns (macOS)');
