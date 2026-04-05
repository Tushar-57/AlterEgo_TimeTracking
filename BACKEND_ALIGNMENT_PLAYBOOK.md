# Backend Alignment Playbook
## AlterEgo x Agentic Execution Board

### Objective
Move from UI-level integration to production-grade backend alignment with explicit ownership, contracts, and deploy checks.

### P0-P2 Backlog
| Priority | Workstream | Action | Owner | Exit Criteria |
| --- | --- | --- | --- | --- |
| P0 | CORS hardening | Normalize Agentic CORS envs to include production frontend origins and redeploy with verification. | Platform | OPTIONS preflight returns 200 and ACAO for both production origins on `/api/chat` and `/api/health`. |
| P0 | Auth boundary | Introduce route protection in Agentic for chat and mutable knowledge endpoints. | Backend | Anonymous POST to protected routes returns 401/403; authenticated path succeeds. |
| P0 | Smoke probes | Add deployment probe script for signup, login, coach health, and origin preflight. | DevOps | Pipeline blocks promotion if any probe fails. |
| P1 | Identity propagation | Define how AlterEgo identity is asserted to Agentic (JWT passthrough or service token exchange). | Architecture | Request envelope includes verifiable user identity for Agentic decisions/audit. |
| P1 | Data contract | Align onboarding/profile schema across AlterEgo relational model and Agentic knowledge model. | Product + Backend | Canonical schema doc approved and adapters implemented both directions. |
| P1 | Agentic Postgres canonicalization | Persist Agentic onboarding, coach profile, goals, preferences, interactions, and todos in PostgreSQL while preserving current APIs. | Backend | Structured writes are durable in Postgres and existing knowledge endpoints remain backward compatible. |
| P1 | Soft-merge onboarding model | Keep Agentic coach-aware onboarding UX and materialize it into canonical relational tables plus retrieval-ready knowledge entries. | Product + Backend | Coach style/archetype and onboarding payload are preserved in UX and queryable in both structured and semantic layers. |
| P1 | Data durability | Verify Agentic data persistence guarantees for `data/vector_index` and `data/config`. | Platform | Restart/deploy does not lose user preferences/knowledge artifacts. |
| P2 | Observability | Add correlation IDs and shared audit events across both backends. | Backend + Platform | Cross-service request trace view is available for coach and onboarding flows. |

### API Surface Alignment Matrix
| Domain | AlterEgo | Agentic | Alignment Gap |
| --- | --- | --- | --- |
| Auth | `/api/auth/signup`, `/api/auth/login`, `/api/auth/validate` | No equivalent auth endpoints by default | No shared trust model |
| Health | `/health` (public), many `/api/*` protected | `/health` and `/api/health` public | Health semantics are inconsistent |
| Onboarding | `/api/onboarding/onboardNewUser`, read/update style | `/api/knowledge/onboarding`, `/api/knowledge/onboarding/profile` | Duplicate business concept, different storage and schema |
| Core value path | Timer/project/tag workflows (JWT user context) | Chat/knowledge/approval workflows (no JWT user context) | User identity context not harmonized |

### Environment Baseline (Recommended)
#### AlterEgo backend
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `SPRING_DATASOURCE_*`

#### Agentic backend
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOWED_ORIGIN_REGEX`
- `OPENAI_API_KEY`
- `OLLAMA_ENDPOINT`

#### AlterEgo frontend
- `VITE_TIMETRACKER_API_ORIGIN`
- `VITE_AGENTIC_API_ORIGIN`
- `VITE_AGENTIC_API_PREFIX`

#### Agentic frontend
- `VITE_AGENTIC_API_ORIGIN`
- `VITE_AGENTIC_WS_ORIGIN`
- `VITE_AGENTIC_API_PREFIX`

### Verification Checklist
Run after every env change or deploy:

1. Preflight from AlterEgo origin to AlterEgo signup endpoint.
2. Preflight from Agentic origin to Agentic health endpoint.
3. Preflight from AlterEgo origin to Agentic chat endpoint.
4. Live signup test (AlterEgo).
5. Live coach API test (Agentic) from browser context.

### Quick Probe Commands
```bash
# 1) AlterEgo signup preflight
curl -i -X OPTIONS "https://alterego-timetracking-cybr.onrender.com/api/auth/signup" \
  -H "Origin: https://alteregoconventional.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"

# 2) Agentic health preflight
curl -i -X OPTIONS "https://agentic-lyf.onrender.com/api/health" \
  -H "Origin: https://agenticlyf.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type,authorization"

# 3) Agentic chat preflight from AlterEgo origin
curl -i -X OPTIONS "https://agentic-lyf.onrender.com/api/chat" \
  -H "Origin: https://alteregoconventional.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
```

### Current Audit Verdict
- AlterEgo signup boundary: stable and CORS-valid from production origin.
- Agentic browser boundary: still blocked by CORS mismatch for production origins.
- Integration maturity: strong UI composition, incomplete backend trust and data contract alignment.

### Agentic Persistence Blueprint
- Detailed schema and migration strategy: [A_Lyf/Agentic_lyf/AGENTIC_POSTGRES_PERSISTENCE_BLUEPRINT.md](A_Lyf/Agentic_lyf/AGENTIC_POSTGRES_PERSISTENCE_BLUEPRINT.md)
- Scope includes soft-merge onboarding preservation, PostgreSQL canonical storage, and retrieval-index compatibility.

### Next Decision Gate
Proceed to feature velocity only after P0 closes. Until then, every new cross-product feature increases failure surface faster than product value.
