# PWA Screenshots

This directory contains screenshots for the Progressive Web App manifest.

## Screenshot Files

- `desktop-wide.png` - Desktop view (1920x1080) with `form_factor: wide`
- `mobile.png` - Mobile view (375x812)

## Purpose

These screenshots are used by browsers to:
- Display a richer install UI on desktop and mobile
- Show users what the app looks like before installation
- Improve discoverability in app stores and PWA catalogs

## Requirements

According to PWA best practices:
- At least one screenshot with `form_factor: wide` for desktop install UI
- At least one screenshot without `form_factor` or with a non-wide value for mobile install UI
- Screenshots should represent actual app functionality
- Images should be high-quality PNG files

## Updating Screenshots

To update screenshots:
1. Run the app locally
2. Navigate to the desired page
3. Take screenshots at the appropriate resolutions
4. Save them in this directory
5. Update `manifest.json` if dimensions change
