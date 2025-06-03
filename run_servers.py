#!/usr/bin/env python3
"""
Simple script to run both backend and frontend servers
"""

import subprocess
import time
import signal
import sys
import os
from pathlib import Path

def run_servers():
    backend_process = None
    frontend_process = None
    
    try:
        # Start backend
        print("🚀 Starting Backend Server on port 12000...")
        backend_dir = Path(__file__).parent / "backend"
        backend_process = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd=str(backend_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit for backend to start
        time.sleep(3)
        
        # Start frontend
        print("🚀 Starting Frontend Server on port 12001...")
        frontend_dir = Path(__file__).parent / "frontend"
        
        # Set environment variables for frontend
        env = os.environ.copy()
        env["PORT"] = "12001"
        env["HOST"] = "0.0.0.0"
        env["BROWSER"] = "none"
        
        frontend_process = subprocess.Popen(
            ["npm", "start"],
            cwd=str(frontend_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        print("✅ Both servers started!")
        print("📱 Frontend: https://work-2-tyejprfqppjumbxd.prod-runtime.all-hands.dev")
        print("🔧 Backend API: https://work-1-tyejprfqppjumbxd.prod-runtime.all-hands.dev")
        print("📚 API Docs: https://work-1-tyejprfqppjumbxd.prod-runtime.all-hands.dev/api/docs")
        print("\nPress Ctrl+C to stop both servers...")
        
        # Wait for processes
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend process died")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend process died")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Clean up processes
        if backend_process:
            backend_process.terminate()
            try:
                backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_process.kill()
        
        if frontend_process:
            frontend_process.terminate()
            try:
                frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                frontend_process.kill()
        
        print("✅ Servers stopped")

if __name__ == "__main__":
    run_servers()