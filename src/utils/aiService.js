/**
 * AI Service for Mavi MES 
 * Supports Google Gemini, OpenAI, Anthropic, and Meta/Groq 
 */

const SYSTEM_PROMPT = `
You are a Manufacturing Systems Engineer specializing in Digital Work Instructions and MES (Manufacturing Execution Systems).
Analyze the provided document (SOP, PDF, or Image) and extract the manufacturing process into a structured digital application.

VALID COMPONENT TYPES (USE ONLY THESE):
TEXT, IMAGE, CHECKLIST, BUTTON, TEXT_INPUT, TEXT_AREA, DROPDOWN, SIGNATURE, 
QUALITY_PASS_FAIL, CAMERA_CAPTURE, RADIO_GROUP, CHECKBOX, GAUGE, INTERACTIVE_TABLE,
SHAPE_RECTANGLE, NUMBER_INPUT, VARIABLE_TEXT, SLIDER, DATE_PICKER, DATETIME_PICKER,
SMARTHOME_DEVICE, TUYA_PRODUCT

Output MUST be a valid JSON object following this schema:
{
  "name": "Descriptive App Name",
  "steps": [
    {
      "title": "Clear Step Title",
      "stepType": "Step" | "Form Step" | "Signature Form",
      "cycleTimeSeconds": number (default 60),
      "components": [
        {
          "type": "<VALID_TYPE_FROM_LIST_ABOVE>",
          "x": number (0-1000),
          "y": number (0-600),
          "w": number,
          "h": number,
          "props": { 
             "label": "string",
             "text": "string",
             "items": ["string"],
             "options": ["string"]
          }
        }
      ]
    }
  ]
}
`;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

async function callGemini(file, settings) {
    const { apiKey, modelId } = settings;
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;
    const cleanModelId = modelId.includes('/') ? modelId.split('/').pop() : modelId;
    const url = `https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
    };

    const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
    if (!response.ok) throw new Error((await response.json()).error?.message || 'Gemini Error');
    const result = await response.json();
    return JSON.parse(result.candidates[0].content.parts[0].text);
}

const normalizeProvider = (provider = '') => {
    const key = String(provider || '').trim().toLowerCase();
    if (!key) return '';

    if (['gemini', 'google', 'google gemini'].includes(key)) return 'gemini';
    if (['openai'].includes(key)) return 'openai';
    if (['anthropic', 'claude'].includes(key)) return 'anthropic';
    if (['groq', 'meta/groq', 'grok'].includes(key)) return 'groq';
    if (['openrouter', 'open router'].includes(key)) return 'openrouter';
    if (['ollama', 'local', 'local ai (ollama)', 'local (ollama/lm studio)'].includes(key)) return 'ollama';
    if (['custom', 'custom api'].includes(key)) return 'custom';

    return key;
};

async function callOpenAI(file, settings, baseUrl = 'https://api.openai.com/v1') {
    const { apiKey, modelId } = settings;
    const base64Data = await fileToBase64(file);
    if (file.type === 'application/pdf' && !baseUrl.includes('groq')) throw new Error('PDF not supported via OpenAI Vision API.');

    const payload = {
        model: modelId,
        messages: [{ role: 'user', content: [{ type: 'text', text: SYSTEM_PROMPT }, { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64Data}` } }] }],
        response_format: { type: 'json_object' }
    };

    const cleanBaseUrl = String(baseUrl || '').replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error((await response.json()).error?.message || 'AI API Error');
    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
}

async function callAnthropic(file, settings) {
    const { apiKey, modelId } = settings;
    const base64Data = await fileToBase64(file);

    // Anthropic requires specific headers and format
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'dangerously-allow-browser': 'true' // Note: This usually requires a proxy in production
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens: 4096,
            system: "You are a Manufacturing Systems Engineer. Return valid JSON only.",
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: SYSTEM_PROMPT },
                    { type: 'image', source: { type: 'base64', media_type: file.type, data: base64Data } }
                ]
            }]
        })
    });
    if (!response.ok) throw new Error((await response.json()).error?.message || 'Anthropic Error');
    const result = await response.json();
    return JSON.parse(result.content[0].text);
}

export const processDocument = async (file, connector) => {
    const settings = connector?.aiSettings || connector?.config;
    if (!settings) throw new Error('AI Settings are missing.');

    const provider = normalizeProvider(settings.provider);
    const modelId = String(settings.modelId || '').trim();

    // Provider-first routing so non-Gemini providers don't get forced to Gemini
    if (provider === 'gemini') {
        if (!settings.apiKey) throw new Error('API Key missing in AI Settings.');
        return await callGemini(file, settings);
    }

    if (provider === 'openai') {
        if (!settings.apiKey) throw new Error('API Key missing in AI Settings.');
        return await callOpenAI(file, settings);
    }

    if (provider === 'anthropic') {
        if (!settings.apiKey) throw new Error('API Key missing in AI Settings.');
        return await callAnthropic(file, settings);
    }

    if (provider === 'groq') {
        if (!settings.apiKey) throw new Error('API Key missing in AI Settings.');
        return await callOpenAI(file, settings, 'https://api.groq.com/openai/v1');
    }

    if (provider === 'openrouter') {
        if (!settings.apiKey) throw new Error('API Key missing in AI Settings.');
        return await callOpenAI(file, settings, 'https://openrouter.ai/api/v1');
    }

    if (provider === 'ollama') {
        // Ollama / local OpenAI-compatible endpoint (no API key required by default)
        return await callOpenAI(file, settings, settings.baseUrl || 'http://localhost:11434/v1');
    }

    if (provider === 'custom') {
        const customBaseUrl = settings.baseUrl || connector?.serverAddress;
        if (!customBaseUrl) {
            throw new Error('Custom provider requires baseUrl in AI Settings.');
        }
        return await callOpenAI(file, settings, customBaseUrl);
    }

    // Backward compatibility fallback for legacy rows without provider
    if (modelId.toLowerCase().startsWith('gemini')) {
        if (!settings.apiKey) throw new Error('API Key missing in AI Settings.');
        return await callGemini(file, settings);
    }

    throw new Error(`Provider ${settings.provider || '(empty)'} is not yet fully implemented for document processing.`);
};

/**
 * Generic Chat Completion for various AI providers
 */
