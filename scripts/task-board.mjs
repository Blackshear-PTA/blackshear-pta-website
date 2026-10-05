/**
 * Renders TASKS.md as a single-file HTML task board.
 *
 * TASKS.md stays the source of truth. This is a read-only view of it, for
 * reading on a phone or in a browser tab: what is urgent, how far the Workspace
 * rollout has got, and every task by track, filterable by owner and status. It
 * changes nothing and holds no data of its own, so it cannot drift. Regenerate
 * it after editing TASKS.md.
 *
 *   node scripts/task-board.mjs                 writes .task-board/index.html
 *   node scripts/task-board.mjs --out FILE      writes FILE
 *   node scripts/task-board.mjs --json          prints the parsed data instead
 *
 * The output is a fragment without <html>/<body>: it is published as a
 * claude.ai Artifact, whose host adds the document skeleton. Opened directly
 * from disk it still renders, just in quirks mode.
 *
 * It parses the conventions TASKS.md already follows, and nothing more:
 *   | U<n> | task | owner | why |            the DO THIS WEEK table
 *   - [ ] **X<n>**: title - OWNER - detail     a task line; [~] [x] [!] for state
 *   | D<n> | decision | status | notes |      the open decisions table
 *   **F<n> - headline.** ...                   a finding, until the next one
 * Anything it does not recognise is left out, never guessed at.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_URL = 'https://github.com/Blackshear-PTA/blackshear-pta-website';
const args = process.argv.slice(2);
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const OUT = path.resolve(root, outArg ?? '.task-board/index.html');

// ---------------------------------------------------------------- inline markdown

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A link target from TASKS.md, made to work from the board. */
function href(target, branch) {
  if (/^https?:\/\//.test(target)) return { url: target, external: true };
  if (target.startsWith('#')) {
    const anchor = target.slice(1).toLowerCase();
    // #f53, #b12 and section slugs all exist on the board under the same ids.
    return { url: '#' + anchor, external: false };
  }
  // A repo-relative file: open it on GitHub, on the branch the board was built from.
  return { url: `${REPO_URL}/blob/${branch}/${target.replace(/^\.\//, '')}`, external: true };
}

function inline(md, ctx) {
  // Pull code spans out first so nothing inside them is formatted.
  const codes = [];
  let s = md.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, target) => {
    const { url, external } = href(target.replace(/&amp;/g, '&'), ctx.branch);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${esc(url)}"${attrs}>${text}</a>`;
  });
  s = s.replace(/~~(.+?)~~/g, '<s>$1</s>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

/** Inline markdown to plain text, for search and for titles. */
const plain = (md) =>
  md
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/~~|\*\*|\*/g, '')
    .trim();

// ---------------------------------------------------------------- block markdown

