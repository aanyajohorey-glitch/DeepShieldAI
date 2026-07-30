# DeepShield AI

**Version 1.1 — Dual Detection System**

An AI-powered cybersecurity platform for detecting deepfake images and
videos, built as an AI & Cybersecurity capstone project. DeepShield AI
combines a modern security-operations dashboard with two purpose-built,
explainable deepfake-detection pipelines — a Vision Transformer for still
images and a frequency-domain CNN (F3-Net) for video — chosen automatically
based on what's uploaded, with no manual model selection.

## Overview

DeepShield AI lets an authenticated user upload a video **or a still image**
and receive an AI-generated authenticity verdict (`REAL` / `DEEPFAKE`), a
confidence score, a risk level, a plain-language explanation, a per-frame
score breakdown (video) or single-frame score (image), and a downloadable
branded PDF report — all inside a polished, dark glassmorphism dashboard
modeled on tools like Microsoft Defender and CrowdStrike. Which detector
runs is chosen automatically from the file extension; the user never picks
a model.

The platform was built in six phases: Phase 1 established the UI/auth
foundation, Phase 2 wired up real AI-powered video analysis, Phase 3
hardened the product (tests, security, deployment readiness), Phase 4 made
the AI pipeline explainable and production-grade, Phase 5 finalized it as a
polished, deployable v1.0 (production configuration for Vercel and Render, a
security audit, performance tuning, complete documentation), and Phase 6
added still-image detection and replaced the video pipeline with a
purpose-built video-forgery model (F3-Net) instead of running the image
classifier per-frame.

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
- **Expanded tests**: 29 backend pytest tests and 37 frontend Vitest tests

### Phase 5 — Final Release: Polish, Performance, Deployment
- **Production deployment configuration**: a Render `render.yaml` blueprint (Docker-based backend service, health check, auto-generated `SECRET_KEY`) and a documented zero-config Vercel setup for the frontend — see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- **Production-safe configuration**: the app now **refuses to start** if `ENVIRONMENT=production` and `SECRET_KEY` is still the public placeholder value, so it's impossible to accidentally deploy with a forgeable JWT secret; `CORS_ORIGINS` now accepts a plain comma-separated string (not just a JSON array), since that's what most PaaS environment-variable UIs expect
- **Frontend performance**: chart components (Recharts-based) are now lazy-loaded via `next/dynamic` instead of bundled into every route — cut First Load JS on `/dashboard`, `/detection`, and `/history` by roughly 110KB each
- **Backend performance**: added a composite database index on `(user_id, created_at)` for history queries
- **Bug fix**: deleting a scan now also deletes its attention-heatmap file from disk — previously only the database row was removed, leaking image files over time
- **UI polish**: per-route browser tab titles across the authenticated app, a real favicon matching the brand, dead placeholder footer links replaced with real ones (GitHub source/issues), stale marketing copy corrected
- **Security audit**: re-confirmed no secrets in source control, hardened `.dockerignore`, fixed a `.gitignore` gap that excluded `frontend/.env.local.example` from git entirely (it had never actually been committed)
- **Documentation**: this README rewritten as the v1.0 reference, plus a dedicated step-by-step [deployment guide](./docs/DEPLOYMENT.md)
- **Expanded tests**: 38 backend pytest tests and 37 frontend Vitest tests