export const getChatCompletion = async (messages, connector) => {
    const settings = connector?.aiSettings || connector?.config;
    if (!settings) throw new Error('AI Settings are missing.');

    let provider = normalizeProvider(settings.provider);
    const modelId = String(settings.modelId || '').trim();
    const apiKey = settings.apiKey;
    const baseUrl = settings.baseUrl || connector?.serverAddress;

    // Backward compatibility for legacy rows where provider might be empty
    if (!provider && modelId.toLowerCase().startsWith('gemini')) {
        provider = 'gemini';
    }

    if (provider === 'gemini') {
        const cleanModelId = modelId.includes('/') ? modelId.split('/').pop() : modelId;
        const url = `https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${apiKey}`;
        const payload = {
            contents: messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            generationConfig: { temperature: 0.7 }
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error((await response.json()).error?.message || 'Gemini Chat Error');
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    }

    // OpenAI, Groq, OpenRouter, Ollama, Custom (OpenAI-compatible)
    const openAiUrl = provider === 'groq' ? 'https://api.groq.com/openai/v1' :
                     provider === 'openrouter' ? 'https://openrouter.ai/api/v1' :
                     provider === 'ollama' ? (baseUrl || 'http://localhost:11434/v1') :
                     (baseUrl || 'https://api.openai.com/v1');

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${openAiUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model: modelId,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error((await response.json()).error?.message || 'AI Chat API Error');
    const result = await response.json();
    return result.choices[0].message.content;
};

/**
 * Specialized Advice for Blockly Logic
 */
export const getLogicAdvice = async (userMessage, history, context, connector) => {
    const systemPrompt = `You are the Mavi MES Code Advisor. Your job is to help users build automation logic using Blockly code blocks.
You understand the Mavi MES MIT App Inventor-style environment.

CONTEXT:
- Available Widgets: ${JSON.stringify(context.widgets || [])}
- Available Variables: ${JSON.stringify(context.variables || [])}
- Current Step: ${context.currentStepName || 'Unknown'}

BLOCKLY XML FORMAT:
If you suggest logic, you MUST provide a valid Blockly XML snippet wrapped in <block_xml> tags.
IMPORTANT: Do NOT use markdown code blocks (like \`\`\`xml) inside the <block_xml> tags. Output the RAW XML only.
If a required widget does not exist yet, you may also include one or more widget directives in:
<add_widget>{"type":"BUTTON","label":"Start","text":"Start"}</add_widget>
Then provide the related <block_xml> snippet that uses that widget.
IMPORTANT:
- If user asks for "when button clicked" logic and no exact widget id is known, ALWAYS output <add_widget> first for a BUTTON.
- Prefer this pattern:
  <add_widget>{"type":"BUTTON","label":"AI Button","text":"Tap Me","idHint":"ai_generated_button"}</add_widget>
  <block_xml>...</block_xml>
Example:
"To make the button move, use this block:
<block_xml>
  <block type="set_universal_property">
    <value name="WIDGET">
      <block type="widget_selector"><field name="WIDGET">button_id</field></block>
    </value>
    <field name="PROP">left</field>
    <value name="VALUE">
      <block type="math_number"><field name="NUM">100</field></block>
    </value>
  </block>
</block_xml>"

Be concise and helpful. Respond in the user's language (default to Indonesian if they speak Indonesian).`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
    ];
    return await getChatCompletion(messages, connector);
};

/**
 * UPGRADE 1 — App Intelligence Snapshot
 * Analyzes the current app structure and returns a summary for the AI.
 */
const generateAppIntelligence = (context) => {
  const widgets = context.widgets || [];
  const allWidgets = (context.allScreensWidgets || []).flatMap(s => s.widgets || []);
  const steps = context.steps || [];
  const tables = context.tables || [];
  const functions = context.functions || [];
  const variables = context.variables || [];

  // Detect orphan widgets (interactive but no trigger or binding)
  const interactiveTypes = ['BUTTON','TEXT_INPUT','NUMBER_INPUT','DROPDOWN','CHECKBOX','BOOLEAN_TOGGLE','SLIDER','RADIO_GROUP','DATE_PICKER','DATETIME_PICKER','MULTI_SELECT'];
  const orphans = widgets.filter(w =>
    interactiveTypes.includes(w.type) &&
    !(w.props?.triggers || []).length &&
    !w.props?.targetVariable
  );

  // Detect inputs bound vs unbound
  const inputTypes = ['TEXT_INPUT','NUMBER_INPUT','DROPDOWN','DATE_PICKER','DATETIME_PICKER','SLIDER','CHECKBOX','RADIO_GROUP'];
  const inputWidgets = widgets.filter(w => inputTypes.includes(w.type));
  const boundInputs = inputWidgets.filter(w => w.props?.targetVariable);

  // Detect buttons with/without triggers
  const buttons = widgets.filter(w => w.type === 'BUTTON');
  const triggeredButtons = buttons.filter(w => (w.props?.triggers || []).length > 0);

  // Detect navigation between screens
  const allTriggerActions = allWidgets.flatMap(w =>
    (w.triggers || []).flatMap(t =>
      (t.actions || []).concat(
        ...(t.clauses || []).flatMap(cl => cl.actions || [])
      )
    )
  );
  const navActions = allTriggerActions.filter(a => a?.type === 'GO_TO_STEP');
  const connectedScreens = new Set(navActions.map(a => a?.payload?.stepId).filter(Boolean));

  // Detect app pattern
  const hasTable = tables.length > 0;
  const hasForm = widgets.some(w => inputTypes.includes(w.type));
  const hasDashboard = widgets.some(w => ['CHART','GAUGE','DIAL_GAUGE','MACHINE_STATUS'].includes(w.type));
  const hasMultiScreen = steps.length > 1;
  let pattern = 'Simple Screen';
  if (hasMultiScreen && hasForm && hasTable) pattern = 'Multi-Screen Form + Data App';
  else if (hasDashboard && hasTable) pattern = 'Dashboard + Monitoring App';
  else if (hasForm && hasTable) pattern = 'Data Entry Form App';
  else if (hasDashboard) pattern = 'Dashboard App';
  else if (hasForm) pattern = 'Form App (No Table Yet)';

  const completionPct = widgets.length === 0 ? 0 :
    Math.round(((triggeredButtons.length + boundInputs.length) / Math.max(1, buttons.length + inputWidgets.length)) * 100);

  const relatedAppsStr = (context.relatedApps || []).length > 0
    ? `\n▸ Related Apps for Integration: ${context.relatedApps.map(a => `"${a.name}"`).join(', ')}`
    : '';

  return `
════════════════════════════════════
🧠 APP INTELLIGENCE SNAPSHOT
════════════════════════════════════
▸ Pattern Detected: ${pattern}
▸ Screens: ${steps.length} | Widgets on Current Screen: ${widgets.length} | All App Widgets: ${allWidgets.length}${relatedAppsStr}
▸ Tables: ${tables.map(t => t.name).join(', ') || 'none'}
▸ Variables: ${variables.map(v => v.name).join(', ') || 'none'}
▸ Functions: ${functions.map(f => f.name).join(', ') || 'none'}
▸ Input Binding: ${boundInputs.length}/${inputWidgets.length} inputs bound to table columns
▸ Button Triggers: ${triggeredButtons.length}/${buttons.length} buttons have triggers
▸ Navigation Links: ${connectedScreens.size} screens connected via GO_TO_STEP
▸ App Completion Estimate: ~${completionPct}%
${orphans.length > 0 ? `⚠️ Orphan Widgets (interactive but no trigger/binding): ${orphans.map(w => `"${w.displayName || w.type}"`).join(', ')}` : '✅ No orphan widgets found'}
════════════════════════════════════`;
};

const WIDGET_CATALOG = {
    UI_INPUT: ['BUTTON','TEXT','TEXT_INPUT','TEXT_AREA','PASSWORD_TEXT','NUMBER_INPUT','CHECKBOX','BOOLEAN_TOGGLE','SLIDER','DROPDOWN','MULTI_SELECT','LIST_PICKER','LIST_VIEW','RADIO_GROUP','DATE_PICKER','DATETIME_PICKER','VARIABLE_TEXT'],
    UI_DISPLAY: ['IMAGE','EMBED_WEB','VIDEO_PLAYER','FILE_PICKER','IMAGE_PICKER','SIGNATURE_PAD','SIGNATURE','NOTIFIER','CUSTOM_WIDGET'],
    QUALITY: ['CHECKLIST','QUALITY_TOLERANCE','QUALITY_PASS_FAIL','CAMERA_CAPTURE'],
    DATA: ['INTERACTIVE_TABLE','TABLE_AGGREGATION','RECORD_DISPLAY'],
    CHARTS: ['CHART','GAUGE','DIAL_GAUGE','GAUGE_CIRCULAR','ANALYTIC'],
    SHAPES: ['SHAPE_CIRCLE','SHAPE_RECTANGLE','SHAPE_SQUARE','SHAPE_TRIANGLE','SHAPE_LINE','SHAPE_ARROW','SHAPE_DOUBLE_ARROW'],
    EMBEDDED: ['VIDEO','DOCUMENT','AI_CHAT','CAD_VIEWER','WEBPAGE','GRID','MACHINE_ATTRIBUTE','MACHINE_STATUS','MACHINE_TIMELINE','BARCODE','STEP_TIME','PDF_VIEWER','MARKDOWN'],
    MEASUREMENT: ['VISION_MEASUREMENT','MEASUREMENT_WIDGET','OUTSIDE_MICROMETER','INSIDE_MICROMETER','DIAL_HEIGHT_GAUGE','DEPTH_GAUGE','ROUGHNESS_TESTER','TORQUE_WRENCH','WEIGHING_SCALE'],
    SENSORS: ['ACCELEROMETER','BARCODE_SCANNER','BAROMETER','CLOCK','GYROSCOPE_SENSOR','HYGROMETER','LIGHT_SENSOR','LOCATION_SENSOR','NEAR_FIELD','PEDOMETER','PROXIMITY_SENSOR','THERMOMETER'],
    MEDIA: ['CAMERA','CAMCORDER','PLAYER','SOUND','SOUND_RECORDER','SPEECH_RECOGNIZER','TEXT_TO_SPEECH'],
    CONNECTIVITY: ['BLUETOOTH_CLIENT','BLUETOOTH_SERVER','SERIAL','WEB','ACTIVITY_STARTER'],
    MAPS: ['MAP','MARKER','NAVIGATION'],
    STORAGE: ['CLOUD_DB','TINY_DB','DATA_FILE','FILE','SPREADSHEET'],
    OBD2: ['OBD2_SCANNER','OBD2_RPM','OBD2_SPEED','OBD2_COOLANT_TEMP','OBD2_THROTTLE','OBD2_ENGINE_LOAD','OBD2_FUEL_LEVEL','OBD2_BATTERY_VOLTAGE','OBD2_DTC','OBD2_WARNING'],
    DRAWING: ['CANVAS','BALL','IMAGE_SPRITE'],
    SYSTEM: ['TIMER','IOT_DEVICE','IOT_CONNECTOR','DATABASE_CONNECTOR','API_CONNECTOR','LOGIC_NODE','EVENT_TRIGGER','CAMERA_SCANNER'],
    SMARTHOME: ['SMARTHOME_DEVICE','TUYA_PRODUCT'],
    ARDUINO: ['ARDUINO_BOARD','ARDUINO_PIN_MONITOR','ARDUINO_CONTROLLER','ARDUINO_GRAPH']
};

const getBuilderSystemPrompt = (context) => {
  const canvasWidth = context?.canvasWidth || 1000;
  const canvasHeight = context?.canvasHeight || 600;
  const previewDevice = context?.previewDevice || 'RESPONSIVE';
  const previewOrientation = context?.previewOrientation || 'PORTRAIT';

  // Load drawings from localStorage if running in browser
  let drawingsStr = '  - No drawings saved in Inspector Designer yet.';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const drawings = JSON.parse(window.localStorage.getItem('mavi_drawings') || '[]');
      if (drawings.length > 0) {
        drawingsStr = drawings.map(d => `  - ID: "${d.id}", Name: "${d.name}", FileName: "${d.fileName}", Format: "${d.fileType}"
    Parameters (${(d.dimensions || []).length} total):
${(d.dimensions || []).map(dim => `      * [${(dim.category || 'dimension').toUpperCase()}${dim.gdt_symbol ? ' ' + dim.gdt_symbol : ''}] Label: "${dim.label}", Variable: "${dim.variable}", Spec: "${dim.spec}" ${dim.unit || 'mm'} (Tol: ${dim.tolMin}–${dim.tolMax}), MeasureType: ${dim.measureType || 'linear_horizontal'}`).join('\n')}`).join('\n');
      }
    }
  } catch (e) {
    console.warn("Could not parse drawings for copilot prompt:", e);
  }

  // Dynamic layout helper values
  const fullWidth = canvasWidth - 40;
  const gap = 20;

  // 2-col
  const col2Width = Math.floor((canvasWidth - 60) / 2);
  const col2RightX = 20 + col2Width + gap;

  // 3-col
  const col3Width = Math.floor((canvasWidth - 80) / 3);
  const col3Col2X = 20 + col3Width + gap;
  const col3Col3X = 20 + 2 * (col3Width + gap);

  // 4-col
  const col4Width = Math.floor((canvasWidth - 100) / 4);
  const col4Col2X = 20 + col4Width + gap;
  const col4Col3X = 20 + 2 * (col4Width + gap);
  const col4Col4X = 20 + 3 * (col4Width + gap);

  // Determine device kind to give explicit layout instruction
  let layoutInstruction = '';
  if (canvasWidth < 500) {
    layoutInstruction = `LAYOUT MODE: Mobile Portrait / Narrow layout (${previewDevice} - ${previewOrientation}).
- Do NOT use multi-column layouts side-by-side.
- All widgets must be stacked vertically in a single column (x=20, w=${fullWidth}) to fit the small screen.
- Row gap should be 12-16px.
- Avoid wide elements like full-width tables or multiple horizontal KPIs. If a table (INTERACTIVE_TABLE) is used, set w=${fullWidth} and x=20, and keep its height reasonable (e.g. h=200).
- Scale down headers and title fonts (e.g. title font size 18, header height 56, header x=0, y=0, w=${canvasWidth}, h=56).`;
  } else if (canvasWidth >= 500 && canvasWidth <= 800) {
    layoutInstruction = `LAYOUT MODE: Tablet Portrait / Compact layout (${previewDevice} - ${previewOrientation}).
- You can use single column (x=20, w=${fullWidth}) or 2-column layout.
- For 2-column layout, use: Left(x=20, w=${col2Width}) and Right(x=${col2RightX}, w=${col2Width}).
- Avoid 3-column or 4-column layouts as they will overlap or get squished.
- Row gap should be 16-20px.
- Scale down header and title fonts slightly (e.g. title font size 20, header height 60, header x=0, y=0, w=${canvasWidth}, h=60).`;
  } else {
    layoutInstruction = `LAYOUT MODE: Desktop / Wide Tablet layout (${previewDevice} - ${previewOrientation}).
- You can use full-width, 2-column, 3-column, or 4-column layouts.
- Columns:
  ▸ Full-width: x=20, w=${fullWidth}
  ▸ 2-column: Left(x=20, w=${col2Width}) Right(x=${col2RightX}, w=${col2Width})
  ▸ 3-column: Col1(x=20, w=${col3Width}) Col2(x=${col3Col2X}, w=${col3Width}) Col3(x=${col3Col3X}, w=${col3Width})
  ▸ 4-column KPI: Col1(x=20, w=${col4Width}) Col2(x=${col4Col2X}, w=${col4Width}) Col3(x=${col4Col3X}, w=${col4Width}) Col4(x=${col4Col4X}, w=${col4Width})
- Row gap: 20px.
- Header: x=0, y=0, w=${canvasWidth}, h=64. Title: color='#ffffff', fontWeight='bold', fontSize=22.`;
  }

  return `
ROLE: You are "Mavi Enterprise & IoT Architect AI" — an elite multi-agent system for building world-class industrial MES and SmartHome IoT applications.

════════════════════════════════════════════════
📐 TARGET CANVAS CONFIGURATION (${previewDevice} - ${previewOrientation})
════════════════════════════════════════════════
▸ Canvas Base Width: ${canvasWidth}px
▸ Canvas Base Height: ${canvasHeight}px
▸ Target Layout Type: ${layoutInstruction}

════════════════════════════════════════════════
📦 COMPLETE WIDGET CATALOG (USE ONLY THESE EXACT TYPES)
════════════════════════════════════════════════
${Object.entries(WIDGET_CATALOG).map(([cat, types]) => `▸ ${cat}: ${types.join(', ')}`).join('\n')}

🚫 TYPE ALIASES — always convert:
Panel/Container/Box/Card/Frame/Section → SHAPE_RECTANGLE
TextInput/Input/TextField → TEXT_INPUT | TextArea/Textarea → TEXT_AREA
Label/Heading/Title/Paragraph → TEXT | Table/DataTable → INTERACTIVE_TABLE
Select/Spinner/ComboBox → DROPDOWN | Switch/Toggle → BOOLEAN_TOGGLE
NumberInput → NUMBER_INPUT | Radio/RadioGroup → RADIO_GROUP
Check/Checkbox → CHECKBOX | BarChart/LineChart/PieChart → CHART
Progress/ProgressBar → GAUGE | Scanner/QRScanner → BARCODE_SCANNER
Camera/Photo → CAMERA_CAPTURE | WebView/IFrame → EMBED_WEB
MachineStatus/StatusWidget → MACHINE_STATUS | Timeline → MACHINE_TIMELINE
SignaturePad → SIGNATURE_PAD
ArduinoBoard/Arduino/ESP32 → ARDUINO_BOARD
PinMonitor/ArduinoPin/PinInput → ARDUINO_PIN_MONITOR
PinController/RelaySwitch/PinOutput → ARDUINO_CONTROLLER
ArduinoGraph/RealtimePlotter/PinGraph → ARDUINO_GRAPH

════════════════════════════════════════════════
🔌 FITUR PENDUKUNG INTEGRASI AI & PERANGKAT KERAS
════════════════════════════════════════════════
▸ AI Chat Widget Generik (AI_CHAT): Menyediakan asisten AI serbaguna yang dapat dipasang di layar mana saja oleh pembuat aplikasi dengan custom system prompt dan model pilihan (seperti gpt-4, gemini, dll.).
▸ IoT & Hardware Integration: Didukung oleh jembatan data terintegrasi ke sensor fisik seperti pembaca serial USB / Bluetooth (Caliper/Micrometer/Scale) dan modul scanner OBD2 kendaraan untuk memproses data aktual lapangan secara otomatis.
▸ Drawing & CAD Blueprint Integration (CAD_VIEWER): Mendukung visualisasi drawing dan gambar CAD teknik. Jika pengguna meminta untuk memasukkan, menggambar, memuat, menampilkan, atau memanggil blueprint atau drawing (seperti Flange Connector, Hydraulic Cylinder, atau gambar kustom), gunakan widget CAD_VIEWER. Setel props:
  - "fileUrl": ID drawing dari daftar kustom yang tersedia (misal "dwg_flange_connector" atau "dwg_hydraulic_cylinder"), atau default blueprint.
  - "title": Judul model (misal "Visualisasi Flange" atau "3D Model").
  - "format": "DXF" | "DWG" | "PDF" | "STEP" | "IGES" (sesuai format blueprint).
  *Penting*: Hubungkan HMI Halaman dengan parameter drawing! Buat variabel global HMI (menggunakan CREATE_VARIABLE) dengan nama yang sama persis dengan "Mapped Variable" dari drawing tersebut. Nilai variabel HMI ini akan ter-sync otomatis dengan parameter drawing saat diukur atau diubah. Anda bisa menampilkan nilai variabel ini dengan VARIABLE_TEXT, atau mengikatnya sebagai targetVariable ke input field (TEXT_INPUT/NUMBER_INPUT) atau menyimpannya ke tabel produksi.


════════════════════════════════════════════════
🎨 PILLARS OF HIGH-FIDELITY INDUSTRIAL DESIGN (CRITICAL FOR PERFECT ALIGNMENT)
════════════════════════════════════════════════
1. THE GRID & VIEWPORT: All coordinates (x, y, w, h) MUST be clean integers, ideally multiples of 8. Absolutely NO overlapping elements.
2. CONTAINER INSETS (CARD GROUPING):
   - Every app screen should group functional elements inside a high-quality Container Card (SHAPE_RECTANGLE with backgroundColor:'#ffffff', borderRadius:16, bordercolor:'#e2e8f0', borderWidth:1).
   - Place this SHAPE_RECTANGLE FIRST in the command array BEFORE adding its children.
   - Children MUST be offset inside the container (min. 16px horizontal and vertical padding). For example, if a card is at x=20, w=300, its child widgets must be placed within x=36 to x=284 (max width = 248).
3. ROW-BASED ALIGNMENT:
   - For a single-column layout, all components must share the exact same 'x' coordinate (e.g. x=36) and width (w) to look perfectly aligned.
   - For multi-column layouts, calculate clean grid columns:
     - 2-Col Left: x=36, w=${col2Width - 32} | 2-Col Right: x=${col2RightX + 16}, w=${col2Width - 32}
4. CONSISTENT WIDGET HEIGHTS & FONT SIZES:
   - Inputs (TEXT_INPUT, NUMBER_INPUT), Buttons (BUTTON), and Dropdowns (DROPDOWN) must have consistent heights: 44px or 48px.
   - Label fonts: TEXT headers should have fontSize: 18 or 20 (bold, color: '#1e293b'). Small label fonts: fontSize: 13 or 14 (color: '#64748b').
5. PREMIUM INDUSTRIAL PALETTE:
   - Dark header bar (x=0, y=0, w=${canvasWidth}, h=${canvasWidth < 500 ? 56 : 64}, backgroundColor: '#0f172a') with centered white title TEXT (color: '#ffffff', fontSize: 18, fontWeight: 'bold').
   - Main Background: Default canvas is light gray, cards are white ('#ffffff').
   - Brand Primary color: '#2563eb' (Vibrant Blue). Success status: '#10b981' (Emerald). Danger status: '#ef4444' (Rose).
6. SMOOTH FLOWS & BUTTONS:
   - Every BUTTON widget must have an explicit 'backgroundColor', 'color', 'fontWeight', and 'shape: 1' (rounded) properties.
   - Align action buttons logically (e.g., bottom-right of form containers).

════════════════════════════════════════════════
📐 PRECISION LAYOUT (Canvas: ${canvasWidth}×${canvasHeight}, scrollable)
════════════════════════════════════════════════
Grid: multiples of 4. Standard sizes (scaled to fit target screen width):
  TEXT heading(w=Math.min(400, ${fullWidth}),h=32) | BUTTON(w=Math.min(160, ${fullWidth}),h=44) | TEXT_INPUT(w=Math.min(440, ${fullWidth}),h=48)
  DROPDOWN(w=Math.min(440, ${fullWidth}),h=48) | NUMBER_INPUT(w=Math.min(200, ${fullWidth}),h=48) | DATE_PICKER(w=Math.min(220, ${fullWidth}),h=48)
  GAUGE(w=Math.min(220, ${fullWidth}),h=120) | DIAL_GAUGE(w=Math.min(200, ${fullWidth}),h=200) | CHART(w=Math.min(480, ${fullWidth}),h=280)
  INTERACTIVE_TABLE(w=Math.min(960, ${fullWidth}),h=320) | MACHINE_STATUS(w=Math.min(200, ${fullWidth}),h=80)
  MACHINE_TIMELINE(w=Math.min(960, ${fullWidth}),h=200) | SIGNATURE/SIGNATURE_PAD(w=Math.min(440, ${fullWidth}),h=200)
  CHECKLIST(w=Math.min(440, ${fullWidth}),h=240) | QUALITY_PASS_FAIL(w=Math.min(440, ${fullWidth}),h=80)
  CAMERA_CAPTURE(w=Math.min(440, ${fullWidth}),h=300) | BARCODE_SCANNER(w=Math.min(320, ${fullWidth}),h=280)
  TABLE_AGGREGATION(w=Math.min(200, ${fullWidth}),h=80) | RECORD_DISPLAY(w=Math.min(440, ${fullWidth}),h=240)
  AI_CHAT(w=Math.min(440, ${fullWidth}),h=400) | MAP(w=Math.min(960, ${fullWidth}),h=360) | STEP_TIME(w=Math.min(200, ${fullWidth}),h=60)
  SMARTHOME_DEVICE(w=Math.min(220, ${fullWidth}),h=140) | TUYA_PRODUCT(w=Math.min(320, ${fullWidth}),h=420)
  ARDUINO_BOARD(w=Math.min(320, ${fullWidth}),h=180) | ARDUINO_PIN_MONITOR(w=Math.min(220, ${fullWidth}),h=120)
  ARDUINO_CONTROLLER(w=Math.min(220, ${fullWidth}),h=120) | ARDUINO_GRAPH(w=Math.min(400, ${fullWidth}),h=220)

Columns for this screen width:
  Full-width: x=20, w=${fullWidth}
  2-col: left(x=20,w=${col2Width}) right(x=${col2RightX},w=${col2Width})
  3-col: col1(x=20,w=${col3Width}) col2(x=${col3Col2X},w=${col3Width}) col3(x=${col3Col3X},w=${col3Width})
  4-col KPI: col1(x=20,w=${col4Width}) col2(x=${col4Col2X},w=${col4Width}) col3(x=${col4Col3X},w=${col4Width}) col4(x=${col4Col4X},w=${col4Width})
Vertical: header y=0 h=${canvasWidth < 500 ? 56 : 64}, content starts y=${canvasWidth < 500 ? 72 : 80}, row gap=${canvasWidth < 500 ? 12 : 20}px

════════════════════════════════════════════════
📋 WIDGET PROPS REFERENCE
════════════════════════════════════════════════
TEXT: {text, fontSize, color, fontWeight:"bold|normal", textAlignment:0/1/2, backgroundColor}
TEXT_INPUT: {hint, text, textcolor, backgroundColor, enabled:true, readOnly:false, multiLine:false}
TEXT_AREA: {hint, text, textcolor, backgroundColor, multiLine:true}
NUMBER_INPUT: {label, value:0, min:0, max:100, step:1}
BUTTON: {text, backgroundColor, color, fontSize:14, fontWeight:"bold", shape:1, textAlignment:1}
DROPDOWN: {elements:["Option 1","Option 2"], prompt:"Select...", backgroundColor, textcolor}
MULTI_SELECT: {options:["A","B"], placeholder:"Select...", maxSelections:5}
RADIO_GROUP: {label:"Choose:", options:["Option A","Option B"]}
CHECKBOX: {text:"Label", checked:false, textColor, fontSize:14}
BOOLEAN_TOGGLE: {text:"Enable", on:false, trackColorActive:"#10b981", trackColorInactive:"#94a3b8"}
SLIDER: {minValue:0, maxValue:100, defaultValue:50, colorLeft:"#3b82f6", colorRight:"#e2e8f0"}
DATE_PICKER: {text:"", fontSize:14, backgroundColor}
DATETIME_PICKER: {text:"", fontSize:14}
VARIABLE_TEXT: {variableName:"", prefix:"", suffix:"", fontSize:16, color, fontWeight:"bold"}
IMAGE: {picture:"", alternateText:"", scaling:0, clickable:false}
INTERACTIVE_TABLE: {tableId:"", title:"", columns:[{header:"Name",key:"name"}], enableFilter:true, enableExport:true, pageSize:20}
TABLE_AGGREGATION: {tableId:"", column:"", calculation:"COUNT", prefix:"", suffix:"", fontSize:24, color:"#1e293b"}
RECORD_DISPLAY: {placeholderId:"", fieldsToShow:[], backgroundColor:"#ffffff"}
CHART: {type:"Bar", description:"", gridEnabled:true, legendEnabled:true, backgroundColor:"#ffffff"}
GAUGE: {value:0, min:0, max:100, unit:"%", color:"#3b82f6", label:""}
DIAL_GAUGE: {title:"", value:0, min:0, max:100, unit:"", color:"#3b82f6"}
GAUGE_CIRCULAR: {title:"", value:0, min:0, max:100, unit:"", color:"#10b981"}
SHAPE_RECTANGLE: {backgroundColor:"#ffffff", borderRadius:12, borderWidth:0, bordercolor:"#e2e8f0"}
SHAPE_LINE: {backgroundcolor:"#e2e8f0", strokeWidth:2}
MACHINE_STATUS: {status:"RUNNING", label:"Machine", runningColor:"#10b981", stoppedColor:"#94a3b8", faultColor:"#ef4444"}
MACHINE_ATTRIBUTE: {machineId:"", attribute:"speed", value:"0", unit:"rpm"}
MACHINE_TIMELINE: {machineId:"", title:"Timeline", showLegend:true}
BARCODE: {value:"", format:"QR_CODE", showText:true, foregroundColor:"#000000"}
BARCODE_SCANNER: {label:"Scan Barcode", autoStart:false, continuousScan:false}
STEP_TIME: {mode:"ELAPSED", format:"mm:ss"}
VIDEO: {url:"", autoplay:false, controls:true, loop:false, muted:false}
AI_CHAT: {title:"AI Assistant", placeholder:"Type message...", systemPrompt:"", model:""}
CAD_VIEWER: {fileUrl:"", title:"3D View", format:"STL", showGrid:true, autoRotate:false}
WEBPAGE: {url:"https://", followLinks:true}
EMBED_WEB: {url:"https://", homeUrl:"", followLinks:true}
GRID: {rows:5, cols:5, showLines:true, cellPadding:4}
CHECKLIST: {title:"Inspection Checklist", items:["Check item 1","Check item 2"]}
QUALITY_TOLERANCE: {label:"Dimension A", min:0, max:10, unit:"mm"}
QUALITY_PASS_FAIL: {label:"Quality Check"}
CAMERA_CAPTURE: {label:"Take Photo"}
SIGNATURE: {signatureMode:"DRAW", signatureMeaning:"Approved by", required:true, signeeType:"Operator"}
SIGNATURE_PAD: {backgroundColor:"#ffffff", pencolor:"#1e293b", thickness:2, required:true}
VISION_MEASUREMENT: {label:"Measurement", unit:"mm", precision:3, min:0, max:100, targetVariable:""}
CUSTOM_WIDGET: {title:"Custom", htmlTemplate:"<div></div>", cssTemplate:"", jsTemplate:""}
MAP: {center:"-6.2,106.8", zoomLevel:14, mapType:"Roads", enablePan:true, showUser:false}
OBD2_SCANNER: {label:"OBD2 Scanner", transport:"BLUETOOTH", protocol:"AUTO"}
SMARTHOME_DEVICE: {deviceName:"Smart Switch", deviceBrand:"TUYA|BARDI|SONOFF", deviceType:"SWITCH|BULB|THERMOSTAT|AIR_CON", on:false, brightness:100, temperature:24}
TUYA_PRODUCT: {deviceName:"Tuya Smart Light", productCase:"LIGHTING|CAMERA|THERMOSTAT|AIR_PURIFIER|ROBOT_VACUUM|LOCK|PLUG|SENSOR", on:false, brightness:80, colorTemp:50, colorHex:"#ff5f00", temperature:24, targetTemperature:22, fanSpeed:"AUTO|LOW|MEDIUM|HIGH", mode:"AUTO|COOL|HEAT|DRY", batteryLevel:85, aqiValue:12, filterLife:92, locked:true, usbOn:false, powerConsumption:12.5, totalEnergy:4.8}
ARDUINO_BOARD: {label, boardType:"UNO|MEGA|NANO|ESP32", connectionType:"SERIAL|MQTT|WIFI", baudRate:9600}
ARDUINO_PIN_MONITOR: {label, pin:"A0|D13", pinMode:"ANALOG_INPUT|DIGITAL_INPUT", targetVariable}
ARDUINO_CONTROLLER: {label, pin:"13", controlType:"TOGGLE|BUTTON|SLIDER", min:0, max:255}
ARDUINO_GRAPH: {label, pin:"A0", maxSamples:50, color:"#00979d"}

════════════════════════════════════════════════
🔧 COMMANDS — BUILD (Create new elements)
════════════════════════════════════════════════

STRUCTURE COMMANDS:
{type:"SET_APP_NAME", payload:"App Name"}
{type:"ADD_STEP", payload:{title:"Screen Name"}}
{type:"ADD_WIDGET", payload:{type:"TYPE", displayName:"Name", x:N, y:N, w:N, h:N, props:{...}}}

DATA COMMANDS:
{type:"CREATE_TABLE", payload:{name:"tableName", columns:[{name:"col1",type:"text"},{name:"col2",type:"number"}]}}
{type:"CREATE_VARIABLE", payload:{name:"varName", type:"TEXT|NUMBER|BOOLEAN", defaultValue:""}}
{type:"CREATE_RECORD_PLACEHOLDER", payload:{name:"placeholderName", tableId:"tableName"}}
  ↳ tableId MUST match the EXACT name from a CREATE_TABLE command (case-insensitive match).
{type:"CREATE_FUNCTION", payload:{name:"functionName", description:"What it does", inputs:[{name:"a",type:"number"}], outputs:[{name:"res",type:"number"}], logic:{code:"// JS logic code\\nreturn a * 2;"}}}
  ↳ Triggered when user asks: "buatkan function...", "buat fungsi...", "create function...", "hitung...", etc.
{type:"CREATE_AUTOMATION", payload:{name:"automationName", description:"Rule description", trigger:{type:"TABLE_CHANGE|VARIABLE_CHANGE|TIMER|MQTT_MESSAGE",tableId:"tableName",variableName:"varName"}, conditions:[{field:"status",operator:"equals",value:"REJECT"}], actions:[{type:"SHOW_NOTIFICATION",payload:{message:"Rejected!",msgType:"error"}}]}}
  ↳ Triggered when user asks: "buatkan otomasi...", "buatkan automation...", "jika [kondisi] maka [aksi]...", "auto notification when...", etc.

TRIGGER COMMAND (creates event→action automation):
{type:"CREATE_TRIGGER", payload:{
  event:"ON_CLICK|ON_CHANGE|ON_APP_START|ON_STEP_ENTER|TIMER",
  widgetId:"<displayName of target widget>",
  actions:[<ACTION OBJECTS>]
}}

════════════════════════════════════════════════
✏️ COMMANDS — EDIT (Modify existing elements)
════════════════════════════════════════════════
IMPORTANT: Use displayName (not internal id) to reference existing widgets. The system will resolve it.

EDIT WIDGET PROPERTIES:
{type:"UPDATE_WIDGET", payload:{
  widgetName:"<exact displayName of existing widget>",
  props:{<only the props to change>}
}}
Examples:
  Change button color: {type:"UPDATE_WIDGET", payload:{widgetName:"Save Button", props:{backgroundColor:"#10b981"}}}
  Change label text:   {type:"UPDATE_WIDGET", payload:{widgetName:"Title Label", props:{text:"New Title", fontSize:24}}}
  Hide a widget:       {type:"UPDATE_WIDGET", payload:{widgetName:"Old Widget", props:{visible:false}}}
  Change dropdown options: {type:"UPDATE_WIDGET", payload:{widgetName:"Status Dropdown", props:{elements:["Active","Inactive","Pending"]}}}

EDIT TRIGGER:
{type:"UPDATE_TRIGGER", payload:{
  triggerName:"<exact trigger name or id>",
  widgetName:"<widget that owns it, if widget trigger>",
  updates:{event:"ON_CLICK", actions:[...]}
}}

EDIT VARIABLE:
{type:"UPDATE_VARIABLE", payload:{
  variableName:"<exact variable name>",
  updates:{type:"NUMBER", defaultValue:100}
}}

EDIT SCREEN:
{type:"UPDATE_STEP", payload:{
  stepTitle:"<exact screen title>",
  updates:{title:"New Screen Name", stepType:"Form Step"}
}}

EDIT FUNCTION:
{type:"UPDATE_FUNCTION", payload:{
  functionName:"<exact function name>",
  updates:{description:"Updated description", logic:{code:"return newResult;"}}
}}

════════════════════════════════════════════════
🗑️ COMMANDS — DELETE (Remove elements)
════════════════════════════════════════════════
IMPORTANT: Always confirm intent before deleting. Use exact names.

{type:"DELETE_WIDGET",   payload:{widgetName:"<exact displayName>"}}
{type:"DELETE_TRIGGER",  payload:{triggerName:"<exact trigger name or id>", widgetName:"<widget name if widget-level trigger>"}}
{type:"DELETE_VARIABLE", payload:{variableName:"<exact name>"}}
{type:"DELETE_STEP",     payload:{stepTitle:"<exact screen title>"}}
{type:"DELETE_FUNCTION", payload:{functionName:"<exact function name>"}}
{type:"DELETE_TABLE",    payload:{tableName:"<exact table name>"}}

════════════════════════════════════════════════
🎯 TRIGGER ACTIONS — PRECISE PAYLOAD FORMAT
════════════════════════════════════════════════
CRITICAL: Each action MUST have {type, payload:{...}} structure.

▸ SET_VARIABLE (set a variable value):
  {type:"SET_VARIABLE", payload:{variableName:"myVar", value:"newValue"}}

▸ RUN_FUNCTION (execute a visual workflow/logic function from FunctionsEditor):
  {type:"RUN_FUNCTION", payload:{functionName:"<name of function>"}}

▸ TABLE_RECORD_SAVE (save form data via placeholder):
  {type:"TABLE_RECORD_SAVE", payload:{placeholderId:"<name of created placeholder>"}}

▸ TABLE_RECORD_CREATE (create new record via placeholder):
  {type:"TABLE_RECORD_CREATE", payload:{placeholderId:"<name of created placeholder>"}}

▸ GO_TO_STEP (navigate to screen):
  {type:"GO_TO_STEP", payload:{stepId:"<title of target screen>"}}

▸ NEXT_STEP / PREV_STEP:
  {type:"NEXT_STEP", payload:{}}
  {type:"PREV_STEP", payload:{}}

▸ SHOW_NOTIFICATION (toast message):
  {type:"SHOW_NOTIFICATION", payload:{message:"Data saved!", msgType:"success|error|warning"}}

▸ COMPLETE_APP / CANCEL_APP:
  {type:"COMPLETE_APP", payload:{}}
  {type:"CANCEL_APP", payload:{}}

▸ OPEN_URL:
  {type:"OPEN_URL", payload:{url:"https://...", target:"_blank"}}

▸ SEND_WEBHOOK:
  {type:"SEND_WEBHOOK", payload:{url:"https://...", method:"POST", body:{}}}

════════════════════════════════════════════════
📝 COMPLETE FORM APP EXAMPLE (follow this pattern!)
════════════════════════════════════════════════
Order MUST be: CREATE_TABLE → CREATE_VARIABLE → CREATE_RECORD_PLACEHOLDER → ADD_WIDGET → CREATE_TRIGGER

Example for a data entry form:
1. {type:"CREATE_TABLE", payload:{name:"production_log", columns:[{name:"product",type:"text"},{name:"qty",type:"number"},{name:"status",type:"text"}]}}
2. {type:"CREATE_VARIABLE", payload:{name:"totalQty", type:"NUMBER", defaultValue:0}}
3. {type:"CREATE_RECORD_PLACEHOLDER", payload:{name:"productionRecord", tableId:"production_log"}}
4. {type:"ADD_WIDGET", payload:{type:"TEXT_INPUT", displayName:"Product Input", x:20, y:100, w:440, h:48, props:{hint:"Enter product name", targetVariable:"production_log.product"}}}
5. {type:"ADD_WIDGET", payload:{type:"NUMBER_INPUT", displayName:"Qty Input", x:20, y:164, w:200, h:48, props:{label:"Quantity", targetVariable:"production_log.qty"}}}
6. {type:"ADD_WIDGET", payload:{type:"BUTTON", displayName:"Save Button", x:20, y:228, w:200, h:44, props:{text:"💾 Save", backgroundColor:"#10b981", color:"#ffffff", fontWeight:"bold", shape:1}}}
7. {type:"CREATE_TRIGGER", payload:{event:"ON_CLICK", widgetId:"Save Button", actions:[
     {type:"TABLE_RECORD_SAVE", payload:{placeholderId:"productionRecord"}},
     {type:"SHOW_NOTIFICATION", payload:{message:"Data berhasil disimpan!", msgType:"success"}}
   ]}}

════════════════════════════════════════════════
⚡ BEHAVIORAL RULES (CRITICAL)
════════════════════════════════════════════════
1. AGENTIC: Output commands IMMEDIATELY. Never explain without commands.
2. COMPLETE LOGIC CHAIN: Always pair UI with its underlying data logic.
   - Form → CREATE_TABLE first, then CREATE_RECORD_PLACEHOLDER, then input widgets with targetVariable.
   - Save Button → CREATE_TRIGGER ON_CLICK with TABLE_RECORD_SAVE action.
   - Interactive Table → CREATE_TABLE first, then widget with matching tableId.
   - Navigation → CREATE_TRIGGER with GO_TO_STEP action (use screen title as stepId).
3. MINIMUM: Simple ≥ 15 widgets. Medium ≥ 25. Full app ≥ 35.
4. ALWAYS: SET_APP_NAME first, then dark header SHAPE_RECTANGLE + white TEXT title.
5. ALWAYS: SHAPE_RECTANGLE card BEFORE its child widgets in commands array.
6. PRECISION: Coordinates multiples of 4. No overlapping widgets.
7. CONTEXT-AWARE: Don't duplicate existing widgets/tables/variables. Check current context first!
8. CROSS-REFERENCE: Use displayName to reference widgets in triggers. Use table name for placeholders.
9. INDUSTRIAL: Manufacturing → use MACHINE_STATUS, GAUGE, CHECKLIST, SIGNATURE, QUALITY_PASS_FAIL.
10. MULTI-SCREEN: Use ADD_STEP for logical sections. Add GO_TO_STEP trigger actions for navigation buttons.
11. VARIABLE BINDING: Input widgets MUST have targetVariable prop matching "tableName.columnName" for auto-harvest.
12. EDIT MODE: When user asks to "change", "update", "modify", "ubah", "ganti", "edit" something → use UPDATE_WIDGET, UPDATE_TRIGGER, UPDATE_VARIABLE, UPDATE_STEP, UPDATE_FUNCTION.
13. DELETE MODE: When user asks to "remove", "delete", "hapus", "buang" something → use DELETE_* commands.
14. EDIT ONLY WHAT'S ASKED: On UPDATE commands, only include the specific props/fields user wants changed.
15. DATA COMMANDS: Never output table columns (like UUID, RECORD, TEXT) directly as top-level objects in the "commands" array. Columns MUST always be nested inside the columns array of a CREATE_TABLE command payload: {type:"CREATE_TABLE", payload:{name:"tableName", columns:[{name:"colName", type:"text"}]}}.
16. HELP GUIDE: When user asks to generate, update, or create a "panduan", "help", "user guide", "panduan penggunaan", "cara pakai", "dokumentasi" — ALWAYS output UPDATE_HELP_GUIDE command. This creates a comprehensive Markdown guide that operators will see as a full-screen splash BEFORE starting the app. If the app does not exist yet or is empty, draft a guide that outlines the proposed structure, screens, tables, triggers, and workflow of the planned app to help map out the design.

════════════════════════════════════════════════
📖 HELP GUIDE COMMAND
════════════════════════════════════════════════
{type:"UPDATE_HELP_GUIDE", payload:{markdown:"..."}}

Help Guide Markdown MUST include these sections:
# [App Name] — Panduan Penggunaan

## 📱 Tentang Aplikasi
[Brief description of what the app does and who uses it]

## 🖥️ Daftar Screen
[List each screen, its purpose, and what the user does on it]

## 🔄 Alur Kerja (Flow)
[Step-by-step flow: Screen 1 → action → Screen 2 → ...]

## ⚡ Trigger & Otomasi
[List all important triggers: which button does what, what happens on screen change]

## 🗄️ Tabel & Data
[List each table, its columns, what data is stored, and which form fills it]

## 🔗 Koneksi Antar Tabel
[Explain how tables relate to each other via placeholders or shared fields]

## 🤖 Fungsi & Logic
[Explain each function: its name, what it computes, when it runs]

## 🤖 Automasi
[List automations: trigger condition → action that fires]

## 📝 Cara Mengisi Data
[Step-by-step instructions for operators: exactly what to fill in, where to click]

## ⚠️ Catatan Penting
[Any validation rules, required fields, edge cases, common errors]

IMPORTANT: Base the guide on ACTUAL context if the app is already partially or fully built. If the user is planning a new app, asks to create a guide for a proposed app, or if the canvas/context is empty, draft a comprehensive guide that outlines the proposed screens, variables, tables, functions, and workflow of the planned app to help map out the design first. Do NOT refuse to create the guide if the canvas is empty or has no widgets. Write in Bahasa Indonesia unless user requests English.

CURRENT CONTEXT:
- Active Screen: ${context.currentStepName || 'Screen 1'} (ID: ${context.currentStepId || ''})
- Widgets on Active Screen: ${JSON.stringify((context.widgets || []).map(w => ({
    id: w.id, type: w.type, name: w.displayName,
    x: w.x, y: w.y, w: w.w, h: w.h,
    props: (() => {
      const p = { ...(w.props || {}) };
      delete p.triggers; // listed separately below
      return p;
    })(),
    triggers: (w.props?.triggers || []).map(t => ({ id: t.id, name: t.name, event: t.event, clauseCount: (t.clauses || []).length, actions: (t.clauses || []).flatMap(cl => (cl.actions || []).map(a => ({ type: a.type, payload: a.payload }))) }))
  })))}
- All Screens Summary: ${JSON.stringify((context.steps || []).map(s => ({ id: s.id, title: s.title, stepType: s.stepType, widgetCount: (s.components || []).length, widgetNames: (s.components || []).map(w => w.displayName) })))}
- All Screens Widgets (for cross-screen edits): ${JSON.stringify((context.allScreensWidgets || []).map(sc => ({ screen: sc.screenTitle, widgets: sc.widgets.map(w => ({ name: w.name, type: w.type, props: (() => { const p = { ...(w.props || {}) }; delete p.triggers; return p; })(), triggers: w.triggers })) })))}
- Variables: ${JSON.stringify((context.variables || []).map(v => ({ name: v.name, type: v.type, defaultValue: v.defaultValue, value: v.value })))}
- Tables: ${JSON.stringify((context.tables || []).map(t => ({ id: t.id, name: t.name, columns: (t.fields || t.columns || []).map(c => ({ name: c.name, type: c.type })) })))}
- Placeholders: ${JSON.stringify((context.recordPlaceholders || []).map(r => ({ id: r.id, name: r.name, tableId: r.tableId })))}
- Global Triggers: ${JSON.stringify((context.triggers || []).filter(t => !t._isAutomation).map(t => ({ id: t.id, name: t.name, event: t.event, actions: (t.clauses || []).flatMap(cl => (cl.actions || []).map(a => ({ type: a.type, payload: a.payload }))) })))}
- Functions: ${JSON.stringify((context.functions || []).map(f => ({ id: f.id, name: f.name, description: f.description || '', codeSnippet: String(f.logic?.code || '').slice(0, 200) })))}
- Automations: ${JSON.stringify((context.automations || []).map(a => ({ id: a.id, name: a.name, trigger: a.trigger, conditions: a.conditions, actions: a.actions })))}
- ⭐ CURRENTLY SELECTED WIDGET: ${context.selectedWidget ? JSON.stringify({ id: context.selectedWidget.id, type: context.selectedWidget.type, name: context.selectedWidget.displayName || context.selectedWidget.props?.label || context.selectedWidget.type, existingTriggers: (context.selectedWidget.props?.triggers || []).map(t => ({ id: t.id, name: t.name, event: t.event })) }) : 'none (no widget selected)'}
- 📖 EXISTING HELP GUIDE: ${context.helpGuide ? `(guide exists, ${context.helpGuide.length} chars — update it)` : '(no guide yet — create from scratch)'}
- 🔗 INTEGRASI APLIKASI TERKAIT (RELATED APPS - the user wants to connect with these apps): ${JSON.stringify(context.relatedApps || [])}
- 📐 DRAWINGS & BLUEPRINTS DATABASE (tersimpan di Inspector Designer):
${drawingsStr}

IMPORTANT: When the user says "add trigger", "add function", "tambahkan trigger", "tambahkan function" WITHOUT specifying a widget name, ALWAYS target the CURRENTLY SELECTED WIDGET above. Use its exact "name" as the widgetId in CREATE_TRIGGER commands.

OUTPUT: Brief explanation (Indonesian if user writes Indonesian), then <ai_plan>...</ai_plan>, then ALWAYS:
<builder_cmds>
{"commands": [...]}
</builder_cmds>`;
};

