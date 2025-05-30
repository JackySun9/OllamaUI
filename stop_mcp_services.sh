#!/bin/bash

# Stop MCP Services for Ollama WebUI
# This script stops all MCP-related services

echo "🛑 Stopping Ollama WebUI MCP Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop process by PID
stop_process() {
    local pid=$1
    local name=$2
    
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
        kill "$pid"
        
        # Wait for process to stop
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${RED}Force killing $name...${NC}"
            kill -9 "$pid"
        fi
        
        echo -e "${GREEN}✓ $name stopped${NC}"
    else
        echo -e "${YELLOW}$name is not running${NC}"
    fi
}

# Stop services using PID file if it exists
if [ -f ".service_pids" ]; then
    echo -e "${BLUE}Reading service PIDs...${NC}"
    read IMAGE_PID MCP_PID API_PID FRONTEND_PID < .service_pids
    
    stop_process "$FRONTEND_PID" "Frontend"
    stop_process "$API_PID" "API Server"
    stop_process "$MCP_PID" "MCP Server"
    stop_process "$IMAGE_PID" "Image Generation Service"
    
    rm -f .service_pids
else
    echo -e "${YELLOW}No PID file found, attempting to stop by process name...${NC}"
    
    # Stop by process name
    echo -e "${YELLOW}Stopping Frontend...${NC}"
    pkill -f "next dev" || echo -e "${YELLOW}Frontend not running${NC}"
    
    echo -e "${YELLOW}Stopping API Server...${NC}"
    pkill -f "api.py" || echo -e "${YELLOW}API Server not running${NC}"
    
    echo -e "${YELLOW}Stopping MCP Server...${NC}"
    pkill -f "mcp_server.py" || echo -e "${YELLOW}MCP Server not running${NC}"
    
    echo -e "${YELLOW}Stopping Image Generation Service...${NC}"
    pkill -f "image_generation_service.py" || echo -e "${YELLOW}Image Generation Service not running${NC}"
fi

# Clean up any remaining processes on the ports
echo -e "${BLUE}Cleaning up ports...${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port ($name)...${NC}"
        kill -9 $pid 2>/dev/null || true
    fi
}

kill_port 3000 "Frontend"
kill_port 8000 "API Server"
kill_port 8001 "Image Generation Service"
kill_port 8002 "MCP Server"

# Clean up log files (optional)
if [ "$1" = "--clean-logs" ]; then
    echo -e "${BLUE}Cleaning up log files...${NC}"
    rm -rf logs/
    echo -e "${GREEN}✓ Log files cleaned${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All MCP services have been stopped!${NC}"
echo ""
echo -e "${BLUE}To start services again, run:${NC}"
echo -e "  ./start_mcp_services.sh"
echo ""
echo -e "${YELLOW}To clean up log files next time, run:${NC}"
echo -e "  ./stop_mcp_services.sh --clean-logs" 