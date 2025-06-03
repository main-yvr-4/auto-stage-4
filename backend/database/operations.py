"""
Database operations for the Auto-Labeling Tool
CRUD operations for all models
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
from pathlib import Path

from .models import (
    Project, Dataset, Image, Annotation, 
    ModelUsage, ExportJob, AutoLabelJob,
    DataAugmentation, DatasetSplit, LabelAnalytics
)
from core.config import settings


class ProjectOperations:
    """CRUD operations for Project model"""
    
    @staticmethod
    def create_project(
        db: Session,
        name: str,
        description: str = "",
        project_type: str = "Object Detection",
        default_model_id: str = None,
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45
    ) -> Project:
        """Create a new project"""
        project = Project(
            name=name,
            description=description,
            project_type=project_type,
            default_model_id=default_model_id,
            confidence_threshold=confidence_threshold,
            iou_threshold=iou_threshold
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # Create project folder structure
        project_dir = settings.UPLOAD_DIR / "projects" / name
        for folder in ["unassigned", "annotating", "dataset"]:
            folder_path = project_dir / folder
            folder_path.mkdir(parents=True, exist_ok=True)
        
        return project
    
    @staticmethod
    def get_project(db: Session, project_id: str) -> Optional[Project]:
        """Get project by ID"""
        return db.query(Project).filter(Project.id == project_id).first()
    
    @staticmethod
    def get_projects(db: Session, skip: int = 0, limit: int = 100) -> List[Project]:
        """Get all projects with pagination"""
        return db.query(Project).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_project(db: Session, project_id: str, **kwargs) -> Optional[Project]:
        """Update project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            for key, value in kwargs.items():
                if hasattr(project, key):
                    setattr(project, key, value)
            project.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(project)
        return project
    
    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        """Delete project and all related data"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            db.delete(project)
            db.commit()
            return True
        return False


class DatasetOperations:
    """CRUD operations for Dataset model"""
    
    @staticmethod
    def create_dataset(
        db: Session,
        name: str,
        project_id: str,
        description: str = "",
        auto_label_enabled: bool = True,
        model_id: str = None
    ) -> Dataset:
        """Create a new dataset"""
        dataset = Dataset(
            name=name,
            project_id=project_id,
            description=description,
            auto_label_enabled=auto_label_enabled,
            model_id=model_id
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset
    
    @staticmethod
    def get_dataset(db: Session, dataset_id: str) -> Optional[Dataset]:
        """Get dataset by ID"""
        return db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    @staticmethod
    def get_datasets_by_project(db: Session, project_id: str) -> List[Dataset]:
        """Get all datasets for a project"""
        return db.query(Dataset).filter(Dataset.project_id == project_id).all()
    
    @staticmethod
    def get_all_datasets(db: Session, skip: int = 0, limit: int = 100) -> List[Dataset]:
        """Get all datasets with pagination"""
        return db.query(Dataset).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_dataset_stats(db: Session, dataset_id: str):
        """Update dataset statistics"""
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            total_images = db.query(func.count(Image.id)).filter(Image.dataset_id == dataset_id).scalar()
            labeled_images = db.query(func.count(Image.id)).filter(
                and_(Image.dataset_id == dataset_id, Image.is_labeled == True)
            ).scalar()
            
            dataset.total_images = total_images
            dataset.labeled_images = labeled_images
            dataset.unlabeled_images = total_images - labeled_images
            dataset.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(dataset)
        return dataset
    
    @staticmethod
    def update_dataset(
        db: Session,
        dataset_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        auto_label_enabled: Optional[bool] = None,
        model_id: Optional[str] = None,
        labeled_images: Optional[int] = None,
        unlabeled_images: Optional[int] = None,
        total_images: Optional[int] = None
    ) -> Optional[Dataset]:
        """Update dataset"""
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            if name is not None:
                dataset.name = name
            if description is not None:
                dataset.description = description
            if auto_label_enabled is not None:
                dataset.auto_label_enabled = auto_label_enabled
            if model_id is not None:
                dataset.model_id = model_id
            if labeled_images is not None:
                dataset.labeled_images = labeled_images
            if unlabeled_images is not None:
                dataset.unlabeled_images = unlabeled_images
            if total_images is not None:
                dataset.total_images = total_images
            
            dataset.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(dataset)
        return dataset
    
    @staticmethod
    def delete_dataset(db: Session, dataset_id: str) -> bool:
        """Delete dataset and all related data"""
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            db.delete(dataset)
            db.commit()
            return True
        return False


class ImageOperations:
    """CRUD operations for Image model"""
    
    @staticmethod
    def create_image(
        db: Session,
        filename: str,
        original_filename: str,
        file_path: str,
        dataset_id: str,
        width: int = None,
        height: int = None,
        file_size: int = None,
        format: str = None
    ) -> Image:
        """Create a new image record"""
        image = Image(
            filename=filename,
            original_filename=original_filename,
            file_path=file_path,
            dataset_id=dataset_id,
            width=width,
            height=height,
            file_size=file_size,
            format=format
        )
        db.add(image)
        db.commit()
        db.refresh(image)
        
        # Update dataset stats
        DatasetOperations.update_dataset_stats(db, dataset_id)
        return image
    
    @staticmethod
    def get_image(db: Session, image_id: str) -> Optional[Image]:
        """Get image by ID"""
        return db.query(Image).filter(Image.id == image_id).first()
    
    @staticmethod
    def get_images_by_dataset(
        db: Session, 
        dataset_id: str, 
        skip: int = 0, 
        limit: int = 100,
        labeled_only: bool = None
    ) -> List[Image]:
        """Get images for a dataset with optional filtering"""
        query = db.query(Image).filter(Image.dataset_id == dataset_id)
        
        if labeled_only is not None:
            query = query.filter(Image.is_labeled == labeled_only)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_image_status(
        db: Session, 
        image_id: str, 
        is_labeled: bool = None,
        is_auto_labeled: bool = None,
        is_verified: bool = None
    ) -> Optional[Image]:
        """Update image labeling status"""
        image = db.query(Image).filter(Image.id == image_id).first()
        if image:
            if is_labeled is not None:
                image.is_labeled = is_labeled
            if is_auto_labeled is not None:
                image.is_auto_labeled = is_auto_labeled
            if is_verified is not None:
                image.is_verified = is_verified
            
            image.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(image)
            
            # Update dataset stats
            DatasetOperations.update_dataset_stats(db, image.dataset_id)
        return image
    
    @staticmethod
    def update_image_split(db: Session, image_id: str, split_type: str) -> bool:
        """Update image split assignment"""
        image = db.query(Image).filter(Image.id == image_id).first()
        if image:
            image.split_type = split_type
            image.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_annotations_by_images(db: Session, image_ids: List[str]) -> List[Annotation]:
        """Get annotations for multiple images"""
        return db.query(Annotation).filter(Annotation.image_id.in_(image_ids)).all()
    
    @staticmethod
    def get_annotations_by_dataset(db: Session, dataset_id: str) -> List[Annotation]:
        """Get all annotations for a dataset"""
        return db.query(Annotation).join(Image).filter(Image.dataset_id == dataset_id).all()
    
    @staticmethod
    def update_image_path(db: Session, image_id: str, new_path: str) -> Optional[Image]:
        """Update image file path"""
        image = db.query(Image).filter(Image.id == image_id).first()
        if image:
            image.file_path = new_path
            image.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(image)
        return image


class AnnotationOperations:
    """CRUD operations for Annotation model"""
    
    @staticmethod
    def create_annotation(
        db: Session,
        image_id: str,
        class_name: str,
        class_id: int,
        x_min: float,
        y_min: float,
        x_max: float,
        y_max: float,
        confidence: float = 1.0,
        segmentation: List = None,
        is_auto_generated: bool = False,
        model_id: str = None
    ) -> Annotation:
        """Create a new annotation"""
        annotation = Annotation(
            image_id=image_id,
            class_name=class_name,
            class_id=class_id,
            x_min=x_min,
            y_min=y_min,
            x_max=x_max,
            y_max=y_max,
            confidence=confidence,
            segmentation=segmentation,
            is_auto_generated=is_auto_generated,
            model_id=model_id
        )
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        
        # Update image status
        ImageOperations.update_image_status(db, image_id, is_labeled=True)
        return annotation
    
    @staticmethod
    def get_annotations_by_image(db: Session, image_id: str) -> List[Annotation]:
        """Get all annotations for an image"""
        return db.query(Annotation).filter(Annotation.image_id == image_id).all()
    
    @staticmethod
    def delete_annotations_by_image(db: Session, image_id: str) -> int:
        """Delete all annotations for an image"""
        count = db.query(Annotation).filter(Annotation.image_id == image_id).count()
        db.query(Annotation).filter(Annotation.image_id == image_id).delete()
        db.commit()
        
        # Update image status
        ImageOperations.update_image_status(db, image_id, is_labeled=False)
        return count
    
    @staticmethod
    def update_annotation(db: Session, annotation_id: str, **kwargs) -> Optional[Annotation]:
        """Update annotation"""
        annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
        if annotation:
            for key, value in kwargs.items():
                if hasattr(annotation, key):
                    setattr(annotation, key, value)
            annotation.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(annotation)
        return annotation


class AutoLabelJobOperations:
    """CRUD operations for AutoLabelJob model"""
    
    @staticmethod
    def create_auto_label_job(
        db: Session,
        dataset_id: str,
        model_id: str,
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        overwrite_existing: bool = False
    ) -> AutoLabelJob:
        """Create a new auto-labeling job"""
        job = AutoLabelJob(
            dataset_id=dataset_id,
            model_id=model_id,
            confidence_threshold=confidence_threshold,
            iou_threshold=iou_threshold,
            overwrite_existing=overwrite_existing
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job
    
    @staticmethod
    def get_job(db: Session, job_id: str) -> Optional[AutoLabelJob]:
        """Get job by ID"""
        return db.query(AutoLabelJob).filter(AutoLabelJob.id == job_id).first()
    
    @staticmethod
    def update_job_progress(
        db: Session, 
        job_id: str, 
        status: str = None,
        progress: float = None,
        **kwargs
    ) -> Optional[AutoLabelJob]:
        """Update job progress and status"""
        job = db.query(AutoLabelJob).filter(AutoLabelJob.id == job_id).first()
        if job:
            if status:
                job.status = status
                if status == "processing" and not job.started_at:
                    job.started_at = datetime.utcnow()
                elif status in ["completed", "failed"]:
                    job.completed_at = datetime.utcnow()
            
            if progress is not None:
                job.progress = progress
            
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            
            db.commit()
            db.refresh(job)
        return job


class ModelUsageOperations:
    """CRUD operations for ModelUsage model"""
    
    @staticmethod
    def update_model_usage(
        db: Session,
        model_id: str,
        model_name: str,
        images_processed: int = 1,
        processing_time: float = 0.0,
        average_confidence: float = 0.0
    ):
        """Update or create model usage statistics"""
        usage = db.query(ModelUsage).filter(ModelUsage.model_id == model_id).first()
        
        if not usage:
            usage = ModelUsage(
                model_id=model_id,
                model_name=model_name,
                total_inferences=1,
                total_images_processed=images_processed,
                average_confidence=average_confidence,
                average_processing_time=processing_time
            )
            db.add(usage)
        else:
            # Update running averages
            total_inferences = usage.total_inferences + 1
            total_images = usage.total_images_processed + images_processed
            
            # Update averages
            usage.average_confidence = (
                (usage.average_confidence * usage.total_inferences + average_confidence) / 
                total_inferences
            )
            usage.average_processing_time = (
                (usage.average_processing_time * usage.total_inferences + processing_time) / 
                total_inferences
            )
            
            usage.total_inferences = total_inferences
            usage.total_images_processed = total_images
            usage.last_used = datetime.utcnow()
        
        db.commit()
        db.refresh(usage)
        return usage
    
    @staticmethod
    def get_model_usage_stats(db: Session) -> List[ModelUsage]:
        """Get usage statistics for all models"""
        return db.query(ModelUsage).order_by(desc(ModelUsage.last_used)).all()


class DataAugmentationOperations:
    """CRUD operations for DataAugmentation model"""
    
    @staticmethod
    def create_data_augmentation(db: Session, data: Dict[str, Any]) -> DataAugmentation:
        """Create a new data augmentation job"""
        augmentation = DataAugmentation(**data)
        db.add(augmentation)
        db.commit()
        db.refresh(augmentation)
        return augmentation
    
    @staticmethod
    def get_data_augmentation(db: Session, augmentation_id: str) -> Optional[DataAugmentation]:
        """Get data augmentation by ID"""
        return db.query(DataAugmentation).filter(DataAugmentation.id == augmentation_id).first()
    
    @staticmethod
    def get_data_augmentations_by_dataset(db: Session, dataset_id: str) -> List[DataAugmentation]:
        """Get all data augmentations for a dataset"""
        return db.query(DataAugmentation).filter(DataAugmentation.dataset_id == dataset_id).all()
    
    @staticmethod
    def update_data_augmentation(db: Session, augmentation_id: str, data: Dict[str, Any]) -> Optional[DataAugmentation]:
        """Update data augmentation job"""
        augmentation = db.query(DataAugmentation).filter(DataAugmentation.id == augmentation_id).first()
        if augmentation:
            for key, value in data.items():
                setattr(augmentation, key, value)
            db.commit()
            db.refresh(augmentation)
        return augmentation
    
    @staticmethod
    def delete_data_augmentation(db: Session, augmentation_id: str) -> bool:
        """Delete data augmentation job"""
        augmentation = db.query(DataAugmentation).filter(DataAugmentation.id == augmentation_id).first()
        if augmentation:
            db.delete(augmentation)
            db.commit()
            return True
        return False


class DatasetSplitOperations:
    """CRUD operations for DatasetSplit model"""
    
    @staticmethod
    def create_dataset_split(db: Session, data: Dict[str, Any]) -> DatasetSplit:
        """Create a new dataset split configuration"""
        split = DatasetSplit(**data)
        db.add(split)
        db.commit()
        db.refresh(split)
        return split
    
    @staticmethod
    def get_dataset_split_by_dataset(db: Session, dataset_id: str) -> Optional[DatasetSplit]:
        """Get dataset split configuration by dataset ID"""
        return db.query(DatasetSplit).filter(DatasetSplit.dataset_id == dataset_id).first()
    
    @staticmethod
    def update_dataset_split(db: Session, split_id: str, data: Dict[str, Any]) -> Optional[DatasetSplit]:
        """Update dataset split configuration"""
        split = db.query(DatasetSplit).filter(DatasetSplit.id == split_id).first()
        if split:
            for key, value in data.items():
                setattr(split, key, value)
            split.updated_at = datetime.utcnow()
            split.last_split_at = datetime.utcnow()
            db.commit()
            db.refresh(split)
        return split
    
    @staticmethod
    def delete_dataset_split(db: Session, split_id: str) -> bool:
        """Delete dataset split configuration"""
        split = db.query(DatasetSplit).filter(DatasetSplit.id == split_id).first()
        if split:
            db.delete(split)
            db.commit()
            return True
        return False


class LabelAnalyticsOperations:
    """CRUD operations for LabelAnalytics model"""
    
    @staticmethod
    def create_label_analytics(db: Session, dataset_id: str, analytics_data: Dict[str, Any]) -> LabelAnalytics:
        """Create new label analytics"""
        analytics = LabelAnalytics(
            dataset_id=dataset_id,
            class_distribution=analytics_data.get('class_distribution', {}),
            total_annotations=analytics_data.get('total_annotations', 0),
            num_classes=analytics_data.get('num_classes', 0),
            most_common_class=analytics_data.get('most_common_class'),
            most_common_count=analytics_data.get('most_common_count', 0),
            least_common_class=analytics_data.get('least_common_class'),
            least_common_count=analytics_data.get('least_common_count', 0),
            gini_coefficient=analytics_data.get('gini_coefficient', 0.0),
            entropy=analytics_data.get('entropy', 0.0),
            imbalance_ratio=analytics_data.get('imbalance_ratio', 0.0),
            is_balanced=analytics_data.get('is_balanced', True),
            needs_augmentation=analytics_data.get('needs_augmentation', False),
            recommended_techniques=analytics_data.get('recommendations', [])
        )
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
        return analytics
    
    @staticmethod
    def get_label_analytics_by_dataset(db: Session, dataset_id: str) -> Optional[LabelAnalytics]:
        """Get label analytics by dataset ID"""
        return db.query(LabelAnalytics).filter(LabelAnalytics.dataset_id == dataset_id).first()
    
    @staticmethod
    def update_label_analytics(db: Session, analytics_id: str, analytics_data: Dict[str, Any]) -> Optional[LabelAnalytics]:
        """Update label analytics"""
        analytics = db.query(LabelAnalytics).filter(LabelAnalytics.id == analytics_id).first()
        if analytics:
            analytics.class_distribution = analytics_data.get('class_distribution', analytics.class_distribution)
            analytics.total_annotations = analytics_data.get('total_annotations', analytics.total_annotations)
            analytics.num_classes = analytics_data.get('num_classes', analytics.num_classes)
            analytics.most_common_class = analytics_data.get('most_common_class', analytics.most_common_class)
            analytics.most_common_count = analytics_data.get('most_common_count', analytics.most_common_count)
            analytics.least_common_class = analytics_data.get('least_common_class', analytics.least_common_class)
            analytics.least_common_count = analytics_data.get('least_common_count', analytics.least_common_count)
            analytics.gini_coefficient = analytics_data.get('gini_coefficient', analytics.gini_coefficient)
            analytics.entropy = analytics_data.get('entropy', analytics.entropy)
            analytics.imbalance_ratio = analytics_data.get('imbalance_ratio', analytics.imbalance_ratio)
            analytics.is_balanced = analytics_data.get('is_balanced', analytics.is_balanced)
            analytics.needs_augmentation = analytics_data.get('needs_augmentation', analytics.needs_augmentation)
            analytics.recommended_techniques = analytics_data.get('recommendations', analytics.recommended_techniques)
            analytics.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(analytics)
        return analytics


# Additional helper functions for image operations


# Create convenience functions that match the API expectations
def create_data_augmentation(db: Session, data: Dict[str, Any]) -> DataAugmentation:
    return DataAugmentationOperations.create_data_augmentation(db, data)

def get_data_augmentation(db: Session, augmentation_id: str) -> Optional[DataAugmentation]:
    return DataAugmentationOperations.get_data_augmentation(db, augmentation_id)

def get_data_augmentations_by_dataset(db: Session, dataset_id: str) -> List[DataAugmentation]:
    return DataAugmentationOperations.get_data_augmentations_by_dataset(db, dataset_id)

def update_data_augmentation(db: Session, augmentation_id: str, data: Dict[str, Any]) -> Optional[DataAugmentation]:
    return DataAugmentationOperations.update_data_augmentation(db, augmentation_id, data)

def delete_data_augmentation(db: Session, augmentation_id: str) -> bool:
    return DataAugmentationOperations.delete_data_augmentation(db, augmentation_id)

def create_dataset_split(db: Session, data: Dict[str, Any]) -> DatasetSplit:
    return DatasetSplitOperations.create_dataset_split(db, data)

def get_dataset_split_by_dataset(db: Session, dataset_id: str) -> Optional[DatasetSplit]:
    return DatasetSplitOperations.get_dataset_split_by_dataset(db, dataset_id)

def update_dataset_split(db: Session, split_id: str, data: Dict[str, Any]) -> Optional[DatasetSplit]:
    return DatasetSplitOperations.update_dataset_split(db, split_id, data)

def create_label_analytics(db: Session, dataset_id: str, analytics_data: Dict[str, Any]) -> LabelAnalytics:
    return LabelAnalyticsOperations.create_label_analytics(db, dataset_id, analytics_data)

def get_label_analytics_by_dataset(db: Session, dataset_id: str) -> Optional[LabelAnalytics]:
    return LabelAnalyticsOperations.get_label_analytics_by_dataset(db, dataset_id)

def update_label_analytics(db: Session, analytics_id: str, analytics_data: Dict[str, Any]) -> Optional[LabelAnalytics]:
    return LabelAnalyticsOperations.update_label_analytics(db, analytics_id, analytics_data)

def update_image_split(db: Session, image_id: str, split_type: str) -> bool:
    return ImageOperations.update_image_split(db, image_id, split_type)

def get_annotations_by_images(db: Session, image_ids: List[str]) -> List[Annotation]:
    return ImageOperations.get_annotations_by_images(db, image_ids)

def get_annotations_by_dataset(db: Session, dataset_id: str) -> List[Annotation]:
    return ImageOperations.get_annotations_by_dataset(db, dataset_id)

# Convenience functions for existing operations (avoiding circular imports)
def get_dataset(db: Session, dataset_id: str):
    return DatasetOperations.get_dataset(db, dataset_id)

def get_images_by_dataset(db: Session, dataset_id: str, limit: Optional[int] = None):
    if limit:
        return db.query(Image).filter(Image.dataset_id == dataset_id).limit(limit).all()
    return db.query(Image).filter(Image.dataset_id == dataset_id).all()

def get_image(db: Session, image_id: str):
    return db.query(Image).filter(Image.id == image_id).first()

def get_annotations_by_image(db: Session, image_id: str):
    return db.query(Annotation).filter(Annotation.image_id == image_id).all()