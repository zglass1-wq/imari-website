# Cloudinary Image Migration Plan

Propagating the Cloudinary wiring established in **`private/alex0349.html`** to every other HTML file in the repo that still references non-Cloudinary images. Plan only — no files changed yet.

Cloud name: **`dsp45h9a1`**. Source folders in Cloudinary: `Imari/Georgetown/{Interior,Exterior,Plans}`, `Imari/Brand/{Logos,Textures}`, `Imari/Other`.

> ⚠️ **Read "Plan section 4 — Risks" first.** ~6 ambiguous image mappings still need your call before I touch the affected files.

### Decisions locked in (your answers)
1. **Transformations: ADD them.** alex0349 will be **back-filled first** (step 1) so it stays canonical.
2. **Version-less URLs everywhere** — no `/v<version>/` segment.
3. **Migrate the dev-only `templates/*` too** (preserve `{{PLACEHOLDER}}` tokens).

### Transformation convention (exact strings)
| Asset type | URL form |
|---|---|
| Photos (jpg/jpeg/png) — inline `<img>`, CSS `url()`, gallery arrays | `…/image/upload/f_auto,q_auto/<public_id>.<ext>` |
| OG image (`og:image`, and any existing `twitter:image`) | `…/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,g_auto/<public_id>.jpg` |
| Logo / icon **SVGs** (favicon, nav/footer logos) | `…/image/upload/<public_id>.svg` — **no transforms** (SVG is vector; `f_auto`/`q_auto` are inappropriate/no-op) |

- No version segment in any URL.
- `g_auto` content-aware gravity for the OG 1200×630 card crop.
- I will **not** add new `twitter:image` tags (alex0349 has none — it relies on `og:image`); I'll only update a `twitter:image` if one already exists on a page.

---

## Plan section 1 — Reference patterns (from alex0349.html as it actually is)

### 1a. Cloudinary URL format
alex0349 uses **two slightly different shapes** — worth knowing before we "match" it:

| Where | Shape | Example |
|---|---|---|
| Inline `<img>` / favicon / og:image | `…/image/upload/v<VERSION>/<public_id>.<ext>` (**with** version segment) | `https://res.cloudinary.com/dsp45h9a1/image/upload/v1780062580/Parlor_and_Living_Room_421_ycl671.jpg` |
| Gallery JS array | `…/image/upload/<public_id>.<ext>` (**no** version, via `CLD` const) | `CLD + 'Parlor_and_Living_Room_421_ycl671.jpg'` |

