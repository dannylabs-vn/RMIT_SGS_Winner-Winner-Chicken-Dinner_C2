> ## ⛔ BEFORE ANY TIDE REALM IS SET UP: ASK THE USER THESE TWO THINGS AND WAIT
>
> Setting up a realm licenses it to an email address under Tide's Terms & Conditions. Both answers
> belong to the user. Ask now, in one message, before starting TideCloak or creating anything:
>
> **1. Licence email.** *"Which email address should manage your Tide licence?"* It must be a real
> address they control. Never invent one and never use a placeholder such as `admin@example.com`.
>
> **2. Terms & Conditions.** Show them the link — **https://tide.org/legal** — and ask: *"Do you agree
> to Tide's Terms & Conditions? (yes/no)"*
>
> Only the user can agree. Do not accept for them, do not infer agreement from an earlier
> instruction such as "just set it up", and do not proceed on silence. If they decline, STOP: do not
> start, create or license a realm.
>
> Then pass exactly what they said to the bootstrap: `TIDE_LICENSE_EMAIL=<their email>
> TIDE_TERMS_ACCEPTED=yes`. The pack's scripts exit with code 2 without both, and any init script
> you write yourself must do the same (canon `tidecloak-bootstrap`, AP-90). Ask once per realm; if
> `.env` already holds both from the user's earlier answer, do not ask again.

---
> ## ⛔ TWO QUESTIONS YOU MUST ASK THE USER BEFORE THIS BOOTSTRAP IS DONE
>
> Ask them at the **invite-link step**, where the script already stops and waits for a human —
> that is the only moment the user is present and idle. Ask as QUESTIONS and WAIT. Do not choose
> for them and report it afterwards; that is the single most repeated failure with this pack.
>
> **1. Branding.** Right now their users see *Tide's* logo at sign-in, not theirs. Offer: generate
> one from the app's type, they supply artwork, you write them an image-AI prompt, or leave it.
> Then call `tide_branding` and RUN the command.
>
> **2. What to collect from new users.** Tide gives each new user an account with **no name and no
> email**, and the Keycloak signup form is turned off. Ask which fields the app actually needs —
> a display name, first/last name, email (Tide does **not** need it for recovery), or nothing.
> Then call `tide_onboarding` with those fields: it returns a finished modal component to WRITE
> into the app, already wired. Never invent a placeholder email (AP-85).
>
> Both are cheap to change and expensive to not be asked about.

---
# Initialize Admin and Link Tide Account

Create the realm admin user, assign `tide-realm-admin`, generate the invite link, wait for account linking, approve user change requests, configure the IdP domain, and export the adapter JSON.

---

## When to Use

- After `bootstrap-realm-from-template` — realm exists with IGA enabled, client change requests approved
- Admin user does not yet exist in the realm

**Do not use** if the admin already has `tideUserKey` set. Check: `curl -H "Authorization: Bearer $TOKEN" "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" | jq -r '.[0].attributes.tideUserKey[0] // empty'`.

---

## Prerequisites

- TideCloak running with realm created and IGA enabled (playbook `bootstrap-realm-from-template` complete)
- `curl`, `jq` installed
- A browser to open the invite link (interactive step)

---

## Steps

### Step 1: Create admin user

```bash
TIDECLOAK_URL="${TIDECLOAK_URL:-http://localhost:8080}"
REALM_NAME="${REALM_NAME:-myapp}"
CLIENT_NAME="${CLIENT_NAME:-myclient}"
CLIENT_APP_URL="${CLIENT_APP_URL:-http://localhost:3000}"
ADMIN_EMAIL="${TIDE_LICENSE_EMAIL:?ask the user which email should manage their Tide licence (AP-90)}"

get_token() {
  curl -s -X POST "$TIDECLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=$KC_BOOTSTRAP_ADMIN_USERNAME" --data-urlencode "password=$KC_BOOTSTRAP_ADMIN_PASSWORD" -d "grant_type=password&client_id=admin-cli" \
    | jq -r '.access_token'
}

TOKEN="$(get_token)"
curl -s -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"email\":\"$ADMIN_EMAIL\",\"firstName\":\"Admin\",\"lastName\":\"User\",\"enabled\":true,\"emailVerified\":false,\"attributes\":{\"tideInvitable\":[\"true\"]}}"
```

`tideInvitable:["true"]` + `emailVerified:false` mark the user as pending Tide
enrollment (the `link-tide-account-action` required action).

