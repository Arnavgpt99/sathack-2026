"use client";

import React, { useState, useEffect } from "react";
import { Clip, AspectRatio, CaptionStyle } from "@/types/studio";
import { extractYouTubeId } from "@/lib/editor-store";

interface ClipEditorModalProps {
  isOpen: boolean;
  clip: Clip | null;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  autoCaptions: boolean;
  captionStyle: CaptionStyle;
  sourceUrl?: string;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onSave: (updatedClip: Clip) => void;
  onExport: (clip: Clip) => void;
  isExporting: boolean;
  onClose: () => void;
}

interface InnerProps {
  clip: Clip;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  autoCaptions: boolean;
  captionStyle: CaptionStyle;
  sourceUrl?: string;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onSave: (updatedClip: Clip) => void;
  onExport: (clip: Clip) => void;
  isExporting: boolean;
  onClose: () => void;
}

function ClipEditorModalInner({
  clip,
  aspectRatio,
  onAspectRatioChange,
  autoCaptions,
  captionStyle,
  sourceUrl,
  onCaptionStyleChange,
  onSave,
  onExport,
  isExporting,
  onClose,
}: InnerProps) {
  // Local editable fields initialized from clip prop
  const [title, setTitle] = useState(clip.title);
  const [hook, setHook] = useState(clip.hook);
  const [startSec, setStartSec] = useState(clip.startSec);
  const [endSec, setEndSec] = useState(clip.endSec);
  const [trimBounds] = useState(() => ({
    min: Math.max(0, clip.startSec - 20),
    max: clip.endSec + 20,
  }));

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const [framingMode, setFramingMode] = useState<"fill" | "fit">("fill");

  const duration = Math.max(5, endSec - startSec);
  const videoId = extractYouTubeId(sourceUrl || clip.sourceUrl);

  const formatTime = (totalSec: number) => {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatShortTime = (totalSec: number) => {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // Idiomatic playback loop
  useEffect(() => {
    let rafId: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      if (isPlaying && duration > 0) {
        setProgress((prev) => (prev + dt / duration) % 1);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, duration]);

  // Keyboard shortcut listener (Space = play/pause, Escape = close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA"].includes(
        (document.activeElement as HTMLElement)?.tagName
      );

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Trim adjustments enforcing >= 5s
  const handleStartChange = (val: number) => {
    if (val > endSec - 5) {
      setStartSec(endSec - 5);
    } else {
      setStartSec(val);
    }
  };

  const handleEndChange = (val: number) => {
    if (val < startSec + 5) {
      setEndSec(startSec + 5);
    } else {
      setEndSec(val);
    }
  };

  // Trim highlight bar math
  const span = Math.max(1, trimBounds.max - trimBounds.min);
  const leftPct = ((startSec - trimBounds.min) / span) * 100;
  const widthPct = ((endSec - startSec) / span) * 100;

  const elapsedSec = Math.floor(progress * duration);

  const buildSparklineCoords = (points: number[]) => {
    return points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * 100;
        const y = 26 - ((val - 55) / 45) * 22;
        return `${x.toFixed(1)},${Math.max(2, Math.min(26, y)).toFixed(1)}`;
      })
      .join(" ");
  };

  const handleSaveClick = () => {
    onSave({
      ...clip,
      title: title.trim() || clip.title,
      hook: hook.trim() || clip.hook,
      startSec,
      endSec,
      edited: true,
      aspectRatio,
      captionStyle,
    });
  };

  const handleExportClick = () => {
    onExport({
      ...clip,
      title: title.trim() || clip.title,
      hook: hook.trim() || clip.hook,
      startSec,
      endSec,
      edited: true,
      aspectRatio,
      captionStyle,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editorModalTitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="modal-backdrop absolute inset-0 bg-ink/45 backdrop-blur-sm cursor-pointer"
      />

      {/* Dialog Panel */}
      <div className="modal-panel relative z-10 w-full max-w-[1000px] rounded-3xl bg-white border border-line shadow-[0_36px_90px_-20px_rgba(10,10,18,0.34)] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-line flex items-center justify-between bg-canvas/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-ink text-white shrink-0">
              Clip Editor
            </span>
            <h3
              id="editorModalTitle"
              className="font-[family-name:var(--font-display)] font-bold text-[16px] text-ink truncate"
            >
              {title || "Edit & Create Clip"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close clip editor"
            className="w-8 h-8 rounded-full bg-white border border-line hover:border-ink flex items-center justify-center text-ink transition-colors shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: BRUSHED-TITANIUM PHONE / SQUARE FRAME */}
          <div className="lg:col-span-5 bg-canvas border-b lg:border-b-0 lg:border-r border-line p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4">
            <div
              className={`titanium-frame p-[6px] sm:p-[7px] transition-all duration-300 ${
                aspectRatio === "1:1"
                  ? "w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-[26px] sm:rounded-[28px]"
                  : "w-[210px] xs:w-[230px] sm:w-[246px] aspect-[9/16] max-h-[50vh] sm:max-h-[460px] rounded-[34px] sm:rounded-[38px]"
              }`}
            >
              <div
                className={`relative w-full h-full overflow-hidden bg-[#0B0B0E] text-white flex flex-col justify-between p-3.5 sm:p-4 ${
                  aspectRatio === "1:1" ? "rounded-[20px] sm:rounded-[21px]" : "rounded-[28px] sm:rounded-[31px]"
                }`}
              >
                {/* Real YouTube Video Player when videoId is present */}
                {videoId ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
                    {framingMode === "fit" ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-35 scale-125 pointer-events-none"
                        />
                        <div className="relative z-10 w-full aspect-video border-y border-white/10 shadow-2xl overflow-hidden bg-black flex items-center justify-center">
                          <iframe
                            key={`${videoId}-${Math.floor(startSec)}-${Math.ceil(endSec)}-fit`}
                            title={title || "Clip Preview"}
                            src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(
                              startSec
                            )}&end=${Math.ceil(
                              endSec
                            )}&autoplay=${isPlaying ? 1 : 0}&playsinline=1&controls=1&rel=0&modestbranding=1`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </>
                    ) : (
                      <iframe
                        key={`${videoId}-${Math.floor(startSec)}-${Math.ceil(endSec)}-fill`}
                        title={title || "Clip Preview"}
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(
                          startSec
                        )}&end=${Math.ceil(
                          endSec
                        )}&autoplay=${isPlaying ? 1 : 0}&playsinline=1&controls=1&rel=0&modestbranding=1`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          height: "100%",
                          width:
                            aspectRatio === "1:1"
                              ? "calc(100% * 16 / 9)"
                              : "calc(100% * 256 / 81)",
                          maxWidth: "none",
                          border: 0,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                ) : null}

                <div className="absolute inset-0 frame-grain opacity-45 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                {/* Top preview status */}
                <div className="relative z-10 flex items-center justify-between pointer-events-auto">
                  <span className="font-mono text-[9px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {formatTime(startSec)}
                  </span>
                  {aspectRatio === "9:16" && (
                    <div className="w-14 h-3.5 rounded-full bg-black/80 border border-white/20" />
                  )}
                  {videoId ? (
                    <button
                      type="button"
                      onClick={() => setFramingMode((m) => (m === "fill" ? "fit" : "fill"))}
                      className="font-mono text-[9px] uppercase tracking-wider text-white bg-black/70 hover:bg-black/90 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
                      title="Toggle 9:16 Full Bleed vs 16:9 Fit"
                    >
                      {framingMode === "fill" ? "Fill" : "Fit"} · {aspectRatio}
                    </button>
                  ) : (
                    <span className="font-mono text-[9.5px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                      {aspectRatio}
                    </span>
                  )}
                </div>

                {/* Center waveform + live caption */}
                <div className="relative z-10 my-auto flex flex-col items-center text-center gap-3 px-1 pointer-events-none">
                  {!videoId && (
                    <div
                      className={`flex items-end justify-center gap-1 h-6 ${
                        isPlaying ? "editor-wave-active" : "editor-wave-paused"
                      }`}
                    >
                      <span className="wave-bar w-[2.5px] bg-white/80 rounded-full" style={{ animationDelay: "0s" }} />
                      <span className="wave-bar w-[2.5px] bg-white/55 rounded-full" style={{ animationDelay: "0.14s" }} />
                      <span className="wave-bar w-[2.5px] bg-white rounded-full" style={{ animationDelay: "0.28s" }} />
                      <span className="wave-bar w-[2.5px] bg-white/70 rounded-full" style={{ animationDelay: "0.42s" }} />
                      <span className="wave-bar w-[2.5px] bg-white/90 rounded-full" style={{ animationDelay: "0.2s" }} />
                      <span className="wave-bar w-[2.5px] bg-white/50 rounded-full" style={{ animationDelay: "0.34s" }} />
                    </div>
                  )}

                  {/* Caption display */}
                  <div className="w-full px-1">
                    {autoCaptions ? (
                      <p
                        className={
                          captionStyle === "minimal"
                            ? "font-mono text-[12px] leading-relaxed text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight bg-black/65 px-2.5 py-1 rounded-md inline-block backdrop-blur-xs"
                            : captionStyle === "bold"
                            ? "font-[family-name:var(--font-display)] font-extrabold text-[14px] leading-tight uppercase tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] bg-black/65 px-2.5 py-1 rounded-md inline-block backdrop-blur-xs"
                            : "font-sans font-semibold text-[12px] leading-snug text-ink bg-white px-2.5 py-1.5 rounded-lg inline-block shadow-md"
                        }
                      >
                        {hook || "Add an opening hook..."}
                      </p>
                    ) : (
                      <p className="font-mono text-[10px] text-white/50 bg-black/60 px-2 py-0.5 rounded">
                        Auto-Captions disabled
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom title & playhead */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                    <span className="truncate max-w-[140px] text-white font-medium">
                      {title || "Untitled Clip"}
                    </span>
                    <span>{duration}s</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-75"
                      style={{ width: `${(progress * 100).toFixed(2)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Play/Pause + Real-time Scrubber + Synced Timer */}
            <div className="w-full max-w-[276px] flex items-center gap-2.5 px-3 py-2 rounded-full bg-white border border-line">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label="Play or pause preview (Space)"
                className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center shrink-0 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1000"
                value={Math.floor(progress * 1000)}
                onChange={(e) => setProgress(Number(e.target.value) / 1000)}
                className="mono-slider flex-1"
                aria-label="Preview timeline scrubber"
              />
              <span className="font-mono text-[10px] text-muted shrink-0 tabular-nums">
                {formatShortTime(elapsedSec)} / {formatShortTime(duration)}
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted">
              Press Space to play/pause · Esc to close
            </p>
          </div>

          {/* RIGHT: CONTROLS, TRIMMING, CAPTION STYLES & ANALYTICS */}
          <div className="lg:col-span-7 p-5 sm:p-7 space-y-5">
            {/* Title & Hook Inputs */}
            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="editClipTitle"
                  className="block font-mono text-[10.5px] uppercase tracking-wider text-muted mb-1.5"
                >
                  Clip Title
                </label>
                <input
                  id="editClipTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-line text-[14px] font-medium text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="editClipHook"
                  className="block font-mono text-[10.5px] uppercase tracking-wider text-muted mb-1.5"
                >
                  Opening Hook / Live Caption
                </label>
                <textarea
                  id="editClipHook"
                  rows={2}
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-line text-[13.5px] text-ink resize-none focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Trimming Range */}
            <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">
                  Trim Range (Min 5s)
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-ink px-2.5 py-0.5 rounded-full bg-white border border-line tabular-nums">
                  {formatTime(startSec)} – {formatTime(endSec)} ({duration}s)
                </span>
              </div>

              {/* Visual timeline highlight bar */}
              <div className="relative w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-ink rounded-full transition-all duration-75"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-muted">
                    <span>Start</span>
                    <span className="text-ink font-medium tabular-nums">
                      {formatTime(startSec)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={trimBounds.min}
                    max={trimBounds.max}
                    value={startSec}
                    onChange={(e) => handleStartChange(Number(e.target.value))}
                    className="mono-slider"
                    aria-label="Trim start time"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-muted">
                    <span>End</span>
                    <span className="text-ink font-medium tabular-nums">
                      {formatTime(endSec)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={trimBounds.min}
                    max={trimBounds.max}
                    value={endSec}
                    onChange={(e) => handleEndChange(Number(e.target.value))}
                    className="mono-slider"
                    aria-label="Trim end time"
                  />
                </div>
              </div>
            </div>

            {/* Caption Style & Format Quick-Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8 space-y-1.5">
                <span className="block font-mono text-[10.5px] uppercase tracking-wider text-muted">
                  Caption Style
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCaptionStyleChange("minimal")}
                    className={`py-2 px-2.5 rounded-xl border text-[11.5px] font-medium transition-all cursor-pointer ${
                      captionStyle === "minimal"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:border-ink/40 text-ink"
                    }`}
                  >
                    Minimal Mono
                  </button>
                  <button
                    type="button"
                    onClick={() => onCaptionStyleChange("bold")}
                    className={`py-2 px-2.5 rounded-xl border text-[11.5px] font-medium transition-all cursor-pointer ${
                      captionStyle === "bold"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:border-ink/40 text-ink"
                    }`}
                  >
                    Bold Kinetic
                  </button>
                  <button
                    type="button"
                    onClick={() => onCaptionStyleChange("bar")}
                    className={`py-2 px-2.5 rounded-xl border text-[11.5px] font-medium transition-all cursor-pointer ${
                      captionStyle === "bar"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:border-ink/40 text-ink"
                    }`}
                  >
                    Subtitle Bar
                  </button>
                </div>
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <span className="block font-mono text-[10.5px] uppercase tracking-wider text-muted">
                  Format
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAspectRatioChange("9:16")}
                    className={`py-2 px-2 rounded-xl border text-[11.5px] font-medium transition-all cursor-pointer ${
                      aspectRatio === "9:16"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:border-ink/40 text-ink"
                    }`}
                  >
                    9:16
                  </button>
                  <button
                    type="button"
                    onClick={() => onAspectRatioChange("1:1")}
                    className={`py-2 px-2 rounded-xl border text-[11.5px] font-medium transition-all cursor-pointer ${
                      aspectRatio === "1:1"
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:border-ink/40 text-ink"
                    }`}
                  >
                    1:1
                  </button>
                </div>
              </div>

              {videoId && (
                <div className="sm:col-span-12 pt-2 border-t border-line/60 flex items-center justify-between">
                  <div>
                    <span className="block font-mono text-[10.5px] uppercase tracking-wider text-muted">
                      Vertical Framing
                    </span>
                    <span className="text-[11px] text-muted">
                      {framingMode === "fill"
                        ? "Full 9:16 vertical crop (zero black bars)"
                        : "16:9 widescreen fit with ambient blurred backdrop"}
                    </span>
                  </div>
                  <div className="inline-flex rounded-xl bg-canvas border border-line p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFramingMode("fill")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        framingMode === "fill"
                          ? "bg-ink text-white font-semibold shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {aspectRatio === "1:1" ? "1:1 Fill" : "9:16 Full Fill"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFramingMode("fit")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        framingMode === "fit"
                          ? "bg-ink text-white font-semibold shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      16:9 Fit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Model Assessment Summary */}
            <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted">
                  Model Assessment
                </span>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-line text-ink">
                  {clip.score ? `${clip.score}/100` : "Candidate"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2 rounded-xl bg-white border border-line">
                  <div className="font-mono text-[10px] text-muted">Hook</div>
                  <div className="font-[family-name:var(--font-display)] font-bold text-[17px] text-ink">
                    {clip.hookScore != null ? clip.hookScore : "—"}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-line">
                  <div className="font-mono text-[10px] text-muted">Pacing</div>
                  <div className="font-[family-name:var(--font-display)] font-bold text-[17px] text-ink">
                    {clip.pacingScore != null ? clip.pacingScore : "—"}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-line">
                  <div className="font-mono text-[10px] text-muted">Clarity</div>
                  <div className="font-[family-name:var(--font-display)] font-bold text-[17px] text-ink">
                    {clip.clarityScore != null ? clip.clarityScore : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11.5px] text-muted leading-snug">
                  {clip.dropoffNote}
                </p>
                {clip.retentionPoints && clip.retentionPoints.length > 1 ? (
                  <svg
                    className="w-24 h-7 text-ink shrink-0"
                    viewBox="0 0 100 28"
                    fill="none"
                  >
                    <polyline
                      points={buildSparklineCoords(clip.retentionPoints)}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="font-mono text-[9.5px] text-muted/70 italic text-right shrink-0">
                    Retention curve available post-publish
                  </span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSaveClick}
                className="w-full sm:w-auto px-5 py-3 rounded-full border border-line bg-white hover:border-ink text-[13px] font-medium text-ink transition-colors cursor-pointer"
              >
                Save Changes
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportClick}
                className="btn-sheen w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-ink text-white text-[13px] font-medium hover:bg-neutral-800 transition-all shadow-md disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>
                  {isExporting ? `Packaging ${aspectRatio} cut...` : "Create & Export Clip"}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClipEditorModal(props: ClipEditorModalProps) {
  if (!props.isOpen || !props.clip) return null;
  return <ClipEditorModalInner key={props.clip.id} {...props} clip={props.clip} />;
}
