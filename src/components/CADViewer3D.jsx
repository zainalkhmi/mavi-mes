import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    Sliders,
    Layers,
    Edit3,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RotateCw,
    FileText,
    ChevronDown,
    Crosshair,
    Move,
    Check,
    Folder
} from 'lucide-react';
import { getAllDrawings } from '../utils/supabaseUtilityDB';
import { convertPdfToImageDataUrl } from '../utils/pdfRenderService';

// ─────────────────────────────────────────
// HOUSING COVER (HC-12527) TECHNICAL BLUEPRINT SVG (LIGHTWEIGHT PURE 2D)
// ─────────────────────────────────────────
export function HousingCoverDrawingSheet({ isDark = false }) {
    return (
        <g id="housing-cover-blueprint-sheet">
            {/* White/Light Drawing Paper Sheet Full 1000x700 */}
            <rect
                x="0"
                y="0"
                width="1000"
                height="700"
                fill="#ffffff"
            />

            {/* Standard Engineering Drawing Outer Border */}
            <rect
                x="12"
                y="12"
                width="976"
                height="676"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.6"
            />

            {/* Standard Engineering Drawing Inner Border */}
            <rect
                x="30"
                y="30"
                width="940"
                height="640"
                fill="none"
                stroke="#475569"
                strokeWidth="1.2"
            />

            {/* Coordinate Grid Header Zones (1..8 and A..F) */}
            <g fontSize="9" fontWeight="700" fill="#475569" fontFamily="sans-serif" textAnchor="middle">
                {[
                    { num: '1', x: 95 },
                    { num: '2', x: 215 },
                    { num: '3', x: 335 },
                    { num: '4', x: 455 },
                    { num: '5', x: 575 },
                    { num: '6', x: 695 },
                    { num: '7', x: 815 },
                    { num: '8', x: 915 }
                ].map(item => (
                    <React.Fragment key={`h_${item.num}`}>
                        <text x={item.x} y="24">{item.num}</text>
                        <text x={item.x} y="682">{item.num}</text>
                        <line x1={item.x - 55} y1="12" x2={item.x - 55} y2="30" stroke="#64748b" strokeWidth="0.8" />
                        <line x1={item.x - 55} y1="670" x2={item.x - 55} y2="688" stroke="#64748b" strokeWidth="0.8" />
                    </React.Fragment>
                ))}
            </g>

            <g fontSize="9" fontWeight="700" fill="#475569" fontFamily="sans-serif" textAnchor="middle">
                {[
                    { letter: 'A', y: 90 },
                    { letter: 'B', y: 190 },
                    { letter: 'C', y: 290 },
                    { letter: 'D', y: 390 },
                    { letter: 'E', y: 490 },
                    { letter: 'F', y: 590 }
                ].map(item => (
                    <React.Fragment key={`v_${item.letter}`}>
                        <text x="21" y={item.y}>{item.letter}</text>
                        <text x="979" y={item.y}>{item.letter}</text>
                        <line x1="12" y1={item.y - 45} x2="30" y2={item.y - 45} stroke="#64748b" strokeWidth="0.8" />
                        <line x1="970" y1={item.y - 45} x2="988" y2={item.y - 45} stroke="#64748b" strokeWidth="0.8" />
                    </React.Fragment>
                ))}
            </g>

            {/* Sheet Title: Check sheet */}
            <text x="45" y="60" fontSize="18" fontWeight="bold" fill="#0f172a" fontFamily="'Inter', sans-serif">
                Check sheet
            </text>

            {/* ────────────────────────────────────────────────────────── */}
            {/* VIEW 1: FRONT CASTING HOUSING COVER PROJECTION */}
            {/* ────────────────────────────────────────────────────────── */}
            <g id="housing-cover-front-view" transform="translate(45, 25)">
                {/* Complex Die-Cast Outer Perimeter Contour */}
                <path
                    d="M 120 180
                       C 115 150, 130 115, 160 100
                       C 185 85, 230 75, 280 80
                       C 320 85, 370 120, 395 160
                       C 420 200, 440 250, 430 300
                       C 420 350, 380 395, 330 405
                       C 290 415, 230 405, 175 390
                       C 130 375, 100 325, 110 260
                       C 115 220, 118 200, 120 180 Z"
                    fill="#f8fafc"
                    stroke="#1e293b"
                    strokeWidth="2.2"
                />

                {/* Inner Chamber Pocket Edge (Wall Thickness Line) */}
                <path
                    d="M 136 182
                       C 132 158, 146 128, 170 115
                       C 192 102, 232 94, 275 98
                       C 310 102, 355 132, 378 168
                       C 400 204, 418 248, 410 292
                       C 400 338, 366 378, 322 388
                       C 285 396, 232 388, 185 374
                       C 146 360, 120 316, 128 260
                       C 132 224, 134 200, 136 182 Z"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.2"
                />

                {/* Inner Ribs & Structural Webbing */}
                <path d="M 210 120 L 260 215" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 270 100 L 275 205" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 325 115 L 295 210" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 370 170 L 310 230" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 395 240 L 320 255" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 385 315 L 310 280" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 345 365 L 290 295" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 275 390 L 275 300" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 215 375 L 255 290" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 160 335 L 240 275" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 145 260 L 235 255" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 155 190 L 245 235" stroke="#64748b" strokeWidth="1.2" />

                {/* Main Bearing Bore & Stepped Collars (Center) */}
                <circle cx="275" cy="255" r="52" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
                <circle cx="275" cy="255" r="44" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="5,2" />
                <circle cx="275" cy="255" r="34" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="275" cy="255" r="22" fill="#f1f5f9" stroke="#0f172a" strokeWidth="2.0" />

                {/* Centerline Crosshairs */}
                <line x1="195" y1="255" x2="355" y2="255" stroke="#ef4444" strokeWidth="0.6" strokeDasharray="10,2,2,2" />
                <line x1="275" y1="175" x2="275" y2="335" stroke="#ef4444" strokeWidth="0.6" strokeDasharray="10,2,2,2" />

                {/* Auxiliary Cavities / Pockets */}
                <ellipse cx="205" cy="265" rx="14" ry="18" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
                <rect x="345" y="225" width="24" height="42" rx="4" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />

                {/* Perimeter Bolt Bosses (10 Mounting Holes with Centers) */}
                {[
                    { cx: 160, cy: 98, r1: 15, r2: 7 },
                    { cx: 215, cy: 75, r1: 14, r2: 6.5 },
                    { cx: 335, cy: 80, r1: 14, r2: 6.5 },
                    { cx: 395, cy: 110, r1: 15, r2: 7 },
                    { cx: 470, cy: 195, r1: 15, r2: 7 },
                    { cx: 435, cy: 300, r1: 15, r2: 7 },
                    { cx: 375, cy: 375, r1: 15, r2: 7 },
                    { cx: 300, cy: 395, r1: 14, r2: 6.5 },
                    { cx: 235, cy: 385, r1: 14, r2: 6.5 },
                    { cx: 170, cy: 355, r1: 15, r2: 7 },
                    { cx: 125, cy: 280, r1: 14, r2: 6.5 }
                ].map((boss, idx) => (
                    <g key={`boss_${idx}`}>
                        <circle cx={boss.cx} cy={boss.cy} r={boss.r1} fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
                        <circle cx={boss.cx} cy={boss.cy} r={boss.r2} fill="#f1f5f9" stroke="#1e293b" strokeWidth="1.2" />
                        <line x1={boss.cx - 18} y1={boss.cy} x2={boss.cx + 18} y2={boss.cy} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4,2" />
                        <line x1={boss.cx} y1={boss.cy - 18} x2={boss.cx} y2={boss.cy + 18} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="4,2" />
                    </g>
                ))}

                {/* Front View Dimension Extension Lines and Arrows */}
                <g stroke="#334155" strokeWidth="0.75" fill="#334155" fontSize="8.5" fontFamily="monospace">
                    {/* Left Height Dimensions */}
                    <line x1="50" y1="130" x2="50" y2="390" />
                    <line x1="45" y1="130" x2="150" y2="130" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="45" y1="390" x2="160" y2="390" strokeDasharray="2,2" stroke="#94a3b8" />
                    <text x="42" y="260" textAnchor="middle" transform="rotate(-90 42 260)">121.50°</text>

                    <line x1="75" y1="150" x2="75" y2="370" />
                    <line x1="70" y1="150" x2="160" y2="150" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="70" y1="370" x2="170" y2="370" strokeDasharray="2,2" stroke="#94a3b8" />
                    <text x="67" y="260" textAnchor="middle" transform="rotate(-90 67 260)">101.00°</text>

                    <line x1="100" y1="165" x2="100" y2="340" />
                    <text x="92" y="260" textAnchor="middle" transform="rotate(-90 92 260)">82.00°</text>

                    {/* Top Width Dimension */}
                    <line x1="160" y1="55" x2="470" y2="55" />
                    <line x1="160" y1="50" x2="160" y2="95" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="470" y1="50" x2="470" y2="190" strokeDasharray="2,2" stroke="#94a3b8" />
                    <polygon points="160,55 167,52.5 167,57.5" />
                    <polygon points="470,55 463,52.5 463,57.5" />
                    <text x="315" y="48" textAnchor="middle" fontWeight="bold">193.39°</text>

                    {/* Bottom Width Dimension */}
                    <line x1="190" y1="440" x2="380" y2="440" />
                    <line x1="190" y1="390" x2="190" y2="445" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="380" y1="390" x2="380" y2="445" strokeDasharray="2,2" stroke="#94a3b8" />
                    <polygon points="190,440 197,437.5 197,442.5" />
                    <polygon points="380,440 373,437.5 373,442.5" />
                    <text x="285" y="455" textAnchor="middle" fontWeight="bold">89.98°</text>

                    {/* Right Height Dimensions */}
                    <line x1="485" y1="180" x2="485" y2="320" />
                    <text x="480" y="250" textAnchor="middle" transform="rotate(-90 480 250)">63.89°</text>
                    <line x1="505" y1="160" x2="505" y2="335" />
                    <text x="500" y="250" textAnchor="middle" transform="rotate(-90 500 250)">82.27°</text>
                    <line x1="540" y1="150" x2="540" y2="390" />
                    <text x="535" y="270" textAnchor="middle" transform="rotate(-90 535 270)">91.49°</text>

                    {/* Top Callouts */}
                    <text x="75" y="80" textAnchor="end">Ø10.01°</text>
                    <text x="75" y="92" textAnchor="end">Ø13.31°</text>
                    <line x1="77" y1="88" x2="155" y2="98" stroke="#64748b" strokeWidth="0.75" />

                    <text x="220" y="22" textAnchor="middle">Ø13.20°</text>
                    <text x="220" y="32" textAnchor="middle">Ø14.03°</text>
                    <line x1="220" y1="36" x2="215" y2="70" stroke="#64748b" strokeWidth="0.75" />

                    <text x="310" y="32" textAnchor="middle">Ø9.95°</text>
                    <line x1="310" y1="36" x2="335" y2="75" stroke="#64748b" strokeWidth="0.75" />

                    <text x="410" y="38" textAnchor="start">Ø10.28°</text>
                    <line x1="410" y1="42" x2="395" y2="105" stroke="#64748b" strokeWidth="0.75" />

                    {/* Bottom Callouts */}
                    <text x="100" y="425" textAnchor="end">Ø11.60°</text>
                    <line x1="105" y1="422" x2="165" y2="360" stroke="#64748b" strokeWidth="0.75" />

                    <text x="180" y="440" textAnchor="middle">Ø10.30°</text>
                    <line x1="180" y1="432" x2="230" y2="390" stroke="#64748b" strokeWidth="0.75" />

                    <text x="290" y="440" textAnchor="middle">Ø7.96°</text>
                    <line x1="290" y1="432" x2="300" y2="400" stroke="#64748b" strokeWidth="0.75" />

                    <text x="410" y="428" textAnchor="start">Ø17.70°</text>
                    <line x1="405" y1="424" x2="380" y2="380" stroke="#64748b" strokeWidth="0.75" />
                </g>
            </g>

            {/* ────────────────────────────────────────────────────────── */}
            {/* VIEW 2: SECTION A-A PROJECTION */}
            {/* ────────────────────────────────────────────────────────── */}
            <g id="section-view-a-a" transform="translate(680, 80)">
                <text x="40" y="-15" fontSize="11" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif" textAnchor="middle">
                    A-A (SECTION)
                </text>

                <path
                    d="M 15 20
                       L 50 20
                       L 50 60
                       L 40 60
                       L 40 160
                       L 50 160
                       L 50 200
                       L 15 200
                       L 15 175
                       L 25 175
                       L 25 145
                       L 15 145
                       L 15 75
                       L 25 75
                       L 25 45
                       L 15 45 Z"
                    fill="#f1f5f9"
                    stroke="#1e293b"
                    strokeWidth="1.8"
                />

                {[30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195].map((hY, idx) => (
                    <line
                        key={`hatch_${idx}`}
                        x1="18"
                        y1={hY}
                        x2="48"
                        y2={hY - 20}
                        stroke="#64748b"
                        strokeWidth="0.6"
                    />
                ))}

                <g stroke="#334155" strokeWidth="0.75" fill="#334155" fontSize="8.5" fontFamily="monospace">
                    <line x1="15" y1="5" x2="50" y2="5" />
                    <line x1="15" y1="2" x2="15" y2="18" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="50" y1="2" x2="50" y2="18" strokeDasharray="2,2" stroke="#94a3b8" />
                    <polygon points="15,5 20,3 20,7" />
                    <polygon points="50,5 45,3 45,7" />
                    <text x="32" y="-1" textAnchor="middle">27.50</text>

                    <line x1="15" y1="215" x2="45" y2="215" />
                    <line x1="15" y1="202" x2="15" y2="218" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="45" y1="202" x2="45" y2="218" strokeDasharray="2,2" stroke="#94a3b8" />
                    <polygon points="15,215 20,213 20,217" />
                    <polygon points="45,215 40,213 40,217" />
                    <text x="30" y="228" textAnchor="middle">18.50</text>
                </g>
            </g>

            {/* ────────────────────────────────────────────────────────── */}
            {/* VIEW 3: RIGHT VIEW PROJECTION */}
            {/* ────────────────────────────────────────────────────────── */}
            <g id="right-view-projection" transform="translate(775, 80)">
                <text x="45" y="-15" fontSize="11" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif" textAnchor="middle">
                    RIGHT VIEW
                </text>

                <rect x="20" y="20" width="55" height="180" rx="3" fill="#ffffff" stroke="#1e293b" strokeWidth="1.8" />
                <rect x="75" y="55" width="20" height="110" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />

                <line x1="20" y1="40" x2="75" y2="40" stroke="#64748b" strokeWidth="1.0" strokeDasharray="4,2" />
                <line x1="20" y1="80" x2="75" y2="80" stroke="#64748b" strokeWidth="1.0" strokeDasharray="4,2" />
                <line x1="20" y1="140" x2="75" y2="140" stroke="#64748b" strokeWidth="1.0" strokeDasharray="4,2" />
                <line x1="20" y1="180" x2="75" y2="180" stroke="#64748b" strokeWidth="1.0" strokeDasharray="4,2" />

                <g stroke="#334155" strokeWidth="0.75" fill="#334155" fontSize="8.5" fontFamily="monospace">
                    <line x1="20" y1="215" x2="95" y2="215" />
                    <line x1="20" y1="202" x2="20" y2="218" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="95" y1="168" x2="95" y2="218" strokeDasharray="2,2" stroke="#94a3b8" />
                    <polygon points="20,215 26,213 26,217" />
                    <polygon points="95,215 89,213 89,217" />
                    <text x="58" y="228" textAnchor="middle">63.89</text>

                    <line x1="110" y1="20" x2="110" y2="200" />
                    <line x1="77" y1="20" x2="114" y2="20" strokeDasharray="2,2" stroke="#94a3b8" />
                    <line x1="77" y1="200" x2="114" y2="200" strokeDasharray="2,2" stroke="#94a3b8" />
                    <polygon points="110,20 108,26 112,26" />
                    <polygon points="110,200 108,194 112,194" />
                    <text x="107" y="115" textAnchor="middle" transform="rotate(-90 107 115)">121.50</text>
                </g>
            </g>

            {/* ────────────────────────────────────────────────────────── */}
            {/* TITLE BLOCK & GENERAL TOLERANCE (BOTTOM RIGHT) */}
            {/* ────────────────────────────────────────────────────────── */}
            <g id="drawing-title-block" transform="translate(565, 520)">
                <rect x="0" y="0" width="385" height="70" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
                <line x1="0" y1="22" x2="385" y2="22" stroke="#cbd5e1" />
                <line x1="0" y1="46" x2="385" y2="46" stroke="#cbd5e1" />
                <line x1="190" y1="0" x2="190" y2="70" stroke="#cbd5e1" />

                <text x="95" y="15" fontSize="8" fontWeight="bold" fill="#334155" textAnchor="middle">GENERAL TOLERANCE</text>
                <text x="285" y="15" fontSize="8" fontWeight="bold" fill="#334155" textAnchor="middle">ISO 2768-mK</text>

                <text x="95" y="37" fontSize="7.5" fill="#64748b" textAnchor="middle">UNIT: mm</text>
                <text x="285" y="37" fontSize="7.5" fill="#64748b" textAnchor="middle">SURFACE FINISH: Ra 3.2</text>

                <text x="95" y="60" fontSize="7.5" fill="#64748b" textAnchor="middle">SCALE: 1:1</text>
                <text x="285" y="60" fontSize="7.5" fill="#64748b" textAnchor="middle">MATERIAL: ADC12 | WT: 0.71 kg</text>

                <rect x="190" y="70" width="195" height="55" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
                <line x1="190" y1="88" x2="385" y2="88" stroke="#cbd5e1" />
                <line x1="190" y1="106" x2="385" y2="106" stroke="#cbd5e1" />
                <line x1="255" y1="70" x2="255" y2="125" stroke="#cbd5e1" />

                <text x="222" y="82" fontSize="7.5" fontWeight="bold" fill="#334155" textAnchor="middle">PART NAME</text>
                <text x="320" y="82" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">HOUSING COVER</text>

                <text x="222" y="100" fontSize="7.5" fontWeight="bold" fill="#334155" textAnchor="middle">PART NO.</text>
                <text x="320" y="100" fontSize="8" fontWeight="bold" fill="#0f172a" textAnchor="middle">HC-12527</text>

                <text x="222" y="118" fontSize="7.5" fill="#64748b" textAnchor="middle">DRAWN BY</text>
                <text x="285" y="118" fontSize="7.5" fill="#0f172a" textAnchor="middle">MAVI-CORE</text>
                <text x="350" y="118" fontSize="7.5" fill="#64748b" textAnchor="middle">15/08/2026</text>
            </g>

            {/* Bottom-Left Notes */}
            <g transform="translate(45, 595)" fontSize="7.5" fill="#475569" fontFamily="sans-serif">
                <text x="0" y="0" fontWeight="bold">NOTE:</text>
                <text x="0" y="12">1. ALL DIMENSIONS ARE IN MILLIMETERS.</text>
                <text x="0" y="24">2. UNLESS OTHERWISE SPECIFIED, GENERAL TOLERANCE ISO 2768-mK.</text>
            </g>
        </g>
    );
}

