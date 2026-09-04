/**
 * VibeRealtimeService.js
 * WebSocket & SSE for Real-time AI Activity Streaming
 * Enables live updates between AI Agent and UI
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Event Types ───────────────────────────────────────────────────────────────

export const VIBE_EVENTS = {
  // AI Events
  AI_THINKING: 'ai:thinking',
  AI_RESPONSE: 'ai:response',
  AI_TOOL_CALL: 'ai:tool-call',
  AI_TOOL_RESULT: 'ai:tool-result',
  AI_ERROR: 'ai:error',
  AI_COMPLETE: 'ai:complete',

  // Code Events
  CODE_CHANGE: 'code:change',
  CODE_SAVE: 'code:save',
  CODE_DEPLOY: 'code:deploy',

  // File Events
  FILE_CREATE: 'file:create',
  FILE_UPDATE: 'file:update',
  FILE_DELETE: 'file:delete',

  // Preview Events
  PREVIEW_REFRESH: 'preview:refresh',
  PREVIEW_ERROR: 'preview:error',

  // Database Events
  DB_INSERT: 'db:insert',
  DB_UPDATE: 'db:update',
  DB_DELETE: 'db:delete',
  DB_SYNC: 'db:sync',

  // User Events
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  USER_CURSOR: 'user:cursor',
};

// ─── WebSocket Client ────────────────────────────────────────────────────────

export class VibeWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      ...options
    };

    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[VibeWS] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit(VIBE_EVENTS.USER_JOIN, { timestamp: Date.now() });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.type, data.payload);
          } catch (e) {
            console.warn('[VibeWS] Failed to parse message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[VibeWS] Error:', error);
          this.emit(VIBE_EVENTS.AI_ERROR, { error: error.message });
        };

        this.ws.onclose = () => {
          console.log('[VibeWS] Disconnected');
          this.isConnected = false;
          this.emit(VIBE_EVENTS.USER_LEAVE, { timestamp: Date.now() });
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[VibeWS] Reconnecting... (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.options.reconnectInterval);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type, payload = {}) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('[VibeWS] Listener error:', e);
        }
      });
    }
  }
}

// ─── SSE Client (Server-Sent Events) ─────────────────────────────────────────

export class VibeSSE {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.eventSource = null;
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(this.url);

        this.eventSource.onopen = () => {
          console.log('[VibeSSE] Connected');
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.type || 'message', data);
          } catch (e) {
            console.warn('[VibeSSE] Failed to parse:', event.data);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('[VibeSSE] Error:', error);
          this.emit(VIBE_EVENTS.AI_ERROR, { error: 'SSE connection error' });
          // Don't auto-reconnect for SSE (browser handles this)
        };

        // Handle named events
        Object.values(VIBE_EVENTS).forEach(eventType => {
          this.eventSource.addEventListener(eventType, (e) => {
            try {
              const data = JSON.parse(e.data);
              this.emit(eventType, data);
            } catch (err) {
              this.emit(eventType, e.data);
            }
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// ─── Local Event Bus (for same-browser communication) ─────────────────────────

class LocalEventBus {
  constructor() {
    this.listeners = new Map();
    this.broadcastChannel = null;

    // Use BroadcastChannel for cross-tab communication if available
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('vibe-realtime');
      this.broadcastChannel.onmessage = (event) => {
        this.emit(event.data.type, event.data.payload);
      };
    }
  }

  emit(type, payload = {}) {
    const data = { type, payload, timestamp: Date.now() };

    // Local listeners
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try { callback(payload); } catch (e) { console.error(e); }
      });
    }

    // Broadcast to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(data);
    }
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.off(type, callback);
  }

  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  // Subscribe to a pattern (e.g., 'ai:*')
  onPattern(pattern, callback) {
    const unsubscribe = this.on('*', (data) => {
      if (data.type && this.matchPattern(data.type, pattern)) {
        callback(data.payload, data.type);
      }
    });
    return unsubscribe;
  }

  matchPattern(type, pattern) {
    const regex = new RegExp('^' + pattern.replace('*', '.*').replace('?', '.') + '$');
    return regex.test(type);
  }
}

export const vibeBus = new LocalEventBus();

// ─── React Hook for Real-time ─────────────────────────────────────────────────

export function useVibeRealtime(options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [activity, setActivity] = useState(null);
  const [errors, setErrors] = useState([]);

  const wsRef = useRef(null);
  const cleanupRef = useRef([]);

  // Connect to WebSocket
  useEffect(() => {
    const wsUrl = options.wsUrl || 'ws://localhost:3001';

    wsRef.current = new VibeWebSocket(wsUrl, {
      reconnect: true,
      reconnectInterval: 2000,
      maxReconnectAttempts: 3
    });

    // Subscribe to common events
    const unsubscribers = [
      wsRef.current.on(VIBE_EVENTS.AI_THINKING, (data) => {
        setActivity({ type: 'thinking', message: data.message, timestamp: Date.now() });
      }),
      wsRef.current.on(VIBE_EVENTS.AI_RESPONSE, (data) => {
        setActivity({ type: 'response', message: data.message, timestamp: Date.now() });
        setEvents(prev => [...prev.slice(-99), { type: VIBE_EVENTS.AI_RESPONSE, data, timestamp: Date.now() }]);
      }),
      wsRef.current.on(VIBE_EVENTS.AI_TOOL_CALL, (data) => {
        setActivity({ type: 'tool', tool: data.tool, message: `Calling ${data.tool}...`, timestamp: Date.now() });
      }),
      wsRef.current.on(VIBE_EVENTS.AI_COMPLETE, (data) => {
        setActivity({ type: 'complete', message: 'Done!', timestamp: Date.now() });
      }),
      wsRef.current.on(VIBE_EVENTS.AI_ERROR, (data) => {
        setErrors(prev => [...prev.slice(-9), data.error]);
      }),
      wsRef.current.on(VIBE_EVENTS.DB_INSERT, (data) => {
        setEvents(prev => [...prev.slice(-99), { type: VIBE_EVENTS.DB_INSERT, data, timestamp: Date.now() }]);
      }),
    ];

    cleanupRef.current = unsubscribers;

    wsRef.current.connect()
      .then(() => setIsConnected(true))
      .catch(err => {
        console.warn('[VibeRealtime] WebSocket failed, using local bus');
        setIsConnected(false);
      });

    return () => {
      cleanupRef.current.forEach(fn => fn());
      wsRef.current?.disconnect();
    };
  }, [options.wsUrl]);

  // Subscribe to local bus
  useEffect(() => {
    const unsubscribers = [
      vibeBus.on(VIBE_EVENTS.AI_THINKING, (data) => {
        setActivity({ type: 'thinking', message: data.message, timestamp: Date.now() });
      }),
      vibeBus.on(VIBE_EVENTS.AI_RESPONSE, (data) => {
        setActivity({ type: 'response', message: data.message, timestamp: Date.now() });
      }),
      vibeBus.on(VIBE_EVENTS.AI_TOOL_CALL, (data) => {
        setActivity({ type: 'tool', tool: data.tool, message: `Tool: ${data.tool}`, timestamp: Date.now() });
      }),
    ];

    return () => unsubscribers.forEach(fn => fn());
  }, []);

  // Send methods
  const send = useCallback((type, payload) => {
    // Try WebSocket first
    if (wsRef.current?.isConnected) {
      wsRef.current.send(type, payload);
    }
    // Fallback to local bus
    vibeBus.emit(type, payload);
  }, []);

  const broadcastAIThinking = useCallback((message) => {
    send(VIBE_EVENTS.AI_THINKING, { message });
  }, [send]);

  const broadcastAIResponse = useCallback((message, chunks = []) => {
    send(VIBE_EVENTS.AI_RESPONSE, { message, chunks });
  }, [send]);

  const broadcastToolCall = useCallback((tool, args) => {
    send(VIBE_EVENTS.AI_TOOL_CALL, { tool, args });
  }, [send]);

  const broadcastToolResult = useCallback((tool, result) => {
    send(VIBE_EVENTS.AI_TOOL_RESULT, { tool, result });
  }, [send]);

  const broadcastCodeChange = useCallback((file, change) => {
    send(VIBE_EVENTS.CODE_CHANGE, { file, change });
  }, [send]);

  const broadcastDBChange = useCallback((operation, table, record) => {
    send(VIBE_EVENTS.DB_INSERT, { operation, table, record });
  }, [send]);

  return {
    // Connection state
    isConnected,
    isLocal: !isConnected,

    // Current activity
    activity,

    // Recent events
    events,

    // Recent errors
    errors,

    // Send methods
    send,
    broadcastAIThinking,
    broadcastAIResponse,
    broadcastToolCall,
    broadcastToolResult,
    broadcastCodeChange,
    broadcastDBChange,

    // Event bus reference
    bus: vibeBus,
  };
}

// ─── Activity Feed Component ─────────────────────────────────────────────────

export function AIActivityFeed({ activity, events, maxEvents = 10 }) {
  if (!activity && events.length === 0) {
    return (
      <div style={{
        padding: '12px',
        color: '#64748b',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        Waiting for AI activity...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '12px',
      maxHeight: '200px',
      overflowY: 'auto'
    }}>
      {activity && (
        <ActivityItem
          type={activity.type}
          message={activity.message}
          tool={activity.tool}
          timestamp={activity.timestamp}
        />
      )}
      {events.slice(-maxEvents).reverse().map((event, i) => (
        <ActivityItem
          key={i}
          type={event.type}
          data={event.data}
          timestamp={event.timestamp}
        />
      ))}
    </div>
  );
}

function ActivityItem({ type, message, data, tool, timestamp }) {
  const icons = {
    thinking: '🤔',
    response: '💬',
    tool: '🔧',
    complete: '✅',
    error: '❌',
    db_insert: '📝',
    db_update: '✏️',
    db_delete: '🗑️',
    code_change: '📄',
  };

  const colors = {
    thinking: '#f59e0b',
    response: '#8b5cf6',
    tool: '#06b6d4',
    complete: '#10b981',
    error: '#ef4444',
    db_insert: '#3b82f6',
    db_update: '#8b5cf6',
    db_delete: '#ef4444',
    code_change: '#10b981',
  };

  const label = type?.replace('ai:', '').replace('db:', '').replace('code:', '') || 'event';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderRadius: '6px',
      fontSize: '11px'
    }}>
      <span style={{ fontSize: '14px' }}>{icons[type] || '📡'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#f8fafc', fontWeight: 500 }}>
          {message || (tool ? `Tool: ${tool}` : label)}
        </div>
        {data && (
          <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
            {typeof data === 'string' ? data : JSON.stringify(data)?.slice(0, 50)}
          </div>
        )}
      </div>
      <span style={{ color: '#475569', fontSize: '9px' }}>
        {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
      </span>
    </div>
  );
}

export default {
  VibeWebSocket,
  VibeSSE,
  vibeBus,
  useVibeRealtime,
  AIActivityFeed,
  VIBE_EVENTS,
};
