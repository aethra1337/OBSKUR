document.addEventListener('DOMContentLoaded', () => {
    // 1. NAVIGATION AND MODULE SWITCHING
    const navItems = document.querySelectorAll('.nav-item');
    const viewPanels = document.querySelectorAll('.workspace-view');
    const dropzoneSection = document.getElementById('dropzone-section');

    function showDropzone() {
        viewPanels.forEach(panel => panel.classList.add('hidden'));
        if (dropzoneSection) dropzoneSection.classList.remove('hidden');
        navItems.forEach(item => item.classList.remove('active'));
    }

    function setModulesLocked(locked) {
        navItems.forEach(item => {
            if (item.hasAttribute('data-requires-file')) {
                item.classList.toggle('locked', locked);
                // NOTE: deliberately NOT using `disabled` here. A disabled
                // button swallows clicks silently, leaving the user with a
                // dead UI and no explanation. Keeping it clickable lets
                // switchView() explain via alert ("upload an image first").
                item.setAttribute('aria-disabled', locked ? 'true' : 'false');
            }
        });
    }

    function switchView(targetId) {
        const targetBtn = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (targetBtn && targetBtn.hasAttribute('data-requires-file') && !currentFile) {
            alert(I18N.t('a.upload'));
            showDropzone();
            return;
        }
        // A successful module switch always leaves the dropzone behind,
        // otherwise dropzone + target view stay stacked on top of each other.
        if (dropzoneSection) dropzoneSection.classList.add('hidden');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === targetId);
        });

        viewPanels.forEach(panel => {
            if (panel.id === targetId) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        if (targetId === 'view-simulate') {
            setTimeout(() => initSimulateMap(), 150);
        }
        // MapLibre canvases go blank when their container was display:none.
        // Resize on return so 01 renders correctly after visiting 04 (or others).
        if (targetId === 'view-inspect') {
            setTimeout(() => { try { if (inspectMap) inspectMap.resize(); } catch (e) {} }, 100);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.target));
    });

    // File-gated modules start locked; unlocked on first upload.
    setModulesLocked(true);

    // Build stamp: proves which JS bundle the browser actually runs.
    try {
        const vt = document.querySelector('.version-tag');
        if (vt && !vt.dataset.jsStamp) { vt.dataset.jsStamp = '1'; vt.textContent += ' · js9'; }
    } catch (e) {}

    // i18n init: apply saved language to all static strings.
    const langToggle = document.getElementById('lang-toggle');
    I18N.setLang(I18N.getLang());
    I18N.applyStatic();
    function paintLangToggle() {
        if (!langToggle) return;
        const cur = I18N.getLang();
        langToggle.dataset.current = cur;
        langToggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.lang === cur));
    }
    function applyLanguage(lang) {
        const ws = document.querySelector('.workspace');
        const run = () => {
            I18N.setLang(lang);
            paintLangToggle();
            I18N.applyStatic();
            refreshBatchList();
            renderHistory();
            if (currentMetadata) renderInspectionView(currentMetadata);
            Object.keys(lastAudits).forEach(boxId => {
                const entry = lastAudits[boxId];
                if (entry) renderAudit(boxId, entry.bodyId, entry.data);
            });
            if (ws) ws.classList.remove('lang-fade');
        };
        if (ws) { ws.classList.add('lang-fade'); setTimeout(run, 160); }
        else run();
    }
    paintLangToggle();
    if (langToggle) langToggle.querySelectorAll('button').forEach(b =>
        b.addEventListener('click', () => { if (I18N.getLang() !== b.dataset.lang) applyLanguage(b.dataset.lang); }));

    // 2. DRAG / DROP AND FILE PICKER
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    let currentFile = null;
    let currentMetadata = null;
    let sessionLogs = [];
    let previewImgUrl = null;
    const lastAudits = {};

    let inspectMap = null;
    let inspectMarker = null;

    let simMap = null;
    let simMarker = null;

    // 3. HELPERS AND RENDER FUNCTIONS
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"'`=\/]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
            "'": '&#39;', '`': '&#96;', '=': '&#61;', '/': '&#47;'
        }[c]));
    }

    const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

    function makeReticleEl() {
        const el = document.createElement('div');
        el.className = 'obskur-reticle';
        el.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="7" fill="rgba(4,15,30,0.6)" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="13" cy="13" r="1.6" fill="#FFFFFF"/><path d="M13 0v5M13 21v5M0 13h5M21 13h5" stroke="#FFFFFF" stroke-width="1.5"/></svg>';
        return el;
    }

    const pinSvg = '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1a4 4 0 0 1 4 4c0 3-4 6.5-4 6.5S2 8 2 5a4 4 0 0 1 4-4z" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="5" r="1.4" fill="currentColor"/></svg>';

    function renderMetaTable(tableId, dataObj) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        tbody.textContent = '';
        if (!dataObj || Object.keys(dataObj).length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 2;
            td.style.color = 'var(--text-dark)';
            td.textContent = I18N.t('table.empty');
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        for (const [k, v] of Object.entries(dataObj)) {
            const tr = document.createElement('tr');
            const tdK = document.createElement('td');
            tdK.textContent = I18N.tb(k);
            const tdV = document.createElement('td');
            tdV.textContent = String(v);
            tr.appendChild(tdK);
            tr.appendChild(tdV);
            tbody.appendChild(tr);
        }
    }

    function renderInspectMap(lat, lng) {
        setTimeout(() => {
            if (inspectMap) inspectMap.remove();
            inspectMap = new maplibregl.Map({
                container: 'inspect-map',
                style: MAP_STYLE,
                center: [lng, lat],
                zoom: 13,
                attributionControl: { compact: true }
            });
            inspectMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
            inspectMarker = new maplibregl.Marker({ element: makeReticleEl() }).setLngLat([lng, lat]).addTo(inspectMap);
            new maplibregl.Popup({ offset: 14 }).setLngLat([lng, lat]).setHTML(`LAT: ${escapeHtml(lat)}<br>LNG: ${escapeHtml(lng)}`).addTo(inspectMap);
            inspectMap.resize();
        }, 100);
    }

    function isGeocodeEnabled() {
        try { return localStorage.getItem('obskur-geocode') !== '0'; } catch (e) { return true; }
    }

    function fetchReverseGeocode(lat, lng, targetElementId, markerObj) {
        const geoText = document.getElementById(targetElementId);
        if (!isGeocodeEnabled()) {
            if (geoText) geoText.textContent = `${lat}, ${lng}`;
            return;
        }
        if (geoText) geoText.textContent = I18N.t('geo.resolving');
        const uiLang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'en';

        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=${encodeURIComponent(uiLang)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.address) {
                const address = data.address;
                const city = address.city || address.town || address.state || address.province || "Unknown City";
                const country = address.country || "Unknown Country";
                if (geoText) geoText.textContent = `${city}, ${country}`;
                if (markerObj) {
                    const pop = new maplibregl.Popup({ offset: 14 });
                    pop.setHTML(`<b>${pinSvg} ${escapeHtml(city)}, ${escapeHtml(country)}</b><br>LAT: ${escapeHtml(lat)}<br>LNG: ${escapeHtml(lng)}`);
                    markerObj.setPopup(pop);
                    markerObj.togglePopup();
                }
            } else {
                if (geoText) geoText.textContent = `${lat}, ${lng}`;
            }
        })
        .catch(() => { if (geoText) geoText.textContent = `${lat}, ${lng}`; });
    }

    function renderInspectionView(data) {
        document.getElementById('meta-filename').innerText = data.filename;
        document.getElementById('meta-specs').innerText = `${data.dimensions} · ${data.size_kb} KB`;

        const score = data.privacy_analysis.score;
        document.getElementById('score-val').innerText = score;

        const badge = document.getElementById('risk-badge');
        const level = (data.privacy_analysis.risk_level || "low").toLowerCase();
        badge.innerText = I18N.tb(data.privacy_analysis.risk_label) || "SAFE";
        badge.className = `risk-tag badge-${level}`;

        document.getElementById('risk-desc').innerText = (data.privacy_analysis.recommendations || []).map(r => I18N.tb(r)).join(" ");

        const sourcesList = document.getElementById('sources-list');
        if (sourcesList) {
            sourcesList.textContent = '';
            if (data.metadata.sources) {
                for (const [source, found] of Object.entries(data.metadata.sources)) {
                    const k = document.createElement('div');
                    k.textContent = String(source).toUpperCase();
                    const v = document.createElement('div');
                    v.style.textAlign = 'right';
                    v.style.color = found ? 'var(--color-safe)' : 'var(--text-dark)';
                    v.textContent = found ? I18N.t('src.present') : I18N.t('src.none');
                    sourcesList.appendChild(k);
                    sourcesList.appendChild(v);
                }
            }
        }

        renderMetaTable('table-location', data.metadata.location);
        renderMetaTable('table-camera', data.metadata.camera);
        renderMetaTable('table-datetime', data.metadata.datetime);
        renderMetaTable('table-software', data.metadata.software);

        const mapCard = document.getElementById('map-card');
        const locationData = data.metadata.location;

        if (locationData && locationData.latitude && locationData.longitude) {
            mapCard.classList.remove('hidden');
            const lat = locationData.latitude;
            const lng = locationData.longitude;

            renderInspectMap(lat, lng);
            fetchReverseGeocode(lat, lng, 'geo-country-city', inspectMarker);
        } else {
            mapCard.classList.add('hidden');
        }
    }

    // 4. INSTANT PREVIEW AND FLASK INTEGRATION
    function handleFileSelect(file) {
        currentFile = file;
        setModulesLocked(false);

        // A. Activate the screen
        if (dropzoneSection) dropzoneSection.classList.add('hidden');
        switchView('view-inspect');

        // B. Paint the image INSTANTLY from local memory (no Flask wait).
        // HEIC exception: browsers cannot render it in <img>, so ask the
        // local engine for a converted JPEG preview instead.
        const previewImg = document.getElementById('inspect-preview');
        const isHeic = /\.hei[cf]$/i.test(file.name || '') || file.type === 'image/heic' || file.type === 'image/heif';
        if (previewImg) {
            if (previewImgUrl) {
                URL.revokeObjectURL(previewImgUrl);
                previewImgUrl = null;
            }
            if (isHeic) {
                previewImg.removeAttribute('src');
                previewImg.style.display = 'none';
                const prevForm = new FormData();
                prevForm.append('image', file);
                fetch('/api/preview', { method: 'POST', body: prevForm })
                    .then(async res => {
                        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || I18N.t('a.preview')); }
                        return res.blob();
                    })
                    .then(blob => {
                        previewImgUrl = URL.createObjectURL(blob);
                        previewImg.src = previewImgUrl;
                        previewImg.style.display = 'block';
                    })
                    .catch(err => alert(err.message));
            } else {
                previewImgUrl = URL.createObjectURL(file);
                previewImg.src = previewImgUrl;
                previewImg.style.display = 'block';
            }
        }

        // C. Flask backend request
        const formData = new FormData();
        formData.append('image', file);

        fetch('/api/inspect', { method: 'POST', body: formData })
        .then(async res => {
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || I18N.t('a.analysis'));
            }
            return res.json();
        })
        .then(data => {
            currentMetadata = data;
            renderInspectionView(data);
            logSessionEvent(file.name, "INSPECT", "COMPLETED");
        })
        .catch(err => alert(I18N.t('a.api') + err.message));
    }

    // 5. MAP SIMULATION PICKER
    function initSimulateMap() {
        const latInput = document.getElementById('sim-lat');
        const lngInput = document.getElementById('sim-lng');

        let initialLat = parseFloat(latInput.value) || 39.9334;
        let initialLng = parseFloat(lngInput.value) || 32.8597;

        if (simMap) {
            simMap.resize();
            return;
        }

        simMap = new maplibregl.Map({
            container: 'sim-map',
            style: MAP_STYLE,
            center: [initialLng, initialLat],
            zoom: 5,
            attributionControl: { compact: true }
        });
        simMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
        updateSimMarker(initialLat, initialLng);

        simMap.on('click', (e) => {
            const lat = Number(e.lngLat.lat.toFixed(6));
            const lng = Number(e.lngLat.lng.toFixed(6));
            latInput.value = lat;
            lngInput.value = lng;
            updateSimMarker(lat, lng);
        });

        [latInput, lngInput].forEach(inp => {
            inp.addEventListener('change', () => {
                const lat = parseFloat(latInput.value) || 0;
                const lng = parseFloat(lngInput.value) || 0;
                updateSimMarker(lat, lng);
                simMap.panTo([lng, lat]);
            });
        });
    }

    function updateSimMarker(lat, lng) {
        if (simMarker) simMarker.remove();
        simMarker = new maplibregl.Marker({ element: makeReticleEl() }).setLngLat([lng, lat]).addTo(simMap);
        fetchReverseGeocode(lat, lng, 'sim-geo-address', simMarker);
    }

    const btnRandomGps = document.getElementById('btn-sim-random-gps');
    if (btnRandomGps) {
        btnRandomGps.addEventListener('click', () => {
            const randomLat = Number(((Math.random() * 130) - 60).toFixed(6));
            const randomLng = Number(((Math.random() * 360) - 180).toFixed(6));
            document.getElementById('sim-lat').value = randomLat;
            document.getElementById('sim-lng').value = randomLng;
            if (simMap) {
                updateSimMarker(randomLat, randomLng);
                simMap.panTo([randomLng, randomLat]);
            }
        });
    }

    function downloadBlob(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // 6. SESSION AUDIT LOGGERS
    function renderHistory() {
        const tbody = document.getElementById('history-tbody');
        if (!tbody) return;
        tbody.textContent = '';
        if (!sessionLogs.length) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.style.color = 'var(--text-muted)';
            td.style.textAlign = 'center';
            td.textContent = I18N.t('hist.empty');
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        sessionLogs.forEach(log => {
            const tr = document.createElement('tr');
            ['fileName', 'actionType', 'timestamp'].forEach(key => {
                const td = document.createElement('td');
                td.className = 'mono';
                td.textContent = String(log[key] ?? '');
                tr.appendChild(td);
            });
            const tdS = document.createElement('td');
            tdS.className = 'mono text-safe';
            tdS.textContent = I18N.tb(log.status);
            tr.appendChild(tdS);
            tbody.appendChild(tr);
        });
    }

    function logSessionEvent(fileName, actionType, status) {
        const now = new Date().toLocaleTimeString();
        sessionLogs.unshift({ fileName, actionType, timestamp: now, status });
        renderHistory();
    }

    function qualityValue() {
        const q = document.getElementById('setting-quality');
        return q ? q.value : '95';
    }

    const geocodeToggle = document.getElementById('setting-geocode');
    if (geocodeToggle) {
        try { geocodeToggle.checked = localStorage.getItem('obskur-geocode') !== '0'; } catch (e) { geocodeToggle.checked = true; }
        geocodeToggle.addEventListener('change', () => {
            try { localStorage.setItem('obskur-geocode', geocodeToggle.checked ? '1' : '0'); } catch (e) {}
        });
    }

    function selectiveForm(action) {
        const fd = new FormData();
        fd.append('image', currentFile);
        fd.append('action', action);
        fd.append('quality', qualityValue());
        if (action === 'selective') {
            fd.append('remove_gps', document.getElementById('clean-gps').checked);
            fd.append('remove_camera', document.getElementById('clean-camera').checked);
            fd.append('remove_datetime', document.getElementById('clean-datetime').checked);
            fd.append('remove_software', document.getElementById('clean-software').checked);
            fd.append('remove_descriptions', document.getElementById('clean-desc').checked);
        }
        if (action === 'spoof') {
            fd.append('profile', document.getElementById('sim-profile').value);
            fd.append('fake_make', document.getElementById('sim-make').value);
            fd.append('fake_model', document.getElementById('sim-model').value);
            fd.append('lat', document.getElementById('sim-lat').value);
            fd.append('lng', document.getElementById('sim-lng').value);
        }
        if (action === 'blur') {
            fd.append('gps_precision', document.getElementById('blur-precision').value);
        }
        if (action === 'edit') {
            fd.append('edits', JSON.stringify(collectEdits()));
            fd.append('deletions', collectDeletions().join(','));
        }
        return fd;
    }

    function renderAudit(boxId, bodyId, data) {
        const box = document.getElementById(boxId);
        const body = document.getElementById(bodyId);
        if (!box || !body) return;
        const b = data.before.score.score, a = data.after.score.score;
        const removed = (data.diff && data.diff.removed_keys || []).join(', ') || I18N.t('audit.none');
        const added = (data.diff && data.diff.added_keys || []).join(', ') || I18N.t('audit.none');
        const certLine = (data.certificate && data.certificate.sha256_after)
            ? `\n${I18N.t('audit.cert')}: ${data.certificate.sha256_after.slice(0, 16)}…`
            : '';
        body.textContent =
            `${I18N.t('audit.action')}: ${data.action}\n${I18N.t('audit.before')}: ${b}/100 (${I18N.tb(data.before.score.risk_label)}) → ${I18N.t('audit.after')}: ${a}/100 (${I18N.tb(data.after.score.risk_label)})\n${I18N.t('audit.delta')}: ${data.score_delta >= 0 ? '+' : ''}${data.score_delta}\n− ${I18N.t('audit.removed')} (${data.diff.removed_count}): ${removed}\n+ ${I18N.t('audit.added')} (${data.diff.added_count}): ${added}\n${I18N.t('audit.size')}: ${data.size_before_kb} KB → ${data.size_after_kb} KB${certLine}`;
        box.classList.remove('hidden');
    }

    function runAudit(action, boxId, bodyId) {
        if (!currentFile) return alert(I18N.t('a.upload'));
        fetch('/api/process-and-audit', { method: 'POST', body: selectiveForm(action) })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Audit failed');
                return data;
            })
            .then(data => {
                lastAudits[boxId] = { bodyId, data };
                renderAudit(boxId, bodyId, data);
                logSessionEvent(currentFile.name, 'AUDIT_' + action.toUpperCase(), 'PREVIEWED');
            })
            .catch(err => alert(I18N.t('a.auditPfx') + err.message));
    }

    function collectEdits() {
        const get = id => (document.getElementById(id) || {}).value || '';
        return {
            make: get('edit-make'), model: get('edit-model'),
            software: get('edit-software'), artist: get('edit-artist'),
            copyright: get('edit-copyright'), imagedescription: get('edit-imagedescription'),
            datetimeoriginal: get('edit-datetimeoriginal'),
        };
    }
    function collectDeletions() {
        const del = [];
        if (document.getElementById('edit-del-gps')?.checked) del.push('gps');
        return del;
    }

    // 7. ACTION BUTTONS (FLASK ENDPOINTS)
    const gotoCleanBtn = document.getElementById('btn-goto-clean');
    if (gotoCleanBtn) gotoCleanBtn.addEventListener('click', () => switchView('view-clean'));

    const brandHome = document.getElementById('brand-home');
    if (brandHome) brandHome.addEventListener('click', () => {
        // Homepage reset (as if refreshed): full soft reset to the
        // initial state — clears file, preview, batch queue, audits and logs.
        if (previewImgUrl) { URL.revokeObjectURL(previewImgUrl); previewImgUrl = null; }
        const previewImg = document.getElementById('inspect-preview');
        if (previewImg) { previewImg.removeAttribute('src'); previewImg.style.display = 'none'; }
        currentFile = null;
        currentMetadata = null;
        if (fileInput) fileInput.value = '';
        const batchField = document.getElementById('batch-input');
        if (batchField) batchField.value = '';
        refreshBatchList();
        Object.keys(lastAudits).forEach(k => { delete lastAudits[k]; });
        ['audit-result-clean', 'audit-result-sim', 'audit-result-edit'].forEach(id => {
            const box = document.getElementById(id);
            if (box) box.classList.add('hidden');
        });
        sessionLogs = [];
        renderHistory();
        setModulesLocked(true);
        showDropzone();
        const ws = document.querySelector('.workspace');
        if (ws) ws.scrollTop = 0;
    });

    const btnNewImage = document.getElementById('btn-new-image');
    if (btnNewImage) btnNewImage.addEventListener('click', () => {
        if (previewImgUrl) { URL.revokeObjectURL(previewImgUrl); previewImgUrl = null; }
        const previewImg = document.getElementById('inspect-preview');
        if (previewImg) { previewImg.removeAttribute('src'); previewImg.style.display = 'none'; }
        currentFile = null;
        currentMetadata = null;
        if (fileInput) fileInput.value = '';
        setModulesLocked(true);
        showDropzone();
    });

    const btnAuditClean = document.getElementById('btn-audit-clean');
    if (btnAuditClean) btnAuditClean.addEventListener('click', () => runAudit('selective', 'audit-result-clean', 'audit-result-clean-body'));

    const btnReportClean = document.getElementById('btn-report-clean');
    if (btnReportClean) btnReportClean.addEventListener('click', () => {
        if (!currentFile) return alert(I18N.t('a.upload'));
        fetch('/api/report', { method: 'POST', body: selectiveForm('selective') })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Report failed');
                return data;
            })
            .then(data => {
                downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `report_${currentFile.name}.json`);
                logSessionEvent(currentFile.name, 'REPORT', 'DOWNLOADED');
            })
            .catch(err => alert(I18N.t('a.reportPfx') + err.message));
    });

    const btnAuditSim = document.getElementById('btn-audit-sim');
    if (btnAuditSim) btnAuditSim.addEventListener('click', () => runAudit('spoof', 'audit-result-sim', 'audit-result-sim-body'));

    const btnAuditEdit = document.getElementById('btn-audit-edit');
    if (btnAuditEdit) btnAuditEdit.addEventListener('click', () => runAudit('edit', 'audit-result-edit', 'audit-result-edit-body'));

    const btnBlur = document.getElementById('btn-action-blur');
    if (btnBlur) btnBlur.addEventListener('click', () => {
        if (!currentFile) return alert(I18N.t('a.upload'));
        const formData = selectiveForm('blur');
        fetch('/api/blur', { method: 'POST', body: formData })
            .then(async res => {
                if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Blur failed'); }
                return res.blob();
            })
            .then(blob => {
                downloadBlob(blob, `blurred_${currentFile.name}`);
                logSessionEvent(currentFile.name, 'GPS_BLUR', 'DOWNLOADED');
            })
            .catch(err => alert(I18N.t('a.auditPfx') + err.message));
    });

    const btnAuditBlur = document.getElementById('btn-audit-blur');
    if (btnAuditBlur) btnAuditBlur.addEventListener('click', () => runAudit('blur', 'audit-result-clean', 'audit-result-clean-body'));

    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentFile) return alert(I18N.t('a.upload'));
            const preset = btn.dataset.preset;
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('preset', preset);
            formData.append('quality', qualityValue());
            fetch('/api/share-preset', { method: 'POST', body: formData })
                .then(async res => {
                    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Preset failed'); }
                    return res.blob();
                })
                .then(blob => {
                    const stem = currentFile.name.replace(/\.[^.]+$/, '') || 'image';
                    downloadBlob(blob, `${preset}_${stem}.jpg`);
                    logSessionEvent(currentFile.name, 'SHARE_' + preset.toUpperCase(), 'DOWNLOADED');
                })
                .catch(err => alert(I18N.t('a.reportPfx') + err.message));
        });
    });

    // Keyboard shortcuts: 1-7 modules, Ctrl/Cmd+U upload, Esc back. Never while typing.
    const shortcutViews = ['view-inspect', 'view-clean', 'view-simulate', 'view-batch', 'view-edit', 'view-history', 'view-settings'];
    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            if (fileInput) fileInput.click();
            return;
        }
        if (e.key === 'Escape') { showDropzone(); return; }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 7) switchView(shortcutViews[n - 1]);
    });

    const btnInspectReport = document.getElementById('btn-inspect-report');
    if (btnInspectReport) btnInspectReport.addEventListener('click', () => {
        if (!currentMetadata) return alert(I18N.t('a.upload'));
        downloadBlob(new Blob([JSON.stringify(currentMetadata, null, 2)], { type: 'application/json' }), `inspect_${currentFile.name}.json`);
        logSessionEvent(currentFile.name, 'INSPECT_REPORT', 'DOWNLOADED');
    });

    const btnInspectCopy = document.getElementById('btn-inspect-copy');
    if (btnInspectCopy) btnInspectCopy.addEventListener('click', async () => {
        if (!currentMetadata) return alert(I18N.t('a.upload'));
        try {
            await navigator.clipboard.writeText(JSON.stringify(currentMetadata, null, 2));
            alert(I18N.t('a.copied'));
        } catch { alert(I18N.t('a.copyfail')); }
    });

    // Batch
    const batchInput = document.getElementById('batch-input');
    function refreshBatchList() {
        const list = document.getElementById('batch-list');
        if (!list) return;
        if (!batchInput || !batchInput.files.length) { list.textContent = I18N.t('batch.none'); return; }
        list.textContent = [...batchInput.files].map(f => `${f.name} (${(f.size/1024).toFixed(1)} KB)`).join('\n');
    }
    if (batchInput) batchInput.addEventListener('change', refreshBatchList);

    const btnBatch = document.getElementById('btn-action-batch');
    if (btnBatch) btnBatch.addEventListener('click', () => {
        if (!batchInput || !batchInput.files.length) return alert(I18N.t('a.batchMin'));
        const fd = new FormData();
        [...batchInput.files].slice(0, 20).forEach(f => fd.append('images', f));
        fd.append('action', document.getElementById('batch-mode').value);
        fd.append('quality', qualityValue());
        fd.append('gps_precision', document.getElementById('blur-precision').value);
        fd.append('remove_gps', document.getElementById('clean-gps').checked);
        fd.append('remove_camera', document.getElementById('clean-camera').checked);
        fd.append('remove_datetime', document.getElementById('clean-datetime').checked);
        fd.append('remove_software', document.getElementById('clean-software').checked);
        fd.append('remove_descriptions', document.getElementById('clean-desc').checked);
        fetch('/api/batch-process', { method: 'POST', body: fd })
            .then(async res => {
                if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Batch failed'); }
                return res.blob();
            })
            .then(blob => {
                downloadBlob(blob, 'obskur_batch.zip');
                logSessionEvent(`${batchInput.files.length} files`, 'BATCH', 'DOWNLOADED');
            })
            .catch(err => alert(I18N.t('a.batchPfx') + err.message));
    });

    // Tag editor apply
    const btnEdit = document.getElementById('btn-action-edit');
    if (btnEdit) btnEdit.addEventListener('click', () => {
        if (!currentFile) return alert(I18N.t('a.upload'));
        const fd = selectiveForm('edit');
        fetch('/api/edit-tags', { method: 'POST', body: fd })
            .then(async res => {
                if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Edit failed'); }
                return res.blob();
            })
            .then(blob => {
                const ext = (currentFile.name.split('.').pop() || 'jpg').toLowerCase();
                downloadBlob(blob, `edited_${currentFile.name}`);
                logSessionEvent(currentFile.name, 'TAG_EDIT', 'DOWNLOADED');
            })
            .catch(err => alert(I18N.t('a.editPfx') + err.message));
    });

    // History CSV + Print
    const btnCsv = document.getElementById('btn-history-csv');
    if (btnCsv) btnCsv.addEventListener('click', () => {
        if (!sessionLogs.length) return alert(I18N.t('a.noRecords'));
        const csvEscape = v => {
            let s = String(v ?? '');
            if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
            return '"' + s.replace(/"/g, '""') + '"';
        };
        const csv = 'file,action,timestamp,status\n' + sessionLogs.map(l => [l.fileName, l.actionType, l.timestamp, l.status].map(csvEscape).join(',')).join('\n');
        downloadBlob(new Blob([csv], { type: 'text/csv' }), 'obskur_audit.csv');
    });
    const btnPrint = document.getElementById('btn-history-print');
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    const btnClean = document.getElementById('btn-action-clean');
    if (btnClean) {
        btnClean.addEventListener('click', () => {
            if (!currentFile) return alert(I18N.t('a.upload'));
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('remove_gps', document.getElementById('clean-gps').checked);
            formData.append('remove_camera', document.getElementById('clean-camera').checked);
            formData.append('remove_datetime', document.getElementById('clean-datetime').checked);
            formData.append('remove_software', document.getElementById('clean-software').checked);
            formData.append('remove_descriptions', document.getElementById('clean-desc').checked);
            formData.append('quality', qualityValue());

            fetch('/api/selective-clean', { method: 'POST', body: formData })
            .then(res => res.blob())
            .then(blob => {
                downloadBlob(blob, `custom_${currentFile.name}`);
                logSessionEvent(currentFile.name, "SELECTIVE_CLEAN", "DOWNLOADED");
            });
        });
    }

    const btnPurge = document.getElementById('btn-action-purge');
    if (btnPurge) {
        btnPurge.addEventListener('click', () => {
            if (!currentFile) return alert(I18N.t('a.upload'));
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('quality', qualityValue());

            fetch('/api/purge', { method: 'POST', body: formData })
            .then(res => res.blob())
            .then(blob => {
                downloadBlob(blob, `purged_${currentFile.name}`);
                logSessionEvent(currentFile.name, "FULL_PURGE", "DOWNLOADED");
            });
        });
    }

    const btnSimulate = document.getElementById('btn-action-simulate');
    if (btnSimulate) {
        btnSimulate.addEventListener('click', () => {
            if (!currentFile) return alert(I18N.t('a.upload'));
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('profile', document.getElementById('sim-profile').value);
            formData.append('fake_make', document.getElementById('sim-make').value);
            formData.append('fake_model', document.getElementById('sim-model').value);
            formData.append('lat', document.getElementById('sim-lat').value);
            formData.append('lng', document.getElementById('sim-lng').value);
            formData.append('quality', qualityValue());

            fetch('/api/spoof', { method: 'POST', body: formData })
            .then(res => res.blob())
            .then(blob => {
                downloadBlob(blob, `simulated_${currentFile.name}`);
                logSessionEvent(currentFile.name, "SPOOF_INJECT", "DOWNLOADED");
            });
        });
    }
});