#!/bin/bash

# Example script showing how to update car images via API
# Make sure your server is running on http://localhost:3000
# Make sure you're logged in and have a valid JWT token

# Example: Update Camaro with images
# Replace YOUR_JWT_TOKEN with your actual token from localStorage or login response

CAR_SLUG="camaro"
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

curl -X PUT "http://localhost:3000/api/cars/${CAR_SLUG}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "images": {
      "hero": "/images/cars/camaro-hero.jpg",
      "gallery": [
        "/images/cars/camaro-1.jpg",
        "/images/cars/camaro-2.jpg",
        "/images/cars/camaro-3.jpg"
      ],
      "trims": {
        "SS": "/images/cars/camaro-ss.jpg",
        "ZL1": "/images/cars/camaro-zl1.jpg"
      }
    }
  }'

echo ""
echo "✅ Image paths updated for ${CAR_SLUG}!"
echo "📝 Make sure the image files exist in packages/app/public/images/cars/"

