/**
 * hydraulicCylinderInspectionTemplate.js
 * Template App Builder untuk inspeksi hydraulic cylinder.
 * Menggunakan hanya widget type yang valid di LiveTerminal/AppPlayer:
 * HEADING, TEXT, TEXT_INPUT, NUMBER_INPUT, TEXT_AREA, DROPDOWN, BUTTON, CAD_VIEWER, SIGNATURE
 */

export function createHydraulicCylinderInspectionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = { hcInspections: 'tbl_hc_inspections' };

    // ── VARIABLES ─────────────────────────────────────────────────────────────
    const V = [
        { id: `v_wo_${ts}`,      name: 'Work_Order',       type: 'string', defaultValue: 'WO-HC-2026-001', persisted: true },
        { id: `v_pn_${ts}`,      name: 'Part_Number',      type: 'string', defaultValue: 'HC-2024-001',    persisted: true },
        { id: `v_sn_${ts}`,      name: 'Serial_Number',    type: 'string', defaultValue: '',               persisted: true },
        { id: `v_op_${ts}`,      name: 'Operator',         type: 'string', defaultValue: '',               persisted: true },
        { id: `v_shift_${ts}`,   name: 'Shift',            type: 'string', defaultValue: 'Pagi',           persisted: true },
        // 2D Dims
        { id: `v_bore_${ts}`,    name: 'Bore_Diameter',    type: 'number', defaultValue: 0, persisted: false },
        { id: `v_rod_${ts}`,     name: 'Rod_Diameter',     type: 'number', defaultValue: 0, persisted: false },
        { id: `v_stroke_${ts}`,  name: 'Stroke_Length',    type: 'number', defaultValue: 0, persisted: false },
        { id: `v_oal_${ts}`,     name: 'OAL_Closed',       type: 'number', defaultValue: 0, persisted: false },
        { id: `v_oalx_${ts}`,    name: 'OAL_Extended',     type: 'number', defaultValue: 0, persisted: false },
        // Function Test
        { id: `v_fex_${ts}`,     name: 'Func_Extend',      type: 'string', defaultValue: '', persisted: false },
        { id: `v_frt_${ts}`,     name: 'Func_Retract',     type: 'string', defaultValue: '', persisted: false },
        { id: `v_fleak_${ts}`,   name: 'Func_Leakage',     type: 'string', defaultValue: '', persisted: false },
        { id: `v_fcush_${ts}`,   name: 'Func_Cushion',     type: 'string', defaultValue: '', persisted: false },
        // Pressure Test
        { id: `v_pproof_${ts}`,  name: 'Press_Proof',      type: 'number', defaultValue: 0, persisted: false },
        { id: `v_pburst_${ts}`,  name: 'Press_Burst',      type: 'number', defaultValue: 0, persisted: false },
        { id: `v_pwork_${ts}`,   name: 'Press_Working',    type: 'number', defaultValue: 0, persisted: false },
        { id: `v_pleak_${ts}`,   name: 'Press_LeakCheck',  type: 'string', defaultValue: '', persisted: false },
        // Visual
        { id: `v_vrod_${ts}`,    name: 'Visual_Rod',       type: 'string', defaultValue: '', persisted: false },
        { id: `v_vpiston_${ts}`, name: 'Visual_Piston',    type: 'string', defaultValue: '', persisted: false },
        { id: `v_vseal_${ts}`,   name: 'Visual_Seal',      type: 'string', defaultValue: '', persisted: false },
        { id: `v_vweld_${ts}`,   name: 'Visual_Weld',      type: 'string', defaultValue: '', persisted: false },
        // Stroke
        { id: `v_smeas_${ts}`,   name: 'Stroke_Measured',  type: 'number', defaultValue: 0, persisted: false },
        { id: `v_sdev_${ts}`,    name: 'Stroke_Deviation', type: 'number', defaultValue: 0, persisted: false },
        // Overall
        { id: `v_result_${ts}`,  name: 'Overall_Result',   type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `v_notes_${ts}`,   name: 'Notes',            type: 'string', defaultValue: '', persisted: false },
        { id: `v_sig_${ts}`,     name: 'Signature',        type: 'string', defaultValue: '', persisted: false },
    ];

    // ── STEP 1: HEADER & IDENTIFIKASI ─────────────────────────────────────────
    const stepHeader = {
        id: `s_header_${ts}`, title: '1. Identifikasi Cylinder', stepType: 'Step',
        components: [
            { id: `h_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 40,
              props: { text: '🔧 Hydraulic Cylinder Inspection — Identifikasi Komponen', fontSize: 22, fontWeight: 'bold', color: '#1e293b' } },
            { id: `h_sub_${ts}`, type: 'TEXT', x: 20, y: 60, w: 920, h: 25,
              props: { text: 'Isi data identifikasi cylinder sebelum memulai proses inspeksi. Pastikan part number dan serial number sesuai work order.', fontSize: 13, color: '#64748b' } },
            // Spec card
            { id: `h_spec_${ts}`, type: 'TEXT', x: 20, y: 95, w: 440, h: 370,
              props: { text: '📦 SPESIFIKASI TEKNIS CYLINDER\n\nBore Diameter : Ø80 mm  (±0.020)\nRod Diameter  : Ø56 mm  (±0.015)\nStroke Length : 500 mm  (±0.500)\nWorking Press : 160 bar\nTest Pressure : 250 bar (Proof)\nBurst Pressure: 350 bar\nMounting Type : Clevis / Flange\nFluid Medium  : Hydraulic Oil ISO VG46\nTemp. Range   : -20°C ~ +80°C\nDrawing No    : DWG-HC-001-R2\nRevision      : Rev A\nStandard      : ISO 10100', fontSize: 13, fontFamily: 'monospace', backgroundColor: '#f0f9ff', color: '#1e293b', padding: '20px', borderRadius: '10px' } },
            // Form inputs
            { id: `h_lbl_wo_${ts}`, type: 'TEXT', x: 480, y: 95, w: 200, h: 22, props: { text: 'Work Order', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `h_inp_wo_${ts}`, type: 'TEXT_INPUT', x: 480, y: 117, w: 200, h: 38, props: { variable: `v_wo_${ts}`, placeholder: 'WO-HC-2026-001' } },
            { id: `h_lbl_pn_${ts}`, type: 'TEXT', x: 690, y: 95, w: 250, h: 22, props: { text: 'Part Number', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `h_inp_pn_${ts}`, type: 'TEXT_INPUT', x: 690, y: 117, w: 250, h: 38, props: { variable: `v_pn_${ts}`, placeholder: 'HC-2024-001' } },
            { id: `h_lbl_sn_${ts}`, type: 'TEXT', x: 480, y: 165, w: 200, h: 22, props: { text: 'Serial Number', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `h_inp_sn_${ts}`, type: 'TEXT_INPUT', x: 480, y: 187, w: 200, h: 38, props: { variable: `v_sn_${ts}`, placeholder: 'SN-XXXXXXXX' } },
            { id: `h_lbl_op_${ts}`, type: 'TEXT', x: 690, y: 165, w: 250, h: 22, props: { text: 'Nama Operator QC', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `h_inp_op_${ts}`, type: 'TEXT_INPUT', x: 690, y: 187, w: 250, h: 38, props: { variable: `v_op_${ts}`, placeholder: 'Nama Operator' } },
            { id: `h_lbl_sh_${ts}`, type: 'TEXT', x: 480, y: 235, w: 460, h: 22, props: { text: 'Shift Kerja', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `h_inp_sh_${ts}`, type: 'DROPDOWN', x: 480, y: 257, w: 460, h: 38, props: { variable: `v_shift_${ts}`, options: ['Pagi (06:00-14:00)', 'Siang (14:00-22:00)', 'Malam (22:00-06:00)'] } },
            { id: `h_info_${ts}`, type: 'TEXT', x: 480, y: 310, w: 460, h: 60,
              props: { text: 'ℹ️ Pastikan cylinder sudah dibersihkan dan didinginkan sebelum inspeksi. Semua alat ukur harus terkalibrasi dan dalam masa berlaku.', fontSize: 12, color: '#1e3a5f', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px' } },
            { id: `h_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 440, w: 160, h: 44,
              props: { label: 'Mulai Inspeksi →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px',
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 2: 2D DRAWING & DIMENSI ──────────────────────────────────────────
    const stepDim2D = {
        id: `s_dim2d_${ts}`, title: '2. 2D Drawing & Dimensi', stepType: 'Step',
        components: [
            { id: `d_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '📐 2D Drawing — Pengukuran Dimensi Cylinder', fontSize: 20, fontWeight: 'bold' } },
            // CAD 2D Blueprint viewer
            { id: `d_cad_${ts}`, type: 'CAD_VIEWER', x: 20, y: 58, w: 580, h: 300,
              props: { fileUrl: 'interactive-2d-blueprint', title: 'Blueprint 2D — HC-2024-001 Cross Section' } },
            // Spec table
            { id: `d_spec_${ts}`, type: 'TEXT', x: 614, y: 58, w: 330, h: 300,
              props: { text: 'DIMENSI   | NOMINAL  | TOL\n─────────────────────────\nBore Ø    | 80.000   | ±0.020\nRod Ø     | 56.000   | ±0.015\nStroke    | 500.000  | ±0.500\nOAL Close | 680.000  | ±1.000\nOAL Ext   | 1180.000 | ±1.000\nMt Hole Ø | 40.000   | ±0.025\nWall Thk  | 12.000   | ±0.200\nSeal Grv  | 4.500    | ±0.050', fontSize: 11, fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#a3e635', padding: '16px', borderRadius: '8px' } },
            // Input fields
            { id: `d_lbl1_${ts}`, type: 'TEXT', x: 20, y: 372, w: 175, h: 20, props: { text: 'Bore Diameter aktual (mm)', fontSize: 11, color: '#64748b', fontWeight: '600' } },
            { id: `d_inp1_${ts}`, type: 'NUMBER_INPUT', x: 20, y: 394, w: 175, h: 38, props: { variable: `v_bore_${ts}`, placeholder: '80.000', unit: 'mm' } },
            { id: `d_lbl2_${ts}`, type: 'TEXT', x: 205, y: 372, w: 175, h: 20, props: { text: 'Rod Diameter aktual (mm)', fontSize: 11, color: '#64748b', fontWeight: '600' } },
            { id: `d_inp2_${ts}`, type: 'NUMBER_INPUT', x: 205, y: 394, w: 175, h: 38, props: { variable: `v_rod_${ts}`, placeholder: '56.000', unit: 'mm' } },
            { id: `d_lbl3_${ts}`, type: 'TEXT', x: 390, y: 372, w: 175, h: 20, props: { text: 'Stroke Length aktual (mm)', fontSize: 11, color: '#64748b', fontWeight: '600' } },
            { id: `d_inp3_${ts}`, type: 'NUMBER_INPUT', x: 390, y: 394, w: 175, h: 38, props: { variable: `v_stroke_${ts}`, placeholder: '500.000', unit: 'mm' } },
            { id: `d_lbl4_${ts}`, type: 'TEXT', x: 575, y: 372, w: 175, h: 20, props: { text: 'OAL Closed (mm)', fontSize: 11, color: '#64748b', fontWeight: '600' } },
            { id: `d_inp4_${ts}`, type: 'NUMBER_INPUT', x: 575, y: 394, w: 175, h: 38, props: { variable: `v_oal_${ts}`, placeholder: '680.000', unit: 'mm' } },
            { id: `d_lbl5_${ts}`, type: 'TEXT', x: 760, y: 372, w: 185, h: 20, props: { text: 'OAL Extended (mm)', fontSize: 11, color: '#64748b', fontWeight: '600' } },
            { id: `d_inp5_${ts}`, type: 'NUMBER_INPUT', x: 760, y: 394, w: 185, h: 38, props: { variable: `v_oalx_${ts}`, placeholder: '1180.000', unit: 'mm' } },
            { id: `d_warn_${ts}`, type: 'TEXT', x: 20, y: 446, w: 920, h: 38,
              props: { text: '⚠️ Toleransi: Bore ±0.020 | Rod ±0.015 | Stroke ±0.500 | OAL ±1.000 mm. Gunakan mikrometer & jangka sorong terkalibrasi.', fontSize: 12, color: '#92400e', backgroundColor: '#fef3c7', padding: '10px 16px', borderRadius: '6px' } },
            { id: `d_btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 500, w: 130, h: 40, props: { label: '← Kembali', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
            { id: `d_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 500, w: 130, h: 40, props: { label: 'GD&T 3D →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 3: 3D / GD&T ─────────────────────────────────────────────────────
    const stepDim3D = {
        id: `s_dim3d_${ts}`, title: '3. 3D View & GD&T', stepType: 'Step',
        components: [
            { id: `g_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '🔷 3D Isometric View & GD&T — Geometric Dimensioning & Tolerancing', fontSize: 19, fontWeight: 'bold' } },
            { id: `g_cad_${ts}`, type: 'CAD_VIEWER', x: 20, y: 58, w: 540, h: 300,
              props: { fileUrl: 'interactive-3d-cad', title: '3D Isometric — HC-2024-001' } },
            { id: `g_tbl_${ts}`, type: 'TEXT', x: 574, y: 58, w: 370, h: 300,
              props: { text: 'GD&T CHARACTERISTIC      | SYM | MAX mm\n────────────────────────────────────\nCylindricity — Bore      | ⌭   | 0.020\nStraightness — Rod       | —   | 0.030\nTotal Runout — Rod       | ⌰   | 0.050\nPerpendicul. — End Cap   | ⊥   | 0.050\nParallelism — Mnt Holes  | ∥   | 0.100\nConcentricity — Bore/OD  | ◎   | 0.030\nFlatness — Flange Face   | ⏥   | 0.040\n\nAlat Ukur:\n• CMM (Coordinate Measuring Machine)\n• Roundness Tester\n• Dial Indicator + V-Block\n• Height Gauge', fontSize: 11, fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#a3e635', padding: '14px', borderRadius: '8px' } },
            { id: `g_info_${ts}`, type: 'TEXT', x: 20, y: 370, w: 920, h: 55,
              props: { text: '📌 CARA BACA GD&T: Semua nilai adalah nilai MAKSIMUM yang diperbolehkan (actual ≤ nominal toleransi).\n• Cylindricity & Runout → gunakan CMM | Straightness → Dial Indicator + V-block | Perpendicularity & Parallelism → CMM\n• Catat nomor sertifikat kalibrasi alat ukur pada kolom catatan laporan akhir.', fontSize: 12, color: '#1e3a5f', backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '6px' } },
            { id: `g_btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 445, w: 130, h: 40, props: { label: '← 2D Dimensi', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
            { id: `g_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 445, w: 130, h: 40, props: { label: 'Function Test →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 4: FUNCTION TEST ─────────────────────────────────────────────────
    const stepFunc = {
        id: `s_func_${ts}`, title: '4. Function Test', stepType: 'Step',
        components: [
            { id: `f_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '⚙️ Function Test — Pengujian Fungsional Cylinder', fontSize: 20, fontWeight: 'bold' } },
            { id: `f_cond_${ts}`, type: 'TEXT', x: 20, y: 58, w: 920, h: 44,
              props: { text: '🔧 KONDISI PENGUJIAN: Fluida: Hydraulic Oil ISO VG46 | Temp Fluida: 40°C ±5°C | Tekanan Kerja: 160 bar | Siklus Pemanasan: 10 siklus sebelum pengujian dimulai', fontSize: 12, color: '#065f46', backgroundColor: '#d1fae5', padding: '12px 16px', borderRadius: '6px' } },
            { id: `f_list_${ts}`, type: 'TEXT', x: 20, y: 115, w: 580, h: 330,
              props: { text: '📋 DAFTAR PENGUJIAN FUNGSIONAL\n\n1. EXTEND NO LOAD\n   Spesifikasi : Gerakan mulus tanpa beban\n   Hasil       : (input di samping)\n\n2. RETRACT NO LOAD\n   Spesifikasi : Gerakan mulus tanpa beban\n   Hasil       : (input di samping)\n\n3. EXTEND FULL LOAD @ 140 bar\n   Spesifikasi : Waktu ≤ 5 detik\n\n4. RETRACT FULL LOAD @ 140 bar\n   Spesifikasi : Waktu ≤ 4 detik\n\n5. INTERNAL LEAKAGE TEST\n   Spesifikasi : ≤ 5 ml/menit @ working pressure\n   Hasil       : (input di samping)\n\n6. EXTERNAL LEAKAGE (Rod Seal)\n   Spesifikasi : No leak visible\n\n7. CUSHIONING END STROKE\n   Spesifikasi : Deselerasi halus, no shock/bang\n   Hasil       : (input di samping)', fontSize: 12, fontFamily: 'monospace', backgroundColor: '#f8fafc', color: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' } },
            // Dropdowns
            { id: `f_lbl_ex_${ts}`, type: 'TEXT', x: 614, y: 115, w: 330, h: 22, props: { text: '1. Hasil Extend No Load', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `f_inp_ex_${ts}`, type: 'DROPDOWN', x: 614, y: 137, w: 330, h: 38, props: { variable: `v_fex_${ts}`, options: ['-- Pilih --', 'PASS — Mulus & konsisten', 'FAIL — Stick / Jerk', 'FAIL — Berhenti di tengah', 'FAIL — Gerakan tidak merata', 'N/A'] } },
            { id: `f_lbl_rt_${ts}`, type: 'TEXT', x: 614, y: 188, w: 330, h: 22, props: { text: '2. Hasil Retract No Load', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `f_inp_rt_${ts}`, type: 'DROPDOWN', x: 614, y: 210, w: 330, h: 38, props: { variable: `v_frt_${ts}`, options: ['-- Pilih --', 'PASS — Mulus & konsisten', 'FAIL — Stick / Jerk', 'FAIL — Berhenti di tengah', 'FAIL — Gerakan tidak merata', 'N/A'] } },
            { id: `f_lbl_lk_${ts}`, type: 'TEXT', x: 614, y: 261, w: 330, h: 22, props: { text: '5. Hasil Internal Leakage', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `f_inp_lk_${ts}`, type: 'DROPDOWN', x: 614, y: 283, w: 330, h: 38, props: { variable: `v_fleak_${ts}`, options: ['-- Pilih --', 'PASS — ≤ 5 ml/min', 'FAIL — 5–20 ml/min', 'FAIL — > 20 ml/min', 'FAIL — Bocor besar', 'N/A'] } },
            { id: `f_lbl_cu_${ts}`, type: 'TEXT', x: 614, y: 334, w: 330, h: 22, props: { text: '7. Hasil Cushioning', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `f_inp_cu_${ts}`, type: 'DROPDOWN', x: 614, y: 356, w: 330, h: 38, props: { variable: `v_fcush_${ts}`, options: ['-- Pilih --', 'PASS — Halus & terkontrol', 'FAIL — Ada benturan keras', 'FAIL — No cushion effect', 'N/A'] } },
            { id: `f_btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 468, w: 130, h: 40, props: { label: '← GD&T', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
            { id: `f_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 468, w: 130, h: 40, props: { label: 'Pressure Test →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 5: PRESSURE TEST ─────────────────────────────────────────────────
    const stepPressure = {
        id: `s_press_${ts}`, title: '5. Pressure Test', stepType: 'Step',
        components: [
            { id: `p_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '🔴 Pressure Test — Pengujian Tekanan Hidraulik', fontSize: 20, fontWeight: 'bold' } },
            { id: `p_spec_${ts}`, type: 'TEXT', x: 20, y: 58, w: 920, h: 88,
              props: { text: '⚡ FASE PENGUJIAN TEKANAN:\n\n• PROOF PRESSURE   : 250 bar | Hold Time: 30 detik  | Kriteria: No Leak, No Permanent Deformation\n• BURST PRESSURE   : 350 bar | Hold Time: 10 detik  | Kriteria: No Rupture, No Major Leak\n• WORKING PRESSURE : 160 bar | Hold Time: 120 detik | Kriteria: No External Leak\n• MINIMUM PRESSURE :  20 bar | Hold Time: 60 detik  | Kriteria: Full Stroke Movement', fontSize: 12, fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#fbbf24', padding: '14px', borderRadius: '8px' } },
            // Number inputs for pressure
            { id: `p_lbl_pf_${ts}`, type: 'TEXT', x: 20, y: 162, w: 215, h: 22, props: { text: '① Proof Pressure aktual (bar)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `p_inp_pf_${ts}`, type: 'NUMBER_INPUT', x: 20, y: 184, w: 215, h: 40, props: { variable: `v_pproof_${ts}`, placeholder: '250.0', unit: 'bar' } },
            { id: `p_lbl_bs_${ts}`, type: 'TEXT', x: 248, y: 162, w: 215, h: 22, props: { text: '② Burst Pressure aktual (bar)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `p_inp_bs_${ts}`, type: 'NUMBER_INPUT', x: 248, y: 184, w: 215, h: 40, props: { variable: `v_pburst_${ts}`, placeholder: '350.0', unit: 'bar' } },
            { id: `p_lbl_wk_${ts}`, type: 'TEXT', x: 476, y: 162, w: 215, h: 22, props: { text: '③ Working Pressure aktual (bar)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `p_inp_wk_${ts}`, type: 'NUMBER_INPUT', x: 476, y: 184, w: 215, h: 40, props: { variable: `v_pwork_${ts}`, placeholder: '160.0', unit: 'bar' } },
            { id: `p_lbl_lk_${ts}`, type: 'TEXT', x: 704, y: 162, w: 240, h: 22, props: { text: '④ Hasil Cek Kebocoran Keseluruhan', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `p_inp_lk_${ts}`, type: 'DROPDOWN', x: 704, y: 184, w: 240, h: 40, props: { variable: `v_pleak_${ts}`, options: ['-- Pilih --', 'No Leak — PASS', 'Minor Seep (< 0.1ml) — MARGINAL', 'Visible Leak — FAIL', 'Major Leak — FAIL', 'Rupture — FAIL CRITICAL'] } },
            // Summary display
            { id: `p_sum_${ts}`, type: 'TEXT', x: 20, y: 240, w: 920, h: 140,
              props: { text: '📊 HASIL PRESSURE TEST\n\nProof Pressure  (250 bar / 30s)   : {{@Press_Proof}} bar\nBurst Pressure  (350 bar / 10s)   : {{@Press_Burst}} bar\nWorking Pressure(160 bar / 120s)  : {{@Press_Working}} bar\nLeak Check Result                 : {{@Press_LeakCheck}}\n\nKRITERIA KELULUSAN:\n✅ PASS  : Semua tekanan ≥ target, tidak ada kebocoran eksternal\n❌ FAIL  : Tekanan di bawah target ATAU terdapat kebocoran / deformasi', fontSize: 12, fontFamily: 'monospace', backgroundColor: '#f8fafc', color: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' } },
            { id: `p_warn_${ts}`, type: 'TEXT', x: 20, y: 395, w: 920, h: 40,
              props: { text: '⚠️ KESELAMATAN KERJA: Wajib APD (kacamata, sarung tangan, jaket hydraulic). Pastikan area steril dari personil saat pressure test berlangsung. Jangan melebihi tekanan burst tanpa safety guard terpasang.', fontSize: 12, color: '#991b1b', backgroundColor: '#fee2e2', padding: '10px 16px', borderRadius: '6px' } },
            { id: `p_btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 460, w: 130, h: 40, props: { label: '← Function', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
            { id: `p_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 460, w: 130, h: 40, props: { label: 'Visual Rod →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 6: VISUAL ROD & PISTON ───────────────────────────────────────────
    const stepVisual = {
        id: `s_visual_${ts}`, title: '6. Visual Rod & Piston', stepType: 'Step',
        components: [
            { id: `vi_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '👁️ Visual Inspection — Rod, Piston, Seal & Weld', fontSize: 20, fontWeight: 'bold' } },
            // CAD viewer as diagram reference
            { id: `vi_cad_${ts}`, type: 'CAD_VIEWER', x: 20, y: 58, w: 920, h: 175,
              props: { fileUrl: 'interactive-2d-blueprint', title: 'Referensi Visual — Rod & Piston Cylinder' } },
            // Zone guide text
            { id: `vi_zone_${ts}`, type: 'TEXT', x: 20, y: 242, w: 920, h: 36,
              props: { text: '📍 ZONA INSPEKSI: [ ZONA A — Piston Head & Seal Groove ] | [ ZONA B — Rod Body (500mm) — periksa seluruh permukaan ] | [ ZONA C — Rod End & Thread & Clevis ]', fontSize: 12, color: '#1e293b', backgroundColor: '#f1f5f9', padding: '10px 16px', borderRadius: '6px' } },
            // Visual dropdowns
            { id: `vi_lbl_rod_${ts}`, type: 'TEXT', x: 20, y: 292, w: 220, h: 22, props: { text: '① Kondisi Permukaan Rod', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `vi_inp_rod_${ts}`, type: 'DROPDOWN', x: 20, y: 314, w: 220, h: 38, props: { variable: `v_vrod_${ts}`, options: ['-- Pilih --', 'PASS — Bersih & mulus', 'FAIL — Scratch ringan (< 0.1mm)', 'FAIL — Scratch dalam (≥ 0.1mm)', 'FAIL — Pitting / Scoring', 'FAIL — Korosi / Karat', 'FAIL — Bengkok / Bent'] } },
            { id: `vi_lbl_piston_${ts}`, type: 'TEXT', x: 252, y: 292, w: 220, h: 22, props: { text: '② Kondisi Permukaan Piston', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `vi_inp_piston_${ts}`, type: 'DROPDOWN', x: 252, y: 314, w: 220, h: 38, props: { variable: `v_vpiston_${ts}`, options: ['-- Pilih --', 'PASS — Bersih & mulus', 'FAIL — Scratch', 'FAIL — Dent / Penyok', 'FAIL — Crack', 'FAIL — Korosi'] } },
            { id: `vi_lbl_seal_${ts}`, type: 'TEXT', x: 484, y: 292, w: 220, h: 22, props: { text: '③ Kondisi Seal / O-Ring', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `vi_inp_seal_${ts}`, type: 'DROPDOWN', x: 484, y: 314, w: 220, h: 38, props: { variable: `v_vseal_${ts}`, options: ['-- Pilih --', 'PASS — Kondisi baik & elastis', 'FAIL — Aus / Worn flat', 'FAIL — Robek / Torn', 'FAIL — Hardened / Getas', 'FAIL — Missing / Hilang'] } },
            { id: `vi_lbl_weld_${ts}`, type: 'TEXT', x: 716, y: 292, w: 228, h: 22, props: { text: '④ Kualitas Weld / Las Sambungan', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `vi_inp_weld_${ts}`, type: 'DROPDOWN', x: 716, y: 314, w: 228, h: 38, props: { variable: `v_vweld_${ts}`, options: ['-- Pilih --', 'PASS — Rapi, no defect', 'FAIL — Porosity', 'FAIL — Undercut', 'FAIL — Crack pada las', 'FAIL — Incomplete fusion'] } },
            // Summary
            { id: `vi_sum_${ts}`, type: 'TEXT', x: 20, y: 366, w: 920, h: 84,
              props: { text: '📋 RINGKASAN VISUAL\n\nPermukaan Rod     : {{@Visual_Rod}}\nPermukaan Piston  : {{@Visual_Piston}}\nKondisi Seal      : {{@Visual_Seal}}\nKualitas Weld     : {{@Visual_Weld}}\n\n✅ PASS: Tidak ada cacat yang mempengaruhi fungsi dan kekuatan cylinder (minor scratch di luar zona seal masih dapat ditolerir dengan catatan engineering)', fontSize: 12, fontFamily: 'monospace', backgroundColor: '#f8fafc', color: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' } },
            { id: `vi_btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 465, w: 130, h: 40, props: { label: '← Pressure', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
            { id: `vi_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 465, w: 130, h: 40, props: { label: 'Stroke Check →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 7: STROKE CHECK ──────────────────────────────────────────────────
    const stepStroke = {
        id: `s_stroke_${ts}`, title: '7. Stroke Check', stepType: 'Step',
        components: [
            { id: `sk_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '↔️ Stroke Check — Pengukuran & Verifikasi Langkah', fontSize: 20, fontWeight: 'bold' } },
            { id: `sk_cad_${ts}`, type: 'CAD_VIEWER', x: 20, y: 58, w: 920, h: 200,
              props: { fileUrl: 'interactive-2d-blueprint', title: 'Diagram Stroke — Extended vs Retracted Position' } },
            { id: `sk_spec_${ts}`, type: 'TEXT', x: 20, y: 270, w: 920, h: 55,
              props: { text: '📏 SPESIFIKASI STROKE: Nominal = 500.000 mm | Toleransi = ±0.500 mm | Max Straightness = 0.100 mm | Drift Test ≤ 0.100 mm/menit\n\nCARA UKUR: Ukur 3x di posisi berbeda (0°, 90°, 180°). Hitung rata-rata. Deviasi = Rata-rata − 500.000\nHasil Rata-rata: {{@Stroke_Measured}} mm | Deviasi: {{@Stroke_Deviation}} mm', fontSize: 12, fontFamily: 'monospace', backgroundColor: '#f8fafc', color: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' } },
            // Measurement inputs
            { id: `sk_lbl_m1_${ts}`, type: 'TEXT', x: 20, y: 340, w: 200, h: 22, props: { text: 'Pengukuran Stroke ke-1 (mm)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sk_inp_m1_${ts}`, type: 'NUMBER_INPUT', x: 20, y: 362, w: 200, h: 40, props: { variable: `v_smeas_${ts}`, placeholder: '500.000', unit: 'mm' } },
            { id: `sk_lbl_m2_${ts}`, type: 'TEXT', x: 232, y: 340, w: 200, h: 22, props: { text: 'Pengukuran Stroke ke-2 (mm)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sk_inp_m2_${ts}`, type: 'NUMBER_INPUT', x: 232, y: 362, w: 200, h: 40, props: { placeholder: '500.000', unit: 'mm' } },
            { id: `sk_lbl_m3_${ts}`, type: 'TEXT', x: 444, y: 340, w: 200, h: 22, props: { text: 'Pengukuran Stroke ke-3 (mm)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sk_inp_m3_${ts}`, type: 'NUMBER_INPUT', x: 444, y: 362, w: 200, h: 40, props: { placeholder: '500.000', unit: 'mm' } },
            { id: `sk_lbl_dv_${ts}`, type: 'TEXT', x: 656, y: 340, w: 180, h: 22, props: { text: 'Deviasi dari Nominal (mm)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sk_inp_dv_${ts}`, type: 'NUMBER_INPUT', x: 656, y: 362, w: 180, h: 40, props: { variable: `v_sdev_${ts}`, placeholder: '±0.000', unit: 'mm' } },
            { id: `sk_lbl_dr_${ts}`, type: 'TEXT', x: 848, y: 340, w: 96, h: 22, props: { text: 'Drift (mm/min)', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sk_inp_dr_${ts}`, type: 'NUMBER_INPUT', x: 848, y: 362, w: 96, h: 40, props: { placeholder: '0.00', unit: 'mm/m' } },
            { id: `sk_btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 430, w: 130, h: 40, props: { label: '← Visual', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
            { id: `sk_btn_next_${ts}`, type: 'BUTTON', x: 810, y: 430, w: 130, h: 40, props: { label: 'Ringkasan →', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'NEXT_STEP' }] } },
        ]
    };

    // ── STEP 8: RINGKASAN & SIGN-OFF ──────────────────────────────────────────
    const stepSummary = {
        id: `s_summary_${ts}`, title: '8. Ringkasan & Sign-Off', stepType: 'Step',
        components: [
            { id: `sm_title_${ts}`, type: 'HEADING', x: 20, y: 15, w: 920, h: 36, props: { text: '✅ Ringkasan Hasil Inspeksi & Sign-Off', fontSize: 20, fontWeight: 'bold' } },
            { id: `sm_result_${ts}`, type: 'TEXT', x: 20, y: 58, w: 920, h: 95,
              props: { text: '📊 HASIL KESELURUHAN INSPEKSI\n\nWork Order   : {{@Work_Order}}    |  Part Number  : {{@Part_Number}}\nSerial Number: {{@Serial_Number}} |  Operator     : {{@Operator}}\nBore Aktual  : {{@Bore_Diameter}} |  Rod Aktual   : {{@Rod_Diameter}}\nStroke Aktual: {{@Stroke_Measured}} mm  | Deviasi : {{@Stroke_Deviation}} mm\nProof Press  : {{@Press_Proof}} bar | Working Press : {{@Press_Working}} bar\nLeak Check   : {{@Press_LeakCheck}}\nVisual Rod   : {{@Visual_Rod}} | Visual Piston : {{@Visual_Piston}}', fontSize: 12, fontFamily: 'monospace', backgroundColor: '#0f172a', color: '#a3e635', padding: '16px', borderRadius: '8px' } },
            { id: `sm_lbl_res_${ts}`, type: 'TEXT', x: 20, y: 165, w: 460, h: 22, props: { text: 'Keputusan Akhir Inspeksi', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sm_inp_res_${ts}`, type: 'DROPDOWN', x: 20, y: 187, w: 460, h: 40,
              props: { variable: `v_result_${ts}`, options: ['PENDING', 'PASS — Sesuai Spesifikasi', 'FAIL — Tidak Sesuai / Return to Vendor', 'CONDITIONAL PASS — Perlu Konfirmasi Engineering', 'SCRAP — Tidak Dapat Diperbaiki'] } },
            { id: `sm_lbl_notes_${ts}`, type: 'TEXT', x: 490, y: 165, w: 454, h: 22, props: { text: 'Catatan Umum / General Remarks', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sm_inp_notes_${ts}`, type: 'TEXT_AREA', x: 490, y: 187, w: 454, h: 80, props: { variable: `v_notes_${ts}`, placeholder: 'Tulis catatan hasil inspeksi secara keseluruhan...' } },
            { id: `sm_lbl_sig_${ts}`, type: 'TEXT', x: 20, y: 240, w: 460, h: 22, props: { text: 'Tanda Tangan Digital Operator QC', fontSize: 12, color: '#64748b', fontWeight: '600' } },
            { id: `sm_inp_sig_${ts}`, type: 'SIGNATURE', x: 20, y: 262, w: 460, h: 120, props: { variable: `v_sig_${ts}`, label: 'Tanda Tangan Operator' } },
            // Save button
            { id: `sm_btn_save_${ts}`, type: 'BUTTON', x: 20, y: 400, w: 220, h: 48,
              props: { label: '💾 Simpan Laporan Inspeksi', backgroundColor: '#059669', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', fontSize: 14,
                triggers: [{
                    event: 'ON_CLICK', type: 'TABLE_RECORD_SAVE',
                    tableId: T.hcInspections,
                    fields: { 'Work_Order': `@Work_Order`, 'Part_Number': `@Part_Number`, 'Serial_Number': `@Serial_Number`, 'Operator': `@Operator`, 'Bore_Diameter': `@Bore_Diameter`, 'Rod_Diameter': `@Rod_Diameter`, 'Stroke_Length': `@Stroke_Length`, 'Press_Proof': `@Press_Proof`, 'Press_Working': `@Press_Working`, 'Visual_Rod': `@Visual_Rod`, 'Visual_Piston': `@Visual_Piston`, 'Overall_Result': `@Overall_Result`, 'Notes': `@Notes`, 'Signature': `@Signature` }
                }]
              }
            },
            { id: `sm_btn_prev_${ts}`, type: 'BUTTON', x: 810, y: 400, w: 134, h: 48, props: { label: '← Stroke', borderRadius: '8px', triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'PREV_STEP' }] } },
        ]
    };

    // ── COMPOSE APP ───────────────────────────────────────────────────────────
    return {
        id: `app_hc_insp_${ts}`,
        name: 'HC Cylinder Inspection',
        description: 'Template inspeksi lengkap hydraulic cylinder: 2D/3D drawing, Function Test, Pressure Test, Visual Rod & Stroke Check',
        icon: '🔧',
        color: '#2563eb',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [],
            appTables: [T.hcInspections],
            steps: [stepHeader, stepDim2D, stepDim3D, stepFunc, stepPressure, stepVisual, stepStroke, stepSummary],
            theme: { primaryColor: '#2563eb', backgroundColor: '#f8fafc', fontFamily: 'Inter' }
        }
    };
}
