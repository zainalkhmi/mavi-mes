import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AIProvider } from '../../vibe/ai/AIProvider';

export const MODEL_CONFIG = {
  openai: {
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    default: 'gpt-4-turbo'
  },
  gemini: {
    models: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.6-flash'],
    default: 'gemini-3.8-flash'
  }
};

/**
 * Checks if a response appears truncated (Plan or Code)
 */
export function isTruncatedResponse(text, isPlan = false) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 30) return false;

  if (isPlan) {
    // A complete plan should have "Verification Plan" and not end mid-sentence or mid-expression
    const hasVerification = /##\s*(?:🛡️\s*)?Verification Plan/i.test(trimmed);
    const endsAbruptly = /[:(\-–—,]\s*$/.test(trimmed) || 
                         /\b(?:contoh|misal|seperti|yaitu|kolom|field|tabel|recordId)\s*:?\s*$/i.test(trimmed);
    return !hasVerification || endsAbruptly;
  }

  // Code inspection
  const hasOpenVibe = /<vibe[-_]code[^>]*>/i.test(trimmed);
  const hasCloseVibe = /<\/vibe[-_]code>/i.test(trimmed);
  if (hasOpenVibe && !hasCloseVibe) return true;

  const hasExportOrFn = /export\s+default\s+function|function\s+App/i.test(trimmed);
  if (hasExportOrFn) {
    const endsCleanly = /\}\s*;?\s*$/.test(trimmed) || /<\/vibe[-_]code>\s*$/i.test(trimmed);
    const endsWithDangling = /[=+\-*/&|,:(.?]\s*$/.test(trimmed);
    const hasReturn = /return\s*\(?/i.test(trimmed);
    if (!endsCleanly || endsWithDangling || !hasReturn) return true;
  }

  return false;
}

export async function streamVibeAI({
  messages,
  settings = {},
  autoContinue = true,
  maxContinuations = 2,
  onChunk,
  onToolCall,
  onComplete,
  onError
}) {
  try {
    let fullText = await AIProvider.streamCompletion(
      messages,
      (chunk) => {
        onChunk?.(chunk);
      },
      settings
    );

    // Determine if this prompt is planning or coding
    const isPlan = messages.some(m => 
      m.content?.includes('Implementation Plan') || 
      m.content?.includes('Vibe Planner') || 
      m.content?.includes('ANTIGRAVITY PLANNING')
    );

    // Auto-continuation loop if truncated
    if (autoContinue) {
      let round = 0;
      while (round < maxContinuations && isTruncatedResponse(fullText, isPlan)) {
        round++;
        const continuationPrompt = isPlan
          ? 'Respons Implementation Plan Anda terpotong di tengah jalan. Lanjutkan penulisan SEGERA tepat dari kata terakhir yang terhenti tanpa mengulang teks sebelumnya, dan tuntaskan seluruh bagian plan sampai selesai termasuk ## 🛡️ Verification Plan.'
          : 'Your previous React code output was cut off mid-code due to token length limits. Continue outputting IMMEDIATELY from the exact point you stopped without repeating previous imports or code lines. Complete the remaining JSX return and function closing, and terminate with </vibe_code>.';

        const continueMessages = [
          ...messages,
          { role: 'assistant', content: fullText },
          { role: 'user', content: continuationPrompt }
        ];

        try {
          const continuationText = await AIProvider.streamCompletion(
            continueMessages,
            (chunk) => {
              onChunk?.(chunk);
            },
            settings
          );

          if (continuationText && continuationText.trim().length > 0) {
            fullText += continuationText;
          } else {
            break; // No more tokens returned
          }
        } catch (contErr) {
          console.warn('[VibeAIStreamService] Auto-continuation attempt failed:', contErr);
          break;
        }
      }
    }

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

