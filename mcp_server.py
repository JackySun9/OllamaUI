#!/usr/bin/env python3
"""
MCP Server for Ollama WebUI
Provides Model Context Protocol integration for the Ollama WebUI frontend
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional, Union
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import httpx
import ollama

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for MCP
class MCPToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]

class MCPToolResult(BaseModel):
    content: List[Dict[str, Any]]
    isError: Optional[bool] = False

class MCPTool(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]

class MCPResource(BaseModel):
    uri: str
    name: str
    description: Optional[str] = None
    mimeType: Optional[str] = None

class MCPServer(BaseModel):
    name: str
    description: str
    version: str
    tools: List[MCPTool]
    resources: List[MCPResource]
    capabilities: Dict[str, bool]

# Initialize FastAPI app
app = FastAPI(
    title="Ollama WebUI MCP Server",
    description="Model Context Protocol server for Ollama WebUI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
mcp_servers: List[MCPServer] = []
available_tools: List[MCPTool] = []
available_resources: List[MCPResource] = []

# Tool implementations
def get_current_time() -> Dict[str, Any]:
    """Get the current date and time"""
    current_time = datetime.now().isoformat()
    return {
        "content": [{
            "type": "text",
            "text": f"Current time: {current_time}"
        }]
    }

def list_ollama_models() -> Dict[str, Any]:
    """List all available Ollama models"""
    try:
        models = ollama.list()
        model_list = [model['name'] for model in models.get('models', [])]
        return {
            "content": [{
                "type": "text",
                "text": f"Available Ollama models:\n" + "\n".join(f"- {model}" for model in model_list)
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error listing models: {str(e)}"
            }],
            "isError": True
        }

def get_model_info(model_name: str) -> Dict[str, Any]:
    """Get information about a specific Ollama model"""
    try:
        info = ollama.show(model_name)
        return {
            "content": [{
                "type": "text",
                "text": f"Model info for {model_name}:\n{json.dumps(info, indent=2)}"
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error getting model info: {str(e)}"
            }],
            "isError": True
        }

def search_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """Search the web for information (mock implementation)"""
    # This is a mock implementation - in a real scenario, you'd integrate with a search API
    return {
        "content": [{
            "type": "text",
            "text": f"Mock web search results for '{query}':\n"
                   f"1. Example result 1 for {query}\n"
                   f"2. Example result 2 for {query}\n"
                   f"3. Example result 3 for {query}\n"
                   f"(This is a mock implementation - integrate with real search API)"
        }]
    }

def calculate(expression: str) -> Dict[str, Any]:
    """Safely evaluate mathematical expressions"""
    try:
        # Only allow safe mathematical operations
        allowed_chars = set('0123456789+-*/.() ')
        if not all(c in allowed_chars for c in expression):
            raise ValueError("Invalid characters in expression")
        
        result = eval(expression)
        return {
            "content": [{
                "type": "text",
                "text": f"{expression} = {result}"
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error calculating '{expression}': {str(e)}"
            }],
            "isError": True
        }

def generate_text_with_ollama(
    prompt: str, 
    model: str = "llama2", 
    max_tokens: int = 100
) -> Dict[str, Any]:
    """Generate text using Ollama"""
    try:
        response = ollama.generate(
            model=model,
            prompt=prompt,
            options={
                "num_predict": max_tokens
            }
        )
        return {
            "content": [{
                "type": "text",
                "text": response['response']
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error generating text: {str(e)}"
            }],
            "isError": True
        }

# Tool registry
TOOL_REGISTRY = {
    "get_current_time": get_current_time,
    "list_ollama_models": list_ollama_models,
    "get_model_info": get_model_info,
    "search_web": search_web,
    "calculate": calculate,
    "generate_text_with_ollama": generate_text_with_ollama,
}

# Initialize built-in tools and resources
def initialize_builtin_tools():
    """Initialize built-in MCP tools and resources"""
    global available_tools, available_resources, mcp_servers
    
    # Define built-in tools
    builtin_tools = [
        MCPTool(
            name="get_current_time",
            description="Get the current date and time",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        MCPTool(
            name="list_ollama_models",
            description="List all available Ollama models",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        MCPTool(
            name="get_model_info",
            description="Get information about a specific Ollama model",
            inputSchema={
                "type": "object",
                "properties": {
                    "model_name": {
                        "type": "string",
                        "description": "Name of the Ollama model"
                    }
                },
                "required": ["model_name"]
            }
        ),
        MCPTool(
            name="search_web",
            description="Search the web for information",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        MCPTool(
            name="calculate",
            description="Safely evaluate mathematical expressions",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate"
                    }
                },
                "required": ["expression"]
            }
        ),
        MCPTool(
            name="generate_text_with_ollama",
            description="Generate text using Ollama",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Text prompt for generation"
                    },
                    "model": {
                        "type": "string",
                        "description": "Ollama model to use",
                        "default": "llama2"
                    },
                    "max_tokens": {
                        "type": "integer",
                        "description": "Maximum number of tokens to generate",
                        "default": 100
                    }
                },
                "required": ["prompt"]
            }
        )
    ]
    
    # Define built-in resources
    builtin_resources = [
        MCPResource(
            uri="ollama://models",
            name="Ollama Models",
            description="List of available Ollama models",
            mimeType="application/json"
        ),
        MCPResource(
            uri="system://time",
            name="System Time",
            description="Current system time",
            mimeType="text/plain"
        )
    ]
    
    # Create built-in server
    builtin_server = MCPServer(
        name="Ollama WebUI Built-in",
        description="Built-in MCP tools for Ollama WebUI",
        version="1.0.0",
        tools=builtin_tools,
        resources=builtin_resources,
        capabilities={
            "tools": True,
            "resources": True,
            "prompts": False,
            "logging": True
        }
    )
    
    available_tools.extend(builtin_tools)
    available_resources.extend(builtin_resources)
    mcp_servers.append(builtin_server)

# API Routes
@app.get("/api/mcp/status")
async def get_mcp_status():
    """Get MCP server status"""
    return {
        "connected": True,
        "servers": len(mcp_servers),
        "tools": len(available_tools),
        "resources": len(available_resources)
    }

@app.get("/api/mcp/servers")
async def get_mcp_servers():
    """Get list of MCP servers"""
    return mcp_servers

@app.get("/api/mcp/tools")
async def get_mcp_tools():
    """Get list of available MCP tools"""
    return available_tools

@app.get("/api/mcp/resources")
async def get_mcp_resources(uri: Optional[str] = None):
    """Get MCP resources or specific resource content"""
    if uri:
        # Return specific resource content
        if uri == "ollama://models":
            try:
                models = ollama.list()
                return {
                    "content": [{
                        "type": "text",
                        "text": json.dumps(models, indent=2)
                    }]
                }
            except Exception as e:
                return {
                    "content": [{
                        "type": "text",
                        "text": f"Error fetching models: {str(e)}"
                    }],
                    "isError": True
                }
        elif uri == "system://time":
            return {
                "content": [{
                    "type": "text",
                    "text": datetime.now().isoformat()
                }]
            }
        else:
            raise HTTPException(status_code=404, detail="Resource not found")
    else:
        # Return list of resources
        return available_resources

@app.post("/api/mcp/tools/call")
async def call_mcp_tool(tool_call: MCPToolCall):
    """Call an MCP tool"""
    try:
        # Find the tool
        tool = next((t for t in available_tools if t.name == tool_call.name), None)
        if not tool:
            raise HTTPException(status_code=404, detail=f"Tool '{tool_call.name}' not found")
        
        # Get the function from registry
        if tool_call.name in TOOL_REGISTRY:
            func = TOOL_REGISTRY[tool_call.name]
            result = func(**tool_call.arguments)
            return result
        else:
            raise HTTPException(status_code=500, detail=f"Tool '{tool_call.name}' not implemented")
            
    except Exception as e:
        logger.error(f"Error calling tool {tool_call.name}: {str(e)}")
        return {
            "content": [{
                "type": "text",
                "text": f"Error calling tool: {str(e)}"
            }],
            "isError": True
        }

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    """Initialize MCP server on startup"""
    logger.info("Starting Ollama WebUI MCP Server...")
    initialize_builtin_tools()
    logger.info(f"Initialized with {len(available_tools)} tools and {len(available_resources)} resources")

if __name__ == "__main__":
    uvicorn.run(
        "mcp_server:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    ) 