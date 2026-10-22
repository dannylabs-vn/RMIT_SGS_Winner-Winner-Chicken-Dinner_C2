"use client";

import { useEffect, useState } from "react";
import { findCompartment } from "../../lib/compartments";
import { PageHead } from "../../components/ui";

// Shows the database exactly as stored, as someone who copied it would see it.
export default function AttackerView() {
  const [store, setStore] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/raw")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setStore(d)))
      .catch(() => setError("Could not load the database dump."));
  }, []);

  return (
    <>
      <PageHead eyebrow="Unauthorized observer’s view" title="What a thief sees" art="thief" tone="ink">
        <p className="t-body-l">
          These are the vault records returned by the database dump endpoint. The server holds no decryption key. The full
          dump also contains readable family-board reasons and metadata.
        </p>
      </PageHead>
      {error && <p className="notice" role="alert">{error}</p>}
      {store && (
        <>
          <p className="t-hs" style={{ marginBottom: 16 }}>
            {store.items.length} stored {store.items.length === 1 ? "record" : "records"}
          </p>
          <p className="t-body-s muted">Ciphertext is shown exactly as submitted.</p>
          {store.items.length === 0 ? (
            <div className="empty" style={{ marginTop: 32 }}>
              <p className="t-body">The safe is empty. Load the demo contents first.</p>
            </div>
          ) : (
            <ul className="list" style={{ marginTop: 32 }}>
              {store.items.map((i) => (
                <li key={i.id} className="record">
                  <div className="record-meta">
                    <span>{findCompartment(i.compartment)?.title || i.compartment}</span>
                    <span>Added by {i.addedBy}</span>
                    <span className="mono">{i.id}</span>
                  </div>
                  <code className="mono">{i.ciphertext}</code>
                </li>
              ))}
            </ul>
          )}
          <p className="t-body-s muted" style={{ marginTop: 32 }}>
            Visible metadata includes compartment, author and time. The normal save flow encrypts contents and labels in the
            browser; the server cannot prove that arbitrary submitted strings are encrypted.
          </p>
        </>
      )}
    </>
  );
}
