# KinKey verification log

Record only observed results. Local fixtures do not establish Tide Fabric or QEA behavior.

Backend verification date: 2026-10-22 (Asia/Saigon). Node v24.18.0; Next.js 15.5.28; @tidecloak/nextjs 0.14.40; @tidecloak/verify 0.14.33.
Live TideCloak realm/version: unavailable. Tester for live checks: not assigned.

No live login/decryption/quorum result is available. Tide's current E2EE playbook documents self-encryption as encryptor-only; V3 remains unrun, not passed.

| ID | Test | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|
| V1 | Mom signs in | Name shown | No live realm/adapter available | ? | Not run |
| V2 | Missing/forged API token | 401 / 403 | GET vault 401; forged POST vault 403; missing-token reset 403 | Production HTTP smoke on port 3100; automated route tests | Pass locally |
| V3 | Lan decrypts Mom's medical value | Cross-person PASS | No family sessions available | ? | Not run |
| V4 | Lan opens loaded safe | Medical open, finance refused | No live encrypted demo data | ? | Not run |
| V5 | Grant with four admins | Observe actual threshold | No observation; no threshold assumed | ? | Not run |
| V6 | Lan after committed grant | Finance opens | No live grant | ? | Not run |
| V7a | Revocation, refresh/reload | Finance refused | No live revocation | ? | Not run |
| V7b | Revocation, already-open tab | Record retained contents | No live revocation | ? | Not run |
| V8 | Scan actual encrypted demo store | PASS | No vault exists; scanner correctly returned FAIL rather than a false PASS | `npm run check:plaintext`: ?No vault yet. Load demo contents first.? | Live test not run |
| V9 | Bootstrap admin attempts direct grant | Observe pending/committed | No master-realm access; no bypass claim | ? | Not run |
| V10 | Single family admin self-grant | Pending | No live approval | ? | Not run |

## Simulated TideCloak (Tide's Plan C), 2026-10-22

Tide announced that its network could not license realms and asked teams to simulate TideCloak's sign-in, roles and access checks ("judged exactly the same"). KinKey runs in simulated mode when `tidecloak.json` has no `jwk.keys` (`lib/simtide.js`, `components/SimTide.jsx`). These results are about the simulation, **not** live Tide behaviour; V1 and V3–V10 above remain unrun against a real realm.

Observed against `npm run dev` with direct API calls:
- `GET /api/vault` with no token: 401. With a forged token: 401.
- Lan (medical role only): simulated network refused `encrypt` and `decrypt` for `finance`; `POST /api/vault` for finance returned 403.
- Lan filed a grant of `_tide_finance.selfdecrypt`: pending after Lan's approval and after Mom's; a second approval by Lan returned "You already decided on this request."; Minh's approval committed it (3 of 4).
- Lan's pre-commit token was still refused after the commit; a refreshed token decrypted the finance ciphertext.
- Mom's reset emptied the vault and restored the starting role mappings.

Observed in a scripted headless-Chrome click-through: Mom loads demo contents; Lan sees Medical available and Finance restricted; Lan asks the family (badge "Pending approval 0/3", sidebar count 1); approvals by Lan, Mom and Minh commit the grant; Lan then reads Mom's letter. Attacker view lists seven `simtide1.` ciphertexts.

## Automated backend evidence

`npm test`: 10 tests passed, 0 failed. Tests use real signature verification against ephemeral local keys and temporary files outside the repo. They do not simulate or establish family quorum.

- Forged signatures, expired/future/incomplete claims, wrong issuer/client and unsupported auth schemes rejected; missing embedded keys fail closed.
- DPoP proof signature, method, URL, token hash, freshness and replay checked; bound-token Bearer replay rejected.
- Protected endpoints enforce authentication and matching realm roles; same-named client roles do not authorize encrypted writes.
- Malformed JSON, wrong content type, unknown fields, oversized ciphertext/bodies and invalid board reasons rejected.
- Concurrent writes preserve 30 records, including a separate test using three independent Node processes.
- Capacity limits return 409 without erasing existing entries; checks retain the latest 20.
- Corrupt data returns 503 and is preserved, including on reset.
- Production raw view requires explicit opt-in and honors `off`.
- Plaintext scanner rejects incomplete data and JSON-escaped known demo fragments. Synthetic opaque fixture PASS is not V8 evidence.

`npm audit`: 0 known vulnerabilities after the PostCSS 8.5.25 override.

`npm run build`: passed using a temporary copy of the example adapter for compilation only. The fixture was removed afterward; it was never a working login configuration. A real adapter is required for deployment and must be followed by a rebuild.

Production HTTP smoke: vault GET 401, forged vault POST 403, reset POST 403, raw GET 404; API responses carried `Cache-Control: no-store`. SDK DPoP relay returned 200 with CSP for the example realm/client and 403 for the wrong client. This checks route wiring, not live browser DPoP login.

See [BACKEND.md](BACKEND.md) for exact commands, API contracts and deployment limitations.
