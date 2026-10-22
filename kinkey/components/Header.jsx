"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTideCloak, Authenticated } from "@tidecloak/nextjs";

const LINKS = [
  { href: "/", label: "Safe" },
  { href: "/attacker", label: "What a thief sees" },
  { href: "/check", label: "Two-person check" },
];

export default function Header() {
  const { authenticated, logout, getValueFromIdToken } = useTideCloak();
  const pathname = usePathname();
  const name = authenticated ? getValueFromIdToken("preferred_username") : null;

  return (
    <header className="topbar">
      <Link href="/" className="wordmark" aria-label="KinKey home">
        Kin<span>Key</span>
      </Link>
      <nav aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <Authenticated>
        <div className="who">
          <span>{name || "Signed in"}</span>
          <button className="link-button" onClick={logout}>Sign out</button>
        </div>
      </Authenticated>
    </header>
  );
}
