import { Search, ZoomOut, ZoomIn } from 'lucide-react';

export default function ZoomWidget({ zoomLevel, setZoomLevel, isZoomCollapsed, setIsZoomCollapsed }) {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: isZoomCollapsed ? '8px' : '6px 12px',
        borderRadius: '24px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15), 0 2px 8px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: "'Inter', sans-serif",
        color: '#1e293b',
        userSelect: 'none'
      }}
    >
      {isZoomCollapsed ? (
        // Collapsed circular button showing magnifier
        <button
          onClick={() => setIsZoomCollapsed(false)}
          title={`Zoom: ${Math.round(zoomLevel * 100)}% (Click to expand)`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'; }}
        >
          <Search size={18} />
        </button>
      ) : (
        // Expanded pill showing full controls
        <>
          {/* Collapse Arrow */}
          <button
            onClick={() => setIsZoomCollapsed(true)}
            title="Collapse controls"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>▶</span>
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={() => setZoomLevel((prev) => Math.max(Math.round((prev - 0.1) * 10) / 10, 0.5))}
            disabled={zoomLevel <= 0.5}
            title="Zoom Out (Ctrl + -)"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: zoomLevel <= 0.5 ? '#cbd5e1' : '#475569',
              borderRadius: '50%',
              backgroundColor: zoomLevel <= 0.5 ? 'transparent' : '#f1f5f9',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if (zoomLevel > 0.5) { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
            onMouseLeave={(e) => { if (zoomLevel > 0.5) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
          >
            <ZoomOut size={14} />
          </button>

          {/* Zoom Level Indicator & Reset Button */}
          <button
            onClick={() => setZoomLevel(1.0)}
            title="Reset Zoom to 100% (Ctrl + 0)"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: zoomLevel === 1.0 ? '#475569' : '#2563eb',
              borderRadius: '6px',
              backgroundColor: zoomLevel === 1.0 ? 'transparent' : 'rgba(37, 99, 235, 0.08)',
              transition: 'all 0.2s',
              minWidth: '50px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = zoomLevel === 1.0 ? '#f1f5f9' : 'rgba(37, 99, 235, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = zoomLevel === 1.0 ? 'transparent' : 'rgba(37, 99, 235, 0.08)'; }}
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            onClick={() => setZoomLevel((prev) => Math.min(Math.round((prev + 0.1) * 10) / 10, 2.0))}
            disabled={zoomLevel >= 2.0}
            title="Zoom In (Ctrl + =)"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              cursor: zoomLevel >= 2.0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: zoomLevel >= 2.0 ? '#cbd5e1' : '#475569',
              borderRadius: '50%',
              backgroundColor: zoomLevel >= 2.0 ? 'transparent' : '#f1f5f9',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if (zoomLevel < 2.0) { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
            onMouseLeave={(e) => { if (zoomLevel < 2.0) { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
          >
            <ZoomIn size={14} />
          </button>
        </>
      )}
    </div>
  );
}
