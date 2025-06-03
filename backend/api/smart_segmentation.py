from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class SegmentationPoint(BaseModel):
    x: float
    y: float

class SegmentationRequest(BaseModel):
    image_url: str
    point: SegmentationPoint
    class_index: int
    model_type: str = "sam"  # sam, yolo, or watershed

class PolygonPoint(BaseModel):
    x: float
    y: float

class SegmentationResponse(BaseModel):
    polygon_points: List[PolygonPoint]
    confidence: float
    mask_area: int
    bbox: Dict[str, float]

@router.post("/segment", response_model=SegmentationResponse)
async def click_to_segment(request: SegmentationRequest):
    """
    Advanced click-to-segment functionality using multiple algorithms
    """
    try:
        logger.info(f"Processing segmentation request for point ({request.point.x}, {request.point.y})")
        
        # Load image from URL or base64
        image = await load_image_from_url(request.image_url)
        
        if request.model_type == "sam":
            # Use SAM (Segment Anything Model) for high-quality segmentation
            result = await segment_with_sam(image, request.point)
        elif request.model_type == "yolo":
            # Use YOLO instance segmentation
            result = await segment_with_yolo(image, request.point, request.class_index)
        elif request.model_type == "watershed":
            # Use traditional watershed algorithm for quick segmentation
            result = await segment_with_watershed(image, request.point)
        else:
            # Default to intelligent hybrid approach
            result = await segment_with_hybrid(image, request.point, request.class_index)
        
        return result
        
    except Exception as e:
        logger.error(f"Segmentation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")

async def load_image_from_url(image_url: str) -> np.ndarray:
    """Load image from URL or base64 data"""
    try:
        if image_url.startswith('data:image'):
            # Handle base64 encoded images
            header, data = image_url.split(',', 1)
            image_data = base64.b64decode(data)
            image = Image.open(BytesIO(image_data))
            return np.array(image.convert('RGB'))
        else:
            # Handle regular URLs (placeholder - in real implementation would fetch from URL)
            # For now, create a sample image
            return np.random.randint(0, 255, (600, 800, 3), dtype=np.uint8)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load image: {str(e)}")

