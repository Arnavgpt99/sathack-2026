"""Best-effort title/channel lookup via YouTube's public oEmbed endpoint (metadata only, no media)."""
from __future__ import annotations

import json
import urllib.parse
import urllib.request
from typing import Optional


def youtube_oembed(canonical_url: str, timeout: float = 4.0) -> Optional[dict]:
    q = urllib.parse.urlencode({"url": canonical_url, "format": "json"})
    try:
        with urllib.request.urlopen(f"https://www.youtube.com/oembed?{q}", timeout=timeout) as r:  # noqa: S310
            data = json.loads(r.read().decode("utf-8"))
        return {"title": str(data.get("title", ""))[:200], "channel": str(data.get("author_name", ""))[:120]}
    except Exception:
        return None
