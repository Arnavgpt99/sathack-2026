"""Reelix backend. Run: uvicorn app.main:app --port 8000   (single worker; see jobs.py)."""
from __future__ import annotations

import hmac
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, load_settings
from .core.youtube import canonical_youtube_url
from .jobs import JobStore, JobStoreFull
from .pipeline import AnalysisParams, run_clip_discovery, run_timeline_search
from .providers.gemini import GeminiProvider
from .providers.youtube_meta import youtube_oembed
from .schemas import AnalyzeRequest, HealthOut, JobOut

VERSION = "0.1.0"


def _err(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def create_app(
    settings: Optional[Settings] = None,
    store: Optional[JobStore] = None,
    provider=None,
    metadata_fn=youtube_oembed,
) -> FastAPI:
    settings = settings or load_settings()
    store = store or JobStore(settings.max_workers, settings.job_ttl_sec, settings.max_jobs, settings.cache_ttl_sec)
    if provider is None and settings.gemini_configured:
        provider = GeminiProvider(settings.gemini_api_key, settings.gemini_model, settings.gemini_timeout_sec)

    app = FastAPI(title="Reelix Backend", version=VERSION)
    app.add_middleware(
        CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_methods=["GET", "POST", "DELETE"], allow_headers=["*"]
    )

    def require_key(x_reelix_key: Optional[str] = Header(default=None)) -> None:
        if settings.backend_api_key and not hmac.compare_digest(x_reelix_key or "", settings.backend_api_key):
            raise _err(401, "unauthorized", "Missing or invalid backend key.")

    @app.get("/api/v1/health", response_model=HealthOut)
    def health() -> HealthOut:
        return HealthOut(gemini_configured=settings.gemini_configured, model=settings.gemini_model or None, jobs=store.count(), version=VERSION)

    @app.post("/api/v1/analyze", response_model=JobOut, status_code=202, dependencies=[Depends(require_key)])
    def analyze(req: AnalyzeRequest) -> dict:
        url = canonical_youtube_url(req.url)
        if not url:
            raise _err(422, "unsupported_source", "Only public YouTube video links are supported right now.")
        if provider is None:
            raise _err(503, "provider_not_configured", "GEMINI_API_KEY and GEMINI_MODEL are not set on the backend.")
        params = AnalysisParams(
            mode=req.mode, url=url, creative_direction=req.creative_direction.strip(), aspect_ratio=req.aspect_ratio,
            length_preference=req.length_preference, auto_captions=req.auto_captions, target_entity=req.target_entity.strip(),
            condition=req.condition.strip(), target_total_duration_sec=req.target_total_duration_sec,
            selection_strategy=req.selection_strategy, include_replays=req.include_replays, min_status=req.min_status,
        )
        if req.mode == "timeline_search":
            fn = lambda set_phase: run_timeline_search(params, provider, set_phase, metadata_fn)  # noqa: E731
        else:
            fn = lambda set_phase: run_clip_discovery(params, provider, set_phase, metadata_fn, settings.max_clips)  # noqa: E731
        try:
            return store.submit(req.mode, params.cache_key(settings.gemini_model), fn)
        except JobStoreFull:
            raise _err(429, "busy", "The server is busy. Try again shortly.")

    @app.get("/api/v1/jobs/{job_id}", response_model=JobOut, dependencies=[Depends(require_key)])
    def get_job(job_id: str) -> dict:
        job = store.get(job_id)
        if not job:
            raise _err(404, "job_not_found", "Unknown or expired job.")
        return job

    @app.delete("/api/v1/jobs/{job_id}", status_code=204, dependencies=[Depends(require_key)])
    def cancel_job(job_id: str) -> None:
        store.cancel(job_id)

    return app


app = create_app()