### Step 1b: Approve user creation change request (if any)

With IGA enabled, user creation usually generates a change request. Approve before proceeding. **Note**: When the master admin token creates the first user, IGA may not generate a change request (the master admin bypasses realm-level IGA). The `approve_and_commit` function handles this gracefully — if no requests exist, it skips. VERIFIED (atproto-learnings L-02).

```bash
sleep 2
approve_and_commit users
```

(Use the `approve_and_commit` function from `bootstrap-realm-from-template`.)

**Failure if skipped**: User lookup in Step 2 returns `null`. Role lookup returns `{"error":"..."}` which gets passed as the role mapping body, producing `Invalid json representation for RoleRepresentation`.

### Step 2: Assign tide-realm-admin role

`tide-realm-admin` is a **client role** on the `realm-management` client, not a realm role.

> **ORDERING (important).** Committing this grant flips the realm
> firstAdmin -> multiAdmin, after which no server-driven governed write may run.
> In a full provisioning run, perform the grant + its commit LAST: after the admin
> has enrolled (Step 4) and after the IdP settings are re-signed (Step 6). The
> canonical scaffolder order is: create user -> drain -> mint invite -> enroll ->
> drain -> sign IdP settings -> grant tide-realm-admin -> final drain (flip).

```bash
TOKEN="$(get_token)"
USER_ID=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo "ERROR: Could not find admin user. Was the user change request approved?"
  exit 1
fi

TOKEN="$(get_token)"
CLIENT_UUID=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=realm-management" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

ROLE_JSON=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/clients/$CLIENT_UUID/roles/tide-realm-admin" \
  -H "Authorization: Bearer $TOKEN")

# Validate we got a role, not an error
if echo "$ROLE_JSON" | jq -e '.error' > /dev/null 2>&1; then
  echo "ERROR: tide-realm-admin role not found: $ROLE_JSON"
  exit 1
fi

TOKEN="$(get_token)"
curl -s -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "[$ROLE_JSON]"
```

### Step 3: Generate invite link

Use the required-action-link endpoint. **Do not use `execute-actions-email`** — it fails on the dev image without SMTP configuration (`"Invalid sender address 'null'"`). The direct link method works without SMTP. VERIFIED (LEARNINGS-batch-008 L-05).

```bash
TOKEN="$(get_token)"
INVITE_LINK=$(curl -s -X POST \
  "$TIDECLOAK_URL/admin/realms/$REALM_NAME/tideAdminResources/get-required-action-link?userId=$USER_ID&lifespan=43200" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '["link-tide-account-action"]')

echo "====================================="
echo "Open this link in a browser to link your admin Tide account:"
echo "$INVITE_LINK"
echo "====================================="
```

**This is an interactive step.** The admin must open the link in a browser and complete the Tide account linking flow. The script cannot automate this — it requires the user's browser.

### Step 4: Wait for account linking

```bash
echo "Waiting for admin to link Tide account..."
while true; do
  TOKEN="$(get_token)"
  KEY=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.[0].attributes.tideUserKey[0] // empty')
  [ -n "$KEY" ] && echo "Account linked." && break
  sleep 5
done
```

### Step 5: Approve user change requests

```bash
# Reuse approve_all_pending from bootstrap-realm-from-template.
# Current /iga/change-requests/... surface (replaces legacy /tide-admin/change-set/...).
# Bootstrap = FirstAdmin/Tideless: authorize signs server-side. Spec: canon/iga-change-requests-api.md.
approve_all_pending() {
  local TOKEN ready id

  TOKEN="$(get_token)"
  # NOTE: do NOT use bulk-authorize with actionTypeIn:["CREATE","DELETE"] — those are
  # not real action-type values (real ones are CREATE_USER, DELETE_REALM,
  # UPDATE_PROTOCOL_MAPPER, ADOPT_SCOPE_MAPPING, GRANT_ROLES, ...). That filter matches
  # nothing and silently authorizes ZERO CRs with a 200. Omitting the filter returns 400.
  # Authorize each pending CR individually instead. VERIFIED 2026-08-06.
  # See canon/iga-change-requests-api.md.
  ids=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests?status=PENDING" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | jq -r 'if type=="array" then (.[] | select(.actionType | IN("DISABLE_IGA","DELETE_REALM","OFFBOARD_REALM") | not) | .id) else empty end' 2>/dev/null)
  for id in $ids; do
    TOKEN="$(get_token)"
    curl -s -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests/$id/authorize" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1 || true
  done

  for pass in 1 2 3 4 5; do
    TOKEN="$(get_token)"
    ready=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests?status=PENDING" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null \
      | jq -r '.[] | select(.actionType | IN("DISABLE_IGA","DELETE_REALM","OFFBOARD_REALM") | not) | select(.readyToCommit==true) | .id' 2>/dev/null)
    [ -z "$ready" ] && break
    for id in $ready; do
      TOKEN="$(get_token)"
      curl -s -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests/$id/commit" \
        -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1
    done
  done
}
approve_and_commit() { approve_all_pending; }

approve_and_commit users
approve_and_commit roles
approve_and_commit clients
```

