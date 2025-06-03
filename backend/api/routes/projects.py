"""
API routes for project management
Organize datasets and models into projects with full database integration
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import shutil
import json
import uuid
from PIL import Image
import io

from database.database import get_db
from database.operations import ProjectOperations, DatasetOperations, ImageOperations, AnnotationOperations
from models.model_manager import model_manager

router = APIRouter()


class ProjectCreateRequest(BaseModel):
    """Request model for creating a new project"""
    name: str
    description: str = ""
    project_type: str = "Object Detection"
    default_model_id: Optional[str] = None
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45


class ProjectUpdateRequest(BaseModel):
    """Request model for updating a project"""
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[str] = None
    default_model_id: Optional[str] = None
    confidence_threshold: Optional[float] = None
    iou_threshold: Optional[float] = None


class ProjectResponse(BaseModel):
    """Response model for project data"""
    id: int
    name: str
    description: str
    project_type: str
    default_model_id: Optional[str]
    confidence_threshold: float
    iou_threshold: float
    created_at: datetime
    updated_at: datetime
    total_datasets: int = 0
    total_images: int = 0
    labeled_images: int = 0


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all projects with statistics"""
    try:
        projects = ProjectOperations.get_projects(db, skip=skip, limit=limit)
        
        project_responses = []
        for project in projects:
            # Get datasets for this project
            datasets = DatasetOperations.get_datasets_by_project(db, project.id)
            
            # Calculate statistics
            total_datasets = len(datasets)
            total_images = sum(dataset.total_images or 0 for dataset in datasets)
            labeled_images = sum(dataset.labeled_images or 0 for dataset in datasets)
            
            project_response = ProjectResponse(
                id=project.id,
                name=project.name,
                description=project.description,
                project_type=project.project_type,
                default_model_id=project.default_model_id,
                confidence_threshold=project.confidence_threshold,
                iou_threshold=project.iou_threshold,
                created_at=project.created_at,
                updated_at=project.updated_at,
                total_datasets=total_datasets,
                total_images=total_images,
                labeled_images=labeled_images
            )
            project_responses.append(project_response)
        
        return project_responses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get projects: {str(e)}")


