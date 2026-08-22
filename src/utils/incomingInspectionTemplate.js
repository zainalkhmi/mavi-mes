/**
 * incomingInspectionTemplate.js
 * Generates a professional Incoming Inspection application for MANDOR-MES
 * Modeled after Tulip's Final Inspection UI with:
 *  - Left sidebar: Inspection Procedure list with thumbnails
 *  - Center: Inspection Guide image + spec limits + measurement input
 *  - Right: Inspection Equipment details
 *  - Bottom: Previous/Next navigation with SUBMIT
 */

export function createIncomingInspectionTemplate() {
    const ts = Date.now();
    const iso = new Date().toISOString();

    // Inspection items configuration
    const inspections = [
        {
            id: 'overall_length',
            title: 'Overall Length',
            type: 'Dimensional Check',
            description: 'Overall Length',
            lowerSpec: 3.226,
            upperSpec: 3.230,
            unit: 'in',
            equipmentId: 'Caliper-5',
            equipmentName: '4" Digital Caliper',
            equipmentDesc: '4-Way Digital Caliper: 0 in to 4 in/ 0 to 100mm Range, ±0.001 in',
            equipmentLocation: 'Final Inspection',
            equipmentCalibration: 'abr/12/2023 15:00:00 -04:00',
            guideImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=600',
            varName: 'Meas_Overall_Length'
        },
        {
            id: 'outer_diameter',
            title: 'Outer Diameter',
            type: 'Dimensional Check',
            description: 'Outer Diameter',
            lowerSpec: 1.498,
            upperSpec: 1.502,
            unit: 'in',
            equipmentId: 'Micrometer-3',
            equipmentName: '2" Digital Micrometer',
            equipmentDesc: 'Outside Micrometer: 1-2 in Range, ±0.0001 in Resolution',
            equipmentLocation: 'Final Inspection',
            equipmentCalibration: 'mar/05/2024 10:30:00 -04:00',
            guideImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
            varName: 'Meas_Outer_Diameter'
        },
        {
            id: 'shaft_extension',
            title: 'Shaft Extension',
            type: 'Dimensional Check',
            description: 'Shaft Extension Length',
            lowerSpec: 0.745,
            upperSpec: 0.755,
            unit: 'in',
            equipmentId: 'Caliper-5',
            equipmentName: '4" Digital Caliper',
            equipmentDesc: '4-Way Digital Caliper: 0 in to 4 in/ 0 to 100mm Range, ±0.001 in',
            equipmentLocation: 'Final Inspection',
            equipmentCalibration: 'abr/12/2023 15:00:00 -04:00',
            guideImage: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=600',
            varName: 'Meas_Shaft_Extension'
        },
        {
            id: 'lead_damage',
            title: 'Lead Damage',
            type: 'Visual Inspection',
            description: 'Lead Wire Damage Check',
            lowerSpec: null,
            upperSpec: null,
            unit: '',
            equipmentId: 'Visual-1',
            equipmentName: 'Inspection Light + Magnifier',
            equipmentDesc: '10x Magnifying Lamp: LED Daylight 6500K',
            equipmentLocation: 'Final Inspection',
            equipmentCalibration: 'N/A - Visual Tool',
            guideImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=600',
            varName: 'Check_Lead_Damage'
        }
    ];

    // Generate variables
    const appVariables = [
        { id: `var_part_${ts}`, name: 'Part_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_lot_${ts}`, name: 'Lot_Number', type: 'string', defaultValue: '', persisted: true },
        { id: `var_supplier_${ts}`, name: 'Supplier', type: 'string', defaultValue: '', persisted: false },
        { id: `var_qty_${ts}`, name: 'Received_Qty', type: 'number', defaultValue: 0, persisted: false },
        { id: `var_inspector_${ts}`, name: 'Inspector_Name', type: 'string', defaultValue: '@APP_INFO.USER', persisted: false },
        { id: `var_overall_${ts}`, name: 'Overall_Result', type: 'string', defaultValue: 'PENDING', persisted: false },
        { id: `var_timestamp_${ts}`, name: 'Timestamp', type: 'string', defaultValue: '', persisted: false },
        ...inspections.map((insp, i) => ({
            id: `var_meas_${i}_${ts}`,
            name: insp.varName,
            type: insp.type === 'Visual Inspection' ? 'string' : 'number',
            defaultValue: insp.type === 'Visual Inspection' ? '' : 0,
            persisted: false
        })),
        ...inspections.filter(insp => insp.type === 'Dimensional Check').map((insp, i) => ({
            id: `var_judge_${i}_${ts}`,
            name: `${insp.varName}_Result`,
            type: 'string',
            defaultValue: 'PENDING',
            persisted: false
        }))
    ];

    // Step 1: Part Identification & Lot Entry
    const step1 = {
        id: `step_ident_${ts}`,
        title: 'Part Identification',
        stepType: 'Step',
        components: [
            {
                id: `s1_header_${ts}`, type: 'TEXT',
                x: 50, y: 30, w: 900, h: 50,
                props: { text: '📦 Incoming Material Inspection', fontSize: 28, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
            },
            {
                id: `s1_subtitle_${ts}`, type: 'TEXT',
                x: 50, y: 80, w: 900, h: 30,
                props: { text: 'Scan or enter the part information to begin inspection', fontSize: 14, color: '#64748b', textAlign: 'center' }
            },
            {
                id: `s1_barcode_${ts}`, type: 'BARCODE_SCANNER',
                x: 200, y: 140, w: 600, h: 70,
                props: { placeholder: 'Scan Part Barcode / Enter Part Number...', autoFocus: true, targetVariable: 'Part_Number' }
            },
            {
                id: `s1_lot_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 230, w: 600, h: 50,
                props: { label: 'Lot Number', placeholder: 'Enter lot/batch number...', targetVariable: 'Lot_Number', required: true }
            },
            {
                id: `s1_supplier_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 310, w: 600, h: 50,
                props: { label: 'Supplier Name', placeholder: 'Enter supplier...', targetVariable: 'Supplier', required: true }
            },
            {
                id: `s1_qty_${ts}`, type: 'TEXT_INPUT',
                x: 200, y: 390, w: 600, h: 50,
                props: { label: 'Received Quantity', placeholder: '0', targetVariable: 'Received_Qty', inputType: 'number', required: true }
            },
            {
                id: `s1_btn_${ts}`, type: 'BUTTON',
                x: 200, y: 480, w: 600, h: 60,
                props: {
                    label: 'START INSPECTION ▶', text: 'START INSPECTION ▶',
                    backgroundColor: '#2563eb', color: 'white', fontSize: 18, fontWeight: 'bold',
                    triggers: [{ name: 'Begin Inspection', event: 'ON_CLICK', actions: [{ type: 'NEXT_STEP' }] }]
                }
            }
        ]
    };

    // Generate inspection steps (Steps 2-5)
    const inspectionSteps = inspections.map((insp, idx) => {
        const stepNum = idx + 2;
        const isVisual = insp.type === 'Visual Inspection';

        const components = [
            // Header
            {
                id: `s${stepNum}_header_${ts}`, type: 'TEXT',
                x: 0, y: 10, w: 1000, h: 40,
                props: { text: `Inspection Procedure`, fontSize: 20, fontWeight: 'bold', color: '#1e293b' }
            },
            // Step indicator with all inspection items (sidebar simulation)
            {
                id: `s${stepNum}_sidebar_${ts}`, type: 'TEXT',
                x: 0, y: 60, w: 200, h: 240,
                props: {
                    text: inspections.map((item, i) =>
                        `${i === idx ? '▶ ' : '   '}${item.title}${i === idx ? ' ✓' : ''}`
                    ).join('\n'),
                    fontSize: 13,
                    color: '#334155',
                    fontWeight: idx === 0 ? 'bold' : 'normal'
                }
            },
            // Type & Description labels
            {
                id: `s${stepNum}_type_label_${ts}`, type: 'TEXT',
                x: 220, y: 60, w: 150, h: 20,
                props: { text: 'Type', fontSize: 11, color: '#94a3b8', fontWeight: 'bold' }
            },
            {
                id: `s${stepNum}_type_val_${ts}`, type: 'TEXT',
                x: 220, y: 80, w: 200, h: 25,
                props: { text: insp.type, fontSize: 15, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s${stepNum}_desc_label_${ts}`, type: 'TEXT',
                x: 430, y: 60, w: 150, h: 20,
                props: { text: 'Description', fontSize: 11, color: '#94a3b8', fontWeight: 'bold' }
            },
            {
                id: `s${stepNum}_desc_val_${ts}`, type: 'TEXT',
                x: 430, y: 80, w: 250, h: 25,
                props: { text: insp.description, fontSize: 15, fontWeight: 'bold', color: '#1e293b' }
            },
            // Inspection Guide label
            {
                id: `s${stepNum}_guide_label_${ts}`, type: 'TEXT',
                x: 220, y: 120, w: 200, h: 20,
                props: { text: 'Inspection Guide', fontSize: 13, fontWeight: 'bold', color: '#1e293b' }
            },
            // Inspection Guide image
            {
                id: `s${stepNum}_image_${ts}`, type: 'IMAGE',
                x: 220, y: 145, w: 400, h: 250,
                props: { src: insp.guideImage, alt: `${insp.title} Inspection Guide`, borderRadius: '8px' }
            },
            // Inspection Equipment panel
            {
                id: `s${stepNum}_equip_header_${ts}`, type: 'TEXT',
                x: 640, y: 120, w: 300, h: 20,
                props: { text: 'Inspection Equipment', fontSize: 13, fontWeight: 'bold', color: '#1e293b' }
            },
            {
                id: `s${stepNum}_equip_id_${ts}`, type: 'TEXT',
                x: 640, y: 148, w: 300, h: 40,
                props: { text: `ID\n${insp.equipmentId}`, fontSize: 12, color: '#64748b' }
            },
            {
                id: `s${stepNum}_equip_name_${ts}`, type: 'TEXT',
                x: 640, y: 192, w: 300, h: 40,
                props: { text: `Name\n${insp.equipmentName}`, fontSize: 12, color: '#64748b' }
            },
            {
                id: `s${stepNum}_equip_desc_${ts}`, type: 'TEXT',
                x: 640, y: 236, w: 300, h: 50,
                props: { text: `Description\n${insp.equipmentDesc}`, fontSize: 11, color: '#64748b' }
            },
            {
                id: `s${stepNum}_equip_status_${ts}`, type: 'TEXT',
                x: 640, y: 290, w: 300, h: 40,
                props: { text: `Status\nAVAILABLE`, fontSize: 12, color: '#16a34a', fontWeight: 'bold' }
            },
            {
                id: `s${stepNum}_equip_loc_${ts}`, type: 'TEXT',
                x: 640, y: 330, w: 300, h: 40,
                props: { text: `Location\n${insp.equipmentLocation}`, fontSize: 12, color: '#64748b' }
            },
            {
                id: `s${stepNum}_equip_cal_${ts}`, type: 'TEXT',
                x: 640, y: 370, w: 300, h: 40,
                props: { text: `Last Calibration\n${insp.equipmentCalibration}`, fontSize: 11, color: '#64748b' }
            }
        ];

        // Spec limits & measurement input
        if (!isVisual) {
            components.push(
                // Spec limits display
                {
                    id: `s${stepNum}_spec_label_${ts}`, type: 'TEXT',
                    x: 220, y: 410, w: 120, h: 20,
                    props: { text: 'Lower Spec Limit', fontSize: 11, color: '#94a3b8' }
                },
                {
                    id: `s${stepNum}_spec_lower_${ts}`, type: 'TEXT',
                    x: 220, y: 430, w: 100, h: 35,
                    props: { text: `${insp.lowerSpec}`, fontSize: 22, fontWeight: 'bold', color: '#1e293b' }
                },
                {
                    id: `s${stepNum}_spec_dash_${ts}`, type: 'TEXT',
                    x: 330, y: 430, w: 30, h: 35,
                    props: { text: '-', fontSize: 22, color: '#94a3b8', textAlign: 'center' }
                },
                {
                    id: `s${stepNum}_spec_upper_label_${ts}`, type: 'TEXT',
                    x: 360, y: 410, w: 120, h: 20,
                    props: { text: 'Upper Spec Limit', fontSize: 11, color: '#94a3b8' }
                },
                {
                    id: `s${stepNum}_spec_upper_${ts}`, type: 'TEXT',
                    x: 360, y: 430, w: 100, h: 35,
                    props: { text: `${insp.upperSpec}`, fontSize: 22, fontWeight: 'bold', color: '#1e293b' }
                },
                // Measurement input
                {
                    id: `s${stepNum}_meas_input_${ts}`, type: 'TEXT_INPUT',
                    x: 490, y: 420, w: 200, h: 55,
                    props: {
                        label: '', placeholder: '0.000',
                        targetVariable: insp.varName, inputType: 'number', required: true,
                        fontSize: 28, fontWeight: 'bold'
                    }
                },
                // SUBMIT button
                {
                    id: `s${stepNum}_submit_${ts}`, type: 'BUTTON',
                    x: 710, y: 420, w: 200, h: 55,
                    props: {
                        label: 'SUBMIT', text: 'SUBMIT',
                        backgroundColor: '#1e40af', color: 'white', fontSize: 18, fontWeight: 'bold',
                        triggers: [{
                            name: `Submit ${insp.title}`,
                            event: 'ON_CLICK',
                            actions: [
                                {
                                    type: 'SET_VARIABLE',
                                    payload: {
                                        variable: `${insp.varName}_Result`,
                                        valueType: 'EXPRESSION',
                                        value: `Number(@${insp.varName}) >= ${insp.lowerSpec} && Number(@${insp.varName}) <= ${insp.upperSpec} ? "PASS" : "FAIL"`
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: `${insp.title}: Measurement recorded`,
                                        msgType: 'success'
                                    }
                                },
                                {
                                    type: 'SHOW_MESSAGE',
                                    payload: {
                                        message: `⚠️ WARNING: ${insp.title} OUT OF SPEC! Limit: ${insp.lowerSpec} - ${insp.upperSpec} ${insp.unit}`,
                                        msgType: 'error',
                                        showIf: `Number(@${insp.varName}) < ${insp.lowerSpec} || Number(@${insp.varName}) > ${insp.upperSpec}`
                                    }
                                },
                                { type: 'NEXT_STEP' }
                            ]
                        }]
                    }
                }
            );
        } else {
            // Visual inspection - Pass/Fail radio
            components.push(
                {
                    id: `s${stepNum}_visual_label_${ts}`, type: 'TEXT',
                    x: 220, y: 410, w: 400, h: 25,
                    props: { text: 'Visual Inspection Result:', fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
                },
                {
                    id: `s${stepNum}_passfail_${ts}`, type: 'QUALITY_PASS_FAIL',
                    x: 220, y: 440, w: 400, h: 70,
                    props: {
                        label: 'Lead Wire Condition', required: true,
                        targetVariable: insp.varName
                    }
                },
                {
                    id: `s${stepNum}_submit_${ts}`, type: 'BUTTON',
                    x: 710, y: 440, w: 200, h: 55,
                    props: {
                        label: 'SUBMIT', text: 'SUBMIT',
                        backgroundColor: '#1e40af', color: 'white', fontSize: 18, fontWeight: 'bold',
                        triggers: [{
                            name: `Submit ${insp.title}`,
                            event: 'ON_CLICK',
                            actions: [
                                { type: 'SHOW_MESSAGE', payload: { message: `${insp.title} recorded ✓`, msgType: 'success' } },
                                { type: 'NEXT_STEP' }
                            ]
                        }]
                    }
                }
            );
        }

        return {
            id: `step_insp${idx}_${ts}`,
            title: `${stepNum}. ${insp.title}`,
            stepType: 'Step',
            components
        };
    });

    // Final Review Step - uses TEXT_INPUT readOnly to display variable values
    const reviewStep = {
        id: `step_review_${ts}`,
        title: '6. Review & Sign-off',
        stepType: 'Step',
        components: [
            {
                id: `sr_header_${ts}`, type: 'TEXT',
                x: 50, y: 30, w: 900, h: 40,
                props: { text: '📋 Inspection Summary', fontSize: 26, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }
            },
            // Part info row
            {
                id: `sr_part_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 90, w: 400, h: 50,
                props: { label: 'Part Number', targetVariable: 'Part_Number', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Part_Number' }
            },
            {
                id: `sr_lot_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 90, w: 400, h: 50,
                props: { label: 'Lot Number', targetVariable: 'Lot_Number', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Lot_Number' }
            },
            {
                id: `sr_supplier_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 155, w: 400, h: 50,
                props: { label: 'Supplier', targetVariable: 'Supplier', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Supplier' }
            },
            {
                id: `sr_qty_${ts}`, type: 'TEXT_INPUT',
                x: 500, y: 155, w: 400, h: 50,
                props: { label: 'Received Qty', targetVariable: 'Received_Qty', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Received_Qty' }
            },
            // Section: Measurement Results
            {
                id: `sr_meas_title_${ts}`, type: 'TEXT',
                x: 50, y: 225, w: 900, h: 25,
                props: { text: '📏 Measurement Results', fontSize: 16, fontWeight: 'bold', color: '#1e40af' }
            },
            // Measurement values + judgment for each dimensional check
            ...inspections.filter(i => i.type === 'Dimensional Check').flatMap((insp, i) => [
                {
                    id: `sr_mval_${i}_${ts}`, type: 'TEXT_INPUT',
                    x: 50 + (i % 3) * 300, y: 260 + Math.floor(i / 3) * 60, w: 280, h: 50,
                    props: {
                        label: `${insp.title} (${insp.unit})`,
                        targetVariable: insp.varName, readOnly: true,
                        dataSourceType: 'VARIABLE', varSource: insp.varName
                    }
                }
            ]),
            // Result badges for each dimensional check
            ...inspections.filter(i => i.type === 'Dimensional Check').flatMap((insp, i) => [
                {
                    id: `sr_mres_${i}_${ts}`, type: 'TEXT_INPUT',
                    x: 50 + (i % 3) * 300, y: 320 + Math.floor(i / 3) * 60, w: 280, h: 40,
                    props: {
                        label: `${insp.title} Judgment`,
                        targetVariable: `${insp.varName}_Result`, readOnly: true,
                        dataSourceType: 'VARIABLE', varSource: `${insp.varName}_Result`
                    }
                }
            ]),
            // Visual check result
            {
                id: `sr_visual_${ts}`, type: 'TEXT_INPUT',
                x: 50, y: 400, w: 400, h: 50,
                props: { label: 'Lead Damage Check', targetVariable: 'Check_Lead_Damage', readOnly: true, dataSourceType: 'VARIABLE', varSource: 'Check_Lead_Damage' }
            },
            // Overall judgment
            {
                id: `sr_judgment_${ts}`, type: 'RADIO_GROUP',
                x: 50, y: 470, w: 900, h: 80,
                props: {
                    label: 'Final Inspection Judgment', options: ['ACCEPT', 'REJECT', 'CONDITIONAL ACCEPT'], required: true,
                    targetVariable: 'Overall_Result'
                }
            },
            // Notes
            {
                id: `sr_notes_${ts}`, type: 'TEXT_AREA',
                x: 50, y: 570, w: 900, h: 80,
                props: { label: 'Inspector Notes (Optional)', placeholder: 'Any observations or comments...', targetVariable: 'Inspection_Notes' }
            },
            // Submit button
            {
                id: `sr_submit_${ts}`, type: 'BUTTON',
                x: 200, y: 680, w: 600, h: 65,
                props: {
                    label: '✅ COMPLETE INSPECTION', text: '✅ COMPLETE INSPECTION',
                    backgroundColor: '#16a34a', color: 'white', fontSize: 20, fontWeight: 'bold',
                    triggers: [{
                        name: 'Submit Final Inspection',
                        event: 'ON_CLICK',
                        actions: [
                            {
                                type: 'SET_VARIABLE',
                                payload: {
                                    variable: 'Timestamp',
                                    valueType: 'EXPRESSION',
                                    value: 'new Date().toISOString()'
                                }
                            },
                            {
                                type: 'TABLE_RECORD_CREATE',
                                payload: { placeholderId: `rp_iqc_${ts}` }
                            },
                            { type: 'SHOW_MESSAGE', payload: { message: 'Incoming Inspection completed and saved! ✓', msgType: 'success' } },
                            { type: 'COMPLETE_APP' }
                        ]
                    }]
                }
            }
        ]
    };

    return {
        id: `app_iqc_${ts}`,
        name: 'Incoming Quality Inspection',
        description: 'Professional incoming material inspection with dimensional checks, visual inspection, equipment tracking, and spec limit validation',
        category: 'Quality Control',
        type: 'FRONT-LINE',
        published: true,
        approvalStatus: 'APPROVED',
        createdAt: iso,
        updatedAt: iso,

        config: {
            appVariables,
            recordPlaceholders: [
                {
                    id: `rp_iqc_${ts}`,
                    name: 'IQC_Record',
                    tableId: 'iqc_inspections',
                    description: 'Incoming quality control inspection record'
                }
            ],
            appTables: ['iqc_inspections'],
            appTriggers: [
                {
                    id: `trig_start_iqc_${ts}`,
                    name: 'IQC Module Start',
                    event: 'ON_APP_START',
                    actions: [
                        { type: 'SHOW_MESSAGE', payload: { message: '📦 Incoming Inspection Module Ready', msgType: 'info' } }
                    ]
                }
            ],
            steps: [
                step1,
                ...inspectionSteps,
                reviewStep
            ]
        }
    };
}
