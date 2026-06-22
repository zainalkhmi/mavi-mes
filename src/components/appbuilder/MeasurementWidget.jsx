// MeasurementWidget component extracted from AppBuilder.jsx
import React from 'react';
import { Ruler, Bluetooth, CheckCircle2 } from 'lucide-react';
import { COMPONENT_TYPES } from './componentTypes';
import hardwareService from '../../utils/hardwareService';
import { translations } from '../../i18n/translations';

export const MeasurementWidget = ({ comp, viewMode, onWidgetInteraction, setPreviewFormValues, updateComponentProps, language = 'en' }) => {
    const [liveValue, setLiveValue] = React.useState(0);
    const [status, setStatus] = React.useState('disconnected');
    const t = (key) => translations[language]?.measurementWidget?.[key] || key;

    React.useEffect(() => {
        if (viewMode !== 'PREVIEW') return;

        const unsubData = hardwareService.onData((val) => {
            setLiveValue(val);
            onWidgetInteraction(comp, 'ValueReceived', { value: val });
        });

        const unsubStatus = hardwareService.subscribeStatus((s) => {
            setStatus(s);
        });

        return () => {
            unsubData();
            unsubStatus();
        };
    }, [viewMode, comp]);

    const handleConnect = async () => {
        if (comp.props.connectionType === 'SERIAL') {
            await hardwareService.connectSerial(comp.props.baudRate);
        } else {
            await hardwareService.connectBluetooth();
        }
    };

    const handleCapture = () => {
        if (viewMode !== 'PREVIEW') return;

        onWidgetInteraction(comp, 'Capture', { value: liveValue });
        setPreviewFormValues(prev => ({ ...prev, [comp.id]: liveValue }));
    };

    const renderToolIllustration = () => {
        const color = 'var(--text-tertiary)';
        if (comp.type === 'OUTSIDE_MICROMETER') {
            return (
                <svg viewBox="0 0 100 40" style={{ width: '80px', height: '32px', color }}>
                    <path d="M 30 10 L 15 10 A 15 15 0 0 0 15 30 L 30 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="30" y1="20" x2="45" y2="20" stroke="currentColor" strokeWidth="3" />
                    <rect x="45" y="14" width="35" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="80" y="12" width="15" height="16" rx="1" fill="currentColor" />
                    <line x1="55" y1="14" x2="55" y2="26" stroke="currentColor" strokeWidth="1" />
                    <line x1="65" y1="14" x2="65" y2="26" stroke="currentColor" strokeWidth="1" />
                </svg>
            );
        }
        if (comp.type === 'INSIDE_MICROMETER') {
            return (
                <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px', color }}>
                    <rect x="15" y="12" width="55" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="15" y1="6" x2="15" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <line x1="70" y1="6" x2="70" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <rect x="70" y="10" width="20" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="90" y="9" width="8" height="12" rx="1" fill="currentColor" />
                </svg>
            );
        }
        if (comp.type === 'DIAL_HEIGHT_GAUGE') {
            return (
                <svg viewBox="0 0 60 100" style={{ width: '40px', height: '64px', color }}>
                    <rect x="10" y="85" width="40" height="10" rx="2" fill="currentColor" />
                    <rect x="25" y="10" width="10" height="75" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="20" y="40" width="20" height="15" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="30" cy="47.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="30" y1="47.5" x2="33" y2="44.5" stroke="currentColor" strokeWidth="1" />
                </svg>
            );
        }
        if (comp.type === 'DEPTH_GAUGE') {
            return (
                <svg viewBox="0 0 100 60" style={{ width: '80px', height: '48px', color }}>
                    <line x1="20" y1="15" x2="80" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <rect x="47" y="15" width="6" height="35" rx="1" fill="currentColor" />
                    <line x1="30" y1="15" x2="30" y2="20" stroke="currentColor" strokeWidth="1" />
                    <line x1="70" y1="15" x2="70" y2="20" stroke="currentColor" strokeWidth="1" />
                </svg>
            );
        }
        if (comp.type === 'ROUGHNESS_TESTER') {
            return (
                <svg viewBox="0 0 100 50" style={{ width: '80px', height: '40px', color }}>
                    <rect x="20" y="10" width="60" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="25" y="15" width="30" height="20" rx="1" fill="currentColor" opacity="0.2" />
                    <path d="M 80 25 L 95 25 L 95 35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="95" cy="35" r="2" fill="currentColor" />
                </svg>
            );
        }
        if (comp.type === 'TORQUE_WRENCH') {
            return (
                <svg viewBox="0 0 120 40" style={{ width: '96px', height: '32px', color }}>
                    <rect x="10" y="15" width="80" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="15" cy="20" r="6" fill="currentColor" />
                    <rect x="12" y="17" width="6" height="6" fill="white" />
                    <rect x="90" y="12" width="25" height="16" rx="2" fill="currentColor" />
                    <line x1="95" y1="12" x2="95" y2="28" stroke="white" strokeWidth="1" opacity="0.3" />
                    <line x1="105" y1="12" x2="105" y2="28" stroke="white" strokeWidth="1" opacity="0.3" />
                </svg>
            );
        }
        if (comp.type === 'WEIGHING_SCALE') {
            return (
                <svg viewBox="0 0 100 60" style={{ width: '80px', height: '48px', color }}>
                    <rect x="10" y="40" width="80" height="10" rx="2" fill="currentColor" />
                    <rect x="20" y="15" width="60" height="25" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="30" y="20" width="40" height="10" rx="1" fill="currentColor" opacity="0.2" />
                    <circle cx="25" cy="22.5" r="1.5" fill="currentColor" />
                    <circle cx="75" cy="22.5" r="1.5" fill="currentColor" />
                </svg>
            );
        }
        return <Ruler size={32} style={{ color, opacity: 0.5 }} />;
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            padding: '12px',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: 'var(--text-quaternary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {(() => {
                        const Icon = COMPONENT_TYPES[comp.type]?.icon || Ruler;
                        return <Icon size={14} strokeWidth={2.5} />;
                    })()}
                    {comp.props.label || comp.props.title || t('title')}
                </span>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: status === 'connected' ? '#22c55e' : status === 'error' ? '#ef4444' : '#94a3b8',
                    boxShadow: status === 'connected' ? '0 0 8px #22c55e' : 'none'
                }} />
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
            }}>
                <div style={{ position: 'absolute', opacity: 0.1, transform: 'scale(1.5)' }}>
                    {renderToolIllustration()}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', zIndex: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {liveValue.toFixed(comp.props.precision ?? 2)}
                    <span style={{ fontSize: '0.9rem', marginLeft: '4px', fontWeight: 500, color: 'var(--text-tertiary)' }}>{comp.props.unit || 'mm'}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>
                    {t(status)}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
                {status !== 'connected' ? (
                    <button
                        onClick={handleConnect}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.75rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}
                    >
                        <Bluetooth size={14} /> {t('connect')}
                    </button>
                ) : (
                    <button
                        onClick={() => hardwareService.disconnect()}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.75rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '6px'
                        }}
                    >
                        {t('disconnect')}
                    </button>
                )}

                {comp.props.showCaptureButton !== false && (
                    <button
                        onClick={handleCapture}
                        style={{
                            flex: 1,
                            padding: '6px',
                            fontSize: '0.75rem',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}
                    >
                        <CheckCircle2 size={14} /> {t('capture')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MeasurementWidget;

