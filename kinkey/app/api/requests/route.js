import { readStore, updateStore, verify, newId, displayName } from "../../../lib/server.js";
import { endpoint, json, readJson, fields, ApiError } from "../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public-to-the-family notes, not approvals. Never call QEA or change roles here.
export const GET = endpoint(async (req) => {
  if (!await verify(req)) return json({ error: "Sign in to see requests." }, 401);
  const { requests } = await readStore();
  return json({ requests });
});

export const POST = endpoint(async (req) => {
  const claims = await verify(req);
  if (!claims) return json({ error: "Sign in to ask the family." }, 401);
  const body = await readJson(req, 4096);
  fields(body, ["compartment", "reason"]);
  if (body.compartment !== "finance" || typeof body.reason !== "string" ||
      !body.reason.trim() || body.reason.trim().length > 280) {
    throw new ApiError(400, "Request finance access with a reason of 1 to 280 characters.");
  }
  const request = { id: newId(), compartment: "finance", by: displayName(claims),
    reason: body.reason.trim(), at: new Date().toISOString() };
  await updateStore((store) => {
    if (store.requests.length >= 100) throw new ApiError(409, "The prototype family board is full (100 requests).");
    store.requests.unshift(request);
  });
  return json({ request }, 201);
});
