[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

_KinKey is a family safe where every key-holder can read medical details at once, but the key to money and documents is granted only after the family's quorum approves it._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality

One family safe, two compartments with different rules. Medical opens instantly for every key-holder; emergencies can't wait. Bank, insurance and land papers open only for a relative the family has agreed on. The decision belongs to the family, not to one trusted person.

### 2. Trust constraint insight

Today families either tell no one where the papers are, and get stuck when a parent is hospitalised, or tell one person everything, who can then act alone. Removing that single holder lets a family keep everything in one place and still require agreement before anyone touches the money.

### 3. Value & impact

Families spread across countries, and ageing parents who want help without giving up control. Minh works in Japan; Mom is hospitalised. Lan reads Mom's penicillin allergy in seconds. The insurance papers stay sealed until three of four family members approve Lan's key, then open with a letter from Mom.

### 4. Why TideCloak matters

Each compartment is a TideCloak encryption tag and each key is a realm role. Granting the finance key is a Quorum-Enforced Authorization change that commits only when the family approves, so no single member can grant it. The server stores only ciphertext. Because Tide's network was overloaded, sign-in, roles, approvals and encryption are simulated behind the same interface (Tide's Plan C).

### 5. Prototype & storytelling

Key interaction: sign in as Lan. Medical is available; Finance is restricted. Ask the family, watch approvals reach 3 of 4, press "Try to open again", and Mom's letter appears. "What a thief sees" shows the raw database: ciphertext only.

Demo video: [kinkey/docs/kinkey-demo.mp4](kinkey/docs/kinkey-demo.mp4)

## Setup

The app is in [`kinkey/`](kinkey/) (Next.js 15). Requires Node.js 22.13 or later.

```bash
cd kinkey
npm install
cp tidecloak.example.json tidecloak.json   # no licensed realm -> simulated TideCloak (Tide's Plan C)
npm run dev                                 # http://localhost:3000
```

Demo walkthrough:

1. **Sign in** → *Continue as Mom* → **Load demo contents**.
2. **Sign out** → *Continue as Lan*: Medical is **Available**, Finance is **Restricted** → **Ask the family**.
3. *Family approvals*: approve as Lan, then sign in as Mom and as Minh and approve. The grant commits at 3 of 4.
4. As Lan, open Finance → **Try to open again**: Mom's letter opens. *What a thief sees* shows only ciphertext.
5. To restart, sign in as Mom → **Empty the safe** (also resets everyone's keys).

Every page shows a "Simulated TideCloak" notice while no licensed realm is configured. With a licensed adapter in `kinkey/tidecloak.json` (containing `jwk.keys`), rebuild and the app uses the official TideCloak SDK automatically. `npm test` runs the backend tests.

More detail:

- [Where TideCloak fits](kinkey/docs/TIDECLOAK-PLAN.md), planned with Tide's MCP
- [Trust model, approval model and verification status](kinkey/README.md)
- [Live TideCloak setup and verification tests](kinkey/docs/SETUP.md) · [Backend API contracts](kinkey/docs/BACKEND.md)
