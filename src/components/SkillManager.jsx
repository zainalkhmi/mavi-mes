import React, { useState, useEffect, useMemo } from 'react';
import {
    Award, Users, Plus, Trash2, Edit3, ArrowLeft, ArrowRight, Check, X,
    Search, Filter, ChevronLeft, ChevronRight, RotateCcw, Sparkles, CheckCircle2,
    Database, Layers, User, Cpu, ShieldCheck, HelpCircle, Menu
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getTables, createTable, getTableRecords, addTableRecord, updateTableRecord, deleteTableRecord } from '../utils/database';

// ── Default Skills Definitions ──
const INITIAL_SKILLS = [
    { id: 'SKILL-001', skill: 'Cylinder Assembly', description: 'Assembling the cylinder component with precision torque tolerances.', context_type: 'Product', context: 'MAT001', status: 'ACTIVE' },
    { id: 'SKILL-002', skill: 'Main Assembly', description: 'Assembling the main product enclosure and internal harness.', context_type: 'Product', context: 'MAT001', status: 'ACTIVE' },
    { id: 'SKILL-003', skill: 'Test skill for station', description: 'Operating testing sequence on terminal station.', context_type: 'Station', context: 'Training terminal', status: 'ACTIVE' },
    { id: 'SKILL-004', skill: 'Test for product', description: 'Final functional test on MAT001 units.', context_type: 'Product', context: 'MAT001', status: 'ACTIVE' },
    { id: 'SKILL-005', skill: 'Test skill 2', description: 'Station setup and calibration procedure.', context_type: 'Station', context: 'Sample Station', status: 'ACTIVE' },
    { id: 'SKILL-006', skill: 'Assembly', description: 'General mechanical sub-assembly process.', context_type: 'Product', context: 'MAT001', status: 'ACTIVE' },
    { id: 'SKILL-007', skill: 'Assembly MAT001', description: 'Standard operating procedure for MAT001 assembly.', context_type: 'Product', context: 'MAT001', status: 'ACTIVE' }
];

// ── Default Operators ──
const INITIAL_OPERATORS = [
    { id: 'OP-001', name: 'Albert Harris', avatar: 'AH', color: '#2563eb' },
    { id: 'OP-002', name: 'Andrew Banta', avatar: 'AB', color: '#0891b2' },
    { id: 'OP-003', name: 'Ethan Carter', avatar: 'EC', color: '#059669' },
    { id: 'OP-004', name: 'Jackson Price', avatar: 'JP', color: '#d97706' },
    { id: 'OP-005', name: 'Kevin McGee', avatar: 'KM', color: '#7c3aed' },
    { id: 'OP-006', name: 'Lakeisha Himes', avatar: 'LH', color: '#ea580c' },
    { id: 'OP-007', name: 'Larry Foster', avatar: 'LF', color: '#6366f1' },
    { id: 'OP-008', name: 'Lucas Hayes', avatar: 'LH', color: '#0284c7' },
    { id: 'OP-009', name: 'Mia Sullivan', avatar: 'MS', color: '#db2777' },
    { id: 'OP-010', name: 'Olivia Anderson', avatar: 'OA', color: '#10b981' },
    { id: 'OP-011', name: 'John Smith', avatar: 'JS', color: '#4f46e5' },
    { id: 'OP-012', name: 'mark freedman', avatar: 'MF', color: '#dc2626' },
    { id: 'OP-013', name: 'Judith Powell', avatar: 'JP', color: '#0d9488' }
];

