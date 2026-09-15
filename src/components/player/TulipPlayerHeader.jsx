import React, { useState } from 'react';
import {
  HelpCircle, Info, RotateCcw, Menu, User, MapPin,
  ChevronRight, Radio, ShieldCheck, Sparkles, LogOut, Maximize2, Minimize2
} from 'lucide-react';

/**
 * TulipStandardPlayerHeader
 * ==============================================================================
 * Industrial-grade Frontline Player Header adhering 1:1 to the official
 * Tulip App Player layout:
 * - Left: Brand Logo + Vertical Divider + App Name (+ optional Step Name breadcrumb)
 * - Right: [?] Help  [i] Info  [↻] Restart  [≡] Menu  |  ● Operator  |  ● Station
 * ==============================================================================
 */
export default function TulipPlayerHeader({
  appName = 'Frontline App',
  stepTitle = '',
  stepIndex = 0,
  totalSteps = 1,
  operator = 'Operator',
  stationName = 'Station A',
  isOnline = true,
  companyLogo = null,
  onOpenHelp,
  onOpenInfo,
  onRestartApp,
  onOpenMenu,
  onToggleFullscreen,
  isFullscreen = false
}) {
  return (
    <header
      style={{
        height: '46px',
        backgroundColor: '#090d16', // Deep industrial obsidian black
        borderBottom: '1px solid rgba(255, 255, 255, 0.09)',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        userSelect: 'none'
      }}
    >
      {/* ── Left: Brand & App Title ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {/* Tulip / Mavi Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" style={{ height: '18px', objectFit: 'contain' }} />
          ) : (
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8rem',
                color: '#020617',
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)'
              }}
            >
              ❖
            </div>
          )}
          <span style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '0.04em', color: '#ffffff' }}>
            TULIP
          </span>
        </div>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.18)', flexShrink: 0 }} />

        {/* App Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              color: '#f8fafc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '300px'
            }}
            title={appName}
          >
            {appName}
          </span>

          {/* Active Step Breadcrumb */}
          {stepTitle && (
            <>
              <ChevronRight size={14} color="rgba(255, 255, 255, 0.35)" />
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '220px'
                }}
              >
                {stepTitle} {totalSteps > 1 ? `(${stepIndex + 1}/${totalSteps})` : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Right: Standard Frontline Actions & Badges ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* [?] Help */}
        <button
          type="button"
          onClick={onOpenHelp}
          title="Bantuan & SOP Langkah Kerja"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 9px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
        >
          <HelpCircle size={14} color="#38bdf8" />
          <span>Help</span>
        </button>

        {/* [i] Info / Version */}
        <button
          type="button"
          onClick={onOpenInfo}
          title="Info & Versi Aplikasi"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 9px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
        >
          <Info size={14} color="#94a3b8" />
          <span>Info</span>
        </button>

        {/* [↻] Restart */}
        <button
          type="button"
          onClick={onRestartApp}
          title="Restart / Reset Aplikasi Sesi Ini"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 9px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
        >
          <RotateCcw size={14} color="#f59e0b" />
          <span>Restart</span>
        </button>

        {/* [≡] Menu */}
        <button
          type="button"
          onClick={onOpenMenu}
          title="Menu Player & Pengaturan Stasiun"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 9px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
        >
          <Menu size={14} color="#ffffff" />
          <span>Menu</span>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

        {/* 👤 Operator Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '20px',
            fontSize: '0.74rem',
            color: '#cbd5e1'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
          <User size={12} color="#38bdf8" />
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{operator || 'Operator'}</span>
        </div>

        {/* 🏷️ Station Badge (with LED indicator) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: isOnline ? 'rgba(6, 78, 59, 0.4)' : 'rgba(127, 29, 29, 0.4)',
            border: isOnline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px',
            fontSize: '0.74rem',
            color: isOnline ? '#6ee7b7' : '#fca5a5'
          }}
          title={isOnline ? 'Station Terhubung ke Gateway IoT' : 'Station Offline'}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10b981' : '#ef4444',
              boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444'
            }}
          />
          <MapPin size={12} color={isOnline ? '#10b981' : '#ef4444'} />
          <span style={{ fontWeight: 800, color: '#ffffff' }}>{stationName || 'Station A'}</span>
        </div>
      </div>
    </header>
  );
}
