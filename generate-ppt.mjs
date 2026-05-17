import PptxGenJS from 'pptxgenjs';
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'MAVI Team';
pptx.title = 'MAVI MES - Manufacturing Execution System';

const C = { dark: '0F172A', blue: '2563EB', red: 'DC2626', green: '16A34A', gray: '64748B', white: 'FFFFFF', lightBg: 'F1F5F9', accent: '7C3AED' };

// ═══ SLIDE 1: Title ═══
let s1 = pptx.addSlide();
s1.background = { fill: C.dark };
s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { type: 'solid', color: C.dark } });
s1.addText('⚙️', { x: 4.5, y: 1.0, w: 4, h: 1.2, fontSize: 60, align: 'center', color: C.blue });
s1.addText('MAVI MES', { x: 1, y: 2.0, w: 11, h: 1.2, fontSize: 54, bold: true, color: C.white, align: 'center', fontFace: 'Arial' });
s1.addText('Manufacturing Execution System', { x: 1, y: 3.0, w: 11, h: 0.8, fontSize: 24, color: C.blue, align: 'center', fontFace: 'Arial' });
s1.addText('Digitize Your Shop Floor Operations\nNo-Code App Builder • Real-Time Analytics • Multi-Table Database', { x: 2, y: 4.2, w: 9, h: 1.0, fontSize: 16, color: C.gray, align: 'center', fontFace: 'Arial' });
s1.addText('Product Introduction 2026', { x: 1, y: 6.2, w: 11, h: 0.5, fontSize: 14, color: C.gray, align: 'center' });

// ═══ SLIDE 2: Problem Statement ═══
let s2 = pptx.addSlide();
s2.background = { fill: C.white };
s2.addText('The Challenge', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.dark, fontFace: 'Arial' });
s2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.red } });
const problems = [
    ['📋', 'Paper-Based Processes', 'Manual data collection leads to errors, delays, and zero traceability across production lines.'],
    ['🔗', 'Disconnected Systems', 'Quality, production, and maintenance teams use separate tools with no real-time integration.'],
    ['💰', 'Expensive MES Solutions', 'Traditional MES platforms cost $100K+ and require months of implementation.'],
    ['⏱️', 'Slow Response Time', 'Without real-time visibility, downtime events go undetected for hours.']
];
problems.forEach((p, i) => {
    const y = 1.4 + i * 1.2;
    s2.addText(p[0], { x: 0.8, y, w: 0.8, h: 0.8, fontSize: 32, align: 'center', valign: 'middle' });
    s2.addText(p[1], { x: 1.8, y, w: 4, h: 0.4, fontSize: 18, bold: true, color: C.dark, fontFace: 'Arial' });
    s2.addText(p[2], { x: 1.8, y: y + 0.4, w: 10, h: 0.5, fontSize: 13, color: C.gray, fontFace: 'Arial' });
});

// ═══ SLIDE 3: Solution Overview ═══
let s3 = pptx.addSlide();
s3.background = { fill: C.dark };
s3.addText('MAVI MES — The Solution', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.white, fontFace: 'Arial' });
s3.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.blue } });
const features = [
    ['🏗️', 'No-Code App Builder', 'Drag-and-drop widgets to build production apps in minutes, not months.', C.blue],
    ['📊', 'Real-Time Shop Floor', 'Live OEE dashboards, station monitoring, and Andon alerts.', C.green],
    ['🗃️', 'Multi-Table Database', 'Linked records, formulas, and queries — like Airtable for manufacturing.', C.accent],
    ['🤖', 'AI Copilot', 'Generate apps, triggers, and analytics using natural language.', C.red],
    ['📱', 'PWA Mobile Ready', 'Works on tablets, phones, and kiosks — online and offline.', '0EA5E9'],
    ['🔌', 'IoT & MQTT', 'Connect scales, PLCs, barcode scanners, and OBD2 devices.', 'EA580C']
];
features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 4.2;
    const y = 1.5 + row * 2.5;
    s3.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.8, h: 2.2, fill: { type: 'solid', color: '1E293B' }, rectRadius: 0.15 });
    s3.addText(f[0], { x, y: y + 0.15, w: 3.8, h: 0.6, fontSize: 28, align: 'center' });
    s3.addText(f[1], { x, y: y + 0.7, w: 3.8, h: 0.4, fontSize: 16, bold: true, color: f[3], align: 'center', fontFace: 'Arial' });
    s3.addText(f[2], { x: x + 0.3, y: y + 1.2, w: 3.2, h: 0.8, fontSize: 11, color: C.gray, align: 'center', fontFace: 'Arial' });
});

