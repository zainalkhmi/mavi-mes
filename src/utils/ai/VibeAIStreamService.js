import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AIProvider } from '../../vibe/ai/AIProvider';

export const MODEL_CONFIG = {
  openai: {
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    default: 'gpt-4-turbo'
  },
  gemini: {
    models: ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'],
    default: 'gemini-3.6-flash'
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
  try {
    const fullText = await AIProvider.streamCompletion(
      messages,
      (chunk) => {
        onChunk?.(chunk);
      },
      settings
    );

    onComplete?.({ text: fullText });
    return { text: fullText };
  } catch (err) {
    onError?.(err);
    throw err;
  }
}

export async function generateVibeCode({ prompt, context = {} }) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert React developer specializing in industrial HMI applications. Output clean React component code wrapped in <vibe_code>...</vibe_code> tags.'
      },
      {
        role: 'user',
        content: `Context:\n${JSON.stringify(context, null, 2)}\n\nPrompt: ${prompt}`
      }
    ];
    const text = await AIProvider.getCompletion(messages);
    return { text };
  } catch (err) {
    console.error('generateVibeCode error:', err);
    throw err;
  }
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
        settings: null,
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

