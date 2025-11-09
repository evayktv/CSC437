#!/bin/bash
# Deployment script for evcao.csse.dev

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /home/evcao/CSC437

# Clean up any unstaged changes in dist (these are generated files)
echo "📦 Cleaning up dist files..."
git restore packages/proto/dist/ 2>/dev/null || true
git clean -fd packages/proto/dist/assets/ 2>/dev/null || true

# Pull latest code
echo "⬇️  Pulling latest code..."
git pull --rebase

# Rebuild frontend
echo "🔨 Building frontend..."
cd packages/proto
npm run build
cd ../..

# Install any new dependencies
echo "📥 Installing dependencies..."
npm install
cd packages/server
npm install
cd ../..

# Stop existing server
echo "🛑 Stopping existing server..."
pkill -f "node.*dist/index.js" || pkill -f "nodemon" || true
sleep 2

# Start server
echo "▶️  Starting server..."
cd packages/server
nohup npm start > ../../nohup.out 2>&1 &

# Wait a moment for server to start
sleep 3

# Check if server is running
if ps aux | grep -q "[n]ode.*dist/index.js"; then
    echo "✅ Server is running!"
    echo "📋 Check logs with: tail -f /home/evcao/CSC437/nohup.out"
else
    echo "❌ Server failed to start. Check logs:"
    tail -20 /home/evcao/CSC437/nohup.out
    exit 1
fi

echo "✅ Deployment complete!"

