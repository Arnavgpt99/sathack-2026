"""Pure interval maths: parse, normalise, merge, and select a duration budget.

All arithmetic is in integer milliseconds so selected durations add up exactly.
Status ranks: verified > probable > uncertain. `not_match` is never kept.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, replace
from typing import List, Optional, Sequence, Tuple

STATUS_RANK = {"verified": 3, "probable": 2, "uncertain": 1}
MAX_MS = 24 * 3600 * 1000

_TC = re.compile(r"^\s*(?:(\d+):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\s*$")
_NUM = re.compile(r"^\s*\d+(?:\.\d+)?\s*$")


def parse_timecode(value: object) -> Optional[int]:
    """'MM:SS', 'H:MM:SS', '83', 83.5 -> milliseconds. Anything invalid -> None."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        if value != value or value < 0:  # NaN / negative
            return None
        ms = int(round(value * 1000))
        return ms if ms <= MAX_MS else None
    if isinstance(value, str):
        if _NUM.match(value):
            ms = int(round(float(value) * 1000))
            return ms if ms <= MAX_MS else None
        m = _TC.match(value)
        if not m:
            return None
        h, mi, s, frac = int(m.group(1) or 0), int(m.group(2)), int(m.group(3)), m.group(4)
        if s >= 60 or (m.group(1) is not None and mi >= 60):
            return None
        ms = ((h * 60 + mi) * 60 + s) * 1000 + int((frac or "0").ljust(3, "0")[:3])
        return ms if ms <= MAX_MS else None
    return None


def format_timecode(ms: int) -> str:
    total = max(0, int(ms)) // 1000
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


@dataclass(frozen=True)
class Interval:
    start_ms: int
    end_ms: int
    status: str = "uncertain"
    rationale: str = ""
    evidence: Tuple[dict, ...] = ()
    warnings: Tuple[str, ...] = ()
    trimmed: bool = False

    @property
    def duration_ms(self) -> int:
        return self.end_ms - self.start_ms


def _dedupe(items: Sequence[str]) -> Tuple[str, ...]:
    return tuple(dict.fromkeys(items))


def normalize_intervals(
    intervals: Sequence[Interval], video_duration_ms: Optional[int] = None
) -> Tuple[List[Interval], List[str]]:
    """Clip to the video, drop invalid/not_match, sort, and merge overlapping/touching intervals.

    When merged intervals disagree on status the *weaker* status is kept (conservative).
    Gaps between intervals are preserved and never counted.
    """
    warnings: List[str] = []
    kept: List[Interval] = []
    not_match = invalid = out_of_range = 0
    for iv in intervals:
        if iv.status == "not_match":
            not_match += 1
            continue
        status = iv.status if iv.status in STATUS_RANK else "uncertain"
        start, end = max(0, iv.start_ms), iv.end_ms
        if video_duration_ms is not None:
            if start >= video_duration_ms:
                out_of_range += 1
                continue
            end = min(end, video_duration_ms)
        if end <= start:
            invalid += 1
            continue
        kept.append(replace(iv, start_ms=start, end_ms=end, status=status))
    kept.sort(key=lambda i: (i.start_ms, i.end_ms))

    merged: List[Interval] = []
    for iv in kept:
        if merged and iv.start_ms <= merged[-1].end_ms:
            prev = merged[-1]
            status = prev.status if STATUS_RANK[prev.status] <= STATUS_RANK[iv.status] else iv.status
            extra = ["Merged overlapping intervals with different status; kept the weaker status."] if prev.status != iv.status else []
            merged[-1] = Interval(
                start_ms=prev.start_ms,
                end_ms=max(prev.end_ms, iv.end_ms),
                status=status,
                rationale=prev.rationale or iv.rationale,
                evidence=prev.evidence + iv.evidence,
                warnings=_dedupe(list(prev.warnings) + list(iv.warnings) + extra),
            )
        else:
            merged.append(iv)

    if not_match:
        warnings.append(f"Dropped {not_match} interval(s) marked not_match.")
    if invalid:
        warnings.append(f"Dropped {invalid} interval(s) with an invalid or empty time range.")
    if out_of_range:
        warnings.append(f"Dropped {out_of_range} interval(s) that start after the end of the video.")
    return merged, warnings


@dataclass(frozen=True)
class Selection:
    selected: List[Interval]
    selected_ms: int
    target_ms: int
    shortfall_ms: int
    target_met: bool
    excluded_by_status: int


def select_duration(
    intervals: Sequence[Interval],
    target_ms: int,
    strategy: str = "chronological",
    min_status: str = "probable",
    allow_trim: bool = True,
) -> Selection:
    """Pick qualifying intervals until the budget is filled. Never pads; reports any shortfall."""
    if target_ms <= 0:
        raise ValueError("target_ms must be positive")
    if strategy not in ("chronological", "highest_confidence"):
        raise ValueError(f"unknown strategy: {strategy}")
    if min_status not in STATUS_RANK:
        raise ValueError(f"unknown min_status: {min_status}")

    min_rank = STATUS_RANK[min_status]
    eligible = [i for i in intervals if STATUS_RANK.get(i.status, 0) >= min_rank]
    excluded = len(intervals) - len(eligible)
    if strategy == "chronological":
        order = sorted(eligible, key=lambda i: i.start_ms)
    else:
        order = sorted(eligible, key=lambda i: (-STATUS_RANK[i.status], -i.duration_ms, i.start_ms))

    chosen: List[Interval] = []
    remaining = target_ms
    for iv in order:
        if remaining <= 0:
            break
        if iv.duration_ms <= remaining:
            chosen.append(iv)
            remaining -= iv.duration_ms
        elif allow_trim:
            chosen.append(
                replace(
                    iv,
                    end_ms=iv.start_ms + remaining,
                    trimmed=True,
                    warnings=_dedupe(list(iv.warnings) + ["Trimmed to fit the duration target."]),
                )
            )
            remaining = 0
    chosen.sort(key=lambda i: i.start_ms)
    total = sum(i.duration_ms for i in chosen)
    return Selection(chosen, total, target_ms, target_ms - total, total == target_ms, excluded)
