// Verification V8: scan the stored database for any demo plaintext.
// Run after "Load demo contents": npm run check:plaintext
import { readFileSync } from "fs";
import { DEMO_CONTENTS } from "../lib/compartments.js";

const raw = readFileSync(new URL("../data/vault.json", import.meta.url), "utf8");
const needles = Object.values(DEMO_CONTENTS).flat().flatMap((e) => [e.label, e.value])
  .flatMap((t) => t.split(/[.,:]/).map((s) => s.trim()).filter((s) => s.length >= 8));

const hits = needles.filter((n) => raw.includes(n));
const items = JSON.parse(raw).items.length;
if (hits.length) {
  console.error(`FAIL: ${hits.length} plaintext fragment(s) found in data/vault.json:`, hits);
  process.exit(1);
}
console.log(`PASS: ${items} stored item(s), ${needles.length} known plaintext fragments checked, none found.`);
