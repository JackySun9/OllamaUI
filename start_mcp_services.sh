#!/bin/bash

# Start MCP Services for Ollama WebUI
# This script starts all necessary services for MCP integration

set -e

echo "🚀 Starting Ollama WebUI with MCP Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source .venv/bin/activate

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Install Node.js dependencies
echo -e "${BLUE}Installing Node.js dependencies...${NC}"
npm install

# Check if Ollama is running
echo -e "${BLUE}Checking Ollama service...${NC}"
if ! check_port 11434; then
    echo -e "${YELLOW}Ollama is not running. Please start Ollama first:${NC}"
    echo -e "${YELLOW}  ollama serve${NC}"
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Ollama is running on port 11434${NC}"
fi

# Create log directory
mkdir -p logs

# Start Image Generation Service
echo -e "${BLUE}Starting Image Generation Service...${NC}"
if check_port 8001; then
    echo -e "${YELLOW}Port 8001 is already in use. Stopping existing service...${NC}"
    pkill -f "image_generation_service.py" || true
    sleep 2
fi

python image_generation_service.py > logs/image_service.log 2>&1 &
IMAGE_PID=$!
echo -e "${GREEN}✓ Image Generation Service started (PID: $IMAGE_PID)${NC}"

# Wait for Image Generation Service to be ready
wait_for_service "http://localhost:8001/health" "Image Generation Service"

# Start MCP Server
echo -e "${BLUE}Starting MCP Server...${NC}"
if check_port 8002; then
    echo -e "${YELLOW}Port 8002 is already in use. Stopping existing service...${NC}"
    pkill -f "mcp_server.py" || true
    sleep 2
fi

python mcp_server.py > logs/mcp_server.log 2>&1 &
MCP_PID=$!
echo -e "${GREEN}✓ MCP Server started (PID: $MCP_PID)${NC}"

# Wait for MCP Server to be ready
wait_for_service "http://localhost:8002/api/mcp/status" "MCP Server"

# Start Main API Server
echo -e "${BLUE}Starting Main API Server...${NC}"
if check_port 8000; then
    echo -e "${YELLOW}Port 8000 is already in use. Stopping existing service...${NC}"
    pkill -f "api.py" || true
    sleep 2
fi

python api.py > logs/api_server.log 2>&1 &
API_PID=$!
echo -e "${GREEN}✓ Main API Server started (PID: $API_PID)${NC}"

# Wait for API Server to be ready
wait_for_service "http://localhost:8000/docs" "Main API Server"

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}"
if check_port 3000; then
    echo -e "${YELLOW}Port 3000 is already in use. Stopping existing service...${NC}"
    pkill -f "next dev" || true
    sleep 2
fi

npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for Frontend to be ready
wait_for_service "http://localhost:3000" "Frontend"

# Create PID file for easy cleanup
echo "$IMAGE_PID $MCP_PID $API_PID $FRONTEND_PID" > .service_pids

echo ""
echo -e "${GREEN}🎉 All services are running successfully!${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  🎨 Image Generation: http://localhost:8001"
echo -e "  📊 MCP Server:       http://localhost:8002"
echo -e "  🔧 API Server:       http://localhost:8000"
echo -e "  🌐 Frontend:         http://localhost:3000"
echo -e "  📚 API Docs:         http://localhost:8000/docs"
echo -e "  🔍 MCP Status:       http://localhost:8002/api/mcp/status"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  📝 Image Service:  tail -f logs/image_service.log"
echo -e "  📝 MCP Server:     tail -f logs/mcp_server.log"
echo -e "  📝 API Server:     tail -f logs/api_server.log"
echo -e "  📝 Frontend:       tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo -e "  ./stop_mcp_services.sh"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

# Keep script running to show logs
echo -e "${BLUE}Press Ctrl+C to stop all services...${NC}"
trap 'echo -e "\n${YELLOW}Stopping all services...${NC}"; ./stop_mcp_services.sh; exit 0' INT

# Show combined logs
tail -f logs/image_service.log logs/mcp_server.log logs/api_server.log logs/frontend.log 