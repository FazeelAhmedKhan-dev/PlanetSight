import json
import os
import sys
import warnings
from http.server import BaseHTTPRequestHandler
import urllib.parse

# Suppress sklearn warnings
warnings.filterwarnings('ignore')

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from model_implementation import predict_planet_status
except ImportError as e:
    print(f"Import error: {e}")
    predict_planet_status = None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Check if model is available
            if predict_planet_status is None:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    'error': 'Model not available',
                    'details': 'Could not import model_implementation'
                }
                self.wfile.write(json.dumps(response).encode())
                return

            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            
            # Read the request body
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'error': 'Invalid JSON in request body'}
                self.wfile.write(json.dumps(response).encode())
                return

            # Extract parameters
            koi_prad = data.get('koi_prad')
            koi_teq = data.get('koi_teq')
            koi_depth = data.get('koi_depth')
            koi_duration = data.get('koi_duration')

            # Validate input parameters
            if not all([koi_prad, koi_teq, koi_depth, koi_duration]):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'error': 'All parameters are required: koi_prad, koi_teq, koi_depth, koi_duration'}
                self.wfile.write(json.dumps(response).encode())
                return

            # Validate that all inputs are numbers
            try:
                koi_prad = float(koi_prad)
                koi_teq = float(koi_teq)
                koi_depth = float(koi_depth)
                koi_duration = float(koi_duration)
            except (ValueError, TypeError):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'error': 'All parameters must be valid numbers'}
                self.wfile.write(json.dumps(response).encode())
                return

            # Make prediction
            try:
                result = predict_planet_status(koi_prad, koi_teq, koi_depth, koi_duration)
                
                # Send successful response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    'error': 'Model execution failed',
                    'details': str(e)
                }
                self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                'error': 'Internal server error',
                'details': str(e)
            }
            self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()