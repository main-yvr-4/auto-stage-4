#!/usr/bin/env python3

import os
import sqlite3
import uuid
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import random

def create_medical_image(image_type, filename, size=(512, 512)):
    """Create a synthetic medical image"""
    img = Image.new('L', size, color=0)  # Grayscale image
    draw = ImageDraw.Draw(img)
    
    if image_type == "xray":
        # Create X-ray like image
        # Add ribcage-like structures
        for i in range(8):
            y = 100 + i * 40
            draw.arc([50, y, 450, y + 30], 0, 180, fill=80, width=3)
        
        # Add spine
        draw.line([250, 50, 250, 450], fill=120, width=8)
        
        # Add some random noise for texture
        for _ in range(1000):
            x, y = random.randint(0, size[0]-1), random.randint(0, size[1]-1)
            draw.point([x, y], fill=random.randint(20, 60))
            
    elif image_type == "mri":
        # Create MRI-like brain image
        # Brain outline
        draw.ellipse([100, 80, 400, 380], fill=100, outline=150, width=3)
        
        # Brain hemispheres
        draw.line([250, 80, 250, 380], fill=120, width=2)
        
        # Add some internal structures
        draw.ellipse([150, 150, 200, 200], fill=80)
        draw.ellipse([300, 150, 350, 200], fill=80)
        draw.ellipse([200, 250, 300, 320], fill=90)
        
    elif image_type == "ct":
        # Create CT scan-like image
        # Circular boundary (body outline)
        draw.ellipse([50, 50, 450, 450], fill=60, outline=100, width=2)
        
        # Internal organs simulation
        draw.ellipse([150, 150, 350, 350], fill=80)  # Main organ
        draw.ellipse([180, 180, 220, 220], fill=40)  # Cavity
        draw.ellipse([280, 180, 320, 220], fill=40)  # Cavity
        
        # Add some texture
        for _ in range(500):
            x, y = random.randint(50, 450), random.randint(50, 450)
            draw.point([x, y], fill=random.randint(40, 100))
    
    return img

def add_medical_images_to_project():
    """Add 3 medical test images to Medical Image Classification project"""
    
    # Project ID for Medical Image Classification
    project_id = 4
    project_name = "Medical Image Classification"
    
    # Create uploads directory if it doesn't exist
    uploads_dir = f"uploads/{project_name}"
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Medical image types and filenames
    medical_images = [
        ("xray", "chest_xray_sample.png", "Chest X-Ray Sample"),
        ("mri", "brain_mri_sample.png", "Brain MRI Sample"), 
        ("ct", "abdominal_ct_sample.png", "Abdominal CT Sample")
    ]
    
    # Connect to database
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    print(f"Adding medical images to project: {project_name}")
    
    for img_type, filename, description in medical_images:
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        
        # Create the medical image
        img = create_medical_image(img_type, filename)
        
        # Save image to uploads folder
        image_path = os.path.join(uploads_dir, filename)
        img.save(image_path)
        
        # Add to database
        cursor.execute('''
            INSERT INTO images (id, filename, project_id, upload_date, file_size, annotations)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            image_id,
            filename,
            project_id,
            datetime.now().isoformat(),
            os.path.getsize(image_path),
            '[]'  # Empty annotations initially
        ))
        
        print(f"✅ Added {description}: {filename}")
        print(f"   - Image ID: {image_id}")
        print(f"   - File size: {os.path.getsize(image_path)} bytes")
        print(f"   - Saved to: {image_path}")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Successfully added 3 medical images to '{project_name}' project!")
    print(f"📁 Images saved in: {uploads_dir}")

if __name__ == "__main__":
    add_medical_images_to_project()