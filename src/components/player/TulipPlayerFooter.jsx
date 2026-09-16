import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * TulipPlayerFooter
 * ==============================================================================
 * 1:1 Pixel-Accurate Tulip Frontline Player Footer Bar
 * Renders the signature Tulip dark slate navigation bar:
 * - Left: Optional step indicator / context
 * - Right: Tactile [← Previous] button matching Tulip standard
 * ==============================================================================
 */
export default function TulipPlayerFooter({
  onPrev,
  onNext,
  canGoPrev = true,
  canGoNext = false,
  stepIndex = 0,
  totalSteps = 1,
  showNext = false
}) {
  return (
    <footer
      style={{
        height: '50px',
        backgroundColor: '#2b3648', // Signature Tulip Dark Slate Footer
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        flexShrink: 0,
        zIndex: 30,
        gap: '12px',
        userSelect: 'none'
      }}
    >
      {/* ── Optional Next Step Button ── */}
      {showNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: canGoNext ? '#10b981' : '#334155',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '9px 20px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            opacity: canGoNext ? 1 : 0.6,
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (canGoNext) e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            if (canGoNext) e.currentTarget.style.backgroundColor = '#10b981';
          }}
        >
          <span>Next</span>
          <ArrowRight size={16} />
        </button>
      )}

      {/* ── Signature Tulip [← Previous] Button (Exact 1:1 Match) ── */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: canGoPrev ? '#4f5f74' : '#334155',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          padding: '9px 20px',
          fontSize: '0.88rem',
          fontWeight: 700,
          cursor: canGoPrev ? 'pointer' : 'not-allowed',
          opacity: canGoPrev ? 1 : 0.5,
          transition: 'all 0.15s ease',
          boxShadow: canGoPrev ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (canGoPrev) e.currentTarget.style.backgroundColor = '#5e7087';
        }}
        onMouseLeave={(e) => {
          if (canGoPrev) e.currentTarget.style.backgroundColor = '#4f5f74';
        }}
        title="Go to Previous Step"
      >
        <ArrowLeft size={16} strokeWidth={2.4} />
        <span>Previous</span>
      </button>
    </footer>
  );
}
