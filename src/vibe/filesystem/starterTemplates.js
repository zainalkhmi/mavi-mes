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
  background-color: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}
button {
  font-family: inherit;
}
`,

  '/App.jsx': `import React, { useState } from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle, Play, RefreshCw, BarChart2, Layers, TrendingUp } from 'lucide-react';

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
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.06) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(14, 165, 233, 0.08) 0px, transparent 50%), #f8fafc',
      color: '#0f172a',
      padding: '28px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#0f172a' }}>
              MaviCore Shop Floor Station
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Stasiun Machining Line 01 • Stamping Press
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: lineStatus === 'RUNNING' ? '#dcfce7' : '#fee2e2',
            color: lineStatus === 'RUNNING' ? '#15803d' : '#b91c1c',
            border: \`1px solid \${lineStatus === 'RUNNING' ? '#bbf7d0' : '#fecaca'}\`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: lineStatus === 'RUNNING' ? '#16a34a' : '#dc2626',
              display: 'inline-block'
            }} />
            {lineStatus}
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Total Part OK</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0284c7' }}>{totalProduced}</div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Target 95% tercapai
          </span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Part Cacat (NG)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#e11d48" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#e11d48' }}>{totalDefects}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '4px', display: 'inline-block' }}>
            Batas toleransi: max 25 NG
          </span>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Yield Rate</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#059669' }}>{yieldRate}%</div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '9999px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: \`\${Math.min(100, Number(yieldRate))}%\`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '9999px' }} />
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Pencatatan Operator</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={handleRecordOK}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <CheckCircle2 size={18} />
            Catat Part OK (+1)
          </button>
          <button 
            type="button"
            onClick={handleRecordNG}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'
            }}
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
  background-color: #f8fafc;
  color: #0f172a;
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
        <IonToolbar style={{ '--background': '#ffffff', '--color': '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
          <IonTitle style={{ fontWeight: 800 }}>Digital Inspection Mobile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc', color: '#0f172a' }}>
        <IonCard style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '1rem', color: '#64748b' }}>
              Barcode Part Terpindai: <span style={{ color: '#0284c7', fontWeight: 800 }}>{barcodeScanned}</span>
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
              <IonCard style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(16,185,129,0.1)' }}>
                <IonCardContent style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#16a34a', margin: 0, fontWeight: 700 }}>Lolos (PASS)</h3>
                  <h1 style={{ fontSize: '2.5rem', margin: '6px 0', color: '#15803d', fontWeight: 800 }}>{inspectedCount}</h1>
                  <IonButton expand="block" color="success" onClick={handlePass}>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    PASS
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="6">
              <IonCard style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(244,63,94,0.1)' }}>
                <IonCardContent style={{ textAlign: 'center' }}>
                  <h3 style={{ color: '#dc2626', margin: 0, fontWeight: 700 }}>Cacat (FAIL)</h3>
                  <h1 style={{ fontSize: '2.5rem', margin: '6px 0', color: '#b91c1c', fontWeight: 800 }}>{rejectedCount}</h1>
                  <IonButton expand="block" color="danger" onClick={handleFail}>
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
