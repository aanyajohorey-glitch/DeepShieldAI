# DeepShield AI

An AI-powered cybersecurity platform for detecting deepfake videos, built as
an AI & Cybersecurity capstone project. DeepShield AI combines a modern
security-operations dashboard with a real, explainable deepfake-detection
pipeline powered by a pretrained Vision Transformer model.

## Overview

DeepShield AI lets an authenticated user upload a video and receive an
AI-generated authenticity verdict (`REAL` / `DEEPFAKE`), a confidence score,
a risk level, a plain-language explanation, a per-frame score breakdown, a
visual attention heatmap, and a downloadable branded PDF report — all inside
a polished, dark glassmorphism dashboard modeled on tools like Microsoft
Defender and CrowdStrike. The platform has been built in phases: Phase 1
established the UI/auth foundation, Phase 2 wired up real AI-powered video
analysis, Phase 3 hardened the product (tests, security, deployment
readiness), and Phase 4 made the AI pipeline explainable and more
production-grade (richer confidence signals, a visual explanation, PDF
reporting, structured logging, and centralized configuration).

## Problem Statement

Deepfake video content is increasingly difficult for people to identify by
eye, and there are few accessible, self-hostable tools that let someone
upload a clip and get a clear, *explainable* authenticity signal — most
either give a bare "real/fake" label or don't explain their reasoning at
all. DeepShield AI addresses this by pairing an approachable UI with an
open-source pretrained detection model and genuine explainability (not just
a confidence percentage), so a user can go from "is this video real?" to a
structured, justified answer in seconds, without needing ML expertise or
training infrastructure of their own.

## Features

### Phase 1 — Platform Foundation
- Landing page (hero, features, why-us, about, CTA)
- Email/password authentication with JWT sessions and protected routes
- Dashboard shell: stat cards, AI engine status, recent activity, notifications
- Profile and Settings pages (theme, notification preferences, security)
- Full dark/light glassmorphism design system (cyan/purple gradients, Framer Motion animations)
- Placeholder "coming soon" states for not-yet-built modules

### Phase 2 — Video Deepfake Detection
- Drag-and-drop video upload (MP4, MOV, AVI, MKV, up to 200MB) with live upload progress and cancel support
- Server-side video pipeline: validate → extract frames (OpenCV) → run AI inference → aggregate → persist result
- Pretrained Vision Transformer inference (Hugging Face `transformers`), loaded once at startup, CPU/GPU auto-detected
- Animated "Analyzing Video..." processing screen with staged status messages
- Results page: verdict card, circular confidence meter, risk badge, frame/timing/model metadata
- Scan history persisted per-user in SQLite
- Friendly error handling for invalid formats, oversized files, corrupted videos, and backend/model unavailability

### Phase 3 — Product Hardening
- **AI pipeline refactor**: model loading, preprocessing, and prediction split into a dedicated `app/ai/` package instead of one monolithic service file
- **Plain-language explanations**: every scan includes a data-derived `explanation` string, templated from the real computed scores, not a fabricated AI narrative
- **Magic-byte upload validation**: files are checked against their real container signature (MP4/MOV `ftyp`, AVI `RIFF...AVI `, MKV EBML header), not just their extension
- **Backend hardening**: structured request logging, a global exception handler, a rate limiter, GZip response compression
- **Detection History page**: a real `/history` page backed by the history API — paginated table, per-scan detail dialog, delete with confirmation
- **Downloadable reports**: one-click plain-text scan report, generated client-side
- **Automated tests & deployment readiness**: pytest + Vitest suites, Dockerfiles, `docker-compose.yml`

### Phase 4 — Explainable AI & Production Polish
- **Deeper pipeline refactor**: `app/ai/` split further into `inference.py` (raw model calls), `postprocessing.py` (verdict aggregation), `confidence.py` (statistics), `explainability.py` (XAI), and `prediction_service.py` (orchestrator) — each module has one job
- **Real Explainable AI, not invented categories**: the model is a single Real/Fake classifier, so DeepShield AI doesn't pretend it can label *why* (e.g. "compression artifact" vs "face-swap"). Instead it surfaces what the pipeline actually computes:
  - **Attention rollout heatmap** — a genuine XAI technique (Abnar & Zuidema, 2020) run on the ViT's own attention weights, visualizing which regions of the most-suspicious frame influenced the decision
  - **Per-frame score breakdown** — every sampled frame's individual fake-likelihood, charted
  - **Temporal consistency** — how much the sampled frames agreed with each other (low agreement can mean partial manipulation)
  - **Model certainty** — how far the result sits from the decision threshold (distinct from confidence-in-predicted-class)
  - **Supplementary sharpness heuristic** — Laplacian-variance blur analysis, a well-known weak signal from deepfake-forensics literature, clearly labeled as supplementary
