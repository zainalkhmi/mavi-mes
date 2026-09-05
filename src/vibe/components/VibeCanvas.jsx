/**
 * VibeCanvas.jsx
 * Drag & Drop Canvas Editor untuk VibeCode
 * Build component-based visual editor
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Square, Type, Image, BarChart3, ToggleLeft, Input, Table, Trash2,
  Save, Download, Move, Plus, X, GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component Palette
const COMPONENTS = [
  { type: 'button', label: 'Button', icon: Square, color: '#6366f1' },
  { type: 'text', label: 'Text', icon: Type, color: '#8b5cf6' },
  { type: 'card', label: 'Card', icon: Square, color: '#10b981' },
  { type: 'input', label: 'Input', icon: Input, color: '#06b6d4' },
  { type: 'chart', label: 'Chart', icon: BarChart3, color: '#f59e0b' },
  { type: 'toggle', label: 'Toggle', icon: ToggleLeft, color: '#ec4899' },
];

// Canvas Item Component
function CanvasItem({ item, selected, onSelect, onDelete }) {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: item.x || 100, y: item.y || 100 });

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left - 50,
      y: e.clientY - rect.top - 20,
    });
  }, [dragging]);

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelect(item.id)}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: dragging ? 100 : 10,
      }}
    >
      <motion.div
        animate={{ scale: dragging ? 1.05 : 1 }}
        className={`relative bg-gray-800 rounded-xl p-4 border ${selected === item.id ? 'border-indigo-500' : 'border-gray-600'} cursor-grab select-none`}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center cursor-grab">
          <GripVertical size={14} className="text-gray-400" />
        </div>

        {/* Delete button */}
        {selected === item.id && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition"
          >
            <X size={14} />
          </button>
        )}

        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">{item.type}</div>
          <div className="font-semibold text-white">{item.label || item.type}</div>
        </div>
      </motion.div>
    </div>
  );
}

// Sidebar Component Palette
function ComponentPalette({ onAdd }) {
  return (
    <div className="w-48 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Components</div>
      <div className="grid grid-cols-2 gap-2">
        {COMPONENTS.map(comp => {
          const Icon = comp.icon;
          return (
            <button
              key={comp.type}
              onClick={() => onAdd(comp.type)}
              className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: comp.color + '20' }}
              >
                <Icon size={20} style={{ color: comp.color }} />
              </div>
              <span className="text-xs text-gray-400">{comp.label</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Properties Panel
function PropertiesPanel({ selected, item, onUpdate, onDelete }) {
  if (!selected) return (
    <div className="w-64 bg-gray-900 border-l border-gray-800 p-4">
      <div className="text-xs text-gray-500">Select a component to edit properties</div>
    </div>
  );

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-white">Properties</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Label</label>
          <input
            value={item.label || ''}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Background</label>
          <input
            type="color"
            value={item.bg || '#1f2937'}
            onChange={(e) => onUpdate({ bg: e.target.value })}
            className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// Main Canvas
export default function VibeCanvas({ initial = [], onSave }) {
  const [components, setComponents] = useState(initial);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef();

  const addComponent = (type) => {
    const id = `c_${Date.now()}`;
    setComponents(prev => [...prev, {
      id,
      type,
      label: type,
      x: 100 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      bg: '#1f2937'
    }]);
    setSelected(id);
  };

  const updateComponent = (id, updates) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteComponent = (id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setSelected(null);
  };

  const saveCanvas = () => {
    onSave?.(components);
    toast.success('Canvas saved!');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(components, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas.json';
    a.click();
  };

  const selectedItem = components.find(c => c.id === selected);

  return (
    <div className="flex h-full bg-gray-950">
      <ComponentPalette onAdd={addComponent} />

      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Canvas Editor</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">{components.length} components</span>
          </div>
          <div className="flex gap-2">
            <button onClick={saveCanvas} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium">
              <Save size={14} /> Save
            </button>
            <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          onClick={() => setSelected(null)}
          style={{
            backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          <AnimatePresence>
            {components.map(item => (
              <CanvasItem
                key={item.id}
                item={item}
                selected={selected}
                onSelect={setSelected}
                onUpdate={(u) => updateComponent(item.id, u)}
                onDelete={deleteComponent}
              />
            ))}
          </AnimatePresence>

          {components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <Plus size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">Add components from sidebar</p>
                <p className="text-sm mt-1">Click a component to add it to canvas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <PropertiesPanel
        selected={selected}
        item={selectedItem}
        onUpdate={(u) => updateComponent(selected, u)}
        onDelete={() => deleteComponent(selected)}
      />
    </div>
  );
}
