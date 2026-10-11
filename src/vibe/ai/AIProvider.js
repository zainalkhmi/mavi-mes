/**
 * AIProvider.js
 * Unified AI Provider abstraction layer for MaviCore Vibe Coding Engine.
 * Supports: Gemini, OpenAI, Claude (Anthropic), Groq, OpenRouter, Qwen, Ollama (Local), Custom.
 */

import { getPrimaryAiConnector } from '../../utils/database';

export class AIProvider {
  /**
   * Normalizes provider names to a standard key
   * @param {string} provider
   * @returns {'gemini'|'openai'|'anthropic'|'groq'|'openrouter'|'qwen'|'ollama'|'custom'}
   */
  static normalizeProvider(provider = '') {
    const p = String(provider || '').trim().toLowerCase();
    if (['gemini', 'google', 'google gemini'].includes(p)) return 'gemini';
    if (['vertexai', 'vertex_ai', 'vertex', 'google vertex ai', 'google cloud vertex ai'].includes(p)) return 'vertexai';
    if (['anthropic', 'claude'].includes(p)) return 'anthropic';
    if (['openai'].includes(p)) return 'openai';
    if (['groq', 'meta/groq', 'grok'].includes(p)) return 'groq';
    if (['openrouter', 'open router'].includes(p)) return 'openrouter';
    if (['qwen', 'dashscope', 'alibaba'].includes(p)) return 'qwen';
    if (['ollama', 'local', 'local ai (ollama)'].includes(p)) return 'ollama';
    return 'custom';
  }

