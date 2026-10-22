"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTideCloak } from "@tidecloak/nextjs";

// Redirect target after Tide sign-in (the SDK default is /auth/redirect).
export default function RedirectPage() {
  const { authenticated, isInitializing, logout } = useTideCloak();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "failed") {
      sessionStorage.setItem("tokenExpired", "true");
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (!isInitializing) router.replace("/");
  }, [authenticated, isInitializing, router]);

  return <p className="quiet center">Finishing sign-in…</p>;
}
