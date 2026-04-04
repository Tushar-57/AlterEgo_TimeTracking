# AI Coding Instructions for AI Agent Ecosystem

This document provides comprehensive guidance for AI coding assistants working on the AI Agent Ecosystem project, a personal AI assistant system with specialized agents.

## Project Overview

**Architecture**: Multi-agent AI ecosystem with FastAPI backend and React/TypeScript frontend
**Primary Purpose**: Personal AI assistant with specialized agents for productivity, health, finance, scheduling, and journaling
**Tech Stack**: FastAPI, React/Vite, LangGraph, OpenAI/Ollama, FAISS vector store, Google Services integration

## Core Architecture Patterns

### 1. Multi-Agent System Design

**Agent Types & Responsibilities**:
- **Orchestrator Agent**: Primary coordinator, intent classification, agent handoffs, conversation continuity
- **Productivity Agent**: Task management, goal tracking, productivity analytics, workflow optimization
- **Health Agent**: Wellness tracking, habit formation, health routines, metric monitoring
- **Finance Agent**: Expense tracking, budget management, financial goals, spending analysis
- **Scheduling Agent**: Calendar management, appointment booking, time optimization
- **Journal Agent**: Daily reflections, mood tracking, personal growth, milestone celebration
- **General Agent**: Fallback handling, general queries, unclassified requests

**Key Files**:
- `backend/app/agents/base.py`: Agent base classes and enums
- `backend/app/agents/orchestrator.py`: Main coordinator with intent classification
- `backend/app/agents/factory.py`: Agent creation and lifecycle management
- `backend/app/agents/registry.py`: Active agent management and routing
- `backend/app/agents/communication.py`: Inter-agent messaging protocol

### 2. LLM Provider Architecture

**Provider Pattern**: Abstracted LLM integration supporting multiple providers
**Default Provider**: Ollama (local) to avoid API quota usage
**Provider Switching**: Dynamic switching without health check quota consumption

**Implementation Pattern**:
```python
# In factory.py - Skip health checks during switching
async def _create_provider_by_type(self, provider_type: str, skip_health_check: bool = False):
    """Create provider without hitting API quotas during switches"""
    
# In service.py - Direct provider creation for switching
async def switch_provider(self, new_provider: str):
    """Switch providers without unnecessary API calls"""
```

**Key Files**:
- `backend/app/llm/factory.py`: Provider creation and switching logic
- `backend/app/llm/service.py`: LLM service layer with provider management
- `backend/app/llm/openai_provider.py`: OpenAI API integration
- `backend/app/llm/ollama_provider.py`: Local Ollama integration

### 3. Knowledge Base & RAG System

**Vector Store**: FAISS-based similarity search with graceful degradation
**RAG Pattern**: Retrieval-Augmented Generation for personalized responses
**Knowledge Types**: Patterns, preferences, interactions, insights

**Implementation Pattern**:
```python
# Graceful embedding failure handling
try:
    embeddings = await self.embedding_service.embed_text(query)
    results = self.vector_store.search(embeddings)
except Exception as e:
    logger.warning(f"Embedding failed: {e}")
    return []  # Graceful degradation
```

**Key Files**:
- `backend/app/services/knowledge_base.py`: Knowledge management service
- `backend/app/services/vector_store.py`: FAISS vector operations
- `backend/app/models/knowledge.py`: Knowledge entry data models

### 4. Frontend-Backend Integration

**API Architecture**: RESTful endpoints with real-time status updates
**State Management**: React hooks for provider status and agent communication
**Error Handling**: Toast notifications with fallback UI states

**Critical Endpoints**:
- `/api/llm/status`: Provider status and configuration
- `/api/llm/switch-provider`: Provider switching without quota usage
- `/api/agents/{agent_type}/chat`: Agent-specific chat endpoints

**Key Frontend Files**:
- `frontend/src/App.tsx`: Main app with provider status management
- `frontend/src/components/settings/SettingsPanel.tsx`: Provider switching UI
- `frontend/src/components/chat/ChatInterface.tsx`: Agent communication interface

## Coding Standards & Patterns

### 1. Agent Development Pattern

**Base Agent Implementation**:
```python
class NewAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id=f"new_agent_{uuid.uuid4()}",
            agent_type=AgentType.NEW,
            capabilities=self._get_capabilities(),
            prompt=get_agent_prompt(AgentType.NEW)
        )
    
    async def execute(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Main execution logic with error handling"""
        try:
            # Agent-specific logic here
            return {"response": response, "status": "success"}
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return {"error": str(e), "status": "error"}
```

**Registry Registration**:
```python
# In factory.py
agent = NewAgent()
self.registry.register_agent(agent)
```

### 2. LLM Provider Integration

**Provider Implementation Pattern**:
```python
class NewProvider(BaseLLMProvider):
    async def generate_response(self, prompt: str, **kwargs) -> str:
        """Generate response with error handling"""
        
    async def health_check(self) -> bool:
        """Health check - avoid in switching scenarios"""
        
    async def embed_text(self, text: str) -> List[float]:
        """Embedding generation with fallback"""
```

