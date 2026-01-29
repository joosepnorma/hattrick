import http.server
import socketserver
import webbrowser
import os
import sys

# Define the port
PORT = 8000
# Serve from the parent directory (project root) to make "../" links work if they point to other sibling folders
# and to allow access to both "Training planner" and "Simulator tool"
DIRECTORY = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving Hattrick Tools at http://localhost:{PORT}")
            print(f"Server directory: {DIRECTORY}")
            print("Press Ctrl+C to stop the server.")
            
            # Open the training planner in the default browser
            # Adjusted path to include beta/training since root is now project root
            url = f"http://localhost:{PORT}/beta/training/hg_planner.html"
            print(f"Opening {url}...")
            webbrowser.open(url)
            
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048: # Address already in use
            print(f"Port {PORT} is already in use. Please try a different port.")
        else:
            raise

if __name__ == "__main__":
    start_server()
