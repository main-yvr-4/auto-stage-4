# Complete System Documentation - Auto-Labeling-Tool

## Table of Contents
1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Schema](#database-schema)
6. [UI Components Guide](#ui-components-guide)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Page-by-Page Breakdown](#page-by-page-breakdown)
9. [Button Functionality Guide](#button-functionality-guide)
10. [Data Flow & State Management](#data-flow--state-management)
11. [File Upload System](#file-upload-system)
12. [Modification Guide](#modification-guide)
13. [Common Tasks & Solutions](#common-tasks--solutions)

---

## System Overview

### Technology Stack
- **Frontend**: React.js with Ant Design UI components
- **Backend**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **File Storage**: Local filesystem (`uploads/` directory)
- **Routing**: React Router for frontend navigation
- **State Management**: React hooks (useState, useEffect)

### Application Purpose
AI-powered auto-labeling tool for computer vision projects with support for:
- Image classification and object detection projects
- Dataset management and organization
- Manual and automated annotation
- Model training and inference
- Active learning workflows

---

## Project Structure

```
auto-ui-restoring/
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                   # Main application pages
│   │   ├── services/                # API communication
│   │   └── utils/                   # Utility functions
│   ├── public/                      # Static assets
│   └── package.json                 # Frontend dependencies
├── backend/                         # FastAPI backend application
│   ├── api/                        # API route handlers
│   │   └── routes/                 # Organized API endpoints
│   ├── core/                       # Business logic
│   ├── database/                   # Database models and operations
│   └── main.py                     # Backend entry point
├── uploads/                        # File storage directory
│   └── [Project Name]/            # Project-specific folders
│       └── [Dataset Name]/        # Dataset-specific folders
├── database.db                    # SQLite database file
├── requirements.txt               # Python dependencies
└── [Various config and doc files]
```

---

## Frontend Architecture

### Main Application Structure

#### Entry Point: `frontend/src/App.js`
```javascript
// Main app component with routing configuration
- Uses React Router for navigation
- Defines all application routes
- Wraps components with Ant Design ConfigProvider
```

#### Navigation: `frontend/src/components/Navbar.js`
```javascript
// Sidebar navigation component
- Uses Ant Design Menu component
- Defines navigation items with icons
- Handles active state management
- Navigation items:
  * Dashboard (/dashboard)
  * Models (/models)
  * Projects (/projects) 
  * Datasets (/datasets)
  * Annotate (/annotate)
  * Active Learning (/active-learning)
```

### Page Components

#### 1. Projects Page: `frontend/src/pages/Projects.js`
**Purpose**: Main project management interface
**Key Features**:
- Project cards with statistics display
- Three-dots dropdown menu for project actions
- Search and filter functionality
- Create new project button

**State Management**:
```javascript
const [projects, setProjects] = useState([])           // Project list
const [loading, setLoading] = useState(true)           // Loading state
const [searchTerm, setSearchTerm] = useState('')       // Search filter
const [sortBy, setSortBy] = useState('updated_at')     // Sort option
const [openDropdownId, setOpenDropdownId] = useState(null) // Dropdown state
```

**Key Functions**:
- `fetchProjects()`: Loads project data from API
- `handleSearch()`: Filters projects by search term
- `handleSort()`: Sorts projects by selected criteria
- `handleRename()`: Opens rename modal
- `handleDuplicate()`: Opens duplicate modal
- `handleMerge()`: Opens merge modal
- `handleDelete()`: Opens delete confirmation

#### 2. Datasets Page: `frontend/src/pages/Datasets.js`
**Purpose**: Dataset management and overview
**Key Features**:
- Dataset cards with image counts
- Filter by project
- Upload new images functionality

#### 3. Dataset Detail Page: `frontend/src/pages/DatasetDetailModern.js`
**Purpose**: Individual dataset management
**Key Features**:
- Image grid display
- Bulk operations (select all, delete selected)
- Image upload with drag-and-drop
- Annotation status tracking

#### 4. Models Page: `frontend/src/pages/ModelsModern.js`
**Purpose**: Model management and training
**Key Features**:
- Model cards with training status
- Training configuration
- Model deployment options

### UI Components

#### Project Card Component (in Projects.js)
```javascript
// Card structure:
<Card>
  <Card.Meta 
    avatar={<ProjectTypeIcon />}
    title={project.name}
    description={project.description}
  />
  <Statistics>
    <Statistic title="Images" value={project.total_images} />
    <Statistic title="Datasets" value={project.total_datasets} />
    <Statistic title="% annotated" value={annotationPercentage} />
  </Statistics>
  <Dropdown menu={actionMenu}>
    <Button icon={<MoreOutlined />} />
  </Dropdown>
</Card>
```

#### Three-Dots Menu Actions
```javascript
const actionMenu = {
  items: [
    { key: 'rename', icon: <EditOutlined />, label: 'Rename Project' },
    { key: 'duplicate', icon: <CopyOutlined />, label: 'Duplicate Project' },
    { key: 'merge', icon: <MergeCellsOutlined />, label: 'Merge with Other Project' },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Delete Project', danger: true }
  ]
}
```

---

## Backend Architecture

### Main Application: `backend/main.py`
```python
# FastAPI application setup
- CORS configuration for frontend communication
- API router inclusion
- Static file serving for uploads
- Database initialization
```

### API Routes Structure

#### Projects API: `backend/api/routes/projects.py`
**Endpoints**:
- `GET /api/v1/projects/` - List all projects with statistics
- `POST /api/v1/projects/` - Create new project
- `GET /api/v1/projects/{project_id}` - Get project details
- `PUT /api/v1/projects/{project_id}` - Update project
- `DELETE /api/v1/projects/{project_id}` - Delete project
- `POST /api/v1/projects/{project_id}/duplicate` - Duplicate project
- `POST /api/v1/projects/merge` - Merge projects

**Key Functions**:
```python
def get_projects():
    # Fetches projects with calculated statistics
    # Handles NULL values in dataset statistics
    # Returns: List of projects with total_images, total_datasets, labeled_images

def create_project():
    # Creates new project with validation
    # Sets default values for thresholds
    # Creates project directory in uploads/

def duplicate_project():
    # Creates copy of project with new name
    # Copies all datasets and images
    # Maintains file structure
```

#### Datasets API: `backend/api/routes/datasets.py`
**Endpoints**:
- `GET /api/v1/datasets/` - List datasets with filters
- `POST /api/v1/datasets/` - Create new dataset
- `GET /api/v1/datasets/{dataset_id}` - Get dataset details
- `POST /api/v1/datasets/{dataset_id}/upload` - Upload images

#### Images API: `backend/api/routes/datasets.py`
**Endpoints**:
- `GET /api/v1/datasets/{dataset_id}/images` - List images in dataset
- `DELETE /api/v1/images/{image_id}` - Delete specific image
- `POST /api/v1/images/bulk-delete` - Delete multiple images

### Core Business Logic

#### Dataset Manager: `backend/core/dataset_manager.py`
```python
class DatasetManager:
    def create_dataset()        # Creates new dataset with validation
    def upload_images()         # Handles file upload and processing
    def get_dataset_stats()     # Calculates image counts and statistics
    def delete_images()         # Removes images from filesystem and database
```

#### File Handler: `backend/core/file_handler.py`
```python
class FileHandler:
    def save_uploaded_file()    # Saves file to appropriate directory
    def create_directory()      # Creates project/dataset directories
    def delete_file()          # Removes file from filesystem
    def get_file_info()        # Extracts metadata (size, dimensions)
```

---

## Database Schema

### Tables Structure

#### Projects Table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50),           -- 'classification' or 'Object Detection'
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    default_model_id INTEGER,
    confidence_threshold FLOAT DEFAULT 0.5,
    iou_threshold FLOAT DEFAULT 0.45
);
```

#### Datasets Table
```sql
CREATE TABLE datasets (
    id VARCHAR(36) PRIMARY KEY,         -- UUID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER,                 -- Foreign key to projects
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    total_images INTEGER DEFAULT 0,
    labeled_images INTEGER DEFAULT 0,
    unlabeled_images INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

#### Images Table
```sql
CREATE TABLE images (
    id VARCHAR(36) PRIMARY KEY,         -- UUID
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    format VARCHAR(10),
    dataset_id VARCHAR(36),             -- Foreign key to datasets
    is_labeled BOOLEAN DEFAULT FALSE,
    is_auto_labeled BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    split_type VARCHAR(20) DEFAULT 'unassigned',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);
```

### Data Relationships
```
Projects (1) ←→ (Many) Datasets (1) ←→ (Many) Images
```

---

## UI Components Guide

### Ant Design Components Used

#### Layout Components
- `Layout`: Main application layout
- `Sider`: Sidebar navigation
- `Content`: Main content area
- `Header`: Top header (if used)

#### Data Display
- `Card`: Project and dataset cards
- `Statistic`: Displaying counts and percentages
- `Table`: Data tables for detailed views
- `List`: Image lists in datasets
- `Avatar`: Project type icons

#### Navigation
- `Menu`: Sidebar navigation menu
- `Breadcrumb`: Page navigation breadcrumbs
- `Pagination`: For large data sets

#### Data Entry
- `Form`: All forms (create, edit)
- `Input`: Text inputs
- `Select`: Dropdown selections
- `Upload`: File upload components
- `Button`: All interactive buttons

#### Feedback
- `Modal`: Confirmation dialogs, forms
- `Message`: Success/error notifications
- `Spin`: Loading indicators
- `Progress`: Upload progress

#### Other
- `Dropdown`: Three-dots action menus
- `Tooltip`: Helpful hints
- `Divider`: Visual separators

### Custom Styling
- Uses Ant Design's default theme
- Custom CSS in `frontend/src/index.css`
- Responsive design for different screen sizes

---

## API Endpoints Reference

### Projects Endpoints

#### GET /api/v1/projects/
**Purpose**: Retrieve all projects with statistics
**Response**:
```json
[
  {
    "id": 1,
    "name": "Medical Image Classification",
    "description": "AI-powered system for medical images",
    "project_type": "classification",
    "created_at": "2025-05-29T08:35:09",
    "updated_at": "2025-05-29T08:35:09",
    "total_datasets": 1,
    "total_images": 4,
    "labeled_images": 0
  }
]
```

#### POST /api/v1/projects/
**Purpose**: Create new project
**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "project_type": "classification"
}
```

#### POST /api/v1/projects/{project_id}/duplicate
**Purpose**: Duplicate existing project
**Request Body**:
```json
{
  "new_name": "Duplicated Project Name"
}
```

#### POST /api/v1/projects/merge
**Purpose**: Merge multiple projects
**Request Body**:
```json
{
  "source_project_ids": [1, 2],
  "target_name": "Merged Project",
  "target_description": "Combined project"
}
```

### Datasets Endpoints

#### GET /api/v1/datasets/
**Purpose**: List datasets with optional project filter
**Query Parameters**:
- `project_id`: Filter by project (optional)
- `skip`: Pagination offset
- `limit`: Number of results

#### POST /api/v1/datasets/{dataset_id}/upload
**Purpose**: Upload images to dataset
**Request**: Multipart form data with files
**Response**: List of uploaded image details

### Images Endpoints

#### GET /api/v1/datasets/{dataset_id}/images
**Purpose**: List images in dataset
**Response**: Array of image objects with metadata

#### DELETE /api/v1/images/{image_id}
**Purpose**: Delete single image
**Response**: Success confirmation

---

## Page-by-Page Breakdown

### 1. Projects Page (`/projects`)

#### Layout Structure
```
Header: "Projects" + Action Buttons (Invite Team, New Project)
Filters: Search Bar + Sort Dropdown + Refresh Button
Content: Grid of Project Cards (3 columns)
```

#### Project Card Structure
```
Card Header: Project Type Icon + Project Name
Card Body: Description + Statistics Row
Card Footer: Three-dots Menu Button
```

#### Statistics Display
- **Images**: Total number of images across all datasets
- **Datasets**: Number of datasets in project
- **% annotated**: Percentage of labeled images

#### Action Buttons
1. **Invite Team**: Opens team invitation modal
2. **New Project**: Opens project creation modal
3. **Refresh**: Reloads project data
4. **Three-dots Menu**: Per-project actions

#### Three-Dots Menu Actions
1. **Rename Project**: 
   - Opens modal with current name pre-filled
   - Validates name uniqueness
   - Updates project in database
   
2. **Duplicate Project**:
   - Opens modal for new project name
   - Creates copy with all datasets and images
   - Maintains file structure
   
3. **Merge with Other Project**:
   - Opens modal with project selection
   - Creates new merged project
   - Combines all datasets from selected projects
   
4. **Delete Project**:
   - Shows confirmation modal
   - Deletes project, datasets, images, and files

#### State Management
```javascript
// Main state variables
const [projects, setProjects] = useState([])
const [loading, setLoading] = useState(true)
const [searchTerm, setSearchTerm] = useState('')
const [sortBy, setSortBy] = useState('updated_at')
const [openDropdownId, setOpenDropdownId] = useState(null)

// Modal states
const [renameModalVisible, setRenameModalVisible] = useState(false)
const [duplicateModalVisible, setDuplicateModalVisible] = useState(false)
const [mergeModalVisible, setMergeModalVisible] = useState(false)
const [deleteModalVisible, setDeleteModalVisible] = useState(false)
const [selectedProject, setSelectedProject] = useState(null)
```

### 2. Datasets Page (`/datasets`)

#### Layout Structure
```
Header: "Datasets" + Filter Controls
Content: Grid of Dataset Cards
```

#### Dataset Card Features
- Dataset name and description
- Image count and status
- Associated project name
- Upload button for adding images

### 3. Dataset Detail Page (`/datasets/{id}`)

#### Layout Structure
```
Header: Dataset Name + Actions (Upload, Select All, Delete Selected)
Content: Image Grid with Selection Checkboxes
Footer: Pagination Controls
```

#### Image Grid Features
- Thumbnail display of all images
- Checkbox selection for bulk operations
- Image metadata on hover
- Click to view full size

#### Bulk Operations
- Select All/None toggle
- Delete selected images
- Export selected images
- Batch annotation tools

### 4. Models Page (`/models`)

#### Layout Structure
```
Header: "Models" + Create Model Button
Content: Model Cards with Training Status
```

#### Model Card Features
- Model name and type
- Training progress
- Accuracy metrics
- Deploy/Download buttons

---

## Button Functionality Guide

### Global Navigation Buttons

#### Sidebar Menu Items
```javascript
// Each menu item structure:
{
  key: 'unique-key',
  icon: <AntDesignIcon />,
  label: 'Display Name',
  onClick: () => navigate('/route')
}
```

1. **Dashboard** (`dashboard` icon)
   - Route: `/dashboard`
   - Function: Navigate to main dashboard

2. **Models** (`robot` icon)
   - Route: `/models`
   - Function: Navigate to models management

3. **Projects** (`project` icon)
   - Route: `/projects`
   - Function: Navigate to projects list

4. **Datasets** (`database` icon)
   - Route: `/datasets`
   - Function: Navigate to datasets overview

5. **Annotate** (`edit` icon)
   - Route: `/annotate`
   - Function: Navigate to annotation interface

6. **Active Learning** (`bulb` icon)
   - Route: `/active-learning`
   - Function: Navigate to active learning dashboard

### Projects Page Buttons

#### Header Action Buttons

1. **Invite Team Button**
   ```javascript
   // Location: Projects page header
   // Icon: team
   // Function: Opens team invitation modal
   const handleInviteTeam = () => {
     setInviteModalVisible(true)
   }
   ```

2. **New Project Button**
   ```javascript
   // Location: Projects page header
   // Icon: plus
   // Function: Opens project creation modal
   const handleNewProject = () => {
     setCreateModalVisible(true)
   }
   ```

3. **Refresh Button**
   ```javascript
   // Location: Projects page filters
   // Icon: reload
   // Function: Reloads project data
   const handleRefresh = () => {
     fetchProjects()
   }
   ```

#### Project Card Buttons

4. **Three-Dots Menu Button**
   ```javascript
   // Location: Each project card
   // Icon: more (three dots)
   // Function: Opens dropdown menu with actions
   const handleMenuClick = (e, projectId) => {
     e.stopPropagation()
     setOpenDropdownId(openDropdownId === projectId ? null : projectId)
   }
   ```

#### Three-Dots Menu Items

5. **Rename Project**
   ```javascript
   // Icon: edit
   // Function: Opens rename modal
   const handleRename = (project) => {
     setSelectedProject(project)
     setRenameModalVisible(true)
     setOpenDropdownId(null)
   }
   ```

6. **Duplicate Project**
   ```javascript
   // Icon: copy
   // Function: Opens duplicate modal
   const handleDuplicate = (project) => {
     setSelectedProject(project)
     setDuplicateModalVisible(true)
     setOpenDropdownId(null)
   }
   ```

7. **Merge with Other Project**
   ```javascript
   // Icon: merge-cells
   // Function: Opens merge modal
   const handleMerge = (project) => {
     setSelectedProject(project)
     setMergeModalVisible(true)
     setOpenDropdownId(null)
   }
   ```

8. **Delete Project**
   ```javascript
   // Icon: delete
   // Function: Opens delete confirmation
   const handleDelete = (project) => {
     setSelectedProject(project)
     setDeleteModalVisible(true)
     setOpenDropdownId(null)
   }
   ```

#### Modal Buttons

9. **Modal OK/Submit Buttons**
   ```javascript
   // Function: Executes the modal's primary action
   // Validates form data
   // Calls appropriate API endpoint
   // Updates UI state
   // Closes modal
   ```

10. **Modal Cancel Buttons**
    ```javascript
    // Function: Closes modal without saving
    // Resets form data
    // Clears selected project
    ```

### Dataset Page Buttons

11. **Upload Images Button**
    ```javascript
    // Function: Opens file upload dialog
    // Accepts multiple image files
    // Shows upload progress
    // Updates dataset statistics
    ```

12. **Select All/None Toggle**
    ```javascript
    // Function: Toggles selection of all images
    // Updates bulk operation availability
    ```

13. **Delete Selected Button**
    ```javascript
    // Function: Deletes selected images
    // Shows confirmation dialog
    // Updates image grid
    ```

### Form Buttons

14. **Submit/Save Buttons**
    ```javascript
    // Function: Validates and submits form data
    // Shows loading state
    // Handles success/error responses
    ```

15. **Reset/Clear Buttons**
    ```javascript
    // Function: Resets form to initial state
    // Clears validation errors
    ```

---

## Data Flow & State Management

### Frontend State Flow

#### Projects Page Data Flow
```
1. Component Mount → useEffect() → fetchProjects()
2. fetchProjects() → API Call → /api/v1/projects/
3. API Response → setProjects() → Re-render Cards
4. User Action → Event Handler → State Update → API Call
5. API Success → Update Local State → Re-render UI
```

#### State Update Patterns
```javascript
// Loading states
setLoading(true)
// API call
setLoading(false)

// Optimistic updates
setProjects(prev => prev.filter(p => p.id !== deletedId))

// Error handling
try {
  // API call
} catch (error) {
  message.error('Operation failed')
}
```

### Backend Data Flow

#### Request Processing
```
1. HTTP Request → FastAPI Router → Route Handler
2. Route Handler → Validation → Business Logic
3. Business Logic → Database Operations → File Operations
4. Response Formation → JSON Serialization → HTTP Response
```

#### Database Operations
```python
# Typical CRUD pattern
def create_project(project_data):
    # 1. Validate input data
    # 2. Create database record
    # 3. Create filesystem directory
    # 4. Return created object

def get_projects():
    # 1. Query database with joins
    # 2. Calculate statistics
    # 3. Format response data
    # 4. Return project list
```

---

## File Upload System

### Frontend Upload Process

#### Upload Component Structure
```javascript
// Ant Design Upload component
<Upload
  multiple={true}
  accept="image/*"
  beforeUpload={handleBeforeUpload}
  customRequest={handleCustomUpload}
  onChange={handleUploadChange}
>
  <Button icon={<UploadOutlined />}>Upload Images</Button>
</Upload>
```

#### Upload Event Handlers
```javascript
const handleBeforeUpload = (file) => {
  // Validate file type and size
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  return isImage && isLt10M
}

const handleCustomUpload = async ({ file, onSuccess, onError, onProgress }) => {
  const formData = new FormData()
  formData.append('files', file)
  
  try {
    const response = await api.uploadImages(datasetId, formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ percent })
      }
    })
    onSuccess(response.data)
  } catch (error) {
    onError(error)
  }
}
```

### Backend Upload Process

#### File Processing Pipeline
```python
@router.post("/datasets/{dataset_id}/upload")
async def upload_images(
    dataset_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    # 1. Validate dataset exists
    dataset = get_dataset(db, dataset_id)
    
    # 2. Create upload directory
    upload_dir = f"uploads/{dataset.project.name}/{dataset.name}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 3. Process each file
    uploaded_images = []
    for file in files:
        # Validate file type
        if not file.content_type.startswith('image/'):
            continue
            
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract image metadata
        with Image.open(file_path) as img:
            width, height = img.size
            format_type = img.format.lower()
        
        # Create database record
        image_record = create_image(
            db=db,
            dataset_id=dataset_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            width=width,
            height=height,
            format=format_type
        )
        
        uploaded_images.append(image_record)
    
    # 4. Update dataset statistics
    update_dataset_stats(db, dataset_id)
    
    return uploaded_images
```

### File Storage Structure
```
uploads/
├── Medical Image Classification/
│   └── Medical Test Images/
│       ├── car.jpg
│       ├── cat.jpg
│       ├── dog.jpg
│       └── chest_xray_sample.png
├── Project 1/
│   ├── Cat Dataset/
│   │   └── cat.jpg
│   └── Dog Dataset/
│       └── dog.jpg
└── Project 2/
    └── Test Dataset/
        └── dog.jpg
```

---

## Modification Guide

### Adding New UI Components

#### 1. Creating a New Page
```javascript
// 1. Create new file: frontend/src/pages/NewPage.js
import React, { useState, useEffect } from 'react'
import { Card, Button, message } from 'antd'
import api from '../services/api'

const NewPage = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.getData()
      setData(response.data)
    } catch (error) {
      message.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>New Page</h1>
      {/* Your content here */}
    </div>
  )
}

export default NewPage

// 2. Add route to App.js
import NewPage from './pages/NewPage'

// In the Routes section:
<Route path="/new-page" element={<NewPage />} />

// 3. Add navigation item to Navbar.js
{
  key: 'new-page',
  icon: <YourIcon />,
  label: 'New Page',
  onClick: () => navigate('/new-page')
}
```

#### 2. Adding New API Endpoints
```python
# 1. Create new route file: backend/api/routes/new_feature.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db

router = APIRouter(prefix="/api/v1/new-feature", tags=["new-feature"])

@router.get("/")
async def get_items(db: Session = Depends(get_db)):
    # Your logic here
    return {"items": []}

@router.post("/")
async def create_item(item_data: dict, db: Session = Depends(get_db)):
    # Your logic here
    return {"message": "Created successfully"}

# 2. Include router in main.py
from api.routes import new_feature
app.include_router(new_feature.router)

# 3. Add API function to frontend/src/services/api.js
export const getNewFeatureItems = () => {
  return axios.get('/api/v1/new-feature/')
}

export const createNewFeatureItem = (data) => {
  return axios.post('/api/v1/new-feature/', data)
}
```

#### 3. Adding New Database Tables
```python
# 1. Add model to backend/database/models.py
class NewModel(Base):
    __tablename__ = "new_table"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship("Project", back_populates="new_items")

# 2. Add relationship to existing models
# In Project model:
new_items = relationship("NewModel", back_populates="project")

# 3. Create database operations in backend/database/operations.py
def create_new_item(db: Session, item_data: dict):
    db_item = NewModel(**item_data)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_new_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(NewModel).offset(skip).limit(limit).all()
```

### Modifying Existing Features

#### 1. Adding New Button to Projects Page
```javascript
// In frontend/src/pages/Projects.js

// 1. Add new state for the feature
const [newFeatureModalVisible, setNewFeatureModalVisible] = useState(false)

// 2. Add button to header actions
<Button 
  type="primary" 
  icon={<YourIcon />}
  onClick={() => setNewFeatureModalVisible(true)}
>
  New Feature
</Button>

// 3. Add modal component
<Modal
  title="New Feature"
  visible={newFeatureModalVisible}
  onOk={handleNewFeature}
  onCancel={() => setNewFeatureModalVisible(false)}
>
  {/* Modal content */}
</Modal>

// 4. Add handler function
const handleNewFeature = async () => {
  try {
    // API call
    await api.newFeatureAction()
    message.success('Feature executed successfully')
    setNewFeatureModalVisible(false)
    fetchProjects() // Refresh data
  } catch (error) {
    message.error('Feature failed')
  }
}
```

#### 2. Adding New Field to Project Card
```javascript
// In the project card statistics section
<Row gutter={16}>
  <Col span={8}>
    <Statistic
      title="Images"
      value={project.total_images}
      prefix={<PictureOutlined />}
    />
  </Col>
  <Col span={8}>
    <Statistic
      title="Datasets"
      value={project.total_datasets}
      prefix={<DatabaseOutlined />}
    />
  </Col>
  <Col span={8}>
    <Statistic
      title="New Field"
      value={project.new_field_value}
      prefix={<YourIcon />}
    />
  </Col>
</Row>
```

#### 3. Modifying Three-Dots Menu
```javascript
// Add new menu item to actionMenu items array
const actionMenu = {
  items: [
    { key: 'rename', icon: <EditOutlined />, label: 'Rename Project' },
    { key: 'duplicate', icon: <CopyOutlined />, label: 'Duplicate Project' },
    { key: 'merge', icon: <MergeCellsOutlined />, label: 'Merge with Other Project' },
    { key: 'new-action', icon: <YourIcon />, label: 'New Action' }, // New item
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Delete Project', danger: true }
  ]
}

// Add handler in handleMenuClick function
const handleMenuClick = ({ key }) => {
  switch (key) {
    case 'rename':
      handleRename(selectedProject)
      break
    case 'duplicate':
      handleDuplicate(selectedProject)
      break
    case 'merge':
      handleMerge(selectedProject)
      break
    case 'new-action':
      handleNewAction(selectedProject) // New handler
      break
    case 'delete':
      handleDelete(selectedProject)
      break
  }
}
```

### Styling Modifications

#### 1. Custom CSS Classes
```css
/* Add to frontend/src/index.css */

.custom-project-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.custom-project-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.custom-button {
  background: linear-gradient(45deg, #1890ff, #52c41a);
  border: none;
  color: white;
}
```

#### 2. Ant Design Theme Customization
```javascript
// In App.js, modify ConfigProvider
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      colorBgContainer: '#ffffff',
    },
    components: {
      Button: {
        colorPrimary: '#1890ff',
        algorithm: true,
      },
      Card: {
        borderRadius: 8,
      },
    },
  }}
