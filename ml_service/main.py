from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

from routes.analyze import router as analyze_router
from routes.clean import router as clean_router
from routes.train import router as train_router

app = FastAPI(
    title="Data Processing ML Service",
    description="ML microservice for automated data analysis and model training",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze_router)
app.include_router(clean_router)
app.include_router(train_router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "ml-service"}

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "name": "Data Processing ML Service",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/analyze - POST",
            "clean": "/clean - POST",
            "train": "/train - POST",
            "health": "/health - GET"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
