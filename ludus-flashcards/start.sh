#!/bin/bash

echo "🚀 Starting Ludus development server..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Kill any existing servers on port 3000
echo "🧹 Stopping any existing servers..."
pkill -f "python.*http.server.*3000" 2>/dev/null || true
sleep 1

# Build the latest version
echo "📦 Building latest version..."
npm run build

# Start the server
echo "🌐 Starting server on port 3000..."
cd build
python3 -m http.server 3000 &

# Wait for server to start
sleep 2

echo ""
echo "✅ Server is running!"
echo "🌐 Open in your browser:"
echo "   http://localhost:3000/"
echo ""
echo "🔄 This server is fully refreshable!"
echo "🛑 To stop the server, run: pkill -f 'python.*http.server'"
echo ""