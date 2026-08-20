import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AlertTriangle, CheckCircle, Info, XCircle, HelpCircle, X, ShieldAlert } from 'lucide-react';

let globalModalSubscriber = null;

// Helper to trigger Enterprise Modal
export const showEnterpriseModal = ({
  title,
  message,
  type = 'warning',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirm = false
}) => {
  if (globalModalSubscriber) {
    globalModalSubscriber({
      isOpen: true,
      title: title || (type === 'error' ? 'Validation Error' : type === 'warning' ? 'Action Required' : isConfirm ? 'Confirm Action' : 'System Notification'),
      message: String(message || ''),
      type,
      confirmText,
      cancelText,
      isConfirm,
      onConfirm: () => {
        if (globalModalSubscriber) globalModalSubscriber(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm(true);
      },
      onCancel: () => {
        if (globalModalSubscriber) globalModalSubscriber(prev => ({ ...prev, isOpen: false }));
        if (onCancel) onCancel(false);
      }
    });
  } else {
    // Fallback to toast if modal root component is unmounted
    if (type === 'error') toast.error(message);
    else if (type === 'warning') toast(message, { icon: '⚠️' });
    else toast(message);
  }
};

// Global Interceptor Setup for window.alert and window.confirm
if (typeof window !== 'undefined' && !window.__enterprise_dialog_installed) {
  window.__enterprise_dialog_installed = true;

  // Store original methods
  window._nativeAlert = window.alert;
  window._nativeConfirm = window.confirm;

  // Global window.alert override
  window.alert = (message) => {
    // Trigger Enterprise UI Toast & Modal
    toast(String(message || ''), {
      icon: '⚠️',
      style: {
        borderRadius: '12px',
        background: '#714B67',
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.9rem',
        boxShadow: '0 10px 25px rgba(113, 75, 103, 0.4)'
      },
      duration: 4000
    });

    showEnterpriseModal({
      title: 'Attention Required',
      message: String(message || ''),
      type: 'warning',
      confirmText: 'Acknowledge'
    });
  };

  // Global window.confirm override for custom async calls
  window.enterpriseConfirm = (message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      showEnterpriseModal({
        title,
        message: String(message || ''),
        type: 'confirm',
        isConfirm: true,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  };
}

export const EnterpriseDialogContainer = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'OK',
    cancelText: 'Cancel',
    isConfirm: false,
    onConfirm: null,
    onCancel: null
  });

  useEffect(() => {
    globalModalSubscriber = setModalState;
    return () => {
      globalModalSubscriber = null;
    };
  }, []);

  if (!modalState.isOpen) {
    return null;
  }

  const getTypeTheme = () => {
    switch (modalState.type) {
      case 'error':
        return {
          headerBg: 'linear-gradient(135deg, #dc3545 0%, #b02a37 100%)',
          icon: <XCircle size={28} color="white" />,
          accentColor: '#dc3545',
          pillBg: 'rgba(220, 53, 69, 0.1)',
          pillText: '#dc3545'
        };
      case 'confirm':
        return {
          headerBg: 'linear-gradient(135deg, #714B67 0%, #5B3D53 100%)',
          icon: <HelpCircle size={28} color="white" />,
          accentColor: '#714B67',
          pillBg: 'rgba(113, 75, 103, 0.1)',
          pillText: '#714B67'
        };
      case 'success':
        return {
          headerBg: 'linear-gradient(135deg, #00A09D 0%, #017E84 100%)',
          icon: <CheckCircle size={28} color="white" />,
          accentColor: '#00A09D',
          pillBg: 'rgba(0, 160, 157, 0.1)',
          pillText: '#00A09D'
        };
      case 'warning':
      default:
        return {
          headerBg: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
          icon: <AlertTriangle size={28} color="white" />,
          accentColor: '#fd7e14',
          pillBg: 'rgba(253, 126, 20, 0.1)',
          pillText: '#fd7e14'
        };
    }
  };

  const theme = getTypeTheme();

  return (
    <>

      {/* BACKDROP OVERLAY */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'grid',
          placeItems: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => {
          if (!modalState.isConfirm && modalState.onCancel) {
            modalState.onCancel();
          }
        }}
      >
        {/* ENTERPRISE MODAL CARD */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '460px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div style={{ 
            background: theme.headerBg, 
            padding: '20px 24px', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {theme.icon}
              </div>
              <div>
                <span style={{ 
                  fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', 
                  letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)' 
                }}>
                  Enterprise System Dialog
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {modalState.title}
                </h3>
              </div>
            </div>

            <button 
              onClick={() => modalState.onCancel && modalState.onCancel()}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                width: '30px', height: '30px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <X size={16} />
            </button>
          </div>

          {/* BODY */}
          <div style={{ padding: '24px 26px', color: '#334155' }}>
            <div style={{ 
              fontSize: '0.96rem', 
              fontWeight: 600, 
              lineHeight: 1.55, 
              color: '#1e293b',
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {modalState.message}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div style={{ 
            padding: '16px 24px 20px', 
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex', 
            justify: 'flex-end', 
            gap: '12px' 
          }}>
            {modalState.isConfirm && (
              <button
                onClick={() => modalState.onCancel && modalState.onCancel()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                {modalState.cancelText}
              </button>
            )}

            <button
              onClick={() => modalState.onConfirm && modalState.onConfirm()}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#714B67',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(113, 75, 103, 0.35)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5B3D53';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#714B67';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {modalState.confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};
