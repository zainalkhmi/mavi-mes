import { COMPONENT_TYPES } from './componentTypes';

export const AI_TYPE_ALIASES = {
    'Panel': 'SHAPE_RECTANGLE', 'panel': 'SHAPE_RECTANGLE',
    'Container': 'SHAPE_RECTANGLE', 'container': 'SHAPE_RECTANGLE',
    'Box': 'SHAPE_RECTANGLE', 'box': 'SHAPE_RECTANGLE',
    'Div': 'SHAPE_RECTANGLE', 'div': 'SHAPE_RECTANGLE',
    'Flex': 'SHAPE_RECTANGLE', 'flex': 'SHAPE_RECTANGLE',
    'Card': 'SHAPE_RECTANGLE', 'card': 'SHAPE_RECTANGLE',
    'Frame': 'SHAPE_RECTANGLE', 'frame': 'SHAPE_RECTANGLE',
    'Section': 'SHAPE_RECTANGLE', 'section': 'SHAPE_RECTANGLE',
    'TextInput': 'TEXT_INPUT', 'textInput': 'TEXT_INPUT', 'textinput': 'TEXT_INPUT', 'Input': 'TEXT_INPUT', 'input': 'TEXT_INPUT',
    'TextArea': 'TEXT_AREA', 'textarea': 'TEXT_AREA', 'Textarea': 'TEXT_AREA',
    'Label': 'TEXT', 'label': 'TEXT', 'Heading': 'TEXT', 'heading': 'TEXT', 'Title': 'TEXT', 'Paragraph': 'TEXT',
    'Table': 'INTERACTIVE_TABLE', 'table': 'INTERACTIVE_TABLE', 'DataTable': 'INTERACTIVE_TABLE', 'dataTable': 'INTERACTIVE_TABLE',
    'Select': 'DROPDOWN', 'select': 'DROPDOWN', 'Spinner': 'DROPDOWN',
    'Switch': 'BOOLEAN_TOGGLE', 'switch': 'BOOLEAN_TOGGLE', 'Toggle': 'BOOLEAN_TOGGLE', 'toggle': 'BOOLEAN_TOGGLE',
    'NumberInput': 'NUMBER_INPUT', 'numberInput': 'NUMBER_INPUT', 'number_input': 'NUMBER_INPUT',
    'Radio': 'RADIO_GROUP', 'radio': 'RADIO_GROUP', 'RadioGroup': 'RADIO_GROUP',
    'Check': 'CHECKBOX', 'check': 'CHECKBOX', 'Checkbox': 'CHECKBOX',
    'BarChart': 'CHART', 'LineChart': 'CHART', 'PieChart': 'CHART',
    'Progress': 'GAUGE', 'ProgressBar': 'GAUGE', 'progress': 'GAUGE',
    'Scanner': 'BARCODE_SCANNER', 'BarcodeScanner': 'BARCODE_SCANNER', 'Scan': 'BARCODE_SCANNER',
    'Signature': 'SIGNATURE', 'signature': 'SIGNATURE',
    'Camera': 'CAMERA_CAPTURE', 'camera': 'CAMERA_CAPTURE',
    'Video': 'VIDEO', 'video': 'VIDEO',
    'Document': 'DOCUMENT', 'document': 'DOCUMENT',
    'Webpage': 'WEBPAGE', 'webpage': 'WEBPAGE', 'WebView': 'EMBED_WEB', 'webview': 'EMBED_WEB',
    'Checklist': 'CHECKLIST', 'checklist': 'CHECKLIST',
    'Chart': 'CHART', 'chart': 'CHART',
    'Gauge': 'GAUGE', 'gauge': 'GAUGE',
    'Grid': 'GRID', 'grid': 'GRID',
    'Slider': 'SLIDER', 'slider': 'SLIDER',
    'Button': 'BUTTON', 'button': 'BUTTON',
    'Image': 'IMAGE', 'image': 'IMAGE',
    'Text': 'TEXT', 'text': 'TEXT',
    'Badge': 'TEXT', 'badge': 'TEXT', 'StatusBadge': 'TEXT',
    'Alert': 'TEXT', 'alert': 'TEXT', 'Notice': 'TEXT',
    'Chip': 'BUTTON', 'chip': 'BUTTON', 'Tag': 'BUTTON',
    'Modal': 'SHAPE_RECTANGLE', 'modal': 'SHAPE_RECTANGLE',
    'Drawer': 'SHAPE_RECTANGLE', 'drawer': 'SHAPE_RECTANGLE',
    'Tabs': 'SHAPE_RECTANGLE', 'tabs': 'SHAPE_RECTANGLE',
};

export const normalizeType = (rawType) => {
    let resolvedType = rawType;
    if (!resolvedType) return 'SHAPE_RECTANGLE';
    if (!COMPONENT_TYPES[resolvedType]) {
        const aliased = AI_TYPE_ALIASES[resolvedType];
        if (aliased) {
            resolvedType = aliased;
        } else {
            const upperSnake = resolvedType.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
            if (COMPONENT_TYPES[upperSnake]) {
                resolvedType = upperSnake;
            } else {
                resolvedType = 'SHAPE_RECTANGLE';
            }
        }
    }
    return resolvedType;
};

