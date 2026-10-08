"""
JalMarg (जलमार्ग) - Phase 2 Intelligence & Security Automated Test Suite
Tests:
1. Strands OSINT Agent (filtering & classification)
2. Amazon Bedrock Colloquial Landmark Geocoder
3. Computer Vision Depth Estimator (centimeter & clearance calculation)
4. Cedar Policy Engine (fine-grained authorization & zero trust)
"""

import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.strands_osint_agent import StrandsOSINTAgent
from agents.landmark_resolver import LandmarkResolver
from agents.cv_depth_estimator import CVWaterDepthEstimator
from policies.cedar_evaluator import CedarEvaluator


def test_strands_osint_agent():
    print("[TEST 1/4] Running Strands OSINT Agent Tests...")
    agent = StrandsOSINTAgent(city="BLR")

    # Positive sample: Valid urgent tweet from Silk Board
    urgent_tweet = {
        "platform": "X_TWITTER",
        "author": "@BangaloreRider",
        "text": "Avoid Silk Board towards HSR layout! Massive waterlogging, 2 feet paani under flyover, bikes getting stalled emergency!",
        "media_urls": ["https://s3.ap-south-1.amazonaws.com/evidence/silkboard.jpg"]
    }
    result = agent.process_raw_post(urgent_tweet)
    assert result is not None, "Failed: Urgent tweet was filtered out!"
    assert result["city"] == "BLR", f"Failed: Expected BLR, got {result['city']}"
    assert result["confidence"] >= 0.70, f"Failed: Low confidence {result['confidence']}"
    assert result["urgency_score"] > 0, "Failed: Urgency was not detected"

    # Negative sample: Random non-flood tweet
    random_tweet = {
        "platform": "X_TWITTER",
        "author": "@FoodieGuy",
        "text": "Eating masala dosa at Vidyarthi Bhavan. Awesome weather in Bangalore today!",
        "media_urls": []
    }
    filtered = agent.process_raw_post(random_tweet)
    assert filtered is None, "Failed: Irrelevant tweet was not filtered!"
    print("  -> Strands OSINT Agent PASSED.")


def test_landmark_resolver():
    print("[TEST 2/4] Running Colloquial Landmark Resolver Tests...")
    resolver = LandmarkResolver()

    # Test Bengaluru landmark: Sony World Koramangala
    blr_res = resolver.resolve("Water is flowing like a river near Sony World Signal 80ft road")
    assert blr_res["matched"] is True, "Failed: Sony World landmark was not matched"
    assert blr_res["city"] == "BLR", f"Failed: City should be BLR, got {blr_res['city']}"
    assert abs(blr_res["lat"] - 12.9352) < 0.01, "Failed: Inaccurate lat"

    # Test Mumbai landmark: Milan Subway
    bom_res = resolver.resolve("Milan Subway is completely submerged, no cars allowed")
    assert bom_res["matched"] is True, "Failed: Milan Subway was not matched"
    assert bom_res["city"] == "BOM", f"Failed: City should be BOM, got {bom_res['city']}"

    # Test Delhi landmark: Minto Bridge
    del_res = resolver.resolve("Minto Bridge underpass has 3 feet water avoid Connaught place")
    assert del_res["matched"] is True, "Failed: Minto Bridge was not matched"
    assert del_res["city"] == "DEL", f"Failed: City should be DEL, got {del_res['city']}"
    print("  -> Landmark Resolver PASSED.")


def test_cv_depth_estimator():
    print("[TEST 3/4] Running Computer Vision Depth Estimator Tests...")
    estimator = CVWaterDepthEstimator()

    # Scenario A: Shallow water (tire rim partial)
    shallow = estimator.estimate_from_cues("TIRE_RIM_PARTIAL")
    assert shallow["estimated_depth_cm"] == 14
    assert shallow["severity"] == "PASSABLE"
    assert shallow["clearance_matrix"]["two_wheeler_safe"] is True

    # Scenario B: Exhaust height (bike silencer)
    exhaust = estimator.estimate_from_cues("BIKE_EXHAUST_SILENCER")
    assert exhaust["estimated_depth_cm"] == 32
    assert exhaust["severity"] == "MODERATE_RISK"
    assert exhaust["clearance_matrix"]["two_wheeler_safe"] is False
    assert exhaust["clearance_matrix"]["suv_bus_safe"] is True

    # Scenario C: Severe flood (car bonnet)
    bonnet = estimator.estimate_from_cues("CAR_BONNET_HEADLIGHTS")
    assert bonnet["estimated_depth_cm"] == 72
    assert bonnet["severity"] == "CRITICAL_NO_ENTRY"
    assert bonnet["clearance_matrix"]["suv_bus_safe"] is False
    print("  -> CV Depth Estimator PASSED.")


def test_cedar_policy_engine():
    print("[TEST 4/4] Running Cedar Policy Engine Authorization Tests...")
    evaluator = CedarEvaluator()

    # Test 1: Citizen submitting crowdsource report -> SHOULD ALLOW
    r1 = evaluator.is_authorized(
        principal_type="Role::Citizen",
        principal_id="user_123",
        action="Action::SubmitFloodReport",
        resource_type="ResourceType::IncidentReport",
        context={}
    )
    assert r1["decision"] == "ALLOW", f"Failed: Expected ALLOW, got {r1}"

    # Test 2: Citizen trying to mark road closed -> MUST FORBID
    r2 = evaluator.is_authorized(
        principal_type="Role::Citizen",
        principal_id="user_123",
        action="Action::MarkRoadBarricaded",
        resource_type="ResourceType::RoadSegment",
        context={}
    )
    assert r2["decision"] == "DENY", f"Failed: Expected DENY for citizen barricade, got {r2}"

    # Test 3: Verified police officer marking road barricaded -> SHOULD ALLOW
    r3 = evaluator.is_authorized(
        principal_type="Role::CivicAuthority",
        principal_id="traffic_cop_blr_42",
        action="Action::MarkRoadBarricaded",
        resource_type="ResourceType::RoadSegment",
        context={"hasCivicVerificationBadge": True}
    )
    assert r3["decision"] == "ALLOW", f"Failed: Expected ALLOW for verified cop, got {r3}"

    # Test 4: AI Model with low confidence (< 0.85) -> MUST DENY
    r4 = evaluator.is_authorized(
        principal_type="Agent::VisionDepthEstimator",
        principal_id="sagemaker_cv_v1",
        action="Action::PublishDepthMetric",
        resource_type="ResourceType::RoadSegment",
        context={"modelConfidence": 0.62}
    )
    assert r4["decision"] == "DENY", f"Failed: Low confidence AI should be DENIED, got {r4}"
    print("  -> Cedar Policy Engine PASSED.")


if __name__ == "__main__":
    print("==================================================")
    print(" JalMarg Phase 2 Intelligence Automated Test Suite")
    print("==================================================")
    test_strands_osint_agent()
    test_landmark_resolver()
    test_cv_depth_estimator()
    test_cedar_policy_engine()
    print("==================================================")
    print(" ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY! (4/4) ")
    print("==================================================")
