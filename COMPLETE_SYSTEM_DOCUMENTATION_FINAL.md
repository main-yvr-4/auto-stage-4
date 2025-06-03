# 🚀 Auto-Labeling Tool - Complete System Documentation

## Table of Contents
1. [📁 Folder Structure Overview](#-folder-structure-overview)
2. [📄 Key Files Explained](#-key-files-explained)
3. [🔘 UI Elements & User Interactions](#-ui-elements--user-interactions)
4. [🔁 Data Flow Architecture](#-data-flow-architecture)
5. [⚙️ Backend API Routes](#️-backend-api-routes)
6. [🧱 Database Models](#-database-models)
7. [📐 Frontend Components](#-frontend-components)
8. [🧠 Tech Stack Summary](#-tech-stack-summary)
9. [🚀 Getting Started Guide](#-getting-started-guide)

---

## 📁 Folder Structure Overview

### **Root Directory (`/workspace/auto-stage-4/`)**
```
auto-stage-4/
├── frontend/           # React.js frontend application
├── backend/           # FastAPI backend application
├── models/            # AI model storage and configuration
├── uploads/           # User-uploaded images and files
├── datasets/          # Dataset storage directory
├── docs/             # Documentation files
├── scripts/          # Utility and setup scripts
├── test_images/      # Sample test datasets
├── static/           # Static file serving
├── universal_start.py # Cross-platform startup script
├── start_backend.bat  # Windows backend startup
├── start_frontend.bat # Windows frontend startup
├── start_backend.sh   # Unix backend startup
└── start_frontend.sh  # Unix frontend startup
```

### **Frontend Structure (`/frontend/`)**
```
frontend/
├── src/
│   ├── pages/              # Main application pages
│   │   ├── Dashboard.js           # System overview and quick access
│   │   ├── Projects.js            # Project management interface
│   │   ├── ProjectDetail.js       # Individual project details
│   │   ├── ProjectWorkspace.js    # Full-screen annotation workspace
│   │   ├── ManualLabeling.jsx     # Canvas-based manual annotation
│   │   ├── AnnotateLauncher.js    # Annotation workflow launcher
│   │   ├── AnnotateProgress.jsx   # Annotation progress tracking
│   │   └── ModelsModern.js        # AI model management
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.js              # Main navigation bar
│   │   ├── AdvancedAnnotationCanvas.js  # Advanced canvas tools
│   │   ├── EnhancedAnnotationCanvas.js  # Enhanced annotation features
│   │   ├── ManualAnnotationTools.js     # Manual annotation toolset
│   │   ├── SmartAnnotationInterface.js  # AI-assisted annotation
│   │   ├── DatasetManagement.js         # Dataset CRUD operations
│   │   ├── DatasetAnalytics.js          # Analytics and statistics
│   │   └── DataAugmentation.js          # Data augmentation tools
│   ├── services/           # API communication layer
│   │   └── api.js                 # Centralized API calls
│   └── utils/              # Utility functions
│       └── errorHandler.js        # Error handling utilities
├── public/             # Static assets
│   ├── index.html             # Main HTML template
│   └── favicon.ico            # Application icon
├── package.json        # Dependencies and scripts
└── package-lock.json   # Dependency lock file
```

### **Backend Structure (`/backend/`)**
```
backend/
├── api/                    # API route definitions
│   ├── routes/                    # Organized API endpoints
│   │   ├── projects.py           # Project management APIs
│   │   ├── datasets.py           # Dataset management APIs
│   │   ├── annotations.py        # Annotation CRUD APIs
│   │   ├── models.py             # AI model APIs
│   │   ├── export.py             # Data export APIs
│   │   ├── analytics.py          # Analytics APIs
│   │   └── augmentation.py       # Data augmentation APIs
│   ├── active_learning.py         # Active learning algorithms
│   └── smart_segmentation.py     # Smart segmentation features
├── core/                   # Core business logic
│   ├── auto_labeler.py           # Auto-labeling engine
│   ├── dataset_manager.py        # Dataset operations
│   ├── file_handler.py           # File upload/management
│   ├── config.py                 # Application configuration
│   └── active_learning.py        # Active learning core
├── database/               # Database layer
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── database.py               # Database connection
│   ├── operations.py             # Database operations
│   └── base.py                   # Base model definitions
├── models/                 # AI model management
│   ├── model_manager.py          # Model loading and inference
│   └── training/                 # Model training utilities
├── utils/                  # Utility functions
│   └── augmentation_utils.py     # Data augmentation utilities
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── requirements-cuda.txt   # CUDA-enabled dependencies
└── requirements-cpu.txt    # CPU-only dependencies
```

### **Models Directory (`/models/`)**
```
models/
├── pretrained/         # Pre-trained YOLO models
│   ├── yolo11n.pt             # YOLO11 Nano model
│   ├── yolo11s.pt             # YOLO11 Small model
│   ├── yolo11m.pt             # YOLO11 Medium model
│   └── yolo11l.pt             # YOLO11 Large model
├── custom/            # User-trained custom models
├── sam/               # Segment Anything Model files
├── yolo/              # YOLO model variants
└── models_config.json # Model configuration file
```

---

## 📄 Key Files Explained

### **🎯 Main Entry Points**

#### **`/backend/main.py`** - FastAPI Application Bootstrap
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Auto-Labeling Tool API",
    description="Computer Vision Annotation Platform",
    version="1.0.0"
)

# CORS configuration for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:12001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and exports
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API routes
from api.routes import projects, datasets, annotations, models, export
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["datasets"])
```

**Purpose**: Main FastAPI application setup and configuration
**Key Functions**:
- Initializes FastAPI app with CORS middleware
- Mounts static file serving (`/uploads`, `/static`)
- Includes all API route modules
- Sets up database initialization on startup
- Configures health check endpoints

#### **`/frontend/src/App.js`** - React Application Router
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectWorkspace from './pages/ProjectWorkspace';
import ManualLabeling from './pages/ManualLabeling';
import ModelsModern from './pages/ModelsModern';

const { Header, Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ padding: 0, background: '#001529' }}>
          <Navbar />
        </Header>
        <Content style={{ padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/workspace/:projectId" element={<ProjectWorkspace />} />
            <Route path="/annotate/:datasetId/manual" element={<ManualLabeling />} />
            <Route path="/models" element={<ModelsModern />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
```

**Purpose**: Main React application with routing configuration
**Key Functions**:
- Defines all application routes and navigation
- Implements layout structure (navbar + content)
- Handles full-screen workspace mode
- Manages route-based component rendering

### **🗄️ Database Layer**

#### **`/backend/database/models.py`** - Database Schema Definition
```python
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    # Primary fields
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_type = Column(String(50), default="Object Detection")
    
    # Configuration
    default_model_id = Column(String, nullable=True)
    confidence_threshold = Column(Float, default=0.5)
    iou_threshold = Column(Float, default=0.45)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"
    
    # Primary fields
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Statistics (auto-updated)
    total_images = Column(Integer, default=0)
    labeled_images = Column(Integer, default=0)
    unlabeled_images = Column(Integer, default=0)
    
    # Configuration
    auto_label_enabled = Column(Boolean, default=True)
    model_id = Column(String, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="datasets")
    images = relationship("Image", back_populates="dataset", cascade="all, delete-orphan")
```

**Purpose**: Defines all database tables and relationships using SQLAlchemy ORM
**Key Models**:
- `Project`: Top-level project organization
- `Dataset`: Image collections within projects
- `Image`: Individual image files with metadata
- `Annotation`: Bounding boxes and segmentation data
- `AutoLabelJob`: Auto-labeling task tracking
- `ExportJob`: Export operation tracking

### **🎨 Frontend Pages**

#### **`/frontend/src/pages/ManualLabeling.jsx`** - Canvas Annotation Interface
```javascript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Space, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import AdvancedAnnotationCanvas from '../components/AdvancedAnnotationCanvas';
import ManualAnnotationTools from '../components/ManualAnnotationTools';

const ManualLabeling = () => {
  const { datasetId } = useParams();
  const [currentImage, setCurrentImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [selectedTool, setSelectedTool] = useState('select');
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load dataset images
  useEffect(() => {
    fetchDatasetImages();
  }, [datasetId]);

  const fetchDatasetImages = async () => {
    try {
      const response = await fetch(`/api/v1/datasets/${datasetId}/images`);
      const data = await response.json();
      setImageList(data);
      if (data.length > 0) {
        loadImage(data[0]);
      }
    } catch (error) {
      message.error('Failed to load dataset images');
    }
  };

  const loadImage = async (imageData) => {
    setCurrentImage(imageData);
    // Load existing annotations
    try {
      const response = await fetch(`/api/v1/images/${imageData.id}/annotations`);
      const annotations = await response.json();
      setAnnotations(annotations);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, imageList.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    setCurrentIndex(newIndex);
    loadImage(imageList[newIndex]);
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Tool Palette */}
      <div style={{ width: '200px', padding: '16px', borderRight: '1px solid #f0f0f0' }}>
        <ManualAnnotationTools 
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
        />
      </div>
      
      {/* Main Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Controls */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Button 
              icon={<LeftOutlined />} 
              onClick={() => navigateImage('prev')}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <span>{currentIndex + 1} / {imageList.length}</span>
            <Button 
              icon={<RightOutlined />} 
              onClick={() => navigateImage('next')}
              disabled={currentIndex === imageList.length - 1}
            >
              Next
            </Button>
          </Space>
        </div>
        
        {/* Canvas */}
        <div style={{ flex: 1 }}>
          {currentImage && (
            <AdvancedAnnotationCanvas
              imageUrl={`/uploads/${currentImage.file_path}`}
              annotations={annotations}
              selectedTool={selectedTool}
              onAnnotationCreate={(annotation) => {
                // Save annotation to backend
                saveAnnotation(annotation);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualLabeling;
```

**Purpose**: Manual annotation interface with drawing tools
**Key Features**:
- Konva-based canvas for image annotation
- Multiple annotation tools (bbox, polygon, smart polygon)
- Image navigation (next/previous)
- Annotation saving and management
- Zoom, pan, and selection tools

---

## 🔘 UI Elements & User Interactions

### **📊 Dashboard Page (`/`)**
**UI Elements:**
- **Quick Stats Cards**: Project count, dataset count, total images, labeled images
- **Recent Activity List**: Latest projects and annotations with timestamps
- **Quick Action Buttons**: "Create Project", "Upload Dataset", "View Models"
- **Progress Charts**: Overall annotation progress visualization

**User Interactions:**
1. **Click "Create Project"** → Opens project creation modal
   ```
   Frontend: Modal opens → User fills form → Submit button clicked
   ↓
   API Call: POST /api/v1/projects with project data
   ↓
   Backend: Validate data → Create project record in database
   ↓
   Database: INSERT INTO projects table
   ↓
   Response: Return project data → Update dashboard stats
   ```

2. **Click Project Card** → Navigate to project details
   ```
   Frontend: React Router navigation to /projects/{id}
   ↓
   ProjectDetail component loads → Fetch project data
   ↓
   API Call: GET /api/v1/projects/{id}
   ↓
   Backend: Query project with datasets and statistics
   ↓
   Response: Project details → Render project page
   ```

### **📁 Projects Page (`/projects`)**
**UI Elements:**
- **"+ Create Project" Button**: Primary action button with icon
- **Project Cards**: Grid layout with project thumbnails and info
- **Search/Filter Bar**: Real-time project filtering
- **Sort Options**: Sort by name, date, progress
- **Action Dropdown**: Edit, Delete, View, Export options per project

**User Interactions:**
1. **Click "Create Project"**:
   ```
   Frontend: Modal opens with form fields
   ↓
   User Input: Name, Description, Type, Model Settings
   ↓
   Form Validation: Check required fields
   ↓
   API Call: POST /api/v1/projects
   ↓
   Backend: Create project → Generate unique ID
   ↓
   Database: INSERT project record
   ↓
   Response: Success → Close modal → Refresh project list
   ```

2. **Click "View Project"**:
   ```
   Frontend: Navigate to /projects/{id}
   ↓
   Load ProjectDetail component
   ↓
   API Calls: 
     - GET /api/v1/projects/{id} (project details)
     - GET /api/v1/datasets?project_id={id} (datasets)
   ↓
   Backend: Query database with joins
   ↓
   Response: Render project with datasets and statistics
   ```

3. **Click "Delete Project"**:
   ```
   Frontend: Confirmation modal → "Are you sure?"
   ↓
   User Confirms → API Call: DELETE /api/v1/projects/{id}
   ↓
   Backend: Cascade delete (datasets, images, annotations)
   ↓
   File System: Remove uploaded images
   ↓
   Database: DELETE CASCADE operations
   ↓
   Response: Success → Remove project from UI
   ```

### **🎨 Manual Labeling Interface (`/annotate/{datasetId}/manual`)**
**UI Elements:**
- **Tool Palette**: Select, BBox, Polygon, Smart Polygon, Eraser tools
- **Canvas Area**: Konva-based drawing surface with zoom/pan
- **Navigation Controls**: Previous/Next buttons with keyboard shortcuts
- **Zoom Controls**: Zoom in/out, fit to screen, actual size
- **Label List**: Current annotations sidebar with edit/delete options
- **Save Button**: Save annotations with auto-save option
- **Progress Indicator**: Current image number and total count

**User Interactions:**
1. **Click "Next Image" Button**:
   ```
   Frontend: Get current index → Calculate next image ID
   ↓
   Update URL: /annotate/{datasetId}/manual?imageId={nextId}
   ↓
   useEffect triggers → API Call: GET /api/v1/images/{nextId}
   ↓
   Backend: Query image data and existing annotations
   ↓
   Database: SELECT image, annotations WHERE image_id = {nextId}
   ↓
   Response: Image data → Update canvas → Load annotations
   ↓
   Canvas: Clear previous → Load new image → Render annotations
   ```

2. **Draw Bounding Box**:
   ```
   Frontend: User selects BBox tool → Mouse down on canvas
   ↓
   Canvas Events: mousedown → mousemove → mouseup
   ↓
   Calculate Coordinates: Convert canvas pixels to normalized coords
   ↓
   Create Shape: Add rectangle to Konva stage
   ↓
   State Update: Add annotation to local state array
   ↓
   User Clicks Save → Validate annotation data
   ↓
   API Call: POST /api/v1/images/{id}/annotations
   ↓
   Backend: Create annotation record with coordinates
   ↓
   Database: INSERT INTO annotations
   ↓
   Response: Return annotation with ID → Update UI
   ```

3. **Select Annotation Tool**:
   ```
   Frontend: Click tool button → Update selectedTool state
   ↓
   Canvas: Change cursor style → Update event handlers
   ↓
   Tool-specific Logic: Enable drawing mode for selected tool
   ↓
   UI Update: Highlight active tool → Show tool options
   ```

### **🚀 Annotation Launcher (`/annotate-launcher/{datasetId}`)**
**UI Elements:**
- **Auto-Label Section**: Model dropdown, confidence slider, IoU threshold
- **"Start Auto-Labeling" Button**: Primary action with progress indicator
- **Manual Annotation Button**: Alternative workflow option
- **Progress Indicators**: Job status, completion percentage, ETA
- **Settings Panel**: Advanced auto-labeling configuration

**User Interactions:**
1. **Click "Start Auto-Labeling"**:
   ```
   Frontend: Collect form data (model, confidence, IoU)
   ↓
   Validation: Check required fields and ranges
   ↓
   API Call: POST /api/v1/datasets/{id}/auto-label
   ↓
   Backend: Create AutoLabelJob record
   ↓
   Background Task: Start async processing
   ↓
   Database: INSERT INTO auto_label_jobs
   ↓
   Response: Job ID → Start progress polling
   ↓
   Frontend: Poll GET /api/v1/jobs/{jobId} every 2 seconds
   ↓
   Update Progress: Show percentage and status
   ```

2. **Auto-Labeling Process (Backend)**:
   ```
   Background Task: Load YOLO model
   ↓
   For Each Image in Dataset:
     - Load image from file system
     - Run model inference
     - Filter results by confidence threshold
     - Apply Non-Maximum Suppression (NMS)
     - Convert to annotation format
     - Save to database
     - Update job progress
   ↓
   Job Completion: Update status to "completed"
   ↓
   Frontend: Stop polling → Show completion message
   ```

---

## 🔁 Data Flow Architecture

### **🎯 Complete User Journey: Creating and Annotating a Project**

#### **Phase 1: Project Creation**
```
User Action: Click "Create Project" on Dashboard
↓
Frontend: Open modal with form (name, description, type)
↓
User Input: Fill project details and submit
↓
API Request: POST /api/v1/projects
{
  "name": "Vehicle Detection",
  "description": "Detect cars and trucks",
  "project_type": "Object Detection",
  "confidence_threshold": 0.6
}
↓
Backend Processing:
  - Validate input data with Pydantic
  - Create Project instance
  - Generate unique project ID
  - Set default configuration
↓
Database Operation: INSERT INTO projects
↓
Response: Return project data with ID
↓
Frontend Update: Close modal → Refresh project list → Navigate to project
```

#### **Phase 2: Dataset Creation and Upload**
```
User Action: Click "Add Dataset" in project detail
↓
Frontend: Open dataset creation modal
↓
User Input: Dataset name, description, file selection
↓
API Request: POST /api/v1/datasets
{
  "name": "Training Images",
  "description": "Vehicle images for training",
  "project_id": 1,
  "auto_label_enabled": true
}
↓
Backend: Create dataset record
↓
File Upload: POST /api/v1/datasets/{id}/upload
- FormData with multiple image files
- Multipart form processing
↓
Backend Processing:
  - Validate file types (jpg, png, etc.)
  - Generate unique filenames
  - Save to /uploads/projects/{project_name}/{dataset_name}/
  - Extract image metadata (width, height, size)
  - Create Image records in database
↓
Database Operations:
  - INSERT INTO datasets
  - INSERT INTO images (batch)
  - UPDATE dataset statistics
↓
Response: Upload results with image count
↓
Frontend: Update dataset view → Show uploaded images
```

#### **Phase 3: Auto-Labeling Process**
```
User Action: Click "Start Auto-Labeling" in annotation launcher
↓
Frontend: Configure auto-labeling settings
- Select model (YOLO11n, YOLO11s, etc.)
- Set confidence threshold (0.5)
- Set IoU threshold (0.45)
↓
API Request: POST /api/v1/datasets/{id}/auto-label
{
  "model_id": "yolo11n",
  "confidence_threshold": 0.5,
  "iou_threshold": 0.45,
  "overwrite_existing": false
}
↓
Backend: Create AutoLabelJob
↓
Background Task Starts:
  1. Load YOLO model from /models/pretrained/
  2. Query all unlabeled images in dataset
  3. For each image:
     - Load image file
     - Run model inference
     - Filter detections by confidence
     - Apply Non-Maximum Suppression
     - Convert to normalized coordinates
     - Create Annotation records
  4. Update job progress
↓
Database Operations:
  - INSERT INTO auto_label_jobs
  - INSERT INTO annotations (batch)
  - UPDATE images SET is_auto_labeled = true
  - UPDATE dataset statistics
↓
Frontend Polling: GET /api/v1/jobs/{jobId} every 2 seconds
↓
Progress Updates: Show percentage, processed images, ETA
↓
Completion: Job status = "completed" → Stop polling
```

#### **Phase 4: Manual Annotation**
```
User Action: Click "Manual Annotation" button
↓
Frontend: Navigate to /annotate/{datasetId}/manual
↓
Component Load: ManualLabeling component mounts
↓
Data Loading:
  - GET /api/v1/datasets/{id}/images (get image list)
  - GET /api/v1/images/{firstImageId} (load first image)
  - GET /api/v1/images/{firstImageId}/annotations (existing annotations)
↓
Canvas Initialization:
  - Create Konva stage and layer
  - Load image onto canvas
  - Render existing annotations as shapes
  - Set up event handlers
↓
User Interaction: Draw bounding box
  1. Select BBox tool
  2. Mouse down on canvas → start drawing
  3. Mouse move → update rectangle size
  4. Mouse up → complete annotation
↓
Annotation Creation:
  - Calculate normalized coordinates
  - Add to local state
  - Show in annotation list
↓
Save Action: User clicks "Save"
↓
API Request: POST /api/v1/images/{id}/annotations
{
  "class_name": "car",
  "class_id": 0,
  "x_min": 0.1,
  "y_min": 0.2,
  "x_max": 0.8,
  "y_max": 0.9,
  "confidence": 1.0,
  "is_verified": true
}
↓
Backend: Create annotation record
↓
Database: INSERT INTO annotations
↓
Response: Return annotation with ID
↓
Frontend: Update annotation list → Mark as saved
```

#### **Phase 5: Export Process**
```
User Action: Click "Export Dataset" in project workspace
↓
Frontend: Open export configuration modal
- Select format (YOLO, COCO, Pascal VOC)
- Choose datasets to include
- Set export options (verified only, include images)
↓
API Request: POST /api/v1/export
{
  "project_id": 1,
  "format": "YOLO",
  "include_images": true,
  "verified_only": false,
  "split_data": true
}
↓
Backend: Create ExportJob
↓
Background Task:
  1. Query all annotations for project
  2. Group by dataset and image
  3. Convert to target format:
     - YOLO: .txt files with normalized coordinates
     - COCO: JSON with image and annotation arrays
     - Pascal VOC: XML files per image
  4. Create directory structure
  5. Copy image files if requested
  6. Generate train/val/test splits
  7. Create ZIP archive
↓
Database Operations:
  - INSERT INTO export_jobs
  - UPDATE job progress and status
↓
File Operations:
  - Create /static/exports/{jobId}/ directory
  - Generate annotation files
  - Copy images
  - Create ZIP archive
↓
Completion: Job status = "completed"
↓
Frontend: Show download link → User downloads ZIP
```

### **🔄 Real-Time Data Synchronization**

#### **Image Navigation Flow**
```
User Clicks "Next Image":
1. Frontend: currentIndex + 1 → Get next image from imageList
2. Update URL: /annotate/{datasetId}/manual?imageId={nextImageId}
3. useEffect Hook: Detects imageId change
4. API Call: GET /api/v1/images/{nextImageId}
5. Backend: Query image data and metadata
6. API Call: GET /api/v1/images/{nextImageId}/annotations
7. Backend: Query existing annotations for image
8. Response Processing:
   - Update currentImage state
   - Update annotations state
   - Clear canvas
   - Load new image
   - Render annotations as shapes
9. UI Update: Update image counter, enable/disable nav buttons
```

#### **Annotation Saving Flow**
```
Canvas Drawing Complete:
1. Mouse Events: mousedown → mousemove → mouseup
2. Coordinate Calculation: Canvas pixels → Normalized coordinates
3. Shape Creation: Add Konva rectangle to stage
4. State Update: Add annotation to local annotations array
5. UI Update: Show in annotation sidebar
6. User Action: Click "Save" button
7. Validation: Check annotation data completeness
8. API Call: POST /api/v1/images/{imageId}/annotations
9. Backend Processing:
   - Validate coordinates (0-1 range)
   - Create Annotation model instance
   - Save to database
10. Database: INSERT INTO annotations
11. Response: Return annotation with generated ID
12. Frontend Update:
    - Update annotation with server ID
    - Mark as saved (remove unsaved indicator)
    - Update image statistics
```

---

## ⚙️ Backend API Routes

### **🏗️ Core API Structure**
**Base URL**: `http://localhost:12000/api/v1`
**Documentation**: `http://localhost:12000/docs` (Swagger UI)

### **📁 Project Management Routes**

#### **Projects API (`/api/v1/projects`)**
```python
# List all projects
GET /api/v1/projects
Response: List[ProjectResponse]

# Create new project
POST /api/v1/projects
Request Body: {
  "name": "string",
  "description": "string",
  "project_type": "Object Detection",
  "confidence_threshold": 0.5,
  "iou_threshold": 0.45
}
Response: ProjectResponse

# Get project details
GET /api/v1/projects/{project_id}
Response: ProjectDetailResponse (includes datasets and stats)

# Update project
PUT /api/v1/projects/{project_id}
Request Body: ProjectUpdateRequest
Response: ProjectResponse

# Delete project
DELETE /api/v1/projects/{project_id}
Response: {"message": "Project deleted successfully"}

# Get project statistics
GET /api/v1/projects/{project_id}/stats
Response: {
  "total_datasets": 5,
  "total_images": 1250,
  "labeled_images": 890,
  "unlabeled_images": 360,
  "class_distribution": {"car": 450, "truck": 340, "bus": 100}
}
```

### **🗂️ Dataset Management Routes**

#### **Datasets API (`/api/v1/datasets`)**
```python
# List datasets (with optional project filter)
GET /api/v1/datasets?project_id={id}
Response: List[DatasetResponse]

# Create new dataset
POST /api/v1/datasets
Request Body: {
  "name": "Training Set",
  "description": "Main training images",
  "project_id": 1,
  "auto_label_enabled": true,
  "model_id": "yolo11n"
}
Response: DatasetResponse

# Get dataset details
GET /api/v1/datasets/{dataset_id}
Response: DatasetDetailResponse (includes images and stats)

# Upload images to dataset
POST /api/v1/datasets/{dataset_id}/upload
Content-Type: multipart/form-data
Form Fields:
  - files: List[UploadFile] (multiple image files)
  - auto_label: bool = true
  - model_id: str = "yolo11n"
Response: {
  "uploaded_count": 25,
  "failed_count": 0,
  "auto_label_job_id": "uuid-here"
}

# List dataset images
GET /api/v1/datasets/{dataset_id}/images?page=1&limit=50
Response: {
  "images": List[ImageResponse],
  "total": 1250,
  "page": 1,
  "limit": 50
}

# Start auto-labeling job
POST /api/v1/datasets/{dataset_id}/auto-label
Request Body: {
  "model_id": "yolo11n",
  "confidence_threshold": 0.5,
  "iou_threshold": 0.45,
  "overwrite_existing": false
}
Response: {
  "job_id": "uuid-here",
  "status": "pending",
  "total_images": 100
}

# Get annotation progress
GET /api/v1/datasets/{dataset_id}/progress
Response: {
  "total_images": 100,
  "labeled_images": 75,
  "unlabeled_images": 25,
  "progress_percentage": 75.0
}
```

### **🏷️ Image and Annotation Routes**

#### **Images API (`/api/v1/images`)**
```python
# Get image details
GET /api/v1/images/{image_id}
Response: {
  "id": "uuid",
  "filename": "image_001.jpg",
  "file_path": "projects/vehicle_detection/training/image_001.jpg",
  "width": 1920,
  "height": 1080,
  "is_labeled": true,
  "annotation_count": 3
}

# Get image annotations
GET /api/v1/images/{image_id}/annotations
Response: List[AnnotationResponse]

# Create new annotation
POST /api/v1/images/{image_id}/annotations
Request Body: {
  "class_name": "car",
  "class_id": 0,
  "x_min": 0.1,
  "y_min": 0.2,
  "x_max": 0.8,
  "y_max": 0.9,
  "confidence": 0.95,
  "segmentation": [[x1,y1], [x2,y2], ...],  // Optional
  "is_verified": true
}
Response: AnnotationResponse

# Update annotation
PUT /api/v1/images/{image_id}/annotations/{annotation_id}
Request Body: AnnotationUpdateRequest
Response: AnnotationResponse

# Delete annotation
DELETE /api/v1/images/{image_id}/annotations/{annotation_id}
Response: {"message": "Annotation deleted successfully"}

# Mark image as verified
POST /api/v1/images/{image_id}/verify
Response: {"message": "Image marked as verified"}
```

### **🤖 Model Management Routes**

#### **Models API (`/api/v1/models`)**
```python
# List available models
GET /api/v1/models
Response: [
  {
    "id": "yolo11n",
    "name": "YOLO11 Nano",
    "type": "object_detection",
    "size": "6.2MB",
    "accuracy": "37.3 mAP",
    "speed": "80.4 FPS",
    "classes": ["person", "bicycle", "car", ...]
  }
]

# Upload custom model
POST /api/v1/models/upload
Content-Type: multipart/form-data
Form Fields:
  - model_file: UploadFile (.pt file)
  - name: str
  - description: str
  - classes: List[str]
Response: ModelResponse

# Get model details
GET /api/v1/models/{model_id}
Response: ModelDetailResponse

# Run inference on image
POST /api/v1/models/{model_id}/predict
Request Body: {
  "image_id": "uuid",
  "confidence_threshold": 0.5,
  "iou_threshold": 0.45
}
Response: {
  "detections": [
    {
      "class_name": "car",
      "confidence": 0.95,
      "bbox": [x_min, y_min, x_max, y_max]
    }
  ]
}

# Get model usage statistics
GET /api/v1/models/{model_id}/stats
Response: {
  "total_inferences": 1250,
  "avg_confidence": 0.87,
  "most_detected_class": "car",
  "usage_by_project": {"project_1": 800, "project_2": 450}
}
```

### **📤 Export Routes**

#### **Export API (`/api/v1/export`)**
```python
# Create export job
POST /api/v1/export
Request Body: {
  "project_id": 1,
  "dataset_ids": ["uuid1", "uuid2"],  // Optional, null for all
  "format": "YOLO",  // YOLO, COCO, Pascal VOC
  "include_images": true,
  "verified_only": false,
  "split_data": true,
  "split_ratios": {"train": 0.7, "val": 0.2, "test": 0.1}
}
Response: {
  "job_id": "uuid",
  "status": "pending",
  "estimated_time": "2 minutes"
}

# Get export job status
GET /api/v1/export/{job_id}
Response: {
  "job_id": "uuid",
  "status": "processing",  // pending, processing, completed, failed
  "progress": 65.0,
  "processed_images": 650,
  "total_images": 1000,
  "estimated_remaining": "45 seconds"
}

# Download exported file
GET /api/v1/export/{job_id}/download
Response: File download (ZIP archive)
```

### **📊 Analytics Routes**

#### **Analytics API (`/api/v1/analytics`)**
```python
# Project statistics
GET /api/v1/analytics/projects/{project_id}/stats
Response: {
  "overview": {
    "total_datasets": 5,
    "total_images": 1250,
    "total_annotations": 3400,
    "completion_rate": 0.85
  },
  "class_distribution": {
    "car": 1200,
    "truck": 800,
    "bus": 400,
    "motorcycle": 200
  },
  "annotation_quality": {
    "verified_annotations": 2890,
    "auto_generated": 1200,
    "manual_annotations": 2200
  }
}

# Dataset class distribution
GET /api/v1/analytics/datasets/{dataset_id}/distribution
Response: {
  "class_counts": {"car": 450, "truck": 340},
  "class_percentages": {"car": 57.0, "truck": 43.0},
  "total_annotations": 790,
  "gini_coefficient": 0.14,  // Imbalance measure
  "is_balanced": true
}

# Dataset balance analysis
GET /api/v1/analytics/datasets/{dataset_id}/balance
Response: {
  "balance_score": 0.86,
  "recommendations": [
    "Add more 'motorcycle' samples",
    "Consider data augmentation for minority classes"
  ],
  "suggested_techniques": ["rotation", "brightness", "flip"]
}

# Create train/val/test split
POST /api/v1/analytics/datasets/{dataset_id}/split
Request Body: {
  "train_ratio": 0.7,
  "val_ratio": 0.2,
  "test_ratio": 0.1,
  "stratify": true  // Maintain class distribution
}
Response: {
  "train_images": 700,
  "val_images": 200,
  "test_images": 100,
  "split_id": "uuid"
}
```

---

## 🧱 Database Models

### **📊 Database Schema Overview**
The system uses **SQLite** with **SQLAlchemy ORM** for data persistence. The schema follows a hierarchical structure:

```
Projects (1) → (Many) Datasets (1) → (Many) Images (1) → (Many) Annotations
```

### **🏗️ Core Models**

#### **Project Model**
```python
class Project(Base):
    __tablename__ = "projects"
    
    # Primary fields
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    project_type = Column(String(50), default="Object Detection")
    
    # Configuration
    default_model_id = Column(String, nullable=True)
    confidence_threshold = Column(Float, default=0.5)
    iou_threshold = Column(Float, default=0.45)
    
    # Statistics (computed properties)
    total_images = Column(Integer, default=0)
    labeled_images = Column(Integer, default=0)
    total_annotations = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
    export_jobs = relationship("ExportJob", back_populates="project")
    
    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}')>"
```

**Purpose**: Top-level organization unit for related datasets and models
**Key Features**:
- Unique project names
- Default model configuration
- Automatic statistics computation
- Cascade deletion of related data

#### **Dataset Model**
```python
class Dataset(Base):
    __tablename__ = "datasets"
    
    # Primary fields
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Statistics (auto-updated via triggers)
    total_images = Column(Integer, default=0)
    labeled_images = Column(Integer, default=0)
    unlabeled_images = Column(Integer, default=0)
    verified_images = Column(Integer, default=0)
    
    # Configuration
    auto_label_enabled = Column(Boolean, default=True)
    model_id = Column(String, nullable=True)  # Override project default
    
    # Data split information
    train_images = Column(Integer, default=0)
    val_images = Column(Integer, default=0)
    test_images = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="datasets")
    images = relationship("Image", back_populates="dataset", cascade="all, delete-orphan")
    auto_label_jobs = relationship("AutoLabelJob", back_populates="dataset")
    
    def update_statistics(self):
        """Update dataset statistics based on images"""
        self.total_images = len(self.images)
        self.labeled_images = sum(1 for img in self.images if img.is_labeled)
        self.unlabeled_images = self.total_images - self.labeled_images
        self.verified_images = sum(1 for img in self.images if img.is_verified)
```

**Purpose**: Collection of related images for annotation
**Key Features**:
- UUID primary keys for better distribution
- Auto-updating statistics
- Data split tracking
- Model configuration override

#### **Image Model**
```python
class Image(Base):
    __tablename__ = "images"
    
    # Primary fields
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    # Image properties
    width = Column(Integer)
    height = Column(Integer)
    format = Column(String(10))  # jpg, png, webp, etc.
    file_size = Column(Integer)  # in bytes
    
    # Status tracking
    is_labeled = Column(Boolean, default=False)
    is_auto_labeled = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    annotation_count = Column(Integer, default=0)
    
    # Data split assignment
    split_type = Column(String(10), default="unassigned")  # train, val, test, unassigned
    
    # Metadata
    upload_date = Column(DateTime, default=func.now())
    last_annotated = Column(DateTime, nullable=True)
    
    # Foreign keys
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="images")
    annotations = relationship("Annotation", back_populates="image", cascade="all, delete-orphan")
    
    @property
    def url(self):
        """Get the URL path for accessing this image"""
        return f"/uploads/{self.file_path}"
    
    def update_status(self):
        """Update image status based on annotations"""
        self.annotation_count = len(self.annotations)
        self.is_labeled = self.annotation_count > 0
        if self.annotations:
            self.last_annotated = func.now()
```

**Purpose**: Individual image files with metadata and status
**Key Features**:
- Complete file metadata tracking
- Automatic status updates
- Data split assignment
- URL property for easy access

#### **Annotation Model**
```python
class Annotation(Base):
    __tablename__ = "annotations"
    
    # Primary fields
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = Column(String, ForeignKey("images.id"), nullable=False)
    
    # Annotation data
    class_name = Column(String(100), nullable=False)
    class_id = Column(Integer, nullable=False)
    confidence = Column(Float, default=1.0)
    
    # Bounding box (normalized coordinates 0-1)
    x_min = Column(Float, nullable=False)
    y_min = Column(Float, nullable=False)
    x_max = Column(Float, nullable=False)
    y_max = Column(Float, nullable=False)
    
    # Segmentation (optional polygon)
    segmentation = Column(JSON, nullable=True)  # List of [x, y] points
    
    # Metadata
    is_auto_generated = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    model_id = Column(String, nullable=True)  # Model used for auto-generation
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    image = relationship("Image", back_populates="annotations")
    
    @property
    def area(self):
        """Calculate bounding box area"""
        return (self.x_max - self.x_min) * (self.y_max - self.y_min)
    
    @property
    def center(self):
        """Get bounding box center point"""
        return {
            "x": (self.x_min + self.x_max) / 2,
            "y": (self.y_min + self.y_max) / 2
        }
    
    def to_yolo_format(self, image_width, image_height):
        """Convert to YOLO format (class_id, center_x, center_y, width, height)"""
        center_x = (self.x_min + self.x_max) / 2
        center_y = (self.y_min + self.y_max) / 2
        width = self.x_max - self.x_min
        height = self.y_max - self.y_min
        
        return f"{self.class_id} {center_x} {center_y} {width} {height}"
```

**Purpose**: Object detection/segmentation labels for images
**Key Features**:
- Normalized coordinates (0-1 range)
- Optional polygon segmentation
- Confidence scores
- Format conversion methods

### **🔄 Job Tracking Models**

#### **AutoLabelJob Model**
```python
class AutoLabelJob(Base):
    __tablename__ = "auto_label_jobs"
    
    # Job identification
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    
    # Job configuration
    model_id = Column(String, nullable=False)
    confidence_threshold = Column(Float, default=0.5)
    iou_threshold = Column(Float, default=0.45)
    overwrite_existing = Column(Boolean, default=False)
    
    # Job status
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)  # 0-100
    error_message = Column(Text, nullable=True)
    
    # Statistics
    total_images = Column(Integer, default=0)
    processed_images = Column(Integer, default=0)
    successful_images = Column(Integer, default=0)
    failed_images = Column(Integer, default=0)
    total_annotations_created = Column(Integer, default=0)
    
    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    dataset = relationship("Dataset", back_populates="auto_label_jobs")
    
    @property
    def duration(self):
        """Calculate job duration"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        elif self.started_at:
            return func.now() - self.started_at
        return None
    
    @property
    def success_rate(self):
        """Calculate success rate percentage"""
        if self.processed_images > 0:
            return (self.successful_images / self.processed_images) * 100
        return 0.0
```

**Purpose**: Track background auto-labeling operations
**Key Features**:
- Comprehensive progress tracking
- Error handling and reporting
- Performance statistics
- Time estimation

#### **ExportJob Model**
```python
class ExportJob(Base):
    __tablename__ = "export_jobs"
    
    # Job identification
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Export configuration
    export_format = Column(String(50), nullable=False)  # YOLO, COCO, Pascal VOC
    dataset_ids = Column(JSON, nullable=True)  # List of dataset IDs, null for all
    include_images = Column(Boolean, default=True)
    verified_only = Column(Boolean, default=False)
    split_data = Column(Boolean, default=False)
    split_ratios = Column(JSON, nullable=True)  # {"train": 0.7, "val": 0.2, "test": 0.1}
    
    # Job status
    status = Column(String(20), default="pending")
    progress = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    
    # Output information
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)  # in bytes
    download_count = Column(Integer, default=0)
    
    # Statistics
    total_images = Column(Integer, default=0)
    total_annotations = Column(Integer, default=0)
    processed_images = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Auto-cleanup date
    
    # Relationships
    project = relationship("Project", back_populates="export_jobs")
    
    @property
    def download_url(self):
        """Get download URL for completed export"""
        if self.status == "completed" and self.file_path:
            return f"/api/v1/export/{self.id}/download"
        return None
    
    @property
    def is_expired(self):
        """Check if export has expired"""
        if self.expires_at:
            return func.now() > self.expires_at
        return False
```

**Purpose**: Track data export operations
**Key Features**:
- Multiple export format support
- Flexible dataset selection
- Automatic file cleanup
- Download tracking

### **📈 Analytics Models**

#### **LabelAnalytics Model**
```python
class LabelAnalytics(Base):
    __tablename__ = "label_analytics"
    
    # Identification
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    
    # Class distribution
    class_distribution = Column(JSON, nullable=False)  # {"person": 150, "car": 89}
    class_percentages = Column(JSON, nullable=False)   # {"person": 62.8, "car": 37.2}
    
    # Statistics
    total_annotations = Column(Integer, default=0)
    num_classes = Column(Integer, default=0)
    gini_coefficient = Column(Float, default=0.0)  # Imbalance measure (0=balanced, 1=imbalanced)
    entropy = Column(Float, default=0.0)  # Information entropy
    
    # Balance analysis
    is_balanced = Column(Boolean, default=True)
    balance_score = Column(Float, default=1.0)  # 0-1, higher is better
    minority_threshold = Column(Float, default=0.1)  # Threshold for minority classes
    
    # Recommendations
    needs_augmentation = Column(Boolean, default=False)
    recommended_techniques = Column(JSON, nullable=True)  # ["rotation", "brightness"]
    suggested_samples = Column(JSON, nullable=True)  # {"car": 50, "truck": 30}
    
    # Timestamps
    computed_at = Column(DateTime, default=func.now())
    
    # Relationships
    dataset = relationship("Dataset")
    
    def compute_balance_metrics(self):
        """Compute balance metrics from class distribution"""
        if not self.class_distribution:
            return
        
        counts = list(self.class_distribution.values())
        total = sum(counts)
        
        if total == 0:
            return
        
        # Calculate percentages
        self.class_percentages = {
            cls: (count / total) * 100 
            for cls, count in self.class_distribution.items()
        }
        
        # Calculate Gini coefficient
        proportions = [count / total for count in counts]
        proportions.sort()
        n = len(proportions)
        cumsum = sum((i + 1) * prop for i, prop in enumerate(proportions))
        self.gini_coefficient = (2 * cumsum) / (n * sum(proportions)) - (n + 1) / n
        
        # Calculate entropy
        self.entropy = -sum(p * math.log2(p) for p in proportions if p > 0)
        
        # Determine if balanced
        min_percentage = min(self.class_percentages.values())
        self.is_balanced = min_percentage >= (self.minority_threshold * 100)
        
        # Calculate balance score
        self.balance_score = 1.0 - self.gini_coefficient
```

**Purpose**: Dataset balance analysis and recommendations
**Key Features**:
- Comprehensive balance metrics
- Automatic imbalance detection
- Augmentation recommendations
- Statistical analysis

---

## 📐 Frontend Components

### **🎨 Core UI Components**

#### **Navbar Component (`/components/Navbar.js`)**
```javascript
import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  RobotOutlined,
  ProjectOutlined
} from '@ant-design/icons';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/models',
      icon: <RobotOutlined />,
      label: 'Models',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <div style={{ 
        color: 'white', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginRight: '40px',
        marginLeft: '24px'
      }}>
        🏷️ Auto-Labeling-Tool
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ flex: 1, minWidth: 0 }}
      />
    </div>
  );
};

export default Navbar;
```

**Purpose**: Main application navigation
**Features**: 
- Active route highlighting
- Responsive design
- Icon-based navigation
- Brand display

#### **AdvancedAnnotationCanvas Component**
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Rect, Line } from 'react-konva';
import useImage from 'use-image';

const AdvancedAnnotationCanvas = ({ 
  imageUrl, 
  annotations, 
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  selectedTool,
  selectedClass 
}) => {
  const [image] = useImage(imageUrl);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [shapes, setShapes] = useState([]);
  const stageRef = useRef();

  // Convert annotations to shapes
  useEffect(() => {
    if (annotations && image) {
      const convertedShapes = annotations.map(ann => ({
        id: ann.id,
        type: 'rect',
        x: ann.x_min * image.width,
        y: ann.y_min * image.height,
        width: (ann.x_max - ann.x_min) * image.width,
        height: (ann.y_max - ann.y_min) * image.height,
        className: ann.class_name,
        confidence: ann.confidence,
        isVerified: ann.is_verified
      }));
      setShapes(convertedShapes);
    }
  }, [annotations, image]);

  // Handle mouse down - start drawing
  const handleMouseDown = (e) => {
    if (selectedTool === 'select') return;
    
    const pos = e.target.getStage().getPointerPosition();
    const relativePos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale
    };

    if (selectedTool === 'bbox') {
      setIsDrawing(true);
      setCurrentShape({
        id: `temp_${Date.now()}`,
        type: 'rect',
        x: relativePos.x,
        y: relativePos.y,
        width: 0,
        height: 0,
        className: selectedClass,
        isTemp: true
      });
    }
  };

  // Handle mouse move - update drawing
  const handleMouseMove = (e) => {
    if (!isDrawing || selectedTool !== 'bbox') return;

    const pos = e.target.getStage().getPointerPosition();
    const relativePos = {
      x: (pos.x - stagePos.x) / stageScale,
      y: (pos.y - stagePos.y) / stageScale
    };

    setCurrentShape(prev => ({
      ...prev,
      width: relativePos.x - prev.x,
      height: relativePos.y - prev.y
    }));
  };

  // Handle mouse up - finish drawing
  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;

    setIsDrawing(false);
    
    // Validate shape size
    if (Math.abs(currentShape.width) > 5 && Math.abs(currentShape.height) > 5) {
      // Normalize coordinates
      const normalizedShape = {
        ...currentShape,
        x: Math.min(currentShape.x, currentShape.x + currentShape.width),
        y: Math.min(currentShape.y, currentShape.y + currentShape.height),
        width: Math.abs(currentShape.width),
        height: Math.abs(currentShape.height),
        isTemp: false
      };

      // Convert to annotation format
      const annotation = {
        class_name: selectedClass,
        class_id: 0, // This should be mapped from class name
        x_min: normalizedShape.x / image.width,
        y_min: normalizedShape.y / image.height,
        x_max: (normalizedShape.x + normalizedShape.width) / image.width,
        y_max: (normalizedShape.y + normalizedShape.height) / image.height,
        confidence: 1.0,
        is_verified: true
      };

      onAnnotationCreate(annotation);
    }
    
    setCurrentShape(null);
  };

  // Handle zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - (pointer.x - stagePos.x) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stagePos.y) * (newScale / oldScale)
    });
  };

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onWheel={handleWheel}
        draggable={selectedTool === 'select'}
      >
        <Layer>
          {/* Background Image */}
          {image && (
            <Image
              image={image}
              width={image.width}
              height={image.height}
            />
          )}
          
          {/* Existing Annotations */}
          {shapes.map(shape => (
            <Rect
              key={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              stroke={shape.isVerified ? '#52c41a' : '#faad14'}
              strokeWidth={2}
              fill="transparent"
              dash={shape.isVerified ? [] : [5, 5]}
            />
          ))}
          
          {/* Current Drawing Shape */}
          {currentShape && (
            <Rect
              x={currentShape.x}
              y={currentShape.y}
              width={currentShape.width}
              height={currentShape.height}
              stroke="#1890ff"
              strokeWidth={2}
              fill="rgba(24, 144, 255, 0.1)"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default AdvancedAnnotationCanvas;
```

**Purpose**: Interactive canvas for manual annotation
**Features**:
- Multiple drawing tools (bbox, polygon)
- Zoom and pan functionality
- Shape manipulation
- Real-time drawing feedback
- Annotation validation

#### **ManualAnnotationTools Component**
```javascript
import React from 'react';
import { Button, Space, Tooltip, Select, InputNumber } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  ExpandOutlined,
  AimOutlined,
  DeleteOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';

const { Option } = Select;

const ManualAnnotationTools = ({ 
  selectedTool, 
  onToolSelect,
  selectedClass,
  onClassSelect,
  classes = ['person', 'car', 'truck', 'bus'],
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onDeleteSelected
}) => {
  const tools = [
    { id: 'select', icon: <DragOutlined />, tooltip: 'Select Tool (V)' },
    { id: 'bbox', icon: <BorderOutlined />, tooltip: 'Bounding Box (B)' },
    { id: 'polygon', icon: <ExpandOutlined />, tooltip: 'Polygon (P)' },
    { id: 'smart_polygon', icon: <AimOutlined />, tooltip: 'Smart Polygon (S)' }
  ];

  return (
    <div style={{ padding: '16px', borderRight: '1px solid #f0f0f0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Drawing Tools */}
        <div>
          <h4>Drawing Tools</h4>
          <Space direction="vertical" size="small">
            {tools.map(tool => (
              <Tooltip key={tool.id} title={tool.tooltip} placement="right">
                <Button
                  type={selectedTool === tool.id ? 'primary' : 'default'}
                  icon={tool.icon}
                  onClick={() => onToolSelect(tool.id)}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  {tool.tooltip.split(' (')[0]}
                </Button>
              </Tooltip>
            ))}
          </Space>
        </div>

        {/* Class Selection */}
        <div>
          <h4>Class</h4>
          <Select
            value={selectedClass}
            onChange={onClassSelect}
            style={{ width: '100%' }}
            placeholder="Select class"
          >
            {classes.map(cls => (
              <Option key={cls} value={cls}>{cls}</Option>
            ))}
          </Select>
        </div>

        {/* Zoom Controls */}
        <div>
          <h4>View</h4>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button 
              icon={<ZoomInOutlined />} 
              onClick={onZoomIn}
              style={{ width: '100%' }}
            >
              Zoom In
            </Button>
            <Button 
              icon={<ZoomOutOutlined />} 
              onClick={onZoomOut}
              style={{ width: '100%' }}
            >
              Zoom Out
            </Button>
            <Button 
              onClick={onFitToScreen}
              style={{ width: '100%' }}
            >
              Fit to Screen
            </Button>
          </Space>
        </div>

        {/* Actions */}
        <div>
          <h4>Actions</h4>
          <Button 
            danger
            icon={<DeleteOutlined />}
            onClick={onDeleteSelected}
            style={{ width: '100%' }}
          >
            Delete Selected
          </Button>
        </div>
      </Space>
    </div>
  );
};

export default ManualAnnotationTools;
```

**Purpose**: Tool selection interface for annotation
**Features**:
- Tool selection with keyboard shortcuts
- Class selection dropdown
- Zoom controls
- Action buttons

### **🔧 Utility Components**

#### **API Service (`/services/api.js`)**
```javascript
import axios from 'axios';
import { message } from 'antd';

// Base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:12000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('Authentication required');
          // Redirect to login
          break;
        case 403:
          message.error('Access forbidden');
          break;
        case 404:
          message.error('Resource not found');
          break;
        case 500:
          message.error('Server error occurred');
          break;
        default:
          message.error(data.detail || 'An error occurred');
      }
    } else if (error.request) {
      message.error('Network error - please check your connection');
    } else {
      message.error('Request failed');
    }
    return Promise.reject(error);
  }
);

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`)
};

// Datasets API
export const datasetsAPI = {
  getAll: (projectId) => api.get('/datasets', { params: { project_id: projectId } }),
  create: (data) => api.post('/datasets', data),
  getById: (id) => api.get(`/datasets/${id}`),
  update: (id, data) => api.put(`/datasets/${id}`, data),
  delete: (id) => api.delete(`/datasets/${id}`),
  uploadImages: (id, formData) => 
    api.post(`/datasets/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000 // 5 minutes for large uploads
    }),
  getImages: (id, page = 1, limit = 50) => 
    api.get(`/datasets/${id}/images`, { params: { page, limit } }),
  autoLabel: (id, config) => api.post(`/datasets/${id}/auto-label`, config),
  getProgress: (id) => api.get(`/datasets/${id}/progress`)
};

