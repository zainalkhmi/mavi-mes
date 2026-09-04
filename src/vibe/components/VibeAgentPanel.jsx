/**
 * VibeAgentPanel.jsx
 * AI Agent Panel dengan LangGraph Brain Integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Loader2, CheckCircle2, XCircle, Clock, Zap, ChevronRight, RotateCcw } from 'lucide-react';
import { VibeAgent, useVibeAgent } from '../../utils/ai/VibeAgentBrain';

export default function VibeAgentPanel({
  context = {},
  settings = {},
  onCodeGenerated = () => {},
  onClose = () => {}
}) {
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  const { state, process, isProcessing, error } = useVibeAgent({ debug: true });

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, currentStep]);

  // Handle state changes
  useEffect(() => {
    if (state?.currentStep) {
      setCurrentStep(state.currentStep);
    }
    if (state?.success) {
      setIsThinking(false);
      // Extract code from state
      if (state.generatedCode) {
        onCodeGenerated(state.generatedCode);
      }
    }
  }, [state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsThinking(true);

    // Add user message
    setConversation(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      const result = await process(userMessage, {
        files: context.files || {},
        tables: context.tables || []
      });

      // Add agent response
      if (result.response) {
        setConversation(prev => [...prev, {
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          steps: result.stepHistory,
          success: result.success
        }]);
      }

      // Add code if generated
      if (result.generatedCode) {
        setConversation(prev => [...prev, {
          role: 'code',
          content: result.generatedCode,
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      setConversation(prev => [...prev, {
        role: 'error',
        content: err.message,
        timestamp: new Date()
      }]);
    }
  };

  const steps = [
    { id: 'analyze', label: 'Analyze', icon: '🔍' },
    { id: 'plan', label: 'Plan', icon: '📋' },
    { id: 'generate', label: 'Generate', icon: '⚡' },
    { id: 'write', label: 'Write', icon: '💾' },
    { id: 'preview', label: 'Preview', icon: '👁️' },
    { id: 'respond', label: 'Done', icon: '✅' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0f',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #1e1e2e'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        backgroundColor: '#13131a',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Brain size={18} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>
              Vibe Agent
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#10b981/20',
              color: '#10b981'
            }}>
              LangGraph
            </span>
          </div>
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            AI-powered development agent
          </span>
        </div>
      </div>

      {/* Step Progress */}
      {(isThinking || currentStep) && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#13131a',
          borderBottom: '1px solid #1e1e2e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
            {steps.map((step, i) => {
              const stepIndex = steps.findIndex(s => s.id === currentStep);
              const isActive = s.id === currentStep;
              const isComplete = stepIndex > steps.findIndex(s => s.id === step.id);
              const isCurrent = step.id === currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isComplete ? '#10b981' : (isCurrent ? '#8b5cf6' : '#1e1e2e'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      transition: 'all 0.3s'
                    }}>
                      {isComplete ? '✓' : step.icon}
                    </div>
                    <span style={{
                      fontSize: '9px',
                      color: isCurrent ? '#8b5cf6' : '#64748b',
                      fontWeight: isCurrent ? 600 : 400
                    }}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: '0 0 20px',
                      height: '2px',
                      backgroundColor: isComplete ? '#10b981' : '#1e1e2e',
                      marginTop: '-12px'
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {conversation.length === 0 && !isThinking && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '40px 20px'
          }}>
            <Brain size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>
              Vibe Agent siap membantu
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
              Describe what you want to build
            </p>
          </div>
        )}

        {conversation.map((msg, i) => (
          <MessageItem key={i} message={msg} />
        ))}

        {isThinking && currentStep && (
          <ThinkingIndicator step={currentStep} />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        backgroundColor: '#13131a',
        borderTop: '1px solid #1e1e2e'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build..."
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: '#0a0a0f',
              border: '1px solid #1e1e2e',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            style={{
              padding: '10px 14px',
              backgroundColor: isProcessing || !input.trim() ? '#1e1e2e' : '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>

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

// Message Item Component
function MessageItem({ message }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isCode = message.role === 'code';

  if (isCode) {
    return (
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #333'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }}>
            Generated Code
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(message.content)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Copy
          </button>
        </div>
        <pre style={{
          margin: 0,
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#a5b4fc',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {message.content}
        </pre>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        maxWidth: '85%',
        backgroundColor: isUser ? '#8b5cf6' : (isError ? '#ef4444' : '#1e1e2e'),
        borderRadius: '12px',
        padding: '10px 14px',
        color: '#fff',
        fontSize: '13px',
        lineHeight: '1.5'
      }}>
        {message.content}
        {message.steps && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px',
            opacity: 0.8
          }}>
            Completed in {message.steps.length} steps
          </div>
        )}
      </div>
    </div>
  );
}

// Thinking Indicator
function ThinkingIndicator({ step }) {
  const messages = {
    analyze: 'Analyzing your request...',
    plan: 'Planning the implementation...',
    generate: 'Generating code...',
    write: 'Writing files...',
    tables: 'Setting up database...',
    preview: 'Updating preview...',
    respond: 'Finalizing response...'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#8b5cf6',
      fontSize: '13px'
    }}>
      <Loader2 size={16} className="animate-spin" />
      <span>{messages[step] || 'Thinking...'}</span>
    </div>
  );
}

export { ThinkingIndicator, MessageItem };
