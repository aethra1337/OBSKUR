class PrivacyScorer:
    """
    Risk analysis engine scoring the privacy-violation risk of sensitive
    data in an image as a RISK INDEX (0 - 100) with weighted heuristics.
    0 = clean, 100 = fully exposed. Higher is riskier.
    """

    WEIGHTS = {
        "gps_coords": 50,
        "gps_alt": 10,
        "serial_number": 25,
        "date_time": 15,
        "author_artist": 15,
        "user_comment": 10,
        "camera_model": 10,
        "software": 5
    }

    @staticmethod
    def _present(value) -> bool:
        """None-safe presence check: 0/0.0 are real values, '' is not."""
        if value is None:
            return False
        if isinstance(value, str):
            return value.strip() != ""
        return True

    @classmethod
    def calculate_score(cls, metadata: dict) -> dict:
        total_risk = 0
        detected_risks = []
        recommendations = []

        if not isinstance(metadata, dict):
            metadata = {}

        location = metadata.get("location", {}) or {}
        camera = metadata.get("camera", {}) or {}
        datetime_data = metadata.get("datetime", {}) or {}
        software = metadata.get("software", {}) or {}

        # 1. Location risk
        if cls._present(location.get("latitude")) and cls._present(location.get("longitude")):
            total_risk += cls.WEIGHTS["gps_coords"]
            detected_risks.append("GPS Location Data (Latitude/Longitude)")
            recommendations.append("GPS coordinates can reveal exactly where this photo was taken.")

        if cls._present(location.get("altitude")):
            total_risk += cls.WEIGHTS["gps_alt"]
            detected_risks.append("GPS Altitude Data")

        # 2. Device identity risk
        if cls._present(camera.get("serial_number")):
            total_risk += cls.WEIGHTS["serial_number"]
            detected_risks.append("Device Serial Number")
            recommendations.append("A device serial number can prove that photos across platforms came from the same physical device.")

        if cls._present(camera.get("model")):
            total_risk += cls.WEIGHTS["camera_model"]
            detected_risks.append(f"Device Model ({camera.get('make', '')} {camera.get('model')})".strip())

        # 3. Time risk
        if cls._present(datetime_data.get("date_taken")):
            total_risk += cls.WEIGHTS["date_time"]
            detected_risks.append("Original Capture Date/Time")

        # 4. Author / Software / Description
        if cls._present(software.get("artist")) or cls._present(software.get("copyright")):
            total_risk += cls.WEIGHTS["author_artist"]
            detected_risks.append("Author / Copyright Information")

        if cls._present(software.get("description")):
            total_risk += cls.WEIGHTS["user_comment"]
            detected_risks.append("Description / User Comment")
            recommendations.append("Embedded descriptions can leak names, places or internal notes.")

        if cls._present(software.get("software")):
            total_risk += cls.WEIGHTS["software"]
            detected_risks.append(f"Editing Software ({software.get('software')})")

        # Score calculation (RISK INDEX: higher = riskier)
        risk_score = min(100, total_risk)

        if risk_score <= 15:
            risk_level = "LOW"
            risk_label = "LOW RISK"
            status_color = "#35D07F"
        elif risk_score <= 50:
            risk_level = "MEDIUM"
            risk_label = "MEDIUM RISK"
            status_color = "#FFB84D"
        else:
            risk_level = "HIGH"
            risk_label = "HIGH RISK"
            status_color = "#FF5C6C"

        if not recommendations:
            recommendations.append("No privacy-sensitive metadata detected.")

        return {
            "score": risk_score,
            "risk_level": risk_level,
            "risk_label": risk_label,
            "status_color": status_color,
            "detected_risks": detected_risks,
            "recommendations": recommendations
        }