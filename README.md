# OBSKUR — Stay in the Dark

[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)

Flask tabanlı, tamamen bellekte çalışan görüntü gizlilik ve adli bilişim aracı.
JPEG / PNG / WEBP / HEIC (maks. 16 MB) yükleyin, EXIF / XMP / IPTC / ICC / PNG-text
yüzeyini görün, Privacy Risk Score (0-100) alın, güvenle dışa aktarın.

Akış: `inspect → score → purge / selective / blur / spoof / edit → certificate`

Hiçbir dosya diske yazılmaz. Tüm işlemler RAM içinde yapılır.

## İçindekiler

- [Özellikler](#özellikler)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Hızlı Başlat](#hızlı-başlat)
- [Kullanım Kılavuzu](#kullanım-kılavuzu)
- [API](#api)
- [Yapılandırma ve Limitler](#yapılandırma-ve-limitler)
- [Güvenlik](#güvenlik)
- [Proje Yapısı](#proje-yapısı)
- [Marka](#marka)
- [Sorun Giderme](#sorun-giderme)
- [Katkı](#katkı)
- [Lisans](#lisans)

## Özellikler

- **Metadata Inspector:** GPS haritası (şehir/ülke çözümleme ile) + kamera / tarih /
  yazılım tabloları + kapsayıcı başlıkları (EXIF, XMP, IPTC, ICC, PNG-text).
- **Privacy Risk Index:** 0-100 risk skoru, tespit edilen riskler ve öneriler.
- **Selective Sanitizer:** GPS, kamera, tarih, yazılım, sahiplik/yorum başlıklarını
  ayrı ayrı seçerek temizleme.
- **Full Purge:** Tüm metaveriyi sıfırlama (format korunur: JPEG/PNG/WEBP).
- **GPS Blur:** Koordinatları kaba ızgaraya yuvarlama (city ~11 km / district ~1 km /
  street ~100 m), rakımı silme; diğer etiketler korunur.
- **Share Presets:** Instagram / X / WhatsApp için tek dokunuşla JPEG dışa aktarma.
- **Profile Simulator:** Test için sentetik make/model/GPS enjeksiyonu.
- **Tag Editor:** Tekil EXIF etiketlerini yerinde düzenleme (tarih formatı doğrulamalı).
- **Batch Processor:** 20 dosyaya kadar toplu işlem, tek ZIP indirir.
- **Session Audit + Certificate:** İşlem günlüğü (CSV dışa aktarma) ve SHA256
  hash-zincirli imha sertifikası + indirilebilir JSON rapor.
- **EN/TR arayüz:** Kalıcı dil seçimi, backend İngilizce kalır.
- **Reverse-geocode anahtarı:** Şehir/ülke çözümleme varsayılan açıktır,
  Configuration ekranından kapatılabilir (kapalıyken tam yerel mod).

## Gereksinimler

- Python 3.12+
- pip
- Docker (opsiyonel, konteyner ile çalıştırmak için)
- Modern bir tarayıcı (harita görünümü için internet gerekir, çekirdek işlemler çevrimdışı çalışır)

Bağımlılıklar (`requirements.txt`):

```
Flask>=3.1.0
Pillow>=11.3.0
piexif>=1.1.3
pillow-heif>=0.18.0
```

Not: `pillow-heif` yalnızca HEIC desteği içindir. Kurulu değilse uygulama çalışır,
yalnızca HEIC dosyaları reddedilir.

## Kurulum

1. Repoyu klonlayın:

```bash
git clone <repo-url>
cd Exif-data-remover-manupulator
```

2. Sanal ortam oluşturun ve bağımlılıkları kurun:

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
```

3. Uygulamayı başlatın:

```bash
python app.py
# http://127.0.0.1:5000
```

Docker ile kurulum:

```bash
docker build -t obskur .
docker run -p 5000:5000 obskur
# http://127.0.0.1:5000
```

## Hızlı Başlat

```bash
pip install -r requirements.txt
python app.py
# http://127.0.0.1:5000
```

Ardından tarayıcıda `http://127.0.0.1:5000` adresini açın, bir görüntü sürükleyip
bırakın ve Inspection panelinde sonucu görün.

## Kullanım Kılavuzu

Bu bölüm arayüzdeki her modülün adım adım kullanımını anlatır. Genel prensip aynıdır:
önce incele, sonra işle, en son denetle ve indir.

### 0. Genel akış

1. Hedef görüntüyü seçin veya sürükleyip bırakın.
2. Inspection ekranında metaveriyi ve risk skorunu inceleyin.
3. Aşağıdaki modüllerden biriyle görüntüyü işleyin.
4. Audit önizlemede önce/sonra farkını ve sertifikayı kontrol edin, dosyayı indirin.

### 1. Inspect (İnceleme)

Amaç: Dosyayı değiştirmeden ne içerdiğini görmek.

1. Görüntüyü yükleyin. Otomatik olarak `/api/inspect` çağrılır.
2. Üst panelde format, boyut ve çözünürlüğü kontrol edin.
3. `Privacy Risk Score` panelinde 0-100 skorunu, risk seviyesini, tespit edilen
   riskleri ve önerileri okuyun.
4. Metadata tablolarında kamera, tarih, yazılım ve konum alanlarını inceleyin.
5. GPS varsa haritada işaretçiyi ve çözümlenen şehir/ülke bilgisini kontrol edin.

İpucu: Risk skoru yüksekse önce hangi kategorinin (konum, cihaz, tarih) skoru
yükselttiğine bakın, temizlik modunu ona göre seçin.

### 2. Selective Sanitizer (Seçici Temizlik)

Amaç: Yalnızca seçtiğiniz kategorileri silmek, geri kalanı korumak.

1. `Sanitizer` paneline geçin.
2. Silinecek kutuları işaretleyin:
   - `remove_gps`: Konum ve rakım
   - `remove_camera`: Make, Model, Lens, Seri No
   - `remove_datetime`: Çekim ve dijitalleştirme tarihleri
   - `remove_software`: Yazılım / düzenleyici bilgisi
   - `remove_descriptions`: Artist, Copyright, Açıklama, UserComment
3. `Process` düğmesine basın.
4. Audit ekranında `removed_keys` listesinin seçtiklerinizle eşleştiğini doğrulayın.
5. `Download` ile `custom_<dosyaadı>` dosyasını indirin.

Örnek: Yalnızca konum silmek istiyorsanız sadece `remove_gps` kutusunu açık bırakın.

### 3. Full Purge (Tam Temizlik)

Amaç: Paylaşmadan önce tüm metaveriyi sıfırlamak.

1. `Purge` paneline geçin veya doğrudan `Purge` işlemini seçin.
2. Kalite değerini kontrol edin (varsayılan 95).
3. İşlemi çalıştırın.
4. Audit ekranında skorun 0 veya 0'a yakın olduğunu ve `removed_count` değerinin
   dolu olduğunu doğrulayın.
5. `purged_<dosyaadı>` dosyasını indirin.

Not: Çıktı formatı korunur (JPEG JPEG olarak, PNG PNG olarak, WEBP WEBP olarak kalır).
HEIC girdiler JPEG olarak dışa aktarılır.

### 4. GPS Blur (Konum Bulanıklaştırma)

Amaç: Konumu tamamen silmeden kabaca gizlemek.

1. `Blur` paneline geçin.
2. Hassasiyet seçin:
   - `city`: ~11 km ızgara (1 ondalık)
   - `district`: ~1 km ızgara (2 ondalık, varsayılan)
   - `street`: ~100 m ızgara (3 ondalık)
3. İşlemi çalıştırın.
4. Haritada işaretçinin yuvarlanmış konuma taşındığını ve rakımın silindiğini doğrulayın.
5. `blurred_<dosyaadı>` dosyasını indirin.

Not: GPS yoksa modül güvenli şekilde tam temizliğe düşer. Diğer EXIF etiketleri korunur.

### 5. Share Presets (Paylaşım Önayarları)

Amaç: Sosyal medya için hızlı, izsiz JPEG üretmek.

1. `Share` paneline geçin.
2. Preset seçin:
   - `instagram`: uzun kenar 2048, kalite 85
   - `x`: uzun kenar 2048, kalite 85
   - `whatsapp`: uzun kenar 1600, kalite 80
   - `original`: yeniden boyutlandırma yok, kalite 95
3. İşlemi çalıştırın, `<preset>_<dosyaadı>.jpg` dosyasını indirin.

Tüm presetler metaveriyi tamamen siler ve çıktıyı JPEG olarak verir.

### 6. Profile Simulator (Simülasyon)

Amaç: Test ve eğitim için sahte cihaz/konum enjekte etmek.

1. `Simulator` paneline geçin.
2. Profil seçin (`generic` veya listeden bir cihaz profili).
3. İsteğe bağlı `fake_make`, `fake_model`, `fake_software` alanlarını doldurun.
4. Geçerli bir enlem (-90 ile 90) ve boylam (-180 ile 180) girin.
5. İşlemi çalıştırın, Audit ekranında `added_keys` içinde yeni GPS ve cihaz
   alanlarının göründüğünü doğrulayın.
6. `simulated_<dosyaadı>` dosyasını indirin.

Uyarı: Bu modül adli test amaçlıdır. Başkasını yanıltacak şekilde kullanmayın.

### 7. Tag Editor (Etiket Düzenleyici)

Amaç: Tekil EXIF alanlarını düzeltmek veya silmek.

1. `Tag Editor` paneline geçin.
2. Düzenlenebilir etiket listesinden alan seçin (`make`, `model`, `software`,
   `artist`, `copyright`, `imagedescription`, `datetime`, `datetimeoriginal`,
   `datetimedigitized`, `usercomment`, `lensmodel`, `bodyserialnumber`).
3. Yeni değeri yazın veya boş bırakarak silin.
4. Tarih alanları için `YYYY:MM:DD HH:MM:SS` formatını kullanın
   (örnek: `2024:05:10 14:30:00`). Format yanlışsa işlem reddedilir.
5. GPS silmek için `deletions` alanına `gps` yazın.
6. İşlemi çalıştırın, `edited_<dosyaadı>` dosyasını indirin.

### 8. Batch Processor (Toplu İşlem)

Amaç: En fazla 20 dosyayı tek seferde işlemek.

1. `Batch` paneline geçin.
2. En fazla 20 görüntü seçin (her biri 16 MB altında olmalı).
3. Mod seçin: `purge`, `selective`, `blur` veya `spoof`.
4. Seçilen moda ait ek alanları doldurun (örnek: blur için precision, spoof için lat/lng).
5. İşlemi çalıştırın, `obskur_batch_<mod>.zip` dosyasını indirin.
6. ZIP içindeki `cleaned_<ad>` dosyalarının adlarını ve formatlarını kontrol edin.

Not: Bozuk veya desteklenmeyen dosyalar sessizce atlanır, geçerli dosyalar işlenir.

### 9. Audit, Certificate ve Report (Denetim)

Her işlemden sonra:

1. `Audit` panelinde boyut farkını (`size_before_kb` / `size_after_kb`),
   skor değişimini (`score_delta`) ve `removed_keys` / `added_keys` farklarını okuyun.
2. `Certificate` alanında `sha256_before`, `sha256_after`, işlem adı, kalite ve
   UTC zaman damgasını kontrol edin.
3. `Download JSON Report` ile `/api/report` çıktısını saklayın.
4. `Export CSV` ile oturum günlüğünü tablo olarak indirin.

Sertifika, hangi dosyanın hangi işlemden geçtiğini hash zinciri ile kanıtlar.

### 10. Dil ve Gizlilik Ayarları

- Sağ üstteki dil seçici ile `EN` / `TR` arasında geçin. Seçim `obskur-lang`
  anahtarıyla tarayıcıda saklanır, sayfa yenilense bile korunur.
- `Configuration` ekranından JPEG kalitesini seçin (85 / 95 / 100).
- `Configuration` ekranından reverse-geocode anahtarını kapatabilirsiniz
  (`obskur-geocode`). Kapalıyken şehir/ülke çözümleme yapılmaz ve uygulama
  harita döşemeleri dışında ağa çıkmadan tam yerel çalışır.

## API

Tüm işlem endpointleri `POST` + `multipart/form-data` kullanır (`image` alanı).
Batch endpointi `images` alanıyla çoklu dosya alır.

| Endpoint | Açıklama |
|---|---|
| `/api/inspect` | Metadata + risk skoru (JSON) |
| `/api/process-and-audit` | İşle, önce/sonra + diff + sertifika döndür (JSON) |
| `/api/report` | İndirilebilir adli rapor (JSON) |
| `/api/selective-clean` | Seçici temizlik + dosya indir |
| `/api/purge` | Tam temizlik + dosya indir |
| `/api/blur` | GPS bulanıklaştırma + dosya indir |
| `/api/spoof` | Sentetik profil enjeksiyonu + dosya indir |
| `/api/edit-tags` | Etiket düzenleme + dosya indir |
| `/api/share-preset` | Platform önayarı (`instagram`, `x`, `whatsapp`, `original`) |
| `/api/batch-process` | Toplu işlem (`images` alanı, maks. 20), ZIP indirir |
| `/api/preview` | Tarayıcının açamadığı formatlar (HEIC) için JPEG önizleme |

curl örneği (inceleme):

```bash
curl -X POST http://127.0.0.1:5000/api/inspect \
  -F "image=@ornek.jpg"
```

curl örneği (tam temizlik):

```bash
curl -X POST http://127.0.0.1:5000/api/purge \
  -F "image=@ornek.jpg" \
  -F "quality=95" \
  --output purged_ornek.jpg
```

curl örneği (seçici temizlik):

```bash
curl -X POST http://127.0.0.1:5000/api/selective-clean \
  -F "image=@ornek.jpg" \
  -F "remove_gps=true" \
  -F "remove_camera=false" \
  -F "remove_datetime=true" \
  -F "remove_software=true" \
  -F "remove_descriptions=true" \
  --output custom_ornek.jpg
```

## Yapılandırma ve Limitler

- `MAX_CONTENT_LENGTH = 16 MB`, `MAX_IMAGE_PIXELS = 50 MP` (decompression-bomb guard)
- Batch limiti: en fazla 20 dosya
- JPEG dışa aktarma kalitesi: Configuration ekranı (85 / 95 / 100)
- Reverse-geocode: Configuration ekranı (`obskur-geocode`, varsayılan açık)
- Dil: üst bar seçimi (`obskur-lang`, varsayılan `en`)
- Desteklenen formatlar: JPEG, PNG, WEBP, HEIC (magic-byte ile doğrulanır)

## Güvenlik

- Magic-byte doğrulama (uzantıya güvenilmez), HEIC marka kontrolü
- CSP + `nosniff` + `no-referrer` + COOP/CORP, `X-Frame-Options: DENY`
- XSS-safe render, CSV formül-enjeksiyon koruması, dosya adı dezenfeksiyonu
- Hata detayları gizlenir (500 içermez), işlem sonrası bellek temizliği
- Detay: [`SECURITY.md`](SECURITY.md)

## Proje Yapısı

```
app.py                    Flask uygulaması ve API route'ları
core/
  __init__.py             HEIF/HEIC desteği kaydı
  exif_reader.py          Metadata okuma (EXIF/XMP/IPTC/ICC/PNG-text)
  privacy_scorer.py       0-100 gizlilik risk skoru
  exif_cleaner.py         purge / selective / blur / edit / share-preset motoru
  metadata_simulator.py   Sentetik profil enjeksiyonu
  security_engine.py      Magic-byte doğrulama ve bellek temizliği
  batch_processor.py      Çoklu görüntüden ZIP üretimi
templates/index.html      Tek sayfa arayüz (blueprint teması)
static/
  favicon.svg             Redacted-O mark
  logo.png                Arayüzde kullanılan logo
  js/app.js               Arayüz akışı
  js/i18n.js              EN/TR çeviriler
brand/                    logo.svg, logo-wide.svg, logo-light.svg, social-preview.svg, BRAND.md
Dockerfile                Konteyner kurulumu
requirements.txt          Python bağımlılıkları
DESIGN.md                 Tasarım kaydı (v5 Blueprint)
SECURITY.md               Güvenlik modeli
```

## Marka

Detay: [`brand/BRAND.md`](brand/BRAND.md) · Logo: `brand/logo.svg` ·
Geniş kilitlenme: `brand/logo-wide.svg` · Tasarım: [`DESIGN.md`](DESIGN.md)

## Sorun Giderme

- `Invalid or corrupted image format`: Dosya magic-byte kontrolünden geçemedi.
  Dosyanın gerçek bir JPEG/PNG/WEBP/HEIC olduğunu doğrulayın, uzantıyı elle
  değiştirdiyseniz orijinaline döndürün.
- `HEIC detected but HEIC support is not installed`: `pip install pillow-heif`
  çalıştırın veya dosyayı JPEG/PNG olarak kaydedip tekrar deneyin.
- `Image exceeds the 50MP safety limit`: Görüntü 50 megapikselden büyük.
  Dosyayı küçültüp tekrar yükleyin.
- `413 Request Entity Too Large`: Dosya 16 MB sınırını aşıyor. Dosyayı sıkıştırın
  veya yeniden boyutlandırın.
- Harita görünmüyor: Harita döşemeleri ağ gerektirir. Çevrimdışıysanız çekirdek
  temizlik özellikleri çalışmaya devam eder, yalnızca harita ve şehir çözümleme
  devre dışı kalır.
- Şehir/ülke görünmüyor: `Configuration` ekranında reverse-geocode anahtarının
  açık olduğunu kontrol edin.
- Port çakışması: `app.py` içinde `port=5000` değerini değiştirin veya
  `docker run -p 8080:5000 obskur` ile farklı porttan yayınlayın.

## Katkı

1. Repoyu fork edin.
2. Yeni bir dal açın (`git checkout -b ozellik/kisa-ad`).
3. Değişiklikleri yapın ve test edin (`python app.py` ile manuel test).
4. Commit edin ve push edin.
5. Pull Request açın, değişikliği ve test adımlarını açıklayın.

## Lisans

MIT — [`LICENSE`](LICENSE)
