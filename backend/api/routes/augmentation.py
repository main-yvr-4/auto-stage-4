"""
Data Augmentation API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import json

from database.database import get_db
from database import operations as crud
from database.models import Dataset, DataAugmentation
from utils.augmentation_utils import AdvancedDataAugmentation
from core.config import settings

router = APIRouter(prefix="/api/augmentation", tags=["augmentation"])


class AugmentationConfigRequest(BaseModel):
    dataset_id: str
    name: str
    description: Optional[str] = ""
    augmentation_config: Dict[str, Any]
    images_per_original: int = 5
    apply_to_split: str = "train"
    preserve_annotations: bool = True


class AugmentationPresetRequest(BaseModel):
    preset_name: str  # light, medium, heavy, geometric_only, color_only, noise_blur


@router.get("/presets")
async def get_augmentation_presets():
    """Get available augmentation presets"""
    augmenter = AdvancedDataAugmentation()
    presets = augmenter.get_preset_configs()
    
    return {
        "presets": {
            name: {
                "name": name.replace("_", " ").title(),
                "description": get_preset_description(name),
                "config": config
            }
            for name, config in presets.items()
        }
    }


@router.get("/default-config")
async def get_default_augmentation_config():
    """Get default augmentation configuration"""
    augmenter = AdvancedDataAugmentation()
    config = augmenter.get_default_config()
    
    return {
        "config": config,
        "categories": {
            "geometric": [
                "rotation", "flip", "shear", "perspective", "elastic_transform",
                "crop", "zoom"
            ],
            "color": [
                "brightness", "contrast", "saturation", "hue", "gamma",
                "channel_shuffle", "color_jitter"
            ],
            "noise_blur": [
                "gaussian_blur", "motion_blur", "median_blur", "gaussian_noise",
                "iso_noise", "multiplicative_noise"
            ],
            "weather": [
                "rain", "snow", "fog", "sun_flare", "shadow"
            ],
            "cutout": [
                "cutout", "grid_dropout", "channel_dropout"
            ],
            "distortion": [
                "optical_distortion", "grid_distortion", "piecewise_affine"
            ],
            "quality": [
                "jpeg_compression", "downscale"
            ]
        }
    }


@router.post("/create")
async def create_augmentation_job(
    request: AugmentationConfigRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new data augmentation job"""
    try:
        # Validate dataset exists
        dataset = crud.get_dataset(db, request.dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Create augmentation job
        augmentation_data = {
            "dataset_id": request.dataset_id,
            "name": request.name,
            "description": request.description,
            "augmentation_config": request.augmentation_config,
            "images_per_original": request.images_per_original,
            "apply_to_split": request.apply_to_split,
            "preserve_annotations": request.preserve_annotations,
            "status": "pending"
        }
        
        augmentation_job = crud.create_data_augmentation(db, augmentation_data)
        
        # Start augmentation in background
        background_tasks.add_task(
            run_augmentation_job,
            augmentation_job.id,
            request.augmentation_config
        )
        
        return {
            "job_id": augmentation_job.id,
            "status": "created",
            "message": "Augmentation job created and started"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating augmentation job: {str(e)}")


@router.get("/jobs/{dataset_id}")
async def get_augmentation_jobs(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Get all augmentation jobs for a dataset"""
    try:
        jobs = crud.get_data_augmentations_by_dataset(db, dataset_id)
        
        return {
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "description": job.description,
                    "status": job.status,
                    "progress": job.progress,
                    "images_per_original": job.images_per_original,
                    "apply_to_split": job.apply_to_split,
                    "total_original_images": job.total_original_images,
                    "total_augmented_images": job.total_augmented_images,
                    "successful_augmentations": job.successful_augmentations,
                    "failed_augmentations": job.failed_augmentations,
                    "created_at": job.created_at.isoformat(),
                    "started_at": job.started_at.isoformat() if job.started_at else None,
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                    "error_message": job.error_message
                }
                for job in jobs
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting augmentation jobs: {str(e)}")


@router.get("/job/{job_id}/status")
async def get_augmentation_job_status(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Get status of a specific augmentation job"""
    try:
        job = crud.get_data_augmentation(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Augmentation job not found")
        
        return {
            "job_id": job.id,
            "status": job.status,
            "progress": job.progress,
            "total_original_images": job.total_original_images,
            "total_augmented_images": job.total_augmented_images,
            "successful_augmentations": job.successful_augmentations,
            "failed_augmentations": job.failed_augmentations,
            "error_message": job.error_message,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting job status: {str(e)}")


@router.delete("/job/{job_id}")
async def delete_augmentation_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Delete an augmentation job"""
    try:
        job = crud.get_data_augmentation(db, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Augmentation job not found")
        
        # Only allow deletion if job is not running
        if job.status == "processing":
            raise HTTPException(status_code=400, detail="Cannot delete running job")
        
        crud.delete_data_augmentation(db, job_id)
        
        return {"message": "Augmentation job deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting augmentation job: {str(e)}")


@router.post("/preview")
async def preview_augmentation(
    request: AugmentationConfigRequest,
    db: Session = Depends(get_db)
):
    """Preview augmentation effects on sample images"""
    try:
        # Get a few sample images from the dataset
        images = crud.get_images_by_dataset(db, request.dataset_id, limit=3)
        if not images:
            raise HTTPException(status_code=404, detail="No images found in dataset")
        
        # Create augmentation pipeline
        augmenter = AdvancedDataAugmentation()
        pipeline = augmenter.create_augmentation_pipeline(request.augmentation_config)
        
        # Generate preview (this would need actual image processing)
        # For now, return configuration summary
        enabled_augmentations = [
            name for name, config in request.augmentation_config.items()
            if isinstance(config, dict) and config.get("enabled", False)
        ]
        
        return {
            "sample_images": [
                {
                    "image_id": img.id,
                    "filename": img.filename,
                    "file_path": img.file_path
                }
                for img in images
            ],
            "enabled_augmentations": enabled_augmentations,
            "estimated_output_images": len(images) * request.images_per_original,
            "config_summary": get_config_summary(request.augmentation_config)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


async def run_augmentation_job(job_id: str, config: Dict[str, Any]):
    """Background task to run augmentation job"""
    # This would be implemented to actually process images
    # For now, it's a placeholder
    pass


def get_preset_description(preset_name: str) -> str:
    """Get description for augmentation preset"""
    descriptions = {
        "light": "Minimal augmentations for subtle variations. Good for high-quality datasets.",
        "medium": "Balanced augmentations for most use cases. Recommended starting point.",
        "heavy": "Aggressive augmentations for maximum data diversity. Use with small datasets.",
        "geometric_only": "Only geometric transformations (rotation, flip, crop, etc.).",
        "color_only": "Only color/brightness adjustments. Preserves object shapes.",
        "noise_blur": "Noise and blur effects to simulate real-world conditions."
    }
    return descriptions.get(preset_name, "Custom augmentation preset")


def get_config_summary(config: Dict[str, Any]) -> Dict[str, Any]:
    """Generate summary of augmentation configuration"""
    enabled_count = 0
    categories = {
        "geometric": 0,
        "color": 0,
        "noise_blur": 0,
        "weather": 0,
        "advanced": 0
    }
    
    geometric_augs = ["rotation", "flip", "shear", "perspective", "crop", "zoom"]
    color_augs = ["brightness", "contrast", "saturation", "hue", "gamma"]
    noise_blur_augs = ["gaussian_blur", "motion_blur", "gaussian_noise"]
    weather_augs = ["rain", "snow", "fog", "sun_flare", "shadow"]
    
    for name, aug_config in config.items():
        if isinstance(aug_config, dict) and aug_config.get("enabled", False):
            enabled_count += 1
            
            if name in geometric_augs:
                categories["geometric"] += 1
            elif name in color_augs:
                categories["color"] += 1
            elif name in noise_blur_augs:
                categories["noise_blur"] += 1
            elif name in weather_augs:
                categories["weather"] += 1
            else:
                categories["advanced"] += 1
    
    return {
        "total_enabled": enabled_count,
        "categories": categories,
        "intensity": "light" if enabled_count < 5 else "medium" if enabled_count < 10 else "heavy"
    }