// ═══ SLIDE 4: App Builder ═══
let s4 = pptx.addSlide();
s4.background = { fill: C.white };
s4.addText('No-Code App Builder', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.dark, fontFace: 'Arial' });
s4.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.blue } });
s4.addText('Build frontline apps without writing code', { x: 0.5, y: 1.2, w: 12, h: 0.5, fontSize: 16, color: C.gray });
const widgets = ['Text Input', 'Barcode Scanner', 'Number Input', 'Signature Pad', 'Pass/Fail Check', 'Interactive Table',
    'Image Capture', 'Timer Widget', 'Radio Group', 'Gauge Display', 'Charts', 'IoT Sensor'];
s4.addText('Available Widgets:', { x: 0.5, y: 2.0, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.dark });
widgets.forEach((w, i) => {
    const col = i % 4; const row = Math.floor(i / 4);
    s4.addShape(pptx.ShapeType.roundRect, { x: 0.5 + col * 3, y: 2.6 + row * 0.7, w: 2.7, h: 0.55, fill: { type: 'solid', color: C.lightBg }, rectRadius: 0.08 });
    s4.addText(`✓ ${w}`, { x: 0.7 + col * 3, y: 2.6 + row * 0.7, w: 2.5, h: 0.55, fontSize: 12, color: C.dark, valign: 'middle' });
});
const capabilities = ['Drag & Drop UI Builder', 'Multi-Step Workflows', 'Conditional Logic & Triggers', 'Variable Binding',
    'Dev Mode Preview', 'Publish to Shop Floor', 'AI Copilot Generation', 'Code Blocks Support'];
s4.addText('Builder Capabilities:', { x: 0.5, y: 4.8, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.dark });
capabilities.forEach((c, i) => {
    const col = i % 4; const row = Math.floor(i / 4);
    s4.addText(`▸ ${c}`, { x: 0.5 + col * 3, y: 5.3 + row * 0.5, w: 2.8, h: 0.45, fontSize: 11, color: C.blue });
});

// ═══ SLIDE 5: Template Gallery ═══
let s5 = pptx.addSlide();
s5.background = { fill: C.lightBg };
s5.addText('Template Gallery', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.dark, fontFace: 'Arial' });
s5.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.accent } });
s5.addText('Pre-built, production-ready apps — install in one click', { x: 0.5, y: 1.2, w: 12, h: 0.5, fontSize: 16, color: C.gray });
const templates = [
    ['🔍', 'Incoming Quality Inspection', 'Quality', 'Spec limit validation, equipment tracking, auto pass/fail judgment with multi-step dimensional & visual checks.', C.blue],
    ['⚖️', 'Weigh and Dispense', 'Manufacturing', 'Pharma-grade dispensing with barcode verification, scale integration, multi-dose workflow, and batch tracking.', C.accent],
    ['🏭', 'Assembly Line Production', 'Production', 'Machine Terminal with 4 linked tables: Orders ↔ Counts ↔ Downtime ↔ Notes. Real-time OEE & KPI tracking.', C.red]
];
templates.forEach((t, i) => {
    const y = 2.0 + i * 1.6;
    s5.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 12, h: 1.4, fill: { type: 'solid', color: C.white }, rectRadius: 0.12, shadow: { type: 'outer', blur: 6, offset: 2, opacity: 0.15, color: '000000' } });
    s5.addText(t[0], { x: 0.8, y: y + 0.15, w: 1, h: 1, fontSize: 36, align: 'center', valign: 'middle' });
    s5.addText(t[1], { x: 2.0, y: y + 0.15, w: 6, h: 0.45, fontSize: 20, bold: true, color: C.dark, fontFace: 'Arial' });
    s5.addShape(pptx.ShapeType.roundRect, { x: 8.5, y: y + 0.2, w: 1.8, h: 0.35, fill: { type: 'solid', color: t[4] }, rectRadius: 0.08 });
    s5.addText(t[2], { x: 8.5, y: y + 0.2, w: 1.8, h: 0.35, fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle' });
    s5.addText(t[3], { x: 2.0, y: y + 0.65, w: 9, h: 0.55, fontSize: 12, color: C.gray, fontFace: 'Arial' });
});

