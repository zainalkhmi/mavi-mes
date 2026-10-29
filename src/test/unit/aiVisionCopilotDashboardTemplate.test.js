import { describe, it, expect } from 'vitest';
import { createAiVisionCopilotDashboardTemplate } from '../../utils/aiVisionCopilotDashboardTemplate';
import { rawTemplates } from '../../utils/appStoreCatalog';

describe('AI Vision Quality, Gemini Copilot & BigQuery Dashboard Template', () => {
    it('creates a valid MAVI App Builder frontline application schema', () => {
        const app = createAiVisionCopilotDashboardTemplate();
        
        expect(app).toBeDefined();
        expect(app.name).toBe('AI Vision Quality, Gemini Copilot & BigQuery Dashboard');
        expect(app.type).toBe('FRONT-LINE');
        expect(app.builder_type).toBe('app_builder');
        expect(app.approval_status).toBe('APPROVED');
        expect(app.config).toBeDefined();
    });

    it('contains all required frontline variables for Google Cloud AI pipeline', () => {
        const app = createAiVisionCopilotDashboardTemplate();
        const varNames = app.config.appVariables.map(v => v.name);

        expect(varNames).toContain('Work_Order');
        expect(varNames).toContain('Lot_Number');
        expect(varNames).toContain('Part_SKU');
        expect(varNames).toContain('Drawing_ID');
        expect(varNames).toContain('Inspection_Verdict');
        expect(varNames).toContain('Confidence_Score');
        expect(varNames).toContain('Defect_Type');
        expect(varNames).toContain('Checksheet_Points_Passed');
        expect(varNames).toContain('Gemini_Root_Cause');
        expect(varNames).toContain('SOP_Action');
        expect(varNames).toContain('Scrap_Saved_Kg');
        expect(varNames).toContain('Shift_FPY');
        expect(varNames).toContain('Shift_OEE');
    });

    it('contains all 5 steps addressing the complete Problem Statement lifecycle', () => {
        const app = createAiVisionCopilotDashboardTemplate();
        expect(app.config.steps.length).toBe(5);

        const stepTitles = app.config.steps.map(s => s.title);
        expect(stepTitles[0]).toContain('Setup & IoT Work Order Dispatch');
        expect(stepTitles[1]).toContain('Cognitive Vision AI Station (Vision Builder)');
        expect(stepTitles[2]).toContain('Digital Checksheet & Dimension Specs (Checksheet Suite)');
        expect(stepTitles[3]).toContain('Gemini Operational Copilot & SOP Guidance');
        expect(stepTitles[4]).toContain('Executive Quality, OEE & BigQuery Dashboard');
    });

    it('contains core Google Cloud AI components and direct studio integration buttons', () => {
        const app = createAiVisionCopilotDashboardTemplate();
        const allComponentTypes = app.config.steps.flatMap(s => s.components.map(c => c.type));

        // Vision AI camera
        expect(allComponentTypes).toContain('OPENCV_CAMERA');

        // Gemini Copilot interactive chat
        expect(allComponentTypes).toContain('AI_CHAT');

        // BigQuery audit telemetry table
        expect(allComponentTypes).toContain('INTERACTIVE_TABLE');

        // Form controls & Triggers
        expect(allComponentTypes).toContain('TEXT_INPUT');
        expect(allComponentTypes).toContain('BUTTON');

        // Vision Builder & Checksheet Suite integration buttons
        const buttonLabels = app.config.steps.flatMap(s => s.components.filter(c => c.type === 'BUTTON').map(c => c.props.label || c.props.text));
        expect(buttonLabels.some(l => l.includes('/vision/quickbuild'))).toBe(true);
        expect(buttonLabels.some(l => l.includes('/vision/calibration'))).toBe(true);
        expect(buttonLabels.some(l => l.includes('/drawing-checksheet'))).toBe(true);
        expect(buttonLabels.some(l => l.includes('/checksheets'))).toBe(true);
    });

    it('is registered as the premier template in MAVI App Store catalog', () => {
        const template = rawTemplates.find(t => t.id === 'ai-vision-copilot-dashboard');
        expect(template).toBeDefined();
        expect(template.category).toBe('Quality');
        expect(template.isBuilderCup).toBe(true);
        expect(template.builderCupRole).toBe('Flagship AI & Gemini Copilot');
        expect(template.features.length).toBeGreaterThanOrEqual(4);
        expect(template.guide.tables[0].name).toBe('BigQuery_Vision_Quality_Events');
    });

    it('groups multiple industrial templates under the 🏆 Builder Cup collection', async () => {
        const { categories } = await import('../../utils/appStoreCatalog');
        expect(categories).toContain('🏆 Builder Cup');

        const builderCupTemplates = rawTemplates.filter(t => t.isBuilderCup || t.builderCupRole);
        expect(builderCupTemplates.length).toBeGreaterThanOrEqual(5);

        const ids = builderCupTemplates.map(t => t.id);
        expect(ids).toContain('ai-vision-copilot-dashboard');
        expect(ids).toContain('vision-inspection-suite');
        expect(ids).toContain('production-plant-dashboard');
        expect(ids).toContain('defect-tracking');
        expect(ids).toContain('kanban-suite');
    });
});

