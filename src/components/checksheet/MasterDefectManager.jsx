/**
 * Master Defect Manager
 * Database defect library untuk QC + auto NCR trigger
 */
import React, { useState } from 'react';
import {
  AlertTriangle, Plus, Search, Filter, Edit2, Trash2, Download, Upload,
  Camera, X, CheckCircle, ChevronDown, ChevronUp, ChevronRight, Shield
} from 'lucide-react';

const DEFECT_CATEGORIES = [
  'Surface Defect',
  'Dimensional',
  'Material',
  'Assembly',
  'Packaging',
  'Electrical',
  'Functional'
];

const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR'];

const SAMPLE_DEFECTS = [
  { id: 'D-001', code: 'SURF-001', name: 'Scratch', category: 'Surface Defect', severity: 'MAJOR', description: 'Gores pada permukaan produk' },
  { id: 'D-002', code: 'SURF-002', name: 'Dent', category: 'Surface Defect', severity: 'MAJOR', description: 'Penyok/mlekuk' },
  { id: 'D-003', code: 'SURF-003', name: 'Discoloration', category: 'Surface Defect', severity: 'MINOR', description: 'Perubahan warna' },
  { id: 'D-004', code: 'DIM-001', name: 'Out of Tolerance', category: 'Dimensional', severity: 'CRITICAL', description: 'Ukuran di luar toleransi' },
  { id: 'D-005', code: 'MAT-001', name: 'Material Crack', category: 'Material', severity: 'CRITICAL', description: 'Retak material' },
  { id: 'D-006', code: 'ASM-001', name: 'Missing Part', category: 'Assembly', severity: 'CRITICAL', description: 'Komponen tidak terpasang' },
  { id: 'D-007', code: 'PKG-001', name: 'Damaged Packaging', category: 'Packaging', severity: 'MINOR', description: 'Kemasan rusak' },
  { id: 'D-008', code: 'FUNC-001', name: 'Function Fail', category: 'Functional', severity: 'CRITICAL', description: 'Fungsi tidak berjalan' }
];

export const MasterDefectManager = () => {
  const [defects, setDefects] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mandor_defects') || '[]');
      return stored.length > 0 ? stored : SAMPLE_DEFECTS;
    } catch {
      return SAMPLE_DEFECTS;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState({});

  const filtered = defects.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'all' || d.category === filterCategory;
    const matchSev = filterSeverity === 'all' || d.severity === filterSeverity;
    return matchSearch && matchCat && matchSev;
  });

  const grouped = filtered.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {});

  const severityColor = (sev) => ({
    CRITICAL: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
    MAJOR: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    MINOR: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
  }[sev] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <AlertTriangle className="text-rose-500" />
            Master Defect Library
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Database defect untuk QC reference + auto NCR trigger
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-200 rounded-lg font-semibold flex items-center gap-2">
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> Add Defect
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Defects', value: defects.length, color: 'bg-white border-slate-200' },
          { label: 'Critical', value: defects.filter(d => d.severity === 'CRITICAL').length, color: 'bg-rose-50 border-rose-200' },
          { label: 'Major', value: defects.filter(d => d.severity === 'MAJOR').length, color: 'bg-amber-50 border-amber-200' },
          { label: 'Minor', value: defects.filter(d => d.severity === 'MINOR').length, color: 'bg-blue-50 border-blue-200' }
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-xl border ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search defect code or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg"
        >
          <option value="all">All Categories</option>
          {DEFECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg"
        >
          <option value="all">All Severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Defect List */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              onClick={() => setExpanded(e => ({ ...e, [category]: !e[category] }))}
              className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer font-semibold"
            >
              <span>{category} ({items.length})</span>
              {expanded[category] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {expanded[category] && (
              <div className="divide-y divide-slate-100">
                {items.map(defect => {
                  const colors = severityColor(defect.severity);
                  return (
                    <div
                      key={defect.id}
                      className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedDefect(defect)}
                    >
                      <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {defect.code}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{defect.name}</div>
                        <div className="text-sm text-slate-500">{defect.description}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                        {defect.severity}
                      </div>
                      <button className="p-2 hover:bg-slate-200 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
          <p>No defects found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDefect && (
        <DefectDetailModal
          defect={selectedDefect}
          onClose={() => setSelectedDefect(null)}
          onTriggerNCR={() => {
            const ncr = {
              id: 'NCR-' + Date.now(),
              defectCode: selectedDefect.code,
              defectName: selectedDefect.name,
              severity: selectedDefect.severity,
              timestamp: new Date().toISOString()
            };
            const existing = JSON.parse(localStorage.getItem('mandor_ncr_queue') || '[]');
            localStorage.setItem('mandor_ncr_queue', JSON.stringify([ncr, ...existing]));
            alert('NCR Created: ' + ncr.id);
            setSelectedDefect(null);
          }}
        />
      )}

      {/* Add Form Modal */}
      {showForm && (
        <DefectFormModal
          onClose={() => setShowForm(false)}
          onSave={defect => {
            const newDefect = { ...defect, id: 'D-' + Date.now() };
            setDefects(prev => [...prev, newDefect]);
            localStorage.setItem('mandor_defects', JSON.stringify([...defects, newDefect]));
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};

const DefectDetailModal = ({ defect, onClose, onTriggerNCR }) => {
  const colors = {
    CRITICAL: 'bg-rose-500',
    MAJOR: 'bg-amber-500',
    MINOR: 'bg-blue-500'
  }[defect.severity] || 'bg-slate-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Defect Detail</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-500">Code</label>
              <div className="font-mono font-bold">{defect.code}</div>
            </div>
            <div>
              <label className="text-sm text-slate-500">Severity</label>
              <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold ${colors}`}>
                {defect.severity}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-500">Name</label>
            <div className="font-semibold">{defect.name}</div>
          </div>
          <div>
            <label className="text-sm text-slate-500">Description</label>
            <div>{defect.description}</div>
          </div>
          <div>
            <label className="text-sm text-slate-500">Category</label>
            <div>{defect.category}</div>
          </div>
          {defect.rootCause && (
            <div>
              <label className="text-sm text-slate-500">Root Cause</label>
              <div>{defect.rootCause}</div>
            </div>
          )}
          {defect.correctiveAction && (
            <div>
              <label className="text-sm text-slate-500">Corrective Action</label>
              <div>{defect.correctiveAction}</div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
          {defect.severity === 'CRITICAL' && (
            <button
              onClick={onTriggerNCR}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <AlertTriangle size={16} /> Trigger NCR
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DefectFormModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Surface Defect',
    severity: 'MAJOR',
    description: '',
    rootCause: '',
    correctiveAction: ''
  });

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Add New Defect</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <input
                required
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="SURF-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Scratch"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {DEFECT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Deskripsi defect..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Root Cause</label>
            <input
              value={form.rootCause}
              onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Kemungkinan penyebab..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Corrective Action</label>
            <input
              value={form.correctiveAction}
              onChange={e => setForm(f => ({ ...f, correctiveAction: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Tindakan perbaikan..."
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
            Simpan Defect
          </button>
        </div>
      </form>
    </div>
  );
};

export default MasterDefectManager;
