# DESIGN.md — OBSKUR v5 — "Blueprint"

## Thesis

The interface is an engineering drawing sheet. Every analysis is a plotted
survey: gridded, dimensioned, stamped. Nothing decorative survives drafting.

## World

- Blueprint canvas (`#0C2745`) with near-blue layering (`#123458`, `#164064`).
  Depth comes from sheet over grid, not from shadow.
- White line-work throughout: hairlines, registration corners, dotted grids.
  Precision is drawn, not implied.
- Single accent: inverted white for actions (ink `#0C2745`). Unambiguous.
- Cold drafting palette: pale blues plus white; green/amber/red reserved
  strictly for risk semantics.

## Tokens

- Grounds: `--bg-root #040f1e`, `--bg-surface #071a30`, `--bg-panel #0b2440`,
  `--bg-hover #10294a`, `--bg-active #16395e`
- Lines: `--border-color #2a4f76`, `--border-subtle #162c48`, `--border-focus #ffffff`
- Text: `#f2f7fc` / muted `#a9c3d9` / dim `#7fa6c2`
- Action: `--accent #f2f7fc` (ink `--accent-ink #040f1e`), hover `#ffffff`
- Risk: safe `#22c55e`, warning `#eab308`, danger `#ef4444` (unchanged semantics)
- Type: Chakra Petch 400/500/600/700 everywhere (display + UI + data, OFL);
  brand wordmark 700, +2px tracking
- Premium: `--void-glow rgba(255,255,255,0.05)` dropzone halo; redacted-O mark
  in white line (`#ffffff`), sharp 90° corners, rx=0; dotted grid + cardinal
  ticks on the void; double-rule frame on the risk panel; tabular numerals;
  one ping on the audit dot (prefers-reduced-motion guarded)
- Brand assets: `brand/logo.svg` (blueprint tile), `brand/logo-light.svg`,
  `brand/social-preview.svg`, `brand/BRAND.md` — reversible, code untouched

## Mark

Redacted-O drawn as white line-work on blueprint: bold vertical O, horizontal
bar crossing (protruding, sharp 90°). Same geometry as v4, re-inked.
`static/favicon.svg` (blue tile, 32px) is the source; header uses the same geometry
inline (transparent ground, `.brand-mark` 22px). No other logo variants.

## Key moments

1. Drawing sheet workspace (blueprint grid, hairline frame, registration corners)
   Copy: "Inspect & strip image metadata. 100% local. Nothing transmitted."
2. Survey dropzone (320px circle, dashed, dotted grid, cardinal ticks, halo on hover)
   A plotted target, not an upload box.
3. Risk Score (big tabular "90/100" + semantic badge, double-rule frame)
   The single surveyed figure — everything else is support.
4. Audit Log Footer (green validation dot with one ping, mono labels)
   Proof: "CLIENT_VALIDATION_OK". Stamped documentation.

## Tone

Cold, precise, drafting-office. INSPECT, PURGE, SANITIZE, VALIDATED.
No personality. Function is personality.

## Constraints carried over

Single-page Flask workspace (sidebar + top bar + panel layout), table/map inspection
structure (MapLibre GL + OpenFreeMap dark vector tiles, keyless; reticle markers,
dark popup chrome), local-only processing banner, security headers, magic-byte
validation — all behavior unchanged by this rebrand.

## i18n

- `static/js/i18n.js` owns all UI copy: `STR.en` / `STR.tr` (parity-checked),
  `BACKEND_TR` + prefix rules for API-provided strings, selector `BINDINGS` for static
  text, nav-label reconstruction preserving the number key.
- `app.js` routes every user-facing literal through `I18N.t()` (UI) or `I18N.tb()`
  (backend echo: risk labels, detected risks, recommendations, table keys, log statuses).
- Language select lives in the top bar (`#lang-toggle`), persisted as `obskur-lang`,
  default `en`. Switching re-applies static strings and re-renders cached inspection,
  audit previews, batch list, and history — no re-upload needed.
- Backend stays English on the wire; no API change was required.
