# MCP (Model Context Protocol) Integration Guide

## Overview

This guide explains how to integrate and use MCP (Model Context Protocol) tools in your Ollama WebUI frontend. MCP is a standardized protocol that allows AI models to interact with external tools and data sources dynamically.

## What is MCP?

Model Context Protocol (MCP) is an open standard developed by Anthropic that:
- Standardizes communication between AI models and external tools
- Enables dynamic tool discovery and execution
- Provides context-aware state management
- Supports secure authentication and access control
- Uses lightweight JSON-RPC for communication

## Architecture

The MCP integration consists of:

1. **Frontend (Next.js/React)**:
   - MCP Context Provider for state management
   - MCP Tools UI component for tool interaction
   - TypeScript types and interfaces

2. **Backend (Python/FastAPI)**:
   - MCP Server with built-in tools
   - API endpoints for tool execution
   - Integration with Ollama models

## Installation & Setup

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
pip install -r requirements.txt
```

### 2. Start the Services

**Start MCP Server:**
```bash
python mcp_server.py
```
This starts the MCP server on `http://localhost:8002`

**Start Main API Server:**
```bash
python api.py
```
This starts the main API on `http://localhost:8000`

**Start Frontend:**
```bash
npm run dev
```
This starts the frontend on `http://localhost:3000`

## Built-in MCP Tools

The integration comes with several built-in tools:

### 1. `get_current_time`
- **Description**: Get the current date and time
- **Parameters**: None
- **Usage**: Useful for time-aware operations

### 2. `list_ollama_models`
- **Description**: List all available Ollama models
- **Parameters**: None
- **Usage**: Discover available models for text generation

### 3. `get_model_info`
- **Description**: Get detailed information about a specific Ollama model
- **Parameters**: 
  - `model_name` (string, required): Name of the Ollama model
- **Usage**: Get model specifications and capabilities

### 4. `search_web`
- **Description**: Search the web for information (mock implementation)
- **Parameters**:
  - `query` (string, required): Search query
  - `max_results` (integer, optional): Maximum number of results (default: 5)
- **Usage**: Web search functionality (extend with real search API)

### 5. `calculate`
- **Description**: Safely evaluate mathematical expressions
- **Parameters**:
  - `expression` (string, required): Mathematical expression to evaluate
- **Usage**: Perform calculations within the chat interface

### 6. `generate_text_with_ollama`
- **Description**: Generate text using Ollama models
- **Parameters**:
  - `prompt` (string, required): Text prompt for generation
  - `model` (string, optional): Ollama model to use (default: "llama2")
  - `max_tokens` (integer, optional): Maximum tokens to generate (default: 100)
- **Usage**: Generate text responses using local Ollama models

## Using MCP Tools in the Frontend

### 1. Add MCP Provider to Your App

Update your main layout or app component:

```tsx
import { MCPProvider } from '@/contexts/MCPContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MCPProvider>
          {children}
        </MCPProvider>
      </body>
    </html>
  );
}
```

### 2. Use MCP Tools Component

Add the MCP tools interface to your chat or main component:

```tsx
import { MCPTools } from '@/components/MCPTools';

export default function ChatPage() {
  const handleToolResult = (result) => {
    console.log('Tool result:', result);
    // Handle tool execution results
  };

  return (
    <div>
      {/* Your existing chat interface */}
      <MCPTools onToolResult={handleToolResult} />
    </div>
  );
}
```

### 3. Use MCP Hooks

Access MCP functionality in your components:

```tsx
import { useMCP, useToolCall, useToolAvailable } from '@/contexts/MCPContext';

function MyComponent() {
  const { availableTools, isConnected } = useMCP();
  const callTool = useToolCall();
  const hasCalculator = useToolAvailable('calculate');

  const handleCalculation = async () => {
    const result = await callTool({
      name: 'calculate',
      arguments: { expression: '2 + 2' }
    });
    console.log(result);
  };

  return (
    <div>
      <p>MCP Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Available Tools: {availableTools.length}</p>
      {hasCalculator && (
        <button onClick={handleCalculation}>
          Calculate 2 + 2
        </button>
      )}
    </div>
  );
}
```

