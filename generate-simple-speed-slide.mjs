import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
pptx.author = 'Mandor MES';
pptx.title = 'App Creation Speed Benchmark - Mandor AI Copilot';

const C = {
  bg: '0F172A',
  cardBg: '1E293B',
  border: '334155',
  green: '10B981',
  blue: '38BDF8',
  purple: 'A855F7',
  gray: '94A3B8',
  white: 'FFFFFF',
  red: 'F43F5E'
};

const slide = pptx.addSlide();
slide.background = { fill: C.bg };

// Tag / Category
slide.addText('BENCHMARK EVALUATION • GOOGLE CLOUD AI BUILDER CUP', {
  x: 0.8, y: 0.5, w: 11.5, h: 0.35,
  fontSize: 11, bold: true, color: C.blue, fontFace: 'Arial'
});

// Main Title
slide.addText('App Creation Speed: Mandor AI Copilot vs Industry', {
  x: 0.8, y: 0.85, w: 11.5, h: 0.65,
  fontSize: 30, bold: true, color: C.white, fontFace: 'Arial'
});

// Subtitle
slide.addText('From months of traditional development to 45 seconds of natural language prompting with Google Gemini on Vertex AI', {
  x: 0.8, y: 1.5, w: 11.5, h: 0.4,
  fontSize: 13, color: C.gray, fontFace: 'Arial'
});

// 4 Comparison Cards
const cards = [
  {
    title: 'MANDOR AI Copilot',
    subtitle: 'Google Gemini 1.5 on Vertex AI',
    time: '45 SECONDS',
    timeColor: '10B981',
    borderColor: '10B981',
    badge: '🏆 98% FASTER',
    badgeColor: '10B981',
    desc: 'Cukup ketik prompt bahasa alami atau foto SOP fisik. Aplikasi langsung dibuat beserta logic & database.'
  },
  {
    title: 'Tulip Interfaces',
    subtitle: 'Market Leader Frontline No-Code',
    time: '3 – 5 DAYS',
    timeColor: '38BDF8',
    borderColor: '38BDF8',
    badge: 'MANUAL NO-CODE',
    badgeColor: '38BDF8',
    desc: 'Penyusunan widget drag-and-drop manual satu per satu, mapping variabel, dan routing trigger bertahap.'
  },
  {
    title: 'Siemens Mendix',
    subtitle: 'Enterprise Low-Code MES',
    time: '3 – 6 WEEKS',
    timeColor: 'FBBF24',
    borderColor: 'FBBF24',
    badge: 'DEVELOPER REQUIRED',
    badgeColor: 'FBBF24',
    desc: 'Memerlukan engineer low-code tersertifikasi, integrasi arsitektur data, dan approval siklus rilis TI.'
  },
  {
    title: 'Traditional IT Vendor',
    subtitle: 'Custom Coding (React / C# / Java)',
    time: '3 – 4 MONTHS',
    timeColor: 'F43F5E',
    borderColor: 'F43F5E',
    badge: 'EXPENSIVE & SLOW',
    badgeColor: 'F43F5E',
    desc: 'Koding manual penuh, biaya tinggi ($50K+), waktu tunggu antrian tim IT, dan sulit diubah saat ada revisi SOP.'
  }
];

const cardW = 2.75;
const gap = 0.25;
const startX = 0.8;
const startY = 2.1;
const cardH = 3.8;

cards.forEach((c, i) => {
  const x = startX + i * (cardW + gap);

  // Card Background
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: startY, w: cardW, h: cardH,
    fill: { type: 'solid', color: C.cardBg },
    line: { color: c.borderColor, width: i === 0 ? 2 : 1 },
    rectRadius: 0.15
  });

  // Badge Tag
  slide.addText(c.badge, {
    x: x + 0.2, y: startY + 0.25, w: cardW - 0.4, h: 0.3,
    fontSize: 9.5, bold: true, color: c.badgeColor, fontFace: 'Arial'
  });

  // Card Title
  slide.addText(c.title, {
    x: x + 0.2, y: startY + 0.55, w: cardW - 0.4, h: 0.4,
    fontSize: 14, bold: true, color: C.white, fontFace: 'Arial'
  });

  // Card Subtitle
  slide.addText(c.subtitle, {
    x: x + 0.2, y: startY + 0.95, w: cardW - 0.4, h: 0.35,
    fontSize: 9.5, color: C.gray, fontFace: 'Arial'
  });

  // Divider
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.2, y: startY + 1.35, w: cardW - 0.4, h: 0.02,
    fill: { type: 'solid', color: C.border }
  });

  // Big Time Stat
  slide.addText(c.time, {
    x: x + 0.2, y: startY + 1.5, w: cardW - 0.4, h: 0.6,
    fontSize: 22, bold: true, color: c.timeColor, fontFace: 'Arial'
  });

  // Description
  slide.addText(c.desc, {
    x: x + 0.2, y: startY + 2.2, w: cardW - 0.4, h: 1.3,
    fontSize: 9.5, color: C.gray, fontFace: 'Arial'
  });
});

// Bottom 3 Key Highlights
const footerY = 6.1;
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: footerY, w: 11.75, h: 0.85,
  fill: { type: 'solid', color: '161F30' },
  line: { color: '334155', width: 1 },
  rectRadius: 0.1
});

slide.addText('⚡ Instant Prototyping: Buat SOP, Checksheet, atau OEE Dashboard dalam < 1 Menit', {
  x: 1.0, y: footerY + 0.22, w: 3.8, h: 0.4,
  fontSize: 10, bold: true, color: C.white, fontFace: 'Arial'
});

slide.addText('🧠 Powered by Gemini: 1M+ Context Window membaca manual PDF OEM menjadi app', {
  x: 5.0, y: footerY + 0.22, w: 3.8, h: 0.4,
  fontSize: 10, bold: true, color: C.white, fontFace: 'Arial'
});

slide.addText('💰 Zero Dependency: Pangkas biaya developer eksternal dan antrian IT hingga 95%', {
  x: 9.0, y: footerY + 0.22, w: 3.4, h: 0.4,
  fontSize: 10, bold: true, color: C.white, fontFace: 'Arial'
});

const outputPath = 'mandor_copilot_speed_simple_slide.pptx';
await pptx.writeFile({ fileName: outputPath });
console.log(`Simple slide created: ${outputPath}`);
