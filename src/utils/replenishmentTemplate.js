/**
 * replenishmentTemplate.js — PRO Manufacturing Edition
 * Dark Industrial 1280×720 | 3 Screens: Open Requests → Select Kanban → Confirm Request
 * Tables: Material Requests, Kanban Cards
 */
export function createReplenishmentTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const T = {
        materialRequests: 'tbl_rep_material_requests',
        kanbanCards: 'tbl_rep_kanban_cards'
    };

    const V = [
        { id: `v1_${ts}`, name: 'Selected_Kanban_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Selected_Request_ID', type: 'string', defaultValue: '', persisted: true }
    ];

    const R = [
        { id: `r1_${ts}`, name: 'Selected_Kanban_Card', tableId: T.kanbanCards, type: 'single' },
        { id: `r2_${ts}`, name: 'Selected_History_Request', tableId: T.materialRequests, type: 'single' }
    ];

    // ── SCREEN 1: View Open Material Requests ──────────────────────────────
    const stepViewOpenReqs = {
        id: `s_view_open_reqs_${ts}`,
        title: 'Open Requests',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `rp1_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `rp1_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 2, zIndex: 11 } },
            { id: `rp1_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Replenishment — Open Material Requests', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `rp1_sub_${ts}`, type: 'TEXT', x: 36, y: 36, w: 700, h: 16,
              props: { text: 'Step 1 of 3  ·  View open requests  →  Select kanban  →  Confirm & dispatch', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `rp1_req_btn_${ts}`, type: 'BUTTON', x: 1020, y: 10, w: 240, h: 32,
              props: { label: 'Request Material →', text: 'Request Material →', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 6, fontSize: 12, fontBold: true, zIndex: 12,
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_kanban_${ts}` }] } },

            // Left panel: Pending requests table
            { id: `rp1_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 700, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `rp1_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 52, w: 1, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 } },

            { id: `rp1_pend_title_${ts}`, type: 'TEXT', x: 16, y: 68, w: 400, h: 20,
              props: { text: 'PENDING REQUESTS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `rp1_pend_sub_${ts}`, type: 'TEXT', x: 16, y: 68, w: 680, h: 20,
              props: { text: 'Click row to load details →', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } },
            { id: `rp1_pend_tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 92, w: 676, h: 540,
              props: {
                  tableId: T.materialRequests,
                  title: '',
                  columns: ['Kanban_ID', 'Item', 'Status', 'Requesting_Location', 'Requested', 'Quantity'],
                  filter: "Status = 'REQUESTED' OR Status = 'ACTIVE'",
                  fontSize: 13, headerBg: '#1e293b', headerTextColor: '#94a3b8',
                  rowBg: '#0f172a', rowAltBg: '#1e293b', rowTextColor: '#e2e8f0', borderColor: '#334155', zIndex: 11
              },
              triggers: [{
                  event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                  tableId: T.materialRequests, recordPlaceholderId: `r2_${ts}`, linkVariable: 'Selected_Request_ID'
              }] },

            // Right panel: Selected request details
            { id: `rp1_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 701, y: 52, w: 579, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },

            { id: `rp1_det_title_${ts}`, type: 'TEXT', x: 720, y: 68, w: 540, h: 20,
              props: { text: 'SELECTED REQUEST DETAIL', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },

            // Status badge card
            { id: `rp1_stat_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 720, y: 92, w: 540, h: 56,
              props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(245,158,11,0.1)', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `rp1_stat_lbl_${ts}`, type: 'TEXT', x: 736, y: 104, w: 120, h: 18,
              props: { text: 'STATUS:', fontSize: 12, fontBold: true, textColor: '#94a3b8', zIndex: 12 } },
            { id: `rp1_stat_val_${ts}`, type: 'TEXT', x: 836, y: 104, w: 400, h: 18,
              props: { text: 'REQUESTED', fontSize: 14, fontBold: true, textColor: '#fbbf24', zIndex: 12 } },
            { id: `rp1_flow_txt_${ts}`, type: 'TEXT', x: 736, y: 122, w: 510, h: 18,
              props: { text: 'Pick-up: Assembly  →  Destination: Supermarket', fontSize: 11, textColor: '#64748b', zIndex: 12 } },

            // Detail fields card
            { id: `rp1_fields_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 720, y: 160, w: 540, h: 260,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `rp1_f_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 720, y: 160, w: 4, h: 260,
              props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 10, borderWidth: 0, zIndex: 12 } },

            { id: `rp1_f_pn_lbl_${ts}`, type: 'TEXT', x: 736, y: 176, w: 240, h: 14,
              props: { text: 'PART NUMBER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_f_pn_val_${ts}`, type: 'TEXT', x: 736, y: 192, w: 240, h: 20,
              props: { text: '@Selected_History_Request.Item', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `rp1_f_desc_lbl_${ts}`, type: 'TEXT', x: 992, y: 176, w: 240, h: 14,
              props: { text: 'PART DESCRIPTION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_f_desc_val_${ts}`, type: 'TEXT', x: 992, y: 192, w: 240, h: 20,
              props: { text: '@Selected_History_Request.Bin', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `rp1_f_qty_lbl_${ts}`, type: 'TEXT', x: 736, y: 222, w: 240, h: 14,
              props: { text: 'QUANTITY', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_f_qty_val_${ts}`, type: 'TEXT', x: 736, y: 238, w: 100, h: 36,
              props: { text: '@Selected_History_Request.Quantity', fontSize: 28, fontBold: true, textColor: '#10b981', zIndex: 12 } },

            { id: `rp1_f_stat_lbl_${ts}`, type: 'TEXT', x: 992, y: 222, w: 240, h: 14,
              props: { text: 'STATUS', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_f_stat_val_${ts}`, type: 'TEXT', x: 992, y: 238, w: 240, h: 20,
              props: { text: '@Selected_History_Request.Status', fontSize: 13, textColor: '#fbbf24', zIndex: 12 } },

            { id: `rp1_f_loc_lbl_${ts}`, type: 'TEXT', x: 736, y: 280, w: 240, h: 14,
              props: { text: 'LOCATION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_f_loc_val_${ts}`, type: 'TEXT', x: 736, y: 296, w: 496, h: 20,
              props: { text: '@Selected_History_Request.Requesting_Location', fontSize: 13, textColor: '#60a5fa', zIndex: 12 } },

            { id: `rp1_f_req_lbl_${ts}`, type: 'TEXT', x: 736, y: 326, w: 240, h: 14,
              props: { text: 'REQUESTED AT', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_f_req_val_${ts}`, type: 'TEXT', x: 736, y: 342, w: 496, h: 20,
              props: { text: '@Selected_History_Request.Requested', fontSize: 12, textColor: '#94a3b8', zIndex: 12 } },

            // Product image placeholder
            { id: `rp1_img_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 720, y: 434, w: 540, h: 190,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `rp1_img_lbl_${ts}`, type: 'TEXT', x: 736, y: 446, w: 508, h: 14,
              props: { text: 'PRODUCT IMAGE', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp1_img_ph_${ts}`, type: 'TEXT', x: 736, y: 468, w: 508, h: 130,
              props: { text: '📷\nProduct / Actuator Cylinder', fontSize: 28, textColor: '#334155', textAlign: 'center', textAlignment: 1, zIndex: 12 } },

            // Footer
            { id: `rp1_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `rp1_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Replenishment  ·  Screen 1 of 3  ·  Filter: Status = REQUESTED OR ACTIVE', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `rp1_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
              props: { text: 'Operator: @APP_INFO.USER', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } }
        ]
    };

    // ── SCREEN 2: Select Kanban Card ────────────────────────────────────────
    const stepSelectKanban = {
        id: `s_select_kanban_${ts}`,
        title: 'Select Kanban',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `rp2_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `rp2_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 2, zIndex: 11 } },
            { id: `rp2_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Replenishment — Select Kanban Card', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `rp2_sub_${ts}`, type: 'TEXT', x: 36, y: 36, w: 700, h: 16,
              props: { text: 'Step 2 of 3  ·  Scan or select a kanban card in your area', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `rp2_back_btn_${ts}`, type: 'BUTTON', x: 940, y: 10, w: 150, h: 32,
              props: { label: '← Back', text: '← Back', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_open_reqs_${ts}` }] } },
            { id: `rp2_create_btn_${ts}`, type: 'BUTTON', x: 1104, y: 10, w: 160, h: 32,
              props: { label: '+ Create Request', text: '+ Create Request', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 6, fontSize: 12, fontBold: true, zIndex: 12,
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_confirm_${ts}` }] } },

            // Left panel: Kanban cards table
            { id: `rp2_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 680, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `rp2_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 680, y: 52, w: 1, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 } },

            { id: `rp2_cards_title_${ts}`, type: 'TEXT', x: 16, y: 68, w: 400, h: 20,
              props: { text: 'KANBAN CARDS IN YOUR AREA', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `rp2_scan_hint_${ts}`, type: 'TEXT', x: 16, y: 92, w: 656, h: 16,
              props: { text: '🔍  Scan barcode or click row to select kanban card', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `rp2_cards_tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 112, w: 656, h: 520,
              props: {
                  tableId: T.kanbanCards,
                  title: '',
                  columns: ['ID', 'Part_Number', 'Part_Description', 'Status', 'QTY', 'Supplier'],
                  filter: 'Active = true',
                  fontSize: 13, headerBg: '#1e293b', headerTextColor: '#94a3b8',
                  rowBg: '#0f172a', rowAltBg: '#1e293b', rowTextColor: '#e2e8f0', borderColor: '#334155', zIndex: 11
              },
              triggers: [{
                  event: 'ON_ROW_SELECT', type: 'DATA', action: 'TABLE_RECORD_LOAD',
                  tableId: T.kanbanCards, recordPlaceholderId: `r1_${ts}`, linkVariable: 'Selected_Kanban_ID'
              }] },

            // Right panel: Kanban details
            { id: `rp2_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 681, y: 52, w: 599, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },

            { id: `rp2_det_title_${ts}`, type: 'TEXT', x: 700, y: 68, w: 560, h: 20,
              props: { text: 'SELECTED REQUEST DETAIL', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },

            // Status badge
            { id: `rp2_stat_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 92, w: 560, h: 56,
              props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10b981', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `rp2_stat_lbl_${ts}`, type: 'TEXT', x: 716, y: 104, w: 120, h: 18,
              props: { text: 'STATUS:', fontSize: 12, fontBold: true, textColor: '#94a3b8', zIndex: 12 } },
            { id: `rp2_stat_val_${ts}`, type: 'TEXT', x: 816, y: 104, w: 420, h: 18,
              props: { text: 'FULL', fontSize: 14, fontBold: true, textColor: '#34d399', zIndex: 12 } },
            { id: `rp2_kb_id_txt_${ts}`, type: 'TEXT', x: 716, y: 122, w: 530, h: 18,
              props: { text: 'Kanban: @Selected_Kanban_ID', fontSize: 11, textColor: '#64748b', zIndex: 12 } },

            // Fields card
            { id: `rp2_fields_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 160, w: 560, h: 260,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `rp2_f_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 160, w: 4, h: 260,
              props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 10, borderWidth: 0, zIndex: 12 } },

            { id: `rp2_f_id_lbl_${ts}`, type: 'TEXT', x: 716, y: 176, w: 250, h: 14,
              props: { text: 'ID', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_f_id_val_${ts}`, type: 'TEXT', x: 716, y: 192, w: 250, h: 20,
              props: { text: '@Selected_Kanban_Card.ID', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `rp2_f_pn_lbl_${ts}`, type: 'TEXT', x: 980, y: 176, w: 260, h: 14,
              props: { text: 'PART NUMBER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_f_pn_val_${ts}`, type: 'TEXT', x: 980, y: 192, w: 260, h: 20,
              props: { text: '@Selected_Kanban_Card.Part_Number', fontSize: 13, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `rp2_f_desc_lbl_${ts}`, type: 'TEXT', x: 716, y: 222, w: 250, h: 14,
              props: { text: 'PART DESCRIPTION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_f_desc_val_${ts}`, type: 'TEXT', x: 716, y: 238, w: 510, h: 20,
              props: { text: '@Selected_Kanban_Card.Part_Description', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            { id: `rp2_f_qty_lbl_${ts}`, type: 'TEXT', x: 716, y: 268, w: 250, h: 14,
              props: { text: 'QUANTITY', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_f_qty_val_${ts}`, type: 'TEXT', x: 716, y: 284, w: 100, h: 36,
              props: { text: '@Selected_Kanban_Card.QTY', fontSize: 28, fontBold: true, textColor: '#10b981', zIndex: 12 } },

            { id: `rp2_f_sup_lbl_${ts}`, type: 'TEXT', x: 980, y: 268, w: 260, h: 14,
              props: { text: 'SUPPLIER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_f_sup_val_${ts}`, type: 'TEXT', x: 980, y: 284, w: 260, h: 20,
              props: { text: '@Selected_Kanban_Card.Supplier', fontSize: 13, textColor: '#60a5fa', zIndex: 12 } },

            { id: `rp2_f_loc_lbl_${ts}`, type: 'TEXT', x: 716, y: 320, w: 510, h: 14,
              props: { text: 'SUPPLIER / CONSUMING LOCATION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_f_loc_val_${ts}`, type: 'TEXT', x: 716, y: 336, w: 510, h: 20,
              props: { text: '@Selected_Kanban_Card.Consuming_location', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            // Product image card
            { id: `rp2_img_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 700, y: 434, w: 560, h: 198,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `rp2_img_lbl_${ts}`, type: 'TEXT', x: 716, y: 446, w: 528, h: 14,
              props: { text: 'KANBAN PRODUCT IMAGE', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp2_img_ph_${ts}`, type: 'TEXT', x: 716, y: 470, w: 528, h: 140,
              props: { text: '📷\nScrews / Component Parts', fontSize: 28, textColor: '#334155', textAlign: 'center', textAlignment: 1, zIndex: 12 } },

            // Footer
            { id: `rp2_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `rp2_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Replenishment  ·  Screen 2 of 3  ·  Filter: Active = true', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `rp2_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
              props: { text: 'Kanban: @Selected_Kanban_ID', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } }
        ]
    };

    // ── SCREEN 3: Confirm Request ───────────────────────────────────────────
    const stepConfirm = {
        id: `s_confirm_${ts}`,
        title: 'Confirm Request',
        stepType: 'Step',
        backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `rp3_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `rp3_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 2, zIndex: 11 } },
            { id: `rp3_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Replenishment — Confirm & Dispatch', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `rp3_sub_${ts}`, type: 'TEXT', x: 36, y: 36, w: 700, h: 16,
              props: { text: 'Step 3 of 3  ·  Review request details and confirm dispatch', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `rp3_back_btn_${ts}`, type: 'BUTTON', x: 1114, y: 10, w: 150, h: 32,
              props: { label: '← Select Kanban', text: '← Select Kanban', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_kanban_${ts}` }] } },

            // Center card
            { id: `rp3_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 1280, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },

            { id: `rp3_card_title_${ts}`, type: 'TEXT', x: 280, y: 72, w: 720, h: 28,
              props: { text: 'REPLENISHMENT ORDER DETAILS', fontSize: 14, fontBold: true, textColor: '#64748b', letterSpacing: 2, textAlign: 'center', textAlignment: 1, zIndex: 11 } },
            { id: `rp3_card_sub_${ts}`, type: 'TEXT', x: 280, y: 100, w: 720, h: 18,
              props: { text: 'Kanban: @Selected_Kanban_ID', fontSize: 13, textColor: '#475569', textAlign: 'center', textAlignment: 1, zIndex: 11 } },

            // Main details card
            { id: `rp3_main_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 280, y: 128, w: 720, h: 300,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 12, zIndex: 11 } },
            { id: `rp3_main_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 280, y: 128, w: 6, h: 300,
              props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 12, borderWidth: 0, zIndex: 12 } },

            { id: `rp3_f_pn_lbl_${ts}`, type: 'TEXT', x: 304, y: 148, w: 330, h: 14,
              props: { text: 'PART NUMBER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_pn_val_${ts}`, type: 'TEXT', x: 304, y: 164, w: 330, h: 22,
              props: { text: '@Selected_Kanban_Card.Part_Number', fontSize: 16, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `rp3_f_desc_lbl_${ts}`, type: 'TEXT', x: 650, y: 148, w: 330, h: 14,
              props: { text: 'DESCRIPTION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_desc_val_${ts}`, type: 'TEXT', x: 650, y: 164, w: 330, h: 22,
              props: { text: '@Selected_Kanban_Card.Part_Description', fontSize: 16, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `rp3_f_qty_lbl_${ts}`, type: 'TEXT', x: 304, y: 198, w: 200, h: 14,
              props: { text: 'QUANTITY', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_qty_val_${ts}`, type: 'TEXT', x: 304, y: 214, w: 120, h: 50,
              props: { text: '@Selected_Kanban_Card.QTY', fontSize: 40, fontBold: true, textColor: '#10b981', zIndex: 12 } },

            { id: `rp3_f_sup_lbl_${ts}`, type: 'TEXT', x: 650, y: 198, w: 330, h: 14,
              props: { text: 'SUPPLIER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_sup_val_${ts}`, type: 'TEXT', x: 650, y: 214, w: 330, h: 22,
              props: { text: '@Selected_Kanban_Card.Supplier', fontSize: 14, textColor: '#60a5fa', zIndex: 12 } },

            { id: `rp3_f_loc_lbl_${ts}`, type: 'TEXT', x: 304, y: 276, w: 676, h: 14,
              props: { text: 'CONSUMING LOCATION', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_loc_val_${ts}`, type: 'TEXT', x: 304, y: 292, w: 676, h: 22,
              props: { text: '@Selected_Kanban_Card.Consuming_location', fontSize: 14, textColor: '#94a3b8', zIndex: 12 } },

            { id: `rp3_f_req_lbl_${ts}`, type: 'TEXT', x: 304, y: 324, w: 676, h: 14,
              props: { text: 'REQUESTOR', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_req_val_${ts}`, type: 'TEXT', x: 304, y: 340, w: 676, h: 22,
              props: { text: '@APP_INFO.USER  ·  @{timestamp}', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            { id: `rp3_f_stat_lbl_${ts}`, type: 'TEXT', x: 304, y: 370, w: 200, h: 14,
              props: { text: 'STATUS ON SUBMIT', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `rp3_f_stat_val_${ts}`, type: 'TEXT', x: 304, y: 386, w: 676, h: 22,
              props: { text: 'REQUESTED → creates record in Inventory_Requests', fontSize: 12, textColor: '#fbbf24', zIndex: 12 } },

            // Action buttons
            { id: `rp3_cancel_btn_${ts}`, type: 'BUTTON', x: 280, y: 448, w: 330, h: 52,
              props: { text: 'Cancel', backgroundColor: '#1e293b', textColor: '#94a3b8', borderColor: '#334155', borderWidth: 1, borderRadius: 10, fontSize: 15, fontBold: true, zIndex: 12,
                triggers: [{ event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_select_kanban_${ts}` }] } },

            { id: `rp3_save_btn_${ts}`, type: 'BUTTON', x: 670, y: 448, w: 330, h: 52,
              props: { text: '✓  Create Replenishment Request', backgroundColor: '#15803d', textColor: '#ffffff', borderRadius: 10, fontSize: 15, fontBold: true, zIndex: 12,
                triggers: [
                    { event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_CREATE', tableId: T.materialRequests,
                      mapping: {
                          'Kanban_ID': '{{@Selected_Kanban_ID}}',
                          'Item': '{{@Selected_Kanban_Card.Part_Number}}',
                          'Supplier': '{{@Selected_Kanban_Card.Supplier}}',
                          'Quantity': '{{@Selected_Kanban_Card.QTY}}',
                          'Status': 'REQUESTED',
                          'Requesting_Location': '{{@Selected_Kanban_Card.Consuming_location}}',
                          'Requestor': '{{$GLOBAL_USER}}',
                          'Requested': '{{$GLOBAL_TIME}}'
                      }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'SHOW_MESSAGE', message: 'Replenishment order sent successfully!', messageType: 'success' },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_open_reqs_${ts}` }
                ] } },
            { id: `rp3_save_sub_${ts}`, type: 'TEXT', x: 280, y: 508, w: 720, h: 16,
              props: { text: 'Creates a REQUESTED record linked to kanban card and notifies warehouse team', fontSize: 11, textColor: '#475569', textAlign: 'center', textAlignment: 1, zIndex: 12 } },

            // Footer
            { id: `rp3_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `rp3_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Replenishment  ·  Screen 3 of 3  ·  Submitting creates a Material_Requests record', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `rp3_footer_user_${ts}`, type: 'TEXT', x: 900, y: 688, w: 360, h: 20,
              props: { text: 'Operator: @APP_INFO.USER', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } }
        ]
    };

    return {
        id: `app_rep_${ts}`,
        name: 'Replenishment',
        description: 'Fulfill material requests and dispatch replenishment container orders to the front-line.',
        category: 'Inventory App Suite',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            previewDevice: 'RESPONSIVE',
            scalingMode: 'FIT_WIDTH',
            appBackgroundColor: '#0f172a',
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.materialRequests, T.kanbanCards],
            appTriggers: [],
            steps: [stepViewOpenReqs, stepSelectKanban, stepConfirm],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
