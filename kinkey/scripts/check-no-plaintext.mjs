// V8 checks known demo fragments. It cannot prove arbitrary strings encrypted.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { DEMO_CONTENTS } from "../lib/compartments.js";

export function checkPlaintext(raw) {
  const data = JSON.parse(raw);
  if (!Array.isArray(data.items)) throw new Error("Invalid vault: items must be an array.");
  for (const [compartment, entries] of Object.entries(DEMO_CONTENTS)) {
    if (data.items.filter((i) => i.compartment === compartment && typeof i.ciphertext === "string" && i.ciphertext.trim()).length < entries.length) {
      throw new Error("Demo data is incomplete. Load demo contents in the owner's browser first.");
    }
  }
  const needles = Object.values(DEMO_CONTENTS).flat().flatMap((e) => [e.label, e.value])
    .flatMap((t) => t.split(/[.,:]/).map((s) => s.trim()).filter((s) => s.length >= 8));
  // Parse then stringify so JSON unicode escapes cannot conceal a known fragment.
  const normalized = JSON.stringify(data).toLowerCase();
  const hits = needles.filter((n) => normalized.includes(n.toLowerCase()));
  if (hits.length) throw new Error(`${hits.length} known demo plaintext fragment(s) found. Contents omitted.`);
  return `PASS: ${data.items.length} stored items; ${needles.length} known demo fragments absent. This is a scan, not proof of encryption.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(checkPlaintext(readFileSync(new URL("../data/vault.json", import.meta.url), "utf8")));
  } catch (error) {
    console.error(`FAIL: ${error.code === "ENOENT" ? "No vault yet. Load demo contents first." : error instanceof SyntaxError ? "Vault contains invalid JSON." : error.message}`);
    process.exitCode = 1;
  }
}
