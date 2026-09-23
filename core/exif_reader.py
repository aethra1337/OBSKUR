from PIL import Image
import piexif

class ExifReader:
    """
    Reader engine that scans and categorizes the EXIF, XMP, IPTC, ICC,
    and PNG metadata in a photo.
    """

    @staticmethod
    def _convert_to_degrees(value):
        try:
            d = float(value[0][0]) / float(value[0][1])
            m = float(value[1][0]) / float(value[1][1])
            s = float(value[2][0]) / float(value[2][1])
            return d + (m / 60.0) + (s / 3600.0)
        except Exception:
            return None

    @classmethod
    def extract_all_metadata(cls, img: Image.Image) -> dict:
        metadata = {
            "camera": {},
            "settings": {},
            "datetime": {},
            "location": {},
            "software": {},
            "sources": {
                "exif": False,
                "xmp": False,
                "iptc": False,
                "icc": False,
                "png_text": False
            }
        }

        # Source detection
        info = img.info or {}
        if "icc_profile" in info:
            metadata["sources"]["icc"] = True
        if "XML:com.adobe.xmp" in info or "xmp" in info:
            metadata["sources"]["xmp"] = True
        if img.format == "PNG" and any(k for k in info.keys() if k not in ["icc_profile", "exif"]):
            metadata["sources"]["png_text"] = True

        raw_exif = info.get('exif')
        if not raw_exif:
            return metadata

        try:
            exif_dict = piexif.load(raw_exif)
            metadata["sources"]["exif"] = True

            zeroth = exif_dict.get("0th", {})
            exif_sub = exif_dict.get("Exif", {})
            gps = exif_dict.get("GPS", {})

            # Camera info
            if piexif.ImageIFD.Make in zeroth:
                metadata["camera"]["make"] = zeroth[piexif.ImageIFD.Make].decode('utf-8', errors='ignore').strip()
            if piexif.ImageIFD.Model in zeroth:
                metadata["camera"]["model"] = zeroth[piexif.ImageIFD.Model].decode('utf-8', errors='ignore').strip()
            if piexif.ExifIFD.LensModel in exif_sub:
                metadata["camera"]["lens_model"] = exif_sub[piexif.ExifIFD.LensModel].decode('utf-8', errors='ignore').strip()
            if piexif.ExifIFD.BodySerialNumber in exif_sub:
                metadata["camera"]["serial_number"] = exif_sub[piexif.ExifIFD.BodySerialNumber].decode('utf-8', errors='ignore').strip()

            # Capture settings
            if piexif.ExifIFD.ISOSpeedRatings in exif_sub:
                metadata["settings"]["iso"] = str(exif_sub[piexif.ExifIFD.ISOSpeedRatings])
            if piexif.ExifIFD.FNumber in exif_sub:
                f = exif_sub[piexif.ExifIFD.FNumber]
                if f[1] != 0:
                    metadata["settings"]["aperture"] = f"f/{f[0]/f[1]:.1f}"
            if piexif.ExifIFD.ExposureTime in exif_sub:
                exp = exif_sub[piexif.ExifIFD.ExposureTime]
                if exp[0] != 0:
                    metadata["settings"]["shutter_speed"] = f"1/{int(exp[1]/exp[0])}s" if exp[1] > exp[0] else f"{exp[0]/exp[1]}s"
            if piexif.ExifIFD.FocalLength in exif_sub:
                foc = exif_sub[piexif.ExifIFD.FocalLength]
                if foc[1] != 0:
                    metadata["settings"]["focal_length"] = f"{foc[0]/foc[1]:.1f} mm"

            # Timestamps
            if piexif.ExifIFD.DateTimeOriginal in exif_sub:
                metadata["datetime"]["date_taken"] = exif_sub[piexif.ExifIFD.DateTimeOriginal].decode('utf-8', errors='ignore')
            if piexif.ImageIFD.DateTime in zeroth:
                metadata["datetime"]["date_modified"] = zeroth[piexif.ImageIFD.DateTime].decode('utf-8', errors='ignore')

            # Location
            lat_data = gps.get(piexif.GPSIFD.GPSLatitude)
            lat_ref = gps.get(piexif.GPSIFD.GPSLatitudeRef)
            lon_data = gps.get(piexif.GPSIFD.GPSLongitude)
            lon_ref = gps.get(piexif.GPSIFD.GPSLongitudeRef)

            if lat_data and lat_ref and lon_data and lon_ref:
                lat = cls._convert_to_degrees(lat_data)
                lon = cls._convert_to_degrees(lon_data)
                if lat_ref.decode('utf-8', errors='ignore') == 'S': lat = -lat
                if lon_ref.decode('utf-8', errors='ignore') == 'W': lon = -lon
                
                metadata["location"]["latitude"] = round(lat, 6)
                metadata["location"]["longitude"] = round(lon, 6)

            if piexif.GPSIFD.GPSAltitude in gps:
                alt = gps[piexif.GPSIFD.GPSAltitude]
                if alt[1] != 0:
                    metadata["location"]["altitude"] = f"{alt[0]/alt[1]:.1f} m"

            # Software & copyright & descriptions
            if piexif.ImageIFD.Software in zeroth:
                metadata["software"]["software"] = zeroth[piexif.ImageIFD.Software].decode('utf-8', errors='ignore').strip()
            if piexif.ImageIFD.Artist in zeroth:
                metadata["software"]["artist"] = zeroth[piexif.ImageIFD.Artist].decode('utf-8', errors='ignore').strip()
            if piexif.ImageIFD.Copyright in zeroth:
                metadata["software"]["copyright"] = zeroth[piexif.ImageIFD.Copyright].decode('utf-8', errors='ignore').strip()
            descriptions = []
            if piexif.ImageIFD.ImageDescription in zeroth:
                desc = zeroth[piexif.ImageIFD.ImageDescription].decode('utf-8', errors='ignore').replace('\x00', '').strip()
                if desc:
                    descriptions.append(desc)
            if piexif.ExifIFD.UserComment in exif_sub:
                raw = bytes(exif_sub[piexif.ExifIFD.UserComment])
                body = raw[8:] if len(raw) > 8 else raw  # skip charset prefix (e.g. ASCII\0\0\0)
                comment = body.decode('utf-8', errors='ignore').replace('\x00', '').strip()
                if comment and comment not in descriptions:
                    descriptions.append(comment)
            if descriptions:
                metadata["software"]["description"] = " | ".join(descriptions)

        except Exception:
            pass

        return metadata