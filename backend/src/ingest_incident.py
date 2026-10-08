"""
JalMarg (जलमार्ग) - Ingest Incident Lambda Function
Handles: POST /incidents
Ingests citizen reports, computes severity thresholds, persists to DynamoDB with TTL,
and emits domain events to Amazon EventBridge.
"""

import json
import os
import time
import uuid
import boto3
from datetime import datetime, timezone

# Environment Variables
TABLE_NAME = os.environ.get("TABLE_NAME", "JalMarg_Incidents")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "jalmarg-event-bus")
LOCALSTACK_HOSTNAME = os.environ.get("LOCALSTACK_HOSTNAME")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")

# Configure Boto3 clients with LocalStack fallback if running locally
endpoint_url = f"http://{LOCALSTACK_HOSTNAME}:4566" if LOCALSTACK_HOSTNAME else None
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION, endpoint_url=endpoint_url)
events_client = boto3.client("events", region_name=AWS_REGION, endpoint_url=endpoint_url)
table = dynamodb.Table(TABLE_NAME)


def calculate_severity(depth_cm: int) -> str:
    """Calculates hazard classification based on centimeter depth."""
    if depth_cm >= 35:
        return "CRITICAL_NO_ENTRY"
    elif depth_cm >= 15:
        return "MODERATE_RISK"
    else:
        return "PASSABLE"


def lambda_handler(event, context):
    try:
        # Parse body
        body = json.loads(event.get("body", "{}")) if isinstance(event.get("body"), str) else (event.get("body") or {})

        # Extract required fields with defaults
        city = body.get("city", "BLR").upper()
        road_name = body.get("road_name", "Unknown Road")
        lat = float(body.get("lat", 12.9716))
        lng = float(body.get("lng", 77.5946))
        depth_cm = int(body.get("depth_cm", 0))
        source_type = body.get("source_type", "CITIZEN_PWA")
        reported_by = body.get("reported_by", "anonymous_commuter")
        photo_url = body.get("photo_url", "")
        audio_transcript = body.get("audio_transcript", "")

        severity = body.get("severity") or calculate_severity(depth_cm)

        # Generate IDs and timestamps
        incident_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        current_epoch = int(time.time())
        ttl_epoch = current_epoch + (4 * 3600)  # Auto-expire after 4 hours

        # Partition Key & Sort Key for single-table DynamoDB design
        pk = f"CITY#{city}"
        sk = f"INCIDENT#{now_iso}#{incident_id}"

        item = {
            "PK": pk,
            "SK": sk,
            "IncidentId": incident_id,
            "City": city,
            "RoadName": road_name,
            "GeoPoint": {"lat": str(lat), "lng": str(lng)},
            "DepthCm": depth_cm,
            "Severity": severity,
            "SourceType": source_type,
            "ReportedBy": reported_by,
            "PhotoUrl": photo_url,
            "AudioTranscript": audio_transcript,
            "CreatedAt": now_iso,
            "TTL": ttl_epoch,
            "Status": "ACTIVE",
        }

        # Write to DynamoDB
        table.put_item(Item=item)

        # Emit domain event to EventBridge
        detail_payload = {
            "incidentId": incident_id,
            "city": city,
            "roadName": road_name,
            "lat": lat,
            "lng": lng,
            "depthCm": depth_cm,
            "severity": severity,
            "sourceType": source_type,
            "createdAt": now_iso,
        }

        try:
            events_client.put_events(
                Entries=[
                    {
                        "Source": "jalmarg.incident",
                        "DetailType": "IncidentReported",
                        "Detail": json.dumps(detail_payload),
                        "EventBusName": EVENT_BUS_NAME,
                    }
                ]
            )
        except Exception as eb_err:
            print(f"[WARN] EventBridge PutEvents failed (non-critical in local mode): {eb_err}")

        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            "body": json.dumps({
                "message": "Incident logged successfully",
                "incident": item
            }),
        }

    except Exception as e:
        print(f"[ERROR] Exception in ingest_incident: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": str(e)}),
        }
