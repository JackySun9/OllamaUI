# api.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any, Union
import uvicorn
from pydantic import BaseModel
import logging
import base64
import io
from PIL import Image
import json
import re
import asyncio

# Import existing Ollama functionality
try:
    import ollama
except ImportError:
    raise ImportError("Please install ollama package with: pip install ollama")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(title="Ollama WebUI API")

# Configure CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Your Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Provider and Model Definitions ---
# This is from the original app.py
PREDEFINED_PROVIDERS = {
    "ollama": {
        "fetch_func": lambda: get_ollama_models(),
        "prefix": "ollama/", # LiteLLM generally expects ollama/model_name
        "dynamic_fetch": True,
        "fallback_models": [
            "devstral:24b", "llama3.3:70b", "llama3.2:latest", "qwen3:32b", 
            "qwq:32b", "gemma3:27b", "deepseek-r1:14b", "qwen2.5vl:32b"
        ]
    },
    "openrouter": {
        "models": [
            "openai/gpt-4o",
            "google/gemini-pro-1.5",
            "mistralai/mistral-large-latest",
            "anthropic/claude-3-opus",
            "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
            "meta-llama/llama-3-70b-instruct",
            "fireworks/firefunction-v1" # Example with a different structure
        ],
        "prefix": "openrouter/", # LiteLLM expects this full prefix
        "dynamic_fetch": False
    },
    "openai": {
        "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o"],
        "prefix": "", # LiteLLM recognizes these directly
        "dynamic_fetch": False
    },
    "groq": {
        "models": ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma-7b-it"],
        "prefix": "groq/",
        "dynamic_fetch": False
    },
    "anthropic": {
        "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-2.1"],
        "prefix": "", # LiteLLM recognizes these directly
        "dynamic_fetch": False
    }
}

# Models that should display their thinking process
THINKING_MODELS = [
    "deepseek-r1:14b", "deepseek-r1:8b",  # Deepseek models often have thinking tags
    "think",  # Any model with "think" in the name
    "reasoning",  # Any model with "reasoning" in the name
    "cot"  # Chain of thought models
]

# --- Helper Functions ---
def get_ollama_models():
    try:
        models_data = ollama.list().get("models", [])
        model_names = []
        
        for m in models_data:
            # Handle different Ollama API response structures
            # Some versions use 'name', others might use 'model' or store it directly
            if isinstance(m, dict):
                if "name" in m:
                    model_names.append(m["name"])
                elif "model" in m:
                    model_names.append(m["model"])
                elif hasattr(m, "name") and m.name:
                    model_names.append(m.name)
                elif hasattr(m, "model") and m.model:
                    model_names.append(m.model)
        
        if not model_names:
            # If we still couldn't find models, try alternative API formats
            try:
                # Try direct model list (might be used in newer Ollama versions)
                all_models = ollama.list()
                if isinstance(all_models, list):
                    for m in all_models:
                        if isinstance(m, str):
                            model_names.append(m)
                        elif isinstance(m, dict) and "name" in m:
                            model_names.append(m["name"])
                        elif isinstance(m, dict) and "model" in m:
                            model_names.append(m["model"])
            except Exception as alt_e:
                logging.warning(f"Alternative Ollama model fetch failed: {alt_e}")
                
        logging.info(f"Successfully fetched Ollama models: {model_names}")
        return model_names
    except Exception as e:
        logging.error(f"Error fetching Ollama models: {e}", exc_info=True)
        return []

def get_models_for_provider(provider_name):
    if provider_name not in PREDEFINED_PROVIDERS:
        return []
    
    provider_info = PREDEFINED_PROVIDERS[provider_name]
    raw_models = []
    used_fallback = False

    if provider_info.get("dynamic_fetch", False):
        fetched_models = provider_info["fetch_func"]()
        if fetched_models:
            raw_models = fetched_models
        elif "fallback_models" in provider_info:
            logging.warning(f"Dynamic fetch for {provider_name} failed or returned no models. Using predefined fallback models for this provider.")
            raw_models = provider_info["fallback_models"]
            used_fallback = True
        else:
            logging.warning(f"Dynamic fetch for {provider_name} failed and no fallback models defined for this provider.")
            raw_models = []
    else:
        raw_models = provider_info.get("models", [])
    
    return raw_models

