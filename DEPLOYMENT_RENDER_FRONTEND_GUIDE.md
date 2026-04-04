# Deployment Guide: Render Docker Web Services + Vercel Frontends

This guide avoids Render Blueprint and uses manual Docker Web Service deployment for both backends.

Deployment split:

1. Backends on Render as Docker Web Services
2. Frontends on Vercel

## Why This Path

- No Blueprint required
- Full control over each service
- Easier to pause or scale each service independently

## Important Before Deploying

- Only files inside a git repo can be deployed from that repo.
- alterEgo_TimeTracker/TimeTracker_UI is outside AlterEgo_TimeTracking repo, so it will not deploy unless moved into that repo and committed.
- The production UI currently used by the app is under AlterEgo_TimeTracking/frontend.

## Service Map

1. TimeTracker backend (Spring Boot): alterEgo_TimeTracker/AlterEgo_TimeTracking/backend
2. Agentic backend (FastAPI): A_Lyf/Agentic_lyf/backend
3. TimeTracker frontend (Vite): alterEgo_TimeTracker/AlterEgo_TimeTracking/frontend
4. Agentic frontend (Vite): A_Lyf/Agentic_lyf/frontend

## Step 1: Deploy TimeTracker Backend as Render Docker Web Service

In Render:

1. New + -> Web Service
2. Connect the AlterEgo_TimeTracking GitHub repo
3. Configure service:
	- Runtime: Docker
	- Root Directory: backend
	- Dockerfile Path: ./Dockerfile.unified
	- Health Check Path: /api/health

Set environment variables:

- SPRING_PROFILES_ACTIVE=prod
- SPRING_DATASOURCE_URL=jdbc:postgresql://<db-host>:5432/<db-name>
- SPRING_DATASOURCE_USERNAME=<db-user>
- SPRING_DATASOURCE_PASSWORD=<db-password>
- JWT_SECRET=<long-random-secret>
- JWT_EXPIRATION=86400
- OPENAI_MODEL_NAME=gpt-4o-mini
- OPENAI_API_KEY=<optional>
- APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://<timetracker-frontend-domain>,https://<agentic-frontend-domain>

Database options:

1. Lower-cost path: use an external Postgres provider and supply host/user/password manually.
2. Render DB path: create a Postgres instance manually (not Blueprint), then copy host/user/password into the vars above.

Notes:

- server.port already supports Render dynamic port with PORT fallback.
- Do not include quotes around env var values in the Render UI.

## Step 2: Deploy Agentic Backend as Render Docker Web Service

In Render:

1. New + -> Web Service
2. Connect the A_Lyf/Agentic_lyf GitHub repo
3. Configure service:
	- Runtime: Docker
	- Root Directory: backend
	- Dockerfile Path: ./Dockerfile.unified
	- Health Check Path: /api/health

Set environment variables:

- OPENAI_API_KEY=<optional>
- OLLAMA_ENDPOINT=<optional>
- CORS_ALLOWED_ORIGINS=https://<agentic-frontend-domain>,https://<timetracker-frontend-domain>
- CORS_ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app

Notes:

- The Docker command already binds to PORT using uvicorn --port ${PORT:-8000}.

## Step 3: Deploy TimeTracker Frontend on Vercel

1. Import AlterEgo_TimeTracking/frontend into Vercel.
2. Build settings:
	- Build Command: npm run build
	- Output Directory: dist
3. Environment variables:
	- VITE_TIMETRACKER_API_ORIGIN=https://<timetracker-backend>.onrender.com
	- VITE_AGENTIC_API_ORIGIN=https://<agentic-backend>.onrender.com
	- VITE_AGENTIC_API_PREFIX=/agentic-api
4. Deploy.

## Step 4: Deploy Agentic Frontend on Vercel

1. Import A_Lyf/Agentic_lyf/frontend into Vercel.
2. Build settings:
	- Build Command: npm run build
	- Output Directory: dist
3. Environment variables:
	- VITE_AGENTIC_API_ORIGIN=https://<agentic-backend>.onrender.com
	- VITE_AGENTIC_WS_ORIGIN=wss://<agentic-backend>.onrender.com
	- VITE_BASE_PATH=/
	- VITE_AGENTIC_API_PREFIX=/agentic-api
4. Deploy.

## Step 5: Harden CORS After Frontend URLs Are Final

Once both Vercel URLs are known, update backend CORS to exact domains:

1. TimeTracker backend: APP_CORS_ALLOWED_ORIGIN_PATTERNS
2. Agentic backend: CORS_ALLOWED_ORIGINS

## Quick Smoke Tests

1. GET https://<timetracker-backend>.onrender.com/api/health
2. GET https://<agentic-backend>.onrender.com/api/health
3. Open both Vercel apps and verify authentication plus chat/timer API calls.

## Do You Need render.yaml Now?

No. For manual Web Service deployment, Render does not need render.yaml.

- Keep it if you want a Blueprint option later.
- Delete it if you want to avoid accidental Blueprint-based deploys.
