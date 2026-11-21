import { failure, proxyToBackend } from "@/lib/backend-proxy";

const JOB_ID = /^[a-f0-9]{32}$/; // backend job ids are uuid4 hex; reject anything else before proxying

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!JOB_ID.test(id)) return failure(404, "job_not_found", "Unknown or expired job.");
  return proxyToBackend(`/api/v1/jobs/${id}`, { method: "GET" });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!JOB_ID.test(id)) return failure(404, "job_not_found", "Unknown or expired job.");
  return proxyToBackend(`/api/v1/jobs/${id}`, { method: "DELETE" });
}
