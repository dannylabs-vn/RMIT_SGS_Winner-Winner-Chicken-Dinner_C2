# KinKey — 1Password UI Redesign Prompt (Asset Swap Only)

Oct 22, 2026 · @Biên An Toàn

## 1. Role and core rule

Act as a principal product designer and senior frontend engineer who has shipped polished security products at leading technology companies.

Redesign the existing KinKey application so that its UI follows 1Password's UI as faithfully as possible, using the attached `1password.com-design.md` as the single source of truth.

**Core rule: copy the UI, swap only the assets.** Everything that defines how 1Password looks and behaves is reproduced as specified: layout structure, typography scale, color palette and usage ratios, spacing rhythm, component shapes, borders, radii, shadows, iconography style, states, and motion. The only things that change are assets: logo and wordmark, product name, illustrations, photography, proprietary icons, proprietary fonts, favicons, social images, and the actual content shown (KinKey's real data and copy).

Do not "interpret", "adapt" or "improve" the reference style with ideas from other design systems (Apple, Material, generic enterprise software). When the reference does not specify something, follow the closest existing 1Password pattern rather than inventing a new one.

The result should look like a 1Password-family product that happens to be called KinKey, while remaining fully original in every brand asset.

## 2. Inspect before implementing

Before changing any files:

1. Read `1password.com-design.md` completely. Extract every token, component spec, layout rule and pattern it defines into a working checklist.
2. Inspect `README.md`, `PROMPT.md`, `package.json`, app routes, shared components, stylesheets and the TideCloak integration.
3. Identify the actual frontend framework, styling approach and icon library.
4. Identify which pages and interactions already exist, and where the Medical, Finance, access-request, authentication and attacker-view states originate.
5. Inventory every existing asset (logo, wordmark, favicon, illustrations, images, icons, fonts) in `public/` and in components.

Then produce a concise implementation plan listing:

- Files to change.
- Components to reuse or introduce.
- A mapping table: each 1Password pattern from the reference → the KinKey screen or component that will use it.
- An asset swap table: each 1Password asset slot → the KinKey asset that fills it (existing, or new and to be created).
- Existing functionality that must remain untouched.
- Any place where faithful reproduction conflicts with functionality, security or accessibility (these become entries in the deviation log, see section 3).

Proceed with implementation after the audit, provided no security-sensitive behavior needs clarification.

## 3. Fidelity rules: what matches, what changes

| Area | Rule |
| --- | --- |
| Layout structure, grid, container widths | Match the reference exactly |
| Typography scale, weights, line heights, tracking | Match exactly; use the reference token levels, no in-between sizes |
| Color palette and where each color is used | Match exactly, including how sparingly accents appear |
| Spacing rhythm | Match exactly (8 / 16 / 32 / 64 / 96px) |
| Buttons, inputs, links, badges, dividers | Match shape, size, radius, border, states |
| Shadows, borders, surface effects | Use exactly what the reference specifies; add none, remove none |
| Icon style (stroke, size, fill, density) | Match the style, using icons from the project's own library |
| Motion (durations, easing, what animates) | Match the reference; respect `prefers-reduced-motion` |
| Logo, wordmark, product name | Replace with KinKey |
| Illustrations, photography, decorative graphics | Replace with original KinKey assets in the same slot and size |
| Proprietary fonts | Replace with the closest available licensed alternative |
| Copy and data | KinKey's real copy and real backend data only |

### No-additions, no-removals

Do not add visual elements the reference does not use (for example gradients, glassmorphism or glows if the reference has none). Do not strip out patterns the reference does use (for example an illustration slot, a large display headline on a landing page, the champagne accent) just because a generic "minimal" rule would remove them. The reference decides.

### Deviation log

The only acceptable reasons to depart from the reference are: security correctness, real backend state, accessibility (WCAG 2.1 AA), or a feature that genuinely does not exist in KinKey. Record every departure in a short deviation log (what, where, why). Unlogged departures count as defects.

## 4. Design tokens (taken verbatim from the reference)

The values below are the ones already extracted from `1password.com-design.md`. If the file contains additional or more precise tokens, the file wins. Implement all tokens as shared variables before touching any screen.

### Colors

| Token | Value | Use, as in the reference |
| --- | --- | --- |
| Primary blue | `#145FE4` | Primary CTA, links, active navigation, focused controls |
| Secondary ink | `#1D1D21` | Headlines, primary text, high-emphasis elements |
| Neutral text | `#303136` | Body text, standard navigation |
| Champagne | `#D6C29A` | Warm accent, used exactly where and as often as the reference uses it |
| Surface | `#FFFFFF` | Main background |
| Muted surface | `#F6F7F9` | Secondary regions |
| Border | `#E5E7EB` | Dividers, input borders |
| Error | `#D92D20` | Errors, destructive actions |

Success and warning colors: use the reference's semantic colors if it defines them; otherwise pick accessible values that sit naturally in this palette and log them as a deviation.

### Typography

| Level | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- |
| Display | 88px | 300 | 96.8px | -1.76px |
| Headline L | 61px | 300 | 70.4px | -1.28px |
| Headline M | 42px | 300 | 50px | per reference |
| Headline S | 29px | 300 | 35px | per reference |
| Body L | 20px | 300 | 30px | per reference |
| Body | 16px | 400 | 24px | per reference |
| Body S | 14px | 400 | 20px | per reference |
| Eyebrow | 12px | 600 | per reference | 0.08em |

Use these levels as they are. Map each KinKey text role to the level 1Password uses for the equivalent role (for example a page title uses the level 1Password uses for page titles). Do not create custom intermediate sizes. On mobile, step down using the reference's own responsive scaling; if the reference defines none, drop one level and log it.

Font family: use the family named in the reference. If it is proprietary or not licensed for this project, treat it as an asset swap: use the closest available licensed sans-serif with the same proportions and weights, plus a system fallback. Never reference a font file that is not in the project.

### Spacing and geometry

- Spacing scale: 8, 16, 32, 64, 96px. No other values unless the reference defines them.
- Container widths, gutters, section spacing: as defined in the reference.
- Button: pill radius, \~46px height, \~24px horizontal padding, per reference.
- Input: \~46px height, 8px radius, 1px `#E5E7EB` border, per reference.
- Dividers: 1px solid `#E5E7EB`.
- Card radius, shadows, surface treatment: exactly as the reference specifies; where the reference uses no container, use none.

## 5. Asset swap specification

Assets are the only part of the UI that is not copied. Every asset slot that exists in the 1Password pattern keeps its position, size, aspect ratio and visual weight, but is filled with an original KinKey asset.

| 1Password asset slot | KinKey replacement | Rules |
| --- | --- | --- |
| Logo mark | KinKey logo mark | Same size and clear space as the reference logo; reuse the existing KinKey logo if present |
| Wordmark | "KinKey" set in the app's font | Same weight, size and position as the reference wordmark |
| Product name in copy | "KinKey" | Never mention 1Password anywhere in the UI, metadata or alt text |
| Hero / feature illustrations | Original KinKey illustration | Same slot, size and palette discipline as the reference illustration style; concept: two secure compartments (Medical readily available, Finance governed) |
| Photography | None, or KinKey-owned images | No stock family photos; no 1Password photos |
| UI icons | Project's existing icon library | Pick icons matching the reference's stroke width, size and corner style; no icons copied from 1Password |
| Empty-state / spot graphics | Original small KinKey graphic, or none | Only where the reference pattern has a graphic in that slot |
| Favicon, app icons, OG / social images | KinKey versions | Generated from the KinKey logo |
| Fonts | Licensed alternative (see section 4) | Same proportions and weights |

### Hard limits on assets

- Never download, embed, trace, recolor or redraw 1Password's logos, wordmark, illustrations, icons, photos or font files.
- A KinKey illustration must be recognizably original. Matching the reference's palette and flat style is fine; matching its specific composition, characters or motifs is not.
- Before adding a new asset, check `public/` and existing components for one that already fits. Add no large dependency just to render a decorative image.
- Never use an image to suggest a permission or security state that conflicts with real backend state.
- Every new asset gets meaningful alt text, or `alt=""` when purely decorative.

List every replaced and newly created asset, with its path, in the final report.

## 6. Screen mapping

Each KinKey screen takes the layout of its closest 1Password equivalent. Where `1password.com-design.md` only covers marketing pages, apply its tokens to 1Password's familiar app structure: sidebar of vaults → item list → item detail. Content is always KinKey's real data.

### App shell

- Desktop: persistent left sidebar in the 1Password style, with KinKey logo and wordmark at the top; Home, Medical, Finance & Documents, Family Board, Security & Privacy; user profile and logout at the bottom. Medical and Finance & Documents behave like vaults.
- Active item, hover and focus treatments exactly as the reference.
- Top bar only if the reference pattern has one and it holds a real, supported control. No search, bell or other utility unless the feature exists.
- Mobile: collapse navigation the way the reference collapses it; no horizontal overflow; respect safe-area insets.

### Landing / welcome (if the app has one)

Follow the reference hero exactly: eyebrow, display headline, body-L supporting text, primary pill CTA, and the illustration slot filled with the original KinKey two-compartment illustration.

### Home

Structure like a 1Password overview: eyebrow `YOUR FAMILY SAFE`, headline `Your family, securely connected.`, supporting line `Important information, available to the people you trust.` Below it, one inline security statement that describes only what the implementation verifies (for example `Your family safe is encrypted.`).

Medical and Finance & Documents appear as two vault entries, each with icon, name, one-line description, real access status, and one action:

- Medical: `Health records, allergies and emergency information.` Status `Available` only when the user really has permission. Action `View medical records`.
- Finance & Documents: `Insurance, financial records and sensitive documents.` Status `Restricted` when the user lacks permission. Action `Request access`.

Recent family activity: a 1Password-style list with separators, real entries only; honest empty state or omit if the backend has none.

### Medical

Vault view: title, one sentence, then item list → detail in the 1Password pattern. Categories (allergies, medications, history, emergency information) only if the data model has them. Highlight urgency only when the record is marked urgent. If access is denied, explain without exposing content.

### Finance & Documents

- Restricted: title, short explanation, status label, `Request access` if the workflow exists, and a note that permission changes are governed through TideCloak. Use the reference's locked-vault treatment, not a red page.
- Available: real authorized content, shown only after decryption succeeds.
- Submitted but not committed: `Pending approval`, never `Access granted`.

### Family Board

1Password-style list rows: request description, requester, current state, real action if implemented. No fake avatars, counts, progress bars or quorum animations, and no claim that approvals happen inside KinKey when they happen in TideCloak. If the board is a shared note, say so.

### Security & Privacy

Layout like 1Password's security pages: headings and short paragraphs covering what is encrypted, how permissions are governed, what happens on grant or revoke, and known limitations. No unsupported badges (`Military-grade encryption`, `Unbreakable security`, `Zero trust guaranteed`, `Fully protected from administrators`).

### Attacker view

A minimal inspection view in the same design language: heading stating this is the unauthorized observer's view, the actual stored ciphertext, visible metadata, and a short explanation. Monospace for ciphertext and identifiers. No green-on-black terminal look, no code animations, no fabricated ciphertext.

## 7. Components and interactions

Build each component to the reference spec, including every state: default, hover, active, focus-visible, disabled, loading, error.

- Primary button: `#145FE4` fill, white text, pill shape, \~46px height, \~24px padding, per reference.
- Secondary and tertiary actions: the outline and text-link treatments the reference uses.
- Destructive actions: the reference's error treatment with `#D92D20`; if it defines none, log the chosen treatment.
- Inputs: white background, light gray border, 46px height, 8px radius, visible labels, inline validation, full keyboard support.
- Status labels (Available, Restricted, Pending approval): the reference's badge or tag style.
- Lists and rows: the reference's divider and row-spacing rules.

Motion: use the reference's durations and easing (around 150–200ms for state changes if unspecified). No transition may suggest access was granted before the backend confirms it. Respect `prefers-reduced-motion`.

## 8. Security-critical rules (unchanged, override visual fidelity)

This is a visual redesign, not permission to rewrite the security model. When fidelity to 1Password and correctness of KinKey conflict, correctness wins and the conflict goes in the deviation log.

Preserve: authentication, TideCloak integration, encryption and decryption flows, API contracts, authorization checks, permission grant and revocation semantics, existing routes and workflows.

- Show decrypted content only after actual decryption succeeds.
- Never treat a pending grant as a committed grant.
- Distinguish a missing permission from a decryption failure.
- Do not store plaintext medical or financial content in localStorage.
- Do not add sensitive information to logs.
- Do not assume a role change takes effect until the implementation confirms it.
- Do not introduce a mock backend to make the redesign look functional.
- Do not invent activity, users, approval counts or security statuses to fill a 1Password-style layout.
- Do not change security-sensitive logic without explaining the change and getting approval.

## 9. Responsive, accessibility, order of work, acceptance

### Responsive and accessibility

Support desktop, tablet and mobile using the reference's breakpoints. Require: no horizontal overflow, readable sizes, WCAG 2.1 AA contrast, keyboard navigation, visible focus, semantic headings, accessible button labels, status announcements for meaningful state changes, reduced-motion support. On small screens, stack Medical and Finance vertically with the main action visible.

### Implementation order

1. Tokens: colors, typography, spacing, radii, borders, shadows, motion, exactly from the reference.
2. Assets: produce the asset swap table, create or reuse KinKey assets, wire logo, favicon and fonts.
3. App shell: sidebar, container, responsive navigation.
4. Home: finish and compare side by side with the reference before moving on.
5. Medical and Finance & Documents, preserving all permission and decryption behavior.
6. Family Board and Security & Privacy.
7. Attacker view.
8. Verification: run existing lint, type-check, build and plaintext checks; inspect every changed route for visual and functional regressions; do a fidelity pass comparing each screen against the reference tokens.

### Acceptance criteria

Done only when:

- Every token in use matches `1password.com-design.md`; no unlisted colors, sizes or spacings.
- Layout, components and states match the reference patterns.
- No 1Password asset, name or font file appears anywhere in the codebase or UI.
- Every asset slot is filled with an original KinKey asset or deliberately left empty, as listed.
- Every departure from the reference is in the deviation log with a valid reason.
- Medical and Finance states are immediately understandable and reflect real backend state.
- The Family Board fabricates nothing; security claims are accurate.
- TideCloak, authentication, encryption and decryption behave exactly as before.
- Responsive layouts work; verification checks have been run.

### Final report

1. Summary of visual changes.
2. Modified files.
3. Asset swap table with file paths.
4. Deviation log.
5. Verification commands executed and their actual results.
6. Remaining issues or assumptions.

Do not claim a test passed if it was not executed.
