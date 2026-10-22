"use client";

import { useState } from "react";
import { useTideCloak } from "@tidecloak/nextjs";
import { encryptRole, decryptRole } from "../lib/compartments";
import { useApi } from "./useApi";

// state.status: "loading" | "empty" | "open" | "sealed"
// "open" and "sealed" come ONLY from a real doDecrypt call: success or refusal.
export default function Compartment({ compartment, state, onRetry, onAdded, requests }) {
  const { hasRealmRole, getConfig, doEncrypt } = useTideCloak();
  const api = useApi();
  const canAdd = hasRealmRole(encryptRole(compartment.tag));
  const holdsKey = hasRealmRole(decryptRole(compartment.tag));
  const isFinance = compartment.id === "finance";

  return (
    <section
      className={`compartment ${isFinance ? "lacquer" : "plain"} is-${state.status}`}
      aria-labelledby={`${compartment.id}-title`}
    >
      <div className="compartment-head">
        <div>
          <h2 id={`${compartment.id}-title`}>{compartment.title}</h2>
          <p className="rule">{compartment.rule}</p>
        </div>
        <Seal status={state.status} />
      </div>

      <p className="key-line">
        {holdsKey ? "Your session carries the key role for this compartment." : "Your session does not carry the key role for this compartment."}
        <span className="quiet"> ({decryptRole(compartment.tag)})</span>
      </p>

      {state.status === "loading" && <p className="quiet">Asking the Tide network to open it…</p>}

      {state.status === "empty" && (
        <p className="quiet">Nothing stored here yet.{canAdd ? " Add something below." : ""}</p>
      )}

      {state.status === "open" && (
        <ul className="contents">
          {state.entries.map((e) =>
            e.kind === "letter" ? (
              <li key={e.id} className="letter">
                <p className="letter-label">{e.label}</p>
                <blockquote>{e.value}</blockquote>
              </li>
            ) : (
              <li key={e.id}>
                <span className="entry-label">{e.label}</span>
                <span className="entry-value">{e.value}</span>
              </li>
            )
          )}
        </ul>
      )}

      {state.status === "sealed" && (
        <Sealed
          compartment={compartment}
          state={state}
          onRetry={onRetry}
          consoleUrl={consoleUrl(getConfig)}
          requests={requests}
        />
      )}

      {canAdd && <AddEntry compartment={compartment} doEncrypt={doEncrypt} api={api} onAdded={onAdded} />}
    </section>
  );
}

function Seal({ status }) {
  const label = { open: "Open", sealed: "Sealed", empty: "Empty", loading: "Checking" }[status];
  return (
    <div className={`seal seal-${status}`} role="status">
      <span>{label}</span>
    </div>
  );
}

function Sealed({ compartment, state, onRetry, consoleUrl, requests }) {
  const api = useApi();
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const mine = requests.filter((r) => r.compartment === compartment.id);

  async function ask(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/requests", { method: "POST", body: { compartment: compartment.id, reason } });
      setSent(true);
      setReason("");
      onRetry({ requestsOnly: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="sealed">
      <p>
        {state.count} {state.count === 1 ? "item is" : "items are"} stored here. The Tide network refused to
        open {state.count === 1 ? "it" : "them"} for this session.
      </p>
      <p className="cipher-peek" aria-label="A sample of the stored ciphertext">{state.peek}</p>
      {state.error && (
        <details>
          <summary>What the network said</summary>
          <p className="quiet">{state.error}</p>
        </details>
      )}

      {compartment.id === "finance" && (
        <>
          <form className="ask" onSubmit={ask}>
            <label htmlFor="reason">Why do you need it?</label>
            <textarea
              id="reason"
              rows={2}
              maxLength={280}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mom is in hospital and we need her insurance policy."
              required
            />
            <button type="submit">Ask the family</button>
            <p className="quiet">This reason is stored as readable text. Keep it generic; leave out medical and financial details.</p>
            {error && <p className="error">{error}</p>}
          </form>

          {sent && (
            <div className="next-steps">
              <p>Your request is on the family board. Nothing opens until the family quorum approves your key:</p>
              <ol>
                <li>In TideCloak, file the grant of <code>{decryptRole(compartment.tag)}</code> to your account.</li>
                <li>Family members authorize it under QEA Approvals. It commits only when the realm’s quorum is reached.</li>
                <li>Once it commits, come back and press “Try to open again”. The key then stays yours until the family revokes it.</li>
              </ol>
              {consoleUrl && (
                <a href={consoleUrl} target="_blank" rel="noreferrer">Open tide-console</a>
              )}
            </div>
          )}

          {mine.length > 0 && (
            <div className="board">
              <h3>Family board</h3>
              <ul>
                {mine.map((r) => (
                  <li key={r.id}>
                    <strong>{r.by}</strong> asked {timeAgo(r.at)}: “{r.reason}”
                  </li>
                ))}
              </ul>
              <p className="quiet">
                This board is a shared note. The signatures that actually open the safe live in TideCloak’s QEA Approvals.
              </p>
            </div>
          )}
        </>
      )}

      <button className="secondary" onClick={() => onRetry({})}>Try to open again</button>
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
      <button className="secondary" onClick={() => setOpen(true)}>
        Add to {compartment.title.toLowerCase()}
      </button>
    );
  }

  return (
    <form className="add" onSubmit={save}>
      <label htmlFor={`${compartment.id}-label`}>What is it?</label>
      <input id={`${compartment.id}-label`} value={label} onChange={(e) => setLabel(e.target.value)} required />
      <label htmlFor={`${compartment.id}-value`}>Details</label>
      <textarea id={`${compartment.id}-value`} rows={3} value={value} onChange={(e) => setValue(e.target.value)} required />
      <label className="inline">
        <input type="checkbox" checked={kind === "letter"} onChange={(e) => setKind(e.target.checked ? "letter" : "note")} />
        Show this as a letter
      </label>
      <div className="row">
        <button type="submit" disabled={busy}>{busy ? "Encrypting…" : "Encrypt and save"}</button>
        <button type="button" className="link-button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {error && <p className="error">{error}</p>}
      <p className="quiet">This entry is encrypted in your browser before it is sent. Board reasons are separate, readable notes.</p>
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

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : new Date(iso).toLocaleDateString();
}
