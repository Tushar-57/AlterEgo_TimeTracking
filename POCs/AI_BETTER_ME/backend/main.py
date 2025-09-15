# AI Agent Ecosystem Backend
# FastAPI application entry point

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any
import asyncio
from app.langgraph.workflow import AgentGraphWorkflow
import json
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
    # Initialize agents (LLM service will be initialized on-demand)
    await initialize_agents()
    
    # Initialize the workflow with agents now loaded
    global _workflow, _graph
    try:
        _workflow = AgentGraphWorkflow()
        _graph = _workflow.get_compiled_graph()
        logger.info("Successfully initialized LangGraph workflow with agents")
    except Exception as e:
        logger.warning(f"Could not initialize workflow with agents: {e}")
    
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
    response: Any  # Accepts str, dict, list, etc.
    agent: str
    reasoning: Any = None  # Accepts any type
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
        # Use LangGraph workflow for multi-agent orchestration
        graph_workflow = await get_workflow()
        result = await graph_workflow.run(state)
        logger.info(f"[DEBUG] workflow.run result type: {type(result)} value: {result}")
        response = None
        reasoning = None
        logger.info(f"[DEBUG] Step: result type: {type(result)} value: {result}")
        # Handle dict
        if isinstance(result, dict):
            logger.info(f"[DEBUG] Dict result keys: {list(result.keys())}")
            response = result.get("response")
            reasoning = result.get("reasoning")
        # Handle tuple
        elif isinstance(result, tuple):
            logger.info(f"[DEBUG] Tuple result length: {len(result)} value: {result}")
            if len(result) == 2:
                response, reasoning = result
            elif len(result) == 1:
                response = result[0]
                reasoning = None
            else:
                response = str(result)
                reasoning = None
        # Handle string (try to parse as JSON)
        elif isinstance(result, str):
            logger.info(f"[DEBUG] String result: {result}")
            try:
                parsed = json.loads(result)
                logger.info(f"[DEBUG] Parsed JSON from string result: {parsed}")
                response = parsed.get("response", str(parsed))
                reasoning = parsed.get("reasoning")
            except Exception as json_err:
                logger.info(f"[DEBUG] Could not parse string result as JSON: {json_err}")
                response = result
                reasoning = None
        else:
            logger.info(f"[DEBUG] Unexpected result type: {type(result)} value: {result}")
            response = str(result)
            reasoning = None
        logger.info(f"[DEBUG] Final response type: {type(response)} value: {response}")
        logger.info(f"[DEBUG] Final reasoning type: {type(reasoning)} value: {reasoning}")
        return ChatResponse(
            response=response,
            agent=state.get("agent", orchestrator.agent_id),
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
                "openai": {"is_healthy": False, "model": "gpt-3.5-turbo", "response_time_ms": 0, "error": str(e)},
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
        
        # Import global service
        from app.llm import service as llm_service_module
        from app.llm.service import LLMService
        from app.llm.config import LLMConfig
        import os
        
        # Create new service with updated provider preference
        config = LLMConfig.from_env(dict(os.environ))
        config.provider = provider_type  # Set the preferred provider
        
        # Create new service instance
        new_service = LLMService(config)
        new_service._initialized = True  # Mark as initialized to bypass initialize()
        
        # Create and add the specific provider directly to avoid config conflicts
        try:
            if provider_type == LLMProviderType.OLLAMA:
                # Create Ollama provider directly
                from app.llm.ollama_provider import OllamaProvider
                provider = OllamaProvider(
                    endpoint=config.ollama_endpoint,
                    model=config.ollama_model,
                    max_tokens=config.max_tokens,
                    temperature=config.temperature
                )
                # Initialize Ollama provider (should not hit OpenAI)
                await provider.initialize()
                new_service.factory._providers[provider_type] = provider
                new_service.factory._current_provider = provider
                
            elif provider_type == LLMProviderType.OPENAI:
                # Create OpenAI provider directly (but skip health check)
                from app.llm.openai_provider import OpenAIProvider
                provider = OpenAIProvider(
                    api_key=config.openai_api_key,
                    model=config.openai_model,
                    max_tokens=config.max_tokens,
                    temperature=config.temperature,
                    base_url=config.openai_base_url
                )
                # Don't initialize to avoid quota usage
                new_service.factory._providers[provider_type] = provider
                new_service.factory._current_provider = provider
            
            # Update the global service reference
            if llm_service_module._llm_service is not None:
                await llm_service_module._llm_service.shutdown()
            llm_service_module._llm_service = new_service
            
            return {
                "success": True,
                "current_provider": str(provider_type),
                "message": f"Successfully switched to {request.provider}"
            }
            
        except Exception as provider_error:
            return {
                "success": False,
                "current_provider": "none",
                "message": f"Failed to create {request.provider} provider: {str(provider_error)}"
            }
            
    except Exception as e:
        print(f"Provider switch error: {e}")
        raise HTTPException(status_code=500, detail=f"Provider switch failed: {str(e)}")

class ConnectionTestRequest(BaseModel):
    provider: str
    config: dict = {}

@app.get("/api/llm/status")
async def get_llm_status():
    """Get current LLM provider status."""
    try:
        from app.llm import service as llm_service_module
        
        # Get current service if available
        current_service = llm_service_module._llm_service
        
        status = {
            "current_provider": None,
            "providers": {
                "openai": {"healthy": False, "model": None, "responseTime": None},
                "ollama": {"healthy": False, "model": None, "responseTime": None}
            }
        }
        
        if current_service and current_service._initialized:
            current_provider_type = current_service.get_current_provider()
            if current_provider_type:
                status["current_provider"] = str(current_provider_type).split('.')[-1].lower()
                
                # Check provider health
                try:
                    provider = current_service.factory._current_provider
                    if provider:
                        # Mark current provider as healthy if it exists
                        provider_name = str(current_provider_type).split('.')[-1].lower()
                        status["providers"][provider_name]["healthy"] = True
                        
                        # Get model info
                        if hasattr(provider, 'model'):
                            status["providers"][provider_name]["model"] = provider.model
                            
                except Exception as e:
                    logger.error(f"Error checking provider health: {e}")
        
        # Always check Ollama availability
        try:
            import requests
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                status["providers"]["ollama"]["healthy"] = True
                tags_data = response.json()
                if tags_data.get("models"):
                    status["providers"]["ollama"]["model"] = tags_data["models"][0]["name"]
        except Exception:
            pass  # Ollama not available
            
        return status
        
    except Exception as e:
        logger.error(f"Error getting LLM status: {e}")
        return {
            "current_provider": None,
            "providers": {
                "openai": {"healthy": False, "model": None, "responseTime": None},
                "ollama": {"healthy": False, "model": None, "responseTime": None}
            }
        }

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

# Global workflow instance
_workflow = None
_graph = None

async def get_workflow():
    """Get or create the workflow instance."""
    global _workflow, _graph
    if _workflow is None:
        _workflow = AgentGraphWorkflow()
        _graph = _workflow.get_compiled_graph()
        logger.info("Successfully created LangGraph workflow")
    return _workflow

async def get_graph():
    """Get the compiled graph for langgraph dev."""
    global _graph
    if _graph is None:
        await get_workflow()
    return _graph

# Global cache for LangGraph dev
_dev_graph_cache = None

# Create LangGraph workflow instance for langgraph dev
def get_graph_for_dev():
    """
    Factory function to create the graph for LangGraph dev.
    This will be called by LangGraph dev when it needs the graph.
    Uses caching to avoid recreating the graph on every request.
    """
    global _dev_graph_cache
    
    # Return cached graph if available
    if _dev_graph_cache is not None:
        logger.debug("Returning cached graph for LangGraph dev")
        return _dev_graph_cache
    
    try:
        # Ensure agents are initialized when graph factory is called
        registry = get_agent_registry()
        agents = registry.get_all_agents()
        
        # If no agents, try to initialize them
        if not agents:
            logger.info("No agents found, initializing agent ecosystem for LangGraph dev")
            import asyncio
            
            # Create a new event loop if none exists (for LangGraph dev context)
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Initialize agents synchronously for LangGraph dev
            from app.agents.factory import AgentFactory
            factory = AgentFactory()
            
            # Run initialization in the event loop
            if loop.is_running():
                # If loop is already running, we need to use a different approach
                logger.warning("Event loop already running, attempting direct agent creation")
                try:
                    # Try to create agents directly without async
                    from app.agents.base import AgentType
                    from app.agents.orchestrator import OrchestratorAgent
                    from app.agents.specialized import HealthAgent, ProductivityAgent
                    
                    # Create and register agents directly
                    agents_to_create = [
                        (AgentType.ORCHESTRATOR, OrchestratorAgent),
                        (AgentType.PRODUCTIVITY, ProductivityAgent),
                        (AgentType.HEALTH, HealthAgent),
                        # Add other agent types as needed
                    ]
                    
                    for agent_type, agent_class in agents_to_create:
                        try:
                            agent = agent_class()
                            registry.register_agent(agent)
                            logger.info(f"Direct registered agent: {agent.agent_id}")
                        except Exception as e:
                            logger.warning(f"Failed to create {agent_type}: {e}")
                            
                except Exception as e:
                    logger.warning(f"Direct agent creation failed: {e}")
            else:
                # Run async initialization
                loop.run_until_complete(factory.initialize_agent_ecosystem())
            
            # Re-check for agents
            agents = registry.get_all_agents()
        
        if agents:
            logger.info(f"Creating graph with {len(agents)} agents for LangGraph dev")
            workflow = AgentGraphWorkflow()
            compiled_graph = workflow.get_compiled_graph()
            logger.info("Successfully created full agent ecosystem graph for LangGraph dev")
            
            # Cache the graph for future requests
            _dev_graph_cache = compiled_graph
            return compiled_graph
        else:
            logger.warning("Still no agents found after initialization attempt, creating placeholder graph")
            # Fallback: create a simple placeholder graph
            from langgraph.graph import StateGraph, START, END
            simple_graph = StateGraph(dict)
            simple_graph.add_node("placeholder", lambda x: {"response": "Agents not yet loaded"})
            simple_graph.add_edge(START, "placeholder")
            simple_graph.add_edge("placeholder", END)
            
            # Cache the fallback graph as well
            _dev_graph_cache = simple_graph.compile()
            return _dev_graph_cache
            
    except Exception as e:
        logger.warning(f"Error creating graph for dev: {e}")
        # Fallback: create a simple placeholder graph
        from langgraph.graph import StateGraph, START, END
        simple_graph = StateGraph(dict)
        simple_graph.add_node("error_placeholder", lambda x: {"response": f"Graph creation error: {str(e)}"})
        simple_graph.add_edge(START, "error_placeholder")
        simple_graph.add_edge("error_placeholder", END)
        
        # Cache the error fallback graph
        _dev_graph_cache = simple_graph.compile()
        return _dev_graph_cache
        simple_graph.add_node("error", lambda x: {"response": f"Error: {str(e)}"})
        simple_graph.add_edge(START, "error")
        simple_graph.add_edge("error", END)
        return simple_graph.compile()

# Export the graph factory function for langgraph dev
graph = get_graph_for_dev

if __name__ == "__main__":
    import uvicorn
    logger.info("[main.py] FastAPI startup: initializing agent ecosystem.")
    uvicorn.run(app, host="0.0.0.0", port=8000)