>
  {/* App content */}
</ConfigProvider>
```

---

## Common Tasks & Solutions

### 1. Adding New Project Type

#### Frontend Changes
```javascript
// 1. Add to project type options
const PROJECT_TYPES = [
  { value: 'classification', label: 'Classification' },
  { value: 'Object Detection', label: 'Object Detection' },
  { value: 'segmentation', label: 'Segmentation' }, // New type
]

// 2. Add icon mapping
const getProjectTypeIcon = (type) => {
  switch (type) {
    case 'classification':
      return <PictureOutlined />
    case 'Object Detection':
      return <AimOutlined />
    case 'segmentation':
      return <ScissorOutlined /> // New icon
    default:
      return <ProjectOutlined />
  }
}
```

#### Backend Changes
```python
# 1. Update project model validation
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: Literal["classification", "Object Detection", "segmentation"]

# 2. Add business logic for new type
def create_project(db: Session, project: ProjectCreate):
    # Handle segmentation-specific setup
    if project.project_type == "segmentation":
        # Initialize segmentation-specific configurations
        pass
```

### 2. Adding Bulk Operations

#### Frontend Implementation
```javascript
// 1. Add selection state
const [selectedItems, setSelectedItems] = useState([])
const [selectAll, setSelectAll] = useState(false)

