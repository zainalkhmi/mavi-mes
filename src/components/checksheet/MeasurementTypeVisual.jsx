import React, { useState, useEffect, useMemo } from 'react';

// ─── MEASUREMENT TYPE DEFINITIONS ───
const MEAS_TYPES = {
  id: {
    key: 'id',
    label: 'Inner Diameter (ID)',
    short: 'ID',
    symbol: '⌀',
    color: '#38bdf8',
    sop: 'Ukur diameter dalam lubang/bore. Pastikan probe masuk tegak lurus sumbu lubang.'
  },
  od: {
    key: 'od',
    label: 'Outer Diameter (OD)',
    short: 'OD',
    symbol: '⌀',
    color: '#a78bfa',
    sop: 'Ukur diameter luar silinder/shaft. Posisikan rahang tegak lurus terhadap sumbu benda.'
  },
  length: {
    key: 'length',
    label: 'Length (Panjang)',
    short: 'L',
    symbol: 'L',
    color: '#22c55e',
    sop: 'Ukur panjang antara dua permukaan ujung. Pastikan kontak rata di kedua sisi.'
  },
  width: {
    key: 'width',
    label: 'Width (Lebar)',
    short: 'W',
    symbol: 'W',
    color: '#f59e0b',
    sop: 'Ukur lebar benda kerja secara lateral. Pastikan posisi sejajar dengan sumbu lebar.'
  },
  height: {
    key: 'height',
    label: 'Height (Tinggi)',
    short: 'H',
    symbol: 'H',
    color: '#06b6d4',
    sop: 'Ukur tinggi/step height dari bidang dasar referensi. Gunakan surface plate sebagai datum.'
  },
  depth: {
    key: 'depth',
    label: 'Depth (Kedalaman)',
    short: 'D',
    symbol: 'D',
    color: '#ec4899',
    sop: 'Ukur kedalaman lubang/slot/recess dari permukaan atas. Pastikan depth rod tegak lurus.'
  },
  angle: {
    key: 'angle',
    label: 'Angle (Sudut)',
    short: '∠',
    symbol: '∠',
    color: '#f97316',
    sop: 'Ukur sudut antara dua permukaan. Tempatkan protractor tepat di vertex sudut.'
  },
  thickness: {
    key: 'thickness',
    label: 'Thickness (Tebal)',
    short: 't',
    symbol: 't',
    color: '#84cc16',
    sop: 'Ukur ketebalan dinding/material. Pastikan rahang sejajar dan kontak penuh di kedua sisi.'
  },
  roughness: {
    key: 'roughness',
    label: 'Surface Roughness (Ra)',
    short: 'Ra',
    symbol: 'Ra',
    color: '#14b8a6',
    sop: 'Ukur kekasaran permukaan. Tempatkan stylus sejajar arah lay permukaan, 3× pengulangan.'
  },
  radius: {
    key: 'radius',
    label: 'Radius (R)',
    short: 'R',
    symbol: 'R',
    color: '#e879f9',
    sop: 'Ukur radius lengkungan dari titik pusat ke tepi luar kurva.'
  },
  chamfer: {
    key: 'chamfer',
    label: 'Chamfer (C)',
    short: 'C',
    symbol: 'C',
    color: '#fb923c',
    sop: 'Ukur dimensi chamfer (bevel) pada tepi benda kerja.'
  },
  flatness: {
    key: 'flatness',
    label: 'Flatness (Kerataan)',
    short: '⏥',
    symbol: '⏥',
    color: '#2dd4bf',
    sop: 'Periksa kerataan permukaan dengan dial indicator di atas surface plate. Putar 360°.'
  },
  concentricity: {
    key: 'concentricity',
    label: 'Concentricity (◎)',
    short: '◎',
    symbol: '◎',
    color: '#818cf8',
    sop: 'Periksa konsentrisitas dua diameter terhadap sumbu referensi. Putar di V-block.'
  },
  thread: {
    key: 'thread',
    label: 'Thread (Ulir)',
    short: 'M',
    symbol: 'M',
    color: '#f43f5e',
    sop: 'Periksa profil ulir dengan thread gauge GO/NO-GO. Verifikasi pitch dan major diameter.'
  }
};

/**
 * Auto-detect measurement type from checkpoint fields
 */
