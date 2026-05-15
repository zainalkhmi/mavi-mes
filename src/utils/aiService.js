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
SHAPE_RECTANGLE, NUMBER_INPUT, VARIABLE_TEXT, SLIDER, DATE_PICKER, DATETIME_PICKER

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
 * Enhanced AI Architect Engine for Mavi-MES
 * Includes Planning System, Session Memory, and Layout Intelligence
 */
export const getBuilderCopilotAdvice = async (userInput, messageHistory, context, connector) => {
  const settings = connector?.aiSettings || connector?.config;
  if (!connector || !settings?.apiKey) {
    throw new Error('AI Connector not configured');
  }

  const WIDGET_CATALOG = {
    UI_INPUT: ['BUTTON','TEXT','TEXT_INPUT','TEXT_AREA','PASSWORD_TEXT','NUMBER_INPUT','CHECKBOX','BOOLEAN_TOGGLE','SLIDER','DROPDOWN','MULTI_SELECT','LIST_PICKER','LIST_VIEW','RADIO_GROUP','DATE_PICKER','DATETIME_PICKER','VARIABLE_TEXT'],
    UI_DISPLAY: ['IMAGE','EMBED_WEB','VIDEO_PLAYER','FILE_PICKER','IMAGE_PICKER','SIGNATURE_PAD','SIGNATURE','NOTIFIER','CUSTOM_WIDGET'],
    QUALITY: ['CHECKLIST','QUALITY_TOLERANCE','QUALITY_PASS_FAIL','CAMERA_CAPTURE'],
    DATA: ['INTERACTIVE_TABLE','TABLE_AGGREGATION','RECORD_DISPLAY'],
    CHARTS: ['CHART','GAUGE','DIAL_GAUGE','GAUGE_CIRCULAR','ANALYTIC'],
    SHAPES: ['SHAPE_CIRCLE','SHAPE_RECTANGLE','SHAPE_SQUARE','SHAPE_TRIANGLE','SHAPE_LINE','SHAPE_ARROW','SHAPE_DOUBLE_ARROW'],
    EMBEDDED: ['VIDEO','DOCUMENT','AI_CHAT','CAD_VIEWER','WEBPAGE','GRID','MACHINE_ATTRIBUTE','MACHINE_STATUS','MACHINE_TIMELINE','BARCODE','STEP_TIME','PDF_VIEWER'],
    MEASUREMENT: ['VISION_MEASUREMENT','MEASUREMENT_WIDGET','OUTSIDE_MICROMETER','INSIDE_MICROMETER','DIAL_HEIGHT_GAUGE','DEPTH_GAUGE','ROUGHNESS_TESTER','TORQUE_WRENCH','WEIGHING_SCALE'],
    SENSORS: ['ACCELEROMETER','BARCODE_SCANNER','BAROMETER','CLOCK','GYROSCOPE_SENSOR','HYGROMETER','LIGHT_SENSOR','LOCATION_SENSOR','NEAR_FIELD','PEDOMETER','PROXIMITY_SENSOR','THERMOMETER'],
    MEDIA: ['CAMERA','CAMCORDER','PLAYER','SOUND','SOUND_RECORDER','SPEECH_RECOGNIZER','TEXT_TO_SPEECH'],
    CONNECTIVITY: ['BLUETOOTH_CLIENT','BLUETOOTH_SERVER','SERIAL','WEB','ACTIVITY_STARTER'],
    MAPS: ['MAP','MARKER','NAVIGATION'],
    STORAGE: ['CLOUD_DB','TINY_DB','DATA_FILE','FILE','SPREADSHEET'],
    OBD2: ['OBD2_SCANNER','OBD2_RPM','OBD2_SPEED','OBD2_COOLANT_TEMP','OBD2_THROTTLE','OBD2_ENGINE_LOAD','OBD2_FUEL_LEVEL','OBD2_BATTERY_VOLTAGE','OBD2_DTC'],
    DRAWING: ['CANVAS','BALL','IMAGE_SPRITE'],
    SYSTEM: ['TIMER','IOT_DEVICE','IOT_CONNECTOR','DATABASE_CONNECTOR','API_CONNECTOR','LOGIC_NODE','EVENT_TRIGGER','CAMERA_SCANNER']
  };

  const systemPrompt = `
ROLE: You are "Mavi Enterprise Architect AI" — an elite multi-agent system for building world-class industrial MES applications.

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

════════════════════════════════════════════════
🎨 ENTERPRISE DESIGN RULES
════════════════════════════════════════════════
Colors: primary=#3b82f6, success=#10b981, warning=#f59e0b, danger=#ef4444, dark=#0f172a, light=#f8fafc
- ALWAYS: dark SHAPE_RECTANGLE header (x=0,y=0,w=1000,h=64,backgroundColor='#0f172a') + white TEXT title (color='#ffffff',fontWeight='bold',fontSize=22,textAlignment=1)
- ALWAYS: group widgets in white card panels (SHAPE_RECTANGLE with backgroundColor='#ffffff',borderRadius=12)
- Place SHAPE_RECTANGLE BEFORE its child widgets in command order
- Gap between cards: 16px min. Buttons: fontWeight='bold',shape=1,backgroundColor='#3b82f6',color='#ffffff'

════════════════════════════════════════════════
📐 PRECISION LAYOUT (Canvas: 1000×600, scrollable)
════════════════════════════════════════════════
Grid: multiples of 4. Standard sizes:
  TEXT heading(w=400,h=32) | BUTTON(w=160,h=44) | TEXT_INPUT(w=440,h=48)
  DROPDOWN(w=440,h=48) | NUMBER_INPUT(w=200,h=48) | DATE_PICKER(w=220,h=48)
  GAUGE(w=220,h=120) | DIAL_GAUGE(w=200,h=200) | CHART(w=480,h=280)
  INTERACTIVE_TABLE(w=960,h=320) | MACHINE_STATUS(w=200,h=80)
  MACHINE_TIMELINE(w=960,h=200) | SIGNATURE/SIGNATURE_PAD(w=440,h=200)
  CHECKLIST(w=440,h=240) | QUALITY_PASS_FAIL(w=440,h=80)
  CAMERA_CAPTURE(w=440,h=300) | BARCODE_SCANNER(w=320,h=280)
  TABLE_AGGREGATION(w=200,h=80) | RECORD_DISPLAY(w=440,h=240)
  AI_CHAT(w=440,h=400) | MAP(w=960,h=360) | STEP_TIME(w=200,h=60)

Columns:
  Full-width: x=20, w=960
  2-col: left(x=20,w=460) right(x=500,w=460)
  3-col: x=20/w=300, x=360/w=300, x=700/w=280
  4-col KPI: x=20/w=226, x=258/w=226, x=496/w=226, x=734/w=226
Vertical: header y=0 h=64, content starts y=80, row gap=20px

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
VISION_MEASUREMENT: {label:"Measurement", unit:"mm", precision:2, min:0, max:100, targetVariable:""}
CUSTOM_WIDGET: {title:"Custom", htmlTemplate:"<div></div>", cssTemplate:"", jsTemplate:""}
MAP: {center:"-6.2,106.8", zoomLevel:14, mapType:"Roads", enablePan:true, showUser:false}
OBD2_SCANNER: {label:"OBD2 Scanner", transport:"BLUETOOTH", protocol:"AUTO"}

════════════════════════════════════════════════
🔧 COMMANDS (LOGIC & STATE MANAGEMENT)
════════════════════════════════════════════════
You MUST generate the underlying logic to make the UI functional.
{type:"SET_APP_NAME", payload:"App Name"}
{type:"ADD_STEP", payload:{title:"Screen Name"}}
{type:"ADD_WIDGET", payload:{type:"TYPE", displayName:"Name", x:N, y:N, w:N, h:N, props:{...}}}
{type:"CREATE_TABLE", payload:{name:"tableName", columns:[{name:"col1",type:"text"},{name:"col2",type:"number"}]}}
{type:"CREATE_VARIABLE", payload:{name:"varName", type:"TEXT|NUMBER|BOOLEAN", defaultValue:""}}
{type:"CREATE_RECORD_PLACEHOLDER", payload:{name:"placeholderName", tableId:"<USE_EXACT_NAME_OF_CREATED_TABLE>"}}
{type:"CREATE_FUNCTION", payload:{name:"calculateOEE", logic:{xml:null, code:"return 100;"}}}

Trigger Actions Matrix:
- SET_VARIABLE: {type:"SET_VARIABLE", variableName:"varName", value:"val"}
- TABLE_RECORD_CREATE: {type:"TABLE_RECORD_CREATE", tableId:"tblName", fields:{col1:"val1"}}
- TABLE_RECORD_SAVE: {type:"TABLE_RECORD_SAVE", tableId:"tblName", placeholderId:"phName"}
- NAVIGATE_STEP: {type:"NAVIGATE_STEP", stepId:"stepName"}

{type:"CREATE_TRIGGER", payload:{event:"ON_CLICK|ON_CHANGE|ON_APP_START|TIMER", widgetId:"id|displayName", actions:[...]}}

════════════════════════════════════════════════
⚡ BEHAVIORAL RULES (CRITICAL)
════════════════════════════════════════════════
1. AGENTIC: Output commands IMMEDIATELY. Never explain without commands.
2. COMPLETE LOGIC: Always pair UI with its underlying logic. 
   - Interactive Table? CREATE_TABLE first, then use tableId.
   - Form Inputs? CREATE_RECORD_PLACEHOLDER first, then map inputs.
   - Buttons? CREATE_TRIGGER to handle ON_CLICK and save data.
3. MINIMUM: Simple ≥ 15 widgets. Medium ≥ 25. Full app ≥ 35.
4. ALWAYS: SET_APP_NAME first, then dark header SHAPE_RECTANGLE + white TEXT title.
5. ALWAYS: SHAPE_RECTANGLE card BEFORE its child widgets in commands array.
6. PRECISION: Coordinates multiples of 4. No overlapping widgets.
7. CONTEXT-AWARE: Don't duplicate existing widgets/tables/variables. Map placeholders accurately to table names.
8. INDUSTRIAL: Manufacturing → use MACHINE_STATUS, GAUGE, CHECKLIST, SIGNATURE, QUALITY_PASS_FAIL.
9. MULTI-SCREEN: Use ADD_STEP for apps with logical sections. Add NAVIGATE_STEP triggers.

CURRENT CONTEXT:
- Screen: ${context.currentStepName || 'Screen 1'}
- Widgets: ${JSON.stringify((context.widgets || []).map(w => ({ id: w.id, type: w.type, name: w.displayName, x: w.x, y: w.y })))}
- Tables: ${JSON.stringify((context.tables || []).map(t => ({ id: t.id, name: t.name })))}
- Variables: ${JSON.stringify((context.variables || []).map(v => ({ name: v.name, type: v.type })))}
- Screens: ${JSON.stringify((context.steps || []).map(s => ({ id: s.id, title: s.title })))}
- Placeholders: ${JSON.stringify((context.recordPlaceholders || []).map(r => ({ id: r.id, name: r.name })))}

OUTPUT: Brief explanation (Indonesian if user writes Indonesian), then <ai_plan>...</ai_plan>, then ALWAYS:
<builder_cmds>
{"commands": [...]}
</builder_cmds>`;


    const messages = [
        { role: 'system', content: systemPrompt },
        ...messageHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userInput }
    ];

    return await getChatCompletion(messages, connector);
};

/**
 * Specialized Vision Advice for App Builder (Images to App)
 */
export const getBuilderVisionAdvice = async (file, context, connector) => {
    const settings = connector?.aiSettings || connector?.config;
    if (!settings) throw new Error('AI Settings are missing.');

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

Canvas size is 1000x600. Map visual elements to coordinates accurately.
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
