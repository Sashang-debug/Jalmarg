"""Trusted administrator CLI; no public endpoint can approve municipal access."""
import argparse
import os
from pathlib import Path
import sys
import time
sys.path.insert(0,str(Path(__file__).parent/'src'))
from incident_repository import AwsRepository
from incident_service import ApiError, iso, text


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--table',required=True);parser.add_argument('--pool',required=True)
    parser.add_argument('--username',required=True,help='Cognito username or email alias')
    parser.add_argument('--action',choices=['APPROVE','REJECT','SUSPEND'],required=True)
    parser.add_argument('--reason',required=True);parser.add_argument('--region',default='ap-south-1')
    args=parser.parse_args()
    os.environ.update(TABLE_NAME=args.table,USER_POOL_ID=args.pool,AWS_REGION=args.region,BUCKET_NAME='unused-for-membership')
    import boto3
    from botocore.config import Config
    client=boto3.Session(region_name=args.region).client('cognito-idp',config=Config(connect_timeout=5,read_timeout=10,retries={'total_max_attempts':3,'mode':'standard'}))
    user=client.admin_get_user(UserPoolId=args.pool,Username=args.username)
    attrs={a['Name']:a['Value'] for a in user['UserAttributes']}
    repo=AwsRepository();profile=repo.get_profile(attrs['sub'])
    if not profile or not profile.get('membership'):
        raise ApiError(409,'This account has not requested municipal access.')
    status=profile['membership']['status']
    if (args.action in {'APPROVE','REJECT'} and status!='PENDING') or (args.action=='SUSPEND' and status!='APPROVED'):
        raise ApiError(409,'Action is not available for the current membership status.')
    if args.action=='APPROVE' and attrs.get('email_verified')!='true':
        raise ApiError(409,'Verify the account email before approving municipal access.')
    membership={**profile['membership'],'status':{'APPROVE':'APPROVED','REJECT':'REJECTED','SUSPEND':'SUSPENDED'}[args.action],
                'reason':text(args.reason,'Reason',300),'reviewedAt':iso(time.time())}
    if args.action=='APPROVE':
        client.admin_add_user_to_group(UserPoolId=args.pool,Username=user['Username'],GroupName='civic-operators')
    repo.put_profile({**profile,'membership':membership,'version':profile['version']+1},profile['version'])
    if args.action in {'REJECT','SUSPEND'}:
        client.admin_remove_user_from_group(UserPoolId=args.pool,Username=user['Username'],GroupName='civic-operators')
    print(f"Municipal membership {membership['status']} for {attrs['sub']}. Sign in again to refresh claims.")

if __name__=='__main__':
    main()
