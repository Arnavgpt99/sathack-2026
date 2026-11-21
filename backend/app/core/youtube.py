"""Strict YouTube URL parsing. Only public watch/shorts/live/embed/youtu.be links are accepted."""
from __future__ import annotations

import re
from typing import Optional
from urllib.parse import parse_qs, urlsplit

_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com"}
_PATH_ID = re.compile(r"^/(?:shorts|live|embed|v)/([^/?#]+)")


def extract_video_id(raw: object) -> Optional[str]:
    if not isinstance(raw, str) or not raw.strip() or len(raw) > 2048:
        return None
    raw = raw.strip()
    if not raw.lower().startswith(("http://", "https://")):
        raw = "https://" + raw
    try:
        parts = urlsplit(raw)
        port = parts.port
    except ValueError:
        return None
    if parts.username or parts.password or port not in (None, 80, 443):
        return None
    host = (parts.hostname or "").lower()
    vid = None
    if host == "youtu.be":
        vid = parts.path.lstrip("/").split("/")[0]
    elif host in _HOSTS:
        if parts.path == "/watch":
            vid = (parse_qs(parts.query).get("v") or [None])[0]
        else:
            m = _PATH_ID.match(parts.path)
            vid = m.group(1) if m else None
    return vid if vid and _ID.match(vid) else None


def canonical_youtube_url(raw: object) -> Optional[str]:
    vid = extract_video_id(raw)
    return f"https://www.youtube.com/watch?v={vid}" if vid else None
