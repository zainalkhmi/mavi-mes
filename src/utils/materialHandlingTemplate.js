/**
 * materialHandlingTemplate.js — PRO Manufacturing Edition
 * Dark Industrial 1280×720 | 2 Screens: Kanban Requests → Confirm Delivery
 * Tables: Material Requests, Kanban Cards
 */
export function createMaterialHandlingTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = {
        materialRequests: 'tbl_mh_material_requests',
        kanbanCards: 'tbl_mh_kanban_cards'
    };

    const V = [
        { id: `v1_${ts}`, name: 'Selected_Request_ID', type: 'string', defaultValue: '', persisted: true }
    ];

    const R = [
        { id: `r1_${ts}`, name: 'Selected_Request', tableId: T.materialRequests, type: 'single' }
    ];

    // ── SCREEN 1: Kanban Request ────────────────────────────────────────────
    const stepKanbanRequest = {
        id: `s_kb_req_${ts}`,
        title: 'Kanban Request',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `mh1_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `mh1_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 2, zIndex: 11 } },
            { id: `mh1_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Material Handling — Pending Requests', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `mh1_sub_${ts}`, type: 'TEXT', x: 36, y: 36, w: 700, h: 16,
              props: { text: 'Step 1 of 2  ·  Select a material request to begin processing', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            // Status chips
            { id: `mh1_chip_req_${ts}`, type: 'SHAPE_RECTANGLE', x: 900, y: 12, w: 100, h: 28,
              props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 14, zIndex: 11 } },
            { id: `mh1_chip_req_txt_${ts}`, type: 'TEXT', x: 901, y: 12, w: 98, h: 28,
              props: { text: '● REQUESTED', fontSize: 10, fontBold: true, textColor: '#fbbf24', textAlign: 'center', textAlignment: 1, zIndex: 12 } },
            { id: `mh1_chip_act_${ts}`, type: 'SHAPE_RECTANGLE', x: 1012, y: 12, w: 80, h: 28,
              props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981', borderWidth: 1, borderRadius: 14, zIndex: 11 } },
            { id: `mh1_chip_act_txt_${ts}`, type: 'TEXT', x: 1013, y: 12, w: 78, h: 28,
              props: { text: '● ACTIVE', fontSize: 10, fontBold: true, textColor: '#34d399', textAlign: 'center', textAlignment: 1, zIndex: 12 } },

            // Left panel: Requests table
            { id: `mh1_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 740, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `mh1_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 740, y: 52, w: 1, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 } },

            { id: `mh1_req_title_${ts}`, type: 'TEXT', x: 16, y: 68, w: 400, h: 20,
              props: { text: 'PENDING MATERIAL REQUESTS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `mh1_req_sub_${ts}`, type: 'TEXT', x: 16, y: 68, w: 720, h: 20,
              props: { text: 'Click row to load details →', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } },
            { id: `mh1_req_tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 92, w: 716, h: 500,
              props: {
                  tableId: T.materialRequests,
                  title: 'Select a request to process',
                  columns: ['ID', 'Item', 'Requesting_Location', 'Supplier', 'Quantity', 'Status'],
                  filter: "Status = 'REQUESTED'",
                  fontSize: 13, headerBg: '#1e293b', headerTextColor: '#94a3b8',
                  rowBg: '#0f172a', rowAltBg: '#1e293b', rowTextColor: '#e2e8f0', borderColor: '#334155', zIndex: 11
              },
              triggers: [{
                  event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                  tableId: T.materialRequests, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Request_ID'
              }] },

            // Right panel: Request details
            { id: `mh1_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 741, y: 52, w: 539, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `mh1_det_title_${ts}`, type: 'TEXT', x: 760, y: 68, w: 500, h: 20,
              props: { text: 'REQUEST DETAILS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },

            // Status badge
            { id: `mh1_stat_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 760, y: 92, w: 500, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `mh1_stat_lbl_${ts}`, type: 'TEXT', x: 776, y: 102, w: 120, h: 18,
              props: { text: 'STATUS:', fontSize: 12, fontBold: true, textColor: '#94a3b8', zIndex: 12 } },
            { id: `mh1_stat_val_${ts}`, type: 'TEXT', x: 876, y: 102, w: 370, h: 18,
              props: { text: 'REQUESTED', fontSize: 14, fontBold: true, textColor: '#fbbf24', zIndex: 12 } },
            { id: `mh1_flow_txt_${ts}`, type: 'TEXT', x: 776, y: 120, w: 470, h: 18,
              props: { text: 'Pick-up: Assembly  →  Destination: Supermarket', fontSize: 11, textColor: '#64748b', zIndex: 12 } },

            // Detail fields
            { id: `mh1_fields_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 760, y: 156, w: 500, h: 240,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `mh1_f_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 760, y: 156, w: 4, h: 240,
              props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 10, borderWidth: 0, zIndex: 12 } },

            { id: `mh1_f_id_lbl_${ts}`, type: 'TEXT', x: 776, y: 168, w: 220, h: 14,
              props: { text: 'REQUEST ID', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_id_val_${ts}`, type: 'TEXT', x: 776, y: 184, w: 220, h: 20,
              props: { text: '@Selected_Request_ID', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `mh1_f_item_lbl_${ts}`, type: 'TEXT', x: 1010, y: 168, w: 220, h: 14,
              props: { text: 'ITEM', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_item_val_${ts}`, type: 'TEXT', x: 1010, y: 184, w: 220, h: 20,
              props: { text: '@Selected_Request.Item', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `mh1_f_loc_lbl_${ts}`, type: 'TEXT', x: 776, y: 214, w: 220, h: 14,
              props: { text: 'REQUESTING LOCATION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_loc_val_${ts}`, type: 'TEXT', x: 776, y: 230, w: 220, h: 20,
              props: { text: '@Selected_Request.Requesting_Location', fontSize: 13, textColor: '#60a5fa', zIndex: 12 } },

            { id: `mh1_f_sup_lbl_${ts}`, type: 'TEXT', x: 1010, y: 214, w: 220, h: 14,
              props: { text: 'SUPPLIER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_sup_val_${ts}`, type: 'TEXT', x: 1010, y: 230, w: 220, h: 20,
              props: { text: '@Selected_Request.Supplier', fontSize: 13, textColor: '#60a5fa', zIndex: 12 } },

            { id: `mh1_f_qty_lbl_${ts}`, type: 'TEXT', x: 776, y: 260, w: 220, h: 14,
              props: { text: 'QUANTITY', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_qty_val_${ts}`, type: 'TEXT', x: 776, y: 276, w: 80, h: 36,
              props: { text: '@Selected_Request.Quantity', fontSize: 28, fontBold: true, textColor: '#10b981', zIndex: 12 } },

            { id: `mh1_f_requested_lbl_${ts}`, type: 'TEXT', x: 1010, y: 260, w: 220, h: 14,
              props: { text: 'REQUESTED AT', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_requested_val_${ts}`, type: 'TEXT', x: 1010, y: 276, w: 220, h: 20,
              props: { text: '@Selected_Request.Requested', fontSize: 12, textColor: '#94a3b8', zIndex: 12 } },

            { id: `mh1_f_assignee_lbl_${ts}`, type: 'TEXT', x: 776, y: 310, w: 220, h: 14,
              props: { text: 'ASSIGNEE', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh1_f_assignee_val_${ts}`, type: 'TEXT', x: 776, y: 326, w: 460, h: 20,
              props: { text: '@APP_INFO.USER', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            // Start processing button
            { id: `mh1_start_btn_${ts}`, type: 'BUTTON', x: 760, y: 412, w: 500, h: 52,
              props: { text: '⚡  Start Processing Request', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 10, fontSize: 16, fontBold: true, zIndex: 12,
                triggers: [
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE', recordPlaceholderId: `r1_${ts}`,
                      mapping: { 'Status': 'ACTIVE', 'Assignee': '{{$GLOBAL_USER}}', 'Started': '{{$GLOBAL_TIME}}' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Request set to ACTIVE!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_confirm_deliv_${ts}` }
                ] } },

            // Footer
            { id: `mh1_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `mh1_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Material Handling  ·  Screen 1 of 2  ·  Filter: Status = REQUESTED', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `mh1_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
              props: { text: 'Operator: @APP_INFO.USER', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } }
        ]
    };

    // ── SCREEN 2: Confirm Delivery ──────────────────────────────────────────
    const stepConfirmDelivery = {
        id: `s_confirm_deliv_${ts}`,
        title: 'Confirm Delivery',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `mh2_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `mh2_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 2, zIndex: 11 } },
            { id: `mh2_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Material Handling — Confirm Delivery', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `mh2_sub_${ts}`, type: 'TEXT', x: 36, y: 36, w: 700, h: 16,
              props: { text: 'Step 2 of 2  ·  Mark request as DELIVERED or READY_TO_DELIVER', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `mh2_back_btn_${ts}`, type: 'BUTTON', x: 1114, y: 10, w: 150, h: 32,
              props: { label: '← Back', text: '← Back', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_kb_req_${ts}` }] } },

            // Center card layout
            { id: `mh2_main_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 1280, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },

            // Delivery confirmation card
            { id: `mh2_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 280, y: 80, w: 720, h: 440,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12, zIndex: 11 } },
            { id: `mh2_card_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 280, y: 80, w: 6, h: 440,
              props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 12, borderWidth: 0, zIndex: 12 } },

            { id: `mh2_card_title_${ts}`, type: 'TEXT', x: 304, y: 100, w: 680, h: 28,
              props: { text: 'DELIVERY CONFIRMATION', fontSize: 14, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 12 } },

            // Fields grid
            { id: `mh2_f_id_lbl_${ts}`, type: 'TEXT', x: 304, y: 140, w: 320, h: 14,
              props: { text: 'REQUEST ID', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh2_f_id_val_${ts}`, type: 'TEXT', x: 304, y: 156, w: 320, h: 22,
              props: { text: '@Selected_Request_ID', fontSize: 15, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `mh2_f_item_lbl_${ts}`, type: 'TEXT', x: 650, y: 140, w: 320, h: 14,
              props: { text: 'ITEM', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh2_f_item_val_${ts}`, type: 'TEXT', x: 650, y: 156, w: 320, h: 22,
              props: { text: '@Selected_Request.Item', fontSize: 15, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `mh2_f_loc_lbl_${ts}`, type: 'TEXT', x: 304, y: 190, w: 320, h: 14,
              props: { text: 'LOCATION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh2_f_loc_val_${ts}`, type: 'TEXT', x: 304, y: 206, w: 320, h: 20,
              props: { text: '@Selected_Request.Requesting_Location', fontSize: 13, textColor: '#60a5fa', zIndex: 12 } },

            { id: `mh2_f_qty_lbl_${ts}`, type: 'TEXT', x: 650, y: 190, w: 320, h: 14,
              props: { text: 'QUANTITY', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh2_f_qty_val_${ts}`, type: 'TEXT', x: 650, y: 206, w: 100, h: 36,
              props: { text: '@Selected_Request.Quantity', fontSize: 28, fontBold: true, textColor: '#10b981', zIndex: 12 } },

            { id: `mh2_f_sup_lbl_${ts}`, type: 'TEXT', x: 304, y: 240, w: 320, h: 14,
              props: { text: 'SUPPLIER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh2_f_sup_val_${ts}`, type: 'TEXT', x: 304, y: 256, w: 320, h: 20,
              props: { text: '@Selected_Request.Supplier', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            { id: `mh2_f_assignee_lbl_${ts}`, type: 'TEXT', x: 650, y: 240, w: 320, h: 14,
              props: { text: 'ASSIGNEE', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `mh2_f_assignee_val_${ts}`, type: 'TEXT', x: 650, y: 256, w: 320, h: 20,
              props: { text: '@APP_INFO.USER', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            // Divider
            { id: `mh2_sep_${ts}`, type: 'SHAPE_RECTANGLE', x: 304, y: 290, w: 666, h: 1,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 12 } },

            // Action buttons
            { id: `mh2_ready_btn_${ts}`, type: 'BUTTON', x: 304, y: 308, w: 310, h: 52,
              props: { text: '🚚  Ready to Deliver', backgroundColor: '#1e293b', textColor: '#94a3b8', borderColor: '#475569', borderWidth: 1, borderRadius: 10, fontSize: 15, fontBold: true, zIndex: 12,
                triggers: [
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE', recordPlaceholderId: `r1_${ts}`, mapping: { 'Status': 'READY_TO_DELIVER' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Material is ready to be delivered!', messageType: 'info' }
                ] } },

            { id: `mh2_deliv_btn_${ts}`, type: 'BUTTON', x: 658, y: 308, w: 312, h: 52,
              props: { text: '✓  Delivered', backgroundColor: '#15803d', textColor: '#ffffff', borderRadius: 10, fontSize: 16, fontBold: true, zIndex: 12,
                triggers: [
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE', recordPlaceholderId: `r1_${ts}`,
                      mapping: { 'Status': 'DELIVERED', 'Completed': '{{$GLOBAL_TIME}}', 'Delivered_by': '{{$GLOBAL_USER}}' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Request marked as DELIVERED!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_kb_req_${ts}` }
                ] } },

            { id: `mh2_cancel_btn_${ts}`, type: 'BUTTON', x: 304, y: 376, w: 666, h: 40,
              props: { text: 'Cancel — Return to Queue', backgroundColor: 'transparent', textColor: '#ef4444', borderColor: '#ef4444', borderWidth: 1, borderRadius: 8, fontSize: 13, fontBold: true, zIndex: 12,
                triggers: [
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE', recordPlaceholderId: `r1_${ts}`, mapping: { 'Status': 'REQUESTED' } },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_kb_req_${ts}` }
                ] } },

            // Footer
            { id: `mh2_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `mh2_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Material Handling  ·  Screen 2 of 2  ·  Delivery confirmation updates Status field', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `mh2_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
              props: { text: 'Operator: @APP_INFO.USER', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } }
        ]
    };

    return {
        id: `app_mh_${ts}`,
        name: 'Material Handling',
        description: 'Process and deliver material requests created by shop floor stations, optimizing material replenishment cycles.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            previewDevice: 'RESPONSIVE',
            scalingMode: 'FIT_WIDTH',
            appBackgroundColor: '#0f172a',
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.materialRequests],
            appTriggers: [],
            steps: [stepKanbanRequest, stepConfirmDelivery],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
