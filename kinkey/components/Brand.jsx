import Link from "next/link";

// KinKey mark: a cabinet with two compartments; the governed one carries a champagne seal.
export function LogoMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="26" height="26" rx="8" fill="#1d1d21" />
      <rect x="6" y="7" width="7" height="14" rx="2" fill="none" stroke="#fff" strokeWidth="1.75" />
      <rect x="15" y="7" width="7" height="14" rx="2" fill="#fff" />
      <circle cx="18.5" cy="14" r="2" fill="#d6c29a" />
    </svg>
  );
}

export function Brand({ href = "/" }) {
  return (
    <Link href={href} className="brand" aria-label="KinKey home">
      <LogoMark />
      <span className="brand-name">KinKey</span>
    </Link>
  );
}