export function detectMeasurementType(point) {
  if (!point) return MEAS_TYPES.length;

  const title = (point.title || '').toLowerCase();
  const cat = (point.category || '').toLowerCase();
  const notes = (point.notes || '').toLowerCase();
  const gdt = (point.gdtSymbol || '');
  const all = `${title} ${cat} ${notes}`;

  // Surface roughness
  if (all.includes('roughness') || all.includes('ra ') || all.includes('kehalusan') || all.includes('kekasaran') || all.includes('surface finish')) return MEAS_TYPES.roughness;

  // Thread
  if (all.includes('thread') || all.includes('ulir') || all.includes('tap') || /\bm\d+/.test(all)) return MEAS_TYPES.thread;

  // Concentricity
  if (all.includes('concentri') || all.includes('runout') || all.includes('konsentri') || gdt === '◎') return MEAS_TYPES.concentricity;

  // Flatness
  if (all.includes('flatness') || all.includes('kerataan') || all.includes('rata') || gdt === '⏥') return MEAS_TYPES.flatness;

  // Chamfer
  if (all.includes('chamfer') || all.includes('bevel') || /\bc\d/.test(all)) return MEAS_TYPES.chamfer;

  // Radius
  if (all.includes('radius') || all.includes('fillet') || /\br\d/.test(all)) return MEAS_TYPES.radius;

  // Angle
  if (all.includes('angle') || all.includes('sudut') || all.includes('degree') || all.includes('°')) return MEAS_TYPES.angle;

  // Thickness
  if (all.includes('thickness') || all.includes('tebal') || all.includes('ketebalan') || all.includes('wall')) return MEAS_TYPES.thickness;

  // Depth
  if (cat === 'depth' || all.includes('depth') || all.includes('kedalaman') || all.includes('recess') || all.includes('counterbore')) return MEAS_TYPES.depth;

  // Inner Diameter (ID) — bore, internal, inside
  if (all.includes('internal') || all.includes('inside') || all.includes('bore') || all.includes('hole') || (all.includes('id ') || all.includes('i.d'))) return MEAS_TYPES.id;

  // Height / Step
  if (all.includes('height') || all.includes('tinggi') || all.includes('step')) return MEAS_TYPES.height;

  // Width
  if (all.includes('width') || all.includes('lebar') || all.includes('wide') || all.includes('slot width')) return MEAS_TYPES.width;

  // Length
  if (all.includes('length') || all.includes('panjang') || all.includes('overall')) return MEAS_TYPES.length;

  // Outer Diameter (OD) — default for diameter category
  if (cat === 'diameter' || all.includes('diameter') || gdt === '⌀' || all.includes('shaft') || all.includes('pin')) {
    // Distinguish ID vs OD
    if (all.includes('internal') || all.includes('bore') || all.includes('inside') || all.includes('hole') || all.includes('seat')) return MEAS_TYPES.id;
    return MEAS_TYPES.od;
  }

  return MEAS_TYPES.length; // fallback
}

/**
 * MeasurementTypeVisual - Animated SVG showing WHAT is being measured
 */
