"""Durable repositories: SQLite for local work, DynamoDB and private S3 on AWS."""

import io
import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from decimal import Decimal
from pathlib import Path

from incident_service import ApiError


def json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value == int(value) else float(value)
    raise TypeError(f"Cannot encode {type(value).__name__}")


class LocalRepository:
    mode = "local"

    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.database = self.directory / "incidents.sqlite3"
        self.lock = threading.Lock()
        with self.connect() as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, city TEXT, version INTEGER, document TEXT)")
            conn.execute("CREATE INDEX IF NOT EXISTS city_lookup ON incidents(city)")

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self.database, timeout=10)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def list(self, city):
        with self.connect() as conn:
            return [json.loads(row[0]) for row in conn.execute("SELECT document FROM incidents WHERE city=?", (city,))]

    def get(self, city, incident_id):
        with self.connect() as conn:
            row = conn.execute("SELECT document FROM incidents WHERE city=? AND id=?", (city, incident_id)).fetchone()
        if not row:
            raise ApiError(404, "Report not found.")
        return json.loads(row[0])

    def put(self, item, previous_version=None):
        with self.lock, self.connect() as conn:
            if previous_version is None:
                conn.execute("INSERT INTO incidents VALUES (?, ?, ?, ?)",
                             (item["id"], item["city"], item["version"], json.dumps(item)))
            else:
                result = conn.execute("UPDATE incidents SET version=?, document=? WHERE id=? AND city=? AND version=?",
                                      (item["version"], json.dumps(item), item["id"], item["city"], previous_version))
                if result.rowcount != 1:
                    raise ApiError(409, "Report changed in another session. Refresh and try again.")

    def save_evidence(self, key, data, content_type):
        target = self.directory / key
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(data)

    def evidence_exists(self, key):
        return (self.directory / key).is_file()

    def photo_url(self, key):
        return f"/api/{key}" if key else ""


class AwsRepository:
    mode = "aws"

    def __init__(self):
        import boto3
        from botocore.config import Config
        self.config = Config(connect_timeout=5, read_timeout=10, retries={"total_max_attempts": 3, "mode": "standard"})
        session = boto3.Session(region_name=os.environ.get("AWS_REGION", "ap-south-1"))
        self.table = session.resource("dynamodb", config=self.config).Table(os.environ["TABLE_NAME"])
        self.s3 = session.client("s3", config=self.config)
        self.bucket = os.environ["BUCKET_NAME"]

    def list(self, city):
        from boto3.dynamodb.conditions import Key
        pages = self.table.meta.client.get_paginator("query").paginate(
            TableName=self.table.name, KeyConditionExpression=Key("PK").eq(f"CITY#{city}"), ConsistentRead=True)
        return [item for page in pages for item in page.get("Items", [])]

    def get(self, city, incident_id):
        item = self.table.get_item(Key={"PK": f"CITY#{city}", "SK": f"INCIDENT#{incident_id}"}, ConsistentRead=True).get("Item")
        if not item:
            raise ApiError(404, "Report not found.")
        return item

    def put(self, item, previous_version=None):
        from boto3.dynamodb.conditions import Attr
        condition = Attr("PK").not_exists() if previous_version is None else Attr("version").eq(previous_version)
        # DynamoDB's resource interface accepts Decimal rather than float values.
        document = json.loads(json.dumps(item, default=json_default), parse_float=Decimal)
        try:
            self.table.put_item(Item=document, ConditionExpression=condition)
        except self.table.meta.client.exceptions.ConditionalCheckFailedException:
            raise ApiError(409, "Report changed in another session. Refresh and try again.") from None

    def save_evidence(self, key, data, content_type):
        self.s3.upload_fileobj(io.BytesIO(data), self.bucket, key,
                               ExtraArgs={"ContentType": content_type, "ServerSideEncryption": "AES256"})

    def evidence_exists(self, key):
        # Missing or unavailable evidence cannot silently become a verified upload.
        from botocore.exceptions import ClientError
        try:
            self.s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
                return False
            raise

    def photo_url(self, key):
        if not key:
            return ""
        return self.s3.generate_presigned_url("get_object", Params={"Bucket": self.bucket, "Key": key}, ExpiresIn=900)
