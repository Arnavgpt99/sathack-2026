# Reelix — Intelligent Long-to-Short Video Engine

> Built for **SAT Hack 2026** · AI-Powered Video Discovery, Smart Moment Search & 9:16 Creator Studio

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.165-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://python.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3%20Flash-8E75C2?logo=google)](https://deepmind.google/technologies/gemini/)
[![Playwright](https://img.shields.io/badge/Playwright-18%2F18%20Passing-green?logo=playwright)](https://playwright.dev/)
[![Pytest](https://img.shields.io/badge/Pytest-63%2F63%20Passing-green?logo=pytest)](https://pytest.org/)

---

## 1. Executive Summary

**Reelix** is an end-to-end video clipping and timeline studio engineered to turn long-form recordings (podcasts, keynotes, interviews, educational lectures) into high-retention short-form content for TikTok, Instagram Reels, and YouTube Shorts.

Unlike generic automated clippers that naively cut arbitrary 30-second slices, Reelix combines **multimodal AI reasoning** (via Google Gemini 3 Flash) with **semantic transcript analysis** and **editorial studio tools** to identify true narrative arcs, viral opening hooks, and high-engagement moments.

---

## 2. Core Feature Highlights

### Multimodal AI Discovery & Analysis
- **Gemini 3 Flash Multimodal Engine**: Evaluates long-form video content and transcripts to generate clip suggestions with scored hooks, pacing metrics, and retention graphs.
- **YouTube Metadata & Transcript Resolution**: Real-time YouTube metadata fetching via oEmbed and automatic transcript parsing with graceful fallback algorithms.
- **Prototype-Honest Analytics**: Real-time interval calculations without synthetic padding, displaying explicit shortfall warnings when content duration is constrained.

### Smart Moment Search
- **Semantic Interval Search**: Query specific topics or keywords across full videos to extract contextual discussion blocks.
- **Interactive Interval Timeline**: Visual timeline strip rendering all detected segment timestamps with immediate embedded player synchronization.
- **One-Click Editor Handoff**: Instantly maps selected query intervals into the multi-track timeline studio.

### Responsive 9:16 Smartphone Studio
- **Mathematical 9:16 Vertical Cropping**: Implements precision iframe scaling (`calc(100% * 256 / 81)` = 316.05% width) to eliminate black bars and fill smartphone displays edge-to-edge.
- **Dual Framing Modes**:
  - `9:16 Full Fill`: Center-cropped edge-to-edge vertical bleed.
  - `16:9 Fit`: Preserves full widescreen video with a dynamic blurred ambient glow backdrop.
- **Mobile Inline Playback**: Enforces `playsinline=1` across embeds to prevent mobile operating systems from forcing native landscape video players.

### Timeline Studio & Editorial Workspace
- **High-FPS Audio Visualizer**: Procedural multi-scene canvas visualizer (Kinetic Waveform, Architectural Spotlight, Dual-Wave Split, and Noir Film Grain).
- **Interactive Presets**: Instantly switch between `Editorial Mono`, `Kinetic Pop`, `Noir Contrast`, `Split-Screen Dual`, and `Letterbox Film`.
- **Dynamic Subtitle Engine**: Word-synced animated subtitles supporting `Minimal Mono`, `Bold Kinetic`, `Subtitle Bar`, and `Karaoke Highlight`.
- **EDL Manifest Export**: Generates production-ready JSON Edit Decision List manifests for professional NLE workflows (DaVinci Resolve, Premiere Pro, Final Cut).

---

## 3. System Architecture

```
[ YouTube / Local Video URL ]
           │
           ▼
┌────────────────────────────────────────┐
│     Next.js 16 Frontend & UI Layer     │
│   • Studio Workspace & Configuration   │
│   • 9:16 Titanium Smartphone Frame    │
│   • Multi-Track Timeline & Audio Canvas│
│   • NextAuth v5 Google Authentication  │
└────────────────────────────────────────┘
           │
           │ Secure Internal API Proxy (/api/analyze, /api/jobs, /api/health)
           ▼
┌────────────────────────────────────────┐
│      FastAPI Python Microservice       │
│   • In-Memory Job State Machine        │
│   • YouTube Transcript & Meta Pipeline │
│   • Rate-Limited Background Workers    │
│   • OpenTelemetry Structured Tracing   │
└────────────────────────────────────────┘
           │
           │ Structured Multimodal Prompts
           ▼
┌────────────────────────────────────────┐
│      Google Gemini 3 Flash API         │
│   • Hook Detection & Narrative Pacing  │
│   • Retention Score & Falloff Curve    │
│   • Drop-off Rationale & Quotations    │
└────────────────────────────────────────┘
```

---

## 4. Repository Structure

```
.
├── app/                              # Next.js App Router
│   ├── api/                          # Server-side API routes & proxies
│   │   ├── analyze/                  # Analysis submission proxy
│   │   ├── auth/                     # NextAuth v5 authentication handlers
│   │   ├── health/                   # System health verification
│   │   ├── jobs/[id]/                # Polling & job status endpoint
│   │   └── metadata/                 # YouTube oEmbed metadata extraction
│   ├── login/                        # Clean monochrome authentication UI
│   ├── studio/                       # Creator Studio workspace
│   │   └── editor/                   # Multi-track Timeline Studio
│   ├── globals.css                   # Tailwind v4 theme & titanium chassis styles
│   ├── layout.tsx                    # Root layout with session provider
│   └── page.tsx                      # Architectural landing page
├── backend/                          # FastAPI Python Backend
│   ├── app/
│   │   ├── core/                     # Intervals & YouTube transcript logic
│   │   ├── providers/                # Gemini 3 Flash & metadata providers
│   │   ├── config.py                 # Application configuration & env parsing
│   │   ├── errors.py                 # Structured exception handlers
│   │   ├── jobs.py                   # Async job manager & worker pool
│   │   ├── main.py                   # FastAPI application entrypoint
│   │   ├── pipeline.py               # Video analysis pipeline orchestration
│   │   └── schemas.py                # Pydantic v2 domain models
│   ├── tests/                        # 63 backend pytest unit & integration tests
│   └── requirements.txt              # Production Python dependencies
├── components/                       # Modular React components
│   ├── editor/                       # Timeline dock, preview stage, clips deck
│   ├── studio/                       # Studio workspace, cards, moment search
│   └── reelix-landing.tsx            # Interactive 3D phone landing showcase
├── lib/                              # Client & shared utilities
│   ├── audio-engine.ts               # Synthesized Web Audio soundscape
│   ├── backend-proxy.ts              # Resilient fetch clients
│   ├── editor-store.ts               # Timeline state, formatters & YouTube helpers
│   └── sample-data.ts                # Built-in reference projects
├── tests/                            # 18 Playwright end-to-end automated tests
├── .env.example                      # Root environment template
└── package.json                      # Next.js configuration and scripts
```

---

## 5. Getting Started

### Prerequisites
- **Node.js**: v20 or newer
- **Python**: v3.11 or newer
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: Frontend Setup

1. Install Node dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Provide your values for `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` (optional for local mock auth).

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:3000`.

---

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure backend environment:
   ```bash
   cp .env.example .env
   ```
   Set `GEMINI_API_KEY` to your Google AI Studio API key and specify `GEMINI_MODEL=gemini-3-flash-preview` (or current available multimodal model).

5. Start the FastAPI microservice:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   API health verification: `http://127.0.0.1:8000/health`

---

## 6. Testing & Quality Assurance

Reelix maintains a dual-layer test suite with **81 automated tests** covering end-to-end browser journeys and backend API logic:

### Running Frontend End-to-End Tests
```bash
npx playwright test
```
- Validates 18 browser scenarios: landing navigation, sample analysis cycle, modal trimming, 9:16 stage playback, keyboard shortcuts, and EDL exports.

### Running Backend Unit & Integration Tests
```bash
cd backend
pytest
```
- Validates 63 test cases: Gemini prompt synthesis, transcript chunking, interval calculation, fallback handlers, and job queue concurrency.

### Running Linter & Build Validation
```bash
npm run lint
npm run build
```

---

## 7. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.4 (App Router, Turbopack, Partial Prerendering) |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide Icons, Custom Titanium Shaders |
| **Audio & Canvas** | Web Audio API (tactile synthesis), High-DPR HTML5 Canvas Engine |
| **Authentication** | NextAuth v5 (Auth.js) with Google OAuth 2.0 Provider |
| **Backend Framework** | FastAPI, Pydantic v2, Uvicorn, AnyIO |
| **AI & Multimodal** | Google Gemini 3 Flash Multimodal Developer API |
| **Testing** | Playwright (E2E), Pytest, ESLint 9 |

---

## 8. SAT Hack 2026 Submission Note

Reelix was designed and developed specifically for **SAT Hack 2026** to address creator workflow bottlenecks in transforming long-form content into high-performing short-form media.

All core components — from the AI pipeline to the responsive 9:16 mobile chassis and EDL manifest exporter — are functional, tested, and ready for evaluation.
