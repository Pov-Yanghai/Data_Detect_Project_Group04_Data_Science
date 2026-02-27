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
    iqr: Record<string, any>;
    zscore: Record<string, any>;
  };
  distributions: Record<string, any>;
  recommendations: string[];
}

export interface TrainingResult {
  model_type: string;
  training_samples: number;
  test_samples: number;
  metrics: {
    train: {
      mse: number;
      rmse: number;
      mae: number;
      r2: number;
    };
    test: {
      mse: number;
      rmse: number;
      mae: number;
      r2: number;
    };
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
    const error = await response.json();
    throw new Error(error.error || 'File upload failed');
  }

  return response.json();
}

export async function analyzeData(filepath: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filepath,
      analysisType: 'full',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Analysis failed');
  }

  return response.json().then(res => res.analysis);
}

export async function cleanData(
  filepath: string,
  cleaningMethod: string,
  columns?: string[]
): Promise<{
  cleanedData: Record<string, any>[];
  summary: string;
  removedRows: number;
}> {
  const response = await fetch(`${API_BASE_URL}/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filepath,
      cleaningMethod,
      columns,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Data cleaning failed');
  }

  return response.json();
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
    body: JSON.stringify({
      filepath,
      modelType,
      features,
      target,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Model training failed');
  }

  return response.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
