/**
 * AI Service for Mavi MES 
 * Supports Google Gemini, OpenAI, Anthropic, and Meta/Groq 
 */

const SYSTEM_PROMPT = `
You are a Manufacturing Systems Engineer specializing in Digital Work Instructions and MES (Manufacturing Execution Systems).
Analyze the provided document (SOP, PDF, or Image) and extract the manufacturing process into a structured digital application.

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
          "type": "TEXT" | "IMAGE" | "CHECKLIST" | "BUTTON" | "TEXT_INPUT" | "DROPDOWN" | "SIGNATURE" | "QUALITY_PASS_FAIL" | "CAMERA_CAPTURE",
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

  // Design System Tokens
  const designSystem = {
    colors: {
      primary: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
      bgPanel: '#ffffff', textPrimary: '#1e293b', border: '#e2e8f0'
    },
    spacing: { gap: 16, padding: 20 },
    radius: { md: '12px', lg: '20px' }
  };

  const systemPrompt = `
ROLE: You are the "Mavi Multi-Agent Orchestrator". 
You coordinate three specialized internal agents to build industrial MES solutions.

1. 🏗️ PLANNER AGENT:
   - Analyzes user intent (Intent Mapping).
   - Breaks down the request into UI, Logic, and Data tasks.
   - Coordinates the other agents.

2. 🎨 UI/UX AGENT:
   - Designs professional, responsive industrial interfaces.
   - Uses modern layout props: { layout: { type: "flex", direction: "column", gap: 16 } }.
   - Ensures visual consistency with the Design System: ${JSON.stringify(designSystem.colors)}.

3. 🗄️ DATABASE AGENT:
   - Designs normalized table schemas (CREATE_TABLE).
   - Maps UI components to data fields (recordPlaceholders).
   - Manages app variables and state.

WORKFLOW:
1. [INTERNAL THOUGHT] Analyze intent.
2. [PLAN] Create a step-by-step strategy in <ai_plan>.
3. [EXECUTE] Generate precise commands in <builder_cmds>.

COMMANDS:
- ADD_WIDGET: { type, payload: { type, props, x, y, w, h } }
- UPDATE_WIDGET: { type, widgetId, payload: { props } }
- DELETE_WIDGET: { type, widgetId }
- CREATE_TABLE: { type, payload: { name, columns: [{ name, type }] } }
- CREATE_VARIABLE: { type, payload: { name, type, defaultValue } }
- CREATE_TRIGGER: { type, payload: { event, actions: [...] } }

INTERACTIVE_TABLE SPECIAL PROPS:
- columns: Array of { header: string, key: string }
- enableFilter: boolean (Add search bar)
- enableExport: boolean (Add download CSV button)
- title: string (Custom header title)
- pageSize: number (Rows per page)

GUIDELINES:
- Be AGENTIC: Take action immediately. Don't just explain.
- Be SEMANTIC: "Scan barcode" means a scanner + a result variable + a lookup trigger.
- Be SELF-HEALING: If you add a widget that needs a variable, create that variable in the same command list.

CONTEXT:
- Screen: ${context.currentStepName || 'Unknown'}
- Existing Tables: ${JSON.stringify(context.tables || [])}
- Existing Variables: ${JSON.stringify(context.variables || [])}

OUTPUT FORMAT:
Indonesian rationale first, then:
<ai_plan>
[Step-by-step technical plan]
</ai_plan>

<builder_cmds>
{
  "commands": [ ... ]
}
</builder_cmds>
`;

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
Identify: Buttons, Labels, Inputs, Images, Tables.`;

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