// ═══ SLIDE 6: Multi-Table Database ═══
let s6 = pptx.addSlide();
s6.background = { fill: C.white };
s6.addText('Multi-Table Linked Database', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.dark, fontFace: 'Arial' });
s6.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.accent } });
s6.addText('Relational data architecture — like Airtable, built for manufacturing', { x: 0.5, y: 1.2, w: 12, h: 0.5, fontSize: 16, color: C.gray });
const dbFeatures = [
    ['Linked Records', 'One-to-Many, Many-to-One, Many-to-Many relationships between tables'],
    ['Formula Fields', 'Excel-like formulas: SUM, AVG, IF, ROUND with cell references'],
    ['Query Engine', 'Filter, sort, and aggregate records with configurable queries'],
    ['Auto Timestamps', 'Every record automatically tracks created_at and updated_at'],
    ['Automation Triggers', 'Fire events on TABLE_ROW_ADDED, TABLE_ROW_UPDATED'],
    ['Real-time Sync', 'All data persisted to Supabase with instant sync across stations']
];
dbFeatures.forEach((f, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.2; const y = 2.2 + row * 1.3;
    s6.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.8, h: 1.1, fill: { type: 'solid', color: C.lightBg }, rectRadius: 0.1 });
    s6.addText(f[0], { x: x + 0.3, y, w: 5.2, h: 0.45, fontSize: 16, bold: true, color: C.dark, valign: 'middle' });
    s6.addText(f[1], { x: x + 0.3, y: y + 0.5, w: 5.2, h: 0.5, fontSize: 11, color: C.gray });
});

// ═══ SLIDE 7: Shop Floor & Analytics ═══
let s7 = pptx.addSlide();
s7.background = { fill: C.dark };
s7.addText('Shop Floor & Analytics', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.white, fontFace: 'Arial' });
s7.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.green } });
const sfFeatures = [
    ['📍 Station Manager', 'Register workstations, assign operators, track status (Ready/Running/Down)'],
    ['📊 OEE Dashboard', 'Real-time Overall Equipment Effectiveness with uptime/quality/performance'],
    ['🚨 Andon System', 'Instant alerts for line stops, quality issues, and material shortages'],
    ['📈 Analytics Engine', 'Built-in charts, saved analyses, and custom dashboard builder'],
    ['👤 User & Role Mgmt', 'Operator, Supervisor, Admin roles with station-level permissions'],
    ['📋 Audit Trail', 'Complete logging of every action for compliance and traceability']
];
sfFeatures.forEach((f, i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.2; const y = 1.5 + row * 1.5;
    s7.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.8, h: 1.2, fill: { type: 'solid', color: '1E293B' }, rectRadius: 0.12 });
    s7.addText(f[0], { x: x + 0.3, y: y + 0.1, w: 5.2, h: 0.45, fontSize: 16, bold: true, color: C.blue, valign: 'middle' });
    s7.addText(f[1], { x: x + 0.3, y: y + 0.55, w: 5.2, h: 0.5, fontSize: 12, color: C.gray });
});

// ═══ SLIDE 8: Architecture ═══
let s8 = pptx.addSlide();
s8.background = { fill: C.white };
s8.addText('System Architecture', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.dark, fontFace: 'Arial' });
s8.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.blue } });
const layers = [
    ['Frontend (React + Vite)', 'PWA • Responsive • Offline-capable', C.blue, 1.5],
    ['App Builder Engine', 'No-code builder • AI Copilot • Widget Library', C.accent, 2.5],
    ['Runtime (LiveTerminal)', 'Variable engine • Trigger system • Automation', C.green, 3.5],
    ['Database (Supabase)', 'PostgreSQL • Real-time • Row Level Security', 'EA580C', 4.5],
    ['IoT Layer (MQTT)', 'Scales • PLCs • Barcode Scanners • OBD2', C.red, 5.5]
];
layers.forEach(l => {
    s8.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: l[3], w: 10, h: 0.8, fill: { type: 'solid', color: l[2] }, rectRadius: 0.1 });
    s8.addText(l[0], { x: 1.8, y: l[3], w: 4, h: 0.8, fontSize: 16, bold: true, color: C.white, valign: 'middle' });
    s8.addText(l[1], { x: 6, y: l[3], w: 5, h: 0.8, fontSize: 13, color: C.white, valign: 'middle', align: 'right' });
});
// Arrows between layers
[2.3, 3.3, 4.3, 5.3].forEach(y => {
    s8.addText('▼', { x: 6, y: y - 0.05, w: 1, h: 0.25, fontSize: 14, color: C.gray, align: 'center' });
});

