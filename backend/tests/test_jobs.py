import threading
import time
import unittest

from app.errors import ProviderError
from app.jobs import JobStore, JobStoreFull


def wait_for(store, jid, states=("completed", "failed", "cancelled"), timeout=3.0):
    end = time.time() + timeout
    while time.time() < end:
        j = store.get(jid)
        if j["status"] in states:
            return j
        time.sleep(0.01)
    raise AssertionError(f"timeout; last={store.get(jid)}")


class JobTests(unittest.TestCase):
    def setUp(self):
        self.store = JobStore(max_workers=2, ttl_sec=3600, max_jobs=5, cache_ttl_sec=3600)

    def tearDown(self):
        self.store.shutdown()

    def test_completes_and_reports_phases(self):
        seen = []

        def fn(set_phase):
            set_phase("analyzing_video")
            seen.append("x")
            return {"ok": True}

        j = self.store.submit("clip_discovery", "k1", fn)
        self.assertIn(j["status"], ("queued", "running", "completed"))  # worker may already have finished
        done = wait_for(self.store, j["jobId"])
        self.assertEqual((done["status"], done["result"], done["error"]), ("completed", {"ok": True}, None))
        self.assertFalse(done["cached"])

    def test_known_error_surfaces_code(self):
        def fn(_):
            raise ProviderError("provider_quota", "slow down", retryable=True)

        done = wait_for(self.store, self.store.submit("m", "k2", fn)["jobId"])
        self.assertEqual(done["status"], "failed")
        self.assertEqual(done["error"], {"code": "provider_quota", "message": "slow down", "retryable": True})

    def test_unexpected_error_does_not_leak_details(self):
        def fn(_):
            raise RuntimeError("secret internals /etc/passwd")

        done = wait_for(self.store, self.store.submit("m", "k3", fn)["jobId"])
        self.assertEqual(done["error"]["code"], "internal_error")
        self.assertNotIn("secret", done["error"]["message"])

    def test_cache_hit_skips_work_and_failures_are_not_cached(self):
        calls = []

        def good(_):
            calls.append(1)
            return {"n": len(calls)}

        wait_for(self.store, self.store.submit("m", "same", good)["jobId"])
        hit = self.store.submit("m", "same", good)
        self.assertTrue(hit["cached"])
        self.assertEqual(hit["status"], "completed")
        self.assertEqual(len(calls), 1)
        other = wait_for(self.store, self.store.submit("m", "different", good)["jobId"])
        self.assertEqual(other["result"], {"n": 2})

        def bad(_):
            raise ProviderError("provider_unavailable", "x")

        wait_for(self.store, self.store.submit("m", "failing", bad)["jobId"])
        retry = self.store.submit("m", "failing", good)
        self.assertFalse(retry["cached"])
        wait_for(self.store, retry["jobId"])

    def test_cancel_discards_result(self):
        gate, started = threading.Event(), threading.Event()

        def fn(set_phase):
            set_phase("analyzing_video")
            started.set()
            gate.wait(2)
            set_phase("scoring_clips")  # raises JobCancelled once cancelled
            return {"late": True}

        j = self.store.submit("m", "kc", fn)
        started.wait(2)
        self.assertTrue(self.store.cancel(j["jobId"]))
        gate.set()
        time.sleep(0.1)
        final = self.store.get(j["jobId"])
        self.assertEqual(final["status"], "cancelled")
        self.assertIsNone(final["result"])
        self.assertFalse(self.store.cancel(j["jobId"]))  # already terminal
        self.assertFalse(self.store.cancel("nope"))

    def test_store_full(self):
        gate = threading.Event()
        for i in range(5):
            self.store.submit("m", f"f{i}", lambda s: gate.wait(2) or {})
        with self.assertRaises(JobStoreFull):
            self.store.submit("m", "f-extra", lambda s: {})
        gate.set()

    def test_unknown_job(self):
        self.assertIsNone(self.store.get("missing"))

    def test_finished_jobs_expire(self):
        t = [1000.0]
        s = JobStore(max_workers=1, ttl_sec=10, max_jobs=5, cache_ttl_sec=1, clock=lambda: t[0])
        try:
            j = s.submit("m", "e1", lambda _: {"a": 1})
            wait_for(s, j["jobId"])
            t[0] += 100
            s.submit("m", "e2", lambda _: {"b": 1})
            self.assertIsNone(s.get(j["jobId"]))
        finally:
            s.shutdown()


if __name__ == "__main__":
    unittest.main()
