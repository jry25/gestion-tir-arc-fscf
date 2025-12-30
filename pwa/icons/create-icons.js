// Node.js script to generate PNG icons from SVG
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons for each size
async function generateIcons() {
  // First, create a proper SVG as a Buffer
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2c3e50"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" fill="#ecf0f1" text-anchor="middle">🏹</text>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ecf0f1" text-anchor="middle">FSCF</text>
</svg>
  `.trim();

  for (const size of sizes) {
    const filename = `icon-${size}x${size}.png`;
    
    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(filename);
      
      console.log(`✓ Created ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to create ${filename}:`, error.message);
    }
  }
  
  console.log('\nIcon generation complete!');
}

generateIcons().catch(console.error);
