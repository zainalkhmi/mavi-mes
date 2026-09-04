/**
 * starterTemplates.js
 * Default project starters for MaviCore Vibe Coding:
 * 1. WEB APP: React 19 + Tailwind CSS + Lucide + MaviCore UI
 * 2. MOBILE APP: React + Ionic React + Capacitor + MaviCore Mobile UI
 */

export const WEB_APP_STARTER = {
  '/package.json': JSON.stringify({
    name: 'mavicore-web-app',
    version: '1.0.0',
    private: true,
    dependencies: {
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.460.0',
      'recharts': '^2.12.0'
    }
  }, null, 2),

  '/styles.css': `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
* {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}
html, body, #root {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: #030712;
  color: #f8fafc;
  -webkit-font-smoothing: antialiased;
}
button {
  font-family: inherit;
}
`,

  '/App.jsx': `import React, { useState } from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle, Play, RefreshCw, BarChart2, Layers } from 'lucide-react';

export default function App() {
  const [lineStatus, setLineStatus] = useState('RUNNING');
  const [totalProduced, setTotalProduced] = useState(1248);
  const [totalDefects, setTotalDefects] = useState(14);

  const handleRecordOK = () => {
    setTotalProduced(c => c + 1);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'MAVICORE_TABLE_INSERT',
        tableName: 'Machining Line A Log',
        data: { timestamp: new Date().toISOString(), status: 'OK', count: 1 }
      }, '*');
    }
  };

  const handleRecordNG = () => {
    setTotalDefects(c => c + 1);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'MAVICORE_TABLE_INSERT',
        tableName: 'Machining Line A Defect Log',
        data: { timestamp: new Date().toISOString(), status: 'DEFECT', defectReason: 'Dimensional Tolerance NG' }
      }, '*');
    }
  };

  const yieldRate = totalProduced + totalDefects > 0 
    ? ((totalProduced / (totalProduced + totalDefects)) * 100).toFixed(1) 
    : '100.0';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f8fafc', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>MaviCore Shop Floor Station</h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Stasiun Machining Line 01 • Stamping Press</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
            backgroundColor: lineStatus === 'RUNNING' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: lineStatus === 'RUNNING' ? '#34d399' : '#f87171',
            border: \`1px solid \${lineStatus === 'RUNNING' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}\`
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lineStatus === 'RUNNING' ? '#10b981' : '#ef4444', display: 'inline-block' }} />
            {lineStatus}
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Total Part OK</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{totalProduced}</div>
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Part Cacat (NG)</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>{totalDefects}</div>
        </div>

        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Yield Rate</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>{yieldRate}%</div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Pencatatan Operator</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={handleRecordOK}
            style={{ flex: 1, minWidth: '180px', padding: '14px 20px', borderRadius: '12px', backgroundColor: '#059669', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <CheckCircle2 size={18} />
            Catat Part OK (+1)
          </button>
          <button 
            type="button"
            onClick={handleRecordNG}
            style={{ flex: 1, minWidth: '180px', padding: '14px 20px', borderRadius: '12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <AlertTriangle size={18} />
            Lapor Cacat (NG)
          </button>
        </div>
      </div>
    </div>
  );
}
`
};

export const MOBILE_APP_STARTER = {
  '/package.json': JSON.stringify({
    name: 'mavicore-mobile-app',
    version: '1.0.0',
    private: true,
    dependencies: {
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
      '@ionic/react': '^7.0.0',
      'ionicons': '^7.0.0',
      'lucide-react': '^0.460.0'
    }
  }, null, 2),

  '/styles.css': `
@import '@ionic/react/css/core.css';
@import '@ionic/react/css/normalize.css';
@import '@ionic/react/css/structure.css';
@import '@ionic/react/css/typography.css';

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
}
`,

  '/App.jsx': `import React, { useState } from 'react';
import {
  IonApp, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonGrid, IonRow, IonCol, IonBadge,
  setupIonicReact
} from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline, qrCodeOutline, cameraOutline } from 'ionicons/icons';

setupIonicReact();

export default function MobileApp() {
  const [inspectedCount, setInspectedCount] = useState(48);
  const [rejectedCount, setRejectedCount] = useState(2);
  const [barcodeScanned, setBarcodeScanned] = useState('PART-9942-X');

  const handlePass = () => {
    setInspectedCount(c => c + 1);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'MAVICORE_TABLE_INSERT',
        tableName: 'Mobile Inspection Table',
        data: { timestamp: new Date().toISOString(), partBarcode: barcodeScanned, result: 'PASS' }
      }, '*');
    }
  };

  const handleFail = () => {
    setRejectedCount(c => c + 1);
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({
        type: 'MAVICORE_TABLE_INSERT',
        tableName: 'Mobile Inspection Table',
        data: { timestamp: new Date().toISOString(), partBarcode: barcodeScanned, result: 'FAIL' }
      }, '*');
    }
  };

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Digital Inspection Mobile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#030712', color: '#f8fafc' }}>
        <IonCard color="dark" style={{ border: '1px solid #1e293b', borderRadius: '16px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '1rem', color: '#94a3b8' }}>
              Barcode Part Terpindai: <span style={{ color: '#38bdf8' }}>{barcodeScanned}</span>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" fill="outline" color="primary" onClick={() => setBarcodeScanned(\`PART-\${Math.floor(1000 + Math.random()*9000)}-X\`)}>
              <IonIcon slot="start" icon={qrCodeOutline} />
              Simulasi Pindai QR / Barcode
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonCard color="success">
                <IonCardContent style={{ textAlign: 'center' }}>
                  <h3>Lolos (PASS)</h3>
                  <h1 style={{ fontSize: '2.5rem', margin: '4px 0' }}>{inspectedCount}</h1>
                  <IonButton expand="block" color="light" onClick={handlePass}>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    PASS
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="6">
              <IonCard color="danger">
                <IonCardContent style={{ textAlign: 'center' }}>
                  <h3>Cacat (FAIL)</h3>
                  <h1 style={{ fontSize: '2.5rem', margin: '4px 0' }}>{rejectedCount}</h1>
                  <IonButton expand="block" color="light" onClick={handleFail}>
                    <IonIcon slot="start" icon={alertCircleOutline} />
                    FAIL
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonApp>
  );
}
`
};
