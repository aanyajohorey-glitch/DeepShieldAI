# DeepShield AI

An AI-powered cybersecurity platform for detecting deepfake videos, built as
an AI & Cybersecurity capstone project. DeepShield AI combines a modern
security-operations dashboard with a real deepfake-detection pipeline
powered by a pretrained Vision Transformer model.

## Overview

DeepShield AI lets an authenticated user upload a video and receive an
AI-generated authenticity verdict (`REAL` / `DEEPFAKE`), a confidence score,
a risk level, and per-scan metadata — all inside a polished, dark
glassmorphism dashboard modeled on tools like Microsoft Defender and
CrowdStrike. The platform is being built in phases: Phase 1 established the
UI/auth foundation, and Phase 2 wires up real AI-powered video analysis on
top of it.

## Problem Statement

Deepfake video content is increasingly difficult for people to identify by
eye, and there are few accessible, self-hostable tools that let someone
upload a clip and get a clear, explainable authenticity signal. DeepShield
AI addresses this by pairing an approachable UI with an open-source
pretrained detection model, so a user can go from "is this video real?" to
a structured answer in seconds, without needing ML expertise or training
infrastructure of their own.

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
- Scan history persisted per-user in SQLite (`GET /api/detection/history`, `GET /api/detection/{id}`, `DELETE /api/detection/{id}`)
- Friendly error handling for invalid formats, oversized files, corrupted videos, and backend/model unavailability

## Technologies Used

**Languages:** TypeScript, Python

**Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts, Lucide React, next-themes

**Backend:** FastAPI, SQLAlchemy 2.0, SQLite, Pydantic v2, python-jose (JWT), bcrypt

**AI/ML:** Hugging Face `transformers`, PyTorch (CPU by default, GPU if available), OpenCV (`opencv-python-headless`), Pillow

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
                                                                     │ inference calls
                                                            ┌────────┴────────┐
                                                            │ Detection Service│
                                                            │  OpenCV frame    │
                                                            │  sampling        │
                                                            └────────┬────────┘
                                                                     ▼
                                                        ┌────────────────────────┐
                                                        │ Pretrained ViT model    │
                                                        │ (Hugging Face pipeline, │
                                                        │  loaded once at startup)│
                                                        └────────────────────────┘
```

- **Frontend** — Next.js App Router with route groups: public marketing
  pages, `/login` and `/register`, and an authenticated `(app)` group
  (dashboard, detection, settings, profile, etc.) guarded by both Next.js
  middleware (edge-level cookie check) and a client-side `ProtectedRoute`.
- **Backend** — FastAPI app organized by concern: `api/routes` (HTTP layer),
  `services` (business logic — auth, detection, AI model), `db/models`
  (SQLAlchemy tables), `schemas` (Pydantic request/response contracts).
- **AI model** — A Hugging Face `image-classification` pipeline is loaded
  once during the FastAPI `lifespan` startup hook (never per-request) and
  reused for every scan.
- **Database/API flow** — Frontend calls `/api/auth/*` and
  `/api/detection/*` with a JWT bearer token; FastAPI validates the token,
  runs the request against SQLite via SQLAlchemy, and returns camelCase JSON
  (via a shared Pydantic `CamelModel`) that matches the frontend's
  TypeScript types 1:1.

## Project Structure

```
DeepShieldAI/
├── datasets/                 Dataset documentation (see Dataset section below)
│   ├── README.md
│   ├── dataset_info.md
│   ├── raw/                  Empty — reserved for future local datasets (gitignored)
│   └── processed/            Empty — reserved for future processed data (gitignored)
├── models/                   No weights stored here — see models/README.md
│   └── README.md
├── backend/                  FastAPI application
│   ├── app/
│   │   ├── api/routes/       HTTP endpoints (auth, detection, health)
│   │   ├── core/             Config (Settings) and security (JWT, hashing)
│   │   ├── db/                SQLAlchemy engine/session and models (User, Detection)
│   │   ├── schemas/           Pydantic request/response models
│   │   ├── services/          Business logic (auth, AI model loader, detection pipeline)
│   │   └── main.py            App factory, CORS, router mounting, startup hook
│   ├── requirements.txt
│   └── .env.example
├── frontend/                  Next.js 15 application
│   └── src/
│       ├── app/                Routes: landing, auth, and the authenticated (app) group
│       ├── components/         ui/ (design system), layout/, landing/, dashboard/, detection/, settings/, auth/
│       ├── context/             AuthContext (session state)
│       ├── lib/                 API client, constants, utils
│       ├── hooks/                useAuth, useToast, useLocalStorage, useOnClickOutside
│       ├── types/                 Shared TypeScript types
│       └── middleware.ts          Edge-level route protection
├── README.md
└── .gitignore
```

> Note: `backend/requirements.txt` is the actual dependency manifest (run
> from inside `backend/`) — it is not duplicated at the repo root, to avoid
> two files drifting out of sync.

## Dataset

DeepShield AI's Phase 2 detector uses a **pretrained** Hugging Face model
for inference only — this repository does not train a model and does not
ship a training dataset. Full details, including what is/isn't known about
the pretrained model's original training data, how to regenerate lightweight
test clips for local QA, and how to obtain a real evaluation dataset if you
want to benchmark accuracy, are documented in:

- [`datasets/README.md`](./datasets/README.md) — purpose, current status, and data flow
- [`datasets/dataset_info.md`](./datasets/dataset_info.md) — the pretrained model's documented training data, classes, and preprocessing
- [`models/README.md`](./models/README.md) — which model is loaded and how to swap it

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
6. Review the result: verdict, confidence meter, risk level, frames analyzed, processing time, and model used.
7. Click **Scan Another Video** to run another analysis, or explore Settings/Profile.

## Future Improvements

- Build out the History and Analytics pages against the already-implemented `/api/detection/history` endpoint
- Fine-tune a model on a modern deepfake dataset to address the concept-drift limitation noted in `datasets/dataset_info.md`
- Add an AI assistant that can explain a specific scan result in natural language
- Add real-time progress streaming (WebSocket/SSE) instead of the current single request/response cycle
- Support audio and image deepfake detection (explicitly out of scope for Phase 2)
- Add password reset, email verification, and two-factor authentication
