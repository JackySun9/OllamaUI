#!/bin/bash

# Start both services
echo "Starting Ollama WebUI with Image Generation..."

# Check if HF_TOKEN is set
if [ -z "$HF_TOKEN" ]; then
    echo "Warning: HF_TOKEN environment variable not set. Image generation may fail."
    echo "Please set it with: export HF_TOKEN=your_huggingface_token"
fi

# Start image generation service in background
echo "Starting image generation service on port 8001..."
python image_generation_service.py &
IMAGE_PID=$!

# Wait a moment for image service to start
sleep 5

# Start main API service
echo "Starting main API service on port 8000..."
python api.py &
API_PID=$!

# Function to cleanup background processes
cleanup() {
    echo "Shutting down services..."
    kill $IMAGE_PID 2>/dev/null
    kill $API_PID 2>/dev/null
    exit
}

# Trap interrupt signals
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $API_PID
wait $IMAGE_PID 