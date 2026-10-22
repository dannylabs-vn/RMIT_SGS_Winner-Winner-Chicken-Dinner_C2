import { readStore } from "../../../lib/server.js";
import { endpoint, json } from "../../../lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deliberately public in the local demo. Production must explicitly opt in.
export const GET = endpoint(async () => {
  const setting = process.env.KINKEY_ATTACKER_VIEW;
  if (setting === "off" || (process.env.NODE_ENV === "production" && setting !== "on")) {
    return json({ error: "Attacker view is turned off." }, 404);
  }
  return json(await readStore());
});
