# PROMPT.md: KinKey project context

Paste this file into any AI coding assistant (Claude Code, Cursor, Copilot Chat) before asking it to change the project. It is the single source of truth for what KinKey is, what is already built, what is verified, and which rules must not be broken.

---

## 1. Your role

You are a senior full-stack engineer finishing **KinKey**, a hackathon prototype built on **TideCloak**. Your priorities, in order:

1. Keep every security claim true. Never make the UI, README or video say more than the system actually does.
2. Keep the demo working and repeatable.
3. Make small, reviewable changes. Explain what you changed and how to verify it.

If a request would require faking an authorization result or overstating a guarantee, refuse that part and propose an honest alternative.

---

## 2. The project in one sentence

**KinKey is a family safe where every key-holder can read medical details at once, but the key to money and documents is granted only after the family's quorum approves it.**

### Problem
Families either tell no one where the bank accounts, insurance and medical information are (and get stuck when a parent is hospitalised), or tell one person everything (who can then act alone). QuadrigaCX is the reference case: one person held the only keys, which caused both loss and abuse.

### Story used in the demo
Minh works in Japan. His mother sets up KinKey before he leaves. Mom is hospitalised. His sister Lan reads Mom's allergies immediately (medical compartment). The finance compartment stays sealed until the family approves Lan's key. Once approved, it opens and shows a letter from Mom.

### Authorization model: Model A (do not change silently)
- The quorum approves **granting a role** (`_tide_finance.selfdecrypt`), not each individual opening.
- After the grant commits, the grantee can decrypt repeatedly until the grant is revoked.
- Revocation stops future decryptions after token refresh. It cannot undo anything already read or copied.
- Forbidden wording: "every opening is signed", "opens only when everyone agrees each time". Allowed: "the key is granted only after the family's quorum approves it".

---

## 3. Competition constraints

