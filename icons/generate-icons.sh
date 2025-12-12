#!/bin/bash
# Simple script to generate PNG icons from SVG
# This creates placeholder icons - replace with proper icons later

sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    # Create a simple colored square with text as placeholder
    convert -size ${size}x${size} xc:"#2c3e50" \
            -gravity center \
            -pointsize $((size/4)) \
            -fill "#ecf0f1" \
            -font "DejaVu-Sans-Bold" \
            -annotate +0+0 "🏹" \
            "icon-${size}x${size}.png"
done

echo "Icon generation complete!"
