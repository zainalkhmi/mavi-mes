import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock, Map, TrendingUp, Users, Zap, MessageSquare, Shield, Radio, RefreshCw, Cpu, Server } from 'lucide-react';
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
        if (!showChatRef.current) {
          setUnreadCount(prev => prev + 1);
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
      case 'RUNNING': return { 
        bg: '#e6f7f7', text: '#00A09D', border: '#b2e5e4', accent: '#00A09D', 
        shadow: 'rgba(0, 160, 157, 0.15)', icon: <Activity size={14} className="animate-spin-slow" /> 
      };
      case 'READY': return { 
        bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef', accent: '#875A7B', 
        shadow: 'rgba(135, 90, 123, 0.1)', icon: <CheckCircle2 size={14} /> 
      };
      case 'DOWN': return { 
        bg: '#fdf2f2', text: '#d9534f', border: '#f7c6c5', accent: '#d9534f', 
        shadow: 'rgba(217, 83, 79, 0.2)', icon: <AlertCircle size={14} /> 
      };
      default: return { 
        bg: '#f8f9fa', text: '#6c757d', border: '#e9ecef', accent: '#875A7B', 
        shadow: 'rgba(135, 90, 123, 0.1)', icon: <Clock size={14} /> 
      };
    }
  };

  const getInitials = (name) => {
    if (!name || name === 'N/A') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const onlineCount = workstations.filter(w => w.isOnline).length;
  const runningCount = workstations.filter(w => w.status === 'RUNNING').length;

  return (
    <div style={{ 
      padding: '30px 36px', 
      backgroundColor: '#f8f9fa', 
      minHeight: '100%', 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      width: '100%',
      boxSizing: 'border-box',
      color: '#212529'
    }}>

      {/* ODOO STYLE HEADER BAR */}
      <div style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 10px', borderRadius: '16px', backgroundColor: 'rgba(113, 75, 103, 0.1)',
              border: '1px solid rgba(113, 75, 103, 0.2)', color: '#714B67', fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.03em', textTransform: 'uppercase'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00A09D' }} />
              Odoo Manufacturing MES Live
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#212529', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Map size={28} color="#714B67" /> Shop Floor Overview
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '0.88rem' }}>
            Real-time work center telemetry, operator status, and Andon response dashboard
          </p>
        </div>

        {/* METRIC BADGES HEADER */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* OEE METRIC */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            padding: '12px 20px', borderRadius: '12px', 
            border: '1px solid #e9ecef', 
            display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              backgroundColor: 'rgba(0, 160, 157, 0.1)', border: '1px solid rgba(0, 160, 157, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A09D' 
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OEE Today</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#212529', lineHeight: 1.1 }}>{oeeToday}%</div>
            </div>
          </div>

          {/* ACTIVE ANDONS METRIC */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            padding: '12px 20px', borderRadius: '12px', 
            border: activeAndons.length > 0 ? '1px solid #f7c6c5' : '1px solid #e9ecef', 
            display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: activeAndons.length > 0 ? '0 4px 12px rgba(217, 83, 79, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              backgroundColor: activeAndons.length > 0 ? 'rgba(217, 83, 79, 0.15)' : 'rgba(40, 167, 69, 0.1)', 
              border: activeAndons.length > 0 ? '1px solid rgba(217, 83, 79, 0.3)' : '1px solid rgba(40, 167, 69, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: activeAndons.length > 0 ? '#d9534f' : '#28a745' 
            }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Andons</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: activeAndons.length > 0 ? '#d9534f' : '#28a745', lineHeight: 1.1 }}>{activeAndons.length}</div>
            </div>
          </div>

          {/* STATIONS STATS */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            padding: '12px 20px', borderRadius: '12px', 
            border: '1px solid #e9ecef', 
            display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              backgroundColor: 'rgba(113, 75, 103, 0.1)', border: '1px solid rgba(113, 75, 103, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#714B67' 
            }}>
              <Cpu size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Centers Online</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#212529', lineHeight: 1.1 }}>{onlineCount} <span style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 500 }}>/ {workstations.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', 
          backgroundColor: 'rgba(0, 160, 157, 0.08)', border: '1px solid rgba(0, 160, 157, 0.2)',
          padding: '10px 16px', borderRadius: '8px', color: '#00A09D', fontSize: '0.82rem', fontWeight: 700 
        }}>
          <RefreshCw size={15} className="animate-spin" /> Synchronizing live Odoo work center data...
        </div>
      )}
      {error && (
        <div style={{ 
          marginBottom: '20px', backgroundColor: '#fdf2f2', border: '1px solid #f7c6c5',
          padding: '10px 16px', borderRadius: '8px', color: '#d9534f', fontSize: '0.82rem', fontWeight: 700 
        }}>{error}</div>
      )}

      {/* ACTIVE ALERTS SECTION */}
      {activeAndons.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d9534f', animation: 'pulse 1.5s infinite' }} />
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#d9534f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Action Required: Active Andon Alerts ({activeAndons.length})
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {activeAndons.map(andon => (
              <div key={andon.id} style={{ 
                backgroundColor: '#ffffff', 
                border: '2px solid #d9534f', borderRadius: '12px', 
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(217, 83, 79, 0.15)',
                position: 'relative'
              }}>
                <div style={{ 
                  backgroundColor: '#714B67', padding: '12px 18px', color: 'white', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> {andon.workstation}
                  </div>
                  <div style={{ 
                    fontSize: '1.05rem', fontWeight: 800, fontFamily: 'monospace',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '3px 8px', borderRadius: '6px'
                  }}>
                    ⏱ {formatElapsed(andon.startTime)}
                  </div>
                </div>
                <div style={{ padding: '18px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d9534f', marginBottom: '6px' }}>{andon.category}</div>
                  {andon.detail && (
                    <p style={{ fontSize: '0.88rem', color: '#495057', margin: 0, backgroundColor: '#f8f9fa', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                      "{andon.detail}"
                    </p>
                  )}

                  <button
                    style={{ 
                      marginTop: '16px', width: '100%', padding: '10px', 
                      backgroundColor: '#714B67', color: 'white', border: 'none', 
                      borderRadius: '8px', fontWeight: 800, cursor: 'pointer', 
                      fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                      boxShadow: '0 3px 10px rgba(113, 75, 103, 0.3)', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#5B3D53'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#714B67'; }}
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
                    ACKNOWLEDGE ALERT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORKSTATION GRID TITLE & LEGEND */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '20px', flexWrap: 'wrap', gap: '12px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#212529' }}>
            Work Centers Status
          </h2>
          <span style={{ 
            fontSize: '0.72rem', fontWeight: 700, color: '#714B67', 
            backgroundColor: 'rgba(113, 75, 103, 0.1)', padding: '2px 8px', borderRadius: '10px',
            border: '1px solid rgba(113, 75, 103, 0.2)'
          }}>
            {workstations.length} Configured
          </span>
        </div>

        <div style={{ 
          display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#6c757d', fontWeight: 700,
          backgroundColor: '#ffffff', padding: '6px 14px', borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00A09D' }} /> Running ({runningCount})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6c757d' }} /> Idle
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d9534f' }} /> Down
          </div>
        </div>
      </div>

      {/* ODOO STYLE WORKSTATION CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
        {workstations.map(ws => {
          const conf = getStatusColor(ws.status);
          const progress = ws.expectedOutput > 0 ? Math.round((ws.actualOutput / ws.expectedOutput) * 100) : 0;
          const isDown = ws.status === 'DOWN';
          const isRunning = ws.status === 'RUNNING';

          return (
            <div
              key={ws.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: isDown ? '2px solid #d9534f' : isRunning ? '1px solid #00A09D' : '1px solid #e9ecef',
                boxShadow: isDown ? '0 8px 20px rgba(217, 83, 79, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = isDown ? '0 12px 28px rgba(217, 83, 79, 0.25)' : '0 8px 20px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = isDown ? '0 8px 20px rgba(217, 83, 79, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              {/* Odoo Top Ribbon Accent */}
              <div style={{ height: '4px', backgroundColor: conf.accent }} />

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Station Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                       <div style={{ 
                         width: '7px', height: '7px', borderRadius: '50%', 
                         backgroundColor: ws.isOnline ? '#00A09D' : '#6c757d' 
                       }} />
                       <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                         {ws.id}
                       </span>
                    </div>
                    <h3 style={{ 
                      margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#212529', 
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {ws.name}
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', 
                    borderRadius: '16px', backgroundColor: conf.bg, color: conf.text, 
                    fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${conf.border}`,
                    flexShrink: 0
                  }}>
                    {conf.icon} {ws.status}
                  </div>
                </div>

                {/* Operator Card */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', 
                  backgroundColor: '#f8f9fa', border: '1px solid #e9ecef',
                  borderRadius: '10px', marginBottom: '16px' 
                }}>
                  <div style={{ 
                    width: '34px', height: '34px', borderRadius: '8px', 
                    backgroundColor: ws.operator && ws.operator !== 'N/A' ? '#714B67' : '#6c757d', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '0.82rem', fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {getInitials(ws.operator)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase' }}>Operator</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ws.operator || 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* App Status Section */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Active Work Order App
                      </div>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '7px', 
                        color: isRunning ? '#714B67' : '#495057', fontWeight: 700, fontSize: '0.9rem',
                        backgroundColor: isRunning ? 'rgba(113, 75, 103, 0.08)' : 'transparent',
                        padding: isRunning ? '5px 8px' : '0', borderRadius: '6px'
                      }}>
                        <Zap size={15} color={isRunning ? '#714B67' : '#6c757d'} /> {ws.activeApp || 'None'}
                      </div>
                    </div>

                    {isRunning && ws.activeStep && (
                       <div>
                         <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', marginBottom: '2px' }}>Current Operation</div>
                         <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#212529' }}>{ws.activeStep}</div>
                       </div>
                    )}
                  </div>
                </div>

                {/* Progress / Job Section */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #e9ecef' }}>
                   {ws.currentJob ? (
                     <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                           <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6c757d' }}>WO: <span style={{ color: '#212529', fontWeight: 800 }}>{ws.currentJob}</span></span>
                           <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#212529' }}>{ws.actualOutput} <span style={{ color: '#6c757d', fontWeight: 400 }}>/ {ws.expectedOutput}</span></span>
                        </div>
                        <div style={{ height: '7px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                           <div style={{ 
                             height: '100%', width: `${progress}%`, 
                             backgroundColor: conf.accent, 
                             transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                           }} />
                        </div>
                     </>
                   ) : (
                     <div style={{ fontSize: '0.78rem', color: '#6c757d', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#6c757d" /> Ready for work order assignment
                     </div>
                   )}
                </div>
              </div>

              {/* Down Indicator Border Overlay */}
              {isDown && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid #d9534f', borderRadius: '12px', pointerEvents: 'none', animation: 'pulse-border 2s infinite' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* CHAT WIDGET BUTTON (ODOO PURPLE BRAND) */}
      {!showChat ? (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
          {unreadCount > 0 && (
            <div style={{ 
              position: 'absolute', top: '-5px', right: '-5px', 
              backgroundColor: '#d9534f', color: 'white', 
              borderRadius: '50%', width: '22px', height: '22px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, border: '2px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
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
              width: '56px', height: '56px', borderRadius: '50%', 
              backgroundColor: '#714B67', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              border: 'none',
              boxShadow: '0 6px 20px rgba(113, 75, 103, 0.4)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#5B3D53'; e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#714B67'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <MessageSquare size={22} />
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
    .animate-spin-slow {
      animation: spin 3s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default Home;