**Sweep all types.** Account linking generates a user change request for the `tideUserKey` attribute write. The IGA toggle and setUpTideRealm may also have generated accumulated client change requests. Approve all three types here. VERIFIED (atproto-learnings L-06, L-07).

### Step 6: Point the tide IdP at the console origin and sign IdP settings

Set `CustomAdminUIDomain` to THIS realm's TideCloak console origin
(`{base}/realms/{realm}/tide-console/`) so enclave approval popups target the
built-in console, then re-sign. `sign-idp-settings` needs healthy ORKs.

```bash
TOKEN="$(get_token)"
TIDE_CONSOLE_ORIGIN="$TIDECLOAK_URL/realms/$REALM_NAME/tide-console/"
INST=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/tide" \
  -H "Authorization: Bearer $TOKEN")
UPDATED=$(echo "$INST" | jq --arg d "$TIDE_CONSOLE_ORIGIN" '.config.CustomAdminUIDomain=$d')
curl -s -X PUT "$TIDECLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/tide" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d "$UPDATED"

curl -s -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/vendorResources/sign-idp-settings" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: Export adapter JSON

```bash
TOKEN="$(get_token)"
CLIENT_UUID=$(curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_NAME" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

ADAPTER_OUTPUT="${ADAPTER_OUTPUT:-./data/tidecloak.json}"
curl -s "$TIDECLOAK_URL/admin/realms/$REALM_NAME/vendorResources/get-installations-provider?clientId=$CLIENT_UUID&providerId=keycloak-oidc-keycloak-json" \
  -H "Authorization: Bearer $TOKEN" > "$ADAPTER_OUTPUT"

echo "Adapter config saved to $ADAPTER_OUTPUT"
```

Verify the export:
```bash
node -e "const c=require('$ADAPTER_OUTPUT'); console.log('jwk:', !!c.jwk, 'vendorId:', !!c.vendorId, 'homeOrkUrl:', !!c.homeOrkUrl)"
```

---

## Verification

- [ ] Admin user exists with `tideUserKey` attribute set
- [ ] `tide-realm-admin` assigned (client role on `realm-management`)
- [ ] No pending user change requests remain
- [ ] CustomAdminUIDomain matches app origin
- [ ] Adapter JSON at `$ADAPTER_OUTPUT` contains `jwk`, `vendorId`, `homeOrkUrl`

---

## Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Invite link returns 404 | `requiredActions` missing from realm template | Use full template with `link-tide-account-action` |
| "Could not find configuration for Required Action" | Tide env vars missing from container | Restart container with all required env vars |
| `tideUserKey` never appears | Admin didn't complete the linking flow | Open invite link in browser, complete the flow |
| Enclave popups don't work from app | CustomAdminUIDomain not set | Run Step 6 |
| Adapter JSON missing `jwk` | `setUpTideRealm` did not run / no `tide-vendor-key` component + EdDSA key on the realm (the `jwk` is gated on those, not on IGA) | Re-run `setUpTideRealm` from `bootstrap-realm-from-template` Step 4 and confirm it returned 200 |

---

## Anti-Patterns

- **Do not** auto-approve IGA role assignments from the backend. `requiresApprovalPopup: true` means the browser enclave is required for VVK-signed UserContexts.
- **Do not** skip the invite link step. Account linking is interactive by design.
- **Do not** use `hasRealmRole("tide-realm-admin")` to check admin status. It is a client role on `realm-management`. Use `hasClientRole("tide-realm-admin", "realm-management")`.

---

## Next Step

Bootstrap is complete. Proceed to app integration:
- Fresh app → playbook `add-auth-nextjs-fresh`
- E2EE needed → playbook `configure-e2ee-roles-and-policies`
