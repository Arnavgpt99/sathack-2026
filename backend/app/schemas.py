"""Request/response envelopes (Pydantic v2). Field names are camelCase on the wire to match types/studio.ts."""
from __future__ import annotations

from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class AnalyzeRequest(CamelModel):
    mode: Literal["clip_discovery", "timeline_search"] = "clip_discovery"
    url: str = Field(min_length=1, max_length=2048)
    creative_direction: str = Field(default="", max_length=2000)
    aspect_ratio: Literal["9:16", "1:1"] = "9:16"
    length_preference: Literal["under30", "30-60", "60-90"] = "30-60"
    auto_captions: bool = True
    # timeline_search only
    target_entity: str = Field(default="", max_length=200)
    condition: str = Field(default="", max_length=500)
    target_total_duration_sec: int = Field(default=0, ge=0, le=14400)
    selection_strategy: Literal["chronological", "highest_confidence"] = "chronological"
    include_replays: bool = False
    min_status: Literal["verified", "probable", "uncertain"] = "probable"

    @model_validator(mode="after")
    def _timeline_fields(self) -> "AnalyzeRequest":
        if self.mode == "timeline_search":
            if not self.target_entity.strip() or not self.condition.strip():
                raise ValueError("targetEntity and condition are required for timeline_search")
            if self.target_total_duration_sec <= 0:
                raise ValueError("targetTotalDurationSec must be > 0 for timeline_search")
        return self


class JobError(CamelModel):
    code: str
    message: str
    retryable: bool = False


class JobOut(CamelModel):
    job_id: str
    status: Literal["queued", "running", "completed", "failed", "cancelled"]
    phase: str
    mode: str
    cached: bool = False
    created_at: str
    updated_at: str
    result: Optional[Dict[str, Any]] = None  # shape is built by tested pure code; see types/studio.ts
    error: Optional[JobError] = None


class HealthOut(CamelModel):
    status: Literal["ok"] = "ok"
    gemini_configured: bool
    model: Optional[str] = None
    jobs: int
    version: str
