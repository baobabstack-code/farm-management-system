# FarmerFlow Favicon Setup Guide

## Quick Setup (Recommended)

### Option 1: Use Online Favicon Generator

1. **Save your FarmerFlow logo** (the farmer with hat image) as a PNG file
2. **Visit**: https://realfavicongenerator.net/
3. **Upload** your logo image
4. **Download** the generated favicon package
5. **Extract** all files to the `public/` directory
6. **Done!** The favicons will automatically be used

### Option 2: Use the Script (Requires Node.js)

1. **Save your logo** as `logo.png` in the project root
2. **Install Sharp**:
   ```bash
   npm install sharp
   ```
3. **Run the generator**:
   ```bash
   node scripts/generate-favicon.js
   ```
4. **Done!** All favicon sizes will be generated in `public/`

## What Gets Generated

The favicon generator creates these files:

- `favicon.ico` - Classic favicon (32x32)
- `favicon-16x16.png` - Small favicon
- `favicon-32x32.png` - Standard favicon
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `android-chrome-192x192.png` - Android icon
- `android-chrome-512x512.png` - Android high-res icon

## Current Setup

Your app already has:

- ✅ Dynamic icon generation (`src/app/icon.tsx`)
- ✅ Apple icon generation (`src/app/apple-icon.tsx`)
- ✅ Metadata configuration in `src/app/layout.tsx`
- ✅ Manifest file (`public/manifest.json`)

## Manual Setup (If needed)

If you want to manually replace the favicon:

1. Create a 512x512 PNG of your logo with transparent background
2. Save it as `public/favicon.png`
3. Use an online converter to create `public/favicon.ico`
4. Update `public/manifest.json` with your icon paths

## Testing

After adding your favicon:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Visit https://farmerflow.app
3. Check the browser tab - you should see your new favicon
4. Test on mobile by adding to home screen

## Color Scheme

Your FarmerFlow logo uses:

- **Primary Green**: `#0f4c3a` (dark green)
- **Background**: `#f5f1e8` (cream/beige)

These colors are already configured in the dynamic icon generators.
