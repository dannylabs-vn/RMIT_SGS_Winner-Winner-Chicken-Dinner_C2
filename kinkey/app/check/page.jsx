"use client";

import { useState } from "react";
import { useTideCloak } from "../../components/tide";
import { COMPARTMENTS, encryptRole, decryptRole } from "../../lib/compartments";
import { useApi, asText } from "../../components/useApi";
import { useSafe } from "../../components/SafeProvider";
import { PageHead, SignedOut } from "../../components/ui";

// Answers the one question the whole idea depends on:
// can person B decrypt what person A encrypted under the same tag,
// as long as B holds `_tide_<tag>.selfdecrypt`?
export default function CheckPage() {
  const signedIn = useSafe() !== null;
  return (
    <>
      <PageHead eyebrow="Verification" title="Two-person check" art="medical" tone="medical">
        <p className="t-body-l">
          Run this before the demo. Sign in as Mom and encrypt a test value. Sign out, sign in as Lan and decrypt it. If Lan
          can read it, family members can open what Mom stored.
        </p>
      </PageHead>
      {signedIn ? <Checker /> : <SignedOut what="the two-person check" />}
    </>
  );
}

function Checker() {
  const { doEncrypt, doDecrypt, hasRealmRole, getValueFromIdToken } = useTideCloak();
  const api = useApi();
  const [tag, setTag] = useState("medical");
  const [log, setLog] = useState([]);
  const me = getValueFromIdToken("preferred_username");
  const add = (line) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${line}`, ...l]);

  async function encrypt() {
    try {
      const value = `Test written by ${me} at ${new Date().toLocaleTimeString()}`;
      const [ciphertext] = await doEncrypt([{ data: value, tags: [tag] }]);
      await api("/api/check", { method: "POST", body: { compartment: tag, ciphertext } });
      add(`Encrypted under "${tag}" and stored.`);
    } catch (err) {
      add(`Encrypt failed: ${err.message}`);
    }
  }

  async function decrypt() {
    try {
      const { checks } = await api("/api/check");
      const latest = checks.find((c) => c.compartment === tag);
      if (!latest) return add(`No test value stored under "${tag}" yet.`);
      const [plain] = await doDecrypt([{ encrypted: latest.ciphertext, tags: [tag] }]);
      add(`PASS: ${me} read a value written by ${latest.by}: "${asText(plain)}"`);
    } catch (err) {
      add(`Decrypt refused for ${me}: ${err.message}`);
    }
  }

  return (
    <div className="panel" style={{ display: "grid", gap: 16 }}>
      <p className="t-body">Signed in as <strong>{me}</strong>. Roles in this session:</p>
      <div className="chips">
        {COMPARTMENTS.map((c) => (
          <span key={c.id} className="badge">
            {c.tag}: {hasRealmRole(encryptRole(c.tag)) ? "encrypt" : "no encrypt"},{" "}
            {hasRealmRole(decryptRole(c.tag)) ? "decrypt" : "no decrypt"}
          </span>
        ))}
      </div>
      <div className="field" style={{ maxWidth: 320, margin: 0 }}>
        <label htmlFor="tag">Tag</label>
        <select id="tag" className="select" value={tag} onChange={(e) => setTag(e.target.value)}>
          {COMPARTMENTS.map((c) => (
            <option key={c.id} value={c.tag}>{c.tag}</option>
          ))}
        </select>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={encrypt}>Encrypt a test value</button>
        <button className="btn btn-secondary" onClick={decrypt}>Decrypt the latest test value</button>
      </div>
      <pre className="log" aria-live="polite">{log.join("\n") || "Results appear here."}</pre>
    </div>
  );
}
