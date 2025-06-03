"""
Model Manager for handling YOLO and other ML models
Supports easy import of custom models for object detection and segmentation
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass
from enum import Enum

import torch
import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
import yaml

from core.config import settings


class ModelType(str, Enum):
    """Supported model types"""
    OBJECT_DETECTION = "object_detection"
    INSTANCE_SEGMENTATION = "instance_segmentation"
    SEMANTIC_SEGMENTATION = "semantic_segmentation"
    CLASSIFICATION = "classification"
    POSE_ESTIMATION = "pose_estimation"


class ModelFormat(str, Enum):
    """Supported model formats"""
    PYTORCH = "pytorch"  # .pt files
    ONNX = "onnx"       # .onnx files
    TENSORRT = "tensorrt"  # .engine files


@dataclass
class ModelInfo:
    """Model information structure"""
    id: str
    name: str
    type: ModelType
    format: ModelFormat
    path: str
    classes: List[str]
    input_size: tuple
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    description: str = ""
    created_at: str = ""
    is_custom: bool = False


class ModelManager:
    """Manages all ML models for auto-labeling"""
    
    def __init__(self):
        self.models_dir = settings.MODELS_DIR
        self.models_config_file = self.models_dir / "models_config.json"
        self.loaded_models: Dict[str, Any] = {}
        self.models_info: Dict[str, ModelInfo] = {}
        
        # Initialize models directory and config
        self._init_models_directory()
        self._load_models_config()
        self._download_default_models()
    
    def _init_models_directory(self):
        """Initialize models directory structure"""
        subdirs = ["yolo", "sam", "custom", "pretrained"]
        for subdir in subdirs:
            (self.models_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    def _load_models_config(self):
        """Load models configuration from JSON file"""
        if self.models_config_file.exists():
            with open(self.models_config_file, 'r') as f:
                config = json.load(f)
                for model_id, model_data in config.items():
                    self.models_info[model_id] = ModelInfo(**model_data)
    
    def _save_models_config(self):
        """Save models configuration to JSON file"""
        config = {}
        for model_id, model_info in self.models_info.items():
            config[model_id] = {
                "id": model_info.id,
                "name": model_info.name,
                "type": model_info.type,
                "format": model_info.format,
                "path": model_info.path,
                "classes": model_info.classes,
                "input_size": model_info.input_size,
                "confidence_threshold": model_info.confidence_threshold,
                "iou_threshold": model_info.iou_threshold,
                "description": model_info.description,
                "created_at": model_info.created_at,
                "is_custom": model_info.is_custom
            }
        
        with open(self.models_config_file, 'w') as f:
            json.dump(config, f, indent=2)
    
    def _download_default_models(self):
        """Download default YOLO models if not present"""
        default_models = [
            {
                "id": "yolov8n",
                "name": "YOLOv8 Nano",
                "type": ModelType.OBJECT_DETECTION,
                "model_name": "yolov8n.pt"
            },
            {
                "id": "yolov8s",
                "name": "YOLOv8 Small", 
                "type": ModelType.OBJECT_DETECTION,
                "model_name": "yolov8s.pt"
            },
            {
                "id": "yolov8n-seg",
                "name": "YOLOv8 Nano Segmentation",
                "type": ModelType.INSTANCE_SEGMENTATION,
                "model_name": "yolov8n-seg.pt"
            },
            {
                "id": "yolov8s-seg",
                "name": "YOLOv8 Small Segmentation",
                "type": ModelType.INSTANCE_SEGMENTATION,
                "model_name": "yolov8s-seg.pt"
            }
        ]
        
        for model_config in default_models:
            if model_config["id"] not in self.models_info:
                try:
                    # Download model using ultralytics
                    model = YOLO(model_config["model_name"])
                    model_path = self.models_dir / "yolo" / model_config["model_name"]
                    
                    # Move downloaded model to our models directory
                    if hasattr(model, 'ckpt_path') and os.path.exists(model.ckpt_path):
                        shutil.copy2(model.ckpt_path, model_path)
                    
                    # Get model info
                    classes = list(model.names.values()) if hasattr(model, 'names') else []
                    
                    # Create model info
                    model_info = ModelInfo(
                        id=model_config["id"],
                        name=model_config["name"],
                        type=model_config["type"],
                        format=ModelFormat.PYTORCH,
                        path=str(model_path),
                        classes=classes,
                        input_size=(640, 640),
                        description=f"Pre-trained {model_config['name']} model",
                        is_custom=False
                    )
                    
                    self.models_info[model_config["id"]] = model_info
                    
                except Exception as e:
                    print(f"Failed to download {model_config['name']}: {e}")
        
        self._save_models_config()
    
    def import_custom_model(
        self,
        model_file: Union[str, Path],
        model_name: str,
        model_type: ModelType,
        classes: Optional[List[str]] = None,
        description: str = "",
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45
    ) -> str:
        """
        Import a custom YOLO model
        
        Args:
            model_file: Path to the model file (.pt, .onnx, .engine)
            model_name: Human-readable name for the model
            model_type: Type of the model (detection, segmentation, etc.)
            classes: List of class names (will be auto-detected if None)
            description: Description of the model
            confidence_threshold: Default confidence threshold
            iou_threshold: Default IoU threshold
            
        Returns:
            Model ID for the imported model
        """
        model_file = Path(model_file)
        
        if not model_file.exists():
            raise FileNotFoundError(f"Model file not found: {model_file}")
        
        # Determine model format
        if model_file.suffix == ".pt":
            model_format = ModelFormat.PYTORCH
        elif model_file.suffix == ".onnx":
            model_format = ModelFormat.ONNX
        elif model_file.suffix == ".engine":
            model_format = ModelFormat.TENSORRT
        else:
            raise ValueError(f"Unsupported model format: {model_file.suffix}")
        
        # Generate unique model ID
        model_id = f"custom_{model_name.lower().replace(' ', '_')}_{len(self.models_info)}"
        
        # Copy model to custom models directory
        custom_model_path = self.models_dir / "custom" / f"{model_id}{model_file.suffix}"
        shutil.copy2(model_file, custom_model_path)
        
        # Try to load model and extract information
        try:
            if model_format == ModelFormat.PYTORCH:
                model = YOLO(str(custom_model_path))
                
                # Auto-detect classes if not provided
                if classes is None:
                    classes = list(model.names.values()) if hasattr(model, 'names') else []
                
                # Get input size
                input_size = (640, 640)  # Default YOLO input size
                if hasattr(model.model, 'yaml') and 'imgsz' in model.model.yaml:
                    size = model.model.yaml['imgsz']
                    input_size = (size, size) if isinstance(size, int) else tuple(size)
                
        except Exception as e:
            print(f"Warning: Could not load model for inspection: {e}")
            if classes is None:
                classes = []
            input_size = (640, 640)
        
        # Create model info
        model_info = ModelInfo(
            id=model_id,
            name=model_name,
            type=model_type,
            format=model_format,
            path=str(custom_model_path),
            classes=classes,
            input_size=input_size,
            confidence_threshold=confidence_threshold,
            iou_threshold=iou_threshold,
            description=description,
            is_custom=True
        )
        
        # Save model info
        self.models_info[model_id] = model_info
        self._save_models_config()
        
        return model_id
    
    def load_model(self, model_id: str) -> Any:
        """Load a model for inference"""
        if model_id in self.loaded_models:
            return self.loaded_models[model_id]
        
        if model_id not in self.models_info:
            raise ValueError(f"Model not found: {model_id}")
        
        model_info = self.models_info[model_id]
        
        try:
            if model_info.format == ModelFormat.PYTORCH:
                model = YOLO(model_info.path)
            else:
                # For ONNX and TensorRT, we'll use YOLO's built-in support
                model = YOLO(model_info.path)
            
            self.loaded_models[model_id] = model
            return model
            
        except Exception as e:
            raise RuntimeError(f"Failed to load model {model_id}: {e}")
    
    def predict(
        self,
        model_id: str,
        image: Union[str, Path, np.ndarray, Image.Image],
        confidence: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Run inference on an image
        
        Args:
            model_id: ID of the model to use
            image: Input image (path, numpy array, or PIL Image)
            confidence: Confidence threshold (uses model default if None)
            iou_threshold: IoU threshold (uses model default if None)
            **kwargs: Additional arguments for model prediction
            
        Returns:
            Dictionary containing prediction results
        """
        model = self.load_model(model_id)
        model_info = self.models_info[model_id]
        
        # Use model defaults if thresholds not provided
        conf = confidence if confidence is not None else model_info.confidence_threshold
        iou = iou_threshold if iou_threshold is not None else model_info.iou_threshold
        
        # Run prediction
        results = model.predict(
            image,
            conf=conf,
            iou=iou,
            **kwargs
        )
        
        # Format results
        formatted_results = []
        for result in results:
            if hasattr(result, 'boxes') and result.boxes is not None:
                # Object detection results
                boxes = result.boxes
                for i in range(len(boxes)):
                    box_data = {
                        "bbox": boxes.xyxy[i].cpu().numpy().tolist(),
                        "confidence": float(boxes.conf[i].cpu().numpy()),
                        "class_id": int(boxes.cls[i].cpu().numpy()),
                        "class_name": model_info.classes[int(boxes.cls[i].cpu().numpy())] if model_info.classes else f"class_{int(boxes.cls[i].cpu().numpy())}"
                    }
                    
                    # Add segmentation mask if available
                    if hasattr(result, 'masks') and result.masks is not None:
                        mask = result.masks.data[i].cpu().numpy()
                        box_data["mask"] = mask.tolist()
                    
                    formatted_results.append(box_data)
        
        return {
            "model_id": model_id,
            "model_name": model_info.name,
            "predictions": formatted_results,
            "image_shape": results[0].orig_shape if results else None
        }
    
    def get_models_list(self) -> List[Dict[str, Any]]:
        """Get list of all available models"""
        models_list = []
        for model_id, model_info in self.models_info.items():
            models_list.append({
                "id": model_info.id,
                "name": model_info.name,
                "type": model_info.type,
                "format": model_info.format,
                "classes": model_info.classes,
                "num_classes": len(model_info.classes),
                "input_size": model_info.input_size,
                "is_custom": model_info.is_custom,
                "description": model_info.description
            })
        return models_list
    
    def delete_model(self, model_id: str) -> bool:
        """Delete a custom model"""
        if model_id not in self.models_info:
            return False
        
        model_info = self.models_info[model_id]
        
        # Only allow deletion of custom models
        if not model_info.is_custom:
            raise ValueError("Cannot delete pre-trained models")
        
        # Remove model file
        model_path = Path(model_info.path)
        if model_path.exists():
            model_path.unlink()
        
        # Remove from loaded models
        if model_id in self.loaded_models:
            del self.loaded_models[model_id]
        
        # Remove from models info
        del self.models_info[model_id]
        self._save_models_config()
        
        return True
    
    def update_model_settings(
        self,
        model_id: str,
        confidence_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        description: Optional[str] = None
    ) -> bool:
        """Update model settings"""
        if model_id not in self.models_info:
            return False
        
        model_info = self.models_info[model_id]
        
        if confidence_threshold is not None:
            model_info.confidence_threshold = confidence_threshold
        if iou_threshold is not None:
            model_info.iou_threshold = iou_threshold
        if description is not None:
            model_info.description = description
        
        self._save_models_config()
        return True


# Global model manager instance
model_manager = ModelManager()