/**
 * Enhanced AI Architect Engine for Mavi-MES
 * Includes Planning System, Session Memory, and Layout Intelligence
 */
export const getBuilderCopilotAdvice = async (userInput, messageHistory, context, connector) => {
  const settings = connector?.aiSettings || connector?.config;
  if (!connector || !settings?.apiKey) {
    throw new Error('AI Connector not configured');
  }

  const intelligenceBlock = generateAppIntelligence(context);
  const fullSystemPrompt = getBuilderSystemPrompt(context) + '\n' + intelligenceBlock;

  // UPGRADE 3 — Rolling Memory: prepend session summary if provided
  const summaryBlock = context.sessionSummary
      ? { role: 'system', content: `📋 SESSION SUMMARY (previous conversation):\n${context.sessionSummary}` }
      : null;

  const messages = [
      { role: 'system', content: fullSystemPrompt },
      ...(summaryBlock ? [summaryBlock] : []),
      ...messageHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userInput }
  ];

  return await getChatCompletion(messages, connector);
};

/**
 * UPGRADE 2 — Streaming Builder Copilot Advice
 * Streams response token-by-token via onChunk callback
 */
export const streamBuilderCopilotAdvice = async (userInput, messageHistory, context, connector, onChunk) => {
    const settings = connector?.aiSettings || connector?.config;
    if (!connector || !settings?.apiKey) throw new Error('AI Connector not configured');

    const provider = normalizeProvider(settings.provider);
    const modelId = String(settings.modelId || '').trim();
    const apiKey = settings.apiKey;

    // Build messages same as getBuilderCopilotAdvice (reuse the function to get full system prompt)
    // We call the non-streaming version to get the full response if streaming not supported
    const intelligenceBlock = generateAppIntelligence(context);
    const fullSystemPrompt = getBuilderSystemPrompt(context) + '\n' + intelligenceBlock;

    const summaryBlock = context.sessionSummary
        ? { role: 'system', content: `📋 SESSION SUMMARY:\n${context.sessionSummary}` }
        : null;

    const streamMessages = [
        { role: 'system', content: fullSystemPrompt },
        ...(summaryBlock ? [summaryBlock] : []),
        ...messageHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userInput }
    ];

    if (provider === 'gemini') {
        const cleanModelId = modelId.includes('/') ? modelId.split('/').pop() : modelId;
        const url = `https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:streamGenerateContent?key=${apiKey}&alt=sse`;
        
        const combinedSystemPrompt = summaryBlock
            ? `${fullSystemPrompt}\n\n📋 SESSION SUMMARY:\n${context.sessionSummary}`
            : fullSystemPrompt;

        const payload = {
            contents: streamMessages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            systemInstruction: {
                parts: [{ text: combinedSystemPrompt }]
            },
            generationConfig: { temperature: 0.7 }
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Gemini Stream Error');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
            for (const line of lines) {
                try {
                    const data = JSON.parse(line.slice(6));
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (text) { fullText += text; onChunk(text); }
                } catch { /* skip malformed chunks */ }
            }
        }
        return fullText;
    }

    // OpenAI-compatible streaming (OpenAI, Groq, OpenRouter, Ollama, Custom)
    const baseUrl = provider === 'groq' ? 'https://api.groq.com/openai/v1' :
        provider === 'openrouter' ? 'https://openrouter.ai/api/v1' :
        provider === 'ollama' ? (settings.baseUrl || 'http://localhost:11434/v1') :
        (settings.baseUrl || 'https://api.openai.com/v1');

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST', headers,
        body: JSON.stringify({
            model: modelId,
            messages: streamMessages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            stream: true
        })
    });
    if (!response.ok) throw new Error('Stream API Error');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
        for (const line of lines) {
            try {
                const data = JSON.parse(line.slice(6));
                const text = data?.choices?.[0]?.delta?.content || '';
                if (text) { fullText += text; onChunk(text); }
            } catch { /* skip */ }
        }
    }
    return fullText;
};

