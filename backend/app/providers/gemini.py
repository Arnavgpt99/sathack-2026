"""Minimal Gemini Developer API client (REST, stdlib only).

Uses generateContent with a public YouTube URL as `file_data.file_uri` (documented input method).
The model name comes from config; it is never hardcoded here. Not Vertex/Cloud: the key is a
Gemini API key sent in the `x-goog-api-key` header, never in the URL or logs.
"""
from __future__ import annotations

import json
import re
import socket
import time
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, Tuple

from ..errors import ProviderError

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_MODEL_RE = re.compile(r"^[A-Za-z0-9._-]{1,80}$")

Transport = Callable[[str, Dict[str, str], Dict[str, Any], float], Tuple[int, Dict[str, Any]]]


def urllib_post_json(url: str, headers: Dict[str, str], body: Dict[str, Any], timeout: float):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 (fixed https host)
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8"))
        except Exception:
            payload = {}
        return e.code, payload
    except (socket.timeout, TimeoutError):
        raise ProviderError("provider_timeout", "The AI provider took too long to respond.")
    except urllib.error.URLError as e:
        if isinstance(e.reason, (socket.timeout, TimeoutError)):
            raise ProviderError("provider_timeout", "The AI provider took too long to respond.")
        raise ProviderError("provider_unreachable", "Could not reach the AI provider.", retryable=True)


def parse_model_json(text: str) -> Dict[str, Any]:
    """Parse JSON from model text, tolerating ```json fences and stray prose."""
    s = text.strip()
    s = re.sub(r"^```(?:json)?\s*|\s*```$", "", s, flags=re.IGNORECASE)
    try:
        obj = json.loads(s)
    except json.JSONDecodeError:
        start, end = s.find("{"), s.rfind("}")
        if start == -1 or end <= start:
            raise ProviderError("invalid_model_output", "The model did not return valid JSON.")
        try:
            obj = json.loads(s[start : end + 1])
        except json.JSONDecodeError:
            raise ProviderError("invalid_model_output", "The model did not return valid JSON.")
    if not isinstance(obj, dict):
        raise ProviderError("invalid_model_output", "The model returned JSON of an unexpected shape.")
    return obj


class GeminiProvider:
    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_sec: float = 900.0,
        transport: Transport = urllib_post_json,
        sleep: Callable[[float], None] = time.sleep,
        max_retries: int = 2,
    ):
        if not api_key or not _MODEL_RE.match(model or ""):
            raise ValueError("A Gemini API key and a valid model name are required.")
        self._key, self._model = api_key, model
        self._timeout, self._transport, self._sleep, self._retries = timeout_sec, transport, sleep, max_retries

    def build_body(self, youtube_url: str, prompt: str) -> Dict[str, Any]:
        return {
            "contents": [
                {"parts": [{"file_data": {"file_uri": youtube_url}}, {"text": prompt}]}
            ],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
        }

    def generate_json(self, youtube_url: str, prompt: str) -> Dict[str, Any]:
        url = BASE_URL.format(model=self._model)
        headers = {"x-goog-api-key": self._key}
        body = self.build_body(youtube_url, prompt)
        attempt = 0
        while True:
            status, payload = self._transport(url, headers, body, self._timeout)
            if status == 200:
                return parse_model_json(self._extract_text(payload))
            err = self._map_error(status, payload)
            if err.retryable and attempt < self._retries:
                self._sleep(2.0 * (3**attempt))  # 2s, 6s — bounded retries only for 429/5xx
                attempt += 1
                continue
            raise err

    @staticmethod
    def _extract_text(payload: Dict[str, Any]) -> str:
        cands = payload.get("candidates") or []
        if not cands:
            reason = (payload.get("promptFeedback") or {}).get("blockReason")
            if reason:
                raise ProviderError("provider_blocked", f"The provider blocked this request ({reason}).")
            raise ProviderError("invalid_model_output", "The provider returned no candidates.")
        parts = (cands[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
        if not text.strip():
            fin = cands[0].get("finishReason", "unknown")
            raise ProviderError("invalid_model_output", f"The provider returned no text (finish reason: {fin}).")
        return text

    @staticmethod
    def _map_error(status: int, payload: Dict[str, Any]) -> ProviderError:
        detail = str(((payload or {}).get("error") or {}).get("message", ""))[:300]
        suffix = f" ({detail})" if detail else ""
        if status in (401, 403):
            return ProviderError("provider_auth", "The AI provider rejected the API key or access." + suffix)
        if status == 404:
            return ProviderError("provider_model_not_found", "The configured model was not found." + suffix)
        if status == 429:
            return ProviderError("provider_quota", "AI provider quota or rate limit reached." + suffix, retryable=True)
        if status >= 500:
            return ProviderError("provider_unavailable", "The AI provider is temporarily unavailable." + suffix, retryable=True)
        return ProviderError("provider_bad_request", "The AI provider could not process this request." + suffix)
