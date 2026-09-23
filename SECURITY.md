# SECURITY — OBSKUR

## Scope
- Flask API (`app.py`), `core/` engines, `templates/`, `static/js/`
- Supported formats: JPEG, PNG, WEBP, HEIC (verified via magic bytes)

## Protections
- Magic-byte validation (`SecurityEngine.sniff_format`), extensions are not trusted
- `MAX_CONTENT_LENGTH = 16MB`, `MAX_IMAGE_PIXELS = 50MP` bomb guard
- CSP (script-src self + unpkg, object-src none, frame-ancestors none), nosniff, no-referrer, COOP/CORP
- XSS-safe rendering (textContent + escapeHtml), CSV formula-injection protection
- Error details are hidden (no internals in 500s), validation messages in 400s are controlled
- Dependency pins: `requirements.txt`

## Reporting
Found a vulnerability? Do not open an issue — report it privately first:
- State an email / DM contact (add the repo owner)
- Include the affected version (`TOOL_VERSION`), a PoC file + request sample
- 90-day responsible disclosure is recommended

## Non-goals
- Unlimited batch for DoS (max 20 files / 16MB total)
- No CSRF token — no auth/cookies, local-only model. If you expose it to the
  internet, add a reverse proxy + auth in front.
