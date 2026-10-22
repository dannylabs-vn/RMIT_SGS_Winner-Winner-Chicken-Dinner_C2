# KinKey

**KinKey is a family safe where every key-holder can read medical details at once, but the key to money and documents is granted only after the family's quorum approves it.**

### 1. Vision & originality
Families keep bank, insurance and medical information in one person's head, or hand everything to one relative. KinKey splits the safe into compartments with different rules: medical opens immediately in an emergency; finance needs the family to agree.

### 2. Trust constraint insight
Today someone must hold the master key: a relative, a lawyer or the app's own admin. Whoever holds it can act alone. KinKey removes that holder: the server stores only ciphertext, and the finance key needs the family's quorum, not one person's say-so.

### 3. Value & impact
Minh works in Japan. Mom is hospitalised. Lan reads Mom's allergies straight away; the insurance papers stay sealed until three of the four family members approve Lan's key. Then Mom's letter opens. Revoking the key stops new openings after the next token refresh.

### 4. Why TideCloak matters
Without TideCloak this is ordinary login plus an admin who could flip a permission. With it, compartments are TideCloak encryption tags, keys are realm roles, and granting a key is a Quorum-Enforced Authorization change the family must approve. Tide's network was overloaded during the hackathon, so, following Tide's Plan C, sign-in, roles, approvals and encryption are **simulated** through the same app interface; see *Where TideCloak fits* in the app.

### 5. Prototype & storytelling
Working end to end: family sign-in, encrypted medical and finance vaults, a key request with live 3-of-4 approval progress, unlock after refresh, revocation, a family board, and "What a thief sees", the raw database showing only ciphertext. Ten automated backend tests cover authorization and storage.

Demo video: [docs/kinkey-demo.mp4](docs/kinkey-demo.mp4).

---

## What the family actually approves

KinKey uses **quorum-governed access grants** (not per-opening consent).

| Question | Answer in this prototype |
|---|---|
| Who can request the finance key? | Any key-holder, by filing a role grant in tide-console and posting a reason on the family board. |
| Who approves? | The realm's Tide realm admins: the family members. |
| What needs the quorum? | Granting or revoking `_tide_finance.selfdecrypt` (and any other role or admin change). |
| What happens after approval? | The grantee can decrypt the finance compartment repeatedly until the grant is revoked. Individual openings are **not** separately approved. |
| What if the quorum cannot be reached? | A new finance grant cannot commit. Existing grantees retain access. Medical cross-user access still needs V3. Replacing a key-holder is also governed. |
| What does revocation do? | Expected to stop future decryptions after token refresh; V7 is not yet run. It cannot erase anything already read, copied or still on screen. |

## Trust model

| Actor | Can | Cannot (or not shown) | Status |
|---|---|---|---|
| Mom (owner) | Encrypt and read both compartments | — | Intended role assignment; live test not run |
| Key-holder without grant | Read medical; request finance | Read finance | Not yet tested (V3/V4) |
| Family quorum | Commit role grants and revocations | Commit with fewer approvals than the realm's threshold | Threshold not yet tested (V5) |
| App server / operator | Store and serve ciphertext | Decrypt it: server holds no key | Browser encryption implemented; live storage scan not run (V8) |
| Someone who copies the database | See submitted ciphertext, metadata and readable board reasons | Decrypt genuine Tide ciphertext without authorization | Live demo scan not yet run (V8) |
| TideCloak bootstrap / master admin | Unknown | Unknown | **Not yet tested (V9). We make no claim here.** |
| Majority of the family colluding | Grant themselves the key | — | By design |

## How KinKey compares

