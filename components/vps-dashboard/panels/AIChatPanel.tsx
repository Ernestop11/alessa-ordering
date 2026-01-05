'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type ActivePanel = 'claude' | 'aider' | 'terminal';

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

export default function AIChatPanel() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('claude');
  const [isMobile, setIsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Session management
  const [claudeSessionId, setClaudeSessionId] = useState<string | null>(null);
  const [claudeSessions, setClaudeSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Claude chat state
  const [claudeMessages, setClaudeMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Claude Code connected. I can help you manage your VPS, edit code, and troubleshoot issues. What would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [claudeInput, setClaudeInput] = useState('');
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [claudeModel, setClaudeModel] = useState<'sonnet' | 'opus' | 'haiku'>('sonnet');

  // Aider state
  const [aiderMessages, setAiderMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Aider AI Editor ready. Specify a file path and describe the changes you want to make.',
      timestamp: new Date(),
    },
  ]);
  const [aiderInput, setAiderInput] = useState('');
  const [aiderFilePath, setAiderFilePath] = useState('');
  const [aiderLoading, setAiderLoading] = useState(false);

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '$ Welcome to VPS Terminal',
    '$ You can run SSH commands here',
    '$ Or access the full web terminal at port 7681',
    '',
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLoading, setTerminalLoading] = useState(false);

  const claudeEndRef = useRef<HTMLDivElement>(null);
  const aiderEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions on mount
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/vps-dashboard/chat-history?panelType=claude');
      if (res.ok) {
        const data = await res.json();
        setClaudeSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
    setSessionsLoading(false);
  }, []);

  // Load specific session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/vps-dashboard/chat-history?sessionId=${sessionId}`);
      if (res.ok) {
        const session = await res.json();
        setClaudeSessionId(sessionId);
        setClaudeModel((session.model as 'sonnet' | 'opus' | 'haiku') || 'sonnet');
        setClaudeMessages(
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
          panelType: 'claude',
          model: claudeModel,
          content: firstMessage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClaudeSessionId(data.session.id);
        return data.session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    return null;
  }, [claudeModel]);

  // Save message to session
  const saveMessage = useCallback(async (sessionId: string, role: string, content: string) => {
    try {
      await fetch('/api/vps-dashboard/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-message',
          sessionId,
          role,
          content,
        }),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/vps-dashboard/chat-history?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setClaudeSessions(prev => prev.filter(s => s.id !== sessionId));
        if (claudeSessionId === sessionId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }, [claudeSessionId]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setClaudeSessionId(null);
    setClaudeMessages([
      {
        role: 'system',
        content: 'Claude Code connected. I can help you manage your VPS, edit code, and troubleshoot issues. What would you like to do?',
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    claudeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [claudeMessages]);

  useEffect(() => {
    aiderEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiderMessages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleClaudeSend = async () => {
    if (!claudeInput.trim() || claudeLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: claudeInput,
      timestamp: new Date(),
    };

    setClaudeMessages(prev => [...prev, userMessage]);
    const inputText = claudeInput;
    setClaudeInput('');
    setClaudeLoading(true);

    // Create session if needed
    let sessionId = claudeSessionId;
    if (!sessionId) {
      sessionId = await createSession(inputText);
    }

    // Save user message
    if (sessionId) {
      await saveMessage(sessionId, 'user', inputText);
    }

    try {
      const response = await fetch('/api/vps-dashboard/claude-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText, model: claudeModel }),
      });

      const data = await response.json();
      const assistantContent = data.response || data.error || 'No response';

      setClaudeMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        },
      ]);

      // Save assistant message
      if (sessionId) {
        await saveMessage(sessionId, 'assistant', assistantContent);
      }

      // Refresh sessions list
      loadSessions();
    } catch (error) {
      const errorContent = `Error: ${error instanceof Error ? error.message : 'Failed to connect'}`;
      setClaudeMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        },
      ]);
    }

    setClaudeLoading(false);
  };

  const handleAiderSend = async () => {
    if (!aiderInput.trim() || !aiderFilePath.trim() || aiderLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: `[${aiderFilePath}] ${aiderInput}`,
      timestamp: new Date(),
    };

    setAiderMessages(prev => [...prev, userMessage]);
    const inputText = aiderInput;
    setAiderInput('');
    setAiderLoading(true);

    try {
      const response = await fetch('/api/vps-dashboard/aider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: aiderFilePath, message: inputText }),
      });

      const data = await response.json();
      setAiderMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.error || 'Changes applied',
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      setAiderMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to run Aider'}`,
          timestamp: new Date(),
        },
      ]);
    }

    setAiderLoading(false);
  };

  const handleTerminalCommand = async () => {
    if (!terminalInput.trim() || terminalLoading) return;

    const command = terminalInput;
    setTerminalHistory(prev => [...prev, `$ ${command}`]);
    setTerminalInput('');
    setTerminalLoading(true);

    try {
      const response = await fetch('/api/vps-dashboard/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();
      setTerminalHistory(prev => [...prev, data.output || data.error || '', '']);
    } catch (error) {
      setTerminalHistory(prev => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : 'Command failed'}`,
        '',
      ]);
    }

    setTerminalLoading(false);
  };

  // History sidebar component
  const HistorySidebar = () => (
    <div className={`${showHistory ? 'block' : 'hidden'} absolute inset-0 z-10 bg-slate-900 md:relative md:block md:w-64 md:border-r md:border-slate-700 flex flex-col`}>
      <div className="flex-shrink-0 p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">Chat History</h3>
        <div className="flex gap-2">
          <button
            onClick={startNewChat}
            className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-white"
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
        ) : claudeSessions.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No chat history yet</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {claudeSessions.map(session => (
              <div
                key={session.id}
                className={`p-3 cursor-pointer hover:bg-slate-800 transition-colors ${
                  claudeSessionId === session.id ? 'bg-slate-800 border-l-2 border-purple-500' : ''
                }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {session.title || 'Untitled Chat'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(session.updatedAt).toLocaleDateString()} • {session._count?.messages || 0} msgs
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this chat?')) {
                        deleteSession(session.id);
                      }
                    }}
                    className="text-slate-500 hover:text-red-400 text-xs p-1"
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
  );

  // Mobile layout - tabs
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-slate-900 relative">
        {/* History sidebar overlay */}
        <HistorySidebar />

        {/* Mobile tabs */}
        <div className="flex-shrink-0 flex border-b border-slate-700">
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-3 text-slate-400 hover:text-white border-r border-slate-700"
          >
            📜
          </button>
          {[
            { id: 'claude', label: 'Claude', icon: '🧠' },
            { id: 'aider', label: 'Aider', icon: '🤖' },
            { id: 'terminal', label: 'Terminal', icon: '💻' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id as ActivePanel)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activePanel === tab.id
                  ? 'bg-slate-800 text-white border-b-2 border-purple-500'
                  : 'text-slate-400'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active panel content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activePanel === 'claude' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-400">Model:</span>
                <select
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value as 'sonnet' | 'opus' | 'haiku')}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="sonnet">Sonnet 4</option>
                  <option value="opus">Opus 4</option>
                  <option value="haiku">Haiku 3.5</option>
                </select>
              </div>
              <ChatPanel
                title="Claude Code"
                messages={claudeMessages}
                input={claudeInput}
                setInput={setClaudeInput}
                onSend={handleClaudeSend}
                loading={claudeLoading}
                endRef={claudeEndRef}
                placeholder="Ask Claude anything..."
              />
            </div>
          )}
          {activePanel === 'aider' && (
            <AiderChatPanel
              messages={aiderMessages}
              input={aiderInput}
              setInput={setAiderInput}
              filePath={aiderFilePath}
              setFilePath={setAiderFilePath}
              onSend={handleAiderSend}
              loading={aiderLoading}
              endRef={aiderEndRef}
            />
          )}
          {activePanel === 'terminal' && (
            <TerminalPanel
              history={terminalHistory}
              input={terminalInput}
              setInput={setTerminalInput}
              onSend={handleTerminalCommand}
              loading={terminalLoading}
              endRef={terminalEndRef}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop layout - split view with history sidebar
  return (
    <div className="h-full flex bg-slate-900">
      {/* History sidebar */}
      <HistorySidebar />

      <div className="flex-1 flex flex-col">
        {/* Top section - Claude and Aider side by side */}
        <div className="flex-1 flex overflow-hidden border-b border-slate-700">
          {/* Claude Chat */}
          <div className="flex-1 flex flex-col border-r border-slate-700">
            <div className="flex-shrink-0 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="md:hidden text-slate-400 hover:text-white"
                  >
                    📜
                  </button>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span>🧠</span> Claude Code
                    </h3>
                    <p className="text-xs text-slate-500">AI assistant for your VPS</p>
                  </div>
                </div>
                <select
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value as 'sonnet' | 'opus' | 'haiku')}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="sonnet">Sonnet 4 (Balanced)</option>
                  <option value="opus">Opus 4 (Powerful)</option>
                  <option value="haiku">Haiku 3.5 (Fast)</option>
                </select>
              </div>
            </div>
            <ChatPanel
              messages={claudeMessages}
              input={claudeInput}
              setInput={setClaudeInput}
              onSend={handleClaudeSend}
              loading={claudeLoading}
              endRef={claudeEndRef}
              placeholder="Ask Claude anything..."
            />
          </div>

          {/* Aider */}
          <div className="flex-1 flex flex-col">
            <div className="flex-shrink-0 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span>🤖</span> Aider Editor
              </h3>
              <p className="text-xs text-slate-500">AI code editing on VPS</p>
            </div>
            <AiderChatPanel
              messages={aiderMessages}
              input={aiderInput}
              setInput={setAiderInput}
              filePath={aiderFilePath}
              setFilePath={setAiderFilePath}
              onSend={handleAiderSend}
              loading={aiderLoading}
              endRef={aiderEndRef}
            />
          </div>
        </div>

        {/* Bottom section - Terminal */}
        <div className="h-48 flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <span>💻</span> Terminal
            </h3>
            <a
              href="http://77.243.85.8:7681"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Open Full Terminal ↗
            </a>
          </div>
          <TerminalPanel
            history={terminalHistory}
            input={terminalInput}
            setInput={setTerminalInput}
            onSend={handleTerminalCommand}
            loading={terminalLoading}
            endRef={terminalEndRef}
          />
        </div>
      </div>
    </div>
  );
}

