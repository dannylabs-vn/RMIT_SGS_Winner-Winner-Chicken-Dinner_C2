import { readStore, updateStore, verify, newId, displayName, rolesOf } from "../../../lib/server.js";
import { encryptRole } from "../../../lib/compartments.js";
import { endpoint, json, readJson, ciphertextBody, ApiError } from "../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = endpoint(async (req) => {
  if (!await verify(req)) return json({ error: "Sign in to view the safe." }, 401);
  const { items } = await readStore();
  return json({ items });
});

export const POST = endpoint(async (req) => {
  const claims = await verify(req, [encryptRole("medical"), encryptRole("finance")]);
  if (!claims) return json({ error: "Adding contents needs the compartment's encryption role." }, 403);
  const body = ciphertextBody(await readJson(req));
  if (!rolesOf(claims).includes(encryptRole(body.compartment))) return json({ error: "You cannot encrypt for this compartment." }, 403);
  const item = { id: newId(), compartment: body.compartment, ciphertext: body.ciphertext,
    addedBy: displayName(claims), addedAt: new Date().toISOString() };
  await updateStore((store) => {
    if (store.items.length >= 1000) throw new ApiError(409, "The prototype safe is full (1000 items).");
    store.items.push(item);
  });
  return json({ item }, 201);
});
