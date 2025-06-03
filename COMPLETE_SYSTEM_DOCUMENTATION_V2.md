# Complete System Documentation - Auto-Labeling Tool v2.0

## Table of Contents
1. [System Overview](#system-overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Architecture Overview](#architecture-overview)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [User Interface Guide](#user-interface-guide)
9. [Manual Annotation System](#manual-annotation-system)
10. [File Management System](#file-management-system)
11. [Development Guide](#development-guide)
12. [Troubleshooting](#troubleshooting)
13. [Recent Fixes & Improvements](#recent-fixes--improvements)

---

## System Overview

### What is Auto-Labeling Tool?
The Auto-Labeling Tool is a comprehensive computer vision annotation platform that combines manual annotation capabilities with AI-powered auto-labeling features. It's designed for creating high-quality training datasets for machine learning models.

### Key Features
- **Manual Image Annotation**: Polygon, rectangle, and point-based annotation tools
- **AI-Powered Auto-Labeling**: Automated annotation using pre-trained models
- **Project Management**: Organize work into projects and datasets
- **Multiple Export Formats**: YOLO, COCO, Pascal VOC, and custom formats
- **Active Learning**: Intelligent sample selection for efficient labeling
- **Data Augmentation**: Built-in image augmentation capabilities
- **Team Collaboration**: Multi-user support with role management

### Technology Stack
- **Frontend**: React.js 18+ with Ant Design UI components
- **Backend**: FastAPI (Python 3.8+) with async support
- **Database**: SQLite with SQLAlchemy ORM
- **Image Processing**: Konva.js for canvas-based annotation
- **File Storage**: Local filesystem with organized directory structure
- **AI Models**: Integration with YOLO, SAM, and custom models

---

## Quick Start Guide

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd auto-stage-4
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```
   Backend will start on `http://localhost:12000`

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will start on `http://localhost:12001`

4. **Access the Application**
   Open your browser and navigate to `http://localhost:12001`

### First Steps
1. Create a new project from the Projects page
2. Create a dataset within your project
3. Upload images to your dataset
4. Start annotating using the manual labeling interface

---

## Architecture Overview

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React.js)    │◄──►│   (FastAPI)     │◄──►│   (SQLite)      │
│   Port: 12001   │    │   Port: 12000   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   API Routes    │    │   Data Models   │
│   - Projects    │    │   - Projects    │    │   - Projects    │
│   - Datasets    │    │   - Datasets    │    │   - Datasets    │
│   - Annotation  │    │   - Images      │    │   - Images      │
│   - Models      │    │   - Models      │    │   - Annotations │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure
```
auto-stage-4/
├── frontend/                    # React.js frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Main application pages
│   │   ├── services/          # API communication layer
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── backend/                    # FastAPI backend application
│   ├── api/                   # API route handlers
│   │   └── routes/           # Organized API endpoints
│   ├── core/                 # Business logic
│   ├── database/             # Database models and operations
│   ├── models/               # AI model management
│   └── utils/                # Backend utilities
├── uploads/                   # File storage directory
│   └── projects/             # Project-specific file organization
├── models/                    # AI model storage
├── database.db              # SQLite database file
└── docs/                     # Documentation
```

---

## Frontend Architecture

### Main Application Structure

#### App.js - Application Entry Point
```javascript
// Main routing configuration
const App = () => {
  return (
    <Router>
      <Layout>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/annotate/:datasetId/manual" element={<ManualLabeling />} />
          <Route path="/models" element={<ModelsModern />} />
        </Routes>
      </Layout>
    </Router>
  );
};
```

#### Navigation System
The application uses React Router for client-side routing with the following main routes:
- `/dashboard` - Main dashboard with overview statistics
- `/projects` - Project management interface
- `/datasets` - Dataset listing and management
- `/annotate/:datasetId/manual` - Manual annotation interface
- `/models` - AI model management

### Key Components

#### 1. Projects Page (`/projects`)
**File**: `frontend/src/pages/Projects.js`

**Purpose**: Central hub for project management

**Key Features**:
- Project cards with real-time statistics
- Search and filtering capabilities
- Project actions (rename, duplicate, merge, delete)
- Create new project functionality

**State Management**:
```javascript
const [projects, setProjects] = useState([])           // Project list
const [loading, setLoading] = useState(true)           // Loading state
const [searchTerm, setSearchTerm] = useState('')       // Search filter
const [sortBy, setSortBy] = useState('updated_at')     // Sort criteria
```

#### 2. Manual Labeling Interface (`/annotate/:datasetId/manual`)
**File**: `frontend/src/pages/ManualLabeling.jsx`

**Purpose**: Core annotation interface for manual image labeling

**Key Features**:
- Canvas-based annotation using Konva.js
- Navigation between images with Previous/Next buttons
- Class management (add, edit, delete annotation classes)
- Annotation tools (polygon, rectangle, point)
- Zoom and pan functionality
- Undo/redo operations
- Save annotations to backend

**Navigation System**:
```javascript
// URL structure: /annotate/{datasetId}/manual?imageId={imageId}
const location = useLocation();
const navigate = useNavigate();
const { datasetId } = useParams();

// Extract imageId from query parameters
const searchParams = new URLSearchParams(location.search);
const currentImageId = searchParams.get('imageId');

// Navigation functions
const goToNextImage = () => {
  const nextIndex = currentImageIndex + 1;
  if (nextIndex < imageList.length) {
    const nextImageId = imageList[nextIndex].id;
    navigate(`/annotate/${datasetId}/manual?imageId=${nextImageId}`);
  }
};
```

**Recent Fixes Applied**:
- ✅ Fixed image loading by changing `data.url` to `data.file_path`
- ✅ Fixed parameter extraction from URL query string
- ✅ Fixed React compilation errors with missing imports
- ✅ Implemented proper navigation state management

#### 3. Dataset Management
**File**: `frontend/src/pages/Datasets.js`

**Purpose**: Dataset overview and management

**Features**:
- Dataset cards with image counts
- Filter by project
- Upload new images
- Navigate to annotation interface

### UI Component Library

#### Ant Design Components Used
- **Layout**: `Layout`, `Sider`, `Content` for application structure
- **Navigation**: `Menu`, `Breadcrumb` for navigation
- **Data Display**: `Card`, `Table`, `List`, `Statistic` for data presentation
- **Forms**: `Form`, `Input`, `Select`, `Upload` for data entry
- **Feedback**: `Modal`, `Message`, `Notification` for user feedback
- **Actions**: `Button`, `Dropdown` for user interactions

#### Custom Components
- **AdvancedAnnotationCanvas**: Konva.js-based annotation canvas
- **SmartAnnotationInterface**: AI-assisted annotation tools
- **DatasetAnalytics**: Analytics and statistics visualization

---

## Backend Architecture

### FastAPI Application Structure

#### Main Application (`backend/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Auto-Labeling Tool API", version="2.0.0")

# CORS configuration for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:12001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers
from api.routes import projects, datasets, annotations, models
app.include_router(projects.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(annotations.router, prefix="/api/v1")
app.include_router(models.router, prefix="/api/v1")
```

### API Route Organization

#### Projects API (`backend/api/routes/projects.py`)
```python
@router.get("/projects/")
async def get_projects():
    """Get all projects with statistics"""
    
@router.post("/projects/")
async def create_project(project: ProjectCreate):
    """Create a new project"""
    
@router.put("/projects/{project_id}")
async def update_project(project_id: int, project: ProjectUpdate):
    """Update project details"""
    
@router.delete("/projects/{project_id}")
async def delete_project(project_id: int):
    """Delete project and all associated data"""
```

#### Datasets API (`backend/api/routes/datasets.py`)
```python
@router.get("/datasets/")
async def get_datasets(project_id: Optional[int] = None):
    """Get datasets, optionally filtered by project"""
    
@router.post("/datasets/")
async def create_dataset(dataset: DatasetCreate):
    """Create a new dataset"""
    
@router.get("/datasets/images/{image_id}")
async def get_image(image_id: str):
    """Get specific image details - CRITICAL for navigation"""
    
@router.post("/datasets/{dataset_id}/upload")
async def upload_images(dataset_id: str, files: List[UploadFile]):
    """Upload multiple images to dataset"""
```

#### Annotations API (`backend/api/routes/annotations.py`)
```python
@router.get("/annotations/{image_id}")
async def get_annotations(image_id: str):
    """Get all annotations for an image"""
    
@router.post("/annotations/")
async def create_annotation(annotation: AnnotationCreate):
    """Create new annotation"""
    
@router.put("/annotations/{annotation_id}")
async def update_annotation(annotation_id: str, annotation: AnnotationUpdate):
    """Update existing annotation"""
```

### Core Business Logic

#### Dataset Manager (`backend/core/dataset_manager.py`)
```python
class DatasetManager:
    def __init__(self, db_session):
        self.db = db_session
        
    async def create_dataset(self, dataset_data: dict) -> Dataset:
        """Create new dataset with validation"""
        
    async def upload_images(self, dataset_id: str, files: List[UploadFile]) -> List[Image]:
        """Process and save uploaded images"""
        
    async def get_dataset_statistics(self, dataset_id: str) -> dict:
        """Calculate dataset statistics"""
        
    async def get_images_for_navigation(self, dataset_id: str) -> List[Image]:
        """Get ordered list of images for navigation"""
```

#### File Handler (`backend/core/file_handler.py`)
```python
class FileHandler:
    @staticmethod
    def save_uploaded_file(file: UploadFile, project_name: str, dataset_name: str) -> str:
        """Save uploaded file to organized directory structure"""
        
    @staticmethod
    def get_image_url(file_path: str) -> str:
        """Generate URL for serving images"""
        # Returns: /uploads/projects/{project}/{dataset}/{filename}
        
    @staticmethod
    def create_project_directory(project_name: str) -> str:
        """Create directory structure for new project"""
```

---

## Database Schema

### Entity Relationship Diagram
```
Projects (1) ←→ (Many) Datasets (1) ←→ (Many) Images (1) ←→ (Many) Annotations
    │                    │                    │                    │
    │                    │                    │                    │
    ▼                    ▼                    ▼                    ▼
[Project Data]      [Dataset Data]      [Image Data]      [Annotation Data]
- name              - name              - filename        - coordinates
- description       - description       - file_path       - class_name
- project_type      - total_images      - dimensions      - confidence
- created_at        - labeled_images    - is_labeled      - created_at
```

### Table Definitions

#### Projects Table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    project_type VARCHAR(50) DEFAULT 'classification',  -- 'classification' or 'object_detection'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    default_model_id INTEGER,
    confidence_threshold FLOAT DEFAULT 0.5,
    iou_threshold FLOAT DEFAULT 0.45,
    FOREIGN KEY (default_model_id) REFERENCES models(id)
);
```

#### Datasets Table
```sql
CREATE TABLE datasets (
    id VARCHAR(36) PRIMARY KEY,                    -- UUID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_images INTEGER DEFAULT 0,
    labeled_images INTEGER DEFAULT 0,
    unlabeled_images INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

#### Images Table
```sql
CREATE TABLE images (
    id VARCHAR(36) PRIMARY KEY,                    -- UUID
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,               -- Critical: Used for image serving
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format VARCHAR(10),
    dataset_id VARCHAR(36) NOT NULL,
    is_labeled BOOLEAN DEFAULT FALSE,
    is_auto_labeled BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    split_type VARCHAR(20) DEFAULT 'unassigned',   -- 'train', 'val', 'test', 'unassigned'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);
```

#### Annotations Table
```sql
CREATE TABLE annotations (
    id VARCHAR(36) PRIMARY KEY,                    -- UUID
    image_id VARCHAR(36) NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    annotation_type VARCHAR(50) DEFAULT 'polygon', -- 'polygon', 'rectangle', 'point'
    coordinates TEXT NOT NULL,                     -- JSON string of coordinate data
    confidence FLOAT DEFAULT 1.0,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);
```

---

## API Reference

### Authentication
Currently, the API does not require authentication. All endpoints are publicly accessible.

### Base URL
- Development: `http://localhost:12000/api/v1`
- Production: Configure based on deployment

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-06-03T13:47:00Z"
}
```

### Error Handling
Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2025-06-03T13:47:00Z"
}
```

### Core Endpoints

#### Projects

**GET /api/v1/projects/**
- **Purpose**: Retrieve all projects with statistics
- **Response**: Array of project objects with calculated statistics
```json
[
  {
    "id": 1,
    "name": "Medical Image Classification",
    "description": "AI-powered medical image analysis",
    "project_type": "classification",
    "created_at": "2025-06-03T10:00:00Z",
    "total_datasets": 2,
    "total_images": 150,
    "labeled_images": 75
  }
]
```

**POST /api/v1/projects/**
- **Purpose**: Create new project
- **Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "project_type": "object_detection"
}
```

#### Datasets

**GET /api/v1/datasets/**
- **Purpose**: List datasets with optional project filter
- **Query Parameters**:
  - `project_id` (optional): Filter by project ID
  - `skip` (optional): Pagination offset
  - `limit` (optional): Number of results (default: 100)

**POST /api/v1/datasets/{dataset_id}/upload**
- **Purpose**: Upload images to dataset
- **Content-Type**: `multipart/form-data`
- **Request**: Form data with multiple files
- **Response**: Array of uploaded image details

#### Images (Critical for Navigation)

**GET /api/v1/datasets/images/{image_id}**
- **Purpose**: Get specific image details
- **Response**:
```json
{
  "id": "91b2560c-68e8-4872-a00a-db3b1607e8aa",
  "filename": "animal_cat.jpg",
  "file_path": "/uploads/projects/today/annotating/animal/animal_cat.jpg",
  "width": 1024,
  "height": 768,
  "dataset_id": "7fecff5a-ca42-4eb2-982f-e4ee3c581aa7",
  "is_labeled": false
}
```

**GET /api/v1/datasets/{dataset_id}/images**
- **Purpose**: List all images in dataset (used for navigation)
- **Response**: Array of image objects ordered for navigation

---

## User Interface Guide

### Navigation Flow

#### Main Navigation
1. **Dashboard** (`/dashboard`) - Overview and quick access
2. **Projects** (`/projects`) - Project management hub
3. **Datasets** (`/datasets`) - Dataset overview
4. **Models** (`/models`) - AI model management

#### Annotation Workflow
1. Select project from Projects page
2. Choose dataset from project details
3. Click "Annotate" to enter manual labeling interface
4. Navigate through images using Previous/Next buttons
5. Create annotations using canvas tools
6. Save annotations and continue to next image

### Key UI Patterns

#### Project Cards
- **Header**: Project type icon + project name
- **Body**: Description + statistics (images, datasets, % annotated)
- **Actions**: Three-dots menu with project operations

#### Dataset Cards
- **Header**: Dataset name + project association
- **Body**: Image count and labeling progress
- **Actions**: Upload images, view details, annotate

#### Navigation Controls
- **Previous/Next Buttons**: Navigate between images in annotation interface
- **Counter Display**: Shows current position (e.g., "2 / 3")
- **Button States**: Disabled when at first/last image

---

## Manual Annotation System

### Annotation Interface Components

#### Canvas System (Konva.js)
The annotation interface uses Konva.js for high-performance canvas rendering:

```javascript
// Canvas initialization
const stage = new Konva.Stage({
  container: 'annotation-canvas',
  width: canvasWidth,
  height: canvasHeight
});

const layer = new Konva.Layer();
stage.add(layer);
```

#### Image Navigation System
**Fixed Implementation** (Recent Update):
```javascript
// Correct parameter extraction from URL
const location = useLocation();
const { datasetId } = useParams();
const searchParams = new URLSearchParams(location.search);
const currentImageId = searchParams.get('imageId');

// Navigation functions
const goToNextImage = () => {
  const currentIndex = imageList.findIndex(img => img.id === currentImageId);
  const nextIndex = currentIndex + 1;
  if (nextIndex < imageList.length) {
    const nextImageId = imageList[nextIndex].id;
    navigate(`/annotate/${datasetId}/manual?imageId=${nextImageId}`);
  }
};

const goToPreviousImage = () => {
  const currentIndex = imageList.findIndex(img => img.id === currentImageId);
  const prevIndex = currentIndex - 1;
  if (prevIndex >= 0) {
    const prevImageId = imageList[prevIndex].id;
    navigate(`/annotate/${datasetId}/manual?imageId=${prevImageId}`);
  }
};
```

#### Image Loading System
**Fixed Implementation** (Recent Update):
```javascript
// Correct image loading using file_path from API
useEffect(() => {
  if (currentImageId) {
    fetch(`/api/v1/datasets/images/${currentImageId}`)
      .then(response => response.json())
      .then(data => {
        // FIXED: Use data.file_path instead of data.url
        const imageUrl = data.file_path || '/placeholder-image.jpg';
        setCurrentImage(data);
        loadImageToCanvas(imageUrl);
      });
  }
}, [currentImageId]);
```

### Annotation Tools

#### 1. Polygon Tool
- Click to add points
- Double-click to complete polygon
- Drag points to adjust shape
- Right-click to delete points

#### 2. Rectangle Tool
- Click and drag to create rectangle
- Resize using corner handles
- Move by dragging center

#### 3. Point Tool
- Single click to place point
- Useful for landmark annotation

### Class Management
- Add new annotation classes
- Assign colors to classes
- Delete unused classes
- Rename existing classes

### Keyboard Shortcuts
- `Ctrl+Z`: Undo last action
- `Ctrl+Y`: Redo action
- `Delete`: Remove selected annotation
- `Escape`: Cancel current tool
- `Space`: Pan mode toggle

---

## File Management System

### Directory Structure
```
uploads/
└── projects/
    └── {project_name}/
        └── {dataset_name}/
            ├── image1.jpg
            ├── image2.png
            └── annotations/
                ├── image1.json
                └── image2.json
```

### File Handling Process

#### Image Upload Flow
1. **Frontend**: User selects files in upload component
2. **API Call**: Files sent to `/api/v1/datasets/{dataset_id}/upload`
3. **Backend Processing**:
   ```python
   async def upload_images(dataset_id: str, files: List[UploadFile]):
       for file in files:
           # Generate unique filename
           filename = f"{uuid.uuid4()}_{file.filename}"
           
           # Create file path
           file_path = f"/uploads/projects/{project_name}/{dataset_name}/{filename}"
           
           # Save file to disk
           with open(file_path, "wb") as buffer:
               shutil.copyfileobj(file.file, buffer)
           
           # Create database record
           image_record = Image(
               id=str(uuid.uuid4()),
               filename=filename,
               file_path=file_path,
               dataset_id=dataset_id
           )
           db.add(image_record)
   ```

#### Image Serving
Images are served as static files through FastAPI:
```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

Frontend accesses images via:
```javascript
const imageUrl = `${API_BASE_URL}${image.file_path}`;
```

### File Organization Best Practices
- Use UUID-based filenames to avoid conflicts
- Maintain original filename in database for reference
- Organize by project and dataset hierarchy
- Implement cleanup for deleted projects/datasets

---

## Development Guide

### Setting Up Development Environment

#### Backend Development
1. **Virtual Environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   ```bash
   # Database will be created automatically on first run
   python main.py
   ```

3. **Development Server**:
   ```bash
   # Run with auto-reload
   uvicorn main:app --reload --host 0.0.0.0 --port 12000
   ```

#### Frontend Development
1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Development Server**:
   ```bash
   # Start with proxy to backend
   npm start
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

### Code Style Guidelines

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Use async/await for database operations
- Implement proper error handling with try/catch blocks

#### JavaScript (Frontend)
- Use ES6+ features (arrow functions, destructuring, etc.)
- Follow React hooks patterns
- Use meaningful variable and function names
- Implement proper error boundaries

### Testing

#### Backend Testing
```bash
cd backend
pytest tests/
```

#### Frontend Testing
```bash
cd frontend
npm test
```

### Adding New Features

#### Adding a New API Endpoint
1. Create route function in appropriate file under `backend/api/routes/`
2. Add database operations if needed
3. Update API documentation
4. Add frontend service call
5. Update UI components

#### Adding a New UI Component
1. Create component file in `frontend/src/components/`
2. Implement using Ant Design patterns
3. Add to appropriate page
4. Update routing if needed

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Images Not Loading
**Symptoms**: Images show "Loading..." but never display actual image

**Causes & Solutions**:
- ✅ **Fixed**: API returns `file_path` field, not `url` field
- ✅ **Fixed**: Frontend now uses `data.file_path` for image loading
- Check backend static file serving is configured correctly
- Verify image files exist in uploads directory

#### 2. Navigation Buttons Not Working
**Symptoms**: Previous/Next buttons don't change images

**Causes & Solutions**:
- ✅ **Fixed**: Parameter extraction from URL query string
- ✅ **Fixed**: React Router imports and navigation logic
- ✅ **Fixed**: Button state management for first/last images

#### 3. React Compilation Errors
**Symptoms**: Frontend fails to compile with import errors

**Causes & Solutions**:
- ✅ **Fixed**: Missing `useLocation` import from React Router
- Check all required imports are included
- Verify React Router version compatibility

#### 4. CORS Issues
**Symptoms**: API calls fail with CORS errors

**Solution**:
```python
# In backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:12001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 5. Database Connection Issues
**Symptoms**: Backend fails to start with database errors

**Solutions**:
- Check SQLite file permissions
- Verify database.db file exists and is writable
- Run database migrations if needed

### Debug Mode

#### Backend Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python main.py
```

#### Frontend Debug Mode
```bash
# Enable React debug mode
REACT_APP_DEBUG=true npm start
```

### Performance Optimization

#### Backend Optimization
- Use database connection pooling
- Implement caching for frequently accessed data
- Optimize image serving with proper headers
- Use async operations for file I/O

#### Frontend Optimization
- Implement image lazy loading
- Use React.memo for expensive components
- Optimize bundle size with code splitting
- Cache API responses where appropriate

---

## Recent Fixes & Improvements

### Navigation System Fixes (June 2025)

#### Issue: Navigation Buttons Not Working
**Problem**: Previous/Next buttons in manual labeling interface were completely non-functional

**Root Causes Identified**:
1. **Parameter Extraction Error**: Code was using `useParams()` to extract `imageId` from URL path, but `imageId` was actually in query string
2. **Missing React Router Import**: `useLocation` hook was not imported, causing compilation failure
3. **Image Loading Field Mismatch**: Frontend expected `data.url` but API returned `data.file_path`

**Solutions Implemented**:

1. **Fixed Parameter Extraction**:
   ```javascript
   // BEFORE (Incorrect)
   const { imageId } = useParams();
   
   // AFTER (Fixed)
   const location = useLocation();
   const searchParams = new URLSearchParams(location.search);
   const currentImageId = searchParams.get('imageId');
   ```

2. **Fixed React Router Imports**:
   ```javascript
   // BEFORE (Missing import)
   import { useNavigate, useParams } from 'react-router-dom';
   
   // AFTER (Complete imports)
   import { useNavigate, useParams, useLocation } from 'react-router-dom';
   ```

3. **Fixed Image Loading**:
   ```javascript
   // BEFORE (Incorrect field)
   const imageUrl = data.url || fallback_path;
   
   // AFTER (Correct field)
   const imageUrl = data.file_path || fallback_path;
   ```

#### Verification Results
- ✅ **Navigation Working**: Previous/Next buttons now function correctly
- ✅ **Image Loading**: Images display properly from backend
- ✅ **URL Updates**: Browser URL updates correctly during navigation
- ✅ **Button States**: Buttons properly disable at first/last images
- ✅ **Counter Display**: Shows correct position (e.g., "2 / 3")

### System Stability Improvements

#### Backend Enhancements
- Improved error handling in image serving
- Better validation for dataset and image operations
- Enhanced logging for debugging navigation issues

#### Frontend Enhancements
- More robust error boundaries
- Better loading state management
- Improved user feedback for operations

### Performance Optimizations
- Optimized image loading with proper caching headers
- Reduced API calls through better state management
- Improved canvas rendering performance

---

## Conclusion

This documentation provides a comprehensive overview of the Auto-Labeling Tool system. The recent fixes have significantly improved the stability and usability of the manual annotation interface, making it a robust platform for computer vision dataset creation.

For additional support or feature requests, please refer to the project repository or contact the development team.

**Last Updated**: June 3, 2025
**Version**: 2.0.0
**Status**: Production Ready ✅