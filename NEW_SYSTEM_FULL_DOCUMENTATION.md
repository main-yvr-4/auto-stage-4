# 🏗️ Auto-Labeling Tool - Complete System Documentation

> **Professional Full-Stack Computer Vision Annotation Platform**  
> A comprehensive system for manual and AI-powered image annotation with project management, dataset organization, and model training capabilities.

---

## 📁 1. Folder Overview

### 🎯 **Root Directory Structure**
```
auto-stage-4/
├── 🎨 frontend/           # React.js frontend application (Port: 12001)
├── ⚙️ backend/            # FastAPI backend server (Port: 12000)
├── 🗄️ database.db        # SQLite database file
├── 📁 uploads/            # File storage for images and projects
├── 🤖 models/             # AI model storage and configuration
├── 📊 datasets/           # Sample datasets for testing
├── 📚 docs/               # Documentation files
├── 🧪 test_images/        # Test image collections
└── 📋 scripts/            # Utility and setup scripts
```

### 🎨 **Frontend Folder (`/frontend/`)**
**Purpose**: React.js single-page application providing the user interface
**Technology**: React 18+, Ant Design, Konva.js for canvas annotation
**Port**: 12001

```
frontend/
├── src/
│   ├── 📄 App.js                    # Main routing and layout configuration
│   ├── 🧩 components/              # Reusable UI components
│   │   ├── Navbar.js               # Main navigation sidebar
│   │   ├── AdvancedAnnotationCanvas.js  # Konva.js annotation canvas
│   │   ├── EnhancedAnnotationCanvas.js  # Enhanced canvas with AI tools
│   │   ├── SmartAnnotationInterface.js  # AI-assisted annotation
│   │   ├── ManualAnnotationTools.js     # Manual drawing tools
│   │   ├── DatasetAnalytics.js          # Analytics visualizations
│   │   ├── DataAugmentation.js          # Data augmentation controls
│   │   └── ActiveLearning/              # Active learning components
│   ├── 📱 pages/                   # Main application pages
│   │   ├── Dashboard.js            # Overview dashboard
│   │   ├── Projects.js             # Project management hub
│   │   ├── ProjectDetail.js        # Individual project view
│   │   ├── ProjectWorkspace.js     # Full-screen project workspace
│   │   ├── AnnotateLauncher.js     # Annotation mode selector
│   │   ├── AnnotateProgress.jsx    # Annotation progress tracking
│   │   ├── ManualLabeling.jsx      # Manual annotation interface
│   │   └── ModelsModern.js         # AI model management
│   ├── 🔌 services/               # API communication layer
│   │   └── api.js                 # Centralized API calls
│   └── 🛠️ utils/                  # Utility functions
│       └── errorHandler.js        # Error handling utilities
├── public/                        # Static assets
└── package.json                   # Dependencies and scripts
```

### ⚙️ **Backend Folder (`/backend/`)**
**Purpose**: FastAPI server handling business logic, database operations, and AI model integration
**Technology**: FastAPI, SQLAlchemy, SQLite, Python 3.8+
**Port**: 12000

```
backend/
├── 🚀 main.py                     # FastAPI application entry point
├── 🌐 api/                        # API route handlers
│   ├── routes/                    # Organized API endpoints
│   │   ├── projects.py            # Project CRUD operations
│   │   ├── datasets.py            # Dataset and image management
│   │   ├── annotations.py         # Annotation CRUD operations
│   │   ├── models.py              # AI model management
│   │   ├── export.py              # Data export functionality
│   │   ├── enhanced_export.py     # Advanced export formats
│   │   ├── analytics.py           # Analytics and statistics
│   │   ├── augmentation.py        # Data augmentation
│   │   └── dataset_management.py  # Advanced dataset operations
│   ├── active_learning.py         # Active learning algorithms
│   └── smart_segmentation.py      # AI-powered segmentation
├── 🧠 core/                       # Business logic layer
│   ├── config.py                  # Application configuration
│   ├── dataset_manager.py         # Dataset operations
│   ├── file_handler.py            # File system operations
│   ├── auto_labeler.py            # AI auto-labeling logic
│   └── active_learning.py         # Active learning implementation
├── 🗄️ database/                   # Database layer
│   ├── models.py                  # SQLAlchemy ORM models
│   ├── database.py                # Database connection and setup
│   ├── operations.py              # Database operations
│   └── base.py                    # Base database configuration
├── 🤖 models/                     # AI model management
│   ├── model_manager.py           # Model loading and inference
│   └── training.py                # Model training logic
└── 🛠️ utils/                      # Backend utilities
    └── augmentation_utils.py       # Image augmentation utilities
```

