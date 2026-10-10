"""Authenticated identity, profiles and explicit municipal membership."""
import os
import time
import logging
import math
from datetime import datetime, timezone
from incident_service import ApiError, city_code, iso, text

_jwks = None


def verified_claims(event, mode):
    if mode == 'aws':
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    else:
        # Local mode also verifies real Cognito JWTs; no development role header.
        headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
        token = headers.get('authorization', '').removeprefix('Bearer ')
        if not token or not os.environ.get('USER_POOL_ID'):
            return {}
        import jwt
        global _jwks
        issuer = f"https://cognito-idp.{os.environ.get('AWS_REGION', 'ap-south-1')}.amazonaws.com/{os.environ['USER_POOL_ID']}"
        try:
            if _jwks is None:
                _jwks = jwt.PyJWKClient(f'{issuer}/.well-known/jwks.json', timeout=5)
            claims = jwt.decode(token, _jwks.get_signing_key_from_jwt(token).key,
                                algorithms=['RS256'], audience=os.environ['OPERATOR_CLIENT_ID'], issuer=issuer)
        except jwt.PyJWTError:
            return {}
    try:
        expires = float(claims.get('exp', 0))
    except (ValueError, TypeError):
        # REST Cognito authorizers render exp as e.g. Sat Oct 10 20:07:37 UTC 2026.
        # Accept this exact trusted Gateway format only; local JWTs use NumericDate.
        try:
            if mode != 'aws':
                return {}
            expires = datetime.strptime(claims['exp'], '%a %b %d %H:%M:%S UTC %Y').replace(tzinfo=timezone.utc).timestamp()
        except (ValueError, TypeError, KeyError):
            logging.getLogger(__name__).warning('Rejected identity: unsupported expiry claim format')
            return {}
    if (not claims.get('sub') or claims.get('aud') != os.environ.get('OPERATOR_CLIENT_ID')
            or claims.get('token_use') != 'id' or str(claims.get('email_verified')).lower() != 'true'
            or not math.isfinite(expires) or not expires > time.time()):
        logging.getLogger(__name__).warning('Rejected identity: hasSubject=%s audienceMatches=%s tokenKind=%s verifiedEmail=%s expiryValid=%s keys=%s',
            bool(claims.get('sub')), claims.get('aud') == os.environ.get('OPERATOR_CLIENT_ID'),
            claims.get('token_use'), str(claims.get('email_verified')).lower() == 'true', expires > time.time(), sorted(claims))
        return {}
    return claims


def require_identity(event, repository):
    claims = verified_claims(event, repository.mode)
    if not claims:
        raise ApiError(401, 'Sign in with a verified account to continue.')
    sub = claims['sub']
    profile = repository.get_profile(sub)
    if not profile:
        profile = {'id': sub, 'name': str(claims.get('name') or 'Citizen')[:100],
                   'email': claims.get('email', ''), 'membership': None, 'version': 1, 'createdAt': iso(time.time())}
        try:
            repository.put_profile(profile)
        except ApiError as error:
            if error.status != 409:
                raise
            profile = repository.get_profile(sub)
    groups = claims.get('cognito:groups', [])
    if isinstance(groups, str):
        groups = [g.strip(' []"') for g in groups.split(',')]
    member = profile.get('membership') or {}
    municipal = member.get('status') == 'APPROVED' and 'civic-operators' in groups
    return {**profile, 'role': 'MUNICIPAL' if municipal else 'CITIZEN'}


def require_municipal(identity, city):
    if identity['role'] != 'MUNICIPAL' or identity['membership']['city'] != city:
        raise ApiError(403, 'Approved municipal access for this city is required.')


def apply_membership(identity, body):
    previous = identity.get('membership') or {}
    if previous.get('status') in {'PENDING', 'APPROVED', 'SUSPENDED'}:
        raise ApiError(409, 'Your existing municipal access request cannot be replaced.')
    member = {'city': city_code(body.get('city')), 'corporation': text(body.get('corporation'), 'Corporation', 120),
              'ward': text(body.get('ward'), 'Ward or service area', 100),
              'employeeId': text(body.get('employeeId'), 'Employee identifier', 80),
              'status': 'PENDING', 'requestedAt': iso(time.time())}
    return {k: v for k, v in {**identity, 'membership': member, 'version': identity['version'] + 1}.items() if k != 'role'}


def public_profile(identity):
    return {k: v for k, v in identity.items() if k not in {'PK', 'SK', 'directoryCity', 'version'}}
