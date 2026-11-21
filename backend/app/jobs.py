"""In-process job store.

Honest limits (fine for a hackathon, not for production): state is lost on restart, and it is NOT
shared between worker processes — run uvicorn with a single worker. Progress is the real phase the
pipeline reported, not a fabricated percentage.
"""
from __future__ import annotations

import copy
import logging
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from .errors import ReelixError

log = logging.getLogger("reelix.jobs")


class JobCancelled(Exception):
    pass


class JobStoreFull(Exception):
    pass


def _iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).isoformat()


class JobStore:
    def __init__(
        self,
        max_workers: int = 2,
        ttl_sec: int = 3600,
        max_jobs: int = 200,
        cache_ttl_sec: int = 3600,
        clock: Callable[[], float] = time.time,
    ):
        self._pool = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="reelix-job")
        self._lock = threading.Lock()
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._cache: Dict[str, tuple] = {}
        self._ttl, self._max, self._cache_ttl, self._clock = ttl_sec, max_jobs, cache_ttl_sec, clock

    # -- public API ---------------------------------------------------------
    def submit(self, mode: str, cache_key: str, fn: Callable[[Callable[[str], None]], Dict[str, Any]]) -> Dict[str, Any]:
        now = self._clock()
        with self._lock:
            self._prune(now)
            if len(self._jobs) >= self._max:
                raise JobStoreFull()
            job_id = uuid.uuid4().hex
            hit = self._cache.get(cache_key)
            job = {"jobId": job_id, "status": "queued", "phase": "queued", "mode": mode, "cached": False,
                   "createdAt": now, "updatedAt": now, "result": None, "error": None, "_cache_key": cache_key}
            if hit and hit[0] > now:
                job.update(status="completed", phase="completed", cached=True, result=copy.deepcopy(hit[1]))
                self._jobs[job_id] = job
                return self._snapshot(job)
            self._jobs[job_id] = job
        self._pool.submit(self._run, job_id, fn)
        return self.get(job_id)  # type: ignore[return-value]

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            return self._snapshot(job) if job else None

    def cancel(self, job_id: str) -> bool:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or job["status"] in ("completed", "failed", "cancelled"):
                return False
            job.update(status="cancelled", phase="cancelled", updatedAt=self._clock())
            return True

    def count(self) -> int:
        with self._lock:
            return len(self._jobs)

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)

    # -- internals ----------------------------------------------------------
    def _snapshot(self, job: Dict[str, Any]) -> Dict[str, Any]:
        out = {k: v for k, v in job.items() if not k.startswith("_")}
        out["result"] = copy.deepcopy(job["result"])
        out["createdAt"], out["updatedAt"] = _iso(job["createdAt"]), _iso(job["updatedAt"])
        return out

    def _prune(self, now: float) -> None:
        for jid in [j for j, v in self._jobs.items() if v["status"] in ("completed", "failed", "cancelled") and now - v["updatedAt"] > self._ttl]:
            del self._jobs[jid]
        for k in [k for k, v in self._cache.items() if v[0] <= now]:
            del self._cache[k]
        while len(self._cache) > 100:
            self._cache.pop(next(iter(self._cache)))

    def _set_phase(self, job_id: str, phase: str) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or job["status"] == "cancelled":
                raise JobCancelled()
            job.update(status="running", phase=phase, updatedAt=self._clock())

    def _run(self, job_id: str, fn: Callable[[Callable[[str], None]], Dict[str, Any]]) -> None:
        try:
            self._set_phase(job_id, "validating_source")
            result = fn(lambda phase: self._set_phase(job_id, phase))
        except JobCancelled:
            return
        except ReelixError as e:
            self._finish(job_id, error={"code": e.code, "message": e.message, "retryable": e.retryable})
            return
        except Exception:  # never leak internals to the client
            log.exception("job %s crashed", job_id)
            self._finish(job_id, error={"code": "internal_error", "message": "Unexpected server error.", "retryable": False})
            return
        self._finish(job_id, result=result)

    def _finish(self, job_id: str, result: Optional[dict] = None, error: Optional[dict] = None) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or job["status"] == "cancelled":
                return
            now = self._clock()
            if error:
                job.update(status="failed", phase="failed", error=error, updatedAt=now)
            else:
                job.update(status="completed", phase="completed", result=result, updatedAt=now)
                self._cache[job["_cache_key"]] = (now + self._cache_ttl, copy.deepcopy(result))