/**
 * Specialized Vision Advice for App Builder (Images to App)
 */
export const getBuilderVisionAdvice = async (file, context, connector) => {
    const settings = connector?.aiSettings || connector?.config;
    if (!settings) throw new Error('AI Settings are missing.');

    const canvasWidth = context?.canvasWidth || 1000;
    const canvasHeight = context?.canvasHeight || 600;
    const previewDevice = context?.previewDevice || 'RESPONSIVE';
    const previewOrientation = context?.previewOrientation || 'PORTRAIT';

    const systemPrompt = `You are the Mavi MES Vision Engineer. Analyze the provided image (mockup, whiteboard, or screenshot) and convert it into a Mavi MES application structure.

VALID WIDGET TYPES (USE ONLY THESE):
BUTTON, TEXT, TEXT_INPUT, TEXT_AREA, CHECKBOX, BOOLEAN_TOGGLE, SLIDER, DROPDOWN,
MULTI_SELECT, LIST_PICKER, LIST_VIEW, RADIO_GROUP, DATE_PICKER, DATETIME_PICKER,
IMAGE, SIGNATURE, CHECKLIST, QUALITY_TOLERANCE, QUALITY_PASS_FAIL, CAMERA_CAPTURE,
INTERACTIVE_TABLE, CHART, GAUGE, SHAPE_RECTANGLE, SHAPE_CIRCLE, BARCODE,
NUMBER_INPUT, VARIABLE_TEXT, CUSTOM_WIDGET

TYPE ALIASES (use the correct type instead):
- Panel/Container/Box/Card → SHAPE_RECTANGLE
- Input/TextInput → TEXT_INPUT
- Label/Heading → TEXT
- Table/DataTable → INTERACTIVE_TABLE
- Select → DROPDOWN
- Switch/Toggle → BOOLEAN_TOGGLE

Output MUST be a JSON object inside <builder_cmds> tags following this structure:
<builder_cmds>
{
  "commands": [
    {
      "type": "SET_APP_NAME",
      "payload": "New App Name"
    },
    {
      "type": "ADD_STEP",
      "payload": { "title": "Step 1", "components": [...] }
    }
  ]
}
</builder_cmds>

Canvas size is ${canvasWidth}x${canvasHeight} (Device: ${previewDevice}, Orientation: ${previewOrientation}). Map visual elements to coordinates accurately.
Identify: Buttons (BUTTON), Labels (TEXT), Inputs (TEXT_INPUT), Images (IMAGE), Tables (INTERACTIVE_TABLE).`;

    // We use the existing processDocument logic but with a specialized prompt
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;
    const provider = normalizeProvider(settings.provider);
    const modelId = settings.modelId;

    if (provider === 'gemini') {
        const cleanModelId = modelId.includes('/') ? modelId.split('/').pop() : modelId;
        const url = `https://generativelanguage.googleapis.com/v1/models/${cleanModelId}:generateContent?key=${settings.apiKey}`;
        const payload = {
            contents: [{ role: 'user', parts: [{ text: systemPrompt }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
            generationConfig: { temperature: 0.1 }
        };
        const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
        if (!response.ok) throw new Error('Gemini Vision Error');
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    }

    // Fallback to callOpenAI or others if implemented...
    throw new Error('Vision provider not fully optimized for Builder yet.');
};

/**
 * AI Insight for Analytics 
 */
export const getAnalysisInsight = async (analysisData, config, connector) => {
    const systemPrompt = `You are an Industrial Data Analyst. Analyze the provided manufacturing data and provide insights.
    
    ANALYSIS CONFIG:
    - Type: ${config.type}
    - Table: ${config.tableId}
    - Metric: ${config.aggregation} of ${config.yAxisColumn}
    - Dimension: ${config.xAxisColumn}
    
    DATASET:
    ${JSON.stringify(analysisData)}

    Your response MUST be formatted in Markdown and include:
    1. **Summary**: A brief overview of the data.
    2. **Anomalies**: Any significant outliers or strange patterns.
    3. **Trends**: Upward/downward trends or stability.
    4. **Actionable Tips**: 3 specific things the manager should do based on this data.

    Be professional, data-driven, and concise. Respond in the user's language (default to Indonesian if they speak Indonesian).`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze this data and give me insights.' }
    ];

    return await getChatCompletion(messages, connector);
};

/**
 * UPGRADE 8 — App Diagnosis
 * Full health scan of the app → returns markdown report + optional auto-fix commands
 */
export const diagnoseApp = async (context, connector) => {
    const settings = connector?.aiSettings || connector?.config;
    if (!settings?.apiKey) throw new Error('AI Connector not configured');

    const intelligence = generateAppIntelligence(context);

    const appSnapshot = {
        screens: (context.steps || []).map(s => ({
            title: s.title,
            type: s.stepType,
            widgetCount: (s.components || []).length,
            widgets: (s.components || []).map(w => ({
                name: w.displayName, type: w.type,
                hasBinding: !!w.props?.targetVariable,
                hasTrigger: (w.props?.triggers || []).length > 0,
                tableId: w.props?.tableId || null
            }))
        })),
        tables: (context.tables || []).map(t => ({ name: t.name, columns: (t.fields || t.columns || []).map(c => c.name) })),
        variables: (context.variables || []).map(v => ({ name: v.name, type: v.type })),
        functions: (context.functions || []).map(f => ({ name: f.name, description: f.description })),
        triggers: (context.triggers || []).filter(t => !t._isAutomation).map(t => ({ name: t.name, event: t.event })),
        placeholders: (context.recordPlaceholders || []).map(r => ({ name: r.name, tableId: r.tableId }))
    };

    const systemPrompt = `You are a Senior MES Application Quality Assurance Engineer and Expert Reviewer.
Analyze this Mavi MES application structure and provide a comprehensive diagnosis.

Your response MUST be structured in these sections:
## ✅ Yang Sudah Bagus
## ⚠️ Yang Perlu Diperbaiki
## 🚀 Rekomendasi Peningkatan
## 🔗 Missing Connections (binding/trigger/navigasi yang belum ada)
## 🤖 Auto-Fix Commands

For "Auto-Fix Commands", output ONLY valid JSON inside <builder_cmds> tags with commands to fix the issues you identified.
For example, bind unbound inputs, add missing triggers, create missing placeholders.
If nothing to fix, output <builder_cmds>{"commands":[]}</builder_cmds>

Be specific, actionable, and respond in Indonesian.`;

    const userMessage = `Ini adalah struktur aplikasi yang perlu didiagnosis:

${intelligence}

Detail lengkap:
${JSON.stringify(appSnapshot, null, 2)}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];

    return await getChatCompletion(messages, connector);
};

/**
 * AI Function Generator for FunctionsEditor
 */
export const generateAiFunction = async (userPrompt, connector) => {
    const systemPrompt = `You are a Lead Software Architect specializing in industrial visual workflow functions.
Generate a structured Function definition based on the user's prompt.

Output MUST be a valid JSON object matching this schema:
{
  "name": "Function Name",
  "description": "Short explanation of what the function does",
  "category": "Produktivitas|Kualitas|Matematika|Kustom",
  "inputs": [
    { "id": 1, "name": "inputName", "type": "number|string|boolean", "description": "input desc" }
  ],
  "outputs": [
    { "id": 1, "name": "outputName", "type": "number|string|boolean", "description": "output desc" }
  ],
  "logic": {
    "code": "// JavaScript code implementing the function logic\\nreturn result;"
  },
  "nodes": [
    { "id": "start", "type": "default", "data": { "label": "Start" }, "position": { "x": 250, "y": 0 } },
    { "id": "fx-call", "type": "functionCall", "data": { "label": "Formula / Logic summary" }, "position": { "x": 240, "y": 120 } },
    { "id": "return", "type": "return", "data": { "label": "Return" }, "position": { "x": 230, "y": 280 } },
    { "id": "end", "type": "default", "data": { "label": "End" }, "position": { "x": 250, "y": 420 } }
  ],
  "edges": [
    { "id": "e1", "source": "start", "target": "fx-call", "type": "addNode" },
    { "id": "e2", "source": "fx-call", "target": "return", "type": "addNode" },
    { "id": "e3", "source": "return", "target": "end", "type": "addNode" }
  ]
}

Return ONLY valid raw JSON. No markdown code blocks, no explanation.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    const rawResponse = await getChatCompletion(messages, connector);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI response did not contain valid JSON');
    return JSON.parse(jsonMatch[0]);
};

/**
 * AI Automation Generator for AutomationEditor
 */
export const generateAiAutomation = async (userPrompt, connector) => {
    const systemPrompt = `You are an Industrial MES & Smart Automation Engineer.
Generate a structured Automation Rule & Visual Flow definition based on the user's prompt.

CRITICAL REQUIREMENT — NODE TYPES:
You MUST use ONLY the following valid Node-RED Palette node types for the "nodes" array:
- "event": Trigger Node. Requires data: { label: "Descriptive Name", triggerType: "TABLE_ROW_ADDED"|"TIMER"|"WEBHOOK"|"GMAIL_TRIGGER"|"TELEGRAM_TRIGGER"|"MACHINE_TRIGGER" }
- "decision": IF Condition Branch Node. Requires data: { label: "IF condition text" }. Connect outgoing edge from "yes" handle for true, "no" handle for false.
- "switch": Multi-Branch Route Node. Requires data: { label: "Switch Rule" }. Connect outgoing edge from "b1", "b2", "b3", or "fallback" handle.
- "action": Executable Action Node. Requires data: { type: "SEND_NOTIFICATION"|"HTTP_REQUEST"|"UPDATE_RECORD"|"CREATE_RECORD"|"GMAIL"|"TELEGRAM"|"SLACK"|"WHATSAPP"|"SPREADSHEET"|"ERP_CRM"|"MQTT_PUBLISH", label: "Action Name" }
- "code": Custom JS/Python Code Node. Requires data: { label: "Script Name" }
- "set": Set Variables / Edit Fields Node. Requires data: { label: "Set Fields" }
- "filter": Filter Data Stream Node. Requires data: { label: "Filter Condition" }
- "loop": Loop Iteration Node. Requires data: { label: "Loop Items" }. Outgoing handles: "body", "exit".
- "wait": Pause Delay Node. Requires data: { label: "Wait duration" }
- "database": Query DB Node. Requires data: { label: "Query DB" }
- "send_email": Send Email SMTP Node. Requires data: { label: "Send Email" }
- "sub_workflow": Call Child Workflow Node. Requires data: { label: "Call Sub-Workflow" }
- "error_trigger": Catch Error Fallback Node. Requires data: { label: "Catch Error" }

DO NOT use "eventNode", "conditionNode", "actionNode", or generic custom types. ONLY use the exact types above.

Output MUST be a valid JSON object matching this schema:
{
  "name": "Automation Name",
  "description": "Short explanation of trigger and actions",
  "active": true,
  "trigger": {
    "type": "TABLE_CHANGE|VARIABLE_CHANGE|TIMER|MQTT_MESSAGE|REST_WEBHOOK",
    "event": "ON_INSERT|ON_UPDATE|ON_CHANGE",
    "tableId": "tableName",
    "variableName": "varName"
  },
  "conditions": [
    { "field": "status", "operator": "equals", "value": "FAIL" }
  ],
  "actions": [
    { "type": "SHOW_NOTIFICATION", "payload": { "message": "Notification message", "msgType": "warning" } }
  ],
  "nodes": [
    { "id": "n1", "type": "event", "data": { "label": "QC Table Insert", "triggerType": "TABLE_ROW_ADDED" }, "position": { "x": 250, "y": 50 } },
    { "id": "n2", "type": "decision", "data": { "label": "Check Status == FAIL" }, "position": { "x": 250, "y": 200 } },
    { "id": "n3", "type": "action", "data": { "type": "SEND_NOTIFICATION", "label": "Show Alert Notif" }, "position": { "x": 250, "y": 350 } }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" },
    { "id": "e2", "source": "n2", "target": "n3", "sourceHandle": "yes" }
  ]
}

Return ONLY valid raw JSON. No markdown code blocks, no explanation.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    const rawResponse = await getChatCompletion(messages, connector);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI response did not contain valid JSON');
    return JSON.parse(jsonMatch[0]);
};

