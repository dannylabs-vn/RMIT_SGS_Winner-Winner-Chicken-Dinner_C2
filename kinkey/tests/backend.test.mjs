import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { generateKeyPair, exportJWK, SignJWT, calculateJwkThumbprint } from "jose";
import { verifyRequest } from "../lib/auth.js";
import { createStore } from "../lib/store.js";
import { checkPlaintext } from "../scripts/check-no-plaintext.mjs";
import { DEMO_CONTENTS } from "../lib/compartments.js";

// Real SDK signature checks against ephemeral local keys, never a live realm.
const directory = await mkdtemp(path.join(tmpdir(), "kinkey-test-"));
const originalCwd = process.cwd();
process.chdir(directory);
after(async () => { process.chdir(originalCwd); await rm(directory, { recursive: true, force: true }); });
const signing = await generateKeyPair("ES256");
const publicKey = await exportJWK(signing.publicKey);
const config = { realm: "test", resource: "test-app", "auth-server-url": "http://issuer.test", jwk: { keys: [publicKey] } };
await writeFile("tidecloak.json", JSON.stringify(config));
const routes = {};
for (const name of ["vault", "check", "requests", "reset", "raw"]) routes[name] = await import(`../app/api/${name}/route.js`);
const now = () => Math.floor(Date.now() / 1000);
async function token(extra = {}, key = signing.privateKey) {
  return new SignJWT({ sub: "mom", preferred_username: "mom", azp: config.resource,
    iss: "http://issuer.test/realms/test", iat: now(), exp: now() + 600, ...extra })
    .setProtectedHeader({ alg: "ES256" }).sign(key);
}
const owner = await token({ realm_access: { roles: ["_tide_medical.selfencrypt", "_tide_finance.selfencrypt"] } });
const reader = await token();
function request(url = "vault", method = "GET", access, body, headers = {}) {
  return new Request(`http://localhost:3000/api/${url}`, { method,
    headers: { ...(access ? { Authorization: `Bearer ${access}` } : {}), ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}) });
}
const cipher = { compartment: "medical", ciphertext: "opaque-test-fixture-not-real-tide-ciphertext" };

test("SDK rejects forged, expired, wrong issuer/client, future and incomplete tokens", async () => {
  assert.ok(await verifyRequest(request("vault", "GET", reader), config));
  const stranger = await generateKeyPair("ES256");
  for (const bad of ["forged", await token({}, stranger.privateKey), await token({ exp: now() - 60 }),
    await token({ iss: "http://evil.test" }), await token({ azp: "other" }), await token({ iat: now() + 100 }),
    await token({ exp: undefined }), await token({ sub: undefined })]) {
    assert.equal(await verifyRequest(request("vault", "GET", bad), config), null);
  }
  assert.equal(await verifyRequest(request("vault", "GET", reader), { ...config, jwk: undefined }), null);
  assert.equal(await verifyRequest(request("vault", "GET", null, undefined, { Authorization: `Basic ${reader}` }), config), null);
});

test("DPoP binding, method, URI, hash, freshness, signature and replay checks", async () => {
  const device = await generateKeyPair("ES256");
  const jwk = await exportJWK(device.publicKey);
  const bound = await token({ cnf: { jkt: await calculateJwkThumbprint(jwk) } });
  async function proof(extra = {}, proofKey = device.privateKey) {
    return new SignJWT({ jti: randomUUID(), htm: "GET", htu: "http://localhost:3000/api/vault", iat: now(),
      ath: createHash("sha256").update(bound).digest("base64url"), ...extra })
      .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk }).sign(proofKey);
  }
  const req = (p) => request("vault", "GET", null, undefined, { Authorization: `DPoP ${bound}`, ...(p ? { DPoP: p } : {}) });
  assert.equal(await verifyRequest(request("vault", "GET", bound), config), null);
  assert.equal(await verifyRequest(req(), config), null);
  for (const overrides of [{ htm: "POST" }, { htu: "http://evil.test/api/vault" }, { ath: "wrong" },
    { iat: now() - 121 }, { iat: now() + 60 }, { iat: undefined }, { jti: "" }]) {
    assert.equal(await verifyRequest(req(await proof(overrides)), config), null);
  }
  const other = await generateKeyPair("ES256");
  assert.equal(await verifyRequest(req(await proof({}, other.privateKey)), config), null);
  const valid = await proof();
  assert.ok(await verifyRequest(req(valid), config));
  assert.equal(await verifyRequest(req(valid), config), null);
});

test("all routes enforce auth, matching realm roles and original response contracts", async () => {
  for (const name of ["vault", "check", "requests"]) assert.equal((await routes[name].GET(request(name))).status, 401);
  for (const name of ["vault", "check", "reset"]) {
    assert.equal((await routes[name].POST(request(name, "POST"))).status, 403);
    assert.equal((await routes[name].POST(request(name, "POST", "forged", cipher))).status, 403);
    assert.equal((await routes[name].POST(request(name, "POST", reader, cipher))).status, 403);
  }
  assert.equal((await routes.requests.POST(request("requests", "POST"))).status, 401);
  const medical = await token({ realm_access: { roles: ["_tide_medical.selfencrypt"] } });
  const clientRole = await token({ resource_access: { "test-app": { roles: ["_tide_medical.selfencrypt"] } } });
  assert.equal((await routes.vault.POST(request("vault", "POST", clientRole, cipher))).status, 403);
  assert.equal((await routes.vault.POST(request("vault", "POST", medical, { ...cipher, compartment: "finance" }))).status, 403);
  const saved = await routes.vault.POST(request("vault", "POST", medical, cipher));
  assert.equal(saved.status, 201);
  assert.equal((await saved.json()).item.addedBy, "mom");
  assert.equal(saved.headers.get("cache-control"), "no-store");
  assert.equal((await routes.check.POST(request("check", "POST", owner, cipher))).status, 201);
  assert.equal((await routes.requests.POST(request("requests", "POST", reader, { compartment: "finance", reason: "Need access" }))).status, 201);
  const vault = await (await routes.vault.GET(request("vault", "GET", reader))).json();
  assert.equal(vault.items.length, 1);
  assert.equal((await routes.reset.POST(request("reset", "POST", medical))).status, 403);
  assert.equal((await routes.reset.POST(request("reset", "POST", owner))).status, 200);
  assert.deepEqual(JSON.parse(await readFile("data/vault.json", "utf8")), { items: [], requests: [], checks: [] });
});

