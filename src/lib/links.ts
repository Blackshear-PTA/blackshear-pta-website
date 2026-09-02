/**
 * Does this link leave the site over http(s)?
 *
 * Derived from the href rather than declared per link in content. site.yaml has
 * an `external: true` flag on nav items and it is exactly the kind of field a
 * volunteer will forget to flip when they change a URL - at which point an
 * internal page opens in a new tab, or an outbound link loses its warning, and
 * nothing fails loudly. A function cannot be forgotten.
 *
 * `mailto:` and `tel:` are deliberately NOT external here, even though they do
 * leave the site. What this predicate actually decides is "should this open in
 * a new tab and say so", and for a mail or phone link the answer is no twice
 * over: `target="_blank"` on a `mailto:` leaves an empty tab behind in several
 * browsers, and "opens in a new tab" is a false description of handing off to a
 * mail client. A first version of this counted them and put target="_blank" on
 * "Email the PTA", which is how that got noticed.
 */
export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}
