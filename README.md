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

## Prerequisites

- Node.js (v18 or newer)
- Python (v3.8 or newer)
- Ollama installed (for local models)

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
python server.py
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

## Deployment

For production deployment:

1. Build the frontend:

```bash
npm run build
```

2. For the backend, consider using a production ASGI server:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
