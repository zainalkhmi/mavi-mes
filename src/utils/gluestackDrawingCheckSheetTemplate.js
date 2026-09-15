/**
 * GlueStack Drawing & Thread Check Sheet Template
 * Interactive CAD Blueprint Balloon Inspection with Metrology Instruments & Thread Gauges
 * Builder Type: gluestack
 */
export function createGluestackDrawingCheckSheetTemplate() {
    return {
        id: 'gluestack_drawing_checksheet_' + Date.now(),
        name: 'GlueStack — Digital Drawing & Thread Check Sheet',
        description: 'Lembar periksa kualitas digital berbasis gambar teknik (CAD Drawing Blueprint) dengan balon inspeksi interaktif, integrasi alat ukur dimensi (Caliper, Micrometer), dan alat ukur ulir (Thread Gauge Go/No-Go).',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            appTables: ['tbl_gs_drawing_inspections'],
            screens: [
                // SCREEN 1: IDENTIFIKASI WORK ORDER & INSPEKTOR
                {
                    id: 'screen_wo_ident',
                    title: 'Identifikasi Part & Drawing',
                    components: [
                        {
                            id: 'hdr_title',
                            type: 'Text',
                            props: { text: '📐 QC Drawing & Thread Check Sheet', size: 'xl', bold: true }
                        },
                        {
                            id: 'hdr_badge',
                            type: 'Badge',
                            props: { text: 'IATF 16949 • PRECISION MACHINING', action: 'success' }
                        },
                        {
                            id: 'hdr_sub',
                            type: 'Text',
                            props: { text: 'Pemeriksaan dimensi part dan kualitas ulir berbasis blueprint 2D CAD', size: 'sm' }
                        },
                        {
                            id: 'inp_wo',
                            type: 'Input',
                            props: { label: 'Nomor Work Order (WO)', placeholder: 'WO-2026-09-041', defaultValue: 'WO-2026-09-041' }
                        },
                        {
                            id: 'inp_part',
                            type: 'Input',
                            props: { label: 'Part Number / Kode Gambar', placeholder: 'SHAFT-M12-SS304', defaultValue: 'SHAFT-M12-SS304' }
                        },
                        {
                            id: 'sel_station',
                            type: 'Select',
                            props: {
                                label: 'Stasiun Mesin / Line',
                                options: ['CNC Lathe 01 (Turning)', 'CNC Lathe 02 (Threading)', 'Milling Center 03', 'Bench QC Final']
                            }
                        },
                        {
                            id: 'sel_shift',
                            type: 'Select',
                            props: {
                                label: 'Shift Kerja',
                                options: ['Shift 1 (Pagi - 07:00)', 'Shift 2 (Siang - 15:00)', 'Shift 3 (Malam - 23:00)']
                            }
                        },
                        {
                            id: 'inp_inspector',
                            type: 'Input',
                            props: { label: 'Nama QC Inspector / Operator', placeholder: 'Nama Anda / NIK', defaultValue: 'Budi Santoso (NIK 240891)' }
                        },
                        {
                            id: 'btn_start_inspect',
                            type: 'Button',
                            props: { text: 'Buka Blueprint & Mulai Ukur ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 2: BLUEPRINT DRAWING WITH INTERACTIVE BALLOONS
                {
                    id: 'screen_balloon_drawing',
                    title: 'CAD Blueprint & Balon Inspeksi',
                    components: [
                        {
                            id: 'drw_header',
                            type: 'Text',
                            props: { text: 'Interactive Blueprint Inspection', size: 'lg', bold: true }
                        },
                        {
                            id: 'drw_instruction_alert',
                            type: 'Alert',
                            props: {
                                title: 'Panduan Pemeriksaan Balon',
                                message: 'Ketuk balon nomor (① s/d ⑤) pada gambar teknik di bawah untuk memasukkan hasil ukur atau uji Go/No-Go alat ulir.'
                            }
                        },
                        {
                            id: 'drw_balloon_widget',
                            type: 'BalloonDrawingWidget',
                            props: {
                                title: 'Machined Shaft with M12 Thread',
                                drawingNo: 'DWG-SHF-2026-08',
                                balloons: [
                                    {
                                        id: 'b1',
                                        number: 1,
                                        x: 28,
                                        y: 34,
                                        feature: 'Diameter Luar (OD)',
                                        nominal: 25.0,
                                        tolerance: 0.05,
                                        unit: 'mm',
                                        toolType: 'MICROMETER',
                                        toolName: 'Mikrometer Luar Digital (0-25mm)',
                                        category: 'diameter',
                                        status: 'PASS',
                                        actual: 25.012
                                    },
                                    {
                                        id: 'b2',
                                        number: 2,
                                        x: 52,
                                        y: 26,
                                        feature: 'Panjang Total Baut',
                                        nominal: 50.0,
                                        tolerance: 0.2,
                                        unit: 'mm',
                                        toolType: 'VERNIER_CALIPER',
                                        toolName: 'Jangka Sorong Digital (Caliper 150mm)',
                                        category: 'length',
                                        status: 'PASS',
                                        actual: 49.95
                                    },
                                    {
                                        id: 'b3',
                                        number: 3,
                                        x: 74,
                                        y: 52,
                                        feature: 'Ulir Baut (Thread & Pitch)',
                                        nominal: 1.5,
                                        tolerance: 0.05,
                                        unit: 'mm',
                                        threadSpec: 'M12 x 1.5 - 6g',
                                        toolType: 'THREAD_GAUGE',
                                        toolName: 'Thread Ring Gauge M12 x 1.5 (Go / No-Go)',
                                        category: 'thread',
                                        status: 'PASS',
                                        goStatus: true,
                                        noGoStatus: true,
                                        actual: 'GO OK / NO-GO OK'
                                    },
                                    {
                                        id: 'b4',
                                        number: 4,
                                        x: 35,
                                        y: 72,
                                        feature: 'Kedalaman Chamfer 45°',
                                        nominal: 2.0,
                                        tolerance: 0.1,
                                        unit: 'mm',
                                        toolType: 'DIAL_HEIGHT_GAUGE',
                                        toolName: 'Dial Height Gauge Presisi',
                                        category: 'chamfer',
                                        status: 'PASS',
                                        actual: 2.02
                                    },
                                    {
                                        id: 'b5',
                                        number: 5,
                                        x: 82,
                                        y: 80,
                                        feature: 'Kekasaran Permukaan Ra',
                                        nominal: 1.6,
                                        tolerance: 0.4,
                                        unit: 'μm',
                                        toolType: 'ROUGHNESS_TESTER',
                                        toolName: 'Surface Roughness Tester (Ra)',
                                        category: 'roughness',
                                        status: 'PASS',
                                        actual: 1.55
                                    }
                                ]
                            }
                        },
                        {
                            id: 'drw_btn_next',
                            type: 'Button',
                            props: { text: 'Lanjut ke Verifikasi Ulir & Torsi ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 3: VERIFIKASI ALAT UKUR ULIR & KUNCI TORSI
                {
                    id: 'screen_thread_metrology',
                    title: 'Uji Ulir & Torsi Baut',
                    components: [
                        {
                            id: 'thr_title',
                            type: 'Text',
                            props: { text: '🔩 Uji Alat Ukur Ulir & Kunci Torsi', size: 'lg', bold: true }
                        },
                        {
                            id: 'thr_badge',
                            type: 'Badge',
                            props: { text: 'STANDAR ULIR: ISO METRIC M12 x 1.5 - 6g', action: 'info' }
                        },
                        {
                            id: 'thr_thread_instrument',
                            type: 'MetrologyWidget',
                            props: {
                                instrumentType: 'THREAD_GAUGE',
                                label: 'Thread Pitch Tester & Ring Gauge',
                                targetValue: 1.5,
                                tolerance: 0.05,
                                unit: 'mm'
                            }
                        },
                        {
                            id: 'thr_torque_instrument',
                            type: 'MetrologyWidget',
                            props: {
                                instrumentType: 'TORQUE_WRENCH',
                                label: 'Kunci Torsi Digital Pengencangan Ulir',
                                targetValue: 45.0,
                                tolerance: 2.0,
                                unit: 'Nm'
                            }
                        },
                        {
                            id: 'thr_chk_lead',
                            type: 'Checkbox',
                            props: { label: 'Ulir bersih dari gram/chip bubut & serpihan logam', checked: true }
                        },
                        {
                            id: 'thr_chk_pitch',
                            type: 'Checkbox',
                            props: { label: 'Lead in & pitch angle ulir 60° simetris sesuai standar DIN 13', checked: true }
                        },
                        {
                            id: 'thr_btn_to_summary',
                            type: 'Button',
                            props: { text: 'Ke Ringkasan & Tanda Tangan QC ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },

                // SCREEN 4: SUMMARY & DIGITAL SIGNATURE
                {
                    id: 'screen_summary_approval',
                    title: 'Ringkasan & Approval QC',
                    components: [
                        {
                            id: 'sum_title',
                            type: 'Text',
                            props: { text: '📋 Hasil Evaluasi Check Sheet', size: 'lg', bold: true }
                        },
                        {
                            id: 'sum_decision_badge',
                            type: 'Badge',
                            props: { text: 'KEPUTUSAN: LOT DITERIMA (PASS)', action: 'success' }
                        },
                        {
                            id: 'sum_table_data',
                            type: 'Table',
                            props: {
                                title: 'Rincian Nilai Ukur Balon Dimensi & Ulir',
                                headers: ['Balon #', 'Parameter', 'Standar', 'Aktual', 'Status'],
                                rows: [
                                    ['#1', 'Diameter OD', 'ø25 ±0.05 mm', '25.012 mm', 'PASS'],
                                    ['#2', 'Panjang Total', '50.0 ±0.2 mm', '49.95 mm', 'PASS'],
                                    ['#3', 'Ulir M12x1.5', 'GO/NO-GO 6g', 'GO OK / NO-GO OK', 'PASS'],
                                    ['#4', 'Chamfer 45°', '2.0 ±0.1 mm', '2.02 mm', 'PASS'],
                                    ['#5', 'Kekasaran Ra', '1.6 ±0.4 μm', '1.55 μm', 'PASS'],
                                    ['#6', 'Uji Torsi Ulir', '45.0 ±2.0 Nm', '45.2 Nm', 'PASS']
                                ]
                            }
                        },
                        {
                            id: 'sum_sig_qc',
                            type: 'Signature',
                            props: {
                                label: 'Tanda Tangan Pengesahan QC Inspector',
                                placeholder: 'Bubuhkan tanda tangan digital di sini'
                            }
                        },
                        {
                            id: 'sum_btn_submit',
                            type: 'Button',
                            props: { text: 'Simpan Hasil Inspeksi ke Database 💾', variant: 'positive', action: 'COMPLETE_APP' }
                        }
                    ],
                    triggers: [
                        {
                            id: 'trig_save_drawing_qc',
                            event: 'ON_CLICK',
                            action: 'SAVE_TO_TABLE',
                            target: 'tbl_gs_drawing_inspections',
                            payload: {
                                Work_Order: 'WO-2026-09-041',
                                Part_Number: 'SHAFT-M12-SS304',
                                Drawing_No: 'DWG-SHF-2026-08',
                                Balloon_Total: 5,
                                Balloon_Passed: 5,
                                Balloon_Failed: 0,
                                Thread_Gauge_Result: 'GO OK / NO-GO OK',
                                Torque_Nm: 45.2,
                                Overall_Decision: 'PASS',
                                Inspector: 'Budi Santoso (NIK 240891)',
                                Timestamp: 'CURRENT_TIMESTAMP'
                            }
                        }
                    ]
                }
            ]
        }
    };
}
