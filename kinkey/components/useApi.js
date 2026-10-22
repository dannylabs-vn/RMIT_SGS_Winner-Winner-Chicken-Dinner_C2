"use client";

import { useCallback } from "react";
import { useTideCloak } from "./tide";

// Calls our API with the TideCloak access token. secureFetch upgrades the
// request to DPoP automatically when the realm binds tokens to the device.
export function useApi() {
  const { getToken, secureFetch } = useTideCloak();
  return useCallback(
    async (path, { method = "GET", body } = {}) => {
      const token = await getToken();
      const res = await secureFetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;
    },
    [getToken, secureFetch]
  );
}

// doDecrypt may hand back strings or bytes depending on the input type.
export const asText = (v) => (typeof v === "string" ? v : new TextDecoder().decode(v));
