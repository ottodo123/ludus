#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 3000
DIRECTORY = "build"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def do_GET(self):
        # Handle the /ludus path correctly
        if self.path == '/' or self.path == '/ludus':
            self.path = '/ludus/index.html'
        elif self.path.startswith('/ludus/') and '.' not in os.path.basename(self.path):
            # SPA routing - serve index.html for routes without file extensions
            self.path = '/ludus/index.html'
        elif not self.path.startswith('/ludus/'):
            # Redirect root requests to /ludus
            self.send_response(302)
            self.send_header('Location', '/ludus')
            self.end_headers()
            return
        
        super().do_GET()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    if not os.path.exists(DIRECTORY):
        print(f"❌ Build directory '{DIRECTORY}' not found. Run 'npm run build' first.")
        sys.exit(1)
    
    print(f"🚀 Starting simple HTTP server...")
    print(f"📁 Serving from: {os.path.abspath(DIRECTORY)}")
    print(f"🌐 Server running at:")
    print(f"   http://localhost:{PORT}/ludus")
    print(f"   http://127.0.0.1:{PORT}/ludus")
    print(f"")
    print(f"✅ This server should be refreshable in any browser!")
    print(f"🔄 Press Ctrl+C to stop")
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n👋 Server stopped")