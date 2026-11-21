import {
  AnalysisRequest,
  AnalysisResult,
  Clip,
  ProcessingStage,
  SourceVideo,
  TimelineSearchRequest,
  TimelineSearchResult,
} from "@/types/studio";
import { SAMPLE_SOURCES, createInitialClips } from "./sample-data";

export interface IStudioService {
  analyze(
    request: AnalysisRequest,
    onProgress?: (stage: ProcessingStage) => void,
    signal?: AbortSignal
  ): Promise<AnalysisResult>;
  timelineSearch(
    request: TimelineSearchRequest,
    onProgress?: (stage: ProcessingStage) => void,
    signal?: AbortSignal
  ): Promise<TimelineSearchResult>;
  generateExportSummary(
    clip: Clip,
    source: SourceVideo,
    aspectRatio: string,
    autoCaptions: boolean,
    captionStyle: string
  ): string;
}

/** A failure with a stable machine-readable code (mirrors the backend's error codes). */
export class StudioServiceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "StudioServiceError";
    this.code = code;
  }
}

const POLL_MS = 2000;
const MAX_WAIT_MS = 25 * 60 * 1000;
// Only these mean "there is no backend to talk to" and justify the clearly-labelled sample fallback.
// Real failures (bad link, quota, model errors...) are surfaced as errors, never hidden behind sample data.
const OFFLINE_CODES = new Set(["backend_unreachable", "provider_not_configured"]);

const isAbort = (e: unknown) => (e as Error | undefined)?.name === "AbortError";

type BackendJob = {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  phase: string;
  result: Record<string, unknown> | null;
  error: { code: string; message: string } | null;
};

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function errorFrom(res: Response, body: unknown): StudioServiceError {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const d = detail as { code?: unknown; message?: unknown };
    if (typeof d.code === "string") {
      return new StudioServiceError(d.code, typeof d.message === "string" ? d.message : "Request failed.");
    }
  }
  if (Array.isArray(detail)) {
    return new StudioServiceError("invalid_request", "Check your link and settings, then try again.");
  }
  return new StudioServiceError("request_failed", `Request failed (${res.status}).`);
}

// Phase -> the three pipeline pills. Percentages are coarse per-phase markers, not measured progress.
function stageForPhase(phase: string): ProcessingStage {
  switch (phase) {
    case "analyzing_video":
    case "searching_timeline":
      return { step: 2, label: "2. Analyzing video with Gemini...", percent: 55, completed: false };
    case "scoring_clips":
    case "selecting_intervals":
      return { step: 3, label: "3. Validating and ranking results...", percent: 88, completed: false };
    default:
      return { step: 1, label: "1. Validating source...", percent: 12, completed: false };
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Analysis aborted", "AbortError"));
    });
  });
}

/** Submit a job through the Next.js proxy and poll until it finishes. Returns the backend result object. */
async function runJob(
  body: Record<string, unknown>,
  onProgress?: (stage: ProcessingStage) => void,
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new StudioServiceError("backend_unreachable", "Could not reach the analysis service.");
  }
  const first = await readJson(res);
  if (!res.ok) throw errorFrom(res, first);

  let job = first as BackendJob;
  const started = Date.now();
  try {
    for (;;) {
      if (job.status === "completed" && job.result) return job.result;
      if (job.status === "failed") {
        throw new StudioServiceError(job.error?.code ?? "failed", job.error?.message ?? "Analysis failed.");
      }
      if (job.status === "cancelled") throw new DOMException("Analysis aborted", "AbortError");
      if (Date.now() - started > MAX_WAIT_MS) {
        throw new StudioServiceError("timeout", "Analysis is taking too long. Try a shorter video.");
      }
      onProgress?.(stageForPhase(job.phase));
      await sleep(POLL_MS, signal);
      const poll = await fetch(`/api/jobs/${job.jobId}`, { signal, cache: "no-store" });
      const data = await readJson(poll);
      if (!poll.ok) throw errorFrom(poll, data);
      job = data as BackendJob;
    }
  } catch (e) {
    if (isAbort(e)) void fetch(`/api/jobs/${job.jobId}`, { method: "DELETE" }).catch(() => undefined);
    throw e;
  }
}

export class StudioService implements IStudioService {
  /**
   * Real analysis through the Next.js proxy -> FastAPI -> Gemini.
   * Falls back to the labelled sample simulation ONLY for built-in sample sources or when no backend is reachable/configured.
   */
  async analyze(
    request: AnalysisRequest,
    onProgress?: (stage: ProcessingStage) => void,
    signal?: AbortSignal
  ): Promise<AnalysisResult> {
    const isSampleUrl = SAMPLE_SOURCES.some(
      (s) => s.url.toLowerCase() === request.url.trim().toLowerCase()
    );
    if (request.sourceVideo?.id?.startsWith("sample-") && isSampleUrl) {
      return this.simulateSampleAnalysis(request, onProgress, signal);
    }
    const startTime = Date.now();
    try {
      const r = (await runJob(
        {
          mode: "clip_discovery",
          url: request.url,
          creativeDirection: request.creativeDirection,
          aspectRatio: request.aspectRatio,
          lengthPreference: request.lengthPreference,
          autoCaptions: request.autoCaptions,
        },
        onProgress,
        signal
      )) as unknown as AnalysisResult;
      onProgress?.({ step: 3, label: `${r.clips.length} candidate clips extracted`, percent: 100, completed: true });
      return { ...r, processingDurationMs: Date.now() - startTime, isSampleData: false };
    } catch (err) {
      if (err instanceof StudioServiceError && OFFLINE_CODES.has(err.code)) {
        return this.simulateSampleAnalysis(request, onProgress, signal);
      }
      throw err;
    }
  }