def image_to_base64(pil_image, format="JPEG"):
    if pil_image is None: return None
    buffered = io.BytesIO()
    pil_image.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def clean_model_response(text, model_name=None):
    """
    Remove or preserve thinking tags and other content from model responses
    depending on the model type.
    
    Args:
        text: The text to clean
        model_name: Name of the model, to check if it's a thinking model
    
    Returns:
        Cleaned text with thinking tags preserved or removed as appropriate
    """
    if not text:
        return ""
    
    # Check if this is a "thinking model" that should display its reasoning
    is_thinking_model = False
    if model_name:
        # Extract base model name from fully qualified name (e.g., "ollama/deepseek-r1:14b" -> "deepseek-r1:14b")
        base_model = model_name.split('/')[-1] if '/' in model_name else model_name
        
        # Check if this model is in our thinking models list or contains keywords
        is_thinking_model = any(thinking_model in base_model.lower() 
                               for thinking_model in THINKING_MODELS) or \
                           any(keyword in base_model.lower() 
                               for keyword in ["think", "reasoning", "cot"])
    
    if is_thinking_model:
        # For thinking models, preserve the tags but format them nicely
        cleaned = text
        
        # Optional: Format <think> sections to look better
        cleaned = re.sub(r'<think>', '\n\n💭 *Thinking:*\n', cleaned)
        cleaned = re.sub(r'</think>', '\n\n', cleaned)
        
        # Format other tags but preserve content
        cleaned = re.sub(r'<reasoning>', '\n\n💡 *Reasoning:*\n', cleaned)
        cleaned = re.sub(r'</reasoning>', '\n\n', cleaned)
        cleaned = re.sub(r'<answer>', '\n\n✅ *Answer:*\n', cleaned)
        cleaned = re.sub(r'</answer>', '', cleaned)
    else:
        # For regular models, remove thinking sections entirely
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        cleaned = re.sub(r'<answer>|</answer>', '', cleaned)
        cleaned = re.sub(r'<reasoning>.*?</reasoning>', '', cleaned, flags=re.DOTALL)
    
    # Common cleaning for all models
    # Replace multiple newlines with just two
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    # Trim leading/trailing whitespace
    cleaned = cleaned.strip()
    
    return cleaned

# --- API Data Models ---
class MessageContent(BaseModel):
    type: str  # "text" or "image_url"
    text: Optional[str] = None
    image_url: Optional[Dict[str, str]] = None
    
class Message(BaseModel):
    role: str
    content: Union[str, List[MessageContent], List[Dict[str, Any]]]
    
class ChatRequest(BaseModel):
    model: str
    messages: List[Message]
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    stream: bool = False
    
class ChatResponse(BaseModel):
    message: Message
    model: str

# --- API Endpoints ---
@app.get("/api/providers")
async def get_providers():
    return {"providers": list(PREDEFINED_PROVIDERS.keys())}

@app.get("/api/models/{provider}")
async def get_provider_models(provider: str):
    models = get_models_for_provider(provider)
    if not models:
        raise HTTPException(status_code=404, detail=f"No models found for provider {provider}")
    return {"models": models}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        from litellm import completion
        
        # Process the request using LiteLLM
        response = completion(
            model=request.model,
            messages=[{
                "role": msg.role,
                "content": msg.content
            } for msg in request.messages],
            temperature=request.temperature,
            stream=False
        )
        
        # Extract the response content
        response_content = ""
        if hasattr(response, 'choices') and response.choices:
            if hasattr(response.choices[0], 'message'):
                response_content = response.choices[0].message.content
            elif hasattr(response.choices[0], 'text'):
                response_content = response.choices[0].text
        elif hasattr(response, 'content'):
            response_content = response.content
        elif hasattr(response, 'text'):
            response_content = response.text
        
        # Clean response
        cleaned_response = clean_model_response(response_content, request.model)
        
        return {
            "message": {
                "role": "assistant",
                "content": cleaned_response
            },
            "model": request.model
        }
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/api/chat/stream")
async def chat_stream(websocket: WebSocket):
    try:
        await websocket.accept()
        
        # Receive the initial chat request
        data = await websocket.receive_text()
        request_data = json.loads(data)
        
        try:
            chat_request = ChatRequest(**request_data)
        except Exception as validation_error:
            await websocket.send_json({
                "error": f"Invalid request format: {str(validation_error)}"
            })
            await websocket.close()
            return
        
        # Check if streaming is supported
        if not chat_request.stream:
            await websocket.send_json({
                "error": "Stream parameter must be set to true for websocket API"
            })
            await websocket.close()
            return
            
        try:
            from litellm import completion
            
            # Stream the chat response
            response_stream = completion(
                model=chat_request.model,
                messages=[{
                    "role": msg.role,
                    "content": msg.content
                } for msg in chat_request.messages],
                temperature=chat_request.temperature,
                stream=True
            )
            
            full_response = ""
            
            for chunk in response_stream:
                delta = None
                
                # Handle different response formats
                if hasattr(chunk, 'choices') and chunk.choices:
                    if hasattr(chunk.choices[0], 'delta'):
                        if hasattr(chunk.choices[0].delta, 'content'):
                            delta = chunk.choices[0].delta.content
                        elif hasattr(chunk.choices[0].delta, 'text'):
                            delta = chunk.choices[0].delta.text
                    elif hasattr(chunk.choices[0], 'text'):
                        delta = chunk.choices[0].text
                    elif hasattr(chunk.choices[0], 'message') and hasattr(chunk.choices[0].message, 'content'):
                        delta = chunk.choices[0].message.content
                        
                if delta:
                    full_response += delta
                    cleaned_response = clean_model_response(full_response, chat_request.model)
                    
                    await websocket.send_json({
                        "chunk": delta,
                        "full_response": cleaned_response
                    })
                
                # Small delay to not overwhelm the client
                await asyncio.sleep(0.01)
                
            # Send final message
            await websocket.send_json({
                "done": True,
                "message": {
                    "role": "assistant",
                    "content": clean_model_response(full_response, chat_request.model)
                },
                "model": chat_request.model
            })
                
        except Exception as e:
            logging.error(f"Streaming error: {str(e)}", exc_info=True)
            await websocket.send_json({"error": str(e)})
    
    except WebSocketDisconnect:
        logging.info("WebSocket disconnected")
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)