### 🗄️ **Database (`database.db`)**
**Purpose**: SQLite database storing all application data
**Tables**: Projects, Datasets, Images, Annotations, Models, Users

### 📁 **Uploads Folder (`/uploads/`)**
**Purpose**: Organized file storage for user-uploaded images
**Structure**:
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

---

## 📄 2. Key Files Explained

### 🎯 **Core Application Files**

#### 🎨 `frontend/src/App.js`
**Purpose**: Main application router and layout configuration
**Key Features**:
- React Router setup with nested routes
- Layout structure with Navbar and Content areas
- Route definitions for all major pages
- Special full-screen layout for ProjectWorkspace

**Routes Defined**:
```javascript
/ → Dashboard (overview)
/projects → Projects (project management)
/projects/:projectId → ProjectDetail (individual project)
/projects/:projectId/workspace → ProjectWorkspace (full-screen)
/annotate-launcher/:datasetId → AnnotateLauncher (annotation mode selection)
/annotate-progress/:datasetId → AnnotateProgress (progress tracking)
/annotate/:datasetId/manual → ManualLabeling (manual annotation interface)
/models → ModelsModern (AI model management)
```

#### 🚀 `backend/main.py`
**Purpose**: FastAPI application entry point and configuration
**Key Features**:
- FastAPI app initialization with metadata
- CORS middleware configuration for frontend communication
- API router inclusion for all endpoints
- Static file serving for uploaded images
- Database initialization

**API Route Prefixes**:
```python
/api/v1/projects → Project operations
/api/v1/datasets → Dataset and image operations
/api/v1/images → Image annotation operations
/api/v1/models → AI model operations
/api/v1/export → Data export operations
```

### 🎨 **Frontend Page Components**

#### 📊 `frontend/src/pages/Dashboard.js`
**Purpose**: Main overview dashboard showing system statistics
**UI Elements**:
- Project count cards
- Recent activity feed
- Quick action buttons
- System health indicators

#### 🗂️ `frontend/src/pages/Projects.js`
**Purpose**: Central project management interface
**UI Elements**:
- **"New Project" Button**: Opens project creation modal
- **Project Cards**: Display project info with statistics
- **Three-dots Menu**: Per-project actions (rename, duplicate, merge, delete)
- **Search Bar**: Filter projects by name
- **Sort Dropdown**: Sort by date, name, or progress

**Data Flow**:
```
User clicks "New Project" → Modal opens → Form submission → 
POST /api/v1/projects → Database insert → UI refresh
```

#### 🎯 `frontend/src/pages/ManualLabeling.jsx`
**Purpose**: Core manual annotation interface with canvas-based drawing
**UI Elements**:
- **Previous/Next Buttons**: Navigate between images in dataset
- **Image Counter**: Shows current position (e.g., "2 / 3")
- **Annotation Canvas**: Konva.js-based drawing area
- **Tool Palette**: Drawing tools (polygon, rectangle, point)
- **Class Manager**: Add/edit annotation classes
- **Zoom Controls**: Zoom in/out and pan
- **Undo/Redo Buttons**: Action history management
- **Save Button**: Save annotations to backend

**Navigation System** (Recently Fixed):
```javascript
// URL structure: /annotate/{datasetId}/manual?imageId={imageId}
const location = useLocation();
const { datasetId } = useParams();
const searchParams = new URLSearchParams(location.search);
const currentImageId = searchParams.get('imageId');

// Navigation functions
const goToNextImage = () => {
  const nextIndex = currentImageIndex + 1;
  if (nextIndex < imageList.length) {
    navigate(`/annotate/${datasetId}/manual?imageId=${imageList[nextIndex].id}`);
  }
};
```

