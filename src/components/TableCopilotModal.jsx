/**
 * TableCopilotModal.jsx
 * AI Copilot & Smart Schema Assistant for TableManager in MaviCore MES
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Loader2, Table, Database, Link2,
  ChevronDown, ChevronRight, Code, Eye, Copy,
  CheckCircle2, AlertTriangle, XCircle, Sparkles,
  Plus, Trash2, Edit3, RefreshCw, ArrowRight,
  X, MessageSquare, Layers, Hash, Calendar, ToggleLeft,
  Wand2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { streamVibeAI } from '../utils/ai/VibeAIStreamService';
import {
  createTable,
  addTableRecord,
  getTables,
  TABLE_FIELD_TYPES
} from '../utils/supabaseTablesDB';

/**
 * Smart Rule-based schema generator used as immediate generator & fallback
 * when AI is offline, unconfigured, or streaming fails.
 */
export function generateSmartTableSchema(input, existingTables = []) {
  const text = String(input || '').trim();

  // 1. Query detection
  if (/^(query|select|tampilkan|cari|ambil|lihat)\b/i.test(text)) {
    const matchTable = text.match(/(?:dari|tabel|table|from)\s+([a-zA-Z0-9_]+)/i);
    const tableName = matchTable ? matchTable[1] : (existingTables[0]?.name || 'production_log');
    const sql = `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 100;`;
    return {
      type: 'query',
      title: `Query Laporan: ${tableName}`,
      description: `Query SQL otomatis untuk mengambil data dari tabel "${tableName}".`,
      data: { tableName, query: sql },
      code: sql
    };
  }

  // 2. Linked record detection
  if (/^(hubungkan|link|relasi|connect)\b/i.test(text) || text.toLowerCase().includes('linked record')) {
    const words = text.match(/([a-zA-Z0-9_]+)/g) || [];
    const sourceTable = existingTables[0]?.name || 'orders';
    const targetTable = existingTables[1]?.name || 'customers';
    const sql = `-- Hubungkan relasi antar tabel di database:\nALTER TABLE ${sourceTable} ADD COLUMN ${targetTable}_id UUID REFERENCES ${targetTable}(id);`;
    return {
      type: 'linked_record',
      title: 'Konfigurasi Linked Record',
      description: `Relasi relasional foreign-key siap dikonfigurasikan antar tabel.`,
      data: { description: text, sourceTable, targetTable },
      code: sql
    };
  }

  // 3. Create Table (Default)
  let tableName = 'new_table';
  const nameMatch = text.match(/(?:tabel|table)\s+([a-zA-Z0-9_\-]+)/i) ||
                    text.match(/^(?:buatkan|buat|bikin)\s+(?:sebuah\s+)?([a-zA-Z0-9_\-]+)/i);
  if (nameMatch && nameMatch[1]) {
    tableName = nameMatch[1].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  let fieldParts = [];
  if (text.includes(':')) {
    const afterColon = text.split(':').slice(1).join(':').trim();
    fieldParts = afterColon.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  } else {
    const cleaned = text.replace(/^(buatkan|buat|bikin)\s+(tabel|table)?\s*[a-zA-Z0-9_]+/i, '').trim();
    if (cleaned) {
      fieldParts = cleaned.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
  }

  if (fieldParts.length === 0) {
    fieldParts = ['item_code', 'item_name', 'stock_qty', 'unit', 'status', 'created_at'];
  }

  const fields = fieldParts.map(part => {
    const typeMatch = part.match(/^([a-zA-Z0-9_\-\s]+)\s*\(([^)]+)\)$/);
    let rawName = part;
    let explicitType = null;
    if (typeMatch) {
      rawName = typeMatch[1].trim();
      explicitType = typeMatch[2].trim().toLowerCase();
    }

    const fieldName = rawName.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^a-z0-9_]/g, '');
    const label = rawName.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    let fieldType = 'text';
    if (explicitType) {
      if (['number', 'integer', 'int', 'float', 'decimal', 'numeric'].includes(explicitType)) fieldType = 'number';
      else if (['datetime', 'date', 'time', 'timestamp'].includes(explicitType)) fieldType = 'datetime';
      else if (['boolean', 'bool'].includes(explicitType)) fieldType = 'boolean';
      else if (['image', 'foto', 'gambar'].includes(explicitType)) fieldType = 'image';
      else if (['file', 'doc'].includes(explicitType)) fieldType = 'file';
      else fieldType = 'text';
    } else {
      if (/(_qty|qty|quantity|stock|stok|count|amount|price|harga|total|min_stock|max_stock|weight|berat|nominal)/i.test(fieldName)) {
        fieldType = 'number';
      } else if (/(_date|timestamp|created_at|updated_at|tanggal|waktu|last_updated|due_date|tgl)/i.test(fieldName)) {
        fieldType = 'datetime';
      } else if (/^(is_|has_|active|status_aktif|selesai|verified)/i.test(fieldName)) {
        fieldType = 'boolean';
      } else if (/(image|photo|foto|gambar|avatar)/i.test(fieldName)) {
        fieldType = 'image';
      } else if (/(file|attachment|lampiran|pdf)/i.test(fieldName)) {
        fieldType = 'file';
      }
    }

    return {
      name: fieldName,
      type: fieldType,
      label: label || fieldName,
      required: false
    };
  });

  // Ensure unique field names
  const seen = new Set();
  const uniqueFields = fields.filter(f => {
    if (!f.name || seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });

  const sqlFields = uniqueFields.map(f => {
    const sqlType = f.type === 'number' ? 'NUMERIC' :
                    f.type === 'datetime' ? 'TIMESTAMP' :
                    f.type === 'boolean' ? 'BOOLEAN' : 'VARCHAR(255)';
    return `  ${f.name} ${sqlType}`;
  }).join(',\n');

  const sql = `CREATE TABLE ${tableName} (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n${sqlFields},\n  created_at TIMESTAMP DEFAULT NOW()\n);`;

  const formattedTitle = tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    type: 'create_table',
    title: `Tabel ${formattedTitle}`,
    description: `Tabel "${tableName}" dengan ${uniqueFields.length} kolom siap dibuat ke database MaviCore.`,
    data: {
      tableName,
      fields: uniqueFields
    },
    code: sql
  };
}

