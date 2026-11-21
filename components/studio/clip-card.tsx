"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clip, AspectRatio } from "@/types/studio";
import { extractYouTubeId } from "@/lib/editor-store";

interface ClipCardProps {
  clip: Clip;
  sourceUrl?: string;
  projectId?: string;
  aspectRatio: AspectRatio;
  autoCaptions: boolean;
  index: number;
  onOpenEditor?: (clip: Clip) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onCopyHook: (id: string, e: React.MouseEvent) => void;
}

export function ClipCard({
  clip,
  sourceUrl,
  projectId = "proj-sathack-2026",
  aspectRatio,
  autoCaptions,
  index,
  onOpenEditor,
  onToggleFavorite,
  onCopyHook,
}: ClipCardProps) {
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const videoId = extractYouTubeId(sourceUrl || clip.sourceUrl);

  const dur = Math.max(5, clip.endSec - clip.startSec);
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

  const timeRange = `${formatTime(clip.startSec)} – ${formatTime(clip.endSec)}`;

  const buildSparklineCoords = (points: number[]) => {
    return points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * 100;
        const y = 26 - ((val - 55) / 45) * 22;
        return `${x.toFixed(1)},${Math.max(2, Math.min(26, y)).toFixed(1)}`;
      })
      .join(" ");
  };

  const polyPoints = buildSparklineCoords(clip.retentionPoints);
  const isSquare = aspectRatio === "1:1";
  const thumbSizeClass = isSquare
    ? "w-[96px] aspect-square"
    : "w-[82px] aspect-[9/16]";

  const handleSparkHover = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.min(
      clip.retentionPoints.length - 1,
      Math.round(relX * (clip.retentionPoints.length - 1))
    );
    const secAtPoint = Math.round(relX * dur);
    setTooltipText(`${formatShortTime(secAtPoint)} · ${clip.retentionPoints[idx]}%`);
  };

  const handleSparkLeave = () => {
    setTooltipText(null);
  };

  return (
    <article
      onClick={() => onOpenEditor?.(clip)}
      style={{ animationDelay: `${index * 55}ms` }}
      className="clip-reveal group rounded-2xl bg-white border border-line hover:border-ink/45 hover:shadow-[0_18px_40px_-20px_rgba(10,10,18,0.18)] p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all"
    >
      {/* Top Row: Dark Monochrome Preview Frame + Meta */}
      <div className="flex gap-3.5 items-start">
        <div
          className={`relative ${thumbSizeClass} rounded-xl bg-[#0C0C0F] text-white overflow-hidden shrink-0 flex flex-col justify-between p-2 border border-black/10 transition-all`}
        >
          {videoId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={clip.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 frame-grain opacity-40 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-1">
            <span className="font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
              {dur}s
            </span>
            <span className="font-mono text-[8px] text-white/90 bg-black/50 px-1 py-0.5 rounded backdrop-blur-xs">
              {aspectRatio}
            </span>
          </div>

          {/* Hover-Animated Monochrome Waveform */}
          <div className="card-wave relative z-10 flex items-end justify-center gap-[2px] h-5 my-auto">
            <span
              className="wave-bar w-[2px] bg-white/75 rounded-full"
              style={{ animationDelay: "0s" }}
            />
            <span
              className="wave-bar w-[2px] bg-white/45 rounded-full"
              style={{ animationDelay: "0.14s" }}
            />
            <span
              className="wave-bar w-[2px] bg-white rounded-full"
              style={{ animationDelay: "0.28s" }}
            />
            <span
              className="wave-bar w-[2px] bg-white/60 rounded-full"
              style={{ animationDelay: "0.18s" }}
            />
          </div>

          {autoCaptions ? (
            <div className="relative z-10 text-[7.5px] font-mono leading-tight text-white/85 line-clamp-2 bg-black/45 px-1 py-0.5 rounded">
              {clip.hook.replace(/^“|”$/g, "")}
            </div>
          ) : (
            <div className="relative z-10 text-[8px] font-mono text-white/45">
              Captions off
            </div>
          )}
        </div>

        {/* Title, Timestamp, Status & Score */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] text-muted tabular-nums">
              {timeRange}
            </span>
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-canvas border border-line text-ink">
              {clip.score}/100
            </span>
          </div>

          <h3 className="font-[family-name:var(--font-display)] font-bold text-[15px] leading-snug text-ink">
            {clip.title}
          </h3>

          <p className="text-[12px] text-muted leading-relaxed line-clamp-3">
            {clip.hook}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {clip.exported && (
              <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-ink text-white">
                Exported
              </span>
            )}
            {clip.edited && !clip.exported && (
              <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-canvas border border-ink/40 text-ink">
                Edited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Concise Rationale */}
      <div className="px-3 py-2 rounded-xl bg-canvas border border-line/80 text-[11.5px] text-muted leading-snug">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink font-semibold mr-1">
          Why it works:
        </span>
        {clip.rationale}
      </div>

      {/* Analytics Block: Breakdown Bars + Interactive SVG Retention Sparkline */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <div className="flex justify-between font-mono text-[10px] text-muted mb-1">
              <span>Hook</span>
              <span className="text-ink font-medium">{clip.hookScore}</span>
            </div>
            <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-ink rounded-full"
                style={{ width: `${clip.hookScore}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-mono text-[10px] text-muted mb-1">
              <span>Pacing</span>
              <span className="text-ink font-medium">{clip.pacingScore}</span>
            </div>
            <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-ink rounded-full"
                style={{ width: `${clip.pacingScore}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-mono text-[10px] text-muted mb-1">
              <span>Clarity</span>
              <span className="text-ink font-medium">{clip.clarityScore}</span>
            </div>
            <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-ink rounded-full"
                style={{ width: `${clip.clarityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interactive SVG Retention Sparkline with Hover Tooltip */}
        <div className="relative flex items-center justify-between pt-1">
          <span className="font-mono text-[10px] text-muted">
            Retention ({clip.completionRate})
          </span>
          <div className="relative flex items-center">
            {tooltipText && (
              <span className="spark-tooltip absolute -top-6 right-0 font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-ink text-white whitespace-nowrap tabular-nums z-20">
                {tooltipText}
              </span>
            )}
            <svg
              className="w-24 h-6 text-ink cursor-crosshair"
              viewBox="0 0 100 28"
              fill="none"
              onMouseMove={handleSparkHover}
              onMouseLeave={handleSparkLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <polyline
                points={polyPoints}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Card Actions: Favorite, Copy Hook, Edit & Create */}
      <div className="pt-2.5 border-t border-line/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => onToggleFavorite(clip.id, e)}
            aria-label="Bookmark clip"
            aria-pressed={clip.favorite}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              clip.favorite
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-muted hover:text-ink hover:border-ink/40"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={clip.favorite ? "currentColor" : "none"}
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
          </button>

          <button
            type="button"
            onClick={(e) => onCopyHook(clip.id, e)}
            aria-label="Copy opening hook"
            className="inline-flex items-center gap-1 px-2.5 h-8 rounded-full border border-line bg-white text-muted hover:text-ink hover:border-ink/40 text-[11px] font-medium transition-colors cursor-pointer"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>Copy Hook</span>
          </button>
        </div>

        <Link
          href={`/studio/editor?projectId=${projectId}&clipId=${clip.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenEditor) onOpenEditor(clip);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-white text-[12px] font-medium hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
        >
          <span>Edit &amp; Create</span>
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
              d="M5 12h14m-6-6 6 6-6 6"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}
