import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Server-only. The backend URL and shared key never reach the browser.
const BACKEND_URL = (process.env.REELIX_BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

export function failure(status: number, code: string, message: string) {
  return NextResponse.json({ detail: { code, message } }, { status });
}

export async function proxyToBackend(
  path: string,
  init: { method: "GET" | "POST" | "DELETE"; body?: string }
): Promise<NextResponse> {
  // Allow health check without session requirement
  const isHealth = path === "/api/v1/health";

  // Protects the Gemini quota. Set REELIX_REQUIRE_AUTH=false to disable while testing locally.
  if (!isHealth && process.env.REELIX_REQUIRE_AUTH !== "false") {
    const session = await auth();
    if (!session?.user) return failure(401, "unauthorized", "Sign in to analyze videos.");
  }

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.REELIX_BACKEND_KEY ? { "X-Reelix-Key": process.env.REELIX_BACKEND_KEY } : {}),
      },
      body: init.body,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return failure(502, "backend_unreachable", "The analysis service is not reachable.");
  }
}