// ─────────────────────────────────────────
// FLANGE CONNECTOR DRAWING GEOMETRY
// ─────────────────────────────────────────
function FlangeDrawingGeometry() {
    return (
        <g id="flange-cad-drawing">
            <rect x="0" y="0" width="1000" height="700" fill="#ffffff" />
            <rect x="12" y="12" width="976" height="676" fill="none" stroke="#1e293b" strokeWidth="1.6" />
            <rect x="30" y="30" width="940" height="640" fill="none" stroke="#475569" strokeWidth="1.2" />
            <text x="50" y="60" fontSize="18" fontWeight="bold" fill="#0f172a">Flange Connector (CAD / 2D)</text>
            <g transform="translate(180, 100)">
                <circle cx="160" cy="180" r="110" fill="#f8fafc" stroke="#1e293b" strokeWidth="2.2" />
                <circle cx="160" cy="180" r="80" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="6,4" />
                <circle cx="160" cy="180" r="35" fill="#ffffff" stroke="#0f172a" strokeWidth="2.0" />
                <line x1="160" y1="50" x2="160" y2="310" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="10,2,2,2" />
                <line x1="30" y1="180" x2="290" y2="180" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="10,2,2,2" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, idx) => {
                    const rad = (ang * Math.PI) / 180;
                    return <circle key={idx} cx={160 + 80 * Math.cos(rad)} cy={180 + 80 * Math.sin(rad)} r="10" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />;
                })}
            </g>
            <g transform="translate(560, 140)">
                <text x="50" y="-15" fontSize="11" fontWeight="bold" fill="#0f172a">SECTION B-B</text>
                <path d="M 20,40 L 90,40 L 90,70 L 75,70 L 75,180 L 90,180 L 90,210 L 20,210 L 20,180 L 0,180 L 0,70 L 20,70 Z" fill="#f1f5f9" stroke="#1e293b" strokeWidth="2" />
            </g>
        </g>
    );
}

