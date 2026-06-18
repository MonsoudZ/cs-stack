// Generates the 1200x630 social-share images:
//   public/og.png            — the site card (home / default)
//   public/og/<slug>.png     — one per deep-dive, tinted with its accent
// Run with `npm run gen:og` whenever the branding or the stack list changes.
// The PNGs are committed, so the build and CI never need this renderer.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { stacks } from '../src/data/stacks.js';
import { designs } from '../src/data/designs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

function render(svg, out) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica Neue' },
    background: '#070a10',
  }).render().asPng();
  writeFileSync(out, png);
  console.log('wrote ' + out.replace(root + '/', '') + ' (' + png.length + ' bytes)');
}

// --- the site card (home / default) ---
const home = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="18%" cy="12%" r="80%">
      <stop offset="0%" stop-color="#2ee6c0" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="#070a10" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#070a10"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- the stack motif: electrons (blue) -> data (amber) -> logic (green), climbing -->
  <rect x="90" y="470" width="320" height="22" rx="11" fill="#2ee6c0"/>
  <rect x="90" y="430" width="230" height="22" rx="11" fill="#ffb454"/>
  <rect x="90" y="390" width="140" height="22" rx="11" fill="#5b9dff"/>

  <text x="90" y="150" font-family="${FONT}" font-size="26" font-weight="700"
        letter-spacing="8" fill="#2ee6c0">A FIELD GUIDE TO THE MACHINE</text>

  <text x="86" y="270" font-family="${FONT}" font-size="104" font-weight="800" fill="#ffffff">FROM ELECTRONS</text>
  <text x="86" y="368" font-family="${FONT}" font-size="104" font-weight="800" fill="#ffffff">TO THE CLOUD</text>

  <text x="90" y="560" font-family="${FONT}" font-size="24" font-weight="500" fill="#a6b3c4">silicon &#8594; gates &#8594; bits &#8594; numbers &#8594; CPU &#8594; OS &#8594; network &#8594; cloud</text>
  <text x="1110" y="560" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="700" fill="#80909f">THE STACK</text>
</svg>`;
render(home, join(root, 'public', 'og.png'));

// --- one card per deep-dive, tinted with the stack's accent ---
function stackCard({ name, kind, layer, accent, blurb }) {
  const kicker = layer === 'app' ? 'AN APPLICATION ON THE STACK' : 'A DEEP DIVE INTO LAYER ' + esc(layer);
  // climbing motif, all in the accent at decreasing strength
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="16%" cy="14%" r="82%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.20"/>
      <stop offset="60%" stop-color="#070a10" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#070a10"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="14" height="630" fill="${accent}"/>

  <!-- stack glyph, top-right -->
  <rect x="980" y="150" width="130" height="20" rx="10" fill="${accent}"/>
  <rect x="980" y="118" width="96" height="20" rx="10" fill="${hexA(accent, 0.6)}"/>
  <rect x="980" y="86" width="60" height="20" rx="10" fill="${hexA(accent, 0.35)}"/>

  <text x="90" y="150" font-family="${FONT}" font-size="26" font-weight="700"
        letter-spacing="6" fill="${accent}">${kicker}</text>

  <text x="84" y="300" font-family="${FONT}" font-size="96" font-weight="800" fill="#ffffff">THE ${esc(name.toUpperCase())}</text>
  <text x="84" y="396" font-family="${FONT}" font-size="96" font-weight="800" fill="#ffffff">${kind.toUpperCase()}</text>

  <text x="90" y="560" font-family="${FONT}" font-size="26" font-weight="500" fill="#a6b3c4">${esc(blurb)}</text>
  <text x="1110" y="560" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="700" fill="#80909f">THE STACK</text>
</svg>`;
}
mkdirSync(join(root, 'public', 'og'), { recursive: true });
for (const s of stacks) render(stackCard(s), join(root, 'public', 'og', s.slug + '.png'));

// --- one card per system-design case study, tinted by tier ---
const TIER_ACCENT = { small: '#2ee6c0', medium: '#ffb454', big: '#ff6b6b' };
function designCard({ name, tier, blurb }) {
  const accent = TIER_ACCENT[tier] || '#5b9dff';
  const kicker = 'A SYSTEM DESIGN · ' + esc(tier.toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="16%" cy="14%" r="82%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.20"/>
      <stop offset="60%" stop-color="#070a10" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#070a10"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="14" height="630" fill="${accent}"/>

  <!-- request-flow motif, top-right: three nodes wired together -->
  <rect x="980" y="150" width="130" height="20" rx="10" fill="${accent}"/>
  <rect x="980" y="118" width="96" height="20" rx="10" fill="${hexA(accent, 0.6)}"/>
  <rect x="980" y="86" width="60" height="20" rx="10" fill="${hexA(accent, 0.35)}"/>

  <text x="90" y="150" font-family="${FONT}" font-size="26" font-weight="700"
        letter-spacing="6" fill="${accent}">${kicker}</text>

  <text x="84" y="340" font-family="${FONT}" font-size="80" font-weight="800" fill="#ffffff">${esc(name.toUpperCase())}</text>

  <text x="90" y="560" font-family="${FONT}" font-size="26" font-weight="500" fill="#a6b3c4">${esc(blurb)}</text>
  <text x="1110" y="560" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="700" fill="#80909f">THE STACK</text>
</svg>`;
}
for (const d of designs) render(designCard(d), join(root, 'public', 'og', d.slug + '.png'));
