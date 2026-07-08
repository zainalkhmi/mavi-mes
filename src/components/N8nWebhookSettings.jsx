import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Webhook,
  Save,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  Zap,
  Info,
  Trash2,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import n8nWebhook, { N8N_EVENT_TYPES } from '../utils/n8nWebhookService';

const N8nWebhookSettings = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(n8nWebhook.getConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [deliveryLog, setDeliveryLog] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Load delivery log
  useEffect(() => {
    setDeliveryLog(n8nWebhook.getDeliveryLog());
    const unsub = n8nWebhook.addListener((event) => {
      if (event === 'delivered' || event === 'failed' || event === 'log_cleared') {
        setDeliveryLog(n8nWebhook.getDeliveryLog());
      }
    });
    return unsub;
  }, []);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    setFeedback(null);
    try {
      n8nWebhook.updateConfig(config);
      setFeedback({ success: true, message: 'Webhook settings saved successfully!' });
      toast.success('n8n Webhook settings saved!');
    } catch (err) {
      setFeedback({ success: false, message: err.message });
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }, [config]);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      // Save first so the URL is persisted
      n8nWebhook.updateConfig(config);
      const result = await n8nWebhook.testConnection();
      if (result.success) {
        setFeedback({ success: true, message: `✅ Test event delivered! (HTTP ${result.statusCode})` });
        toast.success('Test event delivered to n8n!');
      } else {
        setFeedback({ success: false, message: `❌ Test failed: ${result.error}` });
        toast.error('Test failed: ' + result.error);
      }
    } catch (err) {
      setFeedback({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
      setDeliveryLog(n8nWebhook.getDeliveryLog());
    }
  }, [config]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all n8n webhook settings to defaults?')) {
      const defaults = n8nWebhook.resetConfig();
      setConfig(defaults);
      toast.success('Settings reset to defaults');
    }
  }, []);

  const toggleSubscription = useCallback((eventKey) => {
    setConfig(prev => ({
      ...prev,
      subscriptions: {
        ...prev.subscriptions,
        [eventKey]: !prev.subscriptions[eventKey]
      }
    }));
  }, []);

  const selectAllEvents = useCallback(() => {
    const allOn = Object.fromEntries(N8N_EVENT_TYPES.map(e => [e.key, true]));
    setConfig(prev => ({ ...prev, subscriptions: allOn }));
  }, []);

  const deselectAllEvents = useCallback(() => {
    const allOff = Object.fromEntries(N8N_EVENT_TYPES.map(e => [e.key, false]));
    setConfig(prev => ({ ...prev, subscriptions: allOff }));
  }, []);

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '6px',
    border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: "'Inter', monospace",
    backgroundColor: '#fff', color: '#1f2937', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s'
  };

  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#374151', marginBottom: '6px', letterSpacing: '0.02em'
  };

  const cardStyle = {
    padding: '20px 24px', borderRadius: '8px', border: '1px solid #e5e7eb',
    backgroundColor: '#fff'
  };

  const sectionTitleStyle = {
    fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0'
  };

  const sectionDescStyle = {
    fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.5
  };

  const subscribedCount = Object.values(config.subscriptions).filter(Boolean).length;

  return (
    <div style={{
      flex: 1, minHeight: 0, width: '100%', backgroundColor: '#f8f9fa', color: '#495057',
      display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Top Navbar */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #dee2e6', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 20px', borderRadius: '4px', backgroundColor: '#7c3aed', color: '#fff',
              border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s',
              opacity: isSaving ? 0.7 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Save size={15} />
            {isSaving ? 'SAVING...' : 'SAVE'}
          </button>
          <button
            onClick={handleTest}
            disabled={isTesting || !config.webhookUrl}
            style={{
              padding: '8px 20px', borderRadius: '4px', backgroundColor: '#059669', color: '#fff',
              border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s',
              opacity: (isTesting || !config.webhookUrl) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Send size={15} />
            {isTesting ? 'TESTING...' : 'TEST CONNECTION'}
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 20px', borderRadius: '4px', backgroundColor: '#fff', color: '#495057',
              border: '1px solid #dee2e6', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer'
            }}
          >
            BACK
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6', margin: '0 8px' }}></div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#495057' }}>n8n / Webhook Integration</h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent',
            color: '#adb5bd', cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '280px', backgroundColor: '#f0f2f5', borderRight: '1px solid #dee2e6',
          display: 'flex', flexDirection: 'column', padding: '16px 0', flexShrink: 0
        }}>
          <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #dee2e6', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Webhook size={18} />
            </div>
            <span style={{ fontSize: '0.950rem', fontWeight: 600, color: '#495057' }}>n8n Webhook</span>
          </div>
          <div style={{ padding: '0 24px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px 0' }}>
              Connect Mavi MES to <strong>n8n</strong> workflow automation for real-time event notifications.
            </p>
            <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>
              Events: {subscribedCount}/{N8N_EVENT_TYPES.length} active
            </p>
            <div style={{
              padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem',
              backgroundColor: config.enabled && config.webhookUrl ? '#ecfdf5' : '#fef3c7',
              color: config.enabled && config.webhookUrl ? '#065f46' : '#92400e',
              border: `1px solid ${config.enabled && config.webhookUrl ? '#a7f3d0' : '#fde68a'}`,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {config.enabled && config.webhookUrl ? <><Zap size={13} /> Active</> : <><AlertCircle size={13} /> Inactive</>}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
            <a
              href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#6366f1', textDecoration: 'none', marginBottom: '8px' }}
            >
              <ExternalLink size={13} /> n8n Webhook Docs
            </a>
            <button
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem',
                color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0
              }}
            >
              <RefreshCw size={13} /> Reset to Defaults
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, backgroundColor: '#fff', overflowY: 'auto' }}>
          <div style={{ padding: '32px 48px', maxWidth: '900px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* Feedback Banner */}
              {feedback && (
                <div style={{
                  padding: '12px 16px', borderRadius: '6px',
                  border: `1px solid ${feedback.success ? '#a7f3d0' : '#fecaca'}`,
                  backgroundColor: feedback.success ? '#ecfdf5' : '#fef2f2',
                  color: feedback.success ? '#065f46' : '#991b1b',
                  display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem'
                }}>
                  {feedback.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {feedback.message}
                </div>
              )}

              {/* Section: Enable & URL */}
              <div style={cardStyle}>
                <h3 style={sectionTitleStyle}>Webhook Configuration</h3>
                <p style={sectionDescStyle}>
                  Enter your n8n Webhook URL. Create a Webhook node in n8n and copy the Production URL.
                </p>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Enable Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{
                      position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '24px',
                        backgroundColor: config.enabled ? '#7c3aed' : '#d1d5db',
                        transition: 'background-color 0.2s'
                      }}>
                        <span style={{
                          position: 'absolute', content: '""', height: '18px', width: '18px',
                          left: config.enabled ? '23px' : '3px', bottom: '3px',
                          backgroundColor: '#fff', borderRadius: '50%',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </span>
                    </label>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: config.enabled ? '#7c3aed' : '#6b7280' }}>
                      {config.enabled ? 'Webhook Enabled' : 'Webhook Disabled'}
                    </span>
                  </div>

                  {/* Webhook URL */}
                  <div>
                    <label style={labelStyle}>Webhook URL *</label>
                    <input
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://your-n8n.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                      Use the <strong>Production URL</strong> from your n8n Webhook node (not the Test URL).
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label style={labelStyle}>
                      <ShieldCheck size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Secret Key (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={config.secretKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="Enter a secret key for HMAC-SHA256 signature"
                        style={{ ...inputStyle, paddingRight: '40px' }}
                        onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        style={{
                          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px'
                        }}
                      >
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                      If set, every webhook request includes an <code style={{ backgroundColor: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>X-Mavi-Signature</code> header for verification.
                    </p>
                  </div>

                  {/* Include Metadata Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="includeMetadata"
                      checked={config.includeMetadata}
                      onChange={(e) => setConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#7c3aed' }}
                    />
                    <label htmlFor="includeMetadata" style={{ fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
                      Include metadata (station, operator, app_id) in payload
                    </label>
                  </div>
                </div>
              </div>

              {/* Section: Event Subscriptions */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={sectionTitleStyle}>Event Subscriptions</h3>
                    <p style={sectionDescStyle}>
                      Choose which MES events fire a webhook to n8n. ({subscribedCount}/{N8N_EVENT_TYPES.length} active)
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={selectAllEvents} style={{
                      padding: '4px 10px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb',
                      fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', color: '#374151'
                    }}>Select All</button>
                    <button onClick={deselectAllEvents} style={{
                      padding: '4px 10px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb',
                      fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', color: '#374151'
                    }}>Deselect All</button>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '8px'
                }}>
                  {N8N_EVENT_TYPES.map(evt => {
                    const isChecked = config.subscriptions[evt.key] !== false;
                    return (
                      <label
                        key={evt.key}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                          border: `1px solid ${isChecked ? '#c4b5fd' : '#e5e7eb'}`,
                          backgroundColor: isChecked ? '#f5f3ff' : '#fafafa',
                          transition: 'all 0.15s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubscription(evt.key)}
                          style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: '#7c3aed', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isChecked ? '#5b21b6' : '#374151' }}>
                            {evt.label}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                            <code style={{ backgroundColor: '#f3f4f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.68rem' }}>
                              {evt.key}
                            </code>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>
                            {evt.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section: Delivery Log */}
              <div style={cardStyle}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowLog(!showLog)}
                >
                  <div>
                    <h3 style={sectionTitleStyle}>
                      <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      Delivery Log
                    </h3>
                    <p style={sectionDescStyle}>
                      {deliveryLog.length} entries — click to {showLog ? 'collapse' : 'expand'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {deliveryLog.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          n8nWebhook.clearDeliveryLog();
                          setDeliveryLog([]);
                          toast.success('Delivery log cleared');
                        }}
                        style={{
                          padding: '4px 10px', borderRadius: '4px', border: '1px solid #fecaca', backgroundColor: '#fef2f2',
                          fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', color: '#dc2626',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    )}
                    {showLog ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
                  </div>
                </div>

                {showLog && (
                  <div style={{ marginTop: '16px' }}>
                    {deliveryLog.length === 0 ? (
                      <div style={{
                        padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem',
                        backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px dashed #e5e7eb'
                      }}>
                        No webhook deliveries yet. Events will appear here after they are fired.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                        {deliveryLog.map((entry, i) => (
                          <div key={entry.id || i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 12px', borderRadius: '6px',
                            backgroundColor: entry.status === 'delivered' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${entry.status === 'delivered' ? '#bbf7d0' : '#fecaca'}`,
                            fontSize: '0.8rem'
                          }}>
                            {entry.status === 'delivered' ? (
                              <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                            ) : (
                              <XCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{
                                fontWeight: 600,
                                color: entry.status === 'delivered' ? '#166534' : '#991b1b'
                              }}>
                                {entry.event}
                              </span>
                              {entry.error && (
                                <span style={{ color: '#dc2626', marginLeft: '8px' }}>— {entry.error}</span>
                              )}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '0.72rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                              {entry.statusCode && `HTTP ${entry.statusCode} · `}
                              Attempt {entry.attempt} · {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section: Payload Preview */}
              <div style={cardStyle}>
                <h3 style={sectionTitleStyle}>
                  <Info size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Payload Format
                </h3>
                <p style={sectionDescStyle}>
                  Every webhook event sends a JSON payload in this format:
                </p>
                <pre style={{
                  marginTop: '12px', padding: '16px', borderRadius: '6px',
                  backgroundColor: '#1e1b4b', color: '#c4b5fd', fontSize: '0.78rem',
                  lineHeight: 1.6, overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  border: '1px solid #312e81'
                }}>
{JSON.stringify({
  event: "work_order.completed",
  timestamp: "2026-07-08T20:30:00.000Z",
  source: "mavi-mes",
  version: "1.0",
  data: {
    job_id: "uuid-xxx",
    work_order: "WO-2026-001",
    status: "COMPLETED"
  },
  metadata: {
    station: "Station-A",
    operator: "Operator-01"
  }
}, null, 2)}
                </pre>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Content-Type: application/json', 'X-Mavi-Event: <event_type>', 'X-Mavi-Source: mavi-mes', config.secretKey ? 'X-Mavi-Signature: sha256=...' : null].filter(Boolean).map((h, i) => (
                    <span key={i} style={{
                      padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f3f4f6',
                      fontSize: '0.72rem', fontFamily: 'monospace', color: '#4b5563', border: '1px solid #e5e7eb'
                    }}>{h}</span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nWebhookSettings;
