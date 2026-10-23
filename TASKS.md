# Blackshear PTA Website - Task Board

**Last updated:** 2026-10-22 (both Gmails' Drive files copied in, checked and tidied, B18, B26 and B30; Takeout for both Gmails' Drives and what an export holds, B18 and F59; PTA Vault members, B33; Shared Drives created and themed, B15, B35, B18 and F58; an Inbox on the task board for quick ideas; Little EAST page prioritized, U21; announcements catch-up, A46; Ms. Bell and the campus website, A47; member manager, A45 and D18)
**Owner legend:** `JON` = needs Jon's account access / a human decision · `CLAUDE` = Claude Code can do it · `BOARD` = needs another board member
**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked
**Browsable view:** `npm run tasks:board` renders this file as a filterable page at `.task-board/index.html`, with a *Board meeting* tab drawn from [`docs/BOARD-AGENDA.md`](docs/BOARD-AGENDA.md), which is replaced before each meeting (the old one moves to [`docs/archive/`](docs/archive/), shown as the *Archive* tab), and a *Systems & accounts* tab drawn from [`docs/ACCOUNTS.md`](docs/ACCOUNTS.md), which is kept current as access changes. Keep the conventions below (`- [ ] **ID**: title - OWNER - detail`, the U and D tables, `**F<n> - headline.**`); the page parses them, and leaves out anything it does not recognize. **Write a task's steps as indented lines under it**, a numbered checklist (`  1. [ ] step`, `  2. [x] done step`) with notes as indented bullets, and keep the task line itself to a sentence or two. The page shows them under the task's *Details*, with ✅ and ⬜ marks.
**Inbox:** the published board has an *Inbox* at the top for jotting down a task idea without opening a session. Ideas are kept in the published page's own storage, not in this file. When asked to triage, `CLAUDE` files each one here as a task (or a step of an existing one), or says why not, and the Inbox then shows what each idea became.

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
| U14 | ~~Print the calendar on real paper~~ | JON | ✅ **Printed 2026-10-05 and looks right.** October 2026 on one landscape letter sheet, with the site's header, the month grid and the events legible. The date, title, URL and page number in the margins come from the *browser's* "Headers and footers" print option, not the site; untick it in the print dialog for a cleaner sheet |
| U15 | ~~Find the Workspace admin login~~ | JON | ✅ **Found and signed in 2026-09-30.** The PTA Gmail holds the original 2020 G Suite signup mail. The admin named there no longer exists, but another role account from that tenant does, and Jon got into it. It is not named here because this repo is public. **The console loads but every card errors** - see [B10](#google-workspace-for-nonprofits) and [F53](#f53) |
| U16 | ~~Cancel the Business Standard trial started 2026-09-30~~ | JON | ✅ **Cancelled 2026-09-30**, before any charge. ✅ **Card removed 2026-10-01.** No payment methods or subscriptions remain on the PTA Gmail ([F47](#f47), [F53](#f53)) |
| U17 | **Finish setting up Workspace and the service logins** | JON | In progress. Left: board sign-ins ([B29](#google-workspace-for-nonprofits)) |
| U18 | ~~Give the break-glass admin a second factor that can be handed over~~ | JON | ✅ **Done 2026-10-05:** 2-Step Verification is on, and the authenticator setup key and backup codes are stored with the password, well ahead of Google's 30-day cutoff ([B22](#google-workspace-for-nonprofits), [F54](#f54)) |
| U19 | ~~Delete the suspended `jon@` account - on or after 2026-10-19~~ | JON | ✅ Deleted 2026-10-22 (Jon). Suspended 2026-10-05 and nothing broke. Delete it with a data transfer to `communications@`; the steps are [B24](#google-workspace-for-nonprofits)'s step 7. ✅ It owns no secondary calendars (checked 2026-10-06) |
| U20 | **Registrar transfer: Gabe runs it himself, on or after 2026-10-12** | JON + Gabe | Waiting on Gabe: the registry still showed GoDaddy on 2026-10-15. Jon's setup ✅ done 2026-10-06. Steps in [C9](#track-c---domain-dns-email) |
| U21 | **Update the Little EAST page** | JON + board | Prioritized by Jon 2026-10-21. Waiting on the Little EAST chair's copy in the fill-in doc; once it is in, `CLAUDE` turns it into one PR. Steps in [A40](#phase-0---accounts--scaffold). Meanwhile the whole site points at the old one, `/little-east` included ([A48](#phase-2---real-site)) |
| U22 | ~~blackshearpta.org sends visitors to the old Weebly site, for now~~ | JON | ✅ Live 2026-10-22, before that evening's event: [PR #57](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/57) merged, and `CLAUDE` checked every page with a request. Decided by the exec board 2026-10-22. Switching back is A48 step 4. The new site stays up for review at its workers.dev address. Steps in [A48](#phase-2---real-site) |
| U12 | ~~Test `/admin` end to end~~ | JON | ✅ Proven 2026-09-03. A post written in the editor, with three photos and a chosen cover, committed to `main` and rendered on the site. I cannot do this - Access blocks me, which is the point |

| U13 | ~~Enable One-time PIN as an identity provider~~ | JON | ✅ Done 2026-09-02. The PIN screen appears, and an address outside the policy correctly gets no code ([F31](#f31)) |

**Now that a design is chosen**, `/` serves the real Civic Letterpress A homepage. `/preview` stays up as a reference and still shows all three, labeled so a reserve is not mistaken for a live option.

*Going forward, code changes land via branch → PR rather than direct pushes to `main`.*

---

## Track C - Domain, DNS, Email

*Runs first; several Track A items depend on it.*

- [x] **C1**: ~~Renew the domain at GoDaddy~~ - **Gabe** - Handled (U2). Escalated from "confirm auto-renew" to "renew it now" after the transfer was rejected, because Jon's *Domains Only* access cannot see or act on billing. **Worth re-confirming at the registry before the transfer, on or after 2026-10-12** ([C9](#track-c---domain-dns-email)): `npm run check:domain`
- [x] **C2**: Determine what's behind the existing Google MX records - `JON` - Gabe started a Workspace/Nonprofits signup ~1 year ago on blackshearpta.org and abandoned it. Domain is already Google-verified. See [F8](#f8)
- [x] **C3**: Confirm GoDaddy delegate access level - `JON` - **"Domains Only"** on Gabe Hernandez's account. Sufficient for nameservers/DNS. *Not* sufficient for billing (C1) or product subscriptions
- [x] **C4**: Create Cloudflare account - `JON` - Created 2026-08-28. ⚠️ Confirm it was created as `blackshearpta@gmail.com`, not a personal address
- [x] **C5**: Add `blackshearpta.org` to Cloudflare, review imported DNS - `JON` - Free plan. All 13 records imported and verified against [Appendix A](#appendix-a--dns-snapshot-2026-08-28): 5 MX, SPF, `google-site-verification`, `_dmarc`, 2 A, 3 CNAME. Nothing lost
- [x] **C6**: Change nameservers at GoDaddy to Cloudflare - `JON` - `elias` + `sandra.ns.cloudflare.com`. Zone active, registry delegation confirmed, records verified live. DNSSEC was already unsigned so no disable step was needed
- [x] **C7**: Decide: Cloudflare Email Routing vs. Google mail - `JON` + `CLAUDE` - **✅ Google mail**, settled by the Workspace activation on 2026-09-30 ([F53](#f53)). **Never enable Cloudflare Email Routing on this zone**: it overwrites the MX records and would cut off every Workspace mailbox. The standing advice still holds too: do not "clean up" the Google MX or `google-site-verification` records ([F42](#f42))
- [x] **C8**: Establish `webmaster@blackshearpta.org` - `JON` - **✅ Created 2026-10-02** as a Google Group, per [D14](#open-decisions). The steps to finish it are in [B5](#google-workspace-for-nonprofits). **Renamed `admin-notifications@` on 2026-10-22**, with `webmaster@` kept as an alias ([B5](#google-workspace-for-nonprofits))
- [~] **C9**: Registrar transfer GoDaddy → Cloudflare - `JON` + **Gabe** - Move `blackshearpta.org`'s registration out of Gabe's personal GoDaddy account and into the PTA's Cloudflare account. Gabe runs it himself (his choice, 2026-10-06). Nothing changes for the website or email, because DNS already runs on Cloudflare.

  - **Status, 2026-10-23** (`npm run check:domain`): Jon's setup is done. The registry still shows GoDaddy, so the transfer has not started.
  - **The invitation to `secretary@` is gone** (members list, 2026-10-23): no invitation is pending, so send it again (step 1) before Gabe starts.
  - **Background:** the first attempt, on 2026-08-28, was rejected by GoDaddy within minutes. The likeliest cause was the 60-day lock after an August registrant change, which ran to 2026-10-11 ([F15](#f15)).

  **Jon's setup**

  1. [x] Invite `secretary@` to Cloudflare as **Super Administrator - All Privileges** (Manage Account → Members → Invite), 2026-10-06. A transfer is a purchase, and the narrower Administrator role cannot touch billing.
  2. [x] Check the card on file (Billing → Payment info). It is Jon's own; he will donate the fee or be reimbursed.
  3. [x] Email Gabe the steps below, 2026-10-06.

  **Gabe's steps, on or after 2026-10-12**

  4. [ ] Accept the Cloudflare invitation sent to `secretary@`, which creates a Cloudflare login with that address, and **turn on two-factor**.
  5. [ ] **Change nothing** on the domain's registrant name, organization or email at GoDaddy; any change restarts a 60-day lock. If GoDaddy's email from about 2026-08-28 explaining the first rejection is in his inbox, read it first.
  6. [ ] At GoDaddy, in the domain's settings: turn the **transfer lock off** and get the **authorization (transfer) code**. DNSSEC must be off, as it was in August. If Domain Protection is on, turning it off may need his GoDaddy verification.
  7. [ ] In Cloudflare: the *Blackshear PTA* account → **Domain Registration → Transfer Domains** → `blackshearpta.org` → enter the code.
  8. [ ] Registrant contact: organization *Blackshear Elementary PTA*, address 1712 E. 11th St., Austin, TX 78702, and the **central IT address** as the email, so registrar notices reach the PTA rather than a person. Cloudflare hides this from public WHOIS.
  9. [ ] Confirm the charge: one year added at cost, about $11.
  10. [ ] GoDaddy then emails him about the transfer. **Approve it** to finish sooner; never cancel. Left alone it completes within about 5 days.
  11. [ ] When Cloudflare shows the domain as registered, turn **auto-renew on** and tell Jon.

  **Afterwards**

  12. [ ] `CLAUDE` confirms with `npm run check:domain` that the registrar reads Cloudflare.
  13. [ ] Jon scales back or removes `secretary@`'s Cloudflare role, and checks that the $11.20 from the August attempt was refunded.

---

## Track B - Nonprofit program enrollments

*Google and GitHub both gate on the same 501(c)(3) proof. Longest pole; independent of the website. Do not let either block Track A.*

### Google Workspace for Nonprofits

**Rollout order - the running checklist. Update it as each step lands.** Details are in the tasks below.

| # | Step | State |
|---|---|---|
| 1 | Get admin access to the tenant (B10) | ✅ 2026-09-30 |
| 2 | Mail DNS: SPF, DKIM, DMARC (B12) | ✅ 2026-10-01 |
| 3 | Console baseline: 2-Step Verification, recovery, billing, contacts (B11) | ✅ 2026-10-02 |
| 4 | Break-glass super admin (B16) with a second factor that can be handed over (B22); Secretary account settled (B17) | ✅ 2026-10-05 |
| 5 | Second Google for Nonprofits admin (B13) | ✅ 2026-10-01 |
| 6 | Org-wide settings before the first new account: 2-Step Verification enforcement, password policy, self-service recovery, Drive sharing (B21) | ✅ 2026-10-05 |
| 7 | Account model (D14) → board accounts and shared addresses (B14, B5) | ✅ 2026-10-05 · eight accounts created; first sign-ins are B29 |
| 8 | Google sign-in for `/admin` (B6) | ✅ 2026-10-15 |
| 9 | `hello@` replaces the PTA Gmail as the central inbox and the site's public address (B25, A34), plus automated mail check (A35) | ✅ 2026-10-05: live, on the site, delegated (acceptances pending in B29) · A35 ✅ 2026-10-15 |
| 10 | Shared Drives, then document migration (B15, B35, B18) | ◐ both drives created 2026-10-21 ✅ (B15) · themes applied 2026-10-21 ✅ (B35) · migration ◐ both Gmails' files copied in, checked and tidied 2026-10-22 ✅; sorting into folders ⏳ (B18) |
| 11 | **Data migration:** everything from both Gmails, plus running the Blackshear Parents calendar from Workspace (B30, B26, B27) | ◐ decided by the exec board 2026-10-06 ✅ · PTA Gmail mail and contacts into `hello@` ✅ 2026-10-16 · Fundraising Gmail mail ✅ 2026-10-23 (B26) · Drive ✅ 2026-10-22, copied in, checked and tidied · calendar ✅ stays with the PTA Gmail, run from Workspace (Jon, 2026-10-06, after Google refused the transfer) |
| 12 | Organization logo in Gmail, Drive and Calendar (B20) | ✅ uploaded 2026-09-30; Google takes up to 4 days to show it |
| 13 | Move service logins off the PTA Gmail, with a second admin on each: Cloudflare, GitHub, and anything else found (A36, A37, A38) | ◐ Cloudflare ✅ role-account admins, renamed · GitHub ✅ role-account owners · Cloudflare's deploy token on the admin account ✅ 2026-10-22 · two-factor: Cloudflare ✅, GitHub ✅ 2026-10-22, required org-wide on GitHub ✅ 2026-10-23 · sweep ⏳ |
| 14 | Board onboarding: the eight new accounts signed in and enrolled in 2-Step Verification (B29) | ⏳ in progress |
| 15 | Members' mailing list `members@` ("Blackshear PTA Members"): an announcement-only group of outside members (B28) | ✅ 2026-10-05 · 83 members |
| 16 | Password manager for the central logins: KeePassXC, one file in the *PTA Vault* Shared Drive (D2, B33) | ✅ 2026-10-23 · in use: one file in *PTA Vault*, the PTA's logins moved out of 1Password, the officers set up |

- [x] **B1**: Initial Google for Nonprofits request submitted - `JON` - Submitted 2026-08-28
- [x] **B2**: Complete nonprofit validation - `JON` - Partner is **Goodstack** (We Are Percent Ltd), *not* TechSoup. Rep approval ✅ and identity verification ✅ both cleared 2026-08-28. Complete by implication: the B4 approval could not have happened without it. See [F12](#f12)
- [x] **B3**: Reconcile with whatever already exists on the domain - `JON` - **Resolved by upgrading the existing tenant rather than replacing it.** The [F8](#f8) conflict fired as *"This domain name is already in use"*, but that is an artifact of answering *No* to "do you currently use Google Workspace?" - answering **Yes** yields *"Your domain is eligible for an upgrade ... at no charge"* with an **Activate** button ([F46](#f46)). The approval landed on the tenant that already held the domain, which dates from at least 2020 ([F53](#f53)). Its admin login is unknown - see B10
- [x] **B4**: Activate Workspace for Nonprofits on `blackshearpta.org` - `JON` - **✅ Approved 2026-09-25**, one day after the re-submission. Google: *"The domain blackshearpta.org has now been successfully upgraded to Google Workspace for Nonprofits"*, and the GfN console shows **Status: Approved**. *Upgraded* is the operative word: the benefit went onto the tenant that already held the domain, not a new one ([F53](#f53)). The re-submission was made after the site went live ([A33](#phase-2---real-site)) and every claim in it was checkable on the deployed site: the group-exemption reason for the "Pta Texas Congress" name, EIN `91-2015074` listed as "612 Blackshear Elementary PTA", and the homepage's *About our organization* section. The first attempt was rejected 2026-09-15 ([F48](#f48))
- [x] **B10**: Get super-admin on the upgraded tenant - `JON` - **✅ Done 2026-09-30.** Jon signed in with a role account from the 2020 G Suite signup, recovered through the PTA Gmail. He created `jon@blackshearpta.org` and made it a super admin. The **Workspace for Nonprofits** subscription shows in the console. The *"Data can't be fetched due to system error"* cards on first sign-in cleared on a refresh, so they were transient and not account state ([F53](#f53))
- [x] **B11**: Admin console baseline checks - `JON` - **✅ All done 2026-10-02.** Super admins reviewed, 2-Step Verification on `jon@`, billing free on Workspace for Nonprofits with nothing left from 2020, domains and *Email setup status* complete, alternate contact email set, and a test message sent. Kept for the next board as the checklist to re-run after any admin handover: super admin list; recovery info on each admin; billing and payment accounts; the alternate contact email (the 2021 deletion warning only reached anyone because that address was on file); domains; one test message both ways
- [x] **B12**: Mail authentication DNS - `JON` (Cloudflare dashboard) + `CLAUDE` (verify, then record) - **✅ Done 2026-10-01.** SPF: `v=spf1 include:_spf.google.com ~all`, which closes [F43](#f43). DKIM: the 2048-bit `google._domainkey` key, authenticating. DMARC: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc@blackshearpta.org`, with reports going to a `dmarc@` Google Group that accepts outside senders. `CLAUDE` checked all three on 1.1.1.1 and 8.8.8.8 and found exactly one SPF record. The Admin console's *Email setup status* agrees. `terraform/dns-blackshearpta-org.tf` matches. No `_report._dmarc` authorization record is needed, because the report address is on the same domain. The only check left is the test-message header read in B11
- [x] **B13**: Add `jon@blackshearpta.org` as a second Google for Nonprofits administrator - `JON` - **✅ Done 2026-10-01**, so the nonprofit account no longer hangs on the PTA Gmail alone. **Updated 2026-10-05:** the administrators are now role accounts, `communications@` and the break-glass account (primary). `jon@` is being retired ([B24](#google-workspace-for-nonprofits)). [F45](#f45) (who the removed original owners were) is still open at low priority, and is most likely Gabe ([F53](#f53))
- [x] **B14**: Create the board's accounts and addresses per [D14](#open-decisions) - `JON` + `CLAUDE` - **✅ Done 2026-10-05.** All eight accounts were created by bulk upload: president, vp, treasurer, fundraising, roomparents, garden, staffappreciation and `hello@`. With the existing `secretary@`, `communications@`, `jon@` and the break-glass account, the tenant has **12 users**. Each new account has its holder's name, role title and recovery email, and must change its password at first sign-in. `parliamentarian@` is still to be created on appointment, and the Little EAST chair's address became `littleeast@` ([B31](#google-workspace-for-nonprofits)). **Delete the upload CSV** from Downloads if not done; it holds the temporary passwords. Getting everyone signed in is [B29](#google-workspace-for-nonprofits). Still open, not blocking: "Bree" or "Breanna" on the room-parents account, and a personal recovery address for the President
- [ ] **B29**: Get the new accounts signed in and enrolled in 2-Step Verification - `JON` + board - Each board member signs in to their PTA account for the first time and turns on 2-Step Verification before Google's enrollment window closes. Track it in Admin console → Directory → Users, where *Last sign in* reads "Hasn't signed in" until they do.

  - **Status, 2026-10-16** (Admin console → Users): signed in are `president@`, `vp@`, `secretary@`, `treasurer@`, `fundraising@`, `garden@` and `hello@`. Not yet signed in: `roomparents@`, `staffappreciation@` and `littleeast@`. Whether each has enrolled in 2-Step Verification shows under Security → 2-Step Verification, not on that page.

  1. [ ] Give each person their address and temporary password **by text or in person, never by email**.
  2. [ ] Each signs in at mail.google.com, sets a new password and **enrolls in 2-Step Verification**, or is locked out when the window closes.
  3. [ ] `president@`, `vp@` and `fundraising@` accept their invitation to `hello@` ([B25](#google-workspace-for-nonprofits)). It arrives in their new inbox and expires after a week; re-send it if it lapsed.
  4. [ ] Once signed in, they start using their PTA address.

  - **Locked out?** Put an ordinary user in the temporary *exempt from 2-Step Verification* group ([B21](#google-workspace-for-nonprofits)), have them enroll, then take them out. This never works for admins ([F54](#f54)).
  - **What waits on it:** `fundraising@` signing in unblocks [B26](#google-workspace-for-nonprofits), and Google sign-in for `/admin` ([B6](#google-workspace-for-nonprofits)) only works for accounts that have signed in.
  - `hello@` is the exception: Jon signs in to it himself.
- [x] **B15**: Create the Shared Drives - `JON` - **✅ Both created 2026-10-21:** one for PTA documents, so files belong to the PTA and not to whoever uploaded them, and *PTA Vault* for the password file ([B33](#google-workspace-for-nonprofits)). Moving files in is [B18](#google-workspace-for-nonprofits); their themes are [B35](#google-workspace-for-nonprofits).

  - **Documents drive settings** (2026-10-21): everything ticked. Files can be shared with people outside the PTA and with non-members, because flyers and sign-up sheets go to parents ([B21](#google-workspace-for-nonprofits)); content managers can share folders; every role can download, copy and print.
  - **PTA Vault settings** (2026-10-21): no access from outside the PTA and none for non-members, so only the drive's members can ever open the file. Download, copy and print are off for every role, which has to change for content managers: [B33](#google-workspace-for-nonprofits) step 3.
- [x] **B16**: Create a break-glass super admin - `JON` - **✅ Created and credentials saved 2026-09-30. Its second factor is [B22](#google-workspace-for-nonprofits).** Since 2026-10-05 its mail forwards to `communications@`, so alerts and verification codes are seen, and it is the primary Google for Nonprofits admin and a Cloudflare Super Administrator. Where the credentials are kept is deliberately not recorded in this public repo ([D2](#open-decisions)). Sign in with it once from a private window before relying on it, then calendar a sign-in every few months. The reasoning, kept for the next board: Two super admins exist, but neither is right as the last-resort account. `jon@` leaves when Jon does. The 2020 role account is meant to become the actual secretary's mailbox under [D14](#open-decisions), and an ordinary board member should not hold super admin. Create a dedicated account. Its address is deliberately not recorded in this public repo, and the name matters less than the controls. Give it a long unique password, 2-Step Verification using **printed backup codes** (no personal phone attached), and the PTA Gmail as recovery email. Do not use it day to day, but sign in every few months so the inactivity process that nearly deleted this tenant in 2021 never fires. **Two officers should be able to reach its credentials**, not one; where they live is [D2](#open-decisions). Once it exists and is tested, remove super admin from the 2020 role account (B17). **Updated 2026-10-22 (Jon): it is also the PTA's admin account, the owner of every outside service** ([B5](#google-workspace-for-nonprofits), [A36](#phase-0---accounts--scaffold)), so it is now used routinely, not only in an emergency. Its credentials go in the password vault ([B33](#google-workspace-for-nonprofits)) as well as the envelope, and its mail forwards to `admin-notifications@`. Communications and Secretary remain super admins as the other way back in.
- [x] **B17**: The 2020 role account - `JON` - **✅ Settled 2026-10-02.** It is `secretary@`, the account Gabe created for his first nonprofit attempt, and **Gabe is the Secretary**, so it is already exactly the role account [D14](#open-decisions) would have created for him. Its name and recovery email are correctly his. It **stays a super admin** as the second human admin after Jon (Jon, 2026-10-01). Because of org-wide enforcement and Google's own admin rule ([F54](#f54)), **Gabe must enroll in 2-Step Verification**, or the account loses web access after about 30 days. Tell him
- [~] **B18**: Move PTA documents into the Shared Drive - `JON` + board - After [B15](#google-workspace-for-nonprofits). Both Gmails' files are in, checked and tidied (2026-10-22), in the documents drive's *Workspace Import - October 2026* folder; sorting them into the drive's folders is what remains.

  1. [ ] **Inventory** what exists and who owns it: the PTA Gmail's Drive, the Fundraising Gmail's Drive, board members' personal Drives, and anything shared by link. For each, note roughly how much is Google Docs, Sheets, Slides and Forms and how much is PDFs and photos, which decides step 3.
  2. [ ] **Agree a structure** with the board: folders per role and committee in the documents drive, and a separate small drive for anything only some roles may see, because every member of a Shared Drive can see everything in it. Keep it shallow.
  3. [x] **Choose how to copy** each personal account's files, which cannot be moved, only copied ([F58](#f58)). **Google Takeout, for both Gmails** (Jon, 2026-10-21): with this many folders and subfolders, copying by hand would never finish. Takeout runs signed in as the account being exported, so each account's holder runs their own. Files a PTA account already owns are moved instead.
  4. [x] **Tidied 2026-10-22** by `CLAUDE`, through Drive for desktop, after a dry run that checked every file against the original zips. Removed: the `-info.json` metadata files (4,213 from the PTA Gmail, 2,369 from the Fundraising Gmail), the pinned versions byte-for-byte identical to the current file (2,166 and 1,016), and 5 `.DS_Store` files; renamed the 6 files like `name.xlsx(1)`. Nothing failed. The metadata is kept, one zip beside each export, *Takeout metadata (info.json files).zip*, and *Tidy log 2026-10-22.csv* in the import folder lists every change, so anything can be restored from the drive's trash within 30 days. **Tidy each export** ([F59](#f59)): set the `-info.json` metadata files aside in one zip, drop the pinned copies that are identical to the current file, rename files like `name.xlsx(1)` to `name (1).xlsx`, and delete `.DS_Store`. Best done before uploading. Both 2026-10-21 exports went up untidied, so theirs happens in the drive, through Drive for desktop, where a deletion goes to the drive's trash rather than straight away.
  5. [x] **Decided by Jon 2026-10-22: leave it in the documents drive for now.** It keeps roughly the access people already had, and given how it has been handled before he is not worried about it. **Decide where restricted material goes**, before it is uploaded: Treasurer records (bank statements, check images, reconciliations) and form responses with parents' details. Every member of the documents drive would see them; a small drive for the roles that need them is the usual answer (step 2).
  6. [x] **Uploaded 2026-10-21.** **Upload with Google Drive for desktop**, signed in as `communications@`, into the documents drive's backup folder. 2026-10-21: the PTA Gmail's export went up through the browser and had mostly processed by the end of the session; the Fundraising Gmail's is going up through Drive for desktop. One folder first, checked, then the rest. A browser tab is unreliable for thousands of files; Drive for desktop resumes after an interruption, and leaves Word and Excel files as they are.
  7. [ ] Check the uploaded file count matches, then delete the local export and its zip, which hold the PTA's financial and member records. **Counts ✅ 2026-10-21:** `CLAUDE` compared both exports with the drive as Drive for desktop shows it, path by path, and every file arrived: 10,420 of 10,420 from the PTA Gmail and 5,606 of 5,606 from the Fundraising Gmail, in *Workspace Import - October 2026*. Only 27 empty folders from the PTA Gmail did not come across, because a browser folder upload skips empty folders. Keep one zip per account until step 4 is done, since the tidying works from them; the unpacked folders and a second, identical copy of the Fundraising zip can go now.
  8. [ ] Leave the originals in each Gmail for a term, with a note pointing at the new home, then retire them.

  - **Move or copy:** files a PTA account owns can be moved, and keep their links, comments and history. Moving a folder needs the Manager role on the drive; a file needs Contributor or above. Everything a personal account owns arrives as a copy, with a new link and without the original's comments, version history or sharing ([F58](#f58)).
  - **The copy script and Takeout compared:** both keep the folder structure, and both make copies, so neither keeps links. The script copies inside Google, so Docs, Sheets and Forms stay Google files (Forms without their responses) and nothing is downloaded. It needs the source account to share its top-level folders with the PTA account running it, and loose files at the top of My Drive put into a folder first. Takeout exports Google files as Word, Excel and PowerPoint; Drive can turn them back on upload, but formatting and formulas can shift, and a Form cannot come back as a form. Takeout also skips anything in *Shared with me*.

  - **Links:** files whose links are already circulating (forms, sign-up sheets, flyers, links on the website or in newsletters) stay where they are until their season ends, because a copy gets a new link. Check the website's links afterwards.
- [x] **B19**: Decide whether the calendar migrates at all - `JON` - **✅ Decided 2026-10-05: migrate it.** The Blackshear Parents calendar moves into Workspace under an owner account to be decided. The work is [B27](#google-workspace-for-nonprofits). The earlier recommendation was "not now", because a *new* calendar would have stranded existing subscribers. On 2026-10-05 Jon found that *Transfer ownership* is available, which keeps the same calendar, so that risk goes away ([B27](#google-workspace-for-nonprofits))
- [x] **B20**: Upload the Workspace organization logo - `JON` - **✅ Uploaded 2026-09-30.** **`CLAUDE` made it 2026-09-30:** [`assets/brand/workspace-logo.png`](assets/brand/workspace-logo.png). It is Buzz in the site's disc beside a BLACKSHEAR / PTA wordmark in Bevan, white on the black header band, so it matches the live site. It is exactly 320×132, Google's required size, and about 12 KB. Upload it at Admin console → Account → Account settings → **Personalization** → *Custom logo* → *Upload from device*, and leave *classic Sites* unchecked. Google says it can take up to 4 days to appear, only to people in the organization, and never on mobile. A transparent variant exists, but its type vanishes in dark themes. Both are built by `scripts/make-workspace-logo.mjs` from the existing mascot and font, not redrawn. The school-marks question in [A11](#phase-1---theme-demo-and-board-vote-complete) applies, but matters less here because the logo is internal-only
- [x] **B21**: Org-wide settings before the first board account - `JON` - **✅ All done 2026-10-05.** 2-Step Verification enforced for the whole organization (2026-10-02), plus the password policy, self-service recovery and Drive sharing settings. **Do not exempt any admin, the break-glass account included**: Google enforces it on admins regardless ([F54](#f54)), and B22 covers that account. **If a volunteer misses the enrollment window and is locked out**, Google's documented fix is a temporary *exempt from 2-Step Verification* group. Add them, have them enroll, then remove them. That works for ordinary users only, never admins. The remaining items are easiest to set before anyone is created, because new accounts then start under them. Menu names are approximate; Google moves them. (1) **Security → Authentication → 2-Step Verification**: allow it, and **enforce** it for everyone with a new-user enrollment period of a week or two, so each volunteer enrolls on first sign-in. (2) **Password management**: minimum 12 characters. (3) **Security → Account recovery**: let users recover their own accounts, so a volunteer who forgets a password does not need an admin. Keep super admin recovery on. (4) **Apps → Google Workspace → Drive and Docs → Sharing settings**: keep sharing outside the organization **allowed**, because flyers and sign-up sheets go to parents, with a warning when someone shares outside. Set the default for new files to restricted. (5) When creating each account in B14, tick *ask for a password change at the next sign-in*, and add a recovery email the volunteer controls
- [x] **B22**: Give the break-glass super admin a second factor that can be handed over - `JON` - **✅ Done 2026-10-05.** 2-Step Verification is on through an authenticator app. The setup key and the backup codes are stored with the password, so the second factor goes wherever the password goes: no password manager, no single person's phone. Two quick confirmations if not already done: the account's recovery email is the PTA Gmail, and it has been signed into once from a private window using only what is in the envelope. **Why it is done this way, for the next board:** Google enforces 2-Step Verification on every admin in this edition, and no exemption overrides it ([F54](#f54)). The setup key is just text that any number of devices can hold. **If a backup code is used, regenerate the set and replace the printed copy**, because each code works once. **Updated 2026-10-22:** the account is now used routinely ([B16](#google-workspace-for-nonprofits)), so the password, setup key and backup codes also go in the KeePassXC vault ([B33](#google-workspace-for-nonprofits)). The envelope stays as the offline copy, because the vault cannot help if Google sign-in is what is broken.
- [~] **B23**: Settle why the first test to `webmaster@` went to spam - `JON` + `CLAUDE` - Minor, and about incoming mail only. Outgoing mail from the domain is fine: on 2026-10-05 a message from `jon@` reached two outside Gmail inboxes, and neither put it in spam.

  1. [ ] On the test message in the spam folder, choose **Show original**. SPF, DKIM and DMARC for gmail.com should all say **PASS**.
  2. [ ] If they do, mark it **Not spam**, then re-test with a realistic message (a subject and a few sentences) from a different outside account.
  3. [ ] If DMARC fails, the group is altering messages: look for a subject prefix or footer in the group's settings (`admin-notifications@`, `webmaster@` until 2026-10-22).

  **The second test, 2026-10-22:** a message from a personal Gmail to the admin account came through `admin-notifications@` and landed in `communications@`'s spam, for the same reason. Steps 1 to 3 apply to it as well.

  4. [x] Done 2026-10-23 (Jon). In each member's Gmail, a filter that keeps the group's mail out of spam: in the search box's options, put `list:admin-notifications@blackshearpta.org` in *Has the words* and leave every other field empty (*Date within* and *Search* belong to searching and do not carry into a filter). Click **Search** first and check the test message is found, then *Create filter* → **Never send it to Spam**, and *Apply the label* IT Admin if wanted. This is the dependable fix; *Not spam* only trains the filter.

  - **What the second test's headers showed** (2026-10-22): the admin account's own copy reached its inbox, with SPF, DKIM and DMARC all passing. The copy the group delivered to `communications@` passed SPF and DKIM for `blackshearpta.org` but **failed DMARC for the sender's gmail.com address**, with ARC passing: the group re-sends the message under its own name, so the original signature no longer lines up with the From address. Gmail's *Show original* summary can still say PASS, because it gives ARC the benefit of the doubt. So the group's hop is the cause, as Jon worked out, and a filter on the members' side is the fix.
  5. [ ] Glance at the admin account's own Spam folder now and then. Gmail is reported not to forward mail it has already filed as spam, so a notice caught there never reaches the group.

  - **Why it is probably not our DNS:** Gmail's reason was *"similar to messages that were identified as spam in the past"*, which is a content filter, not an authentication failure. SPF, DKIM and DMARC govern mail *sent from* the domain, and this was mail arriving at it. A one-word "Test" to a days-old mailbox is a classic false positive.
  - **For mailing parents:** a new domain has no sending reputation. Build up gradually rather than one large first send, and ask early recipients to add the address to their contacts.
- [~] **B24**: Make `communications@` the Communications role's admin account everywhere, then retire `jon@` - `JON` - Admin work happens on the role account, so the next Communications volunteer inherits admin access with the role and nothing has to be handed over.

  1. [x] Create `communications@`, make it a super admin, enroll it in 2-Step Verification, and add it to `webmaster@` and `dmarc@` (2026-10-05).
  2. [x] Make it, and the break-glass account as primary, Google for Nonprofits administrators (2026-10-05).
  3. [x] Use it for the Cloudflare invitation ([A36](#phase-0---accounts--scaffold)).
  4. [x] Use it for the `/admin` Google sign-in setup ([B6](#google-workspace-for-nonprofits)), 2026-10-15.
  5. [x] Take `jon@` out of every group, remove its super admin role, and suspend it (2026-10-05). Nothing broke.
  6. [x] Forward the break-glass mailbox to `communications@`, so its security emails are seen. Since 2026-10-22 it forwards to `admin-notifications@` instead, which `communications@` is in ([B5](#google-workspace-for-nonprofits)).
  7. [x] Done 2026-10-22 (Jon). **On or after 2026-10-19 ([U19](#-do-this-week)):** delete `jon@`, choosing to transfer its Drive and Calendar data to `communications@`, and take it off the Google for Nonprofits admin list if it is still there. ✅ It owns no secondary calendars (checked 2026-10-06), which Google would otherwise delete with it ([F56](#f56)).

  - **Don't** add `jon@` as an alias on `communications@`: a personal alias would follow the role to the next volunteer.
- [x] **B25**: Set up `hello@` as the PTA's central inbox - `JON` + `CLAUDE` - **✅ Live 2026-10-05.** "Blackshear PTA" is created, its recovery email is the PTA Gmail, forwarding from the PTA Gmail is on, and Jon tested both direct mail and forwarded mail. It has a color Buzz profile photo, [`assets/brand/buzz-profile-color.jpg`](assets/brand/buzz-profile-color.jpg); the black-and-white Buzz stays on the break-glass account, so the two are easy to tell apart. **✅ Delegation done 2026-10-05.** `hello@` is delegated to `communications@` (accepted), `president@`, `vp@` and `fundraising@` (pending until each signs in and accepts, [B29](#google-workspace-for-nonprofits)). Mail is marked read when opened by others, and recipients see *hello@ "sent by" the delegate*. **Invitations expire after a week**, so re-send any that lapse. **Confirmed by the exec board 2026-10-06:** these four delegates are the right list. The *Grant access* row appeared in Gmail after a refresh. Steps, kept for the next board: **Step 1 done 2026-10-05**, applied at the top-level organizational unit, which `hello@` is in. Right after saving, `hello@`'s Gmail *Accounts* tab did not yet show *Grant access to your account*. Admin changes usually take minutes but can take up to 24 hours to reach Gmail, so reload Gmail, or sign out and back in, and check again before suspecting anything else. (1) Admin console → Apps → Google Workspace → Gmail → User settings → **Mail delegation**: tick *Let users delegate access to their mailbox to other users in the domain*, choose **Show the account owner and the delegate who sent the email**, and save. (2) Signed in as `hello@`, in Gmail → Settings → See all settings → **Accounts** → *Grant access to your account* → **Add another account**: add `communications@`, then `president@`. (3) Each delegate accepts the emailed invitation within a week. It can take up to 24 hours to appear. They then open `hello@` from their own Gmail via the profile picture → the account marked *Delegated*. Delegates cannot be added from the phone app. **The site's public address** moves to `hello@` in [A34](#phase-2---real-site). Moving the old Gmail's *history* (mail, contacts, Drive, calendars) is the data migration, [B30](#google-workspace-for-nonprofits). **Keep the PTA Gmail alive; never delete it.** It is the recovery address for the break-glass account and `hello@`, a Google for Nonprofits admin, and the calendar's owner ([B27](#google-workspace-for-nonprofits))
- [~] **B26**: Data migration, part 2: the Fundraising Gmail into `fundraising@` - `JON` + board (the Fundraising chair) - The same move as the PTA Gmail's ([B30](#google-workspace-for-nonprofits)). **Sat down with the chair 2026-10-23:** all the Gmail's mail is copied in, and Jon walked her through her account setup (Jon). **Plan, 2026-10-16:** do it in one sitting of about 30 minutes with the Fundraising chair. The password Jon was given did not work, and steps 3, 4 and 7 each need either the Gmail's own sign-in or `fundraising@`'s, which she holds. Nothing changes on the website, which never published this address.

  **Before starting**

  1. [x] **Finish the PTA Gmail import first** ([B30](#google-workspace-for-nonprofits) steps 2 and 3, ending with *Exit and delete import*). The data import tool takes one personal Gmail at a time, and a new import cannot start until the finished one is exited.
  2. [x] Check whether the Fundraising chair has signed in to `fundraising@`. She has (by 2026-10-09). (Admin console → Directory → Users → *Last sign in*). Steps 3 and 7 need someone signed in to it ([B29](#google-workspace-for-nonprofits)).

  **Mail**

  3. [ ] **Forwarding,** so nothing new falls into the gap. In the Fundraising Gmail: Settings → See all settings → *Forwarding and POP/IMAP* → **Add a forwarding address** → `fundraising@blackshearpta.org`. Google emails a confirmation to `fundraising@`, and whoever is signed in there clicks it. Then choose *Forward a copy of incoming mail to* `fundraising@` and *keep Gmail's copy in the Inbox*, and save.
  4. [x] Done 2026-10-23. **Import:** Admin console → Data → Data import & export → Data import → **Gmail** → Import. Source `blackshearptafundraising@gmail.com` → **Request authorization**, and authorize it as the Fundraising Gmail within 24 hours, ticking *View your email messages and settings*.
  5. [x] Done 2026-10-23. Target `fundraising@blackshearpta.org`. Same settings as the PTA Gmail: default start date (everything), Spam and Trash unticked, no labels excluded. **Start import.**
  6. [x] Done 2026-10-23: all mail copied over (Jon). When Google's "finished" email arrives, check its totals look plausible, then **Exit import → Exit and delete import**. If step 3 was not done before step 4, first run one **delta import**, after forwarding is on, to catch the mail that arrived in between.

  **Contacts**

  7. [ ] Export from the Fundraising Gmail as **Google CSV** (contacts.google.com → select all → Export). Importing needs a sign-in as `fundraising@`: the chair does it, or it waits until she has signed in. Delete the CSV from Downloads afterwards.

  **Later**

  8. [x] Done 2026-10-22: copied in, checked and tidied ([B18](#google-workspace-for-nonprofits) steps 4 and 7). **Drive:** Google Takeout, which runs signed in as the Fundraising Gmail, so do it in the same sitting as steps 3 to 7 if possible. **2026-10-21:** Jon got into the Fundraising Gmail, downloaded its Takeout and uploaded it through Drive for desktop, and all 5,606 files arrived ([B18](#google-workspace-for-nonprofits) step 7). Tidying is B18 step 4. Then the same tidying and upload as the PTA Gmail's ([B18](#google-workspace-for-nonprofits) steps 4 to 7, [F59](#f59)), into the documents drive's fundraising area. Anything with a public link stays where it is until its campaign ends.
  9. [ ] **Services** registered to the Fundraising Gmail (a March 2026 board thread mentions Animoto, TinyURL and HelloSign, plus payment and sign-up tools): add `fundraising@` as an admin or change the login email, one at a time ([A38](#phase-0---accounts--scaffold)).
  10. [ ] Update printed or emailed material that gives the old address.
  11. [ ] Save the Fundraising Gmail's password in the password manager ([B33](#google-workspace-for-nonprofits)).

  - **Keep the Fundraising Gmail alive:** it is `fundraising@`'s recovery address.
  - **Nobody but the chair can check `fundraising@`'s mailbox:** an admin cannot read it without resetting her password, which would lock her out. So the spot-check of labels and old messages is hers once she signs in.
- [x] **B27**: Data migration, part 3: the Blackshear Parents calendar - `JON` + `CLAUDE` - **✅ Decided by Jon 2026-10-06: keep it with the PTA Gmail, and run it from Workspace** (option (a) below). **✅ Shared 2026-10-06:** `communications@`, `president@`, `vp@`, `fundraising@` and `secretary@` have *Make changes and manage sharing*, the Fundraising Gmail keeps *See event details*, and the other accounts need no edit access for now (Jon). The public feed was checked straight afterwards and was unchanged: 917 events, none "Busy". Moving it into Workspace, option (b), may be revisited at a cleaner time, between school years, when asking parents to re-subscribe costs least. **Sign in to the PTA Gmail now and then**, so Google never treats it as inactive. **⚠️ Google refused the transfer, 2026-10-06** ([F56](#f56)). Choosing *Transfer ownership* on `communications@`'s entry and confirming gave: *"Ownership cannot be transferred. This calendar can only be owned by an eligible individual user account (email address)."* The calendar is owned by the PTA Gmail, a personal account, and Google only transfers a calendar's ownership to another user in the same organization; a personal Gmail and the `blackshearpta.org` Workspace are different organizations. The Admin console's sharing setting was not the cause: it already read *"Share all information, but outsiders cannot change calendars"*, and had for well over a day. **So the exec board's decision (transfer to `communications@`, 2026-10-06) cannot be carried out as made, and needs remaking.** The two real options: **(a) Keep the PTA Gmail as owner, and run the calendar from Workspace.** `communications@` already has *Make changes and manage sharing*; give the other role accounts that need it edit access too. Nothing changes for parents or the site: same calendar, same feed, same subscriptions. The cost is that the calendar keeps depending on the PTA Gmail, which is already kept for good as a recovery address ([B25](#google-workspace-for-nonprofits)). Google may delete a personal account left unused for two years, so someone must sign in to it now and then; fold that into the break-glass sign-in routine ([B16](#google-workspace-for-nonprofits)). **(b) Start a new calendar owned by `communications@`**, import the events, point the site at it (`CALENDAR_ID` in `scripts/refresh-events.mjs`) and ask every subscribed parent to re-subscribe. The old calendar stays up with a note saying where it moved, and is never deleted. This is the plan withdrawn on 2026-10-05 because it strands subscribers, and that has not changed. **`CLAUDE` recommends (a)**: the point of the transfer was to keep the same calendar and its subscribers, (a) does that and (b) gives it up, and the PTA Gmail is permanent either way. Choosing (b) later stays possible. **The hourly refresh now refuses a free/busy-only feed** (2026-10-15): if half or more of the events are titled "Busy", it keeps the existing snapshot and the run fails, instead of publishing a page of "Busy" entries. Before that, its only guard was against an empty feed. `CLAUDE` saved a baseline on 2026-10-06: 917 events in the feed, none titled "Busy". *Kept for the record:* the transfer was expected to work because `communications@` already had *Make changes and manage sharing* and the menu offered *Transfer ownership*. The same-organization rule was read as binding only work-account owners. That reading was wrong, and the menu offers an option it then refuses
- [~] **B30**: **Data migration**: move the PTA's history off both Gmails and into Workspace - `JON` + board - Decided by the exec board 2026-10-06: copy everything, all past mail and files, from both Gmails into their Workspace successors. The live setup is already done: the new accounts exist, forwarding is on, and the site points at `hello@`.

  **PTA Gmail → `hello@`**

  1. [x] **Mail:** the Admin console's data import started 2026-10-15, taking all mail since 1999-12-31, without Spam or Trash, and excluding no labels.
  2. [x] **Finished 2026-10-15**, in 4 hours: 16,961 messages found, 16,960 copied, 0 skipped, 1 failed. The attached report names the failed one. Spot-check `hello@`: the labels, Sent mail, and an old message from 2020. Some of the ~77 messages already forwarded may appear twice; accepted (Jon).
  3. [x] Then **Exit import → Exit and delete import**, which removes the tool's access to the PTA Gmail. Exited 2026-10-16.
  4. [x] **Contacts:** exported as Google CSV and imported into `hello@` (2026-10-15). Delete the CSV from Downloads.
  5. [x] Done 2026-10-22: copied in, checked and tidied ([B18](#google-workspace-for-nonprofits) steps 4 and 7). **Drive files:** Takeout downloaded and unpacked 2026-10-21: 7.0 GB and 10,421 files, of which about 3,700 are the documents themselves ([F59](#f59)). Uploaded the same day through the browser, untidied, into the documents drive's *Workspace Import - October 2026* folder, and checked: all 10,420 files arrived ([B18](#google-workspace-for-nonprofits) step 7). Tidying and deleting the local copy are B18 steps 4 and 7.

  **Fundraising Gmail → `fundraising@`:** [B26](#google-workspace-for-nonprofits), with the Fundraising chair.

  **The parents' calendar** stays owned by the PTA Gmail and is run from Workspace ([B27](#google-workspace-for-nonprofits)).

  - **No delta import** (Jon, 2026-10-15): forwarding brings new mail in, so the one-time import covers the history. A delta would also have caught mail *sent from* the Gmail after the import, and mail Gmail filtered as spam, neither of which forwarding passes on.
  - **Not included in the import:** Gmail filters, signatures and settings. Recreate any that matter in `hello@` by hand.
  - **Rules:** files with circulating links stay put until their season ends, and both Gmails stay alive as recovery addresses.
  - **Method,** checked against Google's docs 2026-10-06: the data import tool takes a personal Gmail as the source and copies, never moves. It keeps labels, Sent mail, drafts, stars and read state. A label in `hello@` with the same name as one in the Gmail makes those messages fail. Not used: POP *Check mail from other accounts* (closed to new users in 2026), and Gmail's own *Import mail and contacts*.
- [x] **B31**: Create `littleeast@` - `JON` - **✅ Created 2026-10-06** for the Little EAST chair. Decided 2026-10-06 ([D16](#open-decisions)): a **user account** for the Little EAST chair, created like the other role accounts (Directory → Users → Add new user). Use the role as the title, the chair's personal email as recovery (from the board list, not this repo), and *change password at next sign-in*. Hand over the temporary password by text or in person; the chair then enrolls in 2-Step Verification within the window. Add it to [docs/ACCOUNTS.md](docs/ACCOUNTS.md), and to `members@`'s posters if Little EAST should be able to mail members
- [ ] **B32**: Create `community@` as a shared-mailbox group - `JON` - A Google Group with several members, run as a Collaborative Inbox, decided by the exec board 2026-10-06 ([D17](#open-decisions)). Google has no Outlook-style shared mailbox; this is the closest equivalent.

  1. [ ] **Decide first what it is for and who answers it**, so it does not compete with `hello@`. Carried to the next board meeting.
  2. [ ] **Create the group** (Admin console → Directory → Groups) and add the members. Allow posting from outside the organization.
  3. [ ] **Turn on Collaborative Inbox:** groups.google.com → the group → Group settings → *Enable additional Google Groups features* → **Collaborative Inbox**. Conversation history must be on. Give members the *moderate metadata* permission, which assigning and resolving need.
  4. [ ] **Reply as `community@`:** set the group's default sender to the group address, and allow members to post as the group. To reply from Gmail instead, each member adds `community@` under Gmail → Settings → Accounts → *Send mail as*.
  5. [ ] Each member chooses whether copies also land in their Gmail (*Each email*) or they work only from the Groups page (*No email*).
  6. [ ] Add it to [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

  - **What members can do:** see every conversation at groups.google.com, take one, assign it, mark it complete, duplicate or no action needed, and search by status or assignee.
  - **How it differs from `hello@`:** `hello@` is a user account shared by delegation, with its own mailbox, Drive and calendar. A group has no login and no mailbox; its shared view is the Groups page.
- [x] **B33**: Set up KeePassXC as the PTA's password vault - `JON` - One encrypted file, `Blackshear PTA.kdbx`, in a small Shared Drive the PTA owns, opened with one master password. Free and open source, with no account, server or subscription to lapse. **Decided by Jon 2026-10-16**, after Passwd's free plan proved unusable ([F57](#f57), [D2](#open-decisions)).

  **Where it lives**

  1. [x] Install KeePassXC from keepassxc.org (Mac, Windows and Linux; the same file opens on all three).
  2. [x] Create a **separate Shared Drive just for the vault**, *PTA Vault*, apart from the documents drive ([B15](#google-workspace-for-nonprofits)). Created 2026-10-21. Its members are exactly the people who may open the vault, so access is managed in one place.
  3. [x] Ticked 2026-10-21. In *PTA Vault* → **Shared drive settings**, tick **Contributors and content managers** under *People who can download, copy, print*. With it off, Drive for desktop shows the vault file as a `.gdrive` shortcut and KeePassXC cannot open it. Managers are exempt, so a test as a Manager would work and hide the problem. Leave *Commenters and viewers* unticked.
  4. [x] Installed 2026-10-21, signed in as `communications@`. Install **Google Drive for desktop**, signed in as `communications@`, so the Shared Drive appears in Finder and KeePassXC saves straight into it. Everyone then opens the one file, not their own copy.

  **The database**

  5. [x] Done 2026-10-22 (Jon): created, moved into *PTA Vault*, and opened from there. KeePassXC → **Create new database**: name *Blackshear PTA*; keep the default encryption settings; a **long passphrase** as the master password (KeePassXC's generator can make one); no key file, which would be one more thing to lose. Save it as `Blackshear PTA.kdbx` in the *PTA Vault* drive.

  - **One copy, the one in the drive.** Everyone opens `Blackshear PTA.kdbx` in *PTA Vault* through Drive for desktop, and nobody keeps a working copy of their own: two copies drift apart, and a change saved to one is missing from the other. For backups, tick *Backup database file before saving* in KeePassXC's settings, and lean on Drive's version history and the copy in the envelope.

  **Moving the logins over from 1Password**

  6. [x] Already so (2026-10-22): about 14 items, in a 1Password vault of their own. In 1Password, put the PTA items in a vault of their own, if they are not already. Keep the two Gmail logins even though they predate Workspace: both accounts stay alive as recovery addresses ([B25](#google-workspace-for-nonprofits), [B26](#google-workspace-for-nonprofits)), and the PTA Gmail owns the parents' calendar.
  7. [x] Done 2026-10-23 (Jon). Export **only that vault**. 1Password 8 exports a whole account, so use **Travel Mode**: mark only the PTA vault *Safe for travel*, turn Travel Mode on at 1password.com, then File → Export → the account → **1PUX**. Turn Travel Mode off afterwards. Open the export once to confirm it holds only PTA items. For a handful of items, copying them in by hand is just as good.
  8. [x] Done 2026-10-23 (Jon). KeePassXC → **Database → Import → 1Password Export (.1pux)**, into the open *Blackshear PTA* database. Check every entry is a PTA one.
  9. [x] Done 2026-10-23: no `.1pux` file is left in the Desktop, Downloads, Documents or project folders (`CLAUDE` checked). **Delete the .1pux file and empty the Trash.** It is unencrypted.

  **Sharing it**

  10. [x] Done 2026-10-23 (Jon). Master password: on the sheet in the sealed break-glass envelope, and told to the other officers who need it **in person, never by email**.
  11. [x] Done 2026-10-21 (Jon): `communications@` is the Manager, and `president@`, `vp@` and `fundraising@` are Content managers. Add those officers' role accounts to the *PTA Vault* Shared Drive as **Content manager**, not Contributor: in Drive for desktop a Contributor can only read, so could not save changes to the vault.
  12. [x] Done 2026-10-23 (Jon). Each installs KeePassXC and Google Drive for desktop. Optional: the *KeePassXC-Browser* extension for autofill; KeePassDX (Android) or KeePassium or Strongbox (iPhone) on phones.
  13. [x] Done 2026-10-23 (Jon). Record which roles have access in [docs/ACCOUNTS.md](docs/ACCOUNTS.md), never the passwords (roles recorded 2026-10-21). Once the vault is in use, remove the PTA items from Jon's personal 1Password.

  **The admin account**

  14. [x] Done 2026-10-23 (Jon). Add its entry: the password, the authenticator setup key and the backup codes ([B22](#google-workspace-for-nonprofits)), because it is now used day to day (Jon, 2026-10-22, [B16](#google-workspace-for-nonprofits)).

  - **When someone leaves:** remove them from the Shared Drive, change the master password (Database → Database Security), and change any important logins they knew.
  - **Two people saving at once** can leave a "conflicted copy" in Drive. KeePassXC's **Database → Merge from database** combines them.
  - **Keep the break-glass account in the envelope as well.** The vault depends on Google Drive, so it cannot help if Google sign-in is what is broken.
  - **Drive keeps earlier versions** of the file, so a bad save can be rolled back. A copy of the file in the envelope covers the rest.
- [x] **B34**: An all-accounts group, `all@`, with the parents' calendar shared to it - `JON` - **✅ Group created 2026-10-06:** "All Blackshear PTA Accounts" (`all@`). Its member is *All users in the organization* (Members → Add members → **Advanced**), so every current and future PTA account is in it automatically and leavers drop out; suspended accounts stay in but get no mail. Owners: Communications, the President and the break-glass account. It exists so every PTA account can see the Blackshear Parents calendar without anyone being added one by one ([B27](#google-workspace-for-nonprofits)). **✅ Calendar shared with `all@` (*See event details*) 2026-10-15**, replacing an entry first typed as `everyone@`, an address that does not exist. Access settings confirmed: only owners and managers post, no external members, and a test message from outside was refused. **Keep posting limited to owners and managers**, which is Google's own advice for organization-wide groups, because it also works as a mailing list to every PTA account. Members get an email with a link to add the calendar, and new accounts get one within about an hour of being created
- [~] **B35**: Themes for both Shared Drives - `CLAUDE` + `JON` - A banner for each drive, from the PTA's own brand, so the two are easy to tell apart. Asked for by Jon 2026-10-21, after Google refused the 800-pixel `hello@` photo: a theme must be at least 1280 × 144 pixels.

  1. [x] `CLAUDE` makes them (2026-10-21): [`assets/brand/drive-theme-documents.png`](assets/brand/drive-theme-documents.png), Buzz on brand blue, and [`assets/brand/drive-theme-vault.png`](assets/brand/drive-theme-vault.png), Buzz on black, each with the lemon rule from the foot of the site's masthead. No honeycomb: Buzz is a yellow jacket, not a honeybee ([F7](#f7)). Both are 2560 × 288, Google's 80:9 shape at twice the minimum, built by `scripts/make-drive-themes.mjs`.
  2. [x] Upload both images to Drive, because the theme picker only chooses from images already there. Jon keeps them in the documents drive for reference (2026-10-21).
  3. [x] Both applied 2026-10-21. Open each drive → click its name at the top → **Change theme** → **Create custom theme** → pick its image → **Select**. Keep the crop covering the whole image.
  4. [ ] Check that the small square beside each drive's name shows Buzz. If the crop cuts him off, `CLAUDE` moves him.

  - **No words on them** on purpose: Drive always shows the drive's name beside the theme, and a square crop would cut words off.
- [x] **B28**: The members' mailing list, `members@` - `JON` + `CLAUDE` - Asked for by Jon on 2026-10-05: one address that reaches every current PTA parent's personal email. **Recommended: a Google Group with outside members, set up as announcement-only.** It is free, lives in Workspace beside everything else, and survives turnover. Gmail's own bulk-sender rules, which require one-click unsubscribe, apply above 5,000 messages a day to Gmail, far above a PTA's volume, and Groups adds an unsubscribe link anyway. **Org settings first:** Admin console → Apps → Google Workspace → **Groups for Business** → Sharing settings: allow **group owners to add external members**, and allow **incoming email from outside the organization**. **Group settings:** name "Blackshear PTA Parents"; **who can post: managers only** (make `communications@`, `president@` and `hello@` managers), so no parent can reply-all to three hundred families; **custom reply-to: `hello@`**, so parents' replies land in the central inbox; **who can view members: managers only**, so parents never see each other's addresses; join by invitation or admin-add only. **Where the addresses come from:** Jon has the current **PTA membership** export (2026-10-05). It has 83 people with last name, first name and email, and it is clean: every address is well-formed, with no duplicates and no blanks. Most are Gmail; six are `austinisd.org`, district addresses whose mail filtering the PTA does not control, so check those arrive. **It is a *members* list, not every school family**, which is what the PTA can most clearly justify emailing. Consider naming the group `members@` to match, and keep a wider all-families list for later, built from the sign-up form. Use only addresses parents gave the PTA for PTA communication, such as membership forms, room-parent lists and sign-ups. Do not scrape addresses from old mail. Offer a sign-up form on the site for everyone else, which is A32's audience. **Parent addresses never go in this repo**; the group is their only home. **✅ Done 2026-10-05:** "Blackshear PTA Members" (`members@`) has 87 members: the 83 PTA members plus the 4 owners.  `members@`, named "PTA Members". It is announcement-only (owners and managers post), members are hidden, joining is by invitation only, and admins may add external members. Pasting addresses did not work in the Admin console, so members go in by CSV upload. **✅ Email options set 2026-10-05:** replies go to a custom address, `hello@`; the subject prefix is `[Blackshear PTA Members]`; conversation mode is on; *No additional features* is selected, not Collaborative Inbox, which is for intake addresses a team works through, not an announcement list. **Settings kept for the next board:** (1) **a footer**  with an unsubscribe line (`members+unsubscribe@blackshearpta.org`, which works for outside members). Without one, a parent who wants out reaches for *Report spam*, and spam reports hurt delivery for the whole domain. (2) Members went in by CSV upload, since pasting did not work. (3) Check *Posting policies* (email posting allowed, owners and managers only) and *Member privacy* (member addresses visible to owners and managers only). (4) A test post. **Yearly:** refresh the membership from the new export, adding newcomers and removing lapsed members. Delete the address files from Downloads after each load. `CLAUDE` prepared the member list in Jon's Downloads (not this repo): a comma-separated paste file, and a CSV for the Admin console's *Bulk upload members* (Directory → Groups → the group → Members → Add → Bulk upload members; header `Group Email [Required],Member Email,Member Type,Member Role`, each row `USER` / `MEMBER`). It holds all 83 members, with **two district addresses corrected** from Jon's notes, both of which had lost the hyphen in a double surname. The export itself still has the typos, so fix them at the source before next year's export. Scripting ([D15](#open-decisions)) is not needed for the first load. **After loading:** add `communications@` as a manager now, and `president@` and `hello@` once B14's upload creates them. Then send one short test post and confirm it arrives as announcement-only, with replies going to `hello@`. **Before the first real send:** the domain is new, so warm up with smaller sends first ([B23](#google-workspace-for-nonprofits)). **If the board later wants designed newsletters** with open rates and sign-up pages, that is a newsletter tool with a free tier, such as MailerLite or Mailchimp. A group is right for plain announcements, which is what is needed now
- [~] **B5**: `admin-notifications@`, where the admin account's mail goes - `JON` + `CLAUDE` - A Google Group that receives everything sent to the admin account, so service notices, bills and password resets are read even when nobody is signed in to it.

  1. [x] Create it as a Google Group, `webmaster@`, allow outside senders, and add `communications@` (2026-10-02 to 2026-10-05).
  2. [x] Renamed `admin-notifications@`, *Admin Notifications*, with `webmaster@` kept as an alias and a description of what it is for (Jon, 2026-10-22).
  3. [x] Forward the admin account's mail to it, instead of straight to `communications@` (Jon, 2026-10-22; [B24](#google-workspace-for-nonprofits) step 6).
  4. [x] Done 2026-10-22 (Jon). Add a second member, so notices reach at least two people, as the group's description recommends.
  5. [ ] Test it: send a message from an outside account to the admin account, and check it reaches each member's inbox rather than spam ([B23](#google-workspace-for-nonprofits)). **2026-10-22:** it arrived through the group, but in spam; the fix is B23 step 4.

  - **Jon's decision, 2026-10-22: the admin account owns every outside service.** It is the account [B16](#google-workspace-for-nonprofits) created as the break-glass admin, and it stays a *user* account because Google sign-in does not work with a group. Its mail forwards here so nothing sent to it goes unread. *Considered and set aside:* this group as the login email for services, the original plan; it was never carried out, so nothing needed undoing.
  - **Keep the member list short**, the Communications role plus one backup, because password resets for every service the admin account owns are forwarded here.
- [x] **B6**: Google sign-in for `/admin` - `JON` + `CLAUDE` - Board members sign in to `/admin` with their PTA Google accounts instead of an emailed code. Settings only, no code change: the site checks the sign-in itself, not which method produced it. **✅ Live 2026-10-15**, verified from outside: `/admin` goes straight to Google's account picker for `blackshearpta.org` accounts, with no emailed-code option.

  - **Who can get in** (Jon, 2026-10-15): `communications@`, `president@`, `vp@`, `secretary@` and `fundraising@`.
  - **Jon's decisions, 2026-10-15:** the legacy policy and one-time PIN are **removed entirely**, not kept as a fallback, and instant authentication is on. The old Gmail addresses no longer get in; only Jon had ever used `/admin`, so nobody else is affected. The emergency route back is in [docs/ADMIN.md](docs/ADMIN.md).
  - **Two phases,** so nobody is locked out: Google sign-in goes in beside the emailed code and is tested first; the code is turned off only once the board accounts have signed in ([B29](#google-workspace-for-nonprofits)).

  **Google Cloud** (console.cloud.google.com, signed in as `communications@`)

  1. [x] Accept the terms if asked. **Manage resources → Create project**: name `blackshear-pta-access`, location **the blackshearpta.org organization**, not "No organization". No billing account is needed.
  2. [x] **APIs & Services → Enable APIs and Services**: enable **Admin SDK API**.
  3. [x] **Google Auth Platform → Branding → Get started**: app name `Blackshear PTA Admin`; support and contact email `communications@blackshearpta.org`; **Audience: Internal**, which limits sign-in to PTA accounts. Add no scopes.
  4. [x] **Clients → Create client**: type **Web application**, name `Cloudflare Access - /admin`, Authorized JavaScript origin `https://tight-cell-8e63.cloudflareaccess.com`, Authorized redirect URI `https://tight-cell-8e63.cloudflareaccess.com/cdn-cgi/access/callback`.
  5. [x] **Copy the Client ID and Client secret straight away**, or download the JSON. Google shows the secret only once. Keep it only in the password manager ([B33](#google-workspace-for-nonprofits)).

  **Google Admin console** (admin.google.com)

  6. [x] **Security → Access and data control → API controls → Settings → Internal apps → Trust internal apps → Save.** It can take up to 24 hours to apply.

  **Cloudflare** (the Blackshear PTA account → Zero Trust)

  7. [x] **Integrations → Identity providers → Add new → Google Workspace**: App ID = the Client ID, then the Client secret, and `blackshearpta.org` as the domain. Name it *Blackshear PTA Google Workspace*, set **Google prompt** to *Select account* so people pick their PTA account rather than whichever Google account the browser has open, and leave PKCE and SCIM off. Save.
  8. [x] **Open the link Cloudflare then shows**, signed in as `communications@`, and click **Allow**. The next step fails without it.
  9. [x] Click **Test** beside Google Workspace. It should show your identity.
  10. [x] **Access controls → Policies → Add a policy**, a new one beside the legacy policy rather than an edit to it (Jon, 2026-10-15): name *Blackshear PTA Website - Board (Google Workspace)*, action **Allow**, **Include → Emails** → the five role addresses above, and **Require → Login Methods → Blackshear PTA Google Workspace**.
  11. [x] **Access controls → Applications → Blackshear PTA Admin → Configure:** add the new policy beside the legacy one, and select **Blackshear PTA Google Workspace** as a login method as well as One-time PIN. Instant authentication has to come off while two methods are selected.
  12. [x] Test in a private window: `blackshearpta.org/admin` → Google → sign in as `communications@`. The editor should load. Then run [A42](#phase-2---real-site).

  **Phase 2, once the board accounts have signed in**

  13. [x] Remove the legacy policy and One-time PIN, and turn **Apply instant authentication** back on (Jon, 2026-10-15).

  **Afterwards**

  14. [x] `CLAUDE` updates [docs/ADMIN.md](docs/ADMIN.md), `terraform/access.tf` (with the client secret left out), [docs/ACCOUNTS.md](docs/ACCOUNTS.md) and the related tasks.

  - **Optional hardening:** with *Trust internal apps* on, any PTA account could create a Cloud project that Google trusts. Turning Google Cloud off for everyone but admins (Apps → Additional Google services → Google Cloud Platform) closes that.
  - **Google deletes an OAuth client unused for six months.** If `/admin` sits unused that long, sign-in fails with `deleted_client`, and steps 4 to 9 need redoing.

### GitHub for Nonprofits

*Free GitHub Team for verified 501(c)(3) orgs. Not urgent; see [F17](#f17), but free upside, and it converts the existing org in place with no rework.*

- [~] **B7**: Apply for GitHub for Nonprofits - `JON` - ✅ Applied 2026-10-06; waiting on GitHub's review at nonprofits.github.com/nonprofit_offers. Approval converts the existing organization in place.

  1. [x] Apply. GitHub did not find the PTA in its database, so the application asked for details (below).
  2. [ ] **When approved, choose Team**, which shows as $0 instead of $4 per user. Enterprise is discounted but still paid, about $15.75 a month, and is not needed.

  - **Answers given:** name **612 Blackshear Elementary PTA** (the IRS name for the EIN); website `https://blackshearpta.org`; registration ID **91-2015074**; address 1712 E. 11th St., Austin, TX 78702; focus Education; repository `Blackshear-PTA/blackshear-pta-website`; the group exemption explained in the notes.
  - **Documents** (up to 5 files and 10 MB, PDF/JPEG/PNG): the Texas PTA good-standing letter for unit 612, Texas PTA's IRS group-exemption letter, the ProPublica page for EIN 91-2015074 as a PDF, and the Google for Nonprofits approval email.
  - Expect the same "PTA TEXAS CONGRESS" group-exemption question that Google raised ([F13](#f12), [F48](#f48)).
- [ ] **B8**: Look at the Nonprofit Developer Pack - `JON` - Partner credits and discounts. Worth a skim once [B7](#github-for-nonprofits) is approved.
- [ ] **B9**: Re-evaluate public vs. private repo once Team lands - `JON` + `CLAUDE` - Team makes private repositories fully featured. The current call is **public**, and Claude would keep it: branch protection and secret-scanning push protection are already free on public repositories, and transparency suits a parent-funded organization.

---

## Track A - Website

### Phase 0 - Accounts & scaffold

- [x] **A1**: Create GitHub Organization - `JON` - **`Blackshear-PTA`**, Free plan, created under the PTA account (not Jon's personal). Correct per §3.6. GitHub for Nonprofits (free Team) deferred - converts an existing org in place, so no rework later ([F17](#f17))
- [x] **A2**: Create repo, grant Jon access - `JON` - Public at `Blackshear-PTA/blackshear-pta-website`. `jon-flowers` added as Owner; scaffold pushed, 5 commits live
- [x] **A3**: Scaffold Astro + Tailwind v4 - `CLAUDE` - Astro 7.2.9 + Tailwind 4.3.3, 4 commits local. Build clean, `astro check` 0 errors. **Node pinned to 22.22.3** via `.node-version` (Astro 7 needs ≥22.12). Tailwind default palette verified genuinely unreachable, not just discouraged
- [x] **A4**: Wire GitHub → Cloudflare Workers deploy on push - `JON` - Cloudflare **Workers Builds** connected to the repo. Worker `blackshear-pta`, build `npm run build`, deploy `npx wrangler deploy`, branch previews via `npx wrangler versions upload`. Build token `blackshear-pta-builds` is created and held by Cloudflare - nothing to store in GitHub. Since 2026-10-22 the build token belongs to the admin account's login instead ([A36](#phase-0---accounts--scaffold) step 4, [F60](#f60))
- [x] **A5**: Deploy end-to-end - `CLAUDE` + `JON` - **✅ Closed 2026-10-15:** a merge to `main` has deployed the live site since 2026-09-24, and branch builds upload preview versions. The one stall was fixed in [F51](#f51). First `main` build 2026-08-30; branch builds proven on [PR #1](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/1)
- [~] **A6**: Site-wide `noindex` - `CLAUDE` - Keeps the new site out of search engines until Weebly is retired ([A29](#phase-2---real-site)). It lives in **three** places, and cutover must remove all three, not before ([F52](#f52)):

  - `public/_headers`: the `X-Robots-Tag` header, for files served directly
  - `BaseLayout.astro`: the `<meta name="robots">` tag
  - `src/worker.ts`: `withSiteHeaders`, for the pages rendered on demand
- [x] **A7**: Cloudflare Web Analytics - `JON` - **Done, and it was already done.** Enabled automatically when the zone was added; automatic setup injects the beacon at the edge, so no snippet in `BaseLayout.astro` and nothing to maintain. Free, cookieless, no consent banner. Confirms in passing that edge injection still works with `assets.run_worker_first`, which was an open question. It is also the source of [F27](#f27)
- [~] **A36**: Cloudflare account ownership - `JON` - Make sure Cloudflare does not hang on one login. A Cloudflare account has no single owner; every Super Administrator has equal control.

  1. [x] Invite `communications@` and the break-glass account as **Super Administrator - All Privileges** (2026-10-05). Both accepted.
  2. [x] Rename the account *Blackshear PTA* ([PR #45](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/45)), and set the billing email to the central IT address (2026-10-05).
  3. [x] **Two-factor on both new logins** (My Profile → Authentication), with authenticator apps (2026-10-22). The admin account's setup key and backup codes go in the envelope and the vault ([B22](#google-workspace-for-nonprofits), [B33](#google-workspace-for-nonprofits)).
  4. [x] **Move the Workers Builds token to the admin account** (2026-10-22): signed in as it, Workers & Pages → `blackshear-pta` → Settings → Build → API token → *Create new token*. The next build's Worker version was uploaded by the admin account, so it works ([F60](#f60)).
  5. [x] Done 2026-10-22 (Jon). Signed in as the original PTA Gmail login: My Profile → API Tokens → delete `blackshear-pta-builds`, which nothing uses now.
  6. [ ] **Retire the PTA Gmail's Cloudflare login** (Jon, 2026-10-23: go ahead). The admin account and `communications@` are Super Administrators too, so nothing depends on this one. Checks first, then the removal, all signed in as the admin account.

  **Before**

  7. [ ] Workers & Pages → `blackshear-pta` → Settings → **Build**: *API token* is the admin account's (step 4), and *Git repository* shows `Blackshear-PTA/blackshear-pta-website`. Cloudflare ties that connection to the GitHub app installed on the organization (installed 2026-08-30, all repositories), not to whoever set it up.
  8. [ ] Manage Account → **Notifications**: change any destination that is the PTA Gmail to the admin account.
  9. [ ] Nothing else to move: the billing email is already the admin account (step 2), the payment method belongs to the account rather than to a login, and the local token belongs to the account (F60).

  **Retire**

  10. [ ] Manage Account → **Members** → the PTA Gmail's row → **⋯ → Remove member** → confirm.
  11. [ ] `CLAUDE` checks the next build: the *Workers Builds* check passes, and the new Worker version's author is still the admin account ([F60](#f60)).

  - **To undo:** invite the PTA Gmail again from Members. Removing it does not delete the login itself; deleting that is optional and can wait.

  - **Jon's decision, 2026-10-22: the admin account owns the PTA's outside services** ([B5](#google-workspace-for-nonprofits)), so the earlier plan to change this login's email to `webmaster@` is dropped. Workers Builds accepts only user tokens, so its token became the admin account's rather than an account token ([F60](#f60)). The account **ID** pinned in [CLAUDE.md](CLAUDE.md) does not change.
  - **Local API token rotated 2026-10-22** ([F60](#f60)). The user token `jf-website`, whose value had appeared in two session transcripts, was replaced by the account API token `blackshear-pta-wrangler`, which belongs to the account rather than to any login. `jf-website` was then deleted and its old value checked dead, the two shell-profile backups that held it were removed, and so was the cf-terraforming token left in the Keychain since 2026-09-03 (already dead). Same permissions as before except *Workers Builds Configuration*, which an account token cannot use.
  - **Nonprofit pricing:** none applies, and the free plan covers everything this site uses.
  - After [C9](#track-c---domain-dns-email), the domain registration lives in this account too.
- [~] **A37**: GitHub organization ownership - `JON` - `Blackshear-PTA` has four owners: the PTA's own account (`blackshearpta-legacy`), the Communications and break-glass role accounts, and Jon's personal `jon-flowers`. The repository belongs to the organization, so nothing needs transferring.

  1. [x] Add `communications@` and the break-glass account as owners, each with its own GitHub account (decided by Jon and done 2026-10-05).
  2. [x] Done 2026-10-22 (Jon). **Two-factor on every owner account**, with authenticator apps. The PTA and break-glass accounts' setup keys and recovery codes go in the envelope. Which accounts still lack it is deliberately not written here, because this file is public.
  3. [x] **Decided 2026-10-23 (Jon): retire it.** The steps are 6 to 12. Decide whether to keep the PTA account (`blackshearpta-legacy`), now that the admin account owns the PTA's services (Jon, 2026-10-22, [B5](#google-workspace-for-nonprofits)) and has its own GitHub account as an owner (step 1). Retiring it means first moving the `/admin` editor's GitHub token, which belongs to it ([D12](#open-decisions)). *This replaces adding `webmaster@` as its email, which was never done.*
  4. [x] Passed 2026-10-22, on the third check: the API shows every member and outside collaborator with two-factor. `CLAUDE` confirms through the GitHub API that every owner has two-factor.
  5. [x] Done 2026-10-23 (Jon), and confirmed through the API: the requirement is on and no member lacks two-factor. **Only then:** Organization → Settings → Authentication security → **Require two-factor authentication**. GitHub removes every member without it the moment this is turned on.

  **Retiring the PTA account** (Jon, 2026-10-23)

  6. [ ] **Who applied for GitHub for Nonprofits** ([B7](#google-workspace-for-nonprofits))? If it was the PTA account, leave step 12 until B7 is settled, in case GitHub's answer goes to the applicant.
  7. [ ] **A new token for the Instagram list, under the admin account.** Signed in as it: avatar → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token. Name `blackshear-pta-instagram`; resource owner **Blackshear-PTA**; *Only select repositories* → `blackshear-pta-website`; **Contents: Read and write** and nothing else; expiration **No expiration** ([D12](#open-decisions)). An owner's token is approved automatically. If *No expiration* is not offered, the organization has a maximum-lifetime policy: Organization → Settings → Personal access tokens.
  8. [ ] Cloudflare, signed in as the admin account: Workers & Pages → `blackshear-pta` → Settings → **Variables and Secrets** → `GITHUB_TOKEN` → edit, paste the new token, deploy. It goes nowhere else.
  9. [ ] Test it: in `/admin`, save the Instagram list once. `CLAUDE` checks the commit on `main` is authored by the admin account's GitHub user, then updates [docs/ADMIN.md](docs/ADMIN.md) and D12 to name it as the token's owner.
  10. [ ] Signed in as the PTA account: delete its old fine-grained token (the same menu as step 7).
  11. [ ] The organization's billing email is still the PTA Gmail: change it to the admin account. `CLAUDE` can make that one API call on Jon's word.
  12. [ ] Organization → **People** → the PTA account → **Remove from organization**. Three owners remain, all with two-factor.

  - **Nothing else hangs on it** (checked 2026-10-23): no branch protection or rulesets name it; the Cloudflare app is installed on the organization, not on this account; and its only commit is the merge of PR #31, which stays in the history either way.
  - **The account itself** can be deleted once step 12 and B7 are done. Until then it sits unused, with its login in the vault.

  - **Check two-factor with the API, not with the recovery codes.** On 2026-10-22 three owner accounts had recovery codes saved in a password manager, yet GitHub's settings and its API both showed two-factor off; why is unknown. Step 4 is what caught it.
  - **Do not delete or rename the PTA account before step 10.** Until step 8, the `/admin` editor's GitHub token belongs to it ([D12](#open-decisions), [docs/ADMIN.md](docs/ADMIN.md)).
  - **At handoff,** the next Communications volunteer joins with their own personal GitHub account as an owner, and `jon-flowers` is removed.
  - *Considered and set aside:* Claude had recommended reaching GitHub only through the PTA account, citing GitHub's one-free-account-per-entity term. Jon chose direct owners (2026-10-05).
- [ ] **A38**: Find everything else registered to the PTA Gmail - `JON` - Each service that still signs in as the PTA Gmail depends on one shared password. Known so far: Cloudflare ([A36](#phase-0---accounts--scaffold)), GitHub ([A37](#phase-0---accounts--scaffold)), Google for Nonprofits (done) and the parents' calendar ([B27](#google-workspace-for-nonprofits)).

  1. [ ] `CLAUDE` runs the search in `hello@` through Claude in Chrome (Jon, 2026-10-23): Jon signs in to `hello@` in Chrome, and Claude reads only the search results. Search the PTA Gmail, or `hello@` now that its history is copied there, for `"verify your email"`, `"welcome to"` and `"account created"`.
  2. [ ] List here what turns up, without passwords. Seen in the inbox so far: Zeffy, SignUpGenius and Animoto. Likely also Weebly, social accounts and design tools.
  3. [ ] For each one that matters, add a second admin, then move the login to a role address.
  4. [ ] Save the central ones in the password manager ([B33](#google-workspace-for-nonprofits)).
- [ ] **A39**: A room parent dashboard - `JON` + board + `CLAUDE` - Raised at the exec board meeting 2026-10-06. Needs details from the Room Parent Coordination chair (`roomparents@`) before anything is built.

  1. [ ] Ask the chair: who uses it, the coordinator only or every room parent? What does it show: classes and their room parents, sign-ups, events, contact lists, open needs? Where does that data live today: spreadsheets, SignUpGenius, email? Who keeps it updated?
  2. [ ] Choose a form: (a) a Google Sheet or Looker Studio view inside Workspace, shared with room parents, which is quickest and needs no code, and is the default; (b) a page behind the site's `/admin` sign-in; or (c) a Google Site.
  3. [ ] Build it.

  - **Privacy shapes everything:** class lists hold children's and families' details, so it can never be a public page.
- [ ] **A40**: New copy for the Little EAST page - `JON` + board (the Little EAST chair) + `CLAUDE` - Refresh [blackshearpta.org/little-east](https://blackshearpta.org/little-east) with the chair's 2026 copy.

  1. [x] `CLAUDE` drafted a fill-in doc, *Little EAST page: new copy for the website*, setting each part of the live page beside a blank *Your version* column (2026-10-06).
  2. [x] Jon shared it with `littleeast@`.
  3. [ ] The chair fills it in: 2026 details, links, photos (only with permission), and whether to list `littleeast@` as the contact.
  4. [ ] `CLAUDE` turns it into one PR against the `little-east:` block in `src/content/pages.yaml`, which takes a title, a one-line intro, paragraphs, one button, year sections of links and names, and a contact.

  - **Prioritized by Jon, 2026-10-21** ([U21](#-do-this-week)). The next move is the chair's (step 3).

### Phase 1 - Theme demo and board vote *(complete)*

- [x] **A8**: ~~"Coming soon" page at `/`~~ - `CLAUDE` - **Superseded.** `/` now serves the real Civic Letterpress A homepage ([A19](#phase-2---real-site)). The whole zone is still `noindex` ([A6](#phase-0---accounts--scaffold)) and Weebly is still canonical until cutover, so nothing is prematurely public - but a placeholder no longer buys anything
- [x] **A9**: Extract copy from Weebly into `src/content/home.yaml` - `CLAUDE` - **✅ Closed 2026-10-15:** the homepage has carried this copy since [PR #1](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/1). Real copy and real links, with meeting dates from the 2026-2027 calendar rather than Weebly's year-old ones ([F18](#f18))
- [x] **A10**: Salvage the four usable photos from Weebly - `CLAUDE` - In `assets/from-weebly/`
- [~] **A11**: Brand marks - `CLAUDE` + `JON` - The header's yellow jacket is drawn as SVG geometry (`src/components/BuzzMark.astro`), so each theme can color it.

  1. [x] Build the themeable mark.
  2. [ ] **Board decision:** does the PTA front with the school's marks or its own lockup? It matters for donations and tax receipts, because the PTA is a separate legal organization ([F11](#f11)).
- [x] **A12**: Theme token architecture - `CLAUDE` - Registry pairs each theme with a structure so a token-only recolor cannot ship by accident. 4 structures, ~40 `--pta-*` tokens, sections read tokens only
- [x] **A13**: ~~Six themes~~ → **three** - `CLAUDE` - Built six, each with its own self-hosted typeface pairing. The board cut to two, then Civic split into A and B. The four that lost are out of the working tree but still in git history
- [x] **A14**: Instant switcher at `/preview` - `CLAUDE` - Now a **reference page**, not a ballot: it no longer asks for a vote, and the chosen design is tagged as such. All three render, two `display:none`. Choice persists, `?theme=` is shareable, and `?theme=civic-letterpress` still resolves to A so links shared before the split keep working. Only the visible theme's fonts download
- [~] **A15**: Mobile QA + WCAG AA audit - `CLAUDE` + `JON` - The automated checks pass: `npm run check:contrast` (36 checks, 0 failing), no horizontal scroll at 375px, and touch targets of at least 44px except links inside running text, which WCAG exempts ([F20](#f20)).

  1. [ ] **A real-phone pass.** Everything so far was emulated or measured in a browser.
- [x] **A16**: Provision D1 - `CLAUDE` + `JON` - **✅ Done 2026-09-14, in production since 2026-09-24.** Database `blackshear-pta` (`5a9a4520-…`), created on the PTA account; schema and the import of the original five posts are in `migrations/`, applied to both local and remote. Holds `posts` and `edits` - see [A41](#phase-2---real-site) and [F41](#f41). Was written as "deferred, not dropped - nothing in Phase 2 needs a database", and that stopped being true the moment publishing latency became the problem: the editor wanted something beyond git, exactly as this task anticipated. Free tier is 5GB and 5M row reads a day; the whole table is ~53KB
- [x] **A17**: ~~`/api/feedback` vote capture → D1~~ - **Superseded.** The vote concluded over email and in person before this was worth building. The Worker→D1 smoke test it doubled as moves to A16
- [x] **A18**: Send the preview link to the board and collect votes - `JON` - Done. Result: Civic Letterpress A

### Phase 2 - Real site

*Started 2026-08-31. Ordered roughly by dependency: the page set has to exist before cutover is meaningful, and the admin editor has to exist before the site can survive handoff.*

- [x] **A19**: Promote Civic Letterpress A to `/` - `CLAUDE` - Homepage renders the chosen design; the `/ → /preview/` vote redirect is deleted. `siteThemeId` (the live site's design) is now a separate export from `defaultThemeId` (which panel `/preview` opens on), so pointing the preview at a reserve cannot silently re-skin the homepage. B and Print Shop still build and still pass the contrast gate
- [x] **A20**: **Build the page set** - `CLAUDE` + `JON` - Page list confirmed 2026-08-31. Pages are content, not code: a top-level key in `src/content/pages.yaml` publishes a URL, so adding one needs no code change. Copy is **lifted from Weebly to match current state**, with a rewrite pass deferred.
  - [x] `/little-east` - year-by-year archive. Four broken or mislabeled links corrected or dropped ([F21](#f21))
  - [x] `/sponsors` - Fundraising committee lands here. Full tier list; see [F22](#f22) for the Family Buzz question
  - [x] `/staff-appreciation` - **no Weebly page existed**; built from the homepage blurb and a Drive PDF ([F23](#f23))
  - [x] `/campus-beautification` - **no Weebly page existed**, and it was called "Garden"; renamed throughout ([F23](#f23))
  - [x] `/volunteer` - AISD Voly, interest form, activity sheets. Three Weebly links pointed at one wrong PDF ([F24](#f24))
  - [x] `/contact` - board roster, principal, address. **Individual emails are Cloudflare-obfuscated on Weebly and could not be read**, so everything routes through the PTA address until Jon supplies them. Roster privacy: [F22](#f22)
  - [x] `/calendar` - Google stays the source ([D10](#open-decisions)); the iframe is gone. Events are **baked at build time** from a committed snapshot, refreshed daily by a GitHub Action - see [F25](#f25) for why not live. 139 upcoming events, grouped by month, with "add to your calendar" for Google, Apple and Outlook
  - [x] `/gallery` - photo grid plus an Instagram link, per [D11](#open-decisions). **Thin on purpose**: nine photos, mostly the campus. It is a frame waiting for [A28](#phase-2---real-site)
  - [x] **Nav is fully internal.** Volunteer, Calendar, Little EAST, Sponsors and Contact all point at this site. "Join" is a Zeffy store link and stays external by design
- [x] **A21**: Cloudflare build watch paths - `JON` - **✅ Closed 2026-10-15:** set on 2026-09-02 ([U9](#-do-this-week)). The exclude list, including `scripts/**`, is in [`docs/DEPLOYS.md`](docs/DEPLOYS.md)
- [ ] **A22**: Switch `.com`/`.net` redirects from 302 → 301 - `JON` - **At cutover only.** They are deliberately temporary today; a 301 gets cached by browsers and intermediaries and is effectively unrecallable
- [~] **A23**: `/admin` editor behind Cloudflare Access - `CLAUDE` + `JON` - Built and live, for announcements. A save writes to the D1 database and is live immediately ([A41](#phase-2---real-site), [F41](#f41)).

  1. [x] Access application and secrets configured (2026-09-02), and tested end to end against the old git path ([U12](#-do-this-week)).
  2. [x] Google sign-in instead of one-time PIN ([B6](#google-workspace-for-nonprofits)), 2026-10-15.
  3. [ ] The first real save in production ([A42](#phase-2---real-site)).

  - **History and undo:** every save is recorded in the `edits` table, shown on the page as a **History** panel, and a deleted post is kept whole there.
  - **Identity:** the Worker re-verifies Cloudflare's signed token itself, so the recorded editor is a verified address.
  - Page copy and the homepage are still edited by hand; widening the editor means another route and form, not a rewrite.
- [x] **A24**: Photos on announcements, stored in R2 - `CLAUDE` + `JON` - **Done.** Several photos per post with one nominated as the cover; the rest form a gallery on the post page. Drag-and-drop or click to add, and every photo goes through a crop step that shows the exact 3:2 frame before anything is uploaded - a portrait shot otherwise becomes a band across someone's middle with nobody having seen it. Shrunk in the browser first, which also removes the EXIF GPS a phone photo carries. Alt text required in three places. Crop geometry is a tested pure function ([F32](#f32))
- [x] **A25**: Announcements, feed and post pages - `CLAUDE` - **Done.** Every post has its own page at `/announcements/<slug>`; the index lists them all and `/rss.xml` is a real feed pointing at those pages. Ordering and draft filtering live in one shared place so the four surfaces cannot disagree - now the SQL in `src/lib/posts.mjs`, where `listPublished()` cannot be asked to include a draft. Renamed throughout from "news" and "What's happening" so the nav, the homepage block, the page and the feed all call one thing by one name. **Storage superseded by [A41](#phase-2---real-site):** this originally read "one markdown file per post in `src/content/announcements/`", which was true until 2026-09-16. Posts are rows in D1 now; the markdown files are still in the repo but nothing reads them ([A43](#phase-2---real-site))
- [ ] **A26**: File hosting - handbook, The Beat, forms - `CLAUDE` + `JON` - **Needs from Jon: the actual files.** Today these are tinyurls to Weebly-hosted or Drive-hosted documents ([F19](#f19))
- [ ] **A27**: Link-out hub for SignUpGenius and the calendar - `CLAUDE` - Aggregate and link out, per [D8](#open-decisions). Replacement is a later phase evaluated on its own
- [ ] **A28**: **Photo library** - `JON` - Only four real photographs exist ([F6](#findings)); the rest of the Weebly library is flyers and sponsor logos. **Needs 15-20 real photos** from Instagram and the board. This gates how good the page set can look more than any code does
- [x] **A30**: ~~**Pre-launch gate**~~ - `CLAUDE` + `JON` - **REMOVED 2026-09-16 ([A33](#phase-2---real-site)).** Lived 2026-09-01 to 2026-09-16. Kept for the record: One shared password for the e-board, so anyone who wanders onto the domain early gets "under construction, here is our current site" rather than a half-built PTA site they take for real. A small Worker (`src/worker.ts`) in front of the static assets; cookie lasts 30 days. **The password is deliberately not in this repo** - the repo is public, so a committed password is no password. Not a security boundary and not meant to be: treat everything behind it as public
- [x] **A31**: **Split the documentation** - `CLAUDE` - The root `README.md` was a developer document sitting where a board member would look first, and it still described the repo as an empty scaffold with placeholder themes. It is now written for a non-technical reader: what the site is, how it works in plain terms, which file holds which words, and who to ask. Everything technical moved to `docs/`, split by concern, with an index at [`docs/README.md`](docs/README.md). Point of the exercise is bringing more people in - somebody arriving cold should not have to read about `run_worker_first` to find out what this is
- [x] **A33**: ~~**Remove the pre-launch gate**~~ - `CLAUDE` + `JON` - **✅ LIVE 2026-09-24.** Version `10182fa6` deployed and verified on `blackshearpta.org`: every route 200, `/under-construction/` 404, org identity on the homepage, announcements serving from D1 for the first time. Took the [F51](#f51) deploy fix to actually ship. The pipeline had been failing since before [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36), so `blackshearpta.org` kept serving the old gated build for six days. Fix is in flight. Code-complete 2026-09-16: `blackshearpta.org` now serves the real site to anyone, with no password and no construction notice. Driven by [B4](#google-workspace-for-nonprofits): Google could not verify the domain against the organization while the only reachable page was a construction notice pointing at Weebly ([F48](#f48)). Gate logic out of `src/worker.ts`, `src/pages/under-construction.astro` and `docs/PRE-LAUNCH-GATE.md` deleted, stale references cleaned out of six other files. **The Worker stays** - see [F49](#f49). Registration identity now renders on the homepage (`OrgIdentity.astro`) and in the site-wide footer. **`noindex` is deliberately still on** ([A29](#phase-2---real-site)). Jon can delete the now-unused `SITE_PASSWORD` secret from the Cloudflare dashboard at leisure
- [x] **A34**: Move the site's public contact address onto the domain - `CLAUDE` - `blackshearpta@gmail.com` is published in 11 places: the `site.yaml` footer, `home.yaml` ×2 and `pages.yaml` ×8. It also appears in `README.md`, `docs/EDITING-CONTENT.md` and `docs/CALENDAR.md`. Switch them to one public address, in one PR. **The address is `hello@`** ([B25](#google-workspace-for-nonprofits)), the central account that replaces the PTA Gmail, delegated to `communications@` and `president@`, so parent mail reaches the right people and survives turnover. **✅ Live 2026-10-05.** [PR #44](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/44) was merged, and the live `/`, `/contact/` and `/sponsors/` show `hello@` with no Gmail address left. It was opened, after Jon confirmed `hello@` receives both direct and forwarded mail. It switches all 11 published references plus the README's two "send it to" lines; the build has no Gmail address left in it. **Follow-up once their owners have signed in ([B29](#google-workspace-for-nonprofits)):** sponsors → `fundraising@`, staff-appreciation → `staffappreciation@`, campus-beautification → `garden@`. **Only after** that address has received a test message and [B12](#google-workspace-for-nonprofits) is done, because a published address that bounces or lands in spam is worse than the Gmail. The PTA Gmail stays as the account-recovery address, just not a public one
- [x] **A35**: Check mail authentication automatically - `CLAUDE` - **✅ Done 2026-10-15:** `npm run check:mail`, registered in `dev check`. [F43](#f43) went unnoticed for a month because nothing looked. Against public resolvers, it checks that MX is all Google, SPF is a single record with every include resolving and at most 10 lookups, `google._domainkey` publishes a key, and DMARC has a real policy with reports going to a PTA address. Passing on the live domain; tested failing against a domain without them.
- [x] **A41**: **Announcements out of git and into D1** - `CLAUDE` - **✅ Live 2026-09-24.** [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36). Publishing went from 60-90 seconds to instant: posts are rows in D1 ([A16](#phase-0---accounts--scaffold)) and the four routes that render them (`/`, `/announcements/`, `/announcements/<slug>/`, `/rss.xml`) render on demand. Both halves were needed - the delay was the rebuild, not the storage. At most one post can be pinned, enforced by a partial unique index rather than by the client hoping; both old `.refine()` rules are triggers; a save writes only the fields it is sent, so omitting `pinned` can no longer unpin a post. URLs are unchanged because slugs are stored, not regenerated. `npm run check:d1` runs the real migrations against real SQLite and is registered in `do_check` - fourteen gates. **It cost three follow-on defects, all of the same shape** ([F41](#f41), [F51](#f51), [F52](#f52), [F55](#f55)): moving a route from build time to request time silently withdraws every build-time service it was using
- [x] **A42**: Test saving a post through `/admin` on the live site - `JON` - **✅ Done 2026-10-15.** Google sign-in ([B6](#google-workspace-for-nonprofits)) went live 2026-10-15, so the test runs on the login the board will use. Reading posts is verified on the live site; saving has never been done there.

  1. [x] Write a throwaway post (2026-10-15). The live history shows it created by `communications@blackshearpta.org`, signed in with Google.
  2. [x] Reload `/announcements/` and confirm it is there, with no rebuild.
  3. [x] Delete it (2026-10-15).
  4. [x] Check the **History** panel shows both, with your address. The live history shows the create at 19:54 and the delete at 20:13 UTC, both by `communications@`.

  - **Found during the test, fixed in [PR #48](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/48):** bulleted and numbered lists showed as plain lines on the post page and links looked like ordinary text, because the site's base styles strip both and the post page never restored them. The list button did nothing on an empty line, and Enter did not continue a list. The "What is this page?" box was also reworded (Jon).
- [x] **A43**: Delete the five unused announcement files - `CLAUDE` - **✅ Done 2026-10-15**, after [A42](#phase-2---real-site). `src/content/announcements/*.md` are a frozen copy from 2026-09-16 that nothing reads, and the next person to edit one will wonder why the site does not change. They are also the last local copy, which is why A42 comes first.

  1. [x] Delete the five files, and the `announcements` collection in `src/content.config.ts`.
  2. [x] Delete `scripts/build-import-migration.mjs` and its `npm run build:import`, which read that folder to build the one-time import. Git history keeps it, and `migrations/0002` is unchanged.
  3. [x] Fix the comment in `src/content/home.yaml` that still says posts live in markdown files.
- [ ] **A44**: Back up the announcements regularly - `JON` - Posts now live in a database, which no git clone backs up.

  1. [ ] Every month or two, and before anything risky, run `npm run export:posts -- --remote`. It writes every post as markdown, plus the edit history as JSON, into the gitignored `exports/` folder.
  2. [ ] Keep a copy off this computer.

  - Worth automating later, for example with a monthly GitHub Action committing to a private repository, but the habit matters first.
- [ ] **A46**: Catch the announcements up with what the PTA has already published - `JON` + `CLAUDE` - Recent news has gone out as the Weekly Buzz, Instagram posts and newsletters, but not as announcements on the site. Added 2026-10-21.

  1. [ ] Jon points `CLAUDE` at the recent pieces: Weekly Buzz issues, Instagram posts, newsletters and anything else sent since the site went live.
  2. [ ] `CLAUDE` drafts one announcement for each piece worth keeping: a title, a few sentences and a link to the original.
  3. [ ] Jon publishes them through `/admin`, which `CLAUDE` cannot reach ([U12](#-do-this-week)).

  - Worth making a habit afterwards: each new Buzz or newsletter gets a short announcement the same week.
- [ ] **A47**: Talk to Ms. Bell about helping her with the campus website - `JON` - The school's own website, which is separate from this PTA site and run through AISD. Added 2026-10-21.

  1. [ ] Ask Ms. Bell what help she wants with it.
  2. [ ] Find out what AISD access that takes, and who at the district grants it.
- [~] **A48**: Send blackshearpta.org back to the old Weebly site, for now - `JON` + `CLAUDE` - Decided by the exec board 2026-10-22: the Weebly site stays the PTA's public face until the new site's content is filled in and checked. Flyers with blackshearpta.org went out that evening.

  1. [x] `CLAUDE` builds it ([PR #57](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/57), 2026-10-22): every page on blackshearpta.org and `www` answers a temporary (302) redirect to its Weebly counterpart. `/` goes to Weebly's homepage, and `/little-east`, `/sponsors`, `/volunteer`, `/contact` and `/calendar` to Weebly's page of the same name; anything else goes to the homepage. It is never cached, and it is not a 301 because browsers remember those ([A22](#phase-2---real-site)).
  2. [x] Merged 2026-10-22 (Jon), before the evening's event.
  3. [x] Checked live 2026-10-22, by request ([F55](#f55)): `/`, `/little-east` (with and without the slash), `/sponsors`, `/volunteer`, `/contact` and `/calendar` answer `302` to their Weebly pages with `no-store`; `/gallery` and `/announcements` go to Weebly's homepage; `www.` redirects too, and `blackshearpta.com/little-east` ends on Weebly's Little EAST page. `/rss.xml` still answers 200, `/admin/` still goes to the Google sign-in, and the workers.dev address still serves the new site.
  4. [ ] **When the board is ready for the new site:** set `WEEBLY_REDIRECT` to `false` in `src/worker/weebly-redirect.ts`, merge, and check that `/` answers `200` again.

  - **Left working:** `/admin`, announcement photos and files such as `/rss.xml`. The board reviews the new site at `https://blackshear-pta.blackshearpta.workers.dev/`, which does not redirect, and saves through `/admin` show there.
  - **No pages were removed**, so turning the redirect off brings everything back. `noindex` stays on ([A6](#phase-0---accounts--scaffold)), and Weebly stays canonical until cutover ([A29](#phase-2---real-site)).
  - It began in the task board's inbox as a redirect for `/little-east` alone, and was widened to the whole site the same day (Jon).
- [ ] **A32**: **Email notifications for new announcements** - ⏸️ **Tabled 2026-09-04** - `JON` - Jon: "worried it's too complicated". RSS stays on the page meanwhile. Revisit when there is a reason to.

  - **Why it is hard:** every option holds parents' email addresses. Self-hosting, the one that fit the constraints, also means running double opt-in and unsubscribe ourselves, and touching the DNS that carries the PTA's mail ([D12](#open-decisions)).
- [~] **A29**: **Cutover** - `JON` + `CLAUDE` - Make the new site the PTA's only website. The pre-launch gate is already gone ([A33](#phase-2---real-site)), so the site is public.

  1. [ ] Retire Weebly. It needs the login, which nobody has found yet, and the board's OK.
  2. [ ] **Only after that,** remove `noindex` from all three places ([A6](#phase-0---accounts--scaffold)). Two indexed copies of the same content is a ranking mess to unwind.
  3. [ ] Switch the `.com` and `.net` redirects to 301 ([A22](#phase-2---real-site)).
  4. [ ] Submit a sitemap to Google.

  - **Before `noindex` comes off,** the board should settle [F22](#f22): children's names on `/sponsors`, and children's names and grades on `/contact`, become searchable.
  - **Don't** follow the old instruction to delete `src/worker.ts`: the Worker now runs `/admin`, photos and the on-demand pages ([F49](#f49)).

### Phase 3 - Members

*The member manager comes first. Member accounts, only if still wanted, would sign in against its list: magic-link auth via an established library over D1 · no passwords · Durable Objects for anything realtime.*

- [ ] **A45**: **Build a member manager** - `JON` + `CLAUDE` - One place for the member list, personal emails, dues paid, the fine arts fee paid and the rest, replacing the several lists kept by hand today, and feeding every other system that needs it. Asked for by Jon 2026-10-21.

  **Find out what exists**

  1. [ ] List every place member data is kept today, who keeps it, and how often it changes: the membership export [B28](#google-workspace-for-nonprofits) loaded, Zeffy's records, the treasurer's books, room-parent lists and any other spreadsheet.
  2. [ ] For each, note the fields it holds, and which source wins when two disagree.
  3. [ ] Pin down the money: what dues and the fine arts fee cost, whether each is per adult, per family or per child, which Zeffy forms take them, and how cash and check payments get recorded.
  4. [ ] Find out how members are reported to Texas PTA, and whether that system takes an import.

  **Decide**

  5. [ ] Settle where the list lives and who may open it ([D18](#open-decisions)).
  6. [ ] Agree the smallest set of fields that does the job, and take it to the board. It is family contact data, the risk [D4](#open-decisions) warns about.

  **Build**

  7. [ ] Tables for households, people, payments, and children only if step 6 keeps them. Every payment belongs to a school year.
  8. [ ] A members page for the board: search, filter by paid or unpaid this year, edit, and import and export CSV. Only a named group of officers can open it.
  9. [ ] Load the sources from step 1, merge the duplicates, and review the result with Jon.

  **Connect it**

  10. [ ] **Zeffy:** dues and fine arts fee payments arrive by themselves if Zeffy offers an API, webhook or Zapier trigger; otherwise import its export.
  11. [ ] **`members@`:** keep the group matched to paid members, adding newcomers and removing lapsed ones, which replaces B28's yearly refresh by hand. Automatic once [D15](#open-decisions) is settled; until then the page writes the bulk-upload CSV.
  12. [ ] **Texas PTA:** an export in whatever form step 4 finds.
  13. [ ] **Treasurer:** a payments export to reconcile against the bank, or a Sheet in the PTA Shared Drive kept current.
  14. [ ] **Room parents:** class lists by teacher for the room parent dashboard ([A39](#phase-0---accounts--scaffold)), if step 6 keeps children.

  - **Parent data never goes in this repo**, which is public. It lives only in the database or in Workspace, as B28's addresses do.
  - **Back it up** the way [A44](#phase-2---real-site) backs up posts, and decide how long a lapsed member's record is kept.
  - **Plan the yearly rollover:** a new school year starts everyone unpaid without losing last year's record.
  - **More connections later**, once these work: volunteer sign-ups, and the site's Join button.

---

## Open decisions

| # | Decision | Status | Notes |
|---|---|---|---|
| D1 | **Content editing for future boards** | ✅ **Decided** | Markdown in git + custom `/admin` behind Cloudflare Access with Google SSO. Approved 2026-08-28, conditional on GitHub being free - it is (see [F9](#f9)) |
| D2 | **Credential sharing across the board** | ✅ **Decided** 2026-10-16 | **KeePassXC: one encrypted file in a PTA-owned Shared Drive**, decided by Jon after Passwd's free plan proved unusable for real passwords ([F57](#f57)); to report to the board. Setup is [B33](#google-workspace-for-nonprofits). *Considered:* Passwd Professional (about $4 per user a month, perhaps half with a nonprofit discount), set aside because a paid plan can lapse; a Bitwarden-compatible server on Cloudflare Workers (NodeWarden cannot share between people at all); Vaultwarden on a cloud server, which would share properly, but AWS's free plan for new accounts ends after six months and erases the account's resources if not upgraded, and any server needs patching, certificates and backups; and Bitwarden's free organization, two people only. **Earlier record, before 2026-10-16:** **New facts, 2026-10-16 ([F57](#f57)):** Passwd's free Starter plan cannot hold the PTA's real passwords, and its plans table shows no sharing inside the organization, so the choice below cannot be carried out as made. Options: Passwd Professional, paid per user (about $4 per user a month before a 50% nonprofit discount Passwd advertises), or another manager. The decision as it stood: **Adopt a password manager: Passwd**, decided by the exec board. Setup is [B33](#google-workspace-for-nonprofits). **Why Passwd:** it is built for Google Workspace, with Google sign-in and sharing through Google Groups. Its free Starter plan allows unlimited users and up to 15 saved logins, enough for the PTA's central logins. Paid plans start around $19 a month for the organization. **Self-hosting was considered and set aside** (2026-10-06). Bitwarden's own server is open source, but it needs a server Cloudflare cannot run. Small community projects, *warden-worker* and *NodeWarden*, do run a Bitwarden-compatible server on Cloudflare's free tier, using Workers and D1. They would work, but they are hobby code with no security audit, maintained by one or two people. They can break when Bitwarden updates its apps, and the vault would sit in the same Cloudflare account as the website. For the one system that holds every other password, a volunteer-run copy is the wrong trade, and it would be the hardest thing to hand to a non-technical successor. This keeps the original rule: **do not self-host a vault**. **Other options noted:** Bitwarden's free organization (two people only); paid Bitwarden Teams (about $4 per user a month) and 1Password Teams (about $20 a month for up to 10), both reportedly discounted for nonprofits on request. Google Password Manager and a shared document are unsuitable. **The sealed break-glass envelope stays** as the offline backup, because a vault behind Google sign-in cannot help when Google sign-in itself is the problem |
| D3 | **Transactional email provider** (Phase 3) | ⏳ Deferred | Resend free tier, or route through Workspace once available |
| D4 | **Parent-to-parent messaging** | 🛑 Out of scope | Needs the board *and* the school in the room. An unmaintained brochure site is stale; an unmaintained messaging platform holding family contact data is a live incident |
| D5 | Demo on the real domain vs. `*.workers.dev` | ✅ **Decided** | Real domain, at `/preview`, whole zone noindexed until cutover |
| D6 | Cloudflare Access gate on the preview | ✅ **Decided** | Dropped for Phase 1 - friction kills vote participation and there's nothing confidential. Reinstated in Phase 2 for `/admin` |
| D7 | Registrar transfer timing | ✅ **Decided** | Defer to October. Renewal is 6 days out; a failed transfer near expiry risks losing the domain to save ~$20 |
| D8 | Replace SignUpGenius / ClassDojo / WhatsApp | ✅ **Decided** | Phase 2 aggregates and links out. Replacement is a later phase, evaluated on its own |
| D10 | **What is the source of truth for events** | ✅ **Decided** 2026-09-01 | **Google Calendar stays the source, and the site stops embedding it.** Site reads the public iCal feed and renders its own list. Full reasoning below |
| D11 | **What `/gallery` is** | ✅ **Settled** 2026-09-04 | Photo grid, plus up to six Instagram posts **chosen in `/admin`**. Went out and back: an automatic "latest 12" was built against the Meta Graph API and removed the same day. Displaying a post needs nothing; *discovering* recent posts needs a Meta app and a 60-day token, and `JON`: "that token would never be re-issued after I handed this off". The original D11 instinct was right, and the distinction it was missing is that only discovery costs anything. [docs/INSTAGRAM.md](docs/INSTAGRAM.md) |
| D12 | **How parents subscribe to announcements** | ⏸️ **Tabled** 2026-09-04 | RSS is on the page and is not the answer for most people. An email list is, but every option holds parents' addresses somewhere and they differ enough that the build is a different job for each: a self-hosted list on D1 plus a free sending tier, an off-the-shelf newsletter service, or a Google Group. Blocks [A32](#phase-2---real-site) |
| D12 | **GitHub token never expires** | ✅ **Decided** 2026-09-02 | An expiring token fails months later, breaks `/admin`, and nobody remembers why - which restarts exactly the staleness [F18](#f18) describes. Exposure is narrow: Contents-write on one already-public repo, no personal data, every change revertible. Compensating control is documentation, not rotation: owner, scope and revocation steps are in [docs/ADMIN.md](docs/ADMIN.md). Owned by the PTA account, not a board member's |
| D13 | **Does the Cloudflare setup move into Terraform** | ⏳ **Open - recommendation ready** | Investigated 2026-09-03, nothing applied. **Recommended: generate and commit the config, do not adopt state yet**, then adopt four resources only when a named trigger fires. Full analysis, inventory and the wrangler/Terraform boundary in [docs/TERRAFORM.md](docs/TERRAFORM.md). Waits on **D2** for the multi-person case; **B6** changed the state calculus on 2026-10-15: the Google sign-in's client secret would land in state in plaintext, so that provider stays a dashboard step and the snapshot records it with the secret left out |
| D14 | **Workspace account model** | ✅ **Decided** 2026-10-02 | **Role accounts for officers, groups for shared addresses**, as recommended. Officers (president, vp, secretary, treasurer, fundraising, room parents, communications) are real users that pass from one board member to the next, so mailbox, Drive and calendar history stay with the role through yearly turnover. Committee leads get addresses on the same terms: `garden@` and `staffappreciation@` from 2026-10-05. Shared addresses are Google Groups: `admin-notifications@` (`webmaster@` until 2026-10-22), `dmarc@` and `all@` (every PTA account, [B34](#google-workspace-for-nonprofits)) so far, maybe `board@` later. The one deliberate exception is `hello@`, a *user* account rather than a group, because it replaces the PTA Gmail as a real mailbox with history. It is shared through mail delegation, not a shared password ([B25](#google-workspace-for-nonprofits)). **For future intake addresses** that several volunteers answer, such as a `volunteer@` or `donations@` where it matters who replied, a group in **Collaborative Inbox** mode adds assignment and "done" tracking, worked from the Groups website rather than Gmail. At turnover a super admin resets the password and 2-Step Verification for the incoming officer, so no password is ever shared, which mostly settles [D2](#open-decisions) for Google. **Two central addresses, by purpose (Jon, 2026-10-05):** the break-glass account's address is the **central IT contact**, used for billing and service admin notices (Cloudflare's billing email from 2026-10-05). It forwards to `communications@`, so it is read. **Updated 2026-10-22 (Jon):** that account is also the owner of every outside service, kept as a *user* account because Google sign-in does not work with groups, and its mail now forwards to the `admin-notifications@` group ([B5](#google-workspace-for-nonprofits)). `hello@` is for **public communication** in and out. **Admin work happens on role accounts too:** since 2026-10-05 Jon works from `communications@` (super admin), so admin access passes with the Communications role at turnover. `jon@` is a temporary backup ([B24](#google-workspace-for-nonprofits)). Free under the nonprofit edition. Roll-out is [B14](#google-workspace-for-nonprofits) |
| D15 | **Give Claude scripted admin access to Workspace** | ⏳ **Open - recommendation** | Raised by Jon 2026-10-05. Today Jon clicks through the Admin console and Claude writes the steps and files, like the bulk-upload CSV. **Recommended: yes, but narrowly, using GAM**, the standard open-source command-line tool for Workspace admins. Set it up with **its own OAuth sign-in as a *delegated* admin account**: a custom admin role limited to Groups and user management, **not** super admin, and **not** domain-wide delegation, which can impersonate anyone. Claude then runs reviewable commands: dry runs first, and every change shown to Jon before it runs, under the normal permission prompts. **Not needed yet:** B28's first list is 83 addresses, which paste fine. **Worth it later for** a yearly membership refresh that syncs the group to a new export (adding newcomers and removing lapsed members), bulk group settings and audits. **Never worth it for** one-off clicks. Costs: about 30 minutes of setup in a Google Cloud project under the PTA's organization, and an admin token on Jon's machine that has to be revoked at handoff. The Admin console stays the documented path for the next board. Separately, the Cloudflare token could gain **DNS edit on this zone only**, so Claude could make records like B12's directly instead of Jon pasting them. Small risk, small gain |
| D16 | **An address for Little EAST** | ✅ **Decided** 2026-10-06 | **A user account, `littleeast@`**, decided by the exec board. It is held by the Little EAST chair and passed on with the role, like the officers' accounts. Created in [B31](#google-workspace-for-nonprofits). *Options considered:* **A user account** (`littleeast@`): its own mailbox, Drive and Calendar, held by the chair and passed on with the role, the same as the officers. **A group**: one address that copies mail to whoever is on the committee, with no login to hand over. **A collaborative inbox**: a group where incoming requests can be assigned to someone and marked done, worked from groups.google.com, useful if several volunteers answer the same questions. Choose by whether Little EAST mostly *receives requests several people answer* (collaborative inbox), *needs to reach a set of people* (group), or *runs its own documents and calendar* (user account). All three are free |
| D17 | **community@, suggested by Lennie** | ✅ **Decided** 2026-10-06 | **A Google Group, `community@`, with several members**, decided by the exec board. It works as a shared mailbox through Collaborative Inbox; set up in [B32](#google-workspace-for-nonprofits). *Still to settle:* what it is for: community partners, neighborhood outreach, sponsors, or something else. Then which kind of address. **A group** delivering to the people who handle it; **a collaborative inbox** if requests need assigning and tracking; or **a shared user account with delegation**, like `hello@`, if it needs its own mailbox history, documents or calendar, worked by several people from their own Gmail with no shared password. The difference between it and `hello@` should be clear before creating it, or the two will compete |
| D18 | **Where the member list lives** | ⏳ **Open - recommendation** | Raised by Jon 2026-10-21 for [A45](#phase-3---members). **Recommended: the site's own database, on a members page in `/admin`**, behind the same Google sign-in, with Cloudflare Access limiting it to a Workspace group of the officers who need it, such as treasurer, president and secretary. The sign-in, the database, the backup script and the edit history already exist from moving posts there ([A42](#phase-2---real-site)), and only code can keep `members@` and the Zeffy payments matched without someone copying rows. *Considered:* **a Google Sheet in the PTA Shared Drive**, with Apps Script for the connections: nothing to build or hand over, and any board member can fix it, but nothing stops a bad edit or the whole file being shared by mistake. **A paid membership platform**: a yearly cost, and one more login to pass on. **The risk either way is handoff**: custom code needs someone to maintain it after Jon, so the members page should also write a Sheet the board can always open |
| D9 | What happens to the losing designs | ✅ **Decided** | **Kept as reserves, not deleted.** They cost one CSS file each, still build, and still pass the contrast gate, so reversing the choice is a one-line change. `/preview` stays up as a labeled reference rather than a ballot. Retire them when the board stops wanting the option - the steps are at the top of `src/themes/registry.ts` |

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

<a name="f11"></a>
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
**F21 - Four of the Little EAST links on the current site are broken or mislabeled.** Found by actually following every one of them while lifting the copy, rather than assuming. (1) The 2023 auction link is written `tinyurl.com10thLittleEAST` - **no slash** - so it has never worked; the corrected URL resolves fine and is what the new page uses. (2) `tinyurl.com/11thLittleEAST`, labeled "2024 Silent Auction", actually goes to **a YouTube video**; relabeled. (3) `tinyurl.com/BlackshearLEPics`, labeled "photos", **downloads a Dropbox zip** rather than opening a gallery; the new page says so. (4) `biddingowl.com/blackshearlittleeast` (2022 auction) now redirects to BiddingOwl's own homepage - the auction is gone - so it is **dropped rather than carried over**. Shipping a link already known to be dead is worse than not shipping it. Reinforces [F19](#f19): opaque redirects nobody can audit without clicking.

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
**F4 - Account bootstrap is circular.** We want every account registered to `webmaster@blackshearpta.org`, but creating that address needs a Cloudflare account (or the Google config in F2). Resolution: create Cloudflare with `blackshearpta@gmail.com`, establish `webmaster@`, then change the Cloudflare account email. Cloudflare supports this with re-verification. **Superseded 2026-10-22:** services now register to the admin account, a Workspace user, and `webmaster@` became an alias of the `admin-notifications@` group ([B5](#google-workspace-for-nonprofits)).

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

<a name="f30"></a>
**F30 - One-time PIN is not enabled by default, and its absence surfaces as
three unrelated-looking bugs.** Cloudflare's docs are explicit: "OTP is no
longer added automatically." A Zero Trust account with no identity provider
configured makes Access fall back to requiring a **Cloudflare account** to sign
in - so `/admin` presented board members with "Sign in with Cloudflare" and then
the full Cloudflare login.

The same missing configuration also explains two things that looked like
symptoms of the 2026-09-01 Access degradation and were not: turning off **Accept
all available identity providers** revealed an *empty* dropdown, and **Apply
instant authentication** was greyed out because it requires exactly one login
method and there were zero. Only the vanishing application was the outage.

Two lessons. Setup guidance written from memory about a vendor dashboard is
worth roughly nothing - this file asserted the opposite of the documented
behavior and cost a round trip. And when a real outage is in progress it is
tempting to attribute everything odd to it; two of these three symptoms were
plain misconfiguration sitting in plain sight.

<a name="f31"></a>
**F31 - Access tells an unauthorised address that a code was sent.** Entering an
email that is not in the Access policy produces "A code has been emailed to you"
and no email. Cloudflare documents this as deliberate: revealing the difference
would let anyone enumerate which addresses are configured.

Correct behavior, and worth knowing twice over. It means an accidental attempt
with a non-listed address is a **positive test** that the allowlist is enforcing
- which is how the policy got confirmed working. And it means the most likely
cause of "the editor is broken" is a typo in the email, with the UI actively
implying otherwise. Triage order is in [docs/ADMIN.md](docs/ADMIN.md).

<a name="f32"></a>
**F32 - The preview pane cannot be trusted for measurement.** Three separate
attempts to verify the photo cropper through the browser produced numbers that
were about the pane rather than the code: a dialog reported as 6x6 that was
really 736x648, `getBoundingClientRect` returning stale geometry a frame behind
the state being tested, and blank screenshots of pages that render correctly.

The fix was not more retries. The crop arithmetic moved into `src/lib/crop.ts`
as a pure function and is now tested with `npm run check:crop` - 30 checks
covering shapes from a 4000x1 strip upward, confirming the frame can never
include empty space, the source rectangle never leaves the image, and its aspect
is always exactly 3:2. Negative-tested by sabotaging the clamp, swapping cover
for contain, and widening the rectangle 5%: 12, 10 and 14 failures respectively.

The general lesson is worth more than the specific one. When verification is
flaky, the answer is usually to move the logic somewhere it can be tested
deterministically, not to keep re-running the flaky check until it agrees.

<a name="f33"></a>
**F33 - Terraform cannot capture the deploy pipeline, and the binding hazard
runs the opposite way from the one we were guarding against.** Two things came
out of the Terraform investigation ([D13](#open-decisions)) that change what the
guardrails should be. Full detail in [docs/TERRAFORM.md](docs/TERRAFORM.md).

**Workers Builds is not in the provider.** v5.24.0 ships 259 resources and none
of them connect a Worker to a Git repository; provider issue
[#6924](https://github.com/cloudflare/terraform-provider-cloudflare/issues/6924)
has been open since March 2026. Build watch paths (U9) are part of the same
configuration and equally unreachable. So the single most consequential piece of
the deploy pipeline stays a dashboard click no matter what we decide, and
"it's in Terraform now" would be a false sense of captured.

**Wrangler does not delete secrets.** The stated fear was that Workers Builds
and Terraform would overwrite each other's secrets on alternating deploys.
Cloudflare's configuration reference is explicit that wrangler "will not delete
your secrets ... unless you run `wrangler secret delete`", and the secrets
reference says unlisted secrets are preserved from the previous version. The
real collision is the other direction: `cloudflare_workers_script.bindings` is
authoritative for the *entire* binding set and includes `secret_text` as a
binding type, so a Terraform apply would plan to remove every secret it did not
know about. Same conclusion - Terraform must never own the Worker - but if a
secret ever goes missing, wrangler is not the suspect.

The quieter version of the same trap: `cloudflare_worker` looks harmless because
it holds no code, but it carries `observability`, which `wrangler.jsonc` already
sets. There is no slice of the Worker that Terraform can hold without
overlapping something wrangler declares.

<a name="f34"></a>
**F34 - There are three Cloudflare zones, not one, and a token scoped to the
wrong set fails silently.** `blackshearpta.org`, `.com` and `.net` are each a
**separate zone** with its own ID. Obvious in hindsight - the `.com` and `.net`
redirect rules have to live somewhere - but every document here, this one
included, had been written as though there were one zone.

The consequence is a bad failure mode. A read-only API token scoped to
`blackshearpta.org` alone produces a snapshot that **looks successful and is
quietly incomplete**:

- DNS on the other two zones returns a plain `403`, which at least fails loudly.
- `cloudflare_ruleset` does not. It emits a ruleset block for each zone with
  **no `rules` inside it** - the container, without the redirect logic that is
  the entire point. Listing a ruleset and reading its contents are separately
  authorised, so the list call succeeds and the detail call returns "request is
  not authorized", and cf-terraforming writes what it got.

An empty ruleset is not an error and nothing warns you. Verified directly
against the API before blaming the tool, which is the habit worth keeping: the
list endpoint returned the ruleset, the detail endpoint refused it.

Set **Zone Resources -> All zones from an account** when creating the token.
`terraform/README.md` says so at the point where the mistake would be made.

Related trap in the same session: `cf-terraforming` treats a
`CLOUDFLARE_ACCOUNT_ID` in the environment as `--account`, which is mutually
exclusive with `--zone`. Exporting it "for convenience" makes every zone-scoped
generate fail with `--account and --zone are mutually exclusive`.

<a name="f35"></a>
**F35 - The Access policy is personal data, and this repository is public.**
The board allowlist is three named email addresses, two of them personal Gmail
accounts. `cf-terraforming generate` emits them inline, and committing that
output as-is would publish the board's addresses - the same privacy question as
[F22](#f22) and the reason `/contact` routes everything through the PTA address.

The committed snapshot carries the application's **structure** - the `/admin`
path scoping, the 24h session, instant authentication, which identity provider
is wired in - with the addresses replaced by a placeholder pointing at the
dashboard.

That is the right side of the trade. The structure is the part that is hard to
reconstruct under pressure; re-entering three addresses the board already knows
is not. It does mean the snapshot is **not** a complete recovery artefact, and
`terraform/access.tf` says so where somebody would find out.

Generalises past Access: anything generated from a live account has to be read
for personal data before it is committed, not after.

<a name="f36"></a>
**F36 - cf-terraforming's Access output does not validate, in four separate
ways.** Every other resource generated cleanly. The Access application and its
identity providers needed four hand fixes before `terraform validate` passed:

| Defect | Why |
|---|---|
| `name` missing on both identity providers | Schema marks it Required. The **API returns an empty string**, so the tool had nothing to emit. Added as `name = ""` |
| `scim_config` on the one-time PIN provider | Schema forbids it outright: "can not be set if type is one of: onetimepin" |
| `id` **and** `include` in the same policy block | Exactly one is allowed - reference an existing policy, or define one inline. The tool emitted both |
| `self_hosted_domains` **and** `destinations` | Mutually exclusive; the former is the legacy form of the latter |

Two things worth carrying forward. The first defect is not a tool bug at all -
the live state genuinely cannot be expressed in the v5 schema, so these
resources **do not round-trip**, and under Option 2 that would be a permanent
diff or an apply error rather than a cosmetic problem. And the third is the
"one policy, two ways" ambiguity that [`docs/TERRAFORM.md`](docs/TERRAFORM.md)
flagged as a hazard before any of this was generated - it turned out to be a
concrete defect, not a theoretical one.

**`terraform validate` earned its place here.** Four defects, none of which
were visible by reading the output, all caught by one command that touches
nothing. It is the check to run on generated config before trusting it.

<a name="f37"></a>
**F37 - The brand lemon does not work as a surface, only as an accent.** Three
separate problems on the admin screens had one cause: `--pta-surface-alt` is the
brand lemon, so anything using it became a lemon panel. A paragraph of
instructions on lemon is unpleasant to read even where it clears AA, and a lemon
primary button sitting on a lemon footer bar was effectively invisible.

Two conclusions. **Lemon is a stripe, a fill behind three words, or a pinned
badge - not a background for body copy.** And **a primary action cannot share a
color with a status marker**: lemon was simultaneously "press this" and "this
post is pinned" on the same screen. Admin primaries are now blue on white
(8.43:1, already a defined brand pair) and the lemon survives as an 8px edge on
the guide box.

The public site still uses lemon CTAs and is untouched - that is the design the
board picked, and the readability problem was specific to lemon-on-lemon in the
editor. Worth revisiting together, not unilaterally.

<a name="f38"></a>
**F38 - Naming a class after a Tailwind utility silently changes its display.**
The month calendar is a `<table>` with `table-layout: fixed`, and every column
came out a different width. The cause was the class name: it was `.grid`, and
Tailwind v4 generates utilities by **scanning source files**, so writing
`class="grid"` made Tailwind emit `.grid{display:grid}` - an unscoped rule that
beat the component's scoped rule for the one property the component did not set.
The table was rendering as a CSS grid container.

Nothing failed. The CSS was correct in the file; the bug existed only in the
cascade. `getComputedStyle` reporting `display: "grid"` on a `<table>` is what
gave it away.

`npm run check:classnames` now fails the build on any class named after a
Tailwind display or position utility. `.grid`, `.block` and `.table` were all
in use; they are now `.month-grid`, `.section-block` and `.posts`.

<a name="f39"></a>
**F39 - The brand lemon was the default panel color, which is why yellow kept
appearing everywhere.** `--pta-surface-alt` backs every inset panel on the site
- hint boxes, thumbnails, table headers, dialog footers, empty states - and
Civic Letterpress defined it as `#f0e430`. Every one of those became a lemon
slab, in ten components, and each looked like its own separate mistake.

Fixed at the token rather than per component: `--pta-surface-alt` is now a quiet
`#f5f5f2` and the accent is still one token away as `--pta-accent-quiet`. That
also removed the reason the admin's primary buttons had been turned blue - a
lemon button on a lemon bar was invisible - so they are back to the brand
color, with the pinned badge outlined instead of filled so the accent means
one thing per screen.

The rule that came out of it: **lemon is a stripe, a button, or a badge outline.
It is never the background of something you have to read.**

<a name="f40"></a>
**F40 - The two features hardest to get right were the two that could not be
tested without deploying.** `/admin` and announcement photos both depend on
Cloudflare edge infrastructure, and neither has a local equivalent: Access
attaches no token to a localhost request, so every `/admin/api/*` call answered
`401 Not signed in.`, and `wrangler dev` binds a *local* R2 bucket that starts
empty, so every photo 404'd. Both looked like intermittent breakage and were
reported as such. Neither was - they were structural, and had been since the day
each shipped. The editor is the most behavior-dense part of the site and it was
the only part with no feedback loop shorter than a deploy.

Closed with three changes, in `src/worker/access.ts`, `admin.ts` and
`scripts/seed-images.mjs`:

- `DEV_ADMIN_EMAIL` in `.dev.vars` signs you in locally. Honoured **only** on a
  loopback hostname, which is what makes it safe: the names that route to this
  Worker are `blackshearpta.org` and its `workers.dev` subdomain, so the branch
  is unreachable in production even if the variable were set there by mistake.
  The variable is the second lock, not the first.
- Local runs are **read-only** unless `DEV_ALLOW_WRITES=true`. There is no local
  copy of the content - a save is a real commit - so browsing the editor must
  not be able to publish by accident. A banner names the repository and branch.
- `npm run dev:images` copies the current posts' photos into the local bucket
  over plain HTTPS, needing no credentials because `/images/*` is already routed
  ahead of the gate.

A read-only local session also needs **no GitHub token at all**: the repository
is public, so `call()` now omits the `Authorization` header when there is no
token rather than sending `Bearer undefined`. Local setup is one line.

Two things worth keeping from this. The hostname test is written as a pure
function so `check:access` can assert it directly, and the eleven new cases
there include the lookalikes a loose check would wrongly accept
(`localhost.example.com`, `notlocalhost`, `127.0.0.1.example.com`) - the same
"move the logic somewhere deterministically testable" lesson as [F38](#f38) and
`src/lib/crop.ts`. And `check:secrets` caught a token placeholder in the
documentation written *for this finding* — then caught a second one in this
paragraph describing the first. A gate that fires on prose about itself is a
gate with no special cases, which is the only kind worth having.

**A follow-on near-miss worth its own note.** Backing up `.dev.vars` to
`.dev.vars.bak` before editing it produced an untracked file holding every local
secret and matching no ignore rule — the rule was the exact string `.dev.vars`.
`check:secrets` scans *tracked* files, so it would not have said a word until
the file was already staged. Fixed at the rule: `.dev.vars*` with
`!.dev.vars.example`, which also covers the `.dev.vars.<environment>` names
wrangler reads natively. The general shape: an ignore rule written for one exact
filename is a rule that stops working the first time anyone makes a copy.

**`dev worker` now sets the environment up rather than assuming it.** It reads
`.dev.vars` and names whatever is missing (no `SITE_PASSWORD` — the gate locks
everyone out; no `DEV_ADMIN_EMAIL` — `/admin` 401s; a too-short `GITHUB_TOKEN` —
reads fail with "Bad credentials"), then seeds the photo bucket, which is silent
when there is nothing to do. `dev status` reports the same without starting
anything.

While wiring that up: **`dev check` was running nine of the twelve gates**, and
nothing else runs any of them — there is no CI workflow, and Workers Builds only
runs `npm run build`. `check:classnames`, `check:ical` and `check:domain` had
therefore never run outside a session where someone invoked them by hand. All
twelve now run, and `do_check` in `dev-control.sh` is where a new gate has to be
registered or it does not exist.

<a name="f41"></a>
**F41 - Announcements moved from markdown files in git to Cloudflare D1, and
the thing that made it worth doing was not the storage.** Publishing took 60-90
seconds because every save was a commit and every commit was a full rebuild.
Moving the content to a database without also rendering it on demand would have
changed nothing about that number - the delay was the rebuild, not the file. So
both halves landed together: `posts` and `edits` tables, and `prerender = false`
on the four routes that show announcements. A save is now live before the editor
finishes saying so.

**What the old design was actually buying, and what replaced it.** It is worth
writing down because the git-backed version was a good decision, not a mistake,
and the reasons it was good are the reasons this had to replace them rather than
simply drop them:

| It gave us | Now |
|---|---|
| `git log` as the audit trail | an `edits` table, and a **History** panel on `/admin` so it can be read without a terminal |
| `git revert` as undo | a delete stores the whole post in `edits.detail`; recovery is one `wrangler d1 execute` |
| a backup in every clone | `npm run export:posts`, which writes markdown in the format the files had. **This is the one genuinely new obligation** - nobody has to remember a git clone |
| one copy of the content | still one copy. The markdown files stay only until this is proven, then go |

**Four things cost real time, none of them the database.**

**The homepage had to move too, and that was not in the brief.** It renders the
announcements block, so leaving it prerendered would have frozen it at the last
*code* deploy - and with content out of git there is no longer a content deploy
to refresh it. "Live without a rebuild" is not true if the front page is not.
`/preview` went with it for the same reason.

**Making the homepage on-demand silently un-optimized its backdrop photo, and
nothing about the page looked different.** `getImage({ width: 1200, quality: 45,
format: 'webp' })` runs at build time; on an on-demand route the Cloudflare
adapter has no image service and its fallback endpoint *streams the source file
back unchanged*. The homepage went from serving a 180KB webp to serving the
**6,301,582-byte original JPEG**, on the page a parent opens on a phone in the
pickup line. It was found by fetching the URL and reading `Content-Length` - it
is invisible in the markup, invisible on screen, and invisible in review. Fixed
by committing an already-sized `campus-front-walk-band.webp` and importing it
directly, which removes the runtime dependency rather than configuring it;
`check:images` now fails if that file goes missing or comes back the wrong size.
**The general shape: moving a page from build time to request time silently
withdraws every build-time service it was using.** The image pipeline was the
one that mattered here; the content loader was the other.

**Importing one constant from `src/content.config.ts` put a filesystem globber
in the Worker bundle.** `GRADE_LABELS` lived there; that file imports Astro's
`glob` loader, which reaches tinyglobby, fdir and picomatch, which call
`createRequire(import.meta.url)`. Every announcement route answered 500 with
`The argument 'path' ... Received 'undefined'` and a stack pointing at picomatch
- a message with no visible connection to the import that caused it. The three
constants now live in `src/lib/grades.ts`. **A named import is not a promise
that the rest of the module stays behind.**

**The adapter fought the gate twice, in opposite directions.**
`@astrojs/cloudflare` builds through `@cloudflare/vite-plugin`, which treats
wrangler's `main` as *the* Worker - so `src/worker.ts` stays the entry and hands
off to `@astrojs/cloudflare/entrypoints/server`, which is the supported shape
and is what the handoff asked for. But that same handler also speaks the
protocol the adapter's **workerd prerenderer** uses at build time, over ordinary
HTTP to this Worker. The gate answers an unauthenticated request with a
redirect, so the build's own prerender calls got bounced to
`/under-construction` and the build died on `Unexpected end of JSON input`.
`prerenderEnvironment: 'node'` keeps prerendering out of the Worker entirely.
Also: `@astrojs/cloudflare@14.3.x` declares `astro: ^7.2.0` and needs an export
that only exists in 7.3 - npm resolves a combination that cannot build. Pinned
to `~14.2.6`. **A peer range is a claim, not a test.**

**Two quieter ones, both about verification rather than code.** `astro check`
transforms a component to TSX and **drops a top-level `return` from the
frontmatter**, so anything referenced only inside that return reads as unused
and fails `noUnusedLocals` - reported as "'notFoundPage' is declared but its
value is never read" on a line that is correct. And `Astro.rewrite('/404')` does
not work from an on-demand route, because `/404` is prerendered and has no
component in the server manifest; it throws, Astro's error path serves the 404
page anyway, and the reader gets the right-looking page with **status 500**. A
crawler is told to come back later rather than to drop the address of a deleted
post. Both are in `src/lib/not-found.ts` and `[slug].astro` with the reasoning
attached.

**The new gate.** `npm run check:d1` runs the real migrations and the real query
layer against real SQLite through `node:sqlite` - not a mock, the same engine D1
is built on. It exists because moving content out of git took away a guarantee
the build gave for free: the content schema's Zod rules ran on every build, and
`astro build` would not finish if a post was malformed. Nothing rebuilds on a
publish now, so that check no longer runs, and the failure moved from "red build
nobody saw" to "live page". Both `.refine()` rules are CHECKs and triggers in
the schema; the single-pin invariant is a partial unique index, so two pinned
posts are unrepresentable rather than merely avoided. Registered in `do_check` -
**fourteen gates now**, and per F40 that registration is the only thing that
makes a gate real.

**The footgun that started it is gone by construction.** A save sends only the
fields its form owns, and the API writes only the fields it receives, so
omitting `pinned` cannot unpin a post. The old API wrote whole documents, which
is why removing a checkbox from a form silently changed data.

---

**F42 - The domain claim is held in Google's account registry, not in DNS, and the activation form asks the question that actually matters.** Workspace signup on `blackshearpta.org` returns *"This domain name is already in use"*. The intuitive fix - delete the Google MX and `google-site-verification` records left over from Gabe's attempt - **does nothing**, because Google resolves that check against its own tenant database and never looks at the zone. Deleting them is worse than useless: the `google-site-verification` TXT is a *completed* step that would have to be redone, and dropping the MX records breaks inbound mail for any address on the old tenant.

The Google for Nonprofits activation flow asks *"does your nonprofit currently use Google Workspace?"* **Answering "No" is what produces the collision** - it routes into create-a-new-tenant against a domain that already has one. While Gabe's tenant exists the honest answer is **"Yes"**, which asks for the existing customer ID and attaches the nonprofit benefit to that tenant instead of creating a second one. That still needs super-admin on the old tenant, so it reframes the blocker rather than removing it. **Two ways out, both requiring Gabe, neither involving DNS:** (a) he deletes the old tenant, freeing the domain for a clean create with Jon as super admin; or (b) he transfers super-admin to Jon, who then answers "Yes". If he cannot sign in, the GfN admin account from [F45](#f45) is now a real support channel for Google's domain-reclaim process.

**F43 - The SPF record has been broken since the nameserver move, and nobody noticed.** `v=spf1 include:dc-aa8e722993._spfm.blackshearpta.org ~all` points at a hostname that returns **NXDOMAIN**, confirmed against `8.8.8.8` so it is not a local resolver artifact. That `_spfm` target was generated *dynamically by GoDaddy's nameservers* rather than stored as a zone record, so when [C6](#track-c---domain-dns-email) moved delegation to Cloudflare the SPF record's **text** came across but the thing it references did not. An unresolvable `include` is an SPF **permerror**, and DMARC is at `p=quarantine`. [C5](#track-c---domain-dns-email)'s "nothing lost" was accurate record-for-record and wrong functionally - a dynamic dependency is invisible to a record-by-record diff. Harmless while nothing sends as the domain; a live deliverability problem the moment [B5](#google-workspace-for-nonprofits) does. Replace it outright, do not migrate it. **Closed 2026-09-30 ([B12](#google-workspace-for-nonprofits)):** replaced outright with `v=spf1 include:_spf.google.com ~all`, verified on 1.1.1.1 and 8.8.8.8.

**F44 - The old tenant looks like an empty shell, and may be GoDaddy-resold.** No DKIM record exists at any common selector (`google`, `default`, `selector1`, `selector2`, `s1`), which means Workspace DKIM was never switched on and nobody ever sent mail from that tenant in earnest - consistent with the signup-then-abandon story in [F8](#f8), and the reason deleting it is low-risk. But the GoDaddy fingerprints from [F2](#f2) still matter: the `_spfm` SPF format and a DMARC `rua` pointing at `onsecureserver.net`. **A Workspace tenant sitting under a reseller cannot take nonprofit pricing** - it has to be moved to direct Google billing or cancelled first. Jon's *Domains Only* delegate access ([C3](#track-c---domain-dns-email)) explicitly cannot see subscriptions, so Gabe has to establish this either way. It is the main argument for deleting rather than inheriting: cancellation sidesteps the reseller question entirely and leaves the tenant owned by the PTA rather than by a personal account.

**F45 - The Google for Nonprofits account came through, under the state org's name, with the previous admins removed.** Approved 2026-09-11: *"Your request for administrative access to the Google for Nonprofits account for Pta Texas Congress has been approved."* The name is the group-exemption identity predicted in [F13](#f12), so it is expected and not itself a problem. The sentence worth acting on is *"The original owners have been removed from the Google for Nonprofits account."* **Confirm with Gabe that he was the original owner.** If he was, this is simply the takeover working as intended. If he was not, the removed admins belonged to Texas PTA or another local unit, and that should be raised with Google now rather than surface later as another unit losing access. Note also that GfN account admin and Workspace tenant admin are **separate**: this approval does not grant any authority over the tenant blocking [B3](#google-workspace-for-nonprofits).

**F46 - The "domain already in use" error was self-inflicted, and the nonprofit path was never actually blocked.** Answering **Yes** to *"does your nonprofit currently use Google Workspace?"* returns *"Your domain is eligible for an upgrade to Google Workspace for Nonprofits, offered at no charge"* with an **Activate** button - no error, no collision, no payment method. Answering *No* is what routes into create-a-new-tenant against a domain that already has one, producing the error in [F42](#f42). So the practical blocker was the form, not the dormant tenant, and the escalation path in F41 (get Gabe to delete or transfer) is now a **fallback** rather than the plan. Activate submits for review in ~3 business days; ownership is presumably checked there, and a rejection is the signal that Gabe is actually needed.

**Two traps in this flow.** First, the *"Sign up for a Google Workspace for Nonprofits trial"* link in the 4-step list leads to **ordinary paid signup** - `workspace.google.com/checkout/payment`, Business Standard, 14-day trial converting to **$16.80/user/month**, card required. Despite the link text there is nothing nonprofit about it, and completing it would buy a subscription the PTA does not need and possibly stand up a second tenant. Second, the eligibility card **never names the domain it means**; confirm it is `blackshearpta.org` under GfN → Settings before activating.

**Also confirmed:** `admin.google.com` signed in as `blackshearpta@gmail.com` redirects to signup rather than an admin console, which establishes that **the PTA Gmail holds super-admin on no tenant at all**. Gabe's tenant remains separate and inaccessible.

**F47 - The PTA Gmail can reach a payments profile in a private individual's name.** The payments-profile picker offers two: **Blackshear Elementary PTA** (Organization, ID `4250-4308-7169`) and **Julio Garcia** (Individual, ID `7134-6750-2847`). Two separate things to note. The organization profile *already existing* means Google billing was set up for the PTA at some point, which corroborates the subscription suspicion in [F2](#f2). And an individual profile reachable from the shared account means any charge made under it lands on a personal payment instrument and shows a private name in the PTA's billing records. Neither is necessarily wrong - Julio may be a current or former treasurer - but **who this is and why it is attached should be established before any billing relationship is created**, and it is a live consideration for [D2](#open-decisions)-style "who owns the accounts after turnover" questions. This name appears nowhere else in this document. **Deferred by Jon 2026-09-14** - he does not know who Julio is and is not concerned for now, which is a reasonable call: the nonprofit edition is free, so no payment instrument should ever be exercised. **It stops being academic the moment a payment method is attached to anything** - a paid upgrade, or a fallback to Business Standard if [B4](#google-workspace-for-nonprofits) is rejected. Revisit then, not before. **Update 2026-10-01:** a payment method was briefly attached during the 2026-09-30 trial attempt ([U16](#-do-this-week)). It was Jon's own card, now removed, and Jon confirmed that no payment methods or subscriptions remain on the PTA Gmail. Workspace itself is on the free nonprofit edition with no billing. The question is dormant again.

**F48 - The activation was rejected because the domain publicly disowned itself.** Google could not verify the connection between *"Pta Texas Congress"* and `blackshearpta.org`. Two causes, and only one of them was the name.

**The name half** is the [F13](#f12) group-exemption wrinkle firing exactly as predicted. Every Texas local PTA unit is a 501(c)(3) under Texas PTA's IRS group ruling, so Google's records carry the group's name rather than ours. Our own registration is public and specific: the IRS lists **EIN 91-2015074** as **"612 Blackshear Elementary PTA"** (612 is the Texas PTA unit number), visible on ProPublica's Nonprofit Explorer at `projects.propublica.org/nonprofits/organizations/912015074`. That is the evidence that ties the account's EIN to *this* unit rather than to the state body.

**The half nobody had considered** is that the page Google actually landed on argued against us. An anonymous request to `blackshearpta.org` 302s to `/under-construction/`, and that page said, in order: *"This site is under construction"*, *"everything you need is on our current site"*, and *"blackshearpta.weebly.com"*. **It named a different domain as the real one**, mentioned Texas PTA nowhere, carried no EIN, asserted nothing about owning `blackshearpta.org`, and presented a password box. A reviewer asked *"is this domain this nonprofit's primary domain?"* had every reason to answer no. The rejection email's own suggested remedy - *"add text to your official domain (on a hidden subpage if necessary)"* - is precisely this gap.

**Fixed in `src/pages/under-construction.astro`**, backed by a new `org` block in `site.yaml` (schema in `content.config.ts`, required rather than optional so an empty one fails the build instead of the review). The page now states that `blackshearpta.org` **is** the official domain, names the school and street address, gives the Texas PTA relationship, the IRS-registered name and the EIN, and reframes the Weebly link as *temporary hosting* rather than "our current site". A 501(c)(3)'s name, EIN and exemption status are public by law, so none of this discloses anything the IRS does not already publish.

**Sequencing matters: the fix must be deployed before the form is re-submitted**, or it points a reviewer at a page that still lacks the evidence.

**Two things deliberately not done.** The zone-wide `X-Robots-Tag: noindex, nofollow` ([D5](#open-decisions)) is untouched - the review is human and follows a link, so `noindex` should not obstruct it, and reversing a locked decision to chase a guess is the wrong trade. Revisit only if a second rejection suggests an automated check. And the `org` block was put in content rather than hardcoded in the gate page **because the gate page gets deleted at cutover** ([A29](#phase-2---real-site)) - `/contact` and the footer want this same data, so it must outlive the page that prompted it.

**Also worth noting for [B4](#google-workspace-for-nonprofits):** the support form says *"only one Google Workspace account can be activated for a nonprofit."* If Google continues to treat the organization as "Pta Texas Congress" rather than as unit 612, and Texas PTA itself holds a Workspace account, that sentence becomes a hard blocker. Correcting the **organization identity** is therefore the real objective; the domain question follows from it.

**F49 - The written cutover instruction had gone stale, and following it would have broken the editor.** [A29](#phase-2---real-site) said to remove the gate by deleting `src/worker.ts` plus the three lines marked TEMPORARY in `wrangler.jsonc`. That was correct when it was written, when the Worker was *only* the gate. By the time it was acted on the same file also routed **`/admin/api/*`** ([A23](#phase-2---real-site)) and **`/images/*`**, so deleting it would have taken the announcements editor and every announcement photo with it.

**The instruction had in fact already been corrected once, by someone else, and was still wrong.** [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36) revised it to *"only `run_worker_first` and the gate branch"*, having made `main` permanent by moving announcements to on-demand rendering. That revision was right about `main` and still wrong about `run_worker_first` - see the next paragraph. Two independent passes over the same three-line instruction, each fixing the part its own work had touched.

The `wrangler.jsonc` half is subtler and worth keeping. Dropping `run_worker_first` would let Cloudflare serve matching files without invoking the Worker - cheaper, and what both versions of the instruction called for. But assets are configured `"not_found_handling": "404-page"`, and `/admin/api/*` matches no file, so a Worker that no longer runs first risks those calls being answered with the built 404 page instead of reaching the router. **Both lines therefore stay**, their comments rewritten from "TEMPORARY" to why they are now load-bearing. The cost is that asset requests count against the Workers quota - 100k/day free, against a school PTA site - which is not a real cost. The lesson is narrow and general: *a removal instruction written against one version of a file expires silently as that file grows.*

**What actually changed.** Gate logic out of `src/worker.ts` (password, cookie, unlock endpoint, redirect-to-gate); `src/pages/under-construction.astro` deleted; `docs/PRE-LAUNCH-GATE.md` deleted and its references cleaned from `README.md`, `docs/README.md`, `docs/DEVELOPMENT.md`, `docs/ADMIN.md`, `docs/HANDOFF-D1-MIGRATION.md`, `docs/TERRAFORM.md`, `scripts/seed-images.mjs` and `.dev.vars.example`. A doc describing a feature that no longer exists is worse than no doc: the next volunteer follows it.

**Two things deliberately left alone.** The site is now publicly reachable but **still `noindex`** in both places ([A6](#phase-0---accounts--scaffold)), because [A29](#phase-2---real-site)'s own warning still holds - Weebly is not retired, and two indexed copies of the same content is a ranking mess to unwind. Public-but-unindexed is exactly the state a Google reviewer needs and costs nothing. And `SITE_PASSWORD` is now an unused Cloudflare secret; harmless, and Jon can delete it whenever.

**One consequence to be aware of.** [F22](#f22)'s sponsor tier - fifteen entries naming children with family surnames - is now reachable without a password. That page was already public on Weebly and the families paid for the recognition, so nothing is newly exposed, and `noindex` still keeps it out of search. But F22 called this a board decision to make deliberately, and removing the gate moves it one step closer to mattering. It becomes live the day `noindex` comes off.

**F50 - Two sessions on one repo collide in the task board, not in the code.** This branch and the D1 migration ([PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36)) were written in parallel and merged in sequence. Git resolved the code almost entirely on its own - three conflicts, all in files both had commented rather than restructured. What it could not resolve is that **both sessions had appended to this document using the next free number**, so the merge produced two `F41`s and two `A31`s with no conflict marker anywhere, because they are additions in different places rather than edits to the same line.

Renumbered here: my `A31` → **A33**, and my `F41`-`F48` → **F42**-**F49**, along with every cross-reference and the nine code comments that cite them. `F25`, `F26` and a prose mention of `B6` were *already* duplicated on `main` before this merge and are left alone; they are someone's to tidy, but not as part of a PR about a domain verification.

Worth knowing for the next parallel session, because none of it is caught by a test: **a clean `git merge` is not evidence that this file is consistent.** Check for duplicate identifiers and dangling `[Fnn]` links explicitly after any merge that touches it.

**The one code problem the merge did surface was caught by an existing gate.** `npm run check:classnames` failed on `class="grid"` in the new `OrgIdentity.astro` - Tailwind emits a `.grid` utility, and the unscoped rule wins for any property the component does not set. It passed before the merge and failed after, because the D1 branch changed what Tailwind scans. Renamed to `.org-grid`. That check earning its keep on the first parallel merge is a decent argument for the whole family of them.

**F51 - The deploy has been failing since the D1 migration, on a KV namespace nobody asked for.** `blackshearpta.org` served a build predating [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36) for six days. The build log settles it, and it is worth recording that **the first hypothesis was wrong**: this was diagnosed from outside as probably the D1 binding naming a database that did not exist, on the strength of `wrangler.jsonc`'s own warning about exactly that. D1 was never the problem. It deploys fine.

`npm run build` succeeds. `npx wrangler deploy` uploads the assets, then dies at the last step:

```
The following bindings need to be provisioned:
env.SESSION         KV Namespace
Provisioning SESSION (KV Namespace)...
Creating new KV Namespace "blackshear-pta-session"...
[ERROR] a namespace with this account ID and title already exists [code: 10014]
```

**Where the binding came from.** Nobody wrote it. `@astrojs/cloudflare` configures Astro sessions against a KV namespace by default and expects to auto-provision it - the build log announces this at line 20, *"Enabling sessions with Cloudflare KV with the 'SESSION' KV binding"*. Nothing in this site uses sessions: there is no `Astro.session` anywhere in `src/`, and no `session` block in `astro.config.mjs`. It arrived as an adapter default when [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36) added `@astrojs/cloudflare`, which is precisely why the failure starts there.

**Why it cannot recover on its own.** Auto-provisioning derives the namespace title from the worker and binding names, `blackshear-pta-session`. Some earlier attempt created it. Every attempt since tries to create it again, collides on the title, and fails - it never links itself to the namespace already sitting there. Left alone this repeats forever, which is what six days of silence looks like.

**The fix is the adapter's own documented escape hatch**, from `Options.sessionKVBindingName` in its type definitions: *"If you define the binding manually in your wrangler config, Astro will use your configuration instead."* Declare the existing namespace in `wrangler.jsonc` and nothing tries to create anything:

```jsonc
"kv_namespaces": [
  { "binding": "SESSION", "id": "<id of the existing blackshear-pta-session>" }
]
```

**The first "the fix did not work" was a false alarm, and reading it wrong cost a day.** The build that failed on the PR was **terminated, not failed**: `running_on` is null and its entire log is two lines - `Initializing build environment...` then `Build failed to initialize and was timed out`. It never ran a command. Meanwhile a *retry* looked like confirmation but rebuilt **`main`**, which does not carry this fix, so its KV collision was the expected old failure rather than a new one. Two builds, neither testing the change. **Check `build_trigger_metadata.branch` and `build_outcome` before concluding anything from a red build** - `terminated` and `fail` mean very different things, and the GitHub check shows both as "failure".

Worth knowing while reading build records: branch builds run `npx wrangler versions upload`, `main` runs `npx wrangler deploy`. Both go through the same build token.

**Applied 2026-09-23** with id `33b61a676f5c45b183b0da0fcbe94728`, read off the dashboard under **Storage & Databases → KV** because `npx wrangler kv namespace list` hit the same local auth error as `d1 list`. `npx wrangler types` now emits `SESSION: KVNamespace`, which is the confirmation that wrangler is binding the existing namespace rather than planning to create one.

**Two things this cost, both worth naming.** The gate hid it completely - every page 302'd to the construction notice, so six days of failed deploys looked identical to a working site, and **announcements were never actually live on D1** despite [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36) being merged. Removing the gate is what made it visible. And a deploy that fails *after* uploading assets leaves the account looking half-changed: the new `/_astro/*` files are uploaded, but no Worker version is ever promoted, so the site keeps serving the old bundle and nothing in its behaviour hints that a deploy was attempted at all.

**Unrelated, and still open:** `npx wrangler d1 list` returns `Authentication error [code: 10000]` locally even though the token lists `d1 (write)` and the account is Super Administrator. It blocks nothing here - D1 deploys fine from CI - but if it persists, `npx wrangler logout && npx wrangler login` re-issues the OAuth token against the current scope set.

**F52 - Four routes silently lost their security and robots headers when they stopped being files.** `public/_headers` is applied by Cloudflare's **static asset server**, so it only ever reaches responses served off the assets binding. When [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36) made `/`, `/announcements/`, `/announcements/<slug>/` and `/rss.xml` render on demand, those four stopped touching that layer and quietly dropped **all three** headers it sets: `X-Robots-Tag`, `X-Content-Type-Options` and `Referrer-Policy`.

Invisible for eight days because the site was not deploying at all ([F51](#f51)). Confirmed the moment it did, by diffing a prerendered route against an on-demand one:

```
/calendar/  ->  x-robots-tag: noindex, nofollow     (prerendered, gets _headers)
/           ->  (none)                              (on-demand, does not)
/rss.xml    ->  (none)
```

**`/rss.xml` was the exposed one.** [A6](#phase-0---accounts--scaffold) deliberately ran two mechanisms - the header and a `<meta name="robots">` in `BaseLayout` - *specifically* so that neither is load-bearing alone. That redundancy held for the HTML routes, which still carried the meta tag. It could not hold for an XML feed, which has nowhere to put one. Between the site going live and this fix, the feed was indexable while [D5](#open-decisions) says the whole zone must not be, and Weebly is still canonical.

Fixed in `src/worker.ts` with `withSiteHeaders`, applied to everything returned by the Astro handler and restating `public/_headers` exactly. It fills in only headers that are **absent**, so a prerendered page that already passed through the asset server is untouched and nothing is set twice. **That makes three places carrying `noindex`, and cutover must delete all three** - `public/_headers`, `BaseLayout.astro`, and now this.

The general shape is worth keeping: *moving a route from prerendered to on-demand silently changes which layer is allowed to touch its response.* Nothing fails, nothing warns, and the check scripts do not cover response headers.

**F53 - The approval upgraded a Workspace account that has existed since at least 2020 and that nobody has used, so nobody knows its admin login.** [B4](#google-workspace-for-nonprofits) was approved 2026-09-25 in two emails. One says *"Google Workspace for Nonprofits is activated for blackshearpta.org"*. The other says the domain *"has now been successfully upgraded"*, and that the Admin Console takes *"your account email address (please note that Gmail addresses cannot be used for this login)"*. Neither one names the account. As far as Google is concerned, the account already exists.

**It does, and it is old.** Jon found this email in the PTA Gmail: *"Your inactive Google account will soon be deleted"*, sent by `workspace-noreply@google.com` on 2021-05-12. It concerns *"your Google Workspace account for the organization Blackshear PTA"*, with domain `blackshearpta.org` and a customer ID. The ID is in the email and deliberately not copied here, because this repo is public. The email says *"you haven't used this account in the past 365 days"* and sets deletion for on or after 2021-06-25. So a tenant existed by May 2020 at the latest, nobody used it, and **the PTA Gmail was its contact address**. That matches Jon's reading exactly: the domain was never *used* for anything beyond DNS. It also probably explains the Google MX and `google-site-verification` records that [F8](#f8) attributed to Gabe's 2025 attempt. Earlier drafts of this finding credited the tenant to Gabe as well. That was unsupported: there is no sign of who created it.

**Whether it is the same tenant today is open.** Either Google never carried out the 2021 deletion, or it did and Gabe's 2025 GfN attempt (*"the free trial with one seat"*, in his 2026-03-07 email to the board) created a new one. Something holds the domain either way. Workspace signup calls it *"already in use"* ([F42](#f42)), the GfN *Yes* path found it *"eligible for an upgrade"* ([F46](#f46)), the approval says *"upgraded"*, and a new signup dead-ends at `.../bringdomaininuse` (below). Any tenant's admin must have an `@blackshearpta.org` address, and the 2021 notice makes the PTA Gmail the likeliest recovery address. **Being GfN account admin and being tenant admin are separate things** ([F45](#f45)), so the GfN *Administrators* tab listing only `blackshearpta@gmail.com` says nothing about the tenant.

**The trial started on 2026-09-30 created a second, unrelated subscription.** The checkout went through on Jon's personal card, added temporarily. It is Google's *Workspace for Gmail accounts*: a subscription attached to `blackshearpta@gmail.com` itself, with no domain. That is what `admin.google.com` now opens for the PTA Gmail, which makes F46's *"holds super-admin on no tenant at all"* true only until that date. It has no Users page because users can only be added once a domain is connected, and blackshearpta.org cannot be connected: that step hangs on a blank page at `workspace.google.com/business/getcustomemail/bringdomaininuse`. **It is not the approved account and gives the PTA nothing.** Paid service starts 2026-10-14. Per Google, cancelling during the trial costs nothing and leaves the Gmail and its data as they were: *Admin console → Billing → Subscriptions → More → Cancel subscription*. Then remove the card from the payments profile ([F47](#f47)). Tracked as [U16](#-do-this-week). Leave that console's *Create your custom email address* alone. It leads to the same dead end, and if Google ever offers to move the domain into this account, that would take the domain off the approved tenant.

**What this changes.** [F44](#f44) argued for deleting the old tenant instead of inheriting it. That option is gone: the approval is attached to it, and deleting it would throw the approval away. The plan is to recover it and make it the PTA's, with super-admin role accounts owned by the PTA and recovery set to `blackshearpta@gmail.com`. The approval, and Google itself sending the 2021 notice, point toward direct Google billing rather than the GoDaddy resale F44 worried about. That is an inference until someone can open Billing.

**Getting in, in order of preference.** (0) Search the PTA Gmail for the tenant's older mail. Workspace was called **G Suite** until October 2020, and **Google Apps** before that, so a welcome email from that era carries those names rather than "Workspace". Search for the customer ID too. A welcome email gives the admin username. (1) With a username, reset it at `accounts.google.com/signin/recovery`. The code most likely goes to the PTA Gmail. If not, *Try another way* ends in a CNAME check, and Jon can edit the Cloudflare zone. (2) Without a username, contact Google Workspace support (the approval email links the form), quote the customer ID, and offer DNS verification. **Ask for admin access to that account restored, not for the domain to be moved.** Google's own help for a domain in use offers both, and only the first keeps the approval. (3) Ask Gabe whether his 2025 attempt created anything. He is also still the one who can close [F45](#f45).

**Found, 2026-09-30: the tenant is a 2020 G Suite signup.** Searching the PTA Gmail for *G Suite* turned up the original mail, all dated 2020-04-13. There is a *"Welcome to your G Suite trial for blackshearpta.org"* for G Suite Business, trial ending 2020-04-27, with the president role address as administrator. There is a *"Thank you for setting up billing in G Suite"*, with a first billing date of 2020-05-01. And the same evening Google Cloud sent a receipt for registering `blackshearpta.org` itself. The domain is at GoDaddy today ([C3](#track-c---domain-dns-email)), so it moved at some point. That administrator address now returns *"Couldn't find this account"*, but another role address from the same signup era exists and is an admin, and Jon signed in with it. Two older questions close with this. **[F44](#f44)'s reseller worry is answered:** the subscription was bought and billed directly through Google, not GoDaddy. **[F2](#f2)'s "recurring charge nobody is tracking" is now a question Billing can answer**, because billing *was* set up in 2020. Whether it ever charged, and to what, is the first thing to read once the console works. On first sign-in every console card failed with *"Data can't be fetched due to system error"*. A refresh cleared it.

**Resolved the same day.** Jon created `jon@blackshearpta.org`, made it a super admin, and confirmed the Workspace for Nonprofits subscription in Billing. The 2020 role account stays as the second super admin, for break-glass use only. From here the work is ordinary setup, tracked as [B11](#google-workspace-for-nonprofits)-B15, [B5](#google-workspace-for-nonprofits), [B6](#google-workspace-for-nonprofits), [A34](#phase-2---real-site), [A35](#phase-2---real-site) and [D14](#open-decisions). **The first of these that matters is B12:** until SPF is fixed, anything sent *from* the domain fails SPF and meets `p=quarantine`.

**What the Users list settled.** The tenant has exactly two users. One is `jon@`. The other is the 2020-era secretary role account, and it is named **"Gabe Hernandez"**. Jon understands that Gabe created it. So Gabe's 2025 attempt, *"the free trial with one seat"*, worked inside the 2020 tenant rather than creating a second one, which answers "same tenant or new" from earlier in this finding. It also makes Gabe the likely original owner of the GfN account that [F45](#f45) asks about. That is likely, not confirmed. The account's recovery details and its super admin role are now [B17](#google-workspace-for-nonprofits)'s to tidy, and a dedicated break-glass admin ([B16](#google-workspace-for-nonprofits)) replaces it as the fallback.

The general shape: *an approval that says "sign in" without saying as whom means an account already exists. Find it; don't create one.*

**F54 - Google enforces 2-Step Verification on every admin in this edition, and no organization setting can exempt one.** Found 2026-10-02, while working out how a break-glass super admin can be handed over. The obvious answer is to exempt it from 2-Step Verification, because a factor tied to one person's phone defeats an account that exists to be handed over. But Google's own page, *About 2SV enforcement for admins*, says enforcement *"is now being implemented for organizations with ... Workspace for Nonprofits"*, that *"admins subject to the Google-set 2SV enforcement policy cannot bypass it"*, and that *"if an admin cannot enable 2SV, the only solution is to remove their admin rights."* It applies to **all** admins, not only super admins, from the moment someone is made one. Access then narrows on a schedule: reminders at 7 days, mobile blocked at 15, web blocked at 30. An OU or group exemption therefore looks like it works, then locks the account out about a month later, exactly when it would be needed.

**What does work is a factor that can be shared.** An authenticator app's *setup key* is just text, and any number of devices can hold it. Printed, and kept with the password and the backup codes, it travels wherever the password goes. That gives Jon's hand-over property and satisfies Google ([B22](#google-workspace-for-nonprofits)). Exemption groups remain the right tool for one thing only: getting an ordinary, non-admin volunteer back in after they miss the enrollment window ([B21](#google-workspace-for-nonprofits)).

The general shape: *before building an exception to a security control, check whether the vendor enforces the control itself. A local exemption from a vendor-enforced rule fails silently and late.*

<a name="f55"></a>
**F55 - Every shared link advertised a 6.3MB preview image for three weeks, and the page it came from looked perfect.** `BaseLayout` built `og:image` with `getImage()`. On a prerendered page that resolves to a real optimized asset; on an on-demand one it resolves to the Cloudflare adapter's `/_image` fallback endpoint, which does not resize - it streams the source file straight back. So from [PR #36](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/36) until [PR #39](https://github.com/Blackshear-PTA/blackshear-pta-website/pull/39), `/`, `/announcements/`, every post page and `/preview` advertised the 3000x2000 original:

| Page | `og:image` resolved to | Bytes |
|---|---|---|
| `/calendar/` (prerendered) | `/_astro/…_1AjvBD.jpg` | 207KB |
| `/` (on demand) | `/_image?href=…` | **6,301,582** |

**No visitor ever paid for it**, because browsers do not fetch `og:image` - which is exactly why it survived three weeks of people looking at the site. Scrapers do fetch it, and cap what they will take (X at about 5MB), so sharing an announcement in a group chat produced a card with **no image at all**. For a PTA, group chats are the distribution channel; the bug was in how the site travels, not in how it renders.

Fixed the way the top-band backdrop was: a pre-sized `campus-front-walk-social.jpg`, 1200x630 quality 72, imported directly. 208KB against the 207KB `getImage()` produced, so identical quality, and correct on prerendered and on-demand pages alike because there is no longer a build-time answer and a request-time answer that can disagree.

**The finding is not the bug. It is that this was the third instance of one fault**, and the first two did not generalise:

| | What was withdrawn | Caught |
|---|---|---|
| [F41](#f41) | the image pipeline, for the top-band backdrop | before release |
| [F52](#f52) | `public/_headers`, for all four routes | after release |
| F55 | the image pipeline, for `og:image` | three weeks after release |

*Moving a route from build time to request time silently withdraws every build-time service it was using* - the image pipeline, the static-asset header layer, the content loaders. F41 already said so in those words and still only fixed the instance in front of it: it guarded the backdrop in `check:images` and left the social card unguarded, which is the only reason one of the two reached production. **A lesson written down is not a lesson applied.** The gate now covers every derived photo rather than the one that bit first, and `src/assets/photos/README.md` says to add the next one to it.

Worth keeping too: all three were found by reading `Content-Length` or a response header, never by looking at a page. **Anything that moves between build time and request time needs checking with a request, not with eyes.**

<a name="f56"></a>
**F56 - A personal Gmail's calendar cannot be handed to a Workspace account, even though the menu offers it.** On 2026-10-06 the Blackshear Parents calendar's *Settings and sharing* listed `communications@` with *Make changes and manage sharing*, and that entry's menu offered **Transfer ownership**. Choosing it and confirming failed: *"Ownership cannot be transferred. This calendar can only be owned by an eligible individual user account (email address)."* Google's help says only that *"for work or school accounts, the new calendar owner must be in the same organization"*, and its 2025 announcement of single, dedicated calendar owners describes transfer only *"to another user in the same organization"*. Neither says anything about a calendar owned by a personal account. [B27](#google-workspace-for-nonprofits) read that silence as permission. It was not: as far as calendar ownership goes, a personal Gmail and the PTA's Workspace are two organizations.

**One change from October 2026 matters beyond this calendar.** Google's Workspace Updates post of 2026-10-05, *Secondary calendars will now follow the lifecycle of their owner*, says a secondary calendar owned by a Workspace user is now **deleted when that user is deleted, and suspended when that user is suspended**, unless its ownership is transferred first. For a PTA that is a turnover rule. A calendar owned by a role account is safe, because role accounts are passed on rather than deleted. One owned by a personally named account, like `jon@`, goes with it ([U19](#-do-this-week)).

The general shape, and the same lesson as [F30](#f30): *a menu that offers an action is not evidence the action is allowed. Where the vendor's documentation is silent on the exact case, test it before writing the plan around it.*

<a name="f57"></a>
**F57 - The free password-manager plan the board chose forbids real passwords in its own terms.** The exec board picked Passwd's free Starter plan on 2026-10-06 ([D2](#open-decisions)), on the strength of its marketing: free, unlimited users, up to 15 saved logins, sharing through Google Groups. Checked against Passwd's own documents before setup, on 2026-10-16:

- **Its terms** (last modified 2022-10-17, still the ones Starter checkout asks you to accept) say the Free Tier may be used *"solely for the purpose of testing"*, that a user *"shall not not store real Passwords"* in it, that Passwd *"does not provide any guarantee for security of data"* there, and that such data *"could be accessible to third parties including both Passwd as well as provider of Google Workspace Marketplace."*
- **Its plans table** gives Starter *"Sharing inside organization"*: No, and describes it as for teams *"that want to try Passwd before rolling it out."* Other Passwd pages contradict this, but sharing is the whole point of the purchase.
- **Smaller limits:** 15 records in total, no 2FA codes, and the homepage card says the browser extension works for 30 days.

The paid Professional plan has none of these limits: about $4 per user a month, or $49 a month for an organization of 11 to 20 accounts, with a 50% nonprofit discount Passwd says is available on request. **Also true on every Passwd plan below Enterprise: every Workspace admin can see every saved password**, so the vault is only as private as the admin list is short.

The general shape: *read the free tier's terms, not just its feature list, before choosing it for anything real. "Free forever" on the homepage and "test data only" in the contract can both be true.*

<a name="f58"></a>
**F58 - Files a personal Google account owns can only be copied into a Shared Drive, never moved.** Checked against Google's help on 2026-10-21, before any files were migrated ([B18](#google-workspace-for-nonprofits)), and it settles the question B18's pilot was there to answer:

- **No move.** Google's article on moving files into shared drives says *"You can't move folders or files external users own"*, even if that person is a member of the destination drive. Both PTA Gmails, and every board member's personal account, are outside the organization.
- **No change of owner.** *"You can't transfer a file from your personal Google account to someone with a work or school account."*
- **No import.** The Admin console's data import tool, which copied the PTA Gmail's mail into `hello@` ([B30](#google-workspace-for-nonprofits)), takes only mail from a personal Gmail. Its file imports come from OneDrive, SharePoint and Dropbox.

So everything from either Gmail, or from a board member's own Drive, arrives as a **copy**: a new link, and none of the original's comments, version history or sharing. Files a PTA account already owns move normally, keeping their links, comments and history. The old links keep working on the originals, which is why files with circulating links stay where they are until their season ends.

The general shape, the same as [F56](#f56) for the calendar: *a personal Gmail and the PTA's Workspace are different organizations, and Google does not let content cross that line except as a copy.*

<a name="f59"></a>
**F59 - A Drive Takeout is more than half overhead, and some of it should not be uploaded.** The PTA Gmail's Drive export, downloaded 2026-10-21 ([B30](#google-workspace-for-nonprofits)), was 7.0 GB and 10,421 files, and about 3,700 of them are the documents themselves. The rest, and what to do with each before uploading ([B18](#google-workspace-for-nonprofits) step 4):

- **4,213 `-info.json` files**, one beside every file and folder. They are metadata, not content: dates, the original Drive link, and the sharing list, with the name and email address of everyone each file was shared with. Uploaded loose, they would double the file count and show every member of the drive everyone's sharing history. Set them aside in one zip and keep it, because it is the only map from each copy back to its original link, which is how circulating links get found and fixed.
- **2,468 `…-at-<date>-pinned` files**, the versions Drive had been told to keep. 2,166 are byte-for-byte the same as the current file, 2.4 GB of duplicates; 160 are real older versions.
- **Duplicate names** in one folder come out as `name.xlsx(1)`, which breaks the extension, so the file will not open until it is renamed `name (1).xlsx`. Six here.
- **Google Docs, Sheets and Slides** arrive as Word, Excel and PowerPoint, about 240 here. Most of this Drive was uploaded PDFs and Word files to begin with.
- **Each Google Form** arrives as a zip holding an HTML snapshot of the form and its responses as a CSV. It cannot become a working form again, and the responses carry parents' details. 18 here.
- **Shortcuts** arrive as small `.html` bookmark files pointing at the original, which belongs to someone else and is not in the export. 21 here.
- **Finder's `.DS_Store` files**, a few of them uploaded to Drive in 2020.

A spot check found nothing missing: names that seemed to have no file had only been changed on export, with a trailing space or dot replaced by `_`.

**The Fundraising Gmail's export was the same shape**: 5,606 files, of which 2,369 are `-info.json` sidecars and 1,183 are pinned versions, 1,016 of those identical to the current file (1.0 GB), plus 42 zips. **A browser folder upload skips empty folders**, 27 of them here, and its progress count is files plus folders: 10,865 was 10,420 files and 445 folders.

The general shape: *Takeout is built for leaving Google, so it carries metadata, kept versions and converted formats that an upload back into Google does not need.*

<a name="f60"></a>
**F60 - Cloudflare has two kinds of API token, and Workers Builds accepts only one of them.** Found while rotating the local token on 2026-10-22 ([A36](#phase-0---accounts--scaffold)):

- **Two user tokens, easy to confuse.** The original login's profile listed `jf-website`, the token `scripts/cf.sh` uses, and `blackshear-pta-builds`, the token Workers Builds was deploying with, which has about 25 permissions. Rolling the second would have stopped deploys. Their names don't say which is which; their permissions and *last used* dates do, because the builds token is used on every push.
- **Account API tokens** (Manage Account → Account API Tokens) belong to the account, not to a login. They keep working when a board member leaves or a login is removed, and any Super Administrator can see, roll or revoke them. Their values start `cfat_`. D1 and Workers accept them, and wrangler reports *Account API Token*.
- **Workers Builds takes only user tokens**, both as the token a build runs with and for its API, which says *"account-scoped tokens are not supported"*. So the local token lost *Workers Builds Configuration* when it became an account token, and the builds token stays a user token until Cloudflare adds support. Deploy results don't need it: each build posts a *Workers Builds: blackshear-pta* check to its commit on GitHub, branch pushes included.
- **Proving a token dead needs a real token to test.** Cloudflare answers an empty bearer token with the same *Invalid API Token* as a revoked one, so a script that fails to read the old value "proves" it dead. Check that the value is present and matches its fingerprint first.
- **Which login a build ran as is on record.** Each Worker version names the login that uploaded it (`wrangler versions list`, or `author_email` in the versions API). The first build after the builds token moved to the admin account, on 2026-10-22, reads the admin account; every version before it, the PTA Gmail.

The general shape: *a token's name says nothing about what depends on it; check its permissions and last use before rolling or deleting it.*

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
TXT    "v=spf1 include:dc-aa8e722993._spfm.blackshearpta.org ~all"   <-- BROKEN, see F42
TXT    "google-site-verification=j2oZCILLgqJoY-w2X-_l1g3z3_pxHQ6-vgXFLWWVzoE"
TXT    _dmarc  "v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;"
DNSSEC unsigned
Registrar status: clientDeleteProhibited, clientRenewProhibited,
                  clientTransferProhibited, clientUpdateProhibited
```
