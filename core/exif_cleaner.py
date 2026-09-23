import io
import re
from datetime import datetime
from PIL import Image, ImageOps
import piexif

from .exif_reader import ExifReader


class ExifCleaner:
    """
    Selective or full cleanup engine for photos.
    - Preserves the original format (JPEG/PNG/WEBP) instead of forcing JPEG.
    - Genuinely strips XMP / IPTC / ICC / PNG-text leftovers too.
    """

    SUPPORTED_SAVE_FORMATS = {"JPEG", "PNG", "WEBP"}

    # GPS blur levels: decimals kept after rounding (~11km / ~1.1km / ~110m)
    BLUR_DECIMALS = {"city": 1, "district": 2, "street": 3}

    # Share presets: max long edge + JPEG quality (always stripped + JPEG out)
    SHARE_PRESETS = {
        "instagram": {"max_dim": 2048, "quality": 85},
        "x": {"max_dim": 2048, "quality": 85},
        "whatsapp": {"max_dim": 1600, "quality": 80},
        "original": {"max_dim": None, "quality": 95},
    }

    # Single-tag edit/delete map (tag editor)
    EDITABLE_TAGS = {
        "make": ("0th", piexif.ImageIFD.Make, "ascii"),
        "model": ("0th", piexif.ImageIFD.Model, "ascii"),
        "software": ("0th", piexif.ImageIFD.Software, "ascii"),
        "artist": ("0th", piexif.ImageIFD.Artist, "ascii"),
        "copyright": ("0th", piexif.ImageIFD.Copyright, "ascii"),
        "imagedescription": ("0th", piexif.ImageIFD.ImageDescription, "ascii"),
        "datetime": ("0th", piexif.ImageIFD.DateTime, "ascii"),
        "datetimeoriginal": ("Exif", piexif.ExifIFD.DateTimeOriginal, "ascii"),
        "datetimedigitized": ("Exif", piexif.ExifIFD.DateTimeDigitized, "ascii"),
        "usercomment": ("Exif", piexif.ExifIFD.UserComment, "undefined"),
        "lensmodel": ("Exif", piexif.ExifIFD.LensModel, "ascii"),
        "bodyserialnumber": ("Exif", piexif.ExifIFD.BodySerialNumber, "ascii"),
    }

    MAX_TAG_VALUE_LEN = 256

    DATETIME_KEYS = {"datetime", "datetimeoriginal", "datetimedigitized"}
    DATETIME_RE = re.compile(r"^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$")

    @staticmethod
    def _validate_exif_datetime(text: str) -> None:
        if not ExifCleaner.DATETIME_RE.match(text):
            raise ValueError("Invalid datetime format, expected YYYY:MM:DD HH:MM:SS.")
        try:
            datetime.strptime(text, "%Y:%m:%d %H:%M:%S")
        except ValueError:
            raise ValueError("Invalid datetime value.")

    @staticmethod
    def _prepare_rgb(img: Image.Image) -> Image.Image:
        img = ImageOps.exif_transpose(img)
        if img.mode in ('RGBA', 'LA'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.convert('RGBA').split()[3])
            return bg
        elif img.mode not in ('RGB', 'L'):
            return img.convert('RGB')
        return img

    @classmethod
    def _target_format(cls, img: Image.Image, keep_format=None) -> str:
        fmt = (keep_format or img.format or "JPEG").upper()
        if fmt == "JPG":
            fmt = "JPEG"
        if fmt not in cls.SUPPORTED_SAVE_FORMATS:
            fmt = "JPEG"
        return fmt

    @classmethod
    def _fresh_pixels(cls, img: Image.Image, target_format: str) -> Image.Image:
        """Moves pixel data into a fresh Image object; no info/EXIF is carried over."""
        prepared = ImageOps.exif_transpose(img)
        if target_format in ("JPEG", "WEBP"):
            return cls._prepare_rgb(prepared)
        # PNG: allow RGBA to preserve transparency
        if prepared.mode not in ("RGB", "RGBA", "L", "LA", "P"):
            return prepared.convert("RGB")
        return prepared.copy()

    @classmethod
    def _save_stripped(cls, img: Image.Image, target_format: str, quality: int = 95) -> io.BytesIO:
        """Saves with zero metadata (no EXIF/XMP/IPTC/ICC/PNG-text)."""
        fresh = cls._fresh_pixels(img, target_format)
        out_io = io.BytesIO()
        if target_format == "JPEG":
            fresh.save(out_io, format="JPEG", quality=quality)
        elif target_format == "WEBP":
            fresh.save(out_io, format="WEBP", quality=quality, method=4)
        else:  # PNG — save without info= so no tEXt/iTXt is carried over
            fresh.save(out_io, format="PNG", optimize=True)
        out_io.seek(0)
        return out_io

    @classmethod
    def purge_all(cls, img: Image.Image, quality: int = 95, keep_format=None) -> io.BytesIO:
        target = cls._target_format(img, keep_format)
        return cls._save_stripped(img, target, quality)

    @staticmethod
    def _degrees_to_exif(deg: float):
        deg_abs = abs(deg)
        d = int(deg_abs)
        m = int((deg_abs - d) * 60)
        s = int((deg_abs - d - m / 60) * 3600 * 100)
        return ((d, 1), (m, 1), (s, 100))

    @staticmethod
    def _fit_within(img: Image.Image, max_dim) -> Image.Image:
        if not max_dim:
            return img
        w, h = img.size
        m = max(w, h)
        if m <= max_dim:
            return img
        scale = max_dim / m
        return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)

    @classmethod
    def blur_gps(cls, img: Image.Image, precision: str = "district",
                 quality: int = 95, keep_format=None) -> io.BytesIO:
        """Rounds GPS coordinates to a coarse grid and drops altitude.

        Everything else in the EXIF block is preserved.
        """
        target = cls._target_format(img, keep_format)
        decimals = cls.BLUR_DECIMALS.get(precision, 2)
        raw_exif = (img.info or {}).get('exif')
        if not raw_exif:
            return cls._save_stripped(img, target, quality)

        try:
            exif_dict = piexif.load(raw_exif)
            gps = exif_dict.get("GPS", {})
            lat = ExifReader._convert_to_degrees(gps.get(piexif.GPSIFD.GPSLatitude)) \
                if gps.get(piexif.GPSIFD.GPSLatitude) else None
            lon = ExifReader._convert_to_degrees(gps.get(piexif.GPSIFD.GPSLongitude)) \
                if gps.get(piexif.GPSIFD.GPSLongitude) else None
            if lat is None or lon is None:
                exif_dict["GPS"] = {}
            else:
                lat_ref = gps.get(piexif.GPSIFD.GPSLatitudeRef, b'N')
                lon_ref = gps.get(piexif.GPSIFD.GPSLongitudeRef, b'E')
                try:
                    if lat_ref.decode('utf-8', errors='ignore') == 'S':
                        lat = -lat
                    if lon_ref.decode('utf-8', errors='ignore') == 'W':
                        lon = -lon
                except Exception:
                    pass
                lat_r, lon_r = round(lat, decimals), round(lon, decimals)
                exif_dict["GPS"] = {
                    piexif.GPSIFD.GPSLatitudeRef: b'N' if lat_r >= 0 else b'S',
                    piexif.GPSIFD.GPSLatitude: cls._degrees_to_exif(lat_r),
                    piexif.GPSIFD.GPSLongitudeRef: b'E' if lon_r >= 0 else b'W',
                    piexif.GPSIFD.GPSLongitude: cls._degrees_to_exif(lon_r),
                }

            fresh = cls._fresh_pixels(img, target)
            out_io = io.BytesIO()
            exif_dict.pop("thumbnail", None)
            exif_bytes = piexif.dump(exif_dict)
            if target == "JPEG":
                fresh.save(out_io, format="JPEG", exif=exif_bytes, quality=quality)
            elif target == "WEBP":
                fresh.save(out_io, format="WEBP", exif=exif_bytes, quality=quality, method=4)
            else:
                fresh.save(out_io, format="PNG", exif=exif_bytes, optimize=True)
            out_io.seek(0)
            return out_io
        except Exception:
            return cls._save_stripped(img, target, quality)

    @classmethod
    def share_preset(cls, img: Image.Image, preset: str = "instagram",
                     quality: int = None) -> io.BytesIO:
        """Strips all metadata, downsizes to the preset's long edge, exports JPEG."""
        cfg = cls.SHARE_PRESETS.get(preset, cls.SHARE_PRESETS["instagram"])
        q = quality or cfg["quality"]
        fresh = cls._fresh_pixels(img, "JPEG")
        fitted = cls._fit_within(fresh, cfg["max_dim"])
        out_io = io.BytesIO()
        fitted.save(out_io, format="JPEG", quality=q)
        out_io.seek(0)
        return out_io

    @classmethod
    def selective_clean(cls, img: Image.Image, options: dict, quality: int = 95,
                        keep_format=None) -> io.BytesIO:
        target = cls._target_format(img, keep_format)
        raw_exif = (img.info or {}).get('exif')

        # No EXIF? Still strip the other containers (XMP/IPTC/ICC/PNG-text)
        if not raw_exif:
            return cls._save_stripped(img, target, quality)

        try:
            exif_dict = piexif.load(raw_exif)

            if options.get("remove_gps", True):
                exif_dict["GPS"] = {}

            if options.get("remove_camera", False):
                zeroth = exif_dict.get("0th", {})
                exif_sub = exif_dict.get("Exif", {})
                zeroth.pop(piexif.ImageIFD.Make, None)
                zeroth.pop(piexif.ImageIFD.Model, None)
                exif_sub.pop(piexif.ExifIFD.LensModel, None)
                exif_sub.pop(piexif.ExifIFD.BodySerialNumber, None)

            if options.get("remove_datetime", True):
                exif_sub = exif_dict.get("Exif", {})
                zeroth = exif_dict.get("0th", {})
                exif_sub.pop(piexif.ExifIFD.DateTimeOriginal, None)
                exif_sub.pop(piexif.ExifIFD.DateTimeDigitized, None)
                zeroth.pop(piexif.ImageIFD.DateTime, None)

            if options.get("remove_software", True):
                zeroth = exif_dict.get("0th", {})
                zeroth.pop(piexif.ImageIFD.Software, None)

            if options.get("remove_descriptions", True):
                zeroth = exif_dict.get("0th", {})
                exif_sub = exif_dict.get("Exif", {})
                zeroth.pop(piexif.ImageIFD.Artist, None)
                zeroth.pop(piexif.ImageIFD.Copyright, None)
                zeroth.pop(piexif.ImageIFD.ImageDescription, None)
                exif_sub.pop(piexif.ExifIFD.UserComment, None)

            # Selective clean carries no ICC/XMP: fresh pixels + remaining EXIF only
            fresh = cls._fresh_pixels(img, target)
            out_io = io.BytesIO()
            # drop thumbnail leftovers too
            exif_dict.pop("thumbnail", None)
            exif_bytes = piexif.dump(exif_dict)
            if target == "JPEG":
                fresh.save(out_io, format="JPEG", exif=exif_bytes, quality=quality)
            elif target == "WEBP":
                fresh.save(out_io, format="WEBP", exif=exif_bytes, quality=quality, method=4)
            else:  # PNG supports EXIF (eXIf chunk) — keep remaining EXIF, carry no text
                fresh.save(out_io, format="PNG", exif=exif_bytes, optimize=True)
            out_io.seek(0)
            return out_io

        except Exception:
            return cls._save_stripped(img, target, quality)

    @classmethod
    def apply_edits(cls, img: Image.Image, edits: dict, deletions: list = None,
                    quality: int = 95, keep_format=None) -> io.BytesIO:
        """Single-tag editing. edits={make:'...', ...}, deletions=['gps', ...]."""
        target = cls._target_format(img, keep_format)
        deletions = deletions or []
        raw_exif = (img.info or {}).get('exif')
        try:
            exif_dict = piexif.load(raw_exif) if raw_exif else {"0th": {}, "Exif": {}, "GPS": {}}
        except Exception:
            exif_dict = {"0th": {}, "Exif": {}, "GPS": {}}
        for k in ("0th", "Exif", "GPS"):
            exif_dict.setdefault(k, {})

        norm_edits = {(k or "").lower(): v for k, v in (edits or {}).items() if v is not None}
        for key, value in norm_edits.items():
            if key == "gps":
                continue
            spec = cls.EDITABLE_TAGS.get(key)
            if not spec:
                continue
            ifd_name, tag_id, kind = spec
            text = str(value).strip()[:cls.MAX_TAG_VALUE_LEN]
            if not text:
                exif_dict[ifd_name].pop(tag_id, None)
                continue
            if key in cls.DATETIME_KEYS:
                cls._validate_exif_datetime(text)
            try:
                if kind == "undefined":
                    exif_dict[ifd_name][tag_id] = text.encode("ascii", "ignore")
                else:
                    exif_dict[ifd_name][tag_id] = text.encode("ascii", "ignore")
            except Exception:
                continue

        norm_del = {(d or "").lower() for d in deletions}
        if "gps" in norm_del:
            exif_dict["GPS"] = {}
        for d in norm_del:
            spec = cls.EDITABLE_TAGS.get(d)
            if spec:
                ifd_name, tag_id, _ = spec
                exif_dict[ifd_name].pop(tag_id, None)

        fresh = cls._fresh_pixels(img, target)
        out_io = io.BytesIO()
        try:
            exif_dict.pop("thumbnail", None)
            exif_bytes = piexif.dump(exif_dict)
        except Exception:
            return cls._save_stripped(img, target, quality)
        if target == "JPEG":
            fresh.save(out_io, format="JPEG", exif=exif_bytes, quality=quality)
        elif target == "WEBP":
            fresh.save(out_io, format="WEBP", exif=exif_bytes, quality=quality, method=4)
        else:
            fresh.save(out_io, format="PNG", exif=exif_bytes, optimize=True)
        out_io.seek(0)
        return out_io
