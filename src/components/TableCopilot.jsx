/**
 * TableCopilot.jsx
 * AI Copilot for Table Management
 * Create tables, queries, and linked records from natural language prompts
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Loader2, Table, Database, Link2,
  ChevronDown, ChevronRight, Code, Eye, Copy,
  CheckCircle2, AlertTriangle, XCircle, Sparkles,
  Plus, Trash2, Edit3, RefreshCw, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { streamVibeAI } from '../utils/ai/VibeAIStreamService';

export default function TableCopilot({
  tables = [],
  onCreateTable,
  onCreateQuery,
  onCreateLinkedRecord,
  onClose
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Halo! Saya **Table Copilot** 🤖

Saya bisa bantu kamu bikin:
- 📊 **Tabel** baru dari deskripsi
- 🔍 **Query** SELECT/INSERT/UPDATE
- 🔗 **Linked Records** antar tabel

Contoh:
- "Buatkan tabel untuk menyimpan data produksi dengan field: part_name, quantity, operator, timestamp"
- "Query untuk ambil semua data produksi hari ini"
- "Hubungkan tabel produksi dengan tabel operator"

Mau bikin apa dulu?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStream, setCurrentStream] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStream]);

  // Quick suggestions
  const quickSuggestions = [
    {
      icon: Table,
      label: 'Buat Tabel Baru',
      prompt: 'Buatkan tabel untuk menyimpan data produksi dengan field: part_name (text), quantity (number), operator (text), timestamp (datetime), status (text)',
      color: '#3b82f6'
    },
    {
      icon: Database,
      label: 'Buat Tabel Inventory',
      prompt: 'Buatkan tabel inventory dengan: item_code, item_name, stock_qty, min_stock, unit_price, supplier, last_updated',
      color: '#22c55e'
    },
    {
      icon: Code,
      label: 'Query Produksi',
      prompt: 'Buatkan query SELECT untuk ambil semua data produksi yang statusnya "COMPLETED" diurutkan berdasarkan timestamp DESC',
      color: '#f59e0b'
    },
    {
      icon: Link2,
      label: 'Linked Record',
      prompt: 'Buatkan linked record antara tabel production_log dan tabel operators berdasarkan field operator_id',
      color: '#8b5cf6'
    }
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStream('');

    try {
      // Build context with existing tables
      const tablesContext = tables.map(t => ({
        name: t.name,
        fields: t.fields || []
      }));

      const contextPrompt = `
Kamu adalah Table Copilot untuk MaviCore MES system.

CONTEXT:
- Existing tables: ${JSON.stringify(tablesContext, null, 2)}
- User request: ${input}

TUGAS:
Parse request user dan generate:
1. **CREATE TABLE**: JSON schema untuk tabel baru
2. **QUERY**: SQL query untuk SELECT/INSERT/UPDATE
3. **LINKED RECORD**: Konfigurasi relasi antar tabel

RESPONSE FORMAT:
Selalu response dalam format JSON berikut:

\`\`\`json
{
  "type": "create_table" | "query" | "linked_record" | "explanation",
  "title": "Judul singkat",
  "description": "Penjelasan apa yang akan dilakukan",
  "data": {
    // For create_table:
    "tableName": "nama_tabel",
    "fields": [
      { "name": "field_name", "type": "text|number|datetime|boolean|select", "label": "Label", "required": true }
    ]
    // For query:
    "sql": "SELECT * FROM ...",
    "explanation": "Penjelasan query"
    // For linked_record:
    "sourceTable": "tabel_asal",
    "targetTable": "tabel_tujuan",
    "linkField": "field_penghubung"
  },
  "preview": "Preview hasil dalam format readable",
  "code": "SQL atau JSON code yang bisa di-copy"
}
\`\`\`

Jawab dalam bahasa Indonesia yang casual dan friendly.
`;

      let fullResponse = '';

      await streamVibeAI(contextPrompt, {
        onChunk: (chunk) => {
          fullResponse += chunk;
          setCurrentStream(fullResponse);
        },
        onComplete: () => {
          // Parse the response
          const parsed = parseCopilotResponse(fullResponse);

          const assistantMessage = {
            role: 'assistant',
            content: parsed,
            raw: fullResponse
          };

          setMessages(prev => [...prev, assistantMessage]);
          setCurrentStream('');
          setIsLoading(false);
        },
        onError: (err) => {
          toast.error('Gagal generate: ' + err.message);
          setIsLoading(false);
          setCurrentStream('');
        }
      });

    } catch (err) {
      console.error('Table Copilot error:', err);
      toast.error('Terjadi kesalahan: ' + err.message);
      setIsLoading(false);
      setCurrentStream('');
    }
  };

  // Parse AI response to structured format
  const parseCopilotResponse = (text) => {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                        text.match(/```\n([\s\S]*?)\n```/);

      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          ...parsed,
          parsed: true
        };
      }
    } catch (e) {
      // Not JSON, return as text
    }

    return {
      type: 'explanation',
      title: 'Hasil',
      description: text,
      parsed: false
    };
  };

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleApply = async (result) => {
    if (!result.parsed) {
      toast.error('Tidak ada action yang bisa diterapkan');
      return;
    }

    switch (result.type) {
      case 'create_table':
        if (result.data && onCreateTable) {
          await onCreateTable(result.data);
          toast.success('✅ Tabel berhasil dibuat!');
        }
        break;

      case 'query':
        if (result.data?.sql && onCreateQuery) {
          await onCreateQuery(result.data);
          toast.success('✅ Query berhasil dibuat!');
        }
        break;

      case 'linked_record':
        if (result.data && onCreateLinkedRecord) {
          await onCreateLinkedRecord(result.data);
          toast.success('✅ Linked record berhasil dibuat!');
        }
        break;

      default:
        toast.info('Fitur belum tersedia untuk type ini');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold">Table Copilot</h3>
            <p className="text-xs text-white/70">AI Assistant untuk Table Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs">AI Powered</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <p className="text-xs text-slate-500 mb-2 font-medium">💡 Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {quickSuggestions.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: `${s.color}15`,
                  color: s.color,
                  border: `1px solid ${s.color}30`
                }}
              >
                <Icon size={12} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isParsed = msg.content?.parsed;

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {isUser ? (
                  <p className="text-sm">{msg.content}</p>
                ) : isParsed ? (
                  <ParsedResult
                    result={msg.content}
                    onApply={() => handleApply(msg.content)}
                    onCopy={() => handleCopy(msg.content.code || msg.content.preview)}
                  />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming response */}
        {currentStream && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Sparkles size={14} className="text-violet-500 animate-pulse" />
                Generating...
              </div>
              <div className="text-sm whitespace-pre-wrap">{currentStream}</div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !currentStream && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-sm">
              <Loader2 size={16} className="animate-spin text-violet-600" />
              <span className="text-sm text-slate-500">Processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
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
            placeholder="Ketik request untuk bikin tabel, query, atau linked record..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Tekan Enter untuk kirim, Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}

// Parsed Result Component
function ParsedResult({ result, onApply, onCopy }) {
  const [expanded, setExpanded] = useState(true);

  const typeConfig = {
    'create_table': {
      icon: Table,
      color: '#3b82f6',
      label: 'CREATE TABLE',
      bgColor: '#eff6ff'
    },
    'query': {
      icon: Database,
      color: '#22c55e',
      label: 'QUERY',
      bgColor: '#f0fdf4'
    },
    'linked_record': {
      icon: Link2,
      color: '#8b5cf6',
      label: 'LINKED RECORD',
      bgColor: '#f5f3ff'
    },
    'explanation': {
      icon: Bot,
      color: '#64748b',
      label: 'INFO',
      bgColor: '#f8fafc'
    }
  };

  const config = typeConfig[result.type] || typeConfig.explanation;
  const Icon = config.icon;

  return (
    <div className="min-w-[300px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </div>
        <div>
          <p className="font-bold text-sm">{result.title}</p>
          <p className="text-xs opacity-60">{config.label}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto p-1 hover:bg-slate-100 rounded transition-colors"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-3">{result.description}</p>

      {/* Preview */}
      {result.preview && expanded && (
        <div
          className="p-3 rounded-lg mb-3 text-xs font-mono"
          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <pre className="whitespace-pre-wrap">{result.preview}</pre>
        </div>
      )}

      {/* Code */}
      {result.code && expanded && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">Code</span>
            <button
              onClick={onCopy}
              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>
          <div
            className="p-3 rounded-lg text-xs font-mono overflow-x-auto"
            style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}
          >
            <pre className="whitespace-pre-wrap">{result.code}</pre>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {result.type !== 'explanation' && (
        <div className="flex gap-2">
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: config.color }}
          >
            <CheckCircle2 size={14} />
            Apply
          </button>
          <button
            onClick={onCopy}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

export default TableCopilot;
