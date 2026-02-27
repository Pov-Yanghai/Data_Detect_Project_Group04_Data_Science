import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List

def analyze_missing_values(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze missing values in the dataset"""
    missing_data = {
        'columns': [],
        'missing_count': {},
        'missing_percentage': {},
        'total_cells': len(df) * len(df.columns),
        'total_missing': int(df.isnull().sum().sum())
    }
    
    for column in df.columns:
        missing_count = df[column].isnull().sum()
        missing_pct = (missing_count / len(df)) * 100
        
        if missing_count > 0:
            missing_data['columns'].append(column)
            missing_data['missing_count'][column] = int(missing_count)
            missing_data['missing_percentage'][column] = float(missing_pct)
    
    return missing_data

def detect_outliers(df: pd.DataFrame, method: str = 'iqr') -> Dict[str, Any]:
    """Detect outliers using IQR or Z-Score method"""
    outliers = {
        'method': method,
        'columns': {},
        'total_outliers': 0
    }
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numeric_cols:
        data = df[col].dropna()
        
        if method == 'iqr':
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_mask = (data < lower_bound) | (data > upper_bound)
            outlier_count = outlier_mask.sum()
            
            if outlier_count > 0:
                outliers['columns'][col] = {
                    'count': int(outlier_count),
                    'percentage': float((outlier_count / len(data)) * 100),
                    'lower_bound': float(lower_bound),
                    'upper_bound': float(upper_bound),
                    'method': 'IQR'
                }
        
        elif method == 'zscore':
            z_scores = np.abs(stats.zscore(data))
            outlier_mask = z_scores > 3
            outlier_count = outlier_mask.sum()
            
            if outlier_count > 0:
                outliers['columns'][col] = {
                    'count': int(outlier_count),
                    'percentage': float((outlier_count / len(data)) * 100),
                    'threshold': 3.0,
                    'method': 'Z-Score'
                }
    
    outliers['total_outliers'] = sum(v['count'] for v in outliers['columns'].values())
    return outliers

def analyze_distribution(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze distribution of numeric columns"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    distributions = {}
    
    for col in numeric_cols:
        data = df[col].dropna()
        
        if len(data) > 0:
            skewness = float(stats.skew(data))
            kurtosis = float(stats.kurtosis(data))
            
            # Categorize skewness
            if abs(skewness) < 0.5:
                skew_category = 'Normal'
            elif abs(skewness) < 1:
                skew_category = 'Moderately Skewed'
            else:
                skew_category = 'Highly Skewed'
            
            distributions[col] = {
                'mean': float(data.mean()),
                'median': float(data.median()),
                'std': float(data.std()),
                'min': float(data.min()),
                'max': float(data.max()),
                'skewness': skewness,
                'skew_category': skew_category,
                'kurtosis': kurtosis,
                'count': int(len(data))
            }
    
    return distributions

def get_data_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Get overall data summary"""
    return {
        'rows': len(df),
        'columns': len(df.columns),
        'column_names': list(df.columns),
        'column_types': {col: str(df[col].dtype) for col in df.columns},
        'memory_usage': float(df.memory_usage(deep=True).sum() / 1024 / 1024),  # MB
        'duplicates': int(df.duplicated().sum()),
        'duplicate_percentage': float((df.duplicated().sum() / len(df)) * 100)
    }
