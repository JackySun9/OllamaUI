# Ollama WebUI Frontend

A modern web interface for Ollama language models built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Architecture

This project consists of two main parts:

1. **Frontend**: A Next.js application with modern UI components
2. **Backend**: A Python API server using FastAPI that connects to Ollama and other LLM providers

## Features

- 🌟 Modern UI with Next.js, TypeScript, Tailwind CSS, and shadcn/ui
- 🎨 Light and dark mode support
- 🤖 Support for multiple LLM providers (Ollama, OpenAI, OpenRouter, Groq, Anthropic)
- 💬 Chat interface with streaming responses
- 🖼️ Image upload capability for multimodal models
- 🔄 Dynamic model loading from Ollama
- ⚙️ Customizable system prompts and temperature settings
- 🎤 **Voice Input Support** - Speak your messages with real-time transcription
- 🌍 **Multi-language Voice Recognition** - Support for 25+ languages
- 🔒 **Privacy-focused** - Voice processing happens locally in your browser

## Voice Input

### Features
- **Real-time Speech Recognition**: Speak naturally and see your words appear instantly
- **Multi-language Support**: Choose from 25+ languages including English, Spanish, French, German, Chinese, Japanese, and more
- **Browser-based Processing**: No external services required - everything happens locally
- **Visual Feedback**: Clear indicators showing recording status and progress
- **Seamless Integration**: Works alongside text input and image uploads

### Supported Browsers
- ✅ Chrome (recommended)
- ✅ Microsoft Edge  
- ✅ Safari (macOS/iOS)
- ✅ Opera
- ⚠️ Firefox (limited support)

### How to Use
1. Look for the microphone icon (🎤) next to the send button
2. Click it to start recording your voice
3. Speak clearly - your speech will be transcribed in real-time
4. Click again to stop recording
5. Edit the transcribed text if needed and send

For detailed instructions, see [VOICE_INPUT_GUIDE.md](./VOICE_INPUT_GUIDE.md).

## Prerequisites

- Node.js (v18 or newer)
- Python (v3.8 or newer)
- Ollama installed (for local models)
- Microphone access (for voice input feature)

## Installation

### Backend

1. Install the required Python packages:

 It's recommended to use a virtual environment. You can use `uv` or Python's built-in `venv`.

    **Using `uv` (recommended):**
    ```bash
    # Create the virtual environment (e.g., named .venv)
    uv venv
    # Activate the virtual environment
    # On macOS and Linux:
    source .venv/bin/activate
    # On Windows:
    # .venv\Scripts\activate
    
    # Install dependencies
    uv pip install -r requirements.txt
    ```

    **Using `venv`:**
    ```bash
    # Create the virtual environment
    python3 -m venv .venv
    # Activate the virtual environment
    # On macOS and Linux:
    source .venv/bin/activate
    # On Windows:
    # .venv\Scripts\activate
    
    # Install dependencies
    pip install -r requirements.txt
    ```

2. Start the backend server:

```bash
python api.py
```

The backend will run on http://localhost:8000.

### Frontend

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The frontend will run on http://localhost:3000.

## API Keys for External Providers

To use external providers like OpenAI, Anthropic, etc., set your API keys as environment variables:

- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`

## Development Notes

- The backend code is largely adapted from the original Gradio UI.
- The frontend code is designed with component-based architecture using shadcn/ui.
- WebSocket is used for streaming responses for a responsive chat experience.
- Voice input uses the Web Speech API for local, privacy-focused speech recognition.

## Deployment

For production deployment:

1. Build the frontend:

```bash
npm run build
```

2. For the backend, consider using a production ASGI server:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
