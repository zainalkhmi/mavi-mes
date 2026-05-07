import React from 'react';
import { LayoutGrid, Barcode, MessageSquare, HelpCircle, Activity } from 'lucide-react';

/**
 * MobileBottomNav
 * Persistent navigation for mobile devices.
 */
const MobileBottomNav = ({ activeTab, onTabChange, hasNewMessages }) => {
  const tabs = [
    { id: 'apps', label: 'Apps', icon: LayoutGrid },
    { id: 'scan', label: 'Quick Scan', icon: Barcode },
    { id: 'chat', label: 'Collab', icon: MessageSquare, badge: hasNewMessages },
    { id: 'stats', label: 'OEE', icon: Activity },
  ];

  const handleTabClick = (tabId) => {
    // Trigger "haptic" feel via simple vibration API if available
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    onTabChange(tabId);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '70px', backgroundColor: 'white',
      borderTop: '1px solid #e2e8f0', display: 'flex',
      justifyContent: 'space-around', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', background: 'none',
              border: 'none', color: isActive ? '#3b82f6' : '#64748b',
              cursor: 'pointer', transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{
              transform: isActive ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {tab.badge && (
                <div style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  width: '10px', height: '10px', backgroundColor: '#ef4444',
                  borderRadius: '50%', border: '2px solid white'
                }} />
              )}
            </div>
            <span style={{ 
              fontSize: '0.65rem', fontWeight: isActive ? 800 : 600,
              opacity: isActive ? 1 : 0.8
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute', bottom: '-8px', width: '4px', height: '4px',
                borderRadius: '50%', backgroundColor: '#3b82f6'
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MobileBottomNav;
