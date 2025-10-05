import json
import os
import sys
import warnings
from http.server import BaseHTTPRequestHandler

# Suppress sklearn warnings
warnings.filterwarnings('ignore')

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Global variables to cache the model
_model = None
_feature_medians = None
_model_loaded = False

def load_model():
    """Load the model and feature medians"""
    global _model, _feature_medians, _model_loaded
    
    if _model_loaded:
        return _model is not None
    
    try:
        import joblib
        import pandas as pd
        
        # Try to find model files
        model_path = os.path.join(current_dir, "planetfall_model.pkl")
        median_path = os.path.join(current_dir, "feature_medians.pkl")
        
        if os.path.exists(model_path) and os.path.exists(median_path):
            _model = joblib.load(model_path)
            _feature_medians = joblib.load(median_path)
            _model_loaded = True
            return True
        else:
            _model_loaded = True
            return False
            
    except Exception as e:
        print(f"Error loading model: {e}")
        _model_loaded = True
        return False

def predict_planet_status(koi_prad, koi_teq, koi_depth, koi_duration):
    """Make a prediction using the loaded model"""
    if not load_model() or _model is None:
        # Return a fallback prediction
        return {
            'prediction': 'CANDIDATE',
            'confidence': 0.5,
            'probabilities': {
                'false_positive': 0.33,
                'candidate': 0.34,
                'confirmed': 0.33
            },
            'note': 'Using fallback prediction - model not available'
        }
    
    try:
        import pandas as pd
        import numpy as np
        
        # User provided data
        user_data = {
            "koi_prad": koi_prad,
            "koi_teq": koi_teq,
            "koi_depth": koi_depth,
            "koi_duration": koi_duration
        }
        
        # Get all expected columns from feature medians
        expected_cols = list(_feature_medians.keys())
        
        # Fill missing features with medians
        full_input = {col: user_data.get(col, _feature_medians[col]) for col in expected_cols}
        
        # Create DataFrame for prediction
        input_data = pd.DataFrame([full_input])
        
        # Make prediction
        prediction = _model.predict(input_data)[0]
        probabilities = _model.predict_proba(input_data)[0]
        
        # Get class names (assuming they are in order: FALSE POSITIVE, CANDIDATE, CONFIRMED)
        class_names = ['FALSE POSITIVE', 'CANDIDATE', 'CONFIRMED']
        
        # Create probability dictionary
        prob_dict = {
            'false_positive': float(probabilities[0]),
            'candidate': float(probabilities[1]),
            'confirmed': float(probabilities[2])
        }
        
        # Get the predicted class name
        predicted_class = class_names[prediction]
        
        # Calculate confidence as the maximum probability
        confidence = float(max(probabilities))
        
        return {
            'prediction': predicted_class,
            'confidence': confidence,
            'probabilities': prob_dict
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return {
            'prediction': 'CANDIDATE',
            'confidence': 0.5,
            'probabilities': {
                'false_positive': 0.33,
                'candidate': 0.34,
                'confirmed': 0.33
            },
            'error': str(e)
        }

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
            if not all([koi_prad is not None, koi_teq is not None, koi_depth is not None, koi_duration is not None]):
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