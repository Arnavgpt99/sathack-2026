import json
import unittest

from app.errors import ProviderError
from app.providers.gemini import GeminiProvider, parse_model_json

URL = "https://www.youtube.com/watch?v=9hE5-98ZeCg"


def ok(text):
    return 200, {"candidates": [{"content": {"parts": [{"text": text}]}}]}


class FakeTransport:
    def __init__(self, responses):
        self.responses, self.calls = list(responses), []

    def __call__(self, url, headers, body, timeout):
        self.calls.append((url, headers, body, timeout))
        return self.responses.pop(0)


class GeminiTests(unittest.TestCase):
    def make(self, responses, **kw):
        t = FakeTransport(responses)
        sleeps = []
        p = GeminiProvider("KEY123", "some-model.1", 30, transport=t, sleep=sleeps.append, **kw)
        return p, t, sleeps

    def test_request_shape_and_key_in_header_only(self):
        p, t, _ = self.make([ok('{"a": 1}')])
        self.assertEqual(p.generate_json(URL, "hello"), {"a": 1})
        url, headers, body, timeout = t.calls[0]
        self.assertTrue(url.endswith("/models/some-model.1:generateContent"))
        self.assertNotIn("KEY123", url)
        self.assertEqual(headers["x-goog-api-key"], "KEY123")
        parts = body["contents"][0]["parts"]
        self.assertEqual(parts[0], {"file_data": {"file_uri": URL}})
        self.assertEqual(parts[1], {"text": "hello"})
        self.assertEqual(body["generationConfig"]["responseMimeType"], "application/json")
        self.assertEqual(timeout, 30)

    def test_rejects_bad_model_name_and_missing_key(self):
        with self.assertRaises(ValueError):
            GeminiProvider("k", "../../evil")
        with self.assertRaises(ValueError):
            GeminiProvider("", "model")

    def test_retries_429_then_succeeds_with_backoff(self):
        p, t, sleeps = self.make([(429, {}), (503, {}), ok("{}")])
        self.assertEqual(p.generate_json(URL, "x"), {})
        self.assertEqual(len(t.calls), 3)
        self.assertEqual(sleeps, [2.0, 6.0])

    def test_retries_are_bounded(self):
        p, t, _ = self.make([(429, {})] * 5)
        with self.assertRaises(ProviderError) as cm:
            p.generate_json(URL, "x")
        self.assertEqual(cm.exception.code, "provider_quota")
        self.assertEqual(len(t.calls), 3)  # 1 try + 2 retries

    def test_non_retryable_errors_fail_fast_with_codes(self):
        for status, code in [(400, "provider_bad_request"), (401, "provider_auth"), (403, "provider_auth"), (404, "provider_model_not_found")]:
            p, t, _ = self.make([(status, {"error": {"message": "nope"}})])
            with self.assertRaises(ProviderError) as cm:
                p.generate_json(URL, "x")
            self.assertEqual(cm.exception.code, code)
            self.assertEqual(len(t.calls), 1)

    def test_blocked_and_empty_responses(self):
        p, _, _ = self.make([(200, {"promptFeedback": {"blockReason": "SAFETY"}})])
        with self.assertRaises(ProviderError) as cm:
            p.generate_json(URL, "x")
        self.assertEqual(cm.exception.code, "provider_blocked")
        p, _, _ = self.make([(200, {"candidates": [{"content": {"parts": []}, "finishReason": "MAX_TOKENS"}]})])
        with self.assertRaises(ProviderError) as cm:
            p.generate_json(URL, "x")
        self.assertEqual(cm.exception.code, "invalid_model_output")

    def test_parse_model_json_variants(self):
        self.assertEqual(parse_model_json('```json\n{"a": 1}\n```'), {"a": 1})
        self.assertEqual(parse_model_json('Sure! {"a": {"b": 2}} hope that helps'), {"a": {"b": 2}})
        for bad in ["not json", "[1, 2]", "{", ""]:
            with self.assertRaises(ProviderError):
                parse_model_json(bad)


if __name__ == "__main__":
    unittest.main()
