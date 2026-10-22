import { SIMULATED, MEMBERS, ROLES, THRESHOLD, readRealm, updateRealm, verifySimRequest, newRequestId } from "../../../../lib/simtide.js";
import { endpoint, json, readJson, fields, ApiError } from "../../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simulated TideCloak QEA: governed role changes. A grant or revocation commits
// only when THRESHOLD distinct family admins approve it. Every member is an admin.

export const GET = endpoint(async (req) => {
  if (!SIMULATED) return json({ error: "Not found." }, 404);
  if (!await verifySimRequest(req)) return json({ error: "Sign in to see the realm." }, 401);
  const realm = await readRealm();
  return json({ members: MEMBERS.map((name) => ({ name, roles: realm.users[name] || [] })), threshold: THRESHOLD, changeRequests: realm.changeRequests });
});

// {action: "grant"|"revoke", role, member} files a change request.
// {id, decision: "approve"|"deny"} records the caller's decision on one.
export const POST = endpoint(async (req) => {
  if (!SIMULATED) return json({ error: "Not found." }, 404);
  const claims = await verifySimRequest(req);
  if (!claims) return json({ error: "Sign in as a family admin." }, 401);
  const me = claims.preferred_username;
  const body = await readJson(req, 2048);

  if (body.id !== undefined) {
    fields(body, ["id", "decision"]);
    if (!["approve", "deny"].includes(body.decision)) throw new ApiError(400, "Decide approve or deny.");
    const changeRequest = await updateRealm((realm) => {
      const cr = realm.changeRequests.find((c) => c.id === body.id);
      if (!cr) throw new ApiError(404, "No such change request.");
      if (cr.status !== "pending") throw new ApiError(409, "This change request is already closed.");
      if (cr.approvals.includes(me) || cr.denials.includes(me)) throw new ApiError(409, "You already decided on this request.");
      (body.decision === "approve" ? cr.approvals : cr.denials).push(me);
      if (cr.approvals.length >= THRESHOLD) {
        const roles = new Set(realm.users[cr.member] || []);
        cr.action === "grant" ? roles.add(cr.role) : roles.delete(cr.role);
        realm.users[cr.member] = [...roles];
        cr.status = "committed";
        cr.closedAt = new Date().toISOString();
      } else if (cr.denials.length > MEMBERS.length - THRESHOLD) {
        cr.status = "denied";
        cr.closedAt = new Date().toISOString();
      }
      return { ...cr };
    });
    return json({ changeRequest });
  }

  fields(body, ["action", "role", "member"]);
  if (!["grant", "revoke"].includes(body.action) || !ROLES.includes(body.role) || !MEMBERS.includes(body.member)) {
    throw new ApiError(400, "Send a valid action, role and family member.");
  }
  const changeRequest = await updateRealm((realm) => {
    const has = (realm.users[body.member] || []).includes(body.role);
    if (body.action === "grant" && has) throw new ApiError(409, `${body.member} already holds this role.`);
    if (body.action === "revoke" && !has) throw new ApiError(409, `${body.member} does not hold this role.`);
    if (realm.changeRequests.some((c) => c.status === "pending" && c.member === body.member && c.role === body.role)) {
      throw new ApiError(409, "A request for this role is already waiting for approval.");
    }
    if (realm.changeRequests.length >= 200) throw new ApiError(409, "The simulated realm is full.");
    const cr = { id: newRequestId(), action: body.action, role: body.role, member: body.member, requestedBy: me,
      approvals: [], denials: [], status: "pending", at: new Date().toISOString() };
    realm.changeRequests.unshift(cr);
    return { ...cr };
  });
  return json({ changeRequest }, 201);
});