**Data Flow**:
```
Load image → GET /api/v1/datasets/images/{imageId} → 
Display on canvas → User annotates → Save annotations → 
POST /api/v1/images/{imageId}/annotations → Database save
```

#### 🚀 `frontend/src/pages/AnnotateLauncher.js`
**Purpose**: Annotation mode selection interface
**UI Elements**:
- **Manual Annotation Button**: Launch manual labeling interface
- **Auto-Annotation Button**: Start AI-powered annotation
- **Hybrid Mode Button**: Combine manual and AI annotation
- **Settings Panel**: Configure annotation parameters

#### 📈 `frontend/src/pages/AnnotateProgress.jsx`
**Purpose**: Track annotation progress and statistics
**UI Elements**:
- **Progress Bar**: Visual progress indicator
- **Statistics Cards**: Labeled vs unlabeled counts
- **Image Grid**: Thumbnail view with annotation status
- **Export Button**: Export annotated data

### ⚙️ **Backend API Route Files**

#### 🗂️ `backend/api/routes/projects.py`
**Purpose**: Project CRUD operations and management
**Key Endpoints**:
```python
GET /api/v1/projects/           # List all projects with statistics
POST /api/v1/projects/          # Create new project
GET /api/v1/projects/{id}       # Get project details
PUT /api/v1/projects/{id}       # Update project
DELETE /api/v1/projects/{id}    # Delete project
POST /api/v1/projects/{id}/duplicate  # Duplicate project
POST /api/v1/projects/merge     # Merge multiple projects
```

#### 📁 `backend/api/routes/datasets.py`
**Purpose**: Dataset and image management operations
**Key Endpoints**:
```python
GET /api/v1/datasets/                    # List datasets
POST /api/v1/datasets/                   # Create dataset
GET /api/v1/datasets/{id}/images         # List images in dataset
POST /api/v1/datasets/{id}/upload        # Upload images
GET /api/v1/datasets/images/{image_id}   # Get specific image (critical for navigation)
DELETE /api/v1/images/{id}               # Delete image
```

#### 🏷️ `backend/api/routes/annotations.py`
**Purpose**: Annotation CRUD operations
**Key Endpoints**:
```python
GET /api/v1/images/{image_id}/annotations     # Get image annotations
POST /api/v1/images/{image_id}/annotations    # Create annotation
PUT /api/v1/annotations/{id}                  # Update annotation
DELETE /api/v1/annotations/{id}               # Delete annotation
```

### 🧠 **Core Business Logic Files**

#### 📁 `backend/core/dataset_manager.py`
**Purpose**: High-level dataset operations and business logic
**Key Functions**:
```python
create_dataset()        # Create new dataset with validation
upload_images()         # Process and save uploaded images
get_dataset_stats()     # Calculate statistics (total, labeled, unlabeled)
delete_images()         # Remove images from filesystem and database
organize_dataset()      # Organize images into train/val/test splits
```

#### 📂 `backend/core/file_handler.py`
**Purpose**: File system operations and image processing
**Key Functions**:
```python
save_uploaded_file()    # Save file to organized directory structure
get_image_url()         # Generate URL for serving images (returns /uploads/...)
create_directory()      # Create project/dataset directories
delete_file()          # Remove file from filesystem
get_image_metadata()   # Extract image dimensions, format, size
```

---

## 🔘 3. UI Button & Tool Behavior

### 🗂️ **Projects Page UI Elements**

#### ➕ **"New Project" Button**
**Location**: Top-right of Projects page
**Click Action**:
1. Opens modal dialog with project creation form
2. Form fields: Name, Description, Project Type (Classification/Object Detection)
3. **Submit** → `POST /api/v1/projects/` → Database insert → Page refresh

#### 🔧 **Three-Dots Menu (Per Project)**
**Location**: Bottom-right of each project card
**Menu Options**:

1. **✏️ "Rename Project"**
   - Opens modal with current name pre-filled
   - **Save** → `PUT /api/v1/projects/{id}` → Database update → Card refresh

2. **📋 "Duplicate Project"**
   - Opens modal for new project name
   - **Create** → `POST /api/v1/projects/{id}/duplicate` → 
   - Copies all datasets, images, and annotations → New project created

