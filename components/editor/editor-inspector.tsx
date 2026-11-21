"use client";

import React, { useState } from "react";
import {
  Clip,
  EditorPreset,
  EditorCaptionStyle,
} from "@/types/studio";
import { EDITOR_PRESETS, EDITOR_CAPTION_STYLES } from "@/lib/sample-data";
import { formatTC } from "@/lib/editor-store";

interface EditorInspectorProps {
  clip: Clip;
  currentTime: number;
  safeZoneEnabled: boolean;
  onSelectPreset: (presetId: EditorPreset) => void;
  onToggleSubtitles: () => void;
  onSelectCaptionStyle: (style: EditorCaptionStyle) => void;
  onUpdateSubtitleMetric: (field: "fontSize" | "posY", val: number) => void;
  onEditSubtitleText: (idx: number, text: string) => void;
  onSeekTo: (sec: number) => void;
  onUpdateAdjustment: (key: "zoom" | "contrast" | "vignette", val: number) => void;
  onResetAdjustments: () => void;
  onToggleSafeZone: () => void;
}

export function EditorInspector({
  clip,
  currentTime,
  safeZoneEnabled,
  onSelectPreset,
  onToggleSubtitles,
  onSelectCaptionStyle,
  onUpdateSubtitleMetric,
  onEditSubtitleText,
  onSeekTo,
  onUpdateAdjustment,
  onResetAdjustments,
  onToggleSafeZone,
}: EditorInspectorProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "subtitles" | "adjust">("presets");

  const tabIndex = activeTab === "presets" ? 0 : activeTab === "subtitles" ? 1 : 2;

  const renderPresetThumb = (type: string) => {
    if (type === "podcast") {
      return (
        <div className="w-full h-10 rounded-md bg-neutral-900 flex flex-col gap-[1px] overflow-hidden">
          <div className="flex-1 bg-neutral-800" />
          <div className="flex-1 bg-neutral-950" />
        </div>
      );
    }
    if (type === "letterbox") {
      return (
        <div className="w-full h-10 rounded-md bg-black flex items-center justify-center">
          <div className="w-full h-5 bg-neutral-700" />
        </div>
      );
    }
    if (type === "noir") {
      return (
        <div className="w-full h-10 rounded-md bg-black flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-white" />
        </div>
      );
    }
    if (type === "kinetic") {
      return (
        <div className="w-full h-10 rounded-md bg-neutral-900 flex items-end justify-center gap-1 p-2">
          <span className="w-1 h-3 bg-white/60" />
          <span className="w-1 h-5 bg-white" />
          <span className="w-1 h-4 bg-white/80" />
        </div>
      );
    }
    if (type === "raw") {
      return (
        <div className="w-full h-10 rounded-md bg-neutral-800 border border-white/10 arch-grid" />
      );
    }
    return (
      <div className="w-full h-10 rounded-md bg-neutral-900 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-white/75" />
      </div>
    );
  };

  const subtitles = clip.subtitles || [];
  const activeSub = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  return (
    <aside
      aria-label="Clip Inspector"
      className="w-full lg:w-[336px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-line flex flex-col min-h-[380px] lg:min-h-0"
    >
      {/* Animated Sliding-Pill Segmented Tab Bar */}
      <div className="p-3.5 border-b border-line shrink-0">
        <div
          className="relative grid grid-cols-3 p-1 rounded-xl bg-canvas border border-line"
          role="tablist"
        >
          {/* Sliding Active Pill */}
          <div
            className="tab-pill-indicator absolute top-1 bottom-1 left-1 w-[calc(33.333%-2.66px)] rounded-lg bg-ink pointer-events-none"
            style={{ transform: `translateX(${tabIndex * 100}%)` }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "presets"}
            onClick={() => setActiveTab("presets")}
            className={`relative z-10 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
              activeTab === "presets" ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            Presets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "subtitles"}
            onClick={() => setActiveTab("subtitles")}
            className={`relative z-10 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
              activeTab === "subtitles" ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            Subtitles
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "adjust"}
            onClick={() => setActiveTab("adjust")}
            className={`relative z-10 py-1.5 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
              activeTab === "adjust" ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            Adjust
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Panels */}
      <div className="flex-1 overflow-y-auto thin-scroll p-4">
        {/* TAB 1: PRESETS */}
        {activeTab === "presets" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Visual Look & Framing
              </span>
              <span className="font-mono text-[10px] text-muted">6 Presets</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {EDITOR_PRESETS.map((p) => {
                const isActive = clip.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPreset(p.id)}
                    className={`btn-tactile text-left p-2.5 rounded-xl border flex flex-col gap-2 cursor-pointer ${
                      isActive
                        ? "border-ink bg-canvas ring-1 ring-ink"
                        : "border-line bg-white hover:border-ink/45"
                    }`}
                  >
                    {renderPresetThumb(p.thumb)}
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[11.5px] text-ink truncate">
                          {p.name}
                        </span>
                        {isActive && (
                          <span className="w-4 h-4 rounded-full bg-ink text-white text-[9px] flex items-center justify-center shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted leading-snug mt-0.5 line-clamp-2">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SUBTITLES */}
        {activeTab === "subtitles" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-line">
              <div>
                <div className="text-[12.5px] font-semibold text-ink">
                  Subtitles
                </div>
                <div className="font-mono text-[10px] text-muted">
                  Live timecode sync
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={clip.subtitlesEnabled !== false}
                onClick={onToggleSubtitles}
                className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-all cursor-pointer ${
                  clip.subtitlesEnabled !== false
                    ? "bg-ink justify-end"
                    : "bg-neutral-300 justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Caption Style
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {EDITOR_CAPTION_STYLES.map((st) => {
                  const isActive =
                    (clip.editorCaptionStyle || "editorial") === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectCaptionStyle(st.id)}
                      className={`btn-tactile py-2 px-2.5 rounded-lg border text-[11.5px] font-medium cursor-pointer ${
                        isActive
                          ? "bg-ink text-white border-ink"
                          : "bg-white text-ink border-line hover:border-ink/45"
                      }`}
                    >
                      {st.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-canvas border border-line space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-muted">
                    Font Size{" "}
                    <span className="opacity-60">(dbl-click reset)</span>
                  </span>
                  <span className="text-ink font-medium tabular-nums">
                    {clip.subFontSize || 14}px
                  </span>
                </div>
                <input
                  type="range"
                  min="11"
                  max="20"
                  value={clip.subFontSize || 14}
                  onChange={(e) =>
                    onUpdateSubtitleMetric("fontSize", Number(e.target.value))
                  }
                  onDoubleClick={() => onUpdateSubtitleMetric("fontSize", 14)}
                  className="mono-slider"
                  aria-label="Subtitle font size"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-muted">
                    Y-Position{" "}
                    <span className="opacity-60">(dbl-click reset)</span>
                  </span>
                  <span className="text-ink font-medium tabular-nums">
                    {clip.subPosY || 18}%
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={clip.subPosY || 18}
                  onChange={(e) =>
                    onUpdateSubtitleMetric("posY", Number(e.target.value))
                  }
                  onDoubleClick={() => onUpdateSubtitleMetric("posY", 18)}
                  className="mono-slider"
                  aria-label="Subtitle vertical position"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  Caption Script
                </span>
                <span className="font-mono text-[10px] text-muted">
                  Click to seek
                </span>
              </div>
              <div className="space-y-2">
                {subtitles.map((seg, i) => {
                  const isCurrent = activeSub?.id === seg.id;
                  return (
                    <div
                      key={seg.id}
                      className={`p-2.5 rounded-xl border transition-colors space-y-1.5 ${
                        isCurrent
                          ? "border-ink bg-canvas ring-1 ring-ink/15"
                          : "border-line bg-canvas/60 hover:border-ink/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSeekTo(seg.start)}
                        className={`font-mono text-[10px] tabular-nums cursor-pointer ${
                          isCurrent
                            ? "text-ink font-semibold"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {formatTC(seg.start)} – {formatTC(seg.end)}
                      </button>
                      <input
                        type="text"
                        value={seg.text}
                        onFocus={() => onSeekTo(seg.start)}
                        onChange={(e) => onEditSubtitleText(i, e.target.value)}
                        aria-label={`Subtitle segment ${i + 1}`}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-line text-[12px] text-ink focus:border-ink focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADJUST */}
        {activeTab === "adjust" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Frame & Optics
              </span>
              <button
                type="button"
                onClick={onResetAdjustments}
                className="btn-tactile font-mono text-[10.5px] px-2.5 py-1 rounded-full border border-line bg-canvas hover:border-ink text-ink cursor-pointer"
              >
                Reset Adjustments
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-muted">Zoom</span>
                  <span className="text-ink font-medium tabular-nums">
                    {clip.adjust?.zoom ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="140"
                  value={clip.adjust?.zoom ?? 100}
                  onChange={(e) =>
                    onUpdateAdjustment("zoom", Number(e.target.value))
                  }
                  onDoubleClick={() => onUpdateAdjustment("zoom", 100)}
                  className="mono-slider"
                  aria-label="Frame zoom"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-muted">Contrast</span>
                  <span className="text-ink font-medium tabular-nums">
                    {clip.adjust?.contrast ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="140"
                  value={clip.adjust?.contrast ?? 100}
                  onChange={(e) =>
                    onUpdateAdjustment("contrast", Number(e.target.value))
                  }
                  onDoubleClick={() => onUpdateAdjustment("contrast", 100)}
                  className="mono-slider"
                  aria-label="Frame contrast"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-muted">Vignette</span>
                  <span className="text-ink font-medium tabular-nums">
                    {clip.adjust?.vignette ?? 25}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={clip.adjust?.vignette ?? 25}
                  onChange={(e) =>
                    onUpdateAdjustment("vignette", Number(e.target.value))
                  }
                  onDoubleClick={() => onUpdateAdjustment("vignette", 25)}
                  className="mono-slider"
                  aria-label="Frame vignette"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-canvas border border-line">
              <div>
                <div className="text-[12.5px] font-semibold text-ink">
                  9:16 Safe-Zone Guide
                </div>
                <div className="font-mono text-[10px] text-muted">
                  Reels / Shorts / TikTok margins
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={safeZoneEnabled}
                onClick={onToggleSafeZone}
                className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-all cursor-pointer ${
                  safeZoneEnabled
                    ? "bg-ink justify-end"
                    : "bg-neutral-300 justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
