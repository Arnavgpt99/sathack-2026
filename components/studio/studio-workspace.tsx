"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AspectRatio,
  CaptionStyle,
  Clip,
  EditorPreset,
  EditorCaptionStyle,
  LengthPreference,
  ProcessingStage,
  SortOption,
  SourceVideo,
} from "@/types/studio";
import {
  SAMPLE_SOURCES,
  DIRECTION_PRESETS,
  createInitialClips,
} from "@/lib/sample-data";
import { studioService, downloadFile } from "@/lib/studio-service";
import { getActiveProject, saveActiveProject } from "@/lib/editor-store";
import { StudioHeader } from "./studio-header";
import { VideoInputInstrument } from "./video-input-instrument";
import { CreativeDirectionInput } from "./creative-direction-input";
import { ConfigurationBar } from "./configuration-bar";
import { AnalysisPipeline } from "./analysis-pipeline";
import { ClipCard } from "./clip-card";
import { ClipEditorModal } from "./clip-editor-modal";
import { SmartMomentSearch } from "./smart-moment-search";

export function StudioWorkspace() {
  const [projectId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = getActiveProject();
      return saved?.id || "proj-sathack-2026";
    }
    return "proj-sathack-2026";
  });

  // Studio Mode: Clip Discovery vs Smart Moment Search
  const [studioMode, setStudioMode] = useState<"clip_discovery" | "smart_search">(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const m = sp.get("mode");
      if (m === "smart_search" || m === "timeline_search" || m === "smart") {
        return "smart_search";
      }
    }
    return "clip_discovery";
  });

  // Source & Direction State
  const [url, setUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("demo") === "1" || sp.get("demo") === "true") {
        return SAMPLE_SOURCES[0].url;
      }
      const saved = getActiveProject();
      return saved?.source?.url || "";
    }
    return "";
  });
  const [creativeDirection, setCreativeDirection] = useState("");
  const [activeDirectionKey, setActiveDirectionKey] = useState<string | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [activeSource, setActiveSource] = useState<SourceVideo | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("demo") === "1" || sp.get("demo") === "true") {
        return SAMPLE_SOURCES[0];
      }
      const saved = getActiveProject();
      if (saved?.source && saved.source.url) {
        return saved.source;
      }
      return null;
    }
    return null;
  });
  const [showPreviewStrip, setShowPreviewStrip] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("demo") === "1" || sp.get("demo") === "true") return true;
      const saved = getActiveProject();
      return Boolean(saved?.source?.url);
    }
    return false;
  });

  // Configuration Preferences
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [lengthPref, setLengthPref] = useState<LengthPreference>("30-60");
  const [autoCaptions, setAutoCaptions] = useState(true);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("demo") === "1" || sp.get("demo") === "true";
    }
    return false;
  });
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const [analysisStage, setAnalysisStage] = useState<ProcessingStage>({
    step: 1,
    label: "1. Fetching transcript & audio peaks...",
    percent: 0,
    completed: false,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clips & Grid State
  const [clips, setClips] = useState<Clip[]>(() => {
    if (typeof window !== "undefined") {
      const saved = getActiveProject();
      if (saved && saved.clips && saved.clips.length > 0) {
        return saved.clips;
      }
    }
    return createInitialClips();
  });
  const [currentSort, setCurrentSort] = useState<SortOption>("score");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Editor Modal State
  const [editorClip, setEditorClip] = useState<Clip | null>(null);
  const [editorCaptionStyle, setEditorCaptionStyle] = useState<CaptionStyle>("minimal");
  const [isExporting, setIsExporting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resultsRef = useRef<HTMLElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Show demo toast on mount if query param is set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("demo") === "1" || sp.get("demo") === "true") {
        const t = setTimeout(() => {
          showToast("Demo project loaded");
        }, 150);
        return () => clearTimeout(t);
      }
    }
  }, [showToast]);

  // Compute workspace status text
  const getStatusText = () => {
    if (studioMode === "smart_search") {
      return "Smart Moment Search · Ready";
    }
    if (isAnalyzing) return "Analyzing source...";
    if (!hasAnalyzed) return "Workspace · Ready";
    const exportedCount = clips.filter((c) => c.exported).length;
    if (exportedCount > 0) {
      return `${exportedCount} ${exportedCount === 1 ? "clip" : "clips"} exported`;
    }
    return `${clips.length} candidate clips ready`;
  };

  const fetchMetadataTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL Change Handler with Auto-Metadata Fetching
  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    const trimmed = newUrl.trim();
    if (!trimmed) {
      setActiveSource(null);
      setShowPreviewStrip(false);
      return;
    }

    setShowPreviewStrip(true);

    // Check if matches one of the sample sources
    const matchedSample = SAMPLE_SOURCES.find(
      (s) => s.url.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedSample) {
      setActiveSource(matchedSample);
      return;
    }

    const isYt = /youtu\.?be/i.test(trimmed);
    setActiveSource((prev) => {
      if (prev && prev.url === trimmed) return prev;
      return {
        id: `src-${Date.now()}`,
        url: trimmed,
        title: isYt ? "Detecting video details..." : "Custom Video Source",
        channel: isYt ? "YouTube" : "Web Video",
        platform: isYt ? "YouTube" : "Direct Stream",
        duration: "--:--",
        resolution: "1080p",
      };
    });

    if (isYt) {
      if (fetchMetadataTimeoutRef.current) clearTimeout(fetchMetadataTimeoutRef.current);
      fetchMetadataTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/metadata?url=${encodeURIComponent(trimmed)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.title) {
              setActiveSource((current) => {
                if (current && current.url === trimmed) {
                  return {
                    ...current,
                    title: data.title,
                    channel: data.channel || current.channel,
                    platform: data.platform || current.platform,
                  };
                }
                return current;
              });
            }
          }
        } catch {
          // Keep existing placeholder
        }
      }, 300);
    }
  }, []);

  // Paste action
  const handlePaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          handleUrlChange(text.trim());
          showToast("URL pasted from clipboard");
          return;
        }
      }
      throw new Error("Clipboard readText unavailable");
    } catch {
      showToast("Press Ctrl/Cmd+V to paste, or click Try Sample");
    }
  };

  // Cycle through sample videos
  const handleCycleSample = () => {
    const src = SAMPLE_SOURCES[sampleIndex];
    setActiveSource(src);
    setUrl(src.url);
    setShowPreviewStrip(true);
    setSampleIndex((prev) => (prev + 1) % SAMPLE_SOURCES.length);
    showToast(`Loaded sample: ${src.platform}`);
  };

  // Direction Preset toggle
  const handleDirectionPresetToggle = (key: string) => {
    if (activeDirectionKey === key) {
      setActiveDirectionKey(null);
      setCreativeDirection("");
    } else {
      setActiveDirectionKey(key);
      setCreativeDirection(DIRECTION_PRESETS[key] || "");
    }
  };

  // Length preference change adjusts unedited clips
  const handleLengthPrefChange = (pref: LengthPreference) => {
    setLengthPref(pref);
    setClips((prev) =>
      prev.map((c) => {
        if (c.edited) return c;
        let d: number;
        if (pref === "under30") d = 20 + (c.score % 9);
        else if (pref === "30-60") d = 34 + (c.score % 22);
        else d = 64 + (c.score % 22);
        return { ...c, endSec: c.startSec + d };
      })
    );
  };

  // Start analysis pipeline
  const handleStartAnalysis = useCallback(async () => {
    if (isAnalyzing) return;

    let targetUrl = url.trim();
    let currentSrc = activeSource;

    if (!targetUrl) {
      const src = SAMPLE_SOURCES[sampleIndex];
      currentSrc = src;
      setActiveSource(src);
      setUrl(src.url);
      setShowPreviewStrip(true);
      targetUrl = src.url;
      setSampleIndex((prev) => (prev + 1) % SAMPLE_SOURCES.length);
    } else {
      const matchedSample = SAMPLE_SOURCES.find(
        (s) => s.url.toLowerCase() === targetUrl.toLowerCase()
      );
      if (matchedSample) {
        currentSrc = matchedSample;
        setActiveSource(matchedSample);
      } else {
        // If user provided a custom URL, ensure source is cleanly detached from any sample ID
        if (!currentSrc || currentSrc.url !== targetUrl || currentSrc.id?.startsWith("sample-")) {
          currentSrc = {
            id: `custom-${Date.now()}`,
            url: targetUrl,
            title:
              activeSource &&
              activeSource.url === targetUrl &&
              activeSource.title !== "Detecting video details..."
                ? activeSource.title
                : "YouTube Video",
            channel: activeSource?.channel || "YouTube",
            platform: "YouTube",
            duration: activeSource?.duration || "unknown",
            resolution: "1080p",
          };
          setActiveSource(currentSrc);
        }
      }
    }

    setIsAnalyzing(true);
    abortControllerRef.current = new AbortController();

    try {
      const result = await studioService.analyze(
        {
          url: targetUrl,
          creativeDirection,
          aspectRatio,
          lengthPreference: lengthPref,
          autoCaptions,
          sourceVideo: currentSrc || undefined,
        },
        (stage) => setAnalysisStage(stage),
        abortControllerRef.current.signal
      );

      const enrichedClips = result.clips.map((c, idx) => {
        const dur = Math.max(5, Math.round(c.endSec - c.startSec));
        const hookText = (c.hook || c.title || "").replace(/^“|”$/g, "");
        return {
          ...c,
          sourceUrl: result.source.url,
          duration: dur,
          trimIn: 0,
          trimOut: dur,
          preset: (c.preset || "editorial") as EditorPreset,
          editorCaptionStyle: (c.editorCaptionStyle || "editorial") as EditorCaptionStyle,
          subtitlesEnabled: autoCaptions,
          subtitles:
            c.subtitles && c.subtitles.length > 0
              ? c.subtitles
              : [
                  {
                    id: `sub-${idx + 1}-1`,
                    start: 0,
                    end: Math.max(1.5, Math.min(dur * 0.45, 4)),
                    text: hookText,
                  },
                  {
                    id: `sub-${idx + 1}-2`,
                    start: Math.max(1.5, Math.min(dur * 0.45, 4)),
                    end: dur,
                    text: c.rationale ? c.rationale.slice(0, 80) : c.title,
                  },
                ],
        };
      });

      setClips(enrichedClips);
      setActiveSource(result.source);
      setIsSampleData(Boolean(result.isSampleData));
      setHasAnalyzed(true);
      setIsAnalyzing(false);

      saveActiveProject({
        id: projectId || "proj-sathack-2026",
        source: result.source,
        creativeDirection,
        aspectRatio,
        lengthPreference: lengthPref,
        autoCaptions,
        clips: enrichedClips,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        showToast("Analysis canceled");
      } else {
        showToast("Analysis encountered an issue. Using sample clips.");
      }
      setIsAnalyzing(false);
    }
  }, [
    isAnalyzing,
    url,
    activeSource,
    sampleIndex,
    creativeDirection,
    aspectRatio,
    lengthPref,
    autoCaptions,
    projectId,
    showToast,
  ]);

  // Cancel ongoing analysis
  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
  };

  // Reset workspace
  const handleResetWorkspace = () => {
    handleCancelAnalysis();
    setUrl("");
    setCreativeDirection("");
    setActiveDirectionKey(null);
    setShowPreviewStrip(false);
    setHasAnalyzed(false);
    setShowFavoritesOnly(false);
    setClips(createInitialClips());
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Workspace reset");
  };

  // Keyboard shortcut listener (Cmd/Ctrl+Enter for analysis)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !editorClip && !isAnalyzing) {
        e.preventDefault();
        handleStartAnalysis();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorClip, isAnalyzing, handleStartAnalysis]);

  // Favorite toggle
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClips((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextFav = !c.favorite;
          showToast(nextFav ? "Added to Favorites" : "Removed from Favorites");
          return { ...c, favorite: nextFav };
        }
        return c;
      })
    );
  };

  // Copy Hook
  const handleCopyHook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    const text = clip.hook.replace(/^“|”$/g, "");
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast("Opening hook copied");
  };

  // Save clip edits from editor
  const handleSaveEditorClip = (updatedClip: Clip) => {
    const nextClips = clips.map((c) =>
      c.id === updatedClip.id ? updatedClip : c
    );
    setClips(nextClips);
    saveActiveProject({
      id: projectId || "proj-sathack-2026",
      source: activeSource || SAMPLE_SOURCES[0],
      creativeDirection,
      aspectRatio,
      lengthPreference: lengthPref,
      autoCaptions,
      clips: nextClips,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setEditorClip(null);
    showToast("Clip changes saved");
  };

  // Export clip action
  const handleExportClip = (clipToExport: Clip) => {
    if (isExporting) return;
    setIsExporting(true);

    const source = activeSource || SAMPLE_SOURCES[0];
    const manifest = studioService.generateExportSummary(
      clipToExport,
      source,
      aspectRatio,
      autoCaptions,
      editorCaptionStyle
    );

    setTimeout(() => {
      const filename = `${clipToExport.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-reelix.txt`;
      downloadFile(filename, manifest);

      setClips((prev) =>
        prev.map((c) =>
          c.id === clipToExport.id ? { ...c, ...clipToExport, exported: true } : c
        )
      );

      setIsExporting(false);
      setEditorClip(null);
      showToast(`Exported "${clipToExport.title}" (.txt summary downloaded)`);
    }, 1100);
  };

  // Filtered & sorted clips
  const visibleClips = clips
    .filter((c) => (showFavoritesOnly ? c.favorite : true))
    .sort((a, b) => {
      if (currentSort === "score") return b.score - a.score;
      if (currentSort === "chrono") return a.startSec - b.startSec;
      if (currentSort === "shortest")
        return a.endSec - a.startSec - (b.endSec - b.startSec);
      return 0;
    });

  const favoritesCount = clips.filter((c) => c.favorite).length;

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-ink selection:text-white">
      {/* Background Architectural Grid & Vignette */}
      <div className="fixed inset-0 architectural-grid pointer-events-none z-0" />
      <div className="fixed inset-0 grid-vignette pointer-events-none z-0" />

      {/* 1. STICKY TOP BAR */}
      <StudioHeader
        statusText={getStatusText()}
        isStatusPulsing={isAnalyzing}
        onNewProject={handleResetWorkspace}
        showToast={showToast}
      />

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-20">
        {/* Studio Mode Switcher */}
        <section aria-label="Studio Mode Switch" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="inline-flex p-1 rounded-full bg-white border border-line self-start shadow-xs" role="tablist" aria-label="Studio Modes">
            <button
              type="button"
              role="tab"
              id="modeClipDiscoveryBtn"
              aria-selected={studioMode === "clip_discovery"}
              onClick={() => setStudioMode("clip_discovery")}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-colors cursor-pointer ${
                studioMode === "clip_discovery"
                  ? "font-semibold bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              Clip Discovery
            </button>
            <button
              type="button"
              role="tab"
              id="modeSmartSearchBtn"
              aria-selected={studioMode === "smart_search"}
              onClick={() => setStudioMode("smart_search")}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-medium transition-colors cursor-pointer ${
                studioMode === "smart_search"
                  ? "font-semibold bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              Smart Moment Search
            </button>
          </div>

          <div className="font-mono text-[11px] text-muted">
            {studioMode === "smart_search"
              ? "Condition-based full-timeline interval retrieval"
              : "AI highlight discovery & editorial ranking"}
          </div>
        </section>

        {studioMode === "smart_search" ? (
          <SmartMomentSearch showToast={showToast} />
        ) : (
          <>
            {/* INPUT INSTRUMENT SECTION */}
            <section
              aria-label="Video Source and Creative Direction"
              className="max-w-[840px] mx-auto"
            >
          {/* Tagline Header */}
          <div className="text-center space-y-4 mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-3">
              <span className="w-7 h-[1px] bg-ink/30" />
              <span className="font-mono text-[12px] text-muted tracking-tight">
                AI Clip Direction Studio
              </span>
              <span className="w-7 h-[1px] bg-ink/30" />
            </div>

            <h1 className="font-[family-name:var(--font-display)] font-extrabold text-[40px] sm:text-[54px] leading-[1.02] tracking-[-0.045em] text-ink">
              Drop a link. <span className="headline-accent-bar">Direct the cut.</span>
            </h1>

            <p className="text-[15px] sm:text-[16px] text-muted max-w-[560px] mx-auto leading-relaxed">
              Paste a long-form video link, guide the editorial angle, and inspect timestamped clips with pacing analytics.
            </p>
          </div>

          {/* Elevated Architectural Instrument Card */}
          <div className="rounded-3xl bg-white border border-line shadow-[0_20px_60px_-28px_rgba(10,10,18,0.14)] p-4 sm:p-6 space-y-5">
            {/* 2A. Source Video Input */}
            <VideoInputInstrument
              url={url}
              onUrlChange={handleUrlChange}
              onPaste={handlePaste}
              onCycleSample={handleCycleSample}
              sampleCounterText={`${((sampleIndex) || 3)}/3`}
              activeSource={activeSource}
              showPreviewStrip={showPreviewStrip}
            />

            <div className="h-[1px] bg-line" />

            {/* 2B. Creative Direction Input */}
            <CreativeDirectionInput
              value={creativeDirection}
              onChange={setCreativeDirection}
              activePresetKey={activeDirectionKey}
              onPresetToggle={handleDirectionPresetToggle}
            />

            <div className="h-[1px] bg-line" />

            {/* 2C. Configuration Controls & Submit CTA */}
            <ConfigurationBar
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              lengthPref={lengthPref}
              onLengthPrefChange={handleLengthPrefChange}
              autoCaptions={autoCaptions}
              onAutoCaptionsToggle={() => setAutoCaptions((prev) => !prev)}
              onAnalyze={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              hasAnalyzed={hasAnalyzed}
            />

            {/* 2D. Cancellable 3-Stage Progress Pipeline */}
            {isAnalyzing && (
              <AnalysisPipeline
                stage={analysisStage}
                onCancel={handleCancelAnalysis}
              />
            )}
          </div>
        </section>

        {/* 3. LOWER CLIPS GRID & DEEP ANALYTICS */}
        {/* Empty State before Analysis */}
        {!hasAnalyzed && (
          <section id="emptyStateSection" className="mt-14 max-w-[840px] mx-auto">
            <div className="rounded-3xl border border-dashed border-line bg-white/60 p-8 sm:p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-canvas border border-line text-ink flex items-center justify-center mx-auto">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M9 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-display)] font-semibold text-[16px] text-ink">
                No clips extracted yet
              </h2>
              <p className="text-[13.5px] text-muted max-w-md mx-auto leading-relaxed">
                Paste a video link above or click{" "}
                <button
                  type="button"
                  onClick={() => {
                    handleCycleSample();
                    handleStartAnalysis();
                  }}
                  className="underline text-ink font-medium hover:opacity-75 cursor-pointer"
                >
                  Try Sample &amp; Analyze
                </button>{" "}
                to generate timestamped candidate clips with retention curves.
              </p>
            </div>
          </section>
        )}

        {/* Results Section */}
        {hasAnalyzed && (
          <section
            id="resultsSection"
            ref={resultsRef}
            aria-label="Extracted Clips"
            className="mt-14 sm:mt-16 space-y-6 animate-in fade-in duration-300"
          >
            {/* Header, Sample Badge & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-line">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
                  {isSampleData ? (
                    <span className="px-2 py-0.5 rounded bg-ink text-white font-medium">
                      SAMPLE PREVIEW
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/40">
                      AI EXTRACTED CLIPS
                    </span>
                  )}
                  <span>{activeSource?.duration || "48:15"} source</span>
                  <span>·</span>
                  <span>
                    {visibleClips.length} candidate{" "}
                    {visibleClips.length === 1 ? "clip" : "clips"}
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-display)] font-bold text-[22px] sm:text-[26px] tracking-tight text-ink">
                  {activeSource?.title || "Extracted Candidate Clips"}
                </h2>
              </div>

              {/* Sort Pills & Favorites Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-1 rounded-full bg-white border border-line">
                  <button
                    type="button"
                    onClick={() => setCurrentSort("score")}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                      currentSort === "score"
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Highest Score
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSort("chrono")}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                      currentSort === "chrono"
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Chronological
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSort("shortest")}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                      currentSort === "shortest"
                        ? "bg-ink text-white"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Shortest
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly((prev) => !prev)}
                  aria-pressed={showFavoritesOnly}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12px] font-medium transition-all cursor-pointer ${
                    showFavoritesOnly
                      ? "bg-ink border-ink text-white"
                      : "bg-white border border-line hover:border-ink/40 text-ink"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <span>Favorites</span>
                  <span className="font-mono text-[10.5px] opacity-80">
                    ({favoritesCount})
                  </span>
                </button>
              </div>
            </div>

            {/* Clips Grid */}
            {visibleClips.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-line bg-white p-8 text-center space-y-2">
                <p className="text-sm font-medium text-ink">No favorite clips yet</p>
                <p className="text-xs text-muted">
                  Bookmark any clip card to pin it here.
                </p>
              </div>
            ) : (
              <div
                id="clipsGrid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {visibleClips.map((clip, idx) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    sourceUrl={activeSource?.url || url}
                    projectId={projectId}
                    aspectRatio={aspectRatio}
                    autoCaptions={autoCaptions}
                    index={idx}
                    onOpenEditor={(c) => setEditorClip(c)}
                    onToggleFavorite={handleToggleFavorite}
                    onCopyHook={handleCopyHook}
                  />
                ))}
              </div>
            )}
          </section>
        )}
          </>
        )}
      </main>

      {/* 4. CLIP EDITOR MODAL */}
      <ClipEditorModal
        isOpen={editorClip !== null}
        clip={editorClip}
        sourceUrl={activeSource?.url || url}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        autoCaptions={autoCaptions}
        captionStyle={editorCaptionStyle}
        onCaptionStyleChange={setEditorCaptionStyle}
        onSave={handleSaveEditorClip}
        onExport={handleExportClip}
        isExporting={isExporting}
        onClose={() => setEditorClip(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="px-4 py-2.5 rounded-full bg-ink text-white text-[12.5px] font-medium shadow-xl flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
