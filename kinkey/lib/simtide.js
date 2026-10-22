// SIMULATED TideCloak (Tide's "Plan C", 2026-10-22: Tide's network could not license
// realms, and Tide asked teams to simulate sign-in, roles and access checks).
//
// What each part stands in for:
//   tokens        -> TideCloak access tokens (realm roles in realm_access.roles)
//   realm file    -> the realm's users, role mappings and QEA change requests
//   network file  -> the Tide network that performs doEncrypt/doDecrypt
//
// In real Tide no single server holds the signing or encryption keys; they are
// split across the ORK network. Here one process holds them. Never use this mode
// for real data. Enabled only when NEXT_PUBLIC_TIDE_MODE === "simulated".
import path from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, exportJWK, generateKeyPair, importJWK, jwtVerify } from "jose";
import { createStore } from "./store.js";
import { COMPARTMENTS, encryptRole, decryptRole } from "./compartments.js";

export const SIMULATED = process.env.NEXT_PUBLIC_TIDE_MODE === "simulated";
export const MEMBERS = ["mom", "lan", "minh", "uncle"];
export const THRESHOLD = 3; // simulated quorum: 3 of 4 family admins
export const ROLES = COMPARTMENTS.flatMap((c) => [encryptRole(c.tag), decryptRole(c.tag)]);
const ISSUER = "kinkey-simulated-tidecloak";
const TOKEN_SECONDS = 15 * 60;

const dataDir = () => path.join(process.cwd(), "data");
const initialRealm = () => ({
  users: {
    mom: [...ROLES],
    lan: [decryptRole("medical")],
    minh: [decryptRole("medical")],
    uncle: [decryptRole("medical")],
  },
  changeRequests: [],
});
const realmStore = () => createStore(path.join(dataDir(), "sim-realm.json"), {
  empty: initialRealm,
  valid: (d) => d.users && typeof d.users === "object" && Array.isArray(d.changeRequests),
});
const networkStore = () => createStore(path.join(dataDir(), "sim-network.json"), {
  empty: () => ({}),
  valid: () => true,
});

async function networkKeys() {
  let keys = await networkStore().readStore();
  if (!keys.signing) {
    keys = await networkStore().updateStore(async (store) => {
      if (!store.signing) {
        const { privateKey } = await generateKeyPair("ES256", { extractable: true });
        store.signing = await exportJWK(privateKey);
        store.tags = Object.fromEntries(COMPARTMENTS.map((c) => [c.tag, randomBytes(32).toString("base64")]));
      }
      return { ...store };
    });
  }
  return keys;
}

async function signingKeys() {
  const { signing } = await networkKeys();
  const { d, ...pub } = signing;
  return { priv: await importJWK(signing, "ES256"), pub: await importJWK(pub, "ES256") };
}

export const readRealm = () => realmStore().readStore();
export const resetRealm = () => realmStore().updateStore((realm) => { Object.assign(realm, initialRealm()); });
export const updateRealm = (change) => realmStore().updateStore(change);

export async function issueToken(member) {
  const realm = await readRealm();
  if (!MEMBERS.includes(member)) return null;
  const { priv } = await signingKeys();
  return new SignJWT({ preferred_username: member, realm_access: { roles: realm.users[member] || [] } })
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setIssuer(ISSUER)
    .setSubject(`sim-${member}`)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_SECONDS}s`)
    .sign(priv);
}

// Same contract as verifyRequest in auth.js: claims or null; roles come from the token,
// so a committed grant or revocation applies after the next token refresh, as in Tide.
export async function verifySimRequest(req, allowedRoles = []) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.get("authorization") || "");
  if (!match || match[1].length > 8192) return null;
  try {
    const { pub } = await signingKeys();
    const { payload } = await jwtVerify(match[1], pub, { issuer: ISSUER, algorithms: ["ES256"] });
    if (!MEMBERS.includes(payload.preferred_username)) return null;
    const roles = Array.isArray(payload.realm_access?.roles) ? payload.realm_access.roles : [];
    if (allowedRoles.length && !allowedRoles.some((r) => roles.includes(r))) return null;
    return payload;
  } catch { return null; }
}

const PREFIX = "simtide1.";
export async function encryptValue(tag, value) {
  const { tags } = await networkKeys();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(tags[tag], "base64"), iv);
  cipher.setAAD(Buffer.from(tag));
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export async function decryptValue(tag, ciphertext) {
  const { tags } = await networkKeys();
  if (typeof ciphertext !== "string" || !ciphertext.startsWith(PREFIX)) throw new Error("Not a KinKey ciphertext.");
  const raw = Buffer.from(ciphertext.slice(PREFIX.length), "base64url");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(tags[tag], "base64"), raw.subarray(0, 12));
  decipher.setAAD(Buffer.from(tag));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

export const newRequestId = () => randomUUID();
