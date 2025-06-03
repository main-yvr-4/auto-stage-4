"""
Analytics API endpoints for label analysis and dataset insights
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from database.database import get_db
from database import operations as crud
from database.models import Dataset, Image, Annotation, LabelAnalytics, DatasetSplit
from utils.augmentation_utils import LabelAnalyzer
from core.config import settings

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dataset/{dataset_id}/class-distribution")
async def get_class_distribution(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Get class distribution analysis for a dataset"""
    try:
        # Get dataset
        dataset = crud.get_dataset(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get all annotations for this dataset
        annotations = crud.get_annotations_by_dataset(db, dataset_id)
        
        # Convert to format expected by analyzer
        annotation_dicts = [
            {
                'id': ann.id,
                'image_id': ann.image_id,
                'class_name': ann.class_name,
                'confidence': ann.confidence
            }
            for ann in annotations
        ]
        
        # Analyze distribution
        analysis = LabelAnalyzer.analyze_class_distribution(annotation_dicts)
        
        # Store/update analytics in database
        existing_analytics = crud.get_label_analytics_by_dataset(db, dataset_id)
        if existing_analytics:
            crud.update_label_analytics(db, existing_analytics.id, analysis)
        else:
            crud.create_label_analytics(db, dataset_id, analysis)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing class distribution: {str(e)}")


@router.get("/dataset/{dataset_id}/split-analysis")
async def get_split_analysis(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Get analysis of train/val/test split distribution"""
    try:
        # Get dataset
        dataset = crud.get_dataset(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get images with their split assignments
        images = crud.get_images_by_dataset(db, dataset_id)
        annotations = crud.get_annotations_by_dataset(db, dataset_id)
        
        # Group images by split
        split_assignments = {
            'train': [img.id for img in images if img.split_type == 'train'],
            'val': [img.id for img in images if img.split_type == 'val'],
            'test': [img.id for img in images if img.split_type == 'test'],
            'unassigned': [img.id for img in images if img.split_type == 'unassigned']
        }
        
        # Convert annotations to format expected by analyzer
        annotation_dicts = [
            {
                'id': ann.id,
                'image_id': ann.image_id,
                'class_name': ann.class_name,
                'confidence': ann.confidence
            }
            for ann in annotations
        ]
        
        # Analyze split distribution
        analysis = LabelAnalyzer.analyze_split_distribution(annotation_dicts, split_assignments)
        
        # Add split counts
        analysis['split_counts'] = {
            split: len(img_ids) for split, img_ids in split_assignments.items()
        }
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing split distribution: {str(e)}")


@router.get("/dataset/{dataset_id}/imbalance-report")
async def get_imbalance_report(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Get comprehensive imbalance report with recommendations"""
    try:
        # Get class distribution
        class_analysis = await get_class_distribution(dataset_id, db)
        
        # Get split analysis
        split_analysis = await get_split_analysis(dataset_id, db)
        
        # Generate comprehensive recommendations
        recommendations = []
        
        # Class imbalance recommendations
        if class_analysis['imbalance_ratio'] > 5.0:
            recommendations.extend([
                {
                    "type": "critical",
                    "title": "Severe Class Imbalance Detected",
                    "description": f"Imbalance ratio: {class_analysis['imbalance_ratio']:.1f}:1",
                    "actions": [
                        "Apply data augmentation to minority classes",
                        "Collect more data for underrepresented classes",
                        "Use class weighting during training"
                    ]
                }
            ])
        elif class_analysis['imbalance_ratio'] > 3.0:
            recommendations.extend([
                {
                    "type": "warning",
                    "title": "Moderate Class Imbalance",
                    "description": f"Imbalance ratio: {class_analysis['imbalance_ratio']:.1f}:1",
                    "actions": [
                        "Consider data augmentation for minority classes",
                        "Monitor training performance carefully"
                    ]
                }
            ])
        
        # Split consistency recommendations
        if not split_analysis['consistent_splits']:
            recommendations.append({
                "type": "warning",
                "title": "Inconsistent Class Distribution Across Splits",
                "description": "Some classes are missing from certain splits",
                "actions": [
                    "Use stratified splitting to ensure all classes in each split",
                    "Manually reassign images to balance splits"
                ]
            })
        
        # Dataset size recommendations
        total_images = sum(split_analysis['split_counts'].values())
        if total_images < 100:
            recommendations.append({
                "type": "info",
                "title": "Small Dataset Size",
                "description": f"Only {total_images} images in dataset",
                "actions": [
                    "Consider collecting more data",
                    "Use aggressive data augmentation",
                    "Consider transfer learning"
                ]
            })
        
        return {
            "dataset_id": dataset_id,
            "class_analysis": class_analysis,
            "split_analysis": split_analysis,
            "recommendations": recommendations,
            "overall_health_score": calculate_dataset_health_score(class_analysis, split_analysis),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating imbalance report: {str(e)}")


@router.get("/dataset/{dataset_id}/labeling-progress")
async def get_labeling_progress(
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed labeling progress statistics"""
    try:
        # Get dataset
        dataset = crud.get_dataset(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Get all images
        images = crud.get_images_by_dataset(db, dataset_id)
        
        # Calculate statistics
        total_images = len(images)
        labeled_images = len([img for img in images if img.is_labeled])
        auto_labeled_images = len([img for img in images if img.is_auto_labeled])
        verified_images = len([img for img in images if img.is_verified])
        unlabeled_images = total_images - labeled_images
        
        # Split-wise progress
        split_progress = {}
        for split_type in ['train', 'val', 'test', 'unassigned']:
            split_images = [img for img in images if img.split_type == split_type]
            split_labeled = len([img for img in split_images if img.is_labeled])
            split_progress[split_type] = {
                'total': len(split_images),
                'labeled': split_labeled,
                'unlabeled': len(split_images) - split_labeled,
                'progress_percentage': (split_labeled / len(split_images) * 100) if split_images else 0
            }
        
        # Recent activity
        recent_images = sorted(images, key=lambda x: x.updated_at, reverse=True)[:10]
        recent_activity = [
            {
                'image_id': img.id,
                'filename': img.filename,
                'is_labeled': img.is_labeled,
                'is_verified': img.is_verified,
                'updated_at': img.updated_at.isoformat()
            }
            for img in recent_images
        ]
        
        return {
            "dataset_id": dataset_id,
            "total_images": total_images,
            "labeled_images": labeled_images,
            "unlabeled_images": unlabeled_images,
            "auto_labeled_images": auto_labeled_images,
            "verified_images": verified_images,
            "progress_percentage": (labeled_images / total_images * 100) if total_images > 0 else 0,
            "split_progress": split_progress,
            "recent_activity": recent_activity
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting labeling progress: {str(e)}")


def calculate_dataset_health_score(class_analysis: Dict, split_analysis: Dict) -> Dict[str, Any]:
    """Calculate overall dataset health score"""
    score = 100
    issues = []
    
    # Class balance (30% of score)
    if class_analysis['imbalance_ratio'] > 10:
        score -= 30
        issues.append("Severe class imbalance")
    elif class_analysis['imbalance_ratio'] > 5:
        score -= 20
        issues.append("High class imbalance")
    elif class_analysis['imbalance_ratio'] > 3:
        score -= 10
        issues.append("Moderate class imbalance")
    
    # Split consistency (25% of score)
    if not split_analysis['consistent_splits']:
        score -= 25
        issues.append("Inconsistent splits")
    
    # Dataset size (20% of score)
    total_annotations = class_analysis['total_annotations']
    if total_annotations < 100:
        score -= 20
        issues.append("Very small dataset")
    elif total_annotations < 500:
        score -= 10
        issues.append("Small dataset")
    
    # Class diversity (15% of score)
    if class_analysis['num_classes'] < 2:
        score -= 15
        issues.append("Single class dataset")
    elif class_analysis['normalized_entropy'] < 0.5:
        score -= 10
        issues.append("Low class diversity")
    
    # Entropy/distribution (10% of score)
    if class_analysis['gini_coefficient'] > 0.6:
        score -= 10
        issues.append("Highly uneven distribution")
    
    # Determine grade
    if score >= 90:
        grade = "A"
        status = "Excellent"
    elif score >= 80:
        grade = "B"
        status = "Good"
    elif score >= 70:
        grade = "C"
        status = "Fair"
    elif score >= 60:
        grade = "D"
        status = "Poor"
    else:
        grade = "F"
        status = "Critical"
    
    return {
        "score": max(0, score),
        "grade": grade,
        "status": status,
        "issues": issues
    }