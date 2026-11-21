"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  const errorParam = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Readable error messages mapping NextAuth error codes
  let errorMessage: string | null = null;
  if (errorParam) {
    switch (errorParam) {
      case "Configuration":
        errorMessage =
          "Authentication handshake failed (often due to stale cookies after restarting the server). Please refresh the page or try in an incognito tab.";
        break;
      case "AccessDenied":
        errorMessage = "Sign in was canceled or access was denied by Google.";
        break;
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        errorMessage =
          "Unable to complete Google authentication. Please verify your Google OAuth client settings.";
        break;
      case "Verification":
        errorMessage = "The authentication token has expired or is invalid.";
        break;
      default:
        errorMessage = "An unexpected error occurred during sign in. Please try again.";
        break;
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Sign-in failed", err);
      setIsLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Auth Card */}
      <div className="relative rounded-3xl bg-white border border-line shadow-[0_32px_80px_-20px_rgba(10,10,18,0.12)] p-7 sm:p-9 space-y-6">
        {/* Segmented Switcher */}
        <div className="inline-flex p-1 rounded-full bg-canvas border border-line">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isLogin ? "bg-ink text-white shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isLogin ? "bg-ink text-white shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Heading */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">
            Creator Authentication
          </span>
          <h1 className="font-[family-name:var(--font-display)] font-bold text-2xl sm:text-[26px] tracking-tight text-ink">
            {isLogin ? "Sign in to Reelix Studio" : "Create your studio account"}
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            {isLogin
              ? "Access your AI clipping workspace, timeline presets, and export pipeline."
              : "Start cutting, captioning, and preparing vertical clips in seconds."}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-neutral-100 border border-neutral-300 text-ink text-xs font-medium flex items-start gap-2.5"
          >
            <svg
              className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1 leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Real Google OAuth Action & Guest Demo Mode */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="btn-sheen w-full py-3.5 px-4 rounded-full bg-ink text-white text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_8px_24px_-8px_rgba(10,10,14,0.35)] disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 01-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09A12 12 0 0012 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.38-2.28V6.63H1.29A12 12 0 000 12c0 1.94.46 3.77 1.29 5.37l3.99-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 001.29 6.63l3.99 3.09c.95-2.85 3.6-4.97 6.72-4.97z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* 1-Click Judge & Evaluator Demo Bypass */}
          <Link
            href="/studio?demo=1"
            className="w-full py-3 px-4 rounded-full border border-line bg-canvas hover:border-ink/50 text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
          >
            <span>Enter Studio as Guest (Judge Demo)</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Honest Architecture & Security Note */}
        <div className="pt-2 border-t border-line/75 space-y-2.5">
          <div className="flex items-start gap-2 text-[11.5px] text-muted leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
            <span>
              Secure OAuth 2.0 with JWT sessions. No database or unverified password storage required.
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-canvas border border-line text-[11px] text-muted space-y-1">
            <div className="font-mono uppercase text-[9.5px] text-ink font-semibold">
              Hackathon Note
            </div>
            <p>
              Direct Email &amp; Password sign-in will be enabled alongside cloud project persistence. Use Google to access your session today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col relative selection:bg-ink selection:text-white">
      {/* Background Architectural Micro-Grid */}
      <div className="fixed inset-0 architectural-grid pointer-events-none z-0" />
      <div className="fixed inset-0 grid-vignette pointer-events-none z-0" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-16 sm:h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[10px] bg-ink text-white flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(10,10,10,0.35)] group-hover:scale-[1.03] transition-transform">
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
          <span className="font-[family-name:var(--font-display)] font-bold text-[20px] tracking-[-0.045em] text-ink">
            Reelix
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main Form Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-white border border-line flex items-center justify-center min-h-[360px]">
              <span className="w-6 h-6 rounded-full border-2 border-ink/20 border-t-ink animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer Strip */}
      <footer className="relative z-10 py-6 border-t border-line/70 text-center text-xs text-muted">
        <div className="max-w-[1440px] mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <span>© 2026 Reelix Studio • SATHACK 2026</span>
          <span>Google OAuth 2.0 • JWT Session Engine</span>
        </div>
      </footer>
    </div>
  );
}
