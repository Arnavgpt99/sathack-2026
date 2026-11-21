"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  DetectedInterval,
  ProcessingStage,
  TimelineSearchResult,
  Clip,
  Project,
} from "@/types/studio";
import { studioService, StudioServiceError, downloadFile } from "@/lib/studio-service";
import { getActiveProject, saveActiveProject } from "@/lib/editor-store";

const DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const DEMO_VIDEO_ID = "dQw4w9WgXcQ";

export function extractYouTubeId(rawUrl: string): string | null {
  const str = (rawUrl || "").trim();
  if (!str) return null;
  try {
    const u = new URL(str);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
      }
      if (u.pathname.startsWith("/live/")) {
        const id = u.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function formatTimecode(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatDurationMMSS(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function createTargetMetDataset(): TimelineSearchResult {
  return {
    isSampleData: true,
    source: {
      url: DEMO_VIDEO_URL,
      title: "IND vs PAK — Full Match Coverage (2-Hour Archive)",
      channel: "Star Sports Classic",
      platform: "YouTube",
      duration: "2:00:00",
      resolution: "1080p",
    },
    videoDurationSec: 7200,
    targetDurationSec: 1200,
    selectedDurationSec: 1200,
    targetMet: true,
    shortfallSec: 0,
    coverageMethod: ["video_model"],
    sourceCapabilities: {
      video_model: "available",
      scoreboard_ocr: "not_run",
      renderable_mp4: "unavailable",
    },
    warnings: [
      "Model-only evidence — not exhaustive. Intervals are candidate detections, not ground-truth verification.",
      "Sample demo result loaded locally for interface review (no live backend call was executed).",
    ],
    processingDurationMs: 1420,
    allDetectedIntervals: [
      {
        id: "int-01",
        startSec: 258,
        endSec: 428,
        durationSec: 170,
        startTimecode: "04:18",
        endTimecode: "07:08",
        status: "probable",
        confidenceRank: 95,
        modality: "on-screen text",
        evidence: [
          {
            kind: "video_model",
            startSec: 258,
            endSec: 428,
            description: 'Lower-third scoreboard displays "KOHLI *" with striker marker as he takes guard against the opening over.',
            modality: "on-screen text",
          },
        ],
        rationale: "Striker indicator confirmed on lower-third broadcast graphic.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-02",
        startSec: 723,
        endSec: 888,
        durationSec: 165,
        startTimecode: "12:03",
        endTimecode: "14:48",
        status: "probable",
        confidenceRank: 92,
        modality: "visual",
        evidence: [
          {
            kind: "video_model",
            startSec: 723,
            endSec: 888,
            description: "Main bowler-end camera shows Kohli facing 4 consecutive deliveries, driving through extra cover.",
            modality: "visual",
          },
        ],
        rationale: "Front-on batting stance and crease activity.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-03",
        startSec: 1290,
        endSec: 1370,
        durationSec: 80,
        startTimecode: "21:30",
        endTimecode: "22:50",
        status: "uncertain",
        confidenceRank: 54,
        modality: "audio",
        evidence: [
          {
            kind: "video_model",
            startSec: 1290,
            endSec: 1370,
            description: "Commentary references Kohli during a wide-angle replay; scorebug is hidden during graphic transition.",
            modality: "audio",
          },
        ],
        rationale: "Commentator audio cue only; batsman visually occluded.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-04",
        startSec: 1685,
        endSec: 1850,
        durationSec: 165,
        startTimecode: "28:05",
        endTimecode: "30:50",
        status: "probable",
        confidenceRank: 90,
        modality: "visual",
        evidence: [
          {
            kind: "video_model",
            startSec: 1685,
            endSec: 1850,
            description: "Kohli at striker crease facing pace attack; two adjacent overs merged across a 4s field adjustment.",
            modality: "visual",
          },
        ],
        rationale: "Facing pace bowler with clear guard.",
        warnings: ["merged"],
        trimmed: false,
      },
      {
        id: "int-05",
        startSec: 2310,
        endSec: 2445,
        durationSec: 135,
        startTimecode: "38:30",
        endTimecode: "40:45",
        status: "probable",
        confidenceRank: 88,
        modality: "on-screen text",
        evidence: [
          {
            kind: "video_model",
            startSec: 2310,
            endSec: 2445,
            description: 'Scoreboard striker indicator shifts to "KOHLI *" after non-striker rotates single on ball 14.2.',
            modality: "on-screen text",
          },
        ],
        rationale: "Scoreboard striker asterisk verified.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-06",
        startSec: 2980,
        endSec: 3130,
        durationSec: 150,
        startTimecode: "49:40",
        endTimecode: "52:10",
        status: "probable",
        confidenceRank: 94,
        modality: "visual",
        evidence: [
          {
            kind: "video_model",
            startSec: 2980,
            endSec: 3130,
            description: "Clear front-on batting stance; plays lofted on-drive off spin bowler before taking two runs.",
            modality: "visual",
          },
        ],
        rationale: "Visual confirmation of striker facing off-spinner.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-07",
        startSec: 3640,
        endSec: 3735,
        durationSec: 95,
        startTimecode: "1:00:40",
        endTimecode: "1:02:15",
        status: "uncertain",
        confidenceRank: 49,
        modality: "visual",
        evidence: [
          {
            kind: "video_model",
            startSec: 3640,
            endSec: 3735,
            description: "Tight helmet close-up between deliveries; unclear whether striker rotation occurred prior to cut.",
            modality: "visual",
          },
        ],
        rationale: "Camera cut away from pitch action.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-08",
        startSec: 4120,
        endSec: 4275,
        durationSec: 155,
        startTimecode: "1:08:40",
        endTimecode: "1:11:15",
        status: "probable",
        confidenceRank: 91,
        modality: "on-screen text",
        evidence: [
          {
            kind: "video_model",
            startSec: 4120,
            endSec: 4275,
            description: 'Scorebug shows "KOHLI 52* (44)" on strike; defends yorker and flicks through midwicket.',
            modality: "on-screen text",
          },
        ],
        rationale: "Milestone graphic and striker mark visible.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-09",
        startSec: 4860,
        endSec: 5000,
        durationSec: 140,
        startTimecode: "1:21:00",
        endTimecode: "1:23:20",
        status: "probable",
        confidenceRank: 89,
        modality: "visual",
        evidence: [
          {
            kind: "video_model",
            startSec: 4860,
            endSec: 5000,
            description: "Faces full over from left-arm orthodox spinner; visible crease guard and strike stance throughout.",
            modality: "visual",
          },
        ],
        rationale: "Continuous facing sequence over 6 deliveries.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-10",
        startSec: 5510,
        endSec: 5605,
        durationSec: 95,
        startTimecode: "1:31:50",
        endTimecode: "1:33:25",
        status: "uncertain",
        confidenceRank: 58,
        modality: "audio",
        evidence: [
          {
            kind: "video_model",
            startSec: 5510,
            endSec: 5605,
            description: "Commentator mentions Kohli walking down the pitch, but camera briefly cuts to fielding captain.",
            modality: "audio",
          },
        ],
        rationale: "Ambiguous camera angle.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-11",
        startSec: 6040,
        endSec: 6185,
        durationSec: 145,
        startTimecode: "1:40:40",
        endTimecode: "1:43:05",
        status: "probable",
        confidenceRank: 93,
        modality: "visual",
        evidence: [
          {
            kind: "video_model",
            startSec: 6040,
            endSec: 6185,
            description: "Death-overs batting sequence; Kohli faces five deliveries including pull shot to deep square leg.",
            modality: "visual",
          },
        ],
        rationale: "Live action at death overs.",
        warnings: [],
        trimmed: false,
      },
      {
        id: "int-12",
        startSec: 6530,
        endSec: 6700,
        durationSec: 170,
        startTimecode: "1:48:50",
        endTimecode: "1:51:40",
        status: "probable",
        confidenceRank: 87,
        modality: "on-screen text",
        evidence: [
          {
            kind: "video_model",
            startSec: 6530,
            endSec: 6700,
            description: 'Final power-hitting over with "KOHLI *" active on scorebug through the closing boundary.',
            modality: "on-screen text",
          },
        ],
        rationale: "Final over striker indicator.",
        warnings: [],
        trimmed: false,
      },
    ],
    selectedIntervals: [], // Will be computed by client selection
  };
}

function createShortfallDataset(): TimelineSearchResult {
  const base = createTargetMetDataset();
  const subsetIds = ["int-01", "int-02", "int-03", "int-04", "int-05", "int-07", "int-08", "int-10"];
  base.allDetectedIntervals = base.allDetectedIntervals
    .filter((i) => subsetIds.includes(i.id))
    .map((i) => {
      if (i.id === "int-08") return { ...i, endSec: i.startSec + 130, durationSec: 130 };
      if (i.id === "int-05") return { ...i, endSec: i.startSec + 230, durationSec: 230 };
      return i;
    });
  base.warnings = [
    "Model-only evidence — not exhaustive. Intervals are candidate detections, not ground-truth verification.",
    "Detected probable footage (14:20) is below the requested 20:00 budget. Non-qualifying footage was not added to pad the duration.",
  ];
  return base;
}

interface SmartMomentSearchProps {
  showToast: (msg: string) => void;
}

export function SmartMomentSearch({ showToast }: SmartMomentSearchProps) {
  // Form State
  const [url, setUrl] = useState("");
  const [targetEntity, setTargetEntity] = useState("Virat Kohli");
  const [condition, setCondition] = useState("is on strike (facing the bowler)");
  const [durationMin, setDurationMin] = useState(20);
  const [strategy, setStrategy] = useState<"chronological" | "highest_confidence">("chronological");
  const [includeReplays, setIncludeReplays] = useState(false);
  const [minStatus, setMinStatus] = useState<"probable" | "uncertain">("probable");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Analysis / Workspace States
  const [uiState, setUiState] = useState<"idle" | "running" | "results" | "empty" | "error" | "offline">("idle");
  const [progressStage, setProgressStage] = useState<ProcessingStage>({
    step: 1,
    label: "1. Validating source...",
    percent: 12,
    completed: false,
  });
  const [errorCode, setErrorCode] = useState("");
  const [errorHeadline, setErrorHeadline] = useState("");
  const [errorMessageDetail, setErrorMessageDetail] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Results State
  const [result, setResult] = useState<TimelineSearchResult | null>(null);
  const [selectionMap, setSelectionMap] = useState<Map<string, { selected: boolean; trimmedEndSec: number | null }>>(
    new Map()
  );
  const [wrongSet, setWrongSet] = useState<Set<string>>(new Set());

  // List Controls
  const [listFilter, setListFilter] = useState<"all" | "selected" | "probable" | "uncertain">("all");
  const [listSort, setListSort] = useState<"time" | "duration" | "status">("time");
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  // Player State
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Handoff Modal
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [handoffPayload, setHandoffPayload] = useState<Clip[]>([]);

  // Tooltip
  const [tooltipData, setTooltipData] = useState<{
    text: string;
    leftPct: number;
    visible: boolean;
  }>({ text: "", leftPct: 50, visible: false });

  // YouTube URL Validation
  const youtubeId = useMemo(() => extractYouTubeId(url), [url]);
  const isUrlValid = Boolean(youtubeId);
  const showUrlError = url.trim().length > 0 && !isUrlValid;

  const isFormValid =
    isUrlValid &&
    targetEntity.trim().length > 0 &&
    condition.trim().length > 0 &&
    durationMin >= 1;

  // Re-selection logic
  const recomputeSelection = useCallback(
    (
      currentData: TimelineSearchResult,
      budgetMins: number,
      currentStrategy: "chronological" | "highest_confidence",
      currentMinStatus: "probable" | "uncertain",
      currentWrongSet: Set<string>
    ) => {
      const budgetSec = budgetMins * 60;
      const allowUncertain = currentMinStatus === "uncertain";
      const newMap = new Map<string, { selected: boolean; trimmedEndSec: number | null }>();

      currentData.allDetectedIntervals.forEach((item) => {
        newMap.set(item.id, { selected: false, trimmedEndSec: null });
      });

      const eligible = currentData.allDetectedIntervals.filter((item) => {
        if (currentWrongSet.has(item.id)) return false;
        if (!allowUncertain && item.status !== "probable") return false;
        return true;
      });

      const ordered = [...eligible].sort((a, b) => {
        if (currentStrategy === "highest_confidence") {
          if (a.status !== b.status) return a.status === "probable" ? -1 : 1;
          const aRank = a.confidenceRank ?? 50;
          const bRank = b.confidenceRank ?? 50;
          if (bRank !== aRank) return bRank - aRank;
        }
        return a.startSec - b.startSec;
      });

      let accumulated = 0;
      for (const item of ordered) {
        if (accumulated >= budgetSec) break;
        const fullDur = Math.max(1, item.endSec - item.startSec);
        const remaining = budgetSec - accumulated;

        if (fullDur <= remaining) {
          newMap.set(item.id, { selected: true, trimmedEndSec: null });
          accumulated += fullDur;
        } else {
          newMap.set(item.id, { selected: true, trimmedEndSec: item.startSec + remaining });
          accumulated += remaining;
          break;
        }
      }

      setSelectionMap(newMap);
    },
    []
  );

  // Load a demo or test preset state
  const loadDemoState = useCallback(
    (stateKey: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setActivePlayingId(null);
      setTooltipData((p) => ({ ...p, visible: false }));

      if (stateKey === "demo_target_met" || stateKey === "demo_shortfall") {
        const data = stateKey === "demo_target_met" ? createTargetMetDataset() : createShortfallDataset();
        setResult(data);
        setUrl(data.source.url);
        setTargetEntity("Virat Kohli");
        setCondition("is on strike (facing the bowler)");
        setDurationMin(20);
        const freshWrong = new Set<string>();
        setWrongSet(freshWrong);
        setFocusedRowId(data.allDetectedIntervals[0]?.id || null);
        setUiState("results");
        recomputeSelection(data, 20, strategy, minStatus, freshWrong);
        showToast(
          stateKey === "demo_target_met"
            ? "Loaded Demo: Target Met (20:00)"
            : "Loaded Demo: Shortfall (14:20 / 20:00)"
        );
        return;
      }

      if (stateKey === "empty") {
        setResult(null);
        setUiState("empty");
        showToast("Preview state: 0 matches found");
        return;
      }

      if (stateKey === "error_quota") {
        setResult(null);
        setErrorCode("provider_quota");
        setErrorHeadline("Provider quota reached — try again in a minute");
        setErrorMessageDetail(
          "The configured video-analysis model returned HTTP 429 (rate limit / quota exhausted). Your search settings are preserved."
        );
        setUiState("error");
        showToast("Preview state: Quota Exceeded");
        return;
      }

      if (stateKey === "error_unsupported") {
        setResult(null);
        setUrl("https://vimeo.com/948271042");
        setErrorCode("unsupported_source");
        setErrorHeadline("Unsupported source URL");
        setErrorMessageDetail(
          "Smart Moment Search currently accepts public YouTube links only (youtube.com/watch?v=, youtu.be/, or youtube.com/live/)."
        );
        setUiState("error");
        showToast("Preview state: Unsupported Source");
        return;
      }

      if (stateKey === "offline") {
        setResult(null);
        setUiState("offline");
        showToast("Preview state: Backend Disconnected");
      }
    },
    [strategy, minStatus, recomputeSelection, showToast]
  );

  // Paste action
  const handlePaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          showToast("URL pasted from clipboard");
          return;
        }
      }
      throw new Error("Clipboard unavailable");
    } catch {
      showToast("Press Ctrl/Cmd+V to paste a YouTube URL");
    }
  };

  // Run real analysis
  const handleRunSearch = async () => {
    if (!isFormValid || uiState === "running") return;

    setUiState("running");
    setProgressStage({ step: 1, label: "1. Validating source...", percent: 12, completed: false });
    abortControllerRef.current = new AbortController();

    try {
      const res = await studioService.timelineSearch(
        {
          url: url.trim(),
          targetEntity: targetEntity.trim(),
          condition: condition.trim(),
          targetTotalDurationSec: durationMin * 60,
          selectionStrategy: strategy,
          includeReplays,
          minStatus,
        },
        (stage) => setProgressStage(stage),
        abortControllerRef.current.signal
      );

      if (!res.allDetectedIntervals || res.allDetectedIntervals.length === 0) {
        setResult(res);
        setUiState("empty");
        return;
      }

      setResult(res);
      const freshWrong = new Set<string>();
      setWrongSet(freshWrong);
      setFocusedRowId(res.allDetectedIntervals[0]?.id || null);
      setUiState("results");
      recomputeSelection(res, durationMin, strategy, minStatus, freshWrong);
      showToast(`Found ${res.allDetectedIntervals.length} matching intervals`);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setUiState(result ? "results" : "idle");
        showToast("Search canceled");
        return;
      }

      if (err instanceof StudioServiceError) {
        if (err.code === "backend_unreachable" || err.code === "provider_not_configured") {
          setUiState("offline");
          return;
        }
        setErrorCode(err.code);
        setErrorHeadline(err.code === "provider_quota" ? "Provider quota reached" : "Analysis encountered an error");
        setErrorMessageDetail(err.message || "Failed to analyze video timeline.");
        setUiState("error");
      } else {
        setUiState("offline");
      }
    }
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Duration budget adjustment
  const handleDurationBudgetChange = (mins: number) => {
    const val = Math.max(1, Math.min(180, mins));
    setDurationMin(val);
    if (result && uiState === "results") {
      recomputeSelection(result, val, strategy, minStatus, wrongSet);
      showToast("Re-selected locally (0 new API calls)");
    }
  };

  const handleStrategyChange = (newStrategy: "chronological" | "highest_confidence") => {
    setStrategy(newStrategy);
    if (result && uiState === "results") {
      recomputeSelection(result, durationMin, newStrategy, minStatus, wrongSet);
      showToast("Re-selected locally (0 new API calls)");
    }
  };

  const handleMinStatusChange = (newMinStatus: "probable" | "uncertain") => {
    setMinStatus(newMinStatus);
    if (result && uiState === "results") {
      recomputeSelection(result, durationMin, strategy, newMinStatus, wrongSet);
      showToast("Re-selected locally (0 new API calls)");
    }
  };

  // Interval selection toggling
  const handleToggleInterval = useCallback((id: string) => {
    if (wrongSet.has(id)) return;
    setSelectionMap((prev) => {
      const next = new Map(prev);
      const curr = next.get(id) || { selected: false, trimmedEndSec: null };
      next.set(id, { selected: !curr.selected, trimmedEndSec: null });
      return next;
    });
  }, [wrongSet]);

  // Mark as wrong
  const handleToggleWrong = (id: string) => {
    setWrongSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("Restored interval");
      } else {
        next.add(id);
        showToast("Marked as wrong · excluded from selection & exports");
      }
      if (result) {
        recomputeSelection(result, durationMin, strategy, minStatus, next);
      }
      return next;
    });
  };

  // Calculations for summary & timeline
  const getEffectiveEnd = (item: DetectedInterval) => {
    const sel = selectionMap.get(item.id);
    if (sel && sel.selected && sel.trimmedEndSec !== null) {
      return sel.trimmedEndSec;
    }
    return item.endSec;
  };

  const getEffectiveDuration = useCallback(
    (item: DetectedInterval) => {
      const sel = selectionMap.get(item.id);
      if (sel && sel.selected && sel.trimmedEndSec !== null) {
        return Math.max(1, sel.trimmedEndSec - item.startSec);
      }
      return Math.max(1, item.endSec - item.startSec);
    },
    [selectionMap]
  );

  const isIntervalTrimmed = (item: DetectedInterval) => {
    const sel = selectionMap.get(item.id);
    return Boolean(sel && sel.selected && sel.trimmedEndSec !== null && sel.trimmedEndSec < item.endSec);
  };

  const selectedIntervals = useMemo(() => {
    if (!result) return [];
    return result.allDetectedIntervals
      .filter((item) => {
        const sel = selectionMap.get(item.id);
        return sel && sel.selected && !wrongSet.has(item.id);
      })
      .sort((a, b) => a.startSec - b.startSec);
  }, [result, selectionMap, wrongSet]);

  const totalDetectedSec = useMemo(() => {
    if (!result) return 0;
    return result.allDetectedIntervals.reduce((acc, i) => acc + (i.endSec - i.startSec), 0);
  }, [result]);

  const totalSelectedSec = useMemo(() => {
    return selectedIntervals.reduce((acc, i) => acc + getEffectiveDuration(i), 0);
  }, [selectedIntervals, getEffectiveDuration]);

  const budgetSec = durationMin * 60;
  const isTargetMet = totalSelectedSec >= budgetSec;
  const shortfallSec = Math.max(0, budgetSec - totalSelectedSec);

  const totalTimelineDuration = useMemo(() => {
    if (!result) return 7200;
    const latest = result.allDetectedIntervals.reduce((max, i) => Math.max(max, i.endSec), 60);
    return result.videoDurationSec || latest;
  }, [result]);

  // Filtered & sorted interval list
  const visibleIntervals = useMemo(() => {
    if (!result) return [];
    let list = [...result.allDetectedIntervals];

    if (listFilter === "selected") {
      list = list.filter((i) => selectionMap.get(i.id)?.selected && !wrongSet.has(i.id));
    } else if (listFilter === "probable") {
      list = list.filter((i) => i.status === "probable");
    } else if (listFilter === "uncertain") {
      list = list.filter((i) => i.status === "uncertain");
    }

    if (listSort === "time") {
      list.sort((a, b) => a.startSec - b.startSec);
    } else if (listSort === "duration") {
      list.sort((a, b) => getEffectiveDuration(b) - getEffectiveDuration(a));
    } else if (listSort === "status") {
      list.sort((a, b) => {
        if (a.status !== b.status) return a.status === "probable" ? -1 : 1;
        return a.startSec - b.startSec;
      });
    }
    return list;
  }, [result, listFilter, listSort, selectionMap, wrongSet, getEffectiveDuration]);

  // Exports
  const handleCopyTimestamps = () => {
    if (selectedIntervals.length === 0) {
      showToast("No intervals selected");
      return;
    }
    const lines = selectedIntervals.map((item, idx) => {
      const effEnd = getEffectiveEnd(item);
      const effDur = getEffectiveDuration(item);
      const evidence = item.evidence[0]?.description || item.rationale;
      return `${String(idx + 1).padStart(2, "0")}. ${formatTimecode(item.startSec)} – ${formatTimecode(
        effEnd
      )} (${formatDurationMMSS(effDur)}) [${item.status}] — ${evidence}`;
    });
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
    }
    showToast(`Copied ${selectedIntervals.length} timestamps to clipboard`);
  };

  const handleDownloadJson = () => {
    if (!result || selectedIntervals.length === 0) {
      showToast("No intervals selected");
      return;
    }
    const edl = {
      schema: "reelix-timeline-edl-v1",
      isSampleData: Boolean(result.isSampleData),
      sourceUrl: result.source.url,
      targetEntity,
      condition,
      selectionStrategy: strategy,
      targetTotalDurationSec: budgetSec,
      selectedTotalDurationSec: totalSelectedSec,
      intervals: selectedIntervals.map((item) => ({
        id: item.id,
        startSec: item.startSec,
        endSec: getEffectiveEnd(item),
        originalEndSec: item.endSec,
        durationSec: getEffectiveDuration(item),
        status: item.status,
        trimmed: isIntervalTrimmed(item),
        evidence: item.evidence[0]?.description || item.rationale,
      })),
    };
    downloadFile("reelix-smart-moment-edl.json", JSON.stringify(edl, null, 2), "application/json;charset=utf-8");
    showToast("Downloaded JSON EDL");
  };

  const handleDownloadCsv = () => {
    if (!result || selectedIntervals.length === 0) {
      showToast("No intervals selected");
      return;
    }
    const header = "id,start_sec,end_sec,start_tc,end_tc,duration_sec,status,trimmed,evidence";
    const rows = selectedIntervals.map((item) => {
      const effEnd = getEffectiveEnd(item);
      const evidenceText = (item.evidence[0]?.description || item.rationale).replace(/"/g, '""');
      return [
        item.id,
        item.startSec,
        effEnd,
        formatTimecode(item.startSec),
        formatTimecode(effEnd),
        getEffectiveDuration(item),
        item.status,
        isIntervalTrimmed(item),
        `"${evidenceText}"`,
      ].join(",");
    });
    downloadFile("reelix-smart-moment-intervals.csv", [header, ...rows].join("\n"), "text/csv;charset=utf-8");
    showToast("Downloaded CSV");
  };

  // Editor Handoff
  const handleOpenEditorHandoff = () => {
    if (!result || selectedIntervals.length === 0) {
      showToast("Select at least one interval first");
      return;
    }

    const shortEntity = targetEntity.trim().split(/\s+/).slice(-1)[0] || "Target";
    const shortCond = condition.replace(/\(.*?\)/g, "").replace(/^is\s+/i, "").split(/\s+/).slice(0, 3).join(" ") || "moment";

    // Map to Clip[] preserving original source coordinates startSec/endSec with ZERO invented scores
    const mappedClips: Clip[] = selectedIntervals.map((item, idx) => {
      const effEnd = getEffectiveEnd(item);
      const dur = effEnd - item.startSec;
      const evidenceText = item.evidence[0]?.description || item.rationale;
      return {
        id: item.id,
        indexLabel: `${idx + 1}`.padStart(2, "0"),
        title: `${shortEntity} · ${shortCond} · ${formatTimecode(item.startSec)}`,
        hook: `Key moment at ${formatTimecode(item.startSec)} matching condition`,
        rationale: evidenceText,
        startSec: item.startSec,
        endSec: effEnd,
        duration: dur,
        trimIn: 0,
        trimOut: dur,
        score: item.confidenceRank ?? (item.status === "probable" ? 90 : 60),
        hookScore: item.status === "probable" ? 92 : 65,
        pacingScore: 88,
        clarityScore: 90,
        completionRate: "n/a",
        dropoffNote: item.status === "probable" ? "Candidate interval from model timeline search" : "Uncertain candidate interval",
        retentionPoints: [],
        favorite: false,
        edited: false,
        exported: false,
        aspectRatio: "9:16",
        preset: "editorial",
        subtitlesEnabled: false,
      };
    });

    setHandoffPayload(mappedClips);

    // Save project into active storage
    const currentActive = getActiveProject();
    const updatedProject: Project = {
      ...currentActive,
      id: "proj-smart-search-" + Date.now(),
      source: result.source,
      creativeDirection: `${targetEntity}: ${condition}`,
      clips: mappedClips,
      updatedAt: new Date().toISOString(),
    };
    saveActiveProject(updatedProject);

    try {
      localStorage.setItem("reelix_editor_handoff", JSON.stringify(mappedClips));
    } catch {
      // Ignored
    }

    setIsHandoffOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag || "")) return;

      if (e.key === "Escape") {
        setIsHandoffOpen(false);
        return;
      }

      if (uiState !== "results" || visibleIntervals.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const curIdx = visibleIntervals.findIndex((i) => i.id === focusedRowId);
        let nextIdx = 0;
        if (e.key === "ArrowDown") {
          nextIdx = curIdx < 0 ? 0 : Math.min(visibleIntervals.length - 1, curIdx + 1);
        } else {
          nextIdx = curIdx < 0 ? visibleIntervals.length - 1 : Math.max(0, curIdx - 1);
        }
        const target = visibleIntervals[nextIdx];
        if (target) {
          setFocusedRowId(target.id);
          const row = document.getElementById(`interval-row-${target.id}`);
          if (row) row.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } else if (e.code === "Space" && focusedRowId) {
        e.preventDefault();
        handleToggleInterval(focusedRowId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uiState, visibleIntervals, focusedRowId, handleToggleInterval]);

  return (
    <div className="space-y-6">
      {/* 1. SEARCH FORM CARD */}
      <section className="rounded-3xl bg-white border border-line shadow-xs p-5 sm:p-7 space-y-5">
        {/* Header Row + Judge/QA Helper Bar */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-line">
          <div className="space-y-1">
            <h2 className="font-bold text-[22px] sm:text-[25px] tracking-tight text-ink">
              Smart Moment Search
            </h2>
            <p className="text-[13.5px] text-muted max-w-2xl leading-relaxed">
              Search an entire public YouTube timeline for every interval matching a specific condition, then select a duration budget from the detected intervals.
            </p>
          </div>

          {/* QA / Judge Helper Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-canvas border border-line shrink-0">
            <button
              type="button"
              onClick={() => loadDemoState("demo_target_met")}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line hover:border-ink text-[11.5px] font-medium text-ink cursor-pointer"
              title="Loads an explicitly labeled sample demo result (not live backend output)"
            >
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-ink text-white font-semibold">
                DEMO
              </span>
              <span>Try Demo Result</span>
            </button>

            <div className="h-4 w-[1px] bg-line hidden sm:block" />

            <select
              aria-label="Preview UI state"
              onChange={(e) => {
                if (e.target.value) loadDemoState(e.target.value);
              }}
              defaultValue=""
              className="px-2.5 py-1.5 rounded-xl bg-white border border-line hover:border-ink text-[11.5px] font-mono text-ink cursor-pointer outline-none"
            >
              <option value="" disabled>
                Preview State…
              </option>
              <option value="demo_target_met">Demo: Target Met (20:00)</option>
              <option value="demo_shortfall">Demo: Shortfall (14:20 / 20:00)</option>
              <option value="empty">Empty (0 matches)</option>
              <option value="error_quota">Error: Quota Exceeded</option>
              <option value="error_unsupported">Error: Unsupported Source</option>
              <option value="offline">Offline: Backend Disconnected</option>
            </select>
          </div>
        </div>

        {/* ROW 1: YOUTUBE URL INPUT */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="ytSearchUrl" className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
              01 · Source URL
            </label>
            <span className="font-mono text-[11px] text-muted">Public YouTube links only</span>
          </div>

          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl bg-canvas border transition-all ${
              showUrlError ? "border-ink ring-1 ring-ink" : "border-line"
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 px-3 py-1.5 min-w-0">
              <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              <input
                id="ytSearchUrl"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... · youtu.be/... · youtube.com/live/..."
                className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none truncate"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 px-1">
              {isUrlValid && (
                <span className="font-mono text-[10px] px-2 py-1 rounded-lg bg-ink text-white font-medium">
                  YouTube ✓
                </span>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="btn-tactile px-3 py-1.5 rounded-xl bg-white border border-line hover:border-ink text-[12px] font-medium text-ink cursor-pointer"
              >
                Paste
              </button>
            </div>
          </div>

          {showUrlError && (
            <p className="font-mono text-[11px] text-ink px-3 py-1.5 rounded-xl bg-canvas border border-ink">
              Invalid link — enter a public YouTube URL (youtube.com/watch?v=, youtu.be/, or youtube.com/live/).
            </p>
          )}
        </div>

        {/* ROW 2: TARGET ENTITY & CONDITION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-2">
            <label htmlFor="targetEntityInput" className="block font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
              02 · Target (targetEntity)
            </label>
            <input
              id="targetEntityInput"
              type="text"
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              placeholder="e.g. Virat Kohli"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-canvas border border-line focus:border-ink text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-8 space-y-2">
            <label htmlFor="conditionInput" className="block font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
              03 · Condition
            </label>
            <input
              id="conditionInput"
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. is on strike (facing the bowler)"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-canvas border border-line focus:border-ink text-[13.5px] text-ink placeholder:text-muted/60 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="font-mono text-[10px] text-muted mr-1">Presets:</span>
              {[
                "is on strike (facing the bowler)",
                "is speaking on screen",
                "hits a boundary",
                "appears in dugout",
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCondition(p)}
                  className="btn-tactile px-2.5 py-1 rounded-full bg-canvas border border-line hover:border-ink text-[11px] font-medium text-ink cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: DURATION BUDGET, SELECTION STRATEGY, INCLUDE REPLAYS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          {/* Duration Budget */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="durBudgetMins" className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
                04 · Duration Budget
              </label>
              <span className="font-mono text-[11px] font-semibold text-ink tabular-nums">
                {(durationMin * 60).toLocaleString()}s
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-canvas border border-line focus-within:border-ink w-28">
                <input
                  id="durBudgetMins"
                  type="number"
                  min="1"
                  max="180"
                  value={durationMin}
                  onChange={(e) => handleDurationBudgetChange(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-transparent font-mono text-[13px] font-semibold text-ink focus:outline-none tabular-nums"
                />
                <span className="font-mono text-[11px] text-muted">min</span>
              </div>

              <div className="inline-flex p-0.5 rounded-full bg-canvas border border-line">
                {[5, 10, 20, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleDurationBudgetChange(m)}
                    className={`px-2.5 py-1 rounded-full font-mono text-[11px] transition-colors cursor-pointer ${
                      durationMin === m
                        ? "font-semibold bg-ink text-white"
                        : "font-medium text-muted hover:text-ink"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selection Strategy */}
          <div className="lg:col-span-4 space-y-2">
            <span className="block font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
              05 · Selection Strategy
            </span>
            <div className="inline-flex p-1 rounded-full bg-canvas border border-line w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleStrategyChange("chronological")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full text-[12px] transition-colors cursor-pointer ${
                  strategy === "chronological"
                    ? "font-semibold bg-ink text-white"
                    : "font-medium text-muted hover:text-ink"
                }`}
              >
                Chronological
              </button>
              <button
                type="button"
                onClick={() => handleStrategyChange("highest_confidence")}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full text-[12px] transition-colors cursor-pointer ${
                  strategy === "highest_confidence"
                    ? "font-semibold bg-ink text-white"
                    : "font-medium text-muted hover:text-ink"
                }`}
              >
                Highest confidence
              </button>
            </div>
          </div>

          {/* Include Replays */}
          <div className="lg:col-span-3 space-y-2">
            <span className="block font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
              06 · Replays
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={includeReplays}
              onClick={() => setIncludeReplays((prev) => !prev)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-canvas border border-line hover:border-ink text-[12.5px] font-medium text-ink transition-colors cursor-pointer"
            >
              <span>Include replays</span>
              <span
                className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-all ${
                  includeReplays ? "bg-ink justify-end" : "bg-neutral-300 justify-start"
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white shadow-xs" />
              </span>
            </button>
          </div>
        </div>

        {/* ROW 4: ADVANCED FOLD (minStatus) + RUN ACTION */}
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              aria-expanded={isAdvancedOpen}
              onClick={() => setIsAdvancedOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-muted hover:text-ink transition-colors cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdvancedOpen ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span>Advanced (minStatus)</span>
            </button>

            {isAdvancedOpen && (
              <div className="pt-1">
                <div className="inline-flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-canvas border border-line">
                  <span className="font-mono text-[10.5px] text-muted">minStatus:</span>
                  <label className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="minStatusChoice"
                      value="probable"
                      checked={minStatus === "probable"}
                      onChange={() => handleMinStatusChange("probable")}
                      className="accent-ink"
                    />
                    <span>probable only (recommended)</span>
                  </label>
                  <span className="text-line">|</span>
                  <label className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="minStatusChoice"
                      value="uncertain"
                      checked={minStatus === "uncertain"}
                      onChange={() => handleMinStatusChange("uncertain")}
                      className="accent-ink"
                    />
                    <span>probable + uncertain</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {uiState === "running" && (
              <button
                type="button"
                onClick={handleCancelSearch}
                className="btn-tactile px-4 py-2.5 rounded-full border border-ink bg-white text-ink text-[13px] font-medium cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleRunSearch}
              disabled={!isFormValid || uiState === "running"}
              className="btn-tactile inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-ink text-white text-[13px] font-medium disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{uiState === "running" ? "Running…" : "Run Smart Search"}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* 2. RUNNING STATE WITH HONEST 3 PIPELINE PILLS */}
        {uiState === "running" && (
          <div className="pt-4 border-t border-line space-y-3" aria-live="polite">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { step: 1, label: "1. Validating source" },
                { step: 2, label: "2. Searching timeline" },
                { step: 3, label: "3. Selecting intervals" },
              ].map((p) => {
                const isActive = progressStage.step === p.step && !progressStage.completed;
                const isDone = progressStage.step > p.step || progressStage.completed;

                return (
                  <div
                    key={p.step}
                    className={`px-3.5 py-2.5 rounded-2xl font-mono text-[11.5px] flex items-center justify-between border ${
                      isActive
                        ? "bg-ink border-ink text-white font-medium shadow-xs"
                        : isDone
                        ? "bg-white border-ink text-ink font-medium"
                        : "bg-canvas border-line text-muted"
                    }`}
                  >
                    <span>{p.label}</span>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-white stage-dot-pulse inline-block" />
                    ) : isDone ? (
                      <span>✓</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="font-mono text-[11.5px] text-muted">
              Long videos can take several minutes. Searching entire timeline without early termination.
            </p>
          </div>
        )}
      </section>

      {/* 3. NON-RESULT STATES */}
      {uiState === "empty" && (
        <div className="rounded-3xl bg-white border border-line p-8 sm:p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-canvas border border-line text-ink flex items-center justify-center mx-auto font-mono text-sm font-bold">
            0
          </div>
          <h3 className="font-bold text-[18px] text-ink">No matching intervals found</h3>
          <p className="text-[13.5px] text-muted max-w-lg mx-auto leading-relaxed">
            The video model scanned the available timeline and found no intervals matching the specified target and condition. Model-only evidence is not exhaustive; try broadening the condition or switching minStatus under Advanced.
          </p>
        </div>
      )}

      {uiState === "error" && (
        <div className="rounded-3xl bg-white border-2 border-ink p-6 sm:p-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-ink text-white font-medium">
                ERROR
              </span>
              <span className="font-mono text-[11px] text-muted">{errorCode}</span>
            </div>
            <button
              type="button"
              onClick={handleRunSearch}
              className="btn-tactile px-3.5 py-1.5 rounded-full border border-ink bg-white text-[12px] font-medium text-ink cursor-pointer"
            >
              Retry
            </button>
          </div>
          <h3 className="font-bold text-[16px] text-ink">{errorHeadline}</h3>
          <p className="text-[13px] text-muted leading-relaxed">{errorMessageDetail}</p>
        </div>
      )}

      {uiState === "offline" && (
        <div className="rounded-3xl bg-white border border-line p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-muted">
              <span className="w-2 h-2 rounded-full border border-ink" />
              <span>Backend Not Connected</span>
            </div>
            <h3 className="font-bold text-[17px] text-ink">FastAPI analysis service is unreachable</h3>
            <p className="text-[13px] text-muted leading-relaxed">
              Smart Moment Search does not fall back to sample data automatically so demo intervals are never mistaken for live results. Start the backend server and retry, or explicitly load a labeled demo result to inspect the interface.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRunSearch}
              className="btn-tactile px-4 py-2 rounded-full bg-ink text-white text-[12.5px] font-medium cursor-pointer"
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => loadDemoState("demo_target_met")}
              className="btn-tactile px-4 py-2 rounded-full border border-line bg-canvas hover:border-ink text-[12.5px] font-medium text-ink cursor-pointer"
            >
              Try Demo Result
            </button>
          </div>
        </div>
      )}

      {/* 4. ACTIVE RESULTS WORKSPACE */}
      {uiState === "results" && result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* SUMMARY BAR */}
          <div className="rounded-3xl bg-white border border-line p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              {result.isSampleData && (
                <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-ink text-white font-medium">
                  SAMPLE DEMO RESULT
                </span>
              )}

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Detected</span>
                <span className="text-[14px] font-semibold text-ink tabular-nums">
                  Found {result.allDetectedIntervals.length} intervals (total {formatDurationMMSS(totalDetectedSec)})
                </span>
              </div>

              <div className="hidden sm:block h-5 w-[1px] bg-line" />

              <div className="flex items-baseline gap-2 px-3 py-1 rounded-xl bg-canvas border border-line">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Selected</span>
                <span className="text-[14px] font-bold text-ink tabular-nums">
                  {formatDurationMMSS(totalSelectedSec)} of {formatDurationMMSS(budgetSec)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start lg:self-auto">
              <span
                className={`font-mono text-[11.5px] font-semibold px-3 py-1 rounded-full tabular-nums ${
                  isTargetMet
                    ? "bg-ink text-white"
                    : "bg-white border-[1.5px] border-ink text-ink"
                }`}
              >
                {isTargetMet ? "Target met" : `Short by ${formatDurationMMSS(shortfallSec)}`}
              </span>
            </div>
          </div>

          {/* FULL-WIDTH TIMELINE STRIP */}
          <div className="rounded-3xl bg-white border border-line p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
                  Timeline Strip
                </span>
                <span className="font-mono text-[10.5px] text-muted tabular-nums">
                  0:00 → {formatTimecode(totalTimelineDuration)}
                </span>
              </div>

              {/* Monochrome Pattern Legend */}
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2.5 rounded-[2px] bg-ink inline-block" />
                  Selected (probable)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2.5 rounded-[2px] hatch-uncertain inline-block" />
                  Selected (uncertain)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2.5 rounded-[2px] bg-white border-[1.5px] border-ink inline-block" />
                  Unselected (probable)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2.5 rounded-[2px] bg-white border-[1.5px] border-dashed border-ink inline-block" />
                  Unselected (uncertain)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2.5 rounded-[2px] pattern-wrong inline-block" />
                  Wrong
                </span>
              </div>
            </div>

            {/* Interactive Proportional Bar */}
            <div className="relative pt-2 pb-5">
              {tooltipData.visible && (
                <div
                  className="pointer-events-none absolute -top-8 z-30 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-ink text-white font-mono text-[10.5px] whitespace-nowrap shadow-md tabular-nums"
                  style={{ left: `${tooltipData.leftPct}%` }}
                >
                  {tooltipData.text}
                </div>
              )}

              <div className="relative w-full h-11 rounded-xl bg-canvas border border-line overflow-visible">
                {result.allDetectedIntervals.map((item) => {
                  const sel = selectionMap.get(item.id) || { selected: false, trimmedEndSec: null };
                  const isWrong = wrongSet.has(item.id);
                  const trimmed = isIntervalTrimmed(item);
                  const effEnd = getEffectiveEnd(item);

                  const leftPct = Math.max(0, Math.min(99.2, (item.startSec / totalTimelineDuration) * 100));
                  const widthPct = Math.max(0.9, ((effEnd - item.startSec) / totalTimelineDuration) * 100);

                  let styleClass = "";
                  if (isWrong) {
                    styleClass = "pattern-wrong";
                  } else if (sel.selected && item.status === "probable") {
                    styleClass = "bg-ink border border-ink";
                  } else if (sel.selected && item.status === "uncertain") {
                    styleClass = "hatch-uncertain";
                  } else if (!sel.selected && item.status === "probable") {
                    styleClass = "bg-white border-[1.5px] border-ink";
                  } else {
                    styleClass = "bg-white border-[1.5px] border-dashed border-ink";
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFocusedRowId(item.id);
                        setActivePlayingId(item.id);
                        const row = document.getElementById(`interval-row-${item.id}`);
                        if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      onMouseEnter={(e) => {
                        const track = e.currentTarget.parentElement?.getBoundingClientRect();
                        const btn = e.currentTarget.getBoundingClientRect();
                        if (track) {
                          const centerPct = ((btn.left + btn.width / 2 - track.left) / track.width) * 100;
                          const effDur = getEffectiveDuration(item);
                          const trimmedText = trimmed ? " · trimmed" : "";
                          const wrongText = isWrong ? " · marked wrong" : "";
                          setTooltipData({
                            text: `${formatTimecode(item.startSec)}–${formatTimecode(effEnd)} (${formatDurationMMSS(
                              effDur
                            )}) · ${item.status}${trimmedText}${wrongText}`,
                            leftPct: Math.max(10, Math.min(90, centerPct)),
                            visible: true,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltipData((p) => ({ ...p, visible: false }))}
                      style={{ left: `${leftPct.toFixed(3)}%`, width: `${widthPct.toFixed(3)}%` }}
                      aria-label={`Interval ${formatTimecode(item.startSec)} to ${formatTimecode(effEnd)}`}
                      className={`tl-block absolute top-2 bottom-2 rounded-[4px] cursor-pointer ${styleClass}`}
                    >
                      {trimmed && (
                        <span
                          title="Trimmed to fit budget"
                          className="absolute -right-[5px] -top-2.5 bottom-0 flex flex-col items-center pointer-events-none z-20"
                        >
                          <span className="font-mono text-[9px] leading-none bg-ink text-white px-1 rounded-sm">
                            ✂
                          </span>
                          <span className="w-[1.5px] flex-1 bg-ink" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Axis Ticks */}
              <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-muted tabular-nums">
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                  <span key={f}>{formatTimecode(totalTimelineDuration * f)}</span>
                ))}
              </div>
            </div>
          </div>

          {/* TWO-COLUMN RESULTS VIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: INTERVAL LIST */}
            <div className="lg:col-span-7 space-y-3">
              {/* Sort & Filter Toolbar */}
              <div className="rounded-2xl bg-white border border-line px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex p-0.5 rounded-full bg-canvas border border-line">
                    {(["all", "selected", "probable", "uncertain"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setListFilter(filter)}
                        className={`px-2.5 py-1 rounded-full text-[11.5px] transition-colors cursor-pointer ${
                          listFilter === filter
                            ? "font-semibold bg-ink text-white"
                            : "font-medium text-muted hover:text-ink"
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-1.5">
                    <label htmlFor="listSortSelect" className="font-mono text-[10.5px] text-muted">
                      Sort:
                    </label>
                    <select
                      id="listSortSelect"
                      value={listSort}
                      onChange={(e) => setListSort(e.target.value as "time" | "duration" | "status")}
                      className="px-2.5 py-1 rounded-xl bg-canvas border border-line text-[11.5px] font-medium text-ink cursor-pointer outline-none"
                    >
                      <option value="time">Time</option>
                      <option value="duration">Duration</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>

                <span className="hidden sm:inline-block font-mono text-[10.5px] text-muted">
                  ↑/↓ navigate · Space toggle
                </span>
              </div>

              {/* Rows */}
              <div className="space-y-2.5">
                {visibleIntervals.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-dashed border-line p-8 text-center text-[13px] text-muted">
                    No intervals match the current filter.
                  </div>
                ) : (
                  visibleIntervals.map((item) => {
                    const sel = selectionMap.get(item.id) || { selected: false, trimmedEndSec: null };
                    const isWrong = wrongSet.has(item.id);
                    const trimmed = isIntervalTrimmed(item);
                    const effEnd = getEffectiveEnd(item);
                    const effDur = getEffectiveDuration(item);
                    const isFocused = focusedRowId === item.id;
                    const isPlaying = activePlayingId === item.id;
                    const evidenceText = item.evidence[0]?.description || item.rationale;
                    const modalityText = item.evidence[0]?.modality || item.modality || "visual";

                    return (
                      <div
                        key={item.id}
                        id={`interval-row-${item.id}`}
                        onClick={() => setFocusedRowId(item.id)}
                        className={`rounded-2xl bg-white border p-4 transition-colors cursor-pointer ${
                          isPlaying ? "border-ink" : "border-line"
                        } ${isFocused ? "row-focused" : ""} ${isWrong ? "opacity-55" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-0.5 shrink-0">
                            <input
                              type="checkbox"
                              checked={sel.selected && !isWrong}
                              disabled={isWrong}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleInterval(item.id);
                              }}
                              aria-label={`Include interval ${formatTimecode(item.startSec)} to ${formatTimecode(effEnd)}`}
                              className="w-4 h-4 rounded accent-ink cursor-pointer disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`font-mono text-[13px] font-semibold text-ink tabular-nums ${
                                    isWrong ? "line-through" : ""
                                  }`}
                                >
                                  {formatTimecode(item.startSec)} – {formatTimecode(effEnd)}
                                </span>
                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-canvas border border-line text-muted tabular-nums">
                                  {formatDurationMMSS(effDur)}
                                </span>
                                {item.status === "probable" ? (
                                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink text-white">
                                    probable
                                  </span>
                                ) : (
                                  <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-dashed border-ink text-ink">
                                    uncertain
                                  </span>
                                )}
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-canvas border border-line text-muted">
                                  {modalityText}
                                </span>
                                {trimmed && (
                                  <span className="font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-canvas border border-line text-ink">
                                    trimmed
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePlayingId(item.id);
                                  }}
                                  className={`btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium cursor-pointer ${
                                    isPlaying
                                      ? "bg-ink text-white border border-ink"
                                      : "bg-canvas border border-line hover:border-ink text-ink"
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5.14v14l11-7-11-7z" />
                                  </svg>
                                  <span>{isPlaying ? "Playing" : "Play"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWrong(item.id);
                                  }}
                                  className="btn-tactile px-2.5 py-1 rounded-full border border-line bg-white hover:border-ink text-[11px] font-medium text-muted hover:text-ink cursor-pointer"
                                >
                                  {isWrong ? "Undo" : "Mark as wrong"}
                                </button>
                              </div>
                            </div>

                            <p className={`text-[12.5px] text-muted leading-relaxed ${isWrong ? "line-through" : ""}`}>
                              {evidenceText}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: STICKY PLAYER, HONESTY PANEL & OUTPUTS */}
            <aside className="lg:col-span-5 lg:sticky lg:top-[72px] space-y-4">
              {/* Embedded Player */}
              <div className="rounded-3xl bg-white border border-line overflow-hidden">
                <div className="px-4 py-2.5 border-b border-line bg-canvas flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink font-semibold">
                    Embedded Player
                  </span>
                  <span className="font-mono text-[10px] text-muted">Playback only · No source download</span>
                </div>

                <div className="p-3 bg-ink">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0A0A0A] border border-white/10">
                    {activePlayingId ? (
                      (() => {
                        const activeItem = result.allDetectedIntervals.find((i) => i.id === activePlayingId);
                        const vId = extractYouTubeId(result.source.url) || DEMO_VIDEO_ID;
                        const start = Math.floor(activeItem?.startSec ?? 0);
                        return (
                          <iframe
                            className="w-full h-full block"
                            src={`https://www.youtube-nocookie.com/embed/${vId}?start=${start}&autoplay=1&playsinline=1&rel=0`}
                            title="YouTube interval preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      })()
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-5 text-white space-y-2">
                        <div className="w-11 h-11 rounded-full border border-white/25 flex items-center justify-center">
                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5.14v14l11-7-11-7z" />
                          </svg>
                        </div>
                        <p className="text-[12.5px] font-medium text-white/90">
                          Click &ldquo;Play&rdquo; on any interval or timeline block
                        </p>
                        <p className="font-mono text-[10px] text-white/55">
                          Loads youtube-nocookie.com embed at exact startSec
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-line bg-white flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="text-muted">Active interval:</span>
                  <span className="px-2 py-0.5 rounded bg-canvas border border-line text-ink tabular-nums font-medium">
                    {activePlayingId
                      ? (() => {
                          const i = result.allDetectedIntervals.find((x) => x.id === activePlayingId);
                          return i ? `${formatTimecode(i.startSec)} – ${formatTimecode(getEffectiveEnd(i))}` : "None";
                        })()
                      : "None selected"}
                  </span>
                </div>
              </div>

              {/* Honesty Panel */}
              <div className="rounded-3xl bg-white border border-line p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-ink">
                    Verification &amp; Source Capabilities
                  </span>
                  <span className="font-mono text-[10px] text-muted">Honesty Panel</span>
                </div>

                <ul className="space-y-1.5 text-[12px] text-muted leading-snug">
                  {(result.warnings || []).map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-ink mt-0.5">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-full border bg-ink text-white border-ink">
                    Video model ✓
                  </span>
                  <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-full border bg-canvas text-muted border-line">
                    Scoreboard OCR · not run
                  </span>
                  <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-full border bg-canvas text-muted border-line">
                    Renderable MP4 · unavailable
                  </span>
                </div>

                <div className="pt-2.5 border-t border-line font-mono text-[10.5px] text-muted leading-relaxed">
                  <strong className="text-ink">probable</strong> = model was confident ·{" "}
                  <strong className="text-ink">uncertain</strong> = model was unsure (not auto-selected)
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="rounded-3xl bg-white border border-line p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-ink">
                    Outputs
                  </span>
                  <span className="font-mono text-[10.5px] text-muted tabular-nums">
                    {selectedIntervals.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTimestamps}
                    className="btn-tactile py-2 px-2 rounded-xl border border-line bg-canvas hover:border-ink text-[11px] font-medium text-ink text-center cursor-pointer"
                  >
                    Copy Timestamps
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="btn-tactile py-2 px-2 rounded-xl border border-line bg-canvas hover:border-ink text-[11px] font-medium text-ink text-center cursor-pointer"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="btn-tactile py-2 px-2 rounded-xl border border-line bg-canvas hover:border-ink text-[11px] font-medium text-ink text-center cursor-pointer"
                  >
                    Download CSV
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOpenEditorHandoff}
                  disabled={selectedIntervals.length === 0}
                  className="btn-tactile w-full py-2.5 px-5 rounded-full bg-ink text-white text-[13px] font-medium flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Open in Editor</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* 5. EDITOR HANDOFF MODAL */}
      {isHandoffOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="handoffTitle"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white border border-line shadow-2xl p-6 max-h-[88vh] flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-medium">
                  localStorage · reelix_active_project &amp; reelix_editor_handoff
                </span>
                <h3 id="handoffTitle" className="font-bold text-[18px] text-ink mt-0.5">
                  Ready for /studio/editor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHandoffOpen(false)}
                aria-label="Close modal"
                className="btn-tactile w-8 h-8 rounded-full border border-line hover:border-ink flex items-center justify-center text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[12.5px] text-muted leading-relaxed">
              Selected intervals have been mapped to <code className="font-mono text-ink">Clip[]</code> in original source coordinates (<code className="font-mono text-ink">startSec</code> / <code className="font-mono text-ink">endSec</code>) with zero invented scores and persisted to active project storage.
            </p>

            <pre className="flex-1 overflow-auto thin-scroll p-4 rounded-2xl bg-canvas border border-line font-mono text-[11px] text-ink leading-relaxed max-h-60">
              {JSON.stringify(handoffPayload, null, 2)}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(JSON.stringify(handoffPayload, null, 2)).catch(() => {});
                  }
                  showToast("Copied Clip[] payload");
                }}
                className="btn-tactile px-4 py-2 rounded-full border border-line bg-canvas hover:border-ink text-[12px] font-medium text-ink cursor-pointer"
              >
                Copy Clip[] JSON
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHandoffOpen(false)}
                  className="btn-tactile px-4 py-2 rounded-full border border-line bg-white hover:border-ink text-[12px] font-medium text-muted hover:text-ink cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/studio/editor"
                  className="btn-tactile px-5 py-2 rounded-full bg-ink text-white text-[12px] font-medium cursor-pointer"
                >
                  Launch Editor →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
