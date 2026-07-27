# DeepShield AI — Phase 1: Platform Foundation

AI-powered cybersecurity platform for deepfake video detection. This phase
delivers the production-quality foundation — landing page, authentication,
dashboard shell, and design system — that later phases build AI detection on
top of.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide React
- **Backend:** FastAPI (Python), SQLAlchemy, SQLite, JWT authentication
- **Auth:** JWT bearer tokens issued by FastAPI, stored client-side in a cookie, verified per-request by the API and gated at the edge by Next.js middleware

## Getting Started

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\pip.exe install -r requirements.txt
copy .env.example .env
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

App available at `http://localhost:3000`.

## Project Structure

```
DeepShieldAI/
├── frontend/     Next.js 15 application (UI, auth, dashboard)
└── backend/      FastAPI application (auth API, database)
```

See in-app documentation and code comments for architectural details. Each
subsystem (UI kit, dashboard widgets, auth, backend routes) is modular so
future phases (Detection, History, Analytics, AI Assistant, Survey) can be
added without rewriting existing work.
