from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Mapping, Optional


def _int(env: Mapping[str, str], key: str, default: int) -> int:
    try:
        return int(env.get(key, default))
    except (TypeError, ValueError):
        return default


def _float(env: Mapping[str, str], key: str, default: float) -> float:
    try:
        return float(env.get(key, default))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = ""
    gemini_model: str = ""  # deliberately no default: model names change; set it in .env
    backend_api_key: str = ""  # shared secret expected from the Next.js proxy
    allowed_origins: tuple = ("http://localhost:3000",)
    gemini_timeout_sec: float = 900.0
    max_jobs: int = 200
    job_ttl_sec: int = 3600
    cache_ttl_sec: int = 3600
    max_workers: int = 2
    max_clips: int = 6

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_model)


def load_settings(env: Optional[Mapping[str, str]] = None) -> Settings:
    if env is None:
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except Exception:
            pass
        env = os.environ
    origins = tuple(
        o.strip() for o in env.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()
    )
    return Settings(
        gemini_api_key=env.get("GEMINI_API_KEY", "").strip(),
        gemini_model=env.get("GEMINI_MODEL", "").strip(),
        backend_api_key=env.get("REELIX_BACKEND_KEY", "").strip(),
        allowed_origins=origins or ("http://localhost:3000",),
        gemini_timeout_sec=_float(env, "GEMINI_TIMEOUT_SEC", 900.0),
        max_jobs=_int(env, "MAX_JOBS", 200),
        job_ttl_sec=_int(env, "JOB_TTL_SEC", 3600),
        cache_ttl_sec=_int(env, "CACHE_TTL_SEC", 3600),
        max_workers=max(1, _int(env, "MAX_WORKERS", 2)),
        max_clips=max(1, _int(env, "MAX_CLIPS", 6)),
    )