// Reusable chat panel
function ChatPanel({
  title,
  messages,
  input,
  setInput,
  onSend,
  loading,
  endRef,
  placeholder,
}: {
  title?: string;
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
  placeholder: string;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl px-4 py-2 border border-slate-700">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex-shrink-0 p-3 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder={placeholder}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Aider chat panel with file path input
function AiderChatPanel({
  messages,
  input,
  setInput,
  filePath,
  setFilePath,
  onSend,
  loading,
  endRef,
}: {
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  filePath: string;
  setFilePath: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap font-mono">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl px-4 py-2 border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span>
                <span className="text-sm text-slate-400">Aider is editing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex-shrink-0 p-3 border-t border-slate-700 space-y-2">
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="File path (e.g., app/page.tsx)"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
            placeholder="Describe changes..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim() || !filePath.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// Terminal panel
function TerminalPanel({
  history,
  input,
  setInput,
  onSend,
  loading,
  endRef,
}: {
  history: string[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      <div className="flex-1 overflow-auto p-3 font-mono text-sm text-green-400">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
        {loading && <span className="animate-pulse">Running...</span>}
        <div ref={endRef} />
      </div>
      <div className="flex-shrink-0 p-2 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-900 rounded px-3 py-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-green-400 text-sm placeholder-slate-600 focus:outline-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}
