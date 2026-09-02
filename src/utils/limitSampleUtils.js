// ─── Defect Categories Config (Limit Sample / Boundary Standard) ───
export const DEFECT_CATEGORIES = [
  { key: 'SCRATCH', label: 'Goresan (Scratch / Scuff)', icon: '⚡', color: '#f59e0b' },
  { key: 'BURR', label: 'Geram / Ketajaman Sisi (Burr / Sharp Edge)', icon: '🔪', color: '#ef4444' },
  { key: 'DENT', label: 'Penyok / Benturan (Dent / Impact Mark)', icon: '🔨', color: '#8b5cf6' },
  { key: 'BLOWHOLE', label: 'Porositas / Pinhole (Casting Defect)', icon: '🫧', color: '#06b6d4' },
  { key: 'COLOR', label: 'Warna / Anodizing Tone (Discoloration)', icon: '🎨', color: '#ec4899' },
  { key: 'FLASH', label: 'Flash / Sirip Plastik / Parting Line', icon: '📐', color: '#10b981' },
  { key: 'OTHER', label: 'Cacat Visual Lainnya', icon: '🔍', color: '#64748b' },
];

// ─── Limit Sample Demo SVG Generator (OK vs NG Visual Boundaries) ───
export const createDemoLimitSampleSvgs = (defectKey = 'SCRATCH', type = 'OK') => {
  const isOk = type === 'OK';
  const bgColor = isOk ? '%23064e3b' : '%237f1d1d';
  const borderColor = isOk ? '%2310b981' : '%23ef4444';
  const badgeText = isOk ? '🟢 BATAS DITERIMA (OK LIMIT)' : '🔴 BATAS DITOLAK (NG LIMIT)';

  if (defectKey === 'SCRATCH') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
      <defs>
        <linearGradient id="metalBg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23334155"/>
          <stop offset="50%" stop-color="%2364748b"/>
          <stop offset="100%" stop-color="%231e293b"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(%23metalBg1)"/>
      <rect x="20" y="20" width="560" height="410" rx="8" fill="none" stroke="${borderColor}" stroke-width="3"/>
      <!-- Part Surface Mockup -->
      <rect x="50" y="70" width="500" height="290" rx="6" fill="%23475569" stroke="%2394a3b8" stroke-width="1.5"/>
      ${isOk
        ? `<!-- Hairline Scratch (Acceptable) -->
           <path d="M 180 190 Q 220 200 260 195" stroke="%23cbd5e1" stroke-width="1" opacity="0.6" stroke-dasharray="4,2"/>
           <circle cx="220" cy="195" r="30" fill="none" stroke="%2310b981" stroke-width="2" stroke-dasharray="3,3"/>
           <text x="260" y="170" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">Panjang &lt; 10mm, Kedalaman &lt; 0.05mm (OK)</text>`
        : `<!-- Severe Deep Scratch (Reject) -->
           <path d="M 140 170 Q 280 240 420 200" stroke="%23ffffff" stroke-width="4.5"/>
           <path d="M 140 170 Q 280 240 420 200" stroke="%23ef4444" stroke-width="2"/>
           <circle cx="280" cy="210" r="50" fill="none" stroke="%23ef4444" stroke-width="2.5"/>
           <text x="240" y="145" fill="%23ef4444" font-family="sans-serif" font-size="12" font-weight="bold">Goresan Dalam &gt; 0.2mm Menembus Lapisan (REJECT)</text>`
      }
      <!-- Header Badge -->
      <rect x="20" y="20" width="560" height="40" fill="${bgColor}"/>
      <text x="40" y="46" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="900">${badgeText}</text>
      <text x="40" y="390" fill="%23f8fafc" font-family="sans-serif" font-size="12">Kategori: Goresan Permukaan (Surface Scratch)</text>
      <text x="40" y="410" fill="%2394a3b8" font-family="sans-serif" font-size="10">Standar ISO/IATF Visual Master Boundary</text>
    </svg>`;
  }

  if (defectKey === 'BURR') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
      <defs>
        <linearGradient id="metalBg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23334155"/>
          <stop offset="50%" stop-color="%2364748b"/>
          <stop offset="100%" stop-color="%231e293b"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(%23metalBg2)"/>
      <rect x="20" y="20" width="560" height="410" rx="8" fill="none" stroke="${borderColor}" stroke-width="3"/>
      <!-- Edge Chamfer Mockup -->
      <path d="M 80 320 L 80 180 L 250 180 L 320 250 L 520 250 L 520 320 Z" fill="%23475569" stroke="%2394a3b8" stroke-width="2"/>
      ${isOk
        ? `<!-- Smooth Chamfer with micro burr <= 0.05mm (OK) -->
           <circle cx="285" cy="215" r="30" fill="none" stroke="%2310b981" stroke-width="2" stroke-dasharray="4,2"/>
           <text x="325" y="200" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">Burr Chamfer &lt;= 0.05 mm (Halus / Diterima)</text>`
        : `<!-- Sharp Ragged Burr >= 0.3mm (NG) -->
           <path d="M 280 210 L 290 195 L 298 215 L 310 200 L 320 220" stroke="%23ef4444" stroke-width="4" fill="none"/>
           <circle cx="300" cy="210" r="40" fill="none" stroke="%23ef4444" stroke-width="2.5"/>
           <text x="310" y="175" fill="%23ef4444" font-family="sans-serif" font-size="12" font-weight="bold">Geram Tajam &gt; 0.3 mm Melukai Tangan (REJECT)</text>`
      }
      <rect x="20" y="20" width="560" height="40" fill="${bgColor}"/>
      <text x="40" y="46" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="900">${badgeText}</text>
      <text x="40" y="390" fill="%23f8fafc" font-family="sans-serif" font-size="12">Kategori: Geram / Ketajaman Tepi (Edge Burr)</text>
      <text x="40" y="410" fill="%2394a3b8" font-family="sans-serif" font-size="10">Standar ISO/IATF Visual Master Boundary</text>
    </svg>`;
  }

  // Default Blowhole / Porosity
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
    <defs>
      <linearGradient id="metalBg3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23334155"/>
        <stop offset="50%" stop-color="%2364748b"/>
        <stop offset="100%" stop-color="%231e293b"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(%23metalBg3)"/>
    <rect x="20" y="20" width="560" height="410" rx="8" fill="none" stroke="${borderColor}" stroke-width="3"/>
    <!-- Casting Part Surface -->
    <circle cx="300" cy="230" r="130" fill="%23475569" stroke="%2394a3b8" stroke-width="2"/>
    <circle cx="300" cy="230" r="70" fill="%231e293b" stroke="%2364748b" stroke-width="1.5"/>
    ${isOk
      ? `<!-- Micro pinhole <= 0.3mm (Acceptable outside seal) -->
         <circle cx="340" cy="190" r="4" fill="%230f172a" stroke="%2310b981" stroke-width="1.5"/>
         <circle cx="340" cy="190" r="25" fill="none" stroke="%2310b981" stroke-width="2" stroke-dasharray="3,3"/>
         <text x="320" y="150" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">Pinhole Tunggal &lt;= 0.3mm (Diterima / OK)</text>`
      : `<!-- Porosity cluster > 1.5mm (Reject) -->
         <circle cx="280" cy="210" r="10" fill="%230f172a" stroke="%23ef4444" stroke-width="2"/>
         <circle cx="295" cy="225" r="8" fill="%230f172a" stroke="%23ef4444" stroke-width="2"/>
         <circle cx="310" cy="205" r="12" fill="%230f172a" stroke="%23ef4444" stroke-width="2"/>
         <circle cx="300" cy="215" r="45" fill="none" stroke="%23ef4444" stroke-width="2.5"/>
         <text x="260" y="150" fill="%23ef4444" font-family="sans-serif" font-size="12" font-weight="bold">Cluster Porositas &gt; 1.5mm Bocor Fluida (REJECT)</text>`
    }
    <rect x="20" y="20" width="560" height="40" fill="${bgColor}"/>
    <text x="40" y="46" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="900">${badgeText}</text>
    <text x="40" y="390" fill="%23f8fafc" font-family="sans-serif" font-size="12">Kategori: Porositas Pengecoran (Cast Blowhole)</text>
    <text x="40" y="410" fill="%2394a3b8" font-family="sans-serif" font-size="10">Standar ISO/IATF Visual Master Boundary</text>
  </svg>`;
};
