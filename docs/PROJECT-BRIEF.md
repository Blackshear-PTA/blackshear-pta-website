# Blackshear PTA Website - Architecture & Decisions

**Status:** Planning. Implementation not started.
**Companion doc:** [`TASKS.md`](../TASKS.md) holds current status and the task board. This document holds architecture and the reasoning behind locked decisions - it changes rarely. If the two disagree, `TASKS.md` is current.

---

## 1. Context

Blackshear Elementary Fine Arts Academy PTA (Austin ISD, East Austin) has a dated Weebly site and no organizational email. Accounts are owned by personal Gmail accounts; the domain sits in a board member's personal GoDaddy account. Rebuild is being done by a technically capable volunteer parent.

Two tracks run in parallel and are **decoupled on purpose**:

- **Track A - Website rebuild** on `blackshearpta.org`. Weebly stays live until cutover.
- **Track B - Google Workspace for Nonprofits.** Gated by third-party validation. Slow. Does not need a finished site.

---

## 2. Constraints (non-negotiable)

| Constraint | Implication |
|---|---|
| Effectively zero budget | Free tiers only. Flag anything that could incur cost *before* implementing. |
| Must survive annual board turnover | Optimize for "the next volunteer," not for elegance. A clever solution one person understands is a failure. |
| Ownership transfers without migration | Every account registered to an org-domain address, never a personal one. |
| Mobile-first, genuinely | Most parents will only ever use a phone. |
| Easy to use, easy to find things | Navigation and findability outrank visual ambition. |
| No lock-in | Leaving should never be expensive. |

**On working style:** Jon is comfortable building custom tooling in Claude Code rather than paying for commercial products, and prefers that where it buys real capability. That is a legitimate option for the site, the admin UI, and app features. It is *not* the right call for auth primitives or credential storage; see §6.

---

## 3. Locked decisions

### 3.1 Astro
Static by default, markdown/YAML content collections, per-route opt-in to SSR. Made the multi-theme demo nearly free architecturally.

### 3.2 Cloudflare Workers with static assets, not Pages
Workers reached parity with Pages for static assets, SSR, and custom domains. Durable Objects, Workflows, and Secrets Store remain Workers-only, and planned Phase 3 features depend on Durable Objects. Starting on Pages would mean a later migration with a domain switchover and downtime.

**One Worker. One repo. One deployment.** Do not split frontend and backend.

### 3.3 Tailwind v4 - with the default theme fully overridden
CSS-first `@theme` is close to ideal for token-driven multi-theming, and it's the most googleable choice for the next volunteer. But Tailwind-with-defaults is the single largest contributor to the generic-AI look. **The default palette, type scale, and radii get replaced wholesale. We never ship a `blue-500`.**

### 3.4 No component library in Phase 1
shadcn, DaisyUI, and friends actively work against visual differentiation - that's their purpose. A marketing homepage needs almost no components. Headless primitives come later for functional needs (dialogs, forms), not now.

### 3.5 GitHub Organization, not a personal repo
Free, unlimited private repos and collaborators. Ownership transfer becomes a membership change rather than a repo migration.

