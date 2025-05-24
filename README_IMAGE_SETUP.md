# Ollama WebUI with Image Generation

This setup integrates Stable Diffusion 3.5 image generation with your existing Ollama-based chat API.

## Architecture

- **Main API Service** (Port 8000): Handles text chat via Ollama + image generation requests
- **Image Generation Service** (Port 8001): Stable Diffusion 3.5 via LitServe
- **Frontend**: Your existing Next.js frontend

## Setup Instructions

### 1. Install Dependencies

For the main API service:
```bash
uv pip install -r requirements.txt
```

For the image generation service:
```bash
uv pip install -r requirements_image.txt
```

### 2. Get Hugging Face Token

1. Go to [Hugging Face](https://huggingface.co/) and create an account
2. Go to Settings → Access Tokens
3. Create a new token with `read` permissions
4. Set the environment variable:

```bash
export HF_TOKEN=your_token_here
```

### 3. Make sure Ollama is running

```bash
ollama serve
```

### 4. Start Services

Option A - Using the Python script (recommended):
```bash
python start_services.py
```

Option B - Using the shell script (Linux/Mac):
```bash
./start_services.sh
```

Option C - Manual start:
```bash
# Terminal 1: Start image generation service
python image_generation_service.py

# Terminal 2: Start main API service  
python api.py
```

## API Endpoints

### Existing Endpoints
- `GET /api/providers` - List available providers
- `POST /api/chat` - Text chat with Ollama models
- `WebSocket /api/chat/stream` - Streaming chat
- `POST /api/rag/upload` - Upload documents for RAG
- `POST /api/rag/query` - Query with RAG context

### New Image Generation Endpoints
- `GET /api/image/status` - Check if image service is available
- `POST /api/image/generate` - Generate images

### Image Generation Request Format
```json
{
  "prompt": "A beautiful sunset over mountains",
  "negative_prompt": "low quality, bad anatomy, worst quality",
  "num_inference_steps": 8,
  "guidance_scale": 1.5
}
```

### Example Usage

```bash
# Check image service status
curl http://localhost:8000/api/image/status

# Generate an image
curl -X POST http://localhost:8000/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A futuristic city with flying cars"}' \
  --output generated_image.png
```

## Frontend Integration

### Chat Interface Integration (Automatic)

Image generation is now integrated directly into your chat interface! Users can generate images using simple commands:

**Available Commands:**
- `/imagine [description]` - Generate an image
- `/generate [description]` - Generate an image  
- `/image [description]` - Generate an image
- `/draw [description]` - Generate an image
- `/create-image [description]` - Generate an image
- `/pic [description]` - Generate an image

**Usage Examples:**
```
/imagine a beautiful sunset over mountains
/generate a futuristic city with flying cars
/image a cute cat wearing a hat
```

**Features:**
- 🎨 Click the palette button to add `/imagine ` to your message
- 🖼️ Generated images appear directly in the chat
- ⚡ Real-time generation status updates
- 💬 Text conversations are saved in chat history
- 🔄 Works with both streaming and non-streaming chat
- ⚠️ Generated images are not persisted in chat history due to storage size limitations

### Direct API Integration

You can also call the image generation endpoint directly:

```javascript
// Generate image via API
const generateImage = async (prompt) => {
  const response = await fetch('/api/image/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      negative_prompt: "low quality, bad anatomy",
      num_inference_steps: 8,
      guidance_scale: 1.5
    })
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  }
  throw new Error('Image generation failed');
};
```

## Troubleshooting

### Image Service Not Available
- Check if port 8001 is free
- Ensure HF_TOKEN is set correctly
- Check image generation service logs
- Verify GPU/MPS availability for faster generation

### Memory Issues
- Image generation requires significant RAM/VRAM
- Consider reducing `num_inference_steps` for faster generation
- Use CPU if GPU memory is insufficient

### Model Loading Issues
- Ensure stable internet connection for model download
- Check Hugging Face token permissions
- Models are cached after first download

### Storage Issues
- **Generated images are not saved in chat history** due to localStorage size limits
- Chat text is preserved, but images only appear during the current session
- If you get storage quota errors, old conversations are automatically cleaned up
- Consider using the direct API endpoint if you need to save images permanently

## Performance Notes

- First image generation takes longer (model loading)
- Subsequent generations are faster
- GPU (CUDA/MPS) recommended for acceptable performance
- CPU generation is very slow but functional 