import { SIMULATED, verifySimRequest, encryptValue, decryptValue } from "../../../../lib/simtide.js";
import { COMPARTMENTS, encryptRole, decryptRole } from "../../../../lib/compartments.js";
import { endpoint, json, readJson, fields, ApiError } from "../../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAGS = COMPARTMENTS.map((c) => c.tag);

// Simulated Tide network: doEncrypt / doDecrypt. The network, not the app, checks
// the caller's role for each tag and refuses otherwise. Plaintext is never stored or logged.
export const POST = endpoint(async (req) => {
  if (!SIMULATED) return json({ error: "Not found." }, 404);
  const claims = await verifySimRequest(req);
  if (!claims) return json({ error: "Sign in to use the Tide network." }, 401);
  const body = await readJson(req);
  fields(body, ["op", "items"]);
  if (!["encrypt", "decrypt"].includes(body.op) || !Array.isArray(body.items) || !body.items.length || body.items.length > 50 ||
      body.items.some((i) => !i || !TAGS.includes(i.tag) || typeof i.value !== "string" || i.value.length > 200000)) {
    throw new ApiError(400, "Send op and 1 to 50 items of {tag, value}.");
  }
  const roles = claims.realm_access?.roles || [];
  const needed = (tag) => (body.op === "encrypt" ? encryptRole(tag) : decryptRole(tag));
  const missing = body.items.find((i) => !roles.includes(needed(i.tag)));
  if (missing) {
    return json({ error: `The Tide network refused: this session does not hold ${needed(missing.tag)}.` }, 403);
  }
  try {
    const values = [];
    for (const i of body.items) values.push(await (body.op === "encrypt" ? encryptValue : decryptValue)(i.tag, i.value));
    return json({ values });
  } catch {
    throw new ApiError(422, "The Tide network could not decrypt this ciphertext.");
  }
});
