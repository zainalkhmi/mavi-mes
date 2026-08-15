import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Database, Plus, Trash2, Link2, ArrowRight, Check, X, 
    ZoomIn, ZoomOut, RotateCcw, Sparkles, Search, Key, Link
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const FIELD_TYPE_BADGES = {
    text: { bg: '#f1f5f9', color: '#334155', label: 'TEXT' },
    number: { bg: '#fef3c7', color: '#92400e', label: 'NUM' },
    integer: { bg: '#fef3c7', color: '#92400e', label: 'INT' },
    boolean: { bg: '#dcfce7', color: '#166534', label: 'BOOL' },
    datetime: { bg: '#eff6ff', color: '#1e40af', label: 'DATE' },
    interval: { bg: '#e0e7ff', color: '#3730a3', label: 'TIME' },
    color: { bg: '#f3e8ff', color: '#6b21a8', label: 'COLOR' },
    image: { bg: '#e0f2fe', color: '#075985', label: 'IMG' },
    video: { bg: '#f0fdf4', color: '#166534', label: 'VID' },
    linked_record: { bg: '#ede9fe', color: '#5b21b6', label: 'FK 🔗' },
    user: { bg: '#fae8ff', color: '#86198f', label: 'USER' },
    machine: { bg: '#f5f3ff', color: '#5b21b6', label: 'MACH' },
    station: { bg: '#f0fdfa', color: '#115e59', label: 'STN' },
    formula: { bg: '#fef9c3', color: '#854d0e', label: 'CALC' }
};

