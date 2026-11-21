"""Exercises the real urllib transport against a local stand-in for the Gemini endpoint."""
import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

import app.providers.gemini as g
from app.errors import ProviderError


class Handler(BaseHTTPRequestHandler):
    seen = []
    script = []  # list of (status, payload)

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        Handler.seen.append((self.path, self.headers.get("x-goog-api-key"), body))
        status, payload = Handler.script.pop(0)
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):
        pass


class HttpTransportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.orig = g.BASE_URL
        g.BASE_URL = f"http://127.0.0.1:{cls.srv.server_port}/v1beta/models/{{model}}:generateContent"

    @classmethod
    def tearDownClass(cls):
        g.BASE_URL = cls.orig
        cls.srv.shutdown()

    def setUp(self):
        Handler.seen, Handler.script = [], []

    def test_success_over_real_http(self):
        Handler.script = [(200, {"candidates": [{"content": {"parts": [{"text": '```json\n{"ok": true}\n```'}]}}]})]
        p = g.GeminiProvider("KEY", "m-1", 5, sleep=lambda s: None)
        self.assertEqual(p.generate_json("https://www.youtube.com/watch?v=9hE5-98ZeCg", "prompt"), {"ok": True})
        path, key, body = Handler.seen[0]
        self.assertEqual(path, "/v1beta/models/m-1:generateContent")
        self.assertEqual(key, "KEY")
        self.assertEqual(body["contents"][0]["parts"][0]["file_data"]["file_uri"], "https://www.youtube.com/watch?v=9hE5-98ZeCg")

    def test_429_then_success_over_real_http(self):
        Handler.script = [(429, {"error": {"message": "quota"}}), (200, {"candidates": [{"content": {"parts": [{"text": "{}"}]}}]})]
        p = g.GeminiProvider("KEY", "m-1", 5, sleep=lambda s: None)
        self.assertEqual(p.generate_json("u", "x"), {})
        self.assertEqual(len(Handler.seen), 2)

    def test_http_error_body_is_mapped(self):
        Handler.script = [(404, {"error": {"message": "model gone"}})]
        with self.assertRaises(ProviderError) as cm:
            g.GeminiProvider("KEY", "m-1", 5).generate_json("u", "x")
        self.assertEqual(cm.exception.code, "provider_model_not_found")
        self.assertIn("model gone", cm.exception.message)

    def test_unreachable_host(self):
        g.BASE_URL = "http://127.0.0.1:1/{model}"
        try:
            with self.assertRaises(ProviderError) as cm:
                g.GeminiProvider("KEY", "m-1", 2, sleep=lambda s: None).generate_json("u", "x")
            self.assertIn(cm.exception.code, ("provider_unreachable", "provider_timeout"))
        finally:
            g.BASE_URL = f"http://127.0.0.1:{self.srv.server_port}/v1beta/models/{{model}}:generateContent"


if __name__ == "__main__":
    unittest.main()
