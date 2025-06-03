# Auto-Labeling-Tool 🏷️

**The most advanced local auto-labeling system with Modern UI & Active Learning!** 

🎨 **NEW: Modern UI Redesign** - Beautiful card-based interface with responsive design  
🧠 **NEW: Active Learning** - Train custom models iteratively with intelligent sample selection  
🏷️ **NEW: Project Types** - Support for Object Detection, Classification, and Segmentation  
✨ **Better than Roboflow** - but runs on your computer  
🚀 **Super easy to use** - just 3 commands to start  
💻 **Works everywhere** - Windows, Mac, Linux  
🔒 **Your data stays private** - everything runs locally  

## 🎯 **Game-Changing Features**

### 🎨 **Modern UI Experience** ⭐ **COMPLETELY REDESIGNED!**
- **Card-Based Interface**: Beautiful project and dataset cards with gradient headers
- **Project Type Support**: Visual indicators for Object Detection, Classification, Segmentation
- **Responsive Design**: Optimized for all screen sizes and devices
- **Modern Navigation**: Clean sidebar navigation with intuitive icons
- **Progress Visualization**: Real-time progress bars and statistics
- **Smart Empty States**: Helpful guidance when no data is available
- **Action Dropdowns**: Quick access to Edit, Settings, and Delete operations

### 🧠 **Active Learning System** ⭐ **REVOLUTIONARY!**
- **Intelligent Sample Selection**: Focus on the most valuable images for labeling
- **Iterative Model Training**: Continuously improve custom YOLO models
- **Uncertainty-Based Labeling**: Let AI guide you to the most impactful samples
- **Human-in-the-Loop**: Review and correct predictions to boost accuracy
- **Production-Ready Models**: Export trained models for real-world deployment

### 🏷️ **Enhanced Project Management**
- **Multi-Type Projects**: Object Detection, Image Classification, Segmentation
- **Project Templates**: Pre-configured settings for different use cases
- **Smart Organization**: Automatic categorization and filtering
- **Progress Tracking**: Visual progress indicators for annotation status
- **Batch Operations**: Manage multiple projects and datasets efficiently

## 🚀 **Complete Feature Set**

### 🎨 **Modern User Interface**
- **Card-Based Design**: Beautiful project and dataset cards with gradient backgrounds
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme Support**: Professional dark theme with modern aesthetics
- **Interactive Elements**: Smooth animations and hover effects
- **Smart Navigation**: Intuitive sidebar with clear visual hierarchy
- **Progress Indicators**: Real-time visual feedback for all operations
- **Empty State Design**: Helpful guidance and call-to-action when no data exists

### 🏷️ **Project Management System**
- **Multi-Type Support**: Object Detection, Image Classification, Segmentation projects
- **Visual Type Indicators**: Color-coded icons and badges for easy identification
- **Project Templates**: Quick setup with pre-configured settings
- **Batch Operations**: Create, edit, and manage multiple projects efficiently
- **Smart Filtering**: Filter projects by type, status, or creation date
- **Progress Tracking**: Visual progress bars showing annotation completion
- **Statistics Dashboard**: Real-time metrics for datasets, images, and annotations

### 🧠 **Active Learning System** ⭐ **REVOLUTIONARY!**
- **Intelligent Training Pipeline**: Automated YOLO model training with iterative improvement
- **Uncertainty Sampling**: AI identifies the most valuable images for manual labeling
- **Human-in-the-Loop Interface**: Review high-uncertainty samples with one-click actions
- **Performance Tracking**: Real-time metrics (mAP50, mAP95, Precision, Recall)
- **Model Versioning**: Track and compare different model iterations
- **Production Export**: Export trained models ready for deployment
- **Multi-Metric Uncertainty**: Confidence variance, entropy, and combined scoring
- **Automated Retraining**: Continuous model improvement with user feedback

### 🎯 **Core Labeling Capabilities**
- **Multi-format Annotation**: Bounding boxes, polygons, keypoints, segmentation masks
- **Auto-labeling**: Integration with YOLOv8 models (Nano, Small, Segmentation)
- **TRUE AUTO-SAVE**: Annotations save automatically without manual save buttons ⭐ **NEW!**
- **Custom Model Import**: Easy YOLO model import with validation
- **Batch Processing**: Process multiple images simultaneously
- **Real-time Preview**: Instant annotation preview and validation
- **Database Persistence**: Reliable SQLite database with proper CRUD operations

