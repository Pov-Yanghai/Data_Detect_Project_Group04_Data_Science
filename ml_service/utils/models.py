import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from typing import Dict, Any, List, Tuple


def prepare_features(df: pd.DataFrame, feature_columns: List[str], target_column: str) -> Tuple[pd.DataFrame, pd.Series]:
    """Prepare features and target for training — handles numeric-as-string columns correctly"""
    X = df[feature_columns].copy()
    y = df[target_column].copy()

    # Step 1 — strip whitespace from all string columns first
    for col in X.columns:
        if X[col].dtype == object:
            X[col] = X[col].astype(str).str.strip()
    if y.dtype == object:
        y = y.astype(str).str.strip()

    # Step 2 — for each feature column, try numeric conversion first
    # Only use LabelEncoder if the column is truly categorical (not numbers stored as strings)
    for col in X.columns:
        converted = pd.to_numeric(X[col], errors='coerce')
        non_null_original = X[col].notna().sum()
        non_null_converted = converted.notna().sum()

        # If ≥80% converted successfully → treat as numeric
        if non_null_original == 0 or (non_null_converted / non_null_original) >= 0.8:
            X[col] = converted
        else:
            # Truly categorical — safe to label encode
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))

    # Step 3 — convert target the same way
    y_converted = pd.to_numeric(y, errors='coerce')
    non_null_y = y.notna().sum()
    non_null_y_converted = y_converted.notna().sum()

    if non_null_y == 0 or (non_null_y_converted / non_null_y) >= 0.8:
        y = y_converted
    else:
        le = LabelEncoder()
        y = pd.Series(le.fit_transform(y.astype(str)), index=y.index)

    # Step 4 — drop remaining NaN rows after conversion
    valid_idx = X.notna().all(axis=1) & y.notna()
    dropped = (~valid_idx).sum()
    X = X[valid_idx]
    y = y[valid_idx]

    if dropped > 0:
        print(f"Warning: dropped {int(dropped)} rows due to unconvertible/missing values")

    if len(X) < 10:
        raise ValueError(
            f"Only {len(X)} valid rows remain after cleaning. "
            "Check that your columns contain valid numeric data."
        )

    return X, y


def train_model(df: pd.DataFrame, model_type: str, feature_columns: List[str], target_column: str) -> Dict[str, Any]:
    """Train an ML model"""

    X, y = prepare_features(df, feature_columns, target_column)

    if len(X) < 10:
        raise ValueError(f"Not enough valid data to train (got {len(X)} rows, need at least 10)")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Only scale for models that actually need it
    if model_type in ['linear_regression', 'svm']:
        scaler = StandardScaler()
        X_train_final = scaler.fit_transform(X_train)
        X_test_final = scaler.transform(X_test)
    else:
        # Random Forest — no scaling needed, use raw values
        X_train_final = X_train.values
        X_test_final = X_test.values

    # Select and configure model
    if model_type == 'linear_regression':
        model = LinearRegression()

    elif model_type == 'random_forest':
        model = RandomForestRegressor(
            n_estimators=300,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1
        )

    elif model_type == 'svm':
        model = SVR(kernel='rbf', C=10, gamma='scale', cache_size=500)

    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # Train
    model.fit(X_train_final, y_train)

    # Predictions
    y_pred_train = model.predict(X_train_final)
    y_pred_test = model.predict(X_test_final)

    # Feature importance (Random Forest only)
    feature_importance = None
    if hasattr(model, 'feature_importances_'):
        feature_importance = dict(sorted(
            {f: float(i) for f, i in zip(feature_columns, model.feature_importances_)}.items(),
            key=lambda x: x[1], reverse=True
        ))

    # Metrics
    train_mse = mean_squared_error(y_train, y_pred_train)
    test_mse = mean_squared_error(y_test, y_pred_test)

    # Fixed error percentage — divide by range of target, not by actual value
    # This prevents 800%+ errors on small actual values
    y_range = float(y_test.max() - y_test.min())
    if y_range == 0:
        y_range = 1.0

    predictions = [
        {
            'actual':           float(actual),
            'predicted':        float(pred),
            'error':            float(actual - pred),
            'error_percentage': float(abs(actual - pred) / y_range * 100)
        }
        for actual, pred in zip(y_test.values, y_pred_test)
    ]

    return {
        'model_type':       model_type,
        'training_samples': len(X_train),
        'test_samples':     len(X_test),
        'metrics': {
            'train': {
                'mse':  float(train_mse),
                'rmse': float(np.sqrt(train_mse)),
                'mae':  float(mean_absolute_error(y_train, y_pred_train)),
                'r2':   float(r2_score(y_train, y_pred_train))
            },
            'test': {
                'mse':  float(test_mse),
                'rmse': float(np.sqrt(test_mse)),
                'mae':  float(mean_absolute_error(y_test, y_pred_test)),
                'r2':   float(r2_score(y_test, y_pred_test))
            }
        },
        'predictions':        predictions[:20],
        'feature_importance': feature_importance
    }