export default function TableCopilotModal({
  isOpen,
  onClose,
  tables = [],
  onTableCreated,
  onOpenAppGenerator
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Halo! 👋 Saya **Table Copilot**

Saya bantu bikin:
- 📊 **Tabel** baru otomatis dari deskripsi
- 🔍 **Query** SELECT/INSERT/UPDATE
- 🔗 **Linked Records** relasi antar tabel

Contoh prompt:
- "Buatkan tabel inventory: item_code, item_name, stock_qty, min_stock, unit, supplier, last_updated"
- "Query semua data produksi status COMPLETED"
- "Hubungkan tabel orders ke customers"`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStream]);

  // Quick suggestions
  const quickSuggestions = [
    {
      icon: Wand2,
      label: 'Generate App',
      prompt: 'GENERATE_APP',
      action: 'app_generator',
      color: '#667eea'
    },
    {
      icon: Table,
      label: 'Tabel Produksi',
      prompt: 'Buatkan tabel produksi dengan field: part_name (text), quantity (number), operator_name (text), shift (select), timestamp (datetime), status (text)',
      color: '#3b82f6'
    },
    {
      icon: Database,
      label: 'Tabel Inventory',
      prompt: 'Buatkan tabel inventory: item_code, item_name, stock_qty, min_stock, unit, supplier, last_updated',
      color: '#22c55e'
    },
    {
      icon: Code,
      label: 'Query Laporan',
      prompt: 'Query untuk select semua produksi hari ini diurutkan descending berdasarkan timestamp',
      color: '#f59e0b'
    },
    {
      icon: Link2,
      label: 'Linked Record',
      prompt: 'Tambahkan linked record dari tabel production_log ke operators berdasarkan operator_id',
      color: '#8b5cf6'
    }
  ];

  const parseResponse = (text) => {
    try {
      const match = text.match(/```json\n?([\s\S]*?)```/) || text.match(/```\n?([\s\S]*?)```/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      // If pure json text
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        return JSON.parse(text.trim());
      }
    } catch (e) {
      console.warn('[TableCopilot] parseResponse error:', e);
    }
    return null;
  };

  const handleSend = async (forcedPrompt = null) => {
    const promptToSend = String(forcedPrompt || input).trim();
    if (!promptToSend || isLoading) return;

    const userMessage = { role: 'user', content: promptToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStream('');

    let finalResult = null;
    let fullResponse = '';

    try {
      const tablesContext = tables.map(t => ({
        name: t.name,
        fields: (t.fields || []).map(f => ({ name: f.name, type: f.type }))
      }));

      const contextPrompt = `Kamu Table Copilot untuk MaviCore MES system.
EXISTING TABLES:
${JSON.stringify(tablesContext, null, 2)}

USER REQUEST:
${promptToSend}

RESPOND dengan JSON format ini:
\`\`\`json
{
  "type": "create_table",
  "title": "Judul Tabel",
  "description": "Penjelasan singkat",
  "data": {
    "tableName": "nama_tabel",
    "fields": [
      {"name": "field_1", "type": "text", "label": "Label 1", "required": false},
      {"name": "field_2", "type": "number", "label": "Label 2", "required": false}
    ]
  },
  "code": "CREATE TABLE nama_tabel (...);"
}
\`\`\`
Type must be one of: "create_table", "query", "linked_record".`;

      // Try AI streaming completion
      try {
        await streamVibeAI({
          messages: [
            {
              role: 'system',
              content: 'You are Table Copilot for MaviCore MES system. Always output JSON inside ```json ... ``` codeblocks.'
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          onChunk: (chunk) => {
            fullResponse += chunk;
            setCurrentStream(fullResponse);
          },
          onComplete: () => {
            const parsed = parseResponse(fullResponse);
            if (parsed && (parsed.type === 'create_table' || parsed.type === 'query' || parsed.type === 'linked_record')) {
              finalResult = parsed;
            }
          },
          onError: (err) => {
            console.warn('[TableCopilot] AI service error:', err);
          }
        });
      } catch (aiErr) {
        console.warn('[TableCopilot] AI stream call failed, switching to local schema generator:', aiErr);
      }

      // If AI didn't produce structured response or is offline, use smart rule engine
      if (!finalResult) {
        finalResult = generateSmartTableSchema(promptToSend, tables);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: finalResult,
        raw: fullResponse || JSON.stringify(finalResult)
      }]);
      setCurrentStream('');
      setIsLoading(false);

    } catch (err) {
      console.warn('[TableCopilot] Top-level error, using smart fallback schema:', err);
      finalResult = generateSmartTableSchema(promptToSend, tables);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: finalResult,
        raw: JSON.stringify(finalResult)
      }]);
      setIsLoading(false);
      setCurrentStream('');
    }
  };

  const handleApply = async (result) => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      if (result.type === 'create_table' && result.data) {
        const { tableName, fields = [] } = result.data;
        const normalizedFields = fields.map(f => ({
          name: String(f.name || '').trim(),
          type: TABLE_FIELD_TYPES.includes(f.type) ? f.type : 'text',
          label: f.label || f.name,
          required: Boolean(f.required)
        }));

        await createTable({
          name: tableName,
          description: result.description || '',
          fields: normalizedFields
        });

        toast.success(`✅ Tabel "${tableName}" berhasil dibuat!`);
        
        if (onTableCreated) {
          await onTableCreated(tableName);
        } else {
          setTimeout(() => window.location.reload(), 800);
        }
        onClose();
      } else if (result.type === 'query') {
        if (result.code) {
          navigator.clipboard.writeText(result.code);
          toast.success('📋 SQL Query berhasil disalin ke clipboard!');
        }
      } else if (result.type === 'linked_record') {
        toast.success('🔗 Konfigurasi linked record siap diterapkan!');
      } else {
        toast.info('Info telah dicatat');
      }
    } catch (err) {
      console.error('[TableCopilot] handleApply error:', err);
      toast.error('Gagal membuat tabel: ' + (err.message || err));
    } finally {
      setIsApplying(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    if (suggestion.action === 'app_generator') {
      // Open App Generator
      if (onOpenAppGenerator) {
        onOpenAppGenerator();
      }
      return;
    }
    setInput(suggestion.prompt);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '95%',
        maxWidth: '740px',
        height: '86vh',
        backgroundColor: 'white',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem' }}>Table Copilot</h3>
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 600
                }}>AI & Auto-Schema</span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                Asisten Cerdas Pembuat Tabel, Skema, dan Query MaviCore
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} style={{ color: '#6366f1' }} />
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Quick Templates</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickSuggestions.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${s.color}30`,
                    backgroundColor: `${s.color}12`,
                    color: s.color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${s.color}25`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${s.color}12`;
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <Icon size={14} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: isUser ? '80%' : '90%',
                  padding: isUser ? '12px 18px' : '16px 20px',
                  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  backgroundColor: isUser ? '#4f46e5' : '#ffffff',
                  color: isUser ? '#ffffff' : '#1e293b',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  boxShadow: isUser ? '0 4px 12px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                  border: isUser ? 'none' : '1px solid #e2e8f0'
                }}>
                  {isUser ? (
                    <div style={{ fontWeight: 500 }}>{msg.content}</div>
                  ) : typeof msg.content === 'string' ? (
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', color: '#334155' }}>
                      {msg.content}
                    </pre>
                  ) : (
                    <CopilotResult
                      result={msg.content}
                      onApply={handleApply}
                      isApplying={isApplying}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Streaming Response Animation */}
          {currentStream && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{
                maxWidth: '90%',
                padding: '16px 20px',
                borderRadius: '20px 20px 20px 4px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#475569',
                fontSize: '0.875rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#4f46e5', fontWeight: 600 }}>
                  <Sparkles size={16} className="animate-spin" />
                  Sedang Merancang Skema Tabel...
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace', fontSize: '0.8rem', color: '#334155' }}>
                  {currentStream}
                </pre>
              </div>
            </div>
          )}

          {isLoading && !currentStream && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{
                padding: '14px 20px',
                borderRadius: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#6366f1',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                <Loader2 size={18} className="animate-spin" />
                Menganalisis prompt & menyusun struktur kolom...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Contoh: Buatkan tabel inventory: item_code, item_name, stock_qty, min_stock, unit, supplier"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                maxHeight: '100px',
                lineHeight: 1.4,
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              rows={2}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                height: '52px',
                padding: '0 24px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isLoading ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                transition: 'transform 0.15s, opacity 0.15s'
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !isLoading) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Send size={18} />
              <span>Generate</span>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>
              💡 Tekan <kbd style={{ padding: '2px 4px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Enter</kbd> untuk kirim, <kbd style={{ padding: '2px 4px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Shift+Enter</kbd> untuk baris baru
            </p>
            <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600 }}>
              MaviCore Copilot v2.5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Result Card Component for Copilot outputs
 */
function CopilotResult({ result, onApply, isApplying }) {
  if (!result) return null;

  const [showSql, setShowSql] = useState(false);

  const typeConfig = {
    'create_table': { icon: Table, color: '#4f46e5', bg: '#eef2ff', label: 'CREATE TABLE' },
    'query': { icon: Database, color: '#16a34a', bg: '#f0fdf4', label: 'SQL QUERY' },
    'linked_record': { icon: Link2, color: '#7c3aed', bg: '#faf5ff', label: 'LINKED RECORD' },
    'explanation': { icon: Bot, color: '#475569', bg: '#f8fafc', label: 'INFO' }
  };

  const config = typeConfig[result.type] || typeConfig.explanation;
  const Icon = config.icon;
  const fields = result.data?.fields || [];
  const tableName = result.data?.tableName || 'table';

  const getFieldTypeBadge = (type) => {
    switch (type) {
      case 'number':
      case 'integer':
        return { label: 'number', color: '#2563eb', bg: '#eff6ff', icon: Hash };
      case 'datetime':
        return { label: 'datetime', color: '#d97706', bg: '#fffbeb', icon: Calendar };
      case 'boolean':
        return { label: 'boolean', color: '#059669', bg: '#ecfdf5', icon: ToggleLeft };
      default:
        return { label: type || 'text', color: '#64748b', bg: '#f1f5f9', icon: Layers };
    }
  };

  return (
    <div style={{ minWidth: '320px', maxWidth: '100%' }}>
      {/* Title & Type Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} style={{ color: config.color }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
              {result.title || tableName}
            </h4>
            <span style={{
              display: 'inline-block',
              marginTop: '2px',
              padding: '1px 8px',
              borderRadius: '6px',
              backgroundColor: config.bg,
              color: config.color,
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ margin: '0 0 14px 0', fontSize: '0.825rem', color: '#475569', lineHeight: 1.45 }}>
        {result.description}
      </p>

      {/* Fields Preview Grid (for create_table) */}
      {result.type === 'create_table' && fields.length > 0 && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
              Daftar Kolom ({fields.length}):
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Tabel: <code style={{ color: '#4f46e5', fontWeight: 600 }}>{tableName}</code>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {fields.map((f, idx) => {
              const badge = getFieldTypeBadge(f.type);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.75rem'
                  }}
                >
                  <BadgeIcon size={12} style={{ color: badge.color }} />
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{f.name}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    fontWeight: 600
                  }}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SQL Code Preview Toggle */}
      {result.code && (
        <div style={{ marginBottom: '14px' }}>
          <button
            onClick={() => setShowSql(!showSql)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontSize: '0.75rem',
              color: '#6366f1',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Code size={13} />
            {showSql ? 'Sembunyikan SQL Code' : 'Lihat SQL Code'}
            {showSql ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {showSql && (
            <pre style={{
              marginTop: '6px',
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              overflowX: 'auto',
              fontFamily: 'Consolas, Monaco, monospace',
              lineHeight: 1.4,
              border: '1px solid #1e293b'
            }}>
              {result.code}
            </pre>
          )}
        </div>
      )}

      {/* Action Button */}
      {result.type === 'create_table' && (
        <button
          onClick={() => onApply(result)}
          disabled={isApplying}
          style={{
            width: '100%',
            padding: '11px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            cursor: isApplying ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            opacity: isApplying ? 0.7 : 1,
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (!isApplying) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
          }}
        >
          {isApplying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Membuat Tabel ke Database...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Terapkan / Buat Tabel Sekarang</span>
            </>
          )}
        </button>
      )}

      {result.type === 'query' && (
        <button
          onClick={() => onApply(result)}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '10px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Copy size={15} />
          Salin Query SQL
        </button>
      )}
    </div>
  );
}
