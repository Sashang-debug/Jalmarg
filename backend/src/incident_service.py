"""Validated incident domain shared by the local server and AWS Lambda."""

import base64
import hashlib
import math
import re
import time
import uuid
from datetime import datetime, timezone

CITIES = {"BLR", "BOM", "DEL", "GWL", "OTHER"}
LEVELS = {"ANKLE": (15, "Ankle-level"), "WHEEL": (30, "Wheel-level"),
          "KNEE": (50, "Knee-level"), "DEEP": (75, "Deep water")}
MAX_IMAGE_BYTES = 3 * 1024 * 1024


class ApiError(Exception):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)


def iso(epoch):
    return datetime.fromtimestamp(epoch, timezone.utc).isoformat()


def city_code(value):
    if not isinstance(value, str) or value.upper() not in CITIES:
        raise ApiError(400, "Choose a supported location area.")
    return value.upper()


def text(value, name, maximum, required=True):
    if not isinstance(value, str) or len(value.strip()) > maximum or (required and not value.strip()):
        raise ApiError(400, f"{name} must contain {'1' if required else '0'}–{maximum} characters.")
    return value.strip()


def coordinate(value, name, minimum, maximum):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ApiError(400, f"{name} must be a finite number.")
    if not minimum <= value <= maximum:
        raise ApiError(400, f"{name} is outside its valid range.")
    return float(value)


def reporter_hash(value):
    value = text(value, "Reporter identifier", 100)
    return hashlib.sha256(value.encode()).hexdigest()


def decode_evidence(body):
    if body.get("contentType") not in {"image/jpeg", "image/png", "image/webp"}:
        raise ApiError(400, "Upload a JPEG, PNG, or WebP photo.")
    encoded = body.get("data", "")
    if not isinstance(encoded, str) or len(encoded) > MAX_IMAGE_BYTES * 4 // 3 + 4:
        raise ApiError(413, "Photo must be smaller than 3 MB.")
    try:
        data = base64.b64decode(encoded, validate=True)
    except (ValueError, TypeError):
        raise ApiError(400, "Photo encoding is invalid.") from None
    valid = {"image/jpeg": data.startswith(b"\xff\xd8\xff"),
             "image/png": data.startswith(b"\x89PNG\r\n\x1a\n"),
             "image/webp": data.startswith(b"RIFF") and data[8:12] == b"WEBP"}
    if not data or len(data) > MAX_IMAGE_BYTES or not valid[body["contentType"]]:
        raise ApiError(400, "Photo contents do not match the selected image format.")
    extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[body["contentType"]]
    return f"evidence/{uuid.uuid4()}.{extension}", data, body["contentType"]


def estimate_photo_reference(reference):
    if not isinstance(reference, dict) or reference.get('confirmed') is not True:
        raise ApiError(400, 'Confirm a known-height photo reference.')
    top = coordinate(reference.get('topY'), 'Reference top', 0, 1)
    base = coordinate(reference.get('baseY'), 'Reference base', 0, 1)
    water = coordinate(reference.get('waterY'), 'Waterline', 0, 1)
    height = coordinate(reference.get('referenceHeightCm'), 'Reference height', 1, 300)
    if base - top < .05 or water > base or water < top:
        raise ApiError(400, 'Mark the reference top above its base and the waterline between them.')
    depth = math.floor(height * (base - water) / (base - top) + .5)
    if depth > 300:
        raise ApiError(400, 'This photo estimate is outside the supported range.')
    return {'depthCm': depth, 'referenceHeightCm': height, 'topY': top,
            'baseY': base, 'waterY': water, 'method': 'USER_MARKED_REFERENCE',
            'reviewStatus': 'UNVERIFIED'}


