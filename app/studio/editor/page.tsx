import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ClipEditorWorkspaceWrapper } from "./editor-wrapper";

export const metadata: Metadata = {
  title: "Clip Creation & Timeline Editor — Reelix",
  description:
    "Multi-track timeline editor, precision trims, subtitle styling, and EDL manifest exports for Reelix short-form creator clips.",
};

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-ink rounded-full animate-spin" />
        </div>
      }
    >
      <ClipEditorWorkspaceWrapper />
    </Suspense>
  );
}
