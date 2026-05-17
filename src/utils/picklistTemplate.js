/**
 * picklistTemplate.js
 * Picklist Template for Kitting Process
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

    // Step 1: Requirements
    const step1 = { id: `s1_${ts}`, title: '1. Requirements', stepType: 'Step', components: [
        { id: `s1h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Requirements', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // Left side: Requirements Table
        { id: `s1box_l_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 580, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s1tblh_${ts}`, type: 'TEXT', x: 30, y: 70, w: 300, h: 30, props: { text: 'Requirements', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s1btn_req_${ts}`, type: 'BUTTON', x: 420, y: 70, w: 170, h: 35, props: {
            label: '+ Request new material', text: '+ Request new material', backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: 13, fontWeight: 'bold',
            triggers: [{ name: 'GoReq', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s3_${ts}` } }] }]
        }},
        { id: `s1tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 30, y: 110, w: 560, h: 330, props: {
            tableId: T.orderMaterials, label: '', visibleColumns: ['Product_Name', 'Status', 'QTY_Required', 'Type'], fontSize: 12
        }},

        // Right side: Image
        { id: `s1box_r_${ts}`, type: 'SHAPE', x: 620, y: 60, w: 320, h: 400, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        { id: `s1imgh_${ts}`, type: 'TEXT', x: 630, y: 70, w: 300, h: 30, props: { text: 'Material Image', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s1img_${ts}`, type: 'IMAGE', x: 640, y: 110, w: 280, h: 280, props: { url: 'https://images.unsplash.com/photo-1606575647565-d91ab2d5bbfa?auto=format&fit=crop&w=400&q=80', objectFit: 'contain' } },
        
        // Bottom Action Bar
        { id: `s1actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s1btn_comp_${ts}`, type: 'BUTTON', x: 740, y: 490, w: 200, h: 40, props: {
            label: '✓ Complete', text: '✓ Complete', backgroundColor: '#4d7c0f', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'CompAction', event: 'ON_CLICK', actions: [
                { type: 'GO_TO_STEP', payload: { stepId: `s2_${ts}` } }
            ] }]
        }}
    ]};

    // Step 2: View BOM
    const step2 = { id: `s2_${ts}`, title: '2. View BOM', stepType: 'Step', components: [
        { id: `s2h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'View BOM', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        { id: `s2box_${ts}`, type: 'SHAPE', x: 20, y: 60, w: 920, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        // Left: BOM Table + Checklist
        { id: `s2tblh_${ts}`, type: 'TEXT', x: 30, y: 70, w: 400, h: 30, props: { text: 'Required materials', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s2tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 30, y: 110, w: 440, h: 180, props: {
            tableId: T.bom, label: '', visibleColumns: ['Child_Item', 'Child_Item_QTY'], fontSize: 12
        }},
        
        { id: `s2checkh_${ts}`, type: 'TEXT', x: 30, y: 310, w: 400, h: 25, props: { text: 'Completed materials', fontSize: 18, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s2checksub_${ts}`, type: 'TEXT', x: 30, y: 335, w: 440, h: 30, props: { text: 'for larger bills of material, click on each item to mark which item were picked', fontSize: 12, color: '#64748b' } },
        { id: `s2checklist_${ts}`, type: 'RADIO_GROUP', x: 30, y: 365, w: 400, h: 80, props: { options: ['Wheels', 'Engine', 'Steering wheel'], targetVariable: 'Selected_Order_Type' } },

        // Right: Images
        { id: `s2imgh_${ts}`, type: 'TEXT', x: 500, y: 70, w: 400, h: 30, props: { text: 'Image of components', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s2img_${ts}`, type: 'IMAGE', x: 500, y: 110, w: 400, h: 250, props: { url: 'https://images.unsplash.com/photo-1606575647565-d91ab2d5bbfa?auto=format&fit=crop&w=600&q=80', objectFit: 'contain' } },
        
        { id: `s2btn_comp_${ts}`, type: 'BUTTON', x: 650, y: 390, w: 250, h: 45, props: {
            label: '✓ Complete picking', text: '✓ Complete picking', backgroundColor: '#4d7c0f', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'CompPick', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Picking completed successfully.', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }},
        
        // Bottom Action Bar
        { id: `s2actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s2btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'PrevStep', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }}
    ]};

    // Step 3: Request New Material
    const step3 = { id: `s3_${ts}`, title: '3. Request', stepType: 'Step', components: [
        { id: `s3h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Request', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        { id: `s3box_${ts}`, type: 'SHAPE', x: 250, y: 60, w: 460, h: 400, props: { shapeType: 'rect', fill: 'white', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 } },
        
        { id: `s3tblh_${ts}`, type: 'TEXT', x: 270, y: 80, w: 400, h: 30, props: { text: 'Material request details', fontSize: 20, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s3tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 270, y: 120, w: 420, h: 180, props: {
            tableId: T.itemMaster, label: '', visibleColumns: ['Item_Name', 'Description', 'Type'], fontSize: 12
        }},
        
        { id: `s3qtyl_${ts}`, type: 'TEXT', x: 270, y: 310, w: 100, h: 20, props: { text: 'QTY', fontSize: 14, fontWeight: 'bold', color: '#1e293b' } },
        { id: `s3qty_${ts}`, type: 'TEXT_INPUT', x: 270, y: 330, w: 420, h: 40, props: { targetVariable: 'Request_Qty', inputType: 'number' } },
        
        { id: `s3btn_req_${ts}`, type: 'BUTTON', x: 380, y: 390, w: 200, h: 45, props: {
            label: '→ Request Material', text: '→ Request Material', backgroundColor: '#3b82f6', color: 'white', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'SubmitReq', event: 'ON_CLICK', actions: [
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_order_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: 'Material requested successfully.', msgType: 'success' } },
                { type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }
            ] }]
        }},
        
        // Bottom Action Bar
        { id: `s3actbox_${ts}`, type: 'SHAPE', x: 0, y: 480, w: 960, h: 60, props: { shapeType: 'rect', fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 } },
        { id: `s3btn_prev_${ts}`, type: 'BUTTON', x: 20, y: 490, w: 120, h: 40, props: {
            label: '← Previous', text: '← Previous', backgroundColor: 'transparent', color: '#3b82f6', fontSize: 15, fontWeight: 'bold',
            triggers: [{ name: 'PrevStep', event: 'ON_CLICK', actions: [{ type: 'GO_TO_STEP', payload: { stepId: `s1_${ts}` } }] }]
        }}
    ]};

    return {
        id: `app_picklist_${ts}`,
        name: 'Picklist Kitting',
        description: 'Facilitate the kitting process with a comprehensive list of all materials needed in an assembly line.',
        category: 'Warehouse',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
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
