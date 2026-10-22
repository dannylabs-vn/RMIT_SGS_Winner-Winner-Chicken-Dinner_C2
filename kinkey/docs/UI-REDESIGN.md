# UI redesign report (2026-10-22)

Source brief: `KinKey - 1Password UI Redesign Prompt (Asset Swap Only).md` (repo root). Security model, TideCloak integration, encryption/decryption flows and API contracts are unchanged; the decrypt/load/reset logic moved verbatim from `app/page.jsx` into `components/SafeProvider.jsx`.

## Screens
| Route | Signed out | Signed in |
|---|---|---|
| `/` | Hero: eyebrow, display headline, body-L, pill CTA, KinKey illustration; three steps | Home: eyebrow, headline, inline encryption statement, two vault rows (real status), recent family activity (real board notes), owner tools |
| `/medical`, `/finance` | Sign-in prompt | Vault: item list → detail after a real `doDecrypt`; locked state with ciphertext sample, network error, finance request form |
| `/board` | Sign-in prompt | Family board notes, labelled "Note only" |
| `/security` | Static trust page (claims mirror README verification status) | same |
| `/attacker`, `/check` | Restyled; logic unchanged | same |

## Asset swap
| Slot | KinKey asset | Path |
|---|---|---|
| Logo mark | Original two-compartment cabinet mark with champagne seal | `components/Brand.jsx` (`LogoMark`) |
| Wordmark | "KinKey" in Inter 600 | `components/Brand.jsx` |
| Favicon | Same mark | `app/icon.svg` |
| Hero illustration | Original: open medical compartment, sealed finance compartment held by four family members | `components/Illustration.jsx` |
| UI icons | Original 24px / 1.5px-stroke outline set (no icon library in the project; none added) | `components/Icons.jsx` |
| Font | Inter (Google Fonts, OFL) replaces the proprietary reference face | `app/layout.jsx` |
| Photography, OG image | None | — |

Removed: `components/Header.jsx`, `components/Compartment.jsx` (replaced by `Shell.jsx`, `Vault.jsx`), Be Vietnam Pro and Lora fonts, the celadon/lacquer palette.

## Deviation log
| What | Where | Why |
|---|---|---|
| `1password.com-design.md` is not in the repo; tokens taken from the brief's section 4 only | all | Reference file missing |
| Success `#0E7A4F`, success tint, error tint, muted text `#5C5E66` | `globals.css` | Reference defines none; chosen for WCAG AA on white and `#F6F7F9` |
| Primary hover `#0F4FC2`, blue 8% tint for active nav / selected item | `globals.css` | Hover/active treatments not specified |
| Card radius 16px, nav row 40px, badge 24px | `globals.css` | Not specified in the brief |
| Champagne used only as decoration (seal, step rule, governed-vault icon border), never for text | logo, illustration, home | `#D6C29A` on white fails AA contrast |
| Responsive type: Display → Headline L ≤1100px → Headline M ≤640px; Headline M → S ≤640px | `globals.css` | Reference responsive scale unavailable |
| No "Pending approval" state | Finance, Home | KinKey cannot read QEA change-request state; a board note is not a submitted grant. Showing "Pending" would fabricate state |
| "Couldn't open" status (role present, decrypt refused) separate from "Restricted" (role absent) | `components/ui.jsx` | Brief requires distinguishing missing permission from decryption failure |
| Reset confirmation is inline instead of `window.confirm` | Home | Accessibility and consistent styling; same two-step behaviour |
| Mom's letter uses Body L instead of Lora italic | Vault detail | No additional typeface in the reference |
| Two-person check and attacker view kept in sidebar under "Trust" | `Shell.jsx` | Existing routes must remain reachable |

## Verification
See the commit message / handoff for commands run. Signed-in screens could not be rendered: TideCloak realm licensing is failing upstream (`Midgard` 500/503), so no real session exists. They compile and share the unchanged state logic, but have not been visually checked.