  static sanitizeGeminiModel(m) {
    if (!m) return 'gemini-3.8-flash';
    let clean = String(m).trim().replace(/^models\//, '');
    if (clean.includes('/')) clean = clean.split('/').pop();
    const lower = clean.toLowerCase();
    if (lower === 'gemini-flash' || lower === 'gemini' || lower.includes('flash-latest') || lower.includes('gemini-2.0') || lower.includes('gemini-2.5') || lower.includes('gemini-1.5')) {
      return 'gemini-3.8-flash';
    }
    return clean;
  }

  /**
   * Resolves the active AI connector configuration from MaviCore database
   * @param {object} [overrideConnector]
   * @returns {Promise<object>}
   */
  static async resolveConnector(overrideConnector = null) {
    const primary = await getPrimaryAiConnector().catch(() => null);
    if (overrideConnector) {
      const primarySettings = primary?.aiSettings || primary?.config || primary || {};
      const overrideSettings = overrideConnector?.aiSettings || overrideConnector?.config || overrideConnector || {};
      const effectiveApiKey = overrideSettings.apiKey || primarySettings.apiKey;
      const prov = overrideSettings.provider || primarySettings.provider || 'gemini';
      let rawModel = overrideSettings.modelId || primarySettings.modelId || 'gemini-3.8-flash';
      if (this.normalizeProvider(prov) === 'gemini') {
        rawModel = this.sanitizeGeminiModel(rawModel);
      }
      if (primary || effectiveApiKey) {
        return {
          ...(primary || {}),
          ...overrideConnector,
          aiSettings: {
            ...primarySettings,
            ...overrideSettings,
            apiKey: effectiveApiKey,
            provider: prov,
            modelId: rawModel
          }
        };
      }
    }
    if (!primary) {
      throw new Error('AI Connector belum dikonfigurasi. Buka Integrasi > AI Settings.');
    }
    if (primary.aiSettings?.modelId && this.normalizeProvider(primary.aiSettings?.provider) === 'gemini') {
      primary.aiSettings.modelId = this.sanitizeGeminiModel(primary.aiSettings.modelId);
    }
    return primary;
  }

  /**
   * Unified streaming completion
   * @param {Array<{ role: string, content: string }>} messages
   * @param {Function} onChunk (chunk: string) => void
   * @param {object} [connectorOverride]
   * @returns {Promise<string>} full response text
   */
  static async streamCompletion(messages, onChunk, connectorOverride = null) {
    const connector = await this.resolveConnector(connectorOverride);
    const settings = connector.aiSettings || connector.config || connector;
    const provider = this.normalizeProvider(settings.provider);
    const apiKey = settings.apiKey;
    const modelId = String(settings.modelId || '').trim();

    // 1. Google Gemini & Google Cloud Vertex AI SSE streaming
    if (provider === 'gemini' || provider === 'vertexai') {
      const isVertex = provider === 'vertexai';
      const primaryModel = this.sanitizeGeminiModel(modelId);

      const candidateModels = isVertex
        ? [primaryModel, 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'].filter(Boolean).filter((m, idx, arr) => arr.indexOf(m) === idx)
        : [
            primaryModel,
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-flash-latest',
            'gemini-3.8-flash',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite'
          ].filter(Boolean).filter((m, idx, arr) => arr.indexOf(m) === idx);

      const systemMsg = messages.find(m => m.role === 'system');
      const userAndAssistant = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const payload = {
        contents: userAndAssistant,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192
        }
      };

      if (systemMsg) {
        payload.systemInstruction = {
          parts: [{ text: systemMsg.content }]
        };
      }

      let response = null;
      let lastError = null;
      let hasFetchedAvailableModels = false;
      const failedModels = new Set();

      modelLoop:
      for (let i = 0; i < candidateModels.length; i++) {
        const currentModel = candidateModels[i];
        if (failedModels.has(currentModel)) continue;

        // Gemini models on v1beta or Vertex AI endpoint
        const versionsToTry = isVertex ? ['v1'] : ['v1beta'];

        versionLoop:
        for (const apiVer of versionsToTry) {
          let url = '';
          const headers = { 'Content-Type': 'application/json' };

          if (isVertex) {
            const loc = settings.location || 'asia-southeast1';
            const proj = settings.projectId || 'mavi-mes-production';
            if (settings.baseUrl) {
              const base = settings.baseUrl.replace(/\/+$/, '');
              url = `${base}/v1/projects/${proj}/locations/${loc}/publishers/google/models/${currentModel}:streamGenerateContent${apiKey ? `?key=${apiKey}&alt=sse` : '?alt=sse'}`;
            } else {
              url = `https://${loc}-aiplatform.googleapis.com/v1/projects/${proj}/locations/${loc}/publishers/google/models/${currentModel}:streamGenerateContent${apiKey ? `?key=${apiKey}&alt=sse` : '?alt=sse'}`;
            }
            if (settings.bearerToken) {
              headers['Authorization'] = `Bearer ${settings.bearerToken.trim()}`;
            }
          } else {
            url = `https://generativelanguage.googleapis.com/${apiVer}/models/${currentModel}:streamGenerateContent?key=${apiKey}&alt=sse`;
          }

          try {
            response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              console.log(`[AIProvider] ✅ Successfully streaming from ${isVertex ? 'Vertex AI' : 'Gemini'} model: "${currentModel}" (${apiVer})`);
              break modelLoop;
            }

            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson.error?.message || `Gemini API error (${response.status})`;
            const err = new Error(errMsg);
            lastError = err;

            // Mark this model as failed so we don't retry it in this request
            failedModels.add(currentModel);

            // Check if 503 high demand spike -> immediately pivot to next candidate model
            const is503HighDemand = response.status === 503 ||
                                    errMsg.toLowerCase().includes('high demand') ||
                                    errMsg.toLowerCase().includes('spikes in demand') ||
                                    errMsg.toLowerCase().includes('capacity') ||
                                    errMsg.toLowerCase().includes('overloaded');

            if (is503HighDemand) {
              console.warn(`[AIProvider] Gemini model "${currentModel}" is busy (503 high demand). Instantly switching to backup model...`);
              break versionLoop;
            }

            // Check if 429 Quota Exceeded -> switch immediately
            const isQuotaExceeded = response.status === 429 ||
                                    errMsg.toLowerCase().includes('quota') ||
                                    errMsg.toLowerCase().includes('resource_exhausted') ||
                                    errMsg.toLowerCase().includes('rate limit');

            if (isQuotaExceeded) {
              console.warn(`[AIProvider] Gemini model "${currentModel}" quota reached (${response.status}). Switching to backup model...`);
              break versionLoop;
            }

            // Permanent model deprecation / 404
            const isUnavailable = response.status === 404 ||
                                  errMsg.toLowerCase().includes('not found') ||
                                  errMsg.toLowerCase().includes('no longer available') ||
                                  errMsg.toLowerCase().includes('not supported');

            // Auto extract replacement model suggested by Google error if any
            const matches = [...errMsg.matchAll(/models\/([a-zA-Z0-9.-]+)/g)].map(x => x[1]);
            for (const rec of matches) {
              if (rec && !candidateModels.includes(rec) && !failedModels.has(rec) && !rec.includes('tts') && !rec.includes('audio')) {
                candidateModels.splice(i + 1, 0, rec);
              }
            }

            // Dynamic model listing fallback if model not found or not supported
            if (!hasFetchedAvailableModels && isUnavailable) {
              hasFetchedAvailableModels = true;
              try {
                const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (listRes.ok) {
                  const listData = await listRes.json();
                  const live = (listData.models || [])
                    .filter(m => {
                      const name = (m.name || '').toLowerCase();
                      if (name.includes('tts') || name.includes('audio') || name.includes('embedding') || name.includes('imagen') || name.includes('image-generation') || name.includes('aqa') || name.includes('robotics')) {
                        return false;
                      }
                      return Array.isArray(m.supportedGenerationMethods) && (
                        m.supportedGenerationMethods.includes('streamGenerateContent') ||
                        m.supportedGenerationMethods.includes('generateContent')
                      );
                    })
                    .map(m => m.name.replace(/^models\//, ''));
                  for (const m of live) {
                    if (!candidateModels.includes(m) && !failedModels.has(m)) candidateModels.push(m);
                  }
                }
              } catch {
                /* silent fallback */
              }
            }

            console.warn(`[AIProvider] Gemini model "${currentModel}" failed with ${response.status} (${errMsg}). Switching to backup model...`);
            break versionLoop;
          } catch (netErr) {
            lastError = netErr;
            failedModels.add(currentModel);
            break versionLoop;
          }
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error(`Gemini API error (${response?.status || 'Unknown'})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      const parseGeminiLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:') && !trimmed.startsWith('data: ')) return;
        const raw = trimmed.replace(/^data:\s*/, '').trim();
        if (!raw || raw === '[DONE]') return;
        try {
          const data = JSON.parse(raw);
          const parts = data?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.thought) continue;
            const text = part.text || '';
            if (text) {
              fullText += text;
              if (onChunk) onChunk(text);
            }
          }
        } catch {
          // Incomplete JSON handled by line buffer
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          parseGeminiLine(line);
        }
      }

      // Process any remaining tail in buffer
      if (buffer.trim()) {
        parseGeminiLine(buffer);
      }

      return fullText;
    }

    // 2. Anthropic Claude streaming
    if (provider === 'anthropic') {
      const cleanModel = modelId || 'claude-3-5-sonnet-20241022';
      const systemMsg = messages.find(m => m.role === 'system');
      const anthropicMsgs = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const payload = {
        model: cleanModel,
        max_tokens: 8192,
        system: systemMsg?.content || '',
        messages: anthropicMsgs,
        stream: true
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Anthropic API error (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      const parseAnthropicLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:') && !trimmed.startsWith('data: ')) return;
        const raw = trimmed.replace(/^data:\s*/, '').trim();
        if (raw === '[DONE]' || !raw) return;
        try {
          const data = JSON.parse(raw);
          if (data.type === 'content_block_delta' && data.delta?.text) {
            fullText += data.delta.text;
            if (onChunk) onChunk(data.delta.text);
          }
        } catch {
          /* ignore parse error */
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          parseAnthropicLine(line);
        }
      }

      if (buffer.trim()) {
        parseAnthropicLine(buffer);
      }

      return fullText;
    }

    // 3. OpenAI-compatible providers: OpenAI, Groq, OpenRouter, Qwen (DashScope), Ollama, Custom
    let baseUrl = 'https://api.openai.com/v1';
    if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
    else if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
    else if (provider === 'qwen') baseUrl = settings.baseUrl || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    else if (provider === 'ollama') baseUrl = settings.baseUrl || 'http://localhost:11434/v1';
    else if (settings.baseUrl) baseUrl = settings.baseUrl;

    const cleanBaseUrl = String(baseUrl).replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const defaultModel = provider === 'groq' ? 'llama-3.1-70b-versatile' :
      provider === 'openrouter' ? 'anthropic/claude-3.5-sonnet' :
      provider === 'qwen' ? 'qwen-max' :
      provider === 'ollama' ? 'llama3' : 'gpt-4o-mini';

    const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId || defaultModel,
        messages,
        temperature: 0.2,
        max_tokens: 8192,
        stream: true
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `AI API error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    const parseOpenAILine = (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:') && !trimmed.startsWith('data: ')) return;
      const raw = trimmed.replace(/^data:\s*/, '').trim();
      if (raw === '[DONE]' || !raw) return;
      try {
        const data = JSON.parse(raw);
        const delta = data.choices?.[0]?.delta?.content || data.choices?.[0]?.delta?.text || data.choices?.[0]?.text || '';
        if (delta) {
          fullText += delta;
          if (onChunk) onChunk(delta);
        }
      } catch {
        /* ignore stream chunk parse error */
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        parseOpenAILine(line);
      }
    }

    if (buffer.trim()) {
      parseOpenAILine(buffer);
    }

    return fullText;
  }

  /**
   * Non-streaming fallback
   * @param {Array<{ role: string, content: string }>} messages
   * @param {object} [connectorOverride]
   * @returns {Promise<string>}
   */
  static async getCompletion(messages, connectorOverride = null) {
    let result = '';
    await this.streamCompletion(messages, (chunk) => {
      result += chunk;
    }, connectorOverride);
    return result;
  }

  /**
   * Multimodal Vision Analysis (Astra-grade continuous frame / image inspection)
   * Supports Gemini (inline_data) and OpenAI/OpenRouter (image_url base64).
   * @param {object} params
   * @param {string} params.prompt
   * @param {string} params.imageBase64 - base64 string or data:image/... url
   * @param {string} [params.mimeType] - 'image/jpeg' or 'image/png'
   * @param {string} [params.systemPrompt]
   * @param {object} [connectorOverride]
   * @returns {Promise<string>}
   */
  static async analyzeVision({ prompt, imageBase64, mimeType = 'image/jpeg', systemPrompt = '' }, connectorOverride = null) {
    if (!imageBase64) {
      throw new Error('Image base64 is required for vision analysis.');
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const connector = await this.resolveConnector(connectorOverride);
    const settings = connector.aiSettings || connector.config || connector;
    const provider = this.normalizeProvider(settings.provider);
    const apiKey = settings.apiKey;
    const modelId = String(settings.modelId || '').trim();

    // 1. Google Gemini Multimodal
    if (provider === 'gemini') {
      const primaryModel = this.sanitizeGeminiModel(modelId);
      const candidateModels = [
        primaryModel,
        'gemini-3.8-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest'
      ].filter(Boolean).filter((m, idx, arr) => arr.indexOf(m) === idx);

      const parts = [
        { text: prompt || 'Analisis gambar ini secara mendalam dalam konteks industri MES dan manufaktur.' },
        {
          inline_data: {
            mime_type: mimeType,
            data: cleanBase64
          }
        }
      ];

      const payload = {
        contents: [
          {
            role: 'user',
            parts
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      };

      if (systemPrompt) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      for (const m of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
        try {
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
            if (text) return text;
          }
        } catch (e) {
          console.warn(`[AIProvider] Gemini vision failed on ${m}:`, e);
        }
      }
    }

    // 2. OpenAI / OpenRouter Multimodal
    const defaultVisionModel = provider === 'openrouter' ? 'google/gemini-flash-1.5' : 'gpt-4o-mini';
    let baseUrl = 'https://api.openai.com/v1';
    if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
    else if (settings.baseUrl) baseUrl = settings.baseUrl;

    const cleanBaseUrl = String(baseUrl).replace(/\/$/, '');
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const formattedImageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${cleanBase64}`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt || 'Analisis gambar ini.' },
        {
          type: 'image_url',
          image_url: { url: formattedImageUrl }
        }
      ]
    });

    const resp = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId || defaultVisionModel,
        messages,
        max_tokens: 2048,
        temperature: 0.2
      })
    });

    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Vision API error (${resp.status})`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
