/**
 * VibeChatPanel.jsx
 * AI Chat Panel dengan Streaming Support untuk VibeSandpackViewer
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, X, ChevronDown, Copy, Check, Trash2 } from 'lucide-react';
import { streamVibeAI, generateVibeCode } from '../../utils/ai/VibeAIStreamService';

export default function VibeChatPanel({
  context = {},
  settings = {},
  onCodeGenerated = () => {},
  onClose = () => {}
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStream]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setCurrentStream('');

    try {
      const contextString = `App Name: ${context.appName || 'Vibe App'}
Current Files: ${Object.keys(context.files || {}).join(', ')}
Tables: ${(context.tables || []).map(t => t.name).join(', ')}`;

      const result = await streamVibeAI({
        messages: [
          { role: 'system', content: `You are an expert React developer specializing in industrial HMI applications.
Create beautiful UI using Tailwind CSS, Framer Motion, and Lucide React icons.
Always use glassmorphism, gradients, and modern dark theme.
When generating code, wrap it in <vibe_code> tags.` },
          { role: 'user', content: `Context:\n${contextString}\n\nTask: ${userMessage}` }
        ],
        settings,
        onChunk: (chunk) => {
          setCurrentStream(prev => prev + chunk);
        },
        onComplete: (result) => {
          // Extract vibe_code if present
          const codeMatch = result.text.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
          if (codeMatch) {
            onCodeGenerated(codeMatch[1].trim());
          }
          setMessages(prev => [...prev, { role: 'assistant', content: result.text }]);
          setCurrentStream('');
        },
        onError: (err) => {
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
          setCurrentStream('');
        }
      });
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentStream('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#a855f7" />
          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>
            Vibe AI Assistant
          </span>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#a855f7/20',
            color: '#a855f7'
          }}>
            Streaming
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '40px 20px'
          }}>
            <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>
              Ask me to create or modify your HMI app
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
              e.g., "Add a chart for production monitoring"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            onCopy={copyMessage}
          />
        ))}

        {/* Streaming indicator */}
        {isLoading && currentStream && (
          <MessageBubble
            role="assistant"
            content={currentStream}
            isStreaming={true}
            onCopy={copyMessage}
          />
        )}

        {/* Loading indicator */}
        {isLoading && !currentStream && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Generating...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        borderTop: '1px solid #334155',
        backgroundColor: '#1e293b'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#f8fafc',
              fontSize: '13px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '10px 14px',
              backgroundColor: isLoading || !input.trim() ? '#334155' : '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p style={{
          margin: '6px 0 0',
          fontSize: '10px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          AI may make mistakes. Verify important outputs.
        </p>
      </form>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ role, content, isStreaming, onCopy }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = role === 'assistant';

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse and format code blocks
  const formatContent = (text) => {
    // Check for vibe_code blocks
    if (text.includes('<vibe_code>')) {
      return text.split(/(<vibe_code>[\s\S]*?<\/vibe_code>)/i).map((part, i) => {
        if (part.match(/<vibe_code>[\s\S]*?<\/vibe_code>/i)) {
          const code = part.replace(/<\/?vibe_code>/gi, '');
          return (
            <pre key={i} style={{
              backgroundColor: '#1e1e1e',
              padding: '12px',
              borderRadius: '8px',
              margin: '8px 0',
              overflow: 'auto',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              border: '1px solid #333'
            }}>
              <code>{code}</code>
            </pre>
          );
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      });
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
  };

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      justifyContent: isAssistant ? 'flex-start' : 'flex-end'
    }}>
      {isAssistant && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          backgroundColor: '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Bot size={16} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '85%',
        backgroundColor: isAssistant ? '#1e293b' : '#8b5cf6',
        borderRadius: '12px',
        padding: '10px 14px',
        position: 'relative'
      }}>
        <div style={{
          color: '#f8fafc',
          fontSize: '13px',
          lineHeight: '1.5',
          wordBreak: 'break-word'
        }}>
          {formatContent(content)}
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '14px',
              backgroundColor: '#8b5cf6',
              marginLeft: '2px',
              animation: 'blink 1s infinite'
            }} />
          )}
        </div>
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            color: copied ? '#10b981' : '#94a3b8'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      {!isAssistant && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          backgroundColor: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <User size={16} color="#fff" />
        </div>
      )}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export { MessageBubble };
