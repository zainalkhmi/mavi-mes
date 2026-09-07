/**
 * textToSqlService.js
 * AI Text-to-SQL Engine for Mandor MES Query Studio
 * Translates Natural Language (Indonesian & English) into optimized SQL queries
 * Supports:
 * - Live AI Connector (Google Gemini, OpenAI, Claude, Groq via getPrimaryAiConnector)
 * - Intelligent Offline Rule & Semantic Fallback (Works 100% even without API Key)
 * - Schema-Aware: automatically provides all current table & column definitions to the prompt
 */

import { getPrimaryAiConnector } from './database.js';

/**
 * Generates SQL from a natural language prompt
 * @param {string} prompt - User request (e.g., "Tampilkan 5 order dengan scrap terbanyak")
 * @param {object} options - { tableSchemas: object, activeTable: string }
 * @returns {Promise<{ sql: string, explanation: string, tablesInvolved: string[], confidence: string }>}
 */
export async function generateSqlFromPrompt(prompt, options = {}) {
  const { tableSchemas = {}, activeTable = 'work_orders' } = options;

  // Build schema context description
  const schemaDescriptions = Object.keys(tableSchemas).map(tableName => {
    const tbl = tableSchemas[tableName];
    const colList = (tbl.columns || []).map(c => `${c.name} (${c.type}${c.isPk ? ', PK' : ''})`).join(', ');
    return `Tabel "${tableName}": [${colList}]`;
  }).join('\n');

  // Try calling connected AI (Gemini / OpenAI / Claude)
  // Try calling connected AI (Gemini / OpenAI / Claude / Groq)
  try {
    const connector = await getPrimaryAiConnector();
    const settings = connector?.aiSettings || connector?.config || connector;

    if (settings?.apiKey) {
      const aiResult = await callAiForSql(prompt, schemaDescriptions, settings, activeTable);
      if (aiResult && aiResult.sql) {
        return aiResult;
      }
    }
  } catch (err) {
    console.warn('[textToSqlService] Live AI call failed, falling back to intelligent rule engine:', err);
  }

  // Fallback to intelligent offline semantic rule engine
  return generateOfflineSql(prompt, tableSchemas, activeTable);
}

/**
 * Calls Gemini / OpenAI / Claude / Groq API using configured connector
 */
