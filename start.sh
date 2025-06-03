#!/bin/bash

# Auto-Labeling-Tool Startup Script
# Starts both backend and frontend servers

echo "🏷️ Starting Auto-Labeling-Tool..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing existing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Check and kill existing processes
if check_port 12000; then
    echo -e "${YELLOW}Backend port 12000 is in use${NC}"
    kill_port 12000
fi

if check_port 12001; then
    echo -e "${YELLOW}Frontend port 12001 is in use${NC}"
    kill_port 12001
fi

# Create log directory
mkdir -p logs

echo -e "${BLUE}1. Starting Backend Server...${NC}"
cd backend

# Install backend dependencies if needed
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || {
    echo -e "${YELLOW}Virtual environment not found, using system Python...${NC}"
}

# Install dependencies
echo -e "${YELLOW}Installing/updating backend dependencies...${NC}"
pip install -r requirements.txt > ../logs/backend_install.log 2>&1

# Start backend server
echo -e "${GREEN}Starting FastAPI backend on port 12000...${NC}"
python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if check_port 12000; then
    echo -e "${GREEN}✅ Backend started successfully on port 12000${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# Start frontend
cd ../frontend
echo -e "${BLUE}2. Starting Frontend Server...${NC}"

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install > ../logs/frontend_install.log 2>&1
fi

# Start frontend server
echo -e "${GREEN}Starting React frontend on port 12001...${NC}"
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
sleep 10

# Check if frontend is running
if check_port 12001; then
    echo -e "${GREEN}✅ Frontend started successfully on port 12001${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Auto-Labeling-Tool is now running!${NC}"
echo "=================================="
echo -e "${BLUE}Backend API:${NC}  http://localhost:12000"
echo -e "${BLUE}Frontend UI:${NC}  http://localhost:12001"
echo -e "${BLUE}API Docs:${NC}     http://localhost:12000/docs"
echo ""
echo -e "${YELLOW}Backend PID:${NC}  $BACKEND_PID"
echo -e "${YELLOW}Frontend PID:${NC} $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  Backend:  logs/backend.log"
echo "  Frontend: logs/frontend.log"
echo ""
echo -e "${RED}Press Ctrl+C to stop both servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Keep script running
wait