/** Paragraphs, fenced code, lists and tables: what the findings actually use. */
function blocks(lines, ctx) {
  const out = [];
  let i = 0;
  const isTable = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isList = (l) => /^\s*(?:[-*]|\d+\.)\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^<a name="[^"]+"><\/a>$/.test(line.trim()) || /^<!--.*-->$/.test(line.trim()) || line.trim() === '---') {
      i++;
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      // ## is a section inside a panel, so it renders one level below the panel's own h2.
      const level = Math.min(heading[1].length + 1, 5);
      out.push(`<h${level}>${inline(heading[2], ctx)}</h${level}>`);
      i++;
      continue;
    }
    if (line.startsWith('```')) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    if (isTable(line)) {
      const rows = [];
      while (i < lines.length && isTable(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|[\s|:-]+\|\s*$/.test(r));
      const [head, ...rest] = body;
      out.push(
        `<div class="table-wrap"><table><thead><tr>${cells(head).map((c) => `<th>${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${rest
          .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c, ctx)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }
    if (isList(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && (isList(lines[i]) || (/^\s+\S/.test(lines[i]) && items.length))) {
        if (isList(lines[i])) items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t, ctx)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('```') && !isTable(lines[i]) && !isList(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(para.join(' '), ctx)}</p>`);
  }
  return out.join('\n');
}

// ---------------------------------------------------------------- parsing TASKS.md

const STATE = { ' ': 'todo', '~': 'doing', x: 'done', X: 'done', '!': 'blocked' };
const OWNER_RE = /`(JON|CLAUDE|BOARD)`|\*\*(Gabe)\*\*|\b(board)\b/g;
const TOKEN = String.raw`(?:\x60(?:JON|CLAUDE|BOARD)\x60|\*\*Gabe\*\*|board)`;
const OWNER_SEGMENT = new RegExp(String.raw`^(\s*${TOKEN}(?:\s*(?:\([^()]{0,40}\)|\+|${TOKEN}))*)\s*(?::\s*([\s\S]*))?$`);

function owners(segment) {
  const found = new Set();
  for (const m of segment.matchAll(OWNER_RE)) found.add((m[1] || m[2] || m[3]).toUpperCase());
  return [...found].map((o) => (o === 'GABE' ? 'Gabe' : o === 'BOARD' ? 'Board' : o[0] + o.slice(1).toLowerCase()));
}

function parse(md) {
  const lines = md.split('\n');
  const data = { updated: '', urgent: [], sections: [], rollout: [], decisions: [], findings: [] };

  const updated = md.match(/^\*\*Last updated:\*\*\s*(.+)$/m);
  if (updated) data.updated = updated[1].trim();

  let h2 = '';
  let current = null;
  let inFindings = false;
  let finding = null;
  const flushFinding = () => {
    if (finding) data.findings.push(finding);
    finding = null;
  };

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      if (heading[1] === '##') {
        h2 = heading[2].trim();
        flushFinding();
        inFindings = /^Findings$/i.test(h2);
      }
      const title = heading[2].trim();
      const isTrack = /^(Track [A-Z]|Google Workspace|GitHub for|Phase \d)/.test(title);
      current = isTrack
        ? { id: slug(title), title: title.replace(/\s*\*\(([^)]*)\)\*\s*$/, ''), note: (title.match(/\*\(([^)]*)\)\*/) || [])[1] || '', parent: heading[1] === '###' ? h2 : '', intro: '', lead: '', tasks: [] }
        : null;
      if (current) data.sections.push(current);
      continue;
    }
    if (inFindings) {
      const start = line.match(/^\*\*F(\d+) - /);
      if (start) {
        flushFinding();
        // The bold headline can wrap: read ahead until its closing **.
        let joined = line;
        for (let k = n + 1; !/^\*\*F\d+ - .+?\*\*/.test(joined) && k < lines.length && lines[k].trim(); k++) joined += ' ' + lines[k].trim();
        const headline = (joined.match(/^\*\*F\d+ - (.+?)\*\*/) || [, joined.slice(start[0].length)])[1];
        const num = Number(start[1]);
        const seen = data.findings.filter((f) => f.num === num).length;
        finding = { id: seen ? `f${num}-${seen + 1}` : `f${num}`, num, headline: headline.replace(/\.$/, ''), lines: [line] };
      } else if (finding) {
        // A heading-less multi-line headline ("**F41 - ... and" wrapped onto the next line).
        finding.lines.push(line);
      }
      continue;
    }

    const urgent = line.match(/^\| (U\d+) \| (.+?) \| (.+?) \| (.+) \|\s*$/);
    if (urgent) {
      const [, id, task, owner, why] = urgent;
      const done = /^~~.*~~$/.test(task.trim()) || /^✅/.test(why.trim());
      data.urgent.push({ id, task, owner: owners('`' + owner.replace(/\s*\+\s*/g, '` `') + '`').concat(/Gabe/.test(owner) ? ['Gabe'] : []), why, state: done ? 'done' : /in progress/i.test(why) ? 'doing' : 'todo' });
      continue;
    }
    const decision = line.match(/^\| (D\d+) \| (.+?) \| (.+?) \| (.+) \|\s*$/);
    if (decision) {
      const [, id, title, status, notes] = decision;
      const state = /✅/.test(status) ? 'done' : /🛑/.test(status) ? 'out' : /⏸/.test(status) ? 'parked' : 'open';
      data.decisions.push({ id, title, status, notes, state });
      continue;
    }
    const step = line.match(/^\| (\d+) \| (.+?) \| (.+) \|\s*$/);
    if (step && current?.id === 'google-workspace-for-nonprofits') {
      const [, num, what, state] = step;
      const s = state.trim();
      data.rollout.push({ num: Number(num), what, state: s, phase: /^✅/.test(s) ? 'done' : /^◐/.test(s) ? 'doing' : 'todo' });
      continue;
    }
    const task = line.match(/^- \[([ ~xX!])\] \*\*([A-Z]\d+)\*\*:\s*(.*)$/);
    if (task && current) {
      const [, mark, id, rest] = task;
      const segs = rest.split(' - ');
      let title = segs[0];
      let who = [];
      let detail = segs.slice(1).join(' - ');
      // The owner is the first segment made only of owner tokens, sometimes with a
      // short parenthetical ("`JON` (Cloudflare dashboard)") or a trailing colon
      // ("`JON` + **Gabe**: Attempted..."). Titles can contain " - " themselves.
      for (let k = 1; k <= 3 && k < segs.length; k++) {
        const m = segs[k].match(OWNER_SEGMENT);
        if (!m) continue;
        title = segs.slice(0, k).join(' - ');
        who = owners(m[1]);
        detail = [m[2], ...segs.slice(k + 1)].filter(Boolean).join(' - ');
        break;
      }
      current.tasks.push({ id, state: STATE[mark], title, owner: who, detail });
      continue;
    }
    if (current && !current.lead && line.trim() && !line.startsWith('|') && !line.startsWith('- ') && !line.startsWith('**')) {
      current.lead = line.trim();
    }
    if (current && !current.intro && /^\*[^*].*\*$/.test(line.trim())) current.intro = line.trim().slice(1, -1);
  }
  flushFinding();
  return data;
}

function slug(s) {
  // GitHub's heading slugs, which is what TASKS.md's own links use.
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

// ---------------------------------------------------------------- git context

function git(...a) {
  try {
    return execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const md = fs.readFileSync(path.join(root, 'TASKS.md'), 'utf8');

// The second tab: talking points for the next exec board meeting, kept in their
// own file so they are not a second copy of anything in TASKS.md. Optional; the
// tab only appears when the file exists.
const AGENDA_FILE = path.join(root, 'docs/BOARD-AGENDA.md');
const agendaMd = fs.existsSync(AGENDA_FILE) ? fs.readFileSync(AGENDA_FILE, 'utf8') : '';
const data = parse(md);
const ctx = {
  branch: git('rev-parse', '--abbrev-ref', 'HEAD') || 'main',
  sha: git('rev-parse', '--short', 'HEAD'),
  dirty: git('status', '--porcelain', '--', 'TASKS.md') !== '',
  builtAt: new Date(),
};

if (args.includes('--json')) {
  const brief = {
    updated: data.updated,
    urgent: data.urgent.map((u) => `${u.id} ${u.state} [${u.owner}] ${plain(u.task)}`),
    rollout: data.rollout.map((r) => `${r.num} ${r.phase} ${plain(r.what)}`),
    sections: data.sections.map((s) => ({ s: `${s.id} (${s.parent || '-'})`, tasks: s.tasks.map((t) => `${t.id} ${t.state} [${t.owner}] ${plain(t.title)}`) })),
    decisions: data.decisions.map((d) => `${d.id} ${d.state} ${plain(d.title)}`),
    findings: data.findings.map((f) => `${f.id} ${f.headline.slice(0, 70)}`),
  };
  console.log(JSON.stringify(brief, null, 1));
  process.exit(0);
}

// ---------------------------------------------------------------- rendering

const STATE_LABEL = { todo: 'To do', doing: 'In progress', blocked: 'Blocked', done: 'Done' };
const DECISION_LABEL = { open: 'Open', parked: 'Tabled', out: 'Out of scope', done: 'Decided' };

/** Buzz in the site's disc, from the same traced artwork as BuzzMascot.astro. */
function mark() {
  const src = fs.readFileSync(path.join(root, 'assets/brand/buzz-mascot-color.svg'), 'utf8');
  const inner = src.slice(src.indexOf('>', src.indexOf('<svg')) + 1, src.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/, '');
  return `<svg class="mark" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#fff" stroke="#000" stroke-width="3"/><svg x="23.77" y="15" width="52.45" height="70" viewBox="228 111 574 766" overflow="visible">${inner}</svg></svg>`;
}

function stateBadge(state) {
  return `<span class="state state-${state}"><span class="glyph" aria-hidden="true"></span>${STATE_LABEL[state]}</span>`;
}

function ownerChips(list) {
  return list.length ? `<span class="owners">${list.map((o) => `<span class="owner">${esc(o)}</span>`).join('')}</span>` : '';
}

function taskRow(t, ctx) {
  const text = `${t.id} ${plain(t.title)} ${plain(t.detail)} ${t.owner.join(' ')}`.toLowerCase();
  const detail = t.detail.trim()
    ? `<details class="detail"><summary>Details</summary><div class="prose"><p>${inline(t.detail, ctx)}</p></div></details>`
    : '';
  return `<li class="task" id="${t.id.toLowerCase()}" data-state="${t.state}" data-owner="${t.owner.join(' ').toLowerCase()}" data-text="${esc(text)}">
  <div class="task-head">${stateBadge(t.state)}<a class="tid" href="#${t.id.toLowerCase()}">${t.id}</a><span class="ttitle">${inline(t.title, ctx)}</span>${ownerChips(t.owner)}</div>
  ${detail}
</li>`;
}

/** The Board meeting tab, from docs/BOARD-AGENDA.md: "# Title", then sections. */
function agendaPanel(ctx) {
  if (!agendaMd) return '';
  const lines = agendaMd.split('\n');
  const titleAt = lines.findIndex((l) => /^# /.test(l));
  const title = titleAt >= 0 ? lines[titleAt].replace(/^# /, '').trim() : 'Board meeting';
  const body = blocks(lines.filter((_, i) => i !== titleAt), ctx);
  const src = `${REPO_URL}/blob/${ctx.branch}/docs/BOARD-AGENDA.md`;
  return `<div class="wrap panel agenda" id="board-meeting" role="tabpanel" aria-labelledby="tab-meeting" hidden>
  <h2>${inline(title, ctx)}</h2>
  <div class="prose agenda-body">${body}</div>
  <footer>From <a href="${esc(src)}" target="_blank" rel="noopener">docs/BOARD-AGENDA.md</a>. Task numbers link to their place on the Tasks tab.</footer>
</div>`;
}

function splitTitle(title) {
  const m = title.match(/^(Track [A-Z]|Phase \d) - (.+)$/);
  return m ? { eyebrow: m[1], name: m[2] } : { eyebrow: '', name: title };
}

function render(data, ctx) {
  const all = [...data.urgent.map((u) => u.state), ...data.sections.flatMap((s) => s.tasks.map((t) => t.state))];
  const count = (st) => all.filter((x) => x === st).length;
  const built = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago' }).format(ctx.builtAt);
  const fileUrl = `${REPO_URL}/blob/${ctx.branch}/TASKS.md`;

  // Now: the urgent table, open items first.
  const urgentOpen = data.urgent.filter((u) => u.state !== 'done');
  const urgentDone = data.urgent.filter((u) => u.state === 'done');
  const urgentRow = (u) => {
    const text = `${u.id} ${plain(u.task)} ${plain(u.why)} ${u.owner.join(' ')}`.toLowerCase();
    return `<li class="task" id="${u.id.toLowerCase()}" data-state="${u.state}" data-owner="${u.owner.join(' ').toLowerCase()}" data-text="${esc(text)}">
  <div class="task-head">${stateBadge(u.state)}<a class="tid" href="#${u.id.toLowerCase()}">${u.id}</a><span class="ttitle">${inline(u.task, ctx)}</span>${ownerChips(u.owner)}</div>
  <div class="prose why"><p>${inline(u.why, ctx)}</p></div>
</li>`;
  };

  const rollout = data.rollout
    .map((r) => {
      const refs = [...r.what.matchAll(/\b([ABCDU]\d+)\b/g)].map((m) => m[1]);
      const what = esc(plain(r.what)).replace(/\b([ABCDU]\d+)\b/g, (id) => `<a href="#${id.toLowerCase()}">${id}</a>`);
      return `<li class="step step-${r.phase}" data-refs="${refs.join(' ').toLowerCase()}"><span class="step-num">${r.num}</span><span class="step-what">${what}</span><span class="step-state">${inline(r.state, ctx)}</span></li>`;
    })
    .join('\n');
  const rolloutDone = data.rollout.filter((r) => r.phase === 'done').length;

  // Tracks, grouped under their ## heading.
  const groups = [];
  for (const s of data.sections) {
    if (!s.parent) groups.push({ ...s, children: [] });
    else (groups.find((g) => g.title === s.parent) || groups[groups.length - 1]).children.push(s);
  }
  const tally = (s) => {
    const open = s.tasks.filter((t) => t.state !== 'done').length;
    return `<span class="tally">${open} open · ${s.tasks.length - open} done</span>`;
  };
  const taskList = (s) => `<ul class="tasks">${s.tasks.map((t) => taskRow(t, ctx)).join('\n')}</ul><p class="empty" hidden></p>`;
  const sectionHtml = (s) => {
    const { eyebrow, name } = splitTitle(s.title);
    const intro = s.intro || (!s.tasks.length ? s.lead : '');
    return `<section class="track" id="${s.id}">
  <header class="track-head">
    ${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h3>${inline(name, ctx)}${s.note ? ` <span class="note">${esc(s.note)}</span>` : ''}</h3>
    ${s.tasks.length ? tally(s) : ''}
  </header>
  ${intro ? `<p class="intro">${inline(intro, ctx)}</p>` : ''}
  ${s.tasks.length ? taskList(s) : ''}
</section>`;
  };
  const tracks = groups
    .map((g) => {
      const { eyebrow, name } = splitTitle(g.title);
      return `<section class="group" id="${g.id}">
  <header class="group-head track-head">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2>${inline(name, ctx)}</h2>${g.tasks.length ? tally(g) : ''}</header>
  ${g.intro ? `<p class="intro">${inline(g.intro, ctx)}</p>` : ''}
  ${g.tasks.length ? `<div class="track">${taskList(g)}</div>` : ''}
  ${g.children.map(sectionHtml).join('\n')}
</section>`;
    })
    .join('\n');

  const decisionOrder = { open: 0, parked: 1, out: 2, done: 3 };
  const decisions = [...data.decisions]
    .sort((a, b) => decisionOrder[a.state] - decisionOrder[b.state])
    .map((d, i) => {
      const text = `${d.id} ${plain(d.title)} ${plain(d.notes)}`.toLowerCase();
      const firstOfId = data.decisions.findIndex((x) => x.id === d.id) === data.decisions.indexOf(d);
      return `<li class="decision dec-${d.state}"${firstOfId ? ` id="${d.id.toLowerCase()}"` : ''} data-state="${d.state === 'done' ? 'done' : 'todo'}" data-text="${esc(text)}">
  <div class="task-head"><span class="dstate dstate-${d.state}">${DECISION_LABEL[d.state]}</span><span class="tid">${d.id}</span><span class="ttitle">${inline(d.title, ctx)}</span></div>
  <details class="detail"${d.state === 'open' ? ' open' : ''}><summary>${d.state === 'open' ? 'Recommendation and notes' : 'Notes'}</summary><div class="prose"><p>${inline(d.notes, ctx)}</p></div></details>
</li>`;
    })
    .join('\n');

  const findings = [...data.findings]
    .sort((a, b) => b.num - a.num)
    .map((f) => {
      const body = blocks(f.lines, ctx).replace(/^<p><strong>F\d+ - [\s\S]*?<\/strong>\s*/, '<p>');
      return `<li class="finding" id="${f.id}" data-text="${esc(`${f.id} ${f.headline}`.toLowerCase())}"><details><summary><span class="tid">F${f.num}</span><span class="ftitle">${inline(f.headline, ctx)}</span></summary><div class="prose">${body}</div></details></li>`;
    })
    .join('\n');

  return `<title>Blackshear PTA Task Board</title>
<meta name="description" content="Open work for the Blackshear PTA website and Google Workspace, rendered from TASKS.md.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Bevan&display=swap">
<style>
/* Layout: the site's letterpress masthead (black band, lemon rule), then one
   reading column: Now, the Workspace rollout, a sticky filter bar, the tracks,
   decisions, and the findings log. Status reads by shape and by word. */
:root {
  --paper: #f5f6f9;
  --card: #ffffff;
  --ink: #12141a;
  --muted: #555b69;
  --rule: #d8dbe3;
  --accent: #0048a8;
  --lemon: #f0e430;
  --band: #000000;
  --band-ink: #ffffff;
  --band-muted: #c9ccd4;
  --done: #2a7a4b;
  --doing: #0048a8;
  --blocked: #b3261e;
  --todo: #6b7180;
  --chip: #eceef3;
  --code: #eef0f5;
  --font-display: "Bevan", Georgia, "Times New Roman", serif;
  --font-body: "Archivo", system-ui, -apple-system, "Segoe UI", sans-serif;
  --step-1: clamp(1.9rem, 1.4rem + 2vw, 2.8rem);
  --step-2: 1.35rem;
  --step-3: 1.05rem;
  --text: 0.975rem;
  --small: 0.84rem;
  --radius: 6px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #0d0f14; --card: #151922; --ink: #e8eaf0; --muted: #a3a9b8; --rule: #2a303c;
    --accent: #8fb3ff; --done: #63c58f; --doing: #8fb3ff; --blocked: #ff8b80; --todo: #9aa1b1;
    --chip: #1f2430; --code: #1c212b; --band-muted: #b9bdc7; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --paper: #0d0f14; --card: #151922; --ink: #e8eaf0; --muted: #a3a9b8; --rule: #2a303c;
  --accent: #8fb3ff; --done: #63c58f; --doing: #8fb3ff; --blocked: #ff8b80; --todo: #9aa1b1;
  --chip: #1f2430; --code: #1c212b; --band-muted: #b9bdc7; color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--paper); color: var(--ink); font-family: var(--font-body); font-size: var(--text); line-height: 1.55; margin: 0; }
a { color: var(--accent); text-underline-offset: 0.15em; }
a:focus-visible, summary:focus-visible, button:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
.wrap { max-width: 62rem; margin: 0 auto; padding-inline: 16px; }

/* Masthead */
.masthead { background: var(--band); color: var(--band-ink); border-bottom: 6px solid var(--lemon); }
.masthead .wrap { display: flex; align-items: center; gap: 1rem; padding-block: 1.25rem 1.1rem; }
.mark { width: 64px; height: 64px; flex: none; }
.mast-text { min-width: 0; display: grid; gap: 0.15rem; }
.org { font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.04em; font-size: var(--small); color: var(--band-muted); }
h1 { font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.01em; font-weight: 400; font-size: var(--step-1); line-height: 1; margin: 0; text-wrap: balance; }
.meta { font-size: var(--small); color: var(--band-muted); }
.meta a { color: var(--band-ink); }

[hidden] { display: none !important; }
.panel { display: grid; gap: 2.25rem; padding-block: 1.5rem 3rem; }

/* Tabs: Tasks | Board meeting. Plain text tabs on a rule, ink underline when selected. */
.tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--rule); }
.tabs [role="tab"] { font: inherit; font-size: var(--small); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); background: none; border: 0; border-bottom: 3px solid transparent; margin-bottom: -1px; padding: 0.9rem 0.85rem 0.7rem; cursor: pointer; }
.tabs [role="tab"]:hover { color: var(--ink); }
.tabs [role="tab"][aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }

/* The meeting tab is read aloud from a shared screen, so it runs a size up. */
.agenda { font-size: 1.08rem; gap: 1rem; }
.agenda-body { max-width: 68ch; }
.agenda-body h3 { font-family: var(--font-display); text-transform: uppercase; font-weight: 400; letter-spacing: 0.01em; font-size: var(--step-2); margin: 1.75rem 0 0.5rem; padding-bottom: 0.35rem; border-bottom: 3px solid var(--ink); }
.agenda-body h3:first-child { margin-top: 0.5rem; }
.agenda-body ul { margin: 0; padding-left: 1.25rem; display: grid; gap: 0.5rem; }
.agenda-body li::marker { color: var(--accent); }
.agenda-body > p { color: var(--muted); }
h2 { font-family: var(--font-display); text-transform: uppercase; font-weight: 400; letter-spacing: 0.01em; font-size: var(--step-2); line-height: 1.15; margin: 0; text-wrap: balance; }
h3 { font-family: var(--font-body); font-weight: 700; font-size: var(--step-3); margin: 0; text-wrap: balance; }
.eyebrow { display: block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.note { font-weight: 400; color: var(--muted); font-size: var(--small); }
.intro { margin: 0; color: var(--muted); max-width: 65ch; }

/* Summary line */
.tallies { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin: 0; padding: 0; list-style: none; font-variant-numeric: tabular-nums; }
.tallies li { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--muted); }
.tallies strong { color: var(--ink); font-size: 1.15rem; }

/* Status: shape and word */
.state { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; color: var(--c); --c: var(--todo); }
.state .glyph { width: 0.8rem; height: 0.8rem; border-radius: 50%; border: 2px solid var(--c); flex: none; }
.state-doing { --c: var(--doing); } .state-doing .glyph { background: linear-gradient(90deg, var(--c) 50%, transparent 50%); }
.state-done { --c: var(--done); } .state-done .glyph { background: var(--c); }
.state-blocked { --c: var(--blocked); } .state-blocked .glyph { border-radius: 2px; background: var(--c); }

/* Task rows */
.tasks, .decisions, .findings, .steps { list-style: none; margin: 0; padding: 0; }
.tasks { display: grid; gap: 0; border-top: 1px solid var(--rule); }
.task, .decision { border-bottom: 1px solid var(--rule); padding-block: 0.6rem; display: grid; gap: 0.35rem; min-width: 0; }
.task-head { display: grid; grid-template-columns: 7.5rem 3rem minmax(0, 1fr) auto; align-items: baseline; gap: 0.25rem 0.75rem; }
.tid { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--muted); text-decoration: none; letter-spacing: 0.02em; }
a.tid:hover { color: var(--accent); }
.ttitle { min-width: 0; font-weight: 600; overflow-wrap: anywhere; }
.task[data-state="done"] .ttitle { color: var(--muted); font-weight: 400; }
.owners { display: inline-flex; flex-wrap: wrap; gap: 0.25rem; justify-content: flex-end; }
.owner { background: var(--chip); color: var(--ink); border-radius: 999px; padding: 0.05rem 0.55rem; font-size: 0.75rem; font-weight: 600; }
.detail summary, .finding summary { cursor: pointer; color: var(--accent); font-size: var(--small); font-weight: 600; width: fit-content; }
.detail { margin-left: 11.25rem; min-width: 0; }
.why { margin-left: 11.25rem; }
.prose { min-width: 0; max-width: 72ch; overflow-wrap: anywhere; }
.prose p { margin: 0.4rem 0; }
.prose code, .ttitle code, .step code { background: var(--code); border-radius: 3px; padding: 0.05em 0.3em; font-size: 0.88em; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
.prose pre { background: var(--code); padding: 0.75rem; border-radius: var(--radius); overflow-x: auto; }
.prose pre code { background: none; padding: 0; }
.table-wrap { overflow-x: auto; }
.prose table { border-collapse: collapse; font-size: var(--small); }
.prose th, .prose td { border: 1px solid var(--rule); padding: 0.3rem 0.5rem; text-align: left; vertical-align: top; }
.empty { margin: 0; padding-block: 0.6rem; color: var(--muted); font-size: var(--small); border-bottom: 1px solid var(--rule); }

/* Sections */
.block { display: grid; gap: 0.85rem; }
.block-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 1rem; }
.tally { color: var(--muted); font-size: var(--small); font-variant-numeric: tabular-nums; }
.group { display: grid; gap: 1.5rem; }
.group-head { border-bottom: 3px solid var(--ink); padding-bottom: 0.4rem; }
.track { display: grid; gap: 0.6rem; scroll-margin-top: 5rem; }
.track-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 1rem; }
.track-head .eyebrow { flex-basis: 100%; }
.task, .finding, .decision, .step { scroll-margin-top: 5rem; }
.done-fold > summary { cursor: pointer; color: var(--muted); font-size: var(--small); font-weight: 600; padding-block: 0.5rem; }

/* Rollout */
.rollout { background: var(--card); border: 1px solid var(--rule); border-radius: var(--radius); padding: 1rem 1.1rem; display: grid; gap: 0.75rem; }
.progress { height: 8px; background: var(--chip); border-radius: 999px; overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--done); }
.steps { display: grid; gap: 0.1rem; counter-reset: none; }
.step { display: grid; grid-template-columns: 1.9rem minmax(0, 1fr) minmax(0, 15rem); gap: 0.6rem; align-items: baseline; padding-block: 0.45rem; border-top: 1px solid var(--rule); }
.step:first-child { border-top: 0; }
.step-num { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; border: 2px solid var(--todo); font-size: 0.78rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--muted); align-self: center; }
.step-done .step-num { background: var(--done); border-color: var(--done); color: var(--card); }
.step-doing .step-num { border-color: var(--doing); color: var(--doing); background: linear-gradient(90deg, color-mix(in srgb, var(--doing) 22%, transparent) 50%, transparent 50%); }
.step-what { min-width: 0; font-weight: 600; }
.step-done .step-what { color: var(--muted); font-weight: 400; }
.step-state { color: var(--muted); font-size: var(--small); min-width: 0; }

/* Filter bar */
.filters { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 2; background: var(--paper); border-bottom: 1px solid var(--rule); padding-block: 0.65rem; display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: center; }
.seg { display: inline-flex; border: 1px solid var(--rule); border-radius: 999px; overflow: hidden; background: var(--card); }
.seg button { font: inherit; font-size: var(--small); font-weight: 600; border: 0; background: none; color: var(--ink); padding: 0.35rem 0.8rem; cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
.filters label { font-size: var(--small); color: var(--muted); font-weight: 600; }
#search { font: inherit; font-size: var(--small); padding: 0.4rem 0.7rem; border: 1px solid var(--rule); border-radius: 999px; background: var(--card); color: var(--ink); min-width: 0; width: 14rem; max-width: 100%; }
.count { font-size: var(--small); color: var(--muted); margin-left: auto; font-variant-numeric: tabular-nums; }

/* Decisions and findings */
.dstate { font-size: 0.74rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--todo); }
.dstate-open { color: var(--blocked); } .dstate-done { color: var(--done); }
.decision .task-head { grid-template-columns: 7.5rem 3rem minmax(0, 1fr); }
.findings { border-top: 1px solid var(--rule); }
.finding { border-bottom: 1px solid var(--rule); padding-block: 0.5rem; }
.finding summary { display: grid; grid-template-columns: 3.25rem minmax(0, 1fr) 1rem; gap: 0.75rem; color: var(--ink); font-weight: 400; font-size: var(--text); width: auto; list-style: none; }
.finding summary::-webkit-details-marker { display: none; }
.finding summary .ftitle { min-width: 0; }
.finding summary::after { content: "+"; color: var(--accent); font-weight: 700; text-align: right; }
.finding details[open] > summary::after { content: "−"; }
.finding details[open] .ftitle { font-weight: 600; }
.finding .prose { margin-left: 4rem; }
footer { color: var(--muted); font-size: var(--small); border-top: 1px solid var(--rule); padding-top: 1rem; }

@media (max-width: 640px) {
  .task-head, .decision .task-head { grid-template-columns: auto minmax(0, 1fr); }
  .task-head .ttitle { grid-column: 1 / -1; }
  .task-head .owners { grid-column: 1 / -1; justify-content: flex-start; }
  .detail, .why, .finding .prose { margin-left: 0; }
  .step { grid-template-columns: 1.9rem minmax(0, 1fr); }
  .step-state { grid-column: 2; }
  .count { margin-left: 0; }
  #search { width: 100%; }
}
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>

<header class="masthead">
  <div class="wrap">
    ${mark()}
    <div class="mast-text">
      <span class="org">Blackshear PTA</span>
      <h1>Task Board</h1>
      <span class="meta">From <a href="${esc(fileUrl)}" target="_blank" rel="noopener">TASKS.md</a> · last updated ${esc(data.updated)} · built ${esc(built)} Central${ctx.dirty ? ' · includes uncommitted edits' : ''}</span>
    </div>
  </div>
</header>

${agendaMd ? `<nav class="wrap tabs" role="tablist" aria-label="Board views">
  <button type="button" role="tab" id="tab-tasks" aria-controls="panel-tasks" aria-selected="true">Tasks</button>
  <button type="button" role="tab" id="tab-meeting" aria-controls="board-meeting" aria-selected="false" tabindex="-1">Board meeting</button>
</nav>` : ''}

<main>
<div class="wrap panel" id="panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
  <ul class="tallies" aria-label="Task counts">
    <li><strong>${count('todo') + count('doing') + count('blocked')}</strong> open</li>
    <li>${stateBadge('doing')}<strong>${count('doing')}</strong></li>
    <li>${stateBadge('blocked')}<strong>${count('blocked')}</strong></li>
    <li>${stateBadge('todo')}<strong>${count('todo')}</strong></li>
    <li>${stateBadge('done')}<strong>${count('done')}</strong></li>
  </ul>

  <section class="block" id="-do-this-week">
    <div class="block-head"><h2>Now</h2><span class="tally">${urgentOpen.length} open · ${urgentDone.length} done</span></div>
    <ul class="tasks">${urgentOpen.map(urgentRow).join('\n')}</ul>
    <details class="done-fold"><summary>${urgentDone.length} done</summary><ul class="tasks">${urgentDone.map(urgentRow).join('\n')}</ul></details>
  </section>

  ${data.rollout.length ? `<section class="block rollout" id="rollout">
    <div class="block-head"><h2>Workspace rollout</h2><span class="tally">${rolloutDone} of ${data.rollout.length} steps done</span></div>
    <div class="progress" role="img" aria-label="${rolloutDone} of ${data.rollout.length} steps done"><span style="width:${Math.round((100 * rolloutDone) / data.rollout.length)}%"></span></div>
    <ol class="steps">${rollout}</ol>
  </section>` : ''}

  <div class="filters" role="search">
    <span class="seg" role="group" aria-label="Status"><button type="button" id="f-open" data-status="open" aria-pressed="true">Open</button><button type="button" id="f-all" data-status="all" aria-pressed="false">All</button></span>
    <span class="seg" role="group" aria-label="Owner">${['All', 'Jon', 'Claude', 'Board', 'Gabe'].map((o) => `<button type="button" id="o-${o.toLowerCase()}" data-owner="${o === 'All' ? '' : o.toLowerCase()}" aria-pressed="${o === 'All'}">${o}</button>`).join('')}</span>
    <input id="search" type="search" placeholder="Search tasks and findings" aria-label="Search tasks, decisions and findings" autocomplete="off">
    <span class="count" id="count" aria-live="polite"></span>
  </div>

  ${tracks}

  <section class="block" id="open-decisions">
    <div class="block-head"><h2>Decisions</h2><span class="tally">${data.decisions.filter((d) => d.state === 'open').length} open</span></div>
    <ul class="decisions tasks">${decisions}</ul>
    <p class="empty" hidden></p>
  </section>

  <section class="block" id="findings">
    <div class="block-head"><h2>Findings log</h2><span class="tally">${data.findings.length} entries, newest first</span></div>
    <p class="intro">Why things are the way they are. Each one is a short record of something learned the hard way.</p>
    <ul class="findings">${findings}</ul>
  </section>

  <footer>Generated from <a href="${esc(fileUrl)}" target="_blank" rel="noopener">TASKS.md</a> by <code>scripts/task-board.mjs</code>${ctx.sha ? `, at ${esc(ctx.branch)} ${esc(ctx.sha)}` : ''}. TASKS.md is the source of truth; this page is a read-only view of it.</footer>
</div>
${agendaPanel(ctx)}
</main>

<script>
(() => {
  const KEY = 'pta-task-board';
  let state = { status: 'open', owner: '', q: '' };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ status: state.status, owner: state.owner })); } catch (e) {} };

  const rows = [...document.querySelectorAll('.track .task, #open-decisions .decision, #findings .finding')];
  const search = document.getElementById('search');
  const count = document.getElementById('count');

  function apply() {
    const q = state.q.trim().toLowerCase();
    let shown = 0;
    for (const el of rows) {
      const isFinding = el.classList.contains('finding');
      const isDecision = el.classList.contains('decision');
      const okStatus = isFinding || state.status === 'all' || el.dataset.state !== 'done' || el.classList.contains('forced');
      const okOwner = isFinding || isDecision || !state.owner || (el.dataset.owner || '').split(' ').includes(state.owner);
      const okText = !q || (el.dataset.text || '').includes(q);
      const show = (okStatus && okOwner && okText) || el.classList.contains('forced');
      el.hidden = !show;
      if (show && !isFinding) shown++;
    }
    for (const list of document.querySelectorAll('.track .tasks, #open-decisions .decisions')) {
      const empty = list.parentElement.querySelector(':scope > .empty');
      if (!empty) continue;
      const any = [...list.children].some((li) => !li.hidden);
      empty.hidden = any;
      empty.textContent = q || state.owner ? 'Nothing here matches.' : 'Nothing open here.';
    }
    count.textContent = shown + (shown === 1 ? ' item' : ' items');
    for (const b of document.querySelectorAll('[data-status]')) b.setAttribute('aria-pressed', String(b.dataset.status === state.status));
    for (const b of document.querySelectorAll('button[data-owner]')) b.setAttribute('aria-pressed', String(b.dataset.owner === state.owner));
  }

  document.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => { state.status = b.dataset.status; save(); apply(); }));
  document.querySelectorAll('button[data-owner]').forEach((b) => b.addEventListener('click', () => { state.owner = b.dataset.owner; save(); apply(); }));
  search.addEventListener('input', () => { state.q = search.value; apply(); });

  // Tabs. The panel id is the tab's identity, so #board-meeting deep-links to it.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function showTab(panelId) {
    for (const t of tabs) {
      const on = t.getAttribute('aria-controls') === panelId;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    }
    try { localStorage.setItem(KEY + '-tab', panelId); } catch (e) {}
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => showTab(t.getAttribute('aria-controls')));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      showTab(next.getAttribute('aria-controls'));
    });
  });

  // A link to a task or finding that the filters, a fold or the other tab is hiding: show it, and open it.
  function reveal(id) {
    const el = id && document.getElementById(id);
    if (!el) return;
    if (el.getAttribute('role') === 'tabpanel') { showTab(id); return; }
    const panel = el.closest('[role="tabpanel"]');
    if (panel && panel.hidden && tabs.length) showTab(panel.id);
    if (el.hidden) { el.classList.add('forced'); apply(); }
    const d = el.matches('details') ? el : el.querySelector('details');
    if (d && (el.classList.contains('finding') || el.classList.contains('task'))) d.open = true;
    const fold = el.closest('details.done-fold');
    if (fold) fold.open = true;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a) reveal(decodeURIComponent(a.getAttribute('href').slice(1)));
  });
  if (tabs.length) {
    let start = 'panel-tasks';
    try { const saved = localStorage.getItem(KEY + '-tab'); if (saved && document.getElementById(saved)) start = saved; } catch (e) {}
    showTab(start);
  }
  if (location.hash) reveal(location.hash.slice(1));
  apply();
})();
</script>`;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, render(data, ctx));
const tasks = data.sections.reduce((n, s) => n + s.tasks.length, 0);
console.log(`${path.relative(root, OUT)}: ${data.urgent.length} urgent, ${tasks} tasks, ${data.rollout.length} rollout steps, ${data.decisions.length} decisions, ${data.findings.length} findings, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
