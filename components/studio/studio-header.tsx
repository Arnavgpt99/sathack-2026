"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface StudioHeaderProps {
  statusText: string;
  isStatusPulsing?: boolean;
  onNewProject: () => void;
  showToast: (msg: string) => void;
}

export function StudioHeader({
  statusText,
  isStatusPulsing = false,
  onNewProject,
  showToast,
}: StudioHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GC";

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAFA]/88 backdrop-blur-xl border-b border-line">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Minimal Geometric Logo Mark + Reelix Wordmark + Studio Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Reelix Home">
            <div className="w-8 h-8 rounded-[10px] bg-ink text-white flex items-center justify-center shadow-[0_6px_14px_-4px_rgba(10,10,10,0.32)] group-hover:scale-[1.03] transition-transform">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <polygon points="10 8.5 16 12 10 15.5 10 8.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-[19px] tracking-[-0.045em] text-ink">
              Reelix
            </span>
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-line text-muted">
            Studio
          </span>
        </div>

        {/* Center: Live Status Pill with Pulsing Dot */}
        <div
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-line text-[12px] font-mono text-muted shadow-[0_2px_10px_-6px_rgba(10,10,14,0.12)]"
          aria-live="polite"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full bg-ink transition-all ${
              isStatusPulsing ? "animate-pulse bg-emerald-500" : ""
            }`}
          />
          <span>{statusText}</span>
        </div>

        {/* Right: Back to Home, New Project, User Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink transition-colors px-2 py-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
            </svg>
            <span>Back to Home</span>
          </Link>

          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-line hover:border-ink/40 text-[12.5px] font-medium text-ink transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            <span>New Project</span>
          </button>

          {user ? (
            <div className="relative group">
              <button
                type="button"
                onClick={() => showToast(`Signed in as ${user.name || user.email}`)}
                aria-label={`User profile ${user.name || "Creator"}`}
                className="w-8 h-8 rounded-full bg-ink text-white font-mono text-[11px] font-semibold flex items-center justify-center border border-ink hover:bg-neutral-800 transition-colors overflow-hidden cursor-pointer"
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </button>
              {/* Dropdown / Sign out on hover/focus */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col p-2 rounded-2xl bg-white border border-line shadow-lg min-w-[160px] z-50 text-xs font-medium">
                <div className="px-2.5 py-1 text-muted font-mono text-[10px] truncate max-w-[150px]">
                  {user.email}
                </div>
                <div className="h-[1px] bg-line my-1" />
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-2.5 py-1.5 text-left text-muted hover:text-ink hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login?callbackUrl=/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ink text-white text-[12.5px] font-medium hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
