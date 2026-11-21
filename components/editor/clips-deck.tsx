"use client";

import React from "react";
import { Clip } from "@/types/studio";
import { EDITOR_PRESETS } from "@/lib/sample-data";

interface ClipsDeckProps {
  clips: Clip[];
  activeClipIdx: number;
  onSelectClip: (idx: number) => void;
  onCycleDeck: (dir: number) => void;
}

export function ClipsDeck({
  clips,
  activeClipIdx,
  onSelectClip,
  onCycleDeck,
}: ClipsDeckProps) {
  const total = clips.length;
  const active = clips[activeClipIdx] || clips[0];
  const activeDur = active
    ? ((active.trimOut ?? active.duration ?? 30) - (active.trimIn ?? 0)).toFixed(1)
    : "0.0";

  return (
    <aside
      aria-label="Selected Clips Deck"
      className="w-full lg:w-[292px] shrink-0 bg-white/88 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-line p-4 flex flex-col justify-between gap-4 min-h-[330px] lg:min-h-0"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted block">
            Selected Queue
          </span>
          <h2 className="font-semibold text-[14px] text-ink">Clips Deck</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCycleDeck(-1)}
            aria-label="Previous clip"
            className="btn-tactile w-7 h-7 rounded-full border border-line bg-white hover:border-ink flex items-center justify-center text-ink cursor-pointer"
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
            onClick={() => onCycleDeck(1)}
            aria-label="Next clip"
            className="btn-tactile w-7 h-7 rounded-full border border-line bg-white hover:border-ink flex items-center justify-center text-ink cursor-pointer"
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
        </div>
      </div>

      {/* Layered 3D Perspective Card Stack */}
      <div className="relative flex-1 flex items-center justify-center py-2 min-h-[212px]">
        <div className="deck-stage relative w-full max-w-[252px] h-[206px]">
          {clips.map((clip, idx) => {
            const offset = (idx - activeClipIdx + total) % total;
            const isFront = offset === 0;
            const translateY = offset * 12;
            const translateX = offset * 6;
            const scale = 1 - offset * 0.055;
            const opacity = isFront ? 1 : Math.max(0.28, 0.78 - offset * 0.22);
            const zIndex = total - offset;
            const dur = (
              (clip.trimOut ?? clip.duration ?? 30) - (clip.trimIn ?? 0)
            ).toFixed(1);
            const presetDef = EDITOR_PRESETS.find((p) => p.id === clip.preset);

            return (
              <div
                key={clip.id}
                onClick={() => onSelectClip(idx)}
                style={{
                  transform: `translate3d(${translateX}px, ${translateY}px, ${
                    -offset * 26
                  }px) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
                className={`deck-card rounded-2xl p-4 flex flex-col justify-between cursor-pointer border select-none ${
                  isFront
                    ? "bg-ink text-white border-ink shadow-[0_22px_44px_-16px_rgba(10,10,14,0.42)]"
                    : "bg-white/92 backdrop-blur-md text-ink border-line hover:border-ink/45 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                      isFront
                        ? "bg-white/15 text-white"
                        : "bg-canvas border border-line text-muted"
                    }`}
                  >
                    CLIP {clip.indexLabel || `0${idx + 1}`}
                  </span>
                  <span
                    className={`font-mono text-[10.5px] tabular-nums ${
                      isFront ? "text-white/75" : "text-muted"
                    }`}
                  >
                    {dur}s
                  </span>
                </div>

                <div className="space-y-1 my-auto pt-1.5">
                  <h3 className="font-bold text-[14px] leading-snug tracking-tight line-clamp-2">
                    {clip.title}
                  </h3>
                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isFront ? "text-white/70" : "text-muted"
                    }`}
                  >
                    &ldquo;{clip.hook}&rdquo;
                  </p>
                  {isFront && clip.waveform && (
                    <div className="h-5 flex items-end gap-[2px] opacity-70 my-1">
                      {clip.waveform.slice(0, 26).map((h, wi) => (
                        <span
                          key={wi}
                          className="flex-1 bg-white rounded-full"
                          style={{ height: `${Math.max(18, h)}%` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center justify-between pt-2 border-t ${
                    isFront ? "border-white/15" : "border-line"
                  } font-mono text-[9.5px]`}
                >
                  <span className={isFront ? "text-white/75" : "text-muted"}>
                    {presetDef?.name || "Editorial Mono"}
                  </span>
                  <span className={isFront ? "text-white font-medium" : "text-muted"}>
                    {isFront ? "● Active" : "Load →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 01–04 Pill Indicators */}
      <div className="space-y-2">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(total, 5)}, minmax(0, 1fr))`,
          }}
        >
          {clips.map((clip, idx) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => onSelectClip(idx)}
              className={`btn-tactile py-1.5 rounded-lg font-mono text-[11px] font-medium border cursor-pointer ${
                idx === activeClipIdx
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-muted border-line hover:border-ink/40 hover:text-ink"
              }`}
            >
              {clip.indexLabel || `0${idx + 1}`}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-muted pt-0.5">
          <span>Click card to load</span>
          <span className="text-ink font-medium tabular-nums">{activeDur}s</span>
        </div>
      </div>
    </aside>
  );
}
