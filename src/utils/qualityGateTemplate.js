/**
 * qualityGateTemplate.js
 * Quality Gate template - QC inspection checkpoint before shipping
 * Features: barcode scan, visual checklist, photo capture, pass/fail decision, signature
 */

export function createQualityGateTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_qg_serial_${ts}`, name: 'Serial_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_qg_operator_${ts}`, name: 'Inspector_Name', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qg_station_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'QG-01', persisted: true },
        { id: `var_qg_visual_${ts}`, name: 'Visual_Check', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_qg_dimension_${ts}`, name: 'Dimension_Check', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_qg_functional_${ts}`, name: 'Functional_Check', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_qg_marking_${ts}`, name: 'Marking_Check', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_qg_photo_${ts}`, name: 'Photo_URL', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qg_defect_${ts}`, name: 'Defect_Notes', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qg_result_${ts}`, name: 'Final_Result', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_qg_sign_${ts}`, name: 'Inspector_Signature', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qg_start_${ts}`, name: 'Start_Time', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qg_end_${ts}`, name: 'End_Time', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qg_notes_${ts}`, name: 'Additional_Notes', type: 'string', defaultValue: '', persisted: false }
    ];

    // STEP 1: Identification
    const stepIdentification = {
        id: `step_qg_ident_${ts}`,
        title: '1. Identifikasi Produk',
        stepType: 'Step',
        components: [
            {
                id: `qg_ident_title_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: 'QUALITY GATE - Inspeksi Akhir', fontSize: 26, fontWeight: 'bold', color: '#1e3a8a' }
            },
            {
                id: `qg_ident_subtitle_${ts}`, type: 'TEXT',
                x: 30, y: 65, w: 940, h: 30,
                props: { text: 'Scan barcode atau masukkan serial number produk sebelum memulai inspeksi.', fontSize: 14, color: '#64748b' }
            },
            {
                id: `qg_ident_card_${ts}`, type: 'TEXT',
                x: 30, y: 110, w: 460, h: 350,
                props: {
                    text: '📦 IDENTIFIKASI PRODUK\n\nSerial Number / Part ID:\n{{@Serial_Number}}\n\nStation: {{@Station_ID}}\nInspector: {{@Inspector_Name}}',
                    color: '#0f172a', padding: '24px', fontSize: 15, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#f8fafc'
                }
            },
            {
                id: `qg_ident_input_${ts}`, type: 'TEXT',
                x: 520, y: 110, w: 450, h: 350,
                props: {
                    text: 'Scan atau input data produk:',
                    color: '#0f172a', padding: '20px', fontSize: 14, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#ffffff'
                }
            },
            {
                id: `qg_ident_barcode_${ts}`, type: 'BARCODE',
                x: 540, y: 170, w: 400, h: 50,
                props: { targetVariable: 'Serial_Number', placeholder: 'Scan barcode...' }
            },
            {
                id: `qg_ident_serial_${ts}`, type: 'TEXT_INPUT',
                x: 540, y: 240, w: 400, h: 40,
                props: { placeholder: 'Atau ketik manual: SN-2026-XXXX', targetVariable: 'Serial_Number' }
            },
            {
                id: `qg_ident_operator_${ts}`, type: 'TEXT_INPUT',
                x: 540, y: 300, w: 400, h: 40,
                props: { placeholder: 'Nama Inspector...', targetVariable: 'Inspector_Name' }
            },
            {
                id: `qg_ident_info_${ts}`, type: 'TEXT',
                x: 540, y: 360, w: 400, h: 50,
                props: {
                    text: 'Pastikan serial number terbaca dengan jelas sebelum melanjutkan.',
                    color: '#0369a1', padding: '10px', fontSize: 12, borderRadius: '6px', backgroundColor: '#f0f9ff'
                }
            },
            {
                id: `qg_ident_btn_${ts}`, type: 'BUTTON',
                x: 770, y: 480, w: 200, h: 48,
                props: {
                    text: 'Mulai Inspeksi →', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb'
                },
                triggers: [{
                    name: 'Start Inspection',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Start_Time', value: 'NOW' } },
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_visual_${ts}` } }
                    ]
                }]
            }
        ]
    };

    // STEP 2: Visual Inspection
    const stepVisual = {
        id: `step_qg_visual_${ts}`,
        title: '2. Inspeksi Visual',
        stepType: 'Step',
        components: [
            {
                id: `qg_vis_title_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 35,
                props: { text: 'INSPEKSI VISUAL - Periksa setiap kriteria di bawah', fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' }
            },
            {
                id: `qg_vis_serial_${ts}`, type: 'TEXT',
                x: 30, y: 60, w: 940, h: 25,
                props: { text: 'Serial: {{@Serial_Number}} | Inspector: {{@Inspector_Name}}', fontSize: 13, color: '#64748b' }
            },
            {
                id: `qg_vis_label_${ts}`, type: 'TEXT',
                x: 30, y: 100, w: 500, h: 30,
                props: { text: 'CRITERIA CHECKLIST', fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `qg_vis_c1_label_${ts}`, type: 'TEXT',
                x: 30, y: 145, w: 350, h: 25,
                props: { text: '1. Surface Finish / Permukaan', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `qg_vis_c1_pass_${ts}`, type: 'BUTTON',
                x: 400, y: 140, w: 80, h: 32,
                props: { text: 'PASS', color: '#16a34a', fontWeight: 'bold', backgroundColor: '#f0fdf4' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Visual_Check', value: 'PASS' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Surface: PASS', msgType: 'success' } }
                ]}]
            },
            {
                id: `qg_vis_c1_fail_${ts}`, type: 'BUTTON',
                x: 490, y: 140, w: 80, h: 32,
                props: { text: 'FAIL', color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fef2f2' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Visual_Check', value: 'FAIL' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Surface: FAIL - Defect dicatat!', msgType: 'error' } }
                ]}]
            },
            {
                id: `qg_vis_c2_label_${ts}`, type: 'TEXT',
                x: 30, y: 190, w: 350, h: 25,
                props: { text: '2. Dimensi / Dimension', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `qg_vis_c2_pass_${ts}`, type: 'BUTTON',
                x: 400, y: 185, w: 80, h: 32,
                props: { text: 'PASS', color: '#16a34a', fontWeight: 'bold', backgroundColor: '#f0fdf4' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Dimension_Check', value: 'PASS' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Dimension: PASS', msgType: 'success' } }
                ]}]
            },
            {
                id: `qg_vis_c2_fail_${ts}`, type: 'BUTTON',
                x: 490, y: 185, w: 80, h: 32,
                props: { text: 'FAIL', color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fef2f2' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Dimension_Check', value: 'FAIL' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Dimension: FAIL - Out of spec!', msgType: 'error' } }
                ]}]
            },
            {
                id: `qg_vis_c3_label_${ts}`, type: 'TEXT',
                x: 30, y: 235, w: 350, h: 25,
                props: { text: '3. Functional / Fungsional', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `qg_vis_c3_pass_${ts}`, type: 'BUTTON',
                x: 400, y: 230, w: 80, h: 32,
                props: { text: 'PASS', color: '#16a34a', fontWeight: 'bold', backgroundColor: '#f0fdf4' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Functional_Check', value: 'PASS' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Functional: PASS', msgType: 'success' } }
                ]}]
            },
            {
                id: `qg_vis_c3_fail_${ts}`, type: 'BUTTON',
                x: 490, y: 230, w: 80, h: 32,
                props: { text: 'FAIL', color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fef2f2' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Functional_Check', value: 'FAIL' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Functional: FAIL - Tidak berfungsi!', msgType: 'error' } }
                ]}]
            },
            {
                id: `qg_vis_c4_label_${ts}`, type: 'TEXT',
                x: 30, y: 280, w: 350, h: 25,
                props: { text: '4. Label & Marking / Penandaan', fontSize: 13, fontWeight: 'bold' }
            },
            {
                id: `qg_vis_c4_pass_${ts}`, type: 'BUTTON',
                x: 400, y: 275, w: 80, h: 32,
                props: { text: 'PASS', color: '#16a34a', fontWeight: 'bold', backgroundColor: '#f0fdf4' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Marking_Check', value: 'PASS' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Marking: PASS', msgType: 'success' } }
                ]}]
            },
            {
                id: `qg_vis_c4_fail_${ts}`, type: 'BUTTON',
                x: 490, y: 275, w: 80, h: 32,
                props: { text: 'FAIL', color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fef2f2' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'SET_VARIABLE', payload: { variable: 'Marking_Check', value: 'FAIL' } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Marking: FAIL - Label rusak/tidak ada!', msgType: 'error' } }
                ]}]
            },
            {
                id: `qg_vis_result_card_${ts}`, type: 'TEXT',
                x: 600, y: 130, w: 370, h: 180,
                props: {
                    text: '📊 STATUS CHECKLIST\n\nSurface: {{@Visual_Check}}\nDimension: {{@Dimension_Check}}\nFunctional: {{@Functional_Check}}\nMarking: {{@Marking_Check}}',
                    color: '#0f172a', padding: '20px', fontSize: 14, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#f8fafc'
                }
            },
            {
                id: `qg_vis_photo_${ts}`, type: 'WEBCAM',
                x: 600, y: 330, w: 370, h: 150,
                props: { title: 'Foto Produk (Opsional)', targetVariable: 'Photo_URL' }
            },
            {
                id: `qg_vis_notes_${ts}`, type: 'TEXT_INPUT',
                x: 30, y: 330, w: 540, h: 40,
                props: { placeholder: 'Catatan defect / temuan (jika ada)...', targetVariable: 'Defect_Notes' }
            },
            {
                id: `qg_vis_btn_prev_${ts}`, type: 'BUTTON',
                x: 30, y: 480, w: 150, h: 45,
                props: { text: '← Kembali', color: '#475569', fontWeight: 'bold', backgroundColor: '#e2e8f0' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_ident_${ts}` } }
                ]}]
            },
            {
                id: `qg_vis_btn_next_${ts}`, type: 'BUTTON',
                x: 770, y: 480, w: 200, h: 45,
                props: { text: 'Lanjut ke Keputusan →', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_decision_${ts}` } }
                ]}]
            }
        ]
    };

    // STEP 3: Final Decision
    const stepDecision = {
        id: `step_qg_decision_${ts}`,
        title: '3. Keputusan & Sign-Off',
        stepType: 'Step',
        components: [
            {
                id: `qg_dec_title_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 35,
                props: { text: 'KEPUTUSAN QUALITY GATE', fontSize: 22, fontWeight: 'bold', color: '#1e3a8a' }
            },
            {
                id: `qg_dec_subtitle_${ts}`, type: 'TEXT',
                x: 30, y: 60, w: 940, h: 25,
                props: { text: 'Review hasil inspeksi dan putuskan PASS atau FAIL.', fontSize: 13, color: '#64748b' }
            },
            {
                id: `qg_dec_summary_${ts}`, type: 'TEXT',
                x: 30, y: 100, w: 460, h: 280,
                props: {
                    text: '📋 RINGKASAN INSPEKSI\n\nSerial: {{@Serial_Number}}\nInspector: {{@Inspector_Name}}\n\n✅ Visual: {{@Visual_Check}}\n✅ Dimension: {{@Dimension_Check}}\n✅ Functional: {{@Functional_Check}}\n✅ Marking: {{@Marking_Check}}\n\n📝 Catatan: {{@Defect_Notes}}\n📷 Foto: {{@Photo_URL}}',
                    color: '#0f172a', padding: '24px', fontSize: 14, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#f8fafc'
                }
            },
            {
                id: `qg_dec_sign_label_${ts}`, type: 'TEXT',
                x: 520, y: 100, w: 450, h: 30,
                props: { text: 'TANDA TANGAN INSPECTOR', fontSize: 16, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `qg_dec_sign_${ts}`, type: 'SIGNATURE',
                x: 520, y: 140, w: 450, h: 180,
                props: { placeholder: 'Tanda tangan di sini...', targetVariable: 'Inspector_Signature' }
            },
            {
                id: `qg_dec_notes_${ts}`, type: 'TEXT_INPUT',
                x: 520, y: 340, w: 450, h: 40,
                props: { placeholder: 'Catatan tambahan (opsional)...', targetVariable: 'Additional_Notes' }
            },
            {
                id: `qg_dec_btn_pass_${ts}`, type: 'BUTTON',
                x: 520, y: 400, w: 200, h: 50,
                props: { text: '✓ APPROVE (PASS)', color: 'white', fontWeight: 'bold', backgroundColor: '#16a34a' },
                triggers: [{
                    name: 'Approve Product',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Final_Result', value: 'APPROVED' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'End_Time', value: 'NOW' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Produk DISETUJUI - Quality Gate PASS!', msgType: 'success' } },
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_done_${ts}` } }
                    ]
                }]
            },
            {
                id: `qg_dec_btn_fail_${ts}`, type: 'BUTTON',
                x: 740, y: 400, w: 200, h: 50,
                props: { text: '✗ REJECT (FAIL)', color: 'white', fontWeight: 'bold', backgroundColor: '#dc2626' },
                triggers: [{
                    name: 'Reject Product',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Final_Result', value: 'REJECTED' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'End_Time', value: 'NOW' } },
                        { type: 'SHOW_MESSAGE', payload: { message: 'Produk DITOLAK - Quality Gate FAIL!', msgType: 'error' } },
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_done_${ts}` } }
                    ]
                }]
            },
            {
                id: `qg_dec_btn_prev_${ts}`, type: 'BUTTON',
                x: 30, y: 480, w: 150, h: 45,
                props: { text: '← Kembali', color: '#475569', fontWeight: 'bold', backgroundColor: '#e2e8f0' },
                triggers: [{ event: 'ON_CLICK', actions: [
                    { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_visual_${ts}` } }
                ]}]
            }
        ]
    };

    // STEP 4: Done
    const stepDone = {
        id: `step_qg_done_${ts}`,
        title: '4. Selesai',
        stepType: 'Step',
        components: [
            {
                id: `qg_done_title_${ts}`, type: 'TEXT',
                x: 30, y: 30, w: 940, h: 40,
                props: { text: 'Inspeksi Selesai', fontSize: 26, fontWeight: 'bold', color: '#1e3a8a', textAlignment: 1 }
            },
            {
                id: `qg_done_card_${ts}`, type: 'TEXT',
                x: 200, y: 100, w: 600, h: 250,
                props: {
                    text: '📋 HASIL QUALITY GATE\n\nSerial: {{@Serial_Number}}\nInspector: {{@Inspector_Name}}\nResult: {{@Final_Result}}\n\nTerima kasih telah melakukan inspeksi.',
                    color: '#0f172a', padding: '30px', fontSize: 16, fontWeight: 'bold',
                    borderRadius: '12px', backgroundColor: '#f8fafc', textAlignment: 1
                }
            },
            {
                id: `qg_done_btn_${ts}`, type: 'BUTTON',
                x: 370, y: 380, w: 260, h: 50,
                props: { text: '← Kembali ke Awal', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb' },
                triggers: [{
                    name: 'Restart',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SET_VARIABLE', payload: { variable: 'Serial_Number', value: '' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'Final_Result', value: 'PENDING' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'Visual_Check', value: 'PENDING' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'Dimension_Check', value: 'PENDING' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'Functional_Check', value: 'PENDING' } },
                        { type: 'SET_VARIABLE', payload: { variable: 'Marking_Check', value: 'PENDING' } },
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_qg_ident_${ts}` } }
                    ]
                }]
            }
        ]
    };

    return {
        id: `app_quality_gate_${ts}`,
        name: 'Quality Gate - Inspeksi Akhir',
        description: 'Checkpoint kualitas sebelum shipping: barcode scan, checklist visual, foto, pass/fail decision, dan tanda tangan digital.',
        category: 'Quality',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables,
            recordPlaceholders: [],
            appTables: [],
            appTriggers: [],
            steps: [stepIdentification, stepVisual, stepDecision, stepDone]
        }
    };
}
