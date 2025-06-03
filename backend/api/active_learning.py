"""
Active Learning API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database.database import get_db
from core.active_learning import ActiveLearningPipeline
from models.training import TrainingSession, TrainingIteration, UncertainSample

router = APIRouter(prefix="/api/active-learning", tags=["active-learning"])
pipeline = ActiveLearningPipeline()


# Pydantic models
class CreateTrainingSessionRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    dataset_id: int
    base_model_path: Optional[str] = "yolov8n.pt"
    epochs: Optional[int] = 50
    batch_size: Optional[int] = 16
    learning_rate: Optional[float] = 0.001
    max_iterations: Optional[int] = 10


class StartIterationRequest(BaseModel):
    newly_labeled_images: Optional[List[int]] = []


class ReviewSampleRequest(BaseModel):
    accepted: bool
    corrected: Optional[bool] = False


class TrainingSessionResponse(BaseModel):
    id: int
    name: str
    description: str
    dataset_id: int
    status: str
    current_iteration: int
    max_iterations: int
    best_map50: float
    best_map95: float
    epochs: int
    batch_size: int
    learning_rate: float
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True


class TrainingIterationResponse(BaseModel):
    id: int
    session_id: int
    iteration_number: int
    status: str
    training_images_count: int
    validation_images_count: int
    newly_labeled_count: int
    map50: Optional[float]
    map95: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    loss: Optional[float]
    training_time_seconds: Optional[int]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True


class UncertainSampleResponse(BaseModel):
    id: int
    iteration_id: int
    image_id: int
    uncertainty_score: float
    confidence_variance: float
    entropy_score: float
    max_confidence: float
    min_confidence: float
    reviewed: bool
    accepted: bool
    corrected: bool
    created_at: str
    reviewed_at: Optional[str]

    class Config:
        from_attributes = True


@router.post("/sessions", response_model=TrainingSessionResponse)
async def create_training_session(
    request: CreateTrainingSessionRequest,
    db: Session = Depends(get_db)
):
    """Create a new active learning training session"""
    try:
        session = await pipeline.create_training_session(
            db=db,
            name=request.name,
            dataset_id=request.dataset_id,
            base_model_path=request.base_model_path,
            epochs=request.epochs,
            batch_size=request.batch_size,
            learning_rate=request.learning_rate,
            max_iterations=request.max_iterations,
            description=request.description
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions", response_model=List[TrainingSessionResponse])
async def get_training_sessions(db: Session = Depends(get_db)):
    """Get all training sessions"""
    sessions = db.query(TrainingSession).order_by(TrainingSession.created_at.desc()).all()
    return sessions


@router.get("/sessions/{session_id}", response_model=TrainingSessionResponse)
async def get_training_session(session_id: int, db: Session = Depends(get_db)):
    """Get specific training session"""
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    return session


@router.post("/sessions/{session_id}/iterations", response_model=TrainingIterationResponse)
async def start_training_iteration(
    session_id: int,
    request: StartIterationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start a new training iteration"""
    try:
        iteration = await pipeline.start_training_iteration(
            db=db,
            session_id=session_id,
            newly_labeled_images=request.newly_labeled_images
        )
        return iteration
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}/iterations", response_model=List[TrainingIterationResponse])
async def get_training_iterations(session_id: int, db: Session = Depends(get_db)):
    """Get all iterations for a training session"""
    iterations = db.query(TrainingIteration).filter(
        TrainingIteration.session_id == session_id
    ).order_by(TrainingIteration.iteration_number).all()
    return iterations


@router.get("/sessions/{session_id}/progress")
async def get_training_progress(session_id: int, db: Session = Depends(get_db)):
    """Get detailed training progress and metrics"""
    try:
        progress = await pipeline.get_training_progress(db, session_id)
        return progress
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}/uncertain-samples", response_model=List[UncertainSampleResponse])
async def get_uncertain_samples(
    session_id: int,
    iteration_number: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get uncertain samples for review"""
    try:
        samples = await pipeline.get_uncertain_samples(
            db=db,
            session_id=session_id,
            iteration_number=iteration_number
        )
        return samples
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/uncertain-samples/{sample_id}/review")
async def review_uncertain_sample(
    sample_id: int,
    request: ReviewSampleRequest,
    db: Session = Depends(get_db)
):
    """Review and update uncertain sample"""
    try:
        await pipeline.review_uncertain_sample(
            db=db,
            sample_id=sample_id,
            accepted=request.accepted,
            corrected=request.corrected
        )
        return {"message": "Sample reviewed successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_training_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a training session and all related data"""
    session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    # Delete related data
    db.query(UncertainSample).filter(
        UncertainSample.iteration_id.in_(
            db.query(TrainingIteration.id).filter(TrainingIteration.session_id == session_id)
        )
    ).delete(synchronize_session=False)
    
    db.query(TrainingIteration).filter(TrainingIteration.session_id == session_id).delete()
    db.delete(session)
    db.commit()
    
    return {"message": "Training session deleted successfully"}


@router.get("/sessions/{session_id}/export-model")
async def export_trained_model(session_id: int, iteration_number: Optional[int] = None, db: Session = Depends(get_db)):
    """Export trained model for use in auto-labeling"""
    try:
        session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Training session not found")
        
        # Get best iteration if not specified
        if iteration_number is None:
            iteration = db.query(TrainingIteration).filter(
                TrainingIteration.session_id == session_id,
                TrainingIteration.map50 == session.best_map50
            ).first()
        else:
            iteration = db.query(TrainingIteration).filter(
                TrainingIteration.session_id == session_id,
                TrainingIteration.iteration_number == iteration_number
            ).first()
        
        if not iteration:
            raise HTTPException(status_code=404, detail="Training iteration not found")
        
        return {
            "model_path": iteration.weights_path,
            "performance": {
                "map50": iteration.map50,
                "map95": iteration.map95,
                "precision": iteration.precision,
                "recall": iteration.recall
            },
            "iteration": iteration.iteration_number,
            "training_time": iteration.training_time_seconds
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))