"use client";

import { useCallback, useEffect, useState } from "react";
import { useTideCloak, Authenticated, Unauthenticated } from "@tidecloak/nextjs";
import Compartment from "../components/Compartment";
import { useApi, asText } from "../components/useApi";
import { COMPARTMENTS, DEMO_CONTENTS, encryptRole } from "../lib/compartments";

export default function Home() {
  const { isInitializing } = useTideCloak();
  if (isInitializing) return <p className="quiet center">Connecting to TideCloak…</p>;
  return (
    <>
      <Unauthenticated>
        <Landing />
      </Unauthenticated>
      <Authenticated>
        <Safe />
      </Authenticated>
    </>
  );
}

function Landing() {
  const { login } = useTideCloak();
  return (
    <section className="hero">
      <h1>A family safe with no key-holder.</h1>
      <p className="lede">
        This prototype explores immediate medical access and family-approved grants for money and documents.
        Cross-person decryption and the realm's quorum behavior still need live verification.
      </p>
      <button className="primary" onClick={login}>Sign in with Tide</button>
      <ol className="how">
        <li><strong>Set it up together.</strong> Mom stores what the family will need and chooses who holds a key.</li>
        <li><strong>Medical opens fast.</strong> Every key-holder can read allergies and medication immediately.</li>
        <li><strong>Money needs the family.</strong> The key to bank, insurance and land papers is granted only after the family’s quorum approves it.</li>
      </ol>
    </section>
  );
}

function Safe() {
  const { doDecrypt, doEncrypt, hasRealmRole, forceRefreshToken, refreshToken, getValueFromIdToken } = useTideCloak();
  const api = useApi();
  const [states, setStates] = useState(
    Object.fromEntries(COMPARTMENTS.map((c) => [c.id, { status: "loading" }]))
  );
  const [requests, setRequests] = useState([]);
  const [notice, setNotice] = useState("");
  const isOwner = COMPARTMENTS.every((c) => hasRealmRole(encryptRole(c.tag)));
  const name = getValueFromIdToken("preferred_username");

  const loadRequests = useCallback(async () => {
    try {
      const { requests } = await api("/api/requests");
      setRequests(requests);
    } catch {
      /* the board is optional for opening the safe */
    }
  }, [api]);

  // Fetch ciphertext, then ask the Tide network to open each compartment.
  // Whatever doDecrypt returns (plaintext or refusal) is what the UI shows.
  const open = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        // Pick up roles committed since sign-in (e.g. a newly approved grant).
        try {
          await (forceRefreshToken ? forceRefreshToken() : refreshToken());
        } catch {
          /* fall through and try with the current token */
        }
      }
      setStates(Object.fromEntries(COMPARTMENTS.map((c) => [c.id, { status: "loading" }])));
      let items = [];
      try {
        ({ items } = await api("/api/vault"));
      } catch (err) {
        setNotice(err.message);
        return;
      }
      const next = {};
      for (const c of COMPARTMENTS) {
        const mine = items.filter((i) => i.compartment === c.id);
        if (mine.length === 0) {
          next[c.id] = { status: "empty" };
          continue;
        }
        try {
          const plain = await doDecrypt(mine.map((i) => ({ encrypted: i.ciphertext, tags: [c.tag] })));
          const entries = plain.map((p, idx) => {
            const parsed = JSON.parse(asText(p));
            return { id: mine[idx].id, ...parsed };
          });
          next[c.id] = { status: "open", entries };
        } catch (err) {
          next[c.id] = {
            status: "sealed",
            count: mine.length,
            peek: String(mine[0].ciphertext).slice(0, 96) + "…",
            error: err?.message || String(err),
          };
        }
      }
      setStates(next);
      loadRequests();
    },
    [api, doDecrypt, forceRefreshToken, refreshToken, loadRequests]
  );

  useEffect(() => {
    open();
  }, [open]);

  async function loadDemo() {
    setNotice("Encrypting demo contents in this browser…");
    try {
      for (const c of COMPARTMENTS) {
        const entries = DEMO_CONTENTS[c.id];
        const ciphertexts = await doEncrypt(entries.map((e) => ({ data: JSON.stringify(e), tags: [c.tag] })));
        for (const ciphertext of ciphertexts) {
          await api("/api/vault", { method: "POST", body: { compartment: c.id, ciphertext } });
        }
      }
      setNotice("Demo contents saved. The server holds only ciphertext.");
      open();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function reset() {
    if (!window.confirm("Empty the safe and the family board? This cannot be undone.")) return;
    try {
      await api("/api/reset", { method: "POST" });
      setNotice("The safe is empty.");
      open();
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <div className="safe">
      <div className="safe-intro">
        <h1>{name ? `The family safe, opened by ${name}` : "The family safe"}</h1>
        <p className="lede">
          Each compartment opens only if the Tide network agrees that this session holds its key role.
          The app cannot fake that answer.
        </p>
        {isOwner && (
          <div className="row owner-tools">
            <button className="secondary" onClick={loadDemo}>Load demo contents</button>
            <button className="link-button" onClick={reset}>Empty the safe</button>
          </div>
        )}
        {notice && <p className="notice" role="status">{notice}</p>}
      </div>

      {COMPARTMENTS.map((c) => (
        <Compartment
          key={c.id}
          compartment={c}
          state={states[c.id]}
          requests={requests}
          onAdded={() => open()}
          onRetry={({ requestsOnly } = {}) => (requestsOnly ? loadRequests() : open({ refresh: true }))}
        />
      ))}
    </div>
  );
}
