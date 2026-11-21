"""HTTP-level tests. Skipped automatically when fastapi/httpx are not installed."""
import time
import unittest

try:
    from fastapi.testclient import TestClient
    from app.main import create_app

    HAVE_FASTAPI = True
except Exception:  # pragma: no cover
    HAVE_FASTAPI = False

from app.config import Settings
from app.jobs import JobStore

YT = "https://www.youtube.com/watch?v=9hE5-98ZeCg"


class FakeProvider:
    def __init__(self, obj):
        self.obj = obj

    def generate_json(self, url, prompt):
        return self.obj


def poll(client, jid, headers=None):
    for _ in range(300):
        j = client.get(f"/api/v1/jobs/{jid}", headers=headers).json()
        if j["status"] in ("completed", "failed", "cancelled"):
            return j
        time.sleep(0.01)
    raise AssertionError("timeout")


@unittest.skipUnless(HAVE_FASTAPI, "fastapi not installed")
class ApiTests(unittest.TestCase):
    def make(self, provider=None, key=""):
        s = Settings(gemini_api_key="k" if provider else "", gemini_model="m" if provider else "", backend_api_key=key)
        store = JobStore(max_workers=1)
        self.addCleanup(store.shutdown)
        return TestClient(create_app(s, store, provider, metadata_fn=lambda u: None))

    def test_health_exposes_no_secrets(self):
        r = self.make(FakeProvider({})).get("/api/v1/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(set(r.json()), {"status", "geminiConfigured", "model", "jobs", "version"})
        self.assertTrue(r.json()["geminiConfigured"])

    def test_not_configured_is_503(self):
        r = self.make(None).post("/api/v1/analyze", json={"url": YT})
        self.assertEqual((r.status_code, r.json()["detail"]["code"]), (503, "provider_not_configured"))

    def test_non_youtube_is_422(self):
        r = self.make(FakeProvider({})).post("/api/v1/analyze", json={"url": "https://vimeo.com/1"})
        self.assertEqual((r.status_code, r.json()["detail"]["code"]), (422, "unsupported_source"))

    def test_timeline_requires_its_fields(self):
        r = self.make(FakeProvider({})).post("/api/v1/analyze", json={"url": YT, "mode": "timeline_search"})
        self.assertEqual(r.status_code, 422)

    def test_clip_discovery_end_to_end_with_camel_case(self):
        obj = {"clips": [{"title": "T", "start": "01:00", "end": "01:40", "score": 80, "hook_score": 1, "pacing_score": 2, "clarity_score": 3}]}
        c = self.make(FakeProvider(obj))
        r = c.post("/api/v1/analyze", json={"url": YT, "creativeDirection": "punchy", "lengthPreference": "30-60", "aspectRatio": "9:16", "autoCaptions": True})
        self.assertEqual(r.status_code, 202)
        done = poll(c, r.json()["jobId"])
        self.assertEqual(done["status"], "completed")
        self.assertEqual(done["result"]["clips"][0]["startSec"], 60.0)

    def test_timeline_end_to_end(self):
        obj = {"intervals": [{"start": "10:00", "end": "30:00", "confidence": "high", "evidence": "e"}]}
        c = self.make(FakeProvider(obj))
        r = c.post("/api/v1/analyze", json={"url": YT, "mode": "timeline_search", "targetEntity": "X", "condition": "on strike", "targetTotalDurationSec": 600})
        done = poll(c, r.json()["jobId"])
        self.assertEqual(done["result"]["selectedDurationSec"], 600.0)
        self.assertTrue(done["result"]["targetMet"])

    def test_backend_key_enforced_when_set(self):
        c = self.make(FakeProvider({}), key="s3cret")
        self.assertEqual(c.post("/api/v1/analyze", json={"url": YT}).status_code, 401)
        self.assertEqual(c.post("/api/v1/analyze", json={"url": YT}, headers={"X-Reelix-Key": "wrong"}).status_code, 401)
        self.assertEqual(c.get("/api/v1/jobs/abc").status_code, 401)
        ok = c.post("/api/v1/analyze", json={"url": YT}, headers={"X-Reelix-Key": "s3cret"})
        self.assertEqual(ok.status_code, 202)

    def test_unknown_job_404(self):
        self.assertEqual(self.make(FakeProvider({})).get("/api/v1/jobs/nope").status_code, 404)


if __name__ == "__main__":
    unittest.main()
