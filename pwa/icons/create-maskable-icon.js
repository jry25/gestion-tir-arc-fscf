// Node.js script to generate maskable icon from SVG
const sharp = require('sharp');

// Maskable icons need extra padding (safe zone)
// The icon content should be within 80% of the canvas (40% padding on each side)
async function generateMaskableIcon() {
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2c3e50"/>
  <g transform="translate(256, 256) scale(0.6) translate(-256, -256)">
    <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" fill="#ecf0f1" text-anchor="middle">🏹</text>
    <text x="256" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ecf0f1" text-anchor="middle">FSCF</text>
  </g>
</svg>
  `.trim();

  try {
    await sharp(Buffer.from(svgContent))
      .resize(512, 512)
      .png()
      .toFile('icon-512x512-maskable.png');
    
    console.log('✓ Created icon-512x512-maskable.png (512x512) with safe zone padding');
  } catch (error) {
    console.error('✗ Failed to create maskable icon:', error.message);
  }
}

generateMaskableIcon().catch(console.error);
