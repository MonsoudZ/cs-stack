import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src'];
const HTML = 'dist/index.html';
const failures = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function fail(message) {
  failures.push(message);
}

function assertNoSourceMatches() {
  const files = ROOTS.flatMap((root) => walk(root));
  const checks = [
    [/role="button"/, 'Avoid pseudo-buttons; use native <button>.'],
    [/<button(?![^>]*\btype=)/, 'Every <button> needs an explicit type.'],
    [/outline\s*:\s*none/, 'Do not remove focus outlines without replacement.'],
    [/Run npm run|Astro \+ Svelte|Static prose|hydrated island/, 'Visitor-facing dev boilerplate leaked into source.'],
    [/FIXME|lorem|click here/i, 'Placeholder or weak copy found.'],
    // Bans only STATIC inline styles (style="..."). Dynamic `style:` bindings
    // (e.g. style:background={rgb}) are intentionally allowed — runtime-computed
    // values can't be a static class — and so do ship as inline styles in the
    // generated HTML; assertGeneratedHtml() reports that count for transparency.
    [/style=/, 'Static inline style= found; use a class or a Svelte style: directive.'],
  ];

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const [pattern, message] of checks) {
      if (pattern.test(text)) fail(`${file}: ${message}`);
    }
  }
}

function attrs(raw) {
  const result = {};
  const attrRe = /([:@\w-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
  let match;
  while ((match = attrRe.exec(raw))) {
    const [, key, value = ''] = match;
    result[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function textContent(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function assertGeneratedHtml() {
  const html = readFileSync(HTML, 'utf8');
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  const inputs = [...html.matchAll(/<input\b([^>]*)>/g)];
  const details = (html.match(/<details\b/g) || []).length;
  const summaries = (html.match(/<summary\b/g) || []).length;
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)];
  const images = [...html.matchAll(/<img\b([^>]*)>/g)];
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  const inlineStyles = (html.match(/style="/g) || []).length;

  buttons.forEach(([, rawAttrs, body], index) => {
    const a = attrs(rawAttrs);
    const name = a['aria-label'] || textContent(body);
    if (!name) fail(`button ${index + 1}: missing accessible name`);
    if (!a.type) fail(`button ${index + 1}: missing type`);
  });

  inputs.forEach(([, rawAttrs], index) => {
    const a = attrs(rawAttrs);
    if (!(a['aria-label'] || a['aria-labelledby'] || a.id)) {
      fail(`input ${index + 1}: missing label hook`);
    }
  });

  images.forEach(([, rawAttrs], index) => {
    const a = attrs(rawAttrs);
    if (!('alt' in a)) fail(`img ${index + 1}: missing alt`);
  });

  links.forEach(([, rawAttrs, body], index) => {
    const a = attrs(rawAttrs);
    const name = a['aria-label'] || textContent(body);
    if (!name) fail(`link ${index + 1}: missing accessible name`);
    if (a.target === '_blank' && !/noopener/.test(a.rel || '')) {
      fail(`link ${index + 1}: target=_blank without rel=noopener`);
    }
  });

  if (details !== summaries) fail(`details/summary mismatch: ${details}/${summaries}`);
  if (!headings.some((heading) => heading[1] === '1')) fail('missing h1');

  console.log(`Generated HTML: ${buttons.length} buttons, ${inputs.length} inputs, ${details} details, ${headings.length} headings, ${images.length} images, ${links.length} links, ${inlineStyles} dynamic inline styles`);
}

assertNoSourceMatches();
assertGeneratedHtml();

if (failures.length) {
  console.error('\nAudit failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Audit passed.');
