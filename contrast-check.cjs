function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}
function blend(fgHex, alpha, bgHex) {
  const [r1, g1, b1] = hexToRgb(fgHex);
  const [r2, g2, b2] = hexToRgb(bgHex);
  return [
    Math.round(alpha * r1 + (1 - alpha) * r2),
    Math.round(alpha * g1 + (1 - alpha) * g2),
    Math.round(alpha * b1 + (1 - alpha) * b2)
  ];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function contrastRgb(rgb1, rgb2) {
  const l1 = luminance(...rgb1);
  const l2 = luminance(...rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const darkCard = '#151928';
const darkApp = '#080a11';
const lightCard = '#ffffff';

const testCases = [
  // Typography
  { name: 'Dark Mode: Text Main (#f8fafc) on Dark App (#080a11)', fg: '#f8fafc', bg: '#080a11', type: 'text' },
  { name: 'Dark Mode: Text Main (#f8fafc) on Dark Card (#151928)', fg: '#f8fafc', bg: darkCard, type: 'text' },
  { name: 'Dark Mode: Text Muted (#94a3b8) on Dark Card (#151928)', fg: '#94a3b8', bg: darkCard, type: 'text' },
  { name: 'Dark Mode: Text Dim cũ (#64748b) on Dark Card (#151928) - chữ nhỏ', fg: '#64748b', bg: darkCard, type: 'text' },
  { name: 'Dark Mode: Text Dim mới (#8090a2) on Dark Card (#151928) - chữ nhỏ/metadata', fg: '#8090a2', bg: darkCard, type: 'text' },
  { name: 'Dark Mode: Text Dim mới (#8090a2) on Dark App (#080a11) - chữ nhỏ/metadata', fg: '#8090a2', bg: darkApp, type: 'text' },
  { name: 'Light Mode: Text Main (#0f172a) on Light Card (#ffffff)', fg: '#0f172a', bg: lightCard, type: 'text' },
  { name: 'Light Mode: Text Muted (#334155) on Light Card (#ffffff)', fg: '#334155', bg: lightCard, type: 'text' },
  { name: 'Light Mode: Text Dim/Placeholder (#64748b) on Light Card (#ffffff)', fg: '#64748b', bg: lightCard, type: 'text' },

  // Brand & Badges with Alpha Compositing
  { 
    name: 'Dark Mode: Amber Badge Text (#fcd34d) on Amber-500/20 Composite (#423422)', 
    fg: '#fcd34d', 
    bg: rgbToHex(...blend('#f59e0b', 0.2, darkCard)), 
    type: 'text' 
  },
  { 
    name: 'Dark Mode: Rose Badge Text (#fb7185) on Rose-500/10 Composite (#2b1d2d)', 
    fg: '#fb7185', 
    bg: rgbToHex(...blend('#f43f5e', 0.1, darkCard)), 
    type: 'text' 
  },
  { 
    name: 'Dark Mode: Emerald Badge Text (#34d399) on Emerald-500/10 Composite (#152931)', 
    fg: '#34d399', 
    bg: rgbToHex(...blend('#10b981', 0.1, darkCard)), 
    type: 'text' 
  },
  { 
    name: 'Light Mode: Amber/Gold Badge Text (#c2410c) on Light Amber-500/10 (#fff7ed)', 
    fg: '#c2410c', 
    bg: '#fff7ed', 
    type: 'text' 
  },
  { 
    name: 'Light Mode: Ruby Badge Text (#b91c1c) on Light Rose-500/10 (#fff1f2)', 
    fg: '#b91c1c', 
    bg: '#fff1f2', 
    type: 'text' 
  },
  { 
    name: 'Light Mode: Cyan Badge Text (#0369a1) on Light Cyan-500/10 (#f0f9ff)', 
    fg: '#0369a1', 
    bg: '#f0f9ff', 
    type: 'text' 
  },

  // Buttons & CTAs
  { name: 'Both Themes: White Text on Ruby Button (#e11d48)', fg: '#ffffff', bg: '#e11d48', type: 'text' },
  { name: 'Both Themes: White Text on Red-700 Button (#b91c1c)', fg: '#ffffff', bg: '#b91c1c', type: 'text' },
  { name: 'Both Themes: White Text on Red-600 Button (#dc2626)', fg: '#ffffff', bg: '#dc2626', type: 'text' },

  // Media Overlays (Live Player & Video)
  { name: 'Live Video: LIVE Badge White on Rose-600/90 on Black (#e11d48)', fg: '#ffffff', bg: '#e11d48', type: 'text' },
  { name: 'Live Video: Amber Overlay Text (#fbbf24) on Black-75 Overlay (#000000)', fg: '#fbbf24', bg: '#000000', type: 'text' },
  { name: 'Live Video: Muted Status Text (#cbd5e1) on Black-75 Overlay (#000000)', fg: '#cbd5e1', bg: '#000000', type: 'text' },

  // Focus & UI States
  { name: 'Light Mode: Focus Outline Orange (#ea580c) on Light Card (#ffffff)', fg: '#ea580c', bg: lightCard, type: 'ui' }
];

console.log('| Hạng mục kiểm tra | Màu chữ (FG) | Màu nền (BG) | Tỷ lệ Contrast | Đánh giá WCAG 2.1 |');
console.log('| :--- | :---: | :---: | :---: | :---: |');
testCases.forEach(c => {
  const r = contrastRgb(hexToRgb(c.fg), hexToRgb(c.bg));
  const req = c.type === 'ui' ? 3.0 : (c.type === 'text-large' ? 3.0 : 4.5);
  const status = r >= req ? '✅ PASS' : '❌ FAIL';
  console.log(`| ${c.name} | \`${c.fg}\` | \`${c.bg}\` | **${r.toFixed(2)}:1** | ${status} |`);
});
