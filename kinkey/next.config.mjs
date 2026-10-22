import { readFileSync } from "node:fs";

// "live": the official TideCloak SDK against a licensed realm (tidecloak.json with jwk keys).
// "simulated": Tide's Plan C stand-in (lib/simtide.js), used when no licensed adapter exists.
// Override with TIDE_MODE=live|simulated.
function tideMode() {
  if (process.env.TIDE_MODE === "live" || process.env.TIDE_MODE === "simulated") return process.env.TIDE_MODE;
  try {
    const adapter = JSON.parse(readFileSync(new URL("./tidecloak.json", import.meta.url), "utf8"));
    return adapter?.jwk?.keys?.length ? "live" : "simulated";
  } catch {
    return "simulated";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, env: { NEXT_PUBLIC_TIDE_MODE: tideMode() } };
export default nextConfig;