// Images API
export const imagesAPI = {
  getById: (id) => api.get(`/images/${id}`),
  getAnnotations: (id) => api.get(`/images/${id}/annotations`),
  createAnnotation: (id, data) => api.post(`/images/${id}/annotations`, data),
  updateAnnotation: (imageId, annotationId, data) => 
    api.put(`/images/${imageId}/annotations/${annotationId}`, data),
  deleteAnnotation: (imageId, annotationId) => 
    api.delete(`/images/${imageId}/annotations/${annotationId}`),
  verify: (id) => api.post(`/images/${id}/verify`)
};

// Models API
export const modelsAPI = {
  getAll: () => api.get('/models'),
  upload: (formData) => 
    api.post('/models/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getById: (id) => api.get(`/models/${id}`),
  predict: (id, data) => api.post(`/models/${id}/predict`, data),
  getStats: (id) => api.get(`/models/${id}/stats`)
};

// Export API
export const exportAPI = {
  create: (data) => api.post('/export', data),
  getStatus: (jobId) => api.get(`/export/${jobId}`),
  download: (jobId) => api.get(`/export/${jobId}/download`, { responseType: 'blob' })
};

// Analytics API
export const analyticsAPI = {
  getProjectStats: (id) => api.get(`/analytics/projects/${id}/stats`),
  getDatasetDistribution: (id) => api.get(`/analytics/datasets/${id}/distribution`),
  getDatasetBalance: (id) => api.get(`/analytics/datasets/${id}/balance`),
  createSplit: (id, data) => api.post(`/analytics/datasets/${id}/split`, data)
};

export default api;
```

**Purpose**: Centralized API communication layer
**Features**:
- Request/response interceptors
- Error handling
- Authentication support
- Timeout configuration
- Organized endpoint groups

---

## 🧠 Tech Stack Summary

### **🎨 Frontend Technologies**

#### **Core Framework**
- **React 18.2.0**: Modern React with hooks, concurrent features, and automatic batching
- **React Router DOM 6.3.0**: Client-side routing with data loading and nested routes
- **React Scripts 5.0.1**: Create React App build tooling with Webpack 5

#### **UI Framework & Design**
- **Ant Design 5.8.0**: Enterprise-class UI design language and components
- **@ant-design/icons 5.2.0**: Comprehensive icon set with 2000+ icons
- **@ant-design/plots 2.4.0**: Statistical charts and data visualization
- **@ant-design/pro-components**: Advanced business components

#### **Canvas & Graphics**
- **React Konva 18.2.10**: React wrapper for Konva 2D canvas library
- **Konva 9.3.20**: High-performance 2D graphics library for desktop and mobile
- **Fabric.js 5.3.0**: Interactive canvas library for complex graphics manipulation
- **use-image**: React hook for loading images in Konva

#### **HTTP & Data Management**
- **Axios 1.9.0**: Promise-based HTTP client with interceptors and request/response transformation
- **React Query 4.0.0**: Data fetching and caching library (if implemented)
- **SWR**: Data fetching with caching, revalidation, and error handling

#### **File Handling**
- **React Dropzone 14.2.3**: Drag-and-drop file upload with validation
- **File-saver**: Client-side file saving for exports

#### **Development & Build Tools**
- **Cross-env 7.0.3**: Cross-platform environment variable setting
- **Styled Components 6.0.0**: CSS-in-JS styling with theme support
- **ESLint**: Code linting with React and accessibility rules
- **Prettier**: Code formatting

### **⚙️ Backend Technologies**

#### **Web Framework**
- **FastAPI 0.104.1**: Modern, fast web framework with automatic API documentation
- **Uvicorn 0.24.0**: Lightning-fast ASGI server implementation
- **Python Multipart 0.0.6**: Multipart form data parsing for file uploads
- **Starlette**: ASGI framework underlying FastAPI

#### **Database & ORM**
- **SQLAlchemy 2.0.23**: Python SQL toolkit and Object-Relational Mapping
- **Alembic 1.12.1**: Database migration tool for SQLAlchemy
- **SQLite**: Built-in Python database with JSON support
- **asyncpg**: Async PostgreSQL driver (for production scaling)

#### **Computer Vision & AI**
- **Ultralytics ≥8.3.0**: YOLO11 object detection framework with training capabilities
- **OpenCV Python ≥4.8.0**: Computer vision library for image processing
- **PyTorch ≥2.2.0**: Deep learning framework with CUDA support
- **Torchvision ≥0.17.0**: Computer vision utilities and pre-trained models
- **Segment Anything Model (SAM)**: Meta's segmentation model

#### **Image Processing**
- **Pillow ≥10.0.0**: Python Imaging Library for image manipulation
- **NumPy ≥1.24.0**: Numerical computing with N-dimensional arrays
- **Albumentations ≥1.3.0**: Advanced image augmentation library
- **ImageIO**: Image I/O operations
- **Scikit-image**: Image processing algorithms

#### **Data Science & ML**
- **Pandas ≥2.1.0**: Data manipulation and analysis
- **Scikit-learn ≥1.3.0**: Machine learning algorithms and utilities
- **Matplotlib**: Plotting library for visualizations
- **Seaborn**: Statistical data visualization

#### **Validation & Serialization**
- **Pydantic ≥2.5.0**: Data validation using Python type annotations
- **Pydantic Settings**: Configuration management with environment variables
- **Email Validator**: Email validation for Pydantic models

#### **File & Security**
- **AIOFiles ≥23.2.0**: Asynchronous file operations
- **Python Magic ≥0.4.27**: File type detection using libmagic
- **Python JOSE ≥3.3.0**: JSON Web Token implementation
- **Passlib ≥1.7.4**: Password hashing library with bcrypt support
- **Cryptography**: Cryptographic recipes and primitives

#### **Background Tasks & Async**
- **Celery**: Distributed task queue for background processing
- **Redis**: In-memory data structure store for caching and task queuing
- **asyncio**: Asynchronous I/O support

#### **Development & Testing**
- **Pytest ≥7.4.0**: Testing framework with fixtures and plugins
- **Pytest-asyncio**: Async testing support
- **Black ≥23.11.0**: Code formatter for consistent style
- **Flake8 ≥6.1.0**: Code linting and style checking
- **MyPy**: Static type checking

### **🗄️ Data Storage & Management**

#### **Primary Database**
- **SQLite**: File-based relational database with JSON column support
- **Location**: `/backend/database.db`
- **Features**: ACID compliance, foreign key constraints, full-text search
- **Backup**: Automated backup strategies for production

#### **File Storage**
- **Uploaded Images**: `/uploads/projects/{project_name}/{dataset_name}/`
- **Static Files**: `/static/` (served by FastAPI StaticFiles)
- **Model Files**: `/models/pretrained/`, `/models/custom/`
- **Export Files**: `/static/exports/` with automatic cleanup
- **Thumbnails**: Generated thumbnails for faster loading

#### **Caching**
- **Redis**: Session storage, API response caching, background task results
- **In-Memory**: Application-level caching for frequently accessed data

### **🔧 Development & Deployment**

#### **Package Management**
- **Frontend**: npm/yarn with package.json and lock files
- **Backend**: pip with requirements.txt variants:
  - `requirements.txt`: Base dependencies
  - `requirements-cuda.txt`: GPU-enabled dependencies
  - `requirements-cpu.txt`: CPU-only dependencies
  - `requirements-dev.txt`: Development dependencies

#### **Build & Bundling**
- **Frontend Build**: React Scripts with Webpack 5, code splitting, and optimization
- **Backend**: No build step required, direct Python execution
- **Static Assets**: Optimized images, fonts, and icons

#### **Cross-Platform Support**
- **Universal Startup**: `universal_start.py` for cross-platform launching
- **Platform Scripts**: 
  - Windows: `start_backend.bat`, `start_frontend.bat`
  - Unix/Linux/macOS: `start_backend.sh`, `start_frontend.sh`
- **Environment**: Cross-env for consistent environment variables

#### **Development Tools**
- **Hot Reload**: Both frontend (React) and backend (FastAPI) support hot reload
- **API Documentation**: Automatic OpenAPI/Swagger documentation
- **Database Migrations**: Alembic for schema versioning
- **Code Quality**: ESLint, Prettier, Black, Flake8

### **🌐 Network & Communication**

#### **API Architecture**
- **REST API**: RESTful endpoints following OpenAPI 3.0 specification
- **WebSocket**: Real-time updates for job progress and notifications
- **GraphQL**: Optional GraphQL endpoint for complex queries
- **CORS**: Configured for cross-origin requests from frontend

#### **Proxy & Routing**
- **Development Proxy**: Frontend proxies API requests to backend
- **Static File Serving**: FastAPI serves uploaded images and exports
- **Port Configuration**: 
  - Frontend: 12001 (configurable)
  - Backend: 12000 (configurable)
- **Load Balancing**: Ready for production load balancer integration

#### **Security**
- **HTTPS**: SSL/TLS support for production
- **Authentication**: JWT-based authentication (optional)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization

### **🔒 Security Features**

#### **Input Validation**
- **Pydantic Models**: Request/response validation with type checking
- **File Type Validation**: Magic number checking for uploaded files
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding

#### **Authentication & Authorization**
- **JWT Tokens**: Stateless authentication with refresh tokens
- **Role-Based Access**: User roles and permissions (if implemented)
- **Session Management**: Secure session handling

#### **Error Handling**
- **Centralized Error Handling**: Consistent error responses across API
- **Logging**: Structured logging for security events and debugging
- **Graceful Degradation**: Fallback mechanisms for failed operations
- **Error Monitoring**: Integration-ready for error tracking services

### **📊 Monitoring & Analytics**

#### **Application Monitoring**
- **Health Checks**: Built-in health check endpoints
- **Metrics**: Application performance metrics
- **Logging**: Structured logging with different levels
- **Profiling**: Performance profiling capabilities

#### **Business Analytics**
- **Usage Statistics**: Track user interactions and feature usage
- **Performance Metrics**: Model inference times and accuracy
- **Data Quality**: Dataset balance and annotation quality metrics

---

## 🚀 Getting Started Guide

### **📋 Prerequisites**
- **Python 3.8+** (recommended: Python 3.10+)
- **Node.js 16+** and npm/yarn
- **Git** for version control
- **4GB+ RAM** (8GB+ recommended for large datasets)
- **GPU** (optional, for faster model inference)

### **⚡ Quick Start**

#### **1. Clone Repository**
```bash
git clone https://github.com/main-yvr-4/auto-stage-4.git
cd auto-stage-4
```

#### **2. Universal Startup (Recommended)**
```bash
# Cross-platform startup script
python universal_start.py
```

This script will:
- Check Python and Node.js versions
- Install backend dependencies
- Install frontend dependencies
- Start both backend and frontend servers
- Open browser automatically

#### **3. Manual Setup**

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm start
```

### **🔧 Configuration**

#### **Environment Variables**
Create `.env` file in backend directory:
```env
# Database
DATABASE_URL=sqlite:///./database.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=12000
DEBUG=true

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB

# Model Configuration
DEFAULT_MODEL=yolo11n
MODEL_DIR=models

# Security (optional)
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### **Frontend Configuration**
Create `.env` file in frontend directory:
```env
REACT_APP_API_URL=http://localhost:12000/api/v1
REACT_APP_UPLOAD_URL=http://localhost:12000/uploads
GENERATE_SOURCEMAP=false
```

### **📁 First Project Setup**

1. **Access Application**: Open `http://localhost:12001`
2. **Create Project**: Click "Create Project" on dashboard
3. **Add Dataset**: In project detail, click "Add Dataset"
4. **Upload Images**: Drag and drop images or click to browse
5. **Start Annotating**: Choose auto-labeling or manual annotation

### **🔍 Troubleshooting**

#### **Common Issues**

**Port Already in Use:**
```bash
# Kill processes on ports
lsof -ti:12000 | xargs kill -9  # Backend
lsof -ti:12001 | xargs kill -9  # Frontend
```

**Python Dependencies:**
```bash
# For CUDA support
pip install -r requirements-cuda.txt

# For CPU only
pip install -r requirements-cpu.txt
```

**Node.js Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Issues:**
```bash
# Reset database
rm backend/database.db
cd backend && python -c "from database.database import init_db; init_db()"
```

### **📚 Next Steps**

1. **Read API Documentation**: Visit `http://localhost:12000/docs`
2. **Explore Sample Data**: Use provided test images in `/test_images/`
3. **Configure Models**: Download additional YOLO models
4. **Set Up Production**: Configure environment for production deployment

---

## 🎯 Summary

The Auto-Labeling Tool is a comprehensive, full-stack computer vision annotation platform that combines:

- **🚀 Modern Architecture**: React + FastAPI for scalable, maintainable development
- **🤖 Advanced AI Integration**: YOLO11 models with custom training capabilities
- **🗄️ Professional Database Design**: Hierarchical data model with comprehensive relationships
- **🎨 Intuitive User Experience**: Canvas-based annotation with multiple drawing tools
- **📊 Enterprise Features**: Export capabilities, analytics, job tracking, and data management
- **🔒 Production Ready**: Security features, error handling, and monitoring capabilities

The system is designed for researchers, data scientists, and teams working on computer vision projects, providing a complete workflow from data upload to model training preparation. With its modular architecture and comprehensive API, it can be easily extended and integrated into existing ML pipelines.

---

## 📚 Additional Resources

### **🔗 Quick Links**
- **API Documentation**: `http://localhost:12000/docs` (Swagger UI)
- **Alternative API Docs**: `http://localhost:12000/redoc` (ReDoc)
- **Health Check**: `http://localhost:12000/health`
- **Frontend Application**: `http://localhost:12001`

### **📖 Documentation**
- **Installation Guide**: See repository README.md
- **API Reference**: Interactive documentation at `/docs`
- **Database Schema**: ERD diagrams in `/docs/database/`
- **Architecture Overview**: System design documents

### **🛠️ Development Resources**
- **Contributing Guide**: Guidelines for contributors
- **Testing Guide**: How to run and write tests
- **Deployment Guide**: Production deployment instructions
- **Performance Tuning**: Optimization recommendations

This documentation provides a complete understanding of the Auto-Labeling Tool's architecture, functionality, and implementation details for developers, product managers, and AI assistants working with the system.