// ═══ SLIDE 9: Why MAVI? ═══
let s9 = pptx.addSlide();
s9.background = { fill: C.lightBg };
s9.addText('Why Choose MAVI MES?', { x: 0.5, y: 0.3, w: 12, h: 0.8, fontSize: 36, bold: true, color: C.dark, fontFace: 'Arial' });
s9.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.0, w: 3, h: 0.05, fill: { type: 'solid', color: C.green } });
const comparisons = [
    ['', 'MAVI MES', 'Traditional MES'],
    ['Setup Time', 'Hours', '6-12 Months'],
    ['Cost', 'Low / Self-hosted', '$100K - $500K+'],
    ['Customization', 'No-code, instant', 'Vendor dependent'],
    ['Mobile Support', 'PWA, any device', 'Desktop only'],
    ['AI Integration', 'Built-in Copilot', 'None'],
    ['Database', 'Multi-table linked', 'Rigid schema'],
    ['IoT Support', 'MQTT native', 'Custom integration']
];
comparisons.forEach((r, i) => {
    const y = 1.5 + i * 0.6;
    const isHeader = i === 0;
    const bgColor = isHeader ? C.dark : (i % 2 === 0 ? C.white : C.lightBg);
    const textColor = isHeader ? C.white : C.dark;
    s9.addShape(pptx.ShapeType.rect, { x: 1, y, w: 3.5, h: 0.55, fill: { type: 'solid', color: bgColor } });
    s9.addShape(pptx.ShapeType.rect, { x: 4.5, y, w: 4, h: 0.55, fill: { type: 'solid', color: isHeader ? C.blue : (i % 2 === 0 ? 'EFF6FF' : 'F0F9FF') } });
    s9.addShape(pptx.ShapeType.rect, { x: 8.5, y, w: 4, h: 0.55, fill: { type: 'solid', color: isHeader ? C.red : bgColor } });
    s9.addText(r[0], { x: 1.1, y, w: 3.3, h: 0.55, fontSize: isHeader ? 13 : 12, bold: isHeader, color: textColor, valign: 'middle' });
    s9.addText(r[1], { x: 4.6, y, w: 3.8, h: 0.55, fontSize: isHeader ? 13 : 12, bold: true, color: isHeader ? C.white : C.blue, valign: 'middle', align: 'center' });
    s9.addText(r[2], { x: 8.6, y, w: 3.8, h: 0.55, fontSize: isHeader ? 13 : 12, bold: isHeader, color: isHeader ? C.white : C.gray, valign: 'middle', align: 'center' });
});

// ═══ SLIDE 10: CTA ═══
let s10 = pptx.addSlide();
s10.background = { fill: C.dark };
s10.addText('🚀', { x: 4.5, y: 1.0, w: 4, h: 1, fontSize: 60, align: 'center' });
s10.addText('Ready to Digitize\nYour Shop Floor?', { x: 1, y: 2.0, w: 11, h: 1.5, fontSize: 42, bold: true, color: C.white, align: 'center', fontFace: 'Arial' });
s10.addText('MAVI MES — Built for Modern Manufacturing', { x: 1, y: 3.8, w: 11, h: 0.6, fontSize: 20, color: C.blue, align: 'center' });
s10.addShape(pptx.ShapeType.roundRect, { x: 4, y: 4.8, w: 5, h: 0.8, fill: { type: 'solid', color: C.blue }, rectRadius: 0.15 });
s10.addText('Get Started Today →', { x: 4, y: 4.8, w: 5, h: 0.8, fontSize: 22, bold: true, color: C.white, align: 'center', valign: 'middle' });
s10.addText('Contact: sales@mavi-mes.com  |  www.mavi-mes.com', { x: 1, y: 6.0, w: 11, h: 0.5, fontSize: 14, color: C.gray, align: 'center' });

const outputPath = './MAVI_MES_Product_Introduction.pptx';
await pptx.writeFile({ fileName: outputPath });
console.log('✅ PPT created:', outputPath);