// Safely cast coordinates and dimensions to integers to avoid string concatenation issues
export const sanitizeComponentCoords = (comp, compType) => {
    if (!comp || typeof comp !== 'object') return comp;
    const normalized = { ...comp };
    const finalType = compType || normalized.type || 'SHAPE_RECTANGLE';

    if (normalized.x !== undefined && normalized.x !== null) {
        normalized.x = Math.round(Number(normalized.x));
    } else {
        normalized.x = 0;
    }

    if (normalized.y !== undefined && normalized.y !== null) {
        normalized.y = Math.round(Number(normalized.y));
    } else {
        normalized.y = 0;
    }

    if (normalized.w !== undefined && normalized.w !== null) {
        normalized.w = Math.round(Number(normalized.w));
    } else {
        normalized.w = COMPONENT_TYPES[finalType]?.defaultSize?.w || 100;
    }

    if (normalized.h !== undefined && normalized.h !== null) {
        normalized.h = Math.round(Number(normalized.h));
    } else {
        normalized.h = COMPONENT_TYPES[finalType]?.defaultSize?.h || 80;
    }

    return normalized;
};

/**
 * Extract step/screen number from title or key (handles 1, 2, 'satu', 'dua', 'kedua', etc.)
 */
export const getStepNumber = (str) => {
    const s = String(str || '').toLowerCase();
    const m = /\b([0-9]+)\b/.exec(s);
    if (m) return parseInt(m[1], 10);
    if (/\b(1|satu|pertama|first)\b/i.test(s)) return 1;
    if (/\b(2|dua|kedua|second)\b/i.test(s)) return 2;
    if (/\b(3|tiga|ketiga|third)\b/i.test(s)) return 3;
    if (/\b(4|empat|keempat|fourth)\b/i.test(s)) return 4;
    if (/\b(5|lima|kelima|fifth)\b/i.test(s)) return 5;
    if (/\b(6|enam|keenam|sixth)\b/i.test(s)) return 6;
    if (/\b(7|tujuh|ketujuh|seventh)\b/i.test(s)) return 7;
    if (/\b(8|delapan|kedelapan|eighth)\b/i.test(s)) return 8;
    if (/\b(9|sembilan|kesembilan|ninth)\b/i.test(s)) return 9;
    if (/\b(10|sepuluh|kesepuluh|tenth)\b/i.test(s)) return 10;
    return null;
};

/**
 * Clean step title by removing leading step/screen numbers and symbols
 */
export const cleanStepTitle = (str) => String(str || '').toLowerCase()
    .replace(/^(step|screen|halaman|layar|page)?\s*[0-9]+[\.\:\-\s]*/i, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();

/**
 * Robust step resolver for multi-screen apps.
 * Resolves target key (ID, exact title, ordinal like "Screen 2", or clean name) to the step object.
 */
export const resolveStepTarget = (steps = [], targetKey = '') => {
    if (!targetKey || !Array.isArray(steps) || steps.length === 0) return null;

    const rawKey = String(targetKey).trim();
    const lowerKey = rawKey.toLowerCase();

    // 1. Check Base Layout
    if (lowerKey === 'base' || lowerKey === 'base layout' || lowerKey === 'baselayout' || lowerKey.includes('base layout') || lowerKey.includes('master template')) {
        return { id: 'BASE', title: 'Base Layout' };
    }

    // 2. Exact ID match
    const matchById = steps.find(s => s && s.id === rawKey);
    if (matchById) return matchById;

    // 3. Exact Title match (case-insensitive, trimmed)
    const matchByTitle = steps.find(s => String(s?.title || '').trim().toLowerCase() === lowerKey);
    if (matchByTitle) return matchByTitle;

    // 4. Generic ordinal matching (e.g. "Screen 2", "Halaman 2", "Page 2", "Layar 2", "Step 2")
    const isGenericOrdinal = /^(screen|halaman|page|layar|step)\s*([0-9]+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|pertama|kedua|ketiga|keempat|kelima|first|second|third|fourth|fifth)$/i.test(rawKey);
    const targetNum = getStepNumber(rawKey);

    if (isGenericOrdinal && targetNum !== null) {
        // Find step with explicit number in title matching targetNum
        const matchByTitleNum = steps.find(s => s && getStepNumber(s.title) === targetNum);
        if (matchByTitleNum) return matchByTitleNum;

        // Fallback to array index if valid
        if (steps[targetNum - 1]) {
            return steps[targetNum - 1];
        }
    }

    // 5. Cleaned Title match (ignoring prefixes like "1. ", "Screen 2: ", etc.)
    const cleanedKey = cleanStepTitle(rawKey);
    if (cleanedKey && cleanedKey.length >= 3) {
        const matchByClean = steps.find(s => s && cleanStepTitle(s.title) === cleanedKey);
        if (matchByClean) return matchByClean;
    }

    // 6. Substring & Fuzzy match with number conflict guard
    const matchFuzzy = steps.find(s => {
        if (!s) return false;
        const sTitle = String(s.title || '').trim().toLowerCase();
        if (!sTitle) return false;

        const sNum = getStepNumber(sTitle);
        // Number guard: Never match step 1 with step 2
        if (targetNum !== null && sNum !== null && targetNum !== sNum) {
            return false;
        }

        const sClean = cleanStepTitle(sTitle);
        if (cleanedKey && sClean && (sClean.includes(cleanedKey) || cleanedKey.includes(sClean))) {
            return true;
        }

        return sTitle.includes(lowerKey) || (lowerKey.length >= 4 && lowerKey.includes(sTitle));
    });

    if (matchFuzzy) return matchFuzzy;

    // 7. Last resort for ordinal if number matches step position
    if (targetNum !== null && steps[targetNum - 1]) {
        return steps[targetNum - 1];
    }

    return null;
};
