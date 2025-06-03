"""
File upload and processing utilities
Handles image uploads, validation, and storage
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import cv2
from fastapi import UploadFile, HTTPException

from core.config import settings
from database.operations import ImageOperations, DatasetOperations
from database.database import SessionLocal


class FileHandler:
    """Handle file uploads and processing"""
    
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    
    def __init__(self):
        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    def validate_image_file(self, file: UploadFile) -> bool:
        """Validate uploaded image file"""
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            return False
        
        # Check file size (if available)
        if hasattr(file, 'size') and file.size > self.MAX_FILE_SIZE:
            return False
        
        return True
    
    def generate_unique_filename(self, original_filename: str, dataset_dir: Path) -> str:
        """Generate unique filename while preserving original name when possible"""
        # First try to use the original filename
        if not (dataset_dir / original_filename).exists():
            return original_filename
        
        # If original filename exists, add a counter
        file_stem = Path(original_filename).stem
        file_ext = Path(original_filename).suffix.lower()
        counter = 1
        
        while True:
            new_filename = f"{file_stem}_{counter}{file_ext}"
            if not (dataset_dir / new_filename).exists():
                return new_filename
            counter += 1
    
    def get_image_info(self, file_path: str) -> Dict[str, Any]:
        """Extract image metadata"""
        try:
            # Try with PIL first
            with Image.open(file_path) as img:
                width, height = img.size
                format_name = img.format.lower() if img.format else 'unknown'
            
            # Get file size
            file_size = os.path.getsize(file_path)
            
            return {
                'width': width,
                'height': height,
                'format': format_name,
                'file_size': file_size
            }
        except Exception as e:
            print(f"Error getting image info for {file_path}: {e}")
            return {
                'width': None,
                'height': None,
                'format': 'unknown',
                'file_size': os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
    
    async def save_uploaded_file(
        self, 
        file: UploadFile, 
        dataset_id: str,
        project_name: str = None,
        dataset_name: str = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Save uploaded file and return file path and metadata
        Returns: (file_path, image_info)
        """
        if not self.validate_image_file(file):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Create nested directory structure: Project/Dataset/
        if project_name and dataset_name:
            # Create nested structure: uploads/Project 1/Car Dataset/
            project_dir = Path(settings.UPLOAD_DIR) / project_name
            dataset_dir = project_dir / dataset_name
        elif project_name:
            # Fallback: use project name only
            dataset_dir = Path(settings.UPLOAD_DIR) / project_name
        else:
            # Fallback: use dataset_id
            dataset_dir = Path(settings.UPLOAD_DIR) / dataset_id
        
        dataset_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename (preserving original when possible)
        unique_filename = self.generate_unique_filename(file.filename, dataset_dir)
        
        # Save file
        file_path = dataset_dir / unique_filename
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Get image metadata
            image_info = self.get_image_info(str(file_path))
            
            return str(file_path), image_info
            
        except Exception as e:
            # Clean up file if something went wrong
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    async def upload_images_to_dataset(
        self,
        files: List[UploadFile],
        dataset_id: str,
        auto_label: bool = True,
        project_name: str = None,
        dataset_name: str = None
    ) -> Dict[str, Any]:
        """
        Upload multiple images to a dataset
        Returns upload results and statistics
        """
        db = SessionLocal()
        
        try:
            # Verify dataset exists
            dataset = DatasetOperations.get_dataset(db, dataset_id)
            if not dataset:
                raise HTTPException(status_code=404, detail="Dataset not found")
            
            results = {
                'total_files': len(files),
                'successful_uploads': 0,
                'failed_uploads': 0,
                'uploaded_images': [],
                'errors': []
            }
            
            for file in files:
                try:
                    # Save file
                    file_path, image_info = await self.save_uploaded_file(file, dataset_id, project_name, dataset_name)
                    
                    # Create database record
                    image_record = ImageOperations.create_image(
                        db=db,
                        filename=Path(file_path).name,
                        original_filename=file.filename,
                        file_path=file_path,
                        dataset_id=dataset_id,
                        width=image_info['width'],
                        height=image_info['height'],
                        file_size=image_info['file_size'],
                        format=image_info['format']
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
                    print(error_msg)
            
            # Update dataset statistics
            DatasetOperations.update_dataset_stats(db, dataset_id)
            
            return results
            
        finally:
            db.close()
    
    def delete_image_file(self, file_path: str) -> bool:
        """Delete image file from filesystem"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    
    def get_image_url(self, image_id: str) -> Optional[str]:
        """Get URL for serving an image"""
        db = SessionLocal()
        try:
            image = ImageOperations.get_image(db, image_id)
            if image and os.path.exists(image.file_path):
                # Return relative path for serving via FastAPI static files
                relative_path = os.path.relpath(image.file_path, settings.UPLOAD_DIR)
                return f"/uploads/{relative_path}"
            return None
        finally:
            db.close()
    
    def rename_dataset_folder(self, project_name: str, old_dataset_name: str, new_dataset_name: str) -> bool:
        """Rename dataset folder when dataset name is updated"""
        try:
            old_path = Path(settings.UPLOAD_DIR) / project_name / old_dataset_name
            new_path = Path(settings.UPLOAD_DIR) / project_name / new_dataset_name
            
            # Check if old folder exists
            if not old_path.exists():
                print(f"Old dataset folder does not exist: {old_path}")
                return True  # Return True since there's nothing to rename
            
            # Check if new folder already exists
            if new_path.exists():
                print(f"New dataset folder already exists: {new_path}")
                return False
            
            # Rename the folder
            old_path.rename(new_path)
            print(f"Renamed dataset folder from {old_path} to {new_path}")
            return True
            
        except Exception as e:
            print(f"Error renaming dataset folder from {old_dataset_name} to {new_dataset_name}: {e}")
            return False
    
    def cleanup_dataset_files_by_path(self, project_name: str, dataset_name: str) -> bool:
        """Delete dataset folder using project and dataset names"""
        try:
            dataset_dir = Path(settings.UPLOAD_DIR) / project_name / dataset_name
            if dataset_dir.exists():
                shutil.rmtree(dataset_dir)
                print(f"Deleted dataset folder: {dataset_dir}")
                return True
            else:
                print(f"Dataset folder not found: {dataset_dir}")
                return True  # Return True since there's nothing to clean up
        except Exception as e:
            print(f"Error cleaning up dataset folder {project_name}/{dataset_name}: {e}")
            return False

    def cleanup_dataset_files(self, dataset_id: str) -> bool:
        """Delete all files for a dataset (legacy method for dataset_id-based folders)"""
        try:
            dataset_dir = Path(settings.UPLOAD_DIR) / dataset_id
            if dataset_dir.exists():
                shutil.rmtree(dataset_dir)
                print(f"Deleted dataset folder: {dataset_dir}")
                return True
            else:
                print(f"Dataset folder not found: {dataset_dir}")
                return True  # Return True since there's nothing to clean up
        except Exception as e:
            print(f"Error cleaning up dataset {dataset_id}: {e}")
            return False


# Global file handler instance
file_handler = FileHandler()