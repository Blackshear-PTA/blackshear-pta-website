# Systems and accounts

<!-- Shown as the "Systems & accounts" tab of the task board (npm run tasks:board). Keep it current as access changes. -->

What the PTA runs, who can get into each service, and what is changing. It names roles rather than people wherever it can, because roles survive turnover. This repository is public, so passwords, two-factor details and the break-glass account's address never go in this file.

## At a glance

| Service | What it does | Who controls it | Next |
|---|---|---|---|
| **Google Workspace for Nonprofits** (blackshearpta.org) | Email, Drive, Calendar and Groups for the board. Free edition. | Super admins: Communications, Secretary, the break-glass account | Board sign-ins ([B29](#b29)); data migration ([B30](#b30)) |
| **Website**, blackshearpta.org | The public site. The calendar refreshes daily, and announcements are edited at /admin. | Code in GitHub, running on Cloudflare | Google sign-in for the editor ([B6](#b6)); retire Weebly ([A29](#a29)) |
| **Cloudflare**, account "Blackshear PTA" | DNS, website hosting, the announcements database, photo storage, /admin access control and analytics. Domain registration too, after the transfer. | Super Administrators: Communications, the break-glass account, and the original PTA Gmail login. Billing contact: the central IT address. | Domain transfer ([C9](#c9)); two-factor on the new logins ([A36](#a36)) |
| **GitHub**, organization Blackshear-PTA | The website's code (public). A merge to main deploys it, and a daily job refreshes the calendar. | Owners: the PTA account (`blackshearpta-legacy`), Communications, the break-glass account, and Jon's personal account | Require two-factor org-wide ([A37](#a37)); GitHub for Nonprofits ([B7](#b7)) |
| **GoDaddy** | The domain's registrar today | Gabe's personal account; Jon has delegate access to the domain only | **Gabe transfers it into Cloudflare himself** on or after Oct 12, using Cloudflare access on secretary@ ([C9](#c9)) |
| **Google for Nonprofits** (program account "Pta Texas Congress") | Keeps the PTA eligible for Workspace for Nonprofits and other Google programs | Admins: the break-glass account (primary), Communications, the PTA Gmail | None |
| **PTA Gmail**, blackshearpta@gmail.com | The old central account. It forwards to hello@, is the recovery address for the break-glass account and hello@, owns the parents' calendar until the transfer, and is the login for older services. | Communications | **Everything in it moves to hello@** (decided 2026-10-06, [B30](#b30)); the account itself stays, as a recovery address |
| **Fundraising Gmail** | The fundraising committee's old account | Fundraising chair | **Everything in it moves to fundraising@** (decided 2026-10-06, [B26](#b26)); the account itself stays, as a recovery address |
| **Blackshear Parents calendar** (Google Calendar) | The public calendar parents subscribe to; the website reads it daily | Owner: the PTA Gmail. Edit: Communications. View: the Fundraising Gmail. | **Transfer ownership to communications@** (decided 2026-10-06, [B27](#b27)); the link and subscriptions stay the same |
| **Weebly** | The old website | Login holder unknown | Retire ([A29](#a29)) |
| **Social media and other tools**: Instagram, Facebook, sign-up and payment tools, Animoto, TinyURL, HelloSign | Various | Mostly signed up under the two old Gmails | Inventory, then move the logins to PTA addresses ([A38](#a38)) |
| **Passwd** (password manager) | A shared vault for the PTA's central logins. Free Starter plan, up to 15 logins. | Installed by a Workspace admin; access by role group | Set up ([B33](#b33)) |
| **Claude Code automation** | A scoped Cloudflare API token on Jon's machine (read-only except the database), plus GitHub through Jon's account | Jon | Revoke at handoff |

## Email addresses

| Address | Type | Who uses it | Notes |
|---|---|---|---|
| hello@ | User account, delegated | Communications holds the login. Delegates, confirmed 2026-10-06: Communications, President, VP, Fundraising. | The PTA's public address; replaces the PTA Gmail ([B25](#b25)) |
| members@ | Group, announcement-only | Posted to by hello@, Communications and the President | All 83 current PTA members; replies go to hello@ ([B28](#b28)) |
| president@, vp@, secretary@, treasurer@, fundraising@, roomparents@, garden@, staffappreciation@, communications@ | User accounts | The officer holding each role | They pass with the role; at turnover an admin resets the password ([D14](#d14)) |
| littleeast@ | User account | The Little EAST chair | Created 2026-10-06 ([B31](#b31)); may become the Little EAST page's contact ([A40](#a40)) |
| community@ | Group, used as a shared mailbox (being created) | Several members, worked as a Collaborative Inbox | Decided 2026-10-06; purpose to be settled so it does not overlap with hello@ ([B32](#b32)) |
| webmaster@ | Group | Communications plus a backup | Login address for outside services |
| dmarc@ | Group | Communications plus a backup | Email-authentication reports |
| The break-glass account | User account, emergency super admin | Sealed credentials | Also the central IT contact for billing and admin notices, and forwards to Communications ([B16](#b16), [B22](#b22)) |

## Kinds of address, in brief

- **User account:** a real mailbox with its own login, Drive and Calendar, held by one person. Free on this edition.
- **Group:** an address that copies each message to its members. It has no login and no inbox of its own. Good for "reach these people".
- **Collaborative inbox:** a group where members can assign each conversation to someone and mark it done, worked from groups.google.com. Good when several volunteers answer the same requests and need to know who replied.
- **Delegation:** one user account that several people read and send from inside their own Gmail, with no shared password. That is how hello@ works.

## Who can get in, by role

- **Communications:** Workspace super admin, Cloudflare Super Administrator, GitHub owner, Google for Nonprofits admin, holder of hello@ and one of its delegates.
- **Secretary:** Workspace super admin.
- **The break-glass account:** Workspace super admin, Cloudflare Super Administrator, GitHub owner, primary Google for Nonprofits admin. Its credentials are sealed. Which two officers know where they are kept is an open decision ([D2](#d2)).
- **President, VP, Fundraising:** delegates of hello@. The President also posts to members@.
- **Every officer:** their own role account, with 2-Step Verification required.
