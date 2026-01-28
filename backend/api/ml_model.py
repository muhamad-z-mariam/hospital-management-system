
import os
import joblib
import numpy as np
from tensorflow import keras

# Paths to model files in machine_learning folder
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # Go up to backend/
MODEL_PATH = os.path.join(BASE_DIR, "machine_learning", "hospital_readmission_70features.keras")
SCALER_PATH = os.path.join(BASE_DIR, "machine_learning", "scaler_70features.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "machine_learning", "top_70_features.pkl")

# Load the Keras model, scaler, and feature list once
model = keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
top_features = joblib.load(FEATURES_PATH)  # List of top 70 feature names

def predict_readmission(patient_data):
    """
    Predict readmission risk for a patient.

    Args:
        patient_data: DataFrame, array, or list with 70 features

    Returns:
        int: 0 (low risk) or 1 (high risk)

    Note:
        Uses a threshold of 0.4 for 86% recall (optimized for catching high-risk patients)
    """
    # If it's a DataFrame, convert to numpy array
    if hasattr(patient_data, "values"):
        patient_data = patient_data.values

    # Ensure input is 2D (1 sample, n features)
    patient_data = np.array(patient_data).reshape(1, -1)

    # Scale the input using the loaded scaler
    patient_data_scaled = scaler.transform(patient_data)

    # Predict using Keras model (returns probability)
    prediction_prob = model.predict(patient_data_scaled, verbose=0)

    # Convert probability to binary classification (0 or 1)
    # Threshold at 0.4 for 86% recall: probability >= 0.4 → high risk (1), else low risk (0)
    prediction = int(prediction_prob[0][0] >= 0.4)

    return prediction


