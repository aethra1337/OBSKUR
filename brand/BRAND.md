# BRAND — OBSKUR

> Stay in the Dark / Karanlıkta Kal. 100% local EXIF forensics.

## 1. Hikaye
Her fotoğraf yer, cihaz ve an fısıldar. OBSKUR bu fısıltıyı görünür kılıp siler.
`inspect → score → purge/spoof → certificate`

## 2. İsim
- **OBSKUR** — karanlık, modern, premium. TR telaffuz, global yazım.
- Tagline EN: `STAY IN THE DARK` / TR: `KARANLIKTA KAL`

## 3. Logo
- `logo.svg`: blueprint tile, redacted-O in white line. Kalın dikey O + ortadan taşan yatay bar, keskin 90° köşe.
- `logo-light.svg`: açık zeminler için (blueprint mavisi `#0C2745` mark).
- `social-preview.svg`: GitHub social preview (1280x640) — blueprint grid + pafta çerçevesi.
- `logo-wide.svg`: yatay kilitlenme (476x192) — O harfi cap-height'e ayarlı redacted-O + BSKUR.
- Not: `logo-wide.svg` ve `social-preview.svg` içindeki yazılar Chakra Petch outline'ına çevrilidir (font bağımsız, her yerde aynı render).
- Kural: hep caps, tracking +8, gradient yok, gölge yok.

## 4. Renkler (v5 Blueprint — derin lacivert)
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

## 5. Tipografi (hepsi OFL, open-source uyumlu)
- Komple: Chakra Petch 400/500/600/700 (display + UI + data)
- Fallback: Inter (sans) / JetBrains Mono (mono) — font yüklenemezse

## 6. İmza anları
1. 320px void dropzone + halo
2. Mono risk skoru `90/100` + HIGH RISK rozeti
3. Destruction certificate `sha256_before/after`

## Geri alma
- Yayına almadan önce çalışan bir kopyayı yedekle; geri dönüş en temiz yoldan yapılır:
  değişen dosyaları yedekten geri kopyala.
