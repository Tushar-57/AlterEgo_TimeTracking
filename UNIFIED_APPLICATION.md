# Unified Application Wiring Guide

This workspace now supports a **single application runtime** that combines:

- AlterEgo TimeTracker (Spring Boot + React)
- Agentic AI app (FastAPI + React)

## Architecture

- Browser entrypoint: `http://localhost:8088`
- API namespace routing:
  - `/api/*` -> TimeTracker Spring Boot backend
  - `/agentic-api/*` -> Agentic FastAPI backend
- UI routing:
  - `/` -> TimeTracker frontend shell
  - `/coach/` -> Agentic frontend
- Database:
  - PostgreSQL container for TimeTracker persistence

## What Was Wired

1. TimeTracker frontend now has an **AI Coach** route (`/coach`) via iframe.
2. Both frontends rewrite hardcoded localhost API calls into gateway-safe paths.
3. Production-ready Spring profile (`application-prod.properties`) uses env-based DB/JWT/OpenAI values.
4. Container build files were added for all 4 app services.
5. Nginx gateway config provides path-based reverse proxying.

## Run Unified Stack

From `alterEgo_TimeTracker/AlterEgo_TimeTracking`:

```bash
export JWT_SECRET='replace-with-a-long-random-secret'
export OPENAI_API_KEY='optional'
docker compose -f docker-compose.unified.yml up --build
```

Open:

- Main app: `http://localhost:8088`
- AI coach module route inside app: `http://localhost:8088/coach`

## Notes

- The old local dev mode (`npm run dev` + backend runs) still works.
- TimeTracker backend uses `prod` profile in unified compose and persists to PostgreSQL volume.
- Rotate any previously leaked API keys before production deployment.