  /** Smart Moment Search: find every interval matching a condition, then select a duration budget from them. */
  async timelineSearch(
    request: TimelineSearchRequest,
    onProgress?: (stage: ProcessingStage) => void,
    signal?: AbortSignal
  ): Promise<TimelineSearchResult> {
    const r = (await runJob({ mode: "timeline_search", ...request }, onProgress, signal)) as unknown as TimelineSearchResult;
    onProgress?.({
      step: 3,
      label: `${r.allDetectedIntervals.length} intervals found`,
      percent: 100,
      completed: true,
    });
    return r;
  }

  /**
   * Deterministic client-side SAMPLE simulation. Never real analysis; results carry isSampleData: true.
   */
  private async simulateSampleAnalysis(
    request: AnalysisRequest,
    onProgress?: (stage: ProcessingStage) => void,
    signal?: AbortSignal
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), ms);
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Analysis aborted", "AbortError"));
        });
      });

    // Stage 1: Transcript & Peaks
    onProgress?.({
      step: 1,
      label: "1. Fetching transcript & audio peaks...",
      percent: 34,
      completed: false,
    });
    await wait(650);

    // Stage 2: Narrative Hooks
    onProgress?.({
      step: 2,
      label: "2. Mapping narrative hooks...",
      percent: 68,
      completed: false,
    });
    await wait(700);

    // Stage 3: Pacing & Retention
    onProgress?.({
      step: 3,
      label: "3. Scoring pacing & retention...",
      percent: 94,
      completed: false,
    });
    await wait(600);

    // Completed
    onProgress?.({
      step: 3,
      label: "5 candidate clips extracted",
      percent: 100,
      completed: true,
    });

    const sourceVideo: SourceVideo =
      request.sourceVideo ||
      SAMPLE_SOURCES.find((s) => s.url === request.url) || {
        url: request.url,
        title: "Imported Source Video",
        channel: "Source Channel",
        platform: "Direct Stream",
        duration: "45:00",
        resolution: "1080p",
      };

    const initialClips = createInitialClips();

    // Adjust clip durations based on user length preference
    const adjustedClips = initialClips.map((clip) => {
      let duration: number;
      if (request.lengthPreference === "under30") {
        duration = 20 + (clip.score % 9);
      } else if (request.lengthPreference === "30-60") {
        duration = 34 + (clip.score % 22);
      } else {
        duration = 64 + (clip.score % 22);
      }
      return {
        ...clip,
        endSec: clip.startSec + duration,
        aspectRatio: request.aspectRatio,
      };
    });

    return {
      source: sourceVideo,
      clips: adjustedClips,
      processingDurationMs: Date.now() - startTime,
      isSampleData: true,
    };
  }

  generateExportSummary(
    clip: Clip,
    source: SourceVideo,
    aspectRatio: string,
    autoCaptions: boolean,
    captionStyle: string
  ): string {
    const dur = Math.max(5, clip.endSec - clip.startSec);
    const formatTime = (totalSec: number) => {
      const s = Math.max(0, Math.floor(totalSec));
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    return [
      `REELIX CREATOR STUDIO — CLIP EXPORT MANIFEST`,
      `===========================================`,
      `Notice:       Prototype export manifest. Actual video rendering engine is in progress.`,
      `Source Video: ${source.title} (${source.url})`,
      `Clip Title:   ${clip.title}`,
      `Timestamps:   ${formatTime(clip.startSec)} – ${formatTime(clip.endSec)} (${dur}s duration)`,
      `Framing:      ${aspectRatio} Vertical | Captions: ${autoCaptions ? captionStyle : "Off"}`,
      `Model Score:  ${clip.score}/100 (Hook: ${clip.hookScore} · Pacing: ${clip.pacingScore} · Clarity: ${clip.clarityScore})`,
      ...(clip.retentionPoints && clip.retentionPoints.length > 0 ? [`Est. Retention: ${clip.completionRate}`] : []),
      ``,
      `OPENING HOOK:`,
      `${clip.hook}`,
      ``,
      `EDITORIAL RATIONALE:`,
      `${clip.rationale}`,
      ``,
      `PACING NOTE:`,
      `${clip.dropoffNote}`,
    ].join("\n");
  }
}

export const studioService = new StudioService();

export function downloadFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
