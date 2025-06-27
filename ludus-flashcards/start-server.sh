#!/bin/bash

echo "🚀 Starting Ludus development server..."

# Kill any existing servers on port 3000
echo "🧹 Cleaning up existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Build the app
echo "📦 Building production version..."
npm run build

# Start a simple HTTP server using Python
echo "🌐 Starting HTTP server on port 3000..."
cd build
python3 -m http.server 3000 &

# Wait a moment for server to start
sleep 2

echo ""
echo "✅ Server is running!"
echo "🌐 Access your app at:"
echo "   http://localhost:3000/ludus"
echo "   http://127.0.0.1:3000/ludus"
echo ""
echo "🔄 This server should be refreshable in any browser!"
echo "🛑 To stop: run 'killall python3' or close this terminal"
echo ""

# Keep the script running
wait