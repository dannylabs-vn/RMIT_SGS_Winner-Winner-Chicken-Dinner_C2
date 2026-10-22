// Server-side helpers. This server is deliberately "dumb": it stores and
// returns ciphertext produced in the browser by TideCloak's doEncrypt, and it
// has no key that could turn that ciphertext back into plaintext.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { verifyTideCloakToken } from "@tidecloak/nextjs/server";
import tidecloakConfig from "../tidecloak.json";

const DATA_FILE = path.join(process.cwd(), "data", "vault.json");
const EMPTY = { items: [], requests: [], checks: [] };

export async function readStore() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export async function writeStore(store) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export const newId = () => crypto.randomUUID();

// Accepts "Bearer <token>" and "DPoP <token>" (secureFetch may upgrade to DPoP).
function tokenFrom(req) {
  const header = req.headers.get("authorization") || "";
  const parts = header.trim().split(/\s+/);
  return parts.length === 2 ? parts[1] : "";
}

// Returns verified claims, or null. `allowedRoles` means "at least one of".
export async function verify(req, allowedRoles) {
  const token = tokenFrom(req);
  if (!token) return null;
  try {
    return await verifyTideCloakToken(tidecloakConfig, token, allowedRoles);
  } catch {
    return null;
  }
}

export const displayName = (claims) =>
  claims?.preferred_username || claims?.name || claims?.sub || "unknown";

export const rolesOf = (claims) => claims?.realm_access?.roles || [];
