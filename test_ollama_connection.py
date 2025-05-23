#!/usr/bin/env python3
"""
Test script to verify Ollama connectivity and model fetching.
Run this to check if your Ollama setup is working correctly.
"""

import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_ollama_import():
    """Test if ollama package is available."""
    try:
        import ollama
        logging.info("✅ Ollama package imported successfully")
        return True
    except ImportError as e:
        logging.error(f"❌ Failed to import ollama package: {e}")
        logging.error("Please install ollama with: pip install ollama")
        return False

def test_ollama_connection():
    """Test if Ollama service is running."""
    try:
        import ollama
        response = ollama.list()
        logging.info("✅ Ollama service is running and accessible")
        return True, response
    except Exception as e:
        logging.error(f"❌ Failed to connect to Ollama service: {e}")
        logging.error("Please make sure Ollama is running. Start it with: ollama serve")
        return False, None

def test_ollama_models():
    """Test fetching Ollama models."""
    try:
        import ollama
        response = ollama.list()
        models = response.get("models", []) if isinstance(response, dict) else []
        
        if models:
            model_names = []
            for model in models:
                if isinstance(model, dict) and "name" in model:
                    model_names.append(model["name"])
                elif isinstance(model, dict) and "model" in model:
                    model_names.append(model["model"])
            
            logging.info(f"✅ Found {len(model_names)} Ollama models:")
            for model in model_names:
                logging.info(f"   - {model}")
            return True, model_names
        else:
            logging.warning("⚠️  No Ollama models found")
            logging.info("To install a model, run: ollama pull llama3")
            return True, []
            
    except Exception as e:
        logging.error(f"❌ Failed to fetch Ollama models: {e}")
        return False, []

def test_api_endpoint():
    """Test the API endpoint."""
    try:
        import requests
        import time
        
        # Test the status endpoint
        status_response = requests.get("http://localhost:8000/api/ollama/status")
        if status_response.status_code == 200:
            status_data = status_response.json()
            if status_data.get("connected"):
                logging.info("✅ API status endpoint confirms Ollama is connected")
            else:
                logging.warning("⚠️  API status endpoint shows Ollama is not connected")
        
        # Test the models endpoint
        models_response = requests.get("http://localhost:8000/api/models/ollama?force_refresh=true")
        if models_response.status_code == 200:
            models_data = models_response.json()
            models = models_data.get("models", [])
            logging.info(f"✅ API models endpoint returned {len(models)} models")
            return True
        else:
            logging.error(f"❌ API models endpoint failed: {models_response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        logging.warning("⚠️  API server is not running. Start it with: python api.py")
        return False
    except Exception as e:
        logging.error(f"❌ Failed to test API endpoint: {e}")
        return False

def main():
    """Run all tests."""
    logging.info("🚀 Testing Ollama integration...")
    
    all_passed = True
    
    # Test 1: Import
    if not test_ollama_import():
        all_passed = False
        return
    
    # Test 2: Connection
    connected, response = test_ollama_connection()
    if not connected:
        all_passed = False
        logging.info("\n💡 Troubleshooting steps:")
        logging.info("1. Install Ollama from https://ollama.ai")
        logging.info("2. Start Ollama service: ollama serve")
        logging.info("3. Pull a model: ollama pull llama3")
        return
    
    # Test 3: Models
    models_found, models = test_ollama_models()
    if not models_found:
        all_passed = False
    
    # Test 4: API (optional)
    logging.info("\n🌐 Testing API endpoints...")
    api_working = test_api_endpoint()
    if not api_working:
        logging.info("Note: API tests failed, but this is optional if you're only testing Ollama directly")
    
    if all_passed:
        logging.info("\n🎉 All tests passed! Ollama integration is working correctly.")
        if models:
            logging.info(f"You have {len(models)} models available for use.")
    else:
        logging.info("\n❌ Some tests failed. Please fix the issues above.")

if __name__ == "__main__":
    main() 