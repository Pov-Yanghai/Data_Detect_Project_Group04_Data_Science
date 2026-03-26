from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
import uuid
import os
import joblib

from utils.models import train_model
from utils.plotting import (
    generate_single_model_graphs,
    generate_comparison_graphs,
    save_plot_data,
    load_plot_data,
)

# Directory where fitted model objects are persisted for /predict calls
_ROUTES_DIR   = os.path.dirname(os.path.abspath(__file__))
_SVC_DIR      = os.path.dirname(_ROUTES_DIR)
ML_MODELS_DIR = os.path.join(_SVC_DIR, 'models')
os.makedirs(ML_MODELS_DIR, exist_ok=True)

router = APIRouter()


class TrainRequest(BaseModel):
    filepath: str
    modelType: str
    features: List[str]
    target: str


class PredictRequest(BaseModel):
    session_id: str
    input_values: Dict[str, float]  # {feature_name: numeric_value}


class CompareRequest(BaseModel):
    """
    Request body for the compare-models endpoint.

    sessions is a list of dicts, each containing:
      { "session_id": str, "model_type": str,
        "metrics": {"test": {"r2": float, "rmse": float, "mae": float}} }
    A unique compare_session_id is generated server-side and returned.
    """
    sessions: List[Dict[str, Any]]


@router.post("/train")
async def train(request: TrainRequest):
    """Train an ML model — reads file directly from disk.

    In addition to the existing metrics and predictions the response now
    includes a 'graphs' object with individual model visualisation filenames
    and a 'session_id' that can be used later in /compare-models.
    """
    try:
        # Validate inputs
        if not request.features or not request.target:
            raise HTTPException(status_code=400, detail="Features and target must be specified")

        if request.target in request.features:
            raise HTTPException(status_code=400, detail="Target variable cannot be in features")

        # Read file from disk
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")

        ext = os.path.splitext(request.filepath)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(request.filepath)
        elif ext in ('.xlsx', '.xls'):
            df = pd.read_excel(request.filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel are allowed.")

        # Warn user if SVM is chosen on large dataset — it will be very slow
        if request.modelType == 'svm' and len(df) > 2000:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"SVM is too slow for datasets with {len(df)} rows (limit: 2,000). "
                    "Please use Random Forest instead — it handles large datasets much better."
                )
            )

        # Verify all required columns exist
        required_cols = request.features + [request.target]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns in dataset: {missing_cols}")

        # Train model — result contains '_plot_data' with all test predictions
        result = train_model(df, request.modelType, request.features, request.target)

        # Extract full test predictions for plotting (not included in API response)
        plot_data = result.pop('_plot_data')

        # Pull out the non-JSON-serialisable model objects before using plot_data
        trained_model   = plot_data.pop('_trained_model')
        trained_scaler  = plot_data.pop('_trained_scaler')
        feature_cols    = plot_data.pop('_feature_columns')

        actuals   = plot_data['actuals']
        preds     = plot_data['predictions']

        # Generate a unique session ID for this training run
        session_id = uuid.uuid4().hex

        # Persist plot data so /compare-models can load it later
        save_plot_data(session_id, request.modelType, actuals, preds)

        # Persist fitted model + scaler for /predict calls
        joblib.dump(
            {
                'model':           trained_model,
                'scaler':          trained_scaler,   # None for Random Forest
                'feature_columns': feature_cols,
                'model_type':      request.modelType,
            },
            os.path.join(ML_MODELS_DIR, f'{session_id}_model.joblib'),
        )

        # Generate per-model graphs (line, scatter, error histogram)
        graphs = generate_single_model_graphs(request.modelType, actuals, preds, session_id)

        # Attach graph filenames and session_id to the response
        result['session_id'] = session_id
        result['graphs']     = graphs

        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare-models")
async def compare_models(request: CompareRequest):
    """
    Generate comparison charts across multiple previously trained models.

    Accepts a list of training sessions (each identified by session_id) and
    produces three comparison graphs:
      • comparison_r2       — bar chart of R² scores
      • comparison_rmse_mae — grouped bar chart of RMSE & MAE
      • comparison_scatter  — combined scatter of actual vs predicted

    Returns a compare_session_id and the graph filenames.
    """
    try:
        if len(request.sessions) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least two trained models are required for comparison."
            )

        model_results = []
        for session in request.sessions:
            sid        = session.get('session_id', '')
            model_type = session.get('model_type', '')
            metrics    = session.get('metrics', {})

            if not sid or not model_type:
                raise HTTPException(
                    status_code=400,
                    detail="Each session must include 'session_id' and 'model_type'."
                )

            # Load full predictions saved during training
            try:
                plot_data = load_plot_data(sid)
            except FileNotFoundError:
                raise HTTPException(
                    status_code=404,
                    detail=f"No training data found for session_id '{sid}'. "
                           "Make sure the model was trained in this server session."
                )

            model_results.append({
                'model_type':  model_type,
                'metrics':     metrics,
                'actuals':     plot_data['actuals'],
                'predictions': plot_data['predictions'],
            })

        compare_session_id = uuid.uuid4().hex
        graphs = generate_comparison_graphs(model_results, compare_session_id)

        return {
            'compare_session_id': compare_session_id,
            'graphs': graphs,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
async def predict_single(request: PredictRequest):
    """
    Run a single prediction using the model trained in a previous /train call.

    Loads the persisted model + scaler from disk (keyed by session_id),
    applies the same preprocessing, and returns a predicted value.
    """
    try:
        model_path = os.path.join(ML_MODELS_DIR, f'{request.session_id}_model.joblib')
        if not os.path.exists(model_path):
            raise HTTPException(
                status_code=404,
                detail="No saved model found for this session. Please re-train the model first.",
            )

        model_data      = joblib.load(model_path)
        model           = model_data['model']
        scaler          = model_data['scaler']
        feature_columns = model_data['feature_columns']

        # Build input row in the exact order the model was trained on
        try:
            input_row = np.array([[float(request.input_values[col]) for col in feature_columns]])
        except KeyError as e:
            raise HTTPException(status_code=400, detail=f"Missing feature value for: {e}")
        except (ValueError, TypeError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid input value: {e}")

        # Apply scaling if the model required it
        if scaler is not None:
            input_row = scaler.transform(input_row)

        predicted_value = float(model.predict(input_row)[0])

        return {
            'predicted_value': predicted_value,
            'feature_columns': feature_columns,
            'input_used':      {col: float(request.input_values.get(col, 0)) for col in feature_columns},
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))