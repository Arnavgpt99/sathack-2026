"use client";

import React from "react";

interface CreativeDirectionInputProps {
  value: string;
  onChange: (val: string) => void;
  activePresetKey: string | null;
  onPresetToggle: (key: string) => void;
}

export function CreativeDirectionInput({
  value,
  onChange,
  activePresetKey,
  onPresetToggle,
}: CreativeDirectionInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label
          htmlFor="directionInput"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          02 · Creative Direction
        </label>
        <span className="font-mono text-[11px] text-muted/80">
          {value.length} / 240
        </span>
      </div>

      <div className="rounded-2xl bg-canvas border border-line focus-within:border-ink transition-colors p-3.5">
        <textarea
          id="directionInput"
          rows={3}
          maxLength={240}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Find the sharpest 45-second contrarian takes, punch up the opening hook, and cut dead air..."
          className="w-full bg-transparent text-[14px] leading-relaxed text-ink placeholder:text-ink/35 resize-none focus:outline-none"
        />

        {/* 4 Clickable Quick-Direction Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-1 border-t border-line/70">
          <span className="font-mono text-[10.5px] text-muted mr-1">Directions:</span>
          <button
            type="button"
            onClick={() => onPresetToggle("hooks")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer ${
              activePresetKey === "hooks"
                ? "bg-ink border border-ink text-white"
                : "bg-white border border-line hover:border-ink text-ink"
            }`}
          >
            Sharpest Hooks
          </button>
          <button
            type="button"
            onClick={() => onPresetToggle("gold")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer ${
              activePresetKey === "gold"
                ? "bg-ink border border-ink text-white"
                : "bg-white border border-line hover:border-ink text-ink"
            }`}
          >
            Actionable Gold
          </button>
          <button
            type="button"
            onClick={() => onPresetToggle("debate")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer ${
              activePresetKey === "debate"
                ? "bg-ink border border-ink text-white"
                : "bg-white border border-line hover:border-ink text-ink"
            }`}
          >
            Debate &amp; Tension
          </button>
          <button
            type="button"
            onClick={() => onPresetToggle("story")}
            className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition-all cursor-pointer ${
              activePresetKey === "story"
                ? "bg-ink border border-ink text-white"
                : "bg-white border border-line hover:border-ink text-ink"
            }`}
          >
            Story Arc
          </button>
        </div>
      </div>
    </div>
  );
}
