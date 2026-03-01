from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import os

from utils.data_processing import (
    get_data_summary,
    analyze_missing_values,
    detect_outliers,
    analyze_distribution
)

router = APIRouter()


class AnalyzeRequest(BaseModel):
    filepath: str
    analysisType: str = 'full'


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """Analyze uploaded data and return statistical insights"""
    try:
        # Read file from disk — same pattern as clean.py and train.py
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")

        ext = os.path.splitext(request.filepath)[1].lower()
        if ext == '.csv':
            df = pd.read_csv(request.filepath)
        elif ext in ('.xlsx', '.xls'):
            df = pd.read_excel(request.filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel are allowed.")

        # Get summary statistics
        summary = get_data_summary(df)

        # Analyze missing values
        missing_values = analyze_missing_values(df)

        # Detect outliers (both IQR and Z-Score)
        outliers_iqr = detect_outliers(df, method='iqr')
        outliers_zscore = detect_outliers(df, method='zscore')

        # Analyze distribution
        distributions = analyze_distribution(df)

        # Return directly — no wrapper object
        return {
            'summary': summary,
            'missing_values': missing_values,
            'outliers': {
                'iqr': outliers_iqr,
                'zscore': outliers_zscore
            },
            'distributions': distributions,
            'recommendations': generate_recommendations(summary, missing_values, outliers_iqr)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_recommendations(summary: Dict, missing_values: Dict, outliers: Dict) -> List[str]:
    """Generate data quality recommendations"""
    recommendations = []

    # Missing values recommendations
    if missing_values['total_missing'] > 0:
        total_cells = missing_values['total_cells']
        if total_cells > 0:
            missing_pct = (missing_values['total_missing'] / total_cells) * 100
            if missing_pct > 30:
                recommendations.append("High missing data detected. Consider dropping columns or using advanced imputation methods.")
            elif missing_pct > 10:
                recommendations.append("Moderate missing data detected. Consider mean/median imputation for numeric columns.")
            else:
                recommendations.append("Low missing data detected. Simple imputation (mean/median) should work well.")

    # Duplicates recommendations
    if summary['duplicates'] > 0:
        dup_pct = summary['duplicate_percentage']
        if dup_pct > 5:
            recommendations.append(f"Found {summary['duplicates']} duplicate rows ({dup_pct:.1f}%). Consider removing them before training.")
        else:
            recommendations.append(f"Found {summary['duplicates']} duplicate rows ({dup_pct:.1f}%). Minor impact but consider removing.")

    # Outliers recommendations
    numeric_col_count = len([
        c for c, t in summary['column_types'].items()
        if 'float' in t or 'int' in t
    ])
    if outliers['total_outliers'] > 0 and numeric_col_count > 0:
        outlier_pct = (outliers['total_outliers'] / (summary['rows'] * numeric_col_count)) * 100
        if outlier_pct > 5:
            recommendations.append(f"Significant outliers detected ({outlier_pct:.1f}%). Review and handle them before modeling.")

    # All columns object type warning
    object_cols = [c for c, t in summary['column_types'].items() if t == 'object']
    numeric_cols = [c for c, t in summary['column_types'].items() if 'float' in t or 'int' in t]
    if len(object_cols) > len(numeric_cols) and len(numeric_cols) == 0:
        recommendations.append(
            "Warning: All columns are detected as text (object) type. "
            "Numeric columns may need type conversion before modeling. "
            "Check your CSV for formatting issues like trailing spaces or mixed types."
        )

    if not recommendations:
        recommendations.append("Data quality looks good! Ready for analysis and modeling.")

    return recommendations