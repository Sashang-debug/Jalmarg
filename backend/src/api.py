"""One HTTP contract for local development and API Gateway proxy requests."""

import hmac
import json
import logging
import os
import re
import time
from datetime import datetime

from incident_repository import AwsRepository, json_default
from account_service import require_identity, public_profile, apply_membership, require_municipal
from municipal_service import mutate_work, citizen_feedback
from incident_service import ApiError, city_code, decode_evidence, iso, mutate_incident, new_incident, public_incident, text

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
                     "serverTime": iso(time.time()), "operatorAuth": "Cognito verified identity"}
    if method == 'GET' and path == '/me':
        return 200, {'profile': public_profile(require_identity(event, repository))}
    if method == "GET" and path == "/incidents":
        city = city_code(params.get("city", "BLR"))
        now = time.time()
        items = [i for i in repository.list(city) if datetime.fromisoformat(i["expiresAt"]).timestamp() > now]
        items.sort(key=lambda i: i["createdAt"], reverse=True)
        return 200, {"incidents": [incident_view(i, repository) for i in items],
                     "serverTime": iso(now), "mode": repository.mode}
    if method == 'GET' and path in {'/municipal/incidents','/municipal/workers'}:
        identity = require_identity(event, repository)
        city = city_code(params.get('city'))
        require_municipal(identity, city)
        if path.endswith('/workers'):
            return 200, {'workers': [{'id': p['id'], 'name': p['name']} for p in repository.list_profiles(city)
                                    if p['membership']['status'] == 'APPROVED']}
        items = sorted(repository.list(city), key=lambda i: i['createdAt'], reverse=True)
        return 200, {'incidents': [municipal_incident(i, repository) for i in items]}
    if method == 'GET' and path == '/my-reports':
        identity = require_identity(event, repository)
        items = sorted(repository.list_owned(identity['id']), key=lambda i: i['createdAt'], reverse=True)
        return 200, {'incidents': [incident_view(i, repository) for i in items]}
    if method != "POST":
        raise ApiError(404, "Endpoint not found.")
    raw = event.get("body") or "{}"
    try:
        body = json.loads(raw) if isinstance(raw, str) else raw
    except (ValueError, TypeError):
        raise ApiError(400, "Request must contain valid JSON.") from None
    if not isinstance(body, dict):
        raise ApiError(400, "Request must be a JSON object.")
    if path == '/me':
        identity = require_identity(event, repository)
        updated = {k: v for k, v in {**identity, 'name': text(body.get('name'), 'Name', 100), 'version': identity['version'] + 1}.items() if k != 'role'}
        repository.put_profile(updated, previous_version=identity['version'])
        return 200, {'profile': public_profile({**updated, 'role': identity['role']})}
    if path == '/municipal/apply':
        identity = require_identity(event, repository)
        updated = apply_membership(identity, body)
        repository.put_profile(updated, previous_version=identity['version'])
        return 201, {'profile': public_profile({**updated, 'role': 'CITIZEN'})}
    if path == "/evidence":
        identity = require_identity(event, repository)
        key, data, content_type = decode_evidence(body)
        repository.save_evidence(key, data, content_type)
        repository.own_evidence(key, identity["id"])
        return 201, {"evidenceKey": key}
    if path == "/incidents":
        identity = require_identity(event, repository)
        item = new_incident({**body, 'reporterId': identity['id']})
        item.update(ownerSub=identity['id'], workStatus='REPORTED')
        item.pop('TTL', None)  # Work and ownership survive observation expiry.
        if item['evidenceKey'] and not repository.evidence_owned(item['evidenceKey'], identity['id']):
            raise ApiError(403, 'Use a photo uploaded by your account.')
        if item["evidenceKey"] and not repository.evidence_exists(item["evidenceKey"]):
            raise ApiError(400, "Upload the photo before submitting your report.")
        repository.put(item)
        try:
            item = start_workflow(repository, item)
        except Exception:
            # Persistence succeeded. Return its truthful REPORTED status; operators can
            # review it directly even if processing was temporarily unavailable.
            logger.exception("Report persisted but processing could not start: %s", item["id"])
        return 201, {"incident": incident_view(item, repository)}
    work_match = re.fullmatch(r'/municipal/incidents/([a-f0-9-]{36})/work', path)
    if work_match:
        identity = require_identity(event, repository)
        city = city_code(body.get('city'))
        require_municipal(identity, city)
        item = repository.get(city, work_match[1])
        updated = mutate_work(item, body, identity, repository)
        repository.put(updated, previous_version=item['version'])
        return 200, {'incident': municipal_incident(updated, repository)}
    match = re.fullmatch(r"/incidents/([a-f0-9-]{36})/(review|observations)", path)
    if match:
        identity = require_identity(event, repository)
        body = {**body, "reporterId": identity["id"]}
        operator = match[2] == "review"
        if operator:
            raise ApiError(410, "Use the municipal work endpoint for reviewed resolution.")
        city = city_code(body.get("city"))
        item = repository.get(city, match[1])
        if item.get('workStatus'):
            updated = citizen_feedback(item, body, identity)
        else:
            updated = mutate_incident(item, body, operator=operator)
        repository.put(updated, previous_version=item["version"])
        return 200, {"incident": incident_view(updated, repository)}
    raise ApiError(404, "Endpoint not found.")


def incident_view(item, repository):
    result = public_incident(item, repository.photo_url(item.get('evidenceKey','')))
    if result.get('resolution'):
        result['resolution']['photoUrl'] = repository.photo_url(result['resolution']['evidenceKey'])
    for resolution in result.get('resolutionHistory', []):
        resolution['photoUrl'] = repository.photo_url(resolution['evidenceKey'])
    return result


def municipal_incident(item, repository):
    result = incident_view(item, repository)
    result['workTicket'] = item.get('workTicket')
    return result


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
