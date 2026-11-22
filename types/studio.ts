export type AspectRatio = "9:16" | "1:1";

export type LengthPreference = "under30" | "30-60" | "60-90";

export type CaptionStyle = "minimal" | "bold" | "bar";

export type EditorPreset =
  | "editorial"
  | "kinetic"
  | "podcast"
  | "letterbox"
  | "noir"
  | "raw";

export type EditorCaptionStyle = "editorial" | "kinetic" | "karaoke" | "bar";

export interface EditorAdjustments {
  zoom: number; // 100-140%
  contrast: number; // 80-140%
  vignette: number; // 0-80%
}

export interface SubtitleSegment {
  id: string;
  start: number; // in seconds relative to clip start
  end: number; // in seconds relative to clip start
  text: string;
}

export type SortOption = "score" | "chrono" | "shortest";

export interface SourceVideo {
  id?: string;
  url: string;
  title: string;
  channel: string;
  platform: string;
  duration: string;
  resolution: string;
}

export interface ClipAnalytics {
  hookScore?: number | null;
  pacingScore?: number | null;
  clarityScore?: number | null;
  completionRate: string;
  dropoffNote: string;
  retentionPoints: number[];
}

export interface Clip {
  id: string;
  indexLabel?: string;
  title: string;
  hook: string;
  rationale: string;
  startSec: number;
  endSec: number;
  score: number;
  hookScore?: number | null;
  pacingScore?: number | null;
  clarityScore?: number | null;
  completionRate: string;
  dropoffNote: string;
  retentionPoints: number[];
  favorite: boolean;
  edited: boolean;
  exported: boolean;
  aspectRatio?: AspectRatio;
  captionStyle?: CaptionStyle;
  sourceUrl?: string;

  // Editor and Timeline State
  duration?: number;
  trimIn?: number;
  trimOut?: number;
  splits?: number[];
  sceneType?: "soundwave" | "spotlight" | "dualwave" | "filmgrain";
  preset?: EditorPreset;
  subtitlesEnabled?: boolean;
  editorCaptionStyle?: EditorCaptionStyle;
  subFontSize?: number;
  subPosY?: number;
  adjust?: EditorAdjustments;
  waveform?: number[];
  subtitles?: SubtitleSegment[];
}

export interface Project {
  id: string;
  source: SourceVideo;
  creativeDirection: string;
  aspectRatio: AspectRatio;
  lengthPreference: LengthPreference;
  autoCaptions: boolean;
  clips: Clip[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisRequest {
  url: string;
  creativeDirection: string;
  aspectRatio: AspectRatio;
  lengthPreference: LengthPreference;
  autoCaptions: boolean;
  sourceVideo?: SourceVideo;
}

export interface ProcessingStage {
  step: 1 | 2 | 3;
  label: string;
  percent: number;
  completed: boolean;
}

export interface AnalysisResult {
  source: SourceVideo;
  clips: Clip[];
  processingDurationMs: number;
  isSampleData: boolean;
  warnings?: string[];
}

// ---------------------------------------------------------------------------
// Smart Moment Search (timeline_search). Mirrors backend/app/pipeline.py output.
// ---------------------------------------------------------------------------

/** "verified" is reserved for independent checks (OCR / ball-by-ball / human); model-only results max out at "probable". */
export type VerificationStatus = "verified" | "probable" | "uncertain";

export interface EvidenceItem {
  kind: "video_model" | "scoreboard_ocr" | "transcript" | "ball_by_ball" | "human_review";
  startSec: number;
  endSec?: number;
  description: string;
  modality?: string;
}

export interface DetectedInterval {
  id: string;
  startSec: number; // original source timeline
  endSec: number;
  durationSec: number;
  startTimecode: string;
  endTimecode: string;
  status: VerificationStatus;
  evidence: EvidenceItem[];
  rationale: string;
  warnings: string[];
  trimmed: boolean;
  confidenceRank?: number;
  modality?: string;
}

export interface TimelineSearchRequest {
  url: string;
  targetEntity: string;
  condition: string;
  targetTotalDurationSec: number;
  selectionStrategy?: "chronological" | "highest_confidence";
  includeReplays?: boolean;
  minStatus?: "verified" | "probable" | "uncertain";
}

export interface TimelineSearchResult {
  source: SourceVideo;
  videoDurationSec: number | null; // model-reported
  allDetectedIntervals: DetectedInterval[];
  selectedIntervals: DetectedInterval[];
  targetDurationSec: number;
  selectedDurationSec: number;
  targetMet: boolean;
  shortfallSec: number;
  coverageMethod: string[];
  sourceCapabilities: Record<string, "available" | "unavailable" | "not_attempted" | "not_run">;
  processingDurationMs: number;
  isSampleData: boolean;
  warnings: string[];
}
