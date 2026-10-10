"""Identity APIs: trusted authorizer claims, never client-supplied roles."""
import json
import os
from pathlib import Path
import sys
import tempfile
import time
from datetime import datetime, timezone
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'/'src'))
from api import handle
from account_service import verified_claims
from incident_repository import LocalRepository

class AccountTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.repo=LocalRepository(self.tmp.name)
        self.env=patch.dict(os.environ,{'OPERATOR_CLIENT_ID':'test-client'});self.env.start();self.addCleanup(self.env.stop)
        self.auth=patch('account_service.verified_claims',side_effect=lambda e,m:verified_claims(e,'aws'));self.auth.start();self.addCleanup(self.auth.stop)
    def request(self,path,body=None,sub='citizen',groups=None,method=None,city='GWL'):
        claims={'sub':sub,'aud':'test-client','token_use':'id','email_verified':'true','email':f'{sub}@example.invalid','name':sub,'exp':int(time.time())+3600,'cognito:groups':groups or []} if sub else {}
        event={'path':path,'httpMethod':method or ('POST' if body is not None else 'GET'),'body':json.dumps(body or {}),'queryStringParameters':{'city':city},'requestContext':{'authorizer':{'claims':claims}}}
        result=handle(event,self.repo);return result['statusCode'],json.loads(result['body'])
    def test_verified_identity_creates_profile_once_and_persists(self):
        code,data=self.request('/me');self.assertEqual(code,200);self.assertEqual(data['profile']['role'],'CITIZEN')
        self.request('/me',{'name':'New name','role':'MUNICIPAL'})
        self.assertEqual(self.repo.get_profile('citizen')['name'],'New name')
        self.assertEqual(self.request('/me')[1]['profile']['role'],'CITIZEN')
        self.assertIsNotNone(LocalRepository(self.tmp.name).get_profile('citizen'))
    def test_anonymous_profile_is_rejected(self):
        self.assertEqual(self.request('/me',sub=None)[0],401)
    def test_wrong_claims_or_unverified_email_are_rejected(self):
        for bad in [{'aud':'wrong'},{'exp':1},{'exp':'not-a-number'},{'exp':float('nan')},{'token_use':'access'},{'email_verified':'false'}, {'sub':''}]:
            event={'requestContext':{'authorizer':{'claims':{'sub':'x','aud':'test-client','token_use':'id','email_verified':'true','exp':time.time()+60,**bad}}}}
            self.assertFalse(verified_claims(event,'aws'))
    def test_local_mode_does_not_trust_injected_authorizer_context(self):
        with patch.dict(os.environ,{'USER_POOL_ID':''}):
            self.assertFalse(verified_claims({'requestContext':{'authorizer':{'claims':{'sub':'admin'}}}},'local'))
    def test_rest_gateway_expiration_format_is_checked_without_relaxing_expiry(self):
        claims={'sub':'x','aud':'test-client','token_use':'id','email_verified':'true'}
        for epoch,valid in [(time.time()+300,True),(time.time()-300,False)]:
            claims['exp']=datetime.fromtimestamp(epoch,timezone.utc).strftime('%a %b %d %H:%M:%S UTC %Y')
            event={'requestContext':{'authorizer':{'claims':claims}}}
            self.assertEqual(bool(verified_claims(event,'aws')),valid)
    def test_profile_is_scoped_to_authenticated_identity(self):
        self.request('/me',{'name':'Citizen One','id':'another','membership':{'status':'APPROVED'}})
        self.assertIsNone(self.repo.get_profile('another'))
        self.assertEqual(self.request('/me',sub='another')[1]['profile']['name'],'another')
    def test_municipal_requests_start_pending_even_if_client_claims_approved(self):
        body={'corporation':'Gwalior Municipal Corporation','city':'GWL','ward':'North','employeeId':'SYNTHETIC-1','status':'APPROVED','role':'MUNICIPAL'}
        code,data=self.request('/municipal/apply',body)
        self.assertEqual(code,201);self.assertEqual(data['profile']['membership']['status'],'PENDING');self.assertEqual(data['profile']['role'],'CITIZEN')
        self.assertEqual(self.request('/municipal/apply',body)[0],409)
        self.assertEqual(self.request('/me',groups=['civic-operators'])[1]['profile']['role'],'CITIZEN')
    def test_public_browsing_but_authenticated_writes(self):
        self.assertEqual(self.request('/incidents',sub=None)[0],200)
        self.assertEqual(self.request('/incidents',{'city':'GWL'},sub=None)[0],401)
        self.assertEqual(self.request('/evidence',{},sub=None)[0],401)
    def test_report_owner_is_server_derived_and_history_is_private(self):
        body={'city':'GWL','lat':26.24,'lng':78.17,'roadName':'Synthetic test road','waterLevel':'ANKLE','reporterId':'victim','ownerSub':'victim'}
        code,data=self.request('/incidents',body)
        self.assertEqual(code,201);item=data['incident']
        self.assertNotIn('ownerSub',item)
        stored=self.repo.get('GWL',item['id']);self.assertEqual(stored['ownerSub'],'citizen');self.assertNotIn('TTL',stored)
        self.assertEqual(len(self.request('/my-reports')[1]['incidents']),1)
        self.assertEqual(self.request('/my-reports',sub='victim')[1]['incidents'],[])
    def test_cannot_reuse_another_accounts_evidence(self):
        import base64
        code,data=self.request('/evidence',{'contentType':'image/png','data':base64.b64encode(b'\x89PNG\r\n\x1a\nfixture').decode()})
        self.assertEqual(code,201)
        body={'city':'GWL','lat':26.24,'lng':78.17,'roadName':'Synthetic road','waterLevel':'ANKLE','evidenceKey':data['evidenceKey']}
        self.assertEqual(self.request('/incidents',body,sub='another')[0],403)
    def test_approval_requires_both_trusted_membership_and_group(self):
        self.request('/me');p=self.repo.get_profile('citizen');p.update(membership={'city':'GWL','status':'APPROVED'});self.repo.put_profile({**p,'version':2},1)
        self.assertEqual(self.request('/me')[1]['profile']['role'],'CITIZEN')
        self.assertEqual(self.request('/me',groups=['civic-operators'])[1]['profile']['role'],'MUNICIPAL')
        p=self.repo.get_profile('citizen');p['membership']['status']='SUSPENDED';self.repo.put_profile({**p,'version':3},2)
        self.assertEqual(self.request('/me',groups=['civic-operators'])[1]['profile']['role'],'CITIZEN')

    def test_missing_display_name_does_not_publish_email_as_name(self):
        claims={'sub':'no-name','aud':'test-client','token_use':'id','email_verified':'true','email':'private@example.invalid','exp':time.time()+300}
        result=handle({'httpMethod':'GET','path':'/me','requestContext':{'authorizer':{'claims':claims}}},self.repo)
        self.assertEqual(result['statusCode'],200)
        self.assertEqual(json.loads(result['body'])['profile']['name'],'Citizen')
