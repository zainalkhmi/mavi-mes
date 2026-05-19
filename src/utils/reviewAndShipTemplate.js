export function createReviewAndShipTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();
    
    // Table references for replacement in AppStore
    const T = {
        workOrders: 'tbl_rs_work_orders'
    };

    // Variables for the app
    const V = [
        { id: `v1_${ts}`, name: 'Selected_WO_ID', type: 'string', defaultValue: '', persisted: true },
        { id: `v2_${ts}`, name: 'Filter_Status', type: 'string', defaultValue: 'COMPLETED', persisted: true },
        { id: `v3_${ts}`, name: 'Shipping_Location', type: 'string', defaultValue: 'Dock A', persisted: true }
    ];

    // Record Placeholders
    const R = [
        { id: `r1_${ts}`, name: 'Current_Work_Order', tableId: T.workOrders, type: 'single' }
    ];

    // --- STEP 1: View Work Orders ---
    const stepViewWorkOrders = {
        id: `s_view_${ts}`,
        title: 'View Work Orders',
        stepType: 'Step',
        components: [
            // Header
            {
                id: `c1_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 920, h: 40,
                props: { text: 'Review and Ship Dashboard', fontSize: 28, fontWeight: 'bold', color: '#0f172a' }
            },
            
            // Filters
            {
                id: `c2_${ts}`, type: 'TEXT',
                x: 20, y: 70, w: 100, h: 30,
                props: { text: 'Filter Status:', fontSize: 14, fontWeight: 'bold' }
            },
            {
                id: `c3_${ts}`, type: 'RADIO_GROUP',
                x: 120, y: 60, w: 400, h: 40,
                props: { 
                    label: '', 
                    targetVariable: 'Filter_Status', 
                    options: ['IN PROGRESS', 'COMPLETED', 'SHIPPED', 'DELIVERED'] 
                }
            },
            
            // Interactive Table (Work Orders)
            {
                id: `c5_${ts}`, type: 'INTERACTIVE_TABLE',
                x: 20, y: 120, w: 920, h: 400,
                props: {
                    tableId: T.workOrders,
                    title: 'Work Orders for Shipping Review',
                    columns: ['ID', 'Material_Definition_ID', 'Status', 'QTY_Required', 'QTY_Complete', 'Due_Date'],
                    pageSize: 10
                },
                triggers: [
                    { 
                        event: 'ON_ROW_SELECT', 
                        type: 'DATA', 
                        action: 'TABLE_RECORD_LOAD',
                        tableId: T.workOrders,
                        recordPlaceholderId: `r1_${ts}`,
                        linkVariable: 'Selected_WO_ID'
                    },
                    {
                        event: 'ON_ROW_SELECT',
                        type: 'NAVIGATION',
                        action: 'GO_TO_STEP',
                        stepId: `s_details_${ts}`
                    }
                ]
            }
        ]
    };

    // --- STEP 2: Review and Ship Details ---
    const stepReviewDetails = {
        id: `s_details_${ts}`,
        title: 'Review Details',
        stepType: 'Step',
        components: [
            {
                id: `c15_${ts}`, type: 'HEADING',
                x: 20, y: 10, w: 400, h: 40,
                props: { text: 'Shipping Review', fontSize: 24, fontWeight: 'bold' }
            },
            {
                id: `c16_${ts}`, type: 'BUTTON',
                x: 820, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            },
            {
                id: `c17_${ts}`, type: 'BUTTON',
                x: 680, y: 10, w: 120, h: 40,
                props: { text: 'Print Label', backgroundColor: '#f59e0b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_label_${ts}` }
                ]
            },
            
            // Record Display Widget
            {
                id: `c18_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 70, w: 440, h: 220,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Status', 'QTY_Required', 'QTY_Complete', 'Due_Date', 'Customer_ID'] 
                }
            },

            // Validation and Ship actions
            {
                id: `c20_${ts}`, type: 'TEXT',
                x: 480, y: 70, w: 400, h: 40,
                props: { text: 'Verify Order Completeness', fontSize: 18, fontWeight: 'bold' }
            },
            {
                id: `c21_${ts}`, type: 'CHECKBOX',
                x: 480, y: 120, w: 400, h: 30,
                props: { label: 'Quantities Match Target (QTY_Complete >= QTY_Required)', checked: false }
            },
            {
                id: `c22_${ts}`, type: 'CHECKBOX',
                x: 480, y: 160, w: 400, h: 30,
                props: { label: 'Packaging Intact & Quality Passed', checked: false }
            },
            {
                id: `c23_${ts}`, type: 'TEXT',
                x: 480, y: 220, w: 150, h: 30,
                props: { text: 'Shipping Location:', fontSize: 14 }
            },
            {
                id: `c24_${ts}`, type: 'TEXT_INPUT',
                x: 640, y: 215, w: 240, h: 40,
                props: { targetVariable: 'Shipping_Location' }
            },
            {
                id: `c19_${ts}`, type: 'BUTTON',
                x: 480, y: 280, w: 200, h: 50,
                props: { text: 'MARK AS SHIPPED', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
                triggers: [
                    {
                        event: 'ON_CLICK', type: 'DATA', action: 'TABLE_RECORD_SAVE',
                        recordPlaceholderId: `r1_${ts}`,
                        mapping: { 
                            'Status': 'SHIPPED', 
                            'Location': '@Shipping_Location',
                            'Complete_Date': '{{$GLOBAL_TIME}}'
                        }
                    },
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_view_${ts}` }
                ]
            }
        ]
    };

    // --- STEP 3: Packaging Label ---
    const stepLabel = {
        id: `s_label_${ts}`,
        title: 'Packaging Label',
        stepType: 'Step',
        components: [
            {
                id: `c28_${ts}`, type: 'BUTTON',
                x: 20, y: 10, w: 120, h: 40,
                props: { text: 'Back', backgroundColor: '#64748b', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'NAVIGATION', action: 'GO_TO_STEP', stepId: `s_details_${ts}` }
                ]
            },
            {
                id: `c29_${ts}`, type: 'BUTTON',
                x: 160, y: 10, w: 120, h: 40,
                props: { text: 'Print Label', backgroundColor: '#8b5cf6', color: 'white' },
                triggers: [
                    { event: 'ON_CLICK', type: 'LOGIC', action: 'PRINT_SCREEN' }
                ]
            },
            {
                id: `c30_${ts}`, type: 'HEADING',
                x: 20, y: 70, w: 560, h: 50,
                props: { text: 'SHIPPING LABEL', fontSize: 24, fontWeight: 'bold', textAlignment: 1, backgroundColor: '#000', color: '#fff', padding: '10px' }
            },
            {
                id: `c31_${ts}`, type: 'RECORD_DISPLAY',
                x: 20, y: 130, w: 560, h: 260,
                props: { 
                    placeholderId: `r1_${ts}`,
                    fieldsToShow: ['ID', 'Material_Definition_ID', 'Customer_ID', 'QTY_Complete', 'Location'] 
                }
            },
            {
                id: `c32_${ts}`, type: 'BARCODE_SCANNER',
                x: 170, y: 400, w: 260, h: 100,
                props: { label: 'Order Barcode' }
            }
        ]
    };

    return {
        id: `app_rs_${ts}`,
        name: 'Review and Ship',
        description: 'Review details of work orders and log their completion before shipping them from the manufacturing area.',
        category: 'MES Production Suite',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: R,
            appTables: [T.workOrders],
            appTriggers: [],
            steps: [stepViewWorkOrders, stepReviewDetails, stepLabel],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
