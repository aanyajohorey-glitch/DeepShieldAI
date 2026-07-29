# DeepShield AI — Deployment Guide

This guide walks through deploying DeepShield AI as two independent
services: the Next.js frontend on **Vercel** and the FastAPI backend on
**Render**. Both platforms deploy straight from this GitHub repository —
no manual file uploads.

Deploying is something only you can do (it requires your own Vercel/Render
accounts and authorizing them against your GitHub account) — this guide
gives you the exact steps and settings to use.

## Prerequisites

- This repository pushed to GitHub (already done).
- A free [Vercel](https://vercel.com) account, signed in with GitHub.
- A free [Render](https://render.com) account, signed in with GitHub.

Deploy the backend first — you'll need its live URL to configure the
frontend.

---

## 1. Backend — Render

DeepShield AI's backend needs a couple of system libraries for OpenCV and a
specific PyTorch CPU wheel index, so it's deployed as a **Docker** web
service using the existing `backend/Dockerfile` rather than Render's native
Python buildpack (which wouldn't install `libglib2.0-0`, and OpenCV would
fail to import).

### Option A — Blueprint (recommended, fastest)

The repository includes a `render.yaml` at its root, which Render reads
automatically as a "Blueprint":

1. In the Render dashboard, click **New → Blueprint**.
2. Connect this GitHub repository and select it.
3. Render detects `render.yaml` and shows one service: `deepshieldai-backend`.
4. It will prompt you for the `CORS_ORIGINS` value — you can leave it blank
   for now and set it after the frontend is deployed (step 3 below).
   `SECRET_KEY` is generated automatically; you never need to touch it.
5. Click **Apply**. The first build downloads PyTorch and builds the image,
   which typically takes 5–10 minutes.

### Option B — Manual web service

If you'd rather configure it by hand instead of using the blueprint:

| Setting | Value |
|---|---|
| Runtime | **Docker** |
| Dockerfile path | `backend/Dockerfile` |
| Docker build context | `backend` |
| Health check path | `/api/health` |

**Environment variables:**

| Key | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `SECRET_KEY` | Click "Generate" in Render's UI, or paste the output of `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `CORS_ORIGINS` | Your Vercel URL once deployed, e.g. `https://your-app.vercel.app` (comma-separate multiple origins) |
| `DETECTION_MODEL_NAME` | `dima806/deepfake_vs_real_image_detection` (or leave unset — this is the default) |

Every other setting has a working default (see `backend/.env.example`) —
only add the others if you want to change them.

### What to expect

- **First boot is slow.** The container downloads the ~330MB pretrained
  model from Hugging Face on first start (not baked into the image), so
  the very first health check may take a minute or two.
- **The `SECRET_KEY` guard is intentional.** If you forget to set a real
  `SECRET_KEY` in production, the app refuses to start rather than run
  with the well-known placeholder value from the public source.
- **Storage is ephemeral on the free/starter plan.** The SQLite database
  and generated attention-heatmap images reset on every redeploy or
  restart. This is fine for a demo/capstone deployment. For real
  persistence, either attach a Render persistent disk (see the commented
  `disk:` block in `render.yaml`, requires a paid plan) or point
  `DATABASE_URL` at a managed Postgres instance (Render offers a free
  Postgres tier).
- **Memory.** PyTorch + a ViT model is not tiny. Render's free instance
  type (512MB RAM) is tight for this workload — the **Starter** plan
  (512MB–1GB depending on plan tier) is a safer minimum; if you see the
  service crash-loop shortly after "Model loaded", it's almost always
  memory, not a code bug.

Once deployed, note the backend's public URL, e.g.
`https://deepshieldai-backend.onrender.com`. Confirm it's live:

```
curl https://deepshieldai-backend.onrender.com/api/health
```

---

## 2. Frontend — Vercel

Vercel auto-detects Next.js — no config file is needed.

1. In the Vercel dashboard, click **Add New → Project**.
2. Import this GitHub repository.
3. Under **Root Directory**, click "Edit" and select `frontend` — this
   repo is a monorepo (backend + frontend in one repo), so Vercel needs to
   know the frontend lives in a subfolder.
4. Framework Preset: **Next.js** (auto-detected once the root directory is set).
5. Build & Output Settings: leave at their defaults —
   - Build Command: `next build` (or `npm run build`)
   - Output Directory: `.next` (Next.js default, managed by the framework preset)
   - Install Command: `npm install` (default)
6. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://deepshieldai-backend.onrender.com/api` (your Render backend URL from step 1, with `/api` appended) |

   `NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle at
   **build time** — if you change this later, you must trigger a new
   deployment for it to take effect (Vercel's "Redeploy" button, without
   the build cache, is the fastest way).

7. Click **Deploy**.

Vercel builds and serves the app at a `*.vercel.app` URL (and lets you
attach a custom domain later, from Project Settings → Domains — optional,
not required for the app to work).

---

## 3. Connect the two

Once the frontend has a real Vercel URL:

1. Go back to the Render backend service → **Environment**.
2. Set `CORS_ORIGINS` to the frontend's exact URL, e.g.
   `https://your-app.vercel.app` (comma-separate if you also want to allow
   a custom domain: `https://your-app.vercel.app,https://yourdomain.com`).
3. Save — Render redeploys automatically with the new value.

Data flow once both are live:

```
Browser
  → Vercel (Next.js frontend, static + serverless)
    → Render (FastAPI backend, Docker)
      → Pretrained ViT model (loaded once at container startup)
      → SQLite (ephemeral unless a persistent disk/Postgres is attached)
  ← JSON prediction response, or a static heatmap PNG / PDF report
```

---

## 4. Verify the live deployment

1. Open the Vercel URL, register an account, sign in.
2. Go to **Detection**, upload a short test video.
3. Confirm you see: a verdict, confidence meter, per-frame chart, attention
   heatmap, and can download both the text and PDF reports.
4. Check **History** — the scan should be listed and viewable.
5. Open the Render service logs to confirm you see the structured log
   lines for the upload and prediction (`deepshield.detection` logger).

If step 2 fails with a network/CORS error in the browser console, the most
common cause is `CORS_ORIGINS` on the backend not exactly matching the
frontend's origin (protocol + host, no trailing slash).

---

## 5. Redeploying after changes

Both platforms redeploy automatically on every push to `master` (or
whichever branch you connect) — no manual step needed for ordinary code
changes. Only environment variable changes require a manual
"Save"/"Redeploy" as noted above.
