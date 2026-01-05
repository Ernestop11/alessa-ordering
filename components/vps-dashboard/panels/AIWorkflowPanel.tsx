'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ActionOption {
  id: string;
  label: string;
  description: string;
  command: string;
  type: 'terminal' | 'aider';
  risk: 'safe' | 'moderate' | 'dangerous';
}

interface WorkflowState {
  step: 'chat' | 'options' | 'ready';
  options: ActionOption[];
  selectedOption: ActionOption | null;
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

type AIModel = 'sonnet' | 'opus' | 'haiku' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';

const MODEL_OPTIONS: { value: AIModel; label: string; provider: 'anthropic' | 'openai' }[] = [
  { value: 'sonnet', label: 'Sonnet 4', provider: 'anthropic' },
  { value: 'opus', label: 'Opus 4', provider: 'anthropic' },
  { value: 'haiku', label: 'Haiku 3.5', provider: 'anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
];

export default function AIWorkflowPanel() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: '🚀 AI Workflow ready. Ask me anything about your VPS, and I\'ll give you actionable options to choose from.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<AIModel>('sonnet');

  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Workflow state
  const [workflow, setWorkflow] = useState<WorkflowState>({
    step: 'chat',
    options: [],
    selectedOption: null,
  });

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ Ready to execute commands...',
  ]);
  const [terminalLoading, setTerminalLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  // Session management functions
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/vps-dashboard/chat-history?panelType=workflow');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/vps-dashboard/chat-history?sessionId=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          const loadedMessages: Message[] = data.messages.map((m: { role: 'user' | 'assistant' | 'system'; content: string; createdAt: string }) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt),
          }));
          setMessages(loadedMessages);
          setSessionId(id);
          if (data.model) setModel(data.model as AIModel);
          setShowHistory(false);
          setWorkflow({ step: 'chat', options: [], selectedOption: null });
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  const createSession = useCallback(async (firstMessage: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/vps-dashboard/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-session',
          panelType: 'workflow',
          model,
          content: firstMessage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session.id);
        loadSessions();
        return data.session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    return null;
  }, [model, loadSessions]);

  const saveMessage = useCallback(async (sId: string, role: string, content: string) => {
    try {
      await fetch('/api/vps-dashboard/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-message',
          sessionId: sId,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      await fetch(`/api/vps-dashboard/chat-history?sessionId=${id}`, { method: 'DELETE' });
      if (sessionId === id) {
        startNewChat();
      }
      loadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [sessionId, loadSessions]);

  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([
      {
        role: 'system',
        content: '🚀 AI Workflow ready. Ask me anything about your VPS, and I\'ll give you actionable options to choose from.',
        timestamp: new Date(),
      },
    ]);
    setWorkflow({ step: 'chat', options: [], selectedOption: null });
    setTerminalOutput(['$ Ready to execute commands...']);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);
    setWorkflow({ step: 'chat', options: [], selectedOption: null });

    // Create session if needed and save user message
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession(userInput);
    }
    if (currentSessionId) {
      saveMessage(currentSessionId, 'user', userInput);
    }

    try {
      const response = await fetch('/api/vps-dashboard/ai-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          model,
          action: 'chat'
        }),
      });

      const data = await response.json();
      const assistantContent = data.response || data.error || 'No response';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        },
      ]);

      // Save assistant message
      if (currentSessionId) {
        saveMessage(currentSessionId, 'assistant', assistantContent);
      }

      // If response contains actionable items, show generate options button
      if (data.response && !data.error) {
        setWorkflow(prev => ({ ...prev, step: 'chat' }));
      }
    } catch (error) {
      const errorContent = `Error: ${error instanceof Error ? error.message : 'Failed to connect'}`;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  const generateOptions = async () => {
    if (messages.length < 2) return;

    setLoading(true);

    // Get the last assistant message
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

    if (!lastAssistantMessage || !lastUserMessage) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/vps-dashboard/ai-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMessage.content,
          context: lastAssistantMessage.content,
          model: 'haiku', // Use haiku for fast option generation
          action: 'generate-options'
        }),
      });

      const data = await response.json();

      if (data.options && data.options.length > 0) {
        setWorkflow({
          step: 'options',
          options: data.options,
          selectedOption: null,
        });
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'system',
            content: 'No actionable options found. Try asking a more specific question.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to generate options:', error);
    }

    setLoading(false);
  };

  const selectOption = (option: ActionOption) => {
    setWorkflow(prev => ({
      ...prev,
      step: 'ready',
      selectedOption: option,
    }));
  };

  const executeCommand = async () => {
    if (!workflow.selectedOption) return;

    const { command, type } = workflow.selectedOption;
    setTerminalLoading(true);
    setTerminalOutput(prev => [...prev, `$ ${command}`]);

    try {
      if (type === 'terminal') {
        const response = await fetch('/api/vps-dashboard/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        });

        const data = await response.json();
        setTerminalOutput(prev => [...prev, data.output || data.error || '(no output)', '']);
      } else {
        // Aider command
        const response = await fetch('/api/vps-dashboard/aider', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: command.split(' ')[0], // First part is file path
            message: command.split(' ').slice(1).join(' ') // Rest is the message
          }),
        });

        const data = await response.json();
        setTerminalOutput(prev => [...prev, data.response || data.error || '(no output)', '']);
      }
    } catch (error) {
      setTerminalOutput(prev => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : 'Command failed'}`,
        '',
      ]);
    }

    setTerminalLoading(false);

    // Add success message
    setMessages(prev => [
      ...prev,
      {
        role: 'system',
        content: `✅ Executed: ${workflow.selectedOption?.label}`,
        timestamp: new Date(),
      },
    ]);

    // Reset workflow
    setWorkflow({ step: 'chat', options: [], selectedOption: null });
  };

  const clearWorkflow = () => {
    setWorkflow({ step: 'chat', options: [], selectedOption: null });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'safe': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'dangerous': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 relative">
      {/* Pipeline Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🚀</span> AI Workflow
            </h2>
            <p className="text-xs text-slate-400">Chat → Options → Execute</p>
          </div>
          <div className="flex items-center gap-2">
            {/* History toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-lg transition-colors ${
                showHistory ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Chat History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* New chat button */}
            <button
              onClick={startNewChat}
              className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="New Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Provider indicator */}
            <span className={`w-2 h-2 rounded-full ${
              MODEL_OPTIONS.find(m => m.value === model)?.provider === 'openai'
                ? 'bg-green-400'
                : 'bg-purple-400'
            }`} title={MODEL_OPTIONS.find(m => m.value === model)?.provider === 'openai' ? 'OpenAI' : 'Anthropic'} />
            {/* Model selector */}
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as AIModel)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <optgroup label="Anthropic">
                {MODEL_OPTIONS.filter(m => m.provider === 'anthropic').map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
              <optgroup label="OpenAI">
                {MODEL_OPTIONS.filter(m => m.provider === 'openai').map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="flex items-center gap-2 mt-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            workflow.step === 'chat' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            <span>💬</span> Chat
          </div>
          <span className="text-slate-600">→</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            workflow.step === 'options' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            <span>📋</span> Options
          </div>
          <span className="text-slate-600">→</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            workflow.step === 'ready' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            <span>🚀</span> Execute
          </div>
        </div>
      </div>

      {/* History Sidebar (overlay) */}
      {showHistory && (
        <div className="absolute top-0 left-0 w-64 h-full bg-slate-900 border-r border-slate-700 z-20 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <span className="text-sm font-medium text-white">Chat History</span>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No saved chats</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    sessionId === s.id ? 'bg-purple-600/20 border border-purple-500/30' : 'hover:bg-slate-800'
                  }`}
                  onClick={() => loadSession(s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{s.title || 'Untitled'}</p>
                    <p className="text-[10px] text-slate-500">
                      {s._count?.messages || 0} msgs • {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content - 2x2 Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-px bg-slate-700 overflow-hidden">
        {/* Top Left - Chat */}
        <div className="bg-slate-900 flex flex-col">
          <div className="flex-shrink-0 px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
            <span className="text-purple-400">💬</span>
            <span className="text-sm font-medium text-white">Chat</span>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-xs ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : msg.role === 'system'
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-800 text-slate-200 border border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex-shrink-0 p-2 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your VPS..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Top Right - Options */}
        <div className="bg-slate-900 flex flex-col">
          <div className="flex-shrink-0 px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📋</span>
              <span className="text-sm font-medium text-white">Options</span>
            </div>
            {workflow.step === 'chat' && messages.length > 1 && (
              <button
                onClick={generateOptions}
                disabled={loading}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>🔄</span> Generate
              </button>
            )}
            {workflow.step !== 'chat' && (
              <button
                onClick={clearWorkflow}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {workflow.options.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500 text-xs">
                  <p>💡 Ask a question, then click</p>
                  <p className="font-medium text-blue-400 mt-1">"Generate Options"</p>
                </div>
              </div>
            ) : (
              workflow.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectOption(option)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    workflow.selectedOption?.id === option.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{option.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRiskColor(option.risk)}`}>
                          {option.risk}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                      <code className="text-[10px] text-green-400 bg-slate-900 px-2 py-1 rounded mt-2 block font-mono">
                        {option.command}
                      </code>
                    </div>
                    {workflow.selectedOption?.id === option.id && (
                      <span className="text-blue-400">✓</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Bottom Left - Command Preview */}
        <div className="bg-slate-900 flex flex-col">
          <div className="flex-shrink-0 px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
            <span className="text-green-400">🎯</span>
            <span className="text-sm font-medium text-white">Ready to Execute</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {workflow.selectedOption ? (
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Selected Action:</p>
                  <p className="font-medium text-white">{workflow.selectedOption.label}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Command:</p>
                  <code className="text-sm text-green-400 font-mono break-all">
                    {workflow.selectedOption.command}
                  </code>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Target:</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    workflow.selectedOption.type === 'terminal'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {workflow.selectedOption.type === 'terminal' ? '💻 Terminal' : '🤖 Aider'}
                  </span>
                </div>
                <button
                  onClick={executeCommand}
                  disabled={terminalLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {terminalLoading ? (
                    <>
                      <span className="animate-spin">⏳</span> Executing...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Execute Command
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-500 text-xs">
                  <p>👆 Select an option above</p>
                  <p className="mt-1">to prepare execution</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right - Terminal Output */}
        <div className="bg-black flex flex-col">
          <div className="flex-shrink-0 px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400">💻</span>
              <span className="text-sm font-medium text-white">Terminal Output</span>
            </div>
            <button
              onClick={() => setTerminalOutput(['$ Ready to execute commands...'])}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-xs text-green-400">
            {terminalOutput.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">
                {line}
              </div>
            ))}
            {terminalLoading && <span className="animate-pulse">Running...</span>}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
