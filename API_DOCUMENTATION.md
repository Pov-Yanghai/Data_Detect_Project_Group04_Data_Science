# API Documentation

## Overview

The Automated Data Processing & Detection Tool consists of three services:
- **Frontend**: Next.js 16 (http://localhost:3000)
- **Backend API**: Express.js (http://localhost:5000)
- **ML Service**: FastAPI (http://localhost:8000)

## Backend API Endpoints

All backend endpoints are prefixed with `/api` and are located at `http://localhost:5000/api`

### Upload Endpoint

**Upload a CSV or Excel file for processing**

```http
POST /api/upload
Content-Type: multipart/form-data

file: <binary file data>
```

**Response:**
```json
{
  "success": true,
  "filename": "data.csv",
  "filepath": "/path/to/uploads/data-1234567890.csv",
  "size": 15234,
  "columns": ["Age", "Salary", "Department"],
  "rowCount": 100,
  "preview": [
    {"Age": "25", "Salary": "50000", "Department": "Sales"},
    {"Age": "32", "Salary": "65000", "Department": "Engineering"}
  ]
}
```

**Errors:**
- 400: No file uploaded or invalid format
- 413: File size exceeds 100MB limit

---

### Analyze Endpoint

**Perform comprehensive statistical analysis on uploaded data**

```http
POST /api/analyze
Content-Type: application/json

{
  "filepath": "/path/to/uploads/data-timestamp.csv",
  "analysisType": "full"
}
```

**Response:**
```json
{
  "success": true,
  "filename": "/path/to/file",
  "analysis": {
    "summary": {
      "rows": 100,
      "columns": 3,
      "column_names": ["Age", "Salary", "Department"],
      "column_types": {
        "Age": "int64",
        "Salary": "float64",
        "Department": "object"
      },
      "memory_usage": 0.0125,
      "duplicates": 2,
      "duplicate_percentage": 2.0
    },
    "missing_values": {
      "columns": ["Age"],
      "missing_count": {"Age": 3},
      "missing_percentage": {"Age": 3.0},
      "total_cells": 300,
      "total_missing": 3
    },
    "outliers": {
      "iqr": {
        "method": "iqr",
        "columns": {
          "Salary": {
            "count": 2,
            "percentage": 2.0,
            "lower_bound": 40000.0,
            "upper_bound": 100000.0
          }
        },
        "total_outliers": 2
      },
      "zscore": { ... }
    },
    "distributions": {
      "Age": {
        "mean": 35.5,
        "median": 34.0,
        "std": 12.3,
        "min": 18,
        "max": 65,
        "skewness": 0.35,
        "skew_category": "Normal",
        "kurtosis": -0.8,
        "count": 97
      }
    },
    "recommendations": [
      "Moderate missing data detected. Consider mean/median imputation.",
      "Found 2 duplicate rows (2.0%). Consider removing them."
    ]
  }
}
```

**Parameters:**
- `filepath` (required): Path to uploaded file
- `analysisType` (optional): "full" (default) for complete analysis

**Errors:**
- 400: Missing filepath
- 500: Analysis failed

---

### Clean Endpoint

**Apply data cleaning operations to handle missing values and duplicates**

```http
POST /api/clean
Content-Type: application/json

{
  "filepath": "/path/to/uploads/data-timestamp.csv",
  "cleaningMethod": "fill_mean",
  "columns": ["Age", "Salary"]
}
```

**Response:**
```json
{
  "success": true,
  "cleanedData": [
    {"Age": "25", "Salary": "50000", "Department": "Sales"},
    {"Age": "32", "Salary": "65000", "Department": "Engineering"}
  ],
  "summary": "Filled numeric missing values with mean",
  "originalRows": 100,
  "cleanedRows": 100,
  "removedRows": 0,
  "method": "fill_mean"
}
```

**Available Cleaning Methods:**
- `drop_missing`: Remove rows with any missing values
- `fill_mean`: Fill numeric columns with mean value
- `fill_median`: Fill numeric columns with median value
- `fill_mode`: Fill columns with most frequent value
- `forward_fill`: Forward/backward fill missing values
- `interpolate`: Interpolate missing numeric values
- `drop_duplicates`: Remove duplicate rows

**Parameters:**
- `filepath` (required): Path to uploaded file
- `cleaningMethod` (required): One of the methods listed above
- `columns` (optional): Specific columns to clean

**Errors:**
- 400: Invalid cleaning method or missing filepath
- 500: Cleaning operation failed

---

### Train Endpoint

**Train a machine learning model for prediction**

```http
POST /api/train
Content-Type: application/json

{
  "filepath": "/path/to/uploads/data-timestamp.csv",
  "modelType": "linear_regression",
  "features": ["Age", "Experience"],
  "target": "Salary"
}
```

**Response:**
```json
{
  "model_type": "linear_regression",
  "training_samples": 80,
  "test_samples": 20,
  "metrics": {
    "train": {
      "mse": 45234.5,
      "rmse": 212.68,
      "mae": 156.42,
      "r2": 0.876
    },
    "test": {
      "mse": 52341.2,
      "rmse": 228.78,
      "mae": 178.54,
      "r2": 0.842
    }
  },
  "predictions": [
    {"actual": 75000, "predicted": 74500, "error": 500, "error_percentage": 0.67},
    {"actual": 62000, "predicted": 63200, "error": -1200, "error_percentage": 1.94}
  ],
  "feature_importance": {
    "Experience": 0.65,
    "Age": 0.35
  }
}
```

**Parameters:**
- `filepath` (required): Path to uploaded file
- `modelType` (required): "linear_regression", "random_forest", or "svm"
- `features` (required): Array of column names to use as input
- `target` (required): Column name to predict

**Available Models:**
- `linear_regression`: Linear regression model
- `random_forest`: Random Forest ensemble (100 trees)
- `svm`: Support Vector Machine with RBF kernel

**Errors:**
- 400: Invalid model type, missing features, or target in features
- 400: Insufficient data (less than 10 valid rows)
- 500: Training failed

---

## ML Service Endpoints

All ML endpoints are located at `http://localhost:8000`

### Analyze Endpoint (ML Service)

```http
POST /analyze
Content-Type: application/json

{
  "data": [
    {"Age": 25, "Salary": 50000, "Department": "Sales"},
    {"Age": 32, "Salary": 65000, "Department": "Engineering"}
  ],
  "columns": ["Age", "Salary", "Department"],
  "analysisType": "full"
}
```

Returns comprehensive statistical analysis (see Backend `/analyze` response for details)

---

### Clean Endpoint (ML Service)

```http
POST /clean
Content-Type: application/json

{
  "data": [...],
  "columns": ["Age", "Salary"],
  "cleaningMethod": "fill_mean"
}
```

Returns cleaned data and summary

---

### Train Endpoint (ML Service)

```http
POST /train
Content-Type: application/json

{
  "data": [...],
  "modelType": "linear_regression",
  "features": ["Age", "Experience"],
  "target": "Salary"
}
```

Returns model metrics and predictions

---

## Health Check Endpoints

**Backend Health:**
```http
GET /api/health
```

Response: `{"status": "ok", "service": "data-processing-api"}`

**ML Service Health:**
```http
GET /health
```

Response: `{"status": "ok", "service": "ml-service"}`

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional error details (development mode only)"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters or data
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server error during processing

---

## File Upload Constraints

- **Max Size**: 100MB
- **Allowed Formats**: CSV, XLSX, XLS
- **Requirements**: 
  - Must have header row
  - Column names must be unique
  - Consistent column count per row

---

## Data Type Support

Numeric columns support:
- Integer (int, int32, int64)
- Float (float32, float64)
- Decimal

Categorical columns support:
- String (object)
- Category

---

## Authentication & CORS

Currently, the API has:
- CORS enabled for all origins
- No authentication required (suitable for local development)

For production, implement:
- JWT token authentication
- CORS restrictions to specific domains
- Rate limiting
- Request validation

---

## Rate Limiting & Timeouts

Current settings:
- No rate limiting
- Request timeout: 30 seconds (OS default)

Recommended for production:
- Implement rate limiting (100 requests/minute)
- Set request timeout to 30 seconds
- Add request queue for large files

---

## Examples

### Complete Data Analysis Workflow

```bash
# 1. Upload file
FILEPATH=$(curl -s -F "file=@data.csv" http://localhost:5000/api/upload | jq -r '.filepath')

# 2. Analyze data
curl -X POST -H "Content-Type: application/json" \
  -d "{\"filepath\": \"$FILEPATH\", \"analysisType\": \"full\"}" \
  http://localhost:5000/api/analyze

# 3. Clean missing values
curl -X POST -H "Content-Type: application/json" \
  -d "{\"filepath\": \"$FILEPATH\", \"cleaningMethod\": \"fill_mean\"}" \
  http://localhost:5000/api/clean

# 4. Train model
curl -X POST -H "Content-Type: application/json" \
  -d "{
    \"filepath\": \"$FILEPATH\",
    \"modelType\": \"random_forest\",
    \"features\": [\"Age\", \"Experience\"],
    \"target\": \"Salary\"
  }" \
  http://localhost:5000/api/train
```

---

## Troubleshooting

### "ML Service unreachable"
- Ensure ML service is running on port 8000
- Check `ML_SERVICE_URL` in server/.env

### "File not found"
- Verify filepath from upload response
- Check file permissions in uploads directory

### "Invalid file format"
- Only CSV and XLSX files are supported
- Ensure header row is present
- Check for consistent column counts

### "Insufficient data for training"
- Need at least 10 valid rows
- Ensure target column has numeric values
- Remove rows with missing values in selected columns