3. **🔗 "Merge with Other Project"**
   - Opens modal with project selection dropdown
   - **Merge** → `POST /api/v1/projects/merge` → 
   - Combines datasets from selected projects → New merged project

4. **🗑️ "Delete Project"**
   - Shows confirmation modal with warning
   - **Confirm** → `DELETE /api/v1/projects/{id}` → 
   - Removes project, datasets, images, and files → Page refresh

#### 🔍 **Search Bar**
**Location**: Top of Projects page
**Behavior**: Real-time filtering of project cards by name/description

#### 📊 **Sort Dropdown**
**Location**: Next to search bar
**Options**: Date Created, Date Modified, Name (A-Z), Progress (%)
**Behavior**: Re-orders project cards based on selection

### 🎯 **Manual Labeling Interface UI Elements**

#### ⬅️➡️ **Previous/Next Navigation Buttons**
**Location**: Top navigation bar
**Behavior** (Recently Fixed):
```javascript
// Previous Button Click
const goToPreviousImage = () => {
  const currentIndex = imageList.findIndex(img => img.id === currentImageId);
  const prevIndex = currentIndex - 1;
  if (prevIndex >= 0) {
    const prevImageId = imageList[prevIndex].id;
    navigate(`/annotate/${datasetId}/manual?imageId=${prevImageId}`);
  }
};

// Next Button Click  
const goToNextImage = () => {
  const currentIndex = imageList.findIndex(img => img.id === currentImageId);
  const nextIndex = currentIndex + 1;
  if (nextIndex < imageList.length) {
    const nextImageId = imageList[nextIndex].id;
    navigate(`/annotate/${datasetId}/manual?imageId=${nextImageId}`);
  }
};
```

**Data Flow**:
```
Button Click → URL Update → useEffect triggers → 
GET /api/v1/datasets/images/{newImageId} → 
Image loads on canvas → Button states update
```

#### 🎨 **Annotation Tools**

1. **🔺 Polygon Tool**
   - **Click**: Add point to polygon
   - **Double-click**: Complete polygon
   - **Drag point**: Modify polygon shape
   - **Right-click**: Delete point

2. **⬜ Rectangle Tool**
   - **Click + Drag**: Create rectangle
   - **Drag corners**: Resize rectangle
   - **Drag center**: Move rectangle

3. **📍 Point Tool**
   - **Click**: Place point annotation
   - **Drag**: Move point

#### 🏷️ **Class Management Panel**
**Location**: Left sidebar
**Elements**:
- **"+ Add Class" Button**: Opens class creation modal
- **Class List**: Shows all annotation classes with color indicators
- **Delete Class Button**: Removes class (with confirmation)

#### 🔧 **Canvas Controls**
**Location**: Right sidebar
**Tools**:
- **🔍 Zoom In/Out**: Adjust canvas zoom level
- **👋 Pan Tool**: Move around large images
- **↩️ Undo**: Revert last action
- **↪️ Redo**: Restore undone action
- **🗑️ Delete**: Remove selected annotation
- **💾 Save**: Save all annotations to backend

**Save Button Data Flow**:
```
Save Click → Collect all annotations → 
POST /api/v1/images/{imageId}/annotations → 
Database save → Success notification
```

### 🚀 **Annotation Launcher UI Elements**

#### 📝 **Manual Annotation Button**
**Click Action**: 
```
Navigate to /annotate/{datasetId}/manual?imageId={firstImageId}
```

#### 🤖 **Auto-Annotation Button**
**Click Action**:
1. Opens model selection modal
2. **Start** → `POST /api/v1/datasets/{id}/auto-annotate` → 
3. Background processing → Progress updates → Completion notification

#### 🔄 **Hybrid Mode Button**
**Click Action**: Launches interface combining manual tools with AI suggestions

---

## 🔁 4. Data Flow (End-to-End)

