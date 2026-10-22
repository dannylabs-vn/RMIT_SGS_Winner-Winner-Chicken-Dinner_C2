"use client";

import { useState } from "react";
import Link from "next/link";
import { useTideCloak, SIMULATED } from "../components/tide";
import TwoCompartments, { SpotArt } from "../components/Illustration";
import { Icon } from "../components/Icons";
import { useSafe } from "../components/SafeProvider";
import { PageHead, Progress, StatusBadge, pendingGrant, timeAgo, vaultStatus } from "../components/ui";
import { COMPARTMENTS, ROLE_LABELS, decryptRole, findCompartment } from "../lib/compartments";

export default function Index() {
  const safe = useSafe();
  return safe ? <Home safe={safe} /> : <Landing />;
}

const PROMISES = [
  {
    tone: "medical",
    icon: "medical",
    title: "Medical opens fast",
    body: "Every key-holder can read allergies and medication immediately. In an emergency nobody waits for a vote.",
  },
  {
    tone: "finance",
    icon: "users",
    title: "Money needs the family",
    body: "The key to bank, insurance and land papers is granted only after the family’s quorum approves it.",
  },
  {
    tone: "blue",
    icon: "shield",
    title: "No single key-holder",
    body: "Contents are encrypted in the browser. The KinKey server stores ciphertext and can’t open it, and no admin can hand out the key alone.",
  },
];

function Landing() {
  const { login } = useTideCloak();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A family safe on TideCloak</p>
          <h1 className="t-display">A family safe with no key-holder.</h1>
          <p className="t-body-l">
            Medical details open for every key-holder at once. The key to money and documents is granted only after the
            family’s quorum approves it.
          </p>
          <button className="btn btn-primary" onClick={login}>Sign in with Tide</button>
        </div>
        <TwoCompartments className="hero-art" />
      </section>

      <section className="story" aria-labelledby="story-title">
        <p className="eyebrow">The story</p>
        <h2 id="story-title" className="t-hs">Minh works in Japan. Mom is in hospital. Lan is at her bedside.</h2>
        <p className="t-body-l muted">
          Lan reads Mom’s allergies straight away. The insurance papers stay sealed until the family agrees to give Lan the
          key, and then Mom’s letter opens.
        </p>
      </section>

      <ul className="promise-grid">
        {PROMISES.map((p) => (
          <li key={p.title} className={`promise promise-${p.tone}`}>
            <span className="promise-icon"><Icon name={p.icon} className="icon icon-lg" /></span>
            <h3 className="t-body-l" style={{ fontWeight: 600, color: "var(--ink)" }}>{p.title}</h3>
            <p className="t-body">{p.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function Home({ safe }) {
  const { hasRealmRole } = useTideCloak();
  const [confirmReset, setConfirmReset] = useState(false);
  const waiting = safe.realm?.changeRequests?.filter((c) => c.status === "pending") || [];

  return (
    <>
      <PageHead eyebrow="Your family safe" title="Your family, securely connected." art="family">
        <p className="t-body-l">Important information, available to the people you trust.</p>
        <p className="statement">
          <Icon name="shield" />
          Vault contents are encrypted in the browser before they are saved; the server stores only ciphertext.
        </p>
      </PageHead>

      {safe.notice && <p className="notice" role="status"><Icon name="alert" />{safe.notice}</p>}

      <section className="section" aria-labelledby="vaults-title">
        <h2 id="vaults-title" className="eyebrow">Vaults</h2>
        <ul className="vault-grid">
          {COMPARTMENTS.map((c) => {
            const state = safe.states[c.id];
            const pending = pendingGrant(safe.realm, safe.name, decryptRole(c.tag));
            const status = vaultStatus(state, hasRealmRole(decryptRole(c.tag)), pending);
            const restricted = state?.status === "sealed";
            const count = state?.status === "open" ? state.entries.length : state?.count;
            return (
              <li key={c.id} className={`vault-card vault-card-${c.id}`}>
                <div className="vault-card-top">
                  <span className="vault-icon"><Icon name={c.icon} className="icon icon-lg" /></span>
                  <StatusBadge status={status} />
                </div>
                <SpotArt name={c.id === "finance" && state?.status === "open" ? "finance-open" : c.id} className="vault-card-art" />
                <h3 className="t-hs">{c.title}</h3>
                <p className="t-body">{c.description}</p>
                <p className="t-body-s muted">
                  {count ? `${count} ${count === 1 ? "item" : "items"} stored` : state?.status === "empty" ? "Nothing stored yet" : " "}
                </p>
                {pending && <Progress value={pending.approvals.length} max={pending.threshold} />}
                <Link
                  className={`btn ${restricted && !pending ? "btn-primary" : "btn-secondary"}`}
                  href={restricted && c.id === "finance" && !pending ? `${c.href}#request` : c.href}
                >
                  {restricted && c.id === "finance" ? (pending ? "See your request" : "Request access") : c.action}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {SIMULATED && (
        <section className="section" aria-labelledby="approvals-title">
          <h2 id="approvals-title" className="eyebrow">Family approvals</h2>
          <div className="approval-strip">
            <SpotArt name="approvals" className="approval-art" />
            <div className="approval-copy">
              {waiting.length === 0 ? (
                <p className="t-body-l">No key requests are waiting for the family.</p>
              ) : (
                <>
                  <p className="t-body-l">
                    {waiting.length} key {waiting.length === 1 ? "request is" : "requests are"} waiting for the family.
                  </p>
                  <p className="t-body-s muted">
                    Latest: {waiting[0].action === "grant" ? "give" : "take back"} {ROLE_LABELS[waiting[0].role] || waiting[0].role}{" "}
                    {waiting[0].action === "grant" ? "to" : "from"} {waiting[0].member} · {waiting[0].approvals.length} of {safe.realm.threshold} approvals
                  </p>
                </>
              )}
              <Link className="btn btn-secondary" href="/approvals">Open family approvals</Link>
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="activity-title">
        <h2 id="activity-title" className="eyebrow">Recent family activity</h2>
        {safe.requests.length === 0 ? (
          <p className="t-body muted">No family activity yet.</p>
        ) : (
          <ul className="list">
            {safe.requests.slice(0, 5).map((r) => (
              <li key={r.id} className="activity-row">
                <span className="activity-who">
                  <span className="avatar" aria-hidden="true">{r.by.slice(0, 1).toUpperCase()}</span>
                  <span className="t-body-s">
                    <strong>{r.by}</strong> asked for {findCompartment(r.compartment)?.title || r.compartment}: “{r.reason}”
                  </span>
                </span>
                <span className="t-body-s muted">{timeAgo(r.at)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="t-body-s muted" style={{ marginTop: 16 }}>
          These are notes on the family board. Keys are granted only through family approvals.
        </p>
      </section>

      {safe.isOwner && (
        <section className="section owner" aria-labelledby="owner-title">
          <h2 id="owner-title" className="eyebrow">Owner tools</h2>
          <p className="t-body-s muted">
            Load the demo contents (encrypted in this browser), or empty the safe{SIMULATED ? " and reset everyone’s keys" : ""} to start the demo again.
          </p>
          <div className="actions">
            <button className="btn btn-secondary" onClick={safe.loadDemo}>Load demo contents</button>
            {confirmReset ? (
              <>
                <span className="t-body-s">Empty the safe and the family board? This cannot be undone.</span>
                <button className="btn btn-danger" onClick={() => { setConfirmReset(false); safe.reset(); }}>Yes, empty the safe</button>
                <button className="text-link" onClick={() => setConfirmReset(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Empty the safe</button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
