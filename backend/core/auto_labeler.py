"""
Auto-labeling pipeline for object detection and segmentation
Core functionality for automatic annotation generation
"""

import os
import time
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import cv2
import numpy as np
from PIL import Image
import torch
from ultralytics import YOLO

from models.model_manager import ModelManager, ModelInfo
from database.operations import (
    AnnotationOperations, ImageOperations, AutoLabelJobOperations,
    ModelUsageOperations, DatasetOperations
)
from database.database import SessionLocal
from core.config import settings


class AutoLabeler:
    """Main auto-labeling pipeline"""
    
    def __init__(self):
        self.model_manager = ModelManager()
        self.loaded_models = {}  # Cache for loaded models
        
    def load_model(self, model_id: str) -> Optional[YOLO]:
        """Load and cache a YOLO model"""
        if model_id in self.loaded_models:
            return self.loaded_models[model_id]
        
        model_info = self.model_manager.get_model_info(model_id)
        if not model_info:
            print(f"Model {model_id} not found")
            return None
        
        try:
            # Load YOLO model
            model = YOLO(model_info.path)
            self.loaded_models[model_id] = model
            print(f"Loaded model: {model_info.name}")
            return model
        except Exception as e:
            print(f"Failed to load model {model_id}: {e}")
            return None
    
    def predict_image(
        self, 
        image_path: str, 
        model: YOLO,
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45
    ) -> Tuple[List[Dict], float]:
        """
        Run inference on a single image
        Returns: (annotations, processing_time)
        """
        start_time = time.time()
        
        try:
            # Run inference
            results = model.predict(
                image_path,
                conf=confidence_threshold,
                iou=iou_threshold,
                verbose=False
            )
            
            processing_time = time.time() - start_time
            
            if not results or len(results) == 0:
                return [], processing_time
            
            result = results[0]  # Get first result
            annotations = []
            
            # Get image dimensions
            img = cv2.imread(image_path)
            if img is None:
                return [], processing_time
            
            img_height, img_width = img.shape[:2]
            
            # Process detections
            if result.boxes is not None:
                boxes = result.boxes
                
                for i in range(len(boxes)):
                    # Get bounding box (xyxy format)
                    box = boxes.xyxy[i].cpu().numpy()
                    confidence = float(boxes.conf[i].cpu().numpy())
                    class_id = int(boxes.cls[i].cpu().numpy())
                    
                    # Convert to normalized coordinates
                    x_min = float(box[0] / img_width)
                    y_min = float(box[1] / img_height)
                    x_max = float(box[2] / img_width)
                    y_max = float(box[3] / img_height)
                    
                    # Get class name
                    class_name = model.names[class_id] if class_id in model.names else f"class_{class_id}"
                    
                    # Handle segmentation if available
                    segmentation = None
                    if result.masks is not None and i < len(result.masks):
                        mask = result.masks.xy[i]  # Get polygon points
                        if len(mask) > 0:
                            # Normalize polygon points
                            segmentation = []
                            for point in mask:
                                segmentation.extend([
                                    float(point[0] / img_width),
                                    float(point[1] / img_height)
                                ])
                    
                    annotation = {
                        'class_name': class_name,
                        'class_id': class_id,
                        'confidence': confidence,
                        'x_min': x_min,
                        'y_min': y_min,
                        'x_max': x_max,
                        'y_max': y_max,
                        'segmentation': segmentation
                    }
                    annotations.append(annotation)
            
            return annotations, processing_time
            
        except Exception as e:
            print(f"Error processing image {image_path}: {e}")
            return [], time.time() - start_time
    
    async def auto_label_dataset(
        self,
        dataset_id: str,
        model_id: str,
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        overwrite_existing: bool = False,
        job_id: str = None
    ) -> Dict[str, Any]:
        """
        Auto-label all images in a dataset
        Returns job results and statistics
        """
        db = SessionLocal()
        
        try:
            # Create or get job
            if not job_id:
                job = AutoLabelJobOperations.create_auto_label_job(
                    db, dataset_id, model_id, confidence_threshold, 
                    iou_threshold, overwrite_existing
                )
                job_id = job.id
            else:
                job = AutoLabelJobOperations.get_job(db, job_id)
            
            if not job:
                return {"error": "Job not found"}
            
            # Update job status
            AutoLabelJobOperations.update_job_progress(
                db, job_id, status="processing", progress=0.0
            )
            
            # Load model
            model = self.load_model(model_id)
            if not model:
                AutoLabelJobOperations.update_job_progress(
                    db, job_id, status="failed", 
                    error_message=f"Failed to load model {model_id}"
                )
                return {"error": f"Failed to load model {model_id}"}
            
            # Get model info
            model_info = self.model_manager.get_model_info(model_id)
            
            # Get images to process
            images = ImageOperations.get_images_by_dataset(
                db, dataset_id, 
                labeled_only=False if overwrite_existing else None
            )
            
            if not overwrite_existing:
                # Filter out already labeled images
                images = [img for img in images if not img.is_labeled]
            
            total_images = len(images)
            if total_images == 0:
                AutoLabelJobOperations.update_job_progress(
                    db, job_id, status="completed", progress=100.0,
                    total_images=0, processed_images=0, successful_images=0
                )
                return {"message": "No images to process", "job_id": job_id}
            
            # Update job with total count
            AutoLabelJobOperations.update_job_progress(
                db, job_id, total_images=total_images
            )
            
            # Process images
            processed_count = 0
            successful_count = 0
            failed_count = 0
            total_annotations = 0
            total_processing_time = 0.0
            confidence_sum = 0.0
            confidence_count = 0
            
            for i, image in enumerate(images):
                try:
                    # Check if image file exists
                    if not os.path.exists(image.file_path):
                        print(f"Image file not found: {image.file_path}")
                        failed_count += 1
                        continue
                    
                    # Clear existing annotations if overwriting
                    if overwrite_existing:
                        AnnotationOperations.delete_annotations_by_image(db, image.id)
                    
                    # Run inference
                    annotations, processing_time = self.predict_image(
                        image.file_path, model, confidence_threshold, iou_threshold
                    )
                    
                    total_processing_time += processing_time
                    
                    # Save annotations
                    for ann_data in annotations:
                        annotation = AnnotationOperations.create_annotation(
                            db=db,
                            image_id=image.id,
                            class_name=ann_data['class_name'],
                            class_id=ann_data['class_id'],
                            x_min=ann_data['x_min'],
                            y_min=ann_data['y_min'],
                            x_max=ann_data['x_max'],
                            y_max=ann_data['y_max'],
                            confidence=ann_data['confidence'],
                            segmentation=ann_data['segmentation'],
                            is_auto_generated=True,
                            model_id=model_id
                        )
                        total_annotations += 1
                        confidence_sum += ann_data['confidence']
                        confidence_count += 1
                    
                    # Update image status
                    ImageOperations.update_image_status(
                        db, image.id, 
                        is_labeled=len(annotations) > 0,
                        is_auto_labeled=True
                    )
                    
                    successful_count += 1
                    
                except Exception as e:
                    print(f"Failed to process image {image.filename}: {e}")
                    failed_count += 1
                
                processed_count += 1
                
                # Update progress
                progress = (processed_count / total_images) * 100
                AutoLabelJobOperations.update_job_progress(
                    db, job_id,
                    progress=progress,
                    processed_images=processed_count,
                    successful_images=successful_count,
                    failed_images=failed_count,
                    total_annotations_created=total_annotations
                )
                
                # Small delay to prevent overwhelming the system
                if i % 10 == 0:
                    await asyncio.sleep(0.1)
            
            # Calculate average confidence
            avg_confidence = confidence_sum / confidence_count if confidence_count > 0 else 0.0
            avg_processing_time = total_processing_time / processed_count if processed_count > 0 else 0.0
            
            # Update model usage statistics
            ModelUsageOperations.update_model_usage(
                db, model_id, model_info.name,
                images_processed=successful_count,
                processing_time=avg_processing_time,
                average_confidence=avg_confidence
            )
            
            # Update dataset statistics
            DatasetOperations.update_dataset_stats(db, dataset_id)
            
            # Complete job
            AutoLabelJobOperations.update_job_progress(
                db, job_id, status="completed", progress=100.0
            )
            
            return {
                "job_id": job_id,
                "status": "completed",
                "total_images": total_images,
                "processed_images": processed_count,
                "successful_images": successful_count,
                "failed_images": failed_count,
                "total_annotations_created": total_annotations,
                "average_confidence": avg_confidence,
                "average_processing_time": avg_processing_time
            }
            
        except Exception as e:
            # Handle job failure
            if job_id:
                AutoLabelJobOperations.update_job_progress(
                    db, job_id, status="failed", 
                    error_message=str(e)
                )
            
            return {"error": str(e), "job_id": job_id}
        
        finally:
            db.close()
    
    async def auto_label_single_image(
        self,
        image_id: str,
        model_id: str,
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        overwrite_existing: bool = False
    ) -> Dict[str, Any]:
        """Auto-label a single image"""
        db = SessionLocal()
        
        try:
            # Get image
            image = ImageOperations.get_image(db, image_id)
            if not image:
                return {"error": "Image not found"}
            
            # Check if already labeled
            if image.is_labeled and not overwrite_existing:
                return {"error": "Image already labeled. Use overwrite_existing=True to replace."}
            
            # Load model
            model = self.load_model(model_id)
            if not model:
                return {"error": f"Failed to load model {model_id}"}
            
            # Clear existing annotations if overwriting
            if overwrite_existing:
                AnnotationOperations.delete_annotations_by_image(db, image_id)
            
            # Run inference
            annotations, processing_time = self.predict_image(
                image.file_path, model, confidence_threshold, iou_threshold
            )
            
            # Save annotations
            created_annotations = []
            for ann_data in annotations:
                annotation = AnnotationOperations.create_annotation(
                    db=db,
                    image_id=image_id,
                    class_name=ann_data['class_name'],
                    class_id=ann_data['class_id'],
                    x_min=ann_data['x_min'],
                    y_min=ann_data['y_min'],
                    x_max=ann_data['x_max'],
                    y_max=ann_data['y_max'],
                    confidence=ann_data['confidence'],
                    segmentation=ann_data['segmentation'],
                    is_auto_generated=True,
                    model_id=model_id
                )
                created_annotations.append({
                    "id": annotation.id,
                    "class_name": annotation.class_name,
                    "confidence": annotation.confidence,
                    "bbox": [annotation.x_min, annotation.y_min, annotation.x_max, annotation.y_max]
                })
            
            # Update image status
            ImageOperations.update_image_status(
                db, image_id, 
                is_labeled=len(annotations) > 0,
                is_auto_labeled=True
            )
            
            # Update dataset statistics
            DatasetOperations.update_dataset_stats(db, image.dataset_id)
            
            return {
                "image_id": image_id,
                "annotations_created": len(created_annotations),
                "annotations": created_annotations,
                "processing_time": processing_time
            }
            
        except Exception as e:
            return {"error": str(e)}
        
        finally:
            db.close()


# Global auto-labeler instance
auto_labeler = AutoLabeler()