/**
 * codeCleaner.js
 * Sanitizes and extracts clean, executable React/JSX code from AI responses.
 * Removes <vibe_code> tags, markdown fences (```jsx, ```js, ```), and rogue artifacts.
 */

export function cleanVibeCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';
  let cleaned = rawCode.trim();

  // 1. Extract from <vibe_code> ... </vibe_code> if present
  const vibeCodeMatch = cleaned.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
  if (vibeCodeMatch && vibeCodeMatch[1]) {
    cleaned = vibeCodeMatch[1].trim();
  } else {
    // If not closed properly, strip opening <vibe_code>
    cleaned = cleaned.replace(/^[\s\S]*?<vibe_code>\s*/i, '');
    cleaned = cleaned.replace(/\s*<\/vibe_code>[\s\S]*$/i, '');
  }

  // 2. Strip markdown code block fences (```jsx, ```javascript, ```js, or bare ```)
  // Handles multiple passes in case of nested fences
  while (/^```[a-zA-Z0-9_-]*\s*\n?/i.test(cleaned) || /\n?```\s*$/i.test(cleaned)) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
    cleaned = cleaned.trim();
  }

  // 3. Strip any stray markdown language headers at the top
  cleaned = cleaned.replace(/^(?:javascript|jsx|js|tsx)\s*\n/i, '');

  // 4. Sanitize rogue quotes after numeric values or commas (e.g. `quantity: 50,'` -> `quantity: 50,`)
  cleaned = cleaned.replace(/(\b\d+\s*,)\s*['"]\s*$/gm, '$1');

  return cleaned.trim();
}

export default cleanVibeCode;
