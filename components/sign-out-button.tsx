"use client";

import { signOut } from "next-auth/react";
import React, { useState } from "react";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Sign-out failed", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleSignOut}
      className={
        className ||
        "px-3.5 py-1.5 rounded-full border border-line bg-white hover:bg-neutral-100 text-xs font-medium text-muted hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
      }
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
