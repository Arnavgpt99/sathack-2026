# Reelix backend — final version

Unzip over the repo root. It adds `backend/` and changes 8 frontend files (list at bottom). Existing UI, routes and design are untouched except two tiny honesty fixes.

## Run it

```bash
# 1. backend
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env     # fill GEMINI_API_KEY, GEMINI_MODEL, REELIX_BACKEND_KEY, then export them (or use your shell's env loader)
uvicorn app.main:app --port 8000                       # ONE worker — job state is in-process

# 2. frontend (repo root): add the 3 vars from .env.example to .env.local, then
npm.cmd run dev        # npm run dev on mac/linux
```

`GEMINI_MODEL` is intentionally blank: model names change, so paste a current video-capable model id from the Gemini docs.

**Do this before anything else (10 minutes):** with the backend up, analyze a *short* public YouTube video from `/studio`. If that works, the whole chain (Next proxy → FastAPI → Gemini) is proven on your key. Then try your long video. Check `GET http://127.0.0.1:8000/api/v1/health` to see whether Gemini is configured.

## What it does

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health` | status, whether Gemini is configured |
| `POST /api/v1/analyze` | start a job → `202` + job. `mode`: `clip_discovery` (default, what Studio uses) or `timeline_search` |
| `GET /api/v1/jobs/{id}` | real phase + status + result/error |
| `DELETE /api/v1/jobs/{id}` | cancel (wired to the Cancel button) |

The browser only talks to `/api/analyze` and `/api/jobs/{id}` on Next.js; those check the user is signed in and add the secret header. JSON is camelCase to match `types/studio.ts`.

**Smart Moment Search** (`timeline_search`): send `targetEntity`, `condition`, `targetTotalDurationSec` (1200 for 20 min). You get `allDetectedIntervals` (everything found) separate from `selectedIntervals` (the subset that fills the budget), each with original timestamps, status, evidence, plus `selectedDurationSec`, `targetMet`, `shortfallSec` and warnings. Selection is exact to the millisecond, trims only the last interval, never pads, and reports a real shortfall.

## Honest limits — say these out loud in the demo, don't hide them

- **YouTube only** (public videos, via Gemini's YouTube-URL input). Vimeo/Twitch/MP4 links return a clear error. No uploads, no MP4 rendering, no downloading. The export is still the manifest/EDL.
- **Model-only evidence.** Intervals are candidates, not an exhaustive scan. Status is never `verified` (reserved for OCR/ball-by-ball/human checks that are *not built*). `high` confidence → `probable`; `medium`/`low` → `uncertain`. Selection counts only `probable`+ by default, so `uncertain` intervals are listed but not selected. Use a demo video where you've hand-noted the real intervals so you know the recall.
- **Clip scores are the model's opinion**, not analytics. `retentionPoints` is empty and the retention sparkline is hidden rather than faked.
- **Timeline Search has no UI yet.** The backend and `studioService.timelineSearch()` are done and typed; there's no form/timeline view in Studio.
- Agentic video mode (`processing: "agentic"`) is **not used**: I couldn't verify its request shape for this path. Treat it as an experiment after the smoke test works.
- Jobs/cache live in memory: lost on restart, single worker only.
- Sample fallback only triggers for the built-in sample sources or when the backend is unreachable/unconfigured, and then shows a "SAMPLE clips" toast. Real errors (quota, bad link, model error) are shown as errors.

## Tests

```bash
cd backend
python -m unittest discover -s tests -t .      # no installs needed for the core
pip install -r requirements-dev.txt && pytest   # also runs the 8 HTTP-level tests
```

Run in my sandbox: **63 tests, 55 passed, 8 skipped** (the HTTP-level tests need `fastapi`+`httpx`, which couldn't be installed there). Covered: interval parsing/merging/clipping, 30-min→exactly 20:00, 17:30→2:30 shortfall, gaps, trimming, YouTube URL hardening, Gemini retries/errors (fake and real local HTTP), both pipelines, cache-key separation, job lifecycle/cancel/limits. Frontend: `lib/studio-service.ts` type-checks under `strict`; the other touched files parse, but I could not run `npm run build`, lint, or Playwright (no `node_modules`). **`app/main.py` and the Next route handlers have not been executed** — run the commands above and `npm run build` first. Your `AGENTS.md` warns this Next version has breaking changes; the route handlers use the `params: Promise<…>` form.

## Security — please read

- Your zip contained **`.env.local` with real-looking Google OAuth credentials and AUTH_SECRET**. Don't share it again, and rotate the Google client secret if the zip went anywhere public.
- `auth.ts` has a hardcoded fallback `AUTH_SECRET` and `debug: true`. Fine locally; remove both before any public deploy.

## Files changed

`types/studio.ts`, `lib/studio-service.ts`, `components/studio/{studio-workspace,clip-card,clip-editor-modal}.tsx`, `.env.example` — modified. `lib/backend-proxy.ts`, `app/api/analyze/route.ts`, `app/api/jobs/[id]/route.ts` — new. The studio-workspace change is two small edits (sample/warning toast; show the real error message). The clip-card and editor-modal changes only hide the retention sparkline when there's no data.
