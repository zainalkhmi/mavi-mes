import React, { useState, useEffect } from 'react';
import { 
  Sparkles, X, Loader2, AlertCircle, TrendingUp, Info, 
  Lightbulb, Activity, CheckCircle2, Copy, MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getAnalysisInsight } from '../utils/aiService';
import { getPrimaryAiConnector } from '../utils/database';

const AiAnalysisInsight = ({ isOpen, onClose, data, config }) => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiConnector, setAiConnector] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadInsight();
    } else {
      setInsight('');
      setError('');
    }
  }, [isOpen]);

  const loadInsight = async () => {
    setLoading(true);
    setError('');
    try {
      const connector = await getPrimaryAiConnector();
      setAiConnector(connector);
      
      const settings = connector?.aiSettings || connector?.config;
      if (!connector || !settings) {
        throw new Error('AI Settings not found. Please configure AI in System Settings.');
      }

      const result = await getAnalysisInsight(data, config, connector);
      setInsight(result);
    } catch (err) {
      console.error('[AiAnalysisInsight] Error:', err);
      setError(err.message || 'Failed to generate AI insights.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        backgroundColor: 'white',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              padding: '10px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.5px' }}>AI Data Insights</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>
                Autonomous analysis for {config.xAxisColumn}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', backgroundColor: '#fcfcfd' }}>
          {loading ? (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <Loader2 size={48} color="#4f46e5" className="animate-spin" />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Activity size={20} color="#7c3aed" />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Analyzing Patterns...</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Searching for anomalies and trends in your dataset.</p>
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '32px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', display: 'flex', gap: '16px' }}>
              <AlertCircle color="#ef4444" size={24} style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>Analysis Interrupted</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#b91c1c' }}>{error}</p>
                <button 
                  onClick={loadInsight}
                  style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', cursor: 'pointer' }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#334155' }}>
              <style>{`
                .insight-content h1, .insight-content h2, .insight-content h3 { color: #0f172a; font-weight: 800; margin-top: 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
                .insight-content h2:nth-of-type(1)::before { content: '📊'; }
                .insight-content h2:nth-of-type(2)::before { content: '⚠️'; }
                .insight-content h2:nth-of-type(3)::before { content: '📈'; }
                .insight-content h2:nth-of-type(4)::before { content: '💡'; }
                .insight-content ul { padding-left: 20px; margin-bottom: 20px; }
                .insight-content li { margin-bottom: 8px; }
                .insight-content strong { color: #4f46e5; }
              `}</style>
              <div className="insight-content">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 32px', borderTop: '1px solid #f1f5f9', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <Activity size={14} />
            Powered by {aiConnector?.aiSettings?.provider || aiConnector?.config?.provider || 'Advanced AI'}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <button 
              onClick={() => {
                navigator.clipboard.writeText(insight);
                alert('Insights copied to clipboard!');
              }}
              style={{ padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Copy size={16} /> Copy
            </button>
            <button 
              onClick={onClose}
              style={{ padding: '10px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysisInsight;
