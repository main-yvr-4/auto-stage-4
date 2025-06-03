"""
Active Learning Training Pipeline
"""
import os
import json
import yaml
import shutil
import asyncio
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from ultralytics import YOLO
from sqlalchemy.orm import Session
from database.database import get_db
from models.training import TrainingSession, TrainingIteration, UncertainSample, ModelVersion
from core.dataset_manager import DatasetManager
import logging

logger = logging.getLogger(__name__)


class ActiveLearningPipeline:
    """Complete Active Learning pipeline for YOLO models"""
    
    def __init__(self):
        self.training_dir = Path("models/training")
        self.training_dir.mkdir(exist_ok=True)
        self.dataset_manager = DatasetManager()
        
    async def create_training_session(
        self,
        db: Session,
        name: str,
        dataset_id: int,
        base_model_path: str = "yolov8n.pt",
        epochs: int = 50,
        batch_size: int = 16,
        learning_rate: float = 0.001,
        max_iterations: int = 10,
        description: str = ""
    ) -> TrainingSession:
        """Create a new active learning training session"""
        
        session = TrainingSession(
            name=name,
            description=description,
            dataset_id=dataset_id,
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate,
            max_iterations=max_iterations,
            status="pending"
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create session directory
        session_dir = self.training_dir / f"session_{session.id}"
        session_dir.mkdir(exist_ok=True)
        
        logger.info(f"Created training session {session.id}: {name}")
        return session
    
    async def start_training_iteration(
        self,
        db: Session,
        session_id: int,
        newly_labeled_images: List[int] = None
    ) -> TrainingIteration:
        """Start a new training iteration"""
        
        session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
        if not session:
            raise ValueError(f"Training session {session_id} not found")
        
        # Create new iteration
        iteration = TrainingIteration(
            session_id=session_id,
            iteration_number=session.current_iteration + 1,
            status="pending",
            newly_labeled_count=len(newly_labeled_images) if newly_labeled_images else 0
        )
        
        db.add(iteration)
        db.commit()
        db.refresh(iteration)
        
        # Update session
        session.current_iteration = iteration.iteration_number
        session.status = "training"
        session.started_at = datetime.utcnow()
        db.commit()
        
        # Start training in background
        asyncio.create_task(self._train_model(db, session, iteration, newly_labeled_images))
        
        return iteration
    
    async def _train_model(
        self,
        db: Session,
        session: TrainingSession,
        iteration: TrainingIteration,
        newly_labeled_images: List[int] = None
    ):
        """Train YOLO model for current iteration"""
        
        try:
            iteration.status = "training"
            iteration.started_at = datetime.utcnow()
            db.commit()
            
            # Prepare dataset
            dataset_path = await self._prepare_training_dataset(
                db, session, iteration, newly_labeled_images
            )
            
            # Load base model
            if iteration.iteration_number == 1:
                model = YOLO("yolov8n.pt")  # Start with pretrained
            else:
                # Use previous iteration's best model
                prev_iteration = db.query(TrainingIteration).filter(
                    TrainingIteration.session_id == session.id,
                    TrainingIteration.iteration_number == iteration.iteration_number - 1
                ).first()
                model = YOLO(prev_iteration.weights_path)
            
            # Training configuration
            train_args = {
                'data': dataset_path,
                'epochs': session.epochs,
                'batch': session.batch_size,
                'lr0': session.learning_rate,
                'imgsz': session.image_size,
                'project': str(self.training_dir / f"session_{session.id}"),
                'name': f"iteration_{iteration.iteration_number}",
                'save_period': 10,
                'patience': 20,
                'device': 'cpu',  # Use CPU for compatibility
                'workers': 2
            }
            
            # Train model
            logger.info(f"Starting training for session {session.id}, iteration {iteration.iteration_number}")
            results = model.train(**train_args)
            
            # Save results
            iteration.map50 = float(results.results_dict.get('metrics/mAP50(B)', 0))
            iteration.map95 = float(results.results_dict.get('metrics/mAP50-95(B)', 0))
            iteration.precision = float(results.results_dict.get('metrics/precision(B)', 0))
            iteration.recall = float(results.results_dict.get('metrics/recall(B)', 0))
            iteration.loss = float(results.results_dict.get('train/box_loss', 0))
            
            # Save model paths
            run_dir = Path(train_args['project']) / train_args['name']
            iteration.weights_path = str(run_dir / "weights" / "best.pt")
            iteration.model_path = str(run_dir)
            
            iteration.status = "completed"
            iteration.completed_at = datetime.utcnow()
            iteration.training_time_seconds = int((iteration.completed_at - iteration.started_at).total_seconds())
            
            # Update session metrics
            if iteration.map50 > session.best_map50:
                session.best_map50 = iteration.map50
                session.best_map95 = iteration.map95
            
            db.commit()
            
            # Create model version
            await self._create_model_version(db, session, iteration)
            
            # Generate uncertain samples for next iteration
            if iteration.iteration_number < session.max_iterations:
                await self._generate_uncertain_samples(db, session, iteration)
            else:
                session.status = "completed"
                session.completed_at = datetime.utcnow()
                db.commit()
            
            logger.info(f"Training completed for session {session.id}, iteration {iteration.iteration_number}")
            
        except Exception as e:
            logger.error(f"Training failed for session {session.id}, iteration {iteration.iteration_number}: {str(e)}")
            iteration.status = "failed"
            session.status = "failed"
            db.commit()
            raise
    
    async def _prepare_training_dataset(
        self,
        db: Session,
        session: TrainingSession,
        iteration: TrainingIteration,
        newly_labeled_images: List[int] = None
    ) -> str:
        """Prepare YOLO dataset for training"""
        
        # Create iteration dataset directory
        dataset_dir = self.training_dir / f"session_{session.id}" / f"iteration_{iteration.iteration_number}" / "dataset"
        dataset_dir.mkdir(parents=True, exist_ok=True)
        
        # Create train/val directories
        (dataset_dir / "images" / "train").mkdir(parents=True, exist_ok=True)
        (dataset_dir / "images" / "val").mkdir(parents=True, exist_ok=True)
        (dataset_dir / "labels" / "train").mkdir(parents=True, exist_ok=True)
        (dataset_dir / "labels" / "val").mkdir(parents=True, exist_ok=True)
        
        # Get labeled images from dataset
        labeled_images = await self.dataset_manager.get_labeled_images(db, session.dataset_id)
        
        # Split train/val (80/20)
        np.random.shuffle(labeled_images)
        split_idx = int(len(labeled_images) * 0.8)
        train_images = labeled_images[:split_idx]
        val_images = labeled_images[split_idx:]
        
        # Copy images and labels
        await self._copy_dataset_files(train_images, dataset_dir / "images" / "train", dataset_dir / "labels" / "train")
        await self._copy_dataset_files(val_images, dataset_dir / "images" / "val", dataset_dir / "labels" / "val")
        
        # Update iteration counts
        iteration.training_images_count = len(train_images)
        iteration.validation_images_count = len(val_images)
        db.commit()
        
        # Create dataset.yaml
        dataset_yaml = {
            'path': str(dataset_dir),
            'train': 'images/train',
            'val': 'images/val',
            'names': await self.dataset_manager.get_class_names(db, session.dataset_id)
        }
        
        yaml_path = dataset_dir / "dataset.yaml"
        with open(yaml_path, 'w') as f:
            yaml.dump(dataset_yaml, f)
        
        return str(yaml_path)
    
    async def _copy_dataset_files(self, images: List[Dict], img_dir: Path, label_dir: Path):
        """Copy image and label files to training directory"""
        
        for image_data in images:
            # Copy image
            src_img = Path(image_data['path'])
            dst_img = img_dir / src_img.name
            shutil.copy2(src_img, dst_img)
            
            # Copy label if exists
            label_path = image_data.get('label_path')
            if label_path and Path(label_path).exists():
                src_label = Path(label_path)
                dst_label = label_dir / f"{src_img.stem}.txt"
                shutil.copy2(src_label, dst_label)
    
    async def _create_model_version(self, db: Session, session: TrainingSession, iteration: TrainingIteration):
        """Create a new model version"""
        
        version = ModelVersion(
            session_id=session.id,
            iteration_id=iteration.id,
            version_number=f"v{iteration.iteration_number}",
            model_path=iteration.model_path,
            weights_path=iteration.weights_path,
            map50=iteration.map50,
            map95=iteration.map95,
            precision=iteration.precision,
            recall=iteration.recall,
            is_best=(iteration.map50 == session.best_map50)
        )
        
        db.add(version)
        db.commit()
    
    async def _generate_uncertain_samples(
        self,
        db: Session,
        session: TrainingSession,
        iteration: TrainingIteration
    ):
        """Generate uncertain samples for next iteration using trained model"""
        
        try:
            # Load trained model
            model = YOLO(iteration.weights_path)
            
            # Get unlabeled images from dataset
            unlabeled_images = await self.dataset_manager.get_unlabeled_images(db, session.dataset_id)
            
            uncertain_samples = []
            
            for image_data in unlabeled_images[:100]:  # Limit to 100 for performance
                # Run inference
                results = model(image_data['path'], verbose=False)
                
                if len(results) > 0 and len(results[0].boxes) > 0:
                    # Calculate uncertainty metrics
                    confidences = results[0].boxes.conf.cpu().numpy()
                    
                    # Uncertainty score (1 - max confidence)
                    uncertainty_score = 1.0 - np.max(confidences)
                    
                    # Confidence variance
                    confidence_variance = np.var(confidences)
                    
                    # Entropy score
                    entropy_score = -np.sum(confidences * np.log(confidences + 1e-8))
                    
                    # Combined uncertainty score
                    combined_score = (uncertainty_score + confidence_variance + entropy_score) / 3
                    
                    uncertain_sample = UncertainSample(
                        iteration_id=iteration.id,
                        image_id=image_data['id'],
                        uncertainty_score=float(combined_score),
                        confidence_variance=float(confidence_variance),
                        entropy_score=float(entropy_score),
                        predicted_boxes=json.dumps(results[0].boxes.xywh.cpu().numpy().tolist()),
                        max_confidence=float(np.max(confidences)),
                        min_confidence=float(np.min(confidences))
                    )
                    
                    uncertain_samples.append(uncertain_sample)
            
            # Sort by uncertainty score and take top samples
            uncertain_samples.sort(key=lambda x: x.uncertainty_score, reverse=True)
            top_samples = uncertain_samples[:20]  # Top 20 most uncertain
            
            # Save to database
            for sample in top_samples:
                db.add(sample)
            
            db.commit()
            
            logger.info(f"Generated {len(top_samples)} uncertain samples for iteration {iteration.iteration_number}")
            
        except Exception as e:
            logger.error(f"Failed to generate uncertain samples: {str(e)}")
    
    async def get_uncertain_samples(
        self,
        db: Session,
        session_id: int,
        iteration_number: int = None
    ) -> List[UncertainSample]:
        """Get uncertain samples for review"""
        
        query = db.query(UncertainSample).join(TrainingIteration).filter(
            TrainingIteration.session_id == session_id
        )
        
        if iteration_number:
            query = query.filter(TrainingIteration.iteration_number == iteration_number)
        
        return query.order_by(UncertainSample.uncertainty_score.desc()).all()
    
    async def review_uncertain_sample(
        self,
        db: Session,
        sample_id: int,
        accepted: bool,
        corrected: bool = False
    ):
        """Review and update uncertain sample"""
        
        sample = db.query(UncertainSample).filter(UncertainSample.id == sample_id).first()
        if not sample:
            raise ValueError(f"Uncertain sample {sample_id} not found")
        
        sample.reviewed = True
        sample.accepted = accepted
        sample.corrected = corrected
        sample.reviewed_at = datetime.utcnow()
        
        db.commit()
    
    async def get_training_progress(self, db: Session, session_id: int) -> Dict:
        """Get training progress and metrics"""
        
        session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
        if not session:
            raise ValueError(f"Training session {session_id} not found")
        
        iterations = db.query(TrainingIteration).filter(
            TrainingIteration.session_id == session_id
        ).order_by(TrainingIteration.iteration_number).all()
        
        return {
            'session': {
                'id': session.id,
                'name': session.name,
                'status': session.status,
                'current_iteration': session.current_iteration,
                'max_iterations': session.max_iterations,
                'best_map50': session.best_map50,
                'best_map95': session.best_map95,
                'created_at': session.created_at,
                'started_at': session.started_at,
                'completed_at': session.completed_at
            },
            'iterations': [
                {
                    'iteration_number': it.iteration_number,
                    'status': it.status,
                    'map50': it.map50,
                    'map95': it.map95,
                    'precision': it.precision,
                    'recall': it.recall,
                    'loss': it.loss,
                    'training_images_count': it.training_images_count,
                    'validation_images_count': it.validation_images_count,
                    'newly_labeled_count': it.newly_labeled_count,
                    'training_time_seconds': it.training_time_seconds,
                    'completed_at': it.completed_at
                }
                for it in iterations
            ]
        }
    
    async def calculate_uncertainty_scores(
        self,
        model: YOLO,
        images: List[str],
        threshold: float = 0.5
    ) -> List[Dict]:
        """Calculate uncertainty scores for images using model predictions"""
        
        uncertain_samples = []
        
        for image_path in images:
            try:
                # Run inference
                results = model(image_path, conf=threshold, verbose=False)
                
                if not results or len(results) == 0:
                    continue
                
                result = results[0]
                
                if result.boxes is None or len(result.boxes) == 0:
                    # No detections - high uncertainty
                    uncertain_samples.append({
                        'image_path': image_path,
                        'uncertainty_score': 0.9,
                        'confidence_variance': 0.0,
                        'entropy_score': 0.9,
                        'max_confidence': 0.0,
                        'min_confidence': 0.0,
                        'predicted_boxes': []
                    })
                    continue
                
                # Extract confidence scores
                confidences = result.boxes.conf.cpu().numpy()
                
                # Calculate uncertainty metrics
                confidence_variance = float(np.var(confidences))
                entropy_score = float(-np.sum(confidences * np.log(confidences + 1e-8)))
                max_confidence = float(np.max(confidences))
                min_confidence = float(np.min(confidences))
                
                # Overall uncertainty score (higher = more uncertain)
                uncertainty_score = 1.0 - max_confidence + confidence_variance + (entropy_score / len(confidences))
                
                # Extract predicted boxes
                boxes = result.boxes.xyxy.cpu().numpy()
                classes = result.boxes.cls.cpu().numpy()
                
                predicted_boxes = [
                    {
                        'bbox': box.tolist(),
                        'class': int(cls),
                        'confidence': float(conf)
                    }
                    for box, cls, conf in zip(boxes, classes, confidences)
                ]
                
                uncertain_samples.append({
                    'image_path': image_path,
                    'uncertainty_score': float(uncertainty_score),
                    'confidence_variance': confidence_variance,
                    'entropy_score': entropy_score,
                    'max_confidence': max_confidence,
                    'min_confidence': min_confidence,
                    'predicted_boxes': predicted_boxes
                })
                
            except Exception as e:
                logger.error(f"Error calculating uncertainty for {image_path}: {e}")
                continue
        
        # Sort by uncertainty score (highest first)
        uncertain_samples.sort(key=lambda x: x['uncertainty_score'], reverse=True)
        
        return uncertain_samples
    
    async def update_sample_review(
        self,
        db: Session,
        sample_id: int,
        accepted: bool,
        corrected: bool = False,
        corrected_labels: Optional[List[Dict]] = None
    ):
        """Update sample review status and corrections"""
        
        sample = db.query(UncertainSample).filter(UncertainSample.id == sample_id).first()
        if not sample:
            raise ValueError(f"Uncertain sample {sample_id} not found")
        
        sample.reviewed = True
        sample.accepted = accepted
        sample.corrected = corrected
        sample.reviewed_at = datetime.utcnow()
        
        if corrected_labels:
            sample.corrected_labels = json.dumps(corrected_labels)
        
        db.commit()
        
        return sample
    
    async def get_session_progress(self, db: Session, session_id: int) -> Dict:
        """Get detailed session progress and metrics"""
        
        session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
        if not session:
            raise ValueError(f"Training session {session_id} not found")
        
        iterations = db.query(TrainingIteration).filter(
            TrainingIteration.session_id == session_id
        ).order_by(TrainingIteration.iteration_number).all()
        
        # Calculate progress metrics
        total_samples_reviewed = db.query(UncertainSample).join(TrainingIteration).filter(
            TrainingIteration.session_id == session_id,
            UncertainSample.reviewed == True
        ).count()
        
        total_samples_pending = db.query(UncertainSample).join(TrainingIteration).filter(
            TrainingIteration.session_id == session_id,
            UncertainSample.reviewed == False
        ).count()
        
        progress_percentage = (session.current_iteration / session.max_iterations) * 100 if session.max_iterations > 0 else 0
        
        return {
            'session_id': session.id,
            'name': session.name,
            'status': session.status,
            'progress_percentage': progress_percentage,
            'current_iteration': session.current_iteration,
            'max_iterations': session.max_iterations,
            'best_map50': session.best_map50,
            'best_map95': session.best_map95,
            'total_samples_reviewed': total_samples_reviewed,
            'total_samples_pending': total_samples_pending,
            'iterations': [
                {
                    'iteration_number': it.iteration_number,
                    'status': it.status,
                    'map50': it.map50,
                    'map95': it.map95,
                    'precision': it.precision,
                    'recall': it.recall,
                    'loss': it.loss,
                    'training_time_seconds': it.training_time_seconds,
                    'completed_at': it.completed_at
                }
                for it in iterations
            ],
            'created_at': session.created_at,
            'started_at': session.started_at,
            'completed_at': session.completed_at
        }
    
    async def export_best_model(
        self,
        db: Session,
        session_id: int,
        export_format: str = "onnx"
    ) -> str:
        """Export the best model from the training session"""
        
        session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
        if not session:
            raise ValueError(f"Training session {session_id} not found")
        
        # Find the best iteration (highest mAP50)
        best_iteration = db.query(TrainingIteration).filter(
            TrainingIteration.session_id == session_id,
            TrainingIteration.status == "completed"
        ).order_by(TrainingIteration.map50.desc()).first()
        
        if not best_iteration:
            raise ValueError("No completed iterations found")
        
        # Load the best model
        model_path = best_iteration.weights_path
        if not os.path.exists(model_path):
            raise ValueError(f"Model weights not found: {model_path}")
        
        model = YOLO(model_path)
        
        # Export model
        export_dir = self.training_dir / f"session_{session_id}" / "exports"
        export_dir.mkdir(parents=True, exist_ok=True)
        
        export_path = export_dir / f"best_model.{export_format}"
        
        if export_format.lower() == "onnx":
            model.export(format="onnx", imgsz=640)
            # Move exported file to our desired location
            exported_file = Path(model_path).parent / "best.onnx"
            if exported_file.exists():
                shutil.move(str(exported_file), str(export_path))
        elif export_format.lower() == "torchscript":
            model.export(format="torchscript", imgsz=640)
            exported_file = Path(model_path).parent / "best.torchscript"
            if exported_file.exists():
                shutil.move(str(exported_file), str(export_path))
        else:
            # Just copy the PyTorch weights
            shutil.copy2(model_path, export_path)
        
        # Create model version record
        model_version = ModelVersion(
            session_id=session_id,
            iteration_id=best_iteration.id,
            version_name=f"v{session.current_iteration}_best",
            model_path=str(export_path),
            export_format=export_format,
            map50=best_iteration.map50,
            map95=best_iteration.map95,
            precision=best_iteration.precision,
            recall=best_iteration.recall,
            created_at=datetime.utcnow()
        )
        
        db.add(model_version)
        db.commit()
        
        return str(export_path)