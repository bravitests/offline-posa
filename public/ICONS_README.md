# PWA Icons

The PWA requires two icon files:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

## Quick Setup

1. Create a simple icon or logo for your POS system
2. Use an online tool to generate PWA icons:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
3. Place the generated icons in this `public/` directory
4. Ensure they are named exactly as specified above

## Temporary Solution

For development, you can use a simple colored square:
```bash
# Install ImageMagick if needed
convert -size 192x192 xc:#10b981 icon-192x192.png
convert -size 512x512 xc:#10b981 icon-512x512.png
```

Or use any PNG image and resize it to the required dimensions.
