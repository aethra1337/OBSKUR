/* OBSKUR i18n — English + Turkish dictionaries.
 * Static UI strings live in STR (applied via selector BINDINGS).
 * Backend API strings (risk labels, detected risks, recommendations,
 * metadata table keys) are mapped in BACKEND_TR with English fallback.
 */
(function (global) {
    const STR = {
        en: {
            'brand.tagline': 'STAY IN THE DARK',
            'status.secure': '✓ SECURE_ENVIRONMENT',
            'status.client': 'CLIENT_ONLY_MODE',
            'audit.badge': '<span class="dot"></span> CLIENT_VALIDATION_OK',
            'nav.modules': 'MODULES',
            'nav.system': 'SYSTEM',
            'nav.inspect': 'Metadata Inspector',
            'nav.clean': 'Selective Sanitizer',
            'nav.simulate': 'Profile Simulator',
            'nav.batch': 'Batch Processor',
            'nav.edit': 'Tag Editor',
            'nav.history': 'Session Audit',
            'nav.settings': 'Configuration',

            'drop.title': 'Inspect & strip image metadata',
            'drop.sub': '100% local. Nothing transmitted.',
            'drop.primary': 'Select or drop target image file',
            'drop.secondary': 'Supports JPEG, PNG, WEBP, HEIC (Max 16MB)',
            'drop.banner': '<strong>100% Local Processing:</strong> Images are processed entirely in memory. Zero external server transfers.',

            'inspect.title': 'Metadata Inspection & Risk Analysis',
            'btn.newImage': '← New image',
            'btn.gotoClean': 'Open Sanitizer →',
            'btn.report': 'JSON Report',
            'btn.copy': 'Copy JSON',
            'file.filename': 'Filename',
            'file.dimensions': 'Dimensions',
            'file.security': 'Security',
            'file.validated': 'VALIDATED',
            'risk.title': 'PRIVACY RISK INDEX',
            'sources.title': 'CONTAINER HEADERS',
            'map.header': 'GPS GEOLOCATION AUDIT',
            'g.gps': 'GPS & GEOLOCATION DATA',
            'g.camera': 'CAMERA HARDWARE',
            'g.datetime': 'DATE & TIME INFORMATION',
            'g.software': 'SOFTWARE & PROCESSING',
            'table.empty': 'No metadata headers found',
            'src.present': 'PRESENT',
            'src.none': 'NONE',
            'geo.resolving': 'Resolving location...',

            'clean.title': 'Selective Metadata Sanitizer',
            'clean.sub': 'Remove specific EXIF headers or perform complete purge.',
            'opt.gps.t': 'GPS Location & Coordinates',
            'opt.gps.d': 'Removes latitude, longitude, altitude and related geolocation data.',
            'opt.camera.t': 'Camera Hardware Tags',
            'opt.camera.d': 'Strips manufacturer, model, serial numbers and lens parameters.',
            'opt.datetime.t': 'Chronology & Timestamps',
            'opt.datetime.d': 'Strips original capture date, digitized time and EXIF timestamps.',
            'opt.software.t': 'Software Processing Tags',
            'opt.software.d': 'Strips editing software, post-processing history and firmware version.',
            'opt.desc.t': 'Ownership & User Comments',
            'opt.desc.d': 'Strips artist, copyright notices, and custom EXIF text comments.',
            'btn.clean': 'Sanitize Selected Headers & Download',
            'btn.purge': 'Complete Metadata Purge & Download',
            'btn.audit': 'Preview Before/After Audit',
            'btn.dlreport': 'Download JSON Report',
            'audit.title': 'AUDIT PREVIEW — BEFORE → AFTER',
            'audit.action': 'Action',
            'audit.before': 'Before',
            'audit.after': 'After',
            'audit.delta': 'Δ score',
            'audit.removed': 'Removed',
            'audit.size': 'Size',
            'audit.none': 'none',

            'sim.title': 'Synthetic Profile Injection',
            'sim.sub': 'Inject custom/synthetic EXIF tags for testing and verification.',
            'sim.profile': 'HARDWARE PROFILE',
            'sim.prof.smartphone': 'Apple iPhone 15 Pro',
            'sim.prof.dslr': 'Canon EOS R5 DSLR',
            'sim.prof.generic': 'Generic Synthetic Identifier',
            'sim.make': 'MANUFACTURER',
            'sim.model': 'MODEL',
            'sim.coords': 'TARGET COORDINATES (CLICK MAP TO PICK)',
            'sim.random': 'Randomize Coordinates',
            'sim.selected': 'Selected Location:',
            'sim.lat': 'LATITUDE',
            'sim.lng': 'LONGITUDE',
            'btn.simulate': 'Inject Synthetic Metadata & Download',
            'btn.auditSpoof': 'Preview Spoof Audit',
            'audit.simTitle': 'SPOOF AUDIT PREVIEW',

            'batch.title': 'Batch Processor',
            'batch.sub': 'Process up to 20 images at once, download as ZIP.',
            'batch.mode': 'BATCH MODE',
            'batch.m.purge': 'Full purge (all metadata)',
            'batch.m.selective': 'Selective (mirror sanitizer checkboxes)',
            'batch.m.spoof': 'Spoof with generic profile + Ankara coords',
            'batch.files': 'SELECT IMAGES (max 20, 16MB each)',
            'batch.none': 'No files selected.',
            'btn.batch': 'Process Batch & Download ZIP',

            'edit.title': 'Single-Tag EXIF Editor',
            'edit.sub': 'Edit individual tags in place, then download.',
            'edit.make': 'MAKE',
            'edit.model': 'MODEL',
            'edit.software': 'SOFTWARE',
            'edit.artist': 'ARTIST',
            'edit.copyright': 'COPYRIGHT',
            'edit.desc': 'DESCRIPTION',
            'edit.datetime': 'DATE TAKEN (YYYY:MM:DD HH:MM:SS)',
            'edit.delgps': 'Delete GPS block',
            'btn.apply': 'Apply Edits & Download',
            'btn.auditEdit': 'Preview Edit Audit',
            'audit.editTitle': 'EDIT AUDIT PREVIEW',

            'hist.title': 'Session Audit Log',
            'hist.sub': 'Log of all operations processed during the active session.',
            'btn.csv': 'Export CSV',
            'btn.print': 'Print',
            'th.file': 'Target File',
            'th.action': 'Operation Type',
            'th.time': 'Timestamp',
            'th.status': 'Status',
            'hist.empty': 'No session operations recorded in RAM',

            'set.title': 'System Configuration',
            'set.sub': 'Local engine execution parameters.',
            'set.quality.t': 'JPEG Export Quality Ratio',
            'set.quality.d': 'Sets re-compression density for processed JPEG containers.',
            'q.high': '95 (High)',
            'q.max': '100 (Lossless)',
            'q.std': '85 (Standard)',
            'set.scrub.t': 'Memory Security Scrub',
            'set.scrub.d': 'Force garbage collection immediately after processing.',
            'set.geocode.t': 'Online Reverse-Geocode',
            'set.geocode.d': 'Off = 100% local (coords only). On = resolve city/country via Nominatim.',

            'a.upload': 'Please upload an image first.',
            'a.analysis': 'Image analysis failed.',
            'a.api': 'Flask API error: ',
            'a.auditPfx': 'Audit error: ',
            'a.reportPfx': 'Report error: ',
            'a.batchPfx': 'Batch error: ',
            'a.editPfx': 'Edit error: ',
            'a.copied': 'Metadata JSON copied to clipboard.',
            'a.copyfail': 'Copy failed.',
            'a.batchMin': 'Please select at least one image.',
            'a.noRecords': 'No records yet.',
            'a.preview': 'Preview generation failed.',

            'st.COMPLETED': 'COMPLETED',
            'st.DOWNLOADED': 'DOWNLOADED',
            'st.PREVIEWED': 'PREVIEWED',

            'bl.title': 'GPS BLUR',
            'bl.sub': 'Round coordinates to a coarse grid and drop altitude. Other tags stay intact.',
            'bl.precision': 'BLUR PRECISION',
            'bl.opt.city': 'City (~11 km)',
            'bl.opt.district': 'District (~1 km)',
            'bl.opt.street': 'Street (~100 m)',
            'btn.blur': 'Blur GPS & Download',
            'btn.auditBlur': 'Preview Blur Audit',

            'sh.title': 'SHARE PRESETS',
            'sh.sub': 'One-tap exports for social platforms.',
            'sh.note': 'Always strips metadata and exports JPEG, resized to the platform limit.',

            'batch.m.blur': 'Blur GPS (district precision)',

            'audit.added': 'Added',
            'audit.cert': 'Certificate',

            'sc.title': 'KEYBOARD SHORTCUTS',
            'sc.sub': 'Available anywhere except while typing.',
            'sc.modules': 'Switch modules',
            'sc.upload': 'Upload image',
            'sc.back': 'Back to upload screen'
        },
        tr: {
            'brand.tagline': 'KARANLIKTA KAL',
            'status.secure': '✓ GÜVENLİ_ORTAM',
            'status.client': 'YEREL_MOD',
            'audit.badge': '<span class="dot"></span> İSTEMCİ_DOĞRULAMA_TAMAM',
            'nav.modules': 'MODÜLLER',
            'nav.system': 'SİSTEM',
            'nav.inspect': 'Metadata İnceleyici',
            'nav.clean': 'Seçici Temizleyici',
            'nav.simulate': 'Profil Simülatörü',
            'nav.batch': 'Toplu İşlemci',
            'nav.edit': 'Etiket Editörü',
            'nav.history': 'Oturum Denetimi',
            'nav.settings': 'Yapılandırma',

            'drop.title': 'Görüntü metaverisini incele ve temizle',
            'drop.sub': '%100 yerel. Hiçbir şey iletilmez.',
            'drop.primary': 'Hedef görüntü dosyasını seç veya bırak',
            'drop.secondary': 'JPEG, PNG, WEBP, HEIC desteklenir (Maks 16MB)',
            'drop.banner': '<strong>%100 Yerel İşleme:</strong> Görüntüler tamamen bellekte işlenir. Harici sunucuya aktarım yok.',

            'inspect.title': 'Metadata İnceleme ve Risk Analizi',
            'btn.newImage': '← Yeni görsel',
            'btn.gotoClean': 'Temizleyiciyi Aç →',
            'btn.report': 'JSON Raporu',
            'btn.copy': "JSON Kopyala",
            'file.filename': 'Dosya adı',
            'file.dimensions': 'Boyutlar',
            'file.security': 'Güvenlik',
            'file.validated': 'DOĞRULANDI',
            'risk.title': 'GİZLİLİK RİSK ENDEKSİ',
            'sources.title': 'KAPSAYICI BAŞLIKLARI',
            'map.header': 'GPS KONUM DENETİMİ',
            'g.gps': 'GPS ve KONUM VERİSİ',
            'g.camera': 'KAMERA DONANIMI',
            'g.datetime': 'TARİH ve SAAT BİLGİSİ',
            'g.software': 'YAZILIM ve İŞLEME',
            'table.empty': 'Metadata başlığı bulunamadı',
            'src.present': 'MEVCUT',
            'src.none': 'YOK',
            'geo.resolving': 'Konum çözümleniyor...',

            'clean.title': 'Seçici Metadata Temizleyici',
            'clean.sub': 'Belirli EXIF başlıklarını kaldırın veya tam temizlik yapın.',
            'opt.gps.t': 'GPS Konumu ve Koordinatlar',
            'opt.gps.d': 'Enlem, boylam, rakım ve ilgili konum verilerini kaldırır.',
            'opt.camera.t': 'Kamera Donanım Etiketleri',
            'opt.camera.d': 'Üretici, model, seri numaraları ve lens parametrelerini temizler.',
            'opt.datetime.t': 'Kronoloji ve Zaman Damgaları',
            'opt.datetime.d': 'Orijinal çekim tarihi, sayısallaştırma zamanı ve EXIF zaman damgalarını temizler.',
            'opt.software.t': 'Yazılım İşleme Etiketleri',
            'opt.software.d': 'Düzenleme yazılımı, işlem geçmişi ve firmware sürümünü temizler.',
            'opt.desc.t': 'Sahiplik ve Kullanıcı Yorumları',
            'opt.desc.d': 'Sanatçı, telif bildirimleri ve özel EXIF metin yorumlarını temizler.',
            'btn.clean': 'Seçili Başlıkları Temizle ve İndir',
            'btn.purge': 'Tam Metadata Temizliği ve İndir',
            'btn.audit': 'Önce/Sonra Denetimini Önizle',
            'btn.dlreport': 'JSON Raporunu İndir',
            'audit.title': 'DENETİM ÖNİZLEMESİ — ÖNCE → SONRA',
            'audit.action': 'İşlem',
            'audit.before': 'Önce',
            'audit.after': 'Sonra',
            'audit.delta': 'Δ skor',
            'audit.removed': 'Kaldırılan',
            'audit.size': 'Boyut',
            'audit.none': 'yok',

            'sim.title': 'Sentetik Profil Enjeksiyonu',
            'sim.sub': 'Test ve doğrulama için özel/sentetik EXIF etiketleri enjekte edin.',
            'sim.profile': 'DONANIM PROFİLİ',
            'sim.prof.smartphone': 'Apple iPhone 15 Pro',
            'sim.prof.dslr': 'Canon EOS R5 DSLR',
            'sim.prof.generic': 'Genel Sentetik Tanımlayıcı',
            'sim.make': 'ÜRETİCİ',
            'sim.model': 'MODEL',
            'sim.coords': 'HEDEF KOORDİNATLAR (SEÇMEK İÇİN HARİTAYA TIKLAYIN)',
            'sim.random': 'Koordinatları Rastgeleleştir',
            'sim.selected': 'Seçili Konum:',
            'sim.lat': 'ENLEM',
            'sim.lng': 'BOYLAM',
            'btn.simulate': 'Sentetik Metaveriyi Enjekte Et ve İndir',
            'btn.auditSpoof': 'Sahte Veri Denetimini Önizle',
            'audit.simTitle': 'SAHTE VERİ DENETİM ÖNİZLEMESİ',

            'batch.title': 'Toplu İşlemci',
            'batch.sub': "20'ye kadar görüntüyü tek seferde işleyin, ZIP olarak indirin.",
            'batch.mode': 'TOPLU İŞLEM MODU',
            'batch.m.purge': 'Tam temizlik (tüm metadata)',
            'batch.m.selective': 'Seçici (temizleyici kutularını yansıtır)',
            'batch.m.spoof': 'Genel profil + Ankara koordinatlarıyla sahteleme',
            'batch.files': "GÖRÜNTÜLERİ SEÇ (en fazla 20, her biri 16MB)",
            'batch.none': 'Dosya seçilmedi.',
            'btn.batch': 'Topluyu İşle ve ZIP İndir',

            'edit.title': 'Tek Etiketli EXIF Editörü',
            'edit.sub': 'Tekil etiketleri yerinde düzenleyin, ardından indirin.',
            'edit.make': 'ÜRETİCİ',
            'edit.model': 'MODEL',
            'edit.software': 'YAZILIM',
            'edit.artist': 'SANATÇI',
            'edit.copyright': 'TELİF HAKKI',
            'edit.desc': 'AÇIKLAMA',
            'edit.datetime': 'ÇEKİM TARİHİ (YYYY:MM:DD HH:MM:SS)',
            'edit.delgps': 'GPS bloğunu sil',
            'btn.apply': 'Düzenlemeleri Uygula ve İndir',
            'btn.auditEdit': 'Düzenleme Denetimini Önizle',
            'audit.editTitle': 'DÜZENLEME DENETİM ÖNİZLEMESİ',

            'hist.title': 'Oturum Denetim Kaydı',
            'hist.sub': 'Aktif oturumda işlenen tüm işlemlerin kaydı.',
            'btn.csv': 'CSV Dışa Aktar',
            'btn.print': 'Yazdır',
            'th.file': 'Hedef Dosya',
            'th.action': 'İşlem Türü',
            'th.time': 'Zaman Damgası',
            'th.status': 'Durum',
            'hist.empty': 'RAM’de kayıtlı oturum işlemi yok',

            'set.title': 'Sistem Yapılandırması',
            'set.sub': 'Yerel motor yürütme parametreleri.',
            'set.quality.t': 'JPEG Dışa Aktarma Kalite Oranı',
            'set.quality.d': 'İşlenmiş JPEG kapsayıcıları için yeniden sıkıştırma yoğunluğunu ayarlar.',
            'q.high': '95 (Yüksek)',
            'q.max': '100 (Kayıpsız)',
            'q.std': '85 (Standart)',
            'set.scrub.t': 'Bellek Güvenlik Temizliği',
            'set.scrub.d': 'İşlemden hemen sonra çöp toplamayı zorla.',
            'set.geocode.t': 'Çevrimiçi Ters-Kodlama',
            'set.geocode.d': 'Kapalı = %100 yerel (sadece koordinat). Açık = Nominatim ile şehir/ülke çöz.',

            'a.upload': 'Lütfen önce bir görsel yükleyin.',
            'a.analysis': 'Görsel analizi başarısız.',
            'a.api': 'Flask API hatası: ',
            'a.auditPfx': 'Denetim hatası: ',
            'a.reportPfx': 'Rapor hatası: ',
            'a.batchPfx': 'Toplu işlem hatası: ',
            'a.editPfx': 'Düzenleme hatası: ',
            'a.copied': 'Metadata JSON panoya kopyalandı.',
            'a.copyfail': 'Kopyalama başarısız.',
            'a.batchMin': 'Lütfen en az bir görsel seçin.',
            'a.noRecords': 'Henüz kayıt yok.',
            'a.preview': 'Önizleme oluşturulamadı.',

            'st.COMPLETED': 'TAMAMLANDI',
            'st.DOWNLOADED': 'İNDİRİLDİ',
            'st.PREVIEWED': 'ÖNİZLENDİ',

            'bl.title': 'GPS BULANIKLAŞTIRMA',
            'bl.sub': 'Koordinatları kaba bir ızgaraya yuvarlayın ve rakımı silin. Diğer etiketler korunur.',
            'bl.precision': 'BULANIKLAŞTIRMA HASSASİYETİ',
            'bl.opt.city': 'Şehir (~11 km)',
            'bl.opt.district': 'İlçe (~1 km)',
            'bl.opt.street': 'Sokak (~100 m)',
            'btn.blur': "GPS'yi Bulanıklaştır ve İndir",
            'btn.auditBlur': 'Bulanıklaştırma Denetimini Önizle',

            'sh.title': 'PAYLAŞIM HAZIR AYARLARI',
            'sh.sub': 'Sosyal platformlar için tek dokunuşla dışa aktarma.',
            'sh.note': 'Her zaman metaveriyi temizler ve platform limitine küçültülmüş JPEG verir.',

            'batch.m.blur': 'GPS Bulanıklaştır (ilçe hassasiyeti)',

            'audit.added': 'Eklenen',
            'audit.cert': 'Sertifika',

            'sc.title': 'KLAVYE KISAYOLLARI',
            'sc.sub': 'Yazı yazarken hariç her yerde geçerlidir.',
            'sc.modules': 'Modüller arası geçiş',
            'sc.upload': 'Görsel yükle',
            'sc.back': 'Yükleme ekranına dön'
        }
    };

    /* Backend API strings (always English on the wire) -> Turkish. */
    const BACKEND_TR = {
        'LOW RISK': 'DÜŞÜK RİSK',
        'MEDIUM RISK': 'ORTA RİSK',
        'HIGH RISK': 'YÜKSEK RİSK',
        'SAFE': 'GÜVENLİ',
        'GPS Location Data (Latitude/Longitude)': 'GPS Konum Verisi (Enlem/Boylam)',
        'GPS Altitude Data': 'GPS Yükseklik Verisi',
        'Device Serial Number': 'Cihaz Seri Numarası',
        'Original Capture Date/Time': 'Orijinal Çekim Tarihi/Saati',
        'Author / Copyright Information': 'Yazar / Telif Hakkı Bilgisi',
        'GPS coordinates can reveal exactly where this photo was taken.': 'GPS koordinatları bu fotoğrafın tam olarak nerede çekildiğini açığa çıkarabilir.',
        'A device serial number can prove that photos across platforms came from the same physical device.': 'Cihaz seri numarası, farklı platformlardaki fotoğrafların aynı fiziksel cihazdan geldiğini kanıtlayabilir.',
        'No privacy-sensitive metadata detected.': 'Gizlilik açısından hassas metadata tespit edilmedi.',
        'make': 'marka',
        'model': 'model',
        'lens_model': 'lens_modeli',
        'serial_number': 'seri_numarası',
        'iso': 'iso',
        'aperture': 'diyafram',
        'shutter_speed': 'enstantane',
        'focal_length': 'odak_uzaklığı',
        'date_taken': 'çekim_tarihi',
        'date_modified': 'değiştirilme_tarihi',
        'latitude': 'enlem',
        'longitude': 'boylam',
        'altitude': 'rakım',
        'software': 'yazılım',
        'artist': 'sanatçı',
        'copyright': 'telif_hakkı'
    };

    /* Prefix rules for backend strings carrying dynamic values. */
    const BACKEND_PREFIX_TR = [
        ['Device Model (', 'Cihaz Modeli ('],
        ['Editing Software (', 'Düzenleme Yazılımı (']
    ];

    const LANG_KEY = 'obskur-lang';
    const state = { lang: 'en' };

    function getLang() {
        try {
            const saved = (typeof localStorage !== 'undefined') && localStorage.getItem(LANG_KEY);
            if (saved === 'tr' || saved === 'en') state.lang = saved;
        } catch (e) { /* private mode: stay English */ }
        return state.lang;
    }

    function setLang(lang) {
        state.lang = (lang === 'tr') ? 'tr' : 'en';
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(LANG_KEY, state.lang);
        } catch (e) { /* ignore */ }
        if (typeof document !== 'undefined') document.documentElement.lang = state.lang;
        return state.lang;
    }

    function t(key) {
        const dict = STR[state.lang] || STR.en;
        if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
        return STR.en[key] !== undefined ? STR.en[key] : key;
    }

    /* Translate a backend-provided string; English passthrough when lang is en. */
    function tb(text) {
        if (state.lang !== 'tr' || text === undefined || text === null) return text;
        const s = String(text);
        if (Object.prototype.hasOwnProperty.call(BACKEND_TR, s)) return BACKEND_TR[s];
        const stKey = 'st.' + s;
        if (Object.prototype.hasOwnProperty.call(STR.tr, stKey)) return STR.tr[stKey];
        for (const [prefix, trPrefix] of BACKEND_PREFIX_TR) {
            if (s.startsWith(prefix)) return trPrefix + s.slice(prefix.length);
        }
        return s;
    }

    /* [selector, dictKey, useInnerHTML] — textContent default keeps markup safe. */
    const BINDINGS = [
        ['.brand-tagline', 'brand.tagline', false],
        ['.sec-indicator', 'status.secure', false],
        ['.system-status > span:nth-child(3)', 'status.client', false],
        ['.audit-badge', 'audit.badge', true],
        ['.sidebar nav:nth-of-type(1) .nav-label', 'nav.modules', false],
        ['.sidebar nav:nth-of-type(2) .nav-label', 'nav.system', false],
        ['.drop-hero-header h2', 'drop.title', false],
        ['.drop-hero-header p', 'drop.sub', false],
        ['.drop-primary', 'drop.primary', false],
        ['.drop-secondary', 'drop.secondary', false],
        ['.local-processing-banner span:last-child', 'drop.banner', true],
        ['#view-inspect .view-header h2', 'inspect.title', false],
        ['#btn-new-image', 'btn.newImage', false],
        ['#btn-goto-clean', 'btn.gotoClean', false],
        ['#btn-inspect-report', 'btn.report', false],
        ['#btn-inspect-copy', 'btn.copy', false],
        ['#view-inspect .detail-row:nth-child(1) > span', 'file.filename', false],
        ['#view-inspect .detail-row:nth-child(2) > span', 'file.dimensions', false],
        ['#view-inspect .detail-row:nth-child(3) > span', 'file.security', false],
        ['#view-inspect .detail-row:nth-child(3) > strong', 'file.validated', false],
        ['.spec-panel .panel-section:nth-child(2) .section-title', 'risk.title', false],
        ['.spec-panel .panel-section:nth-child(3) .section-title', 'sources.title', false],
        ['#map-card .group-header span:first-child', 'map.header', false],
        ['#view-inspect .data-panel > .data-group:nth-child(2) .group-header', 'g.gps', false],
        ['#view-inspect .data-panel > .data-group:nth-child(3) .group-header', 'g.camera', false],
        ['#view-inspect .data-panel > .data-group:nth-child(4) .group-header', 'g.datetime', false],
        ['#view-inspect .data-panel > .data-group:nth-child(5) .group-header', 'g.software', false],
        ['#view-clean .view-header h2', 'clean.title', false],
        ['#view-clean .view-header .view-sub', 'clean.sub', false],
        ['#view-clean .control-list > .control-row:nth-child(1) .control-name', 'opt.gps.t', false],
        ['#view-clean .control-list > .control-row:nth-child(1) .control-desc', 'opt.gps.d', false],
        ['#view-clean .control-list > .control-row:nth-child(2) .control-name', 'opt.camera.t', false],
        ['#view-clean .control-list > .control-row:nth-child(2) .control-desc', 'opt.camera.d', false],
        ['#view-clean .control-list > .control-row:nth-child(3) .control-name', 'opt.datetime.t', false],
        ['#view-clean .control-list > .control-row:nth-child(3) .control-desc', 'opt.datetime.d', false],
        ['#view-clean .control-list > .control-row:nth-child(4) .control-name', 'opt.software.t', false],
        ['#view-clean .control-list > .control-row:nth-child(4) .control-desc', 'opt.software.d', false],
        ['#view-clean .control-list > .control-row:nth-child(5) .control-name', 'opt.desc.t', false],
        ['#view-clean .control-list > .control-row:nth-child(5) .control-desc', 'opt.desc.d', false],
        ['#btn-action-clean', 'btn.clean', false],
        ['#btn-action-purge', 'btn.purge', false],
        ['#btn-audit-clean', 'btn.audit', false],
        ['#btn-report-clean', 'btn.dlreport', false],
        ['#audit-result-clean .section-title', 'audit.title', false],
        ['#blur-title', 'bl.title', false],
        ['#blur-sub', 'bl.sub', false],
        ['#blur-precision-label', 'bl.precision', false],
        ['#blur-precision option[value="city"]', 'bl.opt.city', false],
        ['#blur-precision option[value="district"]', 'bl.opt.district', false],
        ['#blur-precision option[value="street"]', 'bl.opt.street', false],
        ['#btn-action-blur', 'btn.blur', false],
        ['#btn-audit-blur', 'btn.auditBlur', false],
        ['#share-title', 'sh.title', false],
        ['#share-sub', 'sh.sub', false],
        ['#share-note', 'sh.note', false],
        ['#batch-mode option[value="blur"]', 'batch.m.blur', false],
        ['#view-simulate .view-header h2', 'sim.title', false],
        ['#view-simulate .view-header .view-sub', 'sim.sub', false],
        ['#view-simulate .panel-box > .form-row:nth-child(1) > label', 'sim.profile', false],
        ['#sim-profile option[value="smartphone"]', 'sim.prof.smartphone', false],
        ['#sim-profile option[value="dslr"]', 'sim.prof.dslr', false],
        ['#sim-profile option[value="generic"]', 'sim.prof.generic', false],
        ['#view-simulate .panel-box > .form-grid:nth-child(2) .form-row:nth-child(1) > label', 'sim.make', false],
        ['#view-simulate .panel-box > .form-grid:nth-child(2) .form-row:nth-child(2) > label', 'sim.model', false],
        ['#view-simulate .panel-box > .form-row:nth-child(3) .row-between label', 'sim.coords', false],
        ['#btn-sim-random-gps', 'sim.random', false],
        ['.sim-geo-label', 'sim.selected', false],
        ['#view-simulate .panel-box > .form-grid:nth-child(4) .form-row:nth-child(1) > label', 'sim.lat', false],
        ['#view-simulate .panel-box > .form-grid:nth-child(4) .form-row:nth-child(2) > label', 'sim.lng', false],
        ['#btn-action-simulate', 'btn.simulate', false],
        ['#btn-audit-sim', 'btn.auditSpoof', false],
        ['#audit-result-sim .section-title', 'audit.simTitle', false],
        ['#view-batch .view-header h2', 'batch.title', false],
        ['#view-batch .view-header .view-sub', 'batch.sub', false],
        ['#view-batch .panel-box > .form-row:nth-child(1) > label', 'batch.mode', false],
        ['#batch-mode option[value="purge"]', 'batch.m.purge', false],
        ['#batch-mode option[value="selective"]', 'batch.m.selective', false],
        ['#batch-mode option[value="spoof"]', 'batch.m.spoof', false],
        ['#view-batch .panel-box > .form-row:nth-child(2) > label', 'batch.files', false],
        ['#btn-action-batch', 'btn.batch', false],
        ['#view-edit .view-header h2', 'edit.title', false],
        ['#view-edit .view-header .view-sub', 'edit.sub', false],
        ['#view-edit .panel-box > .form-grid:nth-child(1) .form-row:nth-child(1) > label', 'edit.make', false],
        ['#view-edit .panel-box > .form-grid:nth-child(1) .form-row:nth-child(2) > label', 'edit.model', false],
        ['#view-edit .panel-box > .form-row:nth-child(2) > label', 'edit.software', false],
        ['#view-edit .panel-box > .form-grid:nth-child(3) .form-row:nth-child(1) > label', 'edit.artist', false],
        ['#view-edit .panel-box > .form-grid:nth-child(3) .form-row:nth-child(2) > label', 'edit.copyright', false],
        ['#view-edit .panel-box > .form-row:nth-child(4) > label', 'edit.desc', false],
        ['#view-edit .panel-box > .form-row:nth-child(5) > label', 'edit.datetime', false],
        ['#view-edit .control-name', 'edit.delgps', false],
        ['#btn-action-edit', 'btn.apply', false],
        ['#btn-audit-edit', 'btn.auditEdit', false],
        ['#audit-result-edit .section-title', 'audit.editTitle', false],
        ['#view-history .view-header h2', 'hist.title', false],
        ['#view-history .panel-box > .view-sub', 'hist.sub', false],
        ['#btn-history-csv', 'btn.csv', false],
        ['#btn-history-print', 'btn.print', false],
        ['#view-history thead th:nth-child(1)', 'th.file', false],
        ['#view-history thead th:nth-child(2)', 'th.action', false],
        ['#view-history thead th:nth-child(3)', 'th.time', false],
        ['#view-history thead th:nth-child(4)', 'th.status', false],
        ['#history-tbody td[colspan]', 'hist.empty', false],
        ['#view-settings .view-header h2', 'set.title', false],
        ['#view-settings .view-header .view-sub', 'set.sub', false],
        ['#view-settings .panel-box > .control-row:nth-child(1) .control-name', 'set.quality.t', false],
        ['#view-settings .panel-box > .control-row:nth-child(1) .control-desc', 'set.quality.d', false],
        ['#setting-quality option[value="95"]', 'q.high', false],
        ['#setting-quality option[value="100"]', 'q.max', false],
        ['#setting-quality option[value="85"]', 'q.std', false],
        ['#view-settings .panel-box > .control-row:nth-child(2) .control-name', 'set.scrub.t', false],
        ['#view-settings .panel-box > .control-row:nth-child(2) .control-desc', 'set.scrub.d', false],
        ['#view-settings .panel-box > .control-row:nth-child(3) .control-name', 'set.geocode.t', false],
        ['#view-settings .panel-box > .control-row:nth-child(3) .control-desc', 'set.geocode.d', false],
        ['#sc-title', 'sc.title', false],
        ['#sc-sub', 'sc.sub', false],
        ['#sc-row-modules', 'sc.modules', false],
        ['#sc-row-upload', 'sc.upload', false],
        ['#sc-row-back', 'sc.back', false]
    ];

    /* Nav buttons keep their number key span; only the label is localized. */
    const NAV_KEYS = {
        'view-inspect': 'nav.inspect',
        'view-clean': 'nav.clean',
        'view-simulate': 'nav.simulate',
        'view-batch': 'nav.batch',
        'view-edit': 'nav.edit',
        'view-history': 'nav.history',
        'view-settings': 'nav.settings'
    };

    function applyStatic(root) {
        if (typeof document === 'undefined') return 0;
        const scope = root || document;
        let applied = 0;
        BINDINGS.forEach(([sel, key, html]) => {
            let nodes = [];
            try { nodes = scope.querySelectorAll(sel); } catch (e) { return; }
            nodes.forEach(el => {
                if (html) el.innerHTML = t(key);
                else el.textContent = t(key);
                applied += 1;
            });
        });
        Object.keys(NAV_KEYS).forEach(target => {
            const btn = scope.querySelector(`.nav-item[data-target="${target}"]`);
            if (!btn) return;
            const num = btn.querySelector('.nav-key');
            const numHtml = num ? num.outerHTML + ' ' : '';
            btn.innerHTML = numHtml + t(NAV_KEYS[target]);
            applied += 1;
        });
        return applied;
    }

    global.I18N = {
        STR, BACKEND_TR, BINDINGS, NAV_KEYS,
        t, tb, getLang, setLang, applyStatic
    };
})(typeof window !== 'undefined' ? window : globalThis);
