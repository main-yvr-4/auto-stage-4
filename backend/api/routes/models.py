"""
API routes for model management
Easy import and management of custom YOLO models
"""

import os
import tempfile
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from models.model_manager import model_manager, ModelType, ModelFormat
from core.config import settings


router = APIRouter()


class ModelImportRequest(BaseModel):
    """Request model for importing a custom model"""
    name: str
    type: ModelType
    classes: Optional[List[str]] = None
    description: str = ""
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45


class ModelUpdateRequest(BaseModel):
    """Request model for updating model settings"""
    confidence_threshold: Optional[float] = None
    iou_threshold: Optional[float] = None
    description: Optional[str] = None


class PredictionRequest(BaseModel):
    """Request model for running predictions"""
    model_id: str
    confidence: Optional[float] = None
    iou_threshold: Optional[float] = None


@router.get("/", response_model=List[Dict[str, Any]])
async def get_models():
    """Get list of all available models"""
    try:
        models = model_manager.get_models_list()
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")


@router.get("/types/supported")
async def get_supported_model_types():
    """Get list of supported model types and formats"""
    return {
        "model_types": [
            {
                "value": ModelType.OBJECT_DETECTION,
                "label": "Object Detection",
                "description": "Detect and classify objects with bounding boxes"
            },
            {
                "value": ModelType.INSTANCE_SEGMENTATION,
                "label": "Instance Segmentation", 
                "description": "Detect objects and generate pixel-level masks"
            },
            {
                "value": ModelType.SEMANTIC_SEGMENTATION,
                "label": "Semantic Segmentation",
                "description": "Classify each pixel in the image"
            },
            {
                "value": ModelType.CLASSIFICATION,
                "label": "Image Classification",
                "description": "Classify entire images into categories"
            },
            {
                "value": ModelType.POSE_ESTIMATION,
                "label": "Pose Estimation",
                "description": "Detect human poses and keypoints"
            }
        ],
        "model_formats": [
            {
                "value": ModelFormat.PYTORCH,
                "label": "PyTorch (.pt)",
                "description": "Native PyTorch model format"
            },
            {
                "value": ModelFormat.ONNX,
                "label": "ONNX (.onnx)",
                "description": "Open Neural Network Exchange format"
            },
            {
                "value": ModelFormat.TENSORRT,
                "label": "TensorRT (.engine)",
                "description": "NVIDIA TensorRT optimized format"
            }
        ],
        "supported_extensions": [".pt", ".onnx", ".engine"],
        "max_file_size_mb": settings.MAX_FILE_SIZE / (1024 * 1024)
    }


@router.post("/import")
async def import_custom_model(
    file: UploadFile = File(...),
    name: str = Form(...),
    type: ModelType = Form(...),
    classes: Optional[str] = Form(None),  # JSON string of class names
    description: str = Form(""),
    confidence_threshold: float = Form(0.5),
    iou_threshold: float = Form(0.45)
):
    """
    Import a custom YOLO model
    
    Upload a .pt, .onnx, or .engine file to add it to the available models
    """
    try:
        # Validate file format
        if not file.filename.endswith(('.pt', '.onnx', '.engine')):
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload .pt, .onnx, or .engine files"
            )
        
        # Check file size
        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Parse classes if provided
        class_list = None
        if classes:
            try:
                import json
                class_list = json.loads(classes)
            except json.JSONDecodeError:
                # Try splitting by comma if not valid JSON
                class_list = [cls.strip() for cls in classes.split(',') if cls.strip()]
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Import the model
            model_id = model_manager.import_custom_model(
                model_file=tmp_file_path,
                model_name=name,
                model_type=type,
                classes=class_list,
                description=description,
                confidence_threshold=confidence_threshold,
                iou_threshold=iou_threshold
            )
            
            return {
                "success": True,
                "model_id": model_id,
                "message": f"Model '{name}' imported successfully"
            }
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import model: {str(e)}")


@router.post("/predict")
async def predict_with_model(
    request: PredictionRequest,
    file: UploadFile = File(...)
):
    """
    Run prediction on an uploaded image using specified model
    """
    try:
        # Validate image format
        if not any(file.filename.lower().endswith(ext) for ext in settings.SUPPORTED_IMAGE_FORMATS):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format. Supported formats: {settings.SUPPORTED_IMAGE_FORMATS}"
            )
        
        # Save uploaded image to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Run prediction
            results = model_manager.predict(
                model_id=request.model_id,
                image=tmp_file_path,
                confidence=request.confidence,
                iou_threshold=request.iou_threshold
            )
            
            return results
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/{model_id}")
async def get_model_info(model_id: str):
    """Get detailed information about a specific model"""
    try:
        if model_id not in model_manager.models_info:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = model_manager.models_info[model_id]
        return {
            "id": model_info.id,
            "name": model_info.name,
            "type": model_info.type,
            "format": model_info.format,
            "classes": model_info.classes,
            "num_classes": len(model_info.classes),
            "input_size": model_info.input_size,
            "confidence_threshold": model_info.confidence_threshold,
            "iou_threshold": model_info.iou_threshold,
            "description": model_info.description,
            "is_custom": model_info.is_custom,
            "created_at": model_info.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


@router.put("/{model_id}")
async def update_model_settings(model_id: str, request: ModelUpdateRequest):
    """Update model settings (confidence, IoU thresholds, description)"""
    try:
        if model_id not in model_manager.models_info:
            raise HTTPException(status_code=404, detail="Model not found")
        
        success = model_manager.update_model_settings(
            model_id=model_id,
            confidence_threshold=request.confidence_threshold,
            iou_threshold=request.iou_threshold,
            description=request.description
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update model settings")
        
        return {"success": True, "message": "Model settings updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update model: {str(e)}")


@router.delete("/{model_id}")
async def delete_model(model_id: str):
    """Delete a custom model (pre-trained models cannot be deleted)"""
    try:
        if model_id not in model_manager.models_info:
            raise HTTPException(status_code=404, detail="Model not found")
        
        success = model_manager.delete_model(model_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete model")
        
        return {"success": True, "message": "Model deleted successfully"}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")