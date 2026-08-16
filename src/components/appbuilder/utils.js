// Shared utilities and constants extracted from AppBuilder.jsx
import {
    Smartphone, Tablet, Monitor, LayoutGrid
} from 'lucide-react';

export const DEVICE_PRESETS = {
    RESPONSIVE: { label: 'Responsive', width: null, height: null, icon: LayoutGrid, kind: 'RESPONSIVE' },
    PHONE_APP_INVENTOR: { label: 'Phone size (Mobile) (420x750)', width: 420, height: 750, icon: Smartphone, kind: 'PHONE' },
    TABLET_APP_INVENTOR: { label: 'Tablet size (480x675)', width: 480, height: 675, icon: Tablet, kind: 'TABLET' },
    IPHONE_14: { label: 'iPhone 14 (393x852)', width: 393, height: 852, icon: Smartphone, kind: 'PHONE' },
    SAMSUNG_S23: { label: 'Galaxy S23 (360x780)', width: 360, height: 780, icon: Smartphone, kind: 'PHONE' },
    IPAD_PRO: { label: 'iPad Pro (1024x1366)', width: 1024, height: 1366, icon: Tablet, kind: 'TABLET' },
    SURFACE_PRO_7: { label: 'Surface Pro 7 (912x1368)', width: 912, height: 1368, kind: 'TABLET', icon: Tablet },
    LAPTOP_HD: { label: 'Laptop 720p (1280x720)', width: 1280, height: 720, icon: Monitor, kind: 'PC' },
    DESKTOP_FHD: { label: 'Desktop FHD (1920x1080)', width: 1920, height: 1080, icon: Monitor, kind: 'PC' }
};

export const DEFAULT_FRONTLINE_APP_NAME = 'New Frontline App';
export const DEFAULT_FRONTLINE_APP_CATEGORY = 'Shop Floor';
export const DEFAULT_IOT_CONFIG = {
    brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
    topics: []
};
export const FRONTLINE_DRAFT_KEY_PREFIX = 'mavi_frontline_draft_';

export const computeAppSignature = (payload = {}) => {
    try {
        return JSON.stringify(payload);
    } catch {
        return '';
    }
};

export const formatTimeLabel = (isoValue) => {
    if (!isoValue) return '';
    const parsed = new Date(isoValue);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const getFriendlyTriggerName = (trig, defaultType = 'Widget') => {
    if (!trig) return 'Unnamed Trigger';
    if (trig.name) return trig.name;
    const evt = (trig.event || trig.on || '').replace('ON_', '').replace(/_/g, ' ');
    const act = (trig.action || trig.type || '').replace(/_/g, ' ');
    if (evt && act) {
        const prettyEvt = evt.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        const prettyAct = act.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        return `${prettyAct} (${prettyEvt})`;
    }
    if (evt) {
        const prettyEvt = evt.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        return `${prettyEvt} Trigger`;
    }
    const prettyDefault = defaultType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return `${prettyDefault} Trigger`;
};

