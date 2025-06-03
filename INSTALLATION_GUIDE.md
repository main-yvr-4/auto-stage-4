# 🚀 Auto-Labeling-Tool Installation Guide

## 📋 Installation Options

The Auto-Labeling-Tool supports **two installation methods** to suit different preferences and requirements:

### 🐍 Option 1: Conda Installation (Recommended for CUDA)
**Best for:** Users who want automatic CUDA setup and environment isolation

### 🔧 Option 2: Pip/Venv Installation  
**Best for:** Users who prefer traditional Python virtual environments

---

## 🐍 Conda Installation (Recommended)

### ✅ Advantages
- **Automatic CUDA Detection**: Detects your CUDA version and installs compatible PyTorch
- **Better Dependency Management**: Conda handles complex ML dependencies better
- **Environment Isolation**: Complete isolation from system Python
- **Cross-Platform**: Works consistently across Windows, macOS, and Linux
- **Faster Installation**: Pre-compiled binaries for faster setup

### 📋 Prerequisites
- **Conda or Mamba** (Miniconda recommended)
- **Node.js** (will be installed automatically if missing)
- **CUDA 12.1 or 11.8** (optional, for GPU acceleration)

### 🚀 Quick Start
```bash
# Clone the repository
git clone https://github.com/rayel-tech/auto-label.git
cd auto-label

# Run conda launcher (creates environment automatically)
python conda-start.py
```

### 🔧 Manual Conda Setup
If you prefer manual control:

```bash
# Create conda environment
conda create -n auto-label-tool python=3.11 -y
conda activate auto-label-tool

# Install PyTorch with CUDA 12.1
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia -y

# Install other dependencies
pip install -r backend/conda-requirements.txt

# Install Node.js dependencies
cd frontend && npm install && cd ..

# Start manually
cd backend && python main.py &
cd frontend && npm start
```

---

## 🔧 Pip/Venv Installation

### ✅ Advantages
- **Familiar Workflow**: Standard Python development approach
- **Lightweight**: Smaller environment footprint
- **Fine Control**: Manual control over all dependencies

### 📋 Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Git** (optional)

### 🚀 Quick Start
```bash
# Clone the repository
git clone https://github.com/rayel-tech/auto-label.git
cd auto-label

# Run pip launcher (creates venv automatically)
python start.py
```

### 🔧 Manual Pip Setup
```bash
# Create virtual environment
cd backend
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Choose your PyTorch version:

# For CUDA 12.1:
pip install -r requirements-cuda121.txt

# For CUDA 11.8:
pip install -r requirements-cuda118.txt

# For CPU only:
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend && npm install && cd ..

# Start manually
cd backend && python main.py &
cd frontend && npm start
```

---

## 🎯 CUDA Support

### 🔍 CUDA Version Detection
Both launchers automatically detect your CUDA version:

```bash
# Check your CUDA version
nvidia-smi
# or
nvcc --version
```

### 🎮 Supported CUDA Versions
- **CUDA 12.1** (Recommended) - Latest features and performance
- **CUDA 11.8** - Stable and widely supported
- **CPU Only** - Works without GPU

### ⚡ Performance Comparison
| Setup | Training Speed | Memory Usage | Compatibility |
|-------|---------------|--------------|---------------|
| CUDA 12.1 | 🚀🚀🚀🚀🚀 | High | Latest GPUs |
| CUDA 11.8 | 🚀🚀🚀🚀 | Medium | Most GPUs |
| CPU Only | 🚀 | Low | All systems |

---

## 📁 File Structure

```
auto-label/
├── start.py                    # Pip/venv launcher
├── conda-start.py             # Conda launcher
├── backend/
│   ├── requirements.txt       # CPU PyTorch
│   ├── requirements-cuda121.txt # CUDA 12.1
│   ├── requirements-cuda118.txt # CUDA 11.8
│   ├── conda-requirements.txt # Conda-specific
│   └── main.py               # Backend server
├── frontend/
│   ├── package.json          # Node.js dependencies
│   └── src/                  # React application
└── docs/                     # Documentation
```

---

## 🛠️ Troubleshooting

### 🐍 Conda Issues
```bash
# Update conda
conda update conda

# Clear conda cache
conda clean --all

# Reinstall environment
conda env remove -n auto-label-tool
python conda-start.py
```

### 🔧 Pip Issues
```bash
# Update pip
python -m pip install --upgrade pip

# Clear pip cache
pip cache purge

# Reinstall environment
rm -rf backend/venv
python start.py
```

### 🎮 CUDA Issues
```bash
# Check CUDA installation
nvidia-smi
nvcc --version

# Verify PyTorch CUDA
python -c "import torch; print(torch.cuda.is_available())"

# Reinstall PyTorch
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## 🎉 Success Verification

After installation, you should see:

```
🎉 AUTO-LABELING-TOOL IS NOW RUNNING!
==================================================
🌐 Frontend UI:    http://localhost:12001
🔧 Backend API:    http://localhost:12000
📚 API Docs:       http://localhost:12000/docs
🧠 Active Learning: http://localhost:12001/active-learning
==================================================
```

### ✅ Feature Checklist
- [ ] Frontend loads at http://localhost:12001
- [ ] Backend API responds at http://localhost:12000/health
- [ ] CUDA detection works (if GPU available)
- [ ] Active Learning tab is visible
- [ ] File upload works
- [ ] YOLO11 model loads successfully

---

## 🆘 Getting Help

### 📚 Documentation
- [Active Learning Guide](docs/ACTIVE_LEARNING.md)
- [API Documentation](http://localhost:12000/docs)
- [Project Manual](PROJECT_MANUAL.md)

### 🐛 Common Issues
1. **Port conflicts**: Change ports in configuration
2. **CUDA not detected**: Check NVIDIA drivers
3. **Memory errors**: Reduce batch size
4. **Node.js missing**: Install Node.js 16+

### 💬 Support
- Create an issue on GitHub
- Check existing documentation
- Review error logs in `logs/` directory

---

## 🚀 Next Steps

1. **Upload your dataset** via the web interface
2. **Configure Active Learning** parameters
3. **Start your first training session**
4. **Review uncertain samples** for optimal results
5. **Export your trained model** in multiple formats

**Ready to revolutionize your labeling workflow!** 🎯