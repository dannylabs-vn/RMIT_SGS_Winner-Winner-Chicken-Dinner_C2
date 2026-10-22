import { NextResponse } from "next/server";
import { writeStore, verify } from "../../../lib/server";
import { encryptRole } from "../../../lib/compartments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lets the owner (who can encrypt into the finance compartment) empty the
// safe so the demo can be repeated from a clean state.
export async function POST(req) {
  const claims = await verify(req, [encryptRole("finance")]);
  if (!claims) return NextResponse.json({ error: "Only the safe's owner can reset it." }, { status: 403 });
  await writeStore({ items: [], requests: [], checks: [] });
  return NextResponse.json({ ok: true });
}
