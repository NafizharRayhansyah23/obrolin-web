'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ProgressStatus {
  stage: string;
  message: string;
}

const categories = [
  { id: '', name: 'Select Category', disabled: true },
  { id: 'Capstone', name: 'Capstone Project' },
  { id: 'KP', name: 'Internship (KP)' },
  { id: 'MBKM', name: 'MBKM Program' },
  { id: 'Registrasi MK', name: 'Course Registration' },
];

export default function ModernChatWindow() {
  const { data: session, status: sessionStatus } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<ProgressStatus | null>(null);
  
  const initRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation
  useEffect(() => {
    if (
      sessionStatus !== 'authenticated' || 
      !session?.user?.id ||
      conversationId || 
      isInitializing ||
      initRef.current
    ) {
      return;
    }

    initRef.current = true;
    setIsInitializing(true);

    const startConversation = async () => {
      try {
        const res = await fetch('/api/chat/start', { 
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        
        if (!data.conversation_id) {
          throw new Error('Server did not return conversation_id');
        }

        setConversationId(data.conversation_id);
        setError('');
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to initialize chat';
        setError(errorMsg);
        initRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    startConversation();
  }, [sessionStatus, session, conversationId, isInitializing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, progressStatus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      setError('Please select a category first');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!input.trim() || !conversationId) return;

    setError('');
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(current => [...current, userMessage]);
    setInput('');

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.text,
          category: selectedCategory,
          conversation_id: conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Create bot message for streaming
      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(current => [...current, botMessage]);

      // Process SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        throw new Error('Stream reader not available');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.stage === 'thinking' || data.stage === 'searching' || 
                  data.stage === 'analyzing' || data.stage === 'generating') {
                setProgressStatus({
                  stage: data.stage,
                  message: data.message,
                });
              } else if (data.stage === 'streaming') {
                setProgressStatus(null);
                setMessages(current => {
                  const updated = [...current];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && !lastMsg.isUser) {
                    lastMsg.text += data.content;
                  }
                  return updated;
                });
              } else if (data.stage === 'complete') {
                setProgressStatus(null);
                setMessages(current => {
                  const updated = [...current];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && !lastMsg.isUser) {
                    lastMsg.text = data.full_content;
                    lastMsg.isStreaming = false;
                  }
                  return updated;
                });
              } else if (data.stage === 'error') {
                setProgressStatus(null);
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error('Submit error:', err);
      setError(err.message);
      setProgressStatus(null);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: `Error: ${err.message}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(current => [...current, errorMessage]);
    } finally {
      setIsLoading(false);
      setProgressStatus(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setProgressStatus(null);
    }
  };

  const handleRetryInit = () => {
    initRef.current = false;
    setError('');
    setIsInitializing(false);
    setConversationId('');
  };

  const handleNewChat = () => {
    setMessages([]);
    setSelectedCategory('');
    setError('');
    initRef.current = false;
    setConversationId('');
    setIsInitializing(false);
  };

  const isSessionLoading = sessionStatus === 'loading' || isInitializing;
  const canSendMessage = !isLoading && selectedCategory && input.trim() && conversationId;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${conversationId ? 'bg-cyan-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-600">
                {conversationId ? 'Connected' : isInitializing ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-cyan-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              {isSessionLoading ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Initializing...</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-gray-900">Welcome</h2>
                    <p className="text-gray-600">Select a category and start asking questions about your academic needs.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    {categories.slice(1).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-4 text-left rounded-lg border-2 transition-all ${
                          selectedCategory === cat.id
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{cat.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={handleRetryInit}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}

              <div className={`max-w-2xl ${message.isUser ? 'order-first' : ''}`}>
                <div 
                  className={`rounded-2xl px-4 py-3 ${
                    message.isUser
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                    {message.isStreaming && (
                      <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse"></span>
                    )}
                  </p>
                </div>
                <div className={`mt-1 px-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {message.isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Progress Status */}
          {progressStatus && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <p className="text-sm text-gray-700">{progressStatus.message}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="space-y-3">
            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isLoading || isSessionLoading}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} disabled={cat.disabled}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Input Box */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (canSendMessage) {
                        handleSubmit(e);
                      }
                    }
                  }}
                  placeholder={
                    !selectedCategory 
                      ? "Select a category first..." 
                      : !conversationId 
                      ? "Connecting..." 
                      : "Type your message..."
                  }
                  disabled={!selectedCategory || isLoading || !conversationId}
                  rows={1}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-900 placeholder:text-gray-400"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>

              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="px-5 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSendMessage}
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-500"
                >
                  Send
                </button>
              )}
            </div>

            {/* Hint */}
            {selectedCategory && (
              <p className="text-xs text-gray-500 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
