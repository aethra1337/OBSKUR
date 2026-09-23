# SECURITY — OBSKUR

## Kapsam
- Flask API (`app.py`), `core/` motorları, `templates/`, `static/js/`
- Desteklenen formatlar: JPEG, PNG, WEBP, HEIC (magic-byte ile doğrulanır)

## Korumalar
- Magic-byte validation (`SecurityEngine.sniff_format`), uzantıya güvenilmez
- `MAX_CONTENT_LENGTH = 16MB`, `MAX_IMAGE_PIXELS = 50MP` bomb guard
- CSP (script-src self + unpkg, object-src none, frame-ancestors none), nosniff, no-referrer, COOP/CORP
- XSS-safe render (textContent + escapeHtml), CSV formül enjeksiyon koruması
- 500 hata detayları gizlenir, 400 validasyon mesajları kontrollüdür
- Bağımlılık pinleri: `requirements.txt`

## Bildirim
Güvenlik açığı bulursan issue açma — önce gizli bildir:
- E-posta / DM belirt (repo sahibine ekle)
- Etkilenen versiyon (`TOOL_VERSION`), PoC dosya + request örneği ekle
- 90 gün sorumlu açıklama önerilir

## Desteklenmeyenler
- DoS için sınırsız batch (max 20 dosya / 16MB toplam)
- CSRF token yok — auth/cookie yok, local-only model. İnternete açacaksan reverse proxy + auth ekle.
