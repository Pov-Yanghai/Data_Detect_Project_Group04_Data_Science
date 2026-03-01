from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import os

router = APIRouter()


class CleanRequest(BaseModel):
    filepath: str
    cleaningMethod: str
    columns: Optional[List[str]] = None


def calculate_quality_report(df_before: pd.DataFrame, df_after: pd.DataFrame) -> Dict[str, Any]:
    """Calculate cleaning quality metrics comparing before and after"""

    # 1. Completeness
    missing_before    = int(df_before.isnull().sum().sum())
    missing_after     = int(df_after.isnull().sum().sum())
    completeness_score = round(
        (1 - missing_after / max(missing_before, 1)) * 100, 1
    ) if missing_before > 0 else 100.0

    # 2. Row retention
    rows_before   = len(df_before)
    rows_after    = len(df_after)
    rows_removed  = rows_before - rows_after
    retention_pct = round((rows_after / max(rows_before, 1)) * 100, 1)

    # 3. Consistency — mean/std shift per numeric column
    numeric_cols       = df_before.select_dtypes(include=[np.number]).columns.tolist()
    consistency_checks = []
    overall_consistent = True

    for col in numeric_cols:
        if col not in df_after.columns:
            continue

        mean_before = df_before[col].mean()
        mean_after  = df_after[col].mean()
        std_before  = df_before[col].std()
        std_after   = df_after[col].std()

        mean_shift = abs(mean_after - mean_before) / max(abs(mean_before), 0.001) * 100
        std_shift  = abs(std_after  - std_before)  / max(abs(std_before),  0.001) * 100

        status = 'good'
        if mean_shift > 10 or std_shift > 15:
            status = 'warning'
            overall_consistent = False
        elif mean_shift > 5 or std_shift > 10:
            status = 'caution'

        consistency_checks.append({
            'column':      col,
            'mean_before': round(float(mean_before), 4),
            'mean_after':  round(float(mean_after),  4),
            'mean_shift':  round(float(mean_shift),  2),
            'std_before':  round(float(std_before),  4),
            'std_after':   round(float(std_after),   4),
            'std_shift':   round(float(std_shift),   2),
            'status':      status,
        })

    # 4. Duplicate check
    dups_before = int(df_before.duplicated().sum())
    dups_after  = int(df_after.duplicated().sum())

    # 5. Per-column missing summary
    column_summary = []
    for col in df_before.columns:
        before_missing = int(df_before[col].isnull().sum())
        after_missing  = int(df_after[col].isnull().sum())
        if before_missing > 0:
            column_summary.append({
                'column':         col,
                'missing_before': before_missing,
                'missing_after':  after_missing,
                'fixed':          before_missing - after_missing,
                'pct_before':     round(before_missing / rows_before * 100, 1),
                'pct_after':      round(after_missing  / max(rows_after, 1) * 100, 1),
            })

    # 6. Overall quality score (weighted)
    consistency_score = 100.0 if overall_consistent else max(
        0, 100 - len([c for c in consistency_checks if c['status'] != 'good']) * 10
    )
    overall_score = round(
        completeness_score * 0.4 +
        min(retention_pct, 100) * 0.3 +
        consistency_score * 0.3,
        1
    )

    # 7. Recommendations
    recommendations = []
    if completeness_score < 100:
        recommendations.append(f"{missing_after} missing values remain — consider applying another method.")
    if retention_pct < 80:
        recommendations.append(f"Only {retention_pct}% of rows retained — consider fill methods instead of dropping rows.")
    if not overall_consistent:
        bad_cols = [c['column'] for c in consistency_checks if c['status'] == 'warning']
        recommendations.append(f"Distribution shifted significantly in: {', '.join(bad_cols)}. Try median fill instead.")
    if dups_after > 0:
        recommendations.append(f"{dups_after} duplicate rows still exist — consider running 'Drop Duplicates'.")
    if not recommendations:
        recommendations.append("Cleaning looks great! Data quality is high.")

    return {
        'overall_score':      overall_score,
        'completeness_score': completeness_score,
        'consistency_score':  round(consistency_score, 1),
        'retention_pct':      retention_pct,
        'missing_before':     missing_before,
        'missing_after':      missing_after,
        'rows_before':        rows_before,
        'rows_after':         rows_after,
        'rows_removed':       rows_removed,
        'dups_before':        dups_before,
        'dups_after':         dups_after,
        'consistency_checks': consistency_checks,
        'column_summary':     column_summary,
        'recommendations':    recommendations,
        'overall_consistent': overall_consistent,
    }


