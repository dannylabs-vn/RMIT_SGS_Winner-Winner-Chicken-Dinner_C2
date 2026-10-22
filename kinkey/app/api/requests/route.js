import { NextResponse } from "next/server";
import { readStore, writeStore, verify, newId, displayName } from "../../../lib/server";
import { findCompartment } from "../../../lib/compartments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The family request board. It is a shared note so everyone sees who asked
// and why. It does NOT grant anything: the real approval is the governed
// role grant that a quorum signs in TideCloak (QEA Approvals).
export async function GET(req) {
  const claims = await verify(req);
  if (!claims) return NextResponse.json({ error: "Sign in to see requests." }, { status: 401 });
  const { requests } = await readStore();
  return NextResponse.json({ requests });
}

export async function POST(req) {
  const claims = await verify(req);
  if (!claims) return NextResponse.json({ error: "Sign in to ask the family." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const compartment = findCompartment(body?.compartment);
  const reason = String(body?.reason || "").trim().slice(0, 280);
  if (!compartment || !reason) {
    return NextResponse.json({ error: "Say which compartment and why you need it." }, { status: 400 });
  }
  const store = await readStore();
  const request = {
    id: newId(),
    compartment: compartment.id,
    by: displayName(claims),
    reason,
    at: new Date().toISOString(),
  };
  store.requests.unshift(request);
  await writeStore(store);
  return NextResponse.json({ request }, { status: 201 });
}
