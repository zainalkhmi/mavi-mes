import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
pptx.author = 'Mandor MES Team';
pptx.title = 'Technologies to be Used in the Solution - MANDOR MES';

// Color Palette (Google Cloud Enterprise Dark Theme)
const C = {
  bg: '0B0F19',
  cardBg: '161F30',
  border: '1E293B',
  accentBlue: '38BDF8',
  accentPurple: 'A855F7',
  accentGreen: '34D399',
  accentYellow: 'FBBF24',
  textWhite: 'FFFFFF',
  textMuted: '94A3B8',
  textDim: '64748B'
};

const slide = pptx.addSlide();
slide.background = { fill: C.bg };

// Header Banner
slide.addText('GOOGLE CLOUD AI BUILDER CUP', {
  x: 0.8, y: 0.45, w: 10, h: 0.35,
  fontSize: 12, bold: true, color: C.accentBlue, fontFace: 'Arial'
});

slide.addText('Technologies to be Used in the Solution', {
  x: 0.8, y: 0.8, w: 11.5, h: 0.6,
  fontSize: 28, bold: true, color: C.textWhite, fontFace: 'Arial'
});

slide.addText('End-to-End Enterprise Architecture: Shopfloor Edge IoT to Google Cloud Vertex AI & Serverless Cloud Run', {
  x: 0.8, y: 1.4, w: 11.5, h: 0.4,
  fontSize: 13, color: C.textMuted, fontFace: 'Arial'
});

// 4 Columns / Cards Layout
const cols = [
  {
    num: '01',
    category: 'AI & Intelligence',
    icon: '🤖',
    borderColor: 'A855F7',
    items: [
      { name: 'Google Vertex AI', desc: 'Enterprise ML model orchestration & tuning' },
      { name: 'Gemini 1.5 Pro & Flash', desc: 'Multimodal vision QC & root cause analysis' },
      { name: 'Agentic Tool Calling', desc: 'Autonomous closed-loop PLC action dispatch' }
    ]
  },
  {
    num: '02',
    category: 'Cloud Compute & CI/CD',
    icon: '⚡',
    borderColor: '38BDF8',
    items: [
      { name: 'Google Cloud Run', desc: 'Serverless container hosting with zero idle cost' },
      { name: 'Cloud Build & Artifact Reg.', desc: 'Automated CI/CD container pipeline' },
      { name: 'Nginx Alpine & Docker', desc: 'Lightweight SPA serving & static asset caching' }
    ]
  },
  {
    num: '03',
    category: 'Streaming & Analytics',
    icon: '📊',
    borderColor: '34D399',
    items: [
      { name: 'Google Cloud Pub/Sub', desc: '14,800+ msg/sec telemetry ingestion queue' },
      { name: 'Google BigQuery', desc: 'Sub-second analytical warehouse for OEE & PDM' },
      { name: 'Google Cloud Storage', desc: 'Secure storage for CAD files & defect evidence' }
    ]
  },
  {
    num: '04',
    category: 'Frontend & Shopfloor Edge',
    icon: '🏭',
    borderColor: 'FBBF24',
    items: [
      { name: 'React 19 & Vite PWA', desc: 'Responsive touchscreen UI for rugged devices' },
      { name: 'MQTT & Modbus TCP/IP', desc: 'Direct PLC hardware register communication' },
      { name: 'RTSP & YOLOv8 Vision', desc: 'High-speed camera edge inspection pipeline' }
    ]
  }
];

const colWidth = 2.75;
const colGap = 0.25;
const startX = 0.8;
const startY = 2.0;
const cardH = 4.5;

cols.forEach((col, i) => {
  const x = startX + i * (colWidth + colGap);

  // Background Card Shape
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: startY, w: colWidth, h: cardH,
    fill: { type: 'solid', color: C.cardBg },
    line: { color: col.borderColor, width: 1.5 },
    rectRadius: 0.15
  });

  // Card Header Tag
  slide.addText(`${col.icon}  PILLAR ${col.num}`, {
    x: x + 0.2, y: startY + 0.2, w: colWidth - 0.4, h: 0.3,
    fontSize: 10, bold: true, color: col.borderColor, fontFace: 'Arial'
  });

  // Card Title
  slide.addText(col.category, {
    x: x + 0.2, y: startY + 0.55, w: colWidth - 0.4, h: 0.45,
    fontSize: 15, bold: true, color: C.textWhite, fontFace: 'Arial'
  });

  // Divider Line inside card
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.2, y: startY + 1.05, w: colWidth - 0.4, h: 0.02,
    fill: { type: 'solid', color: C.border }
  });

  // Items
  col.items.forEach((item, itemIdx) => {
    const itemY = startY + 1.25 + itemIdx * 1.0;

    slide.addText(`▪ ${item.name}`, {
      x: x + 0.2, y: itemY, w: colWidth - 0.4, h: 0.3,
      fontSize: 11.5, bold: true, color: C.textWhite, fontFace: 'Arial'
    });

    slide.addText(item.desc, {
      x: x + 0.35, y: itemY + 0.3, w: colWidth - 0.55, h: 0.55,
      fontSize: 9.5, color: C.textMuted, fontFace: 'Arial'
    });
  });
});

// Footer Status bar
slide.addText('MANDOR MES  •  AI-Powered Manufacturing Execution System  •  Google Cloud Run Live: mandor-app-1019031704866.europe-west1.run.app', {
  x: 0.8, y: 6.8, w: 11.73, h: 0.3,
  fontSize: 10, color: C.textDim, align: 'center', fontFace: 'Arial'
});

const outputPath = 'mandor_technologies_slide.pptx';
await pptx.writeFile({ fileName: outputPath });
console.log(`Slide generated successfully: ${outputPath}`);
