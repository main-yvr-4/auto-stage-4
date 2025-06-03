#!/usr/bin/env python3
"""
Active Learning Setup Script
Prepares the environment for Active Learning functionality
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("🧠 ACTIVE LEARNING SETUP")
    print("=" * 60)
    print("Setting up the most advanced local auto-labeling system!")
    print("This will install all dependencies for Active Learning...")
    print()

def check_python_version():
    """Check Python version compatibility"""
    print("📋 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required for Active Learning")
        print(f"   Current version: {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor} - Compatible")
    return True

def check_system_requirements():
    """Check system requirements"""
    print("\n🔍 Checking system requirements...")
    
    # Check available memory
    try:
        if platform.system() == "Linux":
            with open('/proc/meminfo', 'r') as f:
                meminfo = f.read()
                for line in meminfo.split('\n'):
                    if 'MemTotal:' in line:
                        total_mem = int(line.split()[1]) // 1024  # Convert to MB
                        if total_mem < 4096:  # 4GB minimum
                            print(f"⚠️  Low memory detected: {total_mem}MB")
                            print("   Recommended: 8GB+ for optimal performance")
                        else:
                            print(f"✅ Memory: {total_mem}MB - Sufficient")
                        break
    except:
        print("ℹ️  Could not check memory - proceeding anyway")
    
    # Check disk space
    try:
        statvfs = os.statvfs('.')
        free_space = statvfs.f_frsize * statvfs.f_bavail // (1024**3)  # GB
        if free_space < 5:
            print(f"⚠️  Low disk space: {free_space}GB free")
            print("   Recommended: 10GB+ for models and datasets")
        else:
            print(f"✅ Disk space: {free_space}GB free - Sufficient")
    except:
        print("ℹ️  Could not check disk space - proceeding anyway")

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    
    requirements_file = Path(__file__).parent.parent / "backend" / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found!")
        return False
    
    try:
        # Upgrade pip first
        print("   Upgrading pip...")
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], 
                      check=True, capture_output=True)
        
        # Install requirements
        print("   Installing Active Learning dependencies...")
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, capture_output=True, text=True)
        
        print("✅ Dependencies installed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print(f"   Error output: {e.stderr}")
        return False

def setup_directories():
    """Create necessary directories"""
    print("\n📁 Setting up directories...")
    
    base_dir = Path(__file__).parent.parent
    directories = [
        base_dir / "models" / "training",
        base_dir / "data" / "datasets",
        base_dir / "data" / "exports",
        base_dir / "logs",
        base_dir / "temp"
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"   ✅ {directory}")
    
    print("✅ Directories created successfully!")

def download_base_models():
    """Download base YOLO models"""
    print("\n🤖 Downloading base YOLO models...")
    
    try:
        # This will download YOLOv8 models on first use
        import ultralytics
        from ultralytics import YOLO
        
        models = ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt"]
        
        for model_name in models:
            print(f"   Downloading {model_name}...")
            model = YOLO(model_name)  # This downloads the model
            print(f"   ✅ {model_name} ready")
        
        print("✅ Base models downloaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download models: {e}")
        print("   Models will be downloaded automatically on first use")
        return False

def create_sample_config():
    """Create sample configuration file"""
    print("\n⚙️  Creating sample configuration...")
    
    config_content = """# Active Learning Configuration
# Copy this to config.py and customize as needed

# Training Settings
DEFAULT_EPOCHS = 50
DEFAULT_BATCH_SIZE = 16
DEFAULT_LEARNING_RATE = 0.001
DEFAULT_MAX_ITERATIONS = 10

# Uncertainty Sampling Settings
MIN_UNCERTAINTY_SCORE = 0.3
MAX_SAMPLES_PER_ITERATION = 20
UNCERTAINTY_WEIGHTS = {
    "confidence": 0.4,
    "entropy": 0.3,
    "variance": 0.3
}

# Model Settings
SUPPORTED_MODELS = ["yolov8n", "yolov8s", "yolov8m", "yolov8l", "yolov8x"]
DEFAULT_MODEL = "yolov8n"
IMAGE_SIZE = 640

# Performance Settings
CPU_WORKERS = 2
GPU_ENABLED = True  # Set to False for CPU-only training
MIXED_PRECISION = True

# Storage Settings
MODEL_STORAGE_PATH = "models/training"
DATASET_CACHE_PATH = "data/cache"
LOG_LEVEL = "INFO"
"""
    
    config_file = Path(__file__).parent.parent / "backend" / "config_sample.py"
    with open(config_file, 'w') as f:
        f.write(config_content)
    
    print(f"   ✅ Sample config created: {config_file}")
    print("   Copy to config.py and customize as needed")

def run_tests():
    """Run basic functionality tests"""
    print("\n🧪 Running basic tests...")
    
    try:
        # Test imports
        print("   Testing imports...")
        import torch
        import ultralytics
        import fastapi
        import sqlalchemy
        print("   ✅ Core imports successful")
        
        # Test YOLO
        print("   Testing YOLO functionality...")
        from ultralytics import YOLO
        model = YOLO("yolov8n.pt")
        print("   ✅ YOLO model loading successful")
        
        # Test database
        print("   Testing database connectivity...")
        from sqlalchemy import create_engine
        engine = create_engine("sqlite:///test.db")
        engine.connect()
        os.remove("test.db")  # Clean up
        print("   ✅ Database connectivity successful")
        
        print("✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def print_next_steps():
    """Print next steps for user"""
    print("\n" + "=" * 60)
    print("🎉 ACTIVE LEARNING SETUP COMPLETE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Start the backend server:")
    print("   cd backend && python main.py")
    print()
    print("2. Start the frontend (in another terminal):")
    print("   cd frontend && npm start")
    print()
    print("3. Open your browser:")
    print("   http://localhost:3000/active-learning")
    print()
    print("4. Create your first training session!")
    print()
    print("📚 Documentation:")
    print("   - Active Learning Guide: docs/ACTIVE_LEARNING.md")
    print("   - API Documentation: http://localhost:12000/api/docs")
    print()
    print("🚀 Ready to revolutionize your labeling workflow!")
    print("=" * 60)

def main():
    """Main setup function"""
    print_banner()
    
    # Check requirements
    if not check_python_version():
        sys.exit(1)
    
    check_system_requirements()
    
    # Setup steps
    steps = [
        ("Installing dependencies", install_dependencies),
        ("Setting up directories", setup_directories),
        ("Downloading base models", download_base_models),
        ("Creating sample config", create_sample_config),
        ("Running tests", run_tests)
    ]
    
    failed_steps = []
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                failed_steps.append(step_name)
        except Exception as e:
            print(f"❌ {step_name} failed: {e}")
            failed_steps.append(step_name)
    
    if failed_steps:
        print(f"\n⚠️  Some steps failed: {', '.join(failed_steps)}")
        print("   You may need to install these manually")
        print("   Check the error messages above for details")
    
    print_next_steps()

if __name__ == "__main__":
    main()