"use client";

import { useState } from "react";
import { SIMULATED } from "../../components/tide";
import { useSafe } from "../../components/SafeProvider";
import { PageHead, Progress, SignedOut, timeAgo } from "../../components/ui";
import { ROLE_LABELS } from "../../lib/compartments";

// Simulated TideCloak QEA Approvals. Every count shown is read from the realm.
export default function ApprovalsPage() {
  const safe = useSafe();
  return (
    <>
      <PageHead eyebrow="Governed by the family" title="Family approvals" art="approvals" tone="gold">
        <p className="t-body-l">
          Who holds which key, and the key requests waiting for the family. A grant or revocation takes effect only when
          {SIMULATED ? " 3 of the 4 family members" : " the realm’s quorum"} approve it.
        </p>
        {SIMULATED && (
          <p className="t-body-s muted">Simulated TideCloak QEA (Tide’s Plan C). With a live realm, this happens in tide-console → QEA Approvals.</p>
        )}
      </PageHead>
      {!safe ? <SignedOut what="family approvals" /> : !SIMULATED ? <LiveNote /> : <Approvals safe={safe} />}
    </>
  );
}

function LiveNote() {
  return <p className="t-body">Approvals for this realm happen in TideCloak’s tide-console under QEA Approvals.</p>;
}

function Approvals({ safe }) {
  const [error, setError] = useState("");
  const [form, setForm] = useState({ action: "grant", member: "lan", role: "_tide_finance.selfdecrypt" });
  const realm = safe.realm;
  if (!realm) return <p className="loading-line" role="status">Loading the family realm…</p>;
  const me = safe.name;
  const pending = realm.changeRequests.filter((c) => c.status === "pending");
  const closed = realm.changeRequests.filter((c) => c.status !== "pending").slice(0, 8);

  async function run(body) {
    setError("");
    try {
      await safe.changeRealm(body);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      {error && <p className="notice" role="alert">{error}</p>}

      <section className="section" aria-labelledby="waiting">
        <h2 id="waiting" className="eyebrow">Waiting for the family ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="empty"><p className="t-body">No key requests are waiting.</p></div>
        ) : (
          <ul className="card-list">
            {pending.map((c) => {
              const decided = c.approvals.includes(me) || c.denials.includes(me);
              return (
                <li key={c.id} className="cr-card">
                  <div>
                    <p className="t-body">
                      <strong>{c.action === "grant" ? "Give" : "Take back"}</strong> {ROLE_LABELS[c.role] || c.role}{" "}
                      {c.action === "grant" ? "to" : "from"} <strong>{c.member}</strong>
                    </p>
                    <p className="t-body-s muted">
                      Filed by {c.requestedBy} {timeAgo(c.at)} · <span className="mono">{c.role}</span>
                    </p>
                    <p className="t-body-s">
                      {c.approvals.length} of {realm.threshold} approvals
                      {c.approvals.length ? `: ${c.approvals.join(", ")}` : ""}
                      {c.denials.length ? ` · declined by ${c.denials.join(", ")}` : ""}
                    </p>
                    <Progress value={c.approvals.length} max={realm.threshold} />
                  </div>
                  <div className="actions">
                    {decided ? (
                      <span className="badge">You {c.approvals.includes(me) ? "approved" : "declined"}</span>
                    ) : (
                      <>
                        <button className="btn btn-primary" onClick={() => run({ id: c.id, decision: "approve" })}>Approve</button>
                        <button className="btn btn-danger" onClick={() => run({ id: c.id, decision: "deny" })}>Decline</button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section" aria-labelledby="keys">
        <h2 id="keys" className="eyebrow">Who holds which key</h2>
        <div className="table-wrap">
          <table className="keys-table">
            <thead>
              <tr>
                <th scope="col">Family member</th>
                <th scope="col">Medical</th>
                <th scope="col">Finance &amp; Documents</th>
              </tr>
            </thead>
            <tbody>
              {realm.members.map((m) => (
                <tr key={m.name}>
                  <th scope="row">{m.name}{m.name === me ? " (you)" : ""}</th>
                  {["medical", "finance"].map((tag) => (
                    <td key={tag}>
                      <KeyChip on={m.roles.includes(`_tide_${tag}.selfdecrypt`)} label="Open" />
                      <KeyChip on={m.roles.includes(`_tide_${tag}.selfencrypt`)} label="Add" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="t-body-s muted" style={{ marginTop: 16 }}>
          A change shows here once committed. The member must refresh (“Try to open again”) before it applies to their session.
        </p>
      </section>

      <section className="section" aria-labelledby="file">
        <h2 id="file" className="eyebrow">File a key change</h2>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            run(form);
          }}
        >
          <div className="form-row">
            <div className="field">
              <label htmlFor="cr-action">Change</label>
              <select id="cr-action" className="select" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                <option value="grant">Give a key</option>
                <option value="revoke">Take back a key</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="cr-role">Key</label>
              <select id="cr-role" className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cr-member">Family member</label>
              <select id="cr-member" className="select" value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })}>
                {realm.members.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">File for approval</button>
        </form>
      </section>

      {closed.length > 0 && (
        <section className="section" aria-labelledby="history">
          <h2 id="history" className="eyebrow">Recent decisions</h2>
          <ul className="list">
            {closed.map((c) => (
              <li key={c.id} className="activity-row">
                <span className="t-body-s">
                  {c.action === "grant" ? "Give" : "Take back"} {ROLE_LABELS[c.role] || c.role} {c.action === "grant" ? "to" : "from"} {c.member}
                </span>
                <span className={`badge ${c.status === "committed" ? "badge-success" : "badge-error"}`}>
                  {c.status === "committed" ? "Committed" : "Declined"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function KeyChip({ on, label }) {
  return <span className={`key-chip${on ? " is-on" : ""}`}>{on ? "✓" : "–"} {label}</span>;
}
