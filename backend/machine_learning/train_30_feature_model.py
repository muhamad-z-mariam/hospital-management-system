"""
Train a readmission prediction model using the 30 lab test features from Patient model.
This script generates synthetic training data for development/demo purposes.
For production, replace with real patient data.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tensorflow import keras
from tensorflow.keras import layers
import joblib

# Set random seed for reproducibility
np.random.seed(42)

# Feature names matching Patient model fields (in same order as views.py)
FEATURE_NAMES = [
    'cholesterol',
    'eosinophil_count',
    'creatinine_enzymatic_method',
    'platelet',
    'total_bile_acid',
    'mean_corpuscular_volume',
    'indirect_bilirubin',
    'creatine_kinase_isoenzyme_to_creatine_kinase',
    'uric_acid',
    'std_dev_red_blood_cell_distribution_width',
    'alkaline_phosphatase',
    'neutrophil_ratio',
    'high_density_lipoprotein_cholesterol',
    'high_sensitivity_troponin',
    'chloride',
    'glomerular_filtration_rate',
    'creatine_kinase_isoenzyme',
    'creatine_kinase',
    'prothrombin_activity',
    'brain_natriuretic_peptide',
    'triglyceride',
    'mean_hemoglobin_concentration',
    'lymphocyte_count',
    'red_blood_cell',
    'glutamic_oxaloacetic_transaminase',
    'nucleotidase',
    'left_ventricular_end_diastolic_diameter_LV',
    'd_dimer',
    'albumin',
    'thrombin_time'
]

def generate_synthetic_data(n_samples=10000):
    """
    Generate synthetic patient data with realistic lab value ranges.
    High-risk patients have abnormal lab values.
    """
    print(f"Generating {n_samples} synthetic patient records...")

    # Normal ranges (mean, std) for each lab test
    # These are approximate medical reference ranges
    normal_ranges = {
        'cholesterol': (180, 30),  # mg/dL
        'eosinophil_count': (200, 100),  # cells/μL
        'creatinine_enzymatic_method': (1.0, 0.3),  # mg/dL
        'platelet': (250000, 50000),  # per μL
        'total_bile_acid': (10, 5),  # μmol/L
        'mean_corpuscular_volume': (90, 5),  # fL
        'indirect_bilirubin': (0.5, 0.2),  # mg/dL
        'creatine_kinase_isoenzyme_to_creatine_kinase': (5, 2),  # %
        'uric_acid': (5.0, 1.5),  # mg/dL
        'std_dev_red_blood_cell_distribution_width': (13, 1.5),  # %
        'alkaline_phosphatase': (70, 20),  # U/L
        'neutrophil_ratio': (60, 10),  # %
        'high_density_lipoprotein_cholesterol': (50, 15),  # mg/dL
        'high_sensitivity_troponin': (5, 10),  # ng/L (skewed, can be high in cardiac issues)
        'chloride': (100, 5),  # mEq/L
        'glomerular_filtration_rate': (90, 20),  # mL/min/1.73m²
        'creatine_kinase_isoenzyme': (10, 8),  # U/L
        'creatine_kinase': (100, 50),  # U/L
        'prothrombin_activity': (100, 15),  # %
        'brain_natriuretic_peptide': (50, 100),  # pg/mL (skewed, high in heart failure)
        'triglyceride': (120, 40),  # mg/dL
        'mean_hemoglobin_concentration': (34, 2),  # g/dL
        'lymphocyte_count': (2000, 800),  # cells/μL
        'red_blood_cell': (4.5, 0.5),  # million cells/μL
        'glutamic_oxaloacetic_transaminase': (25, 10),  # U/L
        'nucleotidase': (10, 5),  # U/L
        'left_ventricular_end_diastolic_diameter_LV': (50, 5),  # mm
        'd_dimer': (200, 150),  # ng/mL (skewed)
        'albumin': (4.0, 0.5),  # g/dL
        'thrombin_time': (15, 3),  # seconds
    }

    data = {}

    # Generate 70% normal patients, 30% high-risk
    n_normal = int(n_samples * 0.7)
    n_high_risk = n_samples - n_normal

    for feature in FEATURE_NAMES:
        mean, std = normal_ranges[feature]

        # Normal patients: values within normal range
        normal_values = np.random.normal(mean, std, n_normal)

        # High-risk patients: shifted values (abnormal)
        # Randomly shift up or down to simulate abnormalities
        risk_shift = np.random.choice([-1, 1]) * std * 1.5
        high_risk_values = np.random.normal(mean + risk_shift, std * 1.3, n_high_risk)

        # Combine and ensure non-negative values
        all_values = np.concatenate([normal_values, high_risk_values])
        all_values = np.maximum(all_values, 0)  # No negative lab values

        data[feature] = all_values

    # Create target variable
    y = np.array([0] * n_normal + [1] * n_high_risk)

    # Shuffle the data
    indices = np.random.permutation(n_samples)
    for feature in FEATURE_NAMES:
        data[feature] = data[feature][indices]
    y = y[indices]

    df = pd.DataFrame(data)

    print(f"Generated data shape: {df.shape}")
    print(f"Readmission distribution: Low risk={np.sum(y==0)}, High risk={np.sum(y==1)}")

    return df, y


def build_model(input_dim):
    """
    Build a neural network for binary classification.
    """
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(1, activation='sigmoid')  # Binary output
    ])

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc')]
    )

    return model


def train_model():
    """
    Main training pipeline.
    """
    print("=" * 60)
    print("Hospital Readmission Model Training (30 Features)")
    print("=" * 60)

    # Generate synthetic data
    X, y = generate_synthetic_data(n_samples=10000)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain set: {X_train.shape}, Test set: {X_test.shape}")

    # Scale features
    print("\nScaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Build model
    print("\nBuilding neural network...")
    model = build_model(input_dim=30)
    model.summary()

    # Train model
    print("\nTraining model...")
    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_test_scaled, y_test),
        epochs=50,
        batch_size=32,
        verbose=1,
        callbacks=[
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            )
        ]
    )

    # Evaluate
    print("\n" + "=" * 60)
    print("Model Evaluation")
    print("=" * 60)
    test_loss, test_acc, test_auc = model.evaluate(X_test_scaled, y_test, verbose=0)
    print(f"Test Accuracy: {test_acc:.4f}")
    print(f"Test AUC: {test_auc:.4f}")
    print(f"Test Loss: {test_loss:.4f}")

    # Save model and scaler
    print("\nSaving model and scaler...")
    model.save('readmission_model_30_features.keras')
    joblib.dump(scaler, 'scaler_30_features.pkl')

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print("Saved files:")
    print("  - readmission_model_30_features.keras")
    print("  - scaler_30_features.pkl")
    print("\nTo use this model, update ml_model.py to load these new files.")


if __name__ == "__main__":
    train_model()
