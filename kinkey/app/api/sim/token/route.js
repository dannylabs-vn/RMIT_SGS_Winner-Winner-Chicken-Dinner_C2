import { SIMULATED, MEMBERS, issueToken, verifySimRequest } from "../../../../lib/simtide.js";
import { endpoint, json, readJson, fields, ApiError } from "../../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simulated TideCloak sign-in and token refresh. 404 unless simulated mode is on.
// Sign-in: {member}. Refresh: {} with the current token; roles are re-read from the realm.
export const POST = endpoint(async (req) => {
  if (!SIMULATED) return json({ error: "Not found." }, 404);
  const body = await readJson(req, 1024);
  fields(body, ["member"]);
  let member = body.member;
  if (member === undefined) {
    const claims = await verifySimRequest(req);
    if (!claims) return json({ error: "Sign in again." }, 401);
    member = claims.preferred_username;
  } else if (!MEMBERS.includes(member)) {
    throw new ApiError(400, "Unknown family member.");
  }
  return json({ token: await issueToken(member) });
});
