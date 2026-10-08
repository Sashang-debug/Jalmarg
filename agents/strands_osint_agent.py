"""
JalMarg (जलमार्ग) - Strands Agents SDK: Social Media OSINT Agent
Monitors simulated social media feeds (X/Twitter, Reddit, Telegram) in Indian metros,
filters noise, extracts flood emergency indicators, and standardizes event payloads.
"""

import json
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


class StrandsOSINTAgent:
    """
    Multi-Agent coordinator for Open Source Intelligence (OSINT) social feeds.
    """

    FLOOD_KEYWORDS = [
        "waterlog", "waterlogged", "waterlogging", "paani", "submerged",
        "flooded", "flooding", "underpass", "swimming pool", "traffic stuck",
        "knee deep", "waist deep", "drown", "hydro", "boat"
    ]

    URGENCY_TRIGGERS = [
        "emergency", "ambulance", "trapped", "stalled", "drowning",
        "cannot move", "help", "sos", "avoid"
    ]

    def __init__(self, city: str = "BLR"):
        self.city = city.upper()

    def filter_and_classify(self, post_text: str) -> Dict[str, Any]:
        """
        Classifies whether a social media post is a genuine flood incident report.
        """
        text_lower = post_text.lower()

        # 1. Keyword Density Matching
        matched_keywords = [kw for kw in self.FLOOD_KEYWORDS if kw in text_lower]
        is_flood_related = len(matched_keywords) > 0

        # 2. Urgency Scoring
        urgency_score = 0
        matched_urgency = [u for u in self.URGENCY_TRIGGERS if u in text_lower]
        if matched_urgency:
            urgency_score = min(1.0, len(matched_urgency) * 0.35 + 0.3)

        # 3. Sentiment & Confidence
        confidence = 0.0
        if is_flood_related:
            confidence = min(0.98, 0.50 + (len(matched_keywords) * 0.15))

        return {
            "is_flood_incident": is_flood_related,
            "confidence": round(confidence, 2),
            "urgency_score": round(urgency_score, 2),
            "matched_keywords": matched_keywords,
            "urgency_indicators": matched_urgency
        }

    def process_raw_post(self, raw_post: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Full agent pipeline: Ingest -> Filter -> Extract -> Format
        """
        text = raw_post.get("text", "")
        author = raw_post.get("author", "unknown_user")
        platform = raw_post.get("platform", "X_TWITTER")
        media_urls = raw_post.get("media_urls", [])

        classification = self.filter_and_classify(text)
        if not classification["is_flood_incident"] or classification["confidence"] < 0.55:
            return None # Ignore irrelevant social chatter

        return {
            "source": f"OSINT_{platform}",
            "author": author,
            "raw_text": text,
            "city": self.city,
            "confidence": classification["confidence"],
            "urgency_score": classification["urgency_score"],
            "has_media": len(media_urls) > 0,
            "media_urls": media_urls,
            "extracted_at": datetime.now(timezone.utc).isoformat(),
        }


# Quick standalone validation
if __name__ == "__main__":
    agent = StrandsOSINTAgent(city="BLR")
    sample_tweet = {
        "platform": "X_TWITTER",
        "author": "@BangaloreTrafficRider",
        "text": "Avoid Silk Board towards HSR layout! Massive waterlogging, 2 feet paani under flyover, bikes getting stalled emergency!",
        "media_urls": ["https://s3.ap-south-1.amazonaws.com/jalmarg-evidence-vault/test-silkboard.jpg"]
    }
    result = agent.process_raw_post(sample_tweet)
    print(json.dumps(result, indent=2))