### 📊 **Advanced Analytics & Dataset Management**
- **Class Distribution Analysis**: Visual charts showing label distribution
- **Imbalance Detection**: Automatic detection of class imbalances with recommendations
- **Labeling Progress Tracking**: Comprehensive progress monitoring with health scores
- **Split Analysis**: Train/Val/Test split statistics and validation
- **Dataset Health Scoring**: Overall dataset quality assessment

### 🔄 Professional Data Augmentation
- **15+ Augmentation Types**: Geometric, color, noise, weather effects, and more
- **Smart Presets**: Light, Medium, Heavy augmentation presets
- **Real-time Preview**: See augmentation effects before applying
- **Batch Processing**: Apply augmentations to entire datasets
- **Custom Parameters**: Fine-tune each augmentation type

### 📈 Dataset Management
- **Train/Val/Test Splitting**: Intelligent splitting with percentage controls
- **Visual Status Indicators**: Clear indicators for labeled/unlabeled images
- **Advanced Filtering**: Filter by completion status, split type, labels
- **Bulk Operations**: Move, delete, or modify multiple images at once
- **Image Management**: Organized storage with metadata tracking

### 🎨 User Experience
- **Professional UI**: Modern React interface with Ant Design components
- **Modal-based Workflows**: Streamlined access to advanced features
- **Enhanced Tables**: Sortable, filterable tables with action menus
- **Responsive Design**: Works on desktop and tablet devices
- **Real-time Updates**: Live data updates without page refresh

### ⚡ Performance & Optimization
- **CPU & GPU Support**: Optimized for both CPU and GPU acceleration
- **Local Processing**: No data leaves your machine - complete privacy
- **Memory Efficient**: Handles large datasets efficiently
- **Fast Inference**: Optimized model inference pipeline
- **Scalable Architecture**: FastAPI backend with SQLite/PostgreSQL support

## 🎨 **UI/UX Improvements** ⭐ **LATEST UPDATE!**

### **Before vs After: Complete UI Transformation**

#### **Projects Page - Card-Based Design**
- ✅ **Modern Card Layout**: Replaced old table with beautiful gradient cards
- ✅ **Project Type Indicators**: Visual badges for Object Detection, Classification, Segmentation
- ✅ **Progress Visualization**: Real-time progress bars and statistics
- ✅ **Action Dropdowns**: Quick access to Edit, Settings, Delete operations
- ✅ **Responsive Design**: Optimized for all screen sizes

#### **Datasets Page - Enhanced Management**
- ✅ **Card and Table Views**: Toggle between visual cards and detailed table
- ✅ **Advanced Filtering**: Filter by project, status, and creation date
- ✅ **Batch Operations**: Select and manage multiple datasets
- ✅ **Analytics Integration**: Built-in dataset health and distribution analysis
- ✅ **Smart Empty States**: Helpful guidance when no datasets exist

#### **Navigation & Layout**
- ✅ **Modern Sidebar**: Clean navigation with intuitive icons
- ✅ **Dark Theme**: Professional dark theme throughout the application
- ✅ **Breadcrumb Navigation**: Clear path indication for nested pages
- ✅ **Loading States**: Smooth loading animations and skeleton screens

#### **Backend Enhancements**
- ✅ **Project Type Support**: Database schema updated with project_type field
- ✅ **Migration System**: Automatic database migration for existing projects
- ✅ **API Improvements**: Enhanced endpoints with project type support
- ✅ **Data Validation**: Robust validation for all project operations

## 🛠️ **Tech Stack**

- **Backend**: FastAPI with Python, SQLAlchemy ORM, Pydantic validation
- **Frontend**: React 18, Ant Design 5, React Router, Axios, @ant-design/plots
- **ML Framework**: PyTorch, Ultralytics YOLOv8, OpenCV, PIL, Albumentations
- **Database**: SQLite (default) with PostgreSQL support, automatic migrations
- **Storage**: Local filesystem with organized structure and metadata tracking
- **UI Framework**: Modern card-based design with responsive layouts

## 📁 Project Structure