async function callAiForSql(userPrompt, schemaInfo, settings, activeTable) {
  const apiKey = settings?.apiKey;
  const provider = (settings?.provider || 'gemini').toLowerCase();

  const systemInstruction = `
You are Mandor MES AI SQL Expert. Your job is to convert natural language queries (in Indonesian or English) into precise, clean PostgreSQL/Supabase SQL statements for a manufacturing execution system.

DATABASE SCHEMA:
${schemaInfo}

ACTIVE TABLE DEFAULT: "${activeTable}"

RULES:
1. Always output ONLY valid JSON format:
{
  "sql": "SELECT ... FROM ...;",
  "explanation": "Penjelasan singkat dalam bahasa Indonesia tentang apa yang dilakukan query ini.",
  "tablesInvolved": ["table_name"]
}
2. Use valid standard SQL keywords: SELECT, INSERT INTO, UPDATE, DELETE, WHERE, GROUP BY, ORDER BY, LIMIT, JOIN.
3. If the user asks about scrap, quantity, target, status, or date, match the closest column names from the provided schema.
4. Do NOT output markdown fences outside JSON.
`;

  if (provider.includes('gemini') || !provider || provider === 'google') {
    let cleanModel = String(settings.modelId || 'gemini-2.0-flash').replace(/^models\//, '').trim();
    if (cleanModel.includes('flash-latest') || cleanModel === 'gemini-flash') {
      cleanModel = 'gemini-2.0-flash';
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nUSER PROMPT: "${userPrompt}"` }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Gemini API returned ' + res.status);
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
      return {
        ...parsed,
        confidence: `AI Live (${cleanModel})`
      };
    }
  } else if (provider.includes('openai') || provider.includes('groq') || provider.includes('openrouter')) {
    const baseUrl = provider.includes('groq') ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
    const model = settings.modelId || (provider.includes('groq') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) throw new Error('AI Provider API error: ' + res.status);
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content);
    return {
      ...parsed,
      confidence: `AI Live (${model})`
    };
  }

  throw new Error('Unsupported AI provider or no response');
}

/**
 * Intelligent Offline Semantic Pattern Matcher (Works with zero API Key)
 */
function generateOfflineSql(userPrompt, tableSchemas, defaultTable = 'work_orders') {
  const p = userPrompt.toLowerCase().trim();
  const allTableNames = Object.keys(tableSchemas);
  
  // Find which table is mentioned in the prompt
  let targetTable = allTableNames.find(t => p.includes(t.toLowerCase())) || defaultTable;
  if (!tableSchemas[targetTable] && allTableNames.length > 0) {
    targetTable = allTableNames[0];
  }

  const schema = tableSchemas[targetTable] || { columns: [] };
  const cols = schema.columns?.map(c => c.name) || [];

  // Helper to find existing column or fallback
  const getCol = (keywords, fallback) => {
    for (const kw of keywords) {
      const found = cols.find(c => c.toLowerCase().includes(kw));
      if (found) return found;
    }
    return fallback;
  };

  // Pattern: CREATE TABLE
  if (p.includes('buat tabel') || p.includes('create table') || p.includes('bikin tabel')) {
    const words = p.split(/\s+/);
    const tblIdx = words.findIndex(w => ['tabel', 'table'].includes(w));
    const newTblName = (tblIdx !== -1 && words[tblIdx + 1]) ? words[tblIdx + 1].replace(/[^a-zA-Z0-9_]/g, '') : 'new_table';
    return {
      sql: `CREATE TABLE ${newTblName} (\n  id UUID PRIMARY KEY,\n  name VARCHAR(255),\n  code VARCHAR(50),\n  status VARCHAR(50),\n  created_at TIMESTAMP\n);`,
      explanation: `Membuat skema tabel baru "${newTblName}" dengan kolom id, name, code, status, dan created_at.`,
      tablesInvolved: [newTblName],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern: INSERT INTO / Tambah data
  if (p.includes('tambah') || p.includes('insert') || p.includes('buat data')) {
    const colList = cols.slice(0, 4);
    const colStr = colList.length > 0 ? colList.join(', ') : 'order_number, part_name, status';
    const valStr = colList.length > 0 ? colList.map(c => `'Sample ${c}'`).join(', ') : "'WO-999', 'Part Baru', 'SCHEDULED'";
    return {
      sql: `INSERT INTO ${targetTable} (${colStr})\nVALUES (${valStr});`,
      explanation: `Menambahkan baris baru ke dalam tabel ${targetTable}.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern: UPDATE / Ubah data / Update status
  if (p.includes('update') || p.includes('ubah') || p.includes('ganti')) {
    const statusCol = getCol(['status', 'state'], 'status');
    return {
      sql: `UPDATE ${targetTable}\nSET ${statusCol} = 'COMPLETED'\nWHERE ${statusCol} = 'RUNNING';`,
      explanation: `Memperbarui kolom ${statusCol} menjadi 'COMPLETED' untuk record yang sedang berjalan.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern: DELETE / Hapus
  if (p.includes('hapus') || p.includes('delete') || p.includes('buang')) {
    const statusCol = getCol(['status', 'state'], 'status');
    return {
      sql: `DELETE FROM ${targetTable}\nWHERE ${statusCol} = 'CANCELLED';`,
      explanation: `Menghapus record pada tabel ${targetTable} yang berstatus CANCELLED.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern 1: Scrap / Defect / Reject
  if (p.includes('scrap') || p.includes('reject') || p.includes('defect') || p.includes('rusak')) {
    const scrapCol = getCol(['scrap', 'defect', 'reject', 'ng'], 'scrap_quantity');
    return {
      sql: `SELECT * \nFROM ${targetTable} \nWHERE ${scrapCol} > 0 \nORDER BY ${scrapCol} DESC \nLIMIT 20;`,
      explanation: `Menampilkan daftar ${targetTable} yang memiliki ${scrapCol} > 0, diurutkan dari yang terbanyak.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern 2: Status RUNNING / Berjalan / Aktif
  if (p.includes('running') || p.includes('berjalan') || p.includes('sedang') || p.includes('aktif') || p.includes('active')) {
    const statusCol = getCol(['status', 'state'], 'status');
    return {
      sql: `SELECT * \nFROM ${targetTable} \nWHERE ${statusCol} = 'RUNNING' \nLIMIT 50;`,
      explanation: `Menampilkan semua record di tabel ${targetTable} yang berstatus 'RUNNING'.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern 3: Status COMPLETED / Selesai
  if (p.includes('selesai') || p.includes('completed') || p.includes('finish') || p.includes('done') || p.includes('tuntas')) {
    const statusCol = getCol(['status', 'state'], 'status');
    return {
      sql: `SELECT * \nFROM ${targetTable} \nWHERE ${statusCol} = 'COMPLETED' \nLIMIT 50;`,
      explanation: `Menampilkan semua data di tabel ${targetTable} yang sudah selesai (COMPLETED).`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern 4: Rekap / Total / Agregasi per Lini / Operator / Status
  if (p.includes('total') || p.includes('rekap') || p.includes('lini') || p.includes('line') || p.includes('group') || p.includes('hitung') || p.includes('jumlah') || p.includes('summary')) {
    const lineCol = getCol(['line', 'station', 'mesin', 'machine', 'operator', 'status'], cols[1] || 'line_name');
    const targetQtyCol = getCol(['target', 'qty', 'plan'], 'target_quantity');
    const compQtyCol = getCol(['completed', 'actual', 'good', 'finish'], 'completed_quantity');

    return {
      sql: `SELECT \n  ${lineCol},\n  COUNT(*) AS total_order,\n  SUM(${targetQtyCol}) AS total_target,\n  SUM(${compQtyCol}) AS total_selesai\nFROM ${targetTable}\nGROUP BY ${lineCol}\nORDER BY total_order DESC;`,
      explanation: `Agregasi total order, total target, dan realisasi selesai dikelompokkan per ${lineCol}.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern 5: Batas waktu / Due date / Deadline / Tenggat
  if (p.includes('due') || p.includes('deadline') || p.includes('tenggat') || p.includes('waktu') || p.includes('tanggal') || p.includes('hari ini') || p.includes('besok')) {
    const dateCol = getCol(['due', 'date', 'time', 'jadwal'], 'due_date');
    return {
      sql: `SELECT * \nFROM ${targetTable} \nWHERE ${dateCol} IS NOT NULL \nORDER BY ${dateCol} ASC \nLIMIT 20;`,
      explanation: `Menampilkan daftar order terurut berdasarkan tanggal batas waktu (${dateCol}) terdekat.`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Pattern 6: Cari berdasarkan keyword kata
  const words = p.split(/\s+/).filter(w => w.length > 2 && !['tampilkan', 'semua', 'data', 'cari', 'dari', 'yang', 'pada', 'buat', 'sql', 'query'].includes(w));
  if (words.length > 0) {
    const searchWord = words[0];
    const textCol = getCol(['name', 'part', 'number', 'code', 'desc'], 'part_name');
    return {
      sql: `SELECT * \nFROM ${targetTable} \nWHERE ${textCol} ILIKE '%${searchWord}%' \nLIMIT 50;`,
      explanation: `Mencari data pada kolom ${textCol} yang mengandung kata "${searchWord}".`,
      tablesInvolved: [targetTable],
      confidence: 'Smart Rule (Offline Engine)'
    };
  }

  // Default fallback
  return {
    sql: `SELECT * \nFROM ${targetTable} \nLIMIT 50;`,
    explanation: `Menampilkan data dari tabel "${targetTable}" dibatasi 50 baris.`,
    tablesInvolved: [targetTable],
    confidence: 'Smart Rule (Offline Engine)'
  };
}
