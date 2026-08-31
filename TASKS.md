# Blackshear PTA Website - Task Board

**Last updated:** 2026-08-31 (session 9)
**Owner legend:** `JON` = needs Jon's account access / a human decision · `CLAUDE` = Claude Code can do it · `BOARD` = needs another board member
**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 🚨 DO THIS WEEK

| # | Task | Owner | Why it's urgent |
|---|---|---|---|
| U1 | **Pick between Civic Letterpress and East Austin Print Shop** | JON | Narrowed from six on first look. Everything in Phase 2 is blocked until one wins. Live at **https://blackshearpta.org** |
| U2 | ~~Renew the domain~~ | Gabe | ✅ Handled |

Ask for a favourite **and** a runner-up: six options split a small group six ways, and the second choice is usually where consensus actually shows up.

*Going forward, code changes land via branch → PR rather than direct pushes to `main`.*

---

## Track C - Domain, DNS, Email

*Runs first; several Track A items depend on it.*

- [!] **C1**: **Renew the domain at GoDaddy**: **Gabe**: **see U1.** Escalated from "confirm auto-renew" to "renew it now" after the transfer was rejected. Jon's *Domains Only* access cannot see or act on billing
- [x] **C2**: Determine what's behind the existing Google MX records - `JON` - Gabe started a Workspace/Nonprofits signup ~1 year ago on blackshearpta.org and abandoned it. Domain is already Google-verified. See [F8](#f8)
- [x] **C3**: Confirm GoDaddy delegate access level - `JON` - **"Domains Only"** on Gabe Hernandez's account. Sufficient for nameservers/DNS. *Not* sufficient for billing (C1) or product subscriptions
- [x] **C4**: Create Cloudflare account - `JON` - Created 2026-08-28. ⚠️ Confirm it was created as `blackshearpta@gmail.com`, not a personal address
- [x] **C5**: Add `blackshearpta.org` to Cloudflare, review imported DNS - `JON` - Free plan. All 13 records imported and verified against [Appendix A](#appendix-a--dns-snapshot-2026-08-28): 5 MX, SPF, `google-site-verification`, `_dmarc`, 2 A, 3 CNAME. Nothing lost
- [x] **C6**: Change nameservers at GoDaddy to Cloudflare - `JON` - `elias` + `sandra.ns.cloudflare.com`. Zone active, registry delegation confirmed, records verified live. DNSSEC was already unsigned so no disable step was needed
- [!] **C7**: Decide: Cloudflare Email Routing vs. Google mail - `JON` + `CLAUDE` - **Blocked on B2.** Do not enable Email Routing while the Workspace application is live - it overwrites the MX records
- [ ] **C8**: Establish `webmaster@blackshearpta.org` - `JON` - Method depends on C7
- [!] **C9**: Registrar transfer GoDaddy → Cloudflare - `JON` + **Gabe**: **Attempted 2026-08-28, rejected by GoDaddy within minutes.** Domain was unlocked and the auth code was valid, so neither was the cause. See [F15](#f15). **Retry after 2026-10-11.** Confirm Cloudflare refunds the $11.20

---

## Track B - Nonprofit program enrollments

*Google and GitHub both gate on the same 501(c)(3) proof. Longest pole; independent of the website. Do not let either block Track A.*

### Google Workspace for Nonprofits

- [x] **B1**: Initial Google for Nonprofits request submitted - `JON` - Submitted 2026-08-28
- [~] **B2**: Complete nonprofit validation - `JON` - Partner is **Goodstack** (We Are Percent Ltd), *not* TechSoup. Rep approval ✅ and identity verification ✅ both cleared 2026-08-28. Application processing. See [F12](#f12)
- [ ] **B3**: Reconcile with whatever already exists on the domain - `JON` - **Depends on C2.** If a Workspace subscription is already active on `blackshearpta.org`, the nonprofit application may need it converted rather than created fresh
- [ ] **B4**: Activate Workspace for Nonprofits on `blackshearpta.org` - `JON`
- [ ] **B5**: Convert `webmaster@` to a real mailbox; migrate MX if needed - `JON` + `CLAUDE`
- [ ] **B6**: Re-point Cloudflare Access identity provider at Workspace SSO - `CLAUDE` - Config change only, no rework

### GitHub for Nonprofits

*Free GitHub Team for verified 501(c)(3) orgs. Not urgent; see [F17](#f17), but free upside, and it converts the existing org in place with no rework.*

- [ ] **B7**: Apply for GitHub for Nonprofits - `JON` - Request the discount from the org's billing settings, or via the GitHub for Nonprofits portal. Needs the same 501(c)(3) evidence as B2, so expect the "PTA TEXAS CONGRESS" group-exemption wrinkle ([F13](#f12))
- [ ] **B8**: Look at the Nonprofit Developer Pack - `JON` - Bundled partner credits and discounts. Worth a skim once B7 lands; may cover things we're currently paying nothing for anyway
- [ ] **B9**: Re-evaluate public vs. private repo once Team lands - `JON` + `CLAUDE` - Team makes private repos fully featured. Current call is **public** and I'd likely keep it: branch protection and secret-scanning push protection are already free on public repos, and transparency suits a parent-funded org

---

## Track A - Website

### Phase 0 - Accounts & scaffold

- [x] **A1**: Create GitHub Organization - `JON` - **`Blackshear-PTA`**, Free plan, created under the PTA account (not Jon's personal). Correct per §3.6. GitHub for Nonprofits (free Team) deferred - converts an existing org in place, so no rework later ([F17](#f17))
- [x] **A2**: Create repo, grant Jon access - `JON` - Public at `Blackshear-PTA/blackshear-pta-website`. `jon-flowers` added as Owner; scaffold pushed, 5 commits live
- [x] **A3**: Scaffold Astro + Tailwind v4 - `CLAUDE` - Astro 7.2.9 + Tailwind 4.3.3, 4 commits local. Build clean, `astro check` 0 errors. **Node pinned to 22.22.3** via `.node-version` (Astro 7 needs ≥22.12). Tailwind default palette verified genuinely unreachable, not just discouraged
- [x] **A4**: Wire GitHub → Cloudflare Workers deploy on push - `JON` - Cloudflare **Workers Builds** connected to the repo. Worker `blackshear-pta`, build `npm run build`, deploy `npx wrangler deploy`, branch previews via `npx wrangler versions upload`. Build token `blackshear-pta-builds` is created and held by Cloudflare - nothing to store in GitHub
- [~] **A5**: Deploy end-to-end - `CLAUDE` + `JON` - First `main` build triggered 2026-08-30. Branch builds confirmed working on [PR #1](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/1), which validates `versions upload` against an assets-only Worker with no `main` field
- [~] **A6**: Site-wide `noindex` - `CLAUDE` - In [PR #1](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/1). Two mechanisms: `public/_headers` (`X-Robots-Tag`) and a `<meta name="robots">` in `BaseLayout.astro`. **Both must be deleted at cutover, not before**
- [ ] **A7**: Cloudflare Web Analytics - `CLAUDE` - Free, cookieless, no consent banner required

### Phase 1 - Coming-soon + six-theme demo

- [ ] **A8**: "Coming soon" page at `/`, linking to the Weebly site - `CLAUDE`
- [~] **A9**: Extract copy from Weebly into `src/content/home.yaml` - `CLAUDE` - In [PR #1](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/1). Real copy and real links, no placeholders left. Meeting dates taken from the 2026-2027 calendar, not the Weebly homepage, which is a year stale ([F18](#f18))
- [x] **A10**: Salvage the four usable photos from Weebly - `CLAUDE` - In `assets/from-weebly/`
- [~] **A11**: Brand marks - `CLAUDE` + `JON` - Header now carries an **SVG yellow jacket drawn as geometry** (`src/components/BuzzMark.astro`), themed via four CSS tokens so it can be full-colour, one-ink, or silhouette per theme. A raster crop could not do that. **Still open: whether the PTA fronts with school marks or its own lockup** ([F11](#f11))
- [x] **A12**: Theme token architecture - `CLAUDE` - Registry pairs each theme with a structure so a token-only recolor cannot ship by accident. 4 structures, ~40 `--pta-*` tokens, sections read tokens only
- [x] **A13**: Six themes - `CLAUDE` - Each with its own self-hosted typeface pairing (10 families via `astro:fonts`, zero runtime Google requests)
- [x] **A14**: Instant switcher at `/preview` - `CLAUDE` - All six rendered, five `display:none`. Switching is instant, choice persists, `?theme=` is shareable. Only the active theme's fonts download (verified: 2 of 38 faces loaded)
- [~] **A15**: Mobile QA + WCAG AA audit - `CLAUDE` + `JON` - Contrast is now an automated gate: `npm run check:contrast`, **54 checks across 6 themes, 0 failing**. Two real bugs caught and fixed ([F20](#f20)). **Still wants a real-phone pass**: the browser pane stopped rendering mid-session, so late layout checks were DOM-measured rather than seen
- [ ] **A16**: Provision D1 - `CLAUDE`
- [ ] **A17**: `/api/feedback` vote capture → D1 - `CLAUDE` - Fast-follow; doubles as the Worker→D1 smoke test
- [ ] **A18**: Send the preview link to the board and collect votes - `JON`

### Phase 2 - Real site *(not started)*

Winning theme promoted · full page set · admin UI + Cloudflare Access · R2 for images · announcements feed with RSS · file hosting (handbook, The Beat, forms) · link-out hub for SignUpGenius and the calendar · **cutover: Weebly retired, redirects in place, noindex removed**

### Phase 3 - Member accounts *(not started, only if still wanted)*

Magic-link auth via an established library over D1 · no passwords · Durable Objects for anything realtime

---

## Open decisions

| # | Decision | Status | Notes |
|---|---|---|---|
| D1 | **Content editing for future boards** | ✅ **Decided** | Markdown in git + custom `/admin` behind Cloudflare Access with Google SSO. Approved 2026-08-28, conditional on GitHub being free - it is (see [F9](#f9)) |
| D2 | **Credential sharing across the board** | ⏳ Unresolved | Bitwarden Teams rejected on cost. Must be settled before a second person gets account access. Do not self-host a vault |
| D3 | **Transactional email provider** (Phase 3) | ⏳ Deferred | Resend free tier, or route through Workspace once available |
| D4 | **Parent-to-parent messaging** | 🛑 Out of scope | Needs the board *and* the school in the room. An unmaintained brochure site is stale; an unmaintained messaging platform holding family contact data is a live incident |
| D5 | Demo on the real domain vs. `*.workers.dev` | ✅ **Decided** | Real domain, at `/preview`, whole zone noindexed until cutover |
| D6 | Cloudflare Access gate on the preview | ✅ **Decided** | Dropped for Phase 1 - friction kills vote participation and there's nothing confidential. Reinstated in Phase 2 for `/admin` |
| D7 | Registrar transfer timing | ✅ **Decided** | Defer to October. Renewal is 6 days out; a failed transfer near expiry risks losing the domain to save ~$20 |
| D8 | Replace SignUpGenius / ClassDojo / WhatsApp | ✅ **Decided** | Phase 2 aggregates and links out. Replacement is a later phase, evaluated on its own |

---

## Findings

<a name="f2"></a>
**F1 - Domain expires 2026-09-03.** Registered 2025-09-03 at GoDaddy. Six days out as of this writing.

**F2 - There is already Google email infrastructure on the domain.** MX records point at Google (`aspmx.l.google.com` et al.), and there's a `google-site-verification` TXT record. SPF uses GoDaddy's SPF-merge format (`_spfm`) and DMARC reports go to `onsecureserver.net` - both GoDaddy-managed. The likely explanation is a GoDaddy-resold Google Workspace subscription set up on a board member's personal account. **Two consequences:** it may be a recurring charge nobody is tracking, and an existing Workspace subscription on the domain can complicate the Nonprofits application (B3).

<a name="f8"></a>
**F8 - The Workspace history explains the stray DNS records, and two applications are now open.** Gabe attempted Google Workspace / Google for Nonprofits roughly a year ago using `blackshearpta.org`. It stalled, and he understood the blocker to be that no website existed on the .org domain. The MX, SPF, DMARC, and `google-site-verification` records are leftovers from that attempt. **The domain is therefore already verified with Google**: that step is done. Jon reapplied 2026-08-28 using `blackshearpta@gmail.com`. Possible outcomes: the applications merge, the old one reactivates, or Jon hits a "domain already in use" conflict. If a dormant Workspace account exists on the domain, Google will need to release or convert it.

<a name="f9"></a>
**F9 - The GitHub side of the architecture is free, permanently.** GitHub Free for Organizations covers unlimited private repos and unlimited collaborators; GitHub Apps and the REST API cost nothing. The only metered thing is Actions minutes (2,000/month free on private repos), and **a public repo gets unlimited Actions minutes**: plus we may not need Actions at all, since Cloudflare Workers Builds can build directly from the repo. No paid tier is required by anything in this design.

**F10 - Real brand palette, sampled from the logos.** Blue `#0048A8`, lemon yellow `#F0E430`, black. Accessible in every combination except yellow-on-white (1.33:1), so **yellow is accent and background only, never text on white**. The original crest PDF is vector and uses Hussar Bold + Sriracha, both open-source. Full detail in `assets/brand/README.md`. This corrects the "jacket gold" guess in `PROJECT-BRIEF.md` §5.2 - the actual yellow is a brighter lemon.

**F11 - All existing marks are school marks, not PTA marks.** The PTA is a legally separate org. Whether it fronts with Blackshear Fine Arts Academy branding or a distinct PTA lockup is a board question with real implications for donations and tax receipts. Tracked as A11.

<a name="f12"></a>
**F12 - Google's nonprofit validation partner is Goodstack, not TechSoup.** Goodstack (We Are Percent Ltd, London) handles validation for Google for Nonprofits. This resolves one of the `PROJECT-BRIEF.md` §7 verify items. Two verification steps cleared same-day on 2026-08-28: the PTA Gmail approved Jon as an authorized representative, and his personal identity was verified.

**F13 - The EIN resolves to "PTA TEXAS CONGRESS," not Blackshear PTA.** Texas local PTA units operate under Texas PTA's IRS group exemption, and subordinates in a group ruling frequently don't appear individually in the IRS Business Master File that validators query. Expected, and usually approves fine. Two things to watch: benefits may be provisioned under the state org's identity rather than the local unit's, and if Texas PTA or another unit already holds a Google for Nonprofits account on that EIN there could be a conflict. Worth having Blackshear's standing letter from Texas PTA available if a reviewer asks.

**F14 - No website URL was requested during the application.** The application asked only for an EIN. The concern about pointing reviewers at a parking page is therefore deferred, not resolved - a URL will be requested at Google for Nonprofits account setup and/or Workspace provisioning. **Use the Weebly URL when it comes up**, not `blackshearpta.org`.

<a name="f15"></a>
**F15 - GoDaddy rejected the registrar transfer.** Initiated from Cloudflare 2026-08-28 with a valid auth code and paid ($11.20); rejected within minutes. Diagnostics rule out the obvious causes: the domain shows `Domain Status: ok` (unlocked, not re-locked), and Creation Date is 2025-09-03, so Cloudflare's boilerplate "recently registered" guess does not apply. **The rejection arrived too fast to have been a human decision**: Gabe had not yet acted. Two credible causes remain: (a) ICANN's 60-day Change-of-Registrant lock triggered by the 2026-08-12 registrant update, which would run to **2026-10-11**; or (b) GoDaddy policy refusing transfers inside 30 days of expiry. Both point to the same plan: renew now, retry after Oct 11. GoDaddy emails the definitive reason to the registrant - that's Gabe's inbox.

<a name="f16"></a>
**F16 - Jon's personal GitHub account cannot push to the org.** The org was created under the PTA account, which is architecturally correct. But `jon-flowers` is not a member (`pull: true, push: false`), so the scaffold cannot be pushed. Fix: invite `jon-flowers` to `Blackshear-PTA` as an **Owner**. Correct end state is the PTA account owning the org so it survives turnover, with Jon's personal account as a second Owner for day-to-day work.

<a name="f17"></a>
**F17 - GitHub for Nonprofits is free Team, but not worth blocking on.** Verified 501(c)(3) orgs get GitHub Team free. It converts an *existing* org in place, so starting on Free costs nothing later. The delta over Free is negligible here - the useful parts (branch protection, secret scanning with push protection, unlimited Actions minutes) are already free on **public** repos, which is why the repo is public. Expect the same "PTA TEXAS CONGRESS" group-exemption wrinkle as Goodstack ([F13](#f12)) whenever it is pursued.

<a name="f18"></a>
**F18 - The current Weebly homepage is a year out of date.** It advertises the 2025-2026 PTA meeting dates (9/9, 11/18, 2/10, 4/14, 5/19) - all in the past, and "Last meeting: 5/19." The 2026-2027 calendar has seven meetings alternating mornings and evenings with one virtual. Content in the new site is sourced from the calendar where the two disagree. Reinforces why the editing workflow (D1) is the real long-term risk: the site went stale because updating it was harder than not.

<a name="f19"></a>
**F19 - Nearly every outbound link is a tinyurl.** `BlackshearStore`, `BlackshearSuppliesHelp`, `BlackshearBikeDayInfo`, `MonthlyBakeSaleInfo`, `BlackshearFamilyHandbook`, `BlackshearPTAMeetingSignups`, and roughly eight more. Opaque redirects owned by whoever holds that account: nobody can audit where they point without clicking, and losing the account breaks every link on the site simultaneously. Not blocking, but **find out who owns it**, and prefer direct links as Phase 2 builds out. Also unresolved: donations point at both a Zeffy link and `tinyurl.com/Donate2Blackshear` - somebody should confirm which is current.

<a name="f20"></a>
**F20 - Two layout bugs the automated checks caught that screenshots did not.** (1) The `editorial` structure's full-bleed band used the common `margin-inline: calc(50% - 50vw)` trick, which is off by the scrollbar width - `50vw` counts it, `50%` does not - putting the page into horizontal scroll on any desktop with a classic scrollbar. Fixed by making the band a DOM sibling of the container so it is naturally full width, with no arithmetic. (2) Header nav links measured ~37px tall against the 44px touch minimum, because padding alone at `--text-fine` does not reach it. Both were invisible at a glance and only showed up under measurement - worth remembering that the visual pass is not the QA pass.

**F3 - The root domain serves a GoDaddy parking page.** `server: DPS/2.0.0`, title is just the bare domain. Nothing is using it, so pointing it at a coming-soon page breaks nothing.

<a name="f4"></a>
**F4 - Account bootstrap is circular.** We want every account registered to `webmaster@blackshearpta.org`, but creating that address needs a Cloudflare account (or the Google config in F2). Resolution: create Cloudflare with `blackshearpta@gmail.com`, establish `webmaster@`, then change the Cloudflare account email. Cloudflare supports this with re-verification.

<a name="f5"></a>
**F5 - Transfer is locked, and possibly double-locked.** `clientTransferProhibited` is set (GoDaddy default - the owner must unlock). The domain's Updated Date is 2026-08-12; if that was a registrant contact change, ICANN's 60-day transfer lock runs until roughly 2026-10-11.

**F6 - The photo library is thin.** Fifteen unique images across all six Weebly pages, but almost all are event flyers, donor banners, and sponsor logos. Only four are actual photographs. The strongest by far is the E. 11th St. shot of the building with the mural and sponsor banners, and it contains no children's faces, so there's no release question. Getting 15-20 real photos from Instagram and the board is a parallel task.

**F7 - ~~No brand assets exist.~~** *Superseded by [F10](#f9)* - four logo files surfaced 2026-08-28. The mascot is the **yellow jacket** (named **Buzz**), not a honeybee, so no hive/honeycomb/honey motifs.

---

## Reference

- **School:** Blackshear Elementary Fine Arts Academy, 1712 E. 11th St., Austin, TX 78702 (Austin ISD)
- **Mascot:** Yellow jacket, named **Buzz** · **Est. 1891** · **Milestone:** 135 years in East Austin - Austin's oldest operating elementary school
- **Motto:** "Together we EDUCATE, ENRICH, and EXERCISE to EXCEL" · **Tagline:** "Growing Stronger Together"
- **Palette:** blue `#0048A8` · lemon `#F0E430` · black; see `assets/brand/README.md`
- **Current site:** https://blackshearpta.weebly.com/ · **New domain:** blackshearpta.org
- **Primary account:** `blackshearpta@gmail.com` (Jon has access) · **Weebly:** Jon has access
- **GoDaddy:** domain sits in **Gabe Hernandez's** personal account; Jon has *Domains Only* delegate access (DNS yes, billing no)
- **PTA phone:** (512) 402-2023
- **Committees:** Fine Arts / Little EAST · Fundraising · Staff Appreciation · Garden
- **Stack:** Astro 7.2.9 · Tailwind 4.3.3 · Node 22.22.3 (pinned) · Cloudflare Workers (static assets) · D1 · R2
- **GitHub:** org `Blackshear-PTA` (Free) · repo `blackshear-pta-website` (**public**)
- **Cloudflare:** zone `blackshearpta.org` active, Free plan · registrar still GoDaddy

<a name="appendix-a--dns-snapshot-2026-08-28"></a>
### Appendix A - DNS snapshot, 2026-08-28

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
