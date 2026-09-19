/**
 * picklistTemplate.js — PRO Manufacturing Edition
 * Dark Industrial 1280×720 | 3 Screens: Requirements → BOM Picking → Material Request
 * Tables: Item_Master, Order_Materials, Manufacturing_BOM
 */
export function createPicklistTemplate() {
    const ts = Date.now(), iso = new Date().toISOString();
    const T = {
        itemMaster: 'tbl_item_master',
        orderMaterials: 'tbl_order_materials',
        bom: 'tbl_manufacturing_bom'
    };

    const V = [
        { id: `v1_${ts}`, name: 'Selected_Order_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v2_${ts}`, name: 'Selected_Product_Name', type: 'string', defaultValue: '', persisted: false },
        { id: `v3_${ts}`, name: 'Selected_Order_Type', type: 'string', defaultValue: '', persisted: false },
        { id: `v4_${ts}`, name: 'Selected_Item_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v5_${ts}`, name: 'Request_Qty', type: 'number', defaultValue: 1, persisted: false }
    ];

    // ── SCREEN 1: Requirements ──────────────────────────────────────────────
    const step1 = {
        id: `s1_${ts}`, title: '1. Requirements', stepType: 'Step', backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `s1_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `s1_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#f97316', borderRadius: 2, zIndex: 11 } },
            { id: `s1_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Kitting Picklist — Requirements', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `s1_step_chip_${ts}`, type: 'TEXT', x: 36, y: 36, w: 600, h: 16,
              props: { text: 'Step 1 of 3  ·  Select order → View BOM → Request material', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `s1_req_btn_${ts}`, type: 'BUTTON', x: 1020, y: 10, w: 240, h: 32,
              props: { label: '+ Request New Material', text: '+ Request New Material', backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: 6, fontSize: 12, fontBold: true, zIndex: 12,
                triggers: [{ name: 'GoReq', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }] } },

            // Left panel: Requirements table
            { id: `s1_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 780, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `s1_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 780, y: 52, w: 1, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 } },

            { id: `s1_tbl_title_${ts}`, type: 'TEXT', x: 16, y: 68, w: 400, h: 20,
              props: { text: 'ORDER REQUIREMENTS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s1_tbl_sub_${ts}`, type: 'TEXT', x: 16, y: 68, w: 760, h: 20,
              props: { text: 'Click any row to load material details →', fontSize: 11, textColor: '#475569', textAlign: 'right', zIndex: 11 } },
            { id: `s1_tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 92, w: 756, h: 540,
              props: { tableId: T.orderMaterials, label: '', visibleColumns: ['Product_Name', 'Status', 'QTY_Required', 'Type', 'Order_ID', 'Priority'],
                fontSize: 13, headerBg: '#1e293b', headerTextColor: '#94a3b8', rowBg: '#0f172a', rowAltBg: '#1e293b', rowTextColor: '#e2e8f0', borderColor: '#334155', zIndex: 11 } },

            // Right panel: Material image + info
            { id: `s1_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 781, y: 52, w: 499, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `s1_img_title_${ts}`, type: 'TEXT', x: 800, y: 68, w: 460, h: 20,
              props: { text: 'MATERIAL IMAGE', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s1_img_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 800, y: 92, w: 460, h: 300,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `s1_img_${ts}`, type: 'IMAGE', x: 820, y: 112, w: 420, h: 260,
              props: { url: 'https://images.unsplash.com/photo-1606575647565-d91ab2d5bbfa?auto=format&fit=crop&w=600&q=80', objectFit: 'contain', zIndex: 12 } },

            // Info strip below image
            { id: `s1_info_title_${ts}`, type: 'TEXT', x: 800, y: 408, w: 460, h: 20,
              props: { text: 'SELECTED ORDER', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s1_info_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 800, y: 432, w: 460, h: 110,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `s1_info_ord_lbl_${ts}`, type: 'TEXT', x: 816, y: 446, w: 200, h: 14,
              props: { text: 'ORDER ID', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s1_info_ord_val_${ts}`, type: 'TEXT', x: 816, y: 462, w: 420, h: 20,
              props: { text: '@Selected_Order_ID', fontSize: 14, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },
            { id: `s1_info_prod_lbl_${ts}`, type: 'TEXT', x: 816, y: 486, w: 200, h: 14,
              props: { text: 'PRODUCT', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s1_info_prod_val_${ts}`, type: 'TEXT', x: 816, y: 502, w: 420, h: 20,
              props: { text: '@Selected_Product_Name', fontSize: 14, fontBold: true, textColor: '#60a5fa', zIndex: 12 } },

            // Footer action bar
            { id: `s1_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `s1_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Kitting Picklist  ·  3-step workflow  ·  Requirements → BOM → Request', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `s1_comp_btn_${ts}`, type: 'BUTTON', x: 1080, y: 688, w: 180, h: 26,
              props: { label: 'View BOM →', text: 'View BOM →', backgroundColor: '#15803d', textColor: '#ffffff', borderRadius: 4, fontSize: 12, fontBold: true, zIndex: 12,
                triggers: [{ name: 'CompAction', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s2_${ts}` } }] }] } }
        ]
    };

    // ── SCREEN 2: View BOM ──────────────────────────────────────────────────
    const step2 = {
        id: `s2_${ts}`, title: '2. View BOM', stepType: 'Step', backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `s2_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `s2_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 2, zIndex: 11 } },
            { id: `s2_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Kitting Picklist — BOM Picking', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `s2_step_chip_${ts}`, type: 'TEXT', x: 36, y: 36, w: 600, h: 16,
              props: { text: 'Step 2 of 3  ·  Verify bill of materials & mark items as picked', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `s2_back_btn_${ts}`, type: 'BUTTON', x: 1114, y: 10, w: 150, h: 32,
              props: { label: '← Requirements', text: '← Requirements', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                triggers: [{ name: 'PrevStep', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }] } },

            // Left panel: BOM + Checklist
            { id: `s2_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 720, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `s2_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 720, y: 52, w: 1, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 } },

            // BOM Table
            { id: `s2_bom_title_${ts}`, type: 'TEXT', x: 16, y: 68, w: 400, h: 20,
              props: { text: 'REQUIRED MATERIALS (BOM)', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s2_bom_tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 92, w: 696, h: 260,
              props: { tableId: T.bom, label: '', visibleColumns: ['Child_Item', 'Child_Item_QTY', 'Unit', 'Status', 'Location'],
                fontSize: 13, headerBg: '#1e293b', headerTextColor: '#94a3b8', rowBg: '#0f172a', rowAltBg: '#1e293b', rowTextColor: '#e2e8f0', borderColor: '#334155', zIndex: 11 } },

            // Picking Checklist
            { id: `s2_check_divider_${ts}`, type: 'SHAPE_RECTANGLE', x: 16, y: 364, w: 696, h: 1,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 11 } },
            { id: `s2_check_title_${ts}`, type: 'TEXT', x: 16, y: 374, w: 400, h: 20,
              props: { text: 'PICKED ITEMS CHECKLIST', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s2_check_sub_${ts}`, type: 'TEXT', x: 16, y: 398, w: 696, h: 18,
              props: { text: 'For larger BOMs, click each item to mark as picked', fontSize: 11, textColor: '#475569', zIndex: 11 } },
            { id: `s2_checklist_${ts}`, type: 'RADIO_GROUP', x: 16, y: 420, w: 696, h: 180,
              props: { label: '', options: ['Wheels', 'Engine', 'Steering wheel', 'Battery Pack', 'Control Module'], targetVariable: 'Selected_Order_Type',
                textColor: '#e2e8f0', labelColor: '#94a3b8', accentColor: '#10b981', zIndex: 11 } },

            // Right panel: Component image
            { id: `s2_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 721, y: 52, w: 559, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `s2_img_title_${ts}`, type: 'TEXT', x: 740, y: 68, w: 520, h: 20,
              props: { text: 'COMPONENT IMAGES', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s2_img_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 740, y: 92, w: 520, h: 340,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `s2_img_${ts}`, type: 'IMAGE', x: 760, y: 112, w: 480, h: 300,
              props: { url: 'https://images.unsplash.com/photo-1606575647565-d91ab2d5bbfa?auto=format&fit=crop&w=700&q=80', objectFit: 'contain', zIndex: 12 } },

            // Picking summary card
            { id: `s2_sum_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 740, y: 448, w: 520, h: 180,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `s2_sum_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 740, y: 448, w: 4, h: 180,
              props: { shapeVariant: 'rectangle', backgroundColor: '#10b981', borderRadius: 10, borderWidth: 0, zIndex: 12 } },
            { id: `s2_sum_title_${ts}`, type: 'TEXT', x: 756, y: 460, w: 496, h: 18,
              props: { text: 'PICKING SESSION', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 1, zIndex: 12 } },
            { id: `s2_sum_order_lbl_${ts}`, type: 'TEXT', x: 756, y: 482, w: 200, h: 14,
              props: { text: 'ORDER', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s2_sum_order_val_${ts}`, type: 'TEXT', x: 756, y: 498, w: 496, h: 20,
              props: { text: '@Selected_Order_ID', fontSize: 14, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },
            { id: `s2_comp_pick_btn_${ts}`, type: 'BUTTON', x: 756, y: 528, w: 480, h: 48,
              props: { label: '✓  Complete Picking', text: '✓  Complete Picking', backgroundColor: '#15803d', textColor: '#ffffff', borderRadius: 10, fontSize: 16, fontBold: true, zIndex: 12,
                triggers: [{ name: 'CompPick', event: 'ON_CLICK', actions: [
                    { type: 'SHOW_MESSAGE', payload: { message: 'Picking completed successfully!', msgType: 'success' } },
                    { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
                ] }] } },

            // Footer
            { id: `s2_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `s2_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Mark all items as picked before completing  ·  Screen 2 of 3', fontSize: 11, textColor: '#475569', zIndex: 11 } }
        ]
    };

    // ── SCREEN 3: Request New Material ─────────────────────────────────────
    const step3 = {
        id: `s3_${ts}`, title: '3. Request Material', stepType: 'Step', backgroundColor: '#0f172a',
        components: [
            // Top Header
            { id: `s3_topbar_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 0, w: 1280, h: 52,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `s3_accent_${ts}`, type: 'SHAPE_RECTANGLE', x: 20, y: 14, w: 8, h: 24,
              props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 2, zIndex: 11 } },
            { id: `s3_title_${ts}`, type: 'TEXT', x: 36, y: 10, w: 700, h: 32,
              props: { text: 'Kitting Picklist — Material Request', fontSize: 20, fontBold: true, textColor: '#f8fafc', zIndex: 11 } },
            { id: `s3_step_chip_${ts}`, type: 'TEXT', x: 36, y: 36, w: 600, h: 16,
              props: { text: 'Step 3 of 3  ·  Select item from master catalog & submit request', fontSize: 10, textColor: '#475569', zIndex: 11 } },
            { id: `s3_back_btn_${ts}`, type: 'BUTTON', x: 1114, y: 10, w: 150, h: 32,
              props: { label: '← Back', text: '← Back', backgroundColor: '#334155', textColor: '#94a3b8', borderRadius: 6, fontSize: 11, zIndex: 12,
                triggers: [{ name: 'PrevStep', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }] } },

            // Left: Item master table
            { id: `s3_left_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 52, w: 720, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `s3_div_${ts}`, type: 'SHAPE_RECTANGLE', x: 720, y: 52, w: 1, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 10 } },
            { id: `s3_cat_title_${ts}`, type: 'TEXT', x: 16, y: 68, w: 400, h: 20,
              props: { text: 'ITEM MASTER CATALOG', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },
            { id: `s3_cat_tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 16, y: 92, w: 696, h: 540,
              props: { tableId: T.itemMaster, label: '', visibleColumns: ['Item_Name', 'Description', 'Type', 'Unit', 'Current_Stock'],
                fontSize: 13, headerBg: '#1e293b', headerTextColor: '#94a3b8', rowBg: '#0f172a', rowAltBg: '#1e293b', rowTextColor: '#e2e8f0', borderColor: '#334155', zIndex: 11 } },

            // Right: Request form
            { id: `s3_right_bg_${ts}`, type: 'SHAPE_RECTANGLE', x: 721, y: 52, w: 559, h: 628,
              props: { shapeVariant: 'rectangle', backgroundColor: '#0f172a', borderWidth: 0, zIndex: 10 } },
            { id: `s3_form_title_${ts}`, type: 'TEXT', x: 740, y: 68, w: 520, h: 20,
              props: { text: 'REQUEST DETAILS', fontSize: 11, fontBold: true, textColor: '#64748b', letterSpacing: 2, zIndex: 11 } },

            { id: `s3_form_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 740, y: 92, w: 520, h: 380,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, borderRadius: 10, zIndex: 11 } },
            { id: `s3_form_acc_${ts}`, type: 'SHAPE_RECTANGLE', x: 740, y: 92, w: 4, h: 380,
              props: { shapeVariant: 'rectangle', backgroundColor: '#6366f1', borderRadius: 10, borderWidth: 0, zIndex: 12 } },

            { id: `s3_item_lbl_${ts}`, type: 'TEXT', x: 756, y: 108, w: 490, h: 14,
              props: { text: 'SELECTED ITEM', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s3_item_val_${ts}`, type: 'TEXT', x: 756, y: 124, w: 490, h: 22,
              props: { text: '@Selected_Item_ID', fontSize: 15, fontBold: true, textColor: '#f8fafc', zIndex: 12 } },

            { id: `s3_sep1_${ts}`, type: 'SHAPE_RECTANGLE', x: 756, y: 154, w: 490, h: 1,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 12 } },

            { id: `s3_qty_lbl_${ts}`, type: 'TEXT', x: 756, y: 164, w: 490, h: 14,
              props: { text: 'QUANTITY TO REQUEST', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s3_qty_card_${ts}`, type: 'SHAPE_RECTANGLE', x: 756, y: 182, w: 490, h: 80,
              props: { shapeVariant: 'rectangle', backgroundColor: 'rgba(99,102,241,0.1)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 8, zIndex: 12 } },
            { id: `s3_qty_input_${ts}`, type: 'TEXT_INPUT', x: 764, y: 186, w: 474, h: 70,
              props: { label: '', targetVariable: 'Request_Qty', inputType: 'number', fontSize: 42, fontBold: true, textColor: '#818cf8', backgroundColor: 'transparent', borderWidth: 0, textAlign: 'center', placeholder: '1', zIndex: 13 } },

            { id: `s3_sep2_${ts}`, type: 'SHAPE_RECTANGLE', x: 756, y: 274, w: 490, h: 1,
              props: { shapeVariant: 'rectangle', backgroundColor: '#334155', borderWidth: 0, zIndex: 12 } },

            { id: `s3_order_lbl_${ts}`, type: 'TEXT', x: 756, y: 284, w: 200, h: 14,
              props: { text: 'ORDER ID', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s3_order_val_${ts}`, type: 'TEXT', x: 756, y: 300, w: 490, h: 20,
              props: { text: '@Selected_Order_ID', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            { id: `s3_prod_lbl_${ts}`, type: 'TEXT', x: 756, y: 328, w: 200, h: 14,
              props: { text: 'PRODUCT', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s3_prod_val_${ts}`, type: 'TEXT', x: 756, y: 344, w: 490, h: 20,
              props: { text: '@Selected_Product_Name', fontSize: 13, textColor: '#94a3b8', zIndex: 12 } },

            { id: `s3_note_lbl_${ts}`, type: 'TEXT', x: 756, y: 372, w: 200, h: 14,
              props: { text: 'REQUEST TYPE', fontSize: 9, fontBold: true, textColor: '#475569', letterSpacing: 1, zIndex: 12 } },
            { id: `s3_note_val_${ts}`, type: 'TEXT', x: 756, y: 388, w: 490, h: 20,
              props: { text: '@Selected_Order_Type  ·  Urgent', fontSize: 13, textColor: '#fbbf24', zIndex: 12 } },

            // Submit button
            { id: `s3_submit_btn_${ts}`, type: 'BUTTON', x: 740, y: 490, w: 520, h: 52,
              props: { label: '→  Request Material', text: '→  Request Material', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 10, fontSize: 16, fontBold: true, zIndex: 12,
                triggers: [{ name: 'SubmitReq', event: 'ON_CLICK', actions: [
                    { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_order_${ts}` } },
                    { type: 'SHOW_MESSAGE', payload: { message: 'Material requested successfully!', msgType: 'success' } },
                    { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
                ] }] } },
            { id: `s3_submit_sub_${ts}`, type: 'TEXT', x: 740, y: 550, w: 520, h: 16,
              props: { text: 'Creates a record in Order_Materials and notifies warehouse', fontSize: 11, textColor: '#475569', textAlign: 'center', zIndex: 12 } },

            // Footer
            { id: `s3_footer_${ts}`, type: 'SHAPE_RECTANGLE', x: 0, y: 680, w: 1280, h: 40,
              props: { shapeVariant: 'rectangle', backgroundColor: '#1e293b', borderWidth: 0, borderRadius: 0, zIndex: 10 } },
            { id: `s3_footer_txt_${ts}`, type: 'TEXT', x: 20, y: 688, w: 700, h: 20,
              props: { text: 'Material request will be linked to Order_Materials table  ·  Screen 3 of 3', fontSize: 11, textColor: '#475569', zIndex: 11 } }
        ]
    };

    return {
        id: `app_picklist_${ts}`,
        name: 'Picklist Kitting',
        description: 'Facilitate the kitting process with a comprehensive list of all materials needed in an assembly line.',
        category: 'Warehouse',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            previewDevice: 'RESPONSIVE',
            scalingMode: 'FIT_WIDTH',
            appBackgroundColor: '#0f172a',
            appVariables: V,
            recordPlaceholders: [
                { id: `rp_order_${ts}`, name: 'New_Order_Material', tableId: T.orderMaterials, description: 'New material request' }
            ],
            appTables: [T.itemMaster, T.orderMaterials, T.bom],
            appTriggers: [],
            steps: [step1, step2, step3],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
