# KinKey

**KinKey is a family safe where every key-holder can read medical details at once, but the key to money and documents is granted only after the family's quorum approves it.**

### 1. Vision & originality
Families keep bank, insurance and medical details in one person's head. KinKey replaces that person with a family rule. Emergency-access features hand everything to one contact; guardian apps split keys across relatives' devices. In KinKey no relative holds a key piece: access is a permission the family approves in TideCloak.

### 2. Trust constraint insight
You tell no one, and the family is stuck during a hospital stay, or tell one person everything, and they can act alone. QuadrigaCX showed both failures: one man held the only keys. KinKey's guarantee: nobody can read the finance compartment until a quorum-approved grant gives them the key. After that, they can open it until the family revokes the grant.

### 3. Value & impact
Minh works in Japan. When his mother is hospitalised, his sister reads her allergies immediately; the insurance policy opens for her once the family approves her key. The prototype measures one thing: decryption refused before the approved grant, successful after. Real-world benefit is not yet measured.

### 4. Why TideCloak matters
Contents are encrypted in the browser with `doEncrypt` under a compartment tag; the server stores only ciphertext. Decryption requires `_tide_<tag>.selfdecrypt`. Granting that role is a governed change that commits only when the realm's admin quorum, the family, approves. With ordinary login, any admin could read the data or grant themselves access.

### 5. Prototype & storytelling
Watch four observable tests: a relative is refused; stored records contain no plaintext; the grant stays pending below quorum; once it commits, the same relative opens the compartment and Mom's letter appears.

Demo video: `docs/kinkey-demo.mp4`

---

## What the family actually approves

KinKey uses **quorum-governed access grants** (not per-opening consent).

| Question | Answer in this prototype |
|---|---|
| Who can request the finance key? | Any key-holder, by filing a role grant in tide-console and posting a reason on the family board. |
| Who approves? | The realm's Tide realm admins: the family members. |
| What needs the quorum? | Granting or revoking `_tide_finance.selfdecrypt` (and any other role or admin change). |
| What happens after approval? | The grantee can decrypt the finance compartment repeatedly until the grant is revoked. Individual openings are **not** separately approved. |
| What if the quorum cannot be reached? | Finance stays sealed. Medical still opens. Replacing an unreachable key-holder is itself a governed change, so choose key-holders so that a quorum stays reachable. |
| What does revocation do? | Stops future decryptions after the token refreshes. It cannot erase anything already read, copied or still on screen. |

## Trust model

| Actor | Can | Cannot (or not shown) | Status |
|---|---|---|---|
| Mom (owner) | Encrypt and read both compartments | — | By role assignment |
| Key-holder without grant | Read medical; request finance | Read finance | Tested in demo (V4) |
| Family quorum | Commit role grants and revocations | Commit with fewer approvals than the realm's threshold | Threshold observed in V5 |
| App server / operator | Store and serve ciphertext | Decrypt it: server holds no key | Documented by Tide; ciphertext-only storage tested (V8) |
| Someone who copies the database | See ciphertext, compartment, author, time | Read contents or labels | Tested (V8) |
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
| D1 | `lan` opens the safe | Medical open; finance **Sealed**, error from the Tide network | Finance opens |
| D2 | Open *What a thief sees*, run `npm run check:plaintext` | Only ciphertext; script prints PASS | Any demo text appears |
| D3 | File grant of `_tide_finance.selfdecrypt` to `lan`; approve below the observed threshold | Request pending; finance still sealed | Grant commits |
| D4 | Approve up to the threshold; `lan` presses *Try to open again* | Finance opens; Mom's letter shows | Still sealed |
| D5 | Revoke the grant; reload as `lan` | Finance sealed again | Finance still opens after reload |

Record actual results in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Verification status

| Claim | Status |
|---|---|
| Granting encrypt/decrypt roles is a governed change requiring quorum | Documented by Tide |
| API rejects missing and forged tokens; writes need `selfencrypt` | Tested locally |
| Server stores no plaintext | Automated check (`npm run check:plaintext`) |
| A family member can decrypt what Mom encrypted under the same tag | Pending (V3) |
| Exact approval threshold for four admins | Pending (V5) |
| Revocation blocks new decryptions | Pending (V7) |
| Bootstrap/master admin cannot bypass the quorum | Not tested (V9) |

## Known limits
- Not a will and not legal advice.
- Anything opened can be copied or photographed; revocation cannot undo that.
- The family board is a shared note; the approvals that matter live in TideCloak's QEA Approvals.
- Metadata (compartment, author, time) is visible to the server.
- The attacker view shows stored records only. It is not a penetration test.
- One realm per family in the prototype. A production path is one realm with a Forseti policy per safe (`ValidateApprovers`).

## Setup
Full instructions, verification tests and troubleshooting: [`docs/SETUP.md`](docs/SETUP.md).

```bash
npm install
cp /path/to/your/tidecloak.json ./tidecloak.json
npm run dev
```
