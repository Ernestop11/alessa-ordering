'use client';

import { useState, useRef, useEffect } from 'react';

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
  const [model, setModel] = useState<'sonnet' | 'opus' | 'haiku'>('sonnet');

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

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

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.error || 'No response',
          timestamp: new Date(),
        },
      ]);

      // If response contains actionable items, show generate options button
      if (data.response && !data.error) {
        setWorkflow(prev => ({ ...prev, step: 'chat' }));
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
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
    <div className="h-full flex flex-col bg-slate-900">
      {/* Pipeline Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🚀</span> AI Workflow
            </h2>
            <p className="text-xs text-slate-400">Chat → Options → Execute</p>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as 'sonnet' | 'opus' | 'haiku')}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="sonnet">Sonnet 4</option>
            <option value="opus">Opus 4</option>
            <option value="haiku">Haiku 3.5</option>
          </select>
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
