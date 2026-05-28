# Imari Website — Page Types

> **Repo:** Website (`imari-website`). This file documents the *content and structural* conventions for the password-protected pages in this repo. Auth, middleware, login, rewrites, and the playbook for wiring up a new page live in [CLAUDE.md](CLAUDE.md) — read both when adding a new page.

There are three types of private page in this repo. Each is purpose-built for a different read context, and each has its own structural pattern. Before building or briefing a new page, identify the type — the section list, tone, and gallery configuration follow from it.

---

## Overview

| Type | Currently | Pitched at | Audience | Tone | Galleries |
|---|---|---|---|---|---|
| **Specific Offer** | alarm250 · freedom250 · july4 | A specific event/weekend | Single prospect or short list | Salesy, glance-and-decide; replaces a 1-pager | Interior + Exterior (no Site Plan) |
| **Landing** | alex0349 | The property generally | Personalized — one named recipient | Factual; sophisticated reader making a decision | Full set (Interior + Exterior + Site Plan) |
| **Collateral** | corporate | A specific use case for a defined audience | Audience-wide, not personalized | Sales-leaning; varies by purpose; short and punchy | Interior + Exterior (shared block) — omit if a piece argues against it |

---

## Type 1 — Specific Offer

A page built to pitch a specific event or weekend to a small list. The recipient is glancing at it to decide whether to reach out — make the decision easy. Replaces a one-page PDF.

**Pages currently of this type:** [alarm250](private/alarm250.html), [freedom250](private/freedom250.html), [july4](private/july4.html)

### Sections (in order)

1. **Hero** — Textured dark background (e.g. `photos/wall-texture.jpg`), italic event name in the title. Four-cell stat row: dates · overnight guests · event guests · proximity.
2. **The Weekend** — Headline + body paragraph framing why this weekend matters, then 3 day-cards (image + date + title + description + headcount meta).
3. **Position Statement** (`id="section-estate"`) — Dark `--ember` section containing only the centered text intro: "The Estate" eyebrow + italic body paragraph ("Imari is a private estate available for the exclusive occupancy of a single party. *Comfortable luxury on one private acre.* Full staff, complete security, seven star service — a residence built to host, to hold court, to headquarter."). Brand-stable copy; rarely changes per page. Uses `<div class="position-statement" style="margin-bottom: 0;">` so the section is vertically balanced when standalone.
4. **Galleries** (`id="section-gallery"`) — "Galleries" eyebrow + "A look inside." headline. Interior + Exterior thumbnail rows with full-screen lightbox. **No Site Plan.**
5. **Estate Details** (`id="section-details"`) — Dark `--ember` section. Centered "Estate Details" eyebrow + "On the grounds, and at your service." section title, then a two-column `.estate-grid`:
   - **The Property.** — italic Cormorant column title, em-dash bullets covering house, suites, ballroom, spa, pool, guest house, parking, security.
   - **The Services.** — italic Cormorant column title, em-dash bullets covering concierge, butler, housekeeping, food, wellness, transportation, security.
   No uppercase eyebrows above the column titles. Bullet content is the codified default — only diverge when a specific page genuinely needs different content.
6. **The Offering** — Particulars list: Dates · Occupancy · Location · Included · Not Included · Pricing.
7. **Closing** — Italic Cormorant tagline over dark image overlay, with contact line.
8. **Footer**

### Drawer anchors
Galleries · The Weekend · The Estate · Estate Details · The Offering · Inquire

### Section backgrounds (alternation)

Adjacent sections never share a background. Canonical sequence:
- Hero (ember/dark) → Weekend (parchment-dark) → Position Statement (ember) → Gallery (parchment-dark) → Estate Details (ember) → Offering (parchment) → Closing (dark image) → Footer (ink)

### Conventions
- Hero stat row count is always 4. Dates are usually the leftmost stat.
- Weekend grid is typically 3 days; 2–4 is fine if the program demands it.
- File names follow the role name (e.g. `july4`, `freedom250`).
- The **Position Statement → Galleries → Estate Details** block (sections 3–5) is shared with Collateral (Type 3). Copy and structure stay consistent across both types — diverge only when a specific page argues for it.
- Tone: short, persuasive, no exhaustive detail. If a sentence isn't earning its place, cut it.

### Template
[templates/_template-specific-offer.html](templates/_template-specific-offer.html). Replace `{{TOKENS}}`; everything else is intended to stay consistent.

---

## Type 2 — Landing

A persistent, personalized page for a single named recipient. Reads like correspondence prepared for one person. The recipient is sophisticated, already understands the product, and is here for specifics to make a decision.

**Pages currently of this type:** [alex0349](private/alex0349.html)

### Sections (in order)

1. **Hero** — Photographic background. Eyebrow line "prepared for {{RECIPIENT}}". Italic Cormorant title with gold-light accent. Four-cell stat row: bedroom suites · staff bedrooms · event capacity · "1 party always".
2. **Intro strip** — Dark Ember band, one italic Cormorant sentence flanked by gold rules.
3. **Galleries** — Full set: Interior + Exterior + Site Plan thumbnail rows, full-screen lightbox.
4. **Use Cases** — Numbered grid sections, image + body, alternating sides. Standard set:
   - 01 — The Property
   - 02 — The Service
   - 03 — The Venue
   - 04 — The Security
   - 05 — The Extras
