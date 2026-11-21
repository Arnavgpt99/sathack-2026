"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { CREATOR_TOOLS, REELS, REEL_DURATION, LOADING_DURATION } from "@/lib/data";
import type { Reel } from "@/lib/data";
import { ToolIcon } from "@/components/tool-icons";

// ============================================================
//  UTILITY
// ============================================================

function formatLikes(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
}

// ============================================================
//  TOAST
// ============================================================

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMsg(text);
    timer.current = setTimeout(() => setMsg(null), 2500);
  }, []);
  return { msg, show };
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 pointer-events-none transition-all duration-300 ${
        msg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <div className="px-4 py-2.5 rounded-full bg-ink text-white text-[13px] font-medium shadow-xl flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>{msg || "Done"}</span>
      </div>
    </div>
  );
}

// ============================================================
//  MODAL SYSTEM
// ============================================================

type ModalType = "pricing" | "demo" | "auth" | "tool" | null;

function ModalRoot({
  isOpen,
  onClose,
  maxWidth,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  maxWidth: string;
  children: React.ReactNode;
}) {
  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="modal-backdrop absolute inset-0 bg-ink/40 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`modal-panel relative z-10 w-full ${maxWidth} rounded-3xl bg-white border border-line shadow-[0_36px_90px_-20px_rgba(10,10,18,0.34)] p-6 sm:p-8 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-ink transition-colors z-20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

// ============================================================
//  PRICING MODAL
// ============================================================

function PricingModal({ onClose, toast }: { onClose: () => void; toast: (msg: string) => void }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const isAnnual = billingCycle === "annual";
  const proPrice = isAnnual ? 15 : 19;
  const studioPrice = isAnnual ? 39 : 49;

  const handleSelectPlan = (name: string) => {
    onClose();
    toast(`${name} plan selected — this is a preview; billing is not active yet.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pr-8">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Planned Pricing</span>
          <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl sm:text-[28px] tracking-tight text-ink mt-1">
            Scale your short-form output
          </h2>
        </div>
        <div className="inline-flex items-center p-1 rounded-full bg-canvas border border-line self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isAnnual ? "bg-ink text-white shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isAnnual ? "bg-ink text-white shadow-xs" : "text-muted hover:text-ink"
            }`}
          >
            <span>Annual</span>
            <span
              className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded-full ${
                isAnnual ? "bg-emerald-400/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Starter */}
        <div className="p-5 rounded-2xl border border-line bg-canvas/70 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">Starter</div>
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl text-ink">$0</span>
              <span className="text-xs text-muted">/mo</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">For solo creators testing AI-assisted short workflows.</p>
            <ul className="space-y-2 pt-2 text-xs text-ink/85">
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> 10 AI shorts per month</li>
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Auto-Captions (1080p)</li>
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Starter templates</li>
            </ul>
          </div>
          <button type="button" onClick={() => handleSelectPlan("Starter")} className="w-full py-2.5 rounded-full border border-line bg-white text-ink text-xs font-semibold hover:border-ink transition-colors">
            Get started
          </button>
        </div>

        {/* Creator Pro */}
        <div className="p-5 rounded-2xl bg-ink text-white flex flex-col justify-between space-y-5 shadow-[0_24px_50px_-16px_rgba(10,10,14,0.45)] relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/75">Creator Pro</span>
              <span className="font-mono text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-white text-ink">MOST POPULAR</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl text-white">${proPrice}</span>
              <span className="text-xs text-white/60">/mo</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">Full AI suite for daily creators growing across every feed.</p>
            <ul className="space-y-2 pt-2 text-xs text-white/90">
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Unlimited AI Clipper &amp; Hooks</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Beat Sync + Smart Reframe</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> HD export, no watermark</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Pro Templates &amp; Brand Kits</li>
            </ul>
          </div>
          <button type="button" onClick={() => handleSelectPlan("Creator Pro")} className="w-full py-2.5 rounded-full bg-white text-ink text-xs font-semibold hover:bg-neutral-200 transition-colors relative z-10">
            Get started →
          </button>
        </div>

        {/* Studio */}
        <div className="p-5 rounded-2xl border border-line bg-canvas/70 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">Studio</div>
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl text-ink">${studioPrice}</span>
              <span className="text-xs text-muted">/mo</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">Built for media teams, agencies, and multi-channel brands.</p>
            <ul className="space-y-2 pt-2 text-xs text-ink/85">
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Everything in Creator Pro</li>
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> 5 team seats &amp; shared folders</li>
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> Priority render queue</li>
              <li className="flex items-center gap-2"><span className="text-emerald-600">✓</span> API access &amp; auto-scheduling</li>
            </ul>
          </div>
          <button type="button" onClick={() => handleSelectPlan("Studio")} className="w-full py-2.5 rounded-full border border-ink text-ink text-xs font-semibold hover:bg-ink hover:text-white transition-colors">
            Get started
          </button>
        </div>
      </div>
      <p className="text-[11px] text-center text-muted font-mono">Pricing is indicative and subject to change. This is a prototype.</p>
    </div>
  );
}

// ============================================================
//  AUTH MODAL
// ============================================================

function AuthModal({ onClose, toast }: { onClose: () => void; toast: (msg: string) => void }) {
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isLogin = tab === "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = isLogin
      ? "Login is not yet connected — this is a UI prototype."
      : "Sign-up is not yet connected — this is a UI prototype.";
    setFeedback(msg);
    setTimeout(() => {
      onClose();
      toast(isLogin ? "Login flow previewed" : "Sign-up flow previewed");
    }, 1500);
  };

  const handleQuickAuth = (provider: string) => {
    setFeedback(`${provider} auth is not yet connected — this is a UI prototype.`);
    setTimeout(() => {
      onClose();
      toast(`${provider} auth flow previewed`);
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="inline-flex p-1 rounded-full bg-canvas border border-line">
        <button
          type="button"
          onClick={() => { setTab("login"); setFeedback(null); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${isLogin ? "bg-ink text-white shadow-xs" : "text-muted hover:text-ink"}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => { setTab("signup"); setFeedback(null); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!isLogin ? "bg-ink text-white shadow-xs" : "text-muted hover:text-ink"}`}
        >
          Sign up
        </button>
      </div>

      <div>
        <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tight text-ink">
          {isLogin ? "Welcome back to Reelix" : "Create your studio account"}
        </h2>
        <p className="text-xs text-muted mt-1">
          {isLogin ? "Pick up right where you left off." : "Start clipping, captioning, and previewing shorts."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => handleQuickAuth("Google")} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-line bg-white hover:bg-canvas text-xs font-semibold text-ink transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 01-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09A12 12 0 0012 24z" />
            <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.38-2.28V6.63H1.29A12 12 0 000 12c0 1.94.46 3.77 1.29 5.37l3.99-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 001.29 6.63l3.99 3.09c.95-2.85 3.6-4.97 6.72-4.97z" />
          </svg>
          <span>Google</span>
        </button>
        <button type="button" onClick={() => handleQuickAuth("Apple")} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-line bg-white hover:bg-canvas text-xs font-semibold text-ink transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
          </svg>
          <span>Apple</span>
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-mono text-muted">
        <span className="flex-1 h-[1px] bg-line" />
        <span>OR EMAIL</span>
        <span className="flex-1 h-[1px] bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {!isLogin && (
          <div>
            <label className="block text-[11.5px] font-medium text-muted mb-1">Full Name</label>
            <input type="text" required placeholder="Alex Rivera" className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all" />
          </div>
        )}
        <div>
          <label className="block text-[11.5px] font-medium text-muted mb-1">Email Address</label>
          <input type="email" required placeholder="creator@studio.com" className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all" />
        </div>
        <div>
          <label className="block text-[11.5px] font-medium text-muted mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-line bg-canvas text-sm text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Show or hide password"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            {feedback}
          </div>
        )}

        <button type="submit" className="btn-sheen w-full py-3 rounded-full bg-ink text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md">
          {isLogin ? "Log in to Reelix →" : "Create free account →"}
        </button>
      </form>
    </div>
  );
}

// ============================================================
//  DEMO MODAL
// ============================================================

function DemoModal({ onClose, onOpenAuth }: { onClose: () => void; onOpenAuth: () => void }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Interactive Walkthrough</span>
        <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tight text-ink mt-1">
          Source video → candidate clips → vertical preview
        </h2>
      </div>

      <div className="rounded-2xl overflow-hidden bg-[#0A0A0D] border border-neutral-800 text-white shadow-2xl">
        <div className="relative aspect-video p-6 flex flex-col justify-between bg-gradient-to-br from-neutral-950 via-[#12121a] to-neutral-900">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              REELIX STUDIO PROTOTYPE
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[9px]">
              SAMPLE DATA
            </span>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 my-auto">
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              className="w-14 h-14 rounded-full bg-white text-ink flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
            >
              {paused ? (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7-11-7z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" /></svg>
              )}
            </button>
            <div className="space-y-1">
              <div className="font-[family-name:var(--font-display)] font-bold text-base">AI Clipper + Auto-Captions + Beat Sync</div>
              <div className="font-mono text-[11px] text-white/60">Simulated timeline preview • 00:30</div>
            </div>
          </div>

          <div className="relative pt-3 space-y-1.5">
            <div className="relative h-12 rounded-xl bg-white/5 border border-white/10 p-2 flex flex-col justify-between overflow-hidden">
              <div className="flex gap-1.5 h-3.5">
                <div className="w-1/4 rounded bg-indigo-500/80" />
                <div className="w-2/5 rounded bg-fuchsia-500/80" />
                <div className="flex-1 rounded bg-cyan-500/80" />
              </div>
              <div className="flex gap-1 h-2.5">
                <div className="w-1/3 rounded bg-emerald-400/75" />
                <div className="w-1/4 rounded bg-emerald-400/60" />
                <div className="flex-1 rounded bg-emerald-400/75" />
              </div>
              <div className={`demo-playhead absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#fff] ${paused ? "paused" : ""}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-muted">Sample data • Runs in browser</span>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-full border border-line text-xs font-medium text-muted hover:text-ink">Close</button>
          <button type="button" onClick={() => { onClose(); onOpenAuth(); }} className="btn-sheen px-5 py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800">
            Start creating →
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TOOL MODAL
// ============================================================

function ToolModal({
  toolKey,
  onClose,
  onOpenAuth,
  toast,
}: {
  toolKey: string;
  onClose: () => void;
  onOpenAuth: () => void;
  toast: (msg: string) => void;
}) {
  const tool = CREATOR_TOOLS.find((t) => t.key === toolKey);
  if (!tool) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-ink text-white flex items-center justify-center shadow-md">
          <ToolIcon tool={tool.key} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl tracking-tight text-ink">{tool.name}</h2>
            {tool.badge && (
              <span className={`font-mono text-[9.5px] font-semibold px-2 py-0.5 rounded-full ${tool.badgeStyle}`}>{tool.badge}</span>
            )}
          </div>
          <p className="text-xs text-muted">{tool.shortDesc}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted">{tool.longDesc}</p>

      <ToolInteractiveWidget toolKey={toolKey} toast={toast} />

      <div className="pt-1 flex items-center justify-end gap-2.5">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-full border border-line text-xs font-medium text-muted hover:text-ink">Close</button>
        <button type="button" onClick={() => { onClose(); onOpenAuth(); }} className="btn-sheen px-5 py-2.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-neutral-800 transition-colors">
          Try this tool free →
        </button>
      </div>
    </div>
  );
}

function ToolInteractiveWidget({ toolKey, toast }: { toolKey: string; toast: (msg: string) => void }) {
  const [hookScore, setHookScore] = useState(94);
  const [bpmLabel, setBpmLabel] = useState("128 BPM • SNAPPED");
  const [captionStyle, setCaptionStyle] = useState<"swiss" | "kinetic" | "mono">("swiss");
  const [reframeLabel, setReframeLabel] = useState("9:16 VERTICAL");

  if (toolKey === "captions") {
    const captionContent = captionStyle === "swiss"
      ? <span className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight text-white">Turn raw clips into <span className="underline decoration-white/60">short-form</span> content</span>
      : captionStyle === "kinetic"
      ? <span className="font-[family-name:var(--font-display)] font-extrabold text-lg uppercase tracking-wide text-amber-300">STOP SCROLLING <span className="bg-white text-ink px-1.5 rounded">NOW</span></span>
      : <span className="font-mono text-sm tracking-tight text-emerald-300">[00:02.4] auto_caption_sync::active</span>;

    return (
      <div className="p-4 rounded-2xl bg-ink text-white space-y-3">
        <div className="flex items-center justify-between text-[10.5px] font-mono text-white/60">
          <span>CAPTION STYLE PREVIEW</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[9px]">SAMPLE</span>
        </div>
        <div className="h-20 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center px-4 text-center">
          {captionContent}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCaptionStyle("swiss")} className={`px-3 py-1 rounded-full text-[11px] font-medium ${captionStyle === "swiss" ? "bg-white/25" : "bg-white/15 hover:bg-white/25"}`}>Swiss Clean</button>
          <button type="button" onClick={() => setCaptionStyle("kinetic")} className={`px-3 py-1 rounded-full text-[11px] font-medium ${captionStyle === "kinetic" ? "bg-white/25" : "bg-white/15 hover:bg-white/25"}`}>Kinetic Pop</button>
          <button type="button" onClick={() => setCaptionStyle("mono")} className={`px-3 py-1 rounded-full text-[11px] font-medium ${captionStyle === "mono" ? "bg-white/25" : "bg-white/15 hover:bg-white/25"}`}>Studio Mono</button>
        </div>
      </div>
    );
  }

  if (toolKey === "hooks") {
    const hookSuggestion =
      hookScore >= 90 ? '"Stop editing for 3 hours—watch AI cut this in 12 seconds."'
      : hookScore >= 78 ? '"Here is the fastest way creators publish 10 shorts a week."'
      : '"Today I want to show you my video editing process." (Needs stronger hook)';

    return (
      <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase text-muted">3-Second Hook Analysis</span>
          <span className="font-mono text-sm font-bold text-emerald-600">{hookScore} / 100</span>
        </div>
        <input type="range" min={62} max={99} value={hookScore} onChange={(e) => setHookScore(Number(e.target.value))} className="w-full accent-ink cursor-pointer" />
        <div className="p-3 rounded-xl bg-white border border-line text-xs text-ink font-medium">{hookSuggestion}</div>
        <p className="text-[10px] text-muted font-mono">Score is illustrative — not a prediction of actual performance.</p>
      </div>
    );
  }

  if (toolKey === "beatsync") {
    return (
      <div className="p-4 rounded-2xl bg-ink text-white space-y-3">
        <div className="flex items-center justify-between text-[10.5px] font-mono text-white/70">
          <span>AUDIO TRANSIENT LOCK</span>
          <span>{bpmLabel}</span>
        </div>
        <div className="h-14 rounded-xl bg-neutral-900 border border-white/10 px-4 flex items-center justify-between gap-1.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`w-1.5 rounded-full ${i % 4 === 0 ? "bg-emerald-400 h-9" : "bg-white/30 h-4"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setBpmLabel("128 BPM • SNAPPED")} className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px]">128 BPM Drop</button>
          <button type="button" onClick={() => setBpmLabel("92 BPM • LO-FI")} className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px]">92 BPM Lo-Fi</button>
        </div>
      </div>
    );
  }

  if (toolKey === "clipper") {
    return (
      <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted">
          <span>DETECTED MOMENTS (SAMPLE 42:10 VIDEO)</span>
          <span className="text-ink font-semibold">3 CLIPS FOUND</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-line text-xs">
            <span className="font-medium text-ink">04:12 — Key Framework Breakdown</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">High relevance</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-line text-xs">
            <span className="font-medium text-ink">18:45 — Contrarian Take Hook</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">High relevance</span>
          </div>
        </div>
        <p className="text-[10px] text-muted font-mono">Results are illustrative — using sample data, not live processing.</p>
      </div>
    );
  }

  if (toolKey === "reframe") {
    return (
      <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted">
          <span>SPEAKER-TRACKING REFRAME</span>
          <span className="text-ink font-semibold">{reframeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setReframeLabel("9:16 VERTICAL")} className={`flex-1 py-2 rounded-xl bg-white border ${reframeLabel === "9:16 VERTICAL" ? "border-ink" : "border-line hover:border-ink"} text-xs font-semibold text-ink`}>9:16 Reels/Shorts</button>
          <button type="button" onClick={() => setReframeLabel("4:5 FEED")} className={`flex-1 py-2 rounded-xl bg-white border ${reframeLabel === "4:5 FEED" ? "border-ink" : "border-line hover:border-ink"} text-xs font-medium text-muted hover:text-ink`}>4:5 Feed</button>
          <button type="button" onClick={() => setReframeLabel("1:1 SQUARE")} className={`flex-1 py-2 rounded-xl bg-white border ${reframeLabel === "1:1 SQUARE" ? "border-ink" : "border-line hover:border-ink"} text-xs font-medium text-muted hover:text-ink`}>1:1 Square</button>
        </div>
      </div>
    );
  }

  // templates
  return (
    <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3">
      <div className="font-mono text-[10.5px] uppercase text-muted">Curated Motion Presets</div>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => toast("Applied Swiss Editorial preset")} className="p-2.5 rounded-xl bg-white border border-line hover:border-ink text-center text-[11px] font-semibold">Swiss Editorial</button>
        <button type="button" onClick={() => toast("Applied Midnight Neon preset")} className="p-2.5 rounded-xl bg-ink text-white text-center text-[11px] font-semibold">Midnight Neon</button>
        <button type="button" onClick={() => toast("Applied Film Grain 16mm preset")} className="p-2.5 rounded-xl bg-white border border-line hover:border-ink text-center text-[11px] font-semibold">Film 16mm</button>
      </div>
    </div>
  );
}

// ============================================================
//  3D CYLINDER GEOMETRY
// ============================================================

type ViewMode = "cylinder" | "stack";

interface SlotStyle {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  opacity: number;
  blur: number;
  sat: number;
  zIndex: number;
  border: string;
  shadow: string;
  pointer: string;
  vis: string;
}

function getAsymmetricSlot(idx: number, activeIdx: number, total: number): number {
  const diff = (idx - activeIdx + total) % total;
  if (diff === 0) return 0;
  if (diff === 1) return 1;
  if (diff === 2) return 2;
  return diff - total;
}

function getSlotStyle(slot: number, viewMode: ViewMode): SlotStyle {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  const scaleX = w < 640 ? 0.56 : w < 1024 ? 0.78 : 1;

  const specs: Record<string, Record<string, SlotStyle>> = {
    stack: {
      "0": { x: 0, y: 0, z: -260, rotY: 0, rotZ: 0, scale: 0.9, opacity: 0, blur: 0, sat: 1, zIndex: 1, border: "1px solid transparent", shadow: "none", pointer: "none", vis: "hidden" },
      "1": { x: 118 * scaleX, y: 6, z: -130, rotY: -6, rotZ: 5.5, scale: 0.92, opacity: 0.92, blur: 0, sat: 1.06, zIndex: 18, border: "1px solid rgba(255,255,255,0.5)", shadow: "0 26px 56px -18px rgba(10,10,18,0.28)", pointer: "auto", vis: "visible" },
      "2": { x: 188 * scaleX, y: 18, z: -210, rotY: -10, rotZ: 10.5, scale: 0.84, opacity: 0.74, blur: 0.2, sat: 1, zIndex: 14, border: "1px solid rgba(255,255,255,0.38)", shadow: "0 20px 44px -18px rgba(10,10,18,0.2)", pointer: "auto", vis: "visible" },
      "-1": { x: -124 * scaleX, y: 6, z: -140, rotY: 6, rotZ: -5.5, scale: 0.9, opacity: 0.34, blur: 0.6, sat: 0.85, zIndex: 12, border: "1px solid rgba(255,255,255,0.25)", shadow: "0 18px 40px -18px rgba(10,10,18,0.1)", pointer: "auto", vis: "visible" },
      "-2": { x: -206 * scaleX, y: 16, z: -220, rotY: 10, rotZ: -10, scale: 0.83, opacity: 0.22, blur: 1.3, sat: 0.72, zIndex: 10, border: "1px solid rgba(255,255,255,0.18)", shadow: "none", pointer: "auto", vis: "visible" },
      "-3": { x: -280 * scaleX, y: 28, z: -300, rotY: 14, rotZ: -14, scale: 0.75, opacity: 0.13, blur: 2, sat: 0.62, zIndex: 8, border: "1px solid rgba(255,255,255,0.12)", shadow: "none", pointer: "auto", vis: "visible" },
      "-4": { x: -346 * scaleX, y: 40, z: -380, rotY: 18, rotZ: -17.5, scale: 0.67, opacity: 0.06, blur: 2.8, sat: 0.54, zIndex: 6, border: "1px solid rgba(255,255,255,0.08)", shadow: "none", pointer: "auto", vis: "visible" },
    },
    cylinder: {
      "0": { x: 0, y: 0, z: -260, rotY: 0, rotZ: 0, scale: 0.9, opacity: 0, blur: 0, sat: 1, zIndex: 1, border: "1px solid transparent", shadow: "none", pointer: "none", vis: "hidden" },
      "1": { x: 168 * scaleX, y: -4, z: -115, rotY: -19, rotZ: 1.6, scale: 0.91, opacity: 0.92, blur: 0, sat: 1.08, zIndex: 18, border: "1px solid rgba(255,255,255,0.52)", shadow: "0 28px 60px -18px rgba(10,10,18,0.28)", pointer: "auto", vis: "visible" },
      "2": { x: 304 * scaleX, y: 12, z: -225, rotY: -35, rotZ: 3.2, scale: 0.8, opacity: 0.74, blur: 0.25, sat: 1.02, zIndex: 14, border: "1px solid rgba(255,255,255,0.40)", shadow: "0 22px 48px -18px rgba(10,10,18,0.20)", pointer: "auto", vis: "visible" },
      "-1": { x: -172 * scaleX, y: -4, z: -130, rotY: 19, rotZ: -1.5, scale: 0.89, opacity: 0.34, blur: 0.7, sat: 0.84, zIndex: 12, border: "1px solid rgba(255,255,255,0.24)", shadow: "0 20px 44px -18px rgba(10,10,18,0.11)", pointer: "auto", vis: "visible" },
      "-2": { x: -314 * scaleX, y: 10, z: -235, rotY: 33, rotZ: -2.9, scale: 0.8, opacity: 0.22, blur: 1.4, sat: 0.72, zIndex: 10, border: "1px solid rgba(255,255,255,0.18)", shadow: "0 14px 32px -18px rgba(10,10,18,0.07)", pointer: "auto", vis: "visible" },
      "-3": { x: -442 * scaleX, y: 26, z: -340, rotY: 45, rotZ: -4.2, scale: 0.71, opacity: 0.13, blur: 2.2, sat: 0.62, zIndex: 8, border: "1px solid rgba(255,255,255,0.12)", shadow: "none", pointer: "auto", vis: "visible" },
      "-4": { x: -556 * scaleX, y: 44, z: -440, rotY: 55, rotZ: -5.4, scale: 0.62, opacity: 0.06, blur: 3, sat: 0.54, zIndex: 6, border: "1px solid rgba(255,255,255,0.08)", shadow: "none", pointer: "auto", vis: "visible" },
    },
  };

  return specs[viewMode][String(slot)] ?? specs[viewMode]["0"];
}

// ============================================================
//  ACTIVE REEL CONTENT
// ============================================================

function ActiveReelScene({
  reel,
  likedSet,
  savedSet,
  followedSet,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  toast,
}: {
  reel: Reel;
  likedSet: Set<string>;
  savedSet: Set<string>;
  followedSet: Set<string>;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onToggleFollow: (id: string) => void;
  toast: (msg: string) => void;
}) {
  const isLiked = likedSet.has(reel.id);
  const isSaved = savedSet.has(reel.id);
  const isFollowed = followedSet.has(reel.id);
  const likeDisplay = formatLikes(reel.likes + (isLiked ? 1 : 0));

  // Caption cycling
  const [captionIdx, setCaptionIdx] = useState(0);
  const [popKey, setPopKey] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCaptionIdx((prev) => (prev + 1) % reel.captions.length);
      setPopKey((prev) => prev + 1);
    }, 1650);
    return () => clearInterval(timer);
  }, [reel.captions.length]);

  return (
    <div className="reel-enter relative w-full h-full overflow-hidden text-white" style={{ background: reel.gradient }}>
      <div className="absolute inset-0 reel-grain opacity-45" />
      <div className="absolute -top-16 -left-12 w-56 h-56 rounded-full blur-3xl animate-mesh" style={{ background: reel.orb1 }} />
      <div className="absolute bottom-16 -right-14 w-60 h-60 rounded-full blur-3xl animate-float-soft" style={{ background: reel.orb2 }} />

      {/* Center emblem */}
      <div className="absolute inset-x-5 top-[104px] flex flex-col items-center text-center pointer-events-none">
        <span className="font-mono text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/40 border border-white/15 mb-3">
          {reel.id} / {reel.category}
        </span>
        <div className="w-20 h-20 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center text-4xl shadow-2xl animate-float-soft">
          {reel.icon}
        </div>
      </div>

      {/* Kinetic caption */}
      <div className="absolute inset-x-4 top-[56%] -translate-y-1/2 flex justify-center pointer-events-none z-20">
        <div className="px-3.5 py-2 rounded-2xl bg-black/60 border border-white/15 text-center shadow-lg max-w-[230px]">
          <p key={popKey} className="font-[family-name:var(--font-display)] font-extrabold text-[14.5px] leading-snug tracking-tight text-white caption-pop">
            {reel.captions[captionIdx]}
          </p>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* Right action rail */}
      <div className="absolute right-3 bottom-12 z-20 flex flex-col items-center gap-2.5">
        {/* Like */}
        <button type="button" onClick={() => onToggleLike(reel.id)} className="flex flex-col items-center gap-0.5">
          <div className={`w-9 h-9 rounded-full bg-black/40 border border-white/15 flex items-center justify-center transition-transform active:scale-90 ${isLiked ? "text-rose-500" : "text-white"}`}>
            <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-[9.5px] font-semibold drop-shadow">{likeDisplay}</span>
        </button>

        {/* Comment */}
        <button type="button" onClick={() => toast(`${reel.comments} comments on ${reel.title}`)} className="flex flex-col items-center gap-0.5">
          <div className="w-9 h-9 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white hover:bg-black/55 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-[9.5px] font-semibold drop-shadow">{reel.comments}</span>
        </button>

        {/* Save */}
        <button type="button" onClick={() => onToggleSave(reel.id)} className="flex flex-col items-center gap-0.5">
          <div className={`w-9 h-9 rounded-full bg-black/40 border border-white/15 flex items-center justify-center transition-transform active:scale-90 ${isSaved ? "text-amber-400" : "text-white"}`}>
            <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <span className="text-[9.5px] font-semibold drop-shadow">{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Share */}
        <button type="button" onClick={() => toast("Reel link copied to clipboard")} className="flex flex-col items-center gap-0.5">
          <div className="w-9 h-9 rounded-full bg-black/40 border border-white/15 flex items-center justify-center text-white hover:bg-black/55 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="text-[9.5px] font-semibold drop-shadow">{reel.shares}</span>
        </button>

        {/* Spinning vinyl */}
        <div className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-white/30 p-1 flex items-center justify-center animate-vinyl shadow-md mt-0.5">
          <div className={`w-full h-full rounded-full bg-gradient-to-tr ${reel.avatarGrad} flex items-center justify-center`}>
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
          </div>
        </div>
      </div>

      {/* Bottom left creator info */}
      <div className="absolute left-4 right-16 bottom-6 z-20 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${reel.avatarGrad} flex items-center justify-center text-[10.5px] font-bold text-white border border-white/40 shrink-0`}>
            {reel.initials}
          </div>
          <span className="text-[12px] font-semibold tracking-tight truncate">{reel.handle}</span>
          <button
            type="button"
            onClick={() => onToggleFollow(reel.id)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
              isFollowed ? "bg-white/20 text-white border border-white/30" : "bg-white text-ink hover:bg-neutral-200"
            }`}
          >
            {isFollowed ? "Following" : "Follow"}
          </button>
        </div>
        <p className="text-[11.5px] text-white/90 leading-snug font-medium">
          {reel.title} — sample short with <span className="underline decoration-white/50">#Reelix</span>
        </p>
        <div className="flex items-center gap-2 text-[10px] text-white/80 font-mono">
          <div className="flex items-end gap-[2px] h-3">
            <span className="w-[2px] bg-white rounded-full eq-1" />
            <span className="w-[2px] bg-white rounded-full eq-2" />
            <span className="w-[2px] bg-white rounded-full eq-3" />
            <span className="w-[2px] bg-white rounded-full eq-4" />
          </div>
          <span className="truncate">{reel.audio}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  MAIN LANDING PAGE
// ============================================================

export default function ReetlixLanding() {
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("cylinder");
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());
  const [activeFeedTab, setActiveFeedTab] = useState<"following" | "foryou">("foryou");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [activeToolKey, setActiveToolKey] = useState<string>("clipper");

  // Toast
  const { msg: toastMsg, show: showToast } = useToast();

  // Refs
  const tiltRigRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const closeToolsTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const progressRaf = useRef<number | undefined>(undefined);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Current reel
  const currentReel = REELS[currentIndex];

  // ---- REEL SELECTION ----
  const selectReel = useCallback((index: number) => {
    const target = ((index % REELS.length) + REELS.length) % REELS.length;
    setCurrentIndex(target);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), LOADING_DURATION);
  }, []);

  const nextReel = useCallback(() => selectReel(currentIndex + 1), [currentIndex, selectReel]);
  const prevReel = useCallback(() => selectReel(currentIndex - 1), [currentIndex, selectReel]);

  // ---- AUTOPLAY ----
  useEffect(() => {
    if (!isAutoplay || isLoading) return;
    autoplayTimer.current = setTimeout(nextReel, REEL_DURATION);
    return () => clearTimeout(autoplayTimer.current);
  }, [currentIndex, isAutoplay, isLoading, nextReel]);

  // ---- PROGRESS BAR ----
  useEffect(() => {
    if (isLoading || !progressBarRef.current) return;
    const bar = progressBarRef.current;
    let start: number | null = null;
    let elapsed = 0;

    function tick(now: number) {
      if (!start) start = now;
      if (isAutoplay) {
        elapsed = now - start;
        const pct = Math.min((elapsed / REEL_DURATION) * 100, 100);
        bar.style.width = `${pct}%`;
      }
      progressRaf.current = requestAnimationFrame(tick);
    }

    progressRaf.current = requestAnimationFrame(tick);
    return () => {
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current);
      bar.style.width = "0%";
    };
  }, [currentIndex, isAutoplay, isLoading]);

  // ---- KEYBOARD ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modalType) return;
      if (e.key === "ArrowRight") nextReel();
      if (e.key === "ArrowLeft") prevReel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalType, nextReel, prevReel]);

  // ---- MOUSE TILT ----
  useEffect(() => {
    const stage = stageRef.current;
    const rig = tiltRigRef.current;
    if (!stage || !rig) return;

    let targetRx = 0, targetRy = 0;
    let currentRx = 0, currentRy = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRy = nx * 9;
      targetRx = -ny * 7;
    };

    const onLeave = () => { targetRx = 0; targetRy = 0; };

    function animate() {
      currentRx += (targetRx - currentRx) * 0.08;
      currentRy += (targetRy - currentRy) * 0.08;
      rig!.style.transform = `rotateX(${currentRx.toFixed(3)}deg) rotateY(${currentRy.toFixed(3)}deg)`;
      rafId = requestAnimationFrame(animate);
    }

    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ---- INTERACTIONS ----
  const toggleLike = useCallback((id: string) => {
    setLikedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); showToast("Saved to your inspiration board"); }
      return next;
    });
  }, [showToast]);

  const toggleFollow = useCallback((id: string) => {
    setFollowedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); showToast("Creator followed"); }
      return next;
    });
  }, [showToast]);

  // ---- TOOLS DROPDOWN ----
  const openToolsDropdown = () => {
    clearTimeout(closeToolsTimeout.current);
    setIsToolsOpen(true);
  };
  const closeToolsDropdown = () => {
    clearTimeout(closeToolsTimeout.current);
    setIsToolsOpen(false);
  };
  const scheduleClose = () => {
    closeToolsTimeout.current = setTimeout(closeToolsDropdown, 170);
  };
  const cancelClose = () => clearTimeout(closeToolsTimeout.current);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isToolsOpen) return;
    const handler = (e: MouseEvent) => {
      const wrapper = document.getElementById("toolsDropdownWrapper");
      if (wrapper && !wrapper.contains(e.target as Node)) closeToolsDropdown();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isToolsOpen]);

  // ---- MODAL HELPERS ----
  const openAuth = useCallback(() => setModalType("auth"), []);
  const openDemo = useCallback(() => setModalType("demo"), []);
  const openPricing = useCallback(() => setModalType("pricing"), []);
  const openTool = useCallback((key: string) => {
    setActiveToolKey(key);
    setModalType("tool");
  }, []);
  const closeModal = useCallback(() => setModalType(null), []);

  const modalMaxWidth = modalType === "pricing" ? "max-w-3xl" : modalType === "demo" ? "max-w-2xl" : "max-w-md";

  // ---- Dynamic Island state ----
  const islandSyncing = isLoading;

  // ---- Cylinder deck cards ----
  const deckCards = useMemo(() => {
    return REELS.map((reel, idx) => {
      const slot = getAsymmetricSlot(idx, currentIndex, REELS.length);
      const s = getSlotStyle(slot, viewMode);
      return { reel, idx, slot, style: s };
    });
  }, [currentIndex, viewMode]);

  // ---- RENDER ----
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Grid */}
      <div className="fixed inset-0 architectural-grid pointer-events-none z-0" />
      <div className="fixed inset-0 grid-vignette pointer-events-none z-0" />

      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 w-full bg-[#FAFAFA]/82 backdrop-blur-xl border-b border-line/85">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-[10px] bg-ink text-white flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(10,10,10,0.35)] group-hover:scale-[1.03] transition-transform">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <polygon points="10 8.5 16 12 10 15.5 10 8.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-display)] font-bold text-[20px] tracking-[-0.045em] text-ink">Reelix</span>
          </a>

          {/* Desktop Nav */}
          <nav aria-label="Creator Tools Navigation" className="hidden md:flex items-center">
            <div className="relative flex items-center gap-1 p-1 rounded-full bg-white/85 border border-line/90 shadow-[0_4px_18px_-8px_rgba(10,10,14,0.12)]">
              {/* Tools dropdown */}
              <div
                id="toolsDropdownWrapper"
                className="relative"
                onMouseEnter={openToolsDropdown}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  aria-expanded={isToolsOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium text-ink bg-neutral-100/80 hover:bg-neutral-100 transition-colors"
                >
                  <span>Tools</span>
                  <svg className={`w-3.5 h-3.5 text-muted transition-transform duration-300 ${isToolsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Mega dropdown */}
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                  className={`mega-dropdown ${isToolsOpen ? "is-open" : "is-closed"} absolute left-1/2 -translate-x-1/2 top-[calc(100%+12px)] w-[600px] rounded-2xl bg-white/95 backdrop-blur-2xl border border-line shadow-[0_28px_70px_-18px_rgba(10,10,18,0.22),0_4px_16px_-6px_rgba(10,10,18,0.08)] overflow-hidden z-50`}
                >
                  <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b border-line/65">
                    <span className="font-mono text-[10.5px] uppercase tracking-widest text-muted">Creator Studio Suite</span>
                    <span className="font-mono text-[10px] text-muted">6 AI-Powered Tools</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-1.5">
                    {CREATOR_TOOLS.map((tool) => (
                      <button
                        key={tool.key}
                        type="button"
                        onClick={() => { closeToolsDropdown(); openTool(tool.key); }}
                        className="group text-left p-3 rounded-xl hover:bg-canvas border border-transparent hover:border-line/80 transition-all duration-200 flex items-start gap-3 hover:-translate-y-[1px]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-canvas border border-line/90 group-hover:bg-ink group-hover:text-white group-hover:border-ink text-ink flex items-center justify-center shrink-0 transition-colors">
                          <ToolIcon tool={tool.key} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-[family-name:var(--font-display)] font-semibold text-[13.5px] text-ink">{tool.name}</span>
                              {tool.badge && (
                                <span className={`font-mono text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full ${tool.badgeStyle}`}>{tool.badge}</span>
                              )}
                            </div>
                            <svg className="w-3.5 h-3.5 text-muted opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                            </svg>
                          </div>
                          <p className="text-[11.5px] text-muted leading-snug mt-0.5 line-clamp-2">{tool.shortDesc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-canvas border-t border-line/75 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11.5px] font-mono text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>HD Cloud Render Pipeline • Export to Reels, Shorts &amp; TikTok</span>
                    </div>
                  </div>
                </div>
              </div>

              <a href="#showcaseStage" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-muted hover:text-ink hover:bg-neutral-50 transition-colors">
                Showcase
              </a>
              <button type="button" onClick={openDemo} className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-muted hover:text-ink hover:bg-neutral-50 transition-colors">
                Workflow
              </button>
            </div>
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-5 lg:gap-6 shrink-0">
            <button type="button" onClick={openPricing} className="text-[13.5px] font-medium text-muted hover:text-ink transition-colors">Pricing</button>
            <button type="button" onClick={openAuth} className="text-[13.5px] font-medium text-muted hover:text-ink transition-colors">Log in</button>
            <button type="button" onClick={openAuth} className="btn-sheen px-5 py-2.5 rounded-full bg-ink text-white text-[13px] font-medium hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-[0_8px_22px_-8px_rgba(10,10,10,0.45)]">
              Sign up
            </button>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button type="button" onClick={openAuth} className="px-3.5 py-1.5 rounded-full bg-ink text-white text-[12px] font-medium">Sign up</button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu" className="p-2 rounded-full border border-line bg-white text-ink">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-white/95 backdrop-blur-2xl px-5 py-5 shadow-xl space-y-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2.5">Creator Tools</div>
              <div className="grid grid-cols-2 gap-2">
                {CREATOR_TOOLS.map((tool) => (
                  <button
                    key={tool.key}
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); openTool(tool.key); }}
                    className="p-2.5 rounded-xl bg-canvas border border-line text-left flex items-center gap-2 hover:border-ink/40"
                  >
                    <span className="text-ink shrink-0"><ToolIcon tool={tool.key} /></span>
                    <span className="text-[12px] font-semibold text-ink truncate">{tool.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
              <button type="button" onClick={() => { setMobileMenuOpen(false); openPricing(); }} className="text-sm font-medium text-ink">Pricing</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); openAuth(); }} className="text-sm font-medium text-muted">Log in</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); openDemo(); }} className="text-sm font-medium text-muted">Workflow</button>
            </div>
          </div>
        )}
      </header>

      {/* ============ HERO ============ */}
      <main className="relative z-10 flex-1 flex flex-col justify-between max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 pt-6 lg:pt-2 pb-8">
        <section id="showcaseStage" ref={stageRef} className="relative w-full flex-1 flex flex-col lg:flex-row items-center min-h-[630px] lg:min-h-[700px] py-2 lg:py-4">
          {/* LEFT CONTENT */}
          <div className="relative z-30 w-full lg:w-[48%] xl:w-[46%] flex flex-col justify-between space-y-9 lg:space-y-12 py-4 lg:py-8 lg:pointer-events-none">
            <div className="hidden lg:block absolute -left-10 -inset-y-10 right-6 hero-copy-mist pointer-events-none -z-10" />

            <div className="space-y-6 sm:space-y-7 lg:pointer-events-auto">
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-[1px] bg-ink/35" />
                <span className="font-mono text-[12px] sm:text-[13px] text-muted tracking-tight">
                  AI-powered short-form creator studio
                </span>
              </div>

              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-[54px] sm:text-[74px] xl:text-[90px] leading-[0.95] tracking-[-0.045em] text-ink">
                Turn long videos<br />into <span className="headline-accent-bar">shorts</span>
              </h1>

              <p className="text-[16px] sm:text-[17.5px] leading-[1.62] text-muted max-w-[445px] font-normal">
                Find standout moments, create captions, and prepare vertical clips in one streamlined creator workflow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1 lg:pointer-events-auto">
              <button
                type="button"
                onClick={openAuth}
                className="btn-sheen group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-ink text-white text-[14.5px] font-medium hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-[0_16px_36px_-12px_rgba(10,10,10,0.45)]"
              >
                <span>Get started free</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={openDemo}
                className="inline-flex items-center gap-2.5 px-6 py-4 rounded-full bg-white/92 backdrop-blur-md text-ink text-[14.5px] font-medium border border-line hover:border-ink/40 hover:bg-white active:scale-[0.98] transition-all shadow-[0_4px_16px_-8px_rgba(10,10,14,0.12)]"
              >
                <svg className="w-4 h-4 text-ink/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
                <span>See how it works</span>
              </button>
            </div>
          </div>

          {/* RIGHT: 3D PHONE + CYLINDER */}
          <div className="relative lg:absolute lg:inset-0 w-full h-[630px] sm:h-[660px] lg:h-full flex items-center justify-center lg:block mt-8 lg:mt-0 overflow-visible">
            <div className="stage-perspective relative lg:absolute lg:left-[64%] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 flex flex-col items-center justify-center select-none">
              <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-neutral-200/55 via-white/75 to-neutral-200/35 blur-3xl pointer-events-none -z-10" />

              <div ref={tiltRigRef} className="tilt-rig relative flex items-center justify-center">
                {/* Cylinder deck cards */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transformStyle: "preserve-3d" }}>
                  {deckCards.map(({ reel, idx, style: s }) => (
                    <div
                      key={reel.id}
                      className="cyl-deck"
                      style={{
                        background: reel.gradient,
                        transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateY(${s.rotY}deg) rotateZ(${s.rotZ}deg) scale(${s.scale})`,
                        opacity: s.opacity,
                        filter: `blur(${s.blur}px) saturate(${s.sat})`,
                        zIndex: s.zIndex,
                        border: s.border,
                        boxShadow: s.shadow,
                        pointerEvents: s.pointer as React.CSSProperties["pointerEvents"],
                        visibility: s.vis as React.CSSProperties["visibility"],
                      }}
                      onClick={() => selectReel(idx)}
                    >
                      <div className="absolute inset-0 reel-grain opacity-45" />
                      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl" style={{ background: reel.orb1 }} />
                      <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-2xl" style={{ background: reel.orb2 }} />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/65 pointer-events-none" />
                      <div className="relative z-10 h-full p-4 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[9.5px] px-2.5 py-1 rounded-full bg-black/40 border border-white/20">{reel.id} / 07</span>
                          <span className="inline-flex items-center gap-1 font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-black/40 border border-white/15">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                            {reel.views}
                          </span>
                        </div>
                        <div className="self-center w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shadow-lg">{reel.icon}</div>
                        <div className="space-y-1">
                          <span className="inline-block font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/20">{reel.category}</span>
                          <h3 className="font-[family-name:var(--font-display)] font-bold text-[15.5px] leading-tight tracking-tight">{reel.title}</h3>
                          <p className="text-[11px] text-white/80 font-medium">{reel.handle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phone */}
                <div className="phone-chassis">
                  <div className="phone-earpiece" aria-hidden="true" />
                  <div className="phone-btn-action" />
                  <div className="phone-btn-vol-up" />
                  <div className="phone-btn-vol-down" />
                  <div className="phone-btn-power" />

                  <div className="phone-screen">
                    {/* Top vignette */}
                    <div className="absolute top-0 inset-x-0 h-[108px] z-20 bg-gradient-to-b from-black/62 via-black/22 to-transparent pointer-events-none" />

                    {/* Status bar */}
                    <div className="absolute top-0 inset-x-0 z-30 px-[19px] pt-[10px] flex items-center justify-between text-white pointer-events-none">
                      <span className="status-legible text-[11.5px] font-semibold tracking-[-0.02em] leading-none w-[44px]">9:41</span>

                      {/* Dynamic Island */}
                      <div className={`dynamic-island flex items-center justify-between gap-2 ${islandSyncing ? "is-syncing" : ""}`}>
                        {islandSyncing ? (
                          <div className="flex items-center gap-1.5 pl-0.5">
                            <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/25 border-t-emerald-400 animate-spin" />
                            <span className="font-mono text-[8.5px] tracking-wide text-white/90 animate-pulse">Syncing</span>
                          </div>
                        ) : (
                          <div className={`flex items-end gap-[2px] h-[11px] pl-0.5 ${!isAutoplay ? "island-wave-paused" : ""}`}>
                            <span className="w-[1.8px] bg-emerald-300/95 rounded-full eq-1" />
                            <span className="w-[1.8px] bg-white/90 rounded-full eq-2" />
                            <span className="w-[1.8px] bg-emerald-300/90 rounded-full eq-3" />
                            <span className="w-[1.8px] bg-white/85 rounded-full eq-4" />
                          </div>
                        )}
                        <div className="flex items-center gap-[5px]">
                          <span className="faceid-dot" aria-hidden="true" />
                          <span className="truedepth-lens" aria-hidden="true" />
                        </div>
                      </div>

                      {/* Right status icons */}
                      <div className="flex items-center justify-end gap-[5px] w-[54px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
                        <svg className="w-[13px] h-[9.5px] text-white" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
                          <rect x="0.5" y="8" width="2.4" height="3.5" rx="0.8" />
                          <rect x="4.5" y="5.8" width="2.4" height="5.7" rx="0.8" />
                          <rect x="8.5" y="3.4" width="2.4" height="8.1" rx="0.8" />
                          <rect x="12.5" y="0.8" width="2.4" height="10.7" rx="0.8" />
                        </svg>
                        <svg className="w-[12px] h-[9.5px] text-white" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden="true">
                          <path d="M1.4 4.2C4.9 1.1 11.1 1.1 14.6 4.2" />
                          <path d="M4.1 7.1C6.2 5.2 9.8 5.2 11.9 7.1" />
                          <circle cx="8" cy="10.2" r="1.1" fill="currentColor" stroke="none" />
                        </svg>
                        <div className="flex items-center gap-[1.5px]" aria-label="Battery 88%">
                          <div className="w-[20px] h-[10px] rounded-[3.2px] border border-white/55 p-[1.3px] flex items-center bg-black/15">
                            <div className="h-full bg-white rounded-[1.5px]" style={{ width: "88%" }} />
                          </div>
                          <div className="w-[1.5px] h-[3.8px] rounded-r-[1px] bg-white/60" />
                        </div>
                      </div>
                    </div>

                    {/* In-app header */}
                    <div className="absolute top-[42px] inset-x-0 z-30 px-4 flex items-center justify-between text-white">
                      <button type="button" onClick={() => showToast("Preview mode active")} className="inline-flex items-center gap-1 px-2 py-[3.5px] rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/18 text-[9px] font-mono font-semibold tracking-wider text-white/95 transition-colors" aria-label="HDR Camera Mode">
                        <svg className="w-2.5 h-2.5 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>HDR</span>
                      </button>

                      <div className="relative flex items-center gap-3.5">
                        <button
                          type="button"
                          onClick={() => { setActiveFeedTab("following"); nextReel(); showToast("Switched to Following feed"); }}
                          className={`status-legible text-[11.5px] transition-colors pb-1 ${activeFeedTab === "following" ? "font-semibold text-white" : "font-medium text-white/65 hover:text-white/90"}`}
                        >
                          Following
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveFeedTab("foryou"); nextReel(); showToast("Switched to For You feed"); }}
                          className={`status-legible text-[11.5px] transition-colors pb-1 ${activeFeedTab === "foryou" ? "font-semibold text-white" : "font-medium text-white/65 hover:text-white/90"}`}
                        >
                          For You
                        </button>
                        <span
                          className="feed-tab-indicator absolute bottom-0 left-0 h-[2px] rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.65)]"
                          style={{
                            width: activeFeedTab === "following" ? "46px" : "34px",
                            transform: activeFeedTab === "following" ? "translateX(4px)" : "translateX(65px)",
                          }}
                        />
                      </div>

                      <button type="button" onClick={() => showToast("Search trending reels & audio")} aria-label="Search reels" className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/95 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.1" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="6.5" />
                          <path strokeLinecap="round" d="M16 16l4 4" />
                        </svg>
                      </button>
                    </div>

                    {/* Active Reel */}
                    <div className="absolute inset-0 w-full h-full">
                      <ActiveReelScene
                        reel={currentReel}
                        likedSet={likedSet}
                        savedSet={savedSet}
                        followedSet={followedSet}
                        onToggleLike={toggleLike}
                        onToggleSave={toggleSave}
                        onToggleFollow={toggleFollow}
                        toast={showToast}
                      />
                    </div>

                    {/* Loading overlay */}
                    <div className={`absolute inset-0 z-25 bg-black/75 flex flex-col items-center justify-center p-6 transition-opacity duration-250 ${isLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                      <div className="w-9 h-9 rounded-full border-2 border-white/20 border-t-white animate-spin mb-3" />
                      <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span className="font-mono text-[10px] text-white/95 tracking-wide">Loading reel...</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 inset-x-0 z-30 h-[3px] bg-white/20">
                      <div ref={progressBarRef} className="h-full bg-white rounded-r-full" style={{ width: "0%" }} />
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 w-24 h-1 rounded-full bg-white/75 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Control pill */}
              <div className="mt-6 relative z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/92 backdrop-blur-md border border-line shadow-[0_8px_24px_-10px_rgba(10,10,14,0.14)]">
                <button type="button" onClick={prevReel} aria-label="Previous reel" className="w-7 h-7 rounded-full flex items-center justify-center text-ink hover:bg-neutral-100 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  aria-label={isAutoplay ? "Pause" : "Play"}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-ink text-white hover:bg-neutral-800 transition-colors"
                >
                  {isAutoplay ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" /></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5.14v14l11-7-11-7z" /></svg>
                  )}
                </button>

                <button type="button" onClick={nextReel} aria-label="Next reel" className="w-7 h-7 rounded-full flex items-center justify-center text-ink hover:bg-neutral-100 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>

                <div className="w-[1px] h-4 bg-line mx-0.5" />

                {/* Dots */}
                <div className="flex items-center gap-1.5 px-1">
                  {REELS.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectReel(i)}
                      aria-label={`Jump to ${r.title}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-5 bg-ink" : "w-1.5 bg-neutral-300 hover:bg-neutral-500"}`}
                    />
                  ))}
                </div>

                <div className="w-[1px] h-4 bg-line mx-0.5" />

                {/* View mode toggle */}
                <div className="flex items-center p-0.5 rounded-full bg-neutral-100 border border-line/70">
                  <button
                    type="button"
                    onClick={() => setViewMode("cylinder")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${viewMode === "cylinder" ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink"}`}
                  >
                    Cylinder
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("stack")}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${viewMode === "stack" ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink"}`}
                  >
                    Stack
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="relative z-30 mt-10 lg:mt-4 pt-6 border-t border-line/90">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-ink" />
                <span>Short-Form Creator Workflow</span>
              </div>
              <p className="text-[14px] leading-relaxed text-muted max-w-xl">
                Reelix helps creators find standout moments in long videos, generate captions, and preview vertical clips — a streamlined pipeline from raw footage to publish-ready Reels, Shorts, and TikToks.
              </p>
            </div>

            <div className="lg:col-span-6 flex flex-wrap items-center lg:justify-end gap-6 sm:gap-9">
              <div>
                <div className="font-[family-name:var(--font-display)] font-bold text-[19px] tracking-tight text-ink">6 Tools</div>
                <div className="font-mono text-[11px] text-muted">Creator Suite</div>
              </div>
              <div className="w-[1px] h-7 bg-line hidden sm:block" />
              <div>
                <div className="font-[family-name:var(--font-display)] font-bold text-[19px] tracking-tight text-ink">9:16</div>
                <div className="font-mono text-[11px] text-muted">Vertical Preview</div>
              </div>
              <div className="w-[1px] h-7 bg-line hidden sm:block" />
              <div>
                <div className="font-[family-name:var(--font-display)] font-bold text-[19px] tracking-tight text-ink">AI-Powered</div>
                <div className="font-mono text-[11px] text-muted">Clip Detection</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted">
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-display)] font-semibold text-ink">Reelix</span>
              <span>•</span>
              <span>SATHACK 2026 Project</span>
            </div>
            <div className="flex items-center gap-5">
              <button type="button" onClick={openPricing} className="hover:text-ink transition-colors">Pricing</button>
              <button type="button" onClick={() => openTool("clipper")} className="hover:text-ink transition-colors">Tools</button>
              <button type="button" onClick={openDemo} className="hover:text-ink transition-colors">Demo</button>
            </div>
          </div>
        </footer>
      </main>

      {/* ============ MODALS ============ */}
      <ModalRoot isOpen={modalType !== null} onClose={closeModal} maxWidth={modalMaxWidth}>
        {modalType === "pricing" && <PricingModal onClose={closeModal} toast={showToast} />}
        {modalType === "auth" && <AuthModal onClose={closeModal} toast={showToast} />}
        {modalType === "demo" && <DemoModal onClose={closeModal} onOpenAuth={openAuth} />}
        {modalType === "tool" && <ToolModal toolKey={activeToolKey} onClose={closeModal} onOpenAuth={openAuth} toast={showToast} />}
      </ModalRoot>

      {/* Toast */}
      <Toast msg={toastMsg} />
    </div>
  );
}
