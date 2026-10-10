"""Offline regression for regional private evidence signing; run with built SDK deps."""
import importlib.util
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.parse import urlparse,parse_qs
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend/src'))
from incident_repository import AwsRepository

@unittest.skipUnless(importlib.util.find_spec('boto3'),'Run with built SDK dependencies on PYTHONPATH')
class AwsSigningTests(unittest.TestCase):
    def test_private_photo_is_signed_for_its_regional_host(self):
        with patch.dict(os.environ,{'AWS_REGION':'ap-south-1','AWS_ACCESS_KEY_ID':'synthetic','AWS_SECRET_ACCESS_KEY':'synthetic','AWS_SESSION_TOKEN':'synthetic','TABLE_NAME':'synthetic-table','BUCKET_NAME':'synthetic-evidence'}):
            repo=AwsRepository();url=urlparse(repo.photo_url('evidence/synthetic.png'))
        self.assertEqual(url.hostname,'synthetic-evidence.s3.ap-south-1.amazonaws.com')
        query=parse_qs(url.query)
        self.assertEqual(query['X-Amz-Algorithm'],['AWS4-HMAC-SHA256'])
        self.assertEqual(query['X-Amz-Expires'],['900'])
