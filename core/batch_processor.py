import io
import os
import zipfile
from PIL import Image
from .exif_cleaner import ExifCleaner
from .security_engine import SecurityEngine


class BatchProcessor:
    """
    Engine that safely processes multiple images in RAM and builds a ZIP.
    Each file is magic-byte verified; the original format is preserved.
    """

    EXT_BY_FORMAT = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}

    @classmethod
    def _safe_stem(cls, filename: str, fallback: str) -> str:
        base = os.path.basename(filename or "") or fallback
        stem = os.path.splitext(base)[0] or fallback
        keep = "".join(c if (c.isalnum() or c in ("-", "_")) else "_" for c in stem)
        return (keep.strip("_") or fallback)[:60]

    @classmethod
    def process_images_to_zip(cls, files: list, options: dict, quality: int = 95) -> io.BytesIO:
        zip_buffer = io.BytesIO()
        mode = (options or {}).get("mode", "purge")
        if mode not in ("purge", "selective", "blur", "spoof"):
            mode = "purge"

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for idx, file_item in enumerate(files):
                try:
                    stream = getattr(file_item, 'stream', file_item)
                    stream.seek(0)
                    if not SecurityEngine.validate_file_integrity(stream):
                        continue
                    if SecurityEngine.sniff_format(stream) == 'heic' and not SecurityEngine.heif_available():
                        continue
                    stream.seek(0)
                    try:
                        img = Image.open(stream)
                        img.load()
                    except Image.DecompressionBombError:
                        continue
                    except Exception:
                        continue

                    if mode == "purge":
                        processed_io = ExifCleaner.purge_all(img, quality=quality)
                    elif mode == "blur":
                        processed_io = ExifCleaner.blur_gps(
                            img,
                            precision=(options or {}).get("precision", "district"),
                            quality=quality,
                        )
                    elif mode == "spoof":
                        from .metadata_simulator import MetadataSimulator
                        processed_io = MetadataSimulator.apply_simulation(
                            img,
                            {
                                "profile": (options or {}).get("profile", "generic"),
                                "lat": (options or {}).get("lat", 39.9334),
                                "lng": (options or {}).get("lng", 32.8597),
                            },
                            quality=quality,
                        )
                    else:
                        processed_io = ExifCleaner.selective_clean(img, options=options or {}, quality=quality)

                    target_fmt = ExifCleaner._target_format(img, None)
                    ext = cls.EXT_BY_FORMAT.get(target_fmt, ".jpg")
                    stem = cls._safe_stem(getattr(file_item, 'filename', f"image_{idx+1}.jpg"), f"image_{idx+1}")
                    clean_name = f"cleaned_{stem}{ext}"
                    zip_file.writestr(clean_name, processed_io.getvalue())
                except Exception:
                    continue

        zip_buffer.seek(0)
        return zip_buffer
