import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createStore } from "./store.js";
import { verifyRequest } from "./auth.js";
import { SIMULATED, verifySimRequest } from "./simtide.js";

export const { readStore, updateStore } = createStore(path.join(process.cwd(), "data", "vault.json"));
export const newId = () => randomUUID();
export { rolesOf } from "./auth.js";
export const displayName = (claims) => claims.preferred_username || claims.name || claims.sub;

export async function verify(req, allowedRoles) {
  if (!req.headers.get("authorization")) return null;
  if (SIMULATED) return verifySimRequest(req, allowedRoles);
  try {
    const config = JSON.parse(await readFile(path.join(process.cwd(), "tidecloak.json"), "utf8"));
    return await verifyRequest(req, config, allowedRoles);
  } catch { return null; }
}
