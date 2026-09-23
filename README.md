# OBSKUR — Stay in the Dark

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)

A Flask-based image privacy and forensics tool that runs entirely in memory.
Upload JPEG / PNG / WEBP / HEIC (max. 16 MB), inspect the EXIF / XMP / IPTC /
ICC / PNG-text surface, get a Privacy Risk Score (0-100), and export safely.

Flow: `inspect → score → purge / selective / blur / spoof / edit → certificate`

No file is ever written to disk. All processing happens in RAM.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [User Guide](#user-guide)
- [API](#api)
- [Configuration and Limits](#configuration-and-limits)
- [Security](#security)
- [Project Structure](#project-structure)
- [Brand](#brand)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Metadata Inspector:** GPS map (with city/country resolution) + camera / date /
  software tables + container headers (EXIF, XMP, IPTC, ICC, PNG-text).
- **Privacy Risk Index:** 0-100 risk score with detected risks and recommendations.
- **Selective Sanitizer:** Remove GPS, camera, date, software, ownership/comment
  headers individually.
- **Full Purge:** Wipe all metadata (format preserved: JPEG/PNG/WEBP).
- **GPS Blur:** Round coordinates to a coarse grid (city ~11 km / district ~1 km /
  street ~100 m), drop altitude; all other tags are preserved.
- **Share Presets:** One-click JPEG export for Instagram / X / WhatsApp.
- **Profile Simulator:** Inject synthetic make/model/GPS for testing.
- **Tag Editor:** Edit individual EXIF tags in place (with date format validation).
- **Batch Processor:** Process up to 20 files at once, download a single ZIP.
- **Session Audit + Certificate:** Operation log (CSV export) and SHA256
  hash-chained destruction certificate + downloadable JSON report.
- **EN/TR interface:** Persistent language selection, backend stays in English.
- **Reverse-geocode toggle:** City/country resolution is on by default and can be
  turned off from the Configuration screen (fully local mode when off).

## Requirements

- Python 3.12+
- pip
- Docker (optional, to run containerized)
- A modern browser (internet is needed for the map view; core processing works offline)

Dependencies (`requirements.txt`):

```
Flask>=3.1.0
Pillow>=11.3.0
piexif>=1.1.3
pillow-heif>=0.18.0
```

Note: `pillow-heif` is only needed for HEIC support. Without it the app still runs,
only HEIC files are rejected.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/aethra1337/OBSKUR.git
cd OBSKUR
```

2. Create a virtual environment and install dependencies:

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
```

3. Start the application:

```bash
python app.py
# http://127.0.0.1:5000
```

Docker installation:

```bash
docker build -t obskur .
docker run -p 5000:5000 obskur
# http://127.0.0.1:5000
```

## Quick Start

```bash
pip install -r requirements.txt
python app.py
# http://127.0.0.1:5000
```

Then open `http://127.0.0.1:5000` in your browser, drag and drop an image,
and see the result in the Inspection panel.

## User Guide

This section explains each module step by step. The general principle is the same:
inspect first, then process, finally audit and download.

### 0. General flow

1. Select the target image or drag and drop it.
2. Review the metadata and the risk score on the Inspection screen.
3. Process the image with one of the modules below.
4. Check the before/after diff and the certificate in the Audit preview, then download.

### 1. Inspect

Goal: See what the file contains without changing it.

1. Upload the image. `/api/inspect` is called automatically.
2. Check format, size, and dimensions in the top panel.
3. Read the 0-100 score, risk level, detected risks, and recommendations in the
   `Privacy Risk Score` panel.
4. Review camera, date, software, and location fields in the metadata tables.
5. If GPS is present, check the marker on the map and the resolved city/country.

Tip: If the risk score is high, first check which category (location, device, date)
drives it, then pick the cleaning mode accordingly.

### 2. Selective Sanitizer

Goal: Remove only the categories you select, keep the rest.

1. Switch to the `Sanitizer` panel.
2. Check the boxes to remove:
   - `remove_gps`: Location and altitude
   - `remove_camera`: Make, Model, Lens, Serial Number
   - `remove_datetime`: Capture and digitized dates
   - `remove_software`: Software / editor information
   - `remove_descriptions`: Artist, Copyright, Description, UserComment
3. Press `Process`.
4. On the Audit screen, verify the `removed_keys` list matches your selection.
5. Download the `custom_<filename>` file.

Example: To remove only location, leave just the `remove_gps` box checked.

### 3. Full Purge

Goal: Wipe all metadata before sharing.

1. Switch to the `Purge` panel or select the `Purge` operation directly.
2. Check the quality value (default 95).
3. Run the operation.
4. On the Audit screen, verify the score is 0 or near 0 and `removed_count` is populated.
5. Download the `purged_<filename>` file.

Note: The output format is preserved (JPEG stays JPEG, PNG stays PNG, WEBP stays
WEBP). HEIC inputs are exported as JPEG.

### 4. GPS Blur

Goal: Roughly hide the location without removing it entirely.

1. Switch to the `Blur` panel.
2. Select precision:
   - `city`: ~11 km grid (1 decimal, default is `district`)
   - `district`: ~1 km grid (2 decimals, default)
   - `street`: ~100 m grid (3 decimals)
3. Run the operation.
4. Verify on the map that the marker moved to the rounded location and altitude is gone.
5. Download the `blurred_<filename>` file.

Note: If there is no GPS, the module safely falls back to a full strip.
Other EXIF tags are preserved.

### 5. Share Presets

Goal: Quickly produce clean JPEGs for social media.

1. Switch to the `Share` panel.
2. Select a preset:
   - `instagram`: long edge 2048, quality 85
   - `x`: long edge 2048, quality 85
   - `whatsapp`: long edge 1600, quality 80
   - `original`: no resizing, quality 95
3. Run the operation and download `<preset>_<filename>.jpg`.

All presets strip metadata completely and output JPEG.

### 6. Profile Simulator

Goal: Inject a fake device/location for testing and training.

1. Switch to the `Simulator` panel.
2. Select a profile (`generic` or a device profile from the list).
3. Optionally fill in `fake_make`, `fake_model`, `fake_software`.
4. Enter a valid latitude (-90 to 90) and longitude (-180 to 180).
5. Run the operation and verify on the Audit screen that `added_keys` shows the new
   GPS and device fields.
6. Download the `simulated_<filename>` file.

Warning: This module is for forensic testing. Do not use it to mislead anyone.

### 7. Tag Editor

Goal: Fix or delete individual EXIF fields.

1. Switch to the `Tag Editor` panel.
2. Pick a field from the editable tag list (`make`, `model`, `software`,
   `artist`, `copyright`, `imagedescription`, `datetime`, `datetimeoriginal`,
   `datetimedigitized`, `usercomment`, `lensmodel`, `bodyserialnumber`).
3. Type the new value, or leave it empty to delete the tag.
4. For date fields use the `YYYY:MM:DD HH:MM:SS` format
   (example: `2024:05:10 14:30:00`). Wrong formats are rejected.
5. To remove GPS, write `gps` in the `deletions` field.
6. Run the operation and download the `edited_<filename>` file.

### 8. Batch Processor

Goal: Process up to 20 files in one go.

1. Switch to the `Batch` panel.
2. Select up to 20 images (each must be under 16 MB).
3. Select a mode: `purge`, `selective`, `blur`, or `spoof`.
4. Fill in the extra fields for the selected mode (example: precision for blur,
   lat/lng for spoof).
5. Run the operation and download `obskur_batch_<mode>.zip`.
6. Check the names and formats of the `cleaned_<name>` files inside the ZIP.

Note: Corrupt or unsupported files are silently skipped, valid files are processed.

### 9. Audit, Certificate, and Report

After every operation:

1. On the `Audit` panel, read the size difference (`size_before_kb` /
   `size_after_kb`), the score change (`score_delta`), and the
   `removed_keys` / `added_keys` diffs.
2. In the `Certificate` section, check `sha256_before`, `sha256_after`,
   the operation name, quality, and the UTC timestamp.
3. Keep the `/api/report` output via `Download JSON Report`.
4. Download the session log as a table via `Export CSV`.

The certificate proves which file went through which operation with a hash chain.

### 10. Language and Privacy Settings

- Switch between `EN` / `TR` with the language selector in the top bar. The choice
  is stored in the browser under the `obskur-lang` key and survives reloads.
- Select the JPEG quality on the `Configuration` screen (85 / 95 / 100).
- Turn the reverse-geocode toggle off on the `Configuration` screen
  (`obskur-geocode`). When off, no city/country resolution is performed and the app
  runs fully locally except for map tiles.

## API

All operation endpoints use `POST` + `multipart/form-data` (the `image` field).
The batch endpoint takes multiple files via the `images` field.

| Endpoint | Description |
|---|---|
| `/api/inspect` | Metadata + risk score (JSON) |
| `/api/process-and-audit` | Process, return before/after + diff + certificate (JSON) |
| `/api/report` | Downloadable forensic report (JSON) |
| `/api/selective-clean` | Selective cleaning + file download |
| `/api/purge` | Full cleaning + file download |
| `/api/blur` | GPS blurring + file download |
| `/api/spoof` | Synthetic profile injection + file download |
| `/api/edit-tags` | Tag editing + file download |
| `/api/share-preset` | Platform preset (`instagram`, `x`, `whatsapp`, `original`) |
| `/api/batch-process` | Batch processing (`images` field, max. 20), downloads ZIP |
| `/api/preview` | JPEG preview for formats browsers cannot render (HEIC) |

curl example (inspect):

```bash
curl -X POST http://127.0.0.1:5000/api/inspect \
  -F "image=@sample.jpg"
```

curl example (full purge):

```bash
curl -X POST http://127.0.0.1:5000/api/purge \
  -F "image=@sample.jpg" \
  -F "quality=95" \
  --output purged_sample.jpg
```

curl example (selective clean):

```bash
curl -X POST http://127.0.0.1:5000/api/selective-clean \
  -F "image=@sample.jpg" \
  -F "remove_gps=true" \
  -F "remove_camera=false" \
  -F "remove_datetime=true" \
  -F "remove_software=true" \
  -F "remove_descriptions=true" \
  --output custom_sample.jpg
```

## Configuration and Limits

- `MAX_CONTENT_LENGTH = 16 MB`, `MAX_IMAGE_PIXELS = 50 MP` (decompression-bomb guard)
- Batch limit: max. 20 files
- JPEG export quality: Configuration screen (85 / 95 / 100)
- Reverse-geocode: Configuration screen (`obskur-geocode`, on by default)
- Language: top bar selector (`obskur-lang`, default `en`)
- Supported formats: JPEG, PNG, WEBP, HEIC (verified via magic bytes)

## Security

- Magic-byte validation (extensions are not trusted), HEIC brand check
- CSP + `nosniff` + `no-referrer` + COOP/CORP, `X-Frame-Options: DENY`
- XSS-safe rendering, CSV formula-injection protection, filename sanitization
- Error details are hidden (no internals in 500s), memory cleanup after processing
- Details: [`SECURITY.md`](SECURITY.md)

## Project Structure

```
app.py                    Flask application and API routes
core/
  __init__.py             HEIF/HEIC support registration
  exif_reader.py          Metadata reading (EXIF/XMP/IPTC/ICC/PNG-text)
  privacy_scorer.py       0-100 privacy risk score
  exif_cleaner.py         purge / selective / blur / edit / share-preset engine
  metadata_simulator.py   Synthetic profile injection
  security_engine.py      Magic-byte validation and memory cleanup
  batch_processor.py      Multi-image to ZIP processing
templates/index.html      Single-page interface (blueprint theme)
static/
  favicon.svg             Redacted-O mark
  logo.png                Logo used in the interface
  js/app.js               Interface flow
  js/i18n.js              EN/TR translations
brand/                    logo.svg, logo-wide.svg, logo-light.svg, social-preview.svg, BRAND.md
Dockerfile                Container setup
requirements.txt          Python dependencies
DESIGN.md                 Design record (v5 Blueprint)
SECURITY.md               Security model
```

## Brand

Details: [`brand/BRAND.md`](brand/BRAND.md) · Logo: `brand/logo.svg` ·
Wide lockup: `brand/logo-wide.svg` · Design: [`DESIGN.md`](DESIGN.md)

## Troubleshooting

- `Invalid or corrupted image format`: The file failed the magic-byte check.
  Verify the file is a real JPEG/PNG/WEBP/HEIC; if you renamed the extension
  manually, restore the original.
- `HEIC detected but HEIC support is not installed`: Run `pip install pillow-heif`
  or re-save the file as JPEG/PNG and try again.
- `Image exceeds the 50MP safety limit`: The image is larger than 50 megapixels.
  Downscale it and upload again.
- `413 Request Entity Too Large`: The file exceeds the 16 MB limit. Compress or
  resize it.
- Map not showing: Map tiles need network access. Offline, the core cleaning
  features keep working; only the map and city resolution are disabled.
- City/country missing: Check that the reverse-geocode toggle is on in the
  `Configuration` screen.
- Port conflict: Change `port=5000` in `app.py` or publish a different port with
  `docker run -p 8080:5000 obskur`.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/short-name`).
3. Make your changes and test them (manual test with `python app.py`).
4. Commit, push, and open a Pull Request describing the change and test steps.

## License

MIT — [`LICENSE`](LICENSE)
