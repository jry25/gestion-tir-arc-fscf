// Simple Node.js script to create placeholder icon files
// Creates minimal valid PNG files as placeholders
const fs = require('fs');

// Minimal 1x1 PNG (base64)
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(filename, minimalPNG);
  console.log(`Created ${filename}`);
});

console.log('Placeholder icons created. Replace with proper icons for production.');
