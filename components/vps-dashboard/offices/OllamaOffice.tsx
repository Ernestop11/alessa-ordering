'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface OllamaStatus {
  status: 'running' | 'stopped';
  version?: string;
  models: OllamaModel[];
  error?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  panelType: string;
  title: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface OllamaOfficeProps {
  onClose: () => void;
}

const POPULAR_MODELS = [
  { name: 'llama3.2', description: 'Meta Llama 3.2 (2GB) - Great for general tasks', size: '2GB' },
  { name: 'codellama', description: 'Code Llama (4GB) - Specialized for coding', size: '4GB' },
  { name: 'mistral', description: 'Mistral 7B (4GB) - Fast and capable', size: '4GB' },
  { name: 'phi3', description: 'Microsoft Phi-3 (1.3GB) - Lightweight and fast', size: '1.3GB' },
  { name: 'gemma2', description: 'Google Gemma 2 (5GB) - High quality', size: '5GB' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function OllamaOffice({ onClose }: OllamaOfficeProps) {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'models' | 'info'>('chat');
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Welcome to Ollama! This is your local AI running on the VPS - no API costs, works offline.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session management for persistence
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchStatus();
    loadSessions();
  }, []);

  // Load chat sessions
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/vps-dashboard/chat-history?panelType=ollama');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
    setSessionsLoading(false);
  }, []);

  // Load specific session
  const loadSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/vps-dashboard/chat-history?sessionId=${sid}`);
      if (res.ok) {
        const session = await res.json();
        setSessionId(sid);
        if (session.model) setSelectedModel(session.model);
        setMessages(
          session.messages.map((m: { role: string; content: string; createdAt: string }) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
        );
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  // Create new session
  const createSession = useCallback(async (firstMessage: string) => {
    try {
      const res = await fetch('/api/vps-dashboard/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-session',
          panelType: 'ollama',
          model: selectedModel,
          content: firstMessage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        return data.session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    return null;
  }, [selectedModel]);

  // Save message to session
  const saveMessage = useCallback(async (sid: string, role: string, content: string) => {
    try {
      await fetch('/api/vps-dashboard/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-message',
          sessionId: sid,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/vps-dashboard/chat-history?sessionId=${sid}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sid));
        if (sessionId === sid) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [sessionId]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([
      {
        role: 'system',
        content: 'Welcome to Ollama! This is your local AI running on the VPS - no API costs, works offline.',
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/vps-dashboard/ollama');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.models?.length > 0) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Ollama status:', error);
      setStatus({ status: 'stopped', models: [], error: 'Failed to connect' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const inputText = input;
    setInput('');
    setIsGenerating(true);

    // Create session if needed
    let sid = sessionId;
    if (!sid) {
      sid = await createSession(inputText);
    }

    // Save user message
    if (sid) {
      await saveMessage(sid, 'user', inputText);
    }

    try {
      const res = await fetch('/api/vps-dashboard/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          model: selectedModel,
          message: inputText,
        }),
      });

      const data = await res.json();
      const assistantContent = data.response || data.error || 'No response';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        },
      ]);

      // Save assistant message
      if (sid) {
        await saveMessage(sid, 'assistant', assistantContent);
      }

      // Refresh sessions list
      loadSessions();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
          timestamp: new Date(),
        },
      ]);
    }

    setIsGenerating(false);
  }

  async function pullModel(modelName: string) {
    setPullStatus(`Pulling ${modelName}...`);
    try {
      const res = await fetch('/api/vps-dashboard/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', model: modelName }),
      });

      const data = await res.json();
      setPullStatus(data.message || 'Started pulling model');

      // Refresh status after a delay
      setTimeout(() => {
        fetchStatus();
        setPullStatus(null);
      }, 3000);
    } catch (error) {
      setPullStatus(`Error: ${error instanceof Error ? error.message : 'Failed to pull'}`);
    }
  }

  async function deleteModel(modelName: string) {
    if (!confirm(`Delete ${modelName}? This cannot be undone.`)) return;

    try {
      await fetch('/api/vps-dashboard/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', model: modelName }),
      });
      fetchStatus();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-4">🦙</div>
          <p className="text-slate-400">Connecting to Ollama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦙</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Ollama Local AI</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <p className="text-slate-400">
                  {status?.status === 'running'
                    ? `Running v${status.version}`
                    : 'Stopped'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'chat', label: 'Chat', icon: '💬' },
            { id: 'models', label: 'Models', icon: '📦', count: status?.models?.length || 0 },
            { id: 'info', label: 'Info', icon: 'ℹ️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'chat' && (
          <>
            {/* History Sidebar */}
            <div className={`${showHistory ? 'block' : 'hidden'} absolute inset-0 z-10 bg-slate-900 md:relative md:block md:w-56 border-r border-slate-700 flex flex-col`}>
              <div className="flex-shrink-0 p-3 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">History</h3>
                <div className="flex gap-2">
                  <button
                    onClick={startNewChat}
                    className="text-xs px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-white"
                  >
                    + New
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="md:hidden text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {sessionsLoading ? (
                  <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">No chat history</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        className={`p-3 cursor-pointer hover:bg-slate-800 transition-colors ${
                          sessionId === session.id ? 'bg-slate-800 border-l-2 border-green-500' : ''
                        }`}
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {session.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {session.model} • {session._count?.messages || 0} msgs
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete?')) deleteSession(session.id);
                            }}
                            className="text-slate-500 hover:text-red-400 text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Model Selector */}
              <div className="p-4 border-b border-slate-700 flex items-center gap-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="md:hidden text-slate-400 hover:text-white"
                >
                  📜
                </button>
                <label className="text-sm text-slate-400">Model:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {status?.models?.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                  {(!status?.models || status.models.length === 0) && (
                    <option value="llama3.2">llama3.2 (default)</option>
                  )}
                </select>
                {status?.models?.length === 0 && (
                  <span className="text-xs text-amber-400">
                    No models installed. Go to Models tab to download one.
                  </span>
                )}
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
                          ? 'bg-green-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-emerald-600/20 text-slate-200 border border-emerald-500/30'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-emerald-600/20 rounded-xl p-3 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="text-sm text-slate-400 ml-2">Generating...</span>
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
                    placeholder="Ask Ollama anything..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    disabled={status?.status !== 'running'}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isGenerating || status?.status !== 'running'}
                    className="px-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Free local AI - no API costs. Press Enter to send.
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'models' && (
          <div className="p-6 space-y-6 overflow-auto flex-1">
            {/* Pull Status */}
            {pullStatus && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-blue-300">
                {pullStatus}
              </div>
            )}

            {/* Installed Models */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Installed Models</h3>
              {status?.models && status.models.length > 0 ? (
                <div className="grid gap-3">
                  {status.models.map((model) => (
                    <div
                      key={model.name}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🦙</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{model.name}</h4>
                          <p className="text-sm text-slate-400">
                            {formatBytes(model.size)} • Modified: {new Date(model.modified_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteModel(model.name)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No models installed yet.</p>
              )}
            </div>

            {/* Available Models */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Available Models</h3>
              <div className="grid gap-3">
                {POPULAR_MODELS.map((model) => {
                  const isInstalled = status?.models?.some((m) => m.name.startsWith(model.name));
                  return (
                    <div
                      key={model.name}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-semibold text-white">{model.name}</h4>
                        <p className="text-sm text-slate-400">{model.description}</p>
                      </div>
                      <button
                        onClick={() => pullModel(model.name)}
                        disabled={isInstalled || !!pullStatus}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isInstalled
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                        }`}
                      >
                        {isInstalled ? '✓ Installed' : `Pull (${model.size})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="p-6 space-y-6 overflow-auto flex-1">
            {/* What is Ollama */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🦙</span> What is Ollama?
              </h3>
              <div className="text-slate-300 space-y-3">
                <p>
                  Ollama lets you run large language models (LLMs) locally on your VPS.
                  Think of it as having your own ChatGPT that:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Costs nothing</strong> - No API fees, unlimited usage</li>
                  <li><strong>Works offline</strong> - No internet required after download</li>
                  <li><strong>Private</strong> - Data never leaves your server</li>
                  <li><strong>Fast</strong> - Runs directly on your hardware</li>
                </ul>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Use Cases</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💻</span>
                  <div>
                    <h4 className="font-medium text-white">Code Generation</h4>
                    <p className="text-sm text-slate-400">Use CodeLlama for writing and debugging code</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <h4 className="font-medium text-white">Content Writing</h4>
                    <p className="text-sm text-slate-400">Generate descriptions, emails, documentation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔍</span>
                  <div>
                    <h4 className="font-medium text-white">Analysis</h4>
                    <p className="text-sm text-slate-400">Summarize logs, analyze data patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h4 className="font-medium text-white">Aider Integration</h4>
                    <p className="text-sm text-slate-400">Use with Aider for free AI coding (no API costs)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Commands */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Terminal Commands</h3>
              <div className="space-y-3 font-mono text-sm">
                <div>
                  <p className="text-slate-400"># List models</p>
                  <code className="text-green-400">ollama list</code>
                </div>
                <div>
                  <p className="text-slate-400"># Pull a new model</p>
                  <code className="text-green-400">ollama pull llama3.2</code>
                </div>
                <div>
                  <p className="text-slate-400"># Chat interactively</p>
                  <code className="text-green-400">ollama run llama3.2</code>
                </div>
                <div>
                  <p className="text-slate-400"># Use with Aider (free!)</p>
                  <code className="text-green-400">aider --model ollama/llama3.2</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
