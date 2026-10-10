"""One HTTP contract for local development and API Gateway proxy requests."""

import hmac
import json
import logging
import os
import re
import time
from datetime import datetime

from incident_repository import AwsRepository, json_default
from incident_service import ApiError, city_code, decode_evidence, iso, mutate_incident, new_incident, public_incident

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
_repository = None


def operator_authorized(event, mode):
    if mode == "local":
        expected = os.environ.get("LOCAL_OPERATOR_TOKEN", "")
        headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
        return bool(expected) and hmac.compare_digest(headers.get("authorization", ""), f"Bearer {expected}")
    # Claims are supplied by API Gateway's Cognito authorizer, never by request JSON.
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
    groups = claims.get("cognito:groups", "")
    if isinstance(groups, str):
        groups = groups.strip("[]").replace('"', '').split(",")
    return ("civic-operators" in [g.strip() for g in groups]
            and claims.get("aud") == os.environ.get("OPERATOR_CLIENT_ID"))


def start_workflow(repository, incident):
    if repository.mode == "local":
        return process_report(repository, incident["city"], incident["id"])
    import boto3
    client = boto3.client("stepfunctions", config=repository.config)
    client.start_execution(stateMachineArn=os.environ["WORKFLOW_ARN"], name=incident["id"],
                           input=json.dumps({"city": incident["city"], "id": incident["id"]}))
    return incident


def process_report(repository, city, incident_id):
    item = repository.get(city, incident_id)
    # Retries cannot overwrite a later human review or add duplicate audit events.
    if item["status"] != "REPORTED":
        return item
    now = iso(time.time())
    updated = {**item, "version": item["version"] + 1, "status": "NEEDS_REVIEW", "updatedAt": now,
               "timeline": [*item["timeline"], {"at": now, "kind": "PROCESSING_COMPLETE", "status": "NEEDS_REVIEW",
                    "message": "Location and observation validated. Awaiting an operator's evidence review."}]}
    repository.put(updated, previous_version=item["version"])
    return updated


def route_request(event, repository):
    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").removeprefix("/api").rstrip("/")
    params = event.get("queryStringParameters") or {}
    if method == "GET" and path == "/health":
        return 200, {"status": "ok", "mode": repository.mode, "storage": "DynamoDB + private S3" if repository.mode == "aws" else "SQLite + local evidence",
                     "serverTime": iso(time.time()), "operatorAuth": "Cognito" if repository.mode == "aws" else "local development token"}
    if method == "GET" and path == "/incidents":
        city = city_code(params.get("city", "BLR"))
        now = time.time()
        items = [i for i in repository.list(city) if int(i["TTL"]) > now]
        items.sort(key=lambda i: i["createdAt"], reverse=True)
        return 200, {"incidents": [public_incident(i, repository.photo_url(i.get("evidenceKey", ""))) for i in items],
                     "serverTime": iso(now), "mode": repository.mode}
    if method != "POST":
        raise ApiError(404, "Endpoint not found.")
    raw = event.get("body") or "{}"
    try:
        body = json.loads(raw) if isinstance(raw, str) else raw
    except (ValueError, TypeError):
        raise ApiError(400, "Request must contain valid JSON.") from None
    if not isinstance(body, dict):
        raise ApiError(400, "Request must be a JSON object.")
    if path == "/evidence":
        key, data, content_type = decode_evidence(body)
        repository.save_evidence(key, data, content_type)
        return 201, {"evidenceKey": key}
    if path == "/incidents":
        item = new_incident(body)
        if item["evidenceKey"] and not repository.evidence_exists(item["evidenceKey"]):
            raise ApiError(400, "Upload the photo before submitting your report.")
        repository.put(item)
        try:
            item = start_workflow(repository, item)
        except Exception:
            # Persistence succeeded. Return its truthful REPORTED status; operators can
            # review it directly even if processing was temporarily unavailable.
            logger.exception("Report persisted but processing could not start: %s", item["id"])
        return 201, {"incident": public_incident(item, repository.photo_url(item["evidenceKey"]))}
    match = re.fullmatch(r"/incidents/([a-f0-9-]{36})/(review|observations)", path)
    if match:
        operator = match[2] == "review"
        if operator and not operator_authorized(event, repository.mode):
            raise ApiError(403, "An authenticated civic operator is required.")
        city = city_code(body.get("city"))
        item = repository.get(city, match[1])
        updated = mutate_incident(item, body, operator=operator)
        repository.put(updated, previous_version=item["version"])
        return 200, {"incident": public_incident(updated, repository.photo_url(updated["evidenceKey"]))}
    raise ApiError(404, "Endpoint not found.")


def handle(event, repository):
    started = time.monotonic()
    try:
        status, payload = route_request(event, repository)
    except ApiError as exc:
        status, payload = exc.status, {"error": str(exc)}
    except Exception:
        logger.exception("Incident API request failed")
        status, payload = 503, {"error": "The incident service is temporarily unavailable. Please retry."}
    elapsed = round((time.monotonic() - started) * 1000, 2)
    logger.info(json.dumps({"path": event.get("path"), "status": status, "durationMs": elapsed,
                            "incidentId": payload.get("incident", {}).get("id")}))
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Cache-Control": "no-store",
             "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGIN", "http://localhost:5173"),
             "Access-Control-Allow-Headers": "Content-Type,Authorization", "X-Content-Type-Options": "nosniff"},
            "body": json.dumps(payload, default=json_default)}


def lambda_handler(event, context):
    global _repository
    if _repository is None:
        _repository = AwsRepository()
    return handle(event, _repository)


def process_handler(event, context):
    global _repository
    if _repository is None:
        _repository = AwsRepository()
    item = process_report(_repository, city_code(event["city"]), event["id"])
    return {"id": item["id"], "city": item["city"], "status": item["status"]}
