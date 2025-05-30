import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MCPProvider } from "@/contexts/MCPContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ollama WebUI",
  description: "Modern UI for Ollama language models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MCPProvider>
            {children}
          </MCPProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
