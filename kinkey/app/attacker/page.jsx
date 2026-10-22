"use client";

import { useEffect, useState } from "react";
import { findCompartment } from "../../lib/compartments";

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
    <div className="attacker">
      <h1>What a thief sees</h1>
      <p className="lede">
        These are the vault records returned by the database dump endpoint. The server holds no decryption key.
        The full dump also contains readable family-board reasons and metadata.
      </p>
      {error && <p className="error">{error}</p>}
      {store && (
        <>
          <p className="tally">
            {store.items.length} stored {store.items.length === 1 ? "record" : "records"}; ciphertext shown as submitted.
          </p>
          <ul className="dump">
            {store.items.map((i) => (
              <li key={i.id}>
                <div className="dump-meta">
                  {findCompartment(i.compartment)?.title || i.compartment}, added by {i.addedBy}
                </div>
                <code>{i.ciphertext}</code>
              </li>
            ))}
          </ul>
          {store.items.length === 0 && <p className="quiet">The safe is empty. Load the demo contents first.</p>}
          <p className="quiet">
            Visible metadata includes compartment, author and time. The normal save flow encrypts contents and labels
            in the browser; the server cannot prove that arbitrary submitted strings are encrypted.
          </p>
        </>
      )}
    </div>
  );
}
