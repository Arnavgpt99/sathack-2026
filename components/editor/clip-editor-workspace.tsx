"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import {
  Clip,
  EditorPreset,
  EditorCaptionStyle,
  Project,
} from "@/types/studio";
import {
  getActiveProject,
  resolveProjectAndClip,
  saveActiveProject,
  saveClipEdits,
  formatTC,
} from "@/lib/editor-store";
import { createDefaultProject } from "@/lib/sample-data";
import { audioEngine } from "@/lib/audio-engine";
import { EditorHeader } from "./editor-header";
import { ClipsDeck } from "./clips-deck";
import { PreviewStage } from "./preview-stage";
import { EditorInspector } from "./editor-inspector";
import { TimelineDock } from "./timeline-dock";
import { ExportModal } from "./export-modal";

interface ClipEditorWorkspaceProps {
  initialProjectId?: string | null;
  initialClipId?: string | null;
}

export function ClipEditorWorkspace({
  initialProjectId,
  initialClipId,
}: ClipEditorWorkspaceProps) {
  // Resolved Project & Clip via lazy initializers
  const [project, setProject] = useState<Project | null>(() => {
    const res = resolveProjectAndClip(initialProjectId, initialClipId);
    if (res) return res.project;
    return getActiveProject();
  });

  // Active clip index
  const [activeClipIdx, setActiveClipIdx] = useState<number>(() => {
    const res = resolveProjectAndClip(initialProjectId, initialClipId);
    if (res && res.project.clips.length > 0) {
      const idx = res.project.clips.findIndex((c) => c.id === res.clip.id);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  // Playback & Timeline State
  const [currentTime, setCurrentTime] = useState<number>(() => {
    const res = resolveProjectAndClip(initialProjectId, initialClipId);
    if (res) return res.clip.trimIn ?? 0;
    return 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [mobileTab, setMobileTab] = useState<"deck" | "stage" | "inspector">("stage");
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  const [safeZoneEnabled, setSafeZoneEnabled] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [isSyncingClip, setIsSyncingClip] = useState(false);

  // History for Undo / Redo
  const [historyStack, setHistoryStack] = useState<string[]>(() => {
    const res = resolveProjectAndClip(initialProjectId, initialClipId);
    const p = res ? res.project : getActiveProject();
    return p ? [JSON.stringify(p.clips)] : [];
  });
  const [historyPointer, setHistoryPointer] = useState(0);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Modals & Feedback
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  const activeClip = project?.clips[activeClipIdx] || null;

  // Snapshot manager
  const commitSnapshot = useCallback((clipsToSave: Clip[]) => {
    const snap = JSON.stringify(clipsToSave);
    setHistoryStack((prev) => {
      const sliced = prev.slice(0, historyPointer + 1);
      const nextStack = [...sliced, snap];
      if (nextStack.length > 40) nextStack.shift();
      return nextStack;
    });
    setHistoryPointer((prev) => Math.min(prev + 1, 39));
  }, [historyPointer]);

  const scheduleDebouncedSnapshot = useCallback((clipsToSave: Clip[]) => {
    clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      commitSnapshot(clipsToSave);
    }, 350);
  }, [commitSnapshot]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyPointer <= 0 || !project) return;
    const targetIdx = historyPointer - 1;
    const snapStr = historyStack[targetIdx];
    if (!snapStr) return;
    try {
      const parsedClips = JSON.parse(snapStr) as Clip[];
      const updatedProject = { ...project, clips: parsedClips };
      setProject(updatedProject);
      saveActiveProject(updatedProject);
      setHistoryPointer(targetIdx);
      audioEngine.playClick();
      showToast("Undid last change");
    } catch (err) {
      console.warn("Undo error:", err);
    }
  };

  const handleRedo = () => {
    if (historyPointer >= historyStack.length - 1 || !project) return;
    const targetIdx = historyPointer + 1;
    const snapStr = historyStack[targetIdx];
    if (!snapStr) return;
    try {
      const parsedClips = JSON.parse(snapStr) as Clip[];
      const updatedProject = { ...project, clips: parsedClips };
      setProject(updatedProject);
      saveActiveProject(updatedProject);
      setHistoryPointer(targetIdx);
      audioEngine.playClick();
      showToast("Redid change");
    } catch (err) {
      console.warn("Redo error:", err);
    }
  };

  // Update active clip
  const updateCurrentClip = useCallback((
    updater: (prevClip: Clip) => Clip,
    immediateSnapshot = false
  ) => {
    if (!project || !activeClip) return;

    const updated = updater(activeClip);
    const updatedClips = project.clips.map((c, i) =>
      i === activeClipIdx ? updated : c
    );
    const updatedProject = {
      ...project,
      clips: updatedClips,
      updatedAt: new Date().toISOString(),
    };

    setProject(updatedProject);
    saveClipEdits(project.id, updated);

    if (immediateSnapshot) {
      commitSnapshot(updatedClips);
    } else {
      scheduleDebouncedSnapshot(updatedClips);
    }
  }, [project, activeClip, activeClipIdx, commitSnapshot, scheduleDebouncedSnapshot]);

  // Select clip with 320ms sync
  const handleSelectClip = (idx: number) => {
    if (idx === activeClipIdx || !project) return;
    audioEngine.playClick();
    setIsPlaying(false);
    setIsSyncingClip(true);
    setActiveClipIdx(idx);

    setTimeout(() => {
      setIsSyncingClip(false);
      const nextClip = project.clips[idx];
      if (nextClip) {
        setCurrentTime(nextClip.trimIn ?? 0);
      }
    }, 320);
  };

  const handleCycleDeck = (dir: number) => {
    if (!project) return;
    const total = project.clips.length;
    const nextIdx = (activeClipIdx + dir + total) % total;
    handleSelectClip(nextIdx);
  };

  // Playback Loop
  const lastTimeRef = useRef<number | null>(null);
  useEffect(() => {
    let animId: number;
    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = Math.min(0.08, Math.max(0, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      if (isPlaying && !isSyncingClip && activeClip) {
        const dur =
          activeClip.duration ||
          Math.max(5, activeClip.endSec - activeClip.startSec);
        const trimIn = activeClip.trimIn ?? 0;
        const trimOut = activeClip.trimOut ?? dur;

        setCurrentTime((prev) => {
          let next = prev + dt * playbackSpeed;
          if (next >= trimOut || next < trimIn) {
            next = trimIn;
          }
          return next;
        });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isSyncingClip, activeClip, playbackSpeed]);

  // Auto-pause on visibility change
  useEffect(() => {
    const handleVis = () => {
      if (document.hidden) setIsPlaying(false);
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, []);

  // Audio playback engine synchronization
  useEffect(() => {
    if (isPlaying && !isSyncingClip && activeClip) {
      audioEngine.startPlayback(playbackSpeed, isMuted ? 0 : volume);
    } else {
      audioEngine.stopPlayback();
    }
    return () => {
      audioEngine.stopPlayback();
    };
  }, [isPlaying, isSyncingClip, activeClip, playbackSpeed, isMuted, volume]);

  // Transport actions
  const handleTogglePlayback = () => {
    if (!activeClip) return;
    const dur =
      activeClip.duration || Math.max(5, activeClip.endSec - activeClip.startSec);
    const trimIn = activeClip.trimIn ?? 0;
    const trimOut = activeClip.trimOut ?? dur;

    if (!isPlaying && (currentTime >= trimOut || currentTime < trimIn)) {
      setCurrentTime(trimIn);
    }
    setIsPlaying((p) => !p);
  };

  const handleSeekTo = (sec: number) => {
    if (!activeClip) return;
    const dur =
      activeClip.duration || Math.max(5, activeClip.endSec - activeClip.startSec);
    setCurrentTime(Math.max(0, Math.min(dur, sec)));
  };

  const handleCycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // Editing Tools
  const handleSplitAtPlayhead = () => {
    if (!activeClip) return;
    const dur =
      activeClip.duration || Math.max(5, activeClip.endSec - activeClip.startSec);
    const t = Number(currentTime.toFixed(1));
    if (t <= 0.5 || t >= dur - 0.5) {
      showToast("Move playhead inside the clip to split");
      return;
    }
    const currentSplits = activeClip.splits || [];
    if (!currentSplits.includes(t)) {
      audioEngine.playSplit();
      updateCurrentClip(
        (c) => ({
          ...c,
          splits: [...(c.splits || []), t].sort((a, b) => a - b),
        }),
        true
      );
      showToast(`Split added at ${formatTC(t)}`);
    }
  };

  const handleSetTrimIn = () => {
    if (!activeClip) return;
    const dur =
      activeClip.duration || Math.max(5, activeClip.endSec - activeClip.startSec);
    const trimOut = activeClip.trimOut ?? dur;

    if (currentTime > trimOut - 3.0) {
      showToast("Minimum 3.0s trim window required");
      return;
    }
    const inVal = Number(currentTime.toFixed(1));
    audioEngine.playTrim();
    updateCurrentClip((c) => ({ ...c, trimIn: inVal }), true);
    showToast(`Trim In set to ${formatTC(inVal)}`);
  };

  const handleSetTrimOut = () => {
    if (!activeClip) return;
    const trimIn = activeClip.trimIn ?? 0;

    if (currentTime < trimIn + 3.0) {
      showToast("Minimum 3.0s trim window required");
      return;
    }
    const outVal = Number(currentTime.toFixed(1));
    audioEngine.playTrim();
    updateCurrentClip((c) => ({ ...c, trimOut: outVal }), true);
    showToast(`Trim Out set to ${formatTC(outVal)}`);
  };

  const handleResetCuts = () => {
    if (!activeClip) return;
    const dur =
      activeClip.duration || Math.max(5, activeClip.endSec - activeClip.startSec);
    audioEngine.playClick();
    updateCurrentClip(
      (c) => ({
        ...c,
        trimIn: 0,
        trimOut: dur,
        splits: [],
      }),
      true
    );
    showToast("Cuts and trims reset");
  };

  // Inspector handlers
  const handleSelectPreset = (presetId: EditorPreset) => {
    audioEngine.playClick();
    updateCurrentClip((c) => ({ ...c, preset: presetId }), true);
    showToast(`Preset: ${presetId}`);
  };

  const handleToggleSubtitles = () => {
    audioEngine.playClick();
    updateCurrentClip(
      (c) => ({ ...c, subtitlesEnabled: c.subtitlesEnabled === false }),
      true
    );
  };

  const handleSelectCaptionStyle = (style: EditorCaptionStyle) => {
    updateCurrentClip((c) => ({ ...c, editorCaptionStyle: style }), true);
  };

  const handleUpdateSubtitleMetric = (
    field: "fontSize" | "posY",
    val: number
  ) => {
    updateCurrentClip(
      (c) =>
        field === "fontSize" ? { ...c, subFontSize: val } : { ...c, subPosY: val },
      false
    );
  };

  const handleEditSubtitleText = (idx: number, text: string) => {
    updateCurrentClip((c) => {
      const subs = [...(c.subtitles || [])];
      if (subs[idx]) {
        subs[idx] = { ...subs[idx], text };
      }
      return { ...c, subtitles: subs };
    }, false);
  };

  const handleUpdateAdjustment = (
    key: "zoom" | "contrast" | "vignette",
    val: number
  ) => {
    updateCurrentClip(
      (c) => ({
        ...c,
        adjust: {
          zoom: c.adjust?.zoom ?? 100,
          contrast: c.adjust?.contrast ?? 100,
          vignette: c.adjust?.vignette ?? 25,
          [key]: val,
        },
      }),
      false
    );
  };

  const handleResetAdjustments = () => {
    updateCurrentClip(
      (c) => ({
        ...c,
        adjust: { zoom: 100, contrast: 100, vignette: 25 },
      }),
      true
    );
    showToast("Adjustments reset");
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = ["INPUT", "TEXTAREA"].includes(
        document.activeElement?.tagName || ""
      );
      if (e.key === "Escape") {
        setIsExportOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !isTyping) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if (isExportOpen || isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlayback();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSeekTo(currentTime + 0.5);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSeekTo(currentTime - 0.5);
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        handleSetTrimIn();
      } else if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleSetTrimOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Recovery State
  if (!project || !activeClip) {
    return (
      <div className="min-h-screen bg-canvas arch-grid flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center mb-4 shadow-sm">
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
          Recovery State
        </span>
        <h2 className="text-2xl font-bold text-ink mb-2">
          Clip or Project Not Found
        </h2>
        <p className="text-[13px] text-muted max-w-md mb-6 leading-relaxed">
          The requested clip could not be located in your active workspace. You can
          return to the Creator Studio or load the default sample project.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="btn-tactile px-5 py-2.5 rounded-full bg-ink text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            ← Back to Studio
          </Link>
          <button
            type="button"
            onClick={() => {
              const def = createDefaultProject();
              saveActiveProject(def);
              setProject(def);
              setActiveClipIdx(0);
              setCurrentTime(def.clips[0].trimIn ?? 0);
              showToast("Loaded default sample project");
            }}
            className="btn-tactile px-5 py-2.5 rounded-full border border-line bg-white hover:border-ink text-[13px] font-medium text-ink transition-colors cursor-pointer"
          >
            Load Default Project
          </button>
        </div>
      </div>
    );
  }

  const canUndo = historyPointer > 0;
  const canRedo = historyPointer < historyStack.length - 1;
  const undoCount = Math.max(0, historyPointer);
  const redoCount = Math.max(0, historyStack.length - 1 - historyPointer);

  const statusMode = isSyncingClip
    ? "syncing"
    : isPlaying
    ? "playing"
    : "ready";
  const statusText = isSyncingClip
    ? "Syncing clip..."
    : isPlaying
    ? `Clip ${activeClip.indexLabel || "01"} / 0${project.clips.length} · Playing`
    : `Clip ${activeClip.indexLabel || "01"} / 0${project.clips.length} · Ready`;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden selection:bg-ink selection:text-white bg-canvas">
      {/* 1. TOP STICKY BAR */}
      <EditorHeader
        statusText={statusText}
        statusMode={statusMode}
        canUndo={canUndo}
        canRedo={canRedo}
        undoCount={undoCount}
        redoCount={redoCount}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Mobile / Tablet Workspace View Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-line shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-medium">
          Workspace View
        </span>
        <div
          role="tablist"
          aria-label="Mobile workspace view tabs"
          className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line text-[11.5px] font-medium"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "deck"}
            onClick={() => {
              setMobileTab("deck");
              audioEngine.playClick();
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mobileTab === "deck"
                ? "bg-ink text-white shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            Queue ({project.clips.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "stage"}
            onClick={() => {
              setMobileTab("stage");
              audioEngine.playClick();
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mobileTab === "stage"
                ? "bg-ink text-white shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            Preview Stage
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "inspector"}
            onClick={() => {
              setMobileTab("inspector");
              audioEngine.playClick();
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mobileTab === "inspector"
                ? "bg-ink text-white shadow-xs font-semibold"
                : "text-muted hover:text-ink"
            }`}
          >
            Inspector
          </button>
        </div>
      </div>

      {/* 2. UPPER WORKSPACE (3-Column Layout) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row border-b border-line bg-canvas arch-grid overflow-hidden">
        {/* 2A. CLIPS DECK */}
        <div
          className={`w-full lg:w-[292px] shrink-0 ${
            mobileTab === "deck" ? "flex flex-col" : "hidden"
          } lg:flex lg:flex-col`}
        >
          <ClipsDeck
            clips={project.clips}
            activeClipIdx={activeClipIdx}
            onSelectClip={handleSelectClip}
            onCycleDeck={handleCycleDeck}
          />
        </div>

        {/* 2B. PREVIEW STAGE */}
        <div
          className={`flex-1 min-w-0 ${
            mobileTab === "stage" ? "flex flex-col" : "hidden"
          } lg:flex lg:flex-col`}
        >
          <PreviewStage
            clip={activeClip}
            sourceUrl={project?.source?.url}
            currentTime={currentTime}
            isPlaying={isPlaying}
            isSyncing={isSyncingClip}
            safeZoneEnabled={safeZoneEnabled}
          />
        </div>

        {/* 2C. INSPECTOR */}
        <div
          className={`w-full lg:w-[336px] shrink-0 ${
            mobileTab === "inspector" ? "flex flex-col" : "hidden"
          } lg:flex lg:flex-col`}
        >
          <EditorInspector
            clip={activeClip}
            currentTime={currentTime}
            safeZoneEnabled={safeZoneEnabled}
            onSelectPreset={handleSelectPreset}
            onToggleSubtitles={handleToggleSubtitles}
            onSelectCaptionStyle={handleSelectCaptionStyle}
            onUpdateSubtitleMetric={handleUpdateSubtitleMetric}
            onEditSubtitleText={handleEditSubtitleText}
            onSeekTo={handleSeekTo}
            onUpdateAdjustment={handleUpdateAdjustment}
            onResetAdjustments={handleResetAdjustments}
            onToggleSafeZone={() => setSafeZoneEnabled((v) => !v)}
          />
        </div>
      </div>

      {/* 3. MULTI-TRACK TIMELINE */}
      <TimelineDock
        clip={activeClip}
        currentTime={currentTime}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        isMuted={isMuted}
        volume={volume}
        isSnapEnabled={isSnapEnabled}
        timelineZoom={timelineZoom}
        onTogglePlayback={handleTogglePlayback}
        onSeekTo={handleSeekTo}
        onCycleSpeed={handleCycleSpeed}
        onToggleMute={() => {
          audioEngine.playClick();
          setIsMuted((v) => !v);
        }}
        onVolumeChange={(v) => {
          setVolume(v);
          audioEngine.setVolume(v, isMuted);
        }}
        onSplitAtPlayhead={handleSplitAtPlayhead}
        onSetTrimIn={handleSetTrimIn}
        onSetTrimOut={handleSetTrimOut}
        onResetCuts={handleResetCuts}
        onToggleSnap={() => {
          audioEngine.playClick();
          setIsSnapEnabled((v) => !v);
        }}
        onSetTimelineZoom={setTimelineZoom}
      />

      {/* 4. EXPORT MODAL */}
      <ExportModal
        clip={activeClip}
        project={project}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExportSuccess={(fmt) => {
          setIsExportOpen(false);
          updateCurrentClip((c) => ({ ...c, exported: true }), true);
          showToast(`${fmt.toUpperCase()} export downloaded`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
        >
          <div className="px-3.5 py-2 rounded-full bg-ink text-white text-[12px] font-medium shadow-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