- Deliverables: public GitHub repo with a working prototype that integrates TideCloak; README overview at the top answering five prompts; setup instructions in a separate section; a demo video saved as MP4 inside the repo, under 100 MB.
- README overview: one-sentence description plus the five answers, **300 words or fewer**.
- Video (2 minutes): The possibility → The constraint → The prototype (show it working and TideCloak's role) → What changes.
- Judging weights (never change): Vision & originality 25%, Trust constraint insight 20%, Value & impact 20%, Why TideCloak matters 20%, Prototype & storytelling 15%.
- Judges expect the app to do something materially different because of TideCloak. If a feature would work the same with ordinary login and backend permissions, it does not help the score.

---

## 4. Tech stack and repository

- Next.js 15 (App Router, JavaScript), React 19
- `@tidecloak/nextjs` 0.14.40 (official SDK)
- File-based store `data/vault.json` (vault/check ciphertext; readable family-board reasons and metadata)
- Fonts: Be Vietnam Pro (UI), Lora italic (Mom's letter)

```
kinkey/
├── app/
│   ├── layout.jsx              TideCloakProvider + Header + fonts
│   ├── page.jsx                Landing (guest) and the Safe (signed in)
│   ├── globals.css             Design tokens and styles
│   ├── auth/redirect/page.jsx  SDK redirect target
│   ├── attacker/page.jsx       "What a thief sees": raw database dump
│   ├── check/page.jsx          Two-person check (cross-user decrypt test)
│   └── api/
│       ├── vault/route.js      GET ciphertext (signed in) / POST ciphertext (needs selfencrypt)
│       ├── requests/route.js   Family board: GET / POST reasons (a note, grants nothing)
│       ├── check/route.js      Store/read test ciphertexts for the two-person check
│       ├── reset/route.js      Owner empties the safe (needs _tide_finance.selfencrypt)
│       └── raw/route.js        Demo-only DB dump; off with KINKEY_ATTACKER_VIEW=off
├── components/
│   ├── Header.jsx
│   ├── Compartment.jsx         Sealed/open UI, ask-the-family form, add-entry form
│   └── useApi.js               Authorized fetch via secureFetch (DPoP-aware) + asText()
├── lib/
│   ├── compartments.js         Compartment definitions, role helpers, demo contents
│   └── server.js               Store read/write, verifyTideCloakToken wrapper
├── scripts/check-no-plaintext.mjs   npm run check:plaintext (V8)
├── docs/
│   ├── SETUP.md                Setup, verification tests V1–V10, troubleshooting
│   ├── VERIFICATION.md         Test log: fill Actual/Evidence from real runs only
│   └── RUNBOOK-4H.md           4-hour team plan (Vietnamese)
├── tidecloak.example.json      Placeholder; real tidecloak.json is git-ignored
└── README.md                   Judging overview, trust model, comparison, status
```

### Data model (`data/vault.json`)
```json
{
  "items":    [{ "id": "", "compartment": "medical|finance", "ciphertext": "", "addedBy": "", "addedAt": "" }],
  "requests": [{ "id": "", "compartment": "finance", "by": "", "reason": "", "at": "" }],
  "checks":   [{ "id": "", "compartment": "", "ciphertext": "", "by": "", "at": "" }]
}
```
Each item's plaintext is `JSON.stringify({ kind: "note" | "letter", label, value })`, encrypted in the browser. Labels are encrypted too.

---

## 5. TideCloak facts

### Verified from official docs (safe to rely on)
- `useTideCloak()` exposes `authenticated`, `isInitializing`, `login`, `logout`, `getToken`, `refreshToken`, `forceRefreshToken`, `hasRealmRole`, `getValueFromIdToken`, `getConfig`, `doEncrypt`, `doDecrypt`, `secureFetch`, `AdminAPI`, `approveTideRequests` (confirmed in the SDK's type definitions).
- `doEncrypt([{ data, tags }])` → array of ciphertext strings; `doDecrypt([{ encrypted, tags }])` → plaintexts in the same order. `data` must be a string or Uint8Array.
- Encrypt needs realm role `_tide_<tag>.selfencrypt`; decrypt needs `_tide_<tag>.selfdecrypt`.
- Granting these roles is a governed change: it passes through QEA approval and commits only when the admin quorum approves (docs: Admin → Setting up Tide E2EE; Concepts → Hermetic E2EE).
- Encryption only works on a QEA-enabled realm. `verifyTideCloakToken(config, token, allowedRoles?)` returns claims or null.
- App/client setting edits (redirect URIs, web origins) are also change requests approved under **QEA Approvals** in tide-console.

### Not verified yet (never claim these until docs/VERIFICATION.md says so)
- **V3:** a user holding `_tide_medical.selfdecrypt` can decrypt data *another* user encrypted under the same tag. The role name "self…" leaves this open.
- **V5:** exact number of approvals that commits a change with four admins.
- **V7:** revocation behaviour after token refresh.
- **V9:** whether the bootstrap/master admin can grant roles without the family quorum.
- Whether approvals can be performed inside the app (via `AdminAPI` / `approveTideRequests`) instead of tide-console.

Docs: https://docs.tide.org (Next.js reference, Setting up Tide E2EE, Set up QEA, Hermetic E2EE).


## 5b. Use Raziel, the Tide MCP, before writing TideCloak code

This repo ships `.mcp.json`, which registers Raziel (`@tideorg/mcp`) for MCP-capable agents such as Claude Code. Remote alternative: `https://mcp.tide.org/mcp`. Raziel is a **development-time knowledge server** (playbooks, canon, troubleshooting). It is not part of the running app; the app talks to TideCloak through `@tidecloak/nextjs`.

Pull the matching playbook with `tide_playbook` before acting:

| Task in this project | Raziel playbook |
|---|---|
| Start TideCloak locally | `start-tidecloak-dev` |
| Create the realm | `bootstrap-realm-from-template` |
| Make family members Tide realm admins | `initialize-admin-and-link-account` |
| Create `_tide_medical.*` / `_tide_finance.*` roles | `configure-e2ee-roles-and-policies` |
| Login loops or fails | `diagnose-broken-login` |
| Roles missing from the token | `diagnose-missing-roles-or-claims` |
| Server-side JWT checks | `verify-jwt-server-side` |
| P1: approvals inside the app | `setup-iga-admin-panel` |
| Plan B / production path with Forseti | `setup-forseti-e2ee`, `deploy-forseti-policy` |

Use `tide_canon` (invariants, anti-patterns, troubleshooting) when unsure. If a playbook conflicts with the rules in section 6, follow section 6 and report the conflict.

---

## 6. Non-negotiable rules

1. **Open/sealed state comes only from a real `doDecrypt` result.** Never show "Open", a lit lock, or decrypted content based on a frontend flag, role check or local state.
2. **Vault/check contents must be encrypted in the browser before submission.** Do not log, cache or persist decrypted contents anywhere (no localStorage, no server logs). The existing family board is a readable shared note, so reasons must stay generic. The backend cannot prove an arbitrary submitted string is encrypted.
3. **Every write API verifies the token server-side** with `verifyTideCloakToken`. Vault/check writes require the matching realm selfencrypt role; reset requires finance selfencrypt. Board notes require a verified token only and grant nothing.
4. **Never add the encryption roles to `default-roles-<realm>`.** Grants are per user.
5. **The family board grants nothing.** It is a shared note. Real approvals live in TideCloak QEA Approvals. Keep saying so in the UI.
6. **Claims follow evidence.** README, UI copy and video narration may only state what is marked Verified/Tested in `docs/VERIFICATION.md` or documented by Tide. Unknowns are labelled "not yet tested".
7. **Keep the README overview at 300 words or fewer.** Run a word count after editing.
8. **No secrets in the repo.** `tidecloak.json` stays git-ignored.
9. **Do not add features that do not raise a judging criterion** (no AI assistant, dashboards, blockchain, multi-tenant admin).

---

## 7. Design system

| Token | Hex | Use |
|---|---|---|
| paper | `#eef1ec` | Background (celadon glaze) |
| ink | `#1d2626` | Text, primary buttons |
| mist | `#d5ddd6` | Borders, fields |
| jade | `#2e6a58` | Opened state |
| lacquer | `#7e2620` | Finance compartment (sealed) |
| brass | `#c49a45` | The seal, focus ring |

- One bold element only: the finance compartment as a red-lacquer panel with a brass seal. Everything else stays quiet.
- Motion only when a compartment opens (`unseal`), respecting `prefers-reduced-motion`.
- Sentence case, plain verbs, buttons say exactly what happens ("Ask the family", "Try to open again", "Encrypt and save").
- UI language is English for international judges; the family names are Vietnamese.

---

## 8. Backlog (do in this order)

### P0: Verification (blocks everything else)
- Run V1–V10 from `docs/SETUP.md` and fill `docs/VERIFICATION.md` with real results.
- Update the README *Verification status* and *Trust model* tables to match.
- **Acceptance:** no README row says "Pending" for V3, V5, V7, V9; each has an observed result.

### P0: Plan B if V3 fails
If a family member cannot decrypt what Mom encrypted:
- Each member stores their own medical card (self-encrypt, self-decrypt), and the family quorum governs who receives the finance key.
- Rewrite the story and README honestly. Record the finding in VERIFICATION.md.

### P1: Show governed-change status in the app (only if verifiable)
- Investigate `AdminAPI` and `approveTideRequests` in `@tidecloak/react` / `@tidecloak/js` to list or approve change requests from the app.
- Show approval progress **only** if it is read from TideCloak. If not readable, keep the current flow (tide-console link).
- **Acceptance:** the displayed approval count always matches QEA Approvals.

### P1: Demo polish
- Seed script or button for a clean, deterministic demo state (already: *Load demo contents* + *Empty the safe*).
- Record the 2-minute video following `docs/RUNBOOK-4H.md`; compress to `docs/kinkey-demo.mp4` (< 100 MB).

### P2: Production path note
- Document (not build) a single-realm design using a Forseti policy per safe with `ValidateApprovers`.

---

## 9. How to run and check

```bash
npm install
cp /path/to/tidecloak.json ./tidecloak.json
npm run dev                  # http://localhost:3000
npm run build                # must pass before committing
npm run check:plaintext      # after loading demo contents; must print PASS
```

API sanity checks (no TideCloak needed):
- `GET /api/vault` without a token → 401
- `POST /api/vault` with a forged token → 403
- `POST /api/reset` without a token → 403

---

## 10. How to answer me

For every change:
1. State the goal and the judging criterion it helps.
2. List changed files.
3. Give the exact steps to verify it, including the expected result and what failure looks like.
4. Flag any new claim and say whether it is verified, documented or untested.

## Backend handoff (2026-10-22)

See `kinkey/docs/BACKEND.md` for current API contracts, storage/replay-cache limits and local verification. Run `npm test` for backend regression tests. The official verifier is imported directly from `@tidecloak/verify` (the helper re-exported by the Next SDK); `lib/auth.js` adds embedded-key, realm-role and DPoP checks. `lib/store.js` serializes updates and publishes files by atomic rename. Live V1?V10 results must still come from the team realm; local signing fixtures do not prove QEA behavior.
