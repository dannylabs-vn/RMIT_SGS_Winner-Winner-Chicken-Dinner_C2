"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTideCloak, SIMULATED } from "./tide";
import { useApi, asText } from "./useApi";
import { COMPARTMENTS, DEMO_CONTENTS, encryptRole } from "../lib/compartments";

// Shared, signed-in safe state for Home, Medical, Finance and the Family Board.
// Mounted only inside <Authenticated>; useSafe() returns null when signed out.
const SafeContext = createContext(null);
export const useSafe = () => useContext(SafeContext);

export function SafeProvider({ children }) {
  const { doDecrypt, doEncrypt, hasRealmRole, forceRefreshToken, refreshToken, getValueFromIdToken } = useTideCloak();
  const api = useApi();
  const [states, setStates] = useState(
    Object.fromEntries(COMPARTMENTS.map((c) => [c.id, { status: "loading" }]))
  );
  const [requests, setRequests] = useState([]);
  const [notice, setNotice] = useState("");
  const isOwner = COMPARTMENTS.every((c) => hasRealmRole(encryptRole(c.tag)));
  const name = getValueFromIdToken("preferred_username");

  const [realm, setRealm] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const { requests } = await api("/api/requests");
      setRequests(requests);
    } catch {
      /* the board is optional for opening the safe */
    }
  }, [api]);

  // Simulated TideCloak only: role mappings and QEA change requests, read from the realm.
  const loadRealm = useCallback(async () => {
    if (!SIMULATED) return;
    try {
      setRealm(await api("/api/sim/realm"));
    } catch {
      /* approvals view is optional for opening the safe */
    }
  }, [api]);

  const changeRealm = useCallback(
    async (body) => {
      const result = await api("/api/sim/realm", { method: "POST", body });
      await loadRealm();
      return result;
    },
    [api, loadRealm]
  );

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
      loadRealm();
    },
    [api, doDecrypt, forceRefreshToken, refreshToken, loadRequests, loadRealm]
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
    try {
      await api("/api/reset", { method: "POST" });
      setNotice("The safe is empty.");
      open();
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <SafeContext.Provider
      value={{ states, requests, notice, isOwner, name, open, loadRequests, loadDemo, reset, realm, loadRealm, changeRealm }}
    >
      {children}
    </SafeContext.Provider>
  );
}