// 2. Add selection handlers
const handleSelectAll = () => {
  if (selectAll) {
    setSelectedItems([])
  } else {
    setSelectedItems(items.map(item => item.id))
  }
  setSelectAll(!selectAll)
}

const handleItemSelect = (itemId) => {
  setSelectedItems(prev => 
    prev.includes(itemId) 
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]
  )
}

// 3. Add bulk action buttons
<Button 
  disabled={selectedItems.length === 0}
  onClick={handleBulkDelete}
  danger
>
  Delete Selected ({selectedItems.length})
</Button>
```

#### Backend Implementation
```python
# Add bulk operation endpoint
@router.post("/bulk-delete")
async def bulk_delete_items(
    item_ids: List[int],
    db: Session = Depends(get_db)
):
    deleted_count = 0
    for item_id in item_ids:
        item = db.query(Model).filter(Model.id == item_id).first()
        if item:
            db.delete(item)
            deleted_count += 1
    
    db.commit()
    return {"deleted_count": deleted_count}
```

### 3. Adding Search and Filter

#### Frontend Implementation
```javascript
// 1. Add filter states
const [searchTerm, setSearchTerm] = useState('')
const [filterType, setFilterType] = useState('all')
const [sortBy, setSortBy] = useState('created_at')

// 2. Add filter logic
const filteredItems = useMemo(() => {
  return items
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || item.type === filterType)
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'created_at') return new Date(b.created_at) - new Date(a.created_at)
      return 0
    })
}, [items, searchTerm, filterType, sortBy])

