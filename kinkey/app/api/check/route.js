import { readStore, updateStore, verify, newId, displayName, rolesOf } from "../../../lib/server.js";
import { encryptRole } from "../../../lib/compartments.js";
import { endpoint, json, readJson, ciphertextBody } from "../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = endpoint(async (req) => {
  if (!await verify(req)) return json({ error: "Sign in first." }, 401);
  const { checks } = await readStore();
  // Return all retained checks so one busy tag cannot hide the other tag.
  return json({ checks });
});

export const POST = endpoint(async (req) => {
  const claims = await verify(req, [encryptRole("medical"), encryptRole("finance")]);
  if (!claims) return json({ error: "You cannot encrypt for this tag." }, 403);
  const body = ciphertextBody(await readJson(req));
  if (!rolesOf(claims).includes(encryptRole(body.compartment))) return json({ error: "You cannot encrypt for this tag." }, 403);
  await updateStore((store) => {
    store.checks.unshift({ id: newId(), compartment: body.compartment, ciphertext: body.ciphertext,
      by: displayName(claims), at: new Date().toISOString() });
    store.checks = store.checks.slice(0, 20);
  });
  return json({ ok: true }, 201);
});
