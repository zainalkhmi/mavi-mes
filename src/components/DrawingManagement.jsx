/**
 * DrawingManagement.jsx
 * Simple Drawing Management for PLM
 */

import React, { useState, useEffect } from 'react';
import {
  Folder, FileText, Package, Plus, Trash2, RefreshCw, ChevronRight, ChevronDown,
  Circle, Layers
} from 'lucide-react';

import {
  getDrawings, createDrawing, getDrawingRevisions, getDrawingBalloons
} from '../utils/mavicorePLM';

export default function DrawingManagement() {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [expandedDrawings, setExpandedDrawings] = useState(new Set());

  const loadDrawings = async () => {
    setLoading(true);
    const data = await getDrawings();
    setDrawings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDrawings();
  }, []);

  const handleCreateDrawing = async () => {
    const name = prompt('Drawing Name:');
    if (!name) return;
    const code = prompt('Drawing Code:') || `DRW-${Date.now().toString(36).toUpperCase()}`;
    const drawing_type = prompt('Type (ASSEMBLY/DETAIL/SCHEMATIC):', 'DETAIL') || 'DETAIL';

    const result = await createDrawing({ name, code, drawing_type });
    if (result.success) {
      loadDrawings();
    }
  };

  const toggleExpand = (id) => {
    setExpandedDrawings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ASSEMBLY': return <Package size={16} />;
      case 'PRODUCT': return <Package size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div style={{ padding: '1.5rem', height: 'calc(100vh - 120px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Drawing Management</h1>
        <button
          onClick={handleCreateDrawing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} /> New Drawing
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1rem',
        marginTop: '1rem'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '500' }}>Drawing List</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
            Loading...
          </div>
        ) : drawings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
            <Folder size={48} style={{ marginBottom: '0.5rem' }} />
            <p>No drawings yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Click "New Drawing" to create one
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {drawings.map(drawing => (
              <div
                key={drawing.id}
                onClick={() => setSelectedDrawing(drawing)}
                style={{
                  padding: '0.75rem 1rem',
                  border: `1px solid ${selectedDrawing?.id === drawing.id ? '#2563EB' : '#E2E8F0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedDrawing?.id === drawing.id ? '#EFF6FF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                {getTypeIcon(drawing.drawing_type)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{drawing.code}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{drawing.name}</div>
                </div>
                <span style={{
                  padding: '0.2rem 0.5rem',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#64748B'
                }}>
                  {drawing.drawing_type}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); loadDrawings(); }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDrawing && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Drawing Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Code</div>
              <div style={{ fontWeight: '500' }}>{selectedDrawing.code}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Name</div>
              <div style={{ fontWeight: '500' }}>{selectedDrawing.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Type</div>
              <div style={{ fontWeight: '500' }}>{selectedDrawing.drawing_type}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Status</div>
              <div style={{ fontWeight: '500' }}>{selectedDrawing.status || 'ACTIVE'}</div>
            </div>
          </div>
          {selectedDrawing.description && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Description</div>
              <div>{selectedDrawing.description}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
