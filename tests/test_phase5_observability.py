"""
Automated Test Suite for Phase 5: Observability, Packaging & Pitch Polish
Verifies:
1. Amazon CloudWatch Metric Data Publishing
2. CloudWatch Alarm Evaluations (Critical Depth, Pump Backlog, Congestion)
3. AWS X-Ray Distributed Trace Context & Subsegment Timing
4. AWS X-Ray Incident Lifecycle Pipeline Trace (8 Microservices)
5. AWS X-Ray Service Map DAG Graph Generation
6. CloudWatch Dashboard JSON Schema Validation
"""

import sys
import os
import json
import unittest

# Add backend/src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src')))

from cloudwatch_metrics import CloudWatchMetricsEngine, CLOUDWATCH_NAMESPACE
from xray_tracer import XRayPipelineTracer, XRayTraceContext

class TestPhase5Observability(unittest.TestCase):

    def setUp(self):
        self.cw = CloudWatchMetricsEngine()
        self.tracer = XRayPipelineTracer()

    # =========================================================================
    # Test 1: CloudWatch Metric Data Emission
    # =========================================================================
    def test_cloudwatch_metrics_publishing(self):
        res = self.cw.put_incident_metrics(
            city="BLR",
            depth_cm=48.0,
            is_blocked=True,
            vehicle_type="BIKE",
            pump_dispatched=True,
            dispatch_latency_sec=22.4
        )
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["namespace"], CLOUDWATCH_NAMESPACE)
        self.assertGreaterEqual(res["metrics_published"], 3)

        payload = res["payload"]
        metric_names = [m["MetricName"] for m in payload]
        self.assertIn("WaterDepthCm", metric_names)
        self.assertIn("ActiveFloodedSegments", metric_names)
        self.assertIn("VehicleReroutes", metric_names)
        self.assertIn("PumpDispatchLatencySec", metric_names)

        # Snapshot verification
        snapshot = self.cw.get_observability_snapshot()
        self.assertEqual(snapshot["namespace"], CLOUDWATCH_NAMESPACE)
        self.assertGreaterEqual(snapshot["total_metric_events"], 1)
        self.assertEqual(snapshot["metrics"]["max_depth_cm"], 48.0)

    # =========================================================================
    # Test 2: CloudWatch Alarm Threshold Evaluation
    # =========================================================================
    def test_cloudwatch_alarms_evaluation(self):
        mock_incidents = [
            {"id": "INC_01", "roadName": "Minto Bridge", "depthCm": 68, "severity": "CRITICAL_NO_ENTRY", "pumpStatus": "QUEUE_PENDING"},
            {"id": "INC_02", "roadName": "Silk Board", "depthCm": 48, "severity": "CRITICAL_NO_ENTRY", "pumpStatus": "QUEUE_PENDING"},
            {"id": "INC_03", "roadName": "Milan Subway", "depthCm": 75, "severity": "CRITICAL_NO_ENTRY", "pumpStatus": "QUEUE_PENDING"}
        ]

        alarms = self.cw.evaluate_alarms(mock_incidents)
        self.assertEqual(len(alarms), 3)

        # Depth Alarm should trigger ALARM because max is 75 cm >= 50 cm
        depth_alarm = next(a for a in alarms if a["AlarmName"] == "JalMarg-CriticalDepthExceeded")
        self.assertEqual(depth_alarm["StateValue"], "ALARM")
        self.assertEqual(depth_alarm["CurrentValue"], 75)

        # Pump Backlog Alarm should trigger ALARM because 3 pending > 1
        pump_alarm = next(a for a in alarms if a["AlarmName"] == "JalMarg-PumpDispatchBacklog")
        self.assertEqual(pump_alarm["StateValue"], "ALARM")

        # Test OK State
        nominal_incidents = [
            {"id": "INC_04", "roadName": "Indiranagar 100ft", "depthCm": 14, "severity": "PASSABLE", "pumpStatus": "MONITORING"}
        ]
        nominal_alarms = self.cw.evaluate_alarms(nominal_incidents)
        nominal_depth_alarm = next(a for a in nominal_alarms if a["AlarmName"] == "JalMarg-CriticalDepthExceeded")
        self.assertEqual(nominal_depth_alarm["StateValue"], "OK")

    # =========================================================================
    # Test 3: AWS X-Ray Trace Context & Trace ID Format
    # =========================================================================
    def test_xray_trace_id_format(self):
        ctx = XRayTraceContext("JalMarg-TestService")
        self.assertTrue(ctx.trace_id.startswith("1-"))
        parts = ctx.trace_id.split("-")
        self.assertEqual(len(parts), 3)
        # Verify middle component is hex timestamp
        int(parts[1], 16)
        # Verify root id length
        self.assertEqual(len(ctx.root_id), 16)

    # =========================================================================
    # Test 4: AWS X-Ray Incident Lifecycle Pipeline Trace (8 Microservices)
    # =========================================================================
    def test_xray_pipeline_lifecycle_trace(self):
        trace = self.tracer.trace_incident_lifecycle(
            incident_id="INC_DEL_001",
            city="DEL",
            road_name="Minto Bridge Underpass",
            depth_cm=68,
            source="CITIZEN_PWA"
        )

        self.assertIn("trace_id", trace)
        self.assertGreater(trace["total_duration_ms"], 50)
        self.assertGreaterEqual(trace["subsegment_count"], 8)

        sub_names = [s["name"] for s in trace["subsegments"]]
        self.assertIn("Amazon-APIGateway-Ingest", sub_names)
        self.assertIn("StrandsAgents-OSINT-Parser", sub_names)
        self.assertIn("Amazon-Bedrock-LandmarkResolver", sub_names)
        self.assertIn("Amazon-SageMaker-CV-DepthEstimator", sub_names)
        self.assertIn("CedarPolicy-AuthorizationCheck", sub_names)
        self.assertIn("Amazon-OpenSearch-SpatialIndex", sub_names)
        self.assertIn("Amazon-LocationService-DetourMatrix", sub_names)
        self.assertIn("Amazon-SQS-PumpDispatchQueue", sub_names)
        self.assertIn("Amazon-Polly-AudioRadar", sub_names)

        # Validate Bedrock Subsegment metadata
        bedrock_sub = next(s for s in trace["subsegments"] if s["name"] == "Amazon-Bedrock-LandmarkResolver")
        self.assertEqual(bedrock_sub["annotations"]["model_id"], "anthropic.claude-3-haiku")

        # Validate SageMaker CV Subsegment metadata
        sagemaker_sub = next(s for s in trace["subsegments"] if s["name"] == "Amazon-SageMaker-CV-DepthEstimator")
        self.assertEqual(sagemaker_sub["annotations"]["depth_cm"], 68)

    # =========================================================================
    # Test 5: AWS X-Ray Service Map DAG Graph
    # =========================================================================
    def test_xray_service_map_graph(self):
        graph = self.tracer.get_service_map_graph()
        self.assertEqual(graph["service_name"], "JalMarg-DistributedArchitecture")
        self.assertGreaterEqual(graph["total_nodes"], 9)
        self.assertGreaterEqual(graph["total_edges"], 8)

        node_ids = [n["id"] for n in graph["nodes"]]
        self.assertIn("client", node_ids)
        self.assertIn("apigw", node_ids)
        self.assertIn("sfn", node_ids)
        self.assertIn("bedrock", node_ids)
        self.assertIn("sagemaker", node_ids)
        self.assertIn("cedar", node_ids)
        self.assertIn("opensearch", node_ids)
        self.assertIn("location", node_ids)
        self.assertIn("sqs", node_ids)
        self.assertIn("polly", node_ids)

    # =========================================================================
    # Test 6: CloudWatch Dashboard JSON Validation
    # =========================================================================
    def test_cloudwatch_dashboard_json_schema(self):
        dash_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'cloudwatch_dashboard.json'))
        self.assertTrue(os.path.exists(dash_path))
        with open(dash_path, 'r') as f:
            dash = json.load(f)
        self.assertIn("widgets", dash)
        self.assertGreaterEqual(len(dash["widgets"]), 5)
        widget_types = [w["type"] for w in dash["widgets"]]
        self.assertIn("text", widget_types)
        self.assertIn("metric", widget_types)
        self.assertIn("alarm", widget_types)


if __name__ == '__main__':
    unittest.main()
