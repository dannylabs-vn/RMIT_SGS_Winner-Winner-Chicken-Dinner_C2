# Where TideCloak fits: plan from Tide's MCP (2026-10-22)

Tide's Plan C asks teams to "use Tide's MCP to plan where TideCloak fits, and simulate TideCloak's sign-in, roles and access checks for now." This file records that plan. Source: Tide MCP at `https://mcp.tide.org/mcp` (`tide_choose_scenario`, `tide_scenario relationship-attestation`, playbooks `configure-e2ee-roles-and-policies`, `verify-jwt-server-side`, `protect-api-nextjs`, canon `troubleshooting`, `tide_hosting`), queried 2026-10-22.

## MCP recommendation

`tide_choose_scenario` for "family safe; medical readable by every family member; finance decryptable only after a family quorum approves the grant; server stores ciphertext only" returned the **encrypted-communication** scenario with Tide's built-in **`RelationshipAttestation:1`** contract (ships in the ORK; nothing to deploy).

Why it matters for KinKey: plain `doEncrypt`/`doDecrypt` is *self*-encryption, so only the encrypting user can decrypt (playbook `configure-e2ee-roles-and-policies`). A family sharing Mom's records needs a **policy**. `RelationshipAttestation` lets the ORK network release a decryption only when the caller is the policy's subject (a user, a group, or **holders of a role**) and also holds the realm role `_tide_decryptor` (read) or `_tide_encryptor` (write). Each policy is signed by the network after a `tide-realm-admin` approves it.

MCP status notes: the contract is on ORK `main` since 2026-10-16 and was measured end to end on a local test stack by Tide; whether the public network has it was not checked. Treat as **documented, not run by us**.

## Production mapping

| KinKey | TideCloak piece | Simulated now by |
|---|---|---|
| Family member signs in | TideCloak sign-in; tokens signed by the Tide network; DPoP-bound (`verify-jwt-server-side`) | `/api/sim/token`: ES256 token with `realm_access.roles` |
| Every family member can read Medical | Realm role `_tide_decryptor` for all members + a `RelationshipAttestation` policy, subject `Role: kinkey-medical`, assignment `medical`, roles `["_tide_decryptor"]` | Role `_tide_medical.selfdecrypt` for all four members |
| Mom writes both compartments | `_tide_encryptor` + policies with `["_tide_encryptor"]` for Mom's role | Mom holds both `*.selfencrypt` roles |
| Finance needs the family | Policy subject `Role: kinkey-finance`; **granting `kinkey-finance` to Lan is a QEA change request** that commits only at the realm's quorum of family admins | `/api/sim/realm`: grant commits at 3 of 4 approvals |
| Revocation | Remove `kinkey-finance` (also a QEA change); applies after token refresh | Same, via a revoke change request |
| Server can't read the safe | Keys split across ORKs; the app stores ciphertext only | Keys in `data/sim-network.json`, separate from `data/vault.json` |
| API authorization | `verifyTideCloakToken` + realm-role check + DPoP proof on every route (`lib/auth.js`, already implemented for live mode) | `verifySimRequest` on the same routes |

## Not yet done for live mode

- Switch live encryption from self-encryption tags to `RelationshipAttestation` policies (subject roles above); sign each policy via admin approval.
- Licence a realm (blocked 2026-10-22 by Tide's network: `Midgard.FinalizeWallet` 500 / `InitializeWallet` 503), run `tide_doctor`, then V1–V10 in `SETUP.md`.
- The simulated threshold (3 of 4) is our choice; the live realm's threshold must be observed (V5).
