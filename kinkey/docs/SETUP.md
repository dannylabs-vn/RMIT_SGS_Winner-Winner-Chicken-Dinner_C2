# KinKey setup, verification and troubleshooting

## 1. Prerequisites
- Docker
- Node.js 22.13 or later
- A browser with two profiles (or one normal + one private window) to act as two family members

## 2. TideCloak setup
Tip: if you use an AI coding agent, this repo's `.mcp.json` adds Raziel (Tide's MCP). Ask it for the `start-tidecloak-dev` and `configure-e2ee-roles-and-policies` playbooks.

1. Start the dev server:
   ```bash
   sudo docker run --name mytidecloak -d -v .:/opt/keycloak/data/h2 -p 8080:8080 \
     -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
     tideorg/tidecloak-dev:latest
   ```
2. Create a Tide realm with QEA enabled. Fastest path, Tide's initializer:
   ```bash
   npm init @tidecloak/nextjs@latest tc-setup
   ```
   Manual path: [Set up QEA](https://docs.tide.org/Admin/SetupIGA). Encryption only works on a QEA-enabled realm.
3. In tide-console (`http://localhost:8080/realms/<realm>/tide-console/`) → Apps → your app: set Valid redirect URIs `http://localhost:3000/*` and Web origins `http://localhost:3000`. Approve in **QEA Approvals**.
4. Apps → your app → Credentials → download `tidecloak.json` into the KinKey project root.

## 3. Roles and governance
1. Turn on **Advanced** (bottom-left) → Roles → Realm roles → create, approving each in QEA Approvals:
   - `_tide_medical.selfencrypt`, `_tide_medical.selfdecrypt`
   - `_tide_finance.selfencrypt`, `_tide_finance.selfdecrypt`
2. Do **not** add these roles to `default-roles-<realm>`; that would give every user every key.
3. Sign up four Tide accounts through the app: `mom`, `lan`, `minh`, `uncle`.
4. Grant per user (each grant is a change request to approve):
   - `mom`: all four roles
   - `lan`, `minh`, `uncle`: `_tide_medical.selfdecrypt`
5. Make all four accounts Tide realm admins (see Set up QEA). From now on, role changes need the family quorum.

Tip: grant roles *before* adding the other admins, while approvals still need only you.

## 4. Application install
```bash
npm install
npm run dev        # http://localhost:3000
```
Optional: `KINKEY_ATTACKER_VIEW=off npm run dev` disables the demo-only database dump. Production disables it by default; use `KINKEY_ATTACKER_VIEW=on` only for a synthetic demo. In PowerShell set `$env:KINKEY_ATTACKER_VIEW="off"` before running `npm.cmd run dev`.

The adapter must include its embedded `jwk.keys` verification keys. An example adapter is not a working configuration. Run `npm test` for local backend checks and `npm run build` before handoff. See [BACKEND.md](BACKEND.md) for API contracts, limits, DPoP and recovery.

## 5. Verification tests
Run these in order and record results in [`VERIFICATION.md`](VERIFICATION.md). Stop at the first failure.
- **V1** Sign in as `mom`. **V2** has automated coverage with locally signed fixtures (`npm test`); repeat against the running app.
- **V3** *Two-person check* page: `mom` encrypts under `medical`; `lan` decrypts. Expect `PASS`.
- **V4** `mom` → *Load demo contents*. As `lan`: medical open, finance sealed.
- **V5** File a grant of `_tide_finance.selfdecrypt` to `lan`. Approve one admin at a time. Record after each approval whether it committed.
- **V6** After commit, `lan` → *Try to open again*. Expect finance open.
- **V7** Revoke the grant (approve to quorum). In `lan`'s already-open tab, note what is still on screen; reload and *Try to open again*. Expect sealed after reload.
- **V8** `npm run check:plaintext`. Expect `PASS`.
- **V9** As the bootstrap admin (`admin`/`password` on the master realm), try to grant `_tide_finance.selfdecrypt` to `lan` directly. Record whether it commits without the family. Do not claim anything about operators until this is recorded.
- **V10** As a single family admin, grant `_tide_finance.selfdecrypt` to yourself and approve only your own request. Expect pending.

## 6. Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| Login loops back to the start page | Redirect URI or web origin not committed | Approve the app change in QEA Approvals |
| API returns 401 after login | Realm without QEA signs tokens that `verifyTideCloakToken` rejects | Enable QEA on the realm |
| `doEncrypt` fails for `mom` | Missing `_tide_<tag>.selfencrypt` or grant not committed | Check QEA Approvals; sign out and in |
| `lan` still sealed after the grant committed | Old token | Press *Try to open again* (forces a token refresh) or sign out and in |
| V3 refused although `lan` holds `selfdecrypt` | `selfdecrypt` may only open data the same user encrypted | Record it as a finding; see Plan B in `docs/RUNBOOK-4H.md` |
| Build fails: cannot find `tidecloak.json` | File missing from project root | Download it from tide-console (step 2.4) |
