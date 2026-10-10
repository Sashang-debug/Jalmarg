"""Opt-in isolated AWS smoke test; creates synthetic users/reports, cleans only its fixtures.

Run --setup, --exercise, then --cleanup. State contains temporary credentials and is
stored mode 0600 outside the repository. No credentials or JWTs are printed.
Email verification delivery is not tested: admin-created fixtures suppress email.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import secrets
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid

import boto3
from botocore.config import Config
from botocore.httpsession import get_cert_path

class Smoke:
    def __init__(self,args):
        self.args=args
        self.path=Path(args.state)
        self.session=boto3.Session(region_name=args.region)
        self.config=Config(connect_timeout=5,read_timeout=15,retries={'total_max_attempts':3,'mode':'standard'})
        self.cf=self.session.client('cloudformation',config=self.config)
        self.cognito=self.session.client('cognito-idp',config=self.config)
        self.s3=self.session.client('s3',config=self.config)
        self.out={o['OutputKey']:o['OutputValue'] for o in self.cf.describe_stacks(StackName=args.stack)['Stacks'][0]['Outputs']}
        self.table=self.session.resource('dynamodb',config=self.config).Table(self.out['IncidentsTableName'])
        self.state=json.loads(self.path.read_text()) if self.path.exists() else {'stack':args.stack,'users':{},'incidents':[],'evidence':[]}
        if self.state['stack']!=args.stack: raise RuntimeError('State belongs to a different stack.')
        self.tokens={}
        self.ssl=ssl.create_default_context(cafile=get_cert_path(True))
    def save(self):
        fd=os.open(self.path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
        os.fchmod(fd,0o600)
        with os.fdopen(fd,'w') as f: json.dump(self.state,f)
    def request(self,path,body=None,user=None,expected=200):
        headers={'Content-Type':'application/json'}
        if user:
            if user not in self.tokens:
                u=self.state['users'][user]
                result=self.cognito.admin_initiate_auth(UserPoolId=self.out['OperatorPoolId'],ClientId=self.out['OperatorClientId'],AuthFlow='ADMIN_USER_PASSWORD_AUTH',AuthParameters={'USERNAME':u['email'],'PASSWORD':u['password']})
                self.tokens[user]=result['AuthenticationResult']['IdToken']
            headers['Authorization']=self.tokens[user]
        req=urllib.request.Request(self.out['JalMargApiUrl']+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
        try:
            with urllib.request.urlopen(req,timeout=25,context=self.ssl) as response: code=response.status;payload=json.load(response)
        except urllib.error.HTTPError as e: code=e.code;payload=json.loads(e.read())
        if code!=expected: raise AssertionError(f'{path}: expected {expected}, got {code}: {payload.get("error",payload.get("message","request failed"))}')
        return payload
    def setup(self):
        for role in ['citizen','worker','reviewer','outsider']:
            if role in self.state['users']: continue
            email=f'jalmarg-smoke-{role}-{uuid.uuid4().hex[:10]}@example.invalid'
            password='Jm!7'+secrets.token_urlsafe(24)
            result=self.cognito.admin_create_user(UserPoolId=self.out['OperatorPoolId'],Username=email,MessageAction='SUPPRESS',UserAttributes=[{'Name':'email','Value':email},{'Name':'email_verified','Value':'true'},{'Name':'name','Value':f'Synthetic {role.title()}'}])
            sub=next(a['Value'] for a in result['User']['Attributes'] if a['Name']=='sub')
            self.state['users'][role]={'email':email,'password':password,'sub':sub};self.save()
            self.cognito.admin_set_user_password(UserPoolId=self.out['OperatorPoolId'],Username=email,Password=password,Permanent=True)
        for role in self.state['users']: self.request('/me',user=role)
        for role in ['worker','reviewer','outsider']:
            profile=self.request('/me',user=role)['profile']
            if not profile.get('membership'):
                data=self.request('/municipal/apply',{'city':'BLR' if role=='outsider' else 'GWL','corporation':'Synthetic municipal test team','ward':'Test service area','employeeId':'SYNTHETIC-'+role,'role':'MUNICIPAL','status':'APPROVED'},user=role,expected=201)
                assert data['profile']['membership']['status']=='PENDING'
                self.request('/municipal/incidents?city=GWL',user=role,expected=403)
                assert self.request('/me',user=role)['profile']['role']=='CITIZEN'
            if self.request('/me',user=role)['profile']['membership']['status']=='PENDING':
                subprocess.run([sys.executable,str(Path(__file__).resolve().parents[1]/'manage_membership.py'),'--table',self.out['IncidentsTableName'],'--pool',self.out['OperatorPoolId'],'--username',self.state['users'][role]['email'],'--action','APPROVE','--reason','Explicitly synthetic end-to-end test fixture','--region',self.args.region],check=True,stdout=subprocess.DEVNULL)
            self.tokens.pop(role,None)
            assert self.request('/me',user=role)['profile']['role']=='MUNICIPAL'
        print('PASS real Cognito login, profile persistence, pending-only application, approved membership + group')
    def photo(self,user):
        # Actual small PNG, no personal photos.
        image=base64.b64encode((Path(__file__).resolve().parents[2]/'tests/fixtures/synthetic-water-reference.png').read_bytes()).decode()
        key=self.request('/evidence',{'contentType':'image/png','data':image},user=user,expected=201)['evidenceKey']
        self.state['evidence'].append(key);self.save();return key
    def work(self,incident,action,user='worker',expected=200,**fields):
        items=self.request('/municipal/incidents?city=GWL',user=user)['incidents']
        current=next(i for i in items if i['id']==incident)
        result=self.request(f'/municipal/incidents/{incident}/work',{'city':'GWL','version':current['version'],'action':action,'note':'SYNTHETIC smoke-test update',**fields},user=user,expected=expected)
        return result.get('incident')
    def exercise(self):
        assert self.request('/health')['mode']=='aws'
        for path,body in [('/me',None),('/my-reports',None),('/evidence',{}),('/incidents',{})]: self.request(path,body,expected=401)
        self.request('/municipal/incidents?city=GWL',user='citizen',expected=403)
        self.request('/municipal/incidents?city=GWL',user='outsider',expected=403)
        key=self.photo('citizen')
        body={'city':'GWL','lat':26.245,'lng':78.174,'roadName':'SYNTHETIC TEST — not a real flood','waterLevel':'KNEE','notes':'Automated test fixture. This is not an actual waterlogging report.','evidenceKey':key,'ownerSub':'forged','reporterId':'forged'}
        self.request('/incidents',body,user='worker',expected=403)
        item=self.request('/incidents',body,user='citizen',expected=201)['incident'];incident=item['id']
        self.state['incidents'].append(incident);self.save()
        for _ in range(20):
            raw=self.table.get_item(Key={'PK':'CITY#GWL','SK':f'INCIDENT#{incident}'},ConsistentRead=True)['Item']
            if raw['status']=='NEEDS_REVIEW':break
            time.sleep(.5)
        assert raw['status']=='NEEDS_REVIEW' and raw['ownerSub']==self.state['users']['citizen']['sub'] and 'TTL' not in raw
        workflow=self.session.client('stepfunctions',config=self.config)
        arn=self.out['WorkflowArn'].replace(':stateMachine:',':execution:')+':'+incident
        for _ in range(15):
            execution=workflow.describe_execution(executionArn=arn)
            if execution['status']=='SUCCEEDED':break
            time.sleep(.5)
        assert execution['status']=='SUCCEEDED'
        for _ in range(10):
            if any(i['id']==incident for i in self.request('/my-reports',user='citizen')['incidents']):break
            time.sleep(.5)
        else: raise AssertionError('Citizen report index did not return owned report.')
        assert not any(i['id']==incident for i in self.request('/my-reports',user='worker')['incidents'])
        with urllib.request.urlopen(item['photoUrl'],timeout=15,context=self.ssl) as response:assert response.status==200
        unsigned=f'https://{self.out["EvidenceBucketName"]}.s3.{self.args.region}.amazonaws.com/{key}'
        try: urllib.request.urlopen(unsigned,timeout=15,context=self.ssl);raise AssertionError('Evidence is public.')
        except urllib.error.HTTPError as e:assert e.code==403
        print('PASS API authorizer, city boundaries, private ownership, S3 signed access, DynamoDB and Step Functions')
        self.table.update_item(Key={'PK':'CITY#GWL','SK':f'INCIDENT#{incident}'},UpdateExpression='SET expiresAt=:old',ExpressionAttributeValues={':old':'2000-01-01T00:00:00+00:00'})
        assert not any(i['id']==incident for i in self.request('/incidents?city=GWL')['incidents'])
        self.work(incident,'REVIEW');self.work(incident,'ASSIGN',assigneeSub=self.state['users']['worker']['sub'])
        self.work(incident,'START',user='reviewer',expected=403);self.work(incident,'START')
        self.work(incident,'SUBMIT_RESOLUTION',evidenceKey=key,expected=400)
        item=self.work(incident,'SUBMIT_RESOLUTION',evidenceKey=self.photo('worker'))
        assert item['status']!='CLEARED'
        self.work(incident,'APPROVE_RESOLUTION',expected=403)
        item=self.work(incident,'APPROVE_RESOLUTION',user='reviewer');assert item['workStatus']=='RESOLVED' and item['status']=='CLEARED'
        item=self.request(f'/incidents/{incident}/observations',{'city':'GWL','action':'STILL_FLOODED'},user='citizen')['incident'];assert item['workStatus']=='REOPENED' and item['status']=='NEEDS_REVIEW'
        self.state['browserIncident']=incident;self.save()
        print('PASS work survives expiry, assignee enforcement, fresh owned after-photo, independent resolution review, citizen reopening')
    def cleanup(self):
        # Include photos uploaded through the browser by these disposable accounts.
        from boto3.dynamodb.conditions import Attr
        fixture_owners = [user['sub'] for user in self.state['users'].values()]
        for page in self.table.meta.client.get_paginator('scan').paginate(
                TableName=self.table.name,
                FilterExpression=Attr('SK').eq('OWNER') & Attr('ownerSub').is_in(fixture_owners)):
            for item in page.get('Items', []):
                if item['PK'].startswith('EVIDENCE#'):
                    key = item['PK'].removeprefix('EVIDENCE#')
                    if key not in self.state['evidence']: self.state['evidence'].append(key)
        self.save()
        for incident in self.state['incidents']: self.table.delete_item(Key={'PK':'CITY#GWL','SK':f'INCIDENT#{incident}'})
        for key in self.state['evidence']:
            pages=self.s3.get_paginator('list_object_versions').paginate(Bucket=self.out['EvidenceBucketName'],Prefix=key)
            for page in pages:
                objects=[{'Key':v['Key'],'VersionId':v['VersionId']} for kind in ['Versions','DeleteMarkers'] for v in page.get(kind,[]) if v['Key']==key]
                if objects:self.s3.delete_objects(Bucket=self.out['EvidenceBucketName'],Delete={'Objects':objects})
            self.table.delete_item(Key={'PK':f'EVIDENCE#{key}','SK':'OWNER'})
        for user in self.state['users'].values():
            # Browser-created reports are also owned by this disposable fixture only.
            from boto3.dynamodb.conditions import Key
            for page in self.table.meta.client.get_paginator('query').paginate(TableName=self.table.name,IndexName='CitizenReports',KeyConditionExpression=Key('ownerSub').eq(user['sub'])):
                for item in page.get('Items',[]): self.table.delete_item(Key={'PK':item['PK'],'SK':item['SK']})
            self.table.delete_item(Key={'PK':f'USER#{user["sub"]}','SK':'PROFILE'})
            self.cognito.admin_delete_user(UserPoolId=self.out['OperatorPoolId'],Username=user['email'])
        self.path.unlink()
        print('PASS synthetic accounts, reports and tracked evidence removed; temporary credentials deleted')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stack',default='jalmarg-api');parser.add_argument('--region',default='ap-south-1')
    parser.add_argument('--state',default='/tmp/jalmarg-cloud-smoke.json')
    actions=parser.add_mutually_exclusive_group(required=True)
    for action in ['setup','exercise','cleanup']: actions.add_argument('--'+action,action='store_true')
    args=parser.parse_args();smoke=Smoke(args)
    if args.setup:smoke.setup()
    elif args.exercise:smoke.exercise()
    else:smoke.cleanup()

if __name__=='__main__':main()
