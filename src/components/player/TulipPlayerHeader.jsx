import React, { useState } from 'react';
import {
  HelpCircle, Info, RotateCcw, Menu, User, MapPin,
  ChevronRight, Radio, ShieldCheck, Sparkles, LogOut, Maximize2, Minimize2,
  MessageSquare, Download
} from 'lucide-react';

/**
 * TulipStandardPlayerHeader
 * ==============================================================================
 * 1:1 Pixel-Accurate Tulip Frontline Player Header
 * Two-tier industrial layout matching official Tulip Player:
 * - Tier 1 (Utility Bar): Logo ❖ | USER: [Avatar] Name | STATION: StationName ... Feedback | Help | Info | Restart
 * - Tier 2 (Main Bar): App Title + Step | Batch Number & Version | [≡ Menu] Button
 * ==============================================================================
 */
export default function TulipPlayerHeader({
  appName = 'Demo Weigh and Dispense',
  stepTitle = '',
  stepIndex = 0,
  totalSteps = 1,
  operator = 'Dan Smith',
  stationName = 'Pablo (Incog)',
  batchNumber = 'C-0001-95',
  versionLabel = 'Development Version',
  isOnline = true,
  companyLogo = null,
  onOpenHelp,
  onOpenInfo,
  onRestartApp,
  onOpenMenu,
  onOpenFeedback,
  onToggleFullscreen,
  isFullscreen = false
}) {
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleFeedbackClick = () => {
    if (onOpenFeedback) {
      onOpenFeedback();
    } else {
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flexShrink: 0, userSelect: 'none', zIndex: 40 }}>
      {/* ── TIER 1: TOP STATUS / DEVICE UTILITY BAR (Height: 30px) ──────────────── */}
      <div
        style={{
          height: '30px',
          backgroundColor: '#1b2332',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.02em'
        }}
      >
        {/* Left: Brand Glyph + User + Station */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          {/* Tulip Geometric Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" style={{ height: '16px', objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.7rem',
                  color: '#ffffff',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)'
                }}
              >
                ❖
              </div>
            )}
          </div>

          {/* User Section with Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
              USER:
            </span>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=64"
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>
              {operator || 'Dan Smith'}
            </span>
          </div>

          {/* Station Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
              STATION:
            </span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>
              {stationName || 'Pablo (Incog)'}
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10b981' : '#ef4444',
                boxShadow: isOnline ? '0 0 6px #10b981' : '0 0 6px #ef4444',
                marginLeft: '2px'
              }}
              title={isOnline ? 'Station Online' : 'Station Offline'}
            />
          </div>
        </div>

        {/* Right: Feedback & Quick Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Feedback Button (Exact Tulip Match) */}
          <button
            type="button"
            onClick={handleFeedbackClick}
            style={{
              background: 'none',
              border: 'none',
              color: feedbackSuccess ? '#4ade80' : '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { if (!feedbackSuccess) e.currentTarget.style.color = '#94a3b8'; }}
          >
            {feedbackSuccess ? '✓ Sent' : 'Feedback'}
          </button>

          {/* Help Button */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#38bdf8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              <HelpCircle size={12} />
              <span>Help</span>
            </button>
          )}

          {/* Info Button */}
          {onOpenInfo && (
            <button
              type="button"
              onClick={onOpenInfo}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Info size={12} />
              <span>Info</span>
            </button>
          )}

          {/* Download Player / Kiosk Client */}
          <a
            href="#/download-player"
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = '#34d399'; }}
            title="Download MAVi / Mandor Player for Windows & Android Tablet"
          >
            <Download size={11} />
            <span>Download Player</span>
          </a>

          {/* Restart Button */}
          {onRestartApp && (
            <button
              type="button"
              onClick={onRestartApp}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              <RotateCcw size={12} />
              <span>Restart</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* ── TIER 2: MAIN FRONTLINE APP HEADER BAR (Height: 56px) ────────────────── */}
      <div
        style={{
          height: '56px',
          backgroundColor: '#344256', // Signature Tulip Slate Grey
          borderBottom: '1px solid rgba(0, 0, 0, 0.25)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Left: App Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={appName}
          >
            {appName}
          </h1>

          {/* Optional Step breadcrumb badge if multiple steps */}
          {stepTitle && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#93c5fd',
                backgroundColor: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(147, 197, 253, 0.2)',
                padding: '2px 8px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                maxWidth: '240px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <ChevronRight size={12} color="#93c5fd" />
              <span>{stepTitle} {totalSteps > 1 ? `(${stepIndex + 1}/${totalSteps})` : ''}</span>
            </div>
          )}
        </div>

        {/* Right: Batch HUD & Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          {/* Metadata Block (Batch Number & Version) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              lineHeight: '1.3',
              fontSize: '0.76rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}
          >
            <div>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Batch Number: </span>
              <span style={{ color: '#94a3b8' }}>{batchNumber || 'C-0001-95'}</span>
            </div>
            <div>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Version: </span>
              <span style={{ color: '#94a3b8' }}>{versionLabel || 'Development Version'}</span>
            </div>
          </div>

          {/* Tulip Menu Button (Exact 1:1 styling: Charcoal box with ≡ Menu) */}
          <button
            type="button"
            onClick={onOpenMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '38px',
              padding: '0 16px',
              backgroundColor: '#1e2638',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.86rem',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2a354b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1e2638'; }}
          >
            <Menu size={16} color="#ffffff" strokeWidth={2.4} />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
