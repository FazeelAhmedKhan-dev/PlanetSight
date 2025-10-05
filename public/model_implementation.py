import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../exoplanet-ml/planetfall_model.pkl")
MEDIAN_PATH = os.path.join(BASE_DIR, "../exoplanet-ml/feature_medians.pkl")


model = joblib.load(MODEL_PATH)
feature_medians = joblib.load(MEDIAN_PATH)

expected_cols = list(feature_medians.keys())

def predict_planet_status(koi_prad, koi_teq, koi_depth, koi_duration):
    user_data = {
        "koi_prad": koi_prad,
        "koi_teq": koi_teq,
        "koi_depth": koi_depth,
        "koi_duration": koi_duration
    }

    full_input = {col: user_data.get(col, feature_medians[col]) for col in expected_cols}

    X_new = pd.DataFrame([full_input])

    prediction = model.predict(X_new)[0]
    probabilities = model.predict_proba(X_new)[0]

    label_map = {-1: "FALSE POSITIVE", 0: "CANDIDATE", 1: "CONFIRMED"}
    prediction_label = label_map[prediction]
    
    # Get the confidence (highest probability)
    confidence = max(probabilities)
    
    # Map probabilities to labels
    prob_labels = [-1, 0, 1]  # The order of classes in the model
    prob_dict = {
        "false_positive": probabilities[prob_labels.index(-1)],
        "candidate": probabilities[prob_labels.index(0)],
        "confirmed": probabilities[prob_labels.index(1)]
    }
    
    return {
        "prediction": prediction_label,
        "confidence": float(confidence),
        "probabilities": prob_dict
    }

# Example usage (values will come from frontend)
# result = predict_planet_status(koi_prad=1.2, koi_teq=500, koi_depth=200, koi_duration=5)
# print("Prediction:", result)
