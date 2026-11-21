"use client";

import React from "react";
import { ProcessingStage } from "@/types/studio";

interface AnalysisPipelineProps {
  stage: ProcessingStage;
  onCancel: () => void;
}

export function AnalysisPipeline({ stage, onCancel }: AnalysisPipelineProps) {
  const getPillClass = (stepNumber: number) => {
    if (stage.step > stepNumber || (stage.step === stepNumber && stage.completed)) {
      return "px-3 py-2 rounded-xl bg-white border border-ink/40 text-ink font-medium flex items-center justify-between";
    }
    if (stage.step === stepNumber) {
      return "px-3 py-2 rounded-xl bg-ink border border-ink text-white font-medium flex items-center justify-between";
    }
    return "px-3 py-2 rounded-xl bg-canvas border border-line text-muted flex items-center justify-between";
  };

  const getCheckText = (stepNumber: number) => {
    if (stage.step > stepNumber || (stage.step === stepNumber && stage.completed)) {
      return "✓";
    }
    if (stage.step === stepNumber) {
      return "…";
    }
    return "";
  };

  return (
    <div className="pt-4 border-t border-line space-y-3 animate-in fade-in duration-200" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-[12px] font-mono">
        <span className="text-ink font-medium">{stage.label}</span>
        <div className="flex items-center gap-3">
          <span className="text-muted">{stage.percent}%</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] underline text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full bg-ink rounded-full transition-all duration-300"
          style={{ width: `${stage.percent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10.5px]">
        <div className={getPillClass(1)}>
          <span>1. Transcript &amp; peaks</span>
          <span className="font-bold">{getCheckText(1)}</span>
        </div>
        <div className={getPillClass(2)}>
          <span>2. Narrative hooks</span>
          <span className="font-bold">{getCheckText(2)}</span>
        </div>
        <div className={getPillClass(3)}>
          <span>3. Pacing &amp; retention</span>
          <span className="font-bold">{getCheckText(3)}</span>
        </div>
      </div>
    </div>
  );
}