### 📊 **Creating a Project**
```
Frontend (Projects Page)
    ↓ User clicks "New Project"
Modal Form Opens
    ↓ User fills form and submits
API Request: POST /api/v1/projects/
    ↓ Request body: {name, description, project_type}
FastAPI Route: projects.py → create_project()
    ↓ Validates input data
Database Operation: SQLAlchemy ORM
    ↓ INSERT INTO projects (name, description, ...)
File System: core/file_handler.py
    ↓ Creates directory: uploads/projects/{project_name}/
Response: Project object with ID
    ↓ Returns to frontend
UI Update: Projects page refreshes
    ↓ New project card appears
```

### 📁 **Uploading Images**
```
Frontend (Project Detail Page)
    ↓ User selects files in upload component
API Request: POST /api/v1/datasets/{dataset_id}/upload
    ↓ Multipart form data with files
FastAPI Route: datasets.py → upload_images()
    ↓ Processes each uploaded file
File Processing: core/file_handler.py
    ↓ Generates unique filename with UUID
    ↓ Saves to uploads/projects/{project}/{dataset}/
    ↓ Extracts metadata (dimensions, format, size)
Database Operations: 
    ↓ INSERT INTO images (filename, file_path, width, height, ...)
    ↓ UPDATE datasets SET total_images = total_images + 1
Response: Array of image objects
    ↓ Returns to frontend
UI Update: Image grid refreshes
    ↓ New images appear with thumbnails
```

### 🎯 **Manual Image Annotation**
```
Frontend (Manual Labeling Interface)
    ↓ Page loads with imageId from URL
API Request: GET /api/v1/datasets/images/{imageId}
    ↓ Fetch image details
FastAPI Route: datasets.py → get_image()
    ↓ Query database for image record
Database Query: SELECT * FROM images WHERE id = {imageId}
Response: Image object with file_path
    ↓ {id, filename, file_path: "/uploads/...", width, height}
Frontend Image Loading:
    ↓ Uses file_path to load image on Konva canvas
    ↓ User draws annotations using tools
Annotation Save Process:
    ↓ User clicks Save button
API Request: POST /api/v1/images/{imageId}/annotations
    ↓ Request body: {class_name, coordinates, annotation_type}
FastAPI Route: annotations.py → create_annotation()
    ↓ Validates annotation data
Database Operation:
    ↓ INSERT INTO annotations (image_id, class_name, coordinates, ...)
    ↓ UPDATE images SET is_labeled = TRUE
Response: Annotation object with ID
    ↓ Returns to frontend
UI Update: Annotation appears on canvas
    ↓ Save success notification shown
```

### 📈 **Viewing Progress**
```
Frontend (Annotate Progress Page)
    ↓ Page loads for specific dataset
API Request: GET /api/v1/datasets/{datasetId}/stats
    ↓ Fetch dataset statistics
FastAPI Route: datasets.py → get_dataset_stats()
    ↓ Calculates statistics from database
Database Queries:
    ↓ SELECT COUNT(*) FROM images WHERE dataset_id = {id}
    ↓ SELECT COUNT(*) FROM images WHERE dataset_id = {id} AND is_labeled = TRUE
    ↓ SELECT COUNT(*) FROM annotations WHERE image_id IN (...)
Response: Statistics object
    ↓ {total_images, labeled_images, total_annotations, progress_percentage}
UI Update: Progress components refresh
    ↓ Progress bar, statistics cards, completion percentage
```

---

## ⚙️ 5. Backend API Routes

### 🗂️ **Projects API (`/api/v1/projects`)**

#### `GET /api/v1/projects/`
**Purpose**: Retrieve all projects with calculated statistics
**Frontend Usage**: Projects page initial load
**Response Example**:
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
    "labeled_images": 75,
    "progress_percentage": 50.0
  }
]
```

#### `POST /api/v1/projects/`
**Purpose**: Create new project
**Frontend Usage**: "New Project" button in Projects page
**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "project_type": "object_detection"
}
```

#### `DELETE /api/v1/projects/{project_id}`
**Purpose**: Delete project and all associated data
**Frontend Usage**: "Delete Project" option in three-dots menu
**Side Effects**: Removes all datasets, images, annotations, and files

### 📁 **Datasets API (`/api/v1/datasets`)**

