from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
import app.models.domain  # To ensure models are loaded before creating tables
from app.api import upload, tryon, users
from app.core.config import settings

# Create database tables (In production use alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Serve uploaded files for the MVP
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(tryon.router, prefix="/api", tags=["tryon"])
app.include_router(users.router, prefix="/api", tags=["users"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Cloakroom.ai API"}


@app.get("/health")
def healthcheck():
    return {"status": "ok"}