@router.post("/clean")
async def clean_data(request: CleanRequest):
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")

        ext = os.path.splitext(request.filepath)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(request.filepath)
        elif ext in ('.xlsx', '.xls'):
            df = pd.read_excel(request.filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        df_before     = df.copy()
        original_rows = len(df)
        df_cleaned    = df.copy()
        target_cols   = request.columns if request.columns else None

        if request.cleaningMethod == 'drop_missing':
            df_cleaned   = df_cleaned.dropna(subset=target_cols) if target_cols else df_cleaned.dropna()
            removed_rows = original_rows - len(df_cleaned)
            summary      = f"Dropped {removed_rows} rows with missing values"

        elif request.cleaningMethod == 'fill_mean':
            cols = target_cols or list(df_cleaned.select_dtypes(include=[np.number]).columns)
            for col in cols:
                if col in df_cleaned.columns and pd.api.types.is_numeric_dtype(df_cleaned[col]):
                    df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].mean())
            removed_rows = 0
            summary = f"Filled missing values with mean"

        elif request.cleaningMethod == 'fill_median':
            cols = target_cols or list(df_cleaned.select_dtypes(include=[np.number]).columns)
            for col in cols:
                if col in df_cleaned.columns and pd.api.types.is_numeric_dtype(df_cleaned[col]):
                    df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].median())
            removed_rows = 0
            summary = f"Filled missing values with median"

        elif request.cleaningMethod == 'fill_mode':
            cols = target_cols or list(df_cleaned.columns)
            for col in cols:
                if col in df_cleaned.columns and df_cleaned[col].isnull().any():
                    mode_val = df_cleaned[col].mode()
                    if len(mode_val) > 0:
                        df_cleaned[col] = df_cleaned[col].fillna(mode_val[0])
            removed_rows = 0
            summary = f"Filled missing values with mode"

        elif request.cleaningMethod == 'forward_fill':
            cols = target_cols or list(df_cleaned.columns)
            for col in cols:
                if col in df_cleaned.columns:
                    df_cleaned[col] = df_cleaned[col].ffill().bfill()
            removed_rows = 0
            summary = f"Applied forward/backward fill"

        elif request.cleaningMethod == 'drop_duplicates':
            df_cleaned   = df_cleaned.drop_duplicates()
            removed_rows = original_rows - len(df_cleaned)
            summary      = f"Removed {removed_rows} duplicate rows"

        elif request.cleaningMethod == 'interpolate':
            cols = target_cols or list(df_cleaned.select_dtypes(include=[np.number]).columns)
            for col in cols:
                if col in df_cleaned.columns and pd.api.types.is_numeric_dtype(df_cleaned[col]):
                    df_cleaned[col] = df_cleaned[col].interpolate(method='linear')
            removed_rows = 0
            summary = f"Interpolated missing values"

        else:
            raise HTTPException(status_code=400, detail=f"Unknown cleaning method: {request.cleaningMethod}")

        # Save cleaned file
        if ext == '.csv':
            df_cleaned.to_csv(request.filepath, index=False)
        elif ext in ('.xlsx', '.xls'):
            df_cleaned.to_excel(request.filepath, index=False)

        # Calculate quality report
        quality_report = calculate_quality_report(df_before, df_cleaned)

        return {
            'success':      True,
            'summary':      summary,
            'originalRows': original_rows,
            'cleanedRows':  len(df_cleaned),
            'removedRows':  removed_rows,
            'method':       request.cleaningMethod,
            'filepath':     request.filepath,
            'quality':      quality_report,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download")
async def download_cleaned_file(filepath: str):
    try:
        if not filepath:
            raise HTTPException(status_code=400, detail="filepath query param is required")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")

        ext           = os.path.splitext(filepath)[1].lower()
        original_name = os.path.basename(filepath)
        download_name = f"cleaned_{original_name}"
        media_type    = (
            'text/csv' if ext == '.csv'
            else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        return FileResponse(path=filepath, media_type=media_type, filename=download_name)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))