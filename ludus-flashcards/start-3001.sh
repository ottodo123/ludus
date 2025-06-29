#!/bin/bash

echo "🚀 Starting Ludus development server on PORT 3001..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Kill any existing servers on port 3001
echo "🧹 Stopping any existing servers on port 3001..."
pkill -f "python.*http.server.*3001" 2>/dev/null || true
sleep 1

# Build the latest version
echo "📦 Building latest version..."
npm run build

# Start the server
echo "🌐 Starting server on port 3001..."
cd build
python3 -m http.server 3001 &

# Wait for server to start
sleep 2

echo ""
echo "✅ Server is running on PORT 3001!"
echo "🌐 Open in your browser:"
echo "   http://localhost:3001/"
echo ""
echo "🔄 This server is fully refreshable!"
echo "🛑 To stop the server, run: lsof -ti:3001 | xargs kill -9"
echo ""
echo "📝 This terminal is now using PORT 3001"
echo "📝 You can run another Claude Code terminal on PORT 3000"