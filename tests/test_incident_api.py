"""Behavioral tests for the shared incident API; no AWS credentials required."""
import base64
import json
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend' / 'src'))
from api import handle, operator_authorized, process_report
from account_service import verified_claims
from incident_repository import LocalRepository
from incident_service import ApiError, new_incident


class IncidentApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.repo = LocalRepository(self.directory.name)
        env = patch.dict(os.environ, {'OPERATOR_CLIENT_ID': 'test-client'})
        env.start(); self.addCleanup(env.stop)
        auth = patch('account_service.verified_claims', side_effect=lambda event, mode: verified_claims(event, 'aws'))
        auth.start(); self.addCleanup(auth.stop)
        self.body = {'city': 'BLR', 'roadName': 'Silk Board', 'lat': 12.9176, 'lng': 77.6238,
                     'waterLevel': 'KNEE', 'reporterId': 'browser-one', 'notes': 'Underpass water'}

    def request(self, method, path, body=None, token='', repository=None):
        event = {'httpMethod': method, 'path': path, 'body': json.dumps(body or {}),
                 'queryStringParameters': {'city': 'BLR'}, 'headers': {'Authorization': f'Bearer {token}'},
                 'requestContext': {'authorizer': {'claims': {'sub': (body or {}).get('reporterId', 'browser-one'),
                    'aud': 'test-client', 'token_use': 'id', 'email_verified': 'true', 'exp': int(time.time()) + 3600}}}}
        response = handle(event, repository or self.repo)
        return response['statusCode'], json.loads(response['body'])

    def create(self):
        status, result = self.request('POST', '/incidents', self.body)
        self.assertEqual(status, 201)
        return result['incident']

    def test_cross_session_and_restart_persistence(self):
        item = self.create()
        second_session = LocalRepository(self.directory.name)
        status, result = self.request('GET', '/incidents', repository=second_session)
        self.assertEqual(status, 200)
        self.assertEqual(result['incidents'][0]['id'], item['id'])
        self.assertEqual(item['status'], 'NEEDS_REVIEW')
        self.assertNotIn('reporterHash', result['incidents'][0])
        self.assertEqual(len(item['timeline']), 2)

    def test_gwalior_and_other_location_reports_round_trip(self):
        for city, lat, lng in [('GWL', 26.24994883, 78.16930248), ('OTHER', 22.57, 88.36)]:
            with self.subTest(city=city):
                self.body.update(city=city, lat=lat, lng=lng, roadName='Selected local road', reporterId=city)
                item = self.create()
                event = {'httpMethod': 'GET', 'path': '/incidents', 'queryStringParameters': {'city': city}}
                response = handle(event, self.repo)
                self.assertEqual(response['statusCode'], 200)
                records = json.loads(response['body'])['incidents']
                self.assertEqual([record['id'] for record in records], [item['id']])
                self.assertEqual(records[0]['city'], city)
                self.assertEqual(records[0]['lat'], lat)

    def test_photo_reference_recomputes_depth_and_retains_provenance(self):
        _, result = self.request('POST', '/evidence', {'contentType': 'image/jpeg', 'data': base64.b64encode(b'\xff\xd8\xffexample').decode()})
        self.body.update(evidenceKey=result['evidenceKey'], waterLevel='ANKLE', photoReference={
            'topY': .2, 'baseY': .8, 'waterY': .4, 'referenceHeightCm': 60, 'confirmed': True, 'depthCm': 2})
        item = self.create()
        self.assertEqual(item['depthCm'], 40)
        self.assertEqual(item['observedDepthCm'], 15)
        self.assertEqual(item['depthSource'], 'PHOTO_REFERENCE')
        self.assertEqual(item['photoEstimate']['reviewStatus'], 'UNVERIFIED')
        _, result = self.request('GET', '/incidents')
        self.assertEqual(result['incidents'][0]['photoEstimate']['depthCm'], 40)

    def test_photo_estimate_cannot_reduce_observed_depth(self):
        body = {**self.body, 'evidenceKey': 'evidence/12345678-1234-1234-1234-123456789012.jpg',
                'photoReference': {'topY': .2, 'baseY': .8, 'waterY': .7, 'referenceHeightCm': 60, 'confirmed': True}}
        item = new_incident(body)
        self.assertEqual(item['depthCm'], 50)
        self.assertEqual(item['photoEstimate']['depthCm'], 10)

    def test_photo_reference_rejects_invalid_geometry_and_missing_photo(self):
        reference = {'topY': .2, 'baseY': .8, 'waterY': .5, 'referenceHeightCm': 60, 'confirmed': True}
        status, _ = self.request('POST', '/incidents', {**self.body, 'photoReference': reference})
        self.assertEqual(status, 400)
        for fields in [{'confirmed': False}, {'topY': -.1}, {'baseY': .21}, {'waterY': .9}, {'waterY': .1}, {'referenceHeightCm': True}]:
            with self.subTest(fields=fields), self.assertRaises(ApiError):
                new_incident({**self.body, 'evidenceKey': 'evidence/12345678-1234-1234-1234-123456789012.jpg',
                              'photoReference': {**reference, **fields}})

    def test_clients_cannot_supply_verified_status_or_severity(self):
        self.body.update(status='CONFIRMED', severity='PASSABLE', depth_cm=-50)
        item = self.create()
        self.assertEqual(item['status'], 'NEEDS_REVIEW')
        self.assertEqual(item['severity'], 'CRITICAL_NO_ENTRY')
        self.assertEqual(item['depthCm'], 50)

    def test_validation_rejects_bad_inputs(self):
        for fields in [{'lat': -91}, {'lng': 181}, {'lat': float('nan')}, {'lat': True},
                       {'waterLevel': 'UNKNOWN'}, {'roadName': ''}, {'city': 'UNKNOWN_CITY'},
                       {'notes': 'a' * 601}, {'evidenceKey': '../secret'}]:
            with self.subTest(fields=fields):
                status, _ = self.request('POST', '/incidents', {**self.body, **fields})
                self.assertEqual(status, 400)
        self.assertEqual(self.request('GET', '/incidents')[1]['incidents'], [])

    def test_unauthorized_review_cannot_change_report(self):
        item = self.create()
        with patch.dict(os.environ, {'LOCAL_OPERATOR_TOKEN': 'correct'}):
            for token in ['', 'incorrect']:
                status, _ = self.request('POST', f"/incidents/{item['id']}/review", {'city': 'BLR', 'action': 'CONFIRM'}, token)
                self.assertEqual(status, 410)
        self.assertEqual(self.repo.get('BLR', item['id'])['status'], 'NEEDS_REVIEW')

    def test_legacy_review_cannot_bypass_municipal_workflow(self):
        item = self.create()
        with patch.dict(os.environ, {'LOCAL_OPERATOR_TOKEN': 'correct'}):
            self.assertEqual(self.request('POST', f"/incidents/{item['id']}/review", {'city': 'BLR', 'action': 'CLEAR'}, 'correct')[0], 410)
        self.assertEqual(self.repo.get('BLR', item['id'])['status'], 'NEEDS_REVIEW')

    def test_receded_observation_never_auto_clears(self):
        item = self.create()
        status, result = self.request('POST', f"/incidents/{item['id']}/observations",
                                     {'city': 'BLR', 'action': 'RECEDED', 'reporterId': 'browser-two'})
        self.assertEqual(status, 200)
        self.assertEqual(result['incident']['status'], 'NEEDS_REVIEW')
        self.assertEqual(result['incident']['recededCount'], 1)
        status, _ = self.request('POST', f"/incidents/{item['id']}/observations",
                                {'city': 'BLR', 'action': 'STILL_FLOODED', 'reporterId': 'browser-two'})
        self.assertEqual(status, 200)
        self.assertEqual(result['incident']['status'], 'NEEDS_REVIEW')

    def test_original_reporter_cannot_self_corroborate(self):
        item = self.create()
        status, _ = self.request('POST', f"/incidents/{item['id']}/observations", {'city': 'BLR', 'action': 'STILL_FLOODED', 'reporterId': 'browser-one'})
        self.assertEqual(status, 409)

    def test_expired_report_cannot_be_confirmed(self):
        item = new_incident(self.body, now=time.time() - 5 * 3600)
        self.repo.put(item)
        with patch.dict(os.environ, {'LOCAL_OPERATOR_TOKEN': 'correct'}):
            status, _ = self.request('POST', f"/incidents/{item['id']}/review", {'city': 'BLR', 'action': 'CONFIRM'}, 'correct')
        self.assertEqual(status, 410)

    def test_optimistic_update_prevents_lost_observations(self):
        item = self.create()
        original = self.repo.get('BLR', item['id'])
        changed = {**original, 'version': original['version'] + 1}
        self.repo.put(changed, previous_version=original['version'])
        with self.assertRaises(ApiError) as result:
            self.repo.put(changed, previous_version=original['version'])
        self.assertEqual(result.exception.status, 409)

    def test_workflow_is_idempotent_and_preserves_review(self):
        item = self.create()
        process_report(self.repo, 'BLR', item['id'])
        self.assertEqual(len(self.repo.get('BLR', item['id'])['timeline']), 2)
        with patch.dict(os.environ, {'LOCAL_OPERATOR_TOKEN': 'correct'}):
            self.request('POST', f"/incidents/{item['id']}/review", {'city': 'BLR', 'action': 'CONFIRM'}, 'correct')
        self.assertEqual(process_report(self.repo, 'BLR', item['id'])['status'], 'NEEDS_REVIEW')

    def test_evidence_upload_reference_and_private_storage(self):
        data = b'\x89PNG\r\n\x1a\n' + b'example'
        status, result = self.request('POST', '/evidence', {'data': base64.b64encode(data).decode(), 'contentType': 'image/png'})
        self.assertEqual(status, 201)
        self.body['evidenceKey'] = result['evidenceKey']
        item = self.create()
        self.assertTrue(item['photoUrl'].startswith('/api/evidence/'))
        self.assertEqual((Path(self.directory.name) / result['evidenceKey']).read_bytes(), data)

    def test_invalid_evidence_rejected(self):
        for data, content_type in [('bad!', 'image/png'), (base64.b64encode(b'<script>').decode(), 'image/jpeg'), ('', 'image/svg+xml')]:
            self.assertEqual(self.request('POST', '/evidence', {'data': data, 'contentType': content_type})[0], 400)

    def test_workflow_failure_preserves_truthful_report(self):
        with patch('api.start_workflow', side_effect=RuntimeError('service unavailable')):
            item = self.create()
        self.assertEqual(item['status'], 'REPORTED')
        self.assertEqual(self.repo.get('BLR', item['id'])['status'], 'REPORTED')

    def test_cognito_requires_gateway_claims_group_and_client(self):
        with patch.dict(os.environ, {'OPERATOR_CLIENT_ID': 'expected'}):
            self.assertFalse(operator_authorized({'headers': {'Authorization': 'fake'}, 'body': {'role': 'civic-operators'}}, 'aws'))
            for group, client, expected in [('civic-operators', 'expected', True), ('citizens', 'expected', False), ('civic-operators', 'wrong', False)]:
                event = {'requestContext': {'authorizer': {'claims': {'cognito:groups': group, 'aud': client}}}}
                self.assertEqual(operator_authorized(event, 'aws'), expected)


if __name__ == '__main__':
    unittest.main()