### 3.6 Register everything to an org-domain address from day one
Sign up for every service as `webmaster@blackshearpta.org`. When Workspace lands it becomes a real mailbox and nothing needs transferring. See [F4 in `TASKS.md`](../TASKS.md#f4) for the bootstrap ordering, which is circular and has to be done in a specific sequence.

### 3.7 Sessions go in D1, not KV
Cloudflare KV's free tier allows roughly **1,000 writes/day**. Session writes will blow through that. Astro's session API auto-wires to KV on Cloudflare, so this default must be **deliberately overridden**.

### 3.8 Content editing: markdown in git, admin UI behind Cloudflare Access
*See D1 in `TASKS.md` - recommended, awaiting Jon's confirmation.*

Every git-based CMS (Sveltia, Pages CMS, Decap) authenticates the editor against the git host. There is no Google SSO path - the old Netlify Identity + Git Gateway escape hatch is deprecated and Sveltia deliberately doesn't support it. Requiring PTA volunteers to create GitHub accounts fails the maintainability constraint.

Instead: content stays as markdown in git, and `/admin` sits behind **Cloudflare Access with Google as the identity provider**, committing through a single GitHub App token in Workers Secrets. Editors never see GitHub.

This does not violate §6's "don't build auth" guardrail - Access does identity; our code validates the JWT Access injects and writes a file. No password hashing, no session minting, no reset flow.

Access works with plain Gmail today and switches to Workspace SSO with a config change. It's free to 50 users, and this is exactly the internal-team use case Access is built for.

**The failure mode is benign, which is the real argument:** content is plain markdown in a git repo. If the admin UI rots because nobody maintains it, the fallback is "edit the file on github.com", not "the content is trapped."

---

## 4. Target architecture

```
GoDaddy (registrar - transfer to Cloudflare deferred to October)
  └─ DNS → Cloudflare
       ├─ Email → webmaster@blackshearpta.org
       │    (mechanism TBD; see TASKS.md C7 / F2)
       ├─ Access (Zero Trust, Google IdP) → /admin only
       └─ Worker  ← deployed from GitHub Org repo
            ├─ static assets (Astro build → ./dist)
            ├─ /api/*  (SSR routes, prerender = false)
            ├─ D1      (relational data + sessions)
            ├─ R2      (uploads/photos, Phase 2+)
            └─ Durable Objects (realtime, Phase 3 only)
```

### Free tier headroom
Workers ~100K req/day · D1 ~5M row reads and ~100K row writes/day, 5 GB · R2 10 GB, no egress charges · KV ~100K reads but **~1,000 writes/day** ← the tight one · Durable Objects available free on the SQLite backend, with WebSocket hibernation so idle rooms don't accrue duration.

For a school of a few hundred families, nothing here except the KV write limit is a realistic ceiling. *(Cloudflare adjusts these - re-verify before relying on any of it.)*

---

## 5. Design direction

### 5.1 The problem
The brief this replaces specified "six Astro layouts" - mechanics, not design. The actual requirement is six themes that don't read as AI-generated.

The generic-AI look is a specific, identifiable vocabulary: Inter everywhere, violet-to-blue gradients, `rounded-xl` cards with soft shadows, evenly-spaced three-column feature grids, Lucide icons, gradient text, centered hero with two buttons. Any theme landing in that vocabulary is dead on arrival regardless of palette.

The escape is **anchoring each theme to a real design tradition** with committed typographic and structural choices: distinctive self-hosted typefaces, color derived from a real reference, and variation in *structure* - nav treatment, hero composition, section rhythm, grid asymmetry, not just skin.

Two additional levers matter more than craft:
- **Real photography of the actual school.** Nothing else signals "real" as efficiently. Currently our weakest asset ([F6](../TASKS.md)).
- **A palette derived from the actual building.** The E. 11th St. photo - warm buff brick, deep blue mural, that streetscape - is a palette nobody else can have.

### 5.2 Brand facts
Mascot is the **yellow jacket**: *not* a honeybee. No hive, honeycomb, or honey motifs; that's the wrong insect and the wrong visual language. Yellow jacket reads sharper: hard black-and-gold banding, angular geometry.

Working palette from the Field Day flyer: jacket gold, black, a strong mid-blue, grass green. The blue is a real differentiator - most yellow-jacket schools go black-and-gold only.

No logo files exist anywhere. We make a wordmark and a restrained mascot mark in Phase 1; it anchors every theme and gets reused on flyers, shirts, and Instagram for years.

### 5.3 The directions

**Decided 2026-08-31: Civic Letterpress A.**

The board saw all six and cut to two on a first pass, **Civic Letterpress** and
**East Austin Print Shop**. Civic then split into A (black masthead) and B (blue
masthead, plus the school video between the quote and the intro line) so the two
open questions could be judged against an otherwise identical page. **A won**, and
is what `/` now serves.

The other four directions are deleted from the tip but remain in git history. The
table below keeps all six, because the reasoning for the rejected four is what
makes the survivors legible as choices rather than defaults.

**B and East Austin Print Shop are held in reserve, not deleted.** They cost one
CSS file each, still build, and still pass the contrast gate, so reversing the
decision is a one-line change rather than a rebuild. `/preview` stays up as a
labelled reference. Retirement steps are documented at the top of
`src/themes/registry.ts`.

| | Direction | Anchor |
|---|---|---|
| A | **Civic Letterpress** ✅ **chosen (variant A)** | WPA/municipal print. Condensed slab display, thick rules, flat two-ink, zero shadows or rounded corners. |
| B | ~~**Warm Editorial**~~ | Local-nonprofit annual report. Serif display + humanist sans, asymmetric grid, big photos, pull quotes. |
| C | ~~**Schoolyard Bold**~~ | Modern summer-camp brand. Wide geometric sans, saturated flat blocks, badge shapes, thick borders. Energetic, not childish. |
| D | **East Austin Print Shop** 🔒 *reserve* | Screenprint. Muted earth + one hot accent, paper texture, hand-drawn rules. Leans on the 135-year history. |
| E | ~~**Quiet Utility**~~ | The anti-decoration option. Neutral grotesk, hairline borders, tight palette, ruthlessly optimized for "find the thing on a phone." |
| F | ~~**Jacket**~~ | Hard black-and-gold banding, angular geometry, mascot-forward with restraint. |

*The A-F letters above label the six original directions and are unrelated to the
A/B split of Civic Letterpress. Direction A is Civic Letterpress; its chosen
variant is also called A. Confusing, but both names are already in circulation
with the board.*

Non-negotiable across every theme: WCAG AA contrast, real focus states, keyboard navigation, mobile-first. **A theme that can't clear AA gets cut regardless of how good it looks**: this is a public-serving org attached to a school district.

### 5.4 Theme mechanics

**Content lives in exactly one place.** Home page copy goes in a single YAML file. Themes are consumers.

```
src/content/home.yaml          ← all copy, once
src/themes/registry.ts         ← theme = { name, tokens, fonts, structure }
src/themes/*.css               ← token block per theme: fonts, color, radius,
                                 border-width, shadow, spacing scale, density
src/layouts/structures/        ← one per genuinely different arrangement
src/components/sections/       ← Hero, QuickActions, News, GetInvolved,
                                 Committees, Footer - content in, tokens out
```

Each theme declares both a token set *and* a structure, so a token-only recolor can't happen by accident.

The switcher renders every theme into one `/preview` route and toggles visibility client-side. A couple of copies of a homepage is a trivial payload, and making the switch **instant** is what gets someone to actually compare them rather than bailing after the first.

Why this shape: no copy drift across variants, another theme is cheap, and when a winner is picked you delete the loser's files and you're done. The cut from six to two was four file deletions plus their registry entries.

Two exports carry the outcome, deliberately kept apart. `siteThemeId` is what every real page renders in; `defaultThemeId` is only which panel `/preview` opens on. They name the same theme today, but separating them means someone can point the preview at a reserve for a second opinion without silently re-skinning the live homepage.

---

## 6. Guardrails

**Do not build session/token/auth logic from scratch.** The build-it-yourself instinct is right for the site, the admin UI, and the bulletin board. It is wrong here: a subtle bug in auth is a breach, not a bug. Use a proven library over D1.

**Do not self-host a password vault.** A credential store for a volunteer org with annual turnover must not depend on one parent's side project. A stale website is an inconvenience; an unreachable vault is an emergency.

**Do not use Cloudflare Access for member accounts.** Right for `/admin` and internal team access. Wrong for Phase 3 members - capped ~50 free, and every member becomes a Zero Trust config entry rather than a database row.

**Do not put sessions in KV.** See §3.7.

**Do not let editorial and user-generated content blur.** Editorial (mission, board roster, event descriptions) → markdown. User-generated → D1. Decide which bucket anything new falls into.

**Do not enable Cloudflare Email Routing before resolving [F2](../TASKS.md#f2).** It overwrites MX records, and there is already Google mail configured on the domain.

**Flag scope creep on messaging.** An announcement board and a parent-to-parent messaging system are not the same size of problem. The latter means storing family contact information and private message content for a school community - moderation duty, retention policy, and a real conversation with school administration about liability. Build the foundation so it stays *possible*; that's nearly free given this stack. But messaging is its own decision with the board and the school in the room, not something that arrives by default because the infrastructure allowed it.

---

## 7. Facts with expiration dates

Re-verify against live documentation before relying on any of these:

- [ ] Cloudflare Workers static-assets deployment path and current Astro adapter guidance
- [ ] All free tier limits in §4
- [ ] Durable Objects free-plan availability and storage backend requirements
- [ ] Cloudflare Access free user cap
- [ ] Current Google for Nonprofits validation partner and timeline - gates all of Track B
- [ ] Whether Cloudflare Email Routing and Google MX can coexist during transition, or require a hard swap