- **No transformation parameters anywhere.** No `f_auto`, `q_auto`, `w_…`, `c_fill`, `g_auto`. (The task brief mentioned these — they are NOT in the reference. See Risk #1.)
- **Cloudinary dynamic folders → flat URLs.** The folder path (`Imari/Georgetown/Interior`) is **not** in the delivery URL; only `<public_id>` (which is `readable-name_<6charsuffix>`).
- Cloud name `dsp45h9a1` is hard-coded in every URL.

**Proposed normalization (needs your OK — Risk #2):** use the version-less form `…/image/upload/<public_id>.<ext>` for *all* references (inline + gallery) in the migrated files, for consistency. Alternative: mirror alex0349 exactly (versions inline, none in gallery).

### 1b. OG / Twitter meta tags
alex0349's `<head>` contains:
```html
<link rel="icon" type="image/svg+xml" href="https://res.cloudinary.com/dsp45h9a1/image/upload/v1780065300/imari-gingko_bh78d8.svg" />
<meta property="og:image" content="https://res.cloudinary.com/dsp45h9a1/image/upload/v1780062580/Parlor_and_Living_Room_421_ycl671.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```
- `og:image` → the page's hero photo (plain URL, no crop transform).
- Favicon → the gingko logo SVG.
- **No `twitter:image` tag** (only `twitter:card`). Twitter falls back to `og:image`.
- `og:url` still points to `imari-website-beta.vercel.app/<page>.html` — **not an image**, left as-is on every page; out of scope for this migration.

### 1c. Gallery wiring
- Image URLs live in a **JavaScript `GALLERIES` object** (`const CLD = '…/image/upload/'` then `{ src: CLD + '<public_id>.jpg', alt: '…' }`), NOT in markup `<img>` tags. Thumbnails + lightbox are built from this object at runtime.
- Three categories: `interior` (28), `exterior` (23), `site-plan` (8). **All other gallery files use the identical sets in the identical order** (verified programmatically — see §2), so migration = swap the array to alex0349's exact URLs.

**Interior (28), in order:**
```
Parlor_and_Living_Room_421_ycl671, Living_Room_280_i5lyva, Parlor_361_ark39j, Living_Room_331_spepzh,
Parlor_373_vkelnj, Parlor_410_xj8g1z, Parlor_390_lktsk9, Sunroom_179_ggdnkh, Foyer_479_kfbbnh,
Stairs_with_Chair_465_clsrg0, DC_-_Bar_kdizki, GT_Office_207_lsjhg8, Dining_105_xyaxbx,
Dining_AND_Kitchen_166_dleo0l, Dining_Room_Detail_451_kv9zwm, Dining_Bar_Cart_126_rtdr2u,
Kitchen_134_s5cazd, Kitchen_154_avquj8, Premier_611_fksc2s, Premier_Bath_633_aa3abf,
Premier_Closet_642_qzbb9i, GT_Bedroom_245_j5ffcp, GT_Bath_544_zjd6ff, GT_Bath_568_vgfoie,
GT_Her_Closet_594_zgfrgl, Executive_014_w1rp8a, Executive_Bath_040_cp3scq, Deluxe_2_061_txugmc
```
**Exterior (23), in order:**
```
LXIVDC_GARDENS035_ly1k2d, …026_nx1u73, …056_oed2fk, …007_q2e2y0, …052_ccsvbe, …064_ybjkpl,
…073_d8t7nt, …089_zmpr9g, …102_bv6kmk, …103_rqir72, …113_v7dpbk, …125_zpibxr, …134_d5aklw,
…147_yvgkkd, …046_q59bby, …157_wtqzaq, …169_kg6m0s, …184_jgnpcn, …194_dzlttv, …201_hodm01,
…218_v7wjnb, …223_klaapo, Spa_House_1058_d3cilj
```
**Site Plan (8), in order:**
```
FirstFloorPlan_jyuexv.png, SecondFloorPlan_a9lyke.png, ThirdFloorPlan_yq3lno.png, GardenPlan_qkwnln.png,
Ballroom-BANQUETDINING_hyqzx6.jpg, Ballroom-SEATEDDINING_ykemyx.jpg, Ballroom-BOARDMEETING_kbtijh.jpg,
Ballroom-LECTURE_nil4at.jpg
```
(The canonical full URLs are exactly those in the current `alex0349.html` `GALLERIES` block.)

### 1d. CSS background-image patterns
- **alex0349 has NO `background-image` at all** — it uses `<img>` everywhere (hero is `<img class="hero-img">`).
- **Other pages DO use `background:url(...)` / `background-image:url(...)`** (hero textures, photo-bands). alex0349 gives no precedent for these. Proposed rule: replace the URL inside `url(...)` with the matching Cloudinary URL, leaving the CSS property/structure untouched.

### 1e. Master inline-image → Cloudinary public_id map
Used across the per-file work below. All confirmed present in Cloudinary unless flagged.

| Old basename (various exts) | Cloudinary public_id | Folder | Confidence |
|---|---|---|---|
| `imari-parchment.svg` | `imari-parchment_oactji.svg` | Brand/Logos | ✅ high |
| `imari-gingko.svg` | `imari-gingko_bh78d8.svg` | Brand/Logos | ✅ high |
| `wall-texture.jpg` | `wall-texture_skicra.jpg` | Brand/Textures | ✅ high |
| `lincoln-memorial.jpg` | `lincoln-memorial_pn9yki.jpg` | Other | ✅ high |
| `south-lawn.jpg` | `south-lawn_rqf1lh.jpg` | Other | ✅ high |
| `zac-brown.jpeg` | `zac-brown_o37dri.jpg` | Other | ✅ high |
| `Yard_045.jpeg` | `Yard_045_vgr6lu.jpg` | Exterior | ✅ high |
| `LXIVDC_GARDENS046.jpg` / `Hellman-Chang_…035/064/134/147/157` etc. | `LXIVDC_GARDENS0NN_<suffix>.jpg` | Exterior | ✅ high |
| `Living_Room_280.jpg` | `Living_Room_280_i5lyva.jpg` | Interior | ✅ high |
| `Living_Room_306.jpeg` | `Living_Room_306_nu1o4w.jpg` | Interior | ✅ high |
| `Living_Room_316.jpeg` | `Living_Room_316_nfe3ec.jpg` | Interior | ✅ high |
| `Living_Room_331_web.jpeg` | `Living_Room_331_spepzh.jpg` | Interior | ✅ high |
| `Parlor_390.jpeg` | `Parlor_390_lktsk9.jpg` | Interior | ✅ high |
| `Kitchen_134.jpeg` | `Kitchen_134_s5cazd.jpg` | Interior | ✅ high |
| `Sunroom_179.jpeg` | `Sunroom_179_ggdnkh.jpg` | Interior | ✅ high |
| `Spahouse_1058.jpeg` | `Spa_House_1058_d3cilj.jpg` | Interior | ✅ high |
| `Foyer_479.jpeg` | `Foyer_479_kfbbnh.jpg` | Interior | ✅ high |
| `Dining_AND_Kitchen_166.jpg` | `Dining_AND_Kitchen_166_dleo0l.jpg` | Interior | ✅ high |
| `Dining_Room_451.jpeg` | `Dining_Room_Detail_451_kv9zwm.jpg` | Interior | ✅ high |
| `Dining_Room_DSCF0271.jpeg` | `Dining_Room_Mantle_DSCF0271_lkd6ft.jpg` | Interior | ✅ high |
| `Georgetown_Office_207.jpeg` | `GT_Office_207_lsjhg8.jpg` | Interior | ✅ high |
| `Georgetown_Bath_505.jpeg` | `GT_Bath_505_bcajzj.jpg` | Interior | ✅ high |
| `Georgetown_Suite_245.jpeg` | `GT_Bedroom_245_j5ffcp.jpg` | Interior | ✅ high |
| `Georgetown_Suite_263.jpeg` | `GT_Bedroom_263_ul55g9.jpg` | Interior | ✅ high |
| `Living_Room_421_agents.jpg` | `Parlor_and_Living_Room_421_ycl671.jpg` | Interior | ✅ high (same as alex hero) |
| `Living_Room_344.jpeg` | `Living_Room_Detail_344_r33o8b.jpg` | Interior | ⚠️ medium (name differs: "Detail") |
| `Parlor_427.jpeg` | `Parlor_AND_Living_Room_427_nvyyqy.jpg` | Interior | ⚠️ medium |
| `Dining_Room_105-header.jpg` | `Dining_105_xyaxbx.jpg` | Interior | ⚠️ medium |
| `Dining_Room_126_web.jpeg` | `Dining_Bar_Cart_126_rtdr2u.jpg` | Interior | ⚠️ medium |
| `Dining_Room_170.jpeg` | `Dining_Fireplace_170_jra41e.jpg` | Interior | ⚠️ medium |
| `Bar_075.jpeg` | `Bar_080_kqcs0i.jpg` (user-confirmed) | Interior | ✅ confirmed |
| `Foyer_465.jpeg` | `Stairs_with_Chair_465_clsrg0.jpg` (user-confirmed) | Interior | ✅ confirmed |

---

## Plan section 2 — Per-file migration scope

`private-access.html` has **zero** image references (redirect stub) → excluded.

| # | File | Non-CLD refs | Gallery? (matches alex) | OG/Twitter img to fix | CSS bg-image | Complexity | Quirks |
|---|---|---|---|---|---|---|---|
| 1 | `private-info.html` | 3 (logos only) | no | no | no | **small** | The password gate page. Logos only. |
| 2 | `private/alarm250.html` | ~7 remaining | no | favicon+og already done | 3 (photo-band) | **small** | Partial migration already committed; finish photo-band tiles + `Yard_045` + 2 JS logo consts. |
| 3 | `private/freedom250.html` | ~14 | no | yes (gingko og:image) | yes (wall-texture + 3 garden/room tiles) | **medium** | Event photos (lincoln/zac/south-lawn) + hero texture + photo-band. No JS gallery. |
| 4 | `imari-website.html` | ~24 | no | yes (Foyer_465 og) | yes (Dining_Room_170) | **medium-large** | **Public homepage.** Many section photos incl. 2 ambiguous (`Foyer_465`, `Dining_Room_170`). 20 relative logo refs (nav/footer/favicon). |
| 5 | `private/july4.html` | gallery + ~12 inline | ✅ all 3 | yes (gingko) | yes (wall-texture) | **large** | Gallery + events + texture. |
| 6 | `private/july4p2.html` | gallery + ~12 inline | ✅ all 3 | yes (gingko) | yes (wall-texture) | **large** | Near-identical to july4 (family-tilt variant). |
| 7 | `private/corporate.html` | gallery + 9 inline | ✅ Interior+Exterior only (**no site-plan**) | yes | no | **large** | Gallery has only 2 categories. Inline incl. ambiguous `Dining_Room_105-header`, `Living_Room_331_web`, `Parlor_390`. |
| 8 | `templates/_template-specific-offer.html` | gallery + ~5 | ✅ all 3 | yes | yes (wall-texture) | **large** | **Dev-only** (excluded from deploy via `.vercelignore`). Has `{{PLACEHOLDER}}` tokens — preserve them. |
| 9 | `templates/_template-landing.html` | gallery + ~9 | ✅ all 3 | no img meta seen | no | **large** | **Dev-only.** Inline incl. ambiguous `Bar_075`, `Foyer_465`. |
| 10 | `templates/_template-collateral.html` | ~14 (no JS gallery) | no (minor markup only) | no | 7 (photo-bands) | **medium-large** | **Dev-only.** Inline incl. ambiguous `Parlor_427`, `Dining_Room_126_web`, `Dining_Room_DSCF0271`, `Hellman-Chang_*`. |

---

## Plan section 3 — Proposed execution order

Back-fill the reference first, then fewest-changes-first, grouping by shared pattern, complex/dev-only last:

1. **`private/alex0349.html` (back-fill)** — re-migrate existing Cloudinary URLs to ADD `f_auto,q_auto` (photos) + OG crop, and drop version segments. Keeps it the canonical reference under the new convention. Gallery sets unchanged.
2. **`private-info.html`** — 3 logo swaps. Smallest; proves the logo (SVG, no-transform) pattern.
3. **`private/alarm250.html`** — finish the already-started partial migration; no gallery.
4. **`private/freedom250.html`** — no gallery; establishes events + texture + photo-band pattern.
5. **`imari-website.html`** — homepage; no gallery but many section photos. (Public-facing; done after the pattern is proven.)
6. **`private/july4.html`** — first gallery page; establishes the gallery-array swap under the new convention.
7. **`private/july4p2.html`** — mirror of july4; fast follow.
8. **`private/corporate.html`** — gallery page with the no-site-plan wrinkle.
9. **`templates/_template-specific-offer.html`** — dev-only; preserve placeholder tokens.
10. **`templates/_template-landing.html`** — dev-only.
11. **`templates/_template-collateral.html`** — dev-only; most one-off inline photos.

Each file: migrate → local browser test (images load, lightbox works, mobile layout, no console errors) → show diff + URL change list + screenshot(s) → wait for your explicit approval → one focused commit → push → next.

---

## Plan section 4 — Risks & unknowns

**✅ Risk #1 — Transformations — RESOLVED.** You chose to ADD `f_auto,q_auto` (+ OG crop). alex0349 is back-filled first (step 1) to stay canonical. Commit-message template wording updated below to match.

**✅ Risk #2 — Version segment — RESOLVED.** Normalizing everything to version-less.

**✅ Templates — RESOLVED.** Will migrate `templates/*` (placeholder tokens preserved).

**🟢 Risk #3 — Ambiguous inline photo mappings — RESOLVED.**
- `Bar_075.jpeg` → `Bar_080_kqcs0i.jpg` ✅ (user-confirmed)
- `Foyer_465.jpeg` → `Stairs_with_Chair_465_clsrg0.jpg` ✅ (user-confirmed)
- `Parlor_427.jpeg` → `Parlor_AND_Living_Room_427_nvyyqy.jpg` (medium-confidence; I'll surface in the collateral-template diff for a final look)
- `Dining_Room_126_web.jpeg` → `Dining_Bar_Cart_126_rtdr2u.jpg` (medium; surfaced in collateral diff)
- `Dining_Room_170.jpeg` → `Dining_Fireplace_170_jra41e.jpg` (medium; surfaced in homepage diff)
- `Dining_Room_105-header.jpg` → `Dining_105_xyaxbx.jpg` (medium; surfaced in corporate diff)
- `Living_Room_344.jpeg` → `Living_Room_Detail_344_r33o8b.jpg` (medium; surfaced in homepage diff)

The two no-exact-match cases are now decided. The remaining medium-confidence ones I'll apply as the best match and call out explicitly in each file's diff so you can catch any miss before approving.

**🟡 Risk #4 — `corporate.html` gallery has no Site Plan.** Intentional (corporate audience) or an omission? I'll migrate only the 2 categories present (Interior + Exterior) and NOT add Site Plan unless you say so.

**🟡 Risk #5 — Templates are dev-only.** `templates/*` are excluded from deploys via `.vercelignore`. Migrating them keeps future pages consistent but has no live impact and can't be browser-verified the same way (they contain `{{PLACEHOLDER}}` tokens and may not render cleanly). Confirm you want them migrated; if so I'll preserve all placeholder tokens and verify by static inspection + a token-substituted local copy.

**🟡 Risk #6 — `july4p2.html` vs `july4.html`.** Near-identical; I'll treat them independently (separate commits) but the diffs should be nearly the same. If they ever diverge in gallery content I'll flag it.

**🟢 Note — `og:url` left untouched.** Every page's `og:url` still points at `imari-website-beta.vercel.app`. Not an image; out of scope. Flagging only so you know it's deliberate.

---

## Step 4 placeholder — Final cleanup audit
*(To be filled in after all files are migrated: unreferenced `/photos/` & `/logos/` local files, orphaned CSS rules, and any now-unlinked standalone gallery pages. Nothing will be deleted — list only.)*
