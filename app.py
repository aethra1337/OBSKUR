import io
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from flask import Flask, render_template, request, jsonify, send_file
from PIL import Image

from core.exif_reader import ExifReader
from core.privacy_scorer import PrivacyScorer
from core.exif_cleaner import ExifCleaner
from core.metadata_simulator import MetadataSimulator
from core.security_engine import SecurityEngine
from core.batch_processor import BatchProcessor

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

Image.MAX_IMAGE_PIXELS = 50_000_000  # decompression-bomb guard (~50MP)
TOOL_VERSION = "v4.0.0-obskur"

MIMETYPE_BY_FORMAT = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
EXT_BY_FORMAT = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}


def _safe_filename(name: str, fallback: str = "image.jpg") -> str:
    base = os.path.basename(name or "") or fallback
    base = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return (base or fallback)[:120]


def _with_correct_ext(filename: str, target_format: str) -> str:
    stem = os.path.splitext(_safe_filename(filename))[0] or "image"
    return f"{stem}{EXT_BY_FORMAT.get(target_format, '.jpg')}"


def _quality_from_request(form, default: int = 95) -> int:
    try:
        q = int(form.get("quality", default))
    except (TypeError, ValueError):
        return default
    return max(10, min(100, q))


def _image_options_from_request(form):
    return {
        "remove_gps": form.get("remove_gps", "true").lower() == "true",
        "remove_camera": form.get("remove_camera", "false").lower() == "true",
        "remove_datetime": form.get("remove_datetime", "true").lower() == "true",
        "remove_software": form.get("remove_software", "true").lower() == "true",
        "remove_descriptions": form.get("remove_descriptions", "true").lower() == "true"
    }


def _simulation_config_from_request(form):
    try:
        lat = float(form.get("lat", 39.9334))
    except (TypeError, ValueError):
        raise ValueError("Invalid latitude.")
    try:
        lng = float(form.get("lng", 32.8597))
    except (TypeError, ValueError):
        raise ValueError("Invalid longitude.")
    if not (-90.0 <= lat <= 90.0):
        raise ValueError("Latitude out of range (-90..90).")
    if not (-180.0 <= lng <= 180.0):
        raise ValueError("Longitude out of range (-180..180).")
    return {
        "profile": form.get("profile", "generic"),
        "make": (form.get("fake_make") or "")[:64],
        "model": (form.get("fake_model") or "")[:64],
        "software": (form.get("fake_software") or "")[:64],
        "lat": lat,
        "lng": lng,
    }


def _load_image(file_storage):
    """Validates, opens, and pixel-loads an upload.

    Returns (img, raw_bytes). Raises ValueError on abuse or corrupt data.
    """
    file_storage.stream.seek(0)
    fmt = SecurityEngine.sniff_format(file_storage.stream)
    if fmt is None:
        raise ValueError("Invalid or corrupted image format (Magic Byte Mismatch).")
    if fmt == 'heic' and not SecurityEngine.heif_available():
        raise ValueError("HEIC detected but HEIC support (pillow-heif) is not installed.")
    file_storage.stream.seek(0)
    try:
        raw = file_storage.read()
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Image.DecompressionBombError:
        raise ValueError("Image exceeds the 50MP safety limit.")
    except Exception:
        raise ValueError("Unsupported or corrupted image.")
    return img, raw


def _diff_metadata(before: dict, after: dict) -> dict:
    """Flat before/after diff: removed + added keys, so the UI can render deltas easily."""
    removed, added = [], []
    for section in ("camera", "settings", "datetime", "location", "software"):
        b = (before or {}).get(section, {}) or {}
        a = (after or {}).get(section, {}) or {}
        for key in b:
            if key not in a:
                removed.append(f"{section}.{key}")
        for key in a:
            if key not in b:
                added.append(f"{section}.{key}")
    return {
        "removed_keys": sorted(removed),
        "removed_count": len(removed),
        "added_keys": sorted(added),
        "added_count": len(added),
    }


