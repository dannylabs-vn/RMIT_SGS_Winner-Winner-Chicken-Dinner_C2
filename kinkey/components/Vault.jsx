"use client";

import { useState } from "react";
import Link from "next/link";
import { useTideCloak, SIMULATED } from "./tide";
import { encryptRole, decryptRole, findCompartment } from "../lib/compartments";
import { useApi } from "./useApi";
import { useSafe } from "./SafeProvider";
import { Icon } from "./Icons";
import { SpotArt } from "./Illustration";
import { PageHead, Progress, SignedOut, StatusBadge, pendingGrant, timeAgo, vaultStatus } from "./ui";

// state.status: "loading" | "empty" | "open" | "sealed"
// "open" and "sealed" come ONLY from a real doDecrypt call: success or refusal.
export default function VaultPage({ id }) {
  const safe = useSafe();
  const compartment = findCompartment(id);
  if (!safe) {
    return (
      <>
        <PageHead eyebrow="Vault" title={compartment.title} art={compartment.id} tone={compartment.id}>
          <p className="t-body-l">{compartment.description}</p>
        </PageHead>
        <SignedOut what={compartment.title.toLowerCase()} />
      </>
    );
  }
  return (
    <Vault
      compartment={compartment}
      state={safe.states[id]}
      requests={safe.requests}
      pending={pendingGrant(safe.realm, safe.name, decryptRole(compartment.tag))}
      changeRealm={safe.changeRealm}
      me={safe.name}
      onAdded={() => safe.open()}
      onRetry={({ requestsOnly } = {}) => (requestsOnly ? safe.loadRequests() : safe.open({ refresh: true }))}
    />
  );
}

function Vault({ compartment, state, onRetry, onAdded, requests, pending, changeRealm, me }) {
  const { hasRealmRole, getConfig, doEncrypt } = useTideCloak();
  const api = useApi();
  const canAdd = hasRealmRole(encryptRole(compartment.tag));
  const holdsKey = hasRealmRole(decryptRole(compartment.tag));
  const status = vaultStatus(state, holdsKey, pending);

  return (
    <section aria-labelledby="vault-title" className={state.status === "open" ? "vault-open" : undefined}>
      <header className={`banner banner-${compartment.id}`}>
        <div className="banner-copy">
          <p className="eyebrow">Vault</p>
          <div className="row-between">
            <h1 id="vault-title" className="t-hm">{compartment.title}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="t-body-l">{compartment.description}</p>
          <p className="t-body-s muted">
            {compartment.rule}{" "}
            {holdsKey ? "Your session carries the key role" : "Your session does not carry the key role"}{" "}
            <code className="code">{decryptRole(compartment.tag)}</code>.
          </p>
        </div>
        {/* The art follows the real decrypt result: the open folder only after doDecrypt succeeds. */}
        <SpotArt name={compartment.id === "finance" && state.status === "open" ? "finance-open" : compartment.id} className="banner-art" />
      </header>

      {state.status === "loading" && <p className="loading-line" role="status">Asking the Tide network to open this vault…</p>}

      {state.status === "empty" && (
        <div className="empty">
          <p className="t-body">Nothing stored here yet.{canAdd ? " Add the first item below." : ""}</p>
        </div>
      )}

      {state.status === "open" && <ItemBrowser entries={state.entries} />}

      {state.status === "sealed" && (
        <Sealed
          compartment={compartment}
          state={state}
          holdsKey={holdsKey}
          onRetry={onRetry}
          consoleUrl={consoleUrl(getConfig)}
          requests={requests}
          pending={pending}
          changeRealm={changeRealm}
          me={me}
        />
      )}

      {canAdd && <AddEntry compartment={compartment} doEncrypt={doEncrypt} api={api} onAdded={onAdded} />}
    </section>
  );
}