// ── Default Seed Matrix Records (Matching Tulip Support Reference) ──
const INITIAL_MATRIX = [
    { id: 'MATX-001', user: 'Albert Harris', skill_name: 'Assembly', skill_id: 'SKILL-006', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-002', user: 'Andrew Banta', skill_name: 'Test skill 2', skill_id: 'SKILL-005', context: 'Sample Station', level: 'Beginner' },
    { id: 'MATX-003', user: 'Ethan Carter', skill_name: 'Assembly', skill_id: 'SKILL-006', context: 'MAT001', level: 'Intermediate' },
    { id: 'MATX-004', user: 'Ethan Carter', skill_name: 'Cylinder Assembly', skill_id: 'SKILL-001', context: 'MAT001', level: 'Advanced' },
    { id: 'MATX-005', user: 'Ethan Carter', skill_name: 'Main Assembly', skill_id: 'SKILL-002', context: 'MAT001', level: 'Intermediate' },
    { id: 'MATX-006', user: 'Jackson Price', skill_name: 'Assembly MAT001', skill_id: 'SKILL-007', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-007', user: 'Kevin McGee', skill_name: 'Cylinder Assembly', skill_id: 'SKILL-001', context: 'MAT001', level: 'Intermediate' },
    { id: 'MATX-008', user: 'Kevin McGee', skill_name: 'Main Assembly', skill_id: 'SKILL-002', context: 'MAT001', level: 'Expert' },
    { id: 'MATX-009', user: 'Kevin McGee', skill_name: 'Test skill 2', skill_id: 'SKILL-005', context: 'Sample Station', level: 'Beginner' },
    { id: 'MATX-010', user: 'Lakeisha Himes', skill_name: 'Assembly', skill_id: 'SKILL-006', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-011', user: 'Larry Foster', skill_name: 'Cylinder Assembly', skill_id: 'SKILL-001', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-012', user: 'Larry Foster', skill_name: 'Main Assembly', skill_id: 'SKILL-002', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-013', user: 'Lucas Hayes', skill_name: 'Assembly MAT001', skill_id: 'SKILL-007', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-014', user: 'Mia Sullivan', skill_name: 'Assembly MAT001', skill_id: 'SKILL-007', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-015', user: 'Olivia Anderson', skill_name: 'Cylinder Assembly', skill_id: 'SKILL-001', context: 'MAT001', level: 'Beginner' },
    { id: 'MATX-016', user: 'Olivia Anderson', skill_name: 'Main Assembly', skill_id: 'SKILL-002', context: 'MAT001', level: 'Intermediate' }
];

const SKILL_LEVEL_COLORS = {
    'Beginner': { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', label: 'Beginner' },
    'Intermediate': { bg: '#ede9fe', border: '#c4b5fd', text: '#6d28d9', label: 'Intermediate' },
    'Advanced': { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', label: 'Advanced' },
    'Expert': { bg: '#fae8ff', border: '#f0abfc', text: '#a21caf', label: 'Expert' }
};

export default function SkillManager() {
    // Current Active Screen: 'matrix' | 'skills' | 'generate'
    const [currentScreen, setCurrentScreen] = useState('matrix');

    // Database Tables State
    const [skillsTableId, setSkillsTableId] = useState(null);
    const [matrixTableId, setMatrixTableId] = useState(null);
    const [skillsList, setSkillsList] = useState(INITIAL_SKILLS);
    const [matrixList, setMatrixList] = useState(INITIAL_MATRIX);
    const [operatorsList] = useState(INITIAL_OPERATORS);

    // ── Screen 1 State (View Skill Matrix) ──
    const [filterGroup, setFilterGroup] = useState('ALL');
    const [filterSkill, setFilterSkill] = useState('ALL');
    const [filterLevel, setFilterLevel] = useState('ALL');
    const [selectedCell, setSelectedCell] = useState(null); // { user, skillName, context, record }

    // ── Screen 2 State (View Skills) ──
    const [selectedSkillRow, setSelectedSkillRow] = useState(null);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [skillForm, setSkillForm] = useState({
        skill: '',
        description: '',
        context_type: 'Product',
        context: '',
        status: 'ACTIVE'
    });

    // ── Screen 3 State (Generate Skill Matrix) ──
    const [genSkillSearch, setGenSkillSearch] = useState('');
    const [genSelectedSkillId, setGenSelectedSkillId] = useState('');
    const [genSelectedOpId, setGenSelectedOpId] = useState('');
    const [stagedSkills, setStagedSkills] = useState([]); // Selected Skills in center
    const [stagedOperators, setStagedOperators] = useState([]); // Selected Operators in center
    const [stagedSkillsSelection, setStagedSkillsSelection] = useState('');
    const [stagedOpsSelection, setStagedOpsSelection] = useState('');
    const [opPage, setOpPage] = useState(1);
    const opPageSize = 8;

    // ── 1. Load / Synchronize Tables with Supabase / Local DB ──
    useEffect(() => {
        const initDatabase = async () => {
            try {
                const tables = await getTables();
                
                // 1. Skills_Definitions Table
                let sTable = tables.find(t => t.name === 'Skills_Definitions');
                if (!sTable) {
                    sTable = await createTable({
                        name: 'Skills_Definitions',
                        description: 'Stores skill definitions with name, description, context, and status.',
                        fields: [
                            { name: 'skill', type: 'text' },
                            { name: 'description', type: 'text' },
                            { name: 'context_type', type: 'text' },
                            { name: 'context', type: 'text' },
                            { name: 'status', type: 'text' }
                        ]
                    });
                    for (const s of INITIAL_SKILLS) {
                        await addTableRecord({ tableId: sTable.id, fields: s });
                    }
                }
                setSkillsTableId(sTable.id);

                // 2. Skill_Matrix Table
                let mTable = tables.find(t => t.name === 'Skill_Matrix');
                if (!mTable) {
                    mTable = await createTable({
                        name: 'Skill_Matrix',
                        description: 'Stores operator skills and proficiency levels.',
                        fields: [
                            { name: 'user', type: 'text' },
                            { name: 'skill_name', type: 'text' },
                            { name: 'skill_id', type: 'text' },
                            { name: 'context', type: 'text' },
                            { name: 'level', type: 'text' }
                        ]
                    });
                    for (const m of INITIAL_MATRIX) {
                        await addTableRecord({ tableId: mTable.id, fields: m });
                    }
                }
                setMatrixTableId(mTable.id);

                // Fetch Records
                const sRecords = await getTableRecords(sTable.id);
                if (sRecords && sRecords.length > 0) {
                    setSkillsList(sRecords.map(r => ({ id: r.recordId || r.id, ...(r.data || r) })));
                }

                const mRecords = await getTableRecords(mTable.id);
                if (mRecords && mRecords.length > 0) {
                    setMatrixList(mRecords.map(r => ({ id: r.recordId || r.id, ...(r.data || r) })));
                }
            } catch (err) {
                console.warn('Using in-memory skill manager database:', err);
            }
        };

        initDatabase();
    }, []);

    // ── Context Groups List ──
    const contextGroups = useMemo(() => {
        const set = new Set(skillsList.map(s => s.context).filter(Boolean));
        return Array.from(set);
    }, [skillsList]);

    // ── Filtered Skills for Matrix Columns ──
    const matrixSkills = useMemo(() => {
        let list = skillsList.filter(s => s.status !== 'ARCHIVED');
        if (filterGroup !== 'ALL') {
            list = list.filter(s => s.context === filterGroup);
        }
        if (filterSkill !== 'ALL') {
            list = list.filter(s => s.skill === filterSkill);
        }
        return list;
    }, [skillsList, filterGroup, filterSkill]);

    // ── Grouped Matrix Skills by Context ──
    const groupedMatrixColumns = useMemo(() => {
        const groups = {};
        matrixSkills.forEach(s => {
            const ctx = s.context || 'General';
            if (!groups[ctx]) groups[ctx] = [];
            groups[ctx].push(s);
        });
        return groups;
    }, [matrixSkills]);

    // ── Filtered Operators List ──
    const filteredOperators = useMemo(() => {
        if (filterLevel === 'ALL') return operatorsList;
        // Filter operators who possess at least one skill with filterLevel
        return operatorsList.filter(op => 
            matrixList.some(m => m.user === op.name && m.level === filterLevel)
        );
    }, [operatorsList, matrixList, filterLevel]);

    // ── 2. Handle Level Change in Selected Skill Record ──
    const handleUpdateLevel = async (newLevel) => {
        if (!selectedCell) return;
        const { user, skillName, context, record } = selectedCell;

        try {
            if (record) {
                // Update existing record
                const updatedList = matrixList.map(m => m.id === record.id ? { ...m, level: newLevel } : m);
                setMatrixList(updatedList);
                setSelectedCell(prev => ({ ...prev, record: { ...prev.record, level: newLevel } }));

                if (matrixTableId) {
                    await updateTableRecord(matrixTableId, record.id, { ...record, level: newLevel });
                }
            } else {
                // Create new matrix record for this cell
                const matchedSkill = skillsList.find(s => s.skill === skillName && s.context === context);
                const newRec = {
                    id: `MATX-${Date.now()}`,
                    user,
                    skill_name: skillName,
                    skill_id: matchedSkill?.id || `SKILL-${Date.now()}`,
                    context,
                    level: newLevel
                };
                setMatrixList(prev => [...prev, newRec]);
                setSelectedCell(prev => ({ ...prev, record: newRec }));

                if (matrixTableId) {
                    await addTableRecord({ tableId: matrixTableId, fields: newRec });
                }
            }
            toast.success(`Skill level updated: ${user} → ${newLevel}`);
        } catch (err) {
            console.error('Failed to update skill level:', err);
            toast.error('Failed to update level');
        }
    };

    // ── 3. Handle Add / Edit Skill Definition ──
    const handleSaveSkill = async () => {
        if (!skillForm.skill.trim()) {
            toast.error('Skill name is required');
            return;
        }

        try {
            if (editingSkill) {
                // Update
                const updated = skillsList.map(s => s.id === editingSkill.id ? { ...s, ...skillForm } : s);
                setSkillsList(updated);
                if (skillsTableId) {
                    await updateTableRecord(skillsTableId, editingSkill.id, skillForm);
                }
                toast.success('Skill definition updated');
            } else {
                // Create
                const newSkill = {
                    id: `SKILL-${Date.now().toString().slice(-4)}`,
                    ...skillForm
                };
                setSkillsList(prev => [...prev, newSkill]);
                if (skillsTableId) {
                    await addTableRecord({ tableId: skillsTableId, fields: newSkill });
                }
                toast.success('New skill definition added');
            }
            setIsSkillModalOpen(false);
            setEditingSkill(null);
            setSkillForm({ skill: '', description: '', context_type: 'Product', context: '', status: 'ACTIVE' });
        } catch (err) {
            console.error('Failed to save skill:', err);
            toast.error('Failed to save skill');
        }
    };

    // ── 4. Archive Skill Definition ──
    const handleArchiveSkill = async (skillDef) => {
        if (!window.confirm(`Archive skill "${skillDef.skill}"?`)) return;

        try {
            const updated = skillsList.map(s => s.id === skillDef.id ? { ...s, status: 'ARCHIVED' } : s);
            setSkillsList(updated);
            if (skillsTableId) {
                await updateTableRecord(skillsTableId, skillDef.id, { ...skillDef, status: 'ARCHIVED' });
            }
            setSelectedSkillRow(null);
            toast.success(`Skill "${skillDef.skill}" archived`);
        } catch (err) {
            toast.error('Failed to archive skill');
        }
    };

    // ── 5. Generate Skill Matrix Records (Screen 3) ──
    const handleGenerateMatrix = async () => {
        if (stagedSkills.length === 0 || stagedOperators.length === 0) {
            toast.error('Please add at least 1 skill and 1 operator to the selection lists.');
            return;
        }

        let addedCount = 0;
        const newRecords = [...matrixList];

        for (const op of stagedOperators) {
            for (const sk of stagedSkills) {
                const exists = newRecords.find(m => m.user === op.name && m.skill_name === sk.skill && m.context === sk.context);
                if (!exists) {
                    const record = {
                        id: `MATX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        user: op.name,
                        skill_name: sk.skill,
                        skill_id: sk.id,
                        context: sk.context,
                        level: 'Beginner'
                    };
                    newRecords.push(record);
                    addedCount++;
                    if (matrixTableId) {
                        addTableRecord({ tableId: matrixTableId, fields: record }).catch(console.error);
                    }
                }
            }
        }

        setMatrixList(newRecords);
        toast.success(`✨ Generated ${addedCount} new skill matrix records!`);
        setCurrentScreen('matrix');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' }}>
            <Toaster position="top-right" />

            {/* ── TOP HEADER (Tulip Style) ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', minHeight: '60px', flexShrink: 0 }}>
                {/* Left Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
                        ❖
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, fontStyle: 'italic', color: '#0f172a', letterSpacing: '-0.02em' }}>
                        {currentScreen === 'matrix' && 'View Skill Matrix'}
                        {currentScreen === 'skills' && 'View skills'}
                        {currentScreen === 'generate' && 'Generate skill matrix'}
                    </div>
                </div>

                {/* Right Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', cursor: 'pointer' }}>
                        <Menu size={18} /> Menu
                    </button>
                    <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                        <div style={{ fontStyle: 'italic', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Station Name</div>
                        <div style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#64748b' }}>Logged-in User - Name</div>
                    </div>
                </div>
            </div>

            {/* ── SCREEN 1: VIEW SKILL MATRIX ── */}
            {currentScreen === 'matrix' && (
                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                    {/* Left & Matrix Main Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '20px 24px', borderRight: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        
                        {/* Filter Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => { setFilterGroup('ALL'); setFilterSkill('ALL'); setFilterLevel('ALL'); }}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Clear filters
                            </button>

                            {/* Groups Filter */}
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                    style={{ padding: '8px 32px 8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                                >
                                    <option value="ALL">Groups (All)</option>
                                    {contextGroups.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.7rem' }}>▼</span>
                            </div>

                            {/* Skills Filter */}
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={filterSkill}
                                    onChange={(e) => setFilterSkill(e.target.value)}
                                    style={{ padding: '8px 32px 8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                                >
                                    <option value="ALL">Skills (All)</option>
                                    {skillsList.map(s => (
                                        <option key={s.id} value={s.skill}>{s.skill}</option>
                                    ))}
                                </select>
                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.7rem' }}>▼</span>
                            </div>

                            {/* Levels Filter */}
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                    style={{ padding: '8px 32px 8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                                >
                                    <option value="ALL">Levels (All)</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.7rem' }}>▼</span>
                            </div>
                        </div>

                        {/* Interactive Skill Matrix Table */}
                        <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'auto', backgroundColor: 'white', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.02)' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '700px' }}>
                                <thead>
                                    {/* 1st Header Row: Context Groups */}
                                    <tr>
                                        <th 
                                            rowSpan={2} 
                                            style={{ 
                                                width: '180px', 
                                                minWidth: '180px', 
                                                borderRight: '1px solid #cbd5e1', 
                                                borderBottom: '1px solid #cbd5e1', 
                                                backgroundColor: '#fafafa', 
                                                padding: '16px', 
                                                textAlign: 'center', 
                                                fontSize: '0.95rem', 
                                                fontWeight: 800, 
                                                color: '#0f172a' 
                                            }}
                                        >
                                            Name
                                        </th>
                                        {Object.entries(groupedMatrixColumns).map(([ctxName, skillsInGroup]) => (
                                            <th
                                                key={ctxName}
                                                colSpan={skillsInGroup.length}
                                                style={{
                                                    borderRight: '1px solid #cbd5e1',
                                                    borderBottom: '1px solid #cbd5e1',
                                                    backgroundColor: '#fafafa',
                                                    padding: '10px 12px',
                                                    textAlign: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {ctxName}
                                            </th>
                                        ))}
                                    </tr>

                                    {/* 2nd Header Row: Vertical Skill Names */}
                                    <tr>
                                        {matrixSkills.map(sk => (
                                            <th
                                                key={sk.id}
                                                style={{
                                                    width: '56px',
                                                    minWidth: '56px',
                                                    maxWidth: '64px',
                                                    height: '140px',
                                                    borderRight: '1px solid #cbd5e1',
                                                    borderBottom: '1px solid #cbd5e1',
                                                    backgroundColor: '#ffffff',
                                                    padding: '8px 4px',
                                                    verticalAlign: 'bottom',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{
                                                    writingMode: 'vertical-rl',
                                                    transform: 'rotate(180deg)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    whiteSpace: 'nowrap',
                                                    margin: '0 auto',
                                                    padding: '4px 0',
                                                    lineHeight: 1.2
                                                }}>
                                                    {sk.skill} <span style={{ color: '#64748b', fontWeight: 600 }}>//{sk.context}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredOperators.map(op => (
                                        <tr key={op.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            {/* Operator Name Row Header */}
                                            <td style={{
                                                padding: '12px 16px',
                                                borderRight: '1px solid #cbd5e1',
                                                backgroundColor: '#fafafa',
                                                fontWeight: 800,
                                                fontSize: '0.88rem',
                                                color: '#0f172a'
                                            }}>
                                                {op.name}
                                            </td>

                                            {/* Skill Cells */}
                                            {matrixSkills.map(sk => {
                                                const record = matrixList.find(m => m.user === op.name && m.skill_name === sk.skill && m.context === sk.context);
                                                const isSelected = selectedCell?.user === op.name && selectedCell?.skillName === sk.skill && selectedCell?.context === sk.context;
                                                const level = record?.level;
                                                const badgeStyle = level ? (SKILL_LEVEL_COLORS[level] || SKILL_LEVEL_COLORS.Beginner) : null;

                                                return (
                                                    <td
                                                        key={sk.id}
                                                        onClick={() => setSelectedCell({
                                                            user: op.name,
                                                            skillName: sk.skill,
                                                            context: sk.context,
                                                            record: record || null
                                                        })}
                                                        style={{
                                                            borderRight: '1px solid #cbd5e1',
                                                            textAlign: 'center',
                                                            verticalAlign: 'middle',
                                                            cursor: 'pointer',
                                                            backgroundColor: isSelected ? '#eff6ff' : (level ? badgeStyle.bg : 'white'),
                                                            outline: isSelected ? '2px solid #2563eb' : 'none',
                                                            transition: 'all 0.15s',
                                                            padding: '4px'
                                                        }}
                                                    >
                                                        {level && (
                                                            <span style={{
                                                                fontSize: '0.64rem',
                                                                fontWeight: 700,
                                                                color: badgeStyle.text,
                                                                display: 'inline-block',
                                                                padding: '2px 4px',
                                                                borderRadius: '4px',
                                                                backgroundColor: badgeStyle.bg,
                                                                border: `1px solid ${badgeStyle.border}`
                                                            }}>
                                                                {level}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Side Panel: Selected Skill Record */}
                    <div style={{ width: '340px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Selected Skill Record</div>
                            {selectedCell && (
                                <button
                                    onClick={() => setSelectedCell(null)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                    <X size={16} /> Clear
                                </button>
                            )}
                        </div>

                        {/* Level Dropdown */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Level</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedCell?.record?.level || ''}
                                    onChange={(e) => handleUpdateLevel(e.target.value)}
                                    disabled={!selectedCell}
                                    style={{
                                        width: '100%',
                                        padding: '12px 36px 12px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: selectedCell ? 'white' : '#f8fafc',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: selectedCell?.record?.level ? '#0f172a' : '#64748b',
                                        outline: 'none',
                                        cursor: selectedCell ? 'pointer' : 'not-allowed',
                                        appearance: 'none'
                                    }}
                                >
                                    <option value="" disabled>Select an option</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>▼</span>
                            </div>
                        </div>

                        {/* User Display */}
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>User</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedCell ? '#0f172a' : '#94a3b8' }}>
                                {selectedCell?.user || 'User'}
                            </div>
                        </div>

                        {/* Skill Name Display */}
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Skill Name</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedCell ? '#0f172a' : '#94a3b8' }}>
                                {selectedCell?.skillName || 'Skill Name'}
                            </div>
                        </div>

                        {/* Context Display */}
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Context</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedCell ? '#0f172a' : '#94a3b8' }}>
                                {selectedCell?.context || 'Context'}
                            </div>
                        </div>

                        {!selectedCell && (
                            <div style={{ marginTop: 'auto', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                                💡 <strong>Tip:</strong> Click on any cell in the matrix grid to view details and update the operator's skill level.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── SCREEN 2: VIEW SKILLS / MANAGE SKILLS ── */}
            {currentScreen === 'skills' && (
                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                    {/* Skills List Table */}
                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', minWidth: 0, overflowY: 'auto' }}>
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'white' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #cbd5e1' }}>
                                        <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Skill</th>
                                        <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Description</th>
                                        <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Context</th>
                                        <th style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Context Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skillsList.filter(s => s.status !== 'ARCHIVED').map(s => {
                                        const isSelected = selectedSkillRow?.id === s.id;
                                        return (
                                            <tr
                                                key={s.id}
                                                onClick={() => setSelectedSkillRow(s)}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9',
                                                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.15s'
                                                }}
                                            >
                                                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{s.skill}</td>
                                                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</td>
                                                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{s.context}</td>
                                                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>{s.context_type}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Side Panel: Skill Details & Archive */}
                    <div style={{ width: '340px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>ID</div>
                            {selectedSkillRow && (
                                <button
                                    onClick={() => setSelectedSkillRow(null)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                    <X size={16} /> Clear
                                </button>
                            )}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedSkillRow ? '#0f172a' : '#94a3b8' }}>
                            {selectedSkillRow?.id || 'ID'}
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Skill</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedSkillRow ? '#0f172a' : '#94a3b8' }}>
                                {selectedSkillRow?.skill || 'Skill'}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Context</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedSkillRow ? '#0f172a' : '#94a3b8' }}>
                                {selectedSkillRow?.context || 'Context'}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Context Type</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', color: selectedSkillRow ? '#0f172a' : '#94a3b8' }}>
                                {selectedSkillRow?.context_type || 'Context Type'}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Description</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontStyle: 'italic', color: selectedSkillRow ? '#0f172a' : '#94a3b8', lineHeight: 1.4 }}>
                                {selectedSkillRow?.description || 'Description'}
                            </div>
                        </div>

                        {selectedSkillRow && (
                            <button
                                onClick={() => handleArchiveSkill(selectedSkillRow)}
                                style={{
                                    marginTop: 'auto',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Trash2 size={16} /> Archive skill
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── SCREEN 3: GENERATE SKILL MATRIX ── */}
            {currentScreen === 'generate' && (
                <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '20px', minHeight: 0, overflow: 'hidden' }}>
                    
                    {/* Left: Available Skills Selection */}
                    <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '0 0 16px 0' }}>Skills</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Skill Filter</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    value={genSkillSearch}
                                    onChange={(e) => setGenSkillSearch(e.target.value)}
                                    placeholder="Filter skill..."
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                                />
                                {genSkillSearch && (
                                    <button onClick={() => setGenSkillSearch('')} style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                                        <X size={14} /> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Skills List Table with Radio Selection */}
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', overflowY: 'auto', marginBottom: '16px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '8px 12px', width: '30px' }}></th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Skill</th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>Context</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skillsList
                                        .filter(s => s.status !== 'ARCHIVED' && s.skill.toLowerCase().includes(genSkillSearch.toLowerCase()))
                                        .map(s => (
                                            <tr
                                                key={s.id}
                                                onClick={() => setGenSelectedSkillId(s.id)}
                                                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: genSelectedSkillId === s.id ? '#eff6ff' : 'transparent' }}
                                            >
                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        checked={genSelectedSkillId === s.id}
                                                        onChange={() => setGenSelectedSkillId(s.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{s.skill}</td>
                                                <td style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#64748b' }}>{s.context}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => {
                                const sk = skillsList.find(s => s.id === genSelectedSkillId);
                                if (sk && !stagedSkills.some(s => s.id === sk.id)) {
                                    setStagedSkills(prev => [...prev, sk]);
                                }
                            }}
                            disabled={!genSelectedSkillId}
                            style={{
                                padding: '10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: genSelectedSkillId ? '#15803d' : '#94a3b8',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: genSelectedSkillId ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    {/* Center: Selected Skills (Top) & Selected Operators (Bottom) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Top: Selected Skills */}
                        <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                                <ArrowRight size={20} color="#2563eb" />
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Selected Skills</h4>
                            </div>

                            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', overflowY: 'auto', marginBottom: '12px' }}>
                                {stagedSkills.length === 0 ? (
                                    <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.9rem', padding: '8px' }}>
                                        Variable Option 1<br/>Variable Option 2<br/>Variable Option 3<br/>...
                                    </div>
                                ) : (
                                    stagedSkills.map(sk => (
                                        <div
                                            key={sk.id}
                                            onClick={() => setStagedSkillsSelection(sk.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '4px', backgroundColor: stagedSkillsSelection === sk.id ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                                        >
                                            <input type="radio" checked={stagedSkillsSelection === sk.id} onChange={() => setStagedSkillsSelection(sk.id)} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, fontStyle: 'italic', color: '#0f172a' }}>{sk.skill} ({sk.context})</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setStagedSkills(prev => prev.filter(s => s.id !== stagedSkillsSelection));
                                    setStagedSkillsSelection('');
                                }}
                                disabled={!stagedSkillsSelection}
                                style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: stagedSkillsSelection ? '#dc2626' : '#fca5a5',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: stagedSkillsSelection ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                — Remove
                            </button>
                        </div>

                        {/* Bottom: Selected Operators */}
                        <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                                <ArrowLeft size={20} color="#2563eb" />
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Selected Operators</h4>
                            </div>

                            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', overflowY: 'auto', marginBottom: '12px' }}>
                                {stagedOperators.length === 0 ? (
                                    <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.9rem', padding: '8px' }}>
                                        Variable Option 1<br/>Variable Option 2<br/>Variable Option 3<br/>...
                                    </div>
                                ) : (
                                    stagedOperators.map(op => (
                                        <div
                                            key={op.id}
                                            onClick={() => setStagedOpsSelection(op.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '4px', backgroundColor: stagedOpsSelection === op.id ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                                        >
                                            <input type="radio" checked={stagedOpsSelection === op.id} onChange={() => setStagedOpsSelection(op.id)} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, fontStyle: 'italic', color: '#0f172a' }}>{op.name}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setStagedOperators(prev => prev.filter(o => o.id !== stagedOpsSelection));
                                    setStagedOpsSelection('');
                                }}
                                disabled={!stagedOpsSelection}
                                style={{
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: stagedOpsSelection ? '#dc2626' : '#fca5a5',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: stagedOpsSelection ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                — Remove
                            </button>
                        </div>
                    </div>

                    {/* Right: Available Operators Selection */}
                    <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '0 0 16px 0' }}>Operators</h3>

                        {/* Operators Table */}
                        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', overflowY: 'auto', marginBottom: '16px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '8px 12px', width: '30px' }}></th>
                                        <th style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operatorsList
                                        .slice((opPage - 1) * opPageSize, opPage * opPageSize)
                                        .map(op => (
                                            <tr
                                                key={op.id}
                                                onClick={() => setGenSelectedOpId(op.id)}
                                                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: genSelectedOpId === op.id ? '#eff6ff' : 'transparent' }}
                                            >
                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                    <input
                                                        type="radio"
                                                        checked={genSelectedOpId === op.id}
                                                        onChange={() => setGenSelectedOpId(op.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: op.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800 }}>
                                                            {op.avatar}
                                                        </div>
                                                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{op.name}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Numbers */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
                            {[1, 2].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setOpPage(p)}
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: opPage === p ? '#eff6ff' : 'white',
                                        color: opPage === p ? '#2563eb' : '#64748b',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const op = operatorsList.find(o => o.id === genSelectedOpId);
                                if (op && !stagedOperators.some(o => o.id === op.id)) {
                                    setStagedOperators(prev => [...prev, op]);
                                }
                            }}
                            disabled={!genSelectedOpId}
                            style={{
                                padding: '10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: genSelectedOpId ? '#15803d' : '#94a3b8',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: genSelectedOpId ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>
            )}

            {/* ── BOTTOM NAVIGATION BAR ── */}
            <div style={{ display: 'flex', alignItems: 'stretch', height: '56px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                {currentScreen === 'matrix' ? (
                    <>
                        {/* Manage Skills Button (Left) */}
                        <button
                            onClick={() => setCurrentScreen('skills')}
                            style={{
                                flex: '0 0 220px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Layers size={18} /> Manage Skills
                        </button>

                        <div style={{ flex: 1 }} />

                        {/* Generate Skill Matrix Button (Right) */}
                        <button
                            onClick={() => setCurrentScreen('generate')}
                            style={{
                                flex: '0 0 240px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Sparkles size={18} /> Generate Skill Matrix
                        </button>
                    </>
                ) : currentScreen === 'skills' ? (
                    <>
                        {/* Previous Button (Left) */}
                        <button
                            onClick={() => setCurrentScreen('matrix')}
                            style={{
                                flex: '0 0 160px',
                                border: 'none',
                                background: 'none',
                                color: '#2563eb',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <ArrowLeft size={18} /> Previous
                        </button>

                        <div style={{ flex: 1 }} />

                        {/* Add/Edit Skill Button (Right) */}
                        <button
                            onClick={() => {
                                if (selectedSkillRow) {
                                    setEditingSkill(selectedSkillRow);
                                    setSkillForm(selectedSkillRow);
                                } else {
                                    setEditingSkill(null);
                                    setSkillForm({ skill: '', description: '', context_type: 'Product', context: '', status: 'ACTIVE' });
                                }
                                setIsSkillModalOpen(true);
                            }}
                            style={{
                                flex: '0 0 220px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Edit3 size={18} /> {selectedSkillRow ? 'Edit skill' : 'Add/Edit skill'}
                        </button>
                    </>
                ) : (
                    <>
                        {/* Previous Button (Left) */}
                        <button
                            onClick={() => setCurrentScreen('matrix')}
                            style={{
                                flex: '0 0 160px',
                                border: 'none',
                                background: 'none',
                                color: '#2563eb',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <ArrowLeft size={18} /> Previous
                        </button>

                        {/* Generate Button (Center) */}
                        <button
                            onClick={handleGenerateMatrix}
                            style={{
                                flex: '0 0 340px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Sparkles size={18} /> Generate
                        </button>

                        <div style={{ flex: 1 }} />
                    </>
                )}
            </div>

            {/* ── ADD / EDIT SKILL MODAL ── */}
            {isSkillModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ width: '480px', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                                {editingSkill ? 'Edit Skill Definition' : 'Add New Skill Definition'}
                            </div>
                            <button onClick={() => setIsSkillModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Skill Name</label>
                                <input
                                    value={skillForm.skill}
                                    onChange={(e) => setSkillForm(prev => ({ ...prev, skill: e.target.value }))}
                                    placeholder="e.g. Cylinder Assembly"
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Description</label>
                                <textarea
                                    value={skillForm.description}
                                    onChange={(e) => setSkillForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description of the skill requirements..."
                                    rows={3}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Context Type</label>
                                    <select
                                        value={skillForm.context_type}
                                        onChange={(e) => setSkillForm(prev => ({ ...prev, context_type: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    >
                                        <option value="Product">Product</option>
                                        <option value="Station">Station</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Context (ID / Code)</label>
                                    <input
                                        value={skillForm.context}
                                        onChange={(e) => setSkillForm(prev => ({ ...prev, context: e.target.value }))}
                                        placeholder="e.g. MAT001, Station 1"
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                            <button
                                onClick={() => setIsSkillModalOpen(false)}
                                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSkill}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Save Skill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
