"use client";

import React from "react";
import { AspectRatio, LengthPreference } from "@/types/studio";

interface ConfigurationBarProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  lengthPref: LengthPreference;
  onLengthPrefChange: (pref: LengthPreference) => void;
  autoCaptions: boolean;
  onAutoCaptionsToggle: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
}

export function ConfigurationBar({
  aspectRatio,
  onAspectRatioChange,
  lengthPref,
  onLengthPrefChange,
  autoCaptions,
  onAutoCaptionsToggle,
  onAnalyze,
  isAnalyzing,
  hasAnalyzed,
}: ConfigurationBarProps) {
  const activePill =
    "px-2.5 py-1 rounded-full text-[11.5px] font-medium bg-ink text-white transition-all cursor-pointer";
  const idlePill =
    "px-2.5 py-1 rounded-full text-[11.5px] font-medium text-muted hover:text-ink transition-all cursor-pointer";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-0.5">
      {/* Compact Configuration Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Aspect Ratio */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10.5px] text-muted">Ratio</span>
          <div className="inline-flex p-0.5 rounded-full bg-canvas border border-line">
            <button
              type="button"
              onClick={() => onAspectRatioChange("9:16")}
              className={aspectRatio === "9:16" ? activePill : idlePill}
            >
              9:16 Vertical
            </button>
            <button
              type="button"
              onClick={() => onAspectRatioChange("1:1")}
              className={aspectRatio === "1:1" ? activePill : idlePill}
            >
              1:1 Square
            </button>
          </div>
        </div>

        {/* Target Length */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10.5px] text-muted">Length</span>
          <div className="inline-flex p-0.5 rounded-full bg-canvas border border-line">
            <button
              type="button"
              onClick={() => onLengthPrefChange("under30")}
              className={lengthPref === "under30" ? activePill : idlePill}
            >
              &lt; 30s
            </button>
            <button
              type="button"
              onClick={() => onLengthPrefChange("30-60")}
              className={lengthPref === "30-60" ? activePill : idlePill}
            >
              30–60s
            </button>
            <button
              type="button"
              onClick={() => onLengthPrefChange("60-90")}
              className={lengthPref === "60-90" ? activePill : idlePill}
            >
              60–90s
            </button>
          </div>
        </div>

        {/* Auto-Captions Toggle */}
        <button
          type="button"
          onClick={onAutoCaptionsToggle}
          aria-pressed={autoCaptions}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-canvas border border-line hover:border-ink/40 text-[11.5px] font-medium text-ink transition-colors cursor-pointer"
        >
          <span>Auto-Captions</span>
          <span
            className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-all ${
              autoCaptions
                ? "bg-ink justify-end"
                : "bg-neutral-300 justify-start"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-white shadow-xs" />
          </span>
        </button>
      </div>

      {/* Primary Black Pill CTA + Shortcut Hint */}
      <button
        type="button"
        disabled={isAnalyzing}
        onClick={onAnalyze}
        className="btn-sheen w-full lg:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-ink text-white text-[13.5px] font-medium hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-[0_14px_30px_-10px_rgba(10,10,10,0.42)] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      >
        <span>
          {isAnalyzing
            ? "Analyzing..."
            : hasAnalyzed
            ? "Re-Analyze Video"
            : "Analyze & Extract Clips"}
        </span>
        <span className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-white/80">
          ⌘↵
        </span>
        <svg
          className="w-4 h-4"
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
      </button>
    </div>
  );
}
