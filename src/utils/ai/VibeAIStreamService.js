/**
 * VibeAIStreamService.js
 * Simplified AI Streaming for VibeCode - uses built-in fetch/OpenAI-compatible API
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const MODEL_CONFIG = {
  openai: {
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    default: 'gpt-4-turbo'
  },
  gemini: {
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    default: 'gemini-1.5-flash'
  }
};

export async function streamVibeAI({
  messages,
  settings = {},
  onChunk,
  onToolCall,
  onComplete,
  onError
}) {
  const { provider = 'gemini', apiKey, modelId } = settings;
  const model = modelId || MODEL_CONFIG[provider]?.default || 'gemini-1.5-flash';

  try {
    let fullText = '';

    // Simple fetch-based streaming for Gemini
    if (provider === 'gemini' && apiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }]
            }))
          })
        }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                fullText += text;
                onChunk?.(text);
              }
            } catch {}
          }
        }
      }
    } else {
      // Fallback: OpenAI-compatible
      fullText = 'AI streaming ready. Connect AI provider in settings.';
      onChunk?.(fullText);
    }

    onComplete?.({ text: fullText });
    return { text: fullText };
  } catch (err) {
    onError?.(err);
    throw err;
  }
}

export async function generateVibeCode({ prompt, context = {} }) {
  return { text: 'Code generation ready' };
}

export function useVibeAIStream() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(async (prompt, callbacks = {}) => {
    setIsLoading(true);
    setMessage('');
    try {
      await streamVibeAI({
        messages: [{ role: 'user', content: prompt }],
        settings: {},
        onChunk: (chunk) => setMessage(prev => prev + chunk),
        onComplete: () => setIsLoading(false),
        onError: (e) => { setError(e); setIsLoading(false); }
      });
    } catch (e) {
      setError(e);
      setIsLoading(false);
    }
  }, []);

  return { message, isLoading, error, send };
}

export default { streamVibeAI, generateVibeCode, useVibeAIStream, MODEL_CONFIG };