5. **Accommodations** (always) — Sticky-left "The accommodations" section, King Suites + Queen Suites grids.
6. **Supplemental Services** (typical, not strictly required) — Three pricing tables (Butler & Chef · Events · Wellness & Transportation), from `services-table.css`.
7. **Advisor Strip** (only on advisor-facing pages) — Narrow band describing commission / dedicated point of contact.
8. **Inquiry** — Dark image overlay with "Begin a conversation" headline + contact details.
9. **Footer**

### Drawer anchors
Galleries · The Property · The Service · The Venue · The Security · The Extras · Accommodations · Supplemental Services · For Travel Advisors · Inquire

### Conventions
- Personalization lives in the hero eyebrow ("prepared for {{NAME}}") and minor copy tweaks — otherwise the structure is the same as any other landing.
- Use cases describe estate features (Property, Service, Venue, Security, Extras), **not** audience-specific scenarios. Audience scenarios belong on Collateral.
- Tone: factual. Numbers and specifics over adjectives. The reader is going to skim and dive deep where it matters — make it easy to do both.

### Template
[templates/_template-landing.html](templates/_template-landing.html). Replace `{{TOKENS}}` and decide whether to keep the Advisor Strip (typically advisor-facing pages only).

---

## Type 3 — Collateral

A page that replaces an existing handout or pitch document for a defined audience. The recipient is often a middleman planning on behalf of someone else and will use this internally to pitch onward. Structure varies more piece-to-piece than the other types — some pieces have galleries, some don't; some include a timeline, some don't.

**Pages currently of this type:** [corporate](private/corporate.html)

### Sections (in order, when used)

1. **Hero** — Photographic background. Audience eyebrow ("Imari Georgetown · {{AUDIENCE_LABEL}}"). Stat row of 4 calibrated to the audience.
2. **Intro strip** — Dark Ember band, one italic sentence.
3. **Use Cases** — Audience-specific verticals (e.g. corporate uses Business Roundtable · Investor Day · C-Suite Breakout · Pop-Up HQ). **Not** the generic Property/Service/Venue/Security/Extras set from Type 2.
4. **Photo Band** (legacy) — Four-image horizontal strip. Documented for reference; no current piece uses this. Replaced by the Galleries section below.
5. **Position Statement** (`id="section-estate"`) — Same shared block as Type 1, section 3. The Estate eyebrow + italic body paragraph on `--ember`. Brand-stable copy.
6. **Galleries** (`id="section-gallery"`) — Same shared block as Type 1, section 4. "Galleries" / "A look inside." Interior + Exterior thumbnail rows + lightbox.
7. **Estate Details** (`id="section-details"`) — Same shared block as Type 1, section 5. Estate Details eyebrow + "On the grounds, and at your service." + two-column grid (The Property / The Services) on `--ember`.
8. **A day at Imari** (optional) — Sticky-left timeline showing Morning / Afternoon / Evening with bulleted activities.
9. **Inquiry** — Dark image overlay + contact details.
10. **Footer**

### Drawer anchors
Per-page — anchors track the sections actually present on that piece. When the shared block is used, that means `#section-estate`, `#section-gallery`, and `#section-details`.

### Conventions
- Use case titles are audience-specific scenarios, not generic estate features.
- The **Position Statement → Galleries → Estate Details** block (sections 5–7) is shared with Specific Offer (Type 1) — same markup, same copy. Treat as a single shared unit.
- Optional sections beyond the shared block: Photo Band, A day at Imari. Include the ones the piece needs; omit the rest.
- Tone varies by purpose. Generally less detailed than landings, more sales-leaning — short, punchy, convincing.

### Template
[templates/_template-collateral.html](templates/_template-collateral.html). The template includes every section a Collateral piece *could* have; comment out or delete sections that don't apply to the piece you're building.

---

## Templates folder

The three templates live in [templates/](templates/) at the repo root. They are:
- **Excluded from Vercel builds** via [.vercelignore](.vercelignore), so the deployed site never serves them.
- **Tokenized** with `{{PLACEHOLDER}}` syntax for content that varies per page.
- Otherwise identical to the cleanest current page of each type — copy, swap tokens, drop in `private/`.

### Workflow for a new page

1. **Identify the type.** Use the overview table above.
2. **Read the auth playbook** in [CLAUDE.md](CLAUDE.md) — section *Adding a new SECTION with its own password* or *Adding a new page that uses an EXISTING password*, depending on whether you need a new role.
3. **Copy the matching template** from `templates/_template-<type>.html` into `private/` under the new page's name.
4. **Replace `{{TOKENS}}`** with the new page's content. Trim or extend sections per the type's conventions.
5. **Wire up auth** — role (if new), matcher entry, rewrite, env var — per CLAUDE.md.
6. **Commit, push, smoke-test in incognito.**

---

## See also

- [CLAUDE.md](CLAUDE.md) — auth flow, middleware/login/rewrite playbook, password rotation, gotchas.
- [BRAND.md](BRAND.md) — visual identity, palette, typography, copy patterns, shipping checklist.
- [IMARI_VOICES.md](IMARI_VOICES.md) — voice authority. Host Voice (default), Reflective Voice (hero taglines + closing lines), Argument Voice (persuasive paragraphs).