def _certificate(filename, action, quality, before_bytes: bytes, after_bytes: bytes) -> dict:
    """Destruction certificate: hash-chained proof of what was processed."""
    return {
        "tool": "OBSKUR",
        "version": TOOL_VERSION,
        "filename": _safe_filename(filename),
        "action": action,
        "quality": quality,
        "sha256_before": hashlib.sha256(before_bytes).hexdigest(),
        "sha256_after": hashlib.sha256(after_bytes).hexdigest(),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    }


def _process_image_request(file, action, form, quality: int = 95):
    if not file:
        raise ValueError("Invalid image payload.")

    img, _raw = _load_image(file)
    target_format = ExifCleaner._target_format(img, None)

    if action == 'selective':
        out_io = ExifCleaner.selective_clean(img, _image_options_from_request(form), quality=quality)
    elif action == 'spoof':
        out_io = MetadataSimulator.apply_simulation(img, _simulation_config_from_request(form), quality=quality)
    elif action == 'blur':
        precision = form.get("gps_precision", form.get("precision", "district"))
        out_io = ExifCleaner.blur_gps(img, precision=precision, quality=quality)
    elif action == 'edit':
        try:
            edits = json.loads(form.get("edits", "{}") or "{}")
        except json.JSONDecodeError:
            raise ValueError("Invalid edits JSON.")
        deletions = [d for d in (form.get("deletions", "") or "").split(",") if d.strip()]
        out_io = ExifCleaner.apply_edits(img, edits, deletions, quality=quality)
    else:
        out_io = ExifCleaner.purge_all(img, quality=quality)

    return out_io, target_format


