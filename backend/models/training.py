"""
Active Learning Training Models
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.database import Base


class TrainingSession(Base):
    """Training session for active learning"""
    __tablename__ = "training_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    base_model_id = Column(String)  # Model identifier (e.g., "yolov8n", "yolov11n")
    
    # Training configuration
    epochs = Column(Integer, default=50)
    batch_size = Column(Integer, default=16)
    learning_rate = Column(Float, default=0.001)
    image_size = Column(Integer, default=640)
    
    # Status tracking
    status = Column(String(50), default="pending")  # pending, training, completed, failed
    current_iteration = Column(Integer, default=0)
    max_iterations = Column(Integer, default=10)
    
    # Performance metrics
    best_map50 = Column(Float, default=0.0)
    best_map95 = Column(Float, default=0.0)
    current_loss = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    iterations = relationship("TrainingIteration", back_populates="session")
    

class TrainingIteration(Base):
    """Individual iteration in active learning cycle"""
    __tablename__ = "training_iterations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    iteration_number = Column(Integer, nullable=False)
    
    # Training data
    training_images_count = Column(Integer, default=0)
    validation_images_count = Column(Integer, default=0)
    newly_labeled_count = Column(Integer, default=0)
    
    # Model performance
    map50 = Column(Float)
    map95 = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    loss = Column(Float)
    
    # Model path
    model_path = Column(String(500))
    weights_path = Column(String(500))
    
    # Status
    status = Column(String(50), default="pending")
    training_time_seconds = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    session = relationship("TrainingSession", back_populates="iterations")
    uncertain_samples = relationship("UncertainSample", back_populates="iteration")


class UncertainSample(Base):
    """Images selected for labeling based on uncertainty"""
    __tablename__ = "uncertain_samples"
    
    id = Column(Integer, primary_key=True, index=True)
    iteration_id = Column(Integer, ForeignKey("training_iterations.id"), nullable=False)
    image_id = Column(String, ForeignKey("images.id"), nullable=False)
    
    # Uncertainty metrics
    uncertainty_score = Column(Float, nullable=False)
    confidence_variance = Column(Float)
    entropy_score = Column(Float)
    
    # Prediction data
    predicted_boxes = Column(Text)  # JSON string of predicted boxes
    max_confidence = Column(Float)
    min_confidence = Column(Float)
    
    # Review status
    reviewed = Column(Boolean, default=False)
    accepted = Column(Boolean, default=False)
    corrected = Column(Boolean, default=False)
    corrected_labels = Column(Text)  # JSON string of corrected labels
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    
    # Relationships
    iteration = relationship("TrainingIteration", back_populates="uncertain_samples")


class ModelVersion(Base):
    """Track different versions of trained models"""
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    iteration_id = Column(Integer, ForeignKey("training_iterations.id"))
    
    version_name = Column(String(50), nullable=False)
    model_path = Column(String(500), nullable=False)
    export_format = Column(String(50), nullable=False)
    
    # Performance metrics
    map50 = Column(Float)
    map95 = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    
    # Model info
    model_size_mb = Column(Float)
    inference_time_ms = Column(Float)
    
    # Status
    is_active = Column(Boolean, default=False)
    is_best = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("TrainingSession")
    iteration = relationship("TrainingIteration")