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
    if (['anthropic', 'claude'].includes(p)) return 'anthropic';
    if (['openai'].includes(p)) return 'openai';
    if (['groq', 'meta/groq', 'grok'].includes(p)) return 'groq';
    if (['openrouter', 'open router'].includes(p)) return 'openrouter';
    if (['qwen', 'dashscope', 'alibaba'].includes(p)) return 'qwen';
    if (['ollama', 'local', 'local ai (ollama)'].includes(p)) return 'ollama';
    return 'custom';
  }

  static sanitizeGeminiModel(m) {
    if (!m) return 'gemini-3.5-flash';
    let clean = String(m).trim().replace(/^models\//, '');
    if (clean.includes('/')) clean = clean.split('/').pop();
    const lower = clean.toLowerCase();
    // Keep verified real models active
    if (
      lower === 'gemini-3.5-flash' ||
      lower === 'gemini-3.8-flash' ||
      lower === 'gemini-3.7-flash' ||
      lower === 'gemini-3.6-flash' ||
      lower === 'gemini-3-flash-preview' ||
      lower === 'gemini-3.5-flash-lite'
    ) {
      return lower;
    }
    // Discontinued / alias models map to gemini-3.5-flash (verified live, 200 OK)
    if (
      lower.includes('flash-latest') ||
      lower === 'gemini-flash' ||
      lower === 'gemini' ||
      lower.includes('2.5-flash') ||
      lower.includes('2.0-flash') ||
      lower.includes('1.5-flash') ||
      lower.includes('preview-02-05') ||
      lower.includes('flash-lite-preview')
    ) {
      return 'gemini-3.5-flash';
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
      let rawModel = overrideSettings.modelId || primarySettings.modelId || 'gemini-3.5-flash';
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

    // 1. Google Gemini SSE streaming
    if (provider === 'gemini') {
      const primaryModel = this.sanitizeGeminiModel(modelId);

      const candidateModels = [
        primaryModel,
        'gemini-3.5-flash',
        'gemini-3-flash-preview'
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

        // Try v1beta first, then v1
        const versionsToTry = ['v1beta', 'v1'];

        versionLoop:
        for (const apiVer of versionsToTry) {
          const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${currentModel}:streamGenerateContent?key=${apiKey}&alt=sse`;

          // Allow up to 2 retry attempts for 503 high-demand temporary spikes
          let retryCount = 0;
          const maxRetries = 2;

          while (retryCount <= maxRetries) {
            try {
              response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (response.ok) {
                break modelLoop;
              }

              const errJson = await response.json().catch(() => ({}));
              const errMsg = errJson.error?.message || `Gemini API error (${response.status})`;
              const err = new Error(errMsg);
              lastError = err;

              // Check if 503 temporary demand spike (Google explicitly advises retrying later)
              const is503HighDemand = response.status === 503 ||
                                      errMsg.toLowerCase().includes('high demand') ||
                                      errMsg.toLowerCase().includes('spikes in demand') ||
                                      errMsg.toLowerCase().includes('capacity') ||
                                      errMsg.toLowerCase().includes('overloaded');

              if (is503HighDemand && retryCount < maxRetries) {
                retryCount++;
                const delayMs = 2000 * retryCount;
                console.warn(`[AIProvider] Gemini model "${currentModel}" experienced 503 high demand. Retrying in ${delayMs}ms (attempt ${retryCount}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, delayMs));
                continue; // retry fetch
              }

              // Check if 429 Quota Exceeded (Resource Exhausted) -> switch immediately to backup model
              const isQuotaExceeded = response.status === 429 ||
                                      errMsg.toLowerCase().includes('quota') ||
                                      errMsg.toLowerCase().includes('resource_exhausted') ||
                                      errMsg.toLowerCase().includes('rate limit');

              if (isQuotaExceeded) {
                failedModels.add(currentModel);
                console.warn(`[AIProvider] Gemini model "${currentModel}" quota reached (${response.status}: ${errMsg}). Switching to backup model...`);
                break versionLoop;
              }

              // Permanent model deprecation / 404
              const isUnavailable = response.status === 404 ||
                                    errMsg.toLowerCase().includes('not found') ||
                                    errMsg.toLowerCase().includes('no longer available') ||
                                    errMsg.toLowerCase().includes('not supported');

              if (isUnavailable) {
                failedModels.add(currentModel);
              }

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
              break versionLoop;
            }
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
}
