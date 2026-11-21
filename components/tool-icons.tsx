"use client";

import React from "react";

// SVG icon components for creator tools
export function ToolIcon({ tool }: { tool: string }) {
  switch (tool) {
    case "clipper":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case "captions":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M7 11h4M7 15h8M14 11h3" />
        </svg>
      );
    case "hooks":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "beatsync":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <path d="M3 12h2l2-5 3 10 3-8 2 5 2-2h4" />
        </svg>
      );
    case "reframe":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2" />
          <circle cx="12" cy="11" r="2.5" />
          <path d="M8.5 17c.8-1.8 2.1-2.5 3.5-2.5s2.7.7 3.5 2.5" />
        </svg>
      );
    case "templates":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    default:
      return null;
  }
}