// ─────────────────────────────────────────
// HYDRAULIC CYLINDER DRAWING GEOMETRY
// ─────────────────────────────────────────
function HydraulicCylinderDrawingGeometry() {
    return (
        <g id="hydraulic-cyl-drawing">
            <rect x="0" y="0" width="1000" height="700" fill="#ffffff" />
            <rect x="12" y="12" width="976" height="676" fill="none" stroke="#1e293b" strokeWidth="1.6" />
            <rect x="30" y="30" width="940" height="640" fill="none" stroke="#475569" strokeWidth="1.2" />
            <text x="50" y="60" fontSize="18" fontWeight="bold" fill="#0f172a">Hydraulic Cylinder Assembly (PDF)</text>
            <g transform="translate(160, 160)">
                <rect x="40" y="60" width="380" height="150" rx="4" fill="#f8fafc" stroke="#1e293b" strokeWidth="2.2" />
                <rect x="420" y="90" width="220" height="90" rx="3" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.0" />
                <circle cx="660" cy="135" r="22" fill="#f1f5f9" stroke="#1e293b" strokeWidth="2.0" />
                <line x1="20" y1="135" x2="690" y2="135" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="10,2,2,2" />
            </g>
        </g>
    );
}

// ─────────────────────────────────────────
// COMPREHENSIVE CAD BLUEPRINT 2D VIEWER (ULTRA FAST LIGHTWEIGHT)
// ─────────────────────────────────────────
export function CADBlueprintViewer({
    fileUrl,
    appVariables = [],
    setAppVariables,
    onAddDimension,
    onSelectDimension,
    activeDimId: propActiveDimId
}) {
    const [zoom, setZoom] = useState(1.0);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [selectedDimKey, setSelectedDimKey] = useState(null);

    // List of drawings from database / LocalStorage
    const [drawingsList, setDrawingsList] = useState(() => {
        try {
            const saved = localStorage.getItem('mavi_drawings');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Auto load drawings from database on mount
    useEffect(() => {
        let mounted = true;
        getAllDrawings().then(dbDrawings => {
            if (mounted && Array.isArray(dbDrawings) && dbDrawings.length > 0) {
                setDrawingsList(dbDrawings);
            }
        }).catch(() => {});

        const handleSync = () => {
            getAllDrawings().then(dbDrawings => {
                if (mounted && Array.isArray(dbDrawings)) setDrawingsList(dbDrawings);
            }).catch(() => {});
        };
        window.addEventListener('mavi_drawings_updated', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            mounted = false;
            window.removeEventListener('mavi_drawings_updated', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);

    // Selected drawing resolution
    const [activeDrawingId, setActiveDrawingId] = useState(() => {
        return fileUrl || localStorage.getItem('mavi_selected_dwg_id') || 'dwg_housing_cover';
    });

    useEffect(() => {
        if (fileUrl) {
            setActiveDrawingId(fileUrl);
        }
    }, [fileUrl]);

    const selectedDwg = useMemo(() => {
        if (activeDrawingId) {
            const found = drawingsList.find(d =>
                d.id === activeDrawingId ||
                d.fileName === activeDrawingId ||
                d.file_name === activeDrawingId ||
                d.name === activeDrawingId
            );
            if (found) return found;
        }
        return drawingsList[0] || null;
    }, [drawingsList, activeDrawingId]);

    // Active dimension key from appVariables
    const activeVariable = appVariables.find(v => v.name === 'Active_Dimension_Key')?.value;
    const activeDimId = propActiveDimId || selectedDimKey || activeVariable || (selectedDwg?.dimensions?.[0]?.id || 'tag_label_902');

    // Pan and Zoom handlers
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(prev => Math.max(0.4, Math.min(3.5, +(prev + delta).toFixed(2))));
    };

    const handleMouseDown = (e) => {
        if (e.button === 1 || e.button === 2 || (e.button === 0 && (e.target.tagName === 'svg' || e.target.id === 'blueprint-canvas-bg'))) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    };

    const handleMouseUp = () => setIsPanning(false);

    // Dimension selection handler
    const handleSelectDim = (dim) => {
        if (!dim) return;
        setSelectedDimKey(dim.id);
        if (onSelectDimension) {
            onSelectDimension(dim.id);
        }
        if (setAppVariables && dim.variable) {
            setAppVariables(prev => prev.map(v =>
                v.name === 'Active_Dimension_Key'
                    ? { ...v, value: dim.variable }
                    : v
            ));
        }
    };

    // Calculate validation status for a QC dimension
    const getDimStatus = (dim) => {
        if (!dim || !dim.variable) return 'PENDING';
        const v = appVariables.find(x => x.name === dim.variable);
        const val = parseFloat(v?.value);
        if (isNaN(val) || val === 0) return 'PENDING';
        if (dim.tolMin !== undefined && dim.tolMax !== undefined) {
            return (val >= dim.tolMin && val <= dim.tolMax) ? 'PASS' : 'FAIL';
        }
        return 'PASS';
    };

    // Rasterized PDF / Image support
    const rawDataUrl = selectedDwg?.dataUrl || selectedDwg?.data_url;
    const [pdfBackdropUrl, setPdfBackdropUrl] = useState(null);

    useEffect(() => {
        let active = true;
        if (selectedDwg && (selectedDwg.fileType === 'PDF' || selectedDwg.fileName?.toLowerCase().endsWith('.pdf')) && rawDataUrl) {
            if (rawDataUrl.startsWith('data:image/')) {
                setPdfBackdropUrl(rawDataUrl);
            } else if (rawDataUrl.startsWith('data:application/pdf') || rawDataUrl.startsWith('blob:') || rawDataUrl.startsWith('http')) {
                convertPdfToImageDataUrl(rawDataUrl, 2.5).then(imgUrl => {
                    if (active) setPdfBackdropUrl(imgUrl);
                }).catch(err => console.warn('PDF backdrop render error:', err));
            }
        } else {
            setPdfBackdropUrl(null);
        }
        return () => { active = false; };
    }, [selectedDwg, rawDataUrl]);

    const activeImageSrc = pdfBackdropUrl || (rawDataUrl && typeof rawDataUrl === 'string' && (rawDataUrl.startsWith('data:image/') || rawDataUrl.startsWith('http')) ? rawDataUrl : null);

    // Dimensions to render
    const dimensions = useMemo(() => {
        if (selectedDwg && Array.isArray(selectedDwg.dimensions) && selectedDwg.dimensions.length > 0) {
            return selectedDwg.dimensions;
        }
        return [
            { id: 'tag_label_902', label: 'LABEL 902', spec: '902', tolMin: 900, tolMax: 905, variable: 'QC_Label_902', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: '🏷️', x1: 200, y1: 135, lx: 275, ly: 120 },
            { id: 'tag_dim_3523', label: 'Hole Position 35.23', spec: '35.23', tolMin: 35.0, tolMax: 35.5, variable: 'Meas_Hole_3523', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 415, y1: 410, lx: 560, ly: 470 },
            { id: 'tag_dim_21601', label: 'Overall Height 216.01', spec: '216.01', tolMin: 215.8, tolMax: 216.2, variable: 'Meas_Height_21601', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 805, y1: 140, lx: 925, ly: 270 }
        ];
    }, [selectedDwg]);

    const isHousingCover = selectedDwg?.id === 'dwg_housing_cover' || !selectedDwg || (!activeImageSrc && selectedDwg?.id === 'dwg_product_checking');
    const isFlange = selectedDwg?.id === 'dwg_flange_connector';
    const isCylinder = selectedDwg?.id === 'dwg_hydraulic_cylinder';

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                userSelect: 'none',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={e => e.preventDefault()}
        >
            {/* ────────────────────────────────────────────────────────── */}
            {/* MAIN CANVAS AREA (FULL BLEED EDGE-TO-EDGE) */}
            {/* ────────────────────────────────────────────────────────── */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                cursor: isPanning ? 'grabbing' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff'
            }}>
                <svg
                    id="blueprint-canvas-bg"
                    viewBox="0 0 1000 700"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background Base */}
                    <rect x="0" y="0" width="1000" height="700" fill="#ffffff" />

                    {/* Transform Group for Pan & Zoom */}
                    <g transform={`translate(${500 + panOffset.x}, ${350 + panOffset.y}) scale(${zoom}) translate(-500, -350)`}>
                        
                        {/* Render Technical Drawing Geometry Based on Selected Drawing from Menu Drawing */}
                        {activeImageSrc ? (
                            <g id="uploaded-drawing-backdrop">
                                <image
                                    href={activeImageSrc}
                                    x="0"
                                    y="0"
                                    width="1000"
                                    height="700"
                                    preserveAspectRatio={selectedDwg?.stretchFill ? "none" : "xMidYMid meet"}
                                />
                            </g>
                        ) : isHousingCover ? (
                            <HousingCoverDrawingSheet />
                        ) : isFlange ? (
                            <FlangeDrawingGeometry />
                        ) : isCylinder ? (
                            <HydraulicCylinderDrawingGeometry />
                        ) : (
                            <g id="generic-drawing-sheet">
                                <rect x="0" y="0" width="1000" height="700" fill="#ffffff" />
                                <rect x="12" y="12" width="976" height="676" fill="none" stroke="#1e293b" strokeWidth="1.6" />
                                <rect x="30" y="30" width="940" height="640" fill="none" stroke="#475569" strokeWidth="1.2" />
                                <text x="500" y="350" textAnchor="middle" fill="#64748b" fontSize="16" fontWeight="bold">
                                    {selectedDwg?.name || 'Technical Drawing Blueprint'}
                                </text>
                            </g>
                        )}

                        {/* ────────────────────────────────────────────────── */}
                        {/* INTERACTIVE QC PARAMETERS & DIMENSION BADGES */}
                        {/* ────────────────────────────────────────────────── */}
                        {dimensions.map((dim, idx) => {
                            const status = getDimStatus(dim);
                            const isSelected = activeDimId === dim.id || activeDimId === dim.variable;

                            const x1 = dim.x1 !== undefined ? dim.x1 : 200 + (idx * 120);
                            const y1 = dim.y1 !== undefined ? dim.y1 : 180 + (idx * 40);
                            const lx = dim.lx !== undefined ? dim.lx : x1 + 60;
                            const ly = dim.ly !== undefined ? dim.ly : y1 - 20;

                            const measuredVal = appVariables.find(v => v.name === dim.variable)?.value;
                            const displayValue = measuredVal ? `${measuredVal} ${dim.unit || ''}` : (dim.spec ? `${dim.spec} ${dim.unit || ''}` : '--');

                            const isLabelTag = dim.id?.includes('label') || dim.category === 'custom' || dim.category === 'datum';
                            const badgeWidth = Math.max(76, (dim.label?.length || 8) * 6.5 + 24);
                            const badgeHeight = 28;

                            const borderColor = isSelected ? '#00e5a3' : (status === 'FAIL' ? '#ef4444' : '#10b981');

                            return (
                                <g
                                    key={dim.id || `dim_${idx}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectDim(dim);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Leader line connecting contact point (x1, y1) to balloon (lx, ly) */}
                                    <line
                                        x1={x1}
                                        y1={y1}
                                        x2={lx}
                                        y2={ly}
                                        stroke={borderColor}
                                        strokeWidth="1.4"
                                        strokeDasharray={isSelected ? 'none' : '3,2'}
                                    />
                                    <circle cx={x1} cy={y1} r="3.5" fill={borderColor} />

                                    {/* Active selection box & resize corner handles */}
                                    {isSelected && (
                                        <>
                                            <rect
                                                x={lx - badgeWidth / 2 - 6}
                                                y={ly - badgeHeight / 2 - 6}
                                                width={badgeWidth + 12}
                                                height={badgeHeight + 12}
                                                rx="6"
                                                fill="none"
                                                stroke="#38bdf8"
                                                strokeWidth="1.2"
                                                strokeDasharray="4,2"
                                            />
                                            <circle cx={lx - badgeWidth / 2 - 6} cy={ly - badgeHeight / 2 - 6} r="2.5" fill="#38bdf8" />
                                            <circle cx={lx + badgeWidth / 2 + 6} cy={ly - badgeHeight / 2 - 6} r="2.5" fill="#38bdf8" />
                                            <circle cx={lx - badgeWidth / 2 - 6} cy={ly + badgeHeight / 2 + 6} r="2.5" fill="#38bdf8" />
                                            <circle cx={lx + badgeWidth / 2 + 6} cy={ly + badgeHeight / 2 + 6} r="2.5" fill="#38bdf8" />
                                        </>
                                    )}

                                    {/* Top Pill / Floating Label if configured */}
                                    {isLabelTag && (
                                        <g transform={`translate(${lx - 35}, ${ly - 24})`}>
                                            <rect
                                                x="0"
                                                y="0"
                                                width="70"
                                                height="15"
                                                rx="4"
                                                fill="#1e1b4b"
                                                stroke="#a855f7"
                                                strokeWidth="1"
                                            />
                                            <circle cx="8" cy="7.5" r="2.5" fill="#ec4899" />
                                            <text
                                                x="15"
                                                y="11"
                                                fill="#e0e7ff"
                                                fontSize="8"
                                                fontWeight="900"
                                                fontFamily="'Inter', sans-serif"
                                            >
                                                {dim.label || 'LABEL'}
                                            </text>
                                        </g>
                                    )}

                                    {/* Main Dark Capsule Badge Body with Neon Border */}
                                    <rect
                                        x={lx - badgeWidth / 2}
                                        y={ly - badgeHeight / 2}
                                        width={badgeWidth}
                                        height={badgeHeight}
                                        rx="6"
                                        fill="#091426"
                                        stroke={borderColor}
                                        strokeWidth={isSelected ? '2.5' : '1.8'}
                                        style={{
                                            filter: isSelected
                                                ? 'drop-shadow(0 0 10px rgba(0, 229, 163, 0.6))'
                                                : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5))',
                                            transition: 'all 0.15s ease'
                                        }}
                                    />

                                    {/* Badge Inner Content */}
                                    <g transform={`translate(${lx}, ${ly})`}>
                                        <text
                                            x="0"
                                            y="4"
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="10"
                                            fontWeight="bold"
                                            fontFamily="'Inter', monospace"
                                        >
                                            {displayValue}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────
// RUNTIME LIVE PLAYER EXPORT
// ─────────────────────────────────────────
export function CADViewer3D({ fileUrl, appVariables = [], setAppVariables }) {
    return (
        <CADBlueprintViewer
            fileUrl={fileUrl}
            appVariables={appVariables}
            setAppVariables={setAppVariables}
        />
    );
}

// ─────────────────────────────────────────
// DESIGNER / EDITOR EXPORT
// ─────────────────────────────────────────
export function CADViewer3DEditor({ drawing, dimensions = [], activeDimId, onAddDimension, onSelectDimension }) {
    return (
        <CADBlueprintViewer
            fileUrl={drawing?.id || drawing?.fileName}
            activeDimId={activeDimId}
            onAddDimension={onAddDimension}
            onSelectDimension={onSelectDimension}
        />
    );
}

export default CADBlueprintViewer;
