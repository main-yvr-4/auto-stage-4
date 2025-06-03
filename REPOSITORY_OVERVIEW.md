# Auto-Labeling Tool - Complete Repository Overview

## 🎯 What This Tool Is

**Auto-Labeling Tool** is a comprehensive AI-powered annotation platform that combines:
- **Smart Auto-Labeling**: YOLO11-powered object detection and segmentation
- **Active Learning**: Intelligent sample selection for optimal training efficiency  
- **Manual Annotation**: Canvas-based drawing tools for precise labeling
- **Data Augmentation**: Advanced image transformation pipeline
- **Model Training**: End-to-end YOLO model training and evaluation

## 🏗️ Architecture

### Frontend (React + Ant Design)
```
frontend/
├── src/
│   ├── components/
│   │   ├── ActiveLearning/           # Active learning dashboard
│   │   ├── DataAugmentation.js       # Data augmentation interface
│   │   ├── ImageAnnotation.js        # Manual annotation canvas
│   │   └── ModelTraining.js          # Training interface
│   ├── services/                     # API communication
│   └── utils/                        # Helper functions
```

### Backend (FastAPI + SQLAlchemy)
```
backend/
├── api/                              # REST API endpoints
│   ├── active_learning.py           # Active learning endpoints
│   ├── auto_labeler.py              # Auto-labeling endpoints
│   └── data_augmentation.py         # Augmentation endpoints
├── core/                            # Core business logic
│   ├── active_learning.py           # Active learning algorithms
│   ├── auto_labeler.py              # YOLO integration
│   └── model_manager.py             # Model management
├── database/                        # Database models
└── utils/                           # Utilities
```

## 🚀 Current Status

### ✅ **WORKING FEATURES**
1. **Backend API** (Port 12000)
   - FastAPI server with comprehensive endpoints
   - SQLite database with proper models
   - YOLO11 integration for auto-labeling
   - Active learning pipeline implementation
   - Data augmentation with Albumentations

2. **Frontend UI** (Port 12001)
   - React application with Ant Design components
   - Active learning dashboard with metrics
   - Data augmentation interface
   - Model training progress tracking

3. **AI Capabilities**
   - YOLO11 object detection and segmentation
   - Polygon/mask extraction from AI predictions
   - Uncertainty-based sample selection
   - Real-time confidence scoring

### ⚠️ **CRITICAL GAPS IDENTIFIED**
1. **Manual Annotation Interface**
   - Canvas drawing tools missing
   - No bounding box creation
   - No polygon drawing capabilities
   - No click-to-segment functionality

2. **Workflow Integration**
   - Missing bridge between AI predictions and manual refinement
   - No annotation export/import functionality
   - Limited dataset management

## 📊 Database Schema

### Core Tables
```sql
-- Projects: Annotation projects
projects (id, name, description, created_at, updated_at)

-- Images: Uploaded images for annotation
images (id, project_id, filename, file_path, width, height, uploaded_at)

-- Annotations: Both manual and AI-generated annotations
annotations (
    id, image_id, label, bbox, segmentation, 
    confidence, source, created_at, updated_at
)

-- Active Learning: Training sessions and metrics
active_learning_sessions (
    id, project_id, model_path, status, 
    metrics, created_at, updated_at
)
```

## 🔧 Installation Methods

### Method 1: Standard Python (start.py)
```bash
python start.py
```
- ✅ **Status**: Working (fixed import errors)
- Automatic Node.js installation
- Virtual environment management
- Cross-platform compatibility

### Method 2: Conda Environment (conda-start.py)
```bash
python conda-start.py
```
- ⚠️ **Status**: Potential issues identified
- CUDA-optimized PyTorch installation
- Conda environment management
- See `CONDA_START_ISSUES_ANALYSIS.md` for details

### Method 3: Manual Installation
```bash
# Backend
cd backend && pip install -r requirements.txt && python main.py

# Frontend  
cd frontend && npm install && npm start
```

## 🧠 AI Capabilities Deep Dive

### Auto-Labeling Pipeline
1. **Image Upload** → **YOLO11 Detection** → **Confidence Scoring**
2. **Mask Extraction** → **Polygon Conversion** → **Database Storage**
3. **Quality Assessment** → **Uncertainty Calculation** → **Active Learning Queue**

