import React, { useEffect, useState, useMemo } from 'react';
import { useToasterStore, toast, Toaster, resolveValue } from 'react-hot-toast';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Loader2,
  X
} from 'lucide-react';

/**
 * Parses raw toast message:
 * 1. Categorizes type (Database, Andon, IoT, System, etc.)
 * 2. Strips duplicate leading emojis (❌, 💾, ⚠️, etc.) so icons don't double up
 */
function parseToastMessage(raw, toastType) {
  if (typeof raw !== 'string') {
    return {
      text: raw,
      category: toastType === 'error' ? 'SYSTEM ERROR' : toastType === 'success' ? 'SYSTEM SUCCESS' : 'NOTIFICATION',
      isWarning: false
    };
  }

  let text = raw.trim();
  const lower = text.toLowerCase();
  let category = null;
  let isWarning = false;

  if (lower.includes('andon')) {
    category = 'ANDON SYSTEM';
  } else if (
    lower.includes('tabel') ||
    lower.includes('table') ||
    lower.includes('record') ||
    lower.includes('database') ||
    lower.includes('simpan') ||
    lower.includes('save')
  ) {
    category = 'TABLE & DATA';
  } else if (lower.includes('placeholder') || lower.includes('variabel') || lower.includes('variable')) {
    category = 'VARIABLE BINDING';
    isWarning = true;
  } else if (lower.includes('ai') || lower.includes('copilot') || lower.includes('vibe')) {
    category = 'AI ASSISTANT';
  } else if (lower.includes('iot') || lower.includes('serial') || lower.includes('sensor') || lower.includes('camera')) {
    category = 'HARDWARE / IOT';
  } else if (toastType === 'error') {
    category = 'ERROR ALERT';
  } else if (toastType === 'success') {
    category = 'SUCCESS';
  } else if (toastType === 'loading') {
    category = 'PROCESSING';
  } else {
    category = 'NOTIFICATION';
  }

  // Detect warning tone
  if (lower.includes('tidak ditemukan') || lower.includes('peringatan') || lower.includes('warning') || lower.includes('belum')) {
    isWarning = true;
  }

  // Strip leading emojis to prevent duplicate ugly icons:
  // e.g. "❌ Placeholder..." -> "Placeholder..."
  // e.g. "💾 Data berhasil disimpan..." -> "Data berhasil disimpan..."
  text = text.replace(/^([\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[❌💾⚠️✨🎉🧹🔄⚡🔴🟢🟡ℹ️❓])+\s*/u, '');

  return { text, category, isWarning };
}

/**
 * Individual PRO Toast Card
 */
const ProToastCard = ({ toastItem }) => {
  const messageVal = resolveValue(toastItem.message, toastItem);
  const toastType = toastItem.type; // 'success' | 'error' | 'loading' | 'blank' | 'custom'
  const { text, category, isWarning } = useMemo(() => parseToastMessage(messageVal, toastType), [messageVal, toastType]);

  // Determine configuration based on toast type & content
  const config = useMemo(() => {
    if (toastType === 'loading') {
      return {
        accent: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.25)',
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        badgeText: '#38bdf8',
        iconBg: 'rgba(56, 189, 248, 0.15)',
        iconColor: '#38bdf8',
        icon: <Loader2 size={18} className="animate-spin" color="#38bdf8" />,
        label: category || 'PROCESSING'
      };
    }
    if (toastType === 'error' || (!isWarning && toastType === 'error')) {
      return {
        accent: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.25)',
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        badgeText: '#f87171',
        iconBg: 'rgba(239, 68, 68, 0.15)',
        iconColor: '#ef4444',
        icon: <AlertOctagon size={18} color="#ef4444" />,
        label: category || 'ERROR'
      };
    }
    if (isWarning) {
      return {
        accent: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.25)',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeText: '#fbbf24',
        iconBg: 'rgba(245, 158, 11, 0.15)',
        iconColor: '#f59e0b',
        icon: <AlertTriangle size={18} color="#f59e0b" />,
        label: category || 'WARNING'
      };
    }
    if (toastType === 'success') {
      return {
        accent: '#10b981',
        glow: 'rgba(16, 185, 129, 0.25)',
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeText: '#34d399',
        iconBg: 'rgba(16, 185, 129, 0.15)',
        iconColor: '#10b981',
        icon: <CheckCircle2 size={18} color="#10b981" />,
        label: category || 'SUCCESS'
      };
    }
    // Default / Info
    return {
      accent: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.25)',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      badgeText: '#818cf8',
      iconBg: 'rgba(99, 102, 241, 0.15)',
      iconColor: '#818cf8',
      icon: <Info size={18} color="#818cf8" />,
      label: category || 'SYSTEM'
    };
  }, [toastType, isWarning, category]);

  // Animated progress bar countdown and fail-safe auto-dismiss
  const duration = toastItem.duration || 3500;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toastItem.visible || toastType === 'loading') return;

    const interval = 25;
    const step = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          clearInterval(progressTimer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    // Guaranteed fail-safe auto-dismissal: triggers dismiss when duration expires
    const dismissTimer = setTimeout(() => {
      toast.dismiss(toastItem.id);
      setTimeout(() => {
        toast.remove(toastItem.id);
      }, 250);
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [toastItem.visible, toastItem.id, duration, toastType]);

  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    toast.dismiss(toastItem.id);
    setTimeout(() => {
      toast.remove(toastItem.id);
    }, 200);
  };

  return (
    <div
      style={{
        pointerEvents: toastItem.visible ? 'auto' : 'none',
        minWidth: '320px',
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#0f172a', // Slate 900
        backgroundImage: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderLeft: `4px solid ${config.accent}`,
        borderRadius: '12px',
        boxShadow: `0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 6px 14px -2px rgba(0, 0, 0, 0.4), 0 0 24px ${config.glow}`,
        padding: '12px 14px 10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
        maxHeight: toastItem.visible ? '240px' : '0px',
        transform: toastItem.visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
        opacity: toastItem.visible ? 1 : 0,
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Top row: Badge, Category, and Close Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: config.badgeText,
              backgroundColor: config.badgeBg,
              padding: '2px 7px',
              borderRadius: '5px',
              border: `1px solid ${config.badgeText}33`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: config.accent }} />
            {config.label}
          </span>
        </div>

        <button
          onClick={handleClose}
          aria-label="Tutup Notifikasi"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Main content row: Icon + Message */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: config.iconBg,
            border: `1px solid ${config.accent}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px'
          }}
        >
          {config.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.84rem',
              lineHeight: '1.45',
              fontWeight: 500,
              color: '#f8fafc',
              wordBreak: 'break-word'
            }}
          >
            {text}
          </div>
        </div>
      </div>

      {/* Bottom auto-dismiss countdown line */}
      {toastType !== 'loading' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2.5px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: config.accent,
              transition: 'width 0.03s linear'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Polyfill toast.info if not native to avoid runtime exceptions
if (toast && typeof toast === 'function' && typeof toast.info !== 'function') {
  toast.info = (message, opts) => toast(message, { ...opts, type: 'blank' });
}

/**
 * ProToaster Component
 * Drop-in replacement for <Toaster /> with:
 * - Built-in anti-stacking (limit max visible toasts to 2)
 * - Automatic duplicate suppression (no duplicate text stacked)
 * - Guaranteed fail-safe auto-dismissal
 * - Industrial dark glassmorphism card aesthetic
 */
export default function ProToaster({
  limit = 2,
  position = 'top-right',
  containerStyle,
  ...props
}) {
  const { toasts } = useToasterStore();
  const [isDuplicateInstance, setIsDuplicateInstance] = useState(false);

  // Singleton protection: if another Toaster container already mounted, suppress this one
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.querySelectorAll('[data-rht-toaster]');
    if (existing.length > 1) {
      setIsDuplicateInstance(true);
    }
  }, []);

  // ANTI-NUMPUK & DEDUPLICATION:
  // 1. Immediately dismiss duplicate identical messages
  // 2. Limit visible toasts to prevent overlapping stacks
  useEffect(() => {
    const visibleToasts = toasts.filter(t => t.visible);

    // Deduplicate identical message contents
    const seenMessages = new Set();
    visibleToasts.forEach((t) => {
      const rawText = typeof t.message === 'function' ? String(t.message) : String(t.message || '');
      if (seenMessages.has(rawText)) {
        toast.dismiss(t.id);
        setTimeout(() => toast.remove(t.id), 200);
      } else {
        seenMessages.add(rawText);
      }
    });

    // Limit visible count
    visibleToasts
      .filter((_, idx) => idx >= limit)
      .forEach(t => {
        toast.dismiss(t.id);
        setTimeout(() => toast.remove(t.id), 200);
      });
  }, [toasts, limit]);

  if (isDuplicateInstance) {
    return null;
  }

  return (
    <Toaster
      position={position}
      reverseOrder={false}
      gutter={12}
      containerStyle={{
        top: 24,
        right: 24,
        zIndex: 99999,
        pointerEvents: 'none',
        ...containerStyle
      }}
      toastOptions={{
        duration: 3500
      }}
      {...props}
    >
      {(t) => <ProToastCard toastItem={t} />}
    </Toaster>
  );
}

export { ProToaster, ProToastCard };
