# PWA Icons

This directory contains the icons for the Progressive Web App.

## Icon Files

- `icon.svg` - Source SVG file
- `icon-{size}x{size}.png` - Standard icons (72x72 to 512x512)
- `icon-512x512-maskable.png` - Maskable icon with safe zone padding

## Regenerating Icons

If you need to regenerate the icons from the SVG source:

```bash
# Install dependencies
npm install

# Generate standard icons
node create-icons.js

# Generate maskable icon
node create-maskable-icon.js
```

## Icon Sizes

- 72x72 - Small devices
- 96x96 - Medium devices
- 128x128 - Large devices
- 144x144 - Minimum for PWA installability
- 152x152 - iOS devices
- 192x192 - Standard Android
- 384x384 - High-res displays
- 512x512 - High-res displays and splash screens
- 512x512 (maskable) - Adaptive icon with safe zone

## Notes

- The maskable icon has extra padding (60% content, 40% safe zone) to ensure proper display on all platforms
- All icons are generated from `icon.svg` using the Sharp image processing library
- Icons are cached by the service worker for offline use
