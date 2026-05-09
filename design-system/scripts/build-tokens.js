#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * DTCG → CSS custom properties generator.
 * Reads design-system/tokens.json (DTCG Format Module 2025.10) and emits
 * design-system/tokens.css with one --custom-property per leaf token.
 *
 * Conventions:
 *  - Token path "color.neutral.10" → CSS var "--color-neutral-10"
 *  - Aliases "{group.token}" resolved to base values
 *  - Composite typography tokens fan out to per-property vars
 *    (--typography-heading-xl-font-size, ...-line-height, etc.)
 *  - Composite shadow tokens render as a single CSS shadow string
 *  - cubicBezier arrays render as cubic-bezier(a, b, c, d)
 *  - $description preserved as a CSS comment above the token
 *
 * Usage: node design-system/scripts/build-tokens.js
 */

const fs   = require('node:fs');
const path = require('node:path');

const ROOT        = path.resolve(__dirname, '..');
const REPO_ROOT   = path.resolve(ROOT, '..');
const SOURCE      = path.join(ROOT, 'tokens.json');
const OUTPUTS     = [
  path.join(ROOT, 'tokens.css'),
  path.join(REPO_ROOT, 'src', 'styles', 'tokens.css'),
];

const tokens = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

/* ────────────────────────────────────────────────────────────────────
 * Walk the DTCG tree and collect every leaf (object containing $value).
 * Returns an array of { path: ["color","neutral","10"], node: { $value, $type, $description, ... } }
 * Ignores top-level meta keys ($schema, $description) and the
 * group-level $description that decorates a non-leaf group.
 * ──────────────────────────────────────────────────────────────────── */
function collectLeaves(obj, parentPath, parentType, out) {
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      out.push({
        path: [...parentPath, key],
        $value: val.$value,
        $type: val.$type ?? parentType,
        $description: val.$description,
        $extensions: val.$extensions,
      });
    } else if (val && typeof val === 'object') {
      const nextType = val.$type ?? parentType;
      collectLeaves(val, [...parentPath, key], nextType, out);
    }
  }
}

const leaves = [];
collectLeaves(tokens, [], undefined, leaves);

/* Fast lookup by dot-path for alias resolution. */
const byPath = new Map(leaves.map(l => [l.path.join('.'), l]));

/* ────────────────────────────────────────────────────────────────────
 * Resolve an alias chain. Returns a leaf node OR a literal value.
 * Detects cycles. Aliases look like "{group.subgroup.token}".
 * ──────────────────────────────────────────────────────────────────── */
const ALIAS_RE = /^\{([^}]+)\}$/;
function resolveAlias(value, seen = new Set()) {
  if (typeof value !== 'string') return { kind: 'literal', value };
  const m = value.match(ALIAS_RE);
  if (!m) return { kind: 'literal', value };
  const target = m[1];
  if (seen.has(target)) {
    throw new Error(`Cycle in token alias: ${[...seen, target].join(' → ')}`);
  }
  const node = byPath.get(target);
  if (!node) {
    throw new Error(`Unknown alias target: {${target}}`);
  }
  seen.add(target);
  /* If the resolved node itself aliases, follow. */
  if (typeof node.$value === 'string' && ALIAS_RE.test(node.$value)) {
    return resolveAlias(node.$value, seen);
  }
  return { kind: 'node', node };
}

/* ────────────────────────────────────────────────────────────────────
 * Render a leaf node's $value to a CSS value string.
 * Handles aliases, composite shadows, cubicBezier arrays, fontFamily
 * arrays, plain primitives.
 * ──────────────────────────────────────────────────────────────────── */
function renderValue(leaf) {
  const v = leaf.$value;

  /* Alias → return a var() reference so consumers benefit from
     theme overrides at the alias level. */
  if (typeof v === 'string') {
    const m = v.match(ALIAS_RE);
    if (m) {
      const aliasVar = '--' + m[1].replace(/\./g, '-');
      return `var(${aliasVar})`;
    }
    return v;
  }

  /* cubicBezier — DTCG declares as 4-element array */
  if (leaf.$type === 'cubicBezier' && Array.isArray(v)) {
    return `cubic-bezier(${v.join(', ')})`;
  }

  /* fontFamily — array of fallbacks. Quote families containing spaces. */
  if (leaf.$type === 'fontFamily' && Array.isArray(v)) {
    return v.map(f => /\s/.test(f) ? `'${f}'` : f).join(', ');
  }

  /* shadow composite */
  if (leaf.$type === 'shadow' && v && typeof v === 'object' && !Array.isArray(v)) {
    const { offsetX = '0', offsetY = '0', blur = '0', spread = '0', color = 'transparent', inset } = v;
    const parts = [inset ? 'inset' : null, offsetX, offsetY, blur, spread, color].filter(Boolean);
    return parts.join(' ');
  }

  /* Primitive (number, string, etc.) */
  return String(v);
}