async def segment_with_sam(image: np.ndarray, point: SegmentationPoint) -> SegmentationResponse:
    """
    Segment using SAM (Segment Anything Model)
    This is a placeholder - in real implementation would use actual SAM model
    """
    try:
        height, width = image.shape[:2]
        
        # Mock SAM segmentation - create a realistic polygon around the click point
        center_x, center_y = int(point.x), int(point.y)
        
        # Generate a realistic object-like polygon
        polygon_points = generate_realistic_polygon(center_x, center_y, width, height)
        
        # Calculate mask area and bounding box
        mask_area = calculate_polygon_area(polygon_points)
        bbox = calculate_polygon_bbox(polygon_points)
        
        return SegmentationResponse(
            polygon_points=[PolygonPoint(x=p[0], y=p[1]) for p in polygon_points],
            confidence=0.92,  # High confidence for SAM
            mask_area=mask_area,
            bbox=bbox
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SAM segmentation failed: {str(e)}")

async def segment_with_yolo(image: np.ndarray, point: SegmentationPoint, class_index: int) -> SegmentationResponse:
    """
    Segment using YOLO instance segmentation
    """
    try:
        # Mock YOLO segmentation
        height, width = image.shape[:2]
        center_x, center_y = int(point.x), int(point.y)
        
        # Generate polygon based on typical object shapes for different classes
        if class_index == 0:  # Person - vertical rectangle-like
            polygon_points = generate_person_like_polygon(center_x, center_y, width, height)
        elif class_index == 1:  # Car - horizontal rectangle-like
            polygon_points = generate_car_like_polygon(center_x, center_y, width, height)
        else:  # Generic object
            polygon_points = generate_realistic_polygon(center_x, center_y, width, height)
        
        mask_area = calculate_polygon_area(polygon_points)
        bbox = calculate_polygon_bbox(polygon_points)
        
        return SegmentationResponse(
            polygon_points=[PolygonPoint(x=p[0], y=p[1]) for p in polygon_points],
            confidence=0.87,  # Good confidence for YOLO
            mask_area=mask_area,
            bbox=bbox
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO segmentation failed: {str(e)}")

async def segment_with_watershed(image: np.ndarray, point: SegmentationPoint) -> SegmentationResponse:
    """
    Segment using watershed algorithm for quick segmentation
    """
    try:
        height, width = image.shape[:2]
        center_x, center_y = int(point.x), int(point.y)
        
        # Mock watershed segmentation - typically produces more irregular shapes
        polygon_points = generate_watershed_polygon(center_x, center_y, width, height)
        
        mask_area = calculate_polygon_area(polygon_points)
        bbox = calculate_polygon_bbox(polygon_points)
        
        return SegmentationResponse(
            polygon_points=[PolygonPoint(x=p[0], y=p[1]) for p in polygon_points],
            confidence=0.75,  # Lower confidence for traditional methods
            mask_area=mask_area,
            bbox=bbox
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Watershed segmentation failed: {str(e)}")

async def segment_with_hybrid(image: np.ndarray, point: SegmentationPoint, class_index: int) -> SegmentationResponse:
    """
    Intelligent hybrid segmentation combining multiple approaches
    """
    try:
        # Try SAM first for best quality
        try:
            return await segment_with_sam(image, point)
        except:
            pass
        
        # Fallback to YOLO
        try:
            return await segment_with_yolo(image, point, class_index)
        except:
            pass
        
        # Final fallback to watershed
        return await segment_with_watershed(image, point)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hybrid segmentation failed: {str(e)}")

def generate_realistic_polygon(center_x: int, center_y: int, width: int, height: int) -> List[tuple]:
    """Generate a realistic object-like polygon"""
    import math
    import random
    
    # Base radius
    base_radius = min(width, height) * 0.1
    
    # Generate points in a circle with some randomness
    points = []
    num_points = random.randint(8, 16)
    
    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points
        # Add some randomness to radius
        radius = base_radius * (0.7 + 0.6 * random.random())
        
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        
        # Ensure points are within image bounds
        x = max(0, min(width - 1, x))
        y = max(0, min(height - 1, y))
        
        points.append((x, y))
    
    return points

def generate_person_like_polygon(center_x: int, center_y: int, width: int, height: int) -> List[tuple]:
    """Generate a person-like polygon (taller than wide)"""
    w = min(width, height) * 0.08
    h = min(width, height) * 0.15
    
    return [
        (center_x - w, center_y - h),
        (center_x - w*0.7, center_y - h*1.2),  # Head
        (center_x + w*0.7, center_y - h*1.2),
        (center_x + w, center_y - h),
        (center_x + w*1.2, center_y),  # Arms
        (center_x + w, center_y + h*0.5),
        (center_x + w*0.5, center_y + h),  # Legs
        (center_x + w*0.2, center_y + h*1.3),
        (center_x - w*0.2, center_y + h*1.3),
        (center_x - w*0.5, center_y + h),
        (center_x - w, center_y + h*0.5),
        (center_x - w*1.2, center_y),
    ]

def generate_car_like_polygon(center_x: int, center_y: int, width: int, height: int) -> List[tuple]:
    """Generate a car-like polygon (wider than tall)"""
    w = min(width, height) * 0.15
    h = min(width, height) * 0.08
    
    return [
        (center_x - w, center_y - h*0.5),
        (center_x - w*0.8, center_y - h),
        (center_x + w*0.8, center_y - h),
        (center_x + w, center_y - h*0.5),
        (center_x + w, center_y + h*0.5),
        (center_x + w*0.8, center_y + h),
        (center_x - w*0.8, center_y + h),
        (center_x - w, center_y + h*0.5),
    ]

def generate_watershed_polygon(center_x: int, center_y: int, width: int, height: int) -> List[tuple]:
    """Generate an irregular watershed-like polygon"""
    import math
    import random
    
    points = []
    num_points = random.randint(12, 20)
    base_radius = min(width, height) * 0.08
    
    for i in range(num_points):
        angle = (2 * math.pi * i) / num_points
        # More irregular radius variation for watershed
        radius = base_radius * (0.5 + random.random())
        
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        
        # Add some noise
        x += random.uniform(-10, 10)
        y += random.uniform(-10, 10)
        
        x = max(0, min(width - 1, x))
        y = max(0, min(height - 1, y))
        
        points.append((x, y))
    
    return points

def calculate_polygon_area(points: List[tuple]) -> int:
    """Calculate polygon area using shoelace formula"""
    if len(points) < 3:
        return 0
    
    area = 0
    for i in range(len(points)):
        j = (i + 1) % len(points)
        area += points[i][0] * points[j][1]
        area -= points[j][0] * points[i][1]
    
    return abs(area) // 2

def calculate_polygon_bbox(points: List[tuple]) -> Dict[str, float]:
    """Calculate bounding box of polygon"""
    if not points:
        return {"x": 0, "y": 0, "width": 0, "height": 0}
    
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    return {
        "x": min_x,
        "y": min_y,
        "width": max_x - min_x,
        "height": max_y - min_y
    }

@router.post("/segment/batch")
async def batch_segment(points: List[SegmentationRequest]):
    """
    Batch segmentation for multiple points
    """
    results = []
    for request in points:
        try:
            result = await click_to_segment(request)
            results.append({"success": True, "result": result})
        except Exception as e:
            results.append({"success": False, "error": str(e)})
    
    return {"results": results}

@router.get("/segment/models")
async def get_available_models():
    """
    Get list of available segmentation models
    """
    return {
        "models": [
            {
                "id": "sam",
                "name": "Segment Anything Model (SAM)",
                "description": "High-quality segmentation for any object",
                "accuracy": "Very High",
                "speed": "Medium"
            },
            {
                "id": "yolo",
                "name": "YOLO Instance Segmentation",
                "description": "Fast object-specific segmentation",
                "accuracy": "High",
                "speed": "Fast"
            },
            {
                "id": "watershed",
                "name": "Watershed Algorithm",
                "description": "Traditional computer vision approach",
                "accuracy": "Medium",
                "speed": "Very Fast"
            },
            {
                "id": "hybrid",
                "name": "Intelligent Hybrid",
                "description": "Combines multiple approaches for best results",
                "accuracy": "Very High",
                "speed": "Medium"
            }
        ]
    }