### Supported Model Types
- **Object Detection**: Bounding boxes with class labels
- **Instance Segmentation**: Pixel-perfect masks and polygons
- **Semantic Segmentation**: Full image segmentation

### Active Learning Strategy
- **Uncertainty Sampling**: Select samples with lowest confidence
- **Diversity Sampling**: Ensure representative sample distribution
- **Query-by-Committee**: Multiple model consensus analysis

## 📈 Data Augmentation Features

### Transformation Types
- **Geometric**: Rotation, scaling, flipping, cropping
- **Color**: Brightness, contrast, saturation, hue adjustment
- **Noise**: Gaussian noise, blur, compression artifacts
- **Advanced**: Elastic deformation, grid distortion

### Smart Augmentation
- **Annotation-Aware**: Transforms preserve bounding boxes and masks
- **Balanced Generation**: Maintains class distribution
- **Quality Control**: Validates augmented annotations

## 🔗 API Endpoints

### Core Endpoints
```
GET  /health                          # Health check
POST /upload                          # Upload images
GET  /projects                        # List projects
POST /projects                        # Create project

# Auto-labeling
POST /auto-label                      # Run auto-labeling
GET  /annotations/{image_id}          # Get annotations

# Active Learning  
POST /active-learning/start           # Start AL session
GET  /active-learning/uncertain       # Get uncertain samples
POST /active-learning/feedback        # Submit feedback

# Data Augmentation
POST /augment                         # Generate augmented data
GET  /augmentation/preview            # Preview transformations
```

## 🌐 Live Demo URLs

### Current Running Instance
- **Frontend**: https://work-2-ivvkwxuljbestzbu.prod-runtime.all-hands.dev
- **Backend API**: https://work-1-ivvkwxuljbestzbu.prod-runtime.all-hands.dev  
- **API Documentation**: https://work-1-ivvkwxuljbestzbu.prod-runtime.all-hands.dev/docs

## 📋 Recent Updates (Latest Commit: 9a93ec6)

### Fixed Issues
- ✅ Missing `BrainOutlined` icon import → Replaced with `ExperimentOutlined`
- ✅ Missing `Statistic` component import in DataAugmentation.js
- ✅ Frontend compilation errors resolved
- ✅ Both servers start successfully

### Added Documentation
- 📄 `DATA_AUGMENTATION_FAQ.md` - Comprehensive augmentation guide
- 📄 `SMART_POLYGON_AI_LABELING_FAQ.md` - AI capabilities documentation  
- 📄 `MISSING_ANNOTATION_FEATURES_ANALYSIS.md` - Critical gaps analysis
- 📄 `CONDA_START_ISSUES_ANALYSIS.md` - Conda installation issues

## 🎯 Next Steps for Local Installation

### For Users
1. **Clone repository**: `git clone https://github.com/rayel-tech/auto-label.git`
2. **Choose installation method**:
   - Simple: `python start.py`
   - Conda: `python conda-start.py` (check issues doc first)
   - Manual: Follow backend + frontend setup
3. **Access application**: http://localhost:12001

### For Developers
1. **Priority**: Implement manual annotation interface
2. **Fix**: Conda-start.py path detection issues
3. **Enhance**: Workflow integration between AI and manual tools
4. **Add**: Export/import functionality for annotations

## 🔍 Key Files to Understand

### Configuration
- `models/models_config.json` - Model configurations
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies

### Core Logic
- `backend/core/auto_labeler.py` - YOLO integration
- `backend/core/active_learning.py` - AL algorithms
- `frontend/src/components/ActiveLearning/` - AL dashboard

### Documentation
- `PROJECT_MANUAL.md` - User manual
- `INSTALLATION_GUIDE.md` - Setup instructions
- `docs/ACTIVE_LEARNING.md` - Active learning guide

## 💡 This Tool's Unique Value

1. **Complete Pipeline**: From raw images to trained models
2. **AI-Human Collaboration**: Smart AI suggestions + manual refinement
3. **Active Learning**: Minimize annotation effort, maximize model performance
4. **Production Ready**: FastAPI backend, React frontend, proper database
5. **Extensible**: Modular architecture for easy customization

The tool bridges the gap between automated AI labeling and manual annotation precision, making it ideal for creating high-quality training datasets efficiently.