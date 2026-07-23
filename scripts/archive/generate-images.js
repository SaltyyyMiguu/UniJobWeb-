/**
 * generate-images.js — Generates branded SVG logos for companies and
 * category-themed cover images for job listings, using each company's
 * real brand colors. No internet access needed.
 *
 * Archived out of the production pipeline — run from the repo root:
 *   node scripts/archive/generate-images.js
 */

const fs = require('fs');
const path = require('path');

const PROFILES_DIR = path.join(__dirname, '../../backend/uploads/profiles');
const LISTINGS_DIR = path.join(__dirname, '../../backend/uploads/listings');

[PROFILES_DIR, LISTINGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Company brand identities (real brand colors) ─────────────────────────
const COMPANIES = [
  { key: 'petronas',  initials: 'PD', name: 'Petronas Digital', colorA: '#006644', colorB: '#00A19C' },
  { key: 'grab',       initials: 'G',  name: 'Grab',             colorA: '#00B14F', colorB: '#00874A' },
  { key: 'airasia',    initials: 'AA', name: 'AirAsia',          colorA: '#FF0000', colorB: '#C40000' },
  { key: 'cimb',       initials: 'C',  name: 'CIMB',             colorA: '#7A1E1E', colorB: '#E4002B' },
  { key: 'kpj',        initials: 'KPJ',name: 'KPJ Healthcare',   colorA: '#0066B3', colorB: '#00A0DC' },
  { key: 'lazada',     initials: 'L',  name: 'Lazada',           colorA: '#0F146D', colorB: '#F57224' },
];

function makeLogoSvg({ initials, colorA, colorB }) {
  const fontSize = initials.length >= 3 ? 70 : initials.length === 2 ? 90 : 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="40" fill="url(#g)"/>
  <text x="128" y="148" font-family="'Segoe UI', Arial, sans-serif" font-size="${fontSize}" font-weight="800"
        fill="#ffffff" text-anchor="middle" letter-spacing="2">${initials}</text>
</svg>`;
}

console.log('🎨 Generating company logos...\n');
COMPANIES.forEach(c => {
  const svg = makeLogoSvg(c);
  const outPath = path.join(PROFILES_DIR, `company-${c.key}.svg`);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log(`  ✅ ${c.name.padEnd(20)} → uploads/profiles/company-${c.key}.svg`);
});

// ─── Job listing cover images (category-themed gradients + icon glyph) ────
const CATEGORY_THEMES = {
  'Information Technology': { colorA: '#1A2235', colorB: '#2A3A55', glyph: '</>' },
  'Finance':                { colorA: '#0B3D2E', colorB: '#1B5E44', glyph: '$' },
  'Healthcare':             { colorA: '#0D3B66', colorB: '#1976A8', glyph: '+' },
  'Marketing':              { colorA: '#4A1942', colorB: '#7B2D6E', glyph: '★' },
  'Engineering':            { colorA: '#3A2E1A', colorB: '#6B5227', glyph: '⚙' },
  'Education':              { colorA: '#1B2A4A', colorB: '#2E4A7A', glyph: '📖' },
  'Agriculture':            { colorA: '#1E3A1E', colorB: '#3A6B3A', glyph: '🌱' },
  'Other':                  { colorA: '#2A2A2A', colorB: '#4A4A4A', glyph: '•' },
};

function makeListingSvg({ colorA, colorB, glyph, title }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.08)"/>
    </pattern>
  </defs>
  <rect width="800" height="400" fill="url(#lg)"/>
  <rect width="800" height="400" fill="url(#dots)"/>
  <text x="400" y="250" font-family="'Segoe UI', Arial, sans-serif" font-size="140" font-weight="700"
        fill="rgba(255,255,255,0.15)" text-anchor="middle">${glyph}</text>
</svg>`;
}

console.log('\n🖼️  Generating job listing cover images...\n');
Object.entries(CATEGORY_THEMES).forEach(([category, theme]) => {
  const svg = makeListingSvg({ ...theme, title: category });
  const slug = category.toLowerCase().replace(/\s+/g, '-');
  const outPath = path.join(LISTINGS_DIR, `category-${slug}.svg`);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log(`  ✅ ${category.padEnd(25)} → uploads/listings/category-${slug}.svg`);
});

console.log('\n✨ All images generated successfully!');

module.exports = { COMPANIES, CATEGORY_THEMES };
