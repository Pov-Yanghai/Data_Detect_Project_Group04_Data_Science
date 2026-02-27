# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from typing import List, Dict, Any
# import pandas as pd

# from utils.models import train_model

# router = APIRouter()

# class TrainRequest(BaseModel):
#     data: List[Dict[str, Any]]
#     modelType: str
#     features: List[str]
#     target: str

# @router.post("/train")
# async def train(request: TrainRequest):
#     """Train an ML model on the provided data"""
#     try:
#         # Validate input
#         if not request.features or not request.target:
#             raise HTTPException(status_code=400, detail="Features and target must be specified")
        
#         if request.target in request.features:
#             raise HTTPException(status_code=400, detail="Target variable cannot be in features")
        
#         # Convert data to DataFrame
#         df = pd.DataFrame(request.data)
        
#         # Verify columns exist
#         required_cols = request.features + [request.target]
#         missing_cols = [col for col in required_cols if col not in df.columns]
#         if missing_cols:
#             raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")
        
#         # Train model
#         result = train_model(df, request.modelType, request.features, request.target)
        
#         return result
    
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
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
        # Validate input
        if not request.features or not request.target:
            raise HTTPException(status_code=400, detail="Features and target must be specified")

        if request.target in request.features:
            raise HTTPException(status_code=400, detail="Target variable cannot be in features")

        # ✅ Read file from disk (same pattern as clean.py)
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")

        ext = os.path.splitext(request.filepath)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(request.filepath)
        elif ext in ('.xlsx', '.xls'):
            df = pd.read_excel(request.filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel are allowed.")

        # Verify columns exist
        required_cols = request.features + [request.target]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_cols}")

        # Train model
        result = train_model(df, request.modelType, request.features, request.target)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))