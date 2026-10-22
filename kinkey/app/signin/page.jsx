"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTideCloak, SIMULATED } from "../../components/tide";
import { PageHead } from "../../components/ui";

const FAMILY = [
  { member: "mom", name: "Mom", color: "#f7c8a8", keys: "Set up the safe. Holds every key." },
  { member: "lan", name: "Lan", color: "#c9dafb", keys: "Daughter in Ho Chi Minh City. Medical key." },
  { member: "minh", name: "Minh", color: "#bfe5d3", keys: "Son working in Japan. Medical key." },
  { member: "uncle", name: "Uncle", color: "#ddd3f7", keys: "Mom's brother. Medical key." },
];

export default function SignIn() {
  const tide = useTideCloak();
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  if (!SIMULATED) {
    return (
      <>
        <PageHead eyebrow="Sign in" title="Sign in with Tide" art="family" />
        <button className="btn btn-primary" onClick={tide.login}>Continue to Tide</button>
      </>
    );
  }

  async function choose(member) {
    setBusy(member);
    setError("");
    try {
      await tide.signInAs(member);
      router.replace("/");
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }

  return (
    <>
      <PageHead eyebrow="Simulated Tide sign-in" title="Who is opening the safe?" art="family" tone="gold">
        <p className="t-body-l">
          Tide’s network is under load, so this prototype simulates TideCloak sign-in, roles and access checks (Tide’s Plan C).
          Choose a family member to continue as them.
        </p>
      </PageHead>
      <ul className="member-grid">
        {FAMILY.map((f) => (
          <li key={f.member}>
            <button className="member-card" onClick={() => choose(f.member)} disabled={!!busy}>
              <span className="avatar avatar-lg" style={{ background: f.color, color: "var(--ink)" }} aria-hidden="true">
                {f.name.slice(0, 1)}
              </span>
              <span className="t-body-l" style={{ fontWeight: 600, color: "var(--ink)" }}>{f.name}</span>
              <span className="t-body-s muted">{f.keys}</span>
              <span className="text-link">{busy === f.member ? "Signing in…" : `Continue as ${f.name}`}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="error-text" role="alert">{error}</p>}
    </>
  );
}
