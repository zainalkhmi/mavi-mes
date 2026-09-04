/**
 * VibeActivityPanel.jsx
 * Real-time AI Activity Panel with WebSocket/SSE streaming
 */

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff, Zap, Loader2, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import { useVibeRealtime, vibeBus, VIBE_EVENTS, AIActivityFeed } from '../../utils/realtime/VibeRealtimeService';

export default function VibeActivityPanel({
  context = {},
  settings = {},
  onActivityUpdate = () => {},
  collapsed = false,
  onToggleCollapse = () => {}
}) {
  const {
    isConnected,
    isLocal,
    activity,
    events,
    errors,
    broadcastAIThinking,
    broadcastAIResponse,
    broadcastToolCall,
    broadcastToolResult,
    broadcastCodeChange,
    broadcastDBChange
  } = useVibeRealtime({ wsUrl: settings.wsUrl || 'ws://localhost:3001' });

  const [isExpanded, setIsExpanded] = useState(!collapsed);

  // Send activity updates to parent
  useEffect(() => {
    if (activity) {
      onActivityUpdate(activity);
    }
  }, [activity, onActivityUpdate]);

  // Demo: Simulate AI activity
  const simulateAIActivity = () => {
    // Thinking
    broadcastAIThinking('Analyzing request...');
    setTimeout(() => {
      broadcastAIThinking('Planning implementation...');
    }, 500);
    setTimeout(() => {
      broadcastAIThinking('Generating code...');
    }, 1000);
    setTimeout(() => {
      broadcastToolCall('fileWrite', { path: '/App.js', content: '...' });
    }, 1500);
    setTimeout(() => {
      broadcastToolResult('fileWrite', { success: true });
    }, 2000);
    setTimeout(() => {
      broadcastAIResponse('Code generated successfully!');
    }, 2500);
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '24px',
          backgroundColor: isConnected ? '#10b981' : '#f59e0b',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
        title="AI Activity"
      >
        {isConnected ? <Wifi size={20} /> : <Activity size={20} />}
        {activity && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#8b5cf6',
            animation: 'pulse 1.5s infinite'
          }} />
        )}
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '320px',
      maxHeight: '400px',
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      border: '1px solid #1e293b',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isConnected ? '#10b981/20' : '#f59e0b/20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isConnected ? (
              <Wifi size={16} color="#10b981" />
            ) : (
              <WifiOff size={16} color="#f59e0b" />
            )}
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '13px' }}>
              AI Activity
            </div>
            <div style={{ color: '#64748b', fontSize: '10px' }}>
              {isLocal ? 'Local mode' : (isConnected ? 'Connected' : 'Disconnected')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronDown
            size={16}
            color="#64748b"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s'
            }}
          />
        </div>
      </div>

      {/* Current Activity */}
      {activity && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #1e293b'
        }}>
          <CurrentActivity activity={activity} />
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Quick Actions */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #1e293b'
          }}>
            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '8px' }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={simulateAIActivity}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#8b5cf6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Demo Activity
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <AIActivityFeed activity={activity} events={events} />

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#ef4444/10',
              borderTop: '1px solid #ef4444/20'
            }}>
              <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                Errors
              </div>
              {errors.slice(-3).map((err, i) => (
                <div key={i} style={{ color: '#f87171', fontSize: '10px' }}>
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Events Timeline */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #1e293b'
          }}>
            <div style={{ color: '#64748b', fontSize: '10px', marginBottom: '8px' }}>
              Recent Events ({events.length})
            </div>
            {events.slice(-5).reverse().map((event, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                fontSize: '10px',
                color: '#94a3b8'
              }}>
                <Clock size={10} />
                <span style={{ flex: 1 }}>{event.type}</span>
                <span style={{ color: '#64748b' }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#1e293b',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Collapse
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes thinking {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .thinking-dot {
          animation: thinking 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Current Activity Component
function CurrentActivity({ activity }) {
  const { type, message, tool } = activity;

  const configs = {
    thinking: {
      color: '#f59e0b',
      bg: '#f59e0b/10',
      icon: <Loader2 size={14} className="animate-spin" />,
      label: 'Thinking'
    },
    response: {
      color: '#8b5cf6',
      bg: '#8b5cf6/10',
      icon: <Zap size={14} />,
      label: 'Responding'
    },
    tool: {
      color: '#06b6d4',
      bg: '#06b6d4/10',
      icon: <Activity size={14} />,
      label: tool || 'Tool'
    },
    complete: {
      color: '#10b981',
      bg: '#10b981/10',
      icon: <CheckCircle2 size={14} />,
      label: 'Complete'
    },
    error: {
      color: '#ef4444',
      bg: '#ef4444/10',
      icon: <XCircle size={14} />,
      label: 'Error'
    }
  };

  const config = configs[type] || configs.thinking;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      backgroundColor: config.bg,
      borderRadius: '8px'
    }}>
      <div style={{ color: config.color }}>
        {config.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: config.color, fontSize: '11px', fontWeight: 600 }}>
          {config.label}
        </div>
        {message && (
          <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini Activity Indicator (for embedding)
export function VibeActivityIndicator({ activity, size = 'sm' }) {
  if (!activity) return null;

  const sizes = {
    sm: { width: '8px', height: '8px' },
    md: { width: '12px', height: '12px' },
    lg: { width: '16px', height: '16px' }
  };

  const colors = {
    thinking: '#f59e0b',
    response: '#8b5cf6',
    tool: '#06b6d4',
    complete: '#10b981',
    error: '#ef4444'
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span style={{
        ...sizes[size],
        borderRadius: '50%',
        backgroundColor: colors[activity.type] || colors.thinking,
        animation: activity.type === 'thinking' ? 'pulse 1.5s infinite' : 'none'
      }} />
    </span>
  );
}

export { CurrentActivity, VibeActivityIndicator };
