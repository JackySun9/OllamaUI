"use client";

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

interface RichMarkdownProps {
  content: string;
  className?: string;
}

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  );
};

export const RichMarkdown = memo(({ content, className }: RichMarkdownProps) => {
  const { theme } = useTheme();

  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          rehypeRaw,
        ]}
        components={{
          // Enhanced paragraph handling
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground">
              {children}
            </p>
          ),

          // Enhanced heading styles
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 mt-8 pb-2 border-b border-border text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mb-4 mt-6 pb-1 border-b border-border text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium mb-3 mt-5 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mb-2 mt-4 text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-base font-medium mb-2 mt-3 text-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium mb-2 mt-3 text-muted-foreground">
              {children}
            </h6>
          ),

          // Enhanced list styles
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 space-y-1 list-disc marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 space-y-1 list-decimal marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground">{children}</li>
          ),

          // Enhanced blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 py-2 mb-4 bg-muted/30 rounded-r-md italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Enhanced code blocks with syntax highlighting and copy functionality
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline && language) {
              return (
                <div className="relative group mb-4">
                  <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-t border-l border-r border-border rounded-t-lg">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {language}
                    </span>
                    <CopyButton content={codeContent} />
                  </div>
                  <SyntaxHighlighter
                    style={theme === 'dark' ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !rounded-t-none border-b border-l border-r border-border"
                    showLineNumbers={codeContent.split('\n').length > 3}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {codeContent}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // Inline code
            return (
              <code 
                className="px-1.5 py-0.5 bg-muted/60 border border-border rounded text-sm font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Enhanced pre blocks (fallback for non-language specific code)
          pre: ({ children }) => (
            <div className="relative group mb-4">
              <CopyButton content={String(children)} />
              <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground">
                {children}
              </pre>
            </div>
          ),

          // Enhanced table styles
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-background divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-foreground">
              {children}
            </td>
          ),

          // Enhanced link styles
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Enhanced emphasis and strong text
          em: ({ children }) => (
            <em className="italic text-foreground font-medium">
              {children}
            </em>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">
              {children}
            </strong>
          ),

          // Enhanced horizontal rule
          hr: () => (
            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          ),

          // Task list items (GitHub Flavored Markdown)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 accent-primary"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },

          // Delete/strikethrough text
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">
              {children}
            </del>
          ),

          // Math blocks (LaTeX)
          div: ({ className, children, ...props }) => {
            if (className === 'math math-display') {
              return (
                <div className="my-6 p-4 bg-muted/30 rounded-lg border border-border overflow-x-auto">
                  <div className="text-center" {...props}>
                    {children}
                  </div>
                </div>
              );
            }
            return <div className={className} {...props}>{children}</div>;
          },

          // Inline math
          span: ({ className, children, ...props }) => {
            if (className === 'math math-inline') {
              return (
                <span 
                  className="inline-block px-1 py-0.5 bg-muted/40 rounded text-foreground" 
                  {...props}
                >
                  {children}
                </span>
              );
            }
            return <span className={className} {...props}>{children}</span>;
          },

          // Image handling
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg border border-border shadow-sm my-4"
              loading="lazy"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

RichMarkdown.displayName = 'RichMarkdown'; 