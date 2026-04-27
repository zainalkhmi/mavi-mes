import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, SlidersHorizontal, Settings2, Palette } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ConditionalFormattingPanel = ({ component, updateProps, variables, tables, recordPlaceholders }) => {
    const rules = component.props.conditionalFormattingRules || [];

    const addRule = () => {
        const newRule = {
            id: 'rule_' + Date.now(),
            condition: {
                leftSource: 'VARIABLE',
                leftValue: '',
                operator: '==',
                rightSource: 'STATIC',
                rightValue: ''
            },
            styles: {
                color: '',
                backgroundColor: '',
                fontWeight: 'normal',
                visible: true
            }
        };
        updateProps(component.id, { conditionalFormattingRules: [...rules, newRule] });
    };

    const updateRule = (ruleId, updates) => {
        const newRules = rules.map(r => r.id === ruleId ? { ...r, ...updates } : r);
        updateProps(component.id, { conditionalFormattingRules: newRules });
    };

    const deleteRule = (ruleId) => {
        const newRules = rules.filter(r => r.id !== ruleId);
        updateProps(component.id, { conditionalFormattingRules: newRules });
    };

    const moveRule = (index, direction) => {
        const newRules = [...rules];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < newRules.length) {
            [newRules[index], newRules[newIndex]] = [newRules[newIndex], newRules[index]];
            updateProps(component.id, { conditionalFormattingRules: newRules });
        }
    };

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                    <Palette size={14} /> Conditional Formatting
                </label>
                <button 
                    onClick={addRule}
                    style={{ padding: '4px 8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}
                >
                    <Plus size={12} /> Add Rule
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rules.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-primary)', color: '#94a3b8', fontSize: '0.75rem' }}>
                        No formatting rules yet.
                    </div>
                )}
                
                {rules.map((rule, index) => (
                    <div key={rule.id} style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
                        {/* Rule Header */}
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)' }}>RULE #{index + 1}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => moveRule(index, -1)} disabled={index === 0} style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}><ChevronUp size={14} /></button>
                                <button onClick={() => moveRule(index, 1)} disabled={index === rules.length - 1} style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', cursor: index === rules.length - 1 ? 'default' : 'pointer', opacity: index === rules.length - 1 ? 0.3 : 1 }}><ChevronDown size={14} /></button>
                                <button onClick={() => deleteRule(rule.id)} style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#ef4444', marginLeft: '4px' }}><Trash2 size={14} /></button>
                            </div>
                        </div>

                        {/* Rule Content */}
                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Condition Row */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>IF</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                    <select 
                                        value={rule.condition.leftSource} 
                                        onChange={(e) => updateRule(rule.id, { condition: { ...rule.condition, leftSource: e.target.value } })}
                                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '4px', backgroundColor: 'var(--bg-panel)' }}
                                    >
                                        <option value="VARIABLE">Variable</option>
                                        <option value="RECORD_FIELD">Record Field</option>
                                        <option value="STATIC">Static Value</option>
                                        {component.type === 'INTERACTIVE_TABLE' && <option value="COLUMN_VALUE">This Column</option>}
                                    </select>
                                    <select 
                                        value={rule.condition.operator} 
                                        onChange={(e) => updateRule(rule.id, { condition: { ...rule.condition, operator: e.target.value } })}
                                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '4px', backgroundColor: 'var(--bg-panel)' }}
                                    >
                                        <option value="==">is equal to</option>
                                        <option value="!=">is not equal to</option>
                                        <option value=">">is greater than</option>
                                        <option value="<">is less than</option>
                                        <option value=">=">is greater or equal</option>
                                        <option value="<=">is less or equal</option>
                                        <option value="CONTAINS">contains</option>
                                        <option value="IS_EMPTY">is empty</option>
                                    </select>
                                    <input 
                                        placeholder="Target Value"
                                        value={rule.condition.rightValue} 
                                        onChange={(e) => updateRule(rule.id, { condition: { ...rule.condition, rightValue: e.target.value } })}
                                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '4px' }}
                                    />
                                </div>
                                {rule.condition.leftSource === 'VARIABLE' && (
                                    <select 
                                        value={rule.condition.leftValue} 
                                        onChange={(e) => updateRule(rule.id, { condition: { ...rule.condition, leftValue: e.target.value } })}
                                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '4px', backgroundColor: 'var(--bg-panel)' }}
                                    >
                                        <option value="">Select Variable...</option>
                                        {variables.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                )}
                                {rule.condition.leftSource === 'RECORD_FIELD' && (
                                    <input 
                                        placeholder="PlaceholderName.FieldName"
                                        value={rule.condition.leftValue} 
                                        onChange={(e) => updateRule(rule.id, { condition: { ...rule.condition, leftValue: e.target.value } })}
                                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '4px' }}
                                    />
                                )}
                            </div>

                            {/* Styles Row */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
                                <label style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>THEN APPLY STYLE</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Text Color</label>
                                        <ColorPicker value={rule.styles.color} onChange={(val) => updateRule(rule.id, { styles: { ...rule.styles, color: val } })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Background</label>
                                        <ColorPicker value={rule.styles.backgroundColor} onChange={(val) => updateRule(rule.id, { styles: { ...rule.styles, backgroundColor: val } })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input 
                                            type="checkbox" 
                                            id={`bold-${rule.id}`}
                                            checked={rule.styles.fontWeight === 'bold'} 
                                            onChange={(e) => updateRule(rule.id, { styles: { ...rule.styles, fontWeight: e.target.checked ? 'bold' : 'normal' } })} 
                                        />
                                        <label htmlFor={`bold-${rule.id}`} style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Bold</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input 
                                            type="checkbox" 
                                            id={`visible-${rule.id}`}
                                            checked={rule.styles.visible !== false} 
                                            onChange={(e) => updateRule(rule.id, { styles: { ...rule.styles, visible: e.target.checked } })} 
                                        />
                                        <label htmlFor={`visible-${rule.id}`} style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Visible</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConditionalFormattingPanel;
