# Deployment Guide: Render Backend + Vercel/Netlify Frontend

## Recommended hosting split
- Backend services: Render (stable for long-running APIs and background workloads)
- Frontend apps: Vercel (recommended) or Netlify (both supported)

Reasoning: Vercel gives the smoothest React/Vite deployment experience and preview environments. Netlify works too with equivalent env settings.

## Services to deploy
1. TimeTracker backend (Spring Boot)
2. Agentic backend (FastAPI)
3. TimeTracker frontend (Vite React)
4. Agentic frontend (Vite React)

## Backend env vars (Render)

### TimeTracker backend
- JWT_SECRET=your-64+-char-random-secret
- JWT_EXPIRATION=86400
- SPRING_PROFILES_ACTIVE=prod
- SPRING_DATASOURCE_URL=your-postgres-url
- SPRING_DATASOURCE_USERNAME=your-db-user
- SPRING_DATASOURCE_PASSWORD=your-db-password
- APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-timetracker.vercel.app,https://your-agentic.vercel.app,https://your-timetracker.netlify.app,https://your-agentic.netlify.app
- OPENAI_API_KEY=...
- OPENAI_MODEL_NAME=gpt-4o-mini

### Agentic backend
- OPENAI_API_KEY=...
- OLLAMA_ENDPOINT=... (optional, only if used)
- CORS_ALLOWED_ORIGINS=https://your-timetracker.vercel.app,https://your-agentic.vercel.app,https://your-timetracker.netlify.app,https://your-agentic.netlify.app
- CORS_ALLOWED_ORIGIN_REGEX=https://.*\\.vercel\\.app|https://.*\\.netlify\\.app

## Frontend env vars (Vercel/Netlify)

### TimeTracker frontend
- VITE_TIMETRACKER_API_ORIGIN=https://your-timetracker-backend.onrender.com
- VITE_AGENTIC_API_ORIGIN=https://your-agentic-backend.onrender.com
- VITE_AGENTIC_API_PREFIX=/agentic-api

### Agentic frontend (standalone)
- VITE_AGENTIC_API_ORIGIN=https://your-agentic-backend.onrender.com
- VITE_AGENTIC_WS_ORIGIN=wss://your-agentic-backend.onrender.com
- VITE_BASE_PATH=/
- VITE_AGENTIC_API_PREFIX=/agentic-api

## Notes
- Do not use localhost values in production.
- For local unified Docker, leaving frontend API origins empty keeps proxy/gateway routing behavior.
- If websocket issues appear behind a proxy, set VITE_AGENTIC_WS_ORIGIN explicitly.
