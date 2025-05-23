# Ollama Integration Guide

This guide explains how to use the enhanced Ollama integration with real-time model loading and refresh capabilities.

## ✅ What's New

The Ollama integration now includes:

- **Real-time model refresh**: Always gets the latest list of models from your local Ollama installation
- **Force refresh capability**: Cache-busting refresh button to ensure fresh data
- **Better error handling**: Specific error messages for Ollama connection issues
- **Connection status checking**: API endpoint to verify Ollama is running
- **Enhanced logging**: Detailed console output for debugging

## 🚀 Setup Instructions

### 1. Install Ollama

First, install Ollama on your system:
- Visit [https://ollama.ai](https://ollama.ai)
- Download and install for your operating system

### 2. Start Ollama Service

```bash
# Start Ollama service (required for the integration to work)
ollama serve
```

### 3. Install Some Models

```bash
# Install popular models (choose based on your system capabilities)
ollama pull llama3          # ~4.7GB - Good general purpose model
ollama pull llama3:70b      # ~40GB - More capable but larger
ollama pull mistral         # ~4.1GB - Fast and efficient
ollama pull gemma          # ~5.0GB - Google's Gemma model
ollama pull phi3           # ~2.3GB - Microsoft's compact model

# List all available models
ollama list
```

### 4. Install Python Dependencies

Make sure you have the required Python packages:

```bash
pip install ollama fastapi uvicorn
```

## 🧪 Testing Your Setup

Run the included test script to verify everything is working:

```bash
python test_ollama_connection.py
```

This will check:
- ✅ Ollama package is installed
- ✅ Ollama service is running
- ✅ Models are available
- ✅ API endpoints are working

## 🔧 Using the Enhanced Features

### Real-time Model Refresh

1. **Automatic Detection**: When you select "Ollama" as your provider, the app automatically fetches the latest model list
2. **Manual Refresh**: Click the "Refresh" button to force-reload models from Ollama
3. **Cache Busting**: The refresh always bypasses any caching to ensure fresh data

### Fresh Model Loading

The system now:
- Calls `ollama list` directly to get the most current models
- Sorts and deduplicates the model list
- Provides detailed logging for troubleshooting
- Shows specific error messages if Ollama is not running

### Enhanced Error Messages

You'll see helpful messages like:
- "Ollama service is not running. Please start Ollama and try again."
- "No Ollama models found. Install models with 'ollama pull <model-name>'."
- "Failed to connect to Ollama. Please ensure Ollama is running."

## 🐛 Troubleshooting

### "No models found" or "Connection failed"

1. **Check if Ollama is running**:
   ```bash
   # Check if Ollama process is running
   ps aux | grep ollama
   
   # Or try to list models directly
   ollama list
   ```

2. **Restart Ollama service**:
   ```bash
   # Stop Ollama (if running)
   pkill ollama
   
   # Start Ollama service
   ollama serve
   ```

3. **Install at least one model**:
   ```bash
   ollama pull llama3
   ```

### API Connection Issues

1. **Check API server is running**:
   ```bash
   python api.py
   ```

2. **Test API endpoints directly**:
   ```bash
   # Check Ollama status
   curl http://localhost:8000/api/ollama/status
   
   # Get models with force refresh
   curl "http://localhost:8000/api/models/ollama?force_refresh=true"
   ```

### Frontend Not Updating

1. **Hard refresh the browser**: `Ctrl+F5` or `Cmd+Shift+R`
2. **Check browser console**: Look for error messages
3. **Clear browser cache**: The refresh button should bypass cache automatically

## 📋 Technical Details

### Backend Changes

- **Enhanced `get_ollama_models()`**: Now includes better error handling and logging
- **Force refresh parameter**: API accepts `force_refresh=true` for cache busting
- **Connection checking**: New `/api/ollama/status` endpoint
- **Better error messages**: Specific HTTP status codes and helpful error text

### Frontend Changes

- **Cache busting**: Refresh button adds timestamp and force_refresh parameters
- **Better UX**: Shows "Fetching from Ollama..." when refreshing
- **Error handling**: Displays specific error messages for different failure modes
- **Logging**: Enhanced console output for debugging

### API Endpoints

- `GET /api/models/ollama` - Get Ollama models
- `GET /api/models/ollama?force_refresh=true` - Force refresh Ollama models
- `GET /api/ollama/status` - Check Ollama connection status

## 💡 Best Practices

1. **Keep Ollama running**: Start `ollama serve` before using the web UI
2. **Use appropriate models**: Choose models that fit your system's memory constraints
3. **Regular updates**: Pull new model versions periodically with `ollama pull <model>`
4. **Monitor resources**: Large models require significant RAM and disk space

## 🔍 Debugging

Enable detailed logging in the browser console to see:
- Model fetch requests and responses
- Cache busting parameters
- Error details and retry attempts
- Success confirmations with model counts

The enhanced integration ensures you always have access to your latest local Ollama models with just a click of the refresh button! 