#### `GET /api/v1/datasets/{dataset_id}/images`
**Purpose**: List all images in dataset for navigation
**Frontend Usage**: Manual labeling interface navigation
**Response**: Array of image objects ordered for navigation

#### `GET /api/v1/datasets/images/{image_id}` ⭐ **CRITICAL**
**Purpose**: Get specific image details
**Frontend Usage**: Manual labeling interface image loading
**Response Example**:
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

#### `POST /api/v1/datasets/{dataset_id}/upload`
**Purpose**: Upload multiple images to dataset
**Frontend Usage**: Image upload components
**Content-Type**: `multipart/form-data`
**Processing**: Saves files, extracts metadata, creates database records

### 🏷️ **Annotations API (`/api/v1/images`)**

#### `GET /api/v1/images/{image_id}/annotations`
**Purpose**: Retrieve all annotations for specific image
**Frontend Usage**: Manual labeling interface annotation loading
**Response**: Array of annotation objects with coordinates

#### `POST /api/v1/images/{image_id}/annotations`
**Purpose**: Create new annotation for image
**Frontend Usage**: Save button in manual labeling interface
**Request Body**:
```json
{
  "class_name": "cat",
  "annotation_type": "polygon",
  "coordinates": "[{\"x\": 100, \"y\": 150}, {\"x\": 200, \"y\": 150}, ...]",
  "confidence": 1.0
}
```

### 🤖 **Models API (`/api/v1/models`)**

#### `GET /api/v1/models/`
**Purpose**: List available AI models
**Frontend Usage**: Models page, auto-annotation model selection

#### `POST /api/v1/models/{model_id}/predict`
**Purpose**: Run AI model inference on image
**Frontend Usage**: Auto-annotation functionality

### 📤 **Export API (`/api/v1/export`)**

#### `POST /api/v1/export/dataset/{dataset_id}`
**Purpose**: Export dataset in specified format
**Frontend Usage**: Export buttons in dataset views
**Supported Formats**: YOLO, COCO, Pascal VOC, Custom JSON

---

## 🧱 6. Database Models

### 📊 **Entity Relationship Diagram**
```
Projects (1) ←→ (Many) Datasets (1) ←→ (Many) Images (1) ←→ (Many) Annotations
    │                    │                    │                    │
    │                    │                    │                    │
    ▼                    ▼                    ▼                    ▼
[Project Data]      [Dataset Data]      [Image Data]      [Annotation Data]
```

### 🗂️ **Projects Model**
**File**: `backend/database/models.py`
**Purpose**: Store project information and configuration
```python
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    project_type = Column(String(50), default='classification')  # 'classification' or 'object_detection'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # AI Model Configuration
    default_model_id = Column(Integer, ForeignKey('models.id'))
    confidence_threshold = Column(Float, default=0.5)
    iou_threshold = Column(Float, default=0.45)
    
    # Relationships
    datasets = relationship("Dataset", back_populates="project", cascade="all, delete-orphan")
```

### 📁 **Datasets Model**
**Purpose**: Organize images into logical groups within projects
```python
class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Statistics (calculated fields)
    total_images = Column(Integer, default=0)
    labeled_images = Column(Integer, default=0)
    unlabeled_images = Column(Integer, default=0)
    
    # Relationships
    project = relationship("Project", back_populates="datasets")
    images = relationship("Image", back_populates="dataset", cascade="all, delete-orphan")
```

### 🖼️ **Images Model**
**Purpose**: Store image metadata and file information
```python
class Image(Base):
    __tablename__ = "images"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    file_path = Column(String(500), nullable=False)  # Critical: Used for serving images
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    format = Column(String(10))  # 'jpg', 'png', 'bmp', etc.
    
    # Dataset relationship
    dataset_id = Column(String(36), ForeignKey('datasets.id'), nullable=False)
    
    # Annotation status
    is_labeled = Column(Boolean, default=False)
    is_auto_labeled = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Dataset split assignment
    split_type = Column(String(20), default='unassigned')  # 'train', 'val', 'test', 'unassigned'
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="images")
    annotations = relationship("Annotation", back_populates="image", cascade="all, delete-orphan")
```

