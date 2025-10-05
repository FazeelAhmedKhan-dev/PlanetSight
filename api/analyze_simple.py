import json
import os
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
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

            # Return a mock prediction for testing
            result = {
                'prediction': 'CANDIDATE',
                'confidence': 0.75,
                'probabilities': {
                    'false_positive': 0.15,
                    'candidate': 0.75,
                    'confirmed': 0.10
                },
                'note': 'This is a test response - model loading disabled'
            }
            
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
                'error': 'Internal server error',
                'details': str(e)
            }
            self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()