#!/usr/bin/env node

// Script to generate app icons from SVG source for all platforms
// This script requires sharp, resize-icons, and png-to-ico to be installed

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Ensure we have the required dependencies
async function generateIcons() {
  console.log('Generating icons for all platforms...');

  // Destination directories
  const pngDir = path.join(rootDir, 'assets', 'icons', 'png');
  const icnsetDir = path.join(rootDir, 'assets', 'icons', 'mac', 'bibneat-studio.iconset');

  // Generate PNG files in various sizes
  const sizes = [16, 32, 64, 128, 256, 512];
  
  try {
    // Rename files to match required format
    for (const size of sizes) {
      await fs.copyFile(
        path.join(pngDir, `${size*2}x${size*2}.png`),
        path.join(icnsetDir, `icon_${size}x${size}@2x.png`)
      );
      await fs.copyFile(
        path.join(pngDir, `${size}x${size}.png`),
        path.join(icnsetDir, `icon_${size}x${size}.png`)
      );
    }

    // Copy the 512x512 PNG as a base icon for the root
    await fs.copyFile(
      path.join(pngDir, '512x512.png'),
      path.join(rootDir, 'assets', 'icons', 'icon.png')
    );

    console.log('✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons().catch(console.error);
