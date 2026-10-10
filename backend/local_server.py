"""Run `python3 backend/local_server.py` for a persistent, cloud-free API."""

import argparse
import json
import logging
import os
import secrets
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).parent / "src"))
from api import handle
from incident_repository import LocalRepository


class Server(BaseHTTPRequestHandler):
    repository = None

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "http://localhost:5173"))
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.end_headers()

    def do_GET(self):
        self.respond()

    def do_POST(self):
        self.respond()

    def respond(self):
        parsed = urlparse(self.path)
        if self.command == "GET" and parsed.path.startswith("/api/evidence/"):
            target = (self.repository.directory / parsed.path.removeprefix("/api/")).resolve()
            root = (self.repository.directory / "evidence").resolve()
            if target.parent != root or not target.is_file():
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", {".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}.get(target.suffix, "application/octet-stream"))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(target.read_bytes())
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(400)
            return
        if not 0 <= size <= 4 * 1024 * 1024 + 1024:
            self.send_error(413)
            return
        event = {"httpMethod": self.command, "path": parsed.path,
                 "headers": dict(self.headers), "body": self.rfile.read(size).decode("utf-8", errors="replace"),
                 "queryStringParameters": {k: v[0] for k, v in parse_qs(parsed.query).items()}}
        result = handle(event, self.repository)
        self.send_response(result["statusCode"])
        for name, value in result["headers"].items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(result["body"].encode())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3001)
    parser.add_argument("--data-dir", default=str(Path(__file__).parent.parent / "data" / "local"))
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    if not os.environ.get("LOCAL_OPERATOR_TOKEN"):
        os.environ["LOCAL_OPERATOR_TOKEN"] = secrets.token_urlsafe(24)
    Server.repository = LocalRepository(args.data_dir)
    print(f"Local operator token (development only): {os.environ['LOCAL_OPERATOR_TOKEN']}", flush=True)
    print(f"JalMarg API: http://127.0.0.1:{args.port}/api/health", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Server).serve_forever()


if __name__ == "__main__":
    main()
