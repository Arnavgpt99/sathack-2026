import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { detail: { code: "invalid_request", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }
  return proxyToBackend("/api/v1/analyze", { method: "POST", body: JSON.stringify(body) });
}
