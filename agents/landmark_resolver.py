"""
JalMarg (जलमार्ग) - Amazon Bedrock Colloquial Indian Landmark Resolver
Resolves informal Indian street names, landmarks, and Hinglish descriptions
into normalized lat/long coordinates, city codes, and ward references.
"""

import os
import json
from typing import Dict, Any, Optional

try:
    import boto3
except ImportError:
    boto3 = None


class LandmarkResolver:
    """
    Colloquial Indian Geocoding Engine powered by Amazon Bedrock with local cache.
    """

    # High-accuracy fallback dictionary for prominent chronic flood hotspots across India
    KNOWN_FLOOD_HOTSPOTS = {
        # Bengaluru (BLR)
        "silk board": {"lat": 12.9176, "lng": 77.6238, "city": "BLR", "name": "Central Silk Board Junction", "ward": "174"},
        "hsr layout": {"lat": 12.9116, "lng": 77.6389, "city": "BLR", "name": "HSR Layout Sector 7", "ward": "174"},
        "sony world": {"lat": 12.9352, "lng": 77.6245, "city": "BLR", "name": "Sony World Signal 80ft Road Koramangala", "ward": "151"},
        "koramangala 80ft": {"lat": 12.9352, "lng": 77.6245, "city": "BLR", "name": "Koramangala 80 Feet Road", "ward": "151"},
        "bellandur ecospace": {"lat": 12.9260, "lng": 77.6762, "city": "BLR", "name": "Outer Ring Road Bellandur EcoSpace", "ward": "150"},
        "marathahalli bridge": {"lat": 12.9569, "lng": 77.7011, "city": "BLR", "name": "Marathahalli Multiplex Underpass", "ward": "85"},
        "indiranagar 100ft": {"lat": 12.9719, "lng": 77.6412, "city": "BLR", "name": "Indiranagar 100ft Road Underpass", "ward": "82"},

        # Mumbai (BOM)
        "milan subway": {"lat": 19.0838, "lng": 72.8427, "city": "BOM", "name": "Milan Subway Santacruz", "ward": "H-West"},
        "hindmata": {"lat": 19.0125, "lng": 72.8422, "city": "BOM", "name": "Hindmata Flyover Junction Dadar", "ward": "F-South"},
        "andheri subway": {"lat": 19.1197, "lng": 72.8468, "city": "BOM", "name": "Andheri Subway Western Suburbs", "ward": "K-West"},

        # Delhi NCR (DEL)
        "minto bridge": {"lat": 28.6358, "lng": 77.2245, "city": "DEL", "name": "Minto Bridge Underpass Connaught Place", "ward": "NDMC-12"},
        "nangloi": {"lat": 28.6833, "lng": 77.0667, "city": "DEL", "name": "Rohtak Road Nangloi", "ward": "MCD-42"},
        "iffco chowk": {"lat": 28.4720, "lng": 77.0632, "city": "GGN", "name": "IFFCO Chowk Underpass NH-48 Gurgaon", "ward": "MCG-8"}
    }

    def __init__(self, region: str = "ap-south-1"):
        self.region = region
        self.bedrock_client = None
        if boto3 and os.environ.get("AWS_ACCESS_KEY_ID"):
            try:
                self.bedrock_client = boto3.client("bedrock-runtime", region_name=self.region)
            except Exception:
                self.bedrock_client = None

    def resolve(self, text: str, default_city: str = "BLR") -> Dict[str, Any]:
        """
        Extracts landmark entities and maps them to precise GPS coordinates.
        """
        text_lower = text.lower()

        # 1. Check verified local hotspot database
        for key, geo in self.KNOWN_FLOOD_HOTSPOTS.items():
            if key in text_lower:
                return {
                    "matched": True,
                    "road_name": geo["name"],
                    "city": geo["city"],
                    "lat": geo["lat"],
                    "lng": geo["lng"],
                    "ward_id": geo["ward"],
                    "confidence": 0.96,
                    "resolution_source": "HOTSPOT_DICTIONARY"
                }

        # 2. Bedrock Foundation Model Fallback (Claude 3 Haiku / Titan)
        if self.bedrock_client:
            try:
                prompt = f"""
                You are a specialized Indian Geographic Entity Resolver.
                Extract the specific road, junction, or underpass from this text: "{text}".
                Return ONLY valid JSON in this format:
                {{"road_name": string, "city": string, "lat": float, "lng": float, "ward_id": string, "confidence": float}}
                """
                payload = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 150,
                    "messages": [{"role": "user", "content": prompt}]
                }
                response = self.bedrock_client.invoke_model(
                    modelId=os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"),
                    body=json.dumps(payload)
                )
                response_body = json.loads(response["body"].read())
                content = response_body["content"][0]["text"]
                return json.loads(content)
            except Exception as e:
                pass # Gracefully fall back to regional city centroid

        # 3. Graceful fallback centroid
        centroids = {
            "BLR": {"lat": 12.9716, "lng": 77.5946, "name": "Bengaluru Central"},
            "BOM": {"lat": 19.0760, "lng": 72.8777, "name": "Mumbai Central"},
            "DEL": {"lat": 28.6139, "lng": 77.2090, "name": "New Delhi Central"}
        }
        city_info = centroids.get(default_city.upper(), centroids["BLR"])
        return {
            "matched": False,
            "road_name": f"{city_info['name']} (General Vicinity)",
            "city": default_city.upper(),
            "lat": city_info["lat"],
            "lng": city_info["lng"],
            "ward_id": "UNKNOWN",
            "confidence": 0.50,
            "resolution_source": "CITY_CENTROID_FALLBACK"
        }
