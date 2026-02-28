from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import os

router = APIRouter()

class CleanRequest(BaseModel):
    filepath: str
    cleaningMethod: str

@router.post("/clean")
async def clean_data(request: CleanRequest):
    """Apply data cleaning operations — reads file directly from disk"""
    try:
        # ✅ Read file from disk (avoids sending huge JSON payloads over HTTP)
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")

        ext = os.path.splitext(request.filepath)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(request.filepath)
        elif ext in ('.xlsx', '.xls'):
            df = pd.read_excel(request.filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel are allowed.")

        original_rows = len(df)

        if request.cleaningMethod == 'drop_missing':
            df_cleaned = df.dropna()
            removed_rows = original_rows - len(df_cleaned)
            summary = f"Dropped {removed_rows} rows with missing values"

        elif request.cleaningMethod == 'fill_mean':
            df_cleaned = df.copy()
            numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].mean())
            removed_rows = 0
            summary = "Filled numeric missing values with mean"

        elif request.cleaningMethod == 'fill_median':
            df_cleaned = df.copy()
            numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].median())
            removed_rows = 0
            summary = "Filled numeric missing values with median"

        elif request.cleaningMethod == 'fill_mode':
            df_cleaned = df.copy()
            for col in df_cleaned.columns:
                if df_cleaned[col].isnull().any():
                    mode_val = df_cleaned[col].mode()
                    if len(mode_val) > 0:
                        df_cleaned[col] = df_cleaned[col].fillna(mode_val[0])
            removed_rows = 0
            summary = "Filled missing values with mode"

        elif request.cleaningMethod == 'forward_fill':
            df_cleaned = df.copy()
            df_cleaned = df_cleaned.ffill().bfill()
            removed_rows = 0
            summary = "Applied forward/backward fill for missing values"

        elif request.cleaningMethod == 'drop_duplicates':
            df_cleaned = df.drop_duplicates()
            removed_rows = original_rows - len(df_cleaned)
            summary = f"Removed {removed_rows} duplicate rows"

        elif request.cleaningMethod == 'interpolate':
            df_cleaned = df.copy()
            numeric_cols = df_cleaned.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                df_cleaned[col] = df_cleaned[col].interpolate(method='linear')
            removed_rows = 0
            summary = "Interpolated missing numeric values"

        else:
            raise HTTPException(status_code=400, detail=f"Unknown cleaning method: {request.cleaningMethod}")

        #Return only summary stats — not the full data (avoids huge response payloads)
        return {
            'success': True,
            'summary': summary,
            'originalRows': original_rows,
            'cleanedRows': len(df_cleaned),
            'removedRows': removed_rows,
            'method': request.cleaningMethod
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))