export default function MeasurementTypeVisual({ activePoint }) {
  const [animPhase, setAnimPhase] = useState(0);

  const measType = useMemo(() => detectMeasurementType(activePoint), [activePoint]);
  const nominal = activePoint ? (parseFloat(activePoint.nominal) || 25.0) : 25.0;
  const unit = activePoint?.unit || 'mm';

  // Animate on point change
  useEffect(() => {
    setAnimPhase(0);
    const t = setTimeout(() => setAnimPhase(1), 60);
    return () => clearTimeout(t);
  }, [activePoint?.id]);

  const progress = animPhase;
  const c = measType.color;

  // Dimension arrow helper
  const Arrow = ({ x1, y1, x2, y2, color, label, labelPos = 'center' }) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isHoriz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    const lx = labelPos === 'center' ? mx : x2;
    const ly = labelPos === 'center' ? (isHoriz ? my - 7 : my) : y2 - 7;

    return (
      <g style={{ opacity: progress, transition: 'opacity 0.4s ease 0.2s' }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.2" />
        {/* arrowheads */}
        <polygon points={`${x1},${y1} ${x1 + (isHoriz ? 4 : -3)},${y1 + (isHoriz ? -3 : 4)} ${x1 + (isHoriz ? 4 : 3)},${y1 + (isHoriz ? 3 : 4)}`} fill={color} />
        <polygon points={`${x2},${y2} ${x2 + (isHoriz ? -4 : -3)},${y2 + (isHoriz ? -3 : -4)} ${x2 + (isHoriz ? -4 : 3)},${y2 + (isHoriz ? 3 : -4)}`} fill={color} />
        {label && (
          <text x={lx} y={ly} fill={color} fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
            {label}
          </text>
        )}
      </g>
    );
  };

  const valText = `${nominal} ${unit}`;

  const renderDiagram = () => {
    switch (measType.key) {
      // ── INNER DIAMETER (ID) ──
      case 'id':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Workpiece block with bore */}
            <rect x="60" y="15" width="140" height="70" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" style={{ opacity: 0.9 }} />
            <ellipse cx="130" cy="50" rx={30 * progress} ry={30 * progress} fill="#020617" stroke={c} strokeWidth="1.5" strokeDasharray="3 2" style={{ transition: 'all 0.5s ease' }} />
            <ellipse cx="130" cy="50" rx="20" ry="20" fill="none" stroke={`${c}44`} strokeWidth="8" style={{ opacity: progress, transition: 'opacity 0.6s' }} />
            {/* Center mark */}
            <circle cx="130" cy="50" r="2" fill={c} style={{ opacity: progress }} />
            <line x1="130" y1="38" x2="130" y2="62" stroke={`${c}66`} strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="118" y1="50" x2="142" y2="50" stroke={`${c}66`} strokeWidth="0.6" strokeDasharray="2 2" />
            {/* Dimension arrows */}
            <Arrow x1={100} y1={50} x2={160} y2={50} color={c} label={`⌀${valText}`} />
          </svg>
        );

      // ── OUTER DIAMETER (OD) ──
      case 'od':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Cylindrical cross section */}
            <ellipse cx="130" cy="50" rx={40 * progress} ry={35 * progress} fill="#1e293b" stroke="#475569" strokeWidth="1.5" style={{ transition: 'all 0.5s ease' }} />
            <ellipse cx="130" cy="50" rx={28 * progress} ry={24 * progress} fill="#0f172a" stroke="#334155" strokeWidth="0.8" style={{ transition: 'all 0.5s ease 0.1s' }} />
            {/* Hatch lines inside */}
            {[...Array(5)].map((_, i) => (
              <line key={i} x1={110 + i * 10} y1={35} x2={105 + i * 10} y2={65} stroke="#33415544" strokeWidth="0.6" />
            ))}
            {/* Center axis */}
            <line x1="70" y1="50" x2="190" y2="50" stroke={`${c}44`} strokeWidth="0.6" strokeDasharray="4 3" />
            <circle cx="130" cy="50" r="2" fill={c} style={{ opacity: progress }} />
            {/* Dimension arrows outside */}
            <Arrow x1={130} y1={15} x2={130} y2={85} color={c} label={`⌀${valText}`} />
            {/* Extension lines */}
            <line x1="65" y1="15" x2="125" y2="15" stroke={`${c}88`} strokeWidth="0.5" />
            <line x1="65" y1="85" x2="125" y2="85" stroke={`${c}88`} strokeWidth="0.5" />
          </svg>
        );

      // ── LENGTH ──
      case 'length':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Workpiece */}
            <rect x={30 + (1 - progress) * 60} y="30" width={200 * progress} height="40" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            {/* Cross hatch */}
            {[...Array(8)].map((_, i) => (
              <line key={i} x1={45 + i * 24} y1={32} x2={38 + i * 24} y2={68} stroke="#33415544" strokeWidth="0.6" />
            ))}
            {/* Dimension line below */}
            <Arrow x1={30} y1={82} x2={230} y2={82} color={c} label={valText} />
            {/* Extension lines */}
            <line x1="30" y1="70" x2="30" y2="86" stroke={`${c}88`} strokeWidth="0.5" />
            <line x1="230" y1="70" x2="230" y2="86" stroke={`${c}88`} strokeWidth="0.5" />
          </svg>
        );

      // ── WIDTH ──
      case 'width':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Top-view workpiece */}
            <rect x="70" y={20 + (1 - progress) * 20} width="120" height={60 * progress} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            {[...Array(5)].map((_, i) => (
              <line key={i} x1={80 + i * 24} y1={22} x2={74 + i * 24} y2={78} stroke="#33415544" strokeWidth="0.6" />
            ))}
            {/* Dimension line on left */}
            <Arrow x1={55} y1={20} x2={55} y2={80} color={c} label={valText} />
            <line x1="55" y1="20" x2="70" y2="20" stroke={`${c}88`} strokeWidth="0.5" />
            <line x1="55" y1="80" x2="70" y2="80" stroke={`${c}88`} strokeWidth="0.5" />
          </svg>
        );

      // ── HEIGHT / STEP ──
      case 'height':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Base plate */}
            <rect x="40" y="75" width="180" height="12" rx="1" fill="#334155" stroke="#475569" strokeWidth="0.8" />
            {/* Stepped part */}
            <rect x="80" y={75 - 50 * progress} width="100" height={50 * progress} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            <rect x="110" y={75 - 50 * progress - 15 * progress} width="40" height={15 * progress} rx="1" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" style={{ transition: 'all 0.5s ease 0.1s' }} />
            {/* Dimension arrow vertical */}
            <Arrow x1={200} y1={75} x2={200} y2={10} color={c} label={valText} />
            <line x1="180" y1="75" x2="200" y2="75" stroke={`${c}88`} strokeWidth="0.5" />
            <line x1="150" y1="10" x2="200" y2="10" stroke={`${c}88`} strokeWidth="0.5" />
          </svg>
        );

      // ── DEPTH ──
      case 'depth':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Workpiece with hole */}
            <rect x="60" y="15" width="140" height="70" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {/* Hole/recess */}
            <rect x="110" y="15" width="40" height={55 * progress} rx="1" fill="#020617" stroke={c} strokeWidth="1" strokeDasharray="2 2" style={{ transition: 'all 0.5s ease' }} />
            {/* Depth probe arrow */}
            <line x1="130" y1="8" x2="130" y2={15 + 55 * progress} stroke={c} strokeWidth="1.5" strokeDasharray="3 2" style={{ transition: 'all 0.5s ease', opacity: progress }} />
            <circle cx="130" cy={15 + 55 * progress} r="2.5" fill={c} style={{ opacity: progress, transition: 'all 0.5s ease' }} />
            {/* Dimension */}
            <Arrow x1={210} y1={15} x2={210} y2={70} color={c} label={valText} />
            <line x1="150" y1="15" x2="210" y2="15" stroke={`${c}88`} strokeWidth="0.5" />
            <line x1="150" y1="70" x2="210" y2="70" stroke={`${c}88`} strokeWidth="0.5" />
          </svg>
        );

      // ── ANGLE ──
      case 'angle':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Two surfaces forming angle */}
            <line x1="50" y1="80" x2="210" y2="80" stroke="#475569" strokeWidth="2" />
            <line x1="50" y1="80" x2={50 + 120 * progress * Math.cos(-Math.PI / 4)} y2={80 + 120 * progress * Math.sin(-Math.PI / 4)} stroke="#475569" strokeWidth="2" style={{ transition: 'all 0.5s ease' }} />
            {/* Angle arc */}
            <path d={`M 90 80 A 40 40 0 0 0 ${50 + 40 * Math.cos(-Math.PI / 4)} ${80 + 40 * Math.sin(-Math.PI / 4)}`} fill="none" stroke={c} strokeWidth="1.5" style={{ opacity: progress, transition: 'opacity 0.4s ease 0.3s' }} />
            {/* Angle value */}
            <text x="98" y="68" fill={c} fontSize="9" fontWeight="900" fontFamily="monospace" style={{ opacity: progress }}>
              {`${nominal}°`}
            </text>
            {/* Vertex dot */}
            <circle cx="50" cy="80" r="3" fill={c} style={{ opacity: progress }} />
          </svg>
        );

      // ── THICKNESS ──
      case 'thickness':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Wall cross section */}
            <rect x="60" y="15" width="140" height="70" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <rect x={75 + 15 * progress} y="25" width={95 - 30 * progress} height="50" rx="2" fill="#020617" stroke="#33415588" strokeWidth="0.8" style={{ transition: 'all 0.5s ease' }} />
            {/* Wall thickness arrows */}
            <Arrow x1={60} y1={92} x2={75 + 15 * progress} y2={92} color={c} label={`t=${valText}`} />
            <line x1="60" y1="85" x2="60" y2="96" stroke={`${c}88`} strokeWidth="0.5" />
            <line x1={75 + 15 * progress} y1="75" x2={75 + 15 * progress} y2="96" stroke={`${c}88`} strokeWidth="0.5" />
          </svg>
        );

      // ── SURFACE ROUGHNESS (Ra) ──
      case 'roughness':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Surface baseline */}
            <line x1="30" y1="60" x2="230" y2="60" stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
            {/* Roughness profile wave */}
            <polyline
              fill="none"
              stroke={c}
              strokeWidth="1.8"
              points={[...Array(40)].map((_, i) => {
                const x = 30 + i * 5;
                const y = 60 + Math.sin(i * 1.2 + progress * 6) * (4 + Math.random() * 3) * progress;
                return `${x},${y}`;
              }).join(' ')}
              style={{ transition: 'all 0.3s ease' }}
            />
            {/* Roughness symbol ▽ */}
            <polygon points="130,20 122,35 138,35" fill="none" stroke={c} strokeWidth="1.5" style={{ opacity: progress }} />
            <text x="130" y="15" fill={c} fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="monospace" style={{ opacity: progress }}>
              Ra {nominal} µm
            </text>
            {/* Stylus tip */}
            <circle cx={30 + progress * 200} cy={60 + Math.sin(progress * 40) * 3} r="2.5" fill="#ef4444" style={{ transition: 'cx 0.5s ease' }} />
            <line x1={30 + progress * 200} y1={45} x2={30 + progress * 200} y2={60 + Math.sin(progress * 40) * 3} stroke="#ef4444" strokeWidth="1" />
          </svg>
        );

      // ── RADIUS ──
      case 'radius':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Arc/curve */}
            <path d={`M 80 80 Q 130 ${80 - 60 * progress} 180 80`} fill="none" stroke="#475569" strokeWidth="2" style={{ transition: 'all 0.5s ease' }} />
            {/* Part body */}
            <path d={`M 80 80 L 80 90 L 180 90 L 180 80 Q 130 ${80 - 60 * progress} 80 80 Z`} fill="#1e293b" stroke="#475569" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            {/* Radius line from center */}
            <line x1="130" y1="80" x2={130 + 50 * progress * Math.cos(-Math.PI / 3)} y2={80 + 50 * progress * Math.sin(-Math.PI / 3)} stroke={c} strokeWidth="1.2" style={{ opacity: progress, transition: 'all 0.5s ease' }} />
            <circle cx="130" cy="80" r="2" fill={c} style={{ opacity: progress }} />
            <text x="155" y="45" fill={c} fontSize="8" fontWeight="900" fontFamily="monospace" style={{ opacity: progress }}>
              R{valText}
            </text>
          </svg>
        );

      // ── CHAMFER ──
      case 'chamfer':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Block edge with chamfer */}
            <path d="M 80 20 L 200 20 L 200 80 L 80 80 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {/* Chamfer cut */}
            <path d={`M 80 20 L ${80 + 30 * progress} ${20 + 30 * progress}`} stroke={c} strokeWidth="2" style={{ transition: 'all 0.5s ease' }} />
            <polygon points={`80,20 ${80 + 30 * progress},20 80,${20 + 30 * progress}`} fill={`${c}22`} stroke={c} strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            {/* Dimension */}
            <text x={60} y={40} fill={c} fontSize="8" fontWeight="900" fontFamily="monospace" style={{ opacity: progress }}>
              C{valText}
            </text>
            {/* 45° indicator */}
            <path d="M 80 30 A 10 10 0 0 1 90 20" fill="none" stroke={c} strokeWidth="0.8" style={{ opacity: progress }} />
            <text x="93" y="18" fill={c} fontSize="6" fontWeight="800" style={{ opacity: progress }}>45°</text>
          </svg>
        );

      // ── FLATNESS ──
      case 'flatness':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Surface plate base */}
            <rect x="40" y="72" width="180" height="10" rx="1" fill="#334155" stroke="#475569" strokeWidth="0.8" />
            {/* Workpiece on surface plate */}
            <rect x="60" y="40" width="140" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {/* GD&T flatness tolerance zone */}
            <line x1="60" y1="38" x2="200" y2="38" stroke={c} strokeWidth="0.8" strokeDasharray="3 2" style={{ opacity: progress }} />
            <line x1="60" y1="42" x2="200" y2="42" stroke={c} strokeWidth="0.8" strokeDasharray="3 2" style={{ opacity: progress }} />
            {/* Indicator probe */}
            <line x1={60 + progress * 140} y1="25" x2={60 + progress * 140} y2="38" stroke="#ef4444" strokeWidth="1.2" style={{ transition: 'all 0.5s ease' }} />
            <circle cx={60 + progress * 140} cy="23" r="3" fill="#ef4444" style={{ transition: 'all 0.5s ease' }} />
            {/* GD&T symbol box */}
            <rect x="100" y="5" width="60" height="14" rx="1" fill="none" stroke={c} strokeWidth="1" style={{ opacity: progress }} />
            <text x="130" y="15" fill={c} fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="monospace" style={{ opacity: progress }}>
              ⏥ {nominal}
            </text>
          </svg>
        );

      // ── CONCENTRICITY ──
      case 'concentricity':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Outer circle */}
            <circle cx="130" cy="50" r={38 * progress} fill="none" stroke="#475569" strokeWidth="1.5" style={{ transition: 'all 0.5s ease' }} />
            {/* Inner circle */}
            <circle cx="130" cy="50" r={22 * progress} fill="#1e293b" stroke="#64748b" strokeWidth="1" style={{ transition: 'all 0.5s ease 0.1s' }} />
            {/* Center axis cross */}
            <line x1="110" y1="50" x2="150" y2="50" stroke={`${c}66`} strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="130" y1="30" x2="130" y2="70" stroke={`${c}66`} strokeWidth="0.6" strokeDasharray="2 2" />
            <circle cx="130" cy="50" r="2" fill={c} style={{ opacity: progress }} />
            {/* Concentricity symbol */}
            <circle cx="130" cy="50" r={30 * progress} fill="none" stroke={c} strokeWidth="1" strokeDasharray="4 3" style={{ transition: 'all 0.5s ease 0.2s' }} />
            <text x="130" y="8" fill={c} fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="monospace" style={{ opacity: progress }}>
              ◎ {valText}
            </text>
          </svg>
        );

      // ── THREAD ──
      case 'thread':
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            {/* Shaft body */}
            <rect x="40" y="35" width={180 * progress} height="30" rx="1" fill="#1e293b" stroke="#475569" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            {/* Thread profile zigzag */}
            <polyline
              fill="none"
              stroke={c}
              strokeWidth="1.5"
              points={[...Array(16)].map((_, i) => {
                const x = 50 + i * 11;
                const y = i % 2 === 0 ? 33 : 28;
                return `${x},${y}`;
              }).join(' ')}
              style={{ opacity: progress, transition: 'opacity 0.4s ease 0.3s' }}
            />
            <polyline
              fill="none"
              stroke={c}
              strokeWidth="1.5"
              points={[...Array(16)].map((_, i) => {
                const x = 50 + i * 11;
                const y = i % 2 === 0 ? 67 : 72;
                return `${x},${y}`;
              }).join(' ')}
              style={{ opacity: progress, transition: 'opacity 0.4s ease 0.3s' }}
            />
            {/* Thread callout */}
            <text x="130" y="15" fill={c} fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="monospace" style={{ opacity: progress }}>
              M{nominal} × Pitch
            </text>
            {/* Major diameter arrow */}
            <Arrow x1={220} y1={28} x2={220} y2={72} color={c} label="⌀" />
          </svg>
        );

      default:
        return (
          <svg width="100%" height="100" viewBox="0 0 260 100">
            <rect x="60" y="25" width={140 * progress} height="50" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" style={{ transition: 'all 0.5s ease' }} />
            <Arrow x1={60} y1={88} x2={200} y2={88} color={c} label={valText} />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '10px',
        border: `1.5px solid ${c}33`,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '5px',
              backgroundColor: `${c}22`,
              border: `1px solid ${c}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 900,
              color: c,
              fontFamily: 'monospace'
            }}
          >
            {measType.symbol}
          </span>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#f8fafc' }}>
              {measType.label}
            </div>
            <div style={{ fontSize: '0.54rem', color: '#64748b', fontWeight: 700 }}>
              {activePoint?.title || 'Unknown Point'}
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.9rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: c,
            letterSpacing: '0.5px'
          }}
        >
          {nominal} <span style={{ fontSize: '0.56rem', color: '#94a3b8' }}>{unit}</span>
        </span>
      </div>

      {/* SVG Diagram */}
      <div
        style={{
          backgroundColor: '#020617',
          borderRadius: '6px',
          border: '1px solid #1e293b',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {renderDiagram()}
      </div>

      {/* SOP Micro-Instruction */}
      <div
        style={{
          fontSize: '0.56rem',
          color: '#94a3b8',
          fontWeight: 600,
          lineHeight: 1.3,
          padding: '2px 4px',
          backgroundColor: `${c}08`,
          borderRadius: '4px',
          borderLeft: `2px solid ${c}66`
        }}
      >
        📋 {measType.sop}
      </div>
    </div>
  );
}
