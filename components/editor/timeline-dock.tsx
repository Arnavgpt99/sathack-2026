"use client";

import React, { useRef, useState } from "react";
import { Clip } from "@/types/studio";
import { formatTC } from "@/lib/editor-store";

interface TimelineDockProps {
  clip: Clip;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isMuted: boolean;
  volume?: number;
  isSnapEnabled: boolean;
  timelineZoom: number;
  onTogglePlayback: () => void;
  onSeekTo: (sec: number) => void;
  onCycleSpeed: () => void;
  onToggleMute: () => void;
  onVolumeChange?: (vol: number) => void;
  onSplitAtPlayhead: () => void;
  onSetTrimIn: () => void;
  onSetTrimOut: () => void;
  onResetCuts: () => void;
  onToggleSnap: () => void;
  onSetTimelineZoom: (val: number) => void;
}

export function TimelineDock({
  clip,
  currentTime,
  isPlaying,
  playbackSpeed,
  isMuted,
  volume = 0.7,
  isSnapEnabled,
  timelineZoom,
  onTogglePlayback,
  onSeekTo,
  onCycleSpeed,
  onToggleMute,
  onVolumeChange,
  onSplitAtPlayhead,
  onSetTrimIn,
  onSetTrimOut,
  onResetCuts,
  onToggleSnap,
  onSetTimelineZoom,
}: TimelineDockProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const dur = clip.duration || Math.max(5, clip.endSec - clip.startSec);
  const trimIn = clip.trimIn ?? 0;
  const trimOut = clip.trimOut ?? dur;

  // Pointer scrubbing
  const scrubFromClientX = (clientX: number) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let target = ratio * dur;
    if (isSnapEnabled) target = Math.round(target * 2) / 2;
    onSeekTo(target);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    scrubFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    setIsScrubbing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Ruler markings
  const stepSec = timelineZoom >= 2 ? 2 : 4;
  const rulerTicks: { sec: number; leftPct: number }[] = [];
  for (let s = 0; s <= dur; s += stepSec) {
    rulerTicks.push({ sec: s, leftPct: (s / dur) * 100 });
  }

  // Video track slices
  const splits = (clip.splits || [])
    .filter((p) => p > 0.5 && p < dur - 0.5)
    .sort((a, b) => a - b);
  const points = [0, ...splits, dur];

  const pct = Math.max(0, Math.min(100, (currentTime / dur) * 100));

  return (
    <section
      aria-label="Multi-Track Timeline and Tools"
      className="w-full bg-white shrink-0 flex flex-col"
    >
      {/* Tactile Toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-line flex flex-wrap items-center justify-between gap-2.5 bg-canvas/80">
        {/* Left: Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSeekTo(currentTime - 0.5)}
            title="Nudge Back 0.5s (←)"
            aria-label="Nudge back"
            className="btn-tactile w-7 h-7 rounded-lg border border-line bg-white hover:border-ink flex items-center justify-center text-ink cursor-pointer"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={onTogglePlayback}
            title="Play / Pause (Space)"
            aria-label="Play or pause"
            className="btn-tactile btn-primary-dark w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5 ml-0.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSeekTo(currentTime + 0.5)}
            title="Nudge Forward 0.5s (→)"
            aria-label="Nudge forward"
            className="btn-tactile w-7 h-7 rounded-lg border border-line bg-white hover:border-ink flex items-center justify-center text-ink cursor-pointer"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="ml-1 px-2.5 py-1 rounded-lg bg-white border border-line font-mono text-[11px] text-ink tabular-nums">
            <span>{formatTC(currentTime)}</span>
            <span className="text-muted mx-1">/</span>
            <span className="text-muted">{formatTC(dur)}</span>
          </div>

          <button
            type="button"
            onClick={onCycleSpeed}
            title="Playback speed"
            className="btn-tactile px-2 py-1 rounded-lg border border-line bg-white hover:border-ink font-mono text-[11px] font-medium text-ink cursor-pointer"
          >
            {playbackSpeed}x
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Toggle mute"
            aria-pressed={isMuted}
            className="btn-tactile w-7 h-7 rounded-lg border border-line bg-white hover:border-ink flex items-center justify-center text-ink cursor-pointer"
          >
            {isMuted ? (
              <svg
                className="w-3.5 h-3.5 text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </button>

          {/* Volume Control Slider */}
          <div
            className="hidden sm:flex items-center gap-1.5 pl-0.5"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-14 h-1 accent-ink cursor-pointer bg-line rounded"
            />
          </div>
        </div>

        {/* Center: Pro Editing Tools with Inline <kbd> Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSplitAtPlayhead}
            className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-white hover:border-ink text-[11.5px] font-medium text-ink cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="18" r="2.5" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
            </svg>
            <span>Split</span>
            <span className="kbd-badge">S</span>
          </button>

          <button
            type="button"
            onClick={onSetTrimIn}
            className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-white hover:border-ink text-[11.5px] font-medium text-ink cursor-pointer"
          >
            <span>Trim In</span>
            <span className="kbd-badge">I</span>
          </button>

          <button
            type="button"
            onClick={onSetTrimOut}
            className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-white hover:border-ink text-[11.5px] font-medium text-ink cursor-pointer"
          >
            <span>Trim Out</span>
            <span className="kbd-badge">O</span>
          </button>

          <button
            type="button"
            onClick={onResetCuts}
            className="btn-tactile px-2.5 py-1 rounded-lg border border-line bg-white hover:border-ink text-[11.5px] font-medium text-muted hover:text-ink cursor-pointer"
          >
            Reset Cuts
          </button>

          <button
            type="button"
            onClick={onToggleSnap}
            aria-pressed={isSnapEnabled}
            className={`btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11.5px] font-medium cursor-pointer ${
              isSnapEnabled
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-muted hover:text-ink"
            }`}
          >
            <span>Snap</span>
          </button>
        </div>

        {/* Right: Timeline Zoom Slider (1x – 3x) */}
        <div className="flex items-center gap-2 min-w-[144px]">
          <button
            type="button"
            onClick={() => onSetTimelineZoom(Math.max(1, timelineZoom - 0.25))}
            aria-label="Zoom out timeline"
            className="font-mono text-xs text-muted hover:text-ink px-1 cursor-pointer"
          >
            −
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={timelineZoom}
            onChange={(e) => onSetTimelineZoom(Number(e.target.value))}
            className="mono-slider w-24"
            aria-label="Timeline zoom"
          />
          <button
            type="button"
            onClick={() => onSetTimelineZoom(Math.min(3, timelineZoom + 0.25))}
            aria-label="Zoom in timeline"
            className="font-mono text-xs text-muted hover:text-ink px-1 cursor-pointer"
          >
            +
          </button>
          <span className="font-mono text-[10px] text-muted w-8 text-right tabular-nums">
            {timelineZoom.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Interactive Multi-Track Timeline */}
      <div className="flex h-[182px] overflow-hidden relative">
        {/* Fixed Track Labels */}
        <div className="w-20 sm:w-24 shrink-0 border-r border-line bg-canvas/85 flex flex-col font-mono text-[9.5px] uppercase tracking-wider text-muted select-none">
          <div className="h-7 border-b border-line flex items-center px-3">
            Time
          </div>
          <div className="flex-1 border-b border-line/80 flex items-center px-3 text-ink font-semibold">
            Video
          </div>
          <div className="flex-1 border-b border-line/80 flex items-center px-3">
            Subtitles
          </div>
          <div className="flex-1 flex items-center px-3">Audio</div>
        </div>

        {/* Scrollable Tracks Viewport */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden thin-scroll relative bg-white select-none">
          <div
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative h-full flex flex-col touch-none cursor-ew-resize"
            style={{ width: `${timelineZoom * 100}%` }}
          >
            {/* Ruler */}
            <div className="h-7 border-b border-line relative bg-canvas/55 shrink-0">
              {rulerTicks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 flex flex-col justify-end"
                  style={{ left: `${tick.leftPct}%` }}
                >
                  <span className="font-mono text-[9px] text-muted pl-1 pb-0.5 tabular-nums">
                    {formatTC(tick.sec).slice(0, 5)}
                  </span>
                  <div className="w-[1px] h-2 bg-neutral-300" />
                </div>
              ))}
            </div>

            {/* Video Track */}
            <div className="flex-1 border-b border-line/70 relative py-2">
              {points.slice(0, points.length - 1).map((segStart, i) => {
                const segEnd = points[i + 1];
                const leftPct = (segStart / dur) * 100;
                const widthPct = ((segEnd - segStart) / dur) * 100;

                return (
                  <div
                    key={i}
                    className="absolute top-2 bottom-2 rounded-lg bg-ink text-white px-2.5 flex items-center justify-between overflow-hidden border border-white/20"
                    style={{
                      left: `calc(${leftPct}% + 1px)`,
                      width: `calc(${widthPct}% - 2px)`,
                    }}
                  >
                    <span className="font-mono text-[10px] truncate">
                      {clip.title} {points.length > 2 ? `· Pt ${i + 1}` : ""}
                    </span>
                    <span className="font-mono text-[9.5px] text-white/65 shrink-0 ml-2">
                      {(segEnd - segStart).toFixed(1)}s
                    </span>
                  </div>
                );
              })}

              {/* Trimmed Dimmed Regions */}
              {trimIn > 0 && (
                <div
                  className="absolute top-1.5 bottom-1.5 left-0 bg-white/78 backdrop-blur-[1px] border-r-2 border-ink z-10 pointer-events-none"
                  style={{ width: `${(trimIn / dur) * 100}%` }}
                />
              )}
              {trimOut < dur && (
                <div
                  className="absolute top-1.5 bottom-1.5 right-0 bg-white/78 backdrop-blur-[1px] border-l-2 border-ink z-10 pointer-events-none"
                  style={{ width: `${((dur - trimOut) / dur) * 100}%` }}
                />
              )}
            </div>

            {/* Subtitles Track */}
            <div className="flex-1 border-b border-line/70 relative py-2">
              {(clip.subtitles || []).map((seg) => {
                const leftPct = (seg.start / dur) * 100;
                const widthPct = ((seg.end - seg.start) / dur) * 100;
                const isActive =
                  clip.subtitlesEnabled !== false &&
                  currentTime >= seg.start &&
                  currentTime <= seg.end;

                return (
                  <div
                    key={seg.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeekTo(seg.start + 0.05);
                    }}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute top-2 bottom-2 rounded-md px-2 text-left truncate font-mono text-[9.5px] border transition-colors cursor-pointer flex items-center ${
                      clip.subtitlesEnabled === false
                        ? "opacity-35 bg-canvas border-line text-muted"
                        : isActive
                        ? "bg-ink text-white border-ink"
                        : "bg-canvas border-line text-ink hover:border-ink/50"
                    }`}
                  >
                    {seg.text}
                  </div>
                );
              })}
            </div>

            {/* Audio Track */}
            <div className="flex-1 relative py-2 flex items-center">
              <div
                className={`w-full h-full px-1 flex items-center justify-between gap-[2px] ${
                  isMuted ? "opacity-25" : "opacity-85"
                } transition-opacity`}
              >
                {(clip.waveform || []).map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 bg-ink rounded-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Precision Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: `${pct}%` }}
            >
              <div className="w-[1.5px] h-full bg-ink relative">
                <div className="w-3 h-3 -ml-[5.25px] bg-ink rounded-b-sm shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
