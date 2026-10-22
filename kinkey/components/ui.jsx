"use client";

import { useTideCloak } from "./tide";
import { Icon } from "./Icons";
import { SpotArt } from "./Illustration";

// Status comes from the real doDecrypt outcome. The role check only explains a
// refusal (missing role vs. decryption failure); it never marks a vault available.
// `pending` is a change request read from the (simulated) realm, never a local flag.
export function vaultStatus(state, holdsKey, pending) {
  switch (state?.status) {
    case "open":
      return { tone: "success", label: "Available", icon: "check" };
    case "sealed":
      if (holdsKey) return { tone: "error", label: "Couldn't open", icon: "alert" };
      if (pending) return { tone: "warning", label: `Pending approval ${pending.approvals.length}/${pending.threshold}`, icon: "users" };
      return { tone: "neutral", label: "Restricted", icon: "lock" };
    case "empty":
      return { tone: "neutral", label: "Empty" };
    default:
      return { tone: "neutral", label: "Checking…" };
  }
}

export function pendingGrant(realm, member, role) {
  const cr = realm?.changeRequests?.find(
    (c) => c.status === "pending" && c.action === "grant" && c.member === member && c.role === role
  );
  return cr ? { ...cr, threshold: realm.threshold } : null;
}

// Approval progress read from the realm's change request; never animated ahead of state.
export function Progress({ value, max }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={`${value} of ${max} approvals`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "is-on" : undefined} />
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status.tone}`} role="status">
      {status.icon && <Icon name={status.icon} size={14} className="icon" />}
      {status.label}
    </span>
  );
}

export function PageHead({ eyebrow, title, children, aside, art, tone = "blue" }) {
  return (
    <header className={`banner banner-${tone}`}>
      <div className="banner-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <div className="row-between">
          <h1 className="t-hm">{title}</h1>
          {aside}
        </div>
        {children}
      </div>
      {art && <SpotArt name={art} className="banner-art" />}
    </header>
  );
}

export function SignedOut({ what }) {
  const { login } = useTideCloak();
  return (
    <div className="locked">
      <span className="lock-mark"><Icon name="lock" /></span>
      <h2 className="t-hs">Sign in to see {what}</h2>
      <p className="t-body muted">Only family members signed in with Tide can ask the network to open the safe.</p>
      <button className="btn btn-primary" onClick={login}>Sign in with Tide</button>
    </div>
  );
}

export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h ago` : new Date(iso).toLocaleDateString();
}
