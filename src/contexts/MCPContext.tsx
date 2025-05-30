'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  MCPContext as IMCPContext, 
  MCPTool, 
  MCPResource, 
  MCPServer, 
  MCPToolCall, 
  MCPToolResult,
  MCPServerConfig,
  MCPError,
  MCPErrorCode
} from '@/types/mcp';

interface MCPProviderProps {
  children: React.ReactNode;
}

const MCPContext = createContext<IMCPContext | undefined>(undefined);

// API base URL for MCP endpoints
const API_BASE_URL = 'http://localhost:8000';

export const MCPProvider: React.FC<MCPProviderProps> = ({ children }) => {
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [availableResources, setAvailableResources] = useState<MCPResource[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize MCP connection
  useEffect(() => {
    initializeMCP();
  }, []);

  const initializeMCP = async () => {
    try {
      // Check if MCP is available in the backend
      const response = await fetch(`${API_BASE_URL}/api/mcp/status`);
      if (response.ok) {
        setIsConnected(true);
        await refreshServers();
      }
    } catch (error) {
      console.error('Failed to initialize MCP:', error);
      setIsConnected(false);
    }
  };

  const refreshServers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/servers`);
      if (!response.ok) {
        throw new Error('Failed to fetch MCP servers');
      }
      
      const serversData = await response.json();
      setServers(serversData);
      
      // Aggregate tools and resources from all servers
      const allTools: MCPTool[] = [];
      const allResources: MCPResource[] = [];
      
      serversData.forEach((server: MCPServer) => {
        allTools.push(...server.tools);
        allResources.push(...server.resources);
      });
      
      setAvailableTools(allTools);
      setAvailableResources(allResources);
    } catch (error) {
      console.error('Failed to refresh MCP servers:', error);
      throw new MCPError(MCPErrorCode.SERVER_ERROR_START, 'Failed to refresh servers');
    }
  }, []);

  const callTool = useCallback(async (toolCall: MCPToolCall): Promise<MCPToolResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toolCall),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new MCPError(
          MCPErrorCode.SERVER_ERROR_START,
          errorData.message || 'Tool call failed'
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Tool call failed:', error);
      return {
        content: [{
          type: 'text',
          text: `Error calling tool ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }, []);

  const getResource = useCallback(async (uri: string): Promise<MCPToolResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/resources?uri=${encodeURIComponent(uri)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new MCPError(
          MCPErrorCode.SERVER_ERROR_START,
          errorData.message || 'Resource fetch failed'
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Resource fetch failed:', error);
      return {
        content: [{
          type: 'text',
          text: `Error fetching resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }, []);

  const contextValue: IMCPContext = {
    availableTools,
    availableResources,
    servers,
    isConnected,
    callTool,
    getResource,
    refreshServers,
  };

  return (
    <MCPContext.Provider value={contextValue}>
      {children}
    </MCPContext.Provider>
  );
};

export const useMCP = (): IMCPContext => {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
};

// Hook for checking if a specific tool is available
export const useToolAvailable = (toolName: string): boolean => {
  const { availableTools } = useMCP();
  return availableTools.some(tool => tool.name === toolName);
};

// Hook for getting a specific tool
export const useTool = (toolName: string): MCPTool | undefined => {
  const { availableTools } = useMCP();
  return availableTools.find(tool => tool.name === toolName);
};

// Hook for calling tools with error handling
export const useToolCall = () => {
  const { callTool } = useMCP();
  
  return useCallback(async (toolCall: MCPToolCall): Promise<MCPToolResult> => {
    try {
      return await callTool(toolCall);
    } catch (error) {
      console.error('Tool call error:', error);
      return {
        content: [{
          type: 'text',
          text: `Tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }, [callTool]);
}; 