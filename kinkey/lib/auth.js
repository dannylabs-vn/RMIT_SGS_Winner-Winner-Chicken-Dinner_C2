// Official verifier also re-exported by @tidecloak/nextjs/server.
import { verifyTideCloakToken } from "@tidecloak/verify";
import { calculateJwkThumbprint, decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import { createHash } from "node:crypto";

// Shared across Next route bundles. Single-process deployment is required for
// replay protection; a multi-instance deployment needs a shared replay cache.
const replayKey = Symbol.for("kinkey.dpop.replays");
const replays = globalThis[replayKey] ||= new Map();

async function verifyProof(req, token, claims, scheme) {
  const binding = claims.cnf?.jkt;
  if (!binding) return scheme.toLowerCase() === "bearer" && !claims.cnf;
  if (scheme.toLowerCase() !== "dpop") return false;
  const proof = req.headers.get("dpop");
  if (!proof || proof.length > 16384) return false;
  const header = decodeProtectedHeader(proof);
  if (header.typ !== "dpop+jwt" || !["ES256", "EdDSA"].includes(header.alg) ||
      !header.jwk || header.jwk.d || header.jwk.k) return false;
  const key = await importJWK(header.jwk, header.alg);
  const { payload } = await jwtVerify(proof, key, { algorithms: ["ES256", "EdDSA"] });
  const now = Math.floor(Date.now() / 1000);
  const url = new URL(req.url);
  // Set this explicitly behind a reverse proxy. Never trust forwarded headers.
  const origin = process.env.KINKEY_PUBLIC_ORIGIN || url.origin;
  if (payload.htm !== req.method || payload.htu !== `${origin}${url.pathname}` ||
      !Number.isInteger(payload.iat) || payload.iat < now - 120 || payload.iat > now + 5 ||
      typeof payload.jti !== "string" || !payload.jti || payload.jti.length > 256 ||
      payload.ath !== createHash("sha256").update(token).digest("base64url") ||
      binding !== await calculateJwkThumbprint(header.jwk)) return false;
  for (const [id, expiry] of replays) if (expiry < now) replays.delete(id);
  const id = `${binding}:${payload.jti}`;
  if (replays.has(id) || replays.size >= 10000) return false;
  replays.set(id, payload.iat + 121);
  return true;
}

export async function verifyRequest(req, config, allowedRoles = []) {
  const match = /^(Bearer|DPoP) ([^\s]+)$/i.exec(req.headers.get("authorization") || "");
  if (!match || match[2].length > 32768) return null;
  // Prevent the SDK's remote-JWKS fallback if the Tide embedded key is absent.
  if (!config?.jwk?.keys?.length || !config.realm || !config.resource || !config["auth-server-url"]) return null;
  try {
    const claims = await verifyTideCloakToken(config, match[2], allowedRoles);
    const now = Math.floor(Date.now() / 1000);
    if (!claims || typeof claims.sub !== "string" || !claims.sub ||
        !Number.isInteger(claims.exp) || claims.exp <= now ||
        !Number.isInteger(claims.iat) || claims.iat > now + 5) return null;
    // These encryption permissions must be realm roles, not client roles.
    if (allowedRoles.length && !allowedRoles.some((r) => rolesOf(claims).includes(r))) return null;
    return await verifyProof(req, match[2], claims, match[1]) ? claims : null;
  } catch { return null; }
}

export const rolesOf = (claims) => Array.isArray(claims?.realm_access?.roles) ? claims.realm_access.roles : [];
