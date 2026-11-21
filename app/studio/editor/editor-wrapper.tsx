"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { ClipEditorWorkspace } from "@/components/editor/clip-editor-workspace";

export function ClipEditorWorkspaceWrapper() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const clipId = searchParams.get("clipId");

  return (
    <ClipEditorWorkspace
      initialProjectId={projectId}
      initialClipId={clipId}
    />
  );
}
