# Blackshear PTA Website - Task Board

**Last updated:** 2026-09-01 (session 10)
**Owner legend:** `JON` = needs Jon's account access / a human decision · `CLAUDE` = Claude Code can do it · `BOARD` = needs another board member
**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 🚨 DO THIS WEEK

| # | Task | Owner | Why it's urgent |
|---|---|---|---|
| U1 | ~~Pick a design~~ | JON | ✅ **Civic Letterpress A**, decided 2026-08-31. B and Print Shop held in reserve at `/preview`, not deleted |
| U2 | ~~Renew the domain~~ | Gabe | ✅ Handled |
| U3 | ~~Confirm the Phase 2 page set~~ | JON | ✅ Confirmed 2026-08-31, plus the four committee pages. Four built, four to go - see [A20](#phase-2---real-site) |
| U4 | ~~Cloudflare Web Analytics~~ | JON | ✅ **Already on.** Enabled automatically when the zone was added 2026-08-28, automatic setup, no snippet needed. Confirmed collecting: 74 page views / 13 visits in 24h. Closes [A7](#phase-0---accounts--scaffold) with no code change |
| U5 | ~~Set the `SITE_PASSWORD` secret~~ | JON | ✅ Set 2026-09-01, verified live, stray secret deleted 2026-09-01 |
| U6 | ~~Decide how the calendar works~~ | JON | ✅ **Google stays the source**, decided 2026-09-01. The site reads its iCal feed and renders its own list; the iframe goes. See [D10](#open-decisions) |
| U7 | ~~Decide what `/gallery` actually is~~ | JON | ✅ **Photo grid plus an Instagram link**, decided 2026-09-01. No token treadmill. See [D11](#open-decisions) |

| U8 | ~~Set up Cloudflare Access + a GitHub token~~ | JON | ✅ Done 2026-09-02. Application live at `blackshearpta.org/admin`, team domain `tight-cell-8e63.cloudflareaccess.com`, three secrets set. Token owned by the **PTA** GitHub account with no expiry - see [D12](#open-decisions) |
| U9 | ~~Set build watch paths~~ | JON | ✅ Done 2026-09-02. Exclude list is in [docs/DEPLOYS.md](docs/DEPLOYS.md) |

| U10 | ~~Rotate the pre-launch password~~ | JON | ✅ Rotated 2026-09-02 and verified: the old value now returns `e=bad`, so the secret is set and the committed one is dead. The old value remains in this repo's history ([F28](#f28)), which is why it was rotated rather than redacted |

| U11 | ~~Create the R2 photo bucket~~ | JON | ✅ `blackshear-pta-images` created 2026-09-02, name verified against the binding. R2 needed enabling on the account first (error 10042), and wrangler's offer to write the binding itself had to be declined - it defaults to a name nothing reads. Both noted in [docs/ADMIN.md](docs/ADMIN.md) |
| U12 | **Test `/admin` end to end** | JON | Sign in, post with a photo, confirm it appears on `/news`, delete it. I cannot do this - Access blocks me, which is the point |

**Now that a design is chosen**, `/` serves the real Civic Letterpress A homepage. `/preview` stays up as a reference and still shows all three, labelled so a reserve is not mistaken for a live option.

*Going forward, code changes land via branch → PR rather than direct pushes to `main`.*

---

## Track C - Domain, DNS, Email

*Runs first; several Track A items depend on it.*

- [x] **C1**: ~~Renew the domain at GoDaddy~~ - **Gabe** - Handled (U2). Escalated from "confirm auto-renew" to "renew it now" after the transfer was rejected, because Jon's *Domains Only* access cannot see or act on billing. **Worth re-confirming at the registry before the 2026-10-11 transfer retry** ([C9](#track-c---domain-dns-email)): `npm run check:domain`
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
- [x] **A7**: Cloudflare Web Analytics - `JON` - **Done, and it was already done.** Enabled automatically when the zone was added; automatic setup injects the beacon at the edge, so no snippet in `BaseLayout.astro` and nothing to maintain. Free, cookieless, no consent banner. Confirms in passing that edge injection still works with `assets.run_worker_first`, which was an open question. It is also the source of [F27](#f27)

### Phase 1 - Theme demo and board vote *(complete)*

- [x] **A8**: ~~"Coming soon" page at `/`~~ - `CLAUDE` - **Superseded.** `/` now serves the real Civic Letterpress A homepage ([A19](#phase-2---real-site)). The whole zone is still `noindex` ([A6](#phase-0---accounts--scaffold)) and Weebly is still canonical until cutover, so nothing is prematurely public - but a placeholder no longer buys anything
- [~] **A9**: Extract copy from Weebly into `src/content/home.yaml` - `CLAUDE` - In [PR #1](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/1). Real copy and real links, no placeholders left. Meeting dates taken from the 2026-2027 calendar, not the Weebly homepage, which is a year stale ([F18](#f18))
- [x] **A10**: Salvage the four usable photos from Weebly - `CLAUDE` - In `assets/from-weebly/`
- [~] **A11**: Brand marks - `CLAUDE` + `JON` - Header now carries an **SVG yellow jacket drawn as geometry** (`src/components/BuzzMark.astro`), themed via four CSS tokens so it can be full-colour, one-ink, or silhouette per theme. A raster crop could not do that. **Still open: whether the PTA fronts with school marks or its own lockup** ([F11](#f11))
- [x] **A12**: Theme token architecture - `CLAUDE` - Registry pairs each theme with a structure so a token-only recolor cannot ship by accident. 4 structures, ~40 `--pta-*` tokens, sections read tokens only
- [x] **A13**: ~~Six themes~~ → **three** - `CLAUDE` - Built six, each with its own self-hosted typeface pairing. The board cut to two, then Civic split into A and B. The four that lost are out of the working tree but still in git history
- [x] **A14**: Instant switcher at `/preview` - `CLAUDE` - Now a **reference page**, not a ballot: it no longer asks for a vote, and the chosen design is tagged as such. All three render, two `display:none`. Choice persists, `?theme=` is shareable, and `?theme=civic-letterpress` still resolves to A so links shared before the split keep working. Only the visible theme's fonts download
- [~] **A15**: Mobile QA + WCAG AA audit - `CLAUDE` + `JON` - Contrast is an automated gate: `npm run check:contrast`, **36 checks across 3 themes, 0 failing**. Two real bugs caught and fixed ([F20](#f20)). No horizontal scroll at 375px; the only sub-44px targets are links inline in running text, which WCAG 2.5.8 exempts. **Still wants a real-phone pass** - everything so far is emulated or DOM-measured
- [ ] **A16**: Provision D1 - `CLAUDE` + `JON` - **Deferred, not dropped.** Nothing in Phase 2 needs a database; Phase 3 does. Revisit at [A23](#phase-2---real-site) if the admin editor wants anything beyond git
- [x] **A17**: ~~`/api/feedback` vote capture → D1~~ - **Superseded.** The vote concluded over email and in person before this was worth building. The Worker→D1 smoke test it doubled as moves to A16
- [x] **A18**: Send the preview link to the board and collect votes - `JON` - Done. Result: Civic Letterpress A

### Phase 2 - Real site

*Started 2026-08-31. Ordered roughly by dependency: the page set has to exist before cutover is meaningful, and the admin editor has to exist before the site can survive handoff.*

- [x] **A19**: Promote Civic Letterpress A to `/` - `CLAUDE` - Homepage renders the chosen design; the `/ → /preview/` vote redirect is deleted. `siteThemeId` (the live site's design) is now a separate export from `defaultThemeId` (which panel `/preview` opens on), so pointing the preview at a reserve cannot silently re-skin the homepage. B and Print Shop still build and still pass the contrast gate
- [x] **A20**: **Build the page set** - `CLAUDE` + `JON` - Page list confirmed 2026-08-31. Pages are content, not code: a top-level key in `src/content/pages.yaml` publishes a URL, so adding one needs no code change. Copy is **lifted from Weebly to match current state**, with a rewrite pass deferred.
  - [x] `/little-east` - year-by-year archive. Four broken or mislabelled links corrected or dropped ([F21](#f21))
  - [x] `/sponsors` - Fundraising committee lands here. Full tier list; see [F22](#f22) for the Family Buzz question
  - [x] `/staff-appreciation` - **no Weebly page existed**; built from the homepage blurb and a Drive PDF ([F23](#f23))
  - [x] `/campus-beautification` - **no Weebly page existed**, and it was called "Garden"; renamed throughout ([F23](#f23))
  - [x] `/volunteer` - AISD Voly, interest form, activity sheets. Three Weebly links pointed at one wrong PDF ([F24](#f24))
  - [x] `/contact` - board roster, principal, address. **Individual emails are Cloudflare-obfuscated on Weebly and could not be read**, so everything routes through the PTA address until Jon supplies them. Roster privacy: [F22](#f22)
  - [x] `/calendar` - Google stays the source ([D10](#open-decisions)); the iframe is gone. Events are **baked at build time** from a committed snapshot, refreshed daily by a GitHub Action - see [F25](#f25) for why not live. 139 upcoming events, grouped by month, with "add to your calendar" for Google, Apple and Outlook
  - [x] `/gallery` - photo grid plus an Instagram link, per [D11](#open-decisions). **Thin on purpose**: nine photos, mostly the campus. It is a frame waiting for [A28](#phase-2---real-site)
  - [x] **Nav is fully internal.** Volunteer, Calendar, Little EAST, Sponsors and Contact all point at this site. "Join" is a Zeffy store link and stays external by design
- [~] **A21**: Cloudflare build watch paths - `JON` - **Blocked on U9.** Exact click path and the full exclude list are in [`docs/DEPLOYS.md`](docs/DEPLOYS.md), now also excluding `scripts/**` (the check gates are never read by `astro build`). Confirmed unset: PR #18 was docs-only and still triggered a build and a deploy
- [ ] **A22**: Switch `.com`/`.net` redirects from 302 → 301 - `JON` - **At cutover only.** They are deliberately temporary today; a 301 gets cached by browsers and intermediaries and is effectively unrecallable
- [~] **A23**: `/admin` editor behind Cloudflare Access - `CLAUDE` + `JON` - **Built. Access application and secrets configured 2026-09-02; awaiting the end-to-end test (U12).** Implements [D1](#open-decisions). Covers announcements, which is the content that actually changes week to week. A save is a git commit, so history is the audit log and `git revert` is undo. Cloudflare Access in front, and the Worker re-verifies the signed identity itself so the commit carries the editor's address. One-time PIN today, Google SSO when B4 lands - a dashboard swap, no code. Page copy and homepage YAML are still hand-edited; widening the editor is another route and another form, not a rewrite
- [x] **A24**: Photos on announcements, stored in R2 - `CLAUDE` + `JON` - **Built; blocked on U11 for the bucket.** Shrunk in the browser before upload, which removes the EXIF GPS coordinates a phone photo carries and takes a 2.8MB photo to about 410KB. Astro's image pipeline cannot help here - the file arrives long after the build - so whatever is uploaded is what parents download. Alt text is required in three places: the form, the API, and the content schema. Content-addressed keys served through the Worker, so no public bucket and no second hostname
- [x] **A25**: Announcements feed + RSS - `CLAUDE` - **Done.** One markdown file per post in `src/content/announcements/`, so two people cannot conflict and `/admin` can create or delete a post by writing one file. `/news` lists everything, `/rss.xml` is a real feed, and the homepage shows the most recent four. Ordering and draft filtering live in one shared function so the three surfaces cannot disagree - which matters most for the feed, where a leaked draft has already been pulled by the time anyone notices
- [ ] **A26**: File hosting - handbook, The Beat, forms - `CLAUDE` + `JON` - **Needs from Jon: the actual files.** Today these are tinyurls to Weebly-hosted or Drive-hosted documents ([F19](#f19))
- [ ] **A27**: Link-out hub for SignUpGenius and the calendar - `CLAUDE` - Aggregate and link out, per [D8](#open-decisions). Replacement is a later phase evaluated on its own
- [ ] **A28**: **Photo library** - `JON` - Only four real photographs exist ([F6](#findings)); the rest of the Weebly library is flyers and sponsor logos. **Needs 15-20 real photos** from Instagram and the board. This gates how good the page set can look more than any code does
- [x] **A30**: **Pre-launch gate** - `CLAUDE` + `JON` - **Live and verified 2026-09-01.** One shared password for the e-board, so anyone who wanders onto the domain early gets "under construction, here is our current site" rather than a half-built PTA site they take for real. A small Worker (`src/worker.ts`) in front of the static assets; cookie lasts 30 days. **The password is deliberately not in this repo** - the repo is public, so a committed password is no password. Not a security boundary and not meant to be: treat everything behind it as public
- [x] **A31**: **Split the documentation** - `CLAUDE` - The root `README.md` was a developer document sitting where a board member would look first, and it still described the repo as an empty scaffold with placeholder themes. It is now written for a non-technical reader: what the site is, how it works in plain terms, which file holds which words, and who to ask. Everything technical moved to `docs/`, split by concern, with an index at [`docs/README.md`](docs/README.md). Point of the exercise is bringing more people in - somebody arriving cold should not have to read about `run_worker_first` to find out what this is
- [ ] **A29**: **Cutover** - `JON` + `CLAUDE` - Retire Weebly, remove `noindex` in both places ([A6](#phase-0---accounts--scaffold)), flip A22 to 301, remove the pre-launch gate ([A30](#phase-2---real-site): delete `src/worker.ts` plus the three lines marked TEMPORARY in `wrangler.jsonc`), submit a sitemap. **Do not remove `noindex` before Weebly is actually retired** - two indexed copies of the same content is a ranking mess to unwind

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
| D10 | **What is the source of truth for events** | ✅ **Decided** 2026-09-01 | **Google Calendar stays the source, and the site stops embedding it.** Site reads the public iCal feed and renders its own list. Full reasoning below |
| D11 | **What `/gallery` is** | ✅ **Decided** 2026-09-01 | **Real photo grid, Instagram link beside it.** No Meta app, no 60-day token to refresh. Full reasoning below |
| D12 | **GitHub token never expires** | ✅ **Decided** 2026-09-02 | An expiring token fails months later, breaks `/admin`, and nobody remembers why - which restarts exactly the staleness [F18](#f18) describes. Exposure is narrow: Contents-write on one already-public repo, no personal data, every change revertible. Compensating control is documentation, not rotation: owner, scope and revocation steps are in [docs/ADMIN.md](docs/ADMIN.md). Owned by the PTA account, not a board member's |
| D9 | What happens to the losing designs | ✅ **Decided** | **Kept as reserves, not deleted.** They cost one CSS file each, still build, and still pass the contrast gate, so reversing the choice is a one-line change. `/preview` stays up as a labelled reference rather than a ballot. Retire them when the board stops wanting the option - the steps are at the top of `src/themes/registry.ts` |

### D10 in full - the calendar

The goal is one master list that everything else follows. The real question is *which* system holds it, and the answer should be **wherever the board will actually keep it updated**, because [F18](#f18) is the evidence for what happens otherwise: the Weebly site went stale because editing it was harder than not editing it.

| | Source of truth | What it costs | What it buys |
|---|---|---|---|
| **1. Google Calendar stays the source** ⭐ | Google Calendar | Nothing new. One feed URL in config | Board edits from the phone app they already have. Parents subscribe to the same calendar. Zero credentials, nothing to refresh, survives turnover |
| 2. Site is the source, pushes to Google | `/admin` → Google Calendar API | Service account, OAuth, domain-wide delegation, token refresh, reconciliation when the two drift | Very little that option 1 does not already give |
| 3. Site is the source, publishes its own feed | `/admin` → generated `.ics` | Depends on [A23](#phase-2---real-site) existing first. Volunteers lose the Google Calendar app for editing | Cleanest architecture. No third-party account in the loop at all |

**Recommended: option 1, and separately stop embedding the calendar in an iframe.** Those are two different things and the iframe is the actual current problem - it is unreadable on a phone, off-brand, and slow. Instead the site reads the calendar's public iCal feed and renders its own styled list, with an "add to your calendar" button pointing at the same feed. Same one master list; it just stops looking like someone else's widget.

Option 2 is the worst of the three: the most machinery, the most failure modes, and it makes the site a *second* place events live, which is precisely the drift risk you are trying to avoid.

**The Workspace migration does not block this.** A Google Calendar's ownership can be transferred, or the Workspace account can simply be added as an owner later. Either way the site holds one feed URL in one config value, and that value changes once.

Implementation note: the Worker added for the pre-launch gate ([A30](#phase-2---real-site)) is already the natural place to fetch and cache the feed, so the calendar stays current without waiting for a rebuild.

### D11 in full - the gallery

A wall of photos pulled live from Instagram is genuinely harder than it looks now:

- **Instagram Basic Display API** - the one that used to do exactly this - **was shut down in December 2024**.
- **Instagram Graph API** still works, but needs a Business or Creator account linked to a Facebook Page, a Meta developer app, and a long-lived token **that must be refreshed every 60 days**. A token that expires every two months, on an account that changes hands at board turnover, is a broken gallery waiting to happen - and it breaks silently.
- **Official embeds** only embed *individual posts*, not a profile feed.
- **Third-party widgets** (LightWidget, SnapWidget, EmbedSocial) work today on free tiers, but add a third-party script and tracker to every page load, and are a dependency that will eventually start charging or shut down.

**Recommended:** build `/gallery` as a real responsive photo grid fed from the repo now, and from R2 once [A24](#phase-2---real-site) lands, with a prominent "Follow us on Instagram" card next to it. It works forever, costs nothing, has no token to refresh, and does not leak visitors to Meta. Revisit a live feed once `/admin` exists - and if it is still wanted then, the Graph API route needs a Meta app that only Jon can create, so it is gated on him regardless.

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

<a name="f21"></a>
**F21 - Four of the Little EAST links on the current site are broken or mislabelled.** Found by actually following every one of them while lifting the copy, rather than assuming. (1) The 2023 auction link is written `tinyurl.com10thLittleEAST` - **no slash** - so it has never worked; the corrected URL resolves fine and is what the new page uses. (2) `tinyurl.com/11thLittleEAST`, labelled "2024 Silent Auction", actually goes to **a YouTube video**; relabelled. (3) `tinyurl.com/BlackshearLEPics`, labelled "photos", **downloads a Dropbox zip** rather than opening a gallery; the new page says so. (4) `biddingowl.com/blackshearlittleeast` (2022 auction) now redirects to BiddingOwl's own homepage - the auction is gone - so it is **dropped rather than carried over**. Shipping a link already known to be dead is worse than not shipping it. Reinforces [F19](#f19): opaque redirects nobody can audit without clicking.

<a name="f25"></a>
**F25 - The calendar is baked, not fetched, and the numbers are why.** The Google feed is ~300KB and carries every event back to 2020; parsing it costs about 8ms against a **10ms CPU ceiling per request** on the Cloudflare Workers free plan. Caching makes an overrun rare rather than impossible, and "the calendar occasionally 500s" is a bad failure for the page a parent checks on the way out of the door. So `scripts/refresh-events.mjs` parses it into `src/data/events.json`, a GitHub Action reruns that daily and commits any change, and the commit is what triggers the rebuild. The site stays fully static and the calendar has no runtime failure mode at all. **The unplanned benefit: calendar changes are now reviewable diffs** - "who moved the PTA meeting" is answerable from `git log`. Cost is up to a day of staleness, which is well inside tolerance for events scheduled weeks out, and `/calendar` prints the snapshot date so nobody has to guess.

<a name="f26"></a>
**F26 - All-day events render a day early if you format them in a timezone.** An all-day event is a square on a calendar, not an instant, so the parser stores it as midnight UTC - anchor it to a zone and it moves a day for anyone reading from a different one. But formatting *that* value in `America/Chicago` turns midnight UTC into 7pm the previous evening, and Labor Day on Sept 7 displays as Sept 6. Caught in review of the first build, where "School Holiday" showed Sun 6 against a feed that plainly said Monday the 7th. `/calendar` now keeps two sets of formatters and picks by `allDay`. Worth remembering because it is invisible in code review and only shows up if you check a rendered date against the source.

<a name="f24"></a>
**F24 - Three links on the volunteer page all point at the same PDF.** "Bike day", "GARDEN WORK DAYS" and "LITTLE EAST" every one resolves to Drive file `1QaYYK...`, which is `PTA Activity Sheets-Bike Day.pdf`. Only the first is right; the other two are a copy-paste that has been live long enough that nobody noticed. **There is no garden or Little EAST activity sheet** - they were never made, or were never linked. The new `/volunteer` page links Bike Day, Bake Sales and Staff Appreciation to their real files and points the other two at their committee pages instead, with a note saying no sheet exists yet. I had already copied this bug into `/campus-beautification` in the previous PR; corrected there too.

<a name="f22"></a>
**F22 - The Family Buzz sponsor tier lists children's first names with family surnames.** Fifteen entries in the form "June Flowers's Family". They are already public on Weebly and the families paid for the recognition, so the new `/sponsors` page reproduces them as-is - quietly dropping a donor tier would be the bigger error. **But this is a board decision worth making deliberately**, because at cutover ([A29](#phase-2---real-site)) the `noindex` comes off and this page becomes searchable, which the Weebly page may never have been. Options if it is a concern: surnames only, "The Flowers Family", or an opt-in at sponsorship time.

**The same question applies to `/contact`, more sharply.** The board roster carries each member's children by first name *and grade* - "Vice President: Laura Dablain (Gabby 2nd, Segolene 5th)" - which is a precise child-to-school-to-grade mapping for eight named children, and unlike the sponsors those families did not pay for the listing. It is conventional on PTA rosters and it is the current public state, so both pages reproduce it as-is. Of the two, this is the one worth reviewing first.

<a name="f23"></a>
**F23 - Two of the four committees have no page on the current site at all.** Staff Appreciation and Garden/Campus Beautification exist only as a homepage blurb and a Google Drive PDF linked from the volunteer page. Their new pages are built from those two sources and are **genuinely starting points, not lifted copy** - flagged inline in `src/content/pages.yaml`. Staff Appreciation also has **no chair** for 2026-2027, so there is currently nobody to write it.

**F3 - The root domain serves a GoDaddy parking page.** `server: DPS/2.0.0`, title is just the bare domain. Nothing is using it, so pointing it at a coming-soon page breaks nothing.

<a name="f4"></a>
**F4 - Account bootstrap is circular.** We want every account registered to `webmaster@blackshearpta.org`, but creating that address needs a Cloudflare account (or the Google config in F2). Resolution: create Cloudflare with `blackshearpta@gmail.com`, establish `webmaster@`, then change the Cloudflare account email. Cloudflare supports this with re-verification.

<a name="f5"></a>
**F5 - Transfer is locked, and possibly double-locked.** `clientTransferProhibited` is set (GoDaddy default - the owner must unlock). The domain's Updated Date is 2026-08-12; if that was a registrant contact change, ICANN's 60-day transfer lock runs until roughly 2026-10-11.

**F6 - The photo library is thin.** Fifteen unique images across all six Weebly pages, but almost all are event flyers, donor banners, and sponsor logos. Only four are actual photographs. The strongest by far is the E. 11th St. shot of the building with the mural and sponsor banners, and it contains no children's faces, so there's no release question. Getting 15-20 real photos from Instagram and the board is a parallel task.

**F7 - ~~No brand assets exist.~~** *Superseded by [F10](#f9)* - four logo files surfaced 2026-08-28. The mascot is the **yellow jacket** (named **Buzz**), not a honeybee, so no hive/honeycomb/honey motifs.

<a name="f25"></a>
**F25 - Three PRs reported MERGED without reaching `main`.** PRs #14, #15 and
#16 were part of a six-deep stack, each based on the branch below it. GitHub
retargets a stacked PR to `main` when its base merges, but that is not
instantaneous, and all six were merged inside about ten seconds. #13 landed on
`main` at 13:46:46; #14 merged into `pages/committee-pages` four seconds later,
a branch already absorbed into `main`. The same happened to #15 and #16.

**The dangerous part is that nothing looked wrong.** All six PRs reported
`MERGED`, `gh pr list --state open` was empty, and the Cloudflare build was
green. The work was simply absent from `main` and from the live site. Recovered
in [PR #17](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/17).

Two lessons, both about process rather than code. **Do not build deep PR
stacks** - two is the practical limit, and only when the PRs genuinely need
separate review; these should have been one or two PRs. And **PR status is not
proof that work landed**: verify with
`git merge-base --is-ancestor origin/<branch> origin/main`.

<a name="f26"></a>
**F26 - The gate page was served without the site-wide `noindex` header.** The
Worker built a fresh `Headers` for the gate response containing only
`Content-Type` and `Cache-Control`, which discarded everything `public/_headers`
adds: `X-Robots-Tag: noindex`, `X-Content-Type-Options`, `Referrer-Policy`.
Since every other route 302s to the gate, that page was the entire crawlable
surface of the site, running without the header meant to keep it out of Google.

Nothing was indexed - `BaseLayout` also emits `<meta name="robots">` and that
still worked - but the reason there are two mechanisms is that neither should be
load-bearing alone. Fixed by copying the asset response's headers and overriding
only `Cache-Control`.

Worth remembering **how** it was found: by diffing the gate page's response
headers against a passthrough `/_astro` asset's on the deployed site. It was
invisible to `astro dev` and `astro preview`, which never run the Worker at all.
Anything the Worker touches has to be checked on `:8787` or in production.

<a name="f27"></a>
**F27 - Real-user monitoring caught a layout shift no local check could.**
Cloudflare Web Analytics reported LCP and INP fully green with **CLS in the
red**. Cause: all 14 `@font-face` blocks are `font-display: swap` and nothing
was preloaded, so a first-time visitor gets the fallback face painted first and
a reflow when the webfont lands - on the largest slab display type on the page.

The blanket "never preload" was a deliberate, *correct* decision when `/preview`
was the landing page holding every theme at once: preloading there fetches six
faces to show two. It silently stopped being correct when `/` became a
single-theme page, and nothing flagged the change. **Decisions can expire
without anything failing.**

Fixed by preloading per theme: real pages preload their two faces, `/preview`
still preloads nothing. Guarded by a new `npm run check:fonts`.

Worth noting **why local testing could not find this**: any browser that has
already visited the site has the fonts cached, which is precisely the condition
where the shift does not occur. Only first-time visitors see it, and only RUM
sees them. Verification of the fix has to come from the same place - watch CLS
in Web Analytics over the next few days rather than trusting a local number.

<a name="f28"></a>
**F28 - The pre-launch password was committed to the public repo, by me,
in the note describing how to clean up a different mistake with it.** Commit
`9ac7e9c` (PR #18) recorded that a stray Cloudflare secret had been created
whose *name* was the password value, and named it inline. `src/worker.ts`,
`README.md` and `docs/PRE-LAUNCH-GATE.md` all state that the password must never
be in this repo because the repo is public. It went in anyway, in a task-board
row, because a value used as an identifier did not read like a secret.

**Redacting the file does not fix it** - the value is in the pushed history and
this repo is public. The fix is rotation (U10), not a history rewrite: rewriting
public history is disruptive and the gate was explicitly never a security
boundary, so the cost of a new word is one command and one message to the board.

Two things worth carrying forward. A secret pasted into the wrong field becomes
an identifier, and identifiers get quoted in documentation without a second
thought - so the cleanup instructions for a leaked credential are themselves a
leak risk. And a rule enforced only by prose gets broken; `scripts/check-secrets.mjs`
now greps the tree for known secret shapes so the next one fails a gate instead
of a code review.

<a name="f29"></a>
**F29 - A missing R2 bucket fails the entire build, not just the feature.**
Declaring an `r2_buckets` binding in `wrangler.jsonc` for a bucket that does not
exist yet makes Cloudflare reject the Worker version outright. The build for
[PR #22](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/22) went
red for exactly this reason.

This is a different failure shape from the missing Worker secrets, and the
difference matters. A missing secret fails *closed* - the feature reports that it
is not configured and the rest of the site is untouched. A missing bucket fails
*hard* - nothing deploys. Resource bindings have to be created **before** the
code that declares them ships, so the ordering is: create the bucket, then merge.

The binding stays in `wrangler.jsonc` rather than being added via the dashboard,
because `wrangler deploy` replaces a Worker's bindings with whatever the config
declares - a dashboard-only binding would be wiped by the next deploy without
anyone touching it.

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