// 3. Add filter UI
<Input.Search
  placeholder="Search items..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  style={{ width: 300, marginRight: 16 }}
/>

<Select
  value={filterType}
  onChange={setFilterType}
  style={{ width: 120, marginRight: 16 }}
>
  <Option value="all">All Types</Option>
  <Option value="type1">Type 1</Option>
  <Option value="type2">Type 2</Option>
</Select>
```

### 4. Adding Real-time Updates

#### Frontend WebSocket Implementation
```javascript
// 1. Add WebSocket connection
useEffect(() => {
  const ws = new WebSocket('ws://localhost:12000/ws')
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'project_updated') {
      fetchProjects() // Refresh data
    }
  }
  
  return () => ws.close()
}, [])
```

#### Backend WebSocket Implementation
```python
# 1. Add WebSocket endpoint
from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages
    except WebSocketDisconnect:
        pass

# 2. Broadcast updates
async def broadcast_update(message: dict):
    for connection in active_connections:
        await connection.send_text(json.dumps(message))
```

### 5. Error Handling Best Practices

#### Frontend Error Handling
```javascript
// 1. Global error handler
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    message.error('Authentication required')
    // Redirect to login
  } else if (error.response?.status === 403) {
    message.error('Permission denied')
  } else if (error.response?.status >= 500) {
    message.error('Server error. Please try again later.')
  } else {
    message.error(error.response?.data?.detail || 'An error occurred')
  }
}

