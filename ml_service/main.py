from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import pandas as pd
import uuid

from routes.analyze import router as analyze_router
from routes.clean import router as clean_router
from routes.train import router as train_router

app = FastAPI(
    title="DataClean ML Service",
    description="ML microservice for automated data analysis and model training",
    version="1.0.0"
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory — create if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Include routers — no /api prefix since frontend calls http://localhost:8000 directly
app.include_router(analyze_router)
app.include_router(clean_router)
app.include_router(train_router)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file and return its metadata"""
    try:
        # Validate file type
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ('.csv', '.xlsx', '.xls'):
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel files are allowed.")

        # Save file with a unique name to avoid collisions
        unique_name = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_name)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(filepath)

        # Read to get columns and row count
        if ext == '.csv':
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)

        # Preview — first 5 rows, convert to JSON-safe format
        preview = df.head(5).where(pd.notnull(df.head(5)), None).to_dict(orient='records')

        return {
            'success': True,
            'filename': file.filename,
            'filepath': filepath,
            'size': file_size,
            'columns': list(df.columns),
            'rowCount': len(df),
            'preview': preview,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dataclean-ml-service"}


@app.get("/")
async def root():
    return {
        "name": "DataClean ML Service",
        "version": "1.0.0",
        "endpoints": {
            "upload":  "POST /upload",
            "analyze": "POST /analyze",
            "clean":   "POST /clean",
            "train":   "POST /train",
            "health":  "GET  /health",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)