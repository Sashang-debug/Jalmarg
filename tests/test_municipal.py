"""Work lifecycle, cross-city boundaries, assignment and evidence-backed resolution."""
import base64
import time
import unittest
import test_accounts as account_tests
from incident_service import new_incident, ApiError

class MunicipalTests(unittest.TestCase):
    request = account_tests.AccountTests.request
    def setUp(self):
        account_tests.AccountTests.setUp(self)
        self.groups=['civic-operators']
        for user,city in [('worker','GWL'),('reviewer','GWL'),('outsider','BLR')]:
            self.request('/me',sub=user)
            p=self.repo.get_profile(user)
            self.repo.put_profile({**p,'version':2,'membership':{'status':'APPROVED','city':city,'corporation':'Synthetic municipal test','ward':'Test'}},1)
        _,data=self.request('/incidents',{'city':'GWL','lat':26.24,'lng':78.17,'roadName':'SYNTHETIC test road','waterLevel':'KNEE'})
        self.item=data['incident']
    def work(self,action,user='worker',**fields):
        item=self.repo.get('GWL',self.item['id'])
        return self.request(f"/municipal/incidents/{item['id']}/work",{'city':'GWL','version':item['version'],'action':action,'note':'Synthetic test update',**fields},sub=user,groups=self.groups)
    def start_task(self):
        self.assertEqual(self.work('REVIEW')[0],200)
        self.assertEqual(self.work('ASSIGN',assigneeSub='worker')[0],200)
        self.assertEqual(self.work('START')[0],200)
    def upload(self,user='worker'):
        code,data=self.request('/evidence',{'contentType':'image/png','data':base64.b64encode(b'\x89PNG\r\n\x1a\nsynthetic').decode()},sub=user)
        self.assertEqual(code,201);return data['evidenceKey']
    def test_only_approved_city_members_can_list_and_mutate(self):
        self.assertEqual(self.request('/municipal/incidents')[0],403)
        self.assertEqual(self.request('/municipal/incidents',sub='outsider',groups=self.groups)[0],403)
        self.assertEqual(self.work('REVIEW',user='outsider')[0],403)
        code,data=self.request('/municipal/incidents',sub='worker',groups=self.groups)
        self.assertEqual(code,200);self.assertEqual(len(data['incidents']),1)
    def test_assignment_and_start_restrict_assignee(self):
        self.assertEqual(self.work('ASSIGN',assigneeSub='worker')[0],409)
        self.work('REVIEW')
        self.assertEqual(self.work('ASSIGN',assigneeSub='outsider')[0],400)
        self.assertEqual(self.work('ASSIGN',assigneeSub='citizen')[0],400)
        self.work('ASSIGN',assigneeSub='worker')
        self.assertEqual(self.work('START',user='reviewer')[0],403)
        self.assertEqual(self.work('START')[0],200)
    def test_work_survives_expired_observation_and_stale_writes_fail(self):
        item=self.repo.get('GWL',self.item['id']);self.repo.put({**item,'expiresAt':'2000-01-01T00:00:00+00:00','version':item['version']+1},item['version'])
        self.assertEqual(self.request('/incidents')[1]['incidents'],[])
        self.assertEqual(len(self.request('/municipal/incidents',sub='worker',groups=self.groups)[1]['incidents']),1)
        self.assertEqual(self.work('REVIEW',version=1)[0],409)
        self.assertEqual(self.work('REVIEW')[0],200)
    def test_duplicate_cannot_self_link_or_link_across_city(self):
        self.assertEqual(self.work('DUPLICATE',duplicateOf=self.item['id'])[0],400)
        other=new_incident({'city':'BLR','lat':12.9,'lng':77.6,'roadName':'Other test','waterLevel':'ANKLE','reporterId':'legacy'})
        self.repo.put(other)
        self.assertEqual(self.work('DUPLICATE',duplicateOf=other['id'])[0],404)
        _,data=self.request('/incidents',{'city':'GWL','lat':26.24,'lng':78.17,'roadName':'Original test','waterLevel':'ANKLE'})
        self.assertEqual(self.work('DUPLICATE',duplicateOf=data['incident']['id'])[0],200)
        self.assertNotEqual(self.repo.get('GWL',self.item['id'])['status'],'CLEARED')
    def test_resolution_needs_owned_photo_and_independent_reviewer(self):
        self.start_task()
        self.assertEqual(self.work('SUBMIT_RESOLUTION')[0],400)
        self.assertEqual(self.work('SUBMIT_RESOLUTION',evidenceKey=self.upload('reviewer'))[0],400)
        self.assertEqual(self.work('SUBMIT_RESOLUTION',user='reviewer',evidenceKey=self.upload('reviewer'))[0],403)
        code,data=self.work('SUBMIT_RESOLUTION',evidenceKey=self.upload())
        self.assertEqual(code,200);self.assertEqual(data['incident']['workStatus'],'RESOLUTION_SUBMITTED')
        self.assertNotEqual(data['incident']['status'],'CLEARED')
        self.assertEqual(self.work('APPROVE_RESOLUTION')[0],403)
        code,data=self.work('APPROVE_RESOLUTION',user='reviewer')
        self.assertEqual(code,200);self.assertEqual(data['incident']['status'],'CLEARED')
        self.assertEqual(data['incident']['workStatus'],'RESOLVED')
        self.assertEqual(len(data['incident']['timeline']),7)
    def test_citizen_feedback_reopens_without_self_granting_clearance(self):
        self.start_task();self.work('SUBMIT_RESOLUTION',evidenceKey=self.upload());self.work('APPROVE_RESOLUTION',user='reviewer')
        code,data=self.request(f"/incidents/{self.item['id']}/observations",{'city':'GWL','action':'STILL_FLOODED'})
        self.assertEqual(code,200);self.assertEqual(data['incident']['workStatus'],'REOPENED');self.assertEqual(data['incident']['status'],'NEEDS_REVIEW')
        code,data=self.request(f"/incidents/{self.item['id']}/observations",{'city':'GWL','action':'RECEDED'})
        self.assertEqual(code,200);self.assertNotEqual(data['incident']['status'],'CLEARED')
    def test_after_photo_must_be_uploaded_after_task_starts(self):
        key=self.upload()
        with self.repo.connect() as conn:
            conn.execute('UPDATE evidence_owners SET createdAt=? WHERE id=?', ('2000-01-01T00:00:00+00:00',key))
        self.start_task()
        self.assertEqual(self.work('SUBMIT_RESOLUTION',evidenceKey=key)[0],400)
    def test_old_completion_cannot_clear_current_road_conditions(self):
        self.start_task();self.work('SUBMIT_RESOLUTION',evidenceKey=self.upload())
        item=self.repo.get('GWL',self.item['id'])
        item['resolution']['submittedAt']='2000-01-01T00:00:00+00:00'
        self.repo.put({**item,'version':item['version']+1},item['version'])
        self.assertEqual(self.work('APPROVE_RESOLUTION',user='reviewer')[0],409)
    def test_public_reports_do_not_expose_account_or_assignment_ids(self):
        self.start_task()
        report=self.request('/incidents')[1]['incidents'][0]
        self.assertNotIn('ownerSub',report);self.assertNotIn('assigneeSub',report['workTicket'])

    def test_second_completion_keeps_prior_evidence_but_hides_account_ids(self):
        self.start_task();first=self.upload()
        self.work('SUBMIT_RESOLUTION',evidenceKey=first);self.work('APPROVE_RESOLUTION',user='reviewer')
        self.work('REOPEN');self.start_task()
        second=self.upload();code,data=self.work('SUBMIT_RESOLUTION',evidenceKey=second)
        self.assertEqual(code,200)
        previous=data['incident']['resolutionHistory'][0]
        self.assertEqual(previous['evidenceKey'],first)
        self.assertNotIn('submittedBy',previous);self.assertNotIn('reviewedBy',previous)
        self.assertEqual(data['incident']['resolution']['evidenceKey'],second)
