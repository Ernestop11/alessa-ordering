'use client';

import { useState, useRef, useEffect } from 'react';
import { VPSPageNode } from '@/lib/vps-dashboard/types';

interface AiderPanelProps {
  page: VPSPageNode;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function AiderPanel({ page, onClose }: AiderPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: `Connected to file: ${page.filePath}\n\nI can help you edit this page. Describe what changes you'd like to make.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/vps-dashboard/aider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: page.filePath,
          message: input,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response || 'Changes applied successfully.',
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Make sure Aider is installed on the VPS.',
          timestamp: new Date(),
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Aider AI Editor</h3>
              <p className="text-xs text-slate-400">{page.filePath}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.role === 'system'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-purple-600/20 text-slate-200 border border-purple-500/30'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-50 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-purple-600/20 rounded-xl p-3 border border-purple-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="text-sm text-slate-400 ml-2">Aider is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the changes you want to make..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send. Shift+Enter for new line.
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="p-3 bg-slate-900 border-t border-slate-700">
          <details className="text-xs">
            <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
              Setup Instructions
            </summary>
            <div className="mt-2 text-slate-500 space-y-1">
              <p>1. SSH into VPS: <code className="text-slate-400">ssh root@77.243.85.8</code></p>
              <p>2. Install Aider: <code className="text-slate-400">pip install aider-chat</code></p>
              <p>3. Set API key: <code className="text-slate-400">export ANTHROPIC_API_KEY=your-key</code></p>
              <p>4. The API endpoint will communicate with Aider via subprocess</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
