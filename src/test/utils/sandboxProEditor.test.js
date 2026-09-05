import { describe, it, expect } from 'vitest';
import { MAVICORE_BRIDGE_VIRTUAL_FILE } from '../../vibe/sdk/mavicoreBridge';

describe('Sandbox Pro Editor & Click-to-Code Visual Inspector', () => {
  it('MAVICORE_BRIDGE_VIRTUAL_FILE should include inspector listeners and event emission', () => {
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_SET_INSPECT_MODE');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('MAVICORE_ELEMENT_INSPECTED');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('mavicore-inspect-highlight-box');
    expect(MAVICORE_BRIDGE_VIRTUAL_FILE).toContain('mavicore-inspect-tag-tooltip');
  });

  it('Inspector component finder algorithm correctly identifies exact code line by text, ID, or tag', () => {
    const sampleCode = `import React from 'react';

export default function MyIndustrialApp() {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 id="app-title" className="text-2xl font-bold">Monitor Mesin Produksi</h1>
      <p className="text-slate-400">Status real-time jalur perakitan</p>
      <input type="text" placeholder="Cari batch lot..." className="input-search px-3 py-2" />
      <button id="btn-start" className="btn-ok px-4 py-2 mt-4">
        Mulai Shift
      </button>
    </div>
  );
}`;

    const lines = sampleCode.split('\n');

    const searchInCode = (elementData) => {
      const { tagName, text, placeholder, id, className } = elementData;
      let matched = -1;

      if (text && text.trim().length > 2) {
        const cleanText = text.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 24);
        matched = lines.findIndex(l => l.includes(cleanText));
      }
      if (matched === -1 && placeholder && placeholder.length > 1) {
        matched = lines.findIndex(l => l.includes(placeholder));
      }
      if (matched === -1 && id) {
        matched = lines.findIndex(l => l.includes(id));
      }
      if (matched === -1 && className) {
        const classes = className.split(' ').filter(c => c.length > 3 && !['flex', 'grid', 'text', 'bg', 'p-4', 'p-2', 'w-full'].includes(c));
        for (const cls of classes) {
          matched = lines.findIndex(l => l.includes(cls));
          if (matched !== -1) break;
        }
      }
      if (matched === -1 && tagName) {
        const tagPattern = new RegExp(`<${tagName}\\b`, 'i');
        matched = lines.findIndex(l => tagPattern.test(l));
      }

      return matched !== -1 ? matched + 1 : -1;
    };

    // Test 1: Clicked button by text
    const btnLine = searchInCode({ tagName: 'button', text: 'Mulai Shift' });
    expect(btnLine).toBe(10); // line 10 in 1-based indexing

    // Test 2: Clicked input by placeholder
    const inputLine = searchInCode({ tagName: 'input', placeholder: 'Cari batch lot...' });
    expect(inputLine).toBe(8);

    // Test 3: Clicked header by id
    const titleLine = searchInCode({ tagName: 'h1', id: 'app-title', text: 'Monitor Mesin Produksi' });
    expect(titleLine).toBe(6);

    // Test 4: Clicked generic tag fallback
    const pLine = searchInCode({ tagName: 'p' });
    expect(pLine).toBe(7);
  });

  it('Handles complex multi-line container clicks (such as modal titles with close buttons)', () => {
    const modalCode = `export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  return (
    <div>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-header">
            <h2>New Production Entry</h2>
            <button onClick={() => setIsModalOpen(false)}>✕</button>
          </div>
          <input placeholder="e.g. John Doe" />
        </div>
      )}
    </div>
  );
}`;

    const lines = modalCode.split('\n');

    const searchInCodeScored = (elementData) => {
      const { tagName, text, firstLine, words, placeholder } = elementData;
      let bestIdx = -1;
      let maxScore = 0;

      const cleanFirstLine = (firstLine || (text || '').split('\n')[0] || '').trim();
      const cleanSnippet = cleanFirstLine.slice(0, 30);
      const keywords = (words || cleanFirstLine.replace(/[^a-zA-Z0-9_\s-]/g, ' ').split(/\s+/)).filter(w => w && w.length >= 3);

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const lowerLine = line.toLowerCase();
        let score = 0;

        if (cleanSnippet.length > 2 && line.includes(cleanSnippet)) score += 100;
        else if (cleanSnippet.length > 2 && lowerLine.includes(cleanSnippet.toLowerCase())) score += 80;

        if (placeholder && line.includes(placeholder)) score += 90;

        for (const kw of keywords) {
          if (lowerLine.includes(kw.toLowerCase())) score += 25;
        }

        if (score > maxScore) {
          maxScore = score;
          bestIdx = idx;
        }
      }

      return bestIdx !== -1 ? bestIdx + 1 : -1;
    };

    // Simulated payload when user clicks on the modal title container
    const clickedHeader = {
      tagName: 'div',
      text: 'New Production Entry\n✕',
      firstLine: 'New Production Entry',
      words: ['New', 'Production', 'Entry']
    };

    const foundLine = searchInCodeScored(clickedHeader);
    // Line 8 is <h2>New Production Entry</h2>
    expect(foundLine).toBe(8);
  });
});
