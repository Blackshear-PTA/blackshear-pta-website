# Systems and accounts

<!-- Shown as the "Systems & accounts" tab of the task board (npm run tasks:board). Keep it current as access changes. -->

What the PTA runs, who can get into each service, and what is changing. It names roles rather than people wherever it can, because roles survive turnover. This repository is public, so passwords, two-factor details and the admin account's address never go in this file.

## At a glance

| Service | What it does | Who controls it | Next |
|---|---|---|---|
| **Google Workspace for Nonprofits** (blackshearpta.org) | Email, Drive, Calendar and Groups for the board. Free edition. | Super admins: Communications, Secretary, the admin account | Board sign-ins ([B29](#b29)); data migration ([B30](#b30)) |
| **Shared Drives**: one for documents, and *PTA Vault* | Where the PTA's files live. Files in a Shared Drive belong to the PTA, not to whoever added them. | Members by role account. Every member of a drive sees everything in it, so the vault's members are only the officers who may open it | Copy documents in ([B18](#b18)); themes ([B35](#b35)) |
| **Website**, blackshearpta.org | The public site. The calendar refreshes every few hours, and announcements and the Instagram list are edited at /admin. | Code in GitHub, running on Cloudflare. The editor at /admin is open to five role accounts signing in with Google | Pointed visitors at the Weebly site from 2026-10-22 (exec board), and serves the new site again once the Little EAST page had caught up (Jon, 2026-10-23, [A48](#a48)). Later, retire Weebly ([A29](#a29)) |
| **Cloudflare**, account "Blackshear PTA" | DNS, website hosting, the announcements database, photo storage, /admin access control and analytics. Domain registration too, after the transfer. | Super Administrators: Communications and the admin account; the original PTA Gmail login was removed 2026-10-23 ([A36](#a36)). The Secretary's invitation, for the domain transfer only, lapsed and is sent again before the transfer, then scaled back afterwards. Billing contact: the admin account. Deploys run on a token of the admin account's login (since 2026-10-22). | Domain transfer ([C9](#c9)) |
| **GitHub**, organization Blackshear-PTA | The website's code (public). A merge to main deploys it, and a scheduled job refreshes the calendar. | Owners: Communications and the admin account, both role accounts. The PTA account (`blackshearpta-legacy`) and Jon's personal account were removed 2026-10-23 ([A37](#a37)) | Two-factor required for every member since 2026-10-23. Next: GitHub for Nonprofits ([B7](#b7)) |
| **GoDaddy** | The domain's registrar today | Gabe's personal account; Jon has delegate access to the domain only | **Gabe transfers it into Cloudflare himself** on or after Oct 12, using Cloudflare access on secretary@ (invited, and steps sent, 2026-10-06; [C9](#c9)) |
| **Google for Nonprofits** (program account "Pta Texas Congress") | Keeps the PTA eligible for Workspace for Nonprofits and other Google programs | Admins: the admin account (primary), Communications, the PTA Gmail | None |
| **PTA Gmail**, blackshearpta@gmail.com | The old central account. It forwards to hello@, is the recovery address for the admin account and hello@, owns the parents' calendar ([B27](#b27)), and is the login for older services. | Communications | **Everything in it moves to hello@** (decided 2026-10-06, [B30](#b30)); the account itself stays, as a recovery address and the calendar's owner. Sign in to it now and then, so Google never counts it as inactive |
| **Fundraising Gmail** | The fundraising committee's old account | Fundraising chair | **Everything in it moves to fundraising@** (decided 2026-10-06, [B26](#b26)); the account itself stays, as a recovery address |
| **Blackshear Parents calendar** (Google Calendar) | The public calendar parents subscribe to; the website reads it every few hours | Owner: the PTA Gmail. Make changes and manage sharing: Communications, President, VP, Fundraising and Secretary. See event details: the Fundraising Gmail, and every PTA account through all@. | **Stays with the PTA Gmail, run from Workspace** (Jon, 2026-10-06; Google will not transfer a personal Gmail's calendar into Workspace). Moving it may be revisited between school years ([B27](#b27)) |
| **Weebly** | The old website. blackshearpta.org redirected to it from 2026-10-22 to 2026-10-23 ([A48](#a48)) | Probably the Square login on the PTA Gmail, which Weebly asked it to switch to in 2022 ([A29](#a29)) | Retire once the new site is ready ([A29](#a29)) |
| **Other services**: Square, PayPal, Zeffy, SignUpGenius, Instagram, Facebook, Linktree, TinyURL, Animoto, Amazon Business and more; the full list is in [A38](#a38) | Payments, sign-ups, social media, links and buying | Mostly signed up under the two old Gmails | Found 2026-10-23. Next, move each login to the admin account, with the role that uses it as a second user, money services first ([A38](#a38)) |
| **Google Cloud project** `blackshear-pta-access` | The Google sign-in client for /admin | The PTA's Google organization; any super admin | Nothing; Google deletes the client after six months unused; see `docs/ADMIN.md` |
| **KeePassXC vault** (password manager) | One encrypted file holding the PTA's central logins, in the *PTA Vault* Shared Drive, which only its members can open. Free and open source. | Members of *PTA Vault*: Communications (Manager); President, VP and Fundraising (Content manager). The master password is also in the sealed envelope | In use since 2026-10-23: the PTA's logins are in it, and the officers who need it are set up ([B33](#b33)) |
| **Claude Code automation** | A scoped Cloudflare account API token on Jon's machine, `blackshear-pta-wrangler` (read-only except the database and, since 2026-10-27, the announcement photo bucket; since 2026-10-22), plus GitHub as the Communications account, through `scripts/gh.sh` and this checkout's git config (since 2026-10-23) | Jon; any Cloudflare Super Administrator can revoke the token, and Communications can sign gh out on that machine | Revoke both at handoff |

## Email addresses

| Address | Type | Who uses it | Notes |
|---|---|---|---|
| hello@ | User account, delegated | Communications holds the login. Delegates, confirmed 2026-10-06: Communications, President, VP, Fundraising. | The PTA's public address; replaces the PTA Gmail ([B25](#b25)) |
| all@ | Group, every PTA account | Owners: Communications, the President, the admin account | Includes every current and future account automatically. Used to share the parents' calendar; only owners and managers post ([B34](#b34)) |
| members@ | Group, announcement-only | Posted to by hello@, Communications and the President | All 83 current PTA members; replies go to hello@ ([B28](#b28)) |
| president@, vp@, secretary@, treasurer@, fundraising@, roomparents@, garden@, staffappreciation@, communications@ | User accounts | The officer holding each role | They pass with the role; at turnover an admin resets the password ([D14](#d14)) |
| littleeast@ | User account | The Little EAST chair | Created 2026-10-06 ([B31](#b31)); the Little EAST page's public contact since 2026-10-23 ([A40](#a40)) |
| community@ | Group, used as a shared mailbox (being created) | Several members, worked as a Collaborative Inbox | Decided 2026-10-06; purpose to be settled so it does not overlap with hello@ ([B32](#b32)) |
| admin-notifications@ (alias webmaster@) | Group | Communications plus a backup | Receives the admin account's forwarded mail: service notices, bills and password resets ([B5](#b5)) |
| dmarc@ | Group | Communications plus a backup | Email-authentication reports |
| The admin account | User account: the owner of every outside service, and the emergency super admin (the break-glass account) | Credentials in the password vault and the sealed envelope | The central IT contact for billing and admin notices. A user, not a group, because Google sign-in does not work with groups. Forwards to admin-notifications@ ([B5](#b5), [B16](#b16), [B22](#b22)) |

## Kinds of address, in brief

- **User account:** a real mailbox with its own login, Drive and Calendar, held by one person. Free on this edition.
- **Group:** an address that copies each message to its members. It has no login and no inbox of its own. Good for "reach these people".
- **Collaborative inbox:** a group where members can assign each conversation to someone and mark it done, worked from groups.google.com. Good when several volunteers answer the same requests and need to know who replied.
- **Delegation:** one user account that several people read and send from inside their own Gmail, with no shared password. That is how hello@ works.

## Who can get in, by role

- **Communications:** Workspace super admin, Cloudflare Super Administrator, GitHub owner, Google for Nonprofits admin, holder of hello@ and one of its delegates.
- **Secretary:** Workspace super admin. Invited as a Cloudflare Super Administrator for the domain transfer, to be scaled back afterwards ([C9](#c9)).
- **The admin account:** the owner of every outside service and the emergency super admin. Workspace super admin, Cloudflare Super Administrator and owner of the deploy token, GitHub owner, primary Google for Nonprofits admin. Its credentials are in the password vault and the sealed envelope ([B33](#b33), [B22](#b22)).
- **President, VP, Fundraising:** delegates of hello@. The President also posts to members@.
- **The website editor (/admin):** Communications, President, VP, Secretary and Fundraising, each signing in with their PTA Google account.
- **Every officer:** their own role account, with 2-Step Verification required.