```
Auto-Labeling-Tool/
├── 🚀 STARTUP FILES
│   ├── start.py            # Cross-platform Python startup script
│   ├── start.sh            # Linux/Mac startup script
│   └── start.bat           # Windows startup script
│
├── 🔧 BACKEND (FastAPI + Python)
│   ├── main.py             # FastAPI application entry point
│   ├── api/
│   │   ├── routes/         # API endpoints
│   │   │   ├── analytics.py      # Dataset analytics & insights
│   │   │   ├── augmentation.py   # Data augmentation pipeline
│   │   │   ├── dataset_management.py # Train/Val/Test splitting
│   │   │   ├── dashboard.py      # Dashboard statistics
│   │   │   ├── models.py         # AI model management
│   │   │   ├── projects.py       # Project management
│   │   │   ├── datasets.py       # Dataset operations
│   │   │   └── annotations.py    # Annotation management
│   │   └── __init__.py
│   ├── core/               # Core configuration and utilities
│   ├── database/           # Database models and operations
│   ├── models/             # AI model integrations
│   └── utils/              # Utility functions
│       └── augmentation_utils.py # Advanced augmentation utilities
│
├── 🎨 FRONTEND (React + Ant Design)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── DatasetAnalytics.js    # Analytics dashboard
│   │   │   ├── DataAugmentation.js    # Augmentation interface
│   │   │   └── DatasetManagement.js   # Dataset splitting UI
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.js           # Main dashboard
│   │   │   ├── Datasets.js            # Enhanced dataset management
│   │   │   ├── Projects.js            # Project management
│   │   │   ├── Models.js              # Model management
│   │   │   └── Annotate.js            # Annotation interface
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Frontend utilities
│   ├── public/             # Static files
│   └── package.json        # Dependencies (includes @ant-design/plots)
│
├── 📊 DATA DIRECTORIES
│   ├── datasets/           # Local dataset storage
│   ├── models/             # Pre-trained and custom models
│   ├── uploads/            # Temporary upload files
│   ├── temp/               # Temporary processing files
│   └── static/             # Static web files
│
├── 🗄️ DATABASE
│   └── database.db         # SQLite database (10 tables)
│
└── 📄 DOCUMENTATION
    ├── README.md           # This file
    ├── PROJECT_MANUAL.md   # Comprehensive project manual
    └── requirements.txt    # Python dependencies
```

## 🚀 How to Install and Run

### ⚡ **SUPER SIMPLE - 3 COMMANDS ONLY!**

**Step 1:** Download the code
```bash
git clone https://github.com/yelloji/Auto-Labeling-Tool.git
```

**Step 2:** Go into the folder
```bash
cd Auto-Labeling-Tool
```

**Step 3:** Run it!
```bash
python start.py
```

**That's it! 🎉** The app will install everything automatically and start running.

---

### 🕐 **First Time Running (Takes 3-5 minutes)**

When you run `python start.py` for the **first time**, here's what happens:

```
🏷️ Starting Auto-Labeling-Tool...
==================================
🔍 Checking what you need...
📦 Installing Node.js... ✅ Done!
📦 Installing Python packages... ✅ Done!
📦 Installing website files... ✅ Done!
🚀 Starting the app...
✅ Backend started on port 12000
✅ Frontend started on port 12001

🎉 Auto-Labeling-Tool is now running!
Open your browser: http://localhost:12001
```