@router.post("/", response_model=ProjectResponse)
async def create_project(
    request: ProjectCreateRequest, 
    db: Session = Depends(get_db)
):
    """Create a new project"""
    try:
        # Validate model_id if provided
        if request.default_model_id:
            model_info = model_manager.get_model_info(request.default_model_id)
            if not model_info:
                raise HTTPException(status_code=400, detail="Invalid model ID")
        
        # Create project
        project = ProjectOperations.create_project(
            db=db,
            name=request.name,
            description=request.description,
            project_type=request.project_type,
            default_model_id=request.default_model_id,
            confidence_threshold=request.confidence_threshold,
            iou_threshold=request.iou_threshold
        )
        
        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            project_type=project.project_type,
            default_model_id=project.default_model_id,
            confidence_threshold=project.confidence_threshold,
            iou_threshold=project.iou_threshold,
            created_at=project.created_at,
            updated_at=project.updated_at,
            total_datasets=0,
            total_images=0,
            labeled_images=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get a specific project with detailed statistics"""
    try:
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get datasets and statistics
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        total_datasets = len(datasets)
        total_images = sum(dataset.total_images for dataset in datasets)
        labeled_images = sum(dataset.labeled_images for dataset in datasets)
        
        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            project_type=project.project_type,
            default_model_id=project.default_model_id,
            confidence_threshold=project.confidence_threshold,
            iou_threshold=project.iou_threshold,
            created_at=project.created_at,
            updated_at=project.updated_at,
            total_datasets=total_datasets,
            total_images=total_images,
            labeled_images=labeled_images
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project: {str(e)}")


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str, 
    request: ProjectUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Update a project"""
    try:
        # Check if project exists
        existing_project = ProjectOperations.get_project(db, project_id)
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Validate model_id if provided
        if request.default_model_id:
            model_info = model_manager.get_model_info(request.default_model_id)
            if not model_info:
                raise HTTPException(status_code=400, detail="Invalid model ID")
        
        # Handle folder renaming if project name is being changed
        old_project_name = existing_project.name
        new_project_name = request.name if request.name is not None else old_project_name
        print(f"DEBUG: old_project_name='{old_project_name}', new_project_name='{new_project_name}'")
        
        # Prepare update data
        update_data = {}
        if request.name is not None:
            update_data['name'] = request.name
        if request.description is not None:
            update_data['description'] = request.description
        if request.project_type is not None:
            update_data['project_type'] = request.project_type
        if request.default_model_id is not None:
            update_data['default_model_id'] = request.default_model_id
        if request.confidence_threshold is not None:
            update_data['confidence_threshold'] = request.confidence_threshold
        if request.iou_threshold is not None:
            update_data['iou_threshold'] = request.iou_threshold
        
        # Update project in database first
        updated_project = ProjectOperations.update_project(db, project_id, **update_data)
        if not updated_project:
            raise HTTPException(status_code=500, detail="Failed to update project")
        
        # Handle folder renaming if project name changed
        if request.name is not None and old_project_name != new_project_name:
            try:
                old_folder_path = os.path.join("..", "uploads", old_project_name)
                new_folder_path = os.path.join("..", "uploads", new_project_name)
                print(f"DEBUG: Attempting to rename folder from '{old_folder_path}' to '{new_folder_path}'")
                print(f"DEBUG: old_folder_path exists: {os.path.exists(old_folder_path)}")
                print(f"DEBUG: new_folder_path exists: {os.path.exists(new_folder_path)}")
                
                # Only rename if old folder exists and new folder doesn't exist
                if os.path.exists(old_folder_path) and not os.path.exists(new_folder_path):
                    shutil.move(old_folder_path, new_folder_path)
                    print(f"Renamed project folder from '{old_folder_path}' to '{new_folder_path}'")
                elif os.path.exists(old_folder_path) and os.path.exists(new_folder_path):
                    print(f"Warning: Both old and new project folders exist. Manual cleanup may be needed.")
                else:
                    print(f"DEBUG: Folder rename skipped - old exists: {os.path.exists(old_folder_path)}, new exists: {os.path.exists(new_folder_path)}")
                    
            except Exception as folder_error:
                print(f"Warning: Failed to rename project folder: {str(folder_error)}")
                # Don't fail the entire operation if folder rename fails
        else:
            print(f"DEBUG: Folder rename skipped - name not changed or request.name is None")
        
        # Get statistics
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        total_datasets = len(datasets)
        total_images = sum(dataset.total_images for dataset in datasets)
        labeled_images = sum(dataset.labeled_images for dataset in datasets)
        
        return ProjectResponse(
            id=updated_project.id,
            name=updated_project.name,
            description=updated_project.description,
            project_type=updated_project.project_type,
            default_model_id=updated_project.default_model_id,
            confidence_threshold=updated_project.confidence_threshold,
            iou_threshold=updated_project.iou_threshold,
            created_at=updated_project.created_at,
            updated_at=updated_project.updated_at,
            total_datasets=total_datasets,
            total_images=total_images,
            labeled_images=labeled_images
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")


@router.delete("/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete a project and all its datasets"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Store project name for folder cleanup
        project_name = project.name
        
        # Delete project from database (cascades to datasets and images)
        success = ProjectOperations.delete_project(db, project_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete project from database")
        
        # Delete project upload folder
        try:
            project_folder_path = os.path.join("..", "uploads", project_name)
            if os.path.exists(project_folder_path):
                shutil.rmtree(project_folder_path)
                print(f"Deleted project folder: {project_folder_path}")
            else:
                print(f"Project folder not found: {project_folder_path}")
        except Exception as folder_error:
            print(f"Warning: Failed to delete project folder: {str(folder_error)}")
            # Don't fail the entire operation if folder deletion fails
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")


@router.get("/{project_id}/datasets")
async def get_project_datasets(project_id: str, db: Session = Depends(get_db)):
    """Get all datasets for a project"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get datasets
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        
        dataset_responses = []
        for dataset in datasets:
            dataset_response = {
                "id": dataset.id,
                "name": dataset.name,
                "description": dataset.description,
                "total_images": dataset.total_images,
                "labeled_images": dataset.labeled_images,
                "unlabeled_images": dataset.unlabeled_images,
                "auto_label_enabled": dataset.auto_label_enabled,
                "model_id": dataset.model_id,
                "created_at": dataset.created_at,
                "updated_at": dataset.updated_at
            }
            dataset_responses.append(dataset_response)
        
        return {
            "project_id": project_id,
            "datasets": dataset_responses,
            "total_datasets": len(dataset_responses)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project datasets: {str(e)}")


@router.get("/{project_id}/management")
async def get_project_management_data(project_id: str, db: Session = Depends(get_db)):
    """Get datasets organized by management status (Unassigned, Annotating, Dataset)"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get datasets
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        
        unassigned = []
        annotating = []
        completed = []
        
        for dataset in datasets:
            dataset_info = {
                "id": dataset.id,
                "name": dataset.name,
                "description": dataset.description,
                "total_images": dataset.total_images,
                "labeled_images": dataset.labeled_images,
                "unlabeled_images": dataset.unlabeled_images,
                "created_at": dataset.created_at,
                "updated_at": dataset.updated_at
            }
            
            # Categorize based on annotation status
            if dataset.labeled_images == 0:
                # No annotations yet - Unassigned
                unassigned.append(dataset_info)
            elif dataset.labeled_images < dataset.total_images:
                # Partially annotated - Annotating
                annotating.append(dataset_info)
            else:
                # Fully annotated - Dataset (completed)
                completed.append(dataset_info)
        
        return {
            "project_id": project_id,
            "unassigned": {
                "count": len(unassigned),
                "datasets": unassigned
            },
            "annotating": {
                "count": len(annotating),
                "datasets": annotating
            },
            "dataset": {
                "count": len(completed),
                "datasets": completed
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project management data: {str(e)}")


@router.put("/{project_id}/datasets/{dataset_id}/assign")
async def assign_dataset_to_annotating(project_id: str, dataset_id: str, db: Session = Depends(get_db)):
    """Assign a dataset to annotating status"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if dataset exists and belongs to project
        dataset = DatasetOperations.get_dataset(db, dataset_id)
        if not dataset or dataset.project_id != int(project_id):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Move physical files to annotating (from unassigned or dataset folder)
        project_folder = os.path.join("..", "uploads", "projects", project.name)
        unassigned_folder = os.path.join(project_folder, "unassigned", dataset.name)
        dataset_folder = os.path.join(project_folder, "dataset", dataset.name)
        annotating_folder = os.path.join(project_folder, "annotating", dataset.name)
        
        # Check if dataset is in unassigned folder
        if os.path.exists(unassigned_folder):
            # Create annotating directory if it doesn't exist
            os.makedirs(os.path.dirname(annotating_folder), exist_ok=True)
            
            # Move the entire dataset folder
            shutil.move(unassigned_folder, annotating_folder)
            print(f"Moved dataset folder: {unassigned_folder} -> {annotating_folder}")
            
            # Update file paths in database
            images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=10000)
            for image in images:
                old_path = image.file_path
                new_path = old_path.replace("/unassigned/", "/annotating/")
                ImageOperations.update_image_path(db, image.id, new_path)
                print(f"Updated image path: {old_path} -> {new_path}")
        
        # Check if dataset is in dataset folder (completed datasets)
        elif os.path.exists(dataset_folder):
            # Create annotating directory if it doesn't exist
            os.makedirs(os.path.dirname(annotating_folder), exist_ok=True)
            
            # Move the entire dataset folder
            shutil.move(dataset_folder, annotating_folder)
            print(f"Moved dataset folder: {dataset_folder} -> {annotating_folder}")
            
            # Update file paths in database
            images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=10000)
            for image in images:
                old_path = image.file_path
                new_path = old_path.replace("/dataset/", "/annotating/")
                ImageOperations.update_image_path(db, image.id, new_path)
                print(f"Updated image path: {old_path} -> {new_path}")
        
        # Update dataset to show it's being annotated
        # Handle both unassigned (labeled_images = 0) and completed (labeled_images = total_images) datasets
        if dataset.labeled_images == 0 and dataset.total_images > 0:
            # Moving from Unassigned to Annotating
            update_result = DatasetOperations.update_dataset(
                db, 
                dataset_id, 
                labeled_images=1,
                unlabeled_images=dataset.total_images - 1
            )
            
            if not update_result:
                raise HTTPException(status_code=500, detail="Failed to update dataset status")
            
            print(f"DEBUG: Dataset '{dataset.name}' assigned to annotating - labeled_images updated from 0 to 1")
        
        elif dataset.labeled_images == dataset.total_images and dataset.total_images > 0:
            # Moving from Completed to Annotating (set to partially annotated)
            update_result = DatasetOperations.update_dataset(
                db, 
                dataset_id, 
                labeled_images=dataset.total_images - 1,
                unlabeled_images=1
            )
            
            if not update_result:
                raise HTTPException(status_code=500, detail="Failed to update dataset status")
            
            print(f"DEBUG: Dataset '{dataset.name}' moved from completed to annotating - labeled_images updated from {dataset.total_images} to {dataset.total_images - 1}")
        
        return {
            "success": True,
            "message": f"Dataset '{dataset.name}' assigned to annotating",
            "dataset_id": dataset_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign dataset: {str(e)}")


@router.put("/{project_id}/datasets/{dataset_id}/rename")
async def rename_dataset(project_id: str, dataset_id: str, new_name: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """Rename a dataset"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if dataset exists and belongs to project
        dataset = DatasetOperations.get_dataset(db, dataset_id)
        if not dataset or dataset.project_id != int(project_id):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Store old name for folder renaming
        old_dataset_name = dataset.name
        
        # Update dataset name in database
        updated_dataset = DatasetOperations.update_dataset(db, dataset_id, name=new_name)
        if not updated_dataset:
            raise HTTPException(status_code=500, detail="Failed to update dataset name")
        
        # Handle folder renaming - check all workflow folders
        try:
            project_folder = os.path.join("..", "uploads", "projects", project.name)
            workflow_folders = ["unassigned", "annotating", "dataset"]
            
            old_folder_path = None
            new_folder_path = None
            workflow_type = None
            actual_folder_name = None
            
            # Find which workflow folder contains the dataset
            # First try with the old_dataset_name from database
            for workflow in workflow_folders:
                potential_old_path = os.path.join(project_folder, workflow, old_dataset_name)
                if os.path.exists(potential_old_path):
                    old_folder_path = potential_old_path
                    new_folder_path = os.path.join(project_folder, workflow, new_name)
                    workflow_type = workflow
                    actual_folder_name = old_dataset_name
                    break
            
            # If not found, search for any folder that might belong to this dataset
            # This handles cases where database and folder names are out of sync
            if not old_folder_path:
                for workflow in workflow_folders:
                    workflow_path = os.path.join(project_folder, workflow)
                    if os.path.exists(workflow_path):
                        for folder_name in os.listdir(workflow_path):
                            folder_path = os.path.join(workflow_path, folder_name)
                            if os.path.isdir(folder_path):
                                # Check if this folder contains images from our dataset
                                images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=1)
                                if images:
                                    # Check if the image path contains this folder name
                                    if f"/{folder_name}/" in images[0].file_path:
                                        old_folder_path = folder_path
                                        new_folder_path = os.path.join(project_folder, workflow, new_name)
                                        workflow_type = workflow
                                        actual_folder_name = folder_name
                                        print(f"DEBUG: Found dataset folder by image path: {folder_path}")
                                        break
                    if old_folder_path:
                        break
            
            print(f"DEBUG: Attempting to rename dataset folder from '{old_folder_path}' to '{new_folder_path}'")
            print(f"DEBUG: Found in workflow: {workflow_type}")
            print(f"DEBUG: Actual folder name: {actual_folder_name}")
            print(f"DEBUG: old_folder_path exists: {os.path.exists(old_folder_path) if old_folder_path else False}")
            print(f"DEBUG: new_folder_path exists: {os.path.exists(new_folder_path) if new_folder_path else False}")
            
            # Only rename if old folder exists and new folder doesn't exist
            if old_folder_path and os.path.exists(old_folder_path) and not os.path.exists(new_folder_path):
                shutil.move(old_folder_path, new_folder_path)
                print(f"Renamed dataset folder from '{old_folder_path}' to '{new_folder_path}'")
                
                # Update file paths in database using the actual folder name
                images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=10000)
                for image in images:
                    old_path = image.file_path
                    # Use actual_folder_name instead of old_dataset_name for replacement
                    new_path = old_path.replace(f"/{actual_folder_name}/", f"/{new_name}/")
                    ImageOperations.update_image_path(db, image.id, new_path)
                    print(f"Updated image path: {old_path} -> {new_path}")
                    
            elif old_folder_path and os.path.exists(old_folder_path) and os.path.exists(new_folder_path):
                print(f"Warning: Both old and new dataset folders exist. Manual cleanup may be needed.")
            else:
                print(f"DEBUG: Dataset folder rename skipped - old exists: {os.path.exists(old_folder_path) if old_folder_path else False}, new exists: {os.path.exists(new_folder_path) if new_folder_path else False}")
                
        except Exception as folder_error:
            print(f"Warning: Failed to rename dataset folder: {str(folder_error)}")
            # Don't fail the entire operation if folder rename fails
        
        return {
            "success": True,
            "message": f"Dataset renamed to '{new_name}'",
            "dataset": {
                "id": updated_dataset.id,
                "name": updated_dataset.name,
                "description": updated_dataset.description,
                "total_images": updated_dataset.total_images,
                "labeled_images": updated_dataset.labeled_images,
                "unlabeled_images": updated_dataset.unlabeled_images,
                "created_at": updated_dataset.created_at,
                "updated_at": updated_dataset.updated_at
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rename dataset: {str(e)}")


@router.delete("/{project_id}/datasets/{dataset_id}")
async def delete_dataset(project_id: str, dataset_id: str, db: Session = Depends(get_db)):
    """Delete a dataset and all its images"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if dataset exists and belongs to project
        dataset = DatasetOperations.get_dataset(db, dataset_id)
        if not dataset or dataset.project_id != int(project_id):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset_name = dataset.name
        
        # Delete dataset from database first (this should cascade to delete images)
        success = DatasetOperations.delete_dataset(db, dataset_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete dataset")
        
        # Delete dataset folder from all possible locations
        try:
            project_folder = os.path.join("..", "uploads", "projects", project.name)
            possible_locations = ["unassigned", "annotating", "dataset"]
            
            for location in possible_locations:
                dataset_folder_path = os.path.join(project_folder, location, dataset_name)
                print(f"DEBUG: Checking dataset folder: '{dataset_folder_path}'")
                
                if os.path.exists(dataset_folder_path):
                    shutil.rmtree(dataset_folder_path)
                    print(f"Deleted dataset folder: {dataset_folder_path}")
                    break
            else:
                print(f"DEBUG: Dataset folder '{dataset_name}' not found in any location")
                
        except Exception as folder_error:
            print(f"Warning: Failed to delete dataset folder: {str(folder_error)}")
            # Don't fail the entire operation if folder deletion fails
        
        return {
            "success": True,
            "message": f"Dataset '{dataset_name}' deleted successfully",
            "dataset_id": dataset_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete dataset: {str(e)}")


@router.delete("/{project_id}/clear-data")
async def clear_project_data(project_id: str, db: Session = Depends(get_db)):
    """Clear all data (datasets and images) from a project"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all datasets for this project
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        
        # Delete all datasets and their images
        for dataset in datasets:
            try:
                # Delete dataset from database (this should cascade to delete images)
                DatasetOperations.delete_dataset(db, str(dataset.id))
                
                # Delete dataset folder
                dataset_folder_path = os.path.join("..", "uploads", project.name, dataset.name)
                if os.path.exists(dataset_folder_path):
                    shutil.rmtree(dataset_folder_path)
                    print(f"Deleted dataset folder: {dataset_folder_path}")
                    
            except Exception as dataset_error:
                print(f"Warning: Failed to delete dataset {dataset.name}: {str(dataset_error)}")
                # Continue with other datasets
        
        # Also delete any loose images in the project folder
        try:
            project_folder_path = os.path.join("..", "uploads", project.name)
            if os.path.exists(project_folder_path):
                # Remove all files and subdirectories, then recreate the empty folder
                shutil.rmtree(project_folder_path)
                os.makedirs(project_folder_path, exist_ok=True)
                print(f"Cleared project folder: {project_folder_path}")
        except Exception as folder_error:
            print(f"Warning: Failed to clear project folder: {str(folder_error)}")
        
        return {
            "success": True,
            "message": f"All data cleared from project '{project.name}'",
            "project_id": project_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear project data: {str(e)}")


@router.post("/{project_id}/duplicate", response_model=ProjectResponse)
async def duplicate_project(project_id: str, db: Session = Depends(get_db)):
    """Duplicate a project with all its datasets, images, and annotations"""
    try:
        # Check if source project exists
        source_project = ProjectOperations.get_project(db, project_id)
        if not source_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create new project with copied metadata
        new_project_name = f"{source_project.name} (Copy)"
        new_project = ProjectOperations.create_project(
            db=db,
            name=new_project_name,
            description=source_project.description,
            project_type=source_project.project_type,
            default_model_id=source_project.default_model_id,
            confidence_threshold=source_project.confidence_threshold,
            iou_threshold=source_project.iou_threshold
        )
        
        # Create new project folder
        source_project_folder = os.path.join("..", "uploads", source_project.name)
        new_project_folder = os.path.join("..", "uploads", new_project_name)
        os.makedirs(new_project_folder, exist_ok=True)
        
        # Copy all files from source project folder to new project folder
        try:
            if os.path.exists(source_project_folder):
                # Copy all files directly in the project folder (like Medical Image project)
                for item in os.listdir(source_project_folder):
                    source_item_path = os.path.join(source_project_folder, item)
                    new_item_path = os.path.join(new_project_folder, item)
                    
                    if os.path.isfile(source_item_path):
                        # Copy individual files (images)
                        shutil.copy2(source_item_path, new_item_path)
                        print(f"Copied file: {source_item_path} -> {new_item_path}")
                    elif os.path.isdir(source_item_path):
                        # Copy dataset folders (like Project 1, Project 2)
                        shutil.copytree(source_item_path, new_item_path)
                        print(f"Copied folder: {source_item_path} -> {new_item_path}")
                        
                print(f"Successfully copied all content from '{source_project_folder}' to '{new_project_folder}'")
        except Exception as folder_error:
            print(f"Warning: Failed to copy project folder content: {str(folder_error)}")
        
        # Get all datasets from source project
        source_datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        
        # Copy each dataset with its images and annotations
        for source_dataset in source_datasets:
            # Create new dataset
            new_dataset = DatasetOperations.create_dataset(
                db=db,
                name=f"{source_dataset.name} (Copy)",
                description=source_dataset.description,
                project_id=new_project.id,
                auto_label_enabled=source_dataset.auto_label_enabled,
                model_id=source_dataset.model_id
            )
            
            # Copy all images and their annotations from source dataset
            source_images = ImageOperations.get_images_by_dataset(db, source_dataset.id, skip=0, limit=10000)
            for source_image in source_images:
                # Update file path for the new project
                new_file_path = source_image.file_path.replace(source_project.name, new_project_name)
                if source_dataset.name in source_image.file_path:
                    new_file_path = new_file_path.replace(source_dataset.name, new_dataset.name)
                
                # Create new image record
                new_image = ImageOperations.create_image(
                    db=db,
                    filename=source_image.filename,
                    original_filename=source_image.original_filename,
                    file_path=new_file_path,
                    dataset_id=new_dataset.id,
                    width=source_image.width,
                    height=source_image.height,
                    file_size=source_image.file_size,
                    format=source_image.format
                )
                
                # Copy annotations if they exist
                source_annotations = AnnotationOperations.get_annotations_by_image(db, source_image.id)
                for source_annotation in source_annotations:
                    AnnotationOperations.create_annotation(
                        db=db,
                        image_id=new_image.id,
                        class_name=source_annotation.class_name,
                        class_id=source_annotation.class_id,
                        x_min=source_annotation.x_min,
                        y_min=source_annotation.y_min,
                        x_max=source_annotation.x_max,
                        y_max=source_annotation.y_max,
                        confidence=source_annotation.confidence,
                        segmentation=source_annotation.segmentation,
                        is_auto_generated=source_annotation.is_auto_generated,
                        model_id=source_annotation.model_id
                    )
        
        # Get final statistics for the new project
        new_datasets = DatasetOperations.get_datasets_by_project(db, new_project.id)
        total_datasets = len(new_datasets)
        total_images = sum(dataset.total_images for dataset in new_datasets)
        labeled_images = sum(dataset.labeled_images for dataset in new_datasets)
        
        return ProjectResponse(
            id=new_project.id,
            name=new_project.name,
            description=new_project.description,
            project_type=new_project.project_type,
            default_model_id=new_project.default_model_id,
            confidence_threshold=new_project.confidence_threshold,
            iou_threshold=new_project.iou_threshold,
            created_at=new_project.created_at,
            updated_at=new_project.updated_at,
            total_datasets=total_datasets,
            total_images=total_images,
            labeled_images=labeled_images
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to duplicate project: {str(e)}")


class ProjectMergeRequest(BaseModel):
    """Request model for merging projects"""
    target_project_id: str
    merged_project_name: str


@router.post("/{source_project_id}/merge", response_model=ProjectResponse)
async def merge_projects(
    source_project_id: str, 
    request: ProjectMergeRequest, 
    db: Session = Depends(get_db)
):
    """Merge two projects into a new project with all datasets, images, and annotations"""
    try:
        # Check if both source projects exist
        source_project = ProjectOperations.get_project(db, source_project_id)
        if not source_project:
            raise HTTPException(status_code=404, detail="Source project not found")
        
        target_project = ProjectOperations.get_project(db, request.target_project_id)
        if not target_project:
            raise HTTPException(status_code=404, detail="Target project not found")
        
        # Create new merged project
        merged_project = ProjectOperations.create_project(
            db=db,
            name=request.merged_project_name,
            description=f"Merged project from '{source_project.name}' and '{target_project.name}'",
            project_type=source_project.project_type,  # Use source project type
            default_model_id=source_project.default_model_id,
            confidence_threshold=source_project.confidence_threshold,
            iou_threshold=source_project.iou_threshold
        )
        
        # Create merged project folder
        merged_project_folder = os.path.join("..", "uploads", merged_project.name)
        os.makedirs(merged_project_folder, exist_ok=True)
        
        # Function to copy project content
        def copy_project_content(project, prefix=""):
            project_folder = os.path.join("..", "uploads", project.name)
            
            # Copy all files and folders from project
            try:
                if os.path.exists(project_folder):
                    for item in os.listdir(project_folder):
                        source_item_path = os.path.join(project_folder, item)
                        # Add prefix to avoid naming conflicts
                        new_item_name = f"{prefix}{item}" if prefix else item
                        merged_item_path = os.path.join(merged_project_folder, new_item_name)
                        
                        if os.path.isfile(source_item_path):
                            # Copy individual files (images)
                            shutil.copy2(source_item_path, merged_item_path)
                            print(f"Merged file: {source_item_path} -> {merged_item_path}")
                        elif os.path.isdir(source_item_path):
                            # Copy dataset folders
                            shutil.copytree(source_item_path, merged_item_path)
                            print(f"Merged folder: {source_item_path} -> {merged_item_path}")
                            
                    print(f"Successfully merged content from '{project_folder}' to '{merged_project_folder}'")
            except Exception as folder_error:
                print(f"Warning: Failed to merge project folder content: {str(folder_error)}")
        
        # Copy content from both projects
        copy_project_content(source_project, "")  # No prefix for source
        copy_project_content(target_project, f"{target_project.name}_")  # Prefix for target to avoid conflicts
        
        # Merge datasets from both projects
        projects_to_merge = [
            (source_project, source_project_id, ""),
            (target_project, request.target_project_id, f"{target_project.name}_")
        ]
        
        for project, project_id, prefix in projects_to_merge:
            # Get all datasets from project
            datasets = DatasetOperations.get_datasets_by_project(db, project_id)
            
            for dataset in datasets:
                # Create new dataset in merged project
                merged_dataset_name = f"{prefix}{dataset.name}" if prefix else dataset.name
                new_dataset = DatasetOperations.create_dataset(
                    db=db,
                    name=merged_dataset_name,
                    description=f"From {project.name}: {dataset.description}",
                    project_id=merged_project.id,
                    auto_label_enabled=dataset.auto_label_enabled,
                    model_id=dataset.model_id
                )
                
                # Copy all images and annotations from dataset
                images = ImageOperations.get_images_by_dataset(db, dataset.id, skip=0, limit=10000)
                for image in images:
                    # Update file path for the merged project
                    new_file_path = image.file_path.replace(project.name, merged_project.name)
                    if prefix and dataset.name in image.file_path:
                        new_file_path = new_file_path.replace(dataset.name, merged_dataset_name)
                    
                    # Create new image record
                    new_image = ImageOperations.create_image(
                        db=db,
                        filename=image.filename,
                        original_filename=image.original_filename,
                        file_path=new_file_path,
                        dataset_id=new_dataset.id,
                        width=image.width,
                        height=image.height,
                        file_size=image.file_size,
                        format=image.format
                    )
                    
                    # Copy annotations if they exist
                    annotations = AnnotationOperations.get_annotations_by_image(db, image.id)
                    for annotation in annotations:
                        AnnotationOperations.create_annotation(
                            db=db,
                            image_id=new_image.id,
                            class_name=annotation.class_name,
                            class_id=annotation.class_id,
                            x_min=annotation.x_min,
                            y_min=annotation.y_min,
                            x_max=annotation.x_max,
                            y_max=annotation.y_max,
                            confidence=annotation.confidence,
                            segmentation=annotation.segmentation,
                            is_auto_generated=annotation.is_auto_generated,
                            model_id=annotation.model_id
                        )
        
        # Get final statistics for the merged project
        merged_datasets = DatasetOperations.get_datasets_by_project(db, merged_project.id)
        total_datasets = len(merged_datasets)
        total_images = sum(dataset.total_images for dataset in merged_datasets)
        labeled_images = sum(dataset.labeled_images for dataset in merged_datasets)
        
        return ProjectResponse(
            id=merged_project.id,
            name=merged_project.name,
            description=merged_project.description,
            project_type=merged_project.project_type,
            default_model_id=merged_project.default_model_id,
            confidence_threshold=merged_project.confidence_threshold,
            iou_threshold=merged_project.iou_threshold,
            created_at=merged_project.created_at,
            updated_at=merged_project.updated_at,
            total_datasets=total_datasets,
            total_images=total_images,
            labeled_images=labeled_images
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to merge projects: {str(e)}")


@router.get("/{project_id}/stats")
async def get_project_stats(project_id: str, db: Session = Depends(get_db)):
    """Get detailed statistics for a project"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get datasets
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        
        # Calculate detailed statistics
        total_datasets = len(datasets)
        total_images = sum(dataset.total_images for dataset in datasets)
        labeled_images = sum(dataset.labeled_images for dataset in datasets)
        unlabeled_images = sum(dataset.unlabeled_images for dataset in datasets)
        
        # Calculate progress percentage
        progress_percentage = (labeled_images / total_images * 100) if total_images > 0 else 0
        
        # Dataset breakdown
        dataset_stats = []
        for dataset in datasets:
            dataset_progress = (dataset.labeled_images / dataset.total_images * 100) if dataset.total_images > 0 else 0
            dataset_stats.append({
                "id": dataset.id,
                "name": dataset.name,
                "total_images": dataset.total_images,
                "labeled_images": dataset.labeled_images,
                "progress_percentage": round(dataset_progress, 1)
            })
        
        return {
            "project_id": project_id,
            "project_name": project.name,
            "total_datasets": total_datasets,
            "total_images": total_images,
            "labeled_images": labeled_images,
            "unlabeled_images": unlabeled_images,
            "progress_percentage": round(progress_percentage, 1),
            "dataset_breakdown": dataset_stats,
            "default_model_id": project.default_model_id,
            "confidence_threshold": project.confidence_threshold,
            "iou_threshold": project.iou_threshold
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project stats: {str(e)}")


@router.post("/{project_id}/upload")
async def upload_images_to_project(
    project_id: str,
    file: UploadFile = File(...),
    batch_name: str = Form(None),
    tags: str = Form("[]"),
    db: Session = Depends(get_db)
):
    """Upload images directly to a project"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Parse tags
        try:
            tags_list = json.loads(tags) if tags else []
        except json.JSONDecodeError:
            tags_list = []
        
        # Determine dataset name: use selected tag (existing dataset) or batch_name (new dataset)
        if tags_list and len(tags_list) > 0:
            # User selected existing dataset from tags dropdown
            default_dataset_name = tags_list[0]  # Use first selected tag as dataset name
        else:
            # User entered new batch name or fallback to default
            default_dataset_name = batch_name or f"Uploaded Images - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Create project and dataset upload directories
        project_upload_dir = os.path.join("..", "uploads", "projects", project.name)
        dataset_upload_dir = os.path.join(project_upload_dir, "unassigned", default_dataset_name)
        os.makedirs(dataset_upload_dir, exist_ok=True)
        
        # Use original filename (sanitized)
        import re
        safe_filename = re.sub(r'[^\w\-_\.]', '_', file.filename)
        file_path = os.path.join(dataset_upload_dir, safe_filename)
        
        # Read and validate image
        contents = await file.read()
        try:
            image = Image.open(io.BytesIO(contents))
            width, height = image.size
            image_format = image.format
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Check if dataset with this name already exists
        existing_datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        target_dataset = None
        for dataset in existing_datasets:
            if dataset.name == default_dataset_name:
                target_dataset = dataset
                break
        
        # Create new dataset if not found
        if not target_dataset:
            target_dataset = DatasetOperations.create_dataset(
                db=db,
                name=default_dataset_name,
                description=f"Images uploaded to {project.name}",
                project_id=project_id
            )
        
        # Create image record in database
        image_record = ImageOperations.create_image(
            db=db,
            filename=safe_filename,
            original_filename=file.filename,
            file_path=file_path,
            dataset_id=target_dataset.id,
            width=width,
            height=height,
            file_size=len(contents),
            format=image_format
        )
        
        # Update dataset statistics
        DatasetOperations.update_dataset_stats(db, target_dataset.id)
        
        return {
            "success": True,
            "message": f"Successfully uploaded {file.filename}",
            "image_id": image_record.id,
            "dataset_id": target_dataset.id,
            "dataset_name": target_dataset.name,
            "file_path": file_path,
            "tags": tags_list,
            "batch_name": default_dataset_name,
            "image_info": {
                "width": width,
                "height": height,
                "format": image_format,
                "size": len(contents)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Clean up file if it was created
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@router.post("/{project_id}/upload-bulk")
async def upload_multiple_images_to_project(
    project_id: str,
    files: List[UploadFile] = File(...),
    batch_name: str = Form(None),
    tags: str = Form("[]"),
    db: Session = Depends(get_db)
):
    """Upload multiple images to a project"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Parse tags
        try:
            tags_list = json.loads(tags) if tags else []
        except json.JSONDecodeError:
            tags_list = []
        
        # Determine dataset name: use selected tag (existing dataset) or batch_name (new dataset)
        if tags_list and len(tags_list) > 0:
            # User selected existing dataset from tags dropdown
            default_dataset_name = tags_list[0]  # Use first selected tag as dataset name
        else:
            # User entered new batch name or fallback to default
            default_dataset_name = batch_name or f"Uploaded Images - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # Create project and dataset upload directories
        project_upload_dir = os.path.join("..", "uploads", "projects", project.name)
        dataset_upload_dir = os.path.join(project_upload_dir, "unassigned", default_dataset_name)
        os.makedirs(dataset_upload_dir, exist_ok=True)
        
        # Check if dataset with this name already exists
        existing_datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        target_dataset = None
        for dataset in existing_datasets:
            if dataset.name == default_dataset_name:
                target_dataset = dataset
                break
        
        # Create new dataset if not found
        if not target_dataset:
            target_dataset = DatasetOperations.create_dataset(
                db=db,
                name=default_dataset_name,
                description=f"Images uploaded to {project.name}",
                project_id=project_id
            )
        
        # Process all files
        results = {
            'total_files': len(files),
            'successful_uploads': 0,
            'failed_uploads': 0,
            'uploaded_images': [],
            'errors': []
        }
        
        for file in files:
            try:
                # Validate file type
                if not file.content_type or not file.content_type.startswith('image/'):
                    results['errors'].append(f"File {file.filename} is not an image")
                    results['failed_uploads'] += 1
                    continue
                
                # Use original filename (sanitized)
                import re
                safe_filename = re.sub(r'[^\w\-_\.]', '_', file.filename)
                file_path = os.path.join(dataset_upload_dir, safe_filename)
                
                # Read and validate image
                contents = await file.read()
                try:
                    image = Image.open(io.BytesIO(contents))
                    width, height = image.size
                    image_format = image.format
                except Exception as e:
                    results['errors'].append(f"Invalid image file {file.filename}: {str(e)}")
                    results['failed_uploads'] += 1
                    continue
                
                # Save file
                with open(file_path, "wb") as f:
                    f.write(contents)
                
                # Create image record in database
                image_record = ImageOperations.create_image(
                    db=db,
                    filename=safe_filename,
                    original_filename=file.filename,
                    file_path=file_path,
                    dataset_id=target_dataset.id,
                    width=width,
                    height=height,
                    file_size=len(contents),
                    format=image_format
                )
                
                results['uploaded_images'].append({
                    'id': image_record.id,
                    'filename': image_record.filename,
                    'original_filename': image_record.original_filename,
                    'width': image_record.width,
                    'height': image_record.height,
                    'file_size': image_record.file_size
                })
                
                results['successful_uploads'] += 1
                
            except Exception as e:
                error_msg = f"Failed to upload {file.filename}: {str(e)}"
                results['errors'].append(error_msg)
                results['failed_uploads'] += 1
        
        # Update dataset statistics
        DatasetOperations.update_dataset_stats(db, target_dataset.id)
        
        return {
            "success": True,
            "message": f"Successfully uploaded {results['successful_uploads']} of {results['total_files']} files",
            "dataset_id": target_dataset.id,
            "dataset_name": target_dataset.name,
            "tags": tags_list,
            "batch_name": default_dataset_name,
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload images: {str(e)}")


@router.get("/{project_id}/images")
async def get_project_images(
    project_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get images for a project with pagination"""
    try:
        # Check if project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all datasets for this project
        datasets = DatasetOperations.get_datasets_by_project(db, project_id)
        
        # Get images from all datasets
        all_images = []
        for dataset in datasets:
            images = ImageOperations.get_images_by_dataset(db, dataset.id)
            for image in images:
                all_images.append({
                    "id": image.id,
                    "filename": image.filename,
                    "original_filename": image.original_filename,
                    "file_path": image.file_path,
                    "dataset_id": image.dataset_id,
                    "dataset_name": dataset.name,
                    "width": image.width,
                    "height": image.height,
                    "file_size": image.file_size,
                    "format": image.format,
                    "created_at": image.created_at,
                    "updated_at": image.updated_at
                })
        
        # Apply pagination
        total_images = len(all_images)
        paginated_images = all_images[offset:offset + limit]
        
        return {
            "images": paginated_images,
            "total": total_images,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total_images
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project images: {str(e)}")


@router.put("/{project_id}/datasets/{dataset_id}/move-to-unassigned")
async def move_dataset_to_unassigned(
    project_id: str,
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Move a dataset from any workflow folder to unassigned status"""
    try:
        # Verify project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify dataset exists and belongs to project
        dataset = DatasetOperations.get_dataset(db, dataset_id)
        if not dataset or dataset.project_id != int(project_id):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Find the current location of the dataset folder
        project_folder = os.path.join("..", "uploads", "projects", project.name)
        unassigned_folder = os.path.join(project_folder, "unassigned", dataset.name)
        
        # Check all possible workflow folders for the dataset
        workflow_folders = ["annotating", "dataset", "unassigned"]
        current_folder = None
        current_workflow = None
        
        for workflow in workflow_folders:
            potential_folder = os.path.join(project_folder, workflow, dataset.name)
            if os.path.exists(potential_folder):
                current_folder = potential_folder
                current_workflow = workflow
                break
        
        # If dataset is not found in any workflow folder, try to find it by checking image paths
        if not current_folder:
            images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=1)
            if images:
                image_path = images[0].file_path
                # Extract the actual folder name from the image path
                for workflow in workflow_folders:
                    if f"/{workflow}/" in image_path:
                        # Extract the actual folder name from the path
                        path_parts = image_path.split(f"/{workflow}/")
                        if len(path_parts) > 1:
                            folder_name = path_parts[1].split('/')[0]
                            potential_folder = os.path.join(project_folder, workflow, folder_name)
                            if os.path.exists(potential_folder):
                                current_folder = potential_folder
                                current_workflow = workflow
                                break
        
        if not current_folder:
            raise HTTPException(status_code=404, detail=f"Dataset folder not found for '{dataset.name}'")
        
        # If already in unassigned, no need to move
        if current_workflow == "unassigned":
            return {"message": f"Dataset '{dataset.name}' is already in unassigned", "dataset": dataset}
        
        # Create unassigned directory if it doesn't exist
        os.makedirs(os.path.dirname(unassigned_folder), exist_ok=True)
        
        # Move the entire dataset folder to unassigned
        shutil.move(current_folder, unassigned_folder)
        print(f"Moved dataset folder: {current_folder} -> {unassigned_folder}")
        
        # Update file paths in database
        images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=10000)
        for image in images:
            old_path = image.file_path
            # Replace the workflow folder in the path
            new_path = old_path.replace(f"/{current_workflow}/", "/unassigned/")
            ImageOperations.update_image_path(db, image.id, new_path)
            print(f"Updated image path: {old_path} -> {new_path}")
        
        # Update dataset to unassigned status (labeled_images = 0)
        updated_dataset = DatasetOperations.update_dataset(
            db,
            dataset_id,
            labeled_images=0,
            unlabeled_images=dataset.total_images
        )
        
        return {"message": f"Dataset '{dataset.name}' moved to unassigned", "dataset": updated_dataset}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move dataset to unassigned: {str(e)}")


@router.put("/{project_id}/datasets/{dataset_id}/move-to-completed")
async def move_dataset_to_completed(
    project_id: str,
    dataset_id: str,
    db: Session = Depends(get_db)
):
    """Move a dataset from annotating to completed/dataset status"""
    try:
        # Verify project exists
        project = ProjectOperations.get_project(db, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify dataset exists and belongs to project
        dataset = DatasetOperations.get_dataset(db, dataset_id)
        if not dataset or dataset.project_id != int(project_id):
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Move physical files from annotating to dataset
        project_folder = os.path.join("..", "uploads", "projects", project.name)
        annotating_folder = os.path.join(project_folder, "annotating", dataset.name)
        dataset_folder = os.path.join(project_folder, "dataset", dataset.name)
        
        if os.path.exists(annotating_folder):
            # Create dataset directory if it doesn't exist
            os.makedirs(os.path.dirname(dataset_folder), exist_ok=True)
            
            # Move the entire dataset folder
            shutil.move(annotating_folder, dataset_folder)
            print(f"Moved dataset folder: {annotating_folder} -> {dataset_folder}")
            
            # Update file paths in database
            images = ImageOperations.get_images_by_dataset(db, dataset_id, skip=0, limit=10000)
            for image in images:
                old_path = image.file_path
                new_path = old_path.replace("/annotating/", "/dataset/")
                ImageOperations.update_image_path(db, image.id, new_path)
                print(f"Updated image path: {old_path} -> {new_path}")
        
        # Update dataset to completed status (labeled_images = total_images)
        updated_dataset = DatasetOperations.update_dataset(
            db,
            dataset_id,
            labeled_images=dataset.total_images,
            unlabeled_images=0
        )
        
        return {"message": f"Dataset '{dataset.name}' moved to completed", "dataset": updated_dataset}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move dataset to completed: {str(e)}")