### Phase 6 — Dual Detection System (Image + Video)
- **Automatic file-type routing**: uploads are classified by extension — `.jpg`/`.jpeg`/`.png`/`.webp` → image detector, `.mp4`/`.mov`/`.avi`/`.mkv` → video detector — with no manual model choice, via `app/ai/preprocessing.py`'s `classify_file_type()`
- **Still-image detection**: the existing dima806 ViT classifier now has its own dedicated entry point (`app/ai/image_detector.py`) for actual photo uploads, reusing the same confidence/risk/heuristics/PDF machinery as before
- **New video detector — F3-Net**: replaced the old "run the image classifier on every frame" approach with [F3-Net](https://github.com/SCLBD/DeepfakeBench) (Frequency in Face Forgery Network), a real published face-forgery detector using a frequency-domain decomposition (DCT-based band-pass filters) feeding an Xception backbone — a fundamentally different architecture from the image pipeline, chosen because per-frame still-image classification has no way to use frequency-domain forgery signal
- **Face-aware video preprocessing**: sampled frames are now face-detected and cropped (via [MTCNN](https://github.com/timesler/facenet-pytorch)) before being scored — frames with no visible face are skipped rather than fed to the model blind; a video with no detectable face in any frame is rejected with a clear error rather than silently scored on noise
- **Automatic model weight management**: F3-Net's checkpoint (~86MB) downloads automatically from DeepfakeBench's GitHub release on first use and is cached in `models/weights/` — never committed to git, matching the existing pattern for the image model
- **Both models load once at startup**, mirrored in a new `VideoModelManager` alongside the existing image `ModelManager` — no per-request reloading for either
- **Honest scope on preprocessing**: DeepfakeBench's original preprocessing uses `dlib`, which has no prebuilt wheel for this project's Python version and would require a full C++ build toolchain to compile from source. MTCNN (pure PyTorch, pip-installable) is used instead — verified against real face photos to produce correct detections before being wired into the pipeline. See `models/README.md` for the full writeup, including the **CC BY-NC 4.0 (non-commercial) license** on the F3-Net checkpoint
- **No attention heatmap for video results**: F3-Net has no transformer attention to roll out (the existing heatmap technique is ViT-specific), so video results honestly omit it rather than fabricating a visualization the model doesn't support — image results still get one
- **Expanded tests**: 46 backend pytest tests (image upload/routing, F3-Net video inference through the real HTTP API, no-face rejection, image-specific PDF generation) and unchanged 37 frontend Vitest tests

## Technologies Used

**Languages:** TypeScript, Python

**Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts (lazy-loaded), Lucide React, next-themes

**Backend:** FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2, python-jose (JWT), bcrypt

**AI/ML:** Hugging Face `transformers` (image model), PyTorch + torchvision (CPU by default, GPU if available), F3-Net (vendored, video model — DeepfakeBench), facenet-pytorch/MTCNN (face detection), OpenCV (`opencv-python-headless`), Pillow

**Reporting:** ReportLab (server-side PDF generation)

**Testing:** pytest + httpx (backend), Vitest + React Testing Library (frontend)

**Deployment:** Vercel (frontend), Render (backend, Docker runtime), Docker Compose (self-hosted alternative)

## Architecture

```
┌────────────────────┐        HTTPS/JSON         ┌──────────────────────┐
│   Next.js Frontend  │ ─────────────────────────▶│   FastAPI Backend     │
│  (Vercel)            │◀───────────────────────── │   (Render, Docker)    │
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
                                                        │  routing (image/video),  │
                                                        │  magic-byte validation,  │
                                                        │  frame/image extraction  │
                                                        │                          │
                                                        │  ── image path ──        │
                                                        │ image_detector.py        │
                                                        │  → inference.py          │
                                                        │    (dima806 ViT)         │
                                                        │                          │
                                                        │  ── video path ──        │
                                                        │ video_detector.py        │
                                                        │  → face_detection.py     │
                                                        │    (MTCNN crop)          │
                                                        │  → models/f3net.py       │
                                                        │    (F3-Net, DeepfakeBench)│
                                                        │                          │
                                                        │  ── shared ──            │
                                                        │ postprocessing.py        │
                                                        │  score → verdict         │
                                                        │ confidence.py            │
                                                        │  certainty / consistency │
                                                        │ explainability.py        │
                                                        │  attention heatmap*,     │
                                                        │  heuristics, explanation │
                                                        │ prediction_service.py    │
                                                        │  orchestrates the above  │
                                                        │ model_loader.py          │
                                                        │  ModelManager (image) +  │
                                                        │  VideoModelManager,      │
                                                        │  both loaded at startup  │
                                                        └────────────────────────┘
                                                                     │
                                                                     ▼
                                                        ┌────────────────────────┐
                                                        │      app/reports/        │
                                                        │ pdf_report.py — branded  │
                                                        │  PDF template (ReportLab)│
                                                        └────────────────────────┘
```
*Attention heatmaps are only generated for image results — F3-Net (video)
has no transformer attention to roll out.

- **Frontend** — Next.js App Router with route groups: public marketing
  pages, `/login` and `/register`, and an authenticated `(app)` group
  (dashboard, detection, history, settings, profile, etc.) guarded by both
  Next.js middleware (edge-level cookie check) and a client-side `ProtectedRoute`.
  Chart-heavy components are code-split with `next/dynamic` so Recharts
  only loads on the routes that render a chart.
- **Backend** — FastAPI app organized by concern: `api/routes` (HTTP layer),
  `services` (request orchestration), `ai` (model loading, preprocessing,
  inference, postprocessing, confidence, explainability — pure AI concerns),
  `reports` (PDF templates), `db/models` (SQLAlchemy tables), `schemas`
  (Pydantic request/response contracts), `utils` (logging, rate limiting).
- **Two AI models, chosen automatically** — `app/ai/preprocessing.py`
  classifies every upload as `image` or `video` from its extension and
  routes it accordingly; the user never selects a model.
  - **Image** — a Hugging Face `image-classification` pipeline
    (`dima806/deepfake_vs_real_image_detection`), loaded once during the
    FastAPI `lifespan` startup hook via `ModelManager`. The heatmap pass
    temporarily switches the model's attention implementation from the
    default fused `sdpa` kernel (fast, but doesn't expose attention weights)
    to `eager` just for that one forward pass, then switches back —
    regular inference is unaffected.
  - **Video** — F3-Net (a real published face-forgery detector from
    DeepfakeBench), loaded once via a separate `VideoModelManager`. Sampled
    frames are face-cropped with MTCNN first; F3-Net decomposes each crop
    into frequency bands (DCT-based band-pass filters) before an Xception
    backbone scores it. The checkpoint is DeepfakeBench's own released
    weights, downloaded automatically on first use — nothing is trained.
- **Static files** — attention heatmaps (image results only) are saved
  under `backend/static/` and served directly by FastAPI's `StaticFiles`
  at `/static/...`.
- **Database/API flow** — Frontend calls `/api/auth/*` and
  `/api/detection/*` with a JWT bearer token; FastAPI validates the token,
  runs the request against SQLite via SQLAlchemy, and returns camelCase JSON
  (via a shared Pydantic `CamelModel`) that matches the frontend's
  TypeScript types 1:1.
- **Deployment topology** — the frontend and backend are deployed as two
  independent services (Vercel + Render) that talk to each other over
  plain HTTPS/JSON; see [Deployment](#deployment) below.

## Explainable AI Workflow

Neither model claims to identify *why* something looks fake (e.g.
face-swap vs. compression artifact) — both are binary Real/Fake
classifiers. Rather than inventing manipulation categories they can't
actually detect, the explainability layer builds a genuinely informative
picture from what each pipeline *does* compute — and is honest about what
differs between the two:

```
Image upload                              Video upload
      ↓                                          ↓
image_detector.py                         video_detector.py
 → inference.py                            → face_detection.py (MTCNN crop
   (dima806 ViT, 1 score)                     per sampled frame; frames with
                                               no face are skipped)
                                            → models/f3net.py (F3-Net:
                                              frequency decomposition +
                                              Xception, 1 score per face)
      ↓                                          ↓
postprocessing.py → aggregate score(s) into an overall REAL/DEEPFAKE verdict
      ↓
confidence.py → confidence %, risk level, temporal consistency (score
                 variance — only meaningful with 2+ scores), model certainty
                 (distance from that model's own decision threshold)
      ↓
explainability.py →
   • attention rollout heatmap — IMAGE RESULTS ONLY (real ViT attention
     weights; F3-Net has no transformer attention to roll out, so video
     results honestly omit this rather than faking a visualization)
   • supplementary sharpness heuristic (Laplacian variance) — both paths
   • a plain-language explanation stitching all of the above together,
     with wording that differs for "the image" vs. "the video"
      ↓
Persisted + returned: verdict, confidence, risk level, per-frame/image
scores, temporal consistency, model certainty, heuristics, heatmap URL
(image only), explanation, file type, model used
```

This is surfaced in the UI as: a verdict card, a circular confidence meter,
a per-frame bar chart, a certainty/consistency panel, the attention heatmap
image (when present), and the full analysis-summary paragraph — plus all of
it in the downloadable PDF report.

## Complete Workflow

```
User uploads a video or image (drag-and-drop or browse)
        ↓
Frontend validation (extension + size, instant feedback)
        ↓
Streaming upload to the backend (real progress bar, cancel supported)
        ↓
Backend re-validates: extension, magic-byte signature, size, rate limit
        ↓
File type classified automatically from its extension — no user choice
        │
        ├─ IMAGE ─────────────────────────────────────────────┐
        │  Pillow decodes and validates the image              │
        │  Pretrained ViT model runs inference on it            │
        │                                                       │
        └─ VIDEO ─────────────────────────────────────────────┤
           OpenCV extracts video metadata (resolution, fps,     │
           duration, codec) and sampled frames                  │
           MTCNN crops a face from each sampled frame            │
           (frames with no detected face are skipped)            │
           F3-Net runs inference on each face crop                │
                                                                   ▼
Scores are aggregated → verdict, confidence, risk level
        ↓
Confidence stats computed → temporal consistency, model certainty
        ↓
Explainability generated → heuristics, explanation text
                            (+ attention heatmap, image results only)
        ↓
Result persisted to SQLite, scoped to the requesting user; structured logs
written for the upload and the prediction
        ↓
JSON response returned to the frontend
        ↓
Results dashboard renders: verdict card, confidence meter, analysis
summary, per-frame/image chart, certainty/consistency panel, attention
heatmap (if present), full metadata grid — with downloadable text and PDF
reports
        ↓
The scan is now visible in Detection History for later review or deletion
```

## Folder Structure

```
DeepShieldAI/
├── docs/
│   └── DEPLOYMENT.md         Step-by-step Vercel + Render deployment guide
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
│   └── weights/                F3-Net checkpoint downloads here at runtime (gitignored)
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── ai/                 AI concerns only:
│   │   │                         model_loader.py — ModelManager (image) + VideoModelManager
│   │   │                         preprocessing.py — validation, file-type routing, frame/image extraction
│   │   │                         image_detector.py — still-image entry point (dima806 ViT)
│   │   │                         inference.py — raw batched image-model calls
│   │   │                         video_detector.py — video entry point (F3-Net + face crops)
│   │   │                         face_detection.py — MTCNN wrapper for video preprocessing
│   │   │                         models/xception.py, models/f3net.py — vendored F3-Net architecture
│   │   │                         models/weights.py — F3-Net checkpoint download/cache manager
│   │   │                         postprocessing.py — score → verdict aggregation (image path)
│   │   │                         confidence.py — certainty / temporal consistency stats (shared)
│   │   │                         explainability.py — attention heatmap (image only), heuristics, explanation
│   │   │                         prediction_service.py — orchestrates predict() / predict_video()
│   │   │                         errors.py
│   │   ├── api/routes/        HTTP endpoints (auth, detection, health)
│   │   ├── core/              Config (Settings, with production safety checks) and security (JWT, hashing)
│   │   ├── db/                 SQLAlchemy engine/session and models (User, Detection)
│   │   ├── reports/            pdf_report.py — branded PDF template (ReportLab)
│   │   ├── schemas/            Pydantic request/response models
│   │   ├── services/           Request orchestration (auth_service, detection_service)
│   │   ├── utils/               logging_config.py, rate_limit.py
│   │   └── main.py             App factory, middleware, exception handler, static mount, router mounting
│   ├── static/heatmaps/        Generated attention heatmap images, image results only (gitignored)
│   ├── logs/                    Rotating application log files (gitignored)
│   ├── tests/                   pytest suite (health, auth, detection, model manager, config)
│   ├── requirements.txt
│   ├── requirements-nodeps.txt  facenet-pytorch — installed with --no-deps (see below)
│   ├── requirements-dev.txt    Adds pytest + httpx for running tests
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.example
├── frontend/                  Next.js 15 application
│   ├── src/
│   │   ├── app/                Routes: landing, auth, and the authenticated (app) group
│   │   │                         (each authenticated route has its own layout.tsx for a page title)
│   │   │                         icon.svg — brand favicon
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
├── render.yaml                Render Blueprint (backend deployment config)
├── docker-compose.yml
├── README.md
├── LICENSE
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
- ~2.5GB free disk space for both models on first run (image model ~330MB
  from Hugging Face, F3-Net checkpoint ~86MB from GitHub, plus PyTorch itself)

### Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\pip.exe install -r requirements.txt
.\venv\Scripts\pip.exe install --no-deps -r requirements-nodeps.txt
copy .env.example .env
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The two-step install is intentional — `requirements-nodeps.txt` contains
`facenet-pytorch`, whose declared version pins are years out of date and
would otherwise conflict with the rest of the stack during normal
dependency resolution (see the comment in `requirements.txt`). The package
itself has been verified working against this project's actual
numpy/torch/torchvision/Pillow versions.

The first startup downloads the image model (~330MB) from the Hugging Face
Hub and the F3-Net video-model checkpoint (~86MB) from GitHub, caching both
locally; subsequent restarts are fast. Interactive API docs are available
at `http://localhost:8000/docs`.

### Frontend setup

```powershell
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

App available at `http://localhost:3000`.

## Local Development

- Both dev servers support hot reload (`uvicorn --reload`, `next dev`) —
  no rebuild needed for most code changes.
- The backend creates its SQLite database file and `logs/`/`static/`
  directories automatically on first run; delete `backend/deepshield.db` to
  reset local data (there's no migration tool yet — see Future Improvements).
- Run both test suites before committing (see [Testing](#testing) below).
- `ENVIRONMENT` defaults to `development`, which allows the default
  `SECRET_KEY` placeholder to work locally without extra setup — this is
  intentionally rejected once `ENVIRONMENT=production` (see
  [Environment Variables](#environment-variables)).

## Deployment

DeepShield AI deploys as two independent services: the frontend on
**Vercel**, the backend on **Render**. Full step-by-step instructions,
including exact dashboard settings and troubleshooting, are in
**[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)** — the summary below covers
the essentials.

### Backend → Render

The backend deploys as a **Docker** web service (needed for OpenCV's system
library dependency and the pinned PyTorch CPU wheel) using the repo's
`render.yaml` blueprint:

| Setting | Value |
|---|---|
| Runtime | Docker (`backend/Dockerfile`) |
| Start command | Baked into the image: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/api/health` |
| Required env vars | `ENVIRONMENT=production`, `SECRET_KEY` (auto-generated by the blueprint), `CORS_ORIGINS` (set after the frontend is deployed) |

### Frontend → Vercel

Zero-config — Vercel auto-detects Next.js. The only settings that matter
for this repo (a monorepo with the frontend in a subfolder):

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Next.js (auto-detected) |
| Build Command | `next build` (default) |
| Output Directory | `.next` (default) |
| Env var | `NEXT_PUBLIC_API_URL` = your Render backend URL + `/api` |

### Docker Compose (self-hosted alternative)

Both services can also run together on your own infrastructure:

```powershell
$env:SECRET_KEY = "generate-a-long-random-value"
docker compose up --build
```

This builds and starts both services: backend on `:8000`, frontend on
`:3000`. The SQLite database persists in a named volume (`backend_data`)
across container restarts. **These Dockerfiles have not been verified with
an actual Docker build in this development environment** (Docker isn't
installed here) — review them before relying on them in production.

### Production checklist

- [ ] Real `SECRET_KEY` set wherever `ENVIRONMENT=production` (the app refuses to start otherwise — this is enforced in code, not just documented)
- [ ] `CORS_ORIGINS` set to your real frontend origin(s) only
- [ ] `NEXT_PUBLIC_API_URL` set to your real backend URL before the frontend builds
- [ ] Backend served over HTTPS (Render provides this automatically)
- [ ] `.env` files confirmed not committed (they aren't tracked — see `.gitignore`)
- [ ] Decided whether persistent storage (disk or managed Postgres) is needed, or ephemeral storage is acceptable for your use case

## Environment Variables

Neither `.env` file is committed — copy the `.example` file in each folder
and adjust as needed. No secrets ship in this repo.

**`backend/.env`** (copy from `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `APP_NAME`, `ENVIRONMENT` | App metadata; `ENVIRONMENT=production` also enables the `SECRET_KEY` safety check below |
| `DATABASE_URL` | SQLAlchemy connection string (defaults to local SQLite) |
| `SECRET_KEY` | JWT signing secret. **Startup fails if this is left at its default placeholder while `ENVIRONMENT=production`** |
| `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT configuration |
| `CORS_ORIGINS` | Allowed frontend origins — accepts a JSON array or a plain comma-separated string |
| `DETECTION_MODEL_NAME` | Hugging Face model id to load for **image** inference |
| `DETECTION_UPLOAD_DIR` | Temp directory for in-flight uploads (auto-cleaned) |
| `DETECTION_MAX_UPLOAD_MB` | Upload size cap |
| `DETECTION_ALLOWED_EXTENSIONS` | Allowed **video** extensions — JSON array or comma-separated string (optional, has a sensible default) |
| `DETECTION_ALLOWED_IMAGE_EXTENSIONS` | Allowed **image** extensions — same format, default `.jpg,.jpeg,.png,.webp` |
| `DETECTION_FRAME_SAMPLE_SECONDS`, `DETECTION_MAX_FRAMES` | Video frame sampling rate/cap |
| `DETECTION_FAKE_THRESHOLD` | Score threshold for a `DEEPFAKE` verdict, **image model** |
| `DETECTION_MAX_FRAME_DIMENSION` | Frames larger than this (px, longest edge) are downscaled before inference |
| `DETECTION_ENABLE_HEATMAP` | Toggle the attention-heatmap XAI pass for images (adds one extra forward pass per scan) |
| `HEATMAP_DIR` | Where generated heatmap PNGs are saved and served from |
| `VIDEO_MODEL_NAME` | Display name shown for the video model (default `F3-Net (DeepfakeBench)`) |
| `VIDEO_MODEL_WEIGHTS_DIR` | Where the F3-Net checkpoint is downloaded/cached |
| `VIDEO_MODEL_RESOLUTION` | Input resolution F3-Net expects (default `256`, matches the released checkpoint — don't change unless using a different checkpoint) |
| `VIDEO_FAKE_THRESHOLD` | Score threshold for a `DEEPFAKE` verdict, **video model** (independent of `DETECTION_FAKE_THRESHOLD` — the two models were calibrated separately) |
| `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` | Per-user cap on `/detection/analyze` calls |
| `LOG_DIR`, `LOG_LEVEL` | Rotating log file location and verbosity |

**`frontend/.env.local`** (copy from `frontend/.env.local.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL the frontend calls for the FastAPI backend. Inlined at **build time** — changing it requires a rebuild/redeploy |

## API Documentation

The backend auto-generates interactive OpenAPI docs at `/docs` (Swagger UI)
and `/redoc` on any running instance — e.g. `http://localhost:8000/docs`
locally, or `https://<your-render-service>.onrender.com/docs` once
deployed. That's the authoritative, always-current reference for request/
response shapes. Summary of the main routes:

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create an account | No |
| `POST` | `/api/auth/login` | Get a JWT access token | No |
| `GET` | `/api/auth/me` | Current user profile | Yes |
| `POST` | `/api/detection/analyze` | Upload a video or image — routed to the correct detector automatically | Yes (rate-limited) |
| `GET` | `/api/detection/history` | Paginated scan history | Yes |
| `GET` | `/api/detection/{id}` | A single scan's full result | Yes |
| `GET` | `/api/detection/{id}/report/pdf` | Download a branded PDF report | Yes |
| `DELETE` | `/api/detection/{id}` | Delete a scan (and its heatmap file, if any) | Yes |
| `GET` | `/api/health` | Liveness/health check | No |

All authenticated routes expect `Authorization: Bearer <token>`. Detection
routes are scoped to the requesting user — one user can never read,
download, or delete another user's scans (enforced server-side, covered by
tests).

## Usage Instructions

1. Start the backend and frontend (see Installation above), or use the deployed URLs.
2. Visit the app, click **Get Started**, and register an account.
3. From the dashboard sidebar, open **Detection**.
4. Drag and drop a video or image (or click to browse) — MP4, MOV, AVI, MKV, JPG, PNG, or WEBP, up to 200MB. The correct model (image or video) is selected automatically.
5. Click **Analyze** and watch the live upload progress, then the animated analysis screen.
6. Review the result: verdict, confidence meter, model certainty, temporal consistency, per-frame/image chart, attention heatmap (image results), analysis summary, and full file metadata. Download a text or PDF report.
7. Open **History** in the sidebar to browse, review, or delete past scans — the same rich detail view is available from there too.
8. Explore Settings/Profile as needed.

## Testing

### Backend (pytest)

```powershell
cd backend
.\venv\Scripts\pip.exe install -r requirements-dev.txt
.\venv\Scripts\python.exe -m pytest -v
```

46 tests (1 conditionally skipped), run against an isolated SQLite file
(never your dev `deepshield.db`), exercising **both real AI models**
end-to-end: full upload → routing → inference → aggregation →
explainability passes for both a synthetic image and a synthetic video
generated on the fly; the real "no face detected" rejection path (video);
auth; large-file and corrupted-media rejection; PDF report generation for
both file types; model-manager validation; production configuration safety
checks (`SECRET_KEY`/`CORS_ORIGINS` parsing); heatmap-file cleanup on
delete; and authorization-scoping checks (a user can't view, delete, or
download a report for another user's scans).

The face-detection step in tests uses a documented fallback (see
`app/ai/face_detection.py`) so synthetic random-noise test frames — which
genuinely contain no face — still exercise the real F3-Net model instead of
being rejected outright; a dedicated test runs with that fallback disabled
to confirm the real rejection behavior works correctly.

### Frontend (Vitest + React Testing Library)

```powershell
cd frontend
npm run test
```

37 tests covering formatting/validation utilities, the report generator,
and key UI components — including the per-frame chart, confidence panel,
and attention-heatmap components.

## Future Improvements

- Build out the Analytics page against the existing detection history data
- Fine-tune the image model on a modern deepfake dataset to address the concept-drift limitation noted in `datasets/dataset_info.md`
- Add an AI assistant that can explain a specific scan result conversationally
- Add real-time progress streaming (WebSocket/SSE) instead of the current single request/response cycle
- Support audio deepfake detection (explicitly out of scope so far)
- Add password reset, email verification, and two-factor authentication
- Add a database migration tool (e.g. Alembic) — schema changes currently require recreating the local dev database
- Move the rate limiter and model cache to a shared store (e.g. Redis) if scaling to multiple backend workers
- Migrate `DATABASE_URL` to a managed Postgres instance for real data persistence on PaaS hosts with ephemeral disks
- Add a retention/cleanup policy for generated heatmap images if the app ever runs with high scan volume and persistent storage
- Support multiple/ensemble models via the `ModelManager`'s / `VideoModelManager`'s existing model-switching capability, once a second model of either type is worth adding
- Investigate a video-native explainability visualization (F3-Net has no transformer attention to roll out, so today's heatmap technique doesn't apply to video results)
- Batch multiple sampled frames through F3-Net in a single forward pass more aggressively, and/or add GPU deployment guidance, to reduce video analysis latency
- Replace F3-Net with a permissively-licensed (non-NC) video detector if this project is ever adapted for commercial use — see the license note in `models/README.md`

## License

Released under the [MIT License](./LICENSE).
