/**
 * leanDashboardTemplate.js
 * Lean Dashboard Widgets Template based on PSQDC
 */
export function createLeanDashboardTemplate() {
    const ts = Date.now(), iso = new Date().toISOString();
    const T = { leanData: 'tbl_lean_data' };

    const V = [
        { id: `v1_${ts}`, name: 'Incidents_P', type: 'string', defaultValue: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', persisted: true },
        { id: `v2_${ts}`, name: 'Incidents_S', type: 'string', defaultValue: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', persisted: true },
        { id: `v3_${ts}`, name: 'Incidents_Q', type: 'string', defaultValue: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', persisted: true },
        { id: `v4_${ts}`, name: 'Incidents_D', type: 'string', defaultValue: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', persisted: true },
        { id: `v5_${ts}`, name: 'Incidents_C', type: 'string', defaultValue: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', persisted: true },
        { id: `v6_${ts}`, name: 'Dashboard_Location', type: 'string', defaultValue: 'Boston', persisted: true },
        { id: `v7_${ts}`, name: 'Dashboard_Month', type: 'string', defaultValue: iso, persisted: true }
    ];

    // Main Dashboard Step
    const step1 = { id: `s1_${ts}`, title: 'Lean Dashboard', stepType: 'Step', components: [
        { id: `s1h_${ts}`, type: 'TEXT', x: 20, y: 10, w: 920, h: 40, props: { text: 'Lean Dashboard', fontSize: 28, fontWeight: 'bold', color: '#0f172a' } },
        
        // P Widget
        { id: `s1p_${ts}`, type: 'LEAN_DASHBOARD_WIDGET', x: 180, y: 80, w: 260, h: 320, props: { 
            letter: 'P', targetVariable: 'Incidents_P', month: '@Dashboard_Month', location: '@Dashboard_Location' 
        }},
        
        // S Widget
        { id: `s1s_${ts}`, type: 'LEAN_DASHBOARD_WIDGET', x: 500, y: 80, w: 260, h: 320, props: { 
            letter: 'S', targetVariable: 'Incidents_S', month: '@Dashboard_Month', location: '@Dashboard_Location' 
        }},
        
        // Q Widget
        { id: `s1q_${ts}`, type: 'LEAN_DASHBOARD_WIDGET', x: 80, y: 440, w: 240, h: 300, props: { 
            letter: 'Q', targetVariable: 'Incidents_Q', month: '@Dashboard_Month', location: '@Dashboard_Location' 
        }},
        
        // D Widget
        { id: `s1d_${ts}`, type: 'LEAN_DASHBOARD_WIDGET', x: 360, y: 440, w: 240, h: 300, props: { 
            letter: 'D', targetVariable: 'Incidents_D', month: '@Dashboard_Month', location: '@Dashboard_Location' 
        }},

        // C Widget
        { id: `s1c_${ts}`, type: 'LEAN_DASHBOARD_WIDGET', x: 640, y: 440, w: 240, h: 300, props: { 
            letter: 'C', targetVariable: 'Incidents_C', month: '@Dashboard_Month', location: '@Dashboard_Location' 
        }}
    ]};

    return {
        id: `app_lean_${ts}`,
        name: 'Lean Dashboard',
        description: 'Visualize cell performance across 5 key KPIS (People, Safety, Quality, Delivery, and Cost) using the Lean Dashboard Widgets.',
        category: 'Analytic',
        type: 'FRONT-LINE', published: true, approvalStatus: 'APPROVED',
        createdAt: iso, updatedAt: iso,
        config: {
            appVariables: V,
            recordPlaceholders: [],
            appTables: [T.leanData],
            appTriggers: [],
            steps: [step1],
            automations: [],
            functions: [],
            linkedTables: {}
        }
    };
}
