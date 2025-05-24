#!/usr/bin/env python3
"""
Startup script to run both the main API and image generation services
"""
import subprocess
import sys
import time
import os
import signal
import platform

def main():
    print("Starting Ollama WebUI with Image Generation...")
    
    # Check if HF_TOKEN is set
    if not os.environ.get('HF_TOKEN'):
        print("Warning: HF_TOKEN environment variable not set. Image generation may fail.")
        print("Please set it with: export HF_TOKEN=your_huggingface_token")
    
    processes = []
    
    try:
        # Start image generation service
        print("Starting image generation service on port 8001...")
        image_process = subprocess.Popen([
            sys.executable, "image_generation_service.py"
        ])
        processes.append(image_process)
        
        # Wait a moment for image service to start
        time.sleep(5)
        
        # Start main API service
        print("Starting main API service on port 8000...")
        api_process = subprocess.Popen([
            sys.executable, "api.py"
        ])
        processes.append(api_process)
        
        print("Both services started successfully!")
        print("Main API: http://localhost:8000")
        print("Image Generation: http://localhost:8001")
        print("Press Ctrl+C to stop all services")
        
        # Wait for processes
        for process in processes:
            process.wait()
            
    except KeyboardInterrupt:
        print("\nShutting down services...")
        
    finally:
        # Cleanup
        for process in processes:
            try:
                if platform.system() == "Windows":
                    process.terminate()
                else:
                    process.send_signal(signal.SIGTERM)
                process.wait(timeout=5)
            except (subprocess.TimeoutExpired, ProcessLookupError):
                try:
                    process.kill()
                except ProcessLookupError:
                    pass

if __name__ == "__main__":
    main() 