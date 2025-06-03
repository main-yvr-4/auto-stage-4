#!/usr/bin/env python3
"""
Script to add 10 vehicle images (cars and bikes) to the Vehicle Detection System project
"""

import os
import requests
import json
import time
from pathlib import Path
import random

# Configuration
BACKEND_URL = "http://localhost:12000"
PROJECT_ID = 3  # Vehicle Detection System
DATASET_NAME = "Vehicle Images Dataset"
DATASET_DESCRIPTION = "Collection of car and bike images for vehicle detection training"

# Create directories
TEMP_DIR = Path("/tmp/vehicle_images")
TEMP_DIR.mkdir(exist_ok=True)

def create_sample_vehicle_images():
    """Create sample vehicle images using simple colored rectangles to simulate cars and bikes"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import random
    except ImportError:
        print("Installing required packages...")
        os.system("pip install Pillow")
        from PIL import Image, ImageDraw, ImageFont
        import random
    
    # Vehicle types and colors
    vehicle_types = ['car', 'bike', 'truck', 'bus', 'motorcycle']
    colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'silver', 'gray']
    
    images_created = []
    
    for i in range(10):
        # Create a 640x480 image
        img = Image.new('RGB', (640, 480), color='lightblue')
        draw = ImageDraw.Draw(img)
        
        # Choose random vehicle type and color
        vehicle_type = random.choice(vehicle_types)
        vehicle_color = random.choice(colors)
        
        # Draw a simple vehicle representation
        if vehicle_type in ['car', 'truck', 'bus']:
            # Draw car-like rectangle
            x1, y1 = random.randint(50, 200), random.randint(150, 250)
            x2, y2 = x1 + random.randint(150, 250), y1 + random.randint(80, 120)
            draw.rectangle([x1, y1, x2, y2], fill=vehicle_color, outline='black', width=2)
            
            # Add wheels
            wheel_radius = 15
            draw.ellipse([x1+20-wheel_radius, y2-wheel_radius, x1+20+wheel_radius, y2+wheel_radius], fill='black')
            draw.ellipse([x2-20-wheel_radius, y2-wheel_radius, x2-20+wheel_radius, y2+wheel_radius], fill='black')
            
        elif vehicle_type in ['bike', 'motorcycle']:
            # Draw bike-like shape
            x1, y1 = random.randint(100, 300), random.randint(200, 300)
            x2, y2 = x1 + random.randint(80, 120), y1 + random.randint(40, 60)
            draw.rectangle([x1, y1, x2, y2], fill=vehicle_color, outline='black', width=2)
            
            # Add wheels
            wheel_radius = 20
            draw.ellipse([x1-wheel_radius, y2-wheel_radius, x1+wheel_radius, y2+wheel_radius], fill='black')
            draw.ellipse([x2-wheel_radius, y2-wheel_radius, x2+wheel_radius, y2+wheel_radius], fill='black')
        
        # Add some background elements (road, buildings)
        # Road
        draw.rectangle([0, 400, 640, 480], fill='gray')
        
        # Buildings in background
        for j in range(3):
            bx1 = j * 200 + random.randint(0, 50)
            by1 = random.randint(50, 150)
            bx2 = bx1 + random.randint(80, 150)
            by2 = 400
            building_color = random.choice(['lightgray', 'beige', 'lightcoral'])
            draw.rectangle([bx1, by1, bx2, by2], fill=building_color, outline='darkgray')
        
        # Save image
        filename = f"vehicle_{i+1:03d}_{vehicle_type}_{vehicle_color}.jpg"
        filepath = TEMP_DIR / filename
        img.save(filepath, 'JPEG', quality=85)
        images_created.append(filepath)
        
        if (i + 1) % 5 == 0:
            print(f"Created {i + 1}/10 images...")
    
    print(f"Successfully created {len(images_created)} vehicle images")
    return images_created

def create_dataset():
    """Create a new dataset for vehicle images"""
    url = f"{BACKEND_URL}/api/v1/datasets/"
    
    data = {
        "name": DATASET_NAME,
        "description": DATASET_DESCRIPTION,
        "dataset_type": "object_detection",
        "project_id": str(PROJECT_ID)
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        dataset = response.json()
        print(f"Created dataset: {dataset['name']} (ID: {dataset['id']})")
        return dataset['id']
    else:
        print(f"Failed to create dataset: {response.status_code} - {response.text}")
        return None

def upload_images_to_dataset(dataset_id, image_paths):
    """Upload images to the dataset"""
    url = f"{BACKEND_URL}/api/v1/datasets/{dataset_id}/upload"
    
    uploaded_count = 0
    failed_count = 0
    
    for i, image_path in enumerate(image_paths):
        try:
            with open(image_path, 'rb') as f:
                files = {'files': (image_path.name, f, 'image/jpeg')}
                data = {'auto_label': 'true'}
                response = requests.post(url, files=files, data=data)
                
                if response.status_code == 200:
                    uploaded_count += 1
                    if (i + 1) % 5 == 0:
                        print(f"Uploaded {i + 1}/{len(image_paths)} images...")
                else:
                    failed_count += 1
                    print(f"Failed to upload {image_path.name}: {response.status_code} - {response.text}")
                    
        except Exception as e:
            failed_count += 1
            print(f"Error uploading {image_path.name}: {e}")
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.2)
    
    print(f"Upload complete: {uploaded_count} successful, {failed_count} failed")
    return uploaded_count

def main():
    print("🚗 Adding 10 vehicle images to Vehicle Detection System project...")
    print("=" * 60)
    
    # Step 1: Create sample vehicle images
    print("Step 1: Creating sample vehicle images...")
    image_paths = create_sample_vehicle_images()
    
    # Step 2: Create dataset
    print("\nStep 2: Creating dataset...")
    dataset_id = create_dataset()
    if not dataset_id:
        print("Failed to create dataset. Exiting.")
        return
    
    # Step 3: Upload images
    print("\nStep 3: Uploading images to dataset...")
    uploaded_count = upload_images_to_dataset(dataset_id, image_paths)
    
    # Step 4: Cleanup
    print("\nStep 4: Cleaning up temporary files...")
    for image_path in image_paths:
        try:
            image_path.unlink()
        except:
            pass
    
    print("=" * 60)
    print(f"✅ Successfully added {uploaded_count} vehicle images to the project!")
    print(f"Dataset ID: {dataset_id}")
    print(f"Project: Vehicle Detection System (ID: {PROJECT_ID})")
    
    # Verify the project now has images
    print("\nVerifying project status...")
    response = requests.get(f"{BACKEND_URL}/api/v1/projects/{PROJECT_ID}")
    if response.status_code == 200:
        project = response.json()
        print(f"Project now has {project['total_images']} images in {project['total_datasets']} datasets")

if __name__ == "__main__":
    main()