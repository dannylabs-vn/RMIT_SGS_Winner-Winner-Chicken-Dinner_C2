import { PageHead } from "../../components/ui";

export const metadata = { title: "Security & Privacy · KinKey" };
const SIM = process.env.NEXT_PUBLIC_TIDE_MODE === "simulated";

const FITS = [
  {
    kinkey: "Signing in as a family member",
    tide: "TideCloak sign-in, verified across Tide’s network; tokens are signed by the network rather than by one server.",
    sim: "You pick Mom, Lan, Minh or Uncle; the simulated realm issues a signed token with their roles.",
  },
  {
    kinkey: "Medical and Finance keys",
    tide: "Tide’s built-in RelationshipAttestation policy (recommended by Tide’s MCP): the network decrypts a compartment only for holders of its role, so the whole family can read what Mom encrypted.",
    sim: "Role names in the token gate each compartment. The simulated network refuses to decrypt without the role.",
  },
  {
    kinkey: "Family approves the finance key",
    tide: "Quorum-Enforced Authorization (QEA): Tide documents that a role grant commits only when enough realm admins approve, so no single family admin can grant it alone.",
    sim: "Family approvals page: a grant or revocation commits at 3 of 4 family approvals.",
  },
  {
    kinkey: "The server can’t read the safe",
    tide: "Keys are split across Tide’s network (ORKs). The KinKey server stores ciphertext only and never holds a key.",
    sim: "Encryption keys live in a separate simulated-network file, never in the vault database. One process holds them, which real Tide removes.",
  },
  {
    kinkey: "Every API write is checked",
    tide: "verifyTideCloakToken checks the token signature and roles on the server; DPoP binds tokens to the device.",
    sim: "API routes check the simulated token’s signature and roles through the same code paths.",
  },
];

// Claims here must match README "Verification status" and docs/VERIFICATION.md.
export default function SecurityPage() {
  return (
    <>
      <PageHead eyebrow="Trust" title="Security & Privacy" art="security" tone="medical">
        <p className="t-body-l">What KinKey protects, how access is governed, and what it cannot do.</p>
      </PageHead>
      <div className="prose">
        <section id="tidecloak">
          <h2 className="t-hs">Where TideCloak fits</h2>
          {SIM ? (
            <p className="t-body">
              Tide’s network was under heavy load during the hackathon and could not license new realms, so this build runs in{" "}
              <strong>simulated TideCloak</strong> mode, as Tide’s Plan C asks. The app calls the same functions either way;
              with a licensed <span className="mono">tidecloak.json</span> it switches to the official SDK. This mapping was
              planned with Tide’s MCP (see <span className="mono">docs/TIDECLOAK-PLAN.md</span>).
            </p>
          ) : (
            <p className="t-body">This build runs against a live TideCloak realm through the official SDK.</p>
          )}
          <div className="table-wrap">
            <table className="keys-table fits-table">
              <thead>
                <tr>
                  <th scope="col">In KinKey</th>
                  <th scope="col">What TideCloak provides</th>
                  <th scope="col">In this simulation</th>
                </tr>
              </thead>
              <tbody>
                {FITS.map((f) => (
                  <tr key={f.kinkey}>
                    <th scope="row">{f.kinkey}</th>
                    <td>{f.tide}</td>
                    <td>{f.sim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="t-hs">What is encrypted</h2>
          <p className="t-body">
            Vault entries, including their labels, are encrypted through <span className="mono">doEncrypt</span> before they
            are saved. The KinKey server stores ciphertext and holds no decryption key.
          </p>
          <p className="t-body muted">
            Not encrypted: compartment names, authors and timestamps, and family-board reasons. Keep board reasons generic.
          </p>
        </section>
        <section>
          <h2 className="t-hs">Grant and revoke</h2>
          <ul className="t-body">
            <li>The family approves granting a key, not each opening. Once granted, the key-holder can open the vault until the grant is revoked.</li>
            <li>A revocation stops new openings after the member’s token refreshes. It cannot undo anything already read or copied.</li>
          </ul>
        </section>
        <section>
          <h2 className="t-hs">Known limitations</h2>
          <ul className="t-body">
            <li>TideCloak is simulated in this build. Live Tide behaviour (approval threshold, revocation timing, whether a server administrator can bypass the family) has not been tested.</li>
            <li>With plain Tide self-encryption only the encrypting user can decrypt. Sharing Mom’s notes with the family needs a RelationshipAttestation policy per compartment; the simulation models that intended behaviour, and the live switch is planned, not built.</li>
            <li>The family board is a readable shared note, not an approval.</li>
            <li>The server cannot prove that an arbitrary submitted string is encrypted; use the in-app flow.</li>
            <li>Not a will and not legal advice.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
