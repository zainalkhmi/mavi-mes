/**
 * skillManagerTemplate.js
 * Tulip Composable Skill Manager Application Template
 * Features:
 * 1. View Skill Matrix Heatmap with filter by context group/skill/level and instant level adjustment.
 * 2. View Skills definitions table with right-side details panel and archiving.
 * 3. Generate Skill Matrix batch wizard combining available skills with operators.
 */

export function createSkillManagerTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    const appVariables = [
        { id: `var_skm_user_${ts}`, name: 'Selected_User', type: 'string', defaultValue: '', persisted: false },
        { id: `var_skm_skill_${ts}`, name: 'Selected_Skill', type: 'string', defaultValue: '', persisted: false },
        { id: `var_skm_context_${ts}`, name: 'Selected_Context', type: 'string', defaultValue: '', persisted: false },
        { id: `var_skm_level_${ts}`, name: 'Selected_Level', type: 'string', defaultValue: 'Beginner', persisted: false },
        { id: `var_skm_filter_grp_${ts}`, name: 'Filter_Group', type: 'string', defaultValue: 'ALL', persisted: false },
        { id: `var_skm_filter_lvl_${ts}`, name: 'Filter_Level', type: 'string', defaultValue: 'ALL', persisted: false }
    ];

    // STEP 1: View Skill Matrix
    const stepMatrix = {
        id: `step_skm_matrix_${ts}`,
        title: 'View Skill Matrix',
        stepType: 'Step',
        components: [
            {
                id: `skm_header_${ts}`, type: 'TEXT',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '❖ View Skill Matrix', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `skm_filter_bar_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 640, h: 45,
                props: {
                    text: '🔍 Filters: Group [All] | Skill [All] | Level [All]',
                    color: '#334155', padding: '10px 16px', fontSize: 13, fontWeight: 'bold',
                    borderRadius: '6px', backgroundColor: '#f8fafc'
                }
            },
            {
                id: `skm_matrix_table_${ts}`, type: 'TABLE',
                x: 20, y: 120, w: 640, h: 400,
                props: {
                    tableName: 'Skill_Matrix',
                    title: 'Skill Matrix Heatmap',
                    showSearch: true
                }
            },
            {
                id: `skm_selected_card_${ts}`, type: 'TEXT',
                x: 680, y: 65, w: 300, h: 455,
                props: {
                    text: 'SELECTED SKILL RECORD\n\nUser: {{@Selected_User}}\nSkill: {{@Selected_Skill}}\nContext: {{@Selected_Context}}\nLevel: {{@Selected_Level}}',
                    color: '#0f172a', padding: '24px', fontSize: 14, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#f8fafc'
                }
            },
            {
                id: `skm_nav_manage_${ts}`, type: 'BUTTON',
                x: 20, y: 535, w: 180, h: 48,
                props: {
                    text: '📑 Manage Skills', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb'
                },
                triggers: [{
                    name: 'Go to Manage Skills',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_skm_skills_${ts}` } }
                    ]
                }]
            },
            {
                id: `skm_nav_gen_${ts}`, type: 'BUTTON',
                x: 780, y: 535, w: 200, h: 48,
                props: {
                    text: '✨ Generate Matrix', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb'
                },
                triggers: [{
                    name: 'Go to Generate Matrix',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_skm_generate_${ts}` } }
                    ]
                }]
            }
        ]
    };

    // STEP 2: View Skills
    const stepSkills = {
        id: `step_skm_skills_${ts}`,
        title: 'View skills',
        stepType: 'Step',
        components: [
            {
                id: `skm_sk_header_${ts}`, type: 'TEXT',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '❖ View skills', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `skm_sk_table_${ts}`, type: 'TABLE',
                x: 20, y: 65, w: 640, h: 455,
                props: {
                    tableName: 'Skills_Definitions',
                    title: 'Skill Definitions'
                }
            },
            {
                id: `skm_sk_details_${ts}`, type: 'TEXT',
                x: 680, y: 65, w: 300, h: 455,
                props: {
                    text: 'SKILL DEFINITION\n\nID: {{@Selected_Skill}}\nDescription: Assembling the cylinder component...\nContext: MAT001\nContext Type: Product',
                    color: '#0f172a', padding: '24px', fontSize: 14, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#f8fafc'
                }
            },
            {
                id: `skm_sk_nav_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 535, w: 140, h: 48,
                props: {
                    text: '← Previous', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#eff6ff'
                },
                triggers: [{
                    name: 'Go Back',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_skm_matrix_${ts}` } }
                    ]
                }]
            },
            {
                id: `skm_sk_nav_add_${ts}`, type: 'BUTTON',
                x: 820, y: 535, w: 160, h: 48,
                props: {
                    text: '✏️ Add/Edit skill', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb'
                },
                triggers: [{
                    name: 'Add Skill Alert',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: 'Open Add/Edit Skill Definition modal', msgType: 'info' } }
                    ]
                }]
            }
        ]
    };

    // STEP 3: Generate Skill Matrix
    const stepGenerate = {
        id: `step_skm_generate_${ts}`,
        title: 'Generate skill matrix',
        stepType: 'Step',
        components: [
            {
                id: `skm_gen_header_${ts}`, type: 'TEXT',
                x: 20, y: 15, w: 960, h: 40,
                props: { text: '❖ Generate skill matrix', fontSize: 24, fontWeight: 'bold', color: '#0f172a' }
            },
            {
                id: `skm_gen_col1_${ts}`, type: 'TEXT',
                x: 20, y: 65, w: 290, h: 455,
                props: {
                    text: 'Available Skills\n\n• Cylinder Assembly (MAT001)\n• Main Assembly (MAT001)\n• Test skill for station\n• Test for product (MAT001)\n• Assembly (MAT001)',
                    color: '#0f172a', padding: '16px', fontSize: 13, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#ffffff'
                }
            },
            {
                id: `skm_gen_col2_${ts}`, type: 'TEXT',
                x: 330, y: 65, w: 320, h: 455,
                props: {
                    text: 'Selected Skills ➔\n• Assembly (MAT001)\n• Cylinder Assembly (MAT001)\n\nSelected Operators ⬅\n• Albert Harris\n• Ethan Carter\n• Olivia Anderson',
                    color: '#0f172a', padding: '16px', fontSize: 13, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#ffffff'
                }
            },
            {
                id: `skm_gen_col3_${ts}`, type: 'TEXT',
                x: 670, y: 65, w: 310, h: 455,
                props: {
                    text: 'Operators List\n\n• Albert Harris (AH)\n• Andrew Banta (AB)\n• Ethan Carter (EC)\n• Kevin McGee (KM)\n• Larry Foster (LF)\n• Olivia Anderson (OA)',
                    color: '#0f172a', padding: '16px', fontSize: 13, fontWeight: 'bold',
                    borderRadius: '8px', backgroundColor: '#ffffff'
                }
            },
            {
                id: `skm_gen_nav_prev_${ts}`, type: 'BUTTON',
                x: 20, y: 535, w: 140, h: 48,
                props: {
                    text: '← Previous', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#eff6ff'
                },
                triggers: [{
                    name: 'Go Back',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_skm_matrix_${ts}` } }
                    ]
                }]
            },
            {
                id: `skm_gen_nav_submit_${ts}`, type: 'BUTTON',
                x: 380, y: 535, w: 240, h: 48,
                props: {
                    text: '✨ Generate Records', color: 'white', fontWeight: 'bold', backgroundColor: '#2563eb'
                },
                triggers: [{
                    name: 'Generate Matrix Records',
                    event: 'ON_CLICK',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: '✨ Skill matrix records generated successfully!', msgType: 'success' } },
                        { type: 'NAVIGATION', payload: { action: 'GO_TO_STEP', stepId: `step_skm_matrix_${ts}` } }
                    ]
                }]
            }
        ]
    };

    return {
        id: `app_skill_manager_${ts}`,
        name: 'Skill Manager',
        description: 'Track, update, and assign operator skills on the shop floor with an interactive Skill Matrix heatmap, skill definition management, and automated matrix generation.',
        version: 1,
        created_at: iso,
        updated_at: iso,
        variables: appVariables,
        steps: [stepMatrix, stepSkills, stepGenerate],
        config: {
            appTables: [],
            gridSize: 10,
            theme: 'light'
        }
    };
}
