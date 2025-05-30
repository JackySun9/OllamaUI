'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  AlertCircle, 
  CheckCircle, 
  Play, 
  RefreshCw, 
  Settings, 
  Wrench, 
  Database,
  Loader2
} from 'lucide-react';
import { useMCP, useToolCall } from '@/contexts/MCPContext';
import { MCPTool, MCPToolCall, MCPToolResult } from '@/types/mcp';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface MCPToolsProps {
  onToolResult?: (result: MCPToolResult) => void;
}

export const MCPTools: React.FC<MCPToolsProps> = ({ onToolResult }) => {
  const { 
    availableTools, 
    availableResources, 
    servers, 
    isConnected, 
    refreshServers 
  } = useMCP();
  const callTool = useToolCall();
  
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArguments, setToolArguments] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<MCPToolResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToolSelect = useCallback((tool: MCPTool) => {
    setSelectedTool(tool);
    setToolArguments({});
    setExecutionResult(null);
    setIsDialogOpen(true);
  }, []);

  const handleArgumentChange = useCallback((key: string, value: any) => {
    setToolArguments(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleToolExecution = useCallback(async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    try {
      const toolCall: MCPToolCall = {
        name: selectedTool.name,
        arguments: toolArguments
      };

      const result = await callTool(toolCall);
      setExecutionResult(result);
      onToolResult?.(result);
    } catch (error) {
      console.error('Tool execution failed:', error);
      setExecutionResult({
        content: [{
          type: 'text',
          text: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      });
    } finally {
      setIsExecuting(false);
    }
  }, [selectedTool, toolArguments, callTool, onToolResult]);

  const renderArgumentInput = (key: string, schema: any) => {
    const value = toolArguments[key] || '';
    
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return (
            <select
              value={value}
              onChange={(e) => handleArgumentChange(key, e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select...</option>
              {schema.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        return schema.description?.includes('long') || schema.description?.includes('text') ? (
          <Textarea
            value={value}
            onChange={(e) => handleArgumentChange(key, e.target.value)}
            placeholder={schema.description}
            className="min-h-[100px]"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => handleArgumentChange(key, e.target.value)}
            placeholder={schema.description}
          />
        );
      
      case 'number':
      case 'integer':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleArgumentChange(key, parseFloat(e.target.value))}
            placeholder={schema.description}
          />
        );
      
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleArgumentChange(key, e.target.checked)}
            className="w-4 h-4"
          />
        );
      
      default:
        return (
          <Input
            value={JSON.stringify(value)}
            onChange={(e) => {
              try {
                handleArgumentChange(key, JSON.parse(e.target.value));
              } catch {
                handleArgumentChange(key, e.target.value);
              }
            }}
            placeholder={`${schema.type} - ${schema.description}`}
          />
        );
    }
  };

  const renderToolResult = (result: MCPToolResult) => {
    return (
      <div className="space-y-4">
        {result.content.map((content, index) => (
          <div key={index} className="border rounded p-4">
            {content.type === 'text' && (
              <div className="whitespace-pre-wrap font-mono text-sm">
                {content.text}
              </div>
            )}
            {content.type === 'image' && content.data && (
              <img 
                src={`data:${content.mimeType || 'image/png'};base64,${content.data}`}
                alt="Tool result"
                className="max-w-full h-auto rounded"
              />
            )}
            {content.type === 'resource' && (
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span className="text-sm">{content.uri}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span>MCP Not Connected</span>
          </CardTitle>
          <CardDescription>
            MCP tools are not available. Please check your server configuration.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5" />
              <span>MCP Tools</span>
              <Badge variant="secondary">{availableTools.length} tools</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshServers}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Available Model Context Protocol tools and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="servers">Servers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tools" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {availableTools.map((tool, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{tool.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tool.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.keys(tool.inputSchema.properties || {}).map((param) => (
                                <Badge key={param} variant="outline" className="text-xs">
                                  {param}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToolSelect(tool)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {availableResources.map((resource, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4" />
                          <div>
                            <h4 className="font-medium">{resource.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {resource.uri}
                            </p>
                            {resource.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {resource.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="servers" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {servers.map((server, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{server.name}</h4>
                            <Badge variant="outline">{server.version}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {server.description}
                          </p>
                          <div className="flex space-x-4 text-xs text-gray-500">
                            <span>Tools: {server.tools.length}</span>
                            <span>Resources: {server.resources.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(server.capabilities).map(([cap, enabled]) => (
                              enabled && (
                                <Badge key={cap} variant="secondary" className="text-xs">
                                  {cap}
                                </Badge>
                              )
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tool Execution Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTool && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTool.name}</DialogTitle>
                <DialogDescription>{selectedTool.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Parameters</h4>
                  {Object.entries(selectedTool.inputSchema.properties || {}).map(([key, schema]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="flex items-center space-x-2">
                        <span>{key}</span>
                        {selectedTool.inputSchema.required?.includes(key) && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </Label>
                      {renderArgumentInput(key, schema)}
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleToolExecution}
                    disabled={isExecuting}
                    className="flex items-center space-x-2"
                  >
                    {isExecuting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
                  </Button>
                </div>
                
                {executionResult && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {executionResult.isError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className="font-medium">
                        {executionResult.isError ? 'Error' : 'Result'}
                      </span>
                    </div>
                    <ScrollArea className="max-h-[300px]">
                      {renderToolResult(executionResult)}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 