/* ────────────────────────────────────────────────────────────────────
 * Convert token path segments to a CSS variable name.
 * "color.neutral.10" → "--color-neutral-10"
 * Composite expansion appends a property suffix.
 * ──────────────────────────────────────────────────────────────────── */
const cssVar = (segments, suffix) => {
  const base = '--' + segments.map(s => s.toLowerCase()).join('-');
  return suffix ? `${base}-${suffix}` : base;
};

/* ────────────────────────────────────────────────────────────────────
 * Build the CSS output. Keeps the source's group order so the file
 * reads like the JSON.
 * ──────────────────────────────────────────────────────────────────── */
const lines = [];
lines.push('/* Generated from tokens.json — do not edit by hand.');
lines.push(' * Regenerate with: node design-system/scripts/build-tokens.js');
lines.push(' * DTCG Format Module 2025.10');
lines.push(' */');
lines.push('');
lines.push(':root {');

/* Group leaves by top-level key to emit one block per group with a heading.
   Theme leaves (theme.dark.X.Y) are routed to a separate selector block; their
   path is rewritten to drop the "theme.dark." prefix so they OVERRIDE the
   matching reference token at runtime. */
const groups = new Map();
const themeLeaves = new Map(); /* themeName → [leaf with path stripped of theme.X. prefix] */
for (const leaf of leaves) {
  if (leaf.path[0] === 'theme' && leaf.path.length > 2) {
    const themeName = leaf.path[1];
    const overridePath = leaf.path.slice(2);
    if (!themeLeaves.has(themeName)) themeLeaves.set(themeName, []);
    themeLeaves.get(themeName).push({ ...leaf, path: overridePath });
    continue;
  }
  const groupKey = leaf.path[0];
  if (!groups.has(groupKey)) groups.set(groupKey, []);
  groups.get(groupKey).push(leaf);
}

const emitLeaf = (leaf) => {
  /* typography composite — fan out to one var per property */
  if (leaf.$type === 'typography' && leaf.$value && typeof leaf.$value === 'object') {
    if (leaf.$description) lines.push(`  /* ${leaf.$description} */`);
    for (const [prop, val] of Object.entries(leaf.$value)) {
      const suffix = prop.replace(/([A-Z])/g, '-$1').toLowerCase(); /* fontFamily → font-family */
      const varName = cssVar(leaf.path, suffix);
      let rendered;
      if (typeof val === 'string') {
        const m = val.match(ALIAS_RE);
        if (m) {
          rendered = `var(--${m[1].replace(/\./g, '-')})`;
        } else {
          rendered = val;
        }
      } else {
        rendered = String(val);
      }
      lines.push(`  ${varName}: ${rendered};`);
    }
    return;
  }

  if (leaf.$description) lines.push(`  /* ${leaf.$description} */`);
  const name  = cssVar(leaf.path);
  const value = renderValue(leaf);
  lines.push(`  ${name}: ${value};`);
};

for (const [groupKey, groupLeaves] of groups) {
  lines.push(`  /* ─── ${groupKey} ─── */`);
  for (const leaf of groupLeaves) emitLeaf(leaf);
  lines.push('');
}

lines.push('}');
lines.push('');

/* Theme override blocks — one selector per non-default theme. */
for (const [themeName, leavesForTheme] of themeLeaves) {
  lines.push(`[data-theme="${themeName}"] {`);
  /* Re-group by category for readability */
  const byGroup = new Map();
  for (const leaf of leavesForTheme) {
    const k = leaf.path[0];
    if (!byGroup.has(k)) byGroup.set(k, []);
    byGroup.get(k).push(leaf);
  }
  for (const [k, ls] of byGroup) {
    lines.push(`  /* ─── ${k} ─── */`);
    for (const leaf of ls) emitLeaf(leaf);
    lines.push('');
  }
  lines.push('}');
  lines.push('');
}

const output = lines.join('\n');
for (const dest of OUTPUTS) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, output);
}

/* ────────────────────────────────────────────────────────────────────
 * Summary report on stdout.
 * ──────────────────────────────────────────────────────────────────── */
const counts = {
  total: leaves.length,
  base: leaves.filter(l => ['color','dimension','opacity','shadow','duration','easing','font','z','bp'].includes(l.path[0])).length,
  reference: leaves.filter(l => ['background','surface','fill','text','border','icon','elevation','motion','spacing','radius','typography'].includes(l.path[0])).length,
  component: leaves.filter(l => l.path[0] === 'component').length,
};

console.log(`✓ tokens.css written to ${OUTPUTS.length} location(s) (${output.split('\n').length} lines)`);
console.log(`  Total tokens: ${counts.total}`);
console.log(`  Base:         ${counts.base}`);
console.log(`  Reference:    ${counts.reference}`);
console.log(`  Component:    ${counts.component}`);
