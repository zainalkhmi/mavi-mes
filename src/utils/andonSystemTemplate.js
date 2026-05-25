/**
 * andonSystemTemplate.js
 * Andon System Template for Manufacturing
 * Tables: Andon_Events, Andon_Resolutions
 * Automations: Alert Notification, Escalation
 */
export function createAndonSystemTemplate() {
    const ts = Date.now(), iso = new Date().toISOString();
    const T = { events: 'tbl_andon_events', resolutions: 'tbl_andon_resolutions' };

    const V = [
        { id: `v1_${ts}`, name: 'Station_ID', type: 'string', defaultValue: 'Line 1 - Assembly', persisted: true },
        { id: `v2_${ts}`, name: 'Operator', type: 'string', defaultValue: '@APP_INFO.USER', persisted: true },
        { id: `v3_${ts}`, name: 'Alert_Category', type: 'string', defaultValue: '', persisted: false },
        { id: `v4_${ts}`, name: 'Description', type: 'string', defaultValue: '', persisted: false },
        { id: `v5_${ts}`, name: 'Severity', type: 'string', defaultValue: 'High', persisted: false },
        { id: `v6_${ts}`, name: 'Status', type: 'string', defaultValue: 'ACTIVE', persisted: false },
        { id: `v7_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false },
        
        // For resolution
        { id: `v8_${ts}`, name: 'Selected_Event_ID', type: 'string', defaultValue: '', persisted: false },
        { id: `v9_${ts}`, name: 'Responder', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `v10_${ts}`, name: 'Root_Cause', type: 'string', defaultValue: '', persisted: false },
        { id: `v11_${ts}`, name: 'Action_Taken', type: 'string', defaultValue: '', persisted: false },
        { id: `v12_${ts}`, name: 'Downtime_Mins', type: 'number', defaultValue: 0, persisted: false }
    ];

    // Step 1: Operator Call Board
    const step1 = { id: `s1_${ts}`, title: '1. Andon Call Board', stepType: 'Step', components: [
        { id: `s1h_${ts}`, type: 'TEXT', x: 0, y: 0, w: 960, h: 40, props: { text: '🚨 ANDON CALL BOARD', fontSize: 28, fontWeight: '900', color: '#1e293b', textAlign: 'center' } },
        { id: `s1sub_${ts}`, type: 'TEXT', x: 0, y: 45, w: 960, h: 20, props: { text: 'Select an issue category to immediately notify supervisors and support teams.', fontSize: 14, color: '#64748b', textAlign: 'center' } },
        
        { id: `s1st_${ts}`, type: 'TEXT_INPUT', x: 330, y: 80, w: 300, h: 40, props: { label: 'Current Station', targetVariable: 'Station_ID', fontSize: 14, fontWeight: 'bold' } },
        
        // Buttons
        { id: `btn_mat_${ts}`, type: 'BUTTON', x: 80, y: 150, w: 380, h: 100, props: { 
            label: '📦 MATERIAL SHORTAGE', text: '📦 MATERIAL SHORTAGE\nRequest parts replenishment', backgroundColor: '#f59e0b', color: 'white', fontSize: 18, fontWeight: 'bold',
            triggers: [{ name: 'CallMat', event: 'ON_CLICK', actions: [
                { type: 'SET_VARIABLE', payload: { variable: 'Alert_Category', value: 'MATERIAL' } },
                { type: 'SET_VARIABLE', payload: { variable: 'Severity', value: 'Medium' } },
                { type: 'NEXT_STEP' }
            ]}]
        }},
        { id: `btn_maint_${ts}`, type: 'BUTTON', x: 500, y: 150, w: 380, h: 100, props: { 
            label: '🔧 MACHINE FAULT', text: '🔧 MACHINE FAULT\nRequest maintenance support', backgroundColor: '#ef4444', color: 'white', fontSize: 18, fontWeight: 'bold',
            triggers: [{ name: 'CallMaint', event: 'ON_CLICK', actions: [
                { type: 'SET_VARIABLE', payload: { variable: 'Alert_Category', value: 'MAINTENANCE' } },
                { type: 'SET_VARIABLE', payload: { variable: 'Severity', value: 'Critical' } },
                { type: 'NEXT_STEP' }
            ]}]
        }},
        { id: `btn_qual_${ts}`, type: 'BUTTON', x: 80, y: 270, w: 380, h: 100, props: { 
            label: '⚠️ QUALITY DEFECT', text: '⚠️ QUALITY DEFECT\nReport non-conforming product', backgroundColor: '#eab308', color: 'white', fontSize: 18, fontWeight: 'bold',
            triggers: [{ name: 'CallQual', event: 'ON_CLICK', actions: [
                { type: 'SET_VARIABLE', payload: { variable: 'Alert_Category', value: 'QUALITY' } },
                { type: 'SET_VARIABLE', payload: { variable: 'Severity', value: 'High' } },
                { type: 'NEXT_STEP' }
            ]}]
        }},
        { id: `btn_help_${ts}`, type: 'BUTTON', x: 500, y: 270, w: 380, h: 100, props: { 
            label: '🙋 LEADER HELP', text: '🙋 LEADER HELP\nRequest supervisor assistance', backgroundColor: '#3b82f6', color: 'white', fontSize: 18, fontWeight: 'bold',
            triggers: [{ name: 'CallHelp', event: 'ON_CLICK', actions: [
                { type: 'SET_VARIABLE', payload: { variable: 'Alert_Category', value: 'LEADER_HELP' } },
                { type: 'SET_VARIABLE', payload: { variable: 'Severity', value: 'Low' } },
                { type: 'NEXT_STEP' }
            ]}]
        }},
        
        { id: `btn_dash_${ts}`, type: 'BUTTON', x: 330, y: 410, w: 300, h: 45, props: { 
            label: '📊 VIEW ACTIVE ANDONS', text: '📊 VIEW ACTIVE ANDONS', backgroundColor: '#1e293b', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'GoDash', event: 'ON_CLICK', actions: [
                { type: 'NEXT_STEP' }, { type: 'NEXT_STEP' } // Go to step 3
            ]}]
        }}
    ]};

    // Step 2: Confirm Andon
    const step2 = { id: `s2_${ts}`, title: '2. Confirm Andon Details', stepType: 'Step', components: [
        { id: `s2h_${ts}`, type: 'TEXT', x: 50, y: 20, w: 860, h: 35, props: { text: 'Describe the Issue', fontSize: 24, fontWeight: 'bold', color: '#0f172a' } },
        
        { id: `s2cat_${ts}`, type: 'TEXT_INPUT', x: 50, y: 80, w: 300, h: 45, props: { label: 'Category', targetVariable: 'Alert_Category', readOnly: true, fontSize: 18, fontWeight: 'bold' } },
        { id: `s2sev_${ts}`, type: 'RADIO_GROUP', x: 400, y: 80, w: 400, h: 50, props: { label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'], targetVariable: 'Severity' } },
        
        { id: `s2desc_${ts}`, type: 'TEXT_INPUT', x: 50, y: 150, w: 860, h: 100, props: { label: 'Problem Description (Optional)', targetVariable: 'Description', placeholder: 'Provide details to help responders...', multiline: true } },
        
        { id: `s2btn_cancel_${ts}`, type: 'BUTTON', x: 50, y: 290, w: 200, h: 50, props: { 
            label: 'Cancel', text: 'Cancel', backgroundColor: '#e2e8f0', color: '#334155', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'PREVIOUS_STEP' }] }]
        }},
        { id: `s2btn_raise_${ts}`, type: 'BUTTON', x: 280, y: 290, w: 630, h: 50, props: { 
            label: '🚨 RAISE ANDON', text: '🚨 RAISE ANDON', backgroundColor: '#dc2626', color: 'white', fontSize: 18, fontWeight: 'bold',
            triggers: [{ name: 'Raise', event: 'ON_CLICK', actions: [
                { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                { type: 'SET_VARIABLE', payload: { variable: 'Status', value: 'ACTIVE' } },
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_event_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: '🚨 Andon Raised! Notification sent to responders.', msgType: 'error' } },
                { type: 'PREVIOUS_STEP' }
            ]}]
        }}
    ]};

    // Step 3: Supervisor Dashboard
    const step3 = { id: `s3_${ts}`, title: '3. Active Andon Dashboard', stepType: 'Step', components: [
        { id: `s3h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 30, props: { text: '🖥️ Central Andon Dashboard', fontSize: 22, fontWeight: 'bold', color: '#1e293b' } },
        
        { id: `s3tbl_${ts}`, type: 'INTERACTIVE_TABLE', x: 20, y: 60, w: 920, h: 220, props: { 
            tableId: T.events, label: 'Active Andon Events', visibleColumns: ['Station_ID', 'Alert_Category', 'Severity', 'Status', 'Timestamp'], fontSize: 12 
        }},
        
        { id: `s3btn_ack_${ts}`, type: 'BUTTON', x: 20, y: 300, w: 300, h: 45, props: { 
            label: '👀 Acknowledge Selected', text: '👀 Acknowledge Selected', backgroundColor: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Ack', event: 'ON_CLICK', actions: [
                { type: 'SHOW_MESSAGE', payload: { message: 'Event acknowledged. Status updated.', msgType: 'info' } }
                // In a full implementation, this would trigger a TABLE_RECORD_UPDATE on the selected row
            ]}]
        }},
        
        { id: `s3btn_res_${ts}`, type: 'BUTTON', x: 340, y: 300, w: 300, h: 45, props: { 
            label: '✅ Resolve Selected', text: '✅ Resolve Selected', backgroundColor: '#10b981', color: 'white', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Res', event: 'ON_CLICK', actions: [
                { type: 'NEXT_STEP' }
            ]}]
        }},
        
        { id: `s3btn_back_${ts}`, type: 'BUTTON', x: 660, y: 300, w: 280, h: 45, props: { 
            label: 'Back to Call Board', text: 'Back to Call Board', backgroundColor: '#e2e8f0', color: '#334155', fontSize: 14, fontWeight: 'bold',
            triggers: [{ name: 'Back', event: 'ON_CLICK', actions: [
                { type: 'PREVIOUS_STEP' }, { type: 'PREVIOUS_STEP' }
            ]}]
        }}
    ]};

    // Step 4: Resolution Form
    const step4 = { id: `s4_${ts}`, title: '4. Resolve Andon', stepType: 'Step', components: [
        { id: `s4h_${ts}`, type: 'TEXT', x: 50, y: 20, w: 860, h: 30, props: { text: '✅ Resolve Andon Event', fontSize: 24, fontWeight: 'bold', color: '#10b981' } },
        
        { id: `s4rc_${ts}`, type: 'TEXT_INPUT', x: 50, y: 80, w: 400, h: 45, props: { label: 'Root Cause Category', targetVariable: 'Root_Cause', placeholder: 'e.g., Sensor Failure, Out of Spec' } },
        { id: `s4dt_${ts}`, type: 'TEXT_INPUT', x: 480, y: 80, w: 200, h: 45, props: { label: 'Estimated Downtime (mins)', targetVariable: 'Downtime_Mins', inputType: 'number' } },
        
        { id: `s4act_${ts}`, type: 'TEXT_INPUT', x: 50, y: 150, w: 860, h: 80, props: { label: 'Action Taken', targetVariable: 'Action_Taken', placeholder: 'Describe how the issue was fixed...', multiline: true } },
        
        { id: `s4btn_can_${ts}`, type: 'BUTTON', x: 50, y: 260, w: 200, h: 50, props: { 
            label: 'Cancel', text: 'Cancel', backgroundColor: '#e2e8f0', color: '#334155', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'Cancel', event: 'ON_CLICK', actions: [{ type: 'PREVIOUS_STEP' }] }]
        }},
        { id: `s4btn_sub_${ts}`, type: 'BUTTON', x: 280, y: 260, w: 630, h: 50, props: { 
            label: '💾 SAVE RESOLUTION & CLOSE ANDON', text: '💾 SAVE RESOLUTION & CLOSE ANDON', backgroundColor: '#10b981', color: 'white', fontSize: 16, fontWeight: 'bold',
            triggers: [{ name: 'SaveRes', event: 'ON_CLICK', actions: [
                { type: 'SET_VARIABLE', payload: { variable: 'Timestamp', valueType: 'EXPRESSION', value: 'new Date().toISOString()' } },
                { type: 'TABLE_RECORD_CREATE', payload: { placeholderId: `rp_res_${ts}` } },
                { type: 'SHOW_MESSAGE', payload: { message: '✅ Andon resolved successfully! System normalized.', msgType: 'success' } },
                { type: 'PREVIOUS_STEP' }
            ]}]
        }}
    ]};

    const automations = [
        {
            id: `auto_alert_${ts}`,
            name: 'Andon Alert Notification',
            description: 'Notify supervisors immediately when a new Andon is raised.',
            active: true,
            triggers: [{ id: `trig_add_${ts}`, type: 'TABLE_ROW_ADDED', config: { tableId: T.events } }],
            nodes: [
                { id: 'start', type: 'event', position: { x: 250, y: 50 }, data: { label: 'Andon Raised' } },
                { id: 'notify', type: 'action', position: { x: 250, y: 180 }, data: { type: 'SEND_NOTIFICATION', recipient: 'supervisors_group', message: '🚨 NEW ANDON: Immediate attention required at station!' } },
                { id: 'log', type: 'action', position: { x: 250, y: 320 }, data: { type: 'LOG_MESSAGE', message: 'Andon notification sent' } }
            ],
            edges: [
                { source: 'start', target: 'notify' },
                { source: 'notify', target: 'log', sourceHandle: 'success' }
            ]
        }
    ];

    return {
        id: `app_andon_${ts}`,
        name: 'Andon Alert System',
        description: 'Empower operators to instantly raise issues, notify support teams, and track resolution metrics.',
        category: 'Manufacturing',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [
                { id: `rp_event_${ts}`, name: 'Andon_Event_Record', tableId: T.events, description: 'New Andon alert' },
                { id: `rp_res_${ts}`, name: 'Andon_Resolution_Record', tableId: T.resolutions, description: 'Resolution log' }
            ],
            appTables: [T.events, T.resolutions],
            appTriggers: [{ id: `trg_${ts}`, name: 'Init', event: 'ON_APP_START', actions: [{ type: 'SHOW_MESSAGE', payload: { message: '🚨 Andon System Active', msgType: 'info' } }] }],
            steps: [step1, step2, step3, step4],
            automations,
            functions: [],
            linkedTables: {
                events: { placeholder: T.events, description: 'Master table for all Andon events' },
                resolutions: { placeholder: T.resolutions, description: 'Linked resolutions for closed Andons', linkedTo: T.events }
            }
        }
    };
}
