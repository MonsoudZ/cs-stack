// Generates the 1200x630 social-share image at public/og.png.
// Run with `npm run gen:og` whenever the branding/title changes.
// The PNG is committed, so the build and CI never need this renderer.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
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

  <text x="90" y="150" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="26" font-weight="700"
        letter-spacing="8" fill="#2ee6c0">A FIELD GUIDE TO THE MACHINE</text>

  <text x="86" y="270" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="104" font-weight="800" fill="#ffffff">FROM ELECTRONS</text>
  <text x="86" y="368" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="104" font-weight="800" fill="#ffffff">TO THE CLOUD</text>

  <text x="90" y="560" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="#a6b3c4">silicon &#8594; gates &#8594; bits &#8594; numbers &#8594; CPU &#8594; OS &#8594; network &#8594; cloud</text>
  <text x="1110" y="560" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#80909f">THE STACK</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica Neue' },
  background: '#070a10',
});
const png = resvg.render().asPng();
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public', 'og.png'), png);
console.log('wrote public/og.png (' + png.length + ' bytes)');
