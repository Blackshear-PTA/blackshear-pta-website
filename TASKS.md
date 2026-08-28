# Blackshear PTA Website — Task Board

**Last updated:** 2026-08-28
**Owner legend:** `JON` = needs Jon's account access / a human decision · `CLAUDE` = Claude Code can do it · `BOARD` = needs another board member
**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 🚨 DO THIS WEEK

| # | Task | Owner | Why it's urgent |
|---|---|---|---|
| U1 | **Confirm `blackshearpta.org` auto-renew is ON and the card on file is valid** | JON | **Registry expiry is 2026-09-03 — six days from today.** If this lapses, everything else stops. |
| U2 | **Find out what Google email is already configured on the domain** | JON | Live Google MX records + a Google site-verification TXT already exist. Something is set up that we didn't know about. See [Finding F2](#f2). |

Everything else can wait until these two are answered.

---

## Track C — Domain, DNS, Email

*Runs first; several Track A items depend on it.*

- [ ] **C1** — Confirm auto-renew ON + valid payment method at GoDaddy — `JON` — **see U1**
- [ ] **C2** — Determine what's behind the existing Google MX records — `JON` — **see U2, F2**
- [ ] **C3** — Confirm GoDaddy delegate access level includes DNS management — `JON` — Needs "Products & Domains" or higher; "Products only" can't change nameservers
- [ ] **C4** — Create Cloudflare account — `JON` — Bootstrap with `blackshearpta@gmail.com`; we change the account email later (see F4)
- [ ] **C5** — Add `blackshearpta.org` to Cloudflare, review the imported DNS records — `CLAUDE` + `JON` — **Must verify MX / SPF / DMARC / TXT survive the import or email breaks.** Full current record set captured in [Appendix A](#appendix-a--dns-snapshot-2026-08-28)
- [ ] **C6** — Change nameservers at GoDaddy to Cloudflare — `JON` — Root currently serves a GoDaddy parking page, so nothing user-facing breaks (F3)
- [ ] **C7** — Decide: Cloudflare Email Routing vs. existing Google mail — `JON` + `CLAUDE` — **Blocked by C2.** Do not enable Email Routing before this is answered — it overwrites MX
- [ ] **C8** — Establish `webmaster@blackshearpta.org` — `JON` — Method depends on C7
- [ ] **C9** — Registrar transfer GoDaddy → Cloudflare — `BOARD` — **Deferred to October.** Owner must unlock (`clientTransferProhibited` is set) and supply the auth code. Possible 60-day lock until ~Oct 11 (F5)

---

## Track B — Google Workspace for Nonprofits

*Longest pole. Independent of the website. Do not let it block Track A.*

- [x] **B1** — Initial Google for Nonprofits request submitted — `JON` — Submitted 2026-08-28
- [ ] **B2** — Complete nonprofit validation (TechSoup or current partner) — `JON` — Can take weeks
- [ ] **B3** — Reconcile with whatever already exists on the domain — `JON` — **Depends on C2.** If a Workspace subscription is already active on `blackshearpta.org`, the nonprofit application may need it converted rather than created fresh
- [ ] **B4** — Activate Workspace for Nonprofits on `blackshearpta.org` — `JON`
- [ ] **B5** — Convert `webmaster@` to a real mailbox; migrate MX if needed — `JON` + `CLAUDE`
- [ ] **B6** — Re-point Cloudflare Access identity provider at Workspace SSO — `CLAUDE` — Config change only, no rework

---

## Track A — Website

### Phase 0 — Accounts & scaffold

- [ ] **A1** — Create GitHub Organization — `JON` — Register as `webmaster@blackshearpta.org` if it exists by then; otherwise bootstrap and change later
- [ ] **A2** — Create repo, invite Jon as owner — `JON`
- [ ] **A3** — Scaffold Astro + Tailwind v4 — `CLAUDE`
- [ ] **A4** — Wire GitHub → Cloudflare Workers deploy on push — `CLAUDE` + `JON` — Jon supplies the Cloudflare API token
- [ ] **A5** — Deploy a trivial placeholder page end-to-end — `CLAUDE` — **Prove the pipeline before building anything real**
- [ ] **A6** — `X-Robots-Tag: noindex` on the entire zone — `CLAUDE` — Comes off at cutover. Prevents indexing a second copy of the site while Weebly is still canonical
- [ ] **A7** — Cloudflare Web Analytics — `CLAUDE` — Free, cookieless, no consent banner required

### Phase 1 — Coming-soon + six-theme demo

- [ ] **A8** — "Coming soon" page at `/`, linking to the Weebly site — `CLAUDE`
- [ ] **A9** — Extract copy from Weebly into `src/content/home.yaml` — `CLAUDE` — Single source of truth; all six themes consume it
- [ ] **A10** — Salvage the four usable photos from Weebly — `CLAUDE` — See F6 for the inventory
- [ ] **A11** — Design a wordmark + yellow jacket mark — `CLAUDE` + `JON` — No logo files exist anywhere today
- [ ] **A12** — Build the theme token architecture — `CLAUDE` — `registry.ts`, per-theme token blocks, 3–4 structural layouts
- [ ] **A13** — Build six themes — `CLAUDE` — Civic Letterpress · Warm Editorial · Schoolyard Bold · East Austin Print Shop · Quiet Utility · Jacket
- [ ] **A14** — Instant theme switcher at `/preview` — `CLAUDE` — All six rendered, toggled client-side; no reload
- [ ] **A15** — Mobile QA across all six + WCAG AA contrast audit — `CLAUDE` — A theme that can't clear AA gets cut regardless of how it looks
- [ ] **A16** — Provision D1 — `CLAUDE`
- [ ] **A17** — `/api/feedback` vote capture → D1 — `CLAUDE` — Fast-follow; doubles as the Worker→D1 smoke test
- [ ] **A18** — Send the preview link to the board and collect votes — `JON`

### Phase 2 — Real site *(not started)*

Winning theme promoted · full page set · admin UI + Cloudflare Access · R2 for images · announcements feed with RSS · file hosting (handbook, The Beat, forms) · link-out hub for SignUpGenius and the calendar · **cutover: Weebly retired, redirects in place, noindex removed**

### Phase 3 — Member accounts *(not started, only if still wanted)*

Magic-link auth via an established library over D1 · no passwords · Durable Objects for anything realtime

---

## Open decisions

| # | Decision | Status | Notes |
|---|---|---|---|
| D1 | **Content editing for future boards** | ⏳ **Needs Jon** | Recommendation: markdown in git + custom `/admin` behind Cloudflare Access w/ Google SSO. Alternative: Sveltia CMS, but every editor needs a GitHub account — that's structural to all git-based CMSes, not a Sveltia quirk. Not blocking Phase 1, but it fixes the content schema |
| D2 | **Credential sharing across the board** | ⏳ Unresolved | Bitwarden Teams rejected on cost. Must be settled before a second person gets account access. Do not self-host a vault |
| D3 | **Transactional email provider** (Phase 3) | ⏳ Deferred | Resend free tier, or route through Workspace once available |
| D4 | **Parent-to-parent messaging** | 🛑 Out of scope | Needs the board *and* the school in the room. An unmaintained brochure site is stale; an unmaintained messaging platform holding family contact data is a live incident |
| D5 | Demo on the real domain vs. `*.workers.dev` | ✅ **Decided** | Real domain, at `/preview`, whole zone noindexed until cutover |
| D6 | Cloudflare Access gate on the preview | ✅ **Decided** | Dropped for Phase 1 — friction kills vote participation and there's nothing confidential. Reinstated in Phase 2 for `/admin` |
| D7 | Registrar transfer timing | ✅ **Decided** | Defer to October. Renewal is 6 days out; a failed transfer near expiry risks losing the domain to save ~$20 |
| D8 | Replace SignUpGenius / ClassDojo / WhatsApp | ✅ **Decided** | Phase 2 aggregates and links out. Replacement is a later phase, evaluated on its own |

---

## Findings

<a name="f2"></a>
**F1 — Domain expires 2026-09-03.** Registered 2025-09-03 at GoDaddy. Six days out as of this writing.

**F2 — There is already Google email infrastructure on the domain.** MX records point at Google (`aspmx.l.google.com` et al.), and there's a `google-site-verification` TXT record. SPF uses GoDaddy's SPF-merge format (`_spfm`) and DMARC reports go to `onsecureserver.net` — both GoDaddy-managed. The likely explanation is a GoDaddy-resold Google Workspace subscription set up on a board member's personal account. **Two consequences:** it may be a recurring charge nobody is tracking, and an existing Workspace subscription on the domain can complicate the Nonprofits application (B3).

**F3 — The root domain serves a GoDaddy parking page.** `server: DPS/2.0.0`, title is just the bare domain. Nothing is using it, so pointing it at a coming-soon page breaks nothing.

<a name="f4"></a>
**F4 — Account bootstrap is circular.** We want every account registered to `webmaster@blackshearpta.org`, but creating that address needs a Cloudflare account (or the Google config in F2). Resolution: create Cloudflare with `blackshearpta@gmail.com`, establish `webmaster@`, then change the Cloudflare account email. Cloudflare supports this with re-verification.

<a name="f5"></a>
**F5 — Transfer is locked, and possibly double-locked.** `clientTransferProhibited` is set (GoDaddy default — the owner must unlock). The domain's Updated Date is 2026-08-12; if that was a registrant contact change, ICANN's 60-day transfer lock runs until roughly 2026-10-11.

**F6 — The photo library is thin.** Fifteen unique images across all six Weebly pages, but almost all are event flyers, donor banners, and sponsor logos. Only four are actual photographs. The strongest by far is the E. 11th St. shot of the building with the mural and sponsor banners — and it contains no children's faces, so there's no release question. Getting 15–20 real photos from Instagram and the board is a parallel task.

**F7 — No brand assets exist.** No logo files in Drive, Canva, or on AISD's site. Existing materials are eclectic Canva templates. De facto palette from the Field Day flyer: jacket gold, black, a strong mid-blue, grass green. The mascot is the **yellow jacket** — not a honeybee, so no hive/honeycomb/honey motifs.

---

## Reference

- **School:** Blackshear Elementary Fine Arts Academy, 1712 E. 11th St., Austin, TX 78702 (Austin ISD)
- **Mascot:** Yellow jacket · **Milestone:** 135 years in East Austin — Austin's oldest operating elementary school
- **Current site:** https://blackshearpta.weebly.com/ · **New domain:** blackshearpta.org
- **Primary account:** `blackshearpta@gmail.com` (Jon has access) · **Weebly:** Jon has access
- **GoDaddy:** domain sits in *another board member's personal account*; Jon has delegate access only
- **PTA phone:** (512) 402-2023
- **Committees:** Fine Arts / Little EAST · Fundraising · Staff Appreciation · Garden
- **Stack:** Astro · Tailwind v4 · Cloudflare Workers (static assets) · D1 · R2 · GitHub Org

<a name="appendix-a--dns-snapshot-2026-08-28"></a>
### Appendix A — DNS snapshot, 2026-08-28

Captured before any changes. **Verify all of this survives the Cloudflare import (C5).**

```
NS     ns03.domaincontrol.com. / ns04.domaincontrol.com.
A      blackshearpta.org      -> 76.223.105.230, 13.248.243.5   (GoDaddy parking)
CNAME  www                    -> blackshearpta.org
MX     1  aspmx.l.google.com.
       5  alt1.aspmx.l.google.com. / alt2.aspmx.l.google.com.
       10 alt3.aspmx.l.google.com. / alt4.aspmx.l.google.com.
TXT    "v=spf1 include:dc-aa8e722993._spfm.blackshearpta.org ~all"
TXT    "google-site-verification=j2oZCILLgqJoY-w2X-_l1g3z3_pxHQ6-vgXFLWWVzoE"
TXT    _dmarc  "v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;"
DNSSEC unsigned
Registrar status: clientDeleteProhibited, clientRenewProhibited,
                  clientTransferProhibited, clientUpdateProhibited
```
