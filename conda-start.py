#!/usr/bin/env python3
"""
Auto-Labeling-Tool Conda Launcher
Cross-platform startup script with Conda environment management and CUDA support
"""

import os
import sys
import time
import signal
import subprocess
import platform
import shutil
import urllib.request
import json
from pathlib import Path

class CondaAutoLabelingLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.is_windows = platform.system() == "Windows"
        self.project_root = Path(__file__).parent
        self.conda_env_name = "auto-label-tool"
        self.python_version = "3.11"  # Stable version for ML
        
    def print_colored(self, text, color="white"):
        """Print colored text (basic cross-platform)"""
        colors = {
            "red": "\033[91m",
            "green": "\033[92m", 
            "yellow": "\033[93m",
            "blue": "\033[94m",
            "magenta": "\033[95m",
            "cyan": "\033[96m",
            "white": "\033[0m"
        }
        
        if not self.is_windows:
            print(f"{colors.get(color, '')}{text}\033[0m")
        else:
            print(text)
    
    def print_banner(self):
        """Print startup banner"""
        self.print_colored("=" * 70, "cyan")
        self.print_colored("🐍 AUTO-LABELING-TOOL - CONDA LAUNCHER", "cyan")
        self.print_colored("=" * 70, "cyan")
        self.print_colored("🚀 Revolutionary Active Learning with CUDA Support", "green")
        self.print_colored("🔬 Conda Environment Management", "blue")
        self.print_colored("⚡ CUDA 12.1 PyTorch Optimization", "yellow")
        self.print_colored("=" * 70, "cyan")
        print()
    
    def check_port(self, port):
        """Check if port is in use"""
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result == 0
        except:
            return False
    
    def kill_port(self, port):
        """Kill process on specific port"""
        self.print_colored(f"🔪 Killing existing process on port {port}...", "yellow")
        
        if self.is_windows:
            try:
                subprocess.run(f'netstat -ano | findstr :{port}', shell=True, capture_output=True)
                subprocess.run(f'for /f "tokens=5" %a in (\'netstat -ano ^| findstr :{port}\') do taskkill /F /PID %a', shell=True)
            except:
                pass
        else:
            try:
                subprocess.run(f"lsof -ti:{port} | xargs kill -9", shell=True, stderr=subprocess.DEVNULL)
            except:
                pass
        
        time.sleep(2)
    
    def is_conda_installed(self):
        """Check if Conda is installed"""
        try:
            result = subprocess.run(["conda", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip()
                self.print_colored(f"✅ Conda found: {version}", "green")
                return True
        except FileNotFoundError:
            pass
        
        # Try mamba as alternative
        try:
            result = subprocess.run(["mamba", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip().split('\n')[0]
                self.print_colored(f"✅ Mamba found: {version}", "green")
                return True
        except FileNotFoundError:
            pass
        
        return False
    
    def is_nodejs_installed(self):
        """Check if Node.js is installed"""
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip()
                self.print_colored(f"✅ Node.js found: {version}", "green")
                return True
        except FileNotFoundError:
            pass
        return False
    
    def detect_cuda_version(self):
        """Detect CUDA version if available"""
        try:
            # Try nvidia-smi first
            result = subprocess.run(["nvidia-smi"], capture_output=True, text=True)
            if result.returncode == 0:
                output = result.stdout
                # Extract CUDA version from nvidia-smi output
                for line in output.split('\n'):
                    if 'CUDA Version:' in line:
                        cuda_version = line.split('CUDA Version:')[1].strip().split()[0]
                        self.print_colored(f"🎯 CUDA detected: {cuda_version}", "green")
                        return cuda_version
        except FileNotFoundError:
            pass
        
        # Try nvcc
        try:
            result = subprocess.run(["nvcc", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                output = result.stdout
                for line in output.split('\n'):
                    if 'release' in line.lower():
                        cuda_version = line.split('release')[1].strip().split(',')[0]
                        self.print_colored(f"🎯 CUDA detected: {cuda_version}", "green")
                        return cuda_version
        except FileNotFoundError:
            pass
        
        self.print_colored("⚠️  CUDA not detected - will use CPU version", "yellow")
        return None
    
    def install_conda_instructions(self):
        """Provide Conda installation instructions"""
        self.print_colored("❌ Conda/Mamba not found!", "red")
        self.print_colored("Please install Conda or Mamba first:", "yellow")
        print()
        
        if self.is_windows:
            self.print_colored("Windows Installation Options:", "blue")
            self.print_colored("1. Miniconda (Recommended):", "white")
            self.print_colored("   https://docs.conda.io/en/latest/miniconda.html", "white")
            self.print_colored("2. Anaconda (Full suite):", "white")
            self.print_colored("   https://www.anaconda.com/products/distribution", "white")
            self.print_colored("3. Mamba (Faster alternative):", "white")
            self.print_colored("   https://mamba.readthedocs.io/en/latest/installation.html", "white")
        else:
            self.print_colored("Unix Installation Options:", "blue")
            self.print_colored("1. Miniconda (Recommended):", "white")
            self.print_colored("   wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh", "white")
            self.print_colored("   bash Miniconda3-latest-Linux-x86_64.sh", "white")
            self.print_colored("2. Mamba (Faster):", "white")
            self.print_colored("   curl -L -O https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh", "white")
            self.print_colored("   bash Miniforge3-Linux-x86_64.sh", "white")
        
        print()
        self.print_colored("After installation, restart your terminal and run this script again.", "yellow")
        return False
    
    def install_nodejs_with_conda(self):
        """Install Node.js using conda"""
        self.print_colored("📦 Installing Node.js via conda...", "yellow")
        
        try:
            # Try conda first
            result = subprocess.run(["conda", "install", "-c", "conda-forge", "nodejs", "-y"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.print_colored("✅ Node.js installed via conda!", "green")
                return True
        except FileNotFoundError:
            pass
        
        # Try mamba
        try:
            result = subprocess.run(["mamba", "install", "-c", "conda-forge", "nodejs", "-y"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.print_colored("✅ Node.js installed via mamba!", "green")
                return True
        except FileNotFoundError:
            pass
        
        self.print_colored("❌ Failed to install Node.js via conda", "red")
        return False
    
    def conda_env_exists(self):
        """Check if conda environment exists"""
        try:
            result = subprocess.run(["conda", "env", "list"], capture_output=True, text=True)
            if result.returncode == 0:
                return self.conda_env_name in result.stdout
        except FileNotFoundError:
            try:
                result = subprocess.run(["mamba", "env", "list"], capture_output=True, text=True)
                if result.returncode == 0:
                    return self.conda_env_name in result.stdout
            except FileNotFoundError:
                pass
        return False
    
    def create_conda_environment(self):
        """Create conda environment with Python and basic packages"""
        self.print_colored(f"🐍 Creating conda environment: {self.conda_env_name}", "blue")
        self.print_colored(f"   Python version: {self.python_version}", "white")
        
        # Detect CUDA for PyTorch installation
        cuda_version = self.detect_cuda_version()
        
        try:
            # Create environment with Python
            cmd = ["conda", "create", "-n", self.conda_env_name, f"python={self.python_version}", "-y"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                # Try mamba
                cmd[0] = "mamba"
                result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.print_colored(f"✅ Environment {self.conda_env_name} created successfully!", "green")
                
                # Install PyTorch with CUDA support
                self.install_pytorch_cuda(cuda_version)
                
                return True
            else:
                self.print_colored(f"❌ Failed to create environment: {result.stderr}", "red")
                return False
                
        except Exception as e:
            self.print_colored(f"❌ Error creating environment: {e}", "red")
            return False
    
    def install_pytorch_cuda(self, cuda_version=None):
        """Install PyTorch with CUDA support"""
        self.print_colored("🔥 Installing PyTorch with CUDA support...", "blue")
        
        # Determine PyTorch installation command based on CUDA version
        if cuda_version and "12.1" in cuda_version:
            pytorch_cmd = [
                "conda", "install", "-n", self.conda_env_name,
                "pytorch", "torchvision", "torchaudio", "pytorch-cuda=12.1",
                "-c", "pytorch", "-c", "nvidia", "-y"
            ]
            self.print_colored("   Installing PyTorch for CUDA 12.1", "yellow")
        elif cuda_version and "11.8" in cuda_version:
            pytorch_cmd = [
                "conda", "install", "-n", self.conda_env_name,
                "pytorch", "torchvision", "torchaudio", "pytorch-cuda=11.8",
                "-c", "pytorch", "-c", "nvidia", "-y"
            ]
            self.print_colored("   Installing PyTorch for CUDA 11.8", "yellow")
        else:
            pytorch_cmd = [
                "conda", "install", "-n", self.conda_env_name,
                "pytorch", "torchvision", "torchaudio", "cpuonly",
                "-c", "pytorch", "-y"
            ]
            self.print_colored("   Installing PyTorch CPU-only version", "yellow")
        
        try:
            result = subprocess.run(pytorch_cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                # Try mamba
                pytorch_cmd[0] = "mamba"
                result = subprocess.run(pytorch_cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.print_colored("✅ PyTorch installed successfully!", "green")
                return True
            else:
                self.print_colored(f"❌ PyTorch installation failed: {result.stderr}", "red")
                return False
                
        except Exception as e:
            self.print_colored(f"❌ Error installing PyTorch: {e}", "red")
            return False
    
    def install_conda_dependencies(self):
        """Install dependencies in conda environment"""
        self.print_colored("📦 Installing dependencies in conda environment...", "blue")
        
        # Create conda-specific requirements file
        self.create_conda_requirements()
        
        # Get conda executable path
        conda_cmd = self.get_conda_executable()
        if not conda_cmd:
            return False
        
        # Install pip in the environment first
        try:
            result = subprocess.run([
                conda_cmd, "install", "-n", self.conda_env_name, "pip", "-y"
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                self.print_colored("❌ Failed to install pip in conda environment", "red")
                return False
        except Exception as e:
            self.print_colored(f"❌ Error installing pip: {e}", "red")
            return False
        
        # Install requirements using pip in conda environment
        try:
            if self.is_windows:
                pip_path = Path.home() / f"miniconda3/envs/{self.conda_env_name}/Scripts/pip.exe"
                if not pip_path.exists():
                    pip_path = Path.home() / f"anaconda3/envs/{self.conda_env_name}/Scripts/pip.exe"
            else:
                pip_path = Path.home() / f"miniconda3/envs/{self.conda_env_name}/bin/pip"
                if not pip_path.exists():
                    pip_path = Path.home() / f"anaconda3/envs/{self.conda_env_name}/bin/pip"
            
            # Fallback to conda run
            if not pip_path.exists():
                cmd = ["conda", "run", "-n", self.conda_env_name, "pip", "install", "-r", "backend/conda-requirements.txt"]
            else:
                cmd = [str(pip_path), "install", "-r", "backend/conda-requirements.txt"]
            
            self.print_colored("   Installing Python packages...", "yellow")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.print_colored("✅ All dependencies installed successfully!", "green")
                return True
            else:
                self.print_colored(f"❌ Dependency installation failed: {result.stderr}", "red")
                return False
                
        except Exception as e:
            self.print_colored(f"❌ Error installing dependencies: {e}", "red")
            return False
    
    def create_conda_requirements(self):
        """Create conda-specific requirements file"""
        conda_requirements = """# Core FastAPI and web framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
alembic==1.12.1

# Computer Vision and ML - YOLO11 Latest
ultralytics>=8.3.0  # YOLO11 support
opencv-python>=4.8.0
# PyTorch installed separately via conda with CUDA support
numpy>=1.24.0,<1.27.0  # OpenCV compatible range
pillow>=10.0.0
albumentations>=1.3.0  # Data augmentation

# Data handling
pandas>=2.1.0
pydantic>=2.5.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4

# File handling
aiofiles>=23.2.0
python-magic>=0.4.27

# Utilities
python-dotenv>=1.0.0
requests>=2.31.0
tqdm>=4.66.0
PyYAML>=6.0.0

# Development and testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
black>=23.11.0
flake8>=6.1.0

# Active Learning specific
scikit-learn>=1.3.0
matplotlib>=3.8.0
seaborn>=0.13.0
"""
        
        conda_req_file = self.project_root / "backend" / "conda-requirements.txt"
        with open(conda_req_file, 'w') as f:
            f.write(conda_requirements)
        
        self.print_colored(f"✅ Created conda-requirements.txt", "green")
    
    def get_conda_executable(self):
        """Get conda or mamba executable"""
        for cmd in ["conda", "mamba"]:
            try:
                result = subprocess.run([cmd, "--version"], capture_output=True, text=True)
                if result.returncode == 0:
                    return cmd
            except FileNotFoundError:
                continue
        return None
    
    def get_conda_python_path(self):
        """Get Python executable path from conda environment"""
        if self.is_windows:
            possible_paths = [
                Path.home() / f"miniconda3/envs/{self.conda_env_name}/python.exe",
                Path.home() / f"anaconda3/envs/{self.conda_env_name}/python.exe",
                Path(f"C:/Users/{os.getenv('USERNAME')}/miniconda3/envs/{self.conda_env_name}/python.exe"),
                Path(f"C:/Users/{os.getenv('USERNAME')}/anaconda3/envs/{self.conda_env_name}/python.exe")
            ]
        else:
            possible_paths = [
                Path.home() / f"miniconda3/envs/{self.conda_env_name}/bin/python",
                Path.home() / f"anaconda3/envs/{self.conda_env_name}/bin/python",
                Path(f"/opt/conda/envs/{self.conda_env_name}/bin/python"),
                Path(f"/usr/local/miniconda3/envs/{self.conda_env_name}/bin/python")
            ]
        
        for path in possible_paths:
            if path.exists():
                return str(path)
        
        # Fallback to conda run
        return None
    
    def check_and_setup_environment(self):
        """Check and setup conda environment"""
        self.print_colored("🔍 Checking conda environment...", "blue")
        
        # Check if conda is installed
        if not self.is_conda_installed():
            return self.install_conda_instructions()
        
        # Check if Node.js is available
        if not self.is_nodejs_installed():
            if not self.install_nodejs_with_conda():
                self.print_colored("❌ Node.js installation failed", "red")
                return False
        
        # Check if environment exists
        if not self.conda_env_exists():
            self.print_colored(f"🆕 Environment {self.conda_env_name} not found. Creating...", "yellow")
            if not self.create_conda_environment():
                return False
        else:
            self.print_colored(f"✅ Environment {self.conda_env_name} found", "green")
        
        # Install dependencies
        if not self.install_conda_dependencies():
            return False
        
        self.print_colored("✅ Conda environment ready!", "green")
        return True
    
    def start_backend(self):
        """Start the backend server using conda environment"""
        self.print_colored("1️⃣ Starting Backend Server (Conda)...", "blue")
        
        backend_dir = self.project_root / "backend"
        os.chdir(backend_dir)
        
        # Get Python executable from conda environment
        python_exe = self.get_conda_python_path()
        
        if python_exe:
            self.print_colored(f"   Using conda Python: {python_exe}", "white")
            cmd = [python_exe, "main.py"]
        else:
            self.print_colored("   Using conda run command", "white")
            cmd = ["conda", "run", "-n", self.conda_env_name, "python", "main.py"]
        
        # Start backend
        self.print_colored("🚀 Starting FastAPI backend on port 12000...", "green")
        self.backend_process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Wait for backend to start
        self.print_colored("⏳ Waiting for backend to start...", "yellow")
        for i in range(15):  # Give more time for conda
            time.sleep(1)
            if self.check_port(12000):
                self.print_colored("✅ Backend started successfully on port 12000", "green")
                return True
            if i % 3 == 0:
                self.print_colored(f"   Still waiting... ({i+1}/15)", "yellow")
        
        self.print_colored("❌ Backend failed to start", "red")
        return False
    
    def start_frontend(self):
        """Start the frontend server"""
        self.print_colored("2️⃣ Starting Frontend Server...", "blue")
        
        frontend_dir = self.project_root / "frontend"
        os.chdir(frontend_dir)
        
        # Install dependencies if needed
        if not (frontend_dir / "node_modules").exists():
            self.print_colored("📦 Installing frontend dependencies...", "yellow")
            result = subprocess.run(["npm", "install"], capture_output=True, text=True)
            if result.returncode != 0:
                self.print_colored("❌ Frontend dependency installation failed", "red")
                return False
        
        # Start frontend
        self.print_colored("🚀 Starting React frontend on port 12001...", "green")
        
        # Set environment variable for port
        env = os.environ.copy()
        env["PORT"] = "12001"
        
        self.frontend_process = subprocess.Popen(
            ["npm", "start"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=env
        )
        
        # Wait for frontend to start
        self.print_colored("⏳ Waiting for frontend to start...", "yellow")
        for i in range(30):  # Frontend takes longer
            time.sleep(1)
            if self.check_port(12001):
                self.print_colored("✅ Frontend started successfully on port 12001", "green")
                return True
            if i % 5 == 0 and i > 0:
                self.print_colored(f"   Still waiting... ({i+1}/30)", "yellow")
        
        self.print_colored("❌ Frontend failed to start", "red")
        return False
    
    def cleanup(self):
        """Stop both servers"""
        self.print_colored("\n🛑 Shutting down servers...", "yellow")
        
        if self.backend_process:
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
        
        if self.frontend_process:
            self.frontend_process.terminate()
            try:
                self.frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.frontend_process.kill()
        
        self.print_colored("✅ Servers stopped.", "green")
    
    def print_success_message(self):
        """Print success message with URLs"""
        print()
        self.print_colored("🎉 AUTO-LABELING-TOOL IS NOW RUNNING!", "green")
        self.print_colored("=" * 50, "green")
        self.print_colored("🌐 Frontend UI:    http://localhost:12001", "blue")
        self.print_colored("🔧 Backend API:    http://localhost:12000", "blue")
        self.print_colored("📚 API Docs:       http://localhost:12000/docs", "blue")
        self.print_colored("🧠 Active Learning: http://localhost:12001/active-learning", "magenta")
        self.print_colored("=" * 50, "green")
        print()
        self.print_colored("🐍 Conda Environment:", "cyan")
        self.print_colored(f"   Environment: {self.conda_env_name}", "white")
        self.print_colored(f"   Python: {self.python_version}", "white")
        self.print_colored("   PyTorch: CUDA-enabled (if available)", "white")
        print()
        self.print_colored("⚡ FEATURES AVAILABLE:", "yellow")
        self.print_colored("   🏷️  Smart Auto-Labeling", "white")
        self.print_colored("   🧠 Active Learning Pipeline", "white")
        self.print_colored("   🎯 YOLO11 Training", "white")
        self.print_colored("   🔥 CUDA Acceleration", "white")
        self.print_colored("   📊 Real-time Progress Tracking", "white")
        print()
        self.print_colored("Press Ctrl+C to stop both servers", "red")
        print()
    
    def run(self):
        """Main launcher function"""
        try:
            self.print_banner()
            
            # Setup conda environment
            if not self.check_and_setup_environment():
                return 1
            
            # Check and kill existing processes
            if self.check_port(12000):
                self.print_colored("🔍 Backend port 12000 is in use", "yellow")
                self.kill_port(12000)
            
            if self.check_port(12001):
                self.print_colored("🔍 Frontend port 12001 is in use", "yellow")
                self.kill_port(12001)
            
            # Create logs directory
            logs_dir = self.project_root / "logs"
            logs_dir.mkdir(exist_ok=True)
            
            # Start backend
            if not self.start_backend():
                return 1
            
            # Start frontend
            if not self.start_frontend():
                self.cleanup()
                return 1
            
            # Success message
            self.print_success_message()
            
            # Keep running until interrupted
            try:
                while True:
                    time.sleep(1)
                    # Check if processes are still running
                    if self.backend_process and self.backend_process.poll() is not None:
                        self.print_colored("💥 Backend process died unexpectedly", "red")
                        break
                    if self.frontend_process and self.frontend_process.poll() is not None:
                        self.print_colored("💥 Frontend process died unexpectedly", "red")
                        break
            except KeyboardInterrupt:
                self.print_colored("\n👋 Received shutdown signal", "yellow")
            
            return 0
            
        except Exception as e:
            self.print_colored(f"💥 Error: {e}", "red")
            import traceback
            traceback.print_exc()
            return 1
        finally:
            self.cleanup()

def main():
    """Main entry point"""
    launcher = CondaAutoLabelingLauncher()
    sys.exit(launcher.run())

if __name__ == "__main__":
    main()