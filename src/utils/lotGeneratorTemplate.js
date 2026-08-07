/**
 * lotGeneratorTemplate.js
 * Generates an App Builder Template for MES Lot Generator in MAVI-MES
 */
export function createLotGeneratorTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = {
        masterParts: 'tbl_lot_master_parts',
        counters: 'tbl_lot_counters',
        history: 'tbl_lot_history'
    };

    const appVariables = [
        { id: `var_part_no_${ts}`, name: 'Selected_Part_No', type: 'string', defaultValue: 'PN-TY-9021', persisted: true },
        { id: `var_mark_${ts}`, name: 'Mark_Prefix', type: 'string', defaultValue: '092', persisted: true },
        { id: `var_operator_${ts}`, name: 'Operator_User', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `var_lot_num_${ts}`, name: 'Generated_Lot_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_seq_type_${ts}`, name: 'Sequence_Type', type: 'string', defaultValue: 'Normal', persisted: false },
        { id: `var_running_no_${ts}`, name: 'Next_Running_No', type: 'number', defaultValue: 1, persisted: false }
    ];

    const recordPlaceholders = [
        {
            id: `rp_part_${ts}`,
            name: 'Current_Master_Part',
            tableId: T.masterParts,
            description: 'Selected Master Part Details'
        },
        {
            id: `rp_history_${ts}`,
            name: 'Lot_History_Log',
            tableId: T.history,
            description: 'Generated Lot History Log'
        }
    ];

    // Screen 1: Lot Generator Main Terminal
    const stepMain = {
        id: `step_main_${ts}`,
        title: 'Lot Generator Terminal',
        stepType: 'Step',
        components: [
            // Header Title
            {
                id: `c_hdr_${ts}`, type: 'TEXT',
                x: 30, y: 20, w: 940, h: 40,
                props: { text: '🏷️ MES LOT NUMBER GENERATOR', fontSize: 24, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `c_sub_${ts}`, type: 'TEXT',
                x: 30, y: 60, w: 940, h: 24,
                props: { text: 'Automated Lot Numbering & Thermal Label Printing Station', fontSize: 13, color: '#64748b' }
            },
            // Left Panel: Master Part Table
            {
                id: `c_tbl_parts_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 30, y: 100, w: 420, h: 220,
                props: {
                    tableId: T.masterParts,
                    title: '1. Select Master Part No',
                    columns: ['part_no', 'part_name', 'mark', 'customer', 'sequence_type'],
                    pageSize: 5
                },
                triggers: [
                    {
                        event: 'ON_ROW_SELECT',
                        type: 'DATA',
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.masterParts,
                        recordPlaceholderId: `rp_part_${ts}`,
                        linkVariable: 'Selected_Part_No'
                    }
                ]
            },
            {
                id: `c_inp_mark_${ts}`, type: 'TEXT_INPUT',
                x: 30, y: 330, w: 200, h: 60,
                props: { label: 'Mark Prefix', placeholder: 'e.g. 092', bindVariable: 'Mark_Prefix' }
            },
            {
                id: `c_inp_op_${ts}`, type: 'TEXT_INPUT',
                x: 240, y: 330, w: 210, h: 60,
                props: { label: 'Operator / User', placeholder: 'Operator', bindVariable: 'Operator_User' }
            },
            {
                id: `c_btn_generate_${ts}`, type: 'BUTTON',
                x: 30, y: 400, w: 420, h: 60,
                props: {
                    label: '⚡ GENERATE LOT NUMBER', text: '⚡ GENERATE LOT NUMBER',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 16, fontWeight: 'bold',
                    triggers: [
                        {
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'EXECUTE_ACTION',
                                    actionType: 'GENERATE_LOT',
                                    payload: { toastMessage: 'Lot berhasil dibuat!' }
                                }
                            ]
                        }
                    ]
                }
            },
            // Right Panel: Record Display & History Table
            {
                id: `c_rec_disp_${ts}`, type: 'RECORD_DISPLAY',
                x: 470, y: 100, w: 500, h: 140,
                props: {
                    title: 'Selected Part Info',
                    placeholderId: `rp_part_${ts}`,
                    fieldsToShow: ['part_no', 'part_name', 'customer', 'mark', 'sequence_type']
                }
            },
            {
                id: `c_tbl_history_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 470, y: 250, w: 500, h: 290,
                props: {
                    tableId: T.history,
                    title: '2. Lot Generation History Log',
                    columns: ['date_time', 'lot_number', 'part_no', 'mark', 'user', 'format_lot'],
                    pageSize: 6
                }
            }
        ]
    };

    return {
        id: `app_lot_gen_${ts}`,
        name: 'MES Lot Number Generator',
        description: 'Complete App Builder application for automated MES Lot numbering and label printing.',
        version: 1,
        created_at: iso,
        updated_at: iso,
        config: {
            appVariables,
            recordPlaceholders,
            steps: [stepMain],
            appTables: [T.masterParts, T.counters, T.history]
        }
    };
}
