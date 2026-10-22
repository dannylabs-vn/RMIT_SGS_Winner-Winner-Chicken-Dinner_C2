import { NextResponse } from "next/server";
import { readStore, writeStore, verify, newId, displayName } from "../../../lib/server";
import { findCompartment, encryptRole } from "../../../lib/compartments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supports the cross-person check: person A encrypts, person B decrypts.
export async function GET(req) {
  const claims = await verify(req);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { checks } = await readStore();
  return NextResponse.json({ checks: checks.slice(0, 5) });
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const compartment = findCompartment(body?.compartment);
  if (!compartment || typeof body?.ciphertext !== "string") {
    return NextResponse.json({ error: "Send a compartment and ciphertext." }, { status: 400 });
  }
  const claims = await verify(req, [encryptRole(compartment.tag)]);
  if (!claims) return NextResponse.json({ error: "You cannot encrypt for this tag." }, { status: 403 });
  const store = await readStore();
  store.checks.unshift({
    id: newId(),
    compartment: compartment.id,
    ciphertext: body.ciphertext,
    by: displayName(claims),
    at: new Date().toISOString(),
  });
  store.checks = store.checks.slice(0, 20);
  await writeStore(store);
  return NextResponse.json({ ok: true }, { status: 201 });
}
