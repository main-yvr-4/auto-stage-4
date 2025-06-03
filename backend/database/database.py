"""
Database configuration and initialization
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings
from .base import Base

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def init_db():
    """Initialize database tables"""
    # Import all models here to ensure they are registered
    from .models import (
        Project, Dataset, Image, Annotation, 
        ModelUsage, ExportJob, AutoLabelJob
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")
    
    # Create directories if they don't exist
    os.makedirs(os.path.dirname(settings.DATABASE_PATH), exist_ok=True)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.MODELS_DIR, exist_ok=True)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()