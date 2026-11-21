"use client";

import React, { useState } from "react";
import Link from "next/link";

interface EditorHeaderProps {
  statusText: string;
  statusMode: "ready" | "syncing" | "playing";
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
}

export function EditorHeader({
  statusText,
  statusMode,
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  onOpenExport,
}: EditorHeaderProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-14 w-full bg-white/94 backdrop-blur-xl border-b border-line shrink-0">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Minimal Geometric Reelix SVG Mark + Wordmark + Editor Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer"
            aria-label="Reelix Home"
          >
            <div className="w-7 h-7 rounded-[8px] bg-ink text-white flex items-center justify-center shadow-xs group-hover:scale-[1.04] transition-transform">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <polygon
                  points="10 8.5 16 12 10 15.5 10 8.5"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </div>
            <span className="font-bold text-[17px] tracking-[-0.04em] text-ink">
              Reelix
            </span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-canvas border border-line text-muted">
            Editor
          </span>
        </div>

        {/* Center: Live Status Pill with Pulsing Dot */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-canvas border border-line font-mono text-[11px]"
          aria-live="polite"
        >
          {statusMode === "syncing" ? (
            <span className="w-3 h-3 rounded-full border-[1.5px] border-neutral-300 border-t-ink animate-spin" />
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full bg-ink ${
                statusMode === "playing" ? "animate-pulse" : ""
              }`}
            />
          )}
          <span className="text-ink font-medium tabular-nums">{statusText}</span>
        </div>

        {/* Right: Studio Back Link, Undo/Redo with Live Count, ? Shortcuts Popover, Export Clip CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/studio"
            className="btn-tactile hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-white hover:border-ink/40 text-[12px] font-medium text-ink cursor-pointer"
          >
            <span>← Studio</span>
          </Link>

          {/* Undo / Redo with Live History Count */}
          <div className="flex items-center rounded-full border border-line bg-canvas p-0.5 gap-0.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
              aria-label="Undo"
              className="btn-tactile h-7 px-2 rounded-full flex items-center gap-1 text-ink hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
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
                  d="M9 14L4 9l5-5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 9h10.5a5.5 5.5 0 010 11H11"
                />
              </svg>
              <span className="font-mono text-[9.5px] text-muted tabular-nums">
                {undoCount}
              </span>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (⇧⌘Z)"
              aria-label="Redo"
              className="btn-tactile h-7 px-2 rounded-full flex items-center gap-1 text-ink hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
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
                  d="M15 14l5-5-5-5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 9H9.5a5.5 5.5 0 000 11H13"
                />
              </svg>
              <span className="font-mono text-[9.5px] text-muted tabular-nums">
                {redoCount}
              </span>
            </button>
          </div>

          {/* ? Shortcuts Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShortcuts((v) => !v)}
              aria-expanded={showShortcuts}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="btn-tactile w-8 h-8 rounded-full border border-line bg-white hover:border-ink/40 font-mono text-[12px] font-semibold text-ink flex items-center justify-center cursor-pointer"
            >
              ?
            </button>

            {showShortcuts && (
              <div
                className="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl bg-white border border-line shadow-[0_24px_60px_-16px_rgba(10,10,16,0.22)] p-4 z-50 space-y-2.5"
                role="tooltip"
              >
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    Keyboard Shortcuts
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(false)}
                    className="text-muted hover:text-ink text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5 text-[11.5px]">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Play / Pause</span>
                    <span className="kbd-badge">Space</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Nudge ±0.5s</span>
                    <span className="kbd-badge">← / →</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Split at Playhead</span>
                    <span className="kbd-badge">S</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Set Trim In / Out</span>
                    <span className="kbd-badge">I / O</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Undo / Redo</span>
                    <span className="kbd-badge">⌘Z / ⇧⌘Z</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Reset Slider</span>
                    <span className="kbd-badge">Double-Click</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Dark Pill Export CTA */}
          <button
            type="button"
            onClick={onOpenExport}
            className="btn-tactile btn-primary-dark inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] font-medium cursor-pointer"
          >
            <span>Export Clip</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
