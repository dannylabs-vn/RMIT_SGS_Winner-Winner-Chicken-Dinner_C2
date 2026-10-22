"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTideCloak, Authenticated, Unauthenticated, SIMULATED } from "./tide";
import { Brand } from "./Brand";
import { Icon } from "./Icons";
import { SafeProvider, useSafe } from "./SafeProvider";

const APP_NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/medical", label: "Medical", icon: "medical", group: "Vaults" },
  { href: "/finance", label: "Finance & Documents", icon: "finance" },
  { href: "/approvals", label: "Family approvals", icon: "users", group: "Family", badge: true },
  { href: "/board", label: "Family Board", icon: "board" },
  { href: "/security", label: "Security & Privacy", icon: "shield", group: "Trust" },
  { href: "/attacker", label: "What a thief sees", icon: "eye" },
  { href: "/check", label: "Two-person check", icon: "check" },
];

// Plan C disclosure: shown on every page while TideCloak is simulated.
function SimNotice() {
  if (!SIMULATED) return null;
  return (
    <div className="sim-notice" role="note">
      <Icon name="alert" />
      <span>
        <strong>Simulated TideCloak (Tide’s Plan C).</strong> Sign-in, roles, approvals and encryption are simulated while
        Tide’s network is under load. <a href="/security#tidecloak">Where&nbsp;TideCloak&nbsp;fits</a>
      </span>
    </div>
  );
}

const SITE_NAV = [
  { href: "/security", label: "Security & Privacy" },
  { href: "/attacker", label: "What a thief sees" },
];

export default function Shell({ children }) {
  const { isInitializing } = useTideCloak();
  if (isInitializing) {
    return (
      <SiteFrame>
        <p className="loading-line" role="status">Connecting to TideCloak…</p>
      </SiteFrame>
    );
  }
  return (
    <>
      <Unauthenticated>
        <SiteFrame>{children}</SiteFrame>
      </Unauthenticated>
      <Authenticated>
        <SafeProvider>
          <AppFrame>{children}</AppFrame>
        </SafeProvider>
      </Authenticated>
    </>
  );
}

function SiteFrame({ children }) {
  const pathname = usePathname();
  const { login, isInitializing } = useTideCloak();
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Brand />
          <nav className="site-nav" aria-label="Main">
            {SITE_NAV.map((l) => (
              <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <button className="btn btn-primary" onClick={login} disabled={isInitializing}>
            Sign in
          </button>
        </div>
      </header>
      <SimNotice />
      <main className="site-main">{children}</main>
    </>
  );
}

function AppFrame({ children }) {
  const pathname = usePathname();
  const { logout, getValueFromIdToken } = useTideCloak();
  const safe = useSafe();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = getValueFromIdToken("preferred_username") || "Signed in";
  const waiting = safe?.realm?.changeRequests?.filter((c) => c.status === "pending").length || 0;

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="app">
      <div className="mobile-bar">
        <button
          className="icon-btn"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon name={menuOpen ? "close" : "menu"} className="icon icon-lg" />
        </button>
        <Brand />
      </div>

      <aside id="sidebar" className={`sidebar${menuOpen ? " is-open" : ""}`}>
        <Brand />
        <nav className="side-nav" aria-label="Main">
          {APP_NAV.filter((l) => SIMULATED || l.href !== "/approvals").map((l) => (
            <div key={l.href}>
              {l.group && <div className="side-group">{l.group}</div>}
              <Link href={l.href} className="side-link" aria-current={pathname === l.href ? "page" : undefined}>
                <Icon name={l.icon} />
                {l.label}
                {l.badge && waiting > 0 && (
                  <span className="count" aria-label={`${waiting} waiting`}>{waiting}</span>
                )}
              </Link>
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">
            <span className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
            <span className="who-name">{name}</span>
          </div>
          <button className="side-link side-link-btn" onClick={logout}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-content">
          <SimNotice />
          {children}
        </div>
      </main>
    </div>
  );
}