// 2. Use in API calls
try {
  const response = await api.createProject(projectData)
  message.success('Project created successfully')
} catch (error) {
  handleApiError(error)
}
```

#### Backend Error Handling
```python
# 1. Custom exception classes
class ProjectNotFoundError(HTTPException):
    def __init__(self, project_id: int):
        super().__init__(
            status_code=404,
            detail=f"Project with id {project_id} not found"
        )

# 2. Global exception handler
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )

# 3. Use in route handlers
@router.get("/projects/{project_id}")
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ProjectNotFoundError(project_id)
    return project
```

---

## Performance Optimization

### Frontend Optimization

#### 1. Component Memoization
```javascript
// Memoize expensive calculations
const projectStats = useMemo(() => {
  return projects.map(project => ({
    ...project,
    annotationPercentage: project.total_images > 0 
      ? Math.round((project.labeled_images / project.total_images) * 100)
      : 0
  }))
}, [projects])

// Memoize components
const ProjectCard = React.memo(({ project, onAction }) => {
  // Component implementation
})
```

#### 2. Lazy Loading
```javascript
// Lazy load pages
const Projects = lazy(() => import('./pages/Projects'))
const Datasets = lazy(() => import('./pages/Datasets'))

// Use with Suspense
<Suspense fallback={<Spin size="large" />}>
  <Routes>
    <Route path="/projects" element={<Projects />} />
    <Route path="/datasets" element={<Datasets />} />
  </Routes>
