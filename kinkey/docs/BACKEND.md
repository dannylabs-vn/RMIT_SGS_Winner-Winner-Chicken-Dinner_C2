# Backend handoff

Goal: keep the prototype repeatable and its trust claims accurate (Trust constraint insight, Why TideCloak matters, Prototype & storytelling). Model A is unchanged: QEA governs role grants, not individual openings. No approval count is fabricated or stored by these APIs.

Changed files in this backend pass:

- `lib/auth.js`, `lib/server.js`: official token verification, embedded-key requirement, realm-role enforcement and DPoP proof checks.
- `lib/store.js`, `lib/http.js`, all five `app/api/*/route.js` files: atomic locked updates, bounded validation, consistent errors and no-store responses.
- `app/tide_dpop/[...path]/route.js`: SDK login relay.
- `scripts/check-no-plaintext.mjs`, `tests/backend.test.mjs`: honest scanner behavior and backend regression tests.
- `package.json`, `package-lock.json`, `.gitignore`: explicit verifier/JOSE dependencies, Node requirement, test command, patched PostCSS and ignored transient storage files.
- `README.md`, `docs/SETUP.md`, `docs/VERIFICATION.md`, `docs/BACKEND.md`, root `PROMPT.md`: evidence, contracts and handoff.
- `app/page.jsx`, `app/attacker/page.jsx`, `components/Compartment.jsx`: security wording and the board's 280-character limit; no layout redesign.

## Run and verify

Use Node.js 22.13+ and run these commands from `kinkey/` (on Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`):

```sh
npm ci
npm test
npm audit
# Download the real tidecloak.json from your QEA-enabled realm first.
npm run build
npm start
```

The adapter must contain `realm`, `resource`, `auth-server-url`, and a nonempty `jwk.keys` array. The backend fails closed when configuration is missing or incomplete; it never falls back to remote signing keys. The example adapter is not sufficient for login or API authorization. After changing the adapter, rebuild/restart so browser and server use the same configuration.

`npm test` runs real SDK signature verification against ephemeral, locally generated keys and isolated temporary storage. Expect all tests to pass. Any failed assertion or nonzero exit is a regression. These are **not** live Tide Fabric or QEA tests. The suite covers invalid tokens, realm roles, DPoP, endpoint contracts, validation, concurrency across processes, corruption, capacity, raw-view configuration and the plaintext scanner.

After Mom loads the demo through the browser, run `npm run check:plaintext`. Expect PASS only when both compartments have enough entries and known demo text is absent. Missing, incomplete, invalid or leaking data returns FAIL with exit code 1. Passing this scan does not prove arbitrary submitted strings are encrypted. Run V1–V10 in SETUP.md for the live acceptance checks.

## UI API contract

Use `components/useApi.js` / SDK `secureFetch`. Send JSON with `Content-Type: application/json`. Encrypt labels and values in the browser before calling storage APIs. Success envelopes remain compatible with the current UI.

| Endpoint | Authorization | Success | Body / limits |
|---|---|---|---|
| GET `/api/vault` | Verified token | 200 `{items}` | All stored items |
| POST `/api/vault` | Matching realm `_tide_<compartment>.selfencrypt` | 201 `{item}` | `{compartment,ciphertext}`; medical or finance; nonblank ciphertext ≤256 KiB; 1000 items |
| GET `/api/check` | Verified token | 200 `{checks}` | All retained checks, newest first |
| POST `/api/check` | Matching realm selfencrypt | 201 `{ok:true}` | Same body as vault; newest 20 retained |
| GET `/api/requests` | Verified token | 200 `{requests}` | Newest first |
| POST `/api/requests` | Any verified family session | 201 `{request}` | `{compartment:"finance",reason}`; trimmed reason 1–280 characters; 100 requests |
| POST `/api/reset` | Realm `_tide_finance.selfencrypt` | 200 `{ok:true}` | No body; empties items, requests and checks atomically |
| GET `/api/raw` | Deliberately public demo endpoint | 200 whole store / 404 disabled | See deployment settings below |

All application API responses, including errors, use `Cache-Control: no-store`. Errors are `{error: string}`. Unauthorized reads/board writes return 401; rejected vault/check/reset writes return 403. Invalid bodies return 400, overlarge requests 413, wrong media type 415, full collections 409, and storage failures 503. Vault/check bodies are limited to 350,000 bytes; board bodies to 4096 bytes, including streamed bodies. Unknown fields are rejected. Authors, IDs and timestamps come from verified claims/the server, never submitted body fields.

The board is an intentional exception to encrypted vault contents: reasons and metadata are readable by the server and by anyone who can access the demo dump. Keep reasons generic, without medical or financial details. Posting a note grants nothing and does not require an encryption role. Reset is authorized by the finance encryption role, not by a separate owner identity.

## Deployment and recovery

- Run **one Node server process on one host**, with persistent local disk. Do not deploy this JSON store on serverless, multiple replicas, a network filesystem or an ephemeral volume. A shared transactional database and shared DPoP replay cache are needed before scaling.
- Writes use an exclusive lock directory, read-modify-write under that lock, file sync and atomic rename. Readers see a complete old or new file. Concurrent reset is serialized with writes. A damaged file returns 503 and is never silently replaced, including by reset.
- If a process dies holding `data/vault.json.lock`, requests time out after five seconds and return 503. Stop all app processes, back up the data directory, inspect/restore `vault.json`, then remove **only** the stale `data/vault.json.lock` directory and abandoned `vault.json.*.tmp` files before restarting. Do not remove locks while a writer is active. Backups and filesystem access controls remain the operator's responsibility.
- `KINKEY_ATTACKER_VIEW=off` disables `/api/raw` everywhere. Production (`npm start`) disables it by default; explicitly set `KINKEY_ATTACKER_VIEW=on` only for the synthetic demo. Development retains the existing default-on demo behavior. This endpoint exposes the entire store, including board notes.
- Behind a reverse proxy, set `KINKEY_PUBLIC_ORIGIN` to the exact browser origin, for example `https://demo.example.org` (no trailing slash). DPoP checks do not trust forwarded headers. Use HTTPS outside localhost.
- Bound tokens require `Authorization: DPoP <token>` and a signed proof matching the token's key thumbprint, token hash, method, URL and time. Proof IDs are rejected on reuse within the freshness window. Unbound Bearer tokens remain supported for realms without DPoP; this is not a claim that every session is sender-constrained. Replay history is process-local and resets on restart.
- The SDK relay is served at `/tide_dpop/iss/<hex>/aud/<hex>/tide_dpop_auth.html`, with SDK CSP and realm/client checks. Live browser login with this route still needs verification against the team's realm.

## Remaining team checks

The real adapter, TideCloak service and family sessions were unavailable during this backend pass. Cross-user decryption (V3), finance denial/grant (V4/V6), quorum threshold (V5), revocation (V7), real stored demo ciphertext (V8), bootstrap behavior (V9), and single-admin rejection (V10) remain untested. Do not turn these into verified claims in UI copy or the video. In-app QEA approval features remain deferred until the P0 tests pass.

Tide guidance consulted through Raziel: `verify-jwt-server-side` and `protect-api-nextjs` at https://mcp.tide.org/mcp. The latter includes a stale paragraph saying not to verify DPoP proofs; the former explicitly corrects it. This implementation follows the corrected proof-verification guidance and keeps the official `verifyTideCloakToken` helper.
