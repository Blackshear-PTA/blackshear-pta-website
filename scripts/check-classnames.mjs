/**
 * Blackshear PTA - Tailwind class-name collision gate.
 *
 * Tailwind v4 generates utilities by SCANNING SOURCE FILES. Write
 * `class="grid"` on your own element and Tailwind sees the word, emits
 * `.grid{display:grid}`, and that unscoped rule beats the scoped component
 * rule for any property the component does not set.
 *
 * This is not hypothetical. The month calendar was a <table> with
 * `table-layout: fixed`, and every column came out a different width because
 * Tailwind had quietly turned it into `display: grid`. Nothing failed, nothing
 * warned, and the CSS looked correct in the file - the bug only existed in the
 * cascade. It cost a round trip to find.
 *
 * So: do not name your own classes after a Tailwind display or position
 * utility. Prefix them, or say what they are - `.month-grid`, `.photo-wall`,
 * `.section-block`.
 *
 * Run: npm run check:classnames
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/** Utilities that silently change layout if they land on the wrong element. */
const RESERVED = new Set([
  'grid', 'flex', 'block', 'inline', 'inline-block', 'inline-flex', 'inline-table',
  'table', 'table-row', 'table-cell', 'contents', 'flow-root', 'list-item', 'hidden',
  'static', 'fixed', 'absolute', 'relative', 'sticky', 'isolate',
  'container', 'visible', 'invisible', 'collapse',
]);

const files = execFileSync('git', ['ls-files', '*.astro', '*.html'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const hits = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    for (const match of line.matchAll(/class="([^"{}]*)"/g)) {
      for (const name of match[1].split(/\s+/).filter(Boolean)) {
        if (RESERVED.has(name)) hits.push(`${file}:${i + 1}  class="${name}"`);
      }
    }
  });
}

console.log(`Scanned ${files.length} template files.`);
if (hits.length) {
  console.error(`\n${hits.length} class name(s) collide with a Tailwind utility:`);
  for (const hit of hits) console.error(`  FAIL  ${hit}`);
  console.error('\nRename them. Tailwind emits the utility because it scanned this file,');
  console.error('and the unscoped rule wins for any property your component does not set.');
  process.exit(1);
}
console.log('No class names collide with a Tailwind layout utility.');
