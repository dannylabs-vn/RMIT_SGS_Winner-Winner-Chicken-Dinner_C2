// Spot illustrations for page banners (original KinKey artwork, flat, palette tokens).
const INK = "#1d1d21";
const BLUE = "#145fe4";
const GOLD = "#d6c29a";
const GREEN = "#0e7a4f";

function Person({ x, y, fill, r = 14 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth="2" />
      <path d={`M${x - r - 6} ${y + r * 2.6} q${r + 6} ${-r * 1.9} ${(r + 6) * 2} 0`} fill={fill} stroke={INK} strokeWidth="2" />
    </g>
  );
}

const SPOTS = {
  medical: {
    title: "A medical record card with a heart, open to the family.",
    body: (
      <>
        <rect x="40" y="24" width="140" height="172" rx="16" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="80" y="14" width="60" height="22" rx="8" fill={GREEN} />
        <path d="M110 104c-18-14-30-22-30-36a15 15 0 0 1 30-4 15 15 0 0 1 30 4c0 14-12 22-30 36z" fill="#f28b82" stroke={INK} strokeWidth="2" />
        <g stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.45">
          <path d="M64 134h92M64 152h70M64 170h82" />
        </g>
        <circle cx="196" cy="174" r="26" fill={GREEN} />
        <path d="m184 174 8 8 16-16" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  finance: {
    title: "A sealed document folder held by four family members.",
    body: (
      <>
        <path d="M30 70h70l14 16h96v108a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill="#fff4dc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <rect x="48" y="52" width="130" height="40" rx="6" fill="#fff" stroke={INK} strokeWidth="2" />
        <circle cx="120" cy="140" r="30" fill={GOLD} stroke={INK} strokeWidth="2" />
        <path d="M110 140v-8a10 10 0 0 1 20 0v8" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <rect x="104" y="138" width="32" height="22" rx="5" fill={INK} />
        {[40, 90, 150, 200].map((x) => (
          <line key={x} x1={x} y1="20" x2="120" y2="110" stroke={GOLD} strokeWidth="2" strokeDasharray="4 4" />
        ))}
        {[["40", "#c9dafb"], ["90", "#f7c8a8"], ["150", "#bfe5d3"], ["200", "#ddd3f7"]].map(([x, c]) => (
          <circle key={x} cx={x} cy="20" r="12" fill={c} stroke={INK} strokeWidth="2" />
        ))}
      </>
    ),
  },
  "finance-open": {
    title: "The finance folder, opened after the family agreed, with Mom's letter inside.",
    body: (
      <>
        <path d="M30 80h70l14 16h96v98a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill="#fff4dc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <rect x="58" y="34" width="120" height="96" rx="8" fill="#fff" stroke={INK} strokeWidth="2" transform="rotate(-6 118 82)" />
        <g stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.45" transform="rotate(-6 118 82)">
          <path d="M74 58h80M74 76h64M74 94h72" />
        </g>
        <path d="M30 120h180l-16 74a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill={GOLD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="190" cy="40" r="22" fill={GREEN} />
        <path d="m180 40 7 7 14-14" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  board: {
    title: "Two speech bubbles: a family member explains why they need access.",
    body: (
      <>
        <path d="M28 40h130a12 12 0 0 1 12 12v60a12 12 0 0 1-12 12H76l-26 22v-22H28a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12z" fill="#e6eefd" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M44 72h96M44 94h64" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />
        <path d="M212 110h-90a12 12 0 0 0-12 12v40a12 12 0 0 0 12 12h50l22 18v-18h18a12 12 0 0 0 12-12v-40a12 12 0 0 0-12-12z" fill="#fff4dc" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M128 138h68M128 156h40" stroke="#b8862b" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  approvals: {
    title: "Four family members around a key; three have approved.",
    body: (
      <>
        <circle cx="120" cy="110" r="72" fill="none" stroke={GOLD} strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="120" cy="110" r="30" fill={GOLD} stroke={INK} strokeWidth="2" />
        <circle cx="112" cy="104" r="8" fill="none" stroke={INK} strokeWidth="3" />
        <path d="M118 110l14 14m-4-4 6-6m-12 0 6-6" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        {[[120, 30, "#c9dafb", true], [200, 110, "#bfe5d3", true], [120, 190, "#f7c8a8", true], [40, 110, "#ddd3f7", false]].map(([x, y, c, ok]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="18" fill={c} stroke={INK} strokeWidth="2" />
            <circle cx={x + 14} cy={y - 14} r="9" fill={ok ? GREEN : "#fff"} stroke={ok ? GREEN : INK} strokeWidth="2" />
            {ok && <path d={`m${x + 10} ${y - 14} 3 3 6-6`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />}
          </g>
        ))}
      </>
    ),
  },
  thief: {
    title: "A copied database: rows of scrambled ciphertext under a magnifying glass.",
    body: (
      <>
        <rect x="24" y="30" width="170" height="160" rx="14" fill={INK} />
        {[56, 84, 112, 140, 168].map((y, i) => (
          <text key={y} x="40" y={y} fill="#9aa4b2" fontFamily="monospace" fontSize="14">{["x9#Qa!7f2Lk", "Zr0&mP4w_Td", "8bN!sE3yQ+u", "Wq$5hJ0c#Rv", "gT7@pL2xK9m"][i]}</text>
        ))}
        <circle cx="170" cy="150" r="40" fill="#e6eefd" fillOpacity="0.9" stroke={INK} strokeWidth="3" />
        <text x="146" y="157" fill={INK} fontFamily="monospace" fontSize="18" fontWeight="700">?#!</text>
        <path d="m198 178 24 24" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </>
    ),
  },
  security: {
    title: "A shield made of layers: encryption, family approval and verified sign-in.",
    body: (
      <>
        <path d="M120 16 196 44v62c0 46-32 82-76 98-44-16-76-52-76-98V44z" fill="#e6eefd" stroke={INK} strokeWidth="2" />
        <path d="M120 40 174 60v46c0 34-22 60-54 72-32-12-54-38-54-72V60z" fill="#bfe5d3" stroke={INK} strokeWidth="2" />
        <path d="M120 64 152 76v30c0 22-13 39-32 47-19-8-32-25-32-47V76z" fill={GOLD} stroke={INK} strokeWidth="2" />
        <path d="m106 108 10 10 20-22" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  family: {
    title: "Four family members: Mom, Lan, Minh and Uncle.",
    body: (
      <>
        <rect x="10" y="150" width="220" height="10" rx="5" fill="#e5e7eb" />
        <Person x={50} y={70} fill="#f7c8a8" r={16} />
        <Person x={100} y={86} fill="#c9dafb" r={13} />
        <Person x={146} y={86} fill="#bfe5d3" r={13} />
        <Person x={194} y={70} fill="#ddd3f7" r={16} />
      </>
    ),
  },
};

export function SpotArt({ name, className }) {
  const spot = SPOTS[name];
  if (!spot) return null;
  return (
    <svg className={className} viewBox="0 0 240 220" role="img" aria-label={spot.title}>
      {spot.body}
    </svg>
  );
}

// Original KinKey hero illustration: one cabinet, two compartments.
// Left (Medical) stands open with a record card; right (Finance) is closed under a
// champagne seal that four family members hold together. Flat, palette tokens only.
export default function TwoCompartments({ className }) {
  return (
    <svg className={className} viewBox="0 0 480 400" role="img" aria-labelledby="art-title">
      <title id="art-title">A family cabinet: the medical compartment is open, the finance compartment is sealed until the family agrees.</title>
      <rect x="0" y="0" width="480" height="400" rx="32" fill="#eaf1fe" />
      <circle cx="96" cy="72" r="40" fill="#e7f4ee" />
      <circle cx="430" cy="352" r="56" fill="#fbf3e2" />

      {/* family above the cabinet, linked to the seal */}
      <g stroke="#d6c29a" strokeWidth="2" fill="none">
        <path d="M300 92 L352 196" />
        <path d="M340 72 L352 196" />
        <path d="M380 72 L352 196" />
        <path d="M420 92 L352 196" />
      </g>
      {[300, 340, 380, 420].map((x, i) => (
        <circle key={x} cx={x} cy={i === 0 || i === 3 ? 92 : 72} r="13" fill={["#f7c8a8", "#c9dafb", "#bfe5d3", "#ddd3f7"][i]} stroke="#1d1d21" strokeWidth="2" />
      ))}

      {/* cabinet body */}
      <rect x="56" y="128" width="368" height="224" rx="20" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" />
      <line x1="240" y1="144" x2="240" y2="336" stroke="#e5e7eb" strokeWidth="2" />

      {/* medical: open door and a record card */}
      <path d="M72 144 L40 160 L40 352 L72 336 Z" fill="#ffffff" stroke="#1d1d21" strokeWidth="2" strokeLinejoin="round" />
      <rect x="96" y="168" width="120" height="148" rx="12" fill="#e7f4ee" stroke="#0e7a4f" strokeWidth="2" />
      <rect x="112" y="184" width="32" height="32" rx="8" fill="#0e7a4f" />
      <path d="M128 192 v16 M120 200 h16" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <g stroke="#303136" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M112 236 h88" />
        <path d="M112 256 h72" />
        <path d="M112 276 h80" />
        <path d="M112 296 h48" />
      </g>

      {/* finance: closed door with the seal */}
      <rect x="256" y="144" width="152" height="192" rx="12" fill="#1d1d21" />
      <circle cx="352" cy="214" r="26" fill="#d6c29a" />
      <path d="M344 214 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="#1d1d21" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="340" y="213" width="24" height="17" rx="4" fill="#1d1d21" />
      <path d="M280 296 h104" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
