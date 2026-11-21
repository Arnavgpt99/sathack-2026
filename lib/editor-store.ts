import { Project, Clip, SubtitleSegment } from "@/types/studio";
import { createDefaultProject } from "./sample-data";

const STORAGE_KEY = "reelix_active_project";

/**
 * Extracts YouTube video ID from standard watch, share, live, or embed URLs.
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const raw = url.trim();
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\/+/, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
      }
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
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

/**
 * Retrieves the currently active project from localStorage or initializes default project.
 */
export function getActiveProject(): Project {
  if (typeof window === "undefined") {
    return createDefaultProject();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Project;
      if (parsed && Array.isArray(parsed.clips) && parsed.clips.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load project from localStorage:", err);
  }
  const def = createDefaultProject();
  saveActiveProject(def);
  return def;
}

/**
 * Persists project state to localStorage.
 */
export function saveActiveProject(project: Project): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: Project = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn("Failed to save project to localStorage:", err);
  }
}

export function normalizeClip(clip: Clip, sourceUrl?: string): Clip {
  const dur = clip.duration || Math.max(5, Math.round(clip.endSec - clip.startSec));
  const hook = clip.hook || clip.title || "Opening Moment";
  const defaultSubs: SubtitleSegment[] =
    clip.subtitles && clip.subtitles.length > 0
      ? clip.subtitles
      : [
          {
            id: `sub-${clip.id}-1`,
            start: 0,
            end: Math.max(1.5, Math.min(dur * 0.45, 4)),
            text: hook.replace(/^“|”$/g, ""),
          },
          {
            id: `sub-${clip.id}-2`,
            start: Math.max(1.5, Math.min(dur * 0.45, 4)),
            end: dur,
            text: clip.rationale?.slice(0, 75) || clip.title,
          },
        ];

  return {
    ...clip,
    sourceUrl: clip.sourceUrl || sourceUrl,
    duration: dur,
    trimIn: clip.trimIn ?? 0,
    trimOut: clip.trimOut ?? dur,
    preset: clip.preset || "editorial",
    editorCaptionStyle: clip.editorCaptionStyle || "editorial",
    subtitlesEnabled: clip.subtitlesEnabled ?? true,
    subtitles: defaultSubs,
  };
}

/**
 * Resolves a clip and project based on URL parameters or returns active default.
 */
export function resolveProjectAndClip(
  projectId?: string | null,
  clipId?: string | null
): { project: Project; clip: Clip } | null {
  const project = getActiveProject();

  // If specific project requested and matches or no specific project
  if (!projectId || project.id === projectId) {
    if (clipId) {
      const match = project.clips.find((c) => c.id === clipId);
      if (match) return { project, clip: normalizeClip(match, project.source.url) };
      // Fallback: if clipId not found in active project
      return null;
    }
    // No clipId specified, default to first clip
    if (project.clips.length > 0) {
      return { project, clip: normalizeClip(project.clips[0], project.source.url) };
    }
  }

  // If projectId was specified but doesn't match active project, check if default matches
  const defaultProj = createDefaultProject();
  if (defaultProj.id === projectId) {
    if (clipId) {
      const match = defaultProj.clips.find((c) => c.id === clipId);
      if (match) return { project: defaultProj, clip: normalizeClip(match, defaultProj.source.url) };
      return null;
    }
    return { project: defaultProj, clip: normalizeClip(defaultProj.clips[0], defaultProj.source.url) };
  }

  return null;
}

/**
 * Updates a clip within the project and commits to localStorage.
 */
export function saveClipEdits(projectId: string, clip: Clip): Project {
  const project = getActiveProject();
  const updatedClips = project.clips.map((c) =>
    c.id === clip.id
      ? {
          ...c,
          ...clip,
          edited: true,
        }
      : c
  );
  const updatedProject: Project = {
    ...project,
    clips: updatedClips,
    updatedAt: new Date().toISOString(),
  };
  saveActiveProject(updatedProject);
  return updatedProject;
}

/**
 * Format seconds to MM:SS.S
 */
export function formatTC(sec: number): string {
  const s = Math.max(0, sec || 0);
  const mins = Math.floor(s / 60);
  const rem = (s % 60).toFixed(1).padStart(4, "0");
  return `${String(mins).padStart(2, "0")}:${rem}`;
}

/**
 * Format seconds to SubRip timecode HH:MM:SS,mmm
 */
export function formatSRTTime(sec: number): string {
  const s = Math.max(0, sec || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/**
 * Generates SubRip (.SRT) subtitle content from segments.
 */
export function generateSRT(subtitles: SubtitleSegment[]): string {
  return subtitles
    .map(
      (sub, idx) =>
        `${idx + 1}\n${formatSRTTime(sub.start)} --> ${formatSRTTime(
          sub.end
        )}\n${sub.text}\n`
    )
    .join("\n");
}

/**
 * Generates an honest JSON EDL (Edit Decision List) containing exact user cuts & metrics.
 */
export function generateJSONEDL(clip: Clip, project?: Project): string {
  const dur = clip.duration || Math.max(5, clip.endSec - clip.startSec);
  const trimIn = clip.trimIn ?? 0;
  const trimOut = clip.trimOut ?? dur;

  return JSON.stringify(
    {
      app: "Reelix Editor",
      version: "1.0-sathack",
      exportedAt: new Date().toISOString(),
      projectId: project?.id || "proj-sathack-2026",
      source: project?.source || {
        title: "Source Video",
        platform: "Web",
        url: "",
      },
      clip: {
        id: clip.id,
        title: clip.title,
        hook: clip.hook,
        aspectRatio: clip.aspectRatio || project?.aspectRatio || "9:16",
        preset: clip.preset || "editorial",
        sourceDurationSec: dur,
        trimInSec: trimIn,
        trimOutSec: trimOut,
        effectiveDurationSec: Number((trimOut - trimIn).toFixed(1)),
        splits: clip.splits || [],
        adjustments: clip.adjust || { zoom: 100, contrast: 100, vignette: 25 },
        subtitlesEnabled: clip.subtitlesEnabled !== false,
        captionStyle: clip.editorCaptionStyle || "editorial",
        subFontSize: clip.subFontSize || 14,
        subPosY: clip.subPosY || 18,
        subtitles: clip.subtitles || [],
      },
      renderPipelineNote:
        "This JSON Edit Decision List contains precise frame cuts, subtitle timecodes, and color grading parameters ready to pipe into the Reelix backend rendering worker.",
    },
    null,
    2
  );
}

/**
 * Triggers native browser download for text/json/srt files.
 */
export function downloadFile(
  filename: string,
  content: string,
  mimeType = "text/plain;charset=utf-8"
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