def new_incident(body, now=None):
    now = time.time() if now is None else now
    city = city_code(body.get("city"))
    level = body.get("waterLevel")
    if not isinstance(level, str) or level not in LEVELS:
        raise ApiError(400, "Choose an observed water level.")
    depth, label = LEVELS[level]
    evidence = body.get("evidenceKey", "")
    if not isinstance(evidence, str) or (evidence and not re.fullmatch(r"evidence/[a-f0-9-]{36}\.(jpg|png|webp)", evidence)):
        raise ApiError(400, "Evidence reference is invalid.")
    photo_estimate = None
    if body.get('photoReference') is not None:
        if not evidence:
            raise ApiError(400, 'Attach the photo used for the reference estimate.')
        photo_estimate = estimate_photo_reference(body['photoReference'])
    routing_depth = max(depth, photo_estimate['depthCm']) if photo_estimate else depth
    incident_id = str(uuid.uuid4())
    return {
        "PK": f"CITY#{city}", "SK": f"INCIDENT#{incident_id}",
        "id": incident_id, "city": city,
        "roadName": text(body.get("roadName"), "Road or landmark", 160),
        "lat": coordinate(body.get("lat"), "Latitude", -90, 90),
        "lng": coordinate(body.get("lng"), "Longitude", -180, 180),
        "waterLevel": level, "waterLevelLabel": label, "depthCm": routing_depth, "observedDepthCm": depth,
        "photoEstimate": photo_estimate,
        "depthSource": "PHOTO_REFERENCE" if photo_estimate else "CITIZEN_OBSERVATION", "locationSource": "CITIZEN_PIN",
        "severity": "CRITICAL_NO_ENTRY" if routing_depth >= 35 else "MODERATE_RISK",
        "notes": text(body.get("notes", ""), "Notes", 600, required=False),
        "evidenceKey": evidence, "reporterHash": reporter_hash(body.get("reporterId")),
        "status": "REPORTED", "version": 1,
        "createdAt": iso(now), "updatedAt": iso(now), "expiresAt": iso(now + 4 * 3600),
        "TTL": int(now + 7 * 86400), "observations": [], "workTicket": None,
        "timeline": [{"at": iso(now), "kind": "REPORTED", "status": "REPORTED",
                      "message": "Citizen observation received; water level is approximate."}],
    }


def public_incident(item, photo_url=""):
    return {**{k: v for k, v in item.items() if k not in {"PK", "SK", "TTL", "reporterHash", "observations"}},
            "photoUrl": photo_url, "reportCount": 1,
            "stillFloodedCount": sum(o["kind"] == "STILL_FLOODED" for o in item["observations"]),
            "recededCount": sum(o["kind"] == "RECEDED" for o in item["observations"])}


def mutate_incident(item, body, operator=False, now=None):
    now = time.time() if now is None else now
    if datetime.fromisoformat(item["expiresAt"]).timestamp() <= now:
        raise ApiError(409, "This report has expired. Submit a fresh observation.")
    if item["status"] == "CLEARED":
        raise ApiError(409, "This report is already cleared. Submit a fresh observation.")
    action = body.get("action")
    status = item["status"]
    ticket = item.get("workTicket")
    observations = list(item["observations"])
    note = text(body.get("note", ""), "Review note", 300, required=False)
    if operator:
        if action == "CONFIRM" and status in {"REPORTED", "NEEDS_REVIEW"}:
            status, message = "CONFIRMED", "Operator reviewed the report and confirmed waterlogging."
        elif action == "CLEAR" and status in {"REPORTED", "NEEDS_REVIEW", "CONFIRMED"}:
            status, message = "CLEARED", "Operator reviewed current conditions and cleared the report."
        elif action == "CREATE_TICKET" and status == "CONFIRMED" and not ticket:
            ticket = {"id": f"JM-{item['id'][:8].upper()}", "status": "AWAITING_ASSIGNMENT", "createdAt": iso(now)}
            message = "Review ticket created. No municipal pump has been dispatched."
        else:
            raise ApiError(409, "That action is not available for this report's current status.")
    else:
        if action not in {"STILL_FLOODED", "RECEDED"}:
            raise ApiError(400, "Choose still flooded or water receded.")
        identity = reporter_hash(body.get("reporterId"))
        if identity == item["reporterHash"] or any(o["reporterHash"] == identity for o in observations):
            raise ApiError(409, "This browser has already contributed to this report.")
        if len(observations) >= 100:
            raise ApiError(409, "This report has enough follow-up observations; submit a new report.")
        observations.append({"kind": action, "reporterHash": identity, "at": iso(now)})
        message = "Citizen reports water still present." if action == "STILL_FLOODED" else "Citizen reports receding water; operator review requested."
        if action == "RECEDED":
            status = "NEEDS_REVIEW"
    return {**item, "status": status, "observations": observations, "workTicket": ticket,
            "updatedAt": iso(now), "version": item["version"] + 1,
            "timeline": [*item["timeline"], {"at": iso(now), "kind": action, "status": status,
                                            "message": message, "note": note}]}
