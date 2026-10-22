"use client";

import Link from "next/link";
import { useSafe } from "../../components/SafeProvider";
import { PageHead, SignedOut, timeAgo } from "../../components/ui";
import { findCompartment } from "../../lib/compartments";

export default function BoardPage() {
  const safe = useSafe();
  return (
    <>
      <PageHead eyebrow="Family" title="Family Board" art="board" tone="lilac">
        <p className="t-body-l">
          A shared note where key-holders explain why they need access. Posting here grants nothing; keys are granted only
          through Family approvals (TideCloak QEA).
        </p>
      </PageHead>
      {!safe ? (
        <SignedOut what="the family board" />
      ) : safe.requests.length === 0 ? (
        <div className="empty">
          <p className="t-body">No notes yet. To ask for the finance key, open <Link href="/finance#request">Finance &amp; Documents</Link>.</p>
        </div>
      ) : (
        <ul className="list">
          {safe.requests.map((r) => (
            <li key={r.id} className="activity-row">
              <div>
                <p className="t-body"><strong>{r.by}</strong> asked for {findCompartment(r.compartment)?.title || r.compartment}</p>
                <p className="t-body-s muted">“{r.reason}”</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="badge">Note only</span>
                <p className="t-body-s muted">{timeAgo(r.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
