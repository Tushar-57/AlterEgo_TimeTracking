# Backend Alignment Magazine
## AlterEgo x Agentic (Edition: 2026-04-04)

### Cover Line
From a user experience angle, AlterEgo and Agentic are now visibly connected. From a backend contract and trust boundary angle, they are still operating as adjacent systems rather than one product-grade platform.

### Executive Snapshot
| Lens | Status | What It Means |
| --- | --- | --- |
| UI integration | Strong | AlterEgo can launch Agentic in-context via the `/coach` workspace and route API calls by prefix. |
| Data integration | Partial | Data models are separate; onboarding and preference concepts overlap but are not synchronized by contract. |
| Security alignment | Weak | AlterEgo enforces JWT authentication broadly; Agentic APIs are mostly open and CORS-gated only. |
| Production CORS | Mixed | AlterEgo preflight passes from production origin; Agentic preflight is still rejecting production origins. |
| Platform maturity | Medium | Both systems are deployable, but cross-product reliability is not yet policy-enforced. |

### Feature Story: How The Two Products Meet In UI
The frontdoor integration is clear and intentional:

- AlterEgo main router exposes a dedicated `/coach` route that mounts `CoachWorkspace`.
- `CoachWorkspace` embeds Agentic UI via iframe at `/coach/`.
- AlterEgo sidebar presents AI Coach as a first-class navigation item.
- Both frontends install fetch-rewrite middleware so API calls can be redirected to environment-driven origins.

Primary evidence:

- `frontend/src/App.tsx` (AlterEgo)
- `frontend/src/components/Integration/CoachWorkspace.tsx` (AlterEgo)
- `frontend/src/components/Sidebar.tsx` (AlterEgo)
- `frontend/src/lib/installApiRouting.ts` (AlterEgo)
- `frontend/src/lib/installApiRouting.ts` (Agentic)
- `unified/nginx.conf` and `docker-compose.unified.yml` (local unified gateway)

### Data Story: Where The Architectures Diverge
#### AlterEgo backend profile
- Spring Boot + JPA + Postgres domain model.
- JWT-based auth and stateless session policy.
- Domain entities include user/time/project/tag/onboarding structures.
- Onboarding is modeled relationally with embedded planner/mentor/goal details.

Core evidence:

- `backend/pom.xml`
- `backend/src/main/java/com/tushar/demo/timetracker/config/SecurityConfig.java`
- `backend/src/main/java/com/tushar/demo/timetracker/controller/AuthController.java`
- `backend/src/main/java/com/tushar/demo/timetracker/model/Users.java`
- `backend/src/main/java/com/tushar/demo/timetracker/model/OnboardingEntity.java`

#### Agentic backend profile
- FastAPI + LangGraph orchestration surface.
- Knowledge and preferences stored through FAISS index + file metadata/config.
- CORS middleware configured via env (`CORS_ALLOWED_ORIGINS`, optional regex).
- No equivalent JWT enforcement layer at the route level.

Core evidence:

- `backend/main.py` (Agentic)
- `backend/app/api/knowledge.py` (Agentic)
- `backend/app/api/approval.py` (Agentic)
- `backend/app/services/vector_store.py` (Agentic)
- `backend/app/services/config_storage.py` (Agentic)

### Runtime Truth (Production Checks)
Observed from origin-aware OPTIONS preflight probes during this audit:

| Probe | Result | Interpretation |
| --- | --- | --- |
| AlterEgo backend `/api/auth/signup` from `https://alteregoconventional.vercel.app` | 200 + `Access-Control-Allow-Origin` set | Signup CORS path is healthy now. |
| Agentic backend `/api/health` from `https://agenticlyf.vercel.app` | 400 `Disallowed CORS origin` | Agentic browser calls remain blocked by CORS policy mismatch. |
| Agentic backend `/api/chat` from `https://alteregoconventional.vercel.app` | 400 `Disallowed CORS origin` | Cross-product coach calls are currently fragile at browser boundary. |

### Alignment Scoreboard
| Category | Score (10) | Why |
| --- | --- | --- |
| Experience continuity | 8 | Embedded coach flow and API-prefix routing are thoughtfully wired. |
| Contract coherence | 5 | No shared schema for onboarding, goals, or identity envelope across services. |
| Security coherence | 4 | AlterEgo is token-protected; Agentic is primarily CORS-protected and open. |
| Deployment coherence | 6 | Unified local gateway exists, but cloud behavior still depends on env hygiene. |
| Data continuity | 5 | Similar concepts (goals/preferences/profile) live in two stores without sync rules. |

**Composite alignment score: 5.6 / 10**

### The Three Biggest Product Risks
1. Identity split-brain: A user authenticated in AlterEgo is not cryptographically represented to Agentic APIs.
2. Preference drift: Onboarding and preference data can diverge between relational and vector/file stores.
3. Operational fragility: A single malformed CORS env value can disable signup/coach pathways despite healthy services.

### Editorial Recommendation
Treat current integration as **UI federation with API adjacency**, not yet **backend unification**.

To become a single product system, the next evolution should be:

1. Shared identity contract (JWT passthrough or signed internal service token).
2. Shared profile/onboarding canonical model with event or sync bridge.
3. Enforced environment policy (validated CORS origin lists, deployment guardrails).
4. Agentic route protection policy matching AlterEgo trust posture.

### 30-Day North-Star
- Week 1: Stabilize CORS and publish a definitive origin matrix for both products.
- Week 2: Add auth boundary for Agentic write and chat endpoints.
- Week 3: Define canonical onboarding/profile contract and map both stores.
- Week 4: Add synthetic probes for signup, coach chat, onboarding read/write, and origin preflight.

When these four are complete, AlterEgo and Agentic shift from co-branded surfaces to one coherent platform spine.
