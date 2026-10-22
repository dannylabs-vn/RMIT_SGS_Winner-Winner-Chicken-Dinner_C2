import { updateStore, verify } from "../../../lib/server.js";
import { encryptRole } from "../../../lib/compartments.js";
import { endpoint, json } from "../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = endpoint(async (req) => {
  if (!await verify(req, [encryptRole("finance")])) return json({ error: "Reset needs the finance encryption role." }, 403);
  await updateStore((store) => { store.items = []; store.requests = []; store.checks = []; });
  return json({ ok: true });
});
