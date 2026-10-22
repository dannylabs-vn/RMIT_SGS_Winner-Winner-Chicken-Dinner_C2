"use client";

// Simulated stand-in for @tidecloak/nextjs (Tide's Plan C). Same hook surface the app
// uses, backed by /api/sim/*. Holds only the access token (sessionStorage); never plaintext.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const Ctx = createContext(null);
const KEY = "kinkey.sim.token";

function decode(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

export function TideCloakProvider({ children }) {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef(null);

  const save = useCallback((t) => {
    tokenRef.current = t;
    setToken(t);
    try {
      t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY);
    } catch {
      /* storage unavailable: session lasts for this page only */
    }
  }, []);

  useEffect(() => {
    try {
      const t = sessionStorage.getItem(KEY);
      const c = t && decode(t);
      if (c && c.exp * 1000 > Date.now()) save(t);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [save]);

  const post = useCallback(async (path, body, auth = true) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth && tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }, []);

  const value = useMemo(() => {
    const claims = token ? decode(token) : null;
    const refresh = async () => {
      const { token: t } = await post("/api/sim/token", {});
      save(t);
      return t;
    };
    const crypto = async (op, items) => (await post("/api/sim/crypto", { op, items })).values;
    return {
      simulated: true,
      authenticated: !!claims,
      isInitializing: !ready,
      login: () => window.location.assign("/signin"),
      signInAs: async (member) => save((await post("/api/sim/token", { member }, false)).token),
      logout: () => {
        save(null);
        window.location.assign("/");
      },
      getToken: async () => tokenRef.current,
      refreshToken: refresh,
      forceRefreshToken: refresh,
      hasRealmRole: (role) => (claims?.realm_access?.roles || []).includes(role),
      getValueFromIdToken: (key) => claims?.[key],
      getConfig: () => ({}),
      secureFetch: (url, opts) => fetch(url, opts),
      doEncrypt: (list) => crypto("encrypt", list.map((x) => ({ tag: x.tags[0], value: String(x.data) }))),
      doDecrypt: (list) => crypto("decrypt", list.map((x) => ({ tag: x.tags[0], value: x.encrypted }))),
    };
  }, [token, ready, post, save]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTideCloak = () => useContext(Ctx);
export function Authenticated({ children }) {
  const { authenticated, isInitializing } = useTideCloak();
  return !isInitializing && authenticated ? children : null;
}
export function Unauthenticated({ children }) {
  const { authenticated, isInitializing } = useTideCloak();
  return !isInitializing && !authenticated ? children : null;
}
