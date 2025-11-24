#!/usr/bin/env node

/**
 * Helper script to update MongoDB car documents with image paths
 *
 * Usage:
 *   node scripts/update-images.js
 *
 * This script will prompt you to enter:
 * 1. Car slug (e.g., "camaro", "mustang", "challenger")
 * 2. Hero image filename (e.g., "camaro-hero.jpg")
 * 3. Gallery image filenames (comma-separated, or press Enter to skip)
 * 4. Trim images (format: "trimName:filename.jpg", comma-separated, or press Enter to skip)
 */

// Note: This is a Node.js script that would need MongoDB connection
// For now, this is a template. You can use MongoDB Compass or the API to update.

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Car Image Path Updater                              ║
╚══════════════════════════════════════════════════════════════╝

This script helps you update MongoDB car documents with image paths.

Image paths should be in the format: /images/cars/{filename}

Example structure:
{
  "images": {
    "hero": "/images/cars/camaro-hero.jpg",
    "gallery": [
      "/images/cars/camaro-1.jpg",
      "/images/cars/camaro-2.jpg"
    ],
    "trims": {
      "SS": "/images/cars/camaro-ss.jpg"
    }
  }
}

To update via API (when server is running):
  PUT /api/cars/:slug
  Body: { "images": { ... } }

Or use MongoDB Compass/Atlas to update directly.
`);
