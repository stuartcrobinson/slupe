#!/bin/bash
# build.sh - Build script for Slupe

set -e  # Exit on error

echo "🚀 Building Slupe..."

# Clean previous builds
echo "📦 Cleaning previous builds..."
rm -rf dist/
rm -f slupe-*.tgz

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Add shebang to the entry point
echo "✏️  Adding shebang..."
echo '#!/usr/bin/env node' | cat - dist/src/index.js > temp && mv temp dist/src/index.js
chmod +x dist/src/index.js

# Create package
echo "📦 Creating package..."
npm pack

# Get the package name
PACKAGE_FILE=$(ls slupe-*.tgz | head -n 1)

echo "✅ Build complete! Package created: $PACKAGE_FILE"
echo ""
echo "To install locally:"
echo "  npm install -g ./$PACKAGE_FILE"
echo ""
echo "To publish to npm:"
echo "  npm publish"