"""
JalMarg (जलमार्ग) - Phase 3 Spatial, Routing & Event Plumbing Automated Test Suite
Tests:
1. OpenSearch Spatial Indexer (polygon collision & radius proximity)
2. Amazon Location Service Dynamic Route Engine (2-Wheeler vs SUV rerouting)
3. Step Functions ASL State Machine schema validation
4. Amazon Polly Vernacular Audio Synthesizer (Hindi & English SSML)
5. WhatsApp Voice-Note Processing Pipeline
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.src.spatial_index import OpenSearchSpatialIndex
from backend.src.route_engine import DynamicRouteEngine
from backend.src.polly_audio import PollyAudioAlertEngine
from backend.src.whatsapp_voice_handler import WhatsAppVoiceHandler


def test_spatial_index():
    print("[TEST 1/5] Running OpenSearch Spatial Indexing Tests...")
    spatial = OpenSearchSpatialIndex()

    # Index flooded zone at Silk Board (Lat: 12.9176, Lng: 77.6238) with 100m radius
    spatial.index_flood_polygon(
        zone_id="ZONE_BLR_SILKBOARD",
        road_name="Silk Board Junction",
        center_lat=12.9176,
        center_lng=77.6238,
        radius_meters=100.0,
        depth_cm=45,
        severity="CRITICAL_NO_ENTRY"
    )

    # Route A intersects Silk Board (waypoint is 50m away)
    route_colliding = [
        {"lat": 12.9200, "lng": 77.6200},
        {"lat": 12.9177, "lng": 77.6239}, # Collision
        {"lat": 12.9150, "lng": 77.6280}
    ]
    hazards_a = spatial.find_hazards_near_route(route_colliding)
    assert len(hazards_a) == 1, f"Failed: Hazard should be detected, got {len(hazards_a)}"
    assert hazards_a[0]["zone_id"] == "ZONE_BLR_SILKBOARD"

    # Route B is 3km away (Whitefield) -> Should NOT collide
    route_clear = [
        {"lat": 12.9698, "lng": 77.7499},
        {"lat": 12.9800, "lng": 77.7550}
    ]
    hazards_b = spatial.find_hazards_near_route(route_clear)
    assert len(hazards_b) == 0, f"Failed: No hazard should be detected on Whitefield route"
    print("  -> OpenSearch Spatial Indexing PASSED.")


def test_dynamic_route_engine():
    print("[TEST 2/5] Running Vehicle Dynamic Routing Engine Tests...")
    spatial = OpenSearchSpatialIndex()

    # Index submerged underpass: 35 cm water at Koramangala
    spatial.index_flood_polygon(
        zone_id="ZONE_KORAMANGALA",
        road_name="Koramangala 80ft Road",
        center_lat=12.9352,
        center_lng=77.6245,
        radius_meters=150.0,
        depth_cm=35,
        severity="CRITICAL_NO_ENTRY"
    )

    router = DynamicRouteEngine(spatial)

    origin = {"lat": 12.9400, "lng": 77.6200}
    destination = {"lat": 12.9300, "lng": 77.6300}
    direct_path = [origin, {"lat": 12.9352, "lng": 77.6245}, destination]

    # Test 1: 2-Wheeler (Clearance: 20cm) -> 35cm exceeds clearance -> MUST DETOUR
    bike_route = router.calculate_route(origin, destination, vehicle_type="BIKE", direct_waypoints=direct_path)
    assert bike_route["is_detour"] is True, "Failed: 2-Wheeler must be detoured around 35cm flood!"
    assert bike_route["route_status"] == "DETOUR_REQUIRED"

    # Test 2: SUV (Clearance: 55cm) -> 35cm is within clearance -> CAN GO DIRECT
    suv_route = router.calculate_route(origin, destination, vehicle_type="SUV", direct_waypoints=direct_path)
    assert suv_route["is_detour"] is False, "Failed: SUV should take direct route (35cm < 55cm limit)!"
    assert suv_route["route_status"] == "DIRECT_SAFE"
    print("  -> Vehicle Dynamic Routing Engine PASSED.")


def test_step_functions_asl():
    print("[TEST 3/5] Running Step Functions ASL Schema Validation...")
    asl_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "step_functions", "incident_pipeline.json"))
    with open(asl_path, "r") as f:
        asl_data = json.load(f)

    assert "StartAt" in asl_data, "Missing StartAt in State Machine"
    assert "States" in asl_data, "Missing States in State Machine"
    assert asl_data["StartAt"] == "EvaluateCedarAuthorization"
    assert "EvaluateCedarAuthorization" in asl_data["States"]
    assert "ParallelCriticalDispatch" in asl_data["States"]
    assert "CompleteIncidentWorkflow" in asl_data["States"]
    print("  -> Step Functions ASL Schema PASSED.")


def test_polly_audio_engine():
    print("[TEST 4/5] Running Amazon Polly Vernacular Audio Alert Engine Tests...")
    polly = PollyAudioAlertEngine()

    # Test Hindi synthesis payload
    hi_alert = polly.synthesize(road_name="सिल्क बोर्ड फ्लाईओवर", depth_cm=48, distance_meters=200, lang="HI")
    assert hi_alert["voice_id"] == "Aditi"
    assert "48 सेंटीमीटर" in hi_alert["ssml"]
    assert "सावधान" in hi_alert["plain_text"]

    # Test English synthesis payload
    en_alert = polly.synthesize(road_name="Minto Bridge Underpass", depth_cm=65, distance_meters=150, lang="EN_IN")
    assert en_alert["voice_id"] == "Kajal"
    assert "65 centimeters" in en_alert["ssml"]
    print("  -> Amazon Polly Vernacular Audio Engine PASSED.")


def test_whatsapp_voice_handler():
    print("[TEST 5/5] Running WhatsApp Voice Note Ingestion Tests...")
    handler = WhatsAppVoiceHandler()

    voice_transcript = "Bhaiya, Marathahalli bridge ke neeche car ke bonnet tak paani aa gaya hai, koi mat aao!"
    result = handler.process_voice_note(
        sender_phone="+919876543210",
        audio_transcript=voice_transcript,
        city_hint="BLR"
    )

    assert result["source"] == "WHATSAPP_VOICE_NOTE"
    assert "Marathahalli" in result["resolved_location"]["road_name"]
    assert result["flood_metrics"]["depth_cm"] >= 70, f"Failed: Bonnet depth should be >= 70cm, got {result['flood_metrics']['depth_cm']}"
    assert result["flood_metrics"]["severity"] == "CRITICAL_NO_ENTRY"
    print("  -> WhatsApp Voice Note Pipeline PASSED.")


if __name__ == "__main__":
    print("==================================================")
    print(" JalMarg Phase 3 Spatial & Plumbing Test Suite   ")
    print("==================================================")
    test_spatial_index()
    test_dynamic_route_engine()
    test_step_functions_asl()
    test_polly_audio_engine()
    test_whatsapp_voice_handler()
    print("==================================================")
    print(" ALL PHASE 3 TESTS COMPLETED SUCCESSFULLY! (5/5) ")
    print("==================================================")
