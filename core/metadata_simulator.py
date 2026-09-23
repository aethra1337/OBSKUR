import io
from PIL import Image, ImageOps
import piexif

from .exif_cleaner import ExifCleaner


class MetadataSimulator:
    """
    Engine that synthesizes EXIF data for test and privacy-verification scenarios.
    Supports format preservation.
    """

    PROFILES = {
        "smartphone": {"make": "Apple", "model": "iPhone 15 Pro", "software": "iOS 17.5.1"},
        "dslr": {"make": "Canon", "model": "EOS R5", "software": "Digital Photo Professional"},
        "generic": {"make": "Generic", "model": "Synthetic Camera v1.0", "software": "OBSKUR Simulator"}
    }

    @staticmethod
    def _degrees_to_exif(deg: float):
        deg_abs = abs(deg)
        d = int(deg_abs)
        m = int((deg_abs - d) * 60)
        s = int((deg_abs - d - m / 60) * 3600 * 100)
        return ((d, 1), (m, 1), (s, 100))

    @classmethod
    def apply_simulation(cls, img: Image.Image, config: dict, quality: int = 95,
                         keep_format=None) -> io.BytesIO:
        profile_key = config.get("profile", "generic")
        if profile_key not in cls.PROFILES:
            profile_key = "generic"
        base = cls.PROFILES.get(profile_key, cls.PROFILES["generic"])

        make = str(config.get("make") or base["make"])[:64]
        model = str(config.get("model") or base["model"])[:64]
        software = str(config.get("software") or base["software"])[:64]

        try:
            lat = float(config.get("lat", 39.9334))
            lng = float(config.get("lng", 32.8597))
        except (TypeError, ValueError):
            raise ValueError("Invalid coordinates.")
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            raise ValueError("Coordinates out of range.")

        target = ExifCleaner._target_format(img, keep_format)
        fresh = ExifCleaner._fresh_pixels(img, target)

        zeroth_ifd = {
            piexif.ImageIFD.Make: str(make).encode('ascii', 'ignore'),
            piexif.ImageIFD.Model: str(model).encode('ascii', 'ignore'),
            piexif.ImageIFD.Software: f"{software} (Synthetic)".encode('ascii', 'ignore')
        }

        gps_ifd = {
            piexif.GPSIFD.GPSLatitudeRef: b'N' if lat >= 0 else b'S',
            piexif.GPSIFD.GPSLatitude: cls._degrees_to_exif(lat),
            piexif.GPSIFD.GPSLongitudeRef: b'E' if lng >= 0 else b'W',
            piexif.GPSIFD.GPSLongitude: cls._degrees_to_exif(lng)
        }

        exif_bytes = piexif.dump({"0th": zeroth_ifd, "GPS": gps_ifd})

        out_io = io.BytesIO()
        if target == "JPEG":
            fresh.save(out_io, format='JPEG', exif=exif_bytes, quality=quality)
        elif target == "WEBP":
            fresh.save(out_io, format='WEBP', exif=exif_bytes, quality=quality, method=4)
        else:
            fresh.save(out_io, format='PNG', exif=exif_bytes, optimize=True)
        out_io.seek(0)
        return out_io
