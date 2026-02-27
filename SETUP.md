# Automated Data Processing & Detection Tool - Setup Guide

## System Architecture

This is a full-stack application with three separate services:

1. **Frontend** (Next.js 16) - React 19 dashboard with data visualization
2. **Backend API** (Express.js) - REST API for file handling and request routing
3. **ML Service** (FastAPI) - Python microservice for data analysis and model training

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.8+
- Git

## Installation & Setup

### Step 1: Install Frontend Dependencies

```bash
# From project root
pnpm install
# or npm install
```

### Step 2: Set Up Backend API (Express.js)

```bash
# Navigate to server directory
cd server

# Install Node dependencies
pnpm install
# or npm install

# Create .env file in server directory
echo "ML_SERVICE_URL=http://localhost:8000
PORT=5000
NODE_ENV=development" > .env
```

### Step 3: Set Up ML Service (Python)

```bash
# Navigate to ml_service directory
cd ml_service

# Create a Python virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Configure Frontend Environment

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

You need to run three separate services in different terminal windows/tabs:

### Terminal 1: Frontend (Next.js)

```bash
# From project root
pnpm dev
# or npm run dev

# Frontend will be available at http://localhost:3000
```

### Terminal 2: Backend API (Express.js)

```bash
# From project root/server
pnpm dev
# or npm run dev

# Backend will be available at http://localhost:5000
```

### Terminal 3: ML Service (FastAPI)

```bash
# From project root/ml_service (with venv activated)
python main.py
# or
uvicorn main:app --reload

# ML Service will be available at http://localhost:8000
```

## Verifying the Setup

Once all three services are running, verify they're working:

1. **Frontend**: Visit http://localhost:3000
2. **Backend Health**: http://localhost:5000/api/health
3. **ML Service Health**: http://localhost:8000/health

## API Endpoints

### Upload Endpoint
- **URL**: `POST /api/upload`
- **Body**: FormData with file field
- **Response**: File metadata and preview

### Analysis Endpoint
- **URL**: `POST /api/analyze`
- **Body**: `{ filepath: string, analysisType: string }`
- **Response**: Statistical analysis results

### Data Cleaning Endpoint
- **URL**: `POST /api/clean`
- **Body**: `{ filepath: string, cleaningMethod: string, columns: string[] }`
- **Response**: Cleaned data and summary

### Model Training Endpoint
- **URL**: `POST /api/train`
- **Body**: `{ filepath: string, modelType: string, features: string[], target: string }`
- **Response**: Model metrics and feature importance

## File Structure

```
project/
├── app/                          # Next.js frontend
│   ├── dashboard/               # Dashboard pages
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── server/                       # Express.js backend
│   ├── routes/
│   │   ├── upload.js           # File upload handler
│   │   ├── analyze.js          # Analysis routing
│   │   ├── clean.js            # Cleaning routing
│   │   └── train.js            # Training routing
│   ├── middleware/
│   │   └── upload.js           # Multer configuration
│   ├── server.js               # Express app setup
│   ├── package.json
│   └── uploads/                # Temporary file storage
├── ml_service/                  # FastAPI Python service
│   ├── main.py                 # FastAPI app
│   ├── routes/
│   │   ├── analyze.py          # Analysis endpoints
│   │   ├── clean.py            # Cleaning endpoints
│   │   └── train.py            # Training endpoints
│   ├── utils/
│   │   ├── data_processing.py  # Data analysis functions
│   │   └── models.py           # ML model training
│   ├── requirements.txt
│   └── venv/                   # Python virtual environment
├── lib/
│   └── api.ts                  # API client utilities
├── .env.example
└── SETUP.md
```

## Troubleshooting

### Backend can't connect to ML Service
- Ensure ML Service is running on port 8000
- Check `ML_SERVICE_URL` in server/.env is set to `http://localhost:8000`

### Frontend can't connect to Backend
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local` is set to `http://localhost:5000/api`

### File upload fails
- Check that `server/uploads` directory exists (created automatically)
- Verify file is CSV or Excel format
- Check file size is under 100MB

### ML Service errors with missing columns
- Ensure column names in requests match the CSV header row exactly
- Check for whitespace in column names

### Python module not found errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

## Production Deployment

For production:

1. Update `NEXT_PUBLIC_API_URL` to your backend domain
2. Set `NODE_ENV=production` in backend .env
3. Use production WSGI server for FastAPI (e.g., Gunicorn + Uvicorn)
4. Add database persistence layer
5. Implement authentication and authorization
6. Configure CORS properly for your domain
7. Use environment-specific configuration files

## Future Enhancements

- [ ] User authentication and project management
- [ ] Database integration for dataset persistence
- [ ] Model versioning and comparison
- [ ] PDF report generation
- [ ] Advanced visualization tools
- [ ] AutoML capabilities
- [ ] Batch processing support
- [ ] Real-time collaboration features
