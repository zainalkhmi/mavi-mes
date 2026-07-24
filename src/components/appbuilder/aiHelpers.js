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
