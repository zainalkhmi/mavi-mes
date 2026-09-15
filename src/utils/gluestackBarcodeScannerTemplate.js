/**
 * GlueStack Barcode Scanner Template
 * Mobile barcode/QR code scanner app for lot verification and material tracking
 * Builder Type: gluestack
 */
export function createGluestackBarcodeScannerTemplate() {
    return {
        id: 'gluestack_scanner_' + Date.now(),
        name: 'GlueStack — Barcode & QR Scanner',
        description: 'Aplikasi scan barcode/QR mobile untuk verifikasi lot, material tracking, dan inventory audit. GlueStack App.',
        builder_type: 'gluestack',
        category: 'GlueStack App',
        config: {
            screens: [
                {
                    id: 'screen_scanner',
                    title: 'Scan Barcode / QR',
                    components: [
                        {
                            id: 'scan_title',
                            type: 'Text',
                            props: { text: '📷 Barcode & QR Scanner', size: 'xl', bold: true }
                        },
                        {
                            id: 'scan_instruction',
                            type: 'Alert',
                            props: { text: 'Arahkan kamera ke barcode/QR code pada label part atau lot tag.', action: 'info' }
                        },
                        {
                            id: 'scan_input',
                            type: 'Input',
                            props: {
                                label: 'Input Manual Barcode',
                                placeholder: 'Ketik atau scan barcode...',
                                icon: 'Search',
                                variableId: 'v_barcode'
                            }
                        },
                        {
                            id: 'scan_btn',
                            type: 'Button',
                            props: { text: '📷 Buka Kamera Scanner', variant: 'primary', size: 'lg' }
                        },
                        {
                            id: 'scan_divider',
                            type: 'Text',
                            props: { text: '── Riwayat Scan Terakhir ──', size: 'sm', align: 'center', color: '#94a3b8' }
                        },
                        {
                            id: 'scan_history_1',
                            type: 'Card',
                            props: { title: 'LOT-2026-09-001', content: '✅ Crankshaft Bearing 4A — VERIFIED\n10:42 — 250 pcs' }
                        },
                        {
                            id: 'scan_history_2',
                            type: 'Card',
                            props: { title: 'LOT-2026-09-002', content: '🔄 Piston Ring Type C — INSPECTING\n11:15 — 500 pcs' }
                        },
                        {
                            id: 'scan_history_3',
                            type: 'Card',
                            props: { title: 'LOT-2026-09-003', content: '❌ Connecting Rod M8 — REJECTED\n11:50 — 80 pcs' }
                        },
                        {
                            id: 'scan_verify_btn',
                            type: 'Button',
                            props: { text: 'Verifikasi Barcode ➔', variant: 'primary', action: 'NEXT_SCREEN' }
                        }
                    ],
                    triggers: []
                },
                {
                    id: 'screen_result',
                    title: 'Hasil Verifikasi',
                    components: [
                        {
                            id: 'result_title',
                            type: 'Text',
                            props: { text: '✅ Hasil Verifikasi Scan', size: 'lg', bold: true }
                        },
                        {
                            id: 'result_status',
                            type: 'Badge',
                            props: { text: 'VERIFIED — LOT VALID', action: 'success' }
                        },
                        {
                            id: 'result_card',
                            type: 'Card',
                            props: {
                                title: 'Detail Lot',
                                content: '• Lot No: LOT-2026-09-001\n• Part: Crankshaft Bearing 4A\n• Supplier: PT Bearing Indonesia\n• Qty: 250 pcs\n• Status: VERIFIED'
                            }
                        },
                        {
                            id: 'result_location',
                            type: 'Select',
                            props: {
                                label: 'Lokasi Penyimpanan',
                                options: ['Warehouse A', 'Warehouse B', 'Station 1', 'Station 2', 'Station 3'],
                                variableId: 'v_location'
                            }
                        },
                        {
                            id: 'result_qty_input',
                            type: 'NumberInput',
                            props: {
                                label: 'Qty Diterima',
                                min: 0,
                                max: 9999,
                                step: 1,
                                unit: 'pcs',
                                variableId: 'v_qty'
                            }
                        },
                        {
                            id: 'result_notes',
                            type: 'Textarea',
                            props: { label: 'Catatan Penerimaan', placeholder: 'Catatan jika ada...' }
                        },
                        {
                            id: 'result_confirm_btn',
                            type: 'Button',
                            props: { text: '✅ Konfirmasi & Simpan', variant: 'positive', action: 'NEXT_SCREEN', size: 'lg' }
                        },
                        {
                            id: 'result_reject_btn',
                            type: 'Button',
                            props: { text: '❌ Tolak Lot', variant: 'negative' }
                        }
                    ],
                    triggers: [
                        {
                            id: 'trig_save_scan',
                            event: 'ON_CLICK',
                            componentId: 'result_confirm_btn',
                            actions: [
                                { type: 'TABLE_RECORD_SAVE', tableId: 'tbl_gs_scan_logs' }
                            ]
                        }
                    ]
                },
                {
                    id: 'screen_complete',
                    title: 'Selesai',
                    components: [
                        {
                            id: 'complete_alert',
                            type: 'Alert',
                            props: { text: 'Scan lot berhasil diverifikasi dan disimpan ke database!', action: 'success' }
                        },
                        {
                            id: 'complete_title',
                            type: 'Text',
                            props: { text: '🎉 Lot Tersimpan', size: 'lg', bold: true, align: 'center' }
                        },
                        {
                            id: 'complete_card',
                            type: 'Card',
                            props: { title: 'Ringkasan', content: '• Barcode: LOT-2026-09-001\n• Lokasi: Warehouse A\n• Qty: 250 pcs\n• Status: VERIFIED' }
                        },
                        {
                            id: 'complete_new_btn',
                            type: 'Button',
                            props: { text: '📷 Scan Barcode Baru', variant: 'primary', action: 'GO_TO_SCREEN', targetScreenId: 'screen_scanner' }
                        },
                        {
                            id: 'complete_done_btn',
                            type: 'Button',
                            props: { text: '✅ Selesai', variant: 'positive', action: 'COMPLETE_APP' }
                        }
                    ],
                    triggers: []
                }
            ],
            variables: [
                { id: 'v_barcode', name: 'SCANNED_BARCODE', type: 'string', value: '' },
                { id: 'v_location', name: 'STORAGE_LOCATION', type: 'string', value: 'Warehouse A' },
                { id: 'v_qty', name: 'RECEIVED_QTY', type: 'number', value: '' },
                { id: 'v_operator', name: 'OPERATOR', type: 'string', value: '' }
            ],
            appTables: []
        }
    };
}