**What gets installed automatically:**
- ✅ Node.js (if you don't have it)
- ✅ All Python packages needed
- ✅ All website files needed
- ✅ Everything else required

---

### ⚡ **Second Time Running (Takes 10-20 seconds)**

When you run `python start.py` **again**, it's super fast:

```
🏷️ Starting Auto-Labeling-Tool...
==================================
🔍 Checking what you need...
✅ Node.js found - good!
✅ Python packages found - good!
✅ Website files found - good!
🚀 Starting the app...
✅ Backend started on port 12000
✅ Frontend started on port 12001

🎉 Auto-Labeling-Tool is now running!
Open your browser: http://localhost:12001
```

**Why it's faster:**
- ✅ Everything is already installed
- ✅ Just starts the app directly
- ✅ No downloading or installing needed

---

### 🎯 **What You Need (Only Python!)**

**Required:**
- ✅ **Python 3.8 or newer** (that's it!)

**Installed Automatically:**
- 🤖 Node.js (if missing)
- 🤖 All other software needed

**You only need Python installed on your computer!** Everything else is automatic. 🚀

---

### 🗂️ **What Files Get Created:**

After running the first time, you'll see these new folders:
```
Auto-Labeling-Tool/
├── backend/
│   └── venv/              ← Python packages stored here
├── frontend/
│   └── node_modules/      ← Website files stored here
└── database.db           ← Your data stored here
```

**Don't delete these folders!** They contain all the installed software and your data.

---

### ❓ **Common Questions:**

**Q: Do I need to install Node.js myself?**  
A: No! The app installs it automatically if you don't have it.

**Q: What if something goes wrong?**  
A: Just run `python start.py` again. It will fix itself.

**Q: How do I stop the app?**  
A: Press `Ctrl+C` in the terminal where you ran the command.

**Q: How do I start it again later?**  
A: Just run `python start.py` again. It will be much faster the second time.

**Q: Can I use this on Windows/Mac/Linux?**  
A: Yes! It works on all operating systems.

## 🔧 Troubleshooting

### ❌ **Frontend Failed to Start Within Timeout**

If you see "Frontend failed to start within timeout", try these solutions:

**Solution 1: Use the improved start.py (Latest Version)**
```bash
python start.py
```
The latest version has increased timeout to 2 minutes and shows progress indicators.

**Solution 2: Manual Startup**
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
npm start
```

**Solution 3: Use Simple Launcher**
```bash
python start_simple.py
```
This shows detailed manual instructions.

### 🐛 **Common Issues & Solutions**

**Issue: Port already in use**
```bash
# Kill processes on ports 12000/12001
# Windows:
netstat -ano | findstr :12000
taskkill /F /PID <PID>

# Mac/Linux:
lsof -ti:12000 | xargs kill -9
```

**Issue: npm not found**
- Install Node.js from https://nodejs.org/
- Restart terminal after installation
- Verify with: `node --version`

**Issue: Python dependencies missing**
```bash
cd backend
pip install -r requirements.txt
```

**Issue: Frontend dependencies missing**
```bash
cd frontend
npm install
```

**Issue: Slow startup on first run**
- First run takes 1-3 minutes (installing dependencies)
- Subsequent runs take 10-20 seconds
- Be patient during initial setup

### 💡 **Performance Tips**

- **Faster builds**: Set `GENERATE_SOURCEMAP=false` environment variable
- **Skip browser**: Frontend won't auto-open browser (access manually at http://localhost:12001)
- **Background mode**: Use `nohup` or `screen` for background execution

## 🎯 Roadmap

### ✅ COMPLETED (Production Ready)
- [x] Project setup and architecture
- [x] Complete backend API development (FastAPI)
- [x] Professional frontend interface (React + Ant Design)
- [x] Model integration (YOLOv8 Nano, Small, Segmentation)
- [x] Auto-labeling pipeline with custom model import
- [x] Advanced dataset management with Train/Val/Test splitting
- [x] Export/import functionality (YOLO, COCO, Pascal VOC)
- [x] **Advanced Analytics**: Class distribution, imbalance detection, progress tracking
- [x] **Data Augmentation**: 15+ augmentation types with presets and preview
- [x] **Visual Indicators**: Status indicators for labeled/unlabeled images
- [x] **Enhanced UI**: Modal-based workflows, advanced filtering, bulk operations

### 🚧 FUTURE ENHANCEMENTS
- [ ] Label editing capabilities in annotation interface
- [ ] Video annotation support
- [ ] Active learning with intelligent sample selection
- [ ] Model training pipeline integration
- [ ] Advanced export formats (CVAT, Labelbox)
- [ ] Multi-user collaboration features
- [ ] Cloud storage integration (optional)
- [ ] Mobile app for annotation review

### 🎯 CURRENT FOCUS
The tool is now **production-ready** with comprehensive features that rival and exceed cloud-based solutions like Roboflow. All core functionality is implemented and tested.

## 📄 License

MIT License - see LICENSE file for details.
---

## 🆕 Installation Options

This project now supports **two installation methods**:

1. **🐍 Conda Installation** (`conda-start.py`) - Recommended for CUDA users
   - Automatic CUDA detection and PyTorch installation
   - Better dependency management for ML packages
   - Complete environment isolation

2. **🔧 Pip/Venv Installation** (`start.py`) - Traditional Python workflow
   - Familiar virtual environment setup
   - Lightweight installation
   - Manual CUDA configuration

📚 **See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed instructions**

