# AI Agent Ecosystem Backend
# FastAPI application entry point

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from app.agents.registry import get_agent_registry
from app.llm import get_llm_service, reset_llm_service, ChatMessage, CompletionRequest
from app.api.knowledge import router as knowledge_router
from app.agents.factory import initialize_agents
from app.agents.base import AgentType
import logging


# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger("agent_factory")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure LLM service is initialized before agents
    await get_llm_service()
    await initialize_agents()
    yield
    # (Optional) Add shutdown/cleanup logic here

app = FastAPI(
    title="AI Agent Ecosystem API",
    description="Backend API for the AI Agent Ecosystem",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(knowledge_router)


class ChatRequest(BaseModel):
    message: str
    agent: str = "orchestrator"
    conversation_id: str

class ChatResponse(BaseModel):
    response: str
    agent: str
    reasoning: Optional[str] = None
    timestamp: datetime

@app.get("/")
async def root():
    return {"message": "AI Agent Ecosystem API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/health")
async def api_health_check():
    """Simple API health check without LLM dependencies."""
    return {
        "status": "healthy",
        "api": "ready",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        registry = get_agent_registry()
        # Find orchestrator agent by type
        logger.info(f"{registry.get_agent_ids()}")
        orchestrators = registry.get_agents_by_type(AgentType.ORCHESTRATOR)
        orchestrator = orchestrators[0] if orchestrators else None
        if orchestrator is None:
            logging.error("Orchestrator agent not found in registry. Agent ecosystem may not be initialized.")
            return ChatResponse(
                response="I'm the orchestrator agent. I encountered an issue: Orchestrator agent not found.",
                agent="orchestrator",
                reasoning="Error: Orchestrator agent not found in registry.",
                timestamp=datetime.now()
            )
        state = {
            "user_input": request.message,
            "context": {},
            "conversation_id": request.conversation_id,
            "agent": orchestrator.agent_id
        }
        result = await orchestrator.execute(state)
        # Support both tuple and single return
        if isinstance(result, tuple):
            response = result[0]
            reasoning = result[1] if len(result) > 1 else None
        else:
            response = result
            reasoning = None
        return ChatResponse(
            response=response,
            agent=orchestrator.agent_id,
            reasoning=reasoning,
            timestamp=datetime.now()
        )
    except Exception as e:
        logging.error(f"Orchestrator Error: {e}")
        return ChatResponse(
            response=f"I'm the orchestrator agent. I encountered an issue: {str(e)}.",
            agent="orchestrator",
            reasoning=f"Error: {str(e)}",
            timestamp=datetime.now()
        )

@app.get("/api/agents/status")
async def get_agents_status():
    try:
        llm_service = await get_llm_service()
        health_status = await llm_service.health_check()
        current_provider = llm_service.get_current_provider()
        
        # Convert health status to the expected format
        formatted_health = {}
        for provider_type, health in health_status.items():
            provider_name = str(provider_type).lower().replace('llmprovidertype.', '')
            formatted_health[provider_name] = {
                "is_healthy": health.is_healthy,
                "model": health.model,
                "response_time_ms": health.response_time_ms,
                "error": health.error
            }
        
        return {
            "current_provider": str(current_provider).lower().replace('llmprovidertype.', ''),
            "health_status": formatted_health,
            "agents": {
                "orchestrator": {"status": "active", "description": "Main coordination agent"},
                "productivity": {"status": "active", "description": "Task and goal management"},
                "health": {"status": "active", "description": "Wellness and habits"},
                "finance": {"status": "active", "description": "Budget and expenses"},
                "scheduling": {"status": "active", "description": "Calendar management"},
                "journal": {"status": "active", "description": "Reflection and insights"}
            }
        }
    except Exception as e:
        print(f"Status check error: {e}")
        # Fallback with error indication
        return {
            "current_provider": "openai",
            "health_status": {
                "openai": {"is_healthy": False, "model": "gpt-4", "response_time_ms": 0, "error": str(e)},
                "ollama": {"is_healthy": False, "model": "llama3.2:3b", "response_time_ms": 0, "error": str(e)}
            },
            "agents": {
                "orchestrator": {"status": "active", "description": "Main coordination agent"},
                "productivity": {"status": "active", "description": "Task and goal management"},
                "health": {"status": "active", "description": "Wellness and habits"},
                "finance": {"status": "active", "description": "Budget and expenses"},
                "scheduling": {"status": "active", "description": "Calendar management"},
                "journal": {"status": "active", "description": "Reflection and insights"}
            }
        }

class ProviderSwitchRequest(BaseModel):
    provider: str

@app.post("/api/llm/switch-provider")
async def switch_provider(request: ProviderSwitchRequest):
    try:
        from app.llm.base import LLMProviderType
        
        # Validate provider type
        if request.provider not in ['openai', 'ollama']:
            raise HTTPException(status_code=400, detail="Invalid provider type")
        
        provider_type = LLMProviderType.OPENAI if request.provider == 'openai' else LLMProviderType.OLLAMA
        
        # Reset the service to pick up fresh configuration
        llm_service = await reset_llm_service()
        success = await llm_service.switch_provider(provider_type)
        
        if success:
            return {
                "success": True,
                "current_provider": str(llm_service.get_current_provider()),
                "message": f"Successfully switched to {request.provider}"
            }
        else:
            return {
                "success": False,
                "current_provider": str(llm_service.get_current_provider()),
                "message": f"Failed to switch to {request.provider} - provider may not be available"
            }
            
    except Exception as e:
        print(f"Provider switch error: {e}")
        raise HTTPException(status_code=500, detail=f"Provider switch failed: {str(e)}")

class ConnectionTestRequest(BaseModel):
    provider: str
    config: dict = {}

@app.post("/api/llm/test-connection")
async def test_connection(request: ConnectionTestRequest):
    try:
        from app.llm.base import LLMProviderType
        
        if request.provider not in ['openai', 'ollama']:
            raise HTTPException(status_code=400, detail="Invalid provider type")
        
        provider_type = LLMProviderType.OPENAI if request.provider == 'openai' else LLMProviderType.OLLAMA
        
        llm_service = await get_llm_service()
        health_status = await llm_service.health_check()
        provider_health = health_status.get(provider_type)
        
        if provider_health:
            return {
                "healthy": provider_health.is_healthy,
                "responseTime": provider_health.response_time_ms,
                "model": provider_health.model,
                "error": provider_health.error if not provider_health.is_healthy else None
            }
        else:
            return {
                "healthy": False,
                "error": "Provider not available"
            }
            
    except Exception as e:
        return {
            "healthy": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    logger.info("[main.py] FastAPI startup: initializing agent ecosystem.")
    uvicorn.run(app, host="0.0.0.0", port=8000)