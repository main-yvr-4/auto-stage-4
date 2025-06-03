#!/usr/bin/env python3
"""
🚀 UNIVERSAL AUTO-LABELING TOOL LAUNCHER
==========================================
Self-healing, bulletproof startup system that works on ANY system.
No more silly errors - this handles EVERYTHING automatically!

Features:
- Auto-detects and installs missing dependencies
- Works on Windows, macOS, Linux
- Handles all path issues automatically
- Self-healing error recovery
- Zero-configuration startup
- Comprehensive error handling
"""

import os
import sys
import subprocess
import platform
import time
import json
import shutil
import urllib.request
import zipfile
import tarfile
from pathlib import Path
import threading
import socket
import webbrowser
from typing import Optional, List, Dict, Any

class Colors:
    """ANSI color codes for cross-platform colored output"""
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class UniversalLauncher:
    """Universal, bulletproof launcher for the auto-labeling tool"""
    
    def __init__(self):
        self.system = platform.system()
        self.is_windows = self.system == "Windows"
        self.is_macos = self.system == "Darwin"
        self.is_linux = self.system == "Linux"
        
        self.project_root = Path(__file__).parent.absolute()
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        
        self.backend_process = None
        self.frontend_process = None
        
        # Configuration
        self.backend_port = 12000
        self.frontend_port = 12001
        self.max_retries = 3
        self.startup_timeout = 120  # 2 minutes
        
        print(f"{Colors.BOLD}{Colors.CYAN}")
        print("🚀 UNIVERSAL AUTO-LABELING TOOL LAUNCHER")
        print("=" * 50)
        print(f"🖥️  System: {self.system}")
        print(f"📁 Project: {self.project_root}")
        print(f"🎯 Backend Port: {self.backend_port}")
        print(f"🌐 Frontend Port: {self.frontend_port}")
        print(f"{Colors.END}")
    
    def log(self, message: str, level: str = "info"):
        """Enhanced logging with colors and timestamps"""
        timestamp = time.strftime("%H:%M:%S")
        
        if level == "success":
            color = Colors.GREEN
            icon = "✅"
        elif level == "error":
            color = Colors.RED
            icon = "❌"
        elif level == "warning":
            color = Colors.YELLOW
            icon = "⚠️"
        elif level == "info":
            color = Colors.BLUE
            icon = "ℹ️"
        elif level == "progress":
            color = Colors.PURPLE
            icon = "🔄"
        else:
            color = Colors.WHITE
            icon = "📝"
        
        print(f"{color}[{timestamp}] {icon} {message}{Colors.END}")
    
    def run_command(self, cmd: List[str], cwd: Optional[Path] = None, 
                   timeout: int = 60, capture_output: bool = True) -> Dict[str, Any]:
        """Enhanced command runner with comprehensive error handling"""
        try:
            self.log(f"Running: {' '.join(cmd)}", "progress")
            
            result = subprocess.run(
                cmd,
                cwd=str(cwd) if cwd else None,
                capture_output=capture_output,
                text=True,
                timeout=timeout,
                shell=self.is_windows  # Use shell on Windows for better compatibility
            )
            
            return {
                "success": result.returncode == 0,
                "returncode": result.returncode,
                "stdout": result.stdout if capture_output else "",
                "stderr": result.stderr if capture_output else "",
                "command": cmd
            }
            
        except subprocess.TimeoutExpired:
            self.log(f"Command timed out after {timeout}s: {' '.join(cmd)}", "error")
            return {"success": False, "error": "timeout", "command": cmd}
        except FileNotFoundError:
            self.log(f"Command not found: {cmd[0]}", "error")
            return {"success": False, "error": "not_found", "command": cmd}
        except Exception as e:
            self.log(f"Command failed: {str(e)}", "error")
            return {"success": False, "error": str(e), "command": cmd}
    
    def check_port(self, port: int) -> bool:
        """Check if a port is available or in use"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                return result == 0  # Port is in use
        except:
            return False
    
    def find_executable(self, names: List[str]) -> Optional[str]:
        """Find executable with multiple possible names"""
        for name in names:
            if shutil.which(name):
                return name
        return None
    
    def install_node_windows(self) -> bool:
        """Install Node.js on Windows automatically"""
        self.log("Installing Node.js on Windows...", "progress")
        
        try:
            # Try winget first (Windows 10+)
            result = self.run_command(["winget", "install", "OpenJS.NodeJS"])
            if result["success"]:
                self.log("Node.js installed via winget!", "success")
                return True
        except:
            pass
        
        try:
            # Try chocolatey
            result = self.run_command(["choco", "install", "nodejs", "-y"])
            if result["success"]:
                self.log("Node.js installed via chocolatey!", "success")
                return True
        except:
            pass
        
        # Manual download and install
        self.log("Downloading Node.js installer...", "progress")
        try:
            node_url = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
            installer_path = self.project_root / "node_installer.msi"
            
            urllib.request.urlretrieve(node_url, installer_path)
            
            # Run installer
            result = self.run_command([
                "msiexec", "/i", str(installer_path), "/quiet", "/norestart"
            ], timeout=300)
            
            if result["success"]:
                self.log("Node.js installed successfully!", "success")
                installer_path.unlink()  # Clean up
                return True
                
        except Exception as e:
            self.log(f"Failed to install Node.js: {e}", "error")
        
        return False
    
    def install_node_unix(self) -> bool:
        """Install Node.js on Unix-like systems"""
        self.log(f"Installing Node.js on {self.system}...", "progress")
        
        if self.is_macos:
            # Try homebrew
            result = self.run_command(["brew", "install", "node"])
            if result["success"]:
                self.log("Node.js installed via homebrew!", "success")
                return True
        else:
            # Linux - try different package managers
            package_managers = [
                ["sudo", "apt", "update", "&&", "sudo", "apt", "install", "-y", "nodejs", "npm"],
                ["sudo", "yum", "install", "-y", "nodejs", "npm"],
                ["sudo", "dnf", "install", "-y", "nodejs", "npm"],
                ["sudo", "pacman", "-S", "--noconfirm", "nodejs", "npm"],
            ]
            
            for cmd in package_managers:
                result = self.run_command(cmd, timeout=300)
                if result["success"]:
                    self.log(f"Node.js installed via {cmd[1]}!", "success")
                    return True
        
        # Try NodeSource repository (universal Linux)
        try:
            self.log("Installing via NodeSource repository...", "progress")
            
            # Download and run NodeSource setup script
            setup_script = self.project_root / "nodesource_setup.sh"
            urllib.request.urlretrieve(
                "https://deb.nodesource.com/setup_20.x", 
                setup_script
            )
            
            # Make executable and run
            setup_script.chmod(0o755)
            result1 = self.run_command(["sudo", "bash", str(setup_script)])
            result2 = self.run_command(["sudo", "apt", "install", "-y", "nodejs"])
            
            if result1["success"] and result2["success"]:
                self.log("Node.js installed via NodeSource!", "success")
                setup_script.unlink()  # Clean up
                return True
                
        except Exception as e:
            self.log(f"NodeSource installation failed: {e}", "error")
        
        return False
    
    def ensure_nodejs(self) -> bool:
        """Ensure Node.js is installed and working"""
        self.log("Checking Node.js installation...", "progress")
        
        # Check if Node.js is already installed
        node_cmd = self.find_executable(["node", "nodejs"])
        npm_cmd = self.find_executable(["npm", "npm.cmd"])
        
        if node_cmd and npm_cmd:
            # Verify versions
            node_result = self.run_command([node_cmd, "--version"])
            npm_result = self.run_command([npm_cmd, "--version"])
            
            if node_result["success"] and npm_result["success"]:
                node_version = node_result["stdout"].strip()
                npm_version = npm_result["stdout"].strip()
                self.log(f"Node.js {node_version} and npm {npm_version} found!", "success")
                return True
        
        # Install Node.js
        self.log("Node.js not found. Installing automatically...", "warning")
        
        if self.is_windows:
            return self.install_node_windows()
        else:
            return self.install_node_unix()
    
    def ensure_python_venv(self) -> bool:
        """Ensure Python virtual environment is set up"""
        self.log("Setting up Python virtual environment...", "progress")
        
        venv_dir = self.backend_dir / "venv"
        
        # Create virtual environment if it doesn't exist
        if not venv_dir.exists():
            self.log("Creating virtual environment...", "progress")
            result = self.run_command([
                sys.executable, "-m", "venv", str(venv_dir)
            ], timeout=120)
            
            if not result["success"]:
                self.log("Failed to create virtual environment", "error")
                return False
        
        # Determine activation script
        if self.is_windows:
            activate_script = venv_dir / "Scripts" / "activate.bat"
            python_exe = venv_dir / "Scripts" / "python.exe"
            pip_exe = venv_dir / "Scripts" / "pip.exe"
        else:
            activate_script = venv_dir / "bin" / "activate"
            python_exe = venv_dir / "bin" / "python"
            pip_exe = venv_dir / "bin" / "pip"
        
        if not python_exe.exists():
            self.log("Virtual environment creation failed", "error")
            return False
        
        # Install/upgrade pip
        self.log("Upgrading pip...", "progress")
        result = self.run_command([
            str(python_exe), "-m", "pip", "install", "--upgrade", "pip"
        ], timeout=120)
        
        # Install requirements
        requirements_file = self.backend_dir / "requirements.txt"
        if requirements_file.exists():
            self.log("Installing Python dependencies...", "progress")
            result = self.run_command([
                str(pip_exe), "install", "-r", str(requirements_file)
            ], timeout=300)
            
            if not result["success"]:
                self.log("Failed to install Python dependencies", "error")
                return False
        
        self.log("Python environment ready!", "success")
        return True
    
    def start_backend(self) -> bool:
        """Start the backend server with comprehensive error handling"""
        self.log("Starting backend server...", "progress")
        
        # Ensure Python environment
        if not self.ensure_python_venv():
            return False
        
        # Determine Python executable
        venv_dir = self.backend_dir / "venv"
        if self.is_windows:
            python_exe = venv_dir / "Scripts" / "python.exe"
        else:
            python_exe = venv_dir / "bin" / "python"
        
        # Start backend
        try:
            env = os.environ.copy()
            env["PYTHONPATH"] = str(self.backend_dir)
            
            self.backend_process = subprocess.Popen(
                [str(python_exe), "main.py"],
                cwd=str(self.backend_dir),
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait for backend to start
            self.log("Waiting for backend to start...", "progress")
            for i in range(60):  # 60 seconds timeout
                if self.check_port(self.backend_port):
                    self.log(f"Backend started on port {self.backend_port}!", "success")
                    return True
                time.sleep(1)
            
            self.log("Backend failed to start within timeout", "error")
            return False
            
        except Exception as e:
            self.log(f"Failed to start backend: {e}", "error")
            return False
    
    def start_frontend(self) -> bool:
        """Start the frontend server with bulletproof error handling"""
        self.log("Starting frontend server...", "progress")
        
        # Find npm executable
        npm_cmd = self.find_executable(["npm", "npm.cmd"])
        if not npm_cmd:
            self.log("npm not found after Node.js installation", "error")
            return False
        
        # Install dependencies if needed
        node_modules = self.frontend_dir / "node_modules"
        if not node_modules.exists():
            self.log("Installing frontend dependencies...", "progress")
            
            result = self.run_command([
                npm_cmd, "install"
            ], cwd=self.frontend_dir, timeout=300)
            
            if not result["success"]:
                self.log(f"npm install failed: {result.get('stderr', 'Unknown error')}", "error")
                return False
        
        # Start frontend
        try:
            env = os.environ.copy()
            env["PORT"] = str(self.frontend_port)
            env["BROWSER"] = "none"
            env["CI"] = "true"
            
            self.frontend_process = subprocess.Popen(
                [npm_cmd, "start"],
                cwd=str(self.frontend_dir),
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait for frontend to start
            self.log("Waiting for frontend to start...", "progress")
            for i in range(90):  # 90 seconds timeout for frontend
                if self.check_port(self.frontend_port):
                    self.log(f"Frontend started on port {self.frontend_port}!", "success")
                    return True
                time.sleep(1)
            
            self.log("Frontend failed to start within timeout", "error")
            return False
            
        except Exception as e:
            self.log(f"Failed to start frontend: {e}", "error")
            return False
    
    def open_browser(self):
        """Open the application in the default browser"""
        url = f"http://localhost:{self.frontend_port}"
        self.log(f"Opening browser: {url}", "info")
        
        try:
            webbrowser.open(url)
        except Exception as e:
            self.log(f"Could not open browser automatically: {e}", "warning")
            self.log(f"Please open manually: {url}", "info")
    
    def cleanup(self):
        """Clean shutdown of all processes"""
        self.log("Shutting down servers...", "warning")
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=5)
            except:
                try:
                    self.backend_process.kill()
                except:
                    pass
        
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=5)
            except:
                try:
                    self.frontend_process.kill()
                except:
                    pass
        
        self.log("Cleanup complete", "success")
    
    def health_check(self) -> bool:
        """Comprehensive health check of the application"""
        self.log("Performing health check...", "progress")
        
        # Check backend
        try:
            import urllib.request
            response = urllib.request.urlopen(f"http://localhost:{self.backend_port}/health", timeout=5)
            if response.getcode() == 200:
                self.log("Backend health check passed", "success")
            else:
                self.log("Backend health check failed", "error")
                return False
        except Exception as e:
            self.log(f"Backend health check failed: {e}", "error")
            return False
        
        # Check frontend
        if self.check_port(self.frontend_port):
            self.log("Frontend health check passed", "success")
        else:
            self.log("Frontend health check failed", "error")
            return False
        
        return True
    
    def run(self):
        """Main execution method with comprehensive error handling"""
        try:
            # Step 1: Ensure Node.js
            if not self.ensure_nodejs():
                self.log("Failed to install Node.js. Please install manually.", "error")
                return False
            
            # Step 2: Start backend
            for attempt in range(self.max_retries):
                self.log(f"Backend startup attempt {attempt + 1}/{self.max_retries}", "progress")
                if self.start_backend():
                    break
                if attempt < self.max_retries - 1:
                    self.log("Retrying backend startup...", "warning")
                    time.sleep(5)
            else:
                self.log("Failed to start backend after all retries", "error")
                return False
            
            # Step 3: Start frontend
            for attempt in range(self.max_retries):
                self.log(f"Frontend startup attempt {attempt + 1}/{self.max_retries}", "progress")
                if self.start_frontend():
                    break
                if attempt < self.max_retries - 1:
                    self.log("Retrying frontend startup...", "warning")
                    time.sleep(5)
            else:
                self.log("Failed to start frontend after all retries", "error")
                return False
            
            # Step 4: Health check
            time.sleep(3)  # Give services time to fully initialize
            if not self.health_check():
                self.log("Health check failed", "error")
                return False
            
            # Step 5: Success!
            self.log("🎉 AUTO-LABELING TOOL STARTED SUCCESSFULLY!", "success")
            self.log(f"🌐 Frontend: http://localhost:{self.frontend_port}", "info")
            self.log(f"🔧 Backend API: http://localhost:{self.backend_port}", "info")
            self.log(f"📚 API Docs: http://localhost:{self.backend_port}/api/docs", "info")
            
            # Open browser
            time.sleep(2)
            self.open_browser()
            
            # Keep running
            self.log("Press Ctrl+C to stop the servers", "info")
            try:
                while True:
                    time.sleep(1)
                    # Check if processes are still running
                    if self.backend_process and self.backend_process.poll() is not None:
                        self.log("Backend process died unexpectedly", "error")
                        break
                    if self.frontend_process and self.frontend_process.poll() is not None:
                        self.log("Frontend process died unexpectedly", "error")
                        break
            except KeyboardInterrupt:
                self.log("Received shutdown signal", "info")
            
            return True
            
        except Exception as e:
            self.log(f"Unexpected error: {e}", "error")
            return False
        finally:
            self.cleanup()

def main():
    """Main entry point"""
    launcher = UniversalLauncher()
    success = launcher.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()