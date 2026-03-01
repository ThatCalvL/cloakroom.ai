import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.database import engine, Base
import app.models.domain  # To ensure models are loaded before creating tables
from app.api import upload, tryon, users
from app.core.config import settings


def _ensure_schema_compatibility() -> None:
    """Apply lightweight startup migrations needed for MVP evolutions."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "clothing_items" not in table_names:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("clothing_items")}
    if "name" in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE clothing_items ADD COLUMN name VARCHAR"))


# Create database tables (In production use alembic migrations)
Base.metadata.create_all(bind=engine)
_ensure_schema_compatibility()
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

allowed_origins = [origin.strip() for origin in settings.CORS_ALLOW_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files for the MVP
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
