/**
 * TableAppGeneratorModal.jsx
 * Modal wrapper for Table App Generator
 */

import React, { useState } from 'react';
import { X, Wand2, Table } from 'lucide-react';
import TableAppGenerator from './TableAppGenerator';

export default function TableAppGeneratorModal({
  isOpen,
  onClose,
  table
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        width: '95%',
        maxWidth: '900px',
        height: '85vh',
        backgroundColor: 'white',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wand2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Table App Generator</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Generate app screens from table schema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '12px',
              padding: '8px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Generator Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TableAppGenerator
            table={table}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