- **Video metadata extraction**: resolution, duration, fps, frame count, and codec, read via OpenCV and surfaced in both the dashboard and PDF report
- **Branded PDF reports**: a professional, downloadable PDF (report ID, verdict, all confidence/consistency stats, file metadata, disclaimer) generated server-side with `reportlab`, in addition to the existing text report
- **Model management**: a `ModelManager` class (load, validate output contract, and — for future phases — hot-swap to a different Hugging Face model) behind the same stable module functions the rest of the app already calls
- **Structured file logging**: rotating log files under `backend/logs/`, capturing startup, uploads, predictions, and errors
- **Fully centralized configuration**: every previously-hardcoded value (rate limits, frame resize cap, log level) now lives in `Settings`
- **Performance**: oversized frames are downscaled before color conversion/inference; the model, tokenizer, and image processor are still loaded exactly once at startup
- **Expanded tests**: 29 backend pytest tests (including large-file rejection, corrupted-media handling, PDF generation, and model-manager validation) and 37 frontend Vitest tests

## Technologies Used

**Languages:** TypeScript, Python

**Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts, Lucide React, next-themes

**Backend:** FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2, python-jose (JWT), bcrypt

**AI/ML:** Hugging Face `transformers`, PyTorch (CPU by default, GPU if available), OpenCV (`opencv-python-headless`), Pillow

**Reporting:** ReportLab (server-side PDF generation)

**Testing:** pytest + httpx (backend), Vitest + React Testing Library (frontend)

**Deployment:** Docker, Docker Compose

## System Architecture

```
┌────────────────────┐        HTTPS/JSON         ┌──────────────────────┐
│   Next.js Frontend  │ ─────────────────────────▶│   FastAPI Backend     │
│  (App Router, RSC)  │◀───────────────────────── │                       │
└─────────┬───────────┘        JWT bearer          └───────────┬───────────┘
          │                                                     │
          │ cookie-based session (ds_token)                     │ SQLAlchemy ORM
          ▼                                                     ▼
   Next.js middleware                                    ┌──────────────┐
   (route protection)                                     │  SQLite DB   │
                                                            │ users,       │
                                                            │ detections   │
                                                            └──────────────┘
                                                                     ▲
                                                                     │ orchestrates
                                                            ┌────────┴────────┐
                                                            │ detection_service │
                                                            │  (validate, save, │
                                                            │   persist, query) │
                                                            └────────┬────────┘
                                                                     ▼
                                                        ┌────────────────────────┐
                                                        │        app/ai/          │
                                                        │ preprocessing.py         │
                                                        │  frame extraction,       │
                                                        │  magic-byte validation,  │
                                                        │  video metadata          │
                                                        │ inference.py             │
                                                        │  raw batched model calls │
                                                        │ postprocessing.py        │
                                                        │  score → verdict         │
                                                        │ confidence.py            │
                                                        │  certainty / consistency │
                                                        │ explainability.py        │
                                                        │  attention heatmap,      │
                                                        │  heuristics, explanation │
                                                        │ prediction_service.py    │
                                                        │  orchestrates the above  │
                                                        │ model_loader.py          │
                                                        │  ModelManager singleton, │
                                                        │  loaded once at startup  │
                                                        └────────────────────────┘
                                                                     │
                                                                     ▼
                                                        ┌────────────────────────┐
                                                        │      app/reports/        │
                                                        │ pdf_report.py — branded  │
                                                        │  PDF template (ReportLab)│
                                                        └────────────────────────┘
```

- **Frontend** — Next.js App Router with route groups: public marketing
  pages, `/login` and `/register`, and an authenticated `(app)` group
  (dashboard, detection, history, settings, profile, etc.) guarded by both
  Next.js middleware (edge-level cookie check) and a client-side `ProtectedRoute`.
- **Backend** — FastAPI app organized by concern: `api/routes` (HTTP layer),
  `services` (request orchestration), `ai` (model loading, preprocessing,
  inference, postprocessing, confidence, explainability — pure AI concerns),
  `reports` (PDF templates), `db/models` (SQLAlchemy tables), `schemas`
  (Pydantic request/response contracts), `utils` (logging, rate limiting).