function ItemBrowser({ entries }) {
  const [selectedId, setSelectedId] = useState(entries[0]?.id);
  const selected = entries.find((e) => e.id === selectedId) || entries[0];
  return (
    <div className="vault-layout">
      <ul className="item-list" aria-label="Items">
        {entries.map((e) => (
          <li key={e.id}>
            <button className="item-btn" aria-current={e.id === selected?.id ? "true" : undefined} onClick={() => setSelectedId(e.id)}>
              <span className="item-title">{e.label}</span>
              <span className="t-body-s muted">{e.kind === "letter" ? "Letter" : "Note"}</span>
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <article className="item-detail" key={selected.id} aria-live="polite">
          <p className="eyebrow">{selected.kind === "letter" ? "Letter" : "Note"}</p>
          <h2 className="t-hs">{selected.label}</h2>
          {selected.kind === "letter" ? (
            <blockquote className="letter-text" style={{ margin: 0 }}>{selected.value}</blockquote>
          ) : (
            <div className="detail-field">
              <span className="t-body-s muted">Details</span>
              <span className="t-body">{selected.value}</span>
            </div>
          )}
          <p className="t-body-s muted">Decrypted in this browser by the Tide network. Nothing here is stored in plaintext.</p>
        </article>
      )}
    </div>
  );
}

function Sealed({ compartment, state, holdsKey, onRetry, consoleUrl, requests, pending, changeRealm, me }) {
  const api = useApi();
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const mine = requests.filter((r) => r.compartment === compartment.id);
  const role = decryptRole(compartment.tag);

  async function ask(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/requests", { method: "POST", body: { compartment: compartment.id, reason } });
      // Simulated TideCloak: file the governed role grant itself (live: done in tide-console).
      if (SIMULATED && !pending) await changeRealm({ action: "grant", role, member: me });
      setSent(true);
      setReason("");
      onRetry({ requestsOnly: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="locked">
      <span className="lock-mark"><Icon name={holdsKey ? "alert" : "lock"} /></span>
      <h2 className="t-hs">{holdsKey ? "The Tide network could not open this vault" : "This vault is locked for you"}</h2>
      <p className="t-body">
        {state.count} {state.count === 1 ? "item is" : "items are"} stored here. The Tide network refused to open{" "}
        {state.count === 1 ? "it" : "them"} for this session.
        {holdsKey
          ? " Your token carries the key role, so this is a decryption failure rather than a missing permission."
          : compartment.id === "finance"
            ? " Access is granted only after the family's quorum approves it in TideCloak."
            : ""}
      </p>
      <p className="mono cipher" aria-label="A sample of the stored ciphertext">{state.peek}</p>
      {state.error && (
        <details>
          <summary>What the network said</summary>
          <p className="t-body-s muted">{state.error}</p>
        </details>
      )}

      {compartment.id === "finance" && (
        <>
          {!pending && (
          <form className="panel" id="request" onSubmit={ask}>
            <h3 className="t-body">Request access</h3>
            {SIMULATED && (
              <p className="t-body-s muted" style={{ marginBottom: 16 }}>
                This files a request for <span className="mono">{role}</span> in the family’s (simulated) TideCloak approvals and
                posts your reason on the family board.
              </p>
            )}
            <div className="field">
              <label htmlFor="reason">Why do you need it?</label>
              <textarea
                id="reason"
                className="textarea"
                rows={2}
                maxLength={280}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mom is in hospital and we need her insurance policy."
                required
              />
              <p className="hint">This reason is stored as readable text. Keep it generic; leave out medical and financial details.</p>
            </div>
            <button type="submit" className="btn btn-primary">Ask the family</button>
            {error && <p className="error-text" role="alert">{error}</p>}
          </form>
          )}

          {SIMULATED && pending && (
            <div className="panel panel-warning" role="status">
              <h3 className="t-body">Your key request is waiting for the family</h3>
              <p className="t-body">
                {pending.approvals.length} of {pending.threshold} family approvals so far
                {pending.approvals.length ? ` (${pending.approvals.join(", ")})` : ""}. The key is granted only when the
                quorum is reached. Then press “Try to open again”.
              </p>
              <Progress value={pending.approvals.length} max={pending.threshold} />
              <Link className="text-link" href="/approvals">Open Family approvals</Link>
            </div>
          )}

          {sent && !SIMULATED && (
            <div className="panel" role="status">
              <p className="t-body">Your note is on the family board. Nothing opens until the family quorum approves your key:</p>
              <ol>
                <li>In TideCloak, file the grant of <span className="mono">{decryptRole(compartment.tag)}</span> to your account.</li>
                <li>Family members authorize it under QEA Approvals. It commits only when the realm’s quorum is reached.</li>
                <li>Once it commits, come back and press “Try to open again”. The key then stays yours until the family revokes it.</li>
              </ol>
              {consoleUrl && (
                <a className="text-link" href={consoleUrl} target="_blank" rel="noreferrer">Open tide-console</a>
              )}
            </div>
          )}

          {mine.length > 0 && (
            <div className="panel">
              <h3 className="t-body">Family board</h3>
              <ul className="list" style={{ marginTop: 8 }}>
                {mine.map((r) => (
                  <li key={r.id} className="activity-row">
                    <span className="t-body-s"><strong>{r.by}</strong>: “{r.reason}”</span>
                    <span className="t-body-s muted">{timeAgo(r.at)}</span>
                  </li>
                ))}
              </ul>
              <p className="t-body-s muted" style={{ marginTop: 16 }}>
                This board is a shared note. The approvals that actually grant the key live in{" "}
                {SIMULATED ? "Family approvals (simulated TideCloak QEA)" : "TideCloak’s QEA Approvals"}.
              </p>
            </div>
          )}
        </>
      )}

      <button className="btn btn-secondary" onClick={() => onRetry({})}>Try to open again</button>
    </div>
  );
}

function AddEntry({ compartment, doEncrypt, api, onAdded }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState("note");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = JSON.stringify({ kind, label, value });
      const [ciphertext] = await doEncrypt([{ data: payload, tags: [compartment.tag] }]);
      await api("/api/vault", { method: "POST", body: { compartment: compartment.id, ciphertext } });
      setLabel("");
      setValue("");
      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err.message || "Could not encrypt and save this entry.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="add-area">
        <button className="btn btn-secondary" onClick={() => setOpen(true)}>
          Add to {compartment.title}
        </button>
      </div>
    );
  }

  return (
    <form className="panel add-area" onSubmit={save}>
      <h3 className="t-body">Add to {compartment.title}</h3>
      <div className="field">
        <label htmlFor={`${compartment.id}-label`}>What is it?</label>
        <input id={`${compartment.id}-label`} className="input" value={label} onChange={(e) => setLabel(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor={`${compartment.id}-value`}>Details</label>
        <textarea id={`${compartment.id}-value`} className="textarea" rows={3} value={value} onChange={(e) => setValue(e.target.value)} required />
      </div>
      <label className="check-row">
        <input type="checkbox" checked={kind === "letter"} onChange={(e) => setKind(e.target.checked ? "letter" : "note")} />
        Show this as a letter
      </label>
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Encrypting…" : "Encrypt and save"}</button>
        <button type="button" className="text-link" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <p className="t-body-s muted" style={{ marginTop: 16 }}>This entry is encrypted in your browser before it is sent. Board reasons are separate, readable notes.</p>
    </form>
  );
}

function consoleUrl(getConfig) {
  try {
    const c = getConfig() || {};
    const base = (c["auth-server-url"] || "").replace(/\/$/, "");
    return base && c.realm ? `${base}/realms/${c.realm}/tide-console/` : null;
  } catch {
    return null;
  }
}
