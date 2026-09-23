# BRAND — OBSKUR

> Stay in the Dark. 100% local EXIF forensics.

## 1. Story
Every photo whispers place, device, and moment. OBSKUR makes that whisper visible,
then deletes it.
`inspect → score → purge/spoof → certificate`

## 2. Name
- **OBSKUR** — dark, modern, premium. Turkish pronunciation, global spelling.
- Tagline EN: `STAY IN THE DARK` / TR: `KARANLIKTA KAL`

## 3. Logo
- `logo.svg`: blueprint tile, redacted-O in white line. Bold vertical O with a
  horizontal bar crossing through (protruding, sharp 90° corners).
- `logo-light.svg`: for light backgrounds (blueprint blue `#0C2745` mark).
- `social-preview.svg`: GitHub social preview (1280x640) — blueprint grid + title-block frame.
- `logo-wide.svg`: horizontal lockup (476x192) — redacted-O sized to cap-height + BSKUR.
- Note: the lettering inside `logo-wide.svg` and `social-preview.svg` is converted to
  Chakra Petch outlines (font-independent, renders identically everywhere).
- Rule: always caps, tracking +8, no gradients, no shadows.

## 4. Colors (v5 Blueprint — deep navy)
```
--bg-root #040F1E
--bg-surface #071A30
--bg-panel #0B2440
--border #2A4F76
--text-primary #F2F7FC
--text-muted #A9C3D9
--text-dim #7FA6C2
--accent #F2F7FC (ink #040F1E)
--safe #22C55E / --warning #EAB308 / --danger #EF4444
--void-glow rgba(255,255,255,0.05)
```

## 5. Typography (all OFL, open-source compatible)
- Everything: Chakra Petch 400/500/600/700 (display + UI + data)
- Fallback: Inter (sans) / JetBrains Mono (mono) — if fonts fail to load

## 6. Signature moments
1. 320px void dropzone + halo
2. Mono risk score `90/100` + HIGH RISK badge
3. Destruction certificate `sha256_before/after`

## Rollback
- Before shipping, back up a working copy; the cleanest rollback is:
  copy the changed files back from the backup.
