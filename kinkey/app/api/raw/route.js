import { NextResponse } from "next/server";
import { readStore } from "../../../lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DEMO ONLY: simulates an attacker (or a curious operator) who has copied the
// whole database. It is intentionally unauthenticated so the attacker view
// works without signing in. Disable with KINKEY_ATTACKER_VIEW=off.
export async function GET() {
  if (process.env.KINKEY_ATTACKER_VIEW === "off") {
    return NextResponse.json({ error: "Attacker view is turned off." }, { status: 404 });
  }
  return NextResponse.json(await readStore());
}
