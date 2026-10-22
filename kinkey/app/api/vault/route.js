import { NextResponse } from "next/server";
import { readStore, writeStore, verify, newId, displayName } from "../../../lib/server";
import { findCompartment, encryptRole } from "../../../lib/compartments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Any signed-in family member can fetch ciphertext. Holding ciphertext is
// harmless: opening it needs a decrypt role checked by the Tide Fabric.
export async function GET(req) {
  const claims = await verify(req);
  if (!claims) return NextResponse.json({ error: "Sign in to view the safe." }, { status: 401 });
  const { items } = await readStore();
  return NextResponse.json({ items });
}

// Only someone holding `_tide_<tag>.selfencrypt` may add to a compartment.
// The body carries ciphertext only; plaintext never reaches this server.
export async function POST(req) {
  const body = await req.json().catch(() => null);
  const compartment = findCompartment(body?.compartment);
  if (!compartment || typeof body?.ciphertext !== "string" || !body.ciphertext) {
    return NextResponse.json({ error: "Send a compartment and its ciphertext." }, { status: 400 });
  }
  const claims = await verify(req, [encryptRole(compartment.tag)]);
  if (!claims) {
    return NextResponse.json(
      { error: `Adding to ${compartment.title} needs the role ${encryptRole(compartment.tag)}.` },
      { status: 403 }
    );
  }
  const store = await readStore();
  const item = {
    id: newId(),
    compartment: compartment.id,
    ciphertext: body.ciphertext,
    addedBy: displayName(claims),
    addedAt: new Date().toISOString(),
  };
  store.items.push(item);
  await writeStore(store);
  return NextResponse.json({ item }, { status: 201 });
}
