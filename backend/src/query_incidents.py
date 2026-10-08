"""
JalMarg (जलमार्ग) - Query Incidents Lambda Function
Handles: GET /incidents?city=BLR
Fetches active flood incidents from DynamoDB for rendering the live depth heatmap.
"""

import json
import os
import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ.get("TABLE_NAME", "JalMarg_Incidents")
LOCALSTACK_HOSTNAME = os.environ.get("LOCALSTACK_HOSTNAME")
AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")

endpoint_url = f"http://{LOCALSTACK_HOSTNAME}:4566" if LOCALSTACK_HOSTNAME else None
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION, endpoint_url=endpoint_url)
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    try:
        query_params = event.get("queryStringParameters") or {}
        city = query_params.get("city", "BLR").upper()

        pk = f"CITY#{city}"

        # Query all incidents for the city
        response = table.query(
            KeyConditionExpression=Key("PK").eq(pk),
            ScanIndexForward=False, # Newest first
            Limit=50
        )

        items = response.get("Items", [])

        # Format GeoPoints into floats for client-side map rendering
        formatted_items = []
        for item in items:
            geo = item.get("GeoPoint", {})
            formatted_items.append({
                "incidentId": item.get("IncidentId"),
                "city": item.get("City"),
                "roadName": item.get("RoadName"),
                "lat": float(geo.get("lat", 0.0)),
                "lng": float(geo.get("lng", 0.0)),
                "depthCm": int(item.get("DepthCm", 0)),
                "severity": item.get("Severity", "PASSABLE"),
                "sourceType": item.get("SourceType", "UNKNOWN"),
                "createdAt": item.get("CreatedAt"),
                "photoUrl": item.get("PhotoUrl", ""),
                "status": item.get("Status", "ACTIVE"),
            })

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET,OPTIONS",
            },
            "body": json.dumps({
                "city": city,
                "count": len(formatted_items),
                "incidents": formatted_items
            }),
        }

    except Exception as e:
        print(f"[ERROR] Exception in query_incidents: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": str(e)}),
        }
