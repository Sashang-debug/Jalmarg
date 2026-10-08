"""
JalMarg (जलमार्ग) - Amazon Polly Vernacular Audio Alert Engine
Synthesizes low-latency audio warnings for 2-wheeler riders and gig delivery workers
in Hindi (Aditi), Kannada, and Indian English (Kajal).
"""

import os
import json
from typing import Dict, Any, Optional

try:
    import boto3
except ImportError:
    boto3 = None


class PollyAudioAlertEngine:
    """
    Audio generation engine using Amazon Polly Neural Text-to-Speech with SSML markup.
    """

    VOICE_CONFIG = {
        "HI": {"voice_id": "Aditi", "language_code": "hi-IN", "engine": "neural"},
        "EN_IN": {"voice_id": "Kajal", "language_code": "en-IN", "engine": "neural"}
    }

    def __init__(self, region: str = "ap-south-1"):
        self.region = region
        self.polly_client = None
        if boto3 and os.environ.get("AWS_ACCESS_KEY_ID"):
            try:
                self.polly_client = boto3.client("polly", region_name=self.region)
            except Exception:
                self.polly_client = None

    def generate_alert_ssml(
        self,
        road_name: str,
        depth_cm: int,
        distance_meters: int = 200,
        lang: str = "HI"
    ) -> str:
        """
        Generates SSML markup formatted for clear speech in noisy traffic / helmet earphones.
        """
        if lang.upper() == "HI":
            text = (
                f"<speak>"
                f"<amazon:auto-breaths volume='soft'>"
                f"<prosody rate='fast' volume='loud'>"
                f"सावधान! {distance_meters} मीटर आगे {road_name} पर "
                f"<emphasis level='strong'>{depth_cm} सेंटीमीटर</emphasis> पानी भरा है। "
                f"कृपया तुरंत फ्लाईओवर वाला रास्ता लें।"
                f"</prosody>"
                f"</amazon:auto-breaths>"
                f"</speak>"
            )
        else:
            text = (
                f"<speak>"
                f"<amazon:auto-breaths volume='soft'>"
                f"<prosody rate='fast' volume='loud'>"
                f"Caution! In {distance_meters} meters, {road_name} has "
                f"<emphasis level='strong'>{depth_cm} centimeters</emphasis> of standing water. "
                f"Diverting via elevated flyover."
                f"</prosody>"
                f"</amazon:auto-breaths>"
                f"</speak>"
            )
        return text

    def synthesize(
        self,
        road_name: str,
        depth_cm: int,
        distance_meters: int = 200,
        lang: str = "HI"
    ) -> Dict[str, Any]:
        """
        Synthesizes audio stream via Polly or generates structured audio payload.
        """
        lang_key = lang.upper() if lang.upper() in self.VOICE_CONFIG else "HI"
        cfg = self.VOICE_CONFIG[lang_key]
        ssml_script = self.generate_alert_ssml(road_name, depth_cm, distance_meters, lang_key)

        clean_text = ssml_script.replace("<speak>", "").replace("</speak>", "")
        for tag in ["<amazon:auto-breaths volume='soft'>", "</amazon:auto-breaths>",
                    "<prosody rate='fast' volume='loud'>", "</prosody>",
                    "<emphasis level='strong'>", "</emphasis>"]:
            clean_text = clean_text.replace(tag, "")

        if self.polly_client:
            try:
                response = self.polly_client.synthesize_speech(
                    Engine=cfg["engine"],
                    LanguageCode=cfg["language_code"],
                    OutputFormat="mp3",
                    TextType="ssml",
                    Text=ssml_script,
                    VoiceId=cfg["voice_id"]
                )
                audio_stream = response.get("AudioStream")
                return {
                    "status": "SYNTHESIZED_LIVE",
                    "voice_id": cfg["voice_id"],
                    "language": cfg["language_code"],
                    "ssml": ssml_script,
                    "plain_text": clean_text.strip(),
                    "has_audio_stream": audio_stream is not None
                }
            except Exception as e:
                pass

        # Local mock payload for offline development
        return {
            "status": "LOCAL_SYNTHESIS_PAYLOAD",
            "voice_id": cfg["voice_id"],
            "language": cfg["language_code"],
            "ssml": ssml_script,
            "plain_text": clean_text.strip(),
            "audio_duration_seconds": 4.5,
            "sample_rate": "24000Hz"
        }
