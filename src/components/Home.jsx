import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock, Map, TrendingUp, Users, Zap, MessageSquare } from 'lucide-react';
import { getSupabaseClient, isSupabaseReady } from '../utils/supabaseManualDB.js';
import { acknowledgeAndon, getShopFloorRealtimeSnapshot } from '../utils/supabaseFrontlineDB.js';
import ChatWidget from './ChatWidget';
import { getCurrentUser } from '../utils/auth';

const Home = () => {
  const [activeAndons, setActiveAndons] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [oeeToday, setOeeToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const showChatRef = React.useRef(showChat);
  const currentUser = getCurrentUser()?.name || 'Manager';

  useEffect(() => {
    showChatRef.current = showChat;
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const refreshSnapshot = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Snapshot fetch timeout')), 3000)
      );
      const snap = await Promise.race([getShopFloorRealtimeSnapshot(), timeoutPromise]);
      setWorkstations(snap.workstations || []);
      setActiveAndons(snap.activeAndons || []);
      setOeeToday(typeof snap.oee === 'number' ? snap.oee : 0);
    } catch (err) {
      console.warn('[Home] Failed or timed out fetching realtime snapshot', err);
      // Fallback gracefully without blocking UI
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let realtimeChannel = null;
    let pollingInterval = null;

    const initial = async () => {
      if (!isMounted) return;
      await refreshSnapshot();
    };

    initial();

    if (!isSupabaseReady()) {
      console.warn('[Home] Supabase is not configured. Realtime features (Chat, Notifications) will be disabled.');
      pollingInterval = setInterval(() => refreshSnapshot({ silent: true }), 10000);
      return () => {
        isMounted = false;
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }

    const supabase = getSupabaseClient();

    try {
      realtimeChannel = supabase
        .channel(`shop-floor-home-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_queue' }, () => {
          refreshSnapshot({ silent: true });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
          refreshSnapshot({ silent: true });
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (!pollingInterval) {
              pollingInterval = setInterval(() => refreshSnapshot({ silent: true }), 10000);
            }
          }
        });

      // Safety polling for environments where realtime may be blocked.
      pollingInterval = setInterval(() => refreshSnapshot({ silent: true }), 10000);
    } catch (e) {
      console.warn('[Home] Realtime subscription unavailable, fallback polling only.', e);
      pollingInterval = setInterval(() => refreshSnapshot({ silent: true }), 10000);
    }

    // Chat Notification Listener
    const chatChannel = supabase
      .channel('chat_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        const msg = payload.new;
        // If chat is closed, increment unread count
        if (!showChatRef.current) {
          setUnreadCount(prev => prev + 1);
          // Play a subtle notification sound
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play();
          } catch (e) {}
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
      if (realtimeChannel) {
        try {
          realtimeChannel.unsubscribe();
        } catch (e) {
          console.warn('[Home] Failed to unsubscribe realtime channel', e);
        }
      }
      if (chatChannel) chatChannel.unsubscribe();
    };
  }, [showChat]);

  // Timer to update "Elapsed Time" for active Andons
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    if (activeAndons.length === 0) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeAndons.length]);

  const formatElapsed = (startTime) => {
    const seconds = Math.floor((currentTime - startTime) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', accent: '#2563eb', icon: <Activity size={14} /> };
      case 'READY': return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', accent: '#94a3b8', icon: <CheckCircle2 size={14} /> };
      case 'DOWN': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', accent: '#ef4444', icon: <AlertCircle size={14} /> };
      default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', accent: '#94a3b8', icon: <Clock size={14} /> };
    }
  };

  const getInitials = (name) => {
    if (!name || name === 'N/A') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div style={{ 
      padding: '30px', 
      backgroundColor: '#f8fafc', 
      minHeight: '100%', 
      fontFamily: "'Inter', sans-serif",
      width: '100%',
      boxSizing: 'border-box'
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Map size={28} color="#3b82f6" /> Shop Floor Overview
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Real-time monitoring and Andon response dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ backgroundColor: 'white', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>OEE Today</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{oeeToday}%</span>
          </div>
          <div style={{ backgroundColor: 'white', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Andons</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: activeAndons.length > 0 ? '#ef4444' : '#22c55e' }}>{activeAndons.length}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ marginBottom: '20px', color: '#475569', fontWeight: 600 }}>Loading realtime dashboard...</div>
      )}
      {error && (
        <div style={{ marginBottom: '20px', color: '#b91c1c', fontWeight: 700 }}>{error}</div>
      )}

      {/* ACTIVE ALERTS SECTION */}
      {activeAndons.length > 0 && (
        <div style={{ marginBottom: '35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 2s infinite' }} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>Action Required: Active Andon Alerts</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {activeAndons.map(andon => (
              <div key={andon.id} style={{ backgroundColor: '#fee2e2', border: '2px solid #ef4444', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)' }}>
                <div style={{ backgroundColor: '#ef4444', padding: '12px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{andon.workstation}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace' }}>{formatElapsed(andon.startTime)}</div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>{andon.category}</div>
                  {andon.detail && <p style={{ fontSize: '0.9rem', color: '#7f1d1d', margin: 0 }}>"{andon.detail}"</p>}

                  <button
                    style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    onClick={async () => {
                      try {
                        await acknowledgeAndon({
                          workstation: andon.workstation,
                          category: andon.category,
                          detail: andon.detail,
                          user: 'System Admin'
                        });
                        await refreshSnapshot({ silent: true });
                      } catch (err) {
                        console.error('[Home] Failed to acknowledge andon', err);
                        alert('Gagal ACK Andon. Cek koneksi Supabase.');
                      }
                    }}
                  >
                    ACKNOWLEDGE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORKSTATION GRID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Live Stations</h2>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} /> Running</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} /> Idle</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> Down</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {workstations.map(ws => {
          const conf = getStatusColor(ws.status);
          const progress = ws.expectedOutput > 0 ? Math.round((ws.actualOutput / ws.expectedOutput) * 100) : 0;
          const isDown = ws.status === 'DOWN';
          const isRunning = ws.status === 'RUNNING';

          return (
            <div
              key={ws.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: `1px solid ${conf.border}`,
                boxShadow: isDown ? '0 10px 25px -5px rgba(239, 68, 68, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transition: 'all 0.2s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Status Header Bar */}
              <div style={{ height: '6px', backgroundColor: conf.accent }} />

              <div style={{ padding: '20px' }}>
                {/* Station Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                       <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ws.isOnline ? '#22c55e' : '#cbd5e1', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0' }} />
                       <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ws.id}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '30px', backgroundColor: conf.bg, color: conf.text, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${conf.border}` }}>
                    {conf.icon} {ws.status}
                  </div>
                </div>

                {/* Operator Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900 }}>
                    {getInitials(ws.operator)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Operator</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.operator}</div>
                  </div>
                </div>

                {/* App Status Section */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Active Application</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isRunning ? '#2563eb' : '#64748b', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Zap size={16} /> {ws.activeApp}
                      </div>
                    </div>
                    {isRunning && (
                       <div>
                         <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Current Step</div>
                         <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{ws.activeStep}</div>
                       </div>
                    )}
                  </div>
                </div>

                {/* Progress / Job Section */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                   {ws.currentJob ? (
                     <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                           <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Job: <span style={{ color: '#0f172a' }}>{ws.currentJob}</span></span>
                           <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{ws.actualOutput} <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ {ws.expectedOutput}</span></span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                           <div style={{ height: '100%', width: `${progress}%`, backgroundColor: conf.accent, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                     </>
                   ) : (
                     <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> Ready for next assignment
                     </div>
                   )}
                </div>
              </div>

              {/* Down Indicator Overlay */}
              {isDown && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '3px solid #ef4444', borderRadius: '16px', pointerEvents: 'none', animation: 'pulse-border 2s infinite' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* CHAT WIDGET */}
      {!showChat ? (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
          {unreadCount > 0 && (
            <div style={{ 
              position: 'absolute', top: '-5px', right: '-5px', 
              backgroundColor: '#ef4444', color: 'white', 
              borderRadius: '50%', width: '22px', height: '22px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 900, border: '2px solid white',
              zIndex: 1001
            }}>
              {unreadCount}
            </div>
          )}
          <button 
            onClick={() => {
              setShowChat(true);
              setUnreadCount(0);
            }}
            style={{ 
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#001e3c', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageSquare size={24} />
          </button>
        </div>
      ) : (
        <ChatWidget 
          currentStation="SUPERVISOR"
          currentUser={currentUser}
          onClose={() => setShowChat(false)}
        />
      )}

    </div>
  );
};

// Global style for the pulse animation if it doesn't exist
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    @keyframes pulse-border {
      0% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { border-color: rgba(239, 68, 68, 1); box-shadow: 0 0 20px 2px rgba(239, 68, 68, 0.6); }
      100% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    }
  `;
  document.head.appendChild(style);
}

export default Home;
