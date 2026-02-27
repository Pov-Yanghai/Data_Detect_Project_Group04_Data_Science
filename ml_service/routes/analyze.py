from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd

from utils.data_processing import (
    get_data_summary,
    analyze_missing_values,
    detect_outliers,
    analyze_distribution
)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]
    analysisType: str = 'full'

@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """Analyze uploaded data and return statistical insights"""
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(request.data)
        
        # Get summary statistics
        summary = get_data_summary(df)
        
        # Analyze missing values
        missing_values = analyze_missing_values(df)
        
        # Detect outliers (both IQR and Z-Score)
        outliers_iqr = detect_outliers(df, method='iqr')
        outliers_zscore = detect_outliers(df, method='zscore')
        
        # Analyze distribution
        distributions = analyze_distribution(df)
        
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_recommendations(summary: Dict, missing_values: Dict, outliers: Dict) -> List[str]:
    """Generate data quality recommendations"""
    recommendations = []
    
    # Missing values recommendations
    if missing_values['total_missing'] > 0:
        missing_pct = (missing_values['total_missing'] / summary['rows'] / summary['columns']) * 100
        if missing_pct > 30:
            recommendations.append("High missing data detected. Consider dropping columns or using advanced imputation methods.")
        elif missing_pct > 10:
            recommendations.append("Moderate missing data detected. Consider mean/median imputation for numeric columns.")
    
    # Duplicates recommendations
    if summary['duplicates'] > 0:
        dup_pct = summary['duplicate_percentage']
        if dup_pct > 5:
            recommendations.append(f"Found {summary['duplicates']} duplicate rows ({dup_pct:.1f}%). Consider removing them.")
    
    # Outliers recommendations
    if outliers['total_outliers'] > 0:
        outlier_pct = (outliers['total_outliers'] / (summary['rows'] * len([c for c in summary['column_types'] if 'float' in summary['column_types'][c] or 'int' in summary['column_types'][c]]))) * 100
        if outlier_pct > 5:
            recommendations.append(f"Significant outliers detected ({outlier_pct:.1f}%). Review and handle them appropriately.")
    
    if not recommendations:
        recommendations.append("Data quality looks good! Ready for analysis and modeling.")
    
    return recommendations
