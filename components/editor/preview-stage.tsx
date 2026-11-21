"use client";

import React, { useRef, useEffect, useState } from "react";
import { Clip } from "@/types/studio";
import { EDITOR_PRESETS } from "@/lib/sample-data";
import { formatTC, extractYouTubeId } from "@/lib/editor-store";

interface PreviewStageProps {
  clip: Clip;
  currentTime: number;
  isPlaying: boolean;
  isSyncing: boolean;
  safeZoneEnabled: boolean;
  sourceUrl?: string;
}

export function PreviewStage({
  clip,
  currentTime,
  isPlaying,
  isSyncing,
  safeZoneEnabled,
  sourceUrl,
}: PreviewStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<"video" | "canvas">("video");
  const [framingMode, setFramingMode] = useState<"fill" | "fit">("fill");

  const videoId = extractYouTubeId(sourceUrl || clip.sourceUrl);
  const presetDef = EDITOR_PRESETS.find((p) => p.id === clip.preset);
  const presetName = presetDef?.name || "Editorial Mono";
  const tc = formatTC(currentTime);

  // High-FPS procedural canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const t = isPlaying ? currentTime : 1.2;

    const zoom = clip.adjust?.zoom ?? 100;
    const contrast = clip.adjust?.contrast ?? 100;
    const vignette = clip.adjust?.vignette ?? 25;

    const zoomScale = (zoom / 100) * (clip.preset === "kinetic" ? 1.07 : 1);
    const contrastBoost =
      clip.preset === "noir" ? 1.32 : clip.preset === "kinetic" ? 1.12 : 1;
    canvas.style.filter = `contrast(${(contrast * contrastBoost).toFixed(0)}%)`;

    ctx.save();
    ctx.fillStyle = clip.preset === "noir" ? "#040405" : "#0D0D10";
    ctx.fillRect(0, 0, w, h);

    ctx.translate(w / 2, h / 2);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-w / 2, -h / 2);

    // Subtle architectural micro-grid inside canvas
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    const step = 28 * dpr;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h * 0.44;

    const scene = clip.sceneType || "soundwave";

    if (scene === "soundwave") {
      // 1. Kinetic Soundwave Studio
      const bars = 24;
      const barW = 4 * dpr;
      const gap = 4 * dpr;
      const startX = cx - (bars * (barW + gap)) / 2;
      for (let i = 0; i < bars; i++) {
        const wave = Math.abs(
          Math.sin(t * 2.6 + i * 0.42) * Math.cos(t * 1.1 - i * 0.18)
        );
        const amp = (14 + wave * 82) * dpr;
        ctx.fillStyle = `rgba(255,255,255,${(0.22 + wave * 0.72).toFixed(2)})`;
        ctx.fillRect(startX + i * (barW + gap), cy - amp / 2, barW, amp);
      }
    } else if (scene === "spotlight") {
      // 2. Architectural Grid & Spotlight
      const sx = cx + Math.sin(t * 0.9) * 38 * dpr;
      const sy = cy + Math.cos(t * 0.7) * 28 * dpr;
      const spot = ctx.createRadialGradient(
        sx,
        sy,
        4 * dpr,
        sx,
        sy,
        120 * dpr
      );
      spot.addColorStop(0, "rgba(255,255,255,0.28)");
      spot.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${0.12 + i * 0.06})`;
        ctx.lineWidth = (i === 2 ? 1.8 : 1) * dpr;
        ctx.arc(
          cx,
          cy,
          (22 + i * 24 + Math.sin(t * 1.4 + i) * 5) * dpr,
          t * 0.4,
          t * 0.4 + Math.PI * 1.35
        );
        ctx.stroke();
      }
    } else if (scene === "dualwave") {
      // 3. Split-Screen Podcast Dual-Wave
      const drawSine = (
        yBase: number,
        freq: number,
        speed: number,
        alpha: number
      ) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1.8 * dpr;
        for (let x = 16 * dpr; x <= w - 16 * dpr; x += 4 * dpr) {
          const y =
            yBase +
            Math.sin(x * freq + t * speed) *
              16 *
              dpr *
              Math.sin((x / w) * Math.PI);
          if (x === 16 * dpr) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawSine(h * 0.3, 0.035, 3.2, 0.82);
      drawSine(h * 0.3, 0.022, -2.1, 0.3);
      drawSine(h * 0.64, 0.028, -2.8, 0.75);
      drawSine(h * 0.64, 0.04, 1.9, 0.25);
    } else {
      // 4. Minimalist Film Grain & Typography
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font = `800 ${46 * dpr}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("REELIX", cx, cy - 10 * dpr);
      ctx.fillText("04 / 26", cx, cy + 40 * dpr);

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1 * dpr;
      const lineY = (t * 48 * dpr) % h;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(w, lineY);
      ctx.stroke();
    }

    ctx.restore();

    // Vignette
    const vigRatio = vignette / 100;
    if (vigRatio > 0) {
      const grad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        w * 0.2,
        w / 2,
        h / 2,
        h * 0.68
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${(vigRatio * 0.92).toFixed(2)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }, [clip, currentTime, isPlaying]);

  // Subtitle resolution
  const subtitles = clip.subtitles || [];
  const activeSub = subtitles.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  const renderSubtitleContent = () => {
    if (!clip.subtitlesEnabled || !activeSub) return null;

    const fs = clip.subFontSize || 14;
    const words = activeSub.text.split(" ");
    const prog = Math.max(
      0,
      Math.min(
        1,
        (currentTime - activeSub.start) /
          Math.max(0.2, activeSub.end - activeSub.start)
      )
    );
    const activeWordIdx = Math.min(
      words.length - 1,
      Math.floor(prog * words.length)
    );

    const style = clip.editorCaptionStyle || "editorial";

    if (style === "editorial") {
      return (
        <p
          style={{ fontSize: `${fs}px` }}
          className="font-mono leading-snug text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.88)] text-center"
        >
          {activeSub.text}
        </p>
      );
    }
    if (style === "kinetic") {
      return (
        <p
          style={{ fontSize: `${fs + 2}px` }}
          className="font-extrabold uppercase tracking-tight leading-tight text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.92)] text-center"
        >
          {activeSub.text}
        </p>
      );
    }
    if (style === "bar") {
      return (
        <span
          style={{ fontSize: `${fs - 1}px` }}
          className="inline-block px-2.5 py-1 rounded-md bg-white text-ink font-semibold leading-snug shadow-lg text-center"
        >
          {activeSub.text}
        </span>
      );
    }
    // Karaoke
    return (
      <p
        style={{ fontSize: `${fs}px` }}
        className="font-semibold leading-snug bg-black/65 px-2.5 py-1.5 rounded-lg inline-block text-center"
      >
        {words.map((w, i) => (
          <span
            key={i}
            className={`mx-0.5 ${
              i === activeWordIdx
                ? "bg-white text-ink px-1 rounded font-bold"
                : "text-white/75"
            }`}
          >
            {w}
          </span>
        ))}
      </p>
    );
  };

  return (
    <main
      aria-label="Live 9:16 Vertical Preview"
      className="flex-1 min-w-0 relative flex flex-col items-center justify-center p-4 min-h-[450px] lg:min-h-0 overflow-hidden"
    >
      {/* Floating Micro-HUD */}
      <div className="mb-3 inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/92 backdrop-blur-md border border-line shadow-xs font-mono text-[10.5px]">
        {videoId && (
          <>
            <div className="inline-flex rounded-full bg-canvas border border-line p-0.5">
              <button
                type="button"
                onClick={() => {
                  setViewMode("video");
                  setFramingMode("fill");
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                  viewMode === "video" && framingMode === "fill"
                    ? "bg-ink text-white font-semibold"
                    : "text-muted hover:text-ink"
                }`}
              >
                9:16 Fill
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("video");
                  setFramingMode("fit");
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                  viewMode === "video" && framingMode === "fit"
                    ? "bg-ink text-white font-semibold"
                    : "text-muted hover:text-ink"
                }`}
              >
                16:9 Fit
              </button>
              <button
                type="button"
                onClick={() => setViewMode("canvas")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                  viewMode === "canvas"
                    ? "bg-ink text-white font-semibold"
                    : "text-muted hover:text-ink"
                }`}
              >
                Waveform
              </button>
            </div>
            <span className="text-line">|</span>
          </>
        )}
        <span className="font-semibold text-ink">{presetName}</span>
        <span className="text-line">|</span>
        <span className="text-muted tabular-nums">{tc}</span>
        <span className="text-line">|</span>
        <span className="text-muted">9:16</span>
      </div>

      {/* Brushed-Titanium Smartphone Chassis */}
      <div className="phone-frame relative w-[210px] xs:w-[224px] sm:w-[238px] aspect-[9/16] max-h-[62vh] sm:max-h-[460px] rounded-[38px] p-[7px] shrink-0">
        {/* Subtle Top Earpiece Grille */}
        <div className="phone-earpiece" aria-hidden="true" />

        {/* Crystal-Clear OLED Screen */}
        <div className="relative w-full h-full rounded-[31px] overflow-hidden bg-[#0A0A0C] select-none flex items-center justify-center">
          {/* Real YouTube Video Player or High-FPS Procedural Canvas */}
          {viewMode === "video" && videoId ? (
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
                      key={`${videoId}-${Math.floor(clip.startSec + (clip.trimIn ?? 0))}-${Math.ceil(
                        clip.startSec + (clip.trimOut ?? clip.duration ?? 30)
                      )}-fit`}
                      title={clip.title}
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(
                        clip.startSec + (clip.trimIn ?? 0)
                      )}&end=${Math.ceil(
                        clip.startSec + (clip.trimOut ?? clip.duration ?? 30)
                      )}&autoplay=${isPlaying ? 1 : 0}&playsinline=1&controls=1&rel=0&modestbranding=1`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </>
              ) : (
                <iframe
                  key={`${videoId}-${Math.floor(clip.startSec + (clip.trimIn ?? 0))}-${Math.ceil(
                    clip.startSec + (clip.trimOut ?? clip.duration ?? 30)
                  )}-fill`}
                  title={clip.title}
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(
                    clip.startSec + (clip.trimIn ?? 0)
                  )}&end=${Math.ceil(
                    clip.startSec + (clip.trimOut ?? clip.duration ?? 30)
                  )}&autoplay=${isPlaying ? 1 : 0}&playsinline=1&controls=1&rel=0&modestbranding=1`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: "100%",
                    width: "calc(100% * 256 / 81)",
                    maxWidth: "none",
                    border: 0,
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full block"
            />
          )}

          {/* Preset Visual Overlays */}
          {clip.preset === "letterbox" && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-0 inset-x-0 h-[15%] bg-black" />
              <div className="absolute bottom-0 inset-x-0 h-[15%] bg-black" />
            </div>
          )}
          {clip.preset === "podcast" && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-white/35" />
              <span className="absolute top-[45.5%] right-3 font-mono text-[8px] uppercase text-white/55">
                HOST
              </span>
              <span className="absolute top-[52%] right-3 font-mono text-[8px] uppercase text-white/55">
                GUEST
              </span>
            </div>
          )}
          {clip.preset === "raw" && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 border border-white/15 m-2 rounded-2xl" />
            </div>
          )}

          {/* 9:16 Safe-Zone Guide Overlay */}
          {safeZoneEnabled && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute inset-x-3 top-11 bottom-16 border border-dashed border-white/45 rounded-lg" />
              <div className="absolute right-2.5 bottom-20 w-7 h-28 border border-dashed border-white/35 rounded" />
              <span className="absolute top-12 left-4 font-mono text-[8px] uppercase tracking-wider text-white/70">
                9:16 Safe Zone
              </span>
            </div>
          )}

          {/* Interactive Dynamic Island */}
          <div className="absolute top-2.5 inset-x-0 z-25 flex justify-center pointer-events-none">
            <div
              className={`dynamic-island flex items-center justify-between gap-2 ${
                isPlaying || isSyncing ? "is-expanded" : ""
              }`}
            >
              <div
                className={`flex items-end gap-[2px] h-[9px] ${
                  isPlaying ? "" : "eq-paused"
                }`}
              >
                <span className="w-[1.5px] bg-white/90 rounded-full eq-mini-1" />
                <span className="w-[1.5px] bg-white/70 rounded-full eq-mini-2" />
                <span className="w-[1.5px] bg-white/90 rounded-full eq-mini-3" />
              </div>
              <span className="font-mono text-[8px] tracking-wide text-white/85 uppercase">
                {isSyncing
                  ? "SYNCING..."
                  : isPlaying
                  ? `PLAYING ${clip.indexLabel || "01"}`
                  : `CLIP ${clip.indexLabel || "01"}`}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1a2142] border border-white/15" />
            </div>
          </div>

          {/* Live Synced Interactive Subtitles */}
          <div
            className="absolute inset-x-3 z-20 flex justify-center pointer-events-none transition-all duration-150"
            style={{ bottom: `${clip.subPosY || 18}%` }}
          >
            <div className="max-w-full text-center">
              {renderSubtitleContent()}
            </div>
          </div>

          {/* 320ms Syncing Overlay */}
          <div
            className={`absolute inset-0 z-30 bg-[#09090B]/88 backdrop-blur-sm flex flex-col items-center justify-center p-5 transition-opacity duration-200 pointer-events-none ${
              isSyncing ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin mb-2.5" />
            <span className="font-mono text-[10px] tracking-wider uppercase text-white/90">
              Syncing clip...
            </span>
            <div className="w-24 h-1 rounded-full shimmer-bar mt-3" />
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-20 h-[3px] rounded-full bg-white/60 pointer-events-none" />
        </div>
      </div>
    </main>
  );
}