- **AI model** — A Hugging Face `image-classification` pipeline is loaded
  once during the FastAPI `lifespan` startup hook via `ModelManager` (never
  per-request) and reused for every scan. The heatmap pass temporarily
  switches the model's attention implementation from the default fused
  `sdpa` kernel (fast, but doesn't expose attention weights) to `eager`
  just for that one forward pass, then switches back — regular inference
  is unaffected.
- **Static files** — attention heatmaps are saved under `backend/static/`
  and served directly by FastAPI's `StaticFiles` at `/static/...`.
- **Database/API flow** — Frontend calls `/api/auth/*` and
  `/api/detection/*` with a JWT bearer token; FastAPI validates the token,
  runs the request against SQLite via SQLAlchemy, and returns camelCase JSON
  (via a shared Pydantic `CamelModel`) that matches the frontend's
  TypeScript types 1:1.

## Explainable AI Workflow

DeepShield AI's model is a binary Vision Transformer classifier — it scores
each frame as Real or Fake, nothing more granular. Rather than inventing
manipulation categories it can't actually detect, the explainability layer
builds a genuinely informative picture from what the pipeline *does*
compute:

```
Sampled frames
      ↓
inference.py → one fake-likelihood score per frame (raw model output)
      ↓
postprocessing.py → aggregate scores into an overall REAL/DEEPFAKE verdict
      ↓
confidence.py → confidence %, risk level, temporal consistency (score
                 variance across frames), model certainty (distance from
                 the decision threshold)
      ↓
explainability.py →
   • attention rollout on the most-suspicious frame (real ViT attention
     weights, not a generic saliency approximation) → heatmap image
   • supplementary sharpness heuristic (Laplacian variance)
   • a plain-language explanation stitching all of the above together,
     including an explicit note that manipulation *type* isn't identified
      ↓
Persisted + returned: verdict, confidence, risk level, per-frame scores,
temporal consistency, model certainty, heuristics, heatmap URL, explanation
```

This is surfaced in the UI as: a verdict card, a circular confidence meter,
a per-frame bar chart, a certainty/consistency panel, the attention heatmap
image, and the full analysis-summary paragraph — plus all of it in the
downloadable PDF report.

## Complete Workflow

```
User uploads a video (drag-and-drop or browse)
        ↓
Frontend validation (extension + size, instant feedback)
        ↓
Streaming upload to the backend (real progress bar, cancel supported)
        ↓
Backend re-validates: extension, magic-byte signature, size, rate limit
        ↓
OpenCV extracts video metadata (resolution, fps, duration, codec) and
sampled frames (configurable sampling, oversized frames downscaled first)
        ↓
Pretrained ViT model runs batched inference on the sampled frames
        ↓
Scores are aggregated → verdict, confidence, risk level
        ↓
Confidence stats computed → temporal consistency, model certainty
        ↓
Explainability generated → attention heatmap, heuristics, explanation text
        ↓
Result persisted to SQLite, scoped to the requesting user; structured logs
written for the upload and the prediction
        ↓
JSON response returned to the frontend
        ↓
Results dashboard renders: verdict card, confidence meter, analysis
summary, per-frame chart, certainty/consistency panel, attention heatmap,
full metadata grid — with downloadable text and PDF reports
        ↓
The scan is now visible in Detection History for later review or deletion
```

## Project Structure

```
DeepShieldAI/
├── datasets/                 Dataset documentation (see Dataset section below)
│   ├── README.md
│   ├── dataset_info.md
│   ├── raw/                  Empty — reserved for future local datasets (gitignored)
│   └── processed/            Empty — reserved for future processed data (gitignored)
├── models/                   No weights stored in git — see models/README.md
│   ├── README.md
│   ├── trained/               Reserved for future fine-tuned model exports (gitignored)
│   ├── checkpoints/           Reserved for future training checkpoints (gitignored)
│   ├── configs/                Reserved for future model config files (gitignored)
│   └── weights/                Reserved for future local weight files (gitignored)
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── ai/                 AI concerns only:
│   │   │                         model_loader.py — ModelManager singleton
│   │   │                         preprocessing.py — validation, frame extraction, video metadata
│   │   │                         inference.py — raw batched model calls
│   │   │                         postprocessing.py — score → verdict aggregation
│   │   │                         confidence.py — certainty / temporal consistency stats
│   │   │                         explainability.py — attention heatmap, heuristics, explanation text
│   │   │                         prediction_service.py — orchestrates the above
│   │   │                         errors.py
│   │   ├── api/routes/        HTTP endpoints (auth, detection, health)
│   │   ├── core/              Config (Settings) and security (JWT, hashing)
│   │   ├── db/                 SQLAlchemy engine/session and models (User, Detection)
│   │   ├── reports/            pdf_report.py — branded PDF template (ReportLab)
│   │   ├── schemas/            Pydantic request/response models
│   │   ├── services/           Request orchestration (auth_service, detection_service)
│   │   ├── utils/               logging_config.py, rate_limit.py
│   │   └── main.py             App factory, middleware, exception handler, static mount, router mounting
│   ├── static/heatmaps/        Generated attention heatmap images (gitignored)
│   ├── logs/                    Rotating application log files (gitignored)
│   ├── tests/                   pytest suite (health, auth, detection, model manager)
│   ├── requirements.txt
│   ├── requirements-dev.txt    Adds pytest + httpx for running tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/                  Next.js 15 application
│   ├── src/
│   │   ├── app/                Routes: landing, auth, and the authenticated (app) group
│   │   ├── components/         ui/ (design system), layout/, landing/, dashboard/, detection/, history/, settings/, auth/
│   │   ├── context/             AuthContext (session state)
│   │   ├── lib/                 API client, constants, utils, report generator
│   │   ├── hooks/                useAuth, useToast, useLocalStorage, useOnClickOutside
│   │   ├── types/                 Shared TypeScript types
│   │   ├── test-utils/             Shared test fixtures
│   │   └── middleware.ts          Edge-level route protection
│   ├── *.test.ts(x)            Vitest + React Testing Library tests, colocated with the code they cover
│   ├── Dockerfile
│   └── vitest.config.ts
├── docker-compose.yml
├── README.md
└── .gitignore
```

> Note: `backend/requirements.txt` is the actual dependency manifest (run
> from inside `backend/`) — it is not duplicated at the repo root, to avoid
> two files drifting out of sync.

## Dataset

DeepShield AI's detector uses a **pretrained** Hugging Face model for
inference only — this repository does not train a model and does not ship
a training dataset. Full details, including what is/isn't known about the
pretrained model's original training data, how to regenerate lightweight
test clips for local QA, and how to obtain a real evaluation dataset if you
want to benchmark accuracy, are documented in:

- [`datasets/README.md`](./datasets/README.md) — purpose, current status, and data flow
- [`datasets/dataset_info.md`](./datasets/dataset_info.md) — the pretrained model's documented training data, classes, and preprocessing
- [`models/README.md`](./models/README.md) — which model is loaded, the `ModelManager`, and how to swap models

## Installation

### Prerequisites
- Python 3.11+ (developed on 3.14)
- Node.js 18.18+ (developed on Node 24)
- ~2GB free disk space for the PyTorch + Hugging Face model download on first run

### Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\pip.exe install -r requirements.txt
copy .env.example .env
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The first startup downloads the pretrained model (~330MB) from the Hugging
Face Hub and caches it locally; subsequent restarts are fast. API docs are
available at `http://localhost:8000/docs`.

### Frontend setup

```powershell
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

App available at `http://localhost:3000`.

## Environment Variables

Neither `.env` file is committed — copy the `.example` file in each folder
and adjust as needed. No secrets ship in this repo; `SECRET_KEY` below must
be replaced with your own value before any real deployment.

**`backend/.env`** (copy from `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `APP_NAME`, `ENVIRONMENT` | App metadata shown on `/api/health` |
| `DATABASE_URL` | SQLAlchemy connection string (defaults to local SQLite) |
| `SECRET_KEY` | JWT signing secret — **replace before deploying** |
| `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT configuration |
| `CORS_ORIGINS` | Allowed frontend origins |
| `DETECTION_MODEL_NAME` | Hugging Face model id to load for inference |
| `DETECTION_UPLOAD_DIR` | Temp directory for in-flight uploads (auto-cleaned) |
| `DETECTION_MAX_UPLOAD_MB` | Upload size cap |
| `DETECTION_FRAME_SAMPLE_SECONDS`, `DETECTION_MAX_FRAMES` | Frame sampling rate/cap |
| `DETECTION_FAKE_THRESHOLD` | Score threshold for a `DEEPFAKE` verdict |
| `DETECTION_MAX_FRAME_DIMENSION` | Frames larger than this (px, longest edge) are downscaled before inference |
| `DETECTION_ENABLE_HEATMAP` | Toggle the attention-heatmap XAI pass (adds one extra forward pass per scan) |
| `HEATMAP_DIR` | Where generated heatmap PNGs are saved and served from |
| `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` | Per-user cap on `/detection/analyze` calls |
| `LOG_DIR`, `LOG_LEVEL` | Rotating log file location and verbosity |

**`frontend/.env.local`** (copy from `frontend/.env.local.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL the frontend calls for the FastAPI backend |

## Usage Instructions

1. Start the backend and frontend (see Installation above).
2. Visit `http://localhost:3000`, click **Get Started**, and register an account.
3. From the dashboard sidebar, open **Detection**.
4. Drag and drop a video (or click to browse) — MP4, MOV, AVI, or MKV, up to 200MB.
5. Click **Analyze Video** and watch the live upload progress, then the animated analysis screen.
6. Review the result: verdict, confidence meter, model certainty, temporal consistency, per-frame chart, attention heatmap, analysis summary, and full file/video metadata. Download a text or PDF report.
7. Open **History** in the sidebar to browse, review, or delete past scans — the same rich detail view is available from there too.
8. Explore Settings/Profile as needed.

## Testing

### Backend (pytest)

```powershell
cd backend
.\venv\Scripts\pip.exe install -r requirements-dev.txt
.\venv\Scripts\python.exe -m pytest -v
```

29 tests, run against an isolated SQLite file (never your dev
`deepshield.db`), exercising the **real** AI model end-to-end: a full
upload → frame extraction → inference → aggregation → explainability pass
on a small synthetic video generated on the fly; auth; large-file and
corrupted-media rejection; PDF report generation; model-manager validation;
and authorization-scoping checks (a user can't view, delete, or download a
report for another user's scans).

### Frontend (Vitest + React Testing Library)

```powershell
cd frontend
npm run test
```

37 tests covering formatting/validation utilities, the report generator,
and key UI components — including the new per-frame chart, confidence
panel, and attention-heatmap components.

## Deployment

### Docker (recommended)

Dockerfiles are provided for both services (`backend/Dockerfile`,
`frontend/Dockerfile`, multi-stage using Next's `standalone` output) along
with a root `docker-compose.yml`. **These have not been verified with an
actual Docker build in this environment** (Docker isn't installed here) —
review them before relying on them in production. If you add a persistent
volume for the backend's `static/` and `logs/` directories, generated
heatmaps and logs will survive container restarts too (only the SQLite
database is currently volume-mounted).

```powershell
$env:SECRET_KEY = "generate-a-long-random-value"
docker compose up --build
```

This builds and starts both services: backend on `:8000`, frontend on
`:3000`. The SQLite database persists in a named volume (`backend_data`)
across container restarts.

### Manual / non-Docker deployment

- **Backend**: run behind a production ASGI setup (e.g. `uvicorn` with
  multiple workers behind a reverse proxy, or Gunicorn with the
  `uvicorn.workers.UvicornWorker` class). Set `ENVIRONMENT=production`,
  a real `SECRET_KEY`, and `CORS_ORIGINS` restricted to your actual frontend
  domain. The in-memory rate limiter and model singleton are per-process —
  running multiple workers means each gets its own copy of both (multiple
  model loads = more memory; rate limits become per-worker, not global).
- **Frontend**: `npm run build && npm start`, or deploy the standalone
  output (`.next/standalone`) directly. Set `NEXT_PUBLIC_API_URL` to your
  deployed backend's public URL **at build time** (it's inlined into the
  client bundle, not read at runtime).
- **Database**: SQLite is fine for a single-instance deployment; for
  anything with concurrent writers at scale, migrate to Postgres by
  changing `DATABASE_URL` (SQLAlchemy handles the rest, though you'll want
  to add a migration tool — see Future Improvements).

### Production checklist

- [ ] Generate a fresh `SECRET_KEY` (never reuse the example/dev value)
- [ ] Set `CORS_ORIGINS` to your real frontend origin(s) only
- [ ] Set `NEXT_PUBLIC_API_URL` to your real backend URL before building the frontend
- [ ] Put the backend behind HTTPS (a reverse proxy like Caddy/nginx is the simplest path)
- [ ] Confirm `.env` files are not committed (they aren't tracked — see `.gitignore`)
- [ ] Decide whether `static/` (heatmaps) and `logs/` need persistent volumes for your deployment

## Future Improvements

- Build out the Analytics page against the existing detection history data
- Fine-tune a model on a modern deepfake dataset to address the concept-drift limitation noted in `datasets/dataset_info.md`
- Add an AI assistant that can explain a specific scan result conversationally
- Add real-time progress streaming (WebSocket/SSE) instead of the current single request/response cycle
- Support audio and image deepfake detection (explicitly out of scope so far)
- Add password reset, email verification, and two-factor authentication
- Add a database migration tool (e.g. Alembic) — schema changes currently require recreating the local dev database
- Move the rate limiter and model cache to a shared store (e.g. Redis) if scaling to multiple backend workers
- Re-introduce a face-presence heuristic using `cv2.FaceDetectorYN` (OpenCV 5 dropped the bundled Haar cascades this project originally used) — deferred because it requires downloading and caching an external ONNX model
- Support multiple/ensemble models via the `ModelManager`'s existing `switch_model()` capability, once a second model is worth adding
