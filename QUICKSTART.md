# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 18+
- Python 3.8+

### Step 1: Install Frontend & Backend Dependencies (2 minutes)

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd server && pnpm install && cd ..
```

### Step 2: Set Up Python Environment (1 minute)

```bash
cd ml_service

# Create virtual environment
python -m venv venv

# Activate it (macOS/Linux)
source venv/bin/activate
# Or on Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Start All Three Services (2 minutes)

Open three terminal tabs/windows and run:

**Terminal 1: Frontend**
```bash
pnpm dev
```
→ Visit http://localhost:3000

**Terminal 2: Backend API**
```bash
cd server && pnpm dev
```
→ Runs on http://localhost:5000

**Terminal 3: ML Service**
```bash
cd ml_service
# With venv activated:
python main.py
```
→ Runs on http://localhost:8000

### Step 4: Try It Out!

1. Visit http://localhost:3000 in your browser
2. Click "Upload Dataset" on the landing page
3. Upload a CSV file (test with any dataset)
4. Explore:
   - **Overview** - See data summary
   - **Missing Values** - Identify and clean missing data
   - **Outlier Detection** - Find statistical outliers
   - **Distribution** - Analyze data distributions
   - **ML Training** - Train predictive models

## Sample CSV for Testing

Create a `test_data.csv` file:

```csv
Age,Salary,Experience,Performance,Department
25,50000,1,7.5,Sales
32,65000,5,8.2,Engineering
28,55000,3,7.8,Marketing
45,85000,15,9.1,Sales
29,60000,4,8.0,Engineering
```

## Troubleshooting

### Backend Can't Connect to ML Service
- Ensure ML Service is running on port 8000
- Check the server/.env file has: `ML_SERVICE_URL=http://localhost:8000`

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check your browser console for CORS errors

### Python Module Errors
```bash
# Make sure virtual environment is activated and reinstall:
pip install -r requirements.txt
```

### Port Already in Use
- Change port in relevant startup command
- Frontend: `pnpm dev -- -p 3001`
- Backend: `PORT=5001 pnpm dev` (then update frontend .env)

## API Usage Examples

### Upload a File
```bash
curl -X POST -F "file=@data.csv" http://localhost:5000/api/upload
```

### Analyze Data
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"filepath": "/path/to/file", "analysisType": "full"}' \
  http://localhost:5000/api/analyze
```

### Train a Model
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "filepath": "/path/to/file",
    "modelType": "linear_regression",
    "features": ["Age", "Experience"],
    "target": "Salary"
  }' \
  http://localhost:5000/api/train
```

## Next Steps

- Explore the SETUP.md for detailed configuration
- Check out the `/server` directory for backend code
- Review the `/ml_service` directory for ML implementation
- Customize analysis functions in `ml_service/utils/data_processing.py`
- Add more models in `ml_service/utils/models.py`

## File Limits

- Max file size: 100MB
- Supported formats: CSV, XLSX
- Must have header row with column names

Happy analyzing! 🚀
