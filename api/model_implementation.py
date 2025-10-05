import joblib
import pandas as pd
import os

def get_model_paths():
    """Get model file paths, trying multiple possible locations"""
    base_dirs = [
        os.path.dirname(os.path.abspath(__file__)),  # api directory
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'),  # project root
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public'),  # public directory
    ]
    
    for base_dir in base_dirs:
        model_path = os.path.join(base_dir, "exoplanet-ml", "planetfall_model.pkl")
        median_path = os.path.join(base_dir, "exoplanet-ml", "feature_medians.pkl")
        
        if os.path.exists(model_path) and os.path.exists(median_path):
            return model_path, median_path
    
    # If not found, try relative paths
    possible_paths = [
        ("../exoplanet-ml/planetfall_model.pkl", "../exoplanet-ml/feature_medians.pkl"),
        ("./exoplanet-ml/planetfall_model.pkl", "./exoplanet-ml/feature_medians.pkl"),
        ("exoplanet-ml/planetfall_model.pkl", "exoplanet-ml/feature_medians.pkl"),
    ]
    
    for model_path, median_path in possible_paths:
        if os.path.exists(model_path) and os.path.exists(median_path):
            return model_path, median_path
    
    raise FileNotFoundError("Could not find model files")

# Load model and feature medians
try:
    MODEL_PATH, MEDIAN_PATH = get_model_paths()
    model = joblib.load(MODEL_PATH)
    feature_medians = joblib.load(MEDIAN_PATH)
    expected_cols = list(feature_medians.keys())
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    feature_medians = None
    expected_cols = []

def predict_planet_status(koi_prad, koi_teq, koi_depth, koi_duration):
    """
    Predict planet status based on transit parameters
    
    Args:
        koi_prad: Planet radius (Earth radii)
        koi_teq: Equilibrium temperature (Kelvin)
        koi_depth: Transit depth (parts per million)
        koi_duration: Transit duration (hours)
    
    Returns:
        dict: Prediction results with confidence and probabilities
    """
    if model is None or feature_medians is None:
        raise RuntimeError("Model not loaded properly")
    
    user_data = {
        "koi_prad": koi_prad,
        "koi_teq": koi_teq,
        "koi_depth": koi_depth,
        "koi_duration": koi_duration
    }

    # Fill missing features with medians
    full_input = {col: user_data.get(col, feature_medians[col]) for col in expected_cols}

    # Create DataFrame for prediction
    X_new = pd.DataFrame([full_input])
    
    # Make prediction
    prediction = model.predict(X_new)[0]
    probabilities = model.predict_proba(X_new)[0]
    
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