### 🏷️ **Annotations Model**
**Purpose**: Store annotation data for images
```python
class Annotation(Base):
    __tablename__ = "annotations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = Column(String(36), ForeignKey('images.id'), nullable=False)
    class_name = Column(String(255), nullable=False)
    annotation_type = Column(String(50), default='polygon')  # 'polygon', 'rectangle', 'point'
    
    # Coordinate data stored as JSON string
    coordinates = Column(Text, nullable=False)  # JSON: [{"x": 100, "y": 150}, ...]
    
    # Confidence and verification
    confidence = Column(Float, default=1.0)
    is_auto_generated = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    image = relationship("Image", back_populates="annotations")
```

### 🤖 **Models Model**
**Purpose**: Store AI model information and configuration
```python
class Model(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    model_type = Column(String(50))  # 'yolo', 'sam', 'custom'
    file_path = Column(String(500))
    config = Column(Text)  # JSON configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 🔗 **Relationships Summary**
```
One Project → Many Datasets
One Dataset → Many Images  
One Image → Many Annotations
One Model → Many Projects (default_model_id)
```

---

## 🧩 7. Frontend Components

### 🎨 **Canvas Components**

#### 🖼️ **AdvancedAnnotationCanvas.js**
**Purpose**: High-performance Konva.js-based annotation canvas
**Features**:
- Multi-layer rendering (image layer, annotation layer, UI layer)
- Zoom and pan functionality
- Real-time annotation drawing
- Selection and editing of existing annotations

**Key Functions**:
```javascript
loadImage(imageUrl)           // Load image onto canvas
addPolygonAnnotation(points)  // Create polygon annotation
addRectangleAnnotation(rect)  // Create rectangle annotation
selectAnnotation(id)          // Select annotation for editing
deleteAnnotation(id)          // Remove annotation
exportAnnotations()           // Get all annotations as JSON
```

#### 🤖 **EnhancedAnnotationCanvas.js**
**Purpose**: AI-enhanced canvas with smart annotation features
**Features**:
- AI-powered polygon suggestions
- Smart edge detection
- Auto-completion of partial annotations
- Integration with SAM (Segment Anything Model)

#### 🎯 **SmartAnnotationInterface.js**
**Purpose**: AI-assisted annotation tools and suggestions
**Features**:
- Click-to-segment using AI models
- Batch annotation suggestions
- Quality assessment of annotations
- Active learning integration

### 🛠️ **Tool Components**

#### ✏️ **ManualAnnotationTools.js**
**Purpose**: Manual drawing tools for precise annotation
**Tools Provided**:
- **Polygon Tool**: Multi-point shape creation
- **Rectangle Tool**: Bounding box creation
- **Point Tool**: Landmark annotation
- **Brush Tool**: Freehand drawing
- **Eraser Tool**: Remove parts of annotations

**Tool State Management**:
```javascript
const [activeTool, setActiveTool] = useState('polygon');
const [isDrawing, setIsDrawing] = useState(false);
const [currentAnnotation, setCurrentAnnotation] = useState(null);
```

### 📊 **Analytics Components**

#### 📈 **DatasetAnalytics.js**
**Purpose**: Visualize dataset statistics and annotation progress
**Visualizations**:
- Progress charts (labeled vs unlabeled)
- Class distribution pie charts
- Annotation quality metrics
- Time-based progress tracking

**Chart Types**:
- Bar charts for class counts
- Line charts for progress over time
- Heatmaps for annotation density

#### 🔄 **DataAugmentation.js**
**Purpose**: Configure and preview data augmentation settings
**Augmentation Options**:
- Rotation, scaling, flipping
- Color adjustments (brightness, contrast, saturation)
- Noise addition and blur effects
- Crop and resize operations

### 🧭 **Navigation Components**

#### 📋 **Navbar.js**
**Purpose**: Main application navigation sidebar
**Navigation Items**:
```javascript
const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/' },
  { key: 'projects', icon: <ProjectOutlined />, label: 'Projects', path: '/projects' },
  { key: 'models', icon: <RobotOutlined />, label: 'Models', path: '/models' },
];
```

**Active State Management**:
- Highlights current page
- Responsive design for mobile
- Collapsible sidebar option

### 🎛️ **Management Components**

#### 📁 **DatasetManager.js**
**Purpose**: Dataset creation and management interface
**Features**:
- Create new datasets
- Upload images with drag-and-drop
- Bulk operations (select all, delete selected)
- Dataset statistics display

#### 🗂️ **DatasetManagement.js**
**Purpose**: Advanced dataset operations and organization
**Features**:
- Dataset splitting (train/val/test)
- Merge datasets
- Export in multiple formats
- Quality control and validation

---

## 🧠 8. Tech Stack Summary

### 🎨 **Frontend Technologies**
- **React 18+**: Modern React with hooks and functional components
- **Ant Design 5.x**: Professional UI component library
- **React Router 6**: Client-side routing and navigation
- **Konva.js**: High-performance 2D canvas library for annotations
- **Axios**: HTTP client for API communication
- **React Hooks**: useState, useEffect, useContext for state management

### ⚙️ **Backend Technologies**
- **FastAPI**: Modern, fast Python web framework with automatic API docs
- **SQLAlchemy**: Python ORM for database operations
- **SQLite**: Lightweight, file-based database
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server for FastAPI
- **Pillow (PIL)**: Python image processing library

### 🗄️ **Database & Storage**
- **SQLite**: Primary database for structured data
- **File System**: Organized directory structure for image storage
- **JSON**: Annotation coordinate storage format

### 🤖 **AI/ML Integration**
- **YOLO**: Object detection models
- **SAM (Segment Anything Model)**: Advanced segmentation
- **OpenCV**: Computer vision operations
- **NumPy**: Numerical computations
- **PyTorch**: Deep learning framework support

### 🛠️ **Development Tools**
- **npm/yarn**: Package management
- **Webpack**: Module bundling (via Create React App)
- **ESLint**: Code linting and formatting
- **Git**: Version control

### 🚀 **Deployment & Infrastructure**
- **Docker**: Containerization support
- **CORS**: Cross-origin resource sharing configuration
- **Static File Serving**: FastAPI static file mounting
- **Environment Variables**: Configuration management

---

## 🔧 9. System Integration Points

### 🔌 **Frontend ↔ Backend Communication**
**Protocol**: HTTP/HTTPS REST API
**Data Format**: JSON
**Authentication**: Currently none (can be extended)
**Error Handling**: Standardized error responses with status codes

### 📁 **File System Integration**
**Upload Flow**: Frontend → Multipart Form → FastAPI → File System
**Serving Flow**: Frontend Request → FastAPI Static Files → Browser
**Organization**: Hierarchical directory structure by project/dataset

### 🗄️ **Database Integration**
**ORM**: SQLAlchemy with declarative models
**Migrations**: Automatic table creation on startup
**Transactions**: Atomic operations for data consistency
**Relationships**: Foreign key constraints and cascading deletes

### 🤖 **AI Model Integration**
**Model Loading**: Dynamic model loading based on configuration
**Inference Pipeline**: Image → Preprocessing → Model → Postprocessing → Annotations
**Model Management**: Version control and model switching

---

## 🎯 10. Key User Workflows

### 📊 **Complete Project Workflow**
```
1. Create Project → 2. Create Dataset → 3. Upload Images → 
4. Launch Annotation → 5. Annotate Images → 6. Review Progress → 
7. Export Data → 8. Train Model
```

### 🎯 **Manual Annotation Workflow**
```
1. Select Dataset → 2. Launch Manual Labeling → 3. Navigate to Image → 
4. Select Tool → 5. Draw Annotation → 6. Assign Class → 
7. Save Annotation → 8. Navigate to Next Image
```

### 🤖 **AI-Assisted Workflow**
```
1. Select Dataset → 2. Choose AI Model → 3. Configure Parameters → 
4. Run Auto-Annotation → 5. Review Results → 6. Manual Corrections → 
7. Verify Annotations → 8. Export Final Dataset
```

---

This documentation provides a complete understanding of the Auto-Labeling Tool system architecture, enabling developers, AI assistants, and product managers to effectively work with and extend the platform. The system is designed for scalability, maintainability, and ease of use in computer vision annotation workflows.

**Last Updated**: June 3, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