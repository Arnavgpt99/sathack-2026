"use client";

import React from "react";
import { SourceVideo } from "@/types/studio";

interface VideoInputInstrumentProps {
  url: string;
  onUrlChange: (url: string) => void;
  onPaste: () => void;
  onCycleSample: () => void;
  sampleCounterText: string;
  activeSource: SourceVideo | null;
  showPreviewStrip: boolean;
}

export function VideoInputInstrument({
  url,
  onUrlChange,
  onPaste,
  onCycleSample,
  sampleCounterText,
  activeSource,
  showPreviewStrip,
}: VideoInputInstrumentProps) {
  const detectPlatform = (val: string): string | null => {
    const u = val.toLowerCase();
    if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube detected";
    if (u.includes("vimeo.com")) return "Vimeo detected";
    if (u.includes("twitch.tv")) return "Twitch detected";
    if (
      u.endsWith(".mp4") ||
      u.endsWith(".mov") ||
      u.includes("podcast") ||
      u.includes("spotify")
    )
      return "Podcast / MP4 detected";
    if (u.startsWith("http://") || u.startsWith("https://")) return "Video URL ready";
    return null;
  };

  const detected = detectPlatform(url);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1 gap-2">
        <label
          htmlFor="videoUrlInput"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          01 · Source Video URL
        </label>
        <span
          id="platformBadge"
          className={`font-mono text-[10.5px] px-2.5 py-0.5 rounded-full transition-all ${
            detected
              ? "bg-ink text-white"
              : "bg-canvas border border-line text-muted"
          }`}
        >
          {detected || "YouTube · Vimeo · Twitch · MP4"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl bg-canvas border border-line focus-within:border-ink transition-colors">
        <div className="flex items-center gap-2.5 flex-1 px-2.5 py-1.5 min-w-0">
          <svg
            className="w-4 h-4 text-muted shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
            />
          </svg>
          <input
            id="videoUrlInput"
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or paste any video link"
            className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted/55 focus:outline-none truncate"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-1.5 px-1 sm:px-0 shrink-0">
          <button
            type="button"
            onClick={onPaste}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-line hover:border-ink/40 text-[12.5px] font-medium text-ink transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>Paste</span>
          </button>

          <button
            type="button"
            onClick={onCycleSample}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-[12.5px] font-medium text-ink transition-colors cursor-pointer"
          >
            <span>Try Sample</span>
            <span className="font-mono text-[10px] text-muted">{sampleCounterText}</span>
          </button>
        </div>
      </div>

      {/* Compact Source Preview Strip (revealed when sample/URL is active) */}
      {showPreviewStrip && activeSource && (
        <div className="rounded-2xl bg-canvas border border-line px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink truncate">
                {activeSource.title}
              </div>
              <div className="font-mono text-[11px] text-muted truncate">
                {activeSource.channel} · {activeSource.platform}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-white border border-line text-ink">
              {activeSource.duration}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-line">
              {activeSource.resolution}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
