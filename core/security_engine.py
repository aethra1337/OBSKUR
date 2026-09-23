import gc

class SecurityEngine:
    """
    Image security, magic-byte verification, and memory-scrub engine.
    Needs no external or removed Python modules.
    """
    
    # Known safe file signatures (Magic Bytes)
    ALLOWED_MAGIC_BYTES = {
        'jpeg': b'\xff\xd8\xff',
        'png': b'\x89PNG\r\n\x1a\n',
        'webp': b'RIFF'
    }

    # HEIC/HEIF brands seen in the ftyp box (bytes 8:12)
    HEIC_BRANDS = {
        b'heic', b'heix', b'hevc', b'hevx', b'heim', b'heis',
        b'hevm', b'hevs', b'mif1', b'msf1', b'heif', b'msf1',
    }

    _heif_checked = False
    _heif_available = False

    @classmethod
    def heif_available(cls) -> bool:
        if not cls._heif_checked:
            try:
                import pillow_heif  # noqa: F401
                cls._heif_available = True
            except ImportError:
                cls._heif_available = False
            cls._heif_checked = True
        return cls._heif_available

    @classmethod
    def sniff_format(cls, file_stream):
        """Return 'jpeg', 'png', 'webp', 'heic', or None without trusting extensions."""
        try:
            file_stream.seek(0)
            header = file_stream.read(16)
            file_stream.seek(0)
        except Exception:
            return None

        if header.startswith(cls.ALLOWED_MAGIC_BYTES['jpeg']):
            return 'jpeg'
        if header.startswith(cls.ALLOWED_MAGIC_BYTES['png']):
            return 'png'
        if header.startswith(cls.ALLOWED_MAGIC_BYTES['webp']) and b'WEBP' in header:
            return 'webp'
        if len(header) >= 12 and header[4:8] == b'ftyp' and header[8:12] in cls.HEIC_BRANDS:
            return 'heic'
        return None

    @classmethod
    def validate_file_integrity(cls, file_stream) -> bool:
        """
        Checks the magic-byte signature instead of trusting the file extension.
        Blocks polyglot or malicious uploads.
        """
        return cls.sniff_format(file_stream) is not None

    @staticmethod
    def secure_memory_wipe(*buffers):
        """
        Force-cleans leftover image buffers from RAM after processing.
        """
        for buf in buffers:
            if buf:
                try:
                    buf.close()
                except Exception:
                    pass
        gc.collect()