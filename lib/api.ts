const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UploadResponse {
  success: boolean;
  filename: string;
  filepath: string;
  size: number;
  columns: string[];
  rowCount: number;
  preview: Record<string, any>[];
}

export interface AnalysisResult {
  summary: {
    rows: number;
    columns: number;
    column_names: string[];
    column_types: Record<string, string>;
    memory_usage: number;
    duplicates: number;
    duplicate_percentage: number;
  };
  missing_values: {
    columns: string[];
    missing_count: Record<string, number>;
    missing_percentage: Record<string, number>;
    total_cells: number;
    total_missing: number;
  };
  outliers: {
    iqr: {
      method: string;
      columns: Record<string, any>;
      total_outliers: number;
    };
    zscore: {
      method: string;
      columns: Record<string, any>;
      total_outliers: number;
    };
  };
  distributions: Record<string, any>;
  recommendations: string[];
}

export interface CleanResponse {
  success: boolean;
  summary: string;
  originalRows: number;
  cleanedRows: number;
  removedRows: number;
  method: string;
  filepath: string;
}

export interface TrainingResult {
  model_type: string;
  training_samples: number;
  test_samples: number;
  metrics: {
    train: { mse: number; rmse: number; mae: number; r2: number };
    test:  { mse: number; rmse: number; mae: number; r2: number };
  };
  predictions: Array<{
    actual: number;
    predicted: number;
    error: number;
    error_percentage: number;
  }>;
  feature_importance: Record<string, number> | null;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'File upload failed' }));
    throw new Error(error.detail || error.error || 'File upload failed');
  }

  return response.json();
}

export async function analyzeData(filepath: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, analysisType: 'full' }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(error.detail || error.error || 'Analysis failed');
  }

  return response.json();
}

export async function cleanData(
  filepath: string,
  cleaningMethod: string,
  columns?: string[],   // 
): Promise<CleanResponse> {
  const response = await fetch(`${API_BASE_URL}/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filepath,
      cleaningMethod,
      ...(columns && columns.length > 0 ? { columns } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Data cleaning failed' }));
    throw new Error(error.detail || error.error || 'Data cleaning failed');
  }

  return response.json();
}

export async function downloadCleanedFile(filepath: string, originalFilename: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/clean/download?filepath=${encodeURIComponent(filepath)}`
  );

  if (!response.ok) {
    throw new Error('Download failed');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cleaned_${originalFilename}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function trainModel(
  filepath: string,
  modelType: string,
  features: string[],
  target: string
): Promise<TrainingResult> {
  const response = await fetch(`${API_BASE_URL}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath, modelType, features, target }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Model training failed' }));
    throw new Error(error.detail || error.error || 'Model training failed');
  }

  return response.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}