export default function TableRelationDiagram({ 
    tables = [], 
    selectedTable = null, 
    onSelectTable = () => {}, 
    onUpdateTable = async () => {},
    onCreateTable = () => {},
    onRefreshTables = async () => {}
}) {
    // Canvas Viewport State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 40, y: 40 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    // Table Positions Map { [tableId]: { x, y } }
    const [tablePositions, setTablePositions] = useState({});
    const [draggingTableId, setDraggingTableId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Interactive Drag-and-Drop Connection State (Field-Level)
    const [connectingFrom, setConnectingFrom] = useState(null); // { table, field, startX, startY }
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredTableId, setHoveredTableId] = useState(null);
    const [hoveredFieldInfo, setHoveredFieldInfo] = useState(null); // { tableId, fieldName }

    // Relationship Modal State
    const [relationModal, setRelationModal] = useState({
        isOpen: false,
        sourceTable: null,
        targetTable: null,
        sourceField: null,
        targetField: null,
        linkType: 'one_to_many',
        sourceFieldName: '',
        reverseFieldName: '',
        isSubmitting: false
    });

    // Selected Relation Line (for viewing/deletion)
    const [selectedRelation, setSelectedRelation] = useState(null);
    const [hoveredRelation, setHoveredRelation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const canvasRef = useRef(null);

    // ── 1. Initialize / Load Layout Coordinates ──
    useEffect(() => {
        const savedRaw = localStorage.getItem('mavi_table_erd_positions');
        let savedPositions = {};
        try {
            if (savedRaw) savedPositions = JSON.parse(savedRaw);
        } catch (e) {}

        const newPositions = { ...savedPositions };
        const cols = 3;
        const colWidth = 340;
        const rowHeight = 320;

        tables.forEach((tbl, idx) => {
            if (!newPositions[tbl.id]) {
                const c = idx % cols;
                const r = Math.floor(idx / cols);
                newPositions[tbl.id] = {
                    x: 60 + c * colWidth,
                    y: 60 + r * rowHeight
                };
            }
        });

        setTablePositions(newPositions);
    }, [tables]);

    const updateTablePos = (id, x, y) => {
        setTablePositions(prev => {
            const next = { ...prev, [id]: { x, y } };
            try {
                localStorage.setItem('mavi_table_erd_positions', JSON.stringify(next));
            } catch (e) {}
            return next;
        });
    };

    const handleAutoLayout = () => {
        const cols = Math.max(2, Math.ceil(Math.sqrt(tables.length)));
        const colWidth = 360;
        const rowHeight = 340;
        const next = {};

        tables.forEach((tbl, idx) => {
            const c = idx % cols;
            const r = Math.floor(idx / cols);
            next[tbl.id] = {
                x: 60 + c * colWidth,
                y: 60 + r * rowHeight
            };
        });

        setTablePositions(next);
        setPan({ x: 40, y: 40 });
        setZoom(1);
        try {
            localStorage.setItem('mavi_table_erd_positions', JSON.stringify(next));
        } catch (e) {}
        toast.success('Auto-layout arranged cleanly!', { position: 'bottom-right' });
    };

    // ── 2. Parse Existing Relations (Field-to-Field Edges) ──
    const relations = useMemo(() => {
        const list = [];
        const seen = new Set();

        tables.forEach(sourceTable => {
            const fields = Array.isArray(sourceTable.fields) ? sourceTable.fields : [];
            fields.forEach((f, fIdx) => {
                if (f.type === 'linked_record' && f.link_table_id) {
                    const targetTable = tables.find(t => t.id === f.link_table_id);
                    if (targetTable) {
                        const targetFields = Array.isArray(targetTable.fields) ? targetTable.fields : [];
                        const targetFieldIdx = targetFields.findIndex(tf => tf.name === f.reverse_link_name || (tf.type === 'linked_record' && tf.link_table_id === sourceTable.id));
                        const targetFieldName = targetFieldIdx !== -1 ? targetFields[targetFieldIdx].name : (f.reverse_link_name || 'id');

                        const edgeKey = `${sourceTable.id}:${f.name}->${targetTable.id}:${targetFieldName}`;
                        const reverseKey = `${targetTable.id}:${targetFieldName}->${sourceTable.id}:${f.name}`;

                        if (!seen.has(edgeKey) && !seen.has(reverseKey)) {
                            seen.add(edgeKey);
                            list.push({
                                id: `${sourceTable.id}_${f.name}_${targetTable.id}_${targetFieldName}`,
                                sourceTableId: sourceTable.id,
                                sourceTableName: sourceTable.name,
                                sourceFieldName: f.name,
                                sourceFieldIdx: fIdx,
                                targetTableId: targetTable.id,
                                targetTableName: targetTable.name,
                                targetFieldName: targetFieldName,
                                targetFieldIdx: targetFieldIdx,
                                linkType: f.link_type || 'one_to_many'
                            });
                        }
                    }
                }
            });
        });

        return list;
    }, [tables]);

    // ── 3. Dragging Table Nodes ──
    const handleMouseDownTable = (e, tableId) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const pos = tablePositions[tableId] || { x: 0, y: 0 };
        setDraggingTableId(tableId);
        setDragOffset({
            x: (e.clientX / zoom) - pos.x,
            y: (e.clientY / zoom) - pos.y
        });
    };

    // ── 4. Drag & Drop Connection from Specific Field ──
    const handleStartConnect = (e, table, field) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        const canvasX = (e.clientX - rect.left - pan.x) / zoom;
        const canvasY = (e.clientY - rect.top - pan.y) / zoom;

        setConnectingFrom({
            table,
            field,
            startX: canvasX,
            startY: canvasY
        });
    };

    const handleCanvasMouseMove = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        const canvasX = (e.clientX - rect.left - pan.x) / zoom;
        const canvasY = (e.clientY - rect.top - pan.y) / zoom;

        setMousePos({ x: canvasX, y: canvasY });

        // Table Node Dragging
        if (draggingTableId) {
            const newX = Math.round((e.clientX / zoom) - dragOffset.x);
            const newY = Math.round((e.clientY / zoom) - dragOffset.y);
            updateTablePos(draggingTableId, Math.max(20, newX), Math.max(20, newY));
        }

        // Canvas Panning
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    };

    const handleCanvasMouseUp = () => {
        // If connecting and dropped on a target table / field
        if (connectingFrom && hoveredTableId && hoveredTableId !== connectingFrom.table.id) {
            const targetTable = tables.find(t => t.id === hoveredTableId);
            if (targetTable) {
                const targetField = hoveredFieldInfo?.tableId === hoveredTableId ? targetTable.fields?.find(f => f.name === hoveredFieldInfo.fieldName) : null;
                openRelationModal(connectingFrom.table, targetTable, connectingFrom.field, targetField);
            }
        }

        setConnectingFrom(null);
        setDraggingTableId(null);
        setIsPanning(false);
    };

    const handleCanvasMouseDown = (e) => {
        if (e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.id === 'erd-canvas-bg') {
            setIsPanning(true);
            setPanStart({
                x: e.clientX - pan.x,
                y: e.clientY - pan.y
            });
            setSelectedRelation(null);
        }
    };

    // ── 5. Open Relation Dialog ──
    const openRelationModal = (sourceTable, targetTable, sourceField = null, targetField = null) => {
        const cleanName = (str) => String(str || '').replace(/[^a-zA-Z0-9_]/g, '_');
        const defaultSourceFieldName = sourceField ? sourceField.name : `Linked_${cleanName(targetTable.name)}`;
        const defaultReverseFieldName = targetField ? targetField.name : `Parent_${cleanName(sourceTable.name)}`;

        setRelationModal({
            isOpen: true,
            sourceTable,
            targetTable,
            sourceField,
            targetField,
            linkType: 'one_to_many',
            sourceFieldName: defaultSourceFieldName,
            reverseFieldName: defaultReverseFieldName,
            isSubmitting: false
        });
    };

    // ── 6. Save Created Relation (Field-Level Linked Records) ──
    const handleSaveRelation = async () => {
        const { sourceTable, targetTable, linkType, sourceFieldName, reverseFieldName } = relationModal;
        if (!sourceTable || !targetTable || !sourceFieldName.trim()) {
            toast.error('Field name is required');
            return;
        }

        setRelationModal(prev => ({ ...prev, isSubmitting: true }));
        try {
            // 1. Add/Update Linked Record field in Source Table
            const sourceFields = Array.isArray(sourceTable.fields) ? [...sourceTable.fields] : [];
            const existingSourceIdx = sourceFields.findIndex(f => f.name.toLowerCase() === sourceFieldName.trim().toLowerCase());
            
            const newSourceField = {
                name: sourceFieldName.trim(),
                type: 'linked_record',
                link_table_id: targetTable.id,
                link_type: linkType,
                reverse_link_name: reverseFieldName.trim() || undefined,
                archived: false
            };

            if (existingSourceIdx !== -1) {
                sourceFields[existingSourceIdx] = newSourceField;
            } else {
                sourceFields.push(newSourceField);
            }

            await onUpdateTable(sourceTable.id, { fields: sourceFields });

            // 2. Add/Update reciprocal Linked Record field in Target Table
            if (reverseFieldName.trim()) {
                const targetFields = Array.isArray(targetTable.fields) ? [...targetTable.fields] : [];
                const existingTargetIdx = targetFields.findIndex(f => f.name.toLowerCase() === reverseFieldName.trim().toLowerCase());
                
                let reverseLinkType = linkType;
                if (linkType === 'one_to_many') reverseLinkType = 'many_to_one';
                else if (linkType === 'many_to_one') reverseLinkType = 'one_to_many';

                const newTargetField = {
                    name: reverseFieldName.trim(),
                    type: 'linked_record',
                    link_table_id: sourceTable.id,
                    link_type: reverseLinkType,
                    reverse_link_name: sourceFieldName.trim(),
                    archived: false,
                    auto_created: true
                };

                if (existingTargetIdx !== -1) {
                    targetFields[existingTargetIdx] = newTargetField;
                } else {
                    targetFields.push(newTargetField);
                }

                await onUpdateTable(targetTable.id, { fields: targetFields });
            }

            await onRefreshTables();
            setRelationModal({ isOpen: false, sourceTable: null, targetTable: null, sourceField: null, targetField: null, linkType: 'one_to_many', sourceFieldName: '', reverseFieldName: '', isSubmitting: false });
            toast.success(`✅ Linked record "${sourceFieldName}" berhasil dihubungkan ke [${targetTable.name}]!`, { position: 'bottom-right' });
        } catch (err) {
            console.error('Failed to create relationship:', err);
            toast.error(`Gagal membuat relasi: ${err.message || 'Error'}`);
        } finally {
            setRelationModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // ── 7. Delete Relation ──
    const handleDeleteRelation = async (rel) => {
        if (!window.confirm(`Hapus linked record field "${rel.sourceFieldName}" pada "${rel.sourceTableName}"?`)) return;

        try {
            const sourceTable = tables.find(t => t.id === rel.sourceTableId);
            if (sourceTable) {
                const nextFields = (sourceTable.fields || []).filter(f => f.name !== rel.sourceFieldName);
                await onUpdateTable(sourceTable.id, { fields: nextFields });
            }

            const targetTable = tables.find(t => t.id === rel.targetTableId);
            if (targetTable && rel.targetFieldName && rel.targetFieldName !== 'id') {
                const nextFields = (targetTable.fields || []).filter(f => f.name !== rel.targetFieldName);
                await onUpdateTable(targetTable.id, { fields: nextFields });
            }

            await onRefreshTables();
            setSelectedRelation(null);
            toast.success('Linked record berhasil dihapus');
        } catch (err) {
            console.error('Failed to delete relation:', err);
            toast.error('Gagal menghapus relasi');
        }
    };

    // ── Helper: Calculate Field-to-Field Curve Path ──
    const calculateFieldCurve = (rel, cardWidth = 260) => {
        const fromPos = tablePositions[rel.sourceTableId];
        const toPos = tablePositions[rel.targetTableId];
        if (!fromPos || !toPos) return null;

        const HEADER_OFFSET = 42;
        const PK_OFFSET = 32;
        const ROW_HEIGHT = 30;

        // Calculate exact Y coordinates for source field row
        const sourceFieldY = fromPos.y + HEADER_OFFSET + PK_OFFSET + (rel.sourceFieldIdx * ROW_HEIGHT) + 15;

        // Calculate exact Y coordinates for target field row (or primary key ID)
        const targetFieldY = rel.targetFieldIdx >= 0 
            ? toPos.y + HEADER_OFFSET + PK_OFFSET + (rel.targetFieldIdx * ROW_HEIGHT) + 15
            : toPos.y + HEADER_OFFSET + 16; // Points to table header/PK

        const isRight = toPos.x >= fromPos.x;
        const startX = isRight ? fromPos.x + cardWidth : fromPos.x;
        const startY = sourceFieldY;

        const endX = isRight ? toPos.x : toPos.x + cardWidth;
        const endY = targetFieldY;

        const dx = Math.abs(endX - startX);
        const curveOffset = Math.max(50, dx * 0.45);

        const cp1x = isRight ? startX + curveOffset : startX - curveOffset;
        const cp1y = startY;
        const cp2x = isRight ? endX - curveOffset : endX + curveOffset;
        const cp2y = endY;

        const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        return { path, startX, startY, endX, endY, midX, midY, isRight };
    };

    const visibleTables = useMemo(() => {
        if (!searchTerm.trim()) return tables;
        const q = searchTerm.toLowerCase();
        return tables.filter(t => t.name.toLowerCase().includes(q) || (t.fields || []).some(f => f.name.toLowerCase().includes(q)));
    }, [tables, searchTerm]);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#f8fafc', userSelect: 'none' }}>
            
            {/* ── ERD Top Toolbar ── */}
            <div style={{ padding: '12px 20px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Link2 size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Relation Diagram (Field-Level Linked Records)</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Tarik garis langsung dari kolom Linked Record ke tabel/field tujuan</div>
                        </div>
                    </div>

                    <div style={{ height: '24px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />

                    {/* Search */}
                    <div style={{ position: 'relative', width: '200px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari tabel / kolom..."
                            style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', backgroundColor: '#f8fafc' }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Toolbar Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '2px', border: '1px solid #e2e8f0' }}>
                        <button 
                            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))} 
                            style={{ border: 'none', background: 'none', padding: '6px', cursor: 'pointer', color: '#475569', borderRadius: '6px' }}
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0 8px', color: '#334155', minWidth: '42px', textAlign: 'center' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(1.8, prev + 0.1))} 
                            style={{ border: 'none', background: 'none', padding: '6px', cursor: 'pointer', color: '#475569', borderRadius: '6px' }}
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    <button 
                        onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }); }} 
                        style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        title="Reset View"
                    >
                        <RotateCcw size={14} /> Reset View
                    </button>

                    <button 
                        onClick={handleAutoLayout} 
                        style={{ padding: '7px 12px', border: '1px solid #c7d2fe', borderRadius: '8px', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Ratakan otomatis posisi semua tabel"
                    >
                        <Sparkles size={14} /> Auto Layout
                    </button>

                    <button 
                        onClick={onCreateTable} 
                        style={{ padding: '7px 14px', border: 'none', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                    >
                        <Plus size={15} /> + Tambah Tabel
                    </button>
                </div>
            </div>

            {/* ── Interactive Grid Canvas ── */}
            <div 
                ref={canvasRef}
                id="erd-canvas-bg"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                style={{
                    flex: 1,
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    cursor: isPanning ? 'grabbing' : (connectingFrom ? 'crosshair' : 'default'),
                    backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
                    backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                    overflow: 'hidden'
                }}
            >
                {/* ── Transformed World Layer ── */}
                <div 
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none'
                    }}
                >
                    {/* ── SVG Relationship Wire Layer (Field-to-Field) ── */}
                    <svg 
                        style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '8000px', 
                            height: '8000px', 
                            overflow: 'visible',
                            pointerEvents: 'none'
                        }}
                    >
                        <defs>
                            {/* Directional Arrow marker */}
                            <marker id="erd-field-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7c3aed" />
                            </marker>
                            <marker id="erd-field-arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                                <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
                            </marker>
                            <filter id="field-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#7c3aed" floodOpacity="0.5" />
                            </filter>
                        </defs>

                        {/* Existing Field-Level Relations */}
                        {relations.map(rel => {
                            const curve = calculateFieldCurve(rel);
                            if (!curve) return null;

                            const isSelected = selectedRelation?.id === rel.id;
                            const isHovered = hoveredRelation?.id === rel.id;

                            return (
                                <g 
                                    key={rel.id} 
                                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                    onClick={() => setSelectedRelation(rel)}
                                    onMouseEnter={() => setHoveredRelation(rel)}
                                    onMouseLeave={() => setHoveredRelation(null)}
                                >
                                    {/* Invisible hover buffer */}
                                    <path 
                                        d={curve.path} 
                                        fill="none" 
                                        stroke="transparent" 
                                        strokeWidth="18" 
                                    />
                                    {/* Visible Connection Line from exact field row */}
                                    <path 
                                        d={curve.path} 
                                        fill="none" 
                                        stroke={isSelected ? '#2563eb' : (isHovered ? '#7c3aed' : '#8b5cf6')} 
                                        strokeWidth={isSelected || isHovered ? '3.2' : '2.2'} 
                                        markerEnd={isSelected ? 'url(#erd-field-arrow-active)' : 'url(#erd-field-arrow)'}
                                        filter={isSelected || isHovered ? 'url(#field-line-glow)' : 'none'}
                                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                                    />
                                    {/* Anchor Points at Start & End */}
                                    <circle cx={curve.startX} cy={curve.startY} r="4" fill="#7c3aed" stroke="white" strokeWidth="1.5" />
                                    <circle cx={curve.endX} cy={curve.endY} r="4" fill="#7c3aed" stroke="white" strokeWidth="1.5" />

                                    {/* Cardinality Badge / Field Label */}
                                    <g transform={`translate(${curve.midX}, ${curve.midY})`}>
                                        <rect 
                                            x="-54" 
                                            y="-11" 
                                            width="108" 
                                            height="22" 
                                            rx="11" 
                                            fill={isSelected ? '#2563eb' : '#ffffff'} 
                                            stroke={isSelected ? '#1d4ed8' : '#ddd6fe'} 
                                            strokeWidth="1.5" 
                                        />
                                        <text 
                                            x="0" 
                                            y="4" 
                                            textAnchor="middle" 
                                            fill={isSelected ? '#ffffff' : '#6d28d9'} 
                                            fontSize="9.5" 
                                            fontWeight="800"
                                            fontFamily="sans-serif"
                                        >
                                            {rel.sourceFieldName} 🔗
                                        </text>
                                    </g>
                                </g>
                            );
                        })}

                        {/* Live Dragging Wire */}
                        {connectingFrom && (
                            <path 
                                d={`M ${connectingFrom.startX} ${connectingFrom.startY} Q ${(connectingFrom.startX + mousePos.x) / 2} ${connectingFrom.startY - 30}, ${mousePos.x} ${mousePos.y}`}
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="3"
                                strokeDasharray="6,4"
                                markerEnd="url(#erd-field-arrow-active)"
                            />
                        )}
                    </svg>

                    {/* ── Table Nodes (Cards with Field Ports) ── */}
                    {tables.map(table => {
                        const pos = tablePositions[table.id] || { x: 60, y: 60 };
                        const isSelected = selectedTable?.id === table.id;
                        const isDraggingThis = draggingTableId === table.id;
                        const isDropTarget = connectingFrom && hoveredTableId === table.id && connectingFrom.table.id !== table.id;
                        const fields = Array.isArray(table.fields) ? table.fields : [];

                        return (
                            <div
                                key={table.id}
                                onMouseEnter={() => setHoveredTableId(table.id)}
                                onMouseLeave={() => {
                                    setHoveredTableId(null);
                                    setHoveredFieldInfo(null);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: `${pos.x}px`,
                                    top: `${pos.y}px`,
                                    width: '260px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: isDropTarget ? '2px solid #2563eb' : (isSelected ? '2px solid #6366f1' : '1px solid #cbd5e1'),
                                    boxShadow: isDropTarget ? '0 0 0 6px rgba(37,99,235,0.2), 0 12px 24px rgba(0,0,0,0.12)' : (isSelected ? '0 10px 25px rgba(99,102,241,0.15)' : '0 4px 12px rgba(0,0,0,0.06)'),
                                    pointerEvents: 'all',
                                    zIndex: isDraggingThis ? 100 : (isSelected ? 20 : 10),
                                    transition: isDraggingThis ? 'none' : 'box-shadow 0.15s, border-color 0.15s'
                                }}
                            >
                                {/* Table Card Header */}
                                <div
                                    onMouseDown={(e) => handleMouseDownTable(e, table.id)}
                                    onClick={() => onSelectTable(table)}
                                    style={{
                                        padding: '10px 12px',
                                        backgroundColor: isSelected ? '#4f46e5' : '#1e293b',
                                        color: 'white',
                                        borderTopLeftRadius: '11px',
                                        borderTopRightRadius: '11px',
                                        cursor: 'move',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        <Database size={15} style={{ flexShrink: 0, color: isSelected ? '#c7d2fe' : '#94a3b8' }} />
                                        <span style={{ fontWeight: 800, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {table.name}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                                        {fields.length} cols
                                    </span>
                                </div>

                                {/* Table Fields List (Field-Level Ports) */}
                                <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px 0' }}>
                                    {/* Primary Key ID row */}
                                    <div 
                                        onMouseEnter={() => setHoveredFieldInfo({ tableId: table.id, fieldName: 'id' })}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            padding: '6px 12px', 
                                            fontSize: '0.78rem', 
                                            borderBottom: '1px solid #f1f5f9', 
                                            backgroundColor: '#fafafa',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Key size={13} style={{ color: '#eab308' }} />
                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>id</span>
                                        </div>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                                            PK (UUID)
                                        </span>
                                    </div>

                                    {/* Individual Column Rows */}
                                    {fields.map((f, fIdx) => {
                                        const badge = FIELD_TYPE_BADGES[f.type] || FIELD_TYPE_BADGES.text;
                                        const isLinked = f.type === 'linked_record';
                                        const isFieldHovered = hoveredFieldInfo?.tableId === table.id && hoveredFieldInfo?.fieldName === f.name;

                                        return (
                                            <div
                                                key={f.name || fIdx}
                                                onMouseEnter={() => setHoveredFieldInfo({ tableId: table.id, fieldName: f.name })}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '5px 12px',
                                                    height: '30px',
                                                    boxSizing: 'border-box',
                                                    fontSize: '0.78rem',
                                                    borderBottom: fIdx === fields.length - 1 ? 'none' : '1px solid #f8fafc',
                                                    backgroundColor: isLinked ? '#faf5ff' : (isFieldHovered ? '#f8fafc' : 'transparent'),
                                                    position: 'relative',
                                                    transition: 'background-color 0.1s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                                    {isLinked ? (
                                                        <Link2 size={13} style={{ color: '#7c3aed', flexShrink: 0 }} />
                                                    ) : (
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#94a3b8', flexShrink: 0 }} />
                                                    )}
                                                    <span style={{ 
                                                        fontWeight: isLinked ? 800 : 500, 
                                                        color: isLinked ? '#6b21a8' : '#334155', 
                                                        whiteSpace: 'nowrap', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis' 
                                                    }}>
                                                        {f.name}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{
                                                        fontSize: '0.64rem',
                                                        fontWeight: 700,
                                                        padding: '1px 5px',
                                                        borderRadius: '4px',
                                                        backgroundColor: badge.bg,
                                                        color: badge.color
                                                    }}>
                                                        {badge.label}
                                                    </span>

                                                    {/* Field-Level Connection Port Dot (Right Side) */}
                                                    <div 
                                                        onMouseDown={(e) => handleStartConnect(e, table, f)}
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '50%',
                                                            backgroundColor: isLinked ? '#7c3aed' : '#94a3b8',
                                                            border: '2px solid white',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                                            cursor: 'crosshair',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginLeft: '2px',
                                                            transform: isFieldHovered ? 'scale(1.3)' : 'scale(1)',
                                                            transition: 'transform 0.15s, background-color 0.15s'
                                                        }}
                                                        title={`Tarik field "${f.name}" untuk dihubungkan ke tabel lain`}
                                                    >
                                                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'white' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── 8. Create Relationship Modal (Triggered on Drag & Drop) ── */}
            {relationModal.isOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
                    <div style={{ width: '480px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Link2 size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Buat Relasi Linked Record</div>
                                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Hubungkan kolom Linked Record antar kedua tabel</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setRelationModal({ isOpen: false, sourceTable: null, targetTable: null, sourceField: null, targetField: null, linkType: 'one_to_many', sourceFieldName: '', reverseFieldName: '', isSubmitting: false })}
                                style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Visual Connection Card */}
                            <div style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TABEL ASAL</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{relationModal.sourceTable?.name}</div>
                                    {relationModal.sourceField && (
                                        <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, marginTop: '2px' }}>
                                            Kolom: {relationModal.sourceField.name}
                                        </div>
                                    )}
                                </div>
                                <ArrowRight size={18} style={{ color: '#6366f1', margin: '0 8px' }} />
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TABEL TUJUAN</div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{relationModal.targetTable?.name}</div>
                                </div>
                            </div>

                            {/* Relationship Cardinality */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Tipe Kardinalitas Relasi:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {[
                                        { id: 'one_to_many', title: '1 : N (One-to-Many)', desc: `1 ${relationModal.sourceTable?.name} punya banyak ${relationModal.targetTable?.name}` },
                                        { id: 'many_to_one', title: 'N : 1 (Many-to-One)', desc: `Banyak ${relationModal.sourceTable?.name} milik 1 ${relationModal.targetTable?.name}` },
                                        { id: 'one_to_one', title: '1 : 1 (One-to-One)', desc: 'Setiap baris terhubung tepat 1 baris' },
                                        { id: 'many_to_many', title: 'N : M (Many-to-Many)', desc: 'Banyak ke banyak' }
                                    ].map(opt => (
                                        <div
                                            key={opt.id}
                                            onClick={() => setRelationModal(prev => ({ ...prev, linkType: opt.id }))}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: relationModal.linkType === opt.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                                backgroundColor: relationModal.linkType === opt.id ? '#eff6ff' : 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: relationModal.linkType === opt.id ? '#1d4ed8' : '#1e293b' }}>{opt.title}</div>
                                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>{opt.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Field Name on Source Table */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                    Nama Kolom Linked Record di [{relationModal.sourceTable?.name}]:
                                </label>
                                <input 
                                    value={relationModal.sourceFieldName}
                                    onChange={(e) => setRelationModal(prev => ({ ...prev, sourceFieldName: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    placeholder="Contoh: Linked_Counts"
                                />
                            </div>

                            {/* Reverse Field Name on Target Table */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                    Nama Kolom Timbal-Balik di [{relationModal.targetTable?.name}] (Back-link):
                                </label>
                                <input 
                                    value={relationModal.reverseFieldName}
                                    onChange={(e) => setRelationModal(prev => ({ ...prev, reverseFieldName: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                    placeholder="Contoh: Parent_Order (opsional)"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setRelationModal({ isOpen: false, sourceTable: null, targetTable: null, sourceField: null, targetField: null, linkType: 'one_to_many', sourceFieldName: '', reverseFieldName: '', isSubmitting: false })}
                                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveRelation}
                                disabled={relationModal.isSubmitting}
                                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: relationModal.isSubmitting ? 'not-allowed' : 'pointer' }}
                            >
                                {relationModal.isSubmitting ? 'Menyimpan...' : 'Simpan Linked Record 🔗'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 9. Selected Relation Detail Popover ── */}
            {selectedRelation && (
                <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 20px 30px rgba(0,0,0,0.15)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1000 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Link2 size={15} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                                [{selectedRelation.sourceTableName}].{selectedRelation.sourceFieldName} ⇄ [{selectedRelation.targetTableName}].{selectedRelation.targetFieldName || 'Linked'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Tipe: {selectedRelation.linkType.toUpperCase()} (Linked Record)
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => handleDeleteRelation(selectedRelation)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <Trash2 size={13} /> Hapus Linked Record
                        </button>
                        <button
                            onClick={() => setSelectedRelation(null)}
                            style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