test("validation rejects malformed, oversized, unknown fields and invalid board notes", async () => {
  for (const body of ["{bad", "null", "[]", { ...cipher, ciphertext: " " }, { ...cipher, label: "plaintext" },
    { ...cipher, compartment: "other" }, { ...cipher, ciphertext: "a".repeat(262145) }]) {
    assert.equal((await routes.vault.POST(request("vault", "POST", owner, body))).status, 400);
  }
  assert.equal((await routes.vault.POST(request("vault", "POST", owner, "a".repeat(350001)))).status, 413);
  assert.equal((await routes.vault.POST(request("vault", "POST", owner, cipher, { "Content-Type": "text/plain" }))).status, 415);
  for (const reason of [[], {}, "", "a".repeat(281)]) {
    assert.equal((await routes.requests.POST(request("requests", "POST", reader, { compartment: "finance", reason }))).status, 400);
  }
});

test("concurrent writes and reset serialize without losing records", async () => {
  const store = createStore(path.join(directory, "concurrent.json"));
  await Promise.all(Array.from({ length: 30 }, (_, id) => store.updateStore((s) => { s.items.push({ id }); })));
  assert.equal((await store.readStore()).items.length, 30);
  await store.updateStore((s) => { s.items = []; });
  assert.equal((await store.readStore()).items.length, 0);
  await assert.rejects(store.updateStore(() => { throw new Error("abort"); }));
  await store.updateStore((s) => { s.items.push({ id: "after-abort" }); });
  assert.equal((await store.readStore()).items.length, 1);
});

test("filesystem lock coordinates separate Node processes", async () => {
  const file = path.join(directory, "processes.json");
  const module = new URL("../lib/store.js", import.meta.url).href;
  const program = `import {createStore} from ${JSON.stringify(module)};
    const store = createStore(${JSON.stringify(file)});
    for(let i=0;i<10;i++) await store.updateStore(s => {s.items.push({pid:process.pid,i});});`;
  await Promise.all(Array.from({ length: 3 }, () => promisify(execFile)(process.execPath, ["--input-type=module", "-e", program])));
  assert.equal((await createStore(file).readStore()).items.length, 30);
});

test("collection limits preserve records and check history retains twenty", async () => {
  const full = { items: Array.from({ length: 1000 }, () => cipher), requests: Array.from({ length: 100 }, () => ({})), checks: [] };
  await writeFile("data/vault.json", JSON.stringify(full));
  assert.equal((await routes.vault.POST(request("vault", "POST", owner, cipher))).status, 409);
  assert.equal((await routes.requests.POST(request("requests", "POST", reader, { compartment: "finance", reason: "Need access" }))).status, 409);
  for (let i = 0; i < 21; i++) assert.equal((await routes.check.POST(request("check", "POST", owner, cipher))).status, 201);
  assert.equal((await (await routes.check.GET(request("check", "GET", reader))).json()).checks.length, 20);
  assert.equal(JSON.parse(await readFile("data/vault.json", "utf8")).items.length, 1000);
  await routes.reset.POST(request("reset", "POST", owner));
});

test("corrupt storage fails closed and is not overwritten, even by reset", async () => {
  await writeFile("data/vault.json", "broken-json");
  for (const response of [await routes.vault.GET(request("vault", "GET", reader)),
    await routes.reset.POST(request("reset", "POST", owner))]) {
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.includes(directory), false);
  }
  assert.equal(await readFile("data/vault.json", "utf8"), "broken-json");
  await writeFile("data/vault.json", JSON.stringify({ items: [], requests: [], checks: [] }));
});

test("raw dump requires explicit opt-in in production and honors off", async () => {
  const oldNode = process.env.NODE_ENV, oldView = process.env.KINKEY_ATTACKER_VIEW;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.KINKEY_ATTACKER_VIEW;
    assert.equal((await routes.raw.GET()).status, 404);
    process.env.KINKEY_ATTACKER_VIEW = "on";
    assert.equal((await routes.raw.GET()).status, 200);
    process.env.KINKEY_ATTACKER_VIEW = "off";
    assert.equal((await routes.raw.GET()).status, 404);
  } finally {
    if (oldNode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNode;
    if (oldView === undefined) delete process.env.KINKEY_ATTACKER_VIEW; else process.env.KINKEY_ATTACKER_VIEW = oldView;
  }
});

test("plaintext scan rejects empty/incomplete vaults and escaped demo text", () => {
  assert.throws(() => checkPlaintext('{"items":[]}'), /incomplete/);
  const items = Object.entries(DEMO_CONTENTS).flatMap(([compartment, entries]) => entries.map(() => ({ compartment, ciphertext: "opaque-fixture" })));
  assert.match(checkPlaintext(JSON.stringify({ items })), /^PASS/);
  items[0].ciphertext = "Penicillin (severe rash)";
  assert.throws(() => checkPlaintext(JSON.stringify({ items }).replace("Penicillin", "\\u0050enicillin")), /plaintext/);
});