## Creating Custom MCP Tools

### 1. Add Tool to Backend

Add a new tool function to `mcp_server.py`:

```python
@mcp.tool()
def my_custom_tool(param1: str, param2: int = 10) -> Dict[str, Any]:
    """Description of what this tool does"""
    try:
        # Your tool logic here
        result = f"Processed {param1} with value {param2}"
        return {
            "content": [{
                "type": "text",
                "text": result
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error: {str(e)}"
            }],
            "isError": True
        }
```

### 2. Register Tool Schema

Add the tool schema to the `initialize_builtin_tools()` function:

```python
MCPTool(
    name="my_custom_tool",
    description="Description of what this tool does",
    inputSchema={
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "description": "Description of param1"
            },
            "param2": {
                "type": "integer",
                "description": "Description of param2",
                "default": 10
            }
        },
        "required": ["param1"]
    }
)
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# MCP Configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8002
MCP_DEBUG=true

# Ollama Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434

# API Configuration
API_HOST=localhost
API_PORT=8000
```

### MCP Server Configuration

The MCP server can be configured in `mcp_server.py`:

```python
# Server configuration
MCP_CONFIG = {
    "name": "Ollama WebUI MCP",
    "description": "MCP server for Ollama WebUI",
    "version": "1.0.0",
    "capabilities": {
        "tools": True,
        "resources": True,
        "prompts": False,
        "logging": True
    }
}
```

## API Endpoints

The MCP integration provides these API endpoints:

- `GET /api/mcp/status` - Get MCP server status
- `GET /api/mcp/servers` - List MCP servers
- `GET /api/mcp/tools` - List available tools
- `GET /api/mcp/resources` - List available resources
- `POST /api/mcp/tools/call` - Execute a tool

## Troubleshooting

### Common Issues

1. **MCP Not Connected**
   - Ensure the MCP server is running on port 8002
   - Check that the backend dependencies are installed
   - Verify the API endpoints are accessible

2. **Tools Not Loading**
   - Check the browser console for errors
   - Verify the MCP context provider is properly wrapped around your app
   - Ensure the backend is returning proper tool schemas

3. **Tool Execution Fails**
   - Check the tool parameters match the expected schema
   - Verify the backend tool implementation
   - Check server logs for detailed error messages

### Debug Mode

Enable debug mode by setting `MCP_DEBUG=true` in your environment variables.

## Extending MCP Integration

### Adding External MCP Servers

You can integrate with external MCP servers by:

1. Adding server configurations to your backend
2. Implementing proxy endpoints for external tools
3. Managing authentication and access control

### Custom Resource Types

Extend the resource system by:

1. Defining new resource URI schemes
2. Implementing resource content handlers
3. Adding resource-specific UI components

## Security Considerations

- Validate all tool inputs on the backend
- Implement proper authentication for sensitive tools
- Use environment variables for API keys and secrets
- Sanitize tool outputs before displaying in the UI
- Consider rate limiting for resource-intensive tools

## Performance Optimization

- Cache tool schemas and server information
- Implement lazy loading for tool components
- Use React.memo for expensive tool result rendering
- Consider pagination for large tool result sets

## Contributing

To contribute new MCP tools or improvements:

1. Fork the repository
2. Create a feature branch
3. Add your tool implementation and tests
4. Update documentation
5. Submit a pull request

## Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Anthropic MCP Documentation](https://docs.anthropic.com/mcp)
- [FastAPI MCP Library](https://github.com/modelcontextprotocol/fastapi-mcp)
- [MCP Examples](https://github.com/modelcontextprotocol/examples)

## License

This MCP integration is part of the Ollama WebUI project and follows the same MIT license. 