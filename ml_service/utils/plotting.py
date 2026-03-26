"""
Modular plotting utilities for ML model visualisation.

All functions use Matplotlib / Seaborn and write PNG files to the graphs/
directory next to this package.  They are designed to be called AFTER
training/testing has completed — the training workflow is never modified.

Public API
----------
generate_single_model_graphs(model_type, actuals, preds, session_id)
    → dict with keys: 'line', 'scatter', 'error_histogram'

generate_comparison_graphs(model_results, session_id)
    → dict with keys: 'comparison_r2', 'comparison_rmse_mae', 'comparison_scatter'

Each value is the bare filename (e.g. 'abc123_linear_regression_line.png').
Callers construct the full URL as needed.
"""

import os
import json

import matplotlib
matplotlib.use('Agg')          # non-interactive backend — safe for server use
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_THIS_DIR   = os.path.dirname(os.path.abspath(__file__))
_SVC_DIR    = os.path.dirname(_THIS_DIR)
GRAPHS_DIR  = os.path.join(_SVC_DIR, 'graphs')
os.makedirs(GRAPHS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Display names and palette
# ---------------------------------------------------------------------------
_MODEL_LABELS = {
    'linear_regression': 'Linear Regression',
    'random_forest':     'Random Forest',
    'svm':               'SVM',
}
_MODEL_COLORS = {
    'linear_regression': '#3B82F6',
    'random_forest':     '#10B981',
    'svm':               '#F59E0B',
}

def _label(model_type: str) -> str:
    return _MODEL_LABELS.get(model_type, model_type)

def _color(model_type: str) -> str:
    return _MODEL_COLORS.get(model_type, '#6366F1')

# ---------------------------------------------------------------------------
# Style helpers
# ---------------------------------------------------------------------------
def _apply_style(ax, title: str, xlabel: str, ylabel: str) -> None:
    ax.set_title(title, fontsize=14, fontweight='bold', pad=12)
    ax.set_xlabel(xlabel, fontsize=12)
    ax.set_ylabel(ylabel, fontsize=12)
    ax.grid(True, alpha=0.25, linestyle='--')
    for spine in ax.spines.values():
        spine.set_linewidth(0.8)

# ---------------------------------------------------------------------------
# Per-model graphs
# ---------------------------------------------------------------------------

def plot_actual_vs_predicted_line(
    model_type: str,
    actuals: list,
    preds: list,
    session_id: str,
) -> str:
    """Line plot of actual values vs predicted values (by sample index)."""
    x = list(range(len(actuals)))
    fig, ax = plt.subplots(figsize=(11, 5))

    ax.plot(x, actuals, label='Actual',    color='#1E293B',        linewidth=1.8, zorder=3)
    ax.plot(x, preds,   label='Predicted', color=_color(model_type), linewidth=1.8,
            linestyle='--', zorder=3)

    _apply_style(ax,
                 title=f'{_label(model_type)} — Actual vs Predicted (Line Plot)',
                 xlabel='Sample Index',
                 ylabel='Value')
    ax.legend(fontsize=11, framealpha=0.9)
    plt.tight_layout()

    filename = f'{session_id}_{model_type}_line.png'
    plt.savefig(os.path.join(GRAPHS_DIR, filename), dpi=120, bbox_inches='tight')
    plt.close(fig)
    return filename


def plot_actual_vs_predicted_scatter(
    model_type: str,
    actuals: list,
    preds: list,
    session_id: str,
) -> str:
    """Scatter plot of actual vs predicted values with a perfect-prediction diagonal."""
    fig, ax = plt.subplots(figsize=(7, 7))

    ax.scatter(actuals, preds,
               alpha=0.55, color=_color(model_type),
               edgecolors='white', linewidths=0.4,
               s=55, label='Predictions', zorder=3)

    mn = min(min(actuals), min(preds))
    mx = max(max(actuals), max(preds))
    ax.plot([mn, mx], [mn, mx],
            color='#1E293B', linewidth=2, linestyle='--',
            label='Perfect Prediction', zorder=2)

    _apply_style(ax,
                 title=f'{_label(model_type)} — Actual vs Predicted (Scatter)',
                 xlabel='Actual Values',
                 ylabel='Predicted Values')
    ax.legend(fontsize=11, framealpha=0.9)
    plt.tight_layout()

    filename = f'{session_id}_{model_type}_scatter.png'
    plt.savefig(os.path.join(GRAPHS_DIR, filename), dpi=120, bbox_inches='tight')
    plt.close(fig)
    return filename


def plot_error_histogram(
    model_type: str,
    actuals: list,
    preds: list,
    session_id: str,
) -> str:
    """Histogram of residuals (actual − predicted)."""
    errors = [float(a) - float(p) for a, p in zip(actuals, preds)]

    fig, ax = plt.subplots(figsize=(9, 5))
    ax.hist(errors, bins=min(40, max(10, len(errors) // 5)),
            color=_color(model_type), edgecolor='white', linewidth=0.5, alpha=0.85)
    ax.axvline(0, color='#1E293B', linestyle='--', linewidth=2, label='Zero Error')
    ax.axvline(float(np.mean(errors)), color='#EF4444', linestyle='-',
               linewidth=1.5, label=f'Mean Error ({np.mean(errors):.2f})')

    _apply_style(ax,
                 title=f'{_label(model_type)} — Error Distribution (Residuals)',
                 xlabel='Prediction Error  (Actual − Predicted)',
                 ylabel='Frequency')
    ax.legend(fontsize=10, framealpha=0.9)
    plt.tight_layout()

    filename = f'{session_id}_{model_type}_error_hist.png'
    plt.savefig(os.path.join(GRAPHS_DIR, filename), dpi=120, bbox_inches='tight')
    plt.close(fig)
    return filename


def generate_single_model_graphs(
    model_type: str,
    actuals: list,
    preds: list,
    session_id: str,
) -> dict:
    """
    Generate all per-model visualisation graphs and return a dict of filenames.

    Parameters
    ----------
    model_type  : 'linear_regression' | 'random_forest' | 'svm'
    actuals     : list of float — ground-truth test values
    preds       : list of float — model predictions on test set
    session_id  : unique string used to namespace the PNG filenames

    Returns
    -------
    {
      'line':            '<session_id>_<model_type>_line.png',
      'scatter':         '<session_id>_<model_type>_scatter.png',
      'error_histogram': '<session_id>_<model_type>_error_hist.png',
    }
    """
    return {
        'line':            plot_actual_vs_predicted_line(model_type, actuals, preds, session_id),
        'scatter':         plot_actual_vs_predicted_scatter(model_type, actuals, preds, session_id),
        'error_histogram': plot_error_histogram(model_type, actuals, preds, session_id),
    }


# ---------------------------------------------------------------------------
# Multi-model comparison graphs
# ---------------------------------------------------------------------------

def generate_comparison_graphs(model_results: list, session_id: str) -> dict:
    """
    Generate comparison graphs from multiple trained models.

    Parameters
    ----------
    model_results : list of dicts, each containing:
        {
          'model_type':  str,
          'metrics':     {'test': {'r2': float, 'rmse': float, 'mae': float}},
          'actuals':     list[float],
          'predictions': list[float],
        }
    session_id    : unique string used to namespace the PNG filenames

    Returns
    -------
    {
      'comparison_r2':       '<session_id>_comparison_r2.png',
      'comparison_rmse_mae': '<session_id>_comparison_rmse_mae.png',
      'comparison_scatter':  '<session_id>_comparison_scatter.png',
    }
    """
    graphs = {}
    model_names   = [_label(r['model_type']) for r in model_results]
    model_colors  = [_color(r['model_type']) for r in model_results]

    # ------------------------------------------------------------------
    # 1. Bar chart — R² scores
    # ------------------------------------------------------------------
    r2_vals = [float(r['metrics']['test']['r2']) for r in model_results]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(model_names, r2_vals, color=model_colors,
                  edgecolor='white', width=0.45, zorder=3)
    ax.set_ylim(0, max(r2_vals) * 1.18 if any(v > 0 for v in r2_vals) else 1.0)

    for bar, val in zip(bars, r2_vals):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + max(r2_vals) * 0.02,
                f'{val:.4f}', ha='center', va='bottom',
                fontsize=11, fontweight='bold')

    ax.legend(
        handles=[mpatches.Patch(color=c, label=n) for c, n in zip(model_colors, model_names)],
        fontsize=10, framealpha=0.9,
    )
    _apply_style(ax,
                 title='Model Comparison — R² Score (Test Set)',
                 xlabel='Model',
                 ylabel='R² Score')
    plt.tight_layout()

    fname = f'{session_id}_comparison_r2.png'
    plt.savefig(os.path.join(GRAPHS_DIR, fname), dpi=120, bbox_inches='tight')
    plt.close(fig)
    graphs['comparison_r2'] = fname

    # ------------------------------------------------------------------
    # 2. Grouped bar chart — RMSE & MAE
    # ------------------------------------------------------------------
    rmse_vals = [float(r['metrics']['test']['rmse']) for r in model_results]
    mae_vals  = [float(r['metrics']['test']['mae'])  for r in model_results]

    x     = np.arange(len(model_names))
    width = 0.32
    fig, ax = plt.subplots(figsize=(9, 5))

    b_rmse = ax.bar(x - width / 2, rmse_vals, width, label='RMSE',
                    color='#3B82F6', edgecolor='white', alpha=0.9, zorder=3)
    b_mae  = ax.bar(x + width / 2, mae_vals,  width, label='MAE',
                    color='#F59E0B', edgecolor='white', alpha=0.9, zorder=3)

    for bar, val in list(zip(b_rmse, rmse_vals)) + list(zip(b_mae, mae_vals)):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() * 1.01,
                f'{val:.3f}', ha='center', va='bottom', fontsize=9)

    ax.set_xticks(x)
    ax.set_xticklabels(model_names)
    ax.legend(fontsize=11, framealpha=0.9)
    _apply_style(ax,
                 title='Model Comparison — RMSE & MAE (Test Set)',
                 xlabel='Model',
                 ylabel='Error Value')
    plt.tight_layout()

    fname = f'{session_id}_comparison_rmse_mae.png'
    plt.savefig(os.path.join(GRAPHS_DIR, fname), dpi=120, bbox_inches='tight')
    plt.close(fig)
    graphs['comparison_rmse_mae'] = fname

    # ------------------------------------------------------------------
    # 3. Combined scatter — all models in one chart
    # ------------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 7))

    all_vals = []
    for r in model_results:
        ax.scatter(r['actuals'], r['predictions'],
                   alpha=0.45, color=_color(r['model_type']),
                   label=_label(r['model_type']),
                   s=48, edgecolors='none', zorder=3)
        all_vals.extend(r['actuals'])
        all_vals.extend(r['predictions'])

    mn, mx = min(all_vals), max(all_vals)
    ax.plot([mn, mx], [mn, mx],
            color='#1E293B', linewidth=2, linestyle='--',
            label='Perfect Prediction', zorder=2)

    _apply_style(ax,
                 title='All Models — Actual vs Predicted (Scatter)',
                 xlabel='Actual Values',
                 ylabel='Predicted Values')
    ax.legend(fontsize=10, framealpha=0.9)
    plt.tight_layout()

    fname = f'{session_id}_comparison_scatter.png'
    plt.savefig(os.path.join(GRAPHS_DIR, fname), dpi=120, bbox_inches='tight')
    plt.close(fig)
    graphs['comparison_scatter'] = fname

    return graphs


# ---------------------------------------------------------------------------
# Persistence helpers (used by compare endpoint)
# ---------------------------------------------------------------------------

def save_plot_data(session_id: str, model_type: str, actuals: list, preds: list) -> None:
    """Persist full test actuals & predictions to disk for later comparison calls."""
    payload = {'actuals': actuals, 'predictions': preds, 'model_type': model_type}
    path = os.path.join(GRAPHS_DIR, f'{session_id}_data.json')
    with open(path, 'w') as f:
        json.dump(payload, f)


def load_plot_data(session_id: str) -> dict:
    """Load previously saved plot data for a training session."""
    path = os.path.join(GRAPHS_DIR, f'{session_id}_data.json')
    if not os.path.exists(path):
        raise FileNotFoundError(f'Plot data not found for session: {session_id}')
    with open(path) as f:
        return json.load(f)
