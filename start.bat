@echo off
REM Auto-Labeling-Tool Startup Script for Windows
REM Starts both backend and frontend servers

echo 🏷️ Starting Auto-Labeling-Tool...
echo ==================================

REM Create log directory
if not exist logs mkdir logs

echo 1. Starting Backend Server...
cd backend

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing/updating backend dependencies...
pip install -r requirements.txt > ..\logs\backend_install.log 2>&1

REM Start backend server
echo Starting FastAPI backend on port 12000...
start /B python main.py > ..\logs\backend.log 2>&1

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo ✅ Backend started on port 12000

REM Start frontend
cd ..\frontend
echo 2. Starting Frontend Server...

REM Install frontend dependencies if needed
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install > ..\logs\frontend_install.log 2>&1
)

REM Start frontend server
echo Starting React frontend on port 12001...
start /B npm start > ..\logs\frontend.log 2>&1

REM Wait for frontend to start
echo Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo ✅ Frontend started on port 12001

echo.
echo 🎉 Auto-Labeling-Tool is now running!
echo ==================================
echo Backend API:  http://localhost:12000
echo Frontend UI:  http://localhost:12001
echo API Docs:     http://localhost:12000/docs
echo.
echo Logs:
echo   Backend:  logs\backend.log
echo   Frontend: logs\frontend.log
echo.
echo Press any key to stop both servers...
pause > nul

REM Kill processes (basic cleanup)
taskkill /F /IM python.exe /T > nul 2>&1
taskkill /F /IM node.exe /T > nul 2>&1

echo Servers stopped.
pause