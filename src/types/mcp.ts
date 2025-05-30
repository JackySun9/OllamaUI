// MCP (Model Context Protocol) Types and Interfaces

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPServer {
  name: string;
  description: string;
  version: string;
  tools: MCPTool[];
  resources: MCPResource[];
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface MCPConfig {
  servers: Record<string, {
    command: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
  }>;
}

export interface MCPContext {
  availableTools: MCPTool[];
  availableResources: MCPResource[];
  servers: MCPServer[];
  isConnected: boolean;
  callTool: (toolCall: MCPToolCall) => Promise<MCPToolResult>;
  getResource: (uri: string) => Promise<MCPToolResult>;
  refreshServers: () => Promise<void>;
}

// MCP Message Types
export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params?: any;
}

export interface MCPResponse extends MCPMessage {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Tool execution context
export interface MCPExecutionContext {
  toolName: string;
  arguments: Record<string, any>;
  timestamp: number;
  requestId: string;
}

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  description: string;
  version: string;
  baseUrl?: string;
  transport: 'stdio' | 'http' | 'websocket';
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
}

// MCP Tool Schema
export interface MCPToolSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: any[];
    default?: any;
  }>;
  required?: string[];
  additionalProperties?: boolean;
}

// MCP Error Types
export enum MCPErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  SERVER_ERROR_START = -32099,
  SERVER_ERROR_END = -32000,
}

export class MCPError extends Error {
  constructor(
    public code: MCPErrorCode,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
} 