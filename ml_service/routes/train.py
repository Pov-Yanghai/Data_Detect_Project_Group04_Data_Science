from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import os

from utils.models import train_model

router = APIRouter()


class TrainRequest(BaseModel):
    filepath: str
    modelType: str
    features: List[str]
    target: str


@router.post("/train")
async def train(request: TrainRequest):
    """Train an ML model — reads file directly from disk"""
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

        # Train model
        result = train_model(df, request.modelType, request.features, request.target)

        return result

    except HTTPException:
        raise
    except ValueError as e:
        # Catch data validation errors from prepare_features
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))