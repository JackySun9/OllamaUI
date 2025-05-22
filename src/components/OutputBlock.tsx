import React, { useState } from 'react';
import { OutputBlock as OutputBlockType } from '@/types';
import { Button } from '@/components/ui/button';
import { Copy, Check, Play, Terminal, Code, FileText, Hash, Table, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutputBlockProps {
  block: OutputBlockType;
  className?: string;
}

export function OutputBlock({ block, className }: OutputBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Check if content is very long (more than 1000 characters for text, or 20+ lines for code)
  const isLongContent = (block.type === 'text' && block.content.length > 1000) ||
    (['code', 'command', 'json', 'xml'].includes(block.type) && block.content.split('\n').length > 20);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    switch (block.type) {
      case 'code':
        return <Code size={16} />;
      case 'command':
        return <Terminal size={16} />;
      case 'json':
        return <Hash size={16} />;
      case 'xml':
        return <FileText size={16} />;
      case 'table':
        return <Table size={16} />;
      case 'math':
        return <Calculator size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getLanguageClass = () => {
    const lang = block.language?.toLowerCase() || block.type;
    return `language-${lang}`;
  };

  const renderContent = () => {
    switch (block.type) {
      case 'code':
      case 'command':
        const codeLines = block.content.split('\n');
        const shouldTruncateCode = isLongContent && !isExpanded && codeLines.length > 20;
        const displayCodeContent = shouldTruncateCode 
          ? codeLines.slice(0, 20).join('\n') + '\n... (truncated)'
          : block.content;
          
        return (
          <div>
            <pre className={cn(
              "text-sm overflow-x-auto p-4 rounded-md bg-muted/50",
              shouldTruncateCode ? "" : "overflow-y-auto max-h-96",
              getLanguageClass()
            )}>
              <code>{displayCodeContent}</code>
            </pre>
            {isLongContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={14} className="mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} className="mr-1" />
                    Show More ({codeLines.length} lines)
                  </>
                )}
              </Button>
            )}
          </div>
        );

      case 'json':
        try {
          const parsed = JSON.parse(block.content);
          const formatted = JSON.stringify(parsed, null, 2);
          const jsonLines = formatted.split('\n');
          const shouldTruncateJson = isLongContent && !isExpanded && jsonLines.length > 20;
          const displayJsonContent = shouldTruncateJson 
            ? jsonLines.slice(0, 20).join('\n') + '\n... (truncated)'
            : formatted;
            
          return (
            <div>
              <pre className={cn(
                "text-sm overflow-x-auto p-4 rounded-md bg-muted/50 language-json",
                shouldTruncateJson ? "" : "overflow-y-auto max-h-96"
              )}>
                <code>{displayJsonContent}</code>
              </pre>
              {isLongContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} className="mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="mr-1" />
                      Show More ({jsonLines.length} lines)
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        } catch {
          const fallbackLines = block.content.split('\n');
          const shouldTruncateJsonFallback = isLongContent && !isExpanded && fallbackLines.length > 20;
          const displayJsonFallbackContent = shouldTruncateJsonFallback 
            ? fallbackLines.slice(0, 20).join('\n') + '\n... (truncated)'
            : block.content;
            
          return (
            <div>
              <pre className={cn(
                "text-sm overflow-x-auto p-4 rounded-md bg-muted/50 language-json",
                shouldTruncateJsonFallback ? "" : "overflow-y-auto max-h-96"
              )}>
                <code>{displayJsonFallbackContent}</code>
              </pre>
              {isLongContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} className="mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="mr-1" />
                      Show More ({fallbackLines.length} lines)
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        }

      case 'xml':
        const xmlLines = block.content.split('\n');
        const shouldTruncateXml = isLongContent && !isExpanded && xmlLines.length > 20;
        const displayXmlContent = shouldTruncateXml 
          ? xmlLines.slice(0, 20).join('\n') + '\n... (truncated)'
          : block.content;
          
        return (
          <div>
            <pre className={cn(
              "text-sm overflow-x-auto p-4 rounded-md bg-muted/50 language-xml",
              shouldTruncateXml ? "" : "overflow-y-auto max-h-96"
            )}>
              <code>{displayXmlContent}</code>
            </pre>
            {isLongContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={14} className="mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} className="mr-1" />
                    Show More ({xmlLines.length} lines)
                  </>
                )}
              </Button>
            )}
          </div>
        );

      case 'table':
        return (
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full border-collapse border border-border">
              {block.content.split('\n').map((row, i) => {
                const cells = row.split('|').filter(cell => cell.trim());
                const isHeaderSeparator = row.includes('---') || row.includes('===');
                
                if (isHeaderSeparator) return null;
                
                const Tag = i === 0 ? 'th' : 'td';
                return (
                  <tr key={i} className={i === 0 ? 'bg-muted/50' : ''}>
                    {cells.map((cell, j) => (
                      <Tag
                        key={j}
                        className="border border-border px-3 py-2 text-left"
                      >
                        {cell.trim()}
                      </Tag>
                    ))}
                  </tr>
                );
              })}
            </table>
          </div>
        );

      case 'math':
        return (
          <div className="p-4 bg-muted/50 rounded-md text-center">
            <div className="font-mono text-sm">
              {block.content}
            </div>
          </div>
        );

      case 'text':
      default:
        const shouldTruncate = isLongContent && !isExpanded;
        const displayContent = shouldTruncate 
          ? block.content.substring(0, 1000) + '...'
          : block.content;
          
        return (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">
              {displayContent}
            </div>
            {isLongContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={14} className="mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} className="mr-1" />
                    Show More
                  </>
                )}
              </Button>
            )}
          </div>
        );
    }
  };

  const showHeader = block.title || block.type !== 'text';
  const canExecute = block.type === 'command';

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {showHeader && (
        <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            {getIcon()}
            <span>{block.title || block.type.charAt(0).toUpperCase() + block.type.slice(1)}</span>
            {block.language && block.language !== block.type && (
              <span className="text-muted-foreground">({block.language})</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {canExecute && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => {
                  // In a real implementation, you might want to show a modal
                  // or integrate with a terminal/command execution system
                  alert('Command execution would happen here in a real implementation');
                }}
                title="Execute command"
              >
                <Play size={14} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-3">
        {renderContent()}
      </div>
    </div>
  );
} 