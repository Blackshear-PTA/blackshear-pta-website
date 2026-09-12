/**
 * Post bodies, markdown to HTML, at request time.
 *
 * WHY THIS EXISTS AT ALL. Astro's own markdown pipeline runs at build time, on
 * files. Post bodies now live in a database column and the page that renders
 * them is rendered on demand, so there is no build step to do this any more and
 * `render(entry)` has nothing to take. This is the replacement, and it runs
 * inside the Worker on every request for an announcement.
 *
 * WHY markdown-it AND NOT remark. @astrojs/markdown-remark is the same
 * machinery Astro uses and would match the old output exactly, but it is a
 * large dependency graph to pull into a Worker bundle and the free plan gives
 * an invocation 10ms of CPU (F25). markdown-it is one small library with no
 * plugins loaded, and the posts use six markdown features between them.
 *
 * html: false IS THE IMPORTANT SETTING. Raw HTML in a body is escaped rather
 * than passed through. Bodies are written by board members behind Cloudflare
 * Access, so this is not the security boundary - but it used to be impossible
 * for a body to reach a reader without passing a human review of a git diff,
 * and that review is what this migration removes. Escaping is the cheapest way
 * to keep "a post cannot inject markup into the page" true without one.
 *
 * typographer: true because Astro's markdown defaults to smartypants, so curly
 * quotes and dashes are what the four live posts were already rendering with.
 * Turning it off would silently restyle the punctuation of every existing post.
 */
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  // Addresses in a body should be links because somebody typed them as links.
  // Autolinking bare text is a surprise, and it is how a phone number or a
  // teacher's email ends up as a mailto nobody asked for.
  linkify: false,
  typographer: true,
  // A single newline stays a single newline. Board members paste from email and
  // a wrapped paragraph would otherwise come out as a column of short lines.
  breaks: false,
});

/** Rendered HTML for a post body. Safe to pass to set:html - see html: false. */
export function renderMarkdown(text) {
  return md.render(String(text ?? ''));
}
