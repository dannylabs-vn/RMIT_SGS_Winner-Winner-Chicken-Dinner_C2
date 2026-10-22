# KinKey: technical notes

The project overview (judging README), demo walkthrough and setup are in the [repository README](../README.md). This page covers the approval model, trust model and verification status.

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
Where TideCloak fits, planned with Tide's MCP (Plan C): [`docs/TIDECLOAK-PLAN.md`](docs/TIDECLOAK-PLAN.md).

Backend API contracts, local checks and deployment limits: [`docs/BACKEND.md`](docs/BACKEND.md).

Full instructions, verification tests and troubleshooting: [`docs/SETUP.md`](docs/SETUP.md).

Install, run and the demo walkthrough: see the [repository README](../README.md#setup).

Simulated mode keeps its realm and keys in `data/sim-*.json` (git-ignored). Every page shows a "Simulated TideCloak" notice.

### Live TideCloak
Put the adapter downloaded from your licensed realm in `tidecloak.json` (it must contain `jwk.keys`) and rebuild; the app switches to the official SDK automatically. Force a mode with `TIDE_MODE=live` or `TIDE_MODE=simulated`.
