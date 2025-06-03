# 🤔 Requirements Files & Folder Naming FAQ

## ❓ Your Questions Answered

### 1️⃣ **"Can I change the main folder name? Will it break installation?"**

**✅ ANSWER: YES, you can change the folder name! It will NOT break installation.**

#### 🔍 **Why it's safe to rename:**
- **No hardcoded paths**: Both `start.py` and `conda-start.py` use dynamic path detection
- **Relative paths only**: All file operations are relative to the script location
- **Automatic detection**: Scripts find their own location and work from there

#### 📁 **Examples of valid folder names:**
```bash
auto-label/                    ✅ Original name
my-labeling-tool/             ✅ Custom name
company-annotation-system/    ✅ Professional name
dataset-manager-v2/           ✅ Versioned name
标注工具/                      ✅ Non-English name
```

#### 🚀 **How to rename safely:**
```bash
# 1. Stop the application if running (Ctrl+C)
# 2. Rename the folder
mv auto-label my-custom-tool
# 3. Enter the new folder
cd my-custom-tool
# 4. Run normally - everything works!
python conda-start.py
```

#### ⚠️ **Only one thing stays the same:**
- **Conda environment name**: Always `auto-label-tool` (this is intentional for consistency)

---

### 2️⃣ **"Explain all the requirements files - 1 in main folder, 4 in backend folder"**

**✅ ANSWER: You're correct! There are 5 total requirements files.**

## 📦 **Complete Requirements Files Breakdown**

### 📊 **Summary Table**
| Location | File Name | Purpose | PyTorch Version | Used By |
|----------|-----------|---------|-----------------|---------|
| **Main Folder** | `requirements.txt` | Legacy compatibility | CPU | Old installations |
| **Backend** | `requirements.txt` | Primary pip install | CPU | `start.py` |
| **Backend** | `conda-requirements.txt` | Conda dependencies | Via conda | `conda-start.py` |
| **Backend** | `requirements-cuda121.txt` | CUDA 12.1 install | CUDA 12.1 | Manual install |
| **Backend** | `requirements-cuda118.txt` | CUDA 11.8 install | CUDA 11.8 | Manual install |

### 📁 **Main Folder (1 file)**

#### `/requirements.txt` (Legacy)
```bash
# Purpose: Backward compatibility
# Status: Maintained but not actively used
# Content: Complete dependency list with CPU PyTorch
# Used by: Older installation methods
```

### 🔧 **Backend Folder (4 files)**

#### 1️⃣ `/backend/requirements.txt` (Primary)
```bash
# Purpose: Main pip installation
# PyTorch: CPU only (torch==2.7.0+cpu)
# Used by: start.py (traditional launcher)
# Best for: Development, testing, CPU systems
```

#### 2️⃣ `/backend/conda-requirements.txt` (Conda)
```bash
# Purpose: Conda environment setup
# PyTorch: Installed separately via conda with CUDA
# Used by: conda-start.py (recommended launcher)
# Best for: Production, CUDA systems, optimal performance
```

#### 3️⃣ `/backend/requirements-cuda121.txt` (CUDA 12.1)
```bash
# Purpose: Manual CUDA 12.1 installation
# PyTorch: CUDA 12.1 (torch==2.7.0+cu121)
# Used by: Manual pip install for CUDA 12.1
# Best for: RTX 40 Series, latest GPUs
```

#### 4️⃣ `/backend/requirements-cuda118.txt` (CUDA 11.8)
```bash
# Purpose: Manual CUDA 11.8 installation
# PyTorch: CUDA 11.8 (torch==2.7.0+cu118)
# Used by: Manual pip install for CUDA 11.8
# Best for: Most GPUs, stable CUDA version
```

## 🎯 **Which File Gets Used When?**

### 🐍 **Conda Installation (Recommended)**
```bash
python conda-start.py
# Uses: backend/conda-requirements.txt
# PyTorch: Installed via conda with automatic CUDA detection
# Result: Optimal performance with CUDA support
```

### 🔧 **Pip Installation (Traditional)**
```bash
python start.py
# Uses: backend/requirements.txt
# PyTorch: CPU version only
# Result: Works everywhere, no CUDA
```

### ⚡ **Manual CUDA Installation**
```bash
# For CUDA 12.1 systems:
pip install -r backend/requirements-cuda121.txt

# For CUDA 11.8 systems:
pip install -r backend/requirements-cuda118.txt
```

## 🔄 **How the Magic Works**

### 🧠 **Smart Installation Logic**

#### `conda-start.py` Process:
1. **Detect CUDA version** on your system
2. **Create conda environment** with Python 3.11
3. **Install PyTorch with CUDA** via conda (optimized binaries)
4. **Install other packages** via pip using `conda-requirements.txt`
5. **Result**: Best possible performance

#### `start.py` Process:
1. **Create virtual environment** with system Python
2. **Install all packages** via pip using `requirements.txt`
3. **Result**: CPU-only but works everywhere

## 🎉 **Key Benefits of This System**

### ✅ **Flexibility**
- **Choose your workflow**: Conda or pip
- **Choose your hardware**: CPU or CUDA
- **Choose your CUDA version**: 12.1 or 11.8

### ✅ **Optimization**
- **Conda**: Pre-compiled binaries for best performance
- **Pip**: Standard Python packages for compatibility

### ✅ **Simplicity**
- **One command**: `python conda-start.py` or `python start.py`
- **Automatic detection**: CUDA version detected automatically
- **No manual configuration**: Everything handled for you

## 🚀 **Recommendations**

### 🏆 **Best Choice: Conda Installation**
```bash
python conda-start.py
```
- **Automatic CUDA setup**
- **Optimal performance**
- **Better dependency management**
- **Production-ready**

### 🔧 **Alternative: Pip Installation**
```bash
python start.py
```
- **Familiar workflow**
- **Lightweight**
- **Good for development**
- **CPU-only**

---

**🎯 Bottom Line: The system is designed to be flexible and foolproof. You can rename the folder to anything you want, and the installation will work perfectly!**