#!/bin/bash

# Exit immediately if any command fails
set -e

echo "=== Installing dependencies and building Vite Dashboard ==="
npm ci
npm run build

echo "=== Installing dependencies and building Next.js Landing Page ==="
cd landing
npm ci
npm run build
cd ..

echo "=== Merging builds into static distribution ==="
# Create the 'app' directory inside the Next.js static export folder
mkdir -p landing/out/app

# Copy the Vite build output (dist/) into landing/out/app/
cp -R dist/* landing/out/app/

echo "=== Build and merge completed successfully! ==="