### 3. Frontend Component Pattern

**Status Management**:
```typescript
const [currentProvider, setCurrentProvider] = useState<string>('ollama');
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

useEffect(() => {
    fetchProviderStatus();
}, []);
```

**API Integration**:
```typescript
const switchProvider = async (provider: string) => {
    try {
        const response = await fetch('http://localhost:8000/api/llm/switch-provider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider })
        });
        // Handle response
    } catch (error) {
        toast.error('Provider switch failed');
    }
};
```

## Configuration Management

### Environment Variables
```bash
# LLM Configuration
LLM_PROVIDER=ollama  # Default to avoid API quotas
OPENAI_API_KEY=your_key_here
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Services
GOOGLE_CREDENTIALS_PATH=./credentials/google.json
LANGSMITH_API_KEY=your_key_here
```

### Default Provider Priority
1. **Ollama** (local, no quotas) - Primary default
2. **OpenAI** (API, quota limited) - Fallback for specific needs

## Error Handling Patterns

### Backend Error Handling
```python
try:
    result = await agent.execute(user_input, context)
except Exception as e:
    logger.error(f"Agent execution failed: {e}")
    return {"error": "Agent temporarily unavailable", "status": "error"}
```

### Frontend Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

useEffect(() => {
    if (error) {
        toast.error(error);
        setError(null);
    }
}, [error]);
```

### Vector Store Graceful Degradation
```python
async def search_knowledge(self, query: str) -> List[Dict]:
    try:
        return await self.vector_search(query)
    except Exception as e:
        logger.warning(f"Vector search failed: {e}")
        return []  # Return empty results instead of crashing
```

## Testing Patterns

### Agent Testing
```python
@pytest.mark.asyncio
async def test_agent_execution():
    agent = ProductivityAgent()
    result = await agent.execute("help me with tasks", {})
    assert result["status"] == "success"
    assert "response" in result
```

### API Testing
```python
def test_provider_switch_endpoint():
    response = client.post("/api/llm/switch-provider", json={"provider": "ollama"})
    assert response.status_code == 200
    assert response.json()["current_provider"] == "ollama"
```

## Development Workflow

### 1. Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Development
```bash
cd frontend
npm run dev  # Runs on localhost:3000 with API proxy
```

### 3. Provider Testing
- Always test with Ollama first (default, no quota usage)
- Verify provider switching works without unnecessary API calls
- Test graceful degradation when services are unavailable

## Common Pitfalls & Solutions

### 1. Provider Switching Issues
**Problem**: Health checks consuming OpenAI quota during switches
**Solution**: Use `skip_health_check=True` parameter in provider creation

### 2. Frontend-Backend Mismatch
**Problem**: Frontend showing wrong provider status
**Solution**: Ensure frontend uses `/api/llm/status` endpoint and defaults to Ollama

### 3. Vector Store Failures
**Problem**: Embedding failures crashing knowledge search
**Solution**: Implement graceful degradation with empty result fallbacks

### 4. Agent Registration
**Problem**: Agents not available for routing
**Solution**: Ensure proper registration in `AgentFactory.initialize_agent_ecosystem()`

## File Organization Patterns

### Backend Structure
```
backend/app/
├── agents/          # Agent implementations
├── api/            # FastAPI endpoints  
├── llm/            # LLM provider abstractions
├── models/         # Data models
├── services/       # Business logic
└── langgraph/      # Workflow definitions
```

### Frontend Structure
```
frontend/src/
├── components/     # React components
│   ├── chat/      # Chat interface components
│   ├── settings/  # Settings and provider management
│   └── ui/        # Reusable UI components
└── lib/           # Utilities and helpers
```

## Quick Actions Implementation

**Pattern**: Predefined actions for common agent tasks
**Implementation**: 
- Frontend: Quick action buttons in chat interface
- Backend: Predefined prompts for agent types
- Integration: Direct agent routing with context

```typescript
const quickActions = {
    productivity: ["Add task", "Review goals", "Check progress"],
    health: ["Log workout", "Track habit", "Wellness check"],
    finance: ["Add expense", "Budget review", "Financial goals"]
};
```

## Integration Guidelines

### Google Services
- Optional integration (check `google_sheets_enabled` config)
- Graceful degradation when credentials unavailable
- Permission-based access patterns

### LangSmith Monitoring
- Optional observability (check `langsmith_api_key` config)  
- Trace agent interactions and LLM calls
- Use `@traceable` decorator for key functions

## Security Considerations

- Never commit API keys or credentials
- Use environment variables for all sensitive config
- Implement proper error handling to avoid data leaks
- Validate all user inputs before processing

---

This document should be updated as the codebase evolves. When making changes, ensure patterns remain consistent with the established architecture and update this guide accordingly.