@app.after_request
def apply_security_headers(response):
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://unpkg.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https://unpkg.com https://tiles.openfreemap.org; "
        "connect-src 'self' https://nominatim.openstreetmap.org https://tiles.openfreemap.org; "
        "worker-src 'self' blob:; "
        "object-src 'none'; base-uri 'self'; form-action 'self'; "
        "frame-ancestors 'none';"
    )
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/inspect', methods=['POST'])
def inspect_file():
    file = request.files.get('image')
    if not file or not SecurityEngine.validate_file_integrity(file.stream):
        return jsonify({"error": "Invalid or corrupted image format (Magic Byte Mismatch)."}), 400

    try:
        img, raw = _load_image(file)
        size_bytes = len(raw)
        metadata = ExifReader.extract_all_metadata(img)
        privacy_analysis = PrivacyScorer.calculate_score(metadata)

        return jsonify({
            "filename": _safe_filename(file.filename),
            "format": img.format or "JPEG",
            "dimensions": f"{img.width} × {img.height}",
            "size_kb": round(size_bytes / 1024, 1),
            "metadata": metadata,
            "privacy_analysis": privacy_analysis,
            "editable_tags": sorted(ExifCleaner.EDITABLE_TAGS.keys()),
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Failed to inspect image."}), 500

@app.route('/api/process-and-audit', methods=['POST'])
def process_and_audit():
    file = request.files.get('image')
    action = request.form.get('action', 'purge')
    quality = _quality_from_request(request.form)

    if not file:
        return jsonify({"error": "Invalid image payload."}), 400

    try:
        img, raw_before = _load_image(file)
        size_before = len(raw_before)

        before_meta = ExifReader.extract_all_metadata(img)
        before_score = PrivacyScorer.calculate_score(before_meta)

        if action == 'selective':
            out_io = ExifCleaner.selective_clean(img, _image_options_from_request(request.form), quality=quality)
        elif action == 'spoof':
            out_io = MetadataSimulator.apply_simulation(img, _simulation_config_from_request(request.form), quality=quality)
        elif action == 'blur':
            precision = request.form.get("gps_precision", request.form.get("precision", "district"))
            out_io = ExifCleaner.blur_gps(img, precision=precision, quality=quality)
        elif action == 'edit':
            try:
                edits = json.loads(request.form.get("edits", "{}") or "{}")
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid edits JSON."}), 400
            deletions = [d for d in (request.form.get("deletions", "") or "").split(",") if d.strip()]
            out_io = ExifCleaner.apply_edits(img, edits, deletions, quality=quality)
        else:
            out_io = ExifCleaner.purge_all(img, quality=quality)

        raw_after = out_io.getvalue()
        size_after = len(raw_after)
        out_io.seek(0)
        processed_img = Image.open(io.BytesIO(raw_after))
        processed_img.load()
        after_meta = ExifReader.extract_all_metadata(processed_img)
        after_score = PrivacyScorer.calculate_score(after_meta)

        out_io.seek(0)
        SecurityEngine.secure_memory_wipe()

        diff = _diff_metadata(before_meta, after_meta)

        return jsonify({
            "filename": _safe_filename(file.filename),
            "action": action,
            "quality": quality,
            "size_before_kb": round(size_before / 1024, 1),
            "size_after_kb": round(size_after / 1024, 1),
            "before": {
                "metadata": before_meta,
                "score": before_score
            },
            "after": {
                "metadata": after_meta,
                "score": after_score
            },
            "diff": diff,
            "score_delta": (after_score.get("score", 0) - before_score.get("score", 0)),
            "certificate": _certificate(file.filename, action, quality, raw_before, raw_after),
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Processing failed."}), 500


@app.route('/api/report', methods=['POST'])
def build_report():
    """Downloadable JSON forensic report of the audit result."""
    file = request.files.get('image')
    action = request.form.get('action', 'purge')
    quality = _quality_from_request(request.form)
    if not file:
        return jsonify({"error": "Invalid image payload."}), 400
    try:
        img, raw_before = _load_image(file)
        before_meta = ExifReader.extract_all_metadata(img)
        before_score = PrivacyScorer.calculate_score(before_meta)

        if action == 'selective':
            out_io = ExifCleaner.selective_clean(img, _image_options_from_request(request.form), quality=quality)
        elif action == 'spoof':
            out_io = MetadataSimulator.apply_simulation(img, _simulation_config_from_request(request.form), quality=quality)
        elif action == 'blur':
            precision = request.form.get("gps_precision", request.form.get("precision", "district"))
            out_io = ExifCleaner.blur_gps(img, precision=precision, quality=quality)
        else:
            out_io = ExifCleaner.purge_all(img, quality=quality)
        raw_after = out_io.getvalue()
        out_io.seek(0)
        processed_img = Image.open(io.BytesIO(raw_after))
        processed_img.load()
        after_meta = ExifReader.extract_all_metadata(processed_img)
        after_score = PrivacyScorer.calculate_score(after_meta)
        diff = _diff_metadata(before_meta, after_meta)

        report = {
            "tool": "OBSKUR",
            "version": TOOL_VERSION,
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "filename": _safe_filename(file.filename),
            "action": action,
            "quality": quality,
            "before": {"metadata": before_meta, "score": before_score},
            "after": {"metadata": after_meta, "score": after_score},
            "diff": diff,
            "score_delta": (after_score.get("score", 0) - before_score.get("score", 0)),
            "certificate": _certificate(file.filename, action, quality, raw_before, raw_after),
        }
        out_io.seek(0)
        SecurityEngine.secure_memory_wipe()
        return jsonify(report)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Report failed."}), 500


@app.route('/api/batch-process', methods=['POST'])
def batch_process():
    """Batch: many images -> one ZIP."""
    files = request.files.getlist('images')
    if not files:
        # also accept the singular field name
        single = request.files.get('image')
        files = [single] if single else []
    if not files:
        return jsonify({"error": "No images provided. Use 'images' field."}), 400
    if len(files) > 20:
        return jsonify({"error": "Too many files (max 20)."}), 400

    mode = request.form.get('action', request.form.get('mode', 'purge'))
    if mode not in ("purge", "selective", "blur", "spoof"):
        return jsonify({"error": "Unknown batch mode."}), 400
    quality = _quality_from_request(request.form)
    options = _image_options_from_request(request.form)
    options["mode"] = mode
    options["profile"] = request.form.get("profile", "generic")
    options["precision"] = request.form.get("gps_precision", request.form.get("precision", "district"))
    try:
        lat = float(request.form.get("lat", 39.9334))
        lng = float(request.form.get("lng", 32.8597))
        if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
            options["lat"] = lat
            options["lng"] = lng
    except (TypeError, ValueError):
        pass

    try:
        zip_io = BatchProcessor.process_images_to_zip(files, options, quality=quality)
        return send_file(
            zip_io,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f"obskur_batch_{mode}.zip"
        )
    except Exception as e:
        return jsonify({"error": "Batch failed."}), 500


def _send_processed(out_io, target_format, filename):
    return send_file(
        out_io,
        mimetype=MIMETYPE_BY_FORMAT.get(target_format, 'image/jpeg'),
        as_attachment=True,
        download_name=_with_correct_ext(filename, target_format)
    )


@app.route('/api/selective-clean', methods=['POST'])
def selective_clean_route():
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid file."}), 400

    try:
        out_io, target_format = _process_image_request(file, 'selective', request.form, _quality_from_request(request.form))
        return _send_processed(out_io, target_format, f"custom_{file.filename}")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Export failed."}), 500


@app.route('/api/purge', methods=['POST'])
def purge_route():
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid file."}), 400

    try:
        out_io, target_format = _process_image_request(file, 'purge', request.form, _quality_from_request(request.form))
        return _send_processed(out_io, target_format, f"purged_{file.filename}")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Export failed."}), 500


@app.route('/api/spoof', methods=['POST'])
def spoof_route():
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid file."}), 400

    try:
        out_io, target_format = _process_image_request(file, 'spoof', request.form, _quality_from_request(request.form))
        return _send_processed(out_io, target_format, f"simulated_{file.filename}")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Export failed."}), 500


@app.route('/api/edit-tags', methods=['POST'])
def edit_tags_route():
    """Single-tag EXIF editing + download."""
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid file."}), 400
    try:
        out_io, target_format = _process_image_request(file, 'edit', request.form, _quality_from_request(request.form))
        return _send_processed(out_io, target_format, f"edited_{file.filename}")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Export failed."}), 500


@app.route('/api/preview', methods=['POST'])
def preview_route():
    """Downscaled JPEG preview for formats browsers cannot render (HEIC)."""
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid file."}), 400
    try:
        img, _raw = _load_image(file)
        fresh = ExifCleaner._fresh_pixels(img, "JPEG")
        fitted = ExifCleaner._fit_within(fresh, 1600)
        out_io = io.BytesIO()
        fitted.save(out_io, format="JPEG", quality=80)
        out_io.seek(0)
        return send_file(out_io, mimetype='image/jpeg')
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Preview failed."}), 500


@app.route('/api/blur', methods=['POST'])
def blur_route():
    """GPS blur + download."""
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "Invalid file."}), 400
    try:
        out_io, target_format = _process_image_request(file, 'blur', request.form, _quality_from_request(request.form))
        return _send_processed(out_io, target_format, f"blurred_{file.filename}")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Export failed."}), 500


@app.route('/api/share-preset', methods=['POST'])
def share_preset_route():
    """Share preset (purge + resize + JPEG) + download."""
    file = request.files.get('image')
    preset = request.form.get('preset', 'instagram')
    if not file:
        return jsonify({"error": "Invalid file."}), 400
    if preset not in ExifCleaner.SHARE_PRESETS:
        return jsonify({"error": "Unknown preset."}), 400
    try:
        img, _raw = _load_image(file)
        out_io = ExifCleaner.share_preset(img, preset)
        stem = os.path.splitext(_safe_filename(file.filename))[0] or "image"
        return send_file(
            out_io,
            mimetype='image/jpeg',
            as_attachment=True,
            download_name=f"{preset}_{stem}.jpg"
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        return jsonify({"error": "Export failed."}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