</Suspense>
```

#### 3. Virtual Scrolling for Large Lists
```javascript
// For large image grids
import { FixedSizeGrid as Grid } from 'react-window'

const ImageGrid = ({ images }) => (
  <Grid
    columnCount={4}
    columnWidth={200}
    height={600}
    rowCount={Math.ceil(images.length / 4)}
    rowHeight={200}
    itemData={images}
  >
    {ImageCell}
  </Grid>
)
```

### Backend Optimization

#### 1. Database Query Optimization
```python
# Use eager loading for relationships
def get_projects_with_stats(db: Session):
    return db.query(Project)\
        .options(joinedload(Project.datasets))\
        .all()

# Use database-level aggregations
def get_project_stats(db: Session, project_id: int):
    return db.query(
        func.count(Image.id).label('total_images'),
        func.sum(case((Image.is_labeled == True, 1), else_=0)).label('labeled_images')
    ).join(Dataset).filter(Dataset.project_id == project_id).first()
```

#### 2. Caching
```python
# Add Redis caching
from redis import Redis
import json

redis_client = Redis(host='localhost', port=6379, db=0)

def get_cached_projects():
    cached = redis_client.get('projects')
    if cached:
        return json.loads(cached)
    
    projects = get_projects_from_db()
    redis_client.setex('projects', 300, json.dumps(projects))  # 5 min cache
    return projects
```

#### 3. Background Tasks
```python
# Use Celery for long-running tasks
from celery import Celery

celery_app = Celery('auto_labeling')

@celery_app.task
def process_uploaded_images(dataset_id: str, image_paths: List[str]):
    # Process images in background
    for path in image_paths:
        # Extract features, generate thumbnails, etc.
        pass
```

---

This documentation provides a complete reference for understanding and modifying the Auto-Labeling-Tool system. Any AI assistant with this documentation should be able to understand the system architecture, locate specific components, and implement modifications effectively.