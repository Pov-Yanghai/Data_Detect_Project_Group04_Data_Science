import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List, Optional, Tuple

from sklearn.ensemble import IsolationForest
from sklearn.experimental import enable_iterative_imputer  # noqa: F401 — registers IterativeImputer
from sklearn.impute import SimpleImputer, IterativeImputer
from sklearn.preprocessing import PowerTransformer

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


def detect_outliers_isolation_forest(
    df: pd.DataFrame,
    contamination: float = 0.05,
    random_state: int = 42,
    columns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Multivariate outlier detection on numeric columns. Rows are labeled inlier/outlier;
    unlike IQR/Z-score, this is not a per-column cell count.
    """
    all_numeric = df.select_dtypes(include=[np.number]).columns.tolist()
    if columns:
        numeric_cols = [c for c in columns if c in df.columns and c in all_numeric]
    else:
        numeric_cols = all_numeric
    n_rows = len(df)
    if n_rows < 2 or len(numeric_cols) == 0:
        return {
            'method': 'Isolation Forest',
            'scope': 'multivariate',
            'columns': {},
            'total_outliers': 0,
            'rows_flagged': 0,
            'outlier_fraction': 0.0,
            'n_features_used': len(numeric_cols),
            'contamination': float(contamination),
            'outlier_indices': [],
            'note': 'Need at least 2 rows and 1 numeric column.',
        }

    X = df[numeric_cols].copy()
    imputer = SimpleImputer(strategy='median')
    X_imp = imputer.fit_transform(X)

    contamination = float(np.clip(contamination, 0.001, 0.5))
    iso = IsolationForest(
        contamination=contamination,
        random_state=random_state,
        n_estimators=100,
        n_jobs=-1,
    )
    pred = iso.fit_predict(X_imp)
    outlier_mask = pred == -1
    rows_flagged = int(outlier_mask.sum())
    indices = np.flatnonzero(outlier_mask).astype(int).tolist()[:500]

    return {
        'method': 'Isolation Forest',
        'scope': 'multivariate',
        'columns': {},
        'total_outliers': rows_flagged,
        'rows_flagged': rows_flagged,
        'outlier_fraction': float(rows_flagged / n_rows) if n_rows else 0.0,
        'n_features_used': len(numeric_cols),
        'contamination': contamination,
        'outlier_indices': indices,
        'note': (
            'Flags entire rows as multivariate outliers using all numeric columns. '
            'Counts are not comparable to IQR/Z-score (which count outlying cells per column).'
        ),
    }


def isolation_forest_outlier_mask(
    df: pd.DataFrame,
    contamination: float = 0.05,
    random_state: int = 42,
    columns: Optional[List[str]] = None,
) -> np.ndarray:
    """Boolean mask length len(df): True = row flagged as outlier by Isolation Forest."""
    all_numeric = df.select_dtypes(include=[np.number]).columns.tolist()
    if columns:
        numeric_cols = [
            c for c in columns
            if c in df.columns and c in all_numeric
        ]
    else:
        numeric_cols = all_numeric
    n_rows = len(df)
    if n_rows < 2 or len(numeric_cols) == 0:
        return np.zeros(n_rows, dtype=bool)

    X = df[numeric_cols].copy()
    X_imp = SimpleImputer(strategy='median').fit_transform(X)
    contamination = float(np.clip(contamination, 0.001, 0.5))
    iso = IsolationForest(
        contamination=contamination,
        random_state=random_state,
        n_estimators=100,
        n_jobs=-1,
    )
    pred = iso.fit_predict(X_imp)
    return pred == -1


def compare_outlier_methods(
    outliers_iqr: Dict[str, Any],
    outliers_zscore: Dict[str, Any],
    outliers_if: Dict[str, Any],
) -> Dict[str, Any]:
    return {
        'iqr_total_cell_outliers': int(outliers_iqr.get('total_outliers', 0)),
        'zscore_total_cell_outliers': int(outliers_zscore.get('total_outliers', 0)),
        'isolation_forest_rows_flagged': int(outliers_if.get('rows_flagged', outliers_if.get('total_outliers', 0))),
        'interpretation': (
            'IQR and Z-score sum outlying numeric cells per column (a row can contribute multiple times). '
            'Isolation Forest assigns at most one outlier label per row using all numeric features together.'
        ),
    }


def clean_categorical_strings(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    lowercase: bool = False,
) -> pd.DataFrame:
    """Strip whitespace, normalize internal spaces, map empty strings to NaN for object/string columns."""
    out = df.copy()
    cat_cols = columns if columns is not None else out.select_dtypes(include=['object', 'string']).columns.tolist()
    for col in cat_cols:
        if col not in out.columns:
            continue
        if not (out[col].dtype == object or str(out[col].dtype) == 'string'):
            continue
        s = out[col].astype('string')
        s = s.str.strip()
        if lowercase:
            s = s.str.lower()
        s = s.str.replace(r'\s+', ' ', regex=True)
        s = s.replace('', pd.NA).replace('nan', pd.NA)
        out[col] = s
    return out


def _coerce_numeric_columns(df: pd.DataFrame, cols: List[str]) -> Tuple[pd.DataFrame, List[str]]:
    """Return copy with columns coerced to numeric where possible; list of columns that stayed numeric."""
    out = df.copy()
    numeric_ok: List[str] = []
    for col in cols:
        if col not in out.columns:
            continue
        if pd.api.types.is_numeric_dtype(out[col]):
            numeric_ok.append(col)
            continue
        conv = pd.to_numeric(out[col], errors='coerce')
        if conv.notna().sum() >= max(1, int(0.5 * len(out))):
            out[col] = conv
            numeric_ok.append(col)
    return out, numeric_ok


def model_based_impute_dataframe(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    random_state: int = 42,
    categorical_lowercase: bool = False,
) -> Tuple[pd.DataFrame, str]:
    """
    Impute numeric columns with IterativeImputer (uses other columns); categorical with most frequent.
    """
    work = df.copy()
    subset = [c for c in (columns or list(work.columns)) if c in work.columns]

    obj_in_subset = [
        c for c in subset
        if work[c].dtype == object or str(work[c].dtype) == 'string'
    ]
    work = clean_categorical_strings(
        work, columns=obj_in_subset, lowercase=categorical_lowercase
    )

    work, _ = _coerce_numeric_columns(work, subset)

    num_cols = [c for c in subset if c in work.columns and pd.api.types.is_numeric_dtype(work[c])]
    cat_cols = [
        c for c in subset
        if c in work.columns and (work[c].dtype == object or str(work[c].dtype) == 'string')
    ]

    if num_cols and len(work) >= 2:
        X = work[num_cols].to_numpy(dtype=float)
        if np.isnan(X).any():
            imputer = IterativeImputer(
                random_state=random_state,
                max_iter=10,
                sample_posterior=False,
            )
            X_imp = imputer.fit_transform(X)
            work[num_cols] = X_imp

    for col in cat_cols:
        if work[col].isnull().any():
            mode = work[col].mode()
            fill = mode.iloc[0] if len(mode) else None
            work[col] = work[col].fillna(fill)

    summary = (
        f"Iterative imputation on {len(num_cols)} numeric column(s); "
        f"mode imputation on {len(cat_cols)} categorical column(s)."
    )
    return work, summary


def transform_skewness(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    skew_threshold: float = 1.0,
    min_samples: int = 10,
    method: str = 'yeo-johnson',
) -> Tuple[pd.DataFrame, str]:
    """
    Reduce numeric skewness by applying a power transform to columns whose
    abs(skewness) exceeds `skew_threshold`.

    Uses Yeo-Johnson so it works with non-positive values as well.
    """
    work = df.copy()
    candidates = list(work.columns) if columns is None else [c for c in columns if c in work.columns]

    transformed_cols: List[str] = []
    transformed_details: List[str] = []
    skipped_cols: List[str] = []

    for col in candidates:
        s = work[col]
        data = pd.to_numeric(s, errors='coerce').dropna()
        if len(data) < min_samples:
            skipped_cols.append(col)
            continue

        col_skew = float(stats.skew(data, nan_policy='omit'))
        if not np.isfinite(col_skew) or abs(col_skew) < float(skew_threshold):
            skipped_cols.append(col)
            continue

        transformer = PowerTransformer(method=method, standardize=True)
        x = data.to_numpy(dtype=float).reshape(-1, 1)
        transformer.fit(x)

        full = pd.to_numeric(work[col], errors='coerce').to_numpy(dtype=float).reshape(-1, 1)
        mask = np.isfinite(full[:, 0])
        if mask.sum() == 0:
            skipped_cols.append(col)
            continue

        full_out = full.copy()
        full_out[mask] = transformer.transform(full[mask])
        work[col] = full_out[:, 0]
        transformed_cols.append(col)
        try:
            after_vals = full_out[:, 0][mask]
            skew_after = float(stats.skew(after_vals, nan_policy='omit'))
        except Exception:
            skew_after = float('nan')
        transformed_details.append(f"{col}({col_skew:.2f}->{skew_after:.2f})")

    if transformed_cols:
        return work, (
            f"Skewness transform applied to {len(transformed_cols)} column(s): "
            f"{', '.join(transformed_details[:5])}{'...' if len(transformed_details) > 5 else ''}"
        )
    return work, "Skewness transform skipped (no sufficiently skewed numeric-like columns detected)"


def analyze_distribution(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze distribution of numeric columns with real histogram data"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    distributions = {}
    
    for col in numeric_cols:
        data = df[col].dropna()
        
        if len(data) == 0:
            continue

        skewness = float(stats.skew(data))
        kurtosis = float(stats.kurtosis(data))
        
        # Categorize skewness
        if abs(skewness) < 0.5:
            skew_category = 'Normal'
        elif abs(skewness) < 1:
            skew_category = 'Moderately Skewed'
        else:
            skew_category = 'Highly Skewed'

        # Real histogram — numpy calculates actual frequencies per bin
        counts, bin_edges = np.histogram(data, bins=10)
        histogram = [
            {
                'range': f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}",
                'frequency': int(counts[i])
            }
            for i in range(len(counts))
        ]
        
        distributions[col] = {
            'mean': float(data.mean()),
            'median': float(data.median()),
            'std': float(data.std()),
            'min': float(data.min()),
            'max': float(data.max()),
            'skewness': skewness,
            'skew_category': skew_category,
            'kurtosis': kurtosis,
            'count': int(len(data)),
            'histogram': histogram,  # Real histogram data with frequencies per bin
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