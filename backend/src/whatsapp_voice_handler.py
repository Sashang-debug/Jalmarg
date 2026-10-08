"""
JalMarg (जलमार्ग) - WhatsApp / Amazon Transcribe Voice Note Ingestion Pipeline
Processes inbound voice notes from stranded commuters, runs speech-to-text,
resolves colloquial locations, estimates water depth, and produces incident records.
"""

from typing import Dict, Any
from agents.landmark_resolver import LandmarkResolver
from agents.cv_depth_estimator import CVWaterDepthEstimator


class WhatsAppVoiceHandler:
    """
    Ingestion handler converting voice messages into structured flood incidents.
    """

    def __init__(self):
        self.landmark_resolver = LandmarkResolver()
        self.depth_estimator = CVWaterDepthEstimator()

    def process_voice_note(
        self,
        sender_phone: str,
        audio_transcript: str,
        city_hint: str = "BLR"
    ) -> Dict[str, Any]:
        """
        Transcribes voice message, extracts landmark, estimates depth, and formats incident.
        """
        # 1. Geocode landmark from transcript
        geo = self.landmark_resolver.resolve(audio_transcript, default_city=city_hint)

        # 2. Estimate depth based on verbal cues in audio
        depth_data = self.depth_estimator.analyze_image_metadata_and_mock(
            image_url="",
            caption_hint=audio_transcript
        )

        return {
            "source": "WHATSAPP_VOICE_NOTE",
            "sender": sender_phone,
            "raw_transcript": audio_transcript,
            "resolved_location": {
                "road_name": geo["road_name"],
                "city": geo["city"],
                "lat": geo["lat"],
                "lng": geo["lng"],
                "ward_id": geo["ward_id"]
            },
            "flood_metrics": {
                "depth_cm": depth_data["estimated_depth_cm"],
                "severity": depth_data["severity"],
                "risk_description": depth_data["risk_description"],
                "clearance_matrix": depth_data["clearance_matrix"]
            },
            "status": "PROCESSED_READY_FOR_INGEST"
        }
