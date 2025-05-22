import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { OutputBlock, OutputType, ParsedAssistantContent } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + "..."
}

// Parse assistant response content to identify different output types
export function parseAssistantContent(content: string): ParsedAssistantContent {
  const blocks: OutputBlock[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Code block detection (```language)
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;

      // Find the end of the code block
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      if (codeLines.length > 0) {
        const codeContent = codeLines.join('\n');
        const outputType: OutputType = determineCodeBlockType(language);
        
        blocks.push({
          type: outputType,
          content: codeContent,
          language: language,
          title: getCodeBlockTitle(language, outputType)
        });
      }
      i++; // Skip the closing ```
      continue;
    }

    // JSON detection (standalone JSON objects/arrays)
    if ((line.startsWith('{') || line.startsWith('[')) && isLikelyJSON(line, lines, i)) {
      const jsonResult = extractJSON(lines, i);
      if (jsonResult) {
        blocks.push({
          type: 'json',
          content: jsonResult.content,
          title: 'JSON Response'
        });
        i = jsonResult.endIndex;
        continue;
      }
    }

    // XML detection
    if (line.startsWith('<') && !line.startsWith('<!--') && isLikelyXML(line)) {
      const xmlResult = extractXML(lines, i);
      if (xmlResult) {
        blocks.push({
          type: 'xml',
          content: xmlResult.content,
          title: 'XML Response'
        });
        i = xmlResult.endIndex;
        continue;
      }
    }

    // Command detection (lines starting with $ or #)
    if (line.startsWith('$ ') || line.startsWith('# ')) {
      blocks.push({
        type: 'command',
        content: line.slice(2),
        title: 'Command'
      });
      i++;
      continue;
    }

    // Math detection (LaTeX-style equations)
    if ((line.includes('\\[') && line.includes('\\]')) || 
        (line.includes('$$') && line.split('$$').length > 2)) {
      blocks.push({
        type: 'math',
        content: line,
        title: 'Mathematical Expression'
      });
      i++;
      continue;
    }

    // Table detection (simple markdown tables)
    if (line.includes('|') && isTableRow(line)) {
      const tableResult = extractTable(lines, i);
      if (tableResult) {
        blocks.push({
          type: 'table',
          content: tableResult.content,
          title: 'Table'
        });
        i = tableResult.endIndex;
        continue;
      }
    }

    // Regular text - collect consecutive text lines
    const textLines: string[] = [];
    while (i < lines.length && !isSpecialLine(lines[i])) {
      textLines.push(lines[i]);
      i++;
    }

    if (textLines.length > 0) {
      const textContent = textLines.join('\n').trim();
      if (textContent) {
        blocks.push({
          type: 'text',
          content: textContent
        });
      }
    }
  }

  // If no blocks were found, treat the entire content as text
  if (blocks.length === 0) {
    blocks.push({
      type: 'text',
      content: content.trim()
    });
  }

  return {
    blocks,
    rawContent: content
  };
}

function determineCodeBlockType(language: string): OutputType {
  const lowerLang = language.toLowerCase();
  
  // Command types
  if (['bash', 'sh', 'shell', 'zsh', 'fish', 'cmd', 'powershell'].includes(lowerLang)) {
    return 'command';
  }

  // Always treat as code for programming languages
  return 'code';
}

function getCodeBlockTitle(language: string, type: OutputType): string {
  if (type === 'command') {
    return `${language.toUpperCase()} Command`;
  }
  return `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
}

function isLikelyJSON(line: string, lines: string[], startIndex: number): boolean {
  // Simple heuristic: check if it looks like JSON syntax
  const content = lines.slice(startIndex, Math.min(startIndex + 10, lines.length)).join('');
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function extractJSON(lines: string[], startIndex: number): { content: string; endIndex: number } | null {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escaped = false;
  const jsonLines: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    jsonLines.push(line);

    for (const char of line) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
    }

    // Check if we've closed all braces/brackets
    if (braceCount === 0 && bracketCount === 0 && jsonLines.length > 0) {
      const content = jsonLines.join('\n');
      try {
        JSON.parse(content);
        return { content, endIndex: i + 1 };
      } catch {
        // Continue if it's not valid JSON yet
      }
    }
  }

  return null;
}

function isLikelyXML(line: string): boolean {
  return line.match(/<[a-zA-Z][^>]*>/) !== null;
}

function extractXML(lines: string[], startIndex: number): { content: string; endIndex: number } | null {
  const xmlLines: string[] = [];
  const tagStack: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    xmlLines.push(line);

    // Simple XML parsing - look for opening and closing tags
    const openTags = line.match(/<([a-zA-Z][^>\s]*)[^>]*>/g) || [];
    const closeTags = line.match(/<\/([a-zA-Z][^>]*)\s*>/g) || [];

    for (const tag of openTags) {
      const tagName = tag.match(/<([a-zA-Z][^>\s]*)/)?.[1];
      if (tagName && !tag.endsWith('/>')) {
        tagStack.push(tagName);
      }
    }

    for (const tag of closeTags) {
      const tagName = tag.match(/<\/([a-zA-Z][^>]*)/)?.[1];
      if (tagName && tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
        tagStack.pop();
      }
    }

    // If all tags are closed, we've found the end
    if (tagStack.length === 0 && xmlLines.length > 0) {
      return { content: xmlLines.join('\n'), endIndex: i + 1 };
    }
  }

  return null;
}

function isTableRow(line: string): boolean {
  const parts = line.split('|').filter(part => part.trim());
  return parts.length >= 2;
}

function extractTable(lines: string[], startIndex: number): { content: string; endIndex: number } | null {
  const tableLines: string[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('|') && isTableRow(line)) {
      tableLines.push(lines[i]);
    } else if (tableLines.length > 0) {
      // End of table
      break;
    } else {
      // Not a table after all
      return null;
    }
  }

  if (tableLines.length >= 2) { // At least header + one row
    return { 
      content: tableLines.join('\n'), 
      endIndex: startIndex + tableLines.length 
    };
  }

  return null;
}

function isSpecialLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('```') ||
    trimmed.startsWith('$ ') ||
    trimmed.startsWith('# ') ||
    (trimmed.startsWith('{') || trimmed.startsWith('[')) ||
    trimmed.startsWith('<') ||
    trimmed.includes('|') ||
    (trimmed.includes('\\[') && trimmed.includes('\\]')) ||
    (trimmed.includes('$$') && trimmed.split('$$').length > 2)
  );
}
