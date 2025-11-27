/**
 * Favicon Generator Script
 *
 * This script converts your logo image to various favicon formats
 *
 * Usage:
 * 1. Install sharp: npm install sharp
 * 2. Place your logo image in the project root as 'logo.png'
 * 3. Run: node scripts/generate-favicon.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 48, name: "favicon-48x48.png" },
  { size: 64, name: "favicon-64x64.png" },
  { size: 128, name: "favicon-128x128.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 512, name: "android-chrome-512x512.png" },
];

async function generateFavicons() {
  const inputFile = "logo.png"; // Your FarmerFlow logo
  const outputDir = "public";

  if (!fs.existsSync(inputFile)) {
    console.error("❌ Error: logo.png not found in project root");
    console.log(
      'Please save your FarmerFlow logo as "logo.png" in the project root'
    );
    return;
  }

  console.log("🎨 Generating favicons...\n");

  for (const { size, name } of sizes) {
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(path.join(outputDir, name));

      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate ICO file (16x16 and 32x32 combined)
  try {
    await sharp(inputFile)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(path.join(outputDir, "favicon.ico"));

    console.log("✅ Generated favicon.ico");
  } catch (error) {
    console.error("❌ Failed to generate favicon.ico:", error.message);
  }

  console.log("\n✨ Favicon generation complete!");
  console.log("📁 Files saved to public/ directory");
}

generateFavicons().catch(console.error);