| Category | Example (source) | How access works | Where KinKey differs |
|---|---|---|---|
| Emergency access in a password manager | [Bitwarden Emergency Access](https://bitwarden.com/help/emergency-access/) | One trusted contact; access is granted automatically if the owner does not respond within the wait time (minimum one day). | No single contact; finance needs a quorum, medical is immediate. |
| Guardian-based inheritance | [Vault12 Guard](https://vault12.com/crypto-inheritance-management) | Guardians approve a beneficiary's request; built on threshold secret sharing across guardians. | Relatives hold no key shares; the grant is a governed change in TideCloak. |
| Shared encrypted vault or folder | Any shared vault | Everyone added can open it at any time. | Different compartments, different rules. |

We do not claim the combination is unprecedented; we claim these specific differences.

## Demo as observable tests

| # | Step | Expected | Fails if |
|---|---|---|---|
| D1 | `lan` opens the safe | Medical **Available**; finance **Restricted**, error from the Tide network | Finance opens |
| D2 | Open *What a thief sees*, run `npm run check:plaintext` | Only ciphertext; script prints PASS | Any demo text appears |
| D3 | File grant of `_tide_finance.selfdecrypt` to `lan`; approve below the observed threshold | Request pending; finance still sealed | Grant commits |
| D4 | Approve up to the threshold; `lan` presses *Try to open again* | Finance opens; Mom's letter shows | Still sealed |
| D5 | Revoke the grant; reload as `lan` | Finance sealed again | Finance still opens after reload |

Record actual results in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Verification status

| Claim | Status |
|---|---|
| Granting encrypt/decrypt roles is a governed change requiring quorum | Documented by Tide |
| Missing/forged tokens rejected; vault/check/reset writes enforce encryption roles | Automated tests with local signing keys; board notes require authentication only |
| Vault contents encrypted by browser; board reasons/metadata readable | Scanner regression tests pass; live demo scan not run (V8) |
| A family member can decrypt what Mom encrypted under the same tag | Not run (V3); current Tide guidance says self-encryption does not support this. See [verification log](docs/VERIFICATION.md). |
| Exact approval threshold for four admins | Pending (V5) |
| Revocation blocks new decryptions | Pending (V7) |
| Bootstrap/master admin cannot bypass the quorum | Not tested (V9) |
| Simulated flow: refusal without role, grant pending at 1–2 approvals, commit at 3 of 4, old token still refused, refreshed token decrypts | Tested 2026-10-22 on the running app (API calls and a browser click-through). Simulation only, not live Tide |

## Known limits
- Not a will and not legal advice.
- Anything opened can be copied or photographed; revocation cannot undo that.
- The family board is a shared note; the approvals that matter live in TideCloak's QEA Approvals.
- Metadata (compartment, author, time) and family-board reasons are visible to the server. Do not include sensitive details in board reasons.
- The server cannot prove an arbitrary submitted string is ciphertext. Use the browser encryption flow.
- Storage and DPoP replay protection require one persistent Node server process; see the backend handoff.
- The attacker view shows stored records only. It is not a penetration test.
- One realm per family in the prototype. A production path is one realm with a Forseti policy per safe (`ValidateApprovers`).

## Setup
Backend API contracts, local checks and deployment limits: [`docs/BACKEND.md`](docs/BACKEND.md).

Full instructions, verification tests and troubleshooting: [`docs/SETUP.md`](docs/SETUP.md).

### Run the demo (simulated TideCloak, no Tide account needed)
```bash
npm install
cp tidecloak.example.json tidecloak.json   # no licensed keys -> simulated mode
npm run dev                                 # http://localhost:3000
```
1. **Sign in** → *Continue as Mom* → **Load demo contents**.
2. Sign out → *Continue as Lan*: Medical is **Available**, Finance is **Restricted** → **Ask the family**.
3. *Family approvals*: approve as Lan, then sign in as Mom and Minh and approve. It commits at 3 of 4.
4. As Lan, **Try to open again** on Finance: Mom's letter opens. *What a thief sees* shows only ciphertext.
5. To restart, sign in as Mom → **Empty the safe** (also resets everyone's keys).

Simulated mode keeps its realm and keys in `data/sim-*.json` (git-ignored). Every page shows a "Simulated TideCloak" notice.

### Live TideCloak
Put the adapter downloaded from your licensed realm in `tidecloak.json` (it must contain `jwk.keys`) and rebuild; the app switches to the official SDK automatically. Force a mode with `TIDE_MODE=live` or `TIDE_MODE=simulated`.
