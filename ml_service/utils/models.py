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
    """Prepare features and target for training"""
    X = df[feature_columns].copy()
    y = df[target_column].copy()

    # Drop rows with missing values
    valid_idx = X.notna().all(axis=1) & y.notna()
    X = X[valid_idx]
    y = y[valid_idx]

    # ✅ Encode non-numeric feature columns automatically
    for col in X.columns:
        if X[col].dtype == object or str(X[col].dtype) == 'category':
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
        else:
            X[col] = pd.to_numeric(X[col], errors='coerce')

    # ✅ Encode target if it's non-numeric (classification-style target)
    if y.dtype == object or str(y.dtype) == 'category':
        le = LabelEncoder()
        y = pd.Series(le.fit_transform(y.astype(str)), index=y.index)
    else:
        y = pd.to_numeric(y, errors='coerce')

    # Drop any remaining NaN values after conversion
    valid_idx = X.notna().all(axis=1) & y.notna()
    X = X[valid_idx]
    y = y[valid_idx]

    return X, y

def train_model(df: pd.DataFrame, model_type: str, feature_columns: List[str], target_column: str) -> Dict[str, Any]:
    """Train an ML model"""

    X, y = prepare_features(df, feature_columns, target_column)

    if len(X) < 10:
        raise ValueError(f"Not enough valid data to train (got {len(X)} rows, need at least 10)")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Select model
    if model_type == 'linear_regression':
        model = LinearRegression()
    elif model_type == 'random_forest':
        model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    elif model_type == 'svm':
        model = SVR(kernel='rbf', C=100, gamma='scale')
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # Train
    model.fit(X_train_scaled, y_train)

    # Feature importance (Random Forest only)
    feature_importance = None
    if hasattr(model, 'feature_importances_'):
        feature_importance = dict(sorted(
            {f: float(i) for f, i in zip(feature_columns, model.feature_importances_)}.items(),
            key=lambda x: x[1], reverse=True
        ))

    # Predictions
    y_pred_train = model.predict(X_train_scaled)
    y_pred_test = model.predict(X_test_scaled)

    # Metrics
    train_mse = mean_squared_error(y_train, y_pred_train)
    test_mse  = mean_squared_error(y_test,  y_pred_test)

    predictions = [
        {
            'actual':          float(actual),
            'predicted':       float(pred),
            'error':           float(actual - pred),
            'error_percentage': float(abs(actual - pred) / max(abs(actual), 0.001) * 100)
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