"""
Agent factory for creating and initializing agents with LangSmith observability.
"""

import logging
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime

from langsmith import Client as LangSmithClient
from langsmith.run_helpers import traceable

from .base import BaseAgent, AgentType, AgentCapability
from .orchestrator import OrchestratorAgent
from .specialized_agents import HealthAgent, ProductivityAgent
from .registry import get_agent_registry
from .communication import get_communication_protocol, start_communication_protocol
from .prompts import get_agent_prompt
from .communication import MessageType
from .base import AgentMessage

# Ensure logger outputs to console
logger = logging.getLogger(__name__)
if not logger.hasHandlers():
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(name)s: %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

logger.info("[AgentFactory] Logger initialized and outputting to console.")

class AgentFactory:
    # Removed _register_capability_handlers: agent details and capabilities are already indexed and used for routing in registry and protocol.
    """Factory for creating and managing AI agents with LangSmith integration."""
    
    def __init__(self):
        self.registry = get_agent_registry()
        self.communication = get_communication_protocol()
        self._langsmith_client: Optional[LangSmithClient] = None
        self._initialized = False

    async def create_agent(self, 
            agent_type: AgentType,
            agent_id: Optional[str] = None,
            custom_capabilities: Optional[List[AgentCapability]] = None,
            custom_prompt: Optional[str] = None,
            skip_llm_init: bool = False) -> Optional[BaseAgent]:
        """
        Create an agent of the specified type.
        Args:
            agent_type: Type of agent to create
            agent_id: Custom agent ID (optional)
            custom_capabilities: Custom capabilities to add (optional)
            custom_prompt: Custom system prompt (optional)
        Returns:
            Created agent instance or None if creation failed
        """
        try:
            logger.info(json.dumps({
                "timestamp": datetime.utcnow().isoformat(),
                "step": "agent_creation_start",
                "agent_type": agent_type.value,
                "agent_id": agent_id
            }, indent=2))
            if agent_id is None:
                agent_id = f"{agent_type.value}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            # Check if agent already exists
            if self.registry.get_agent(agent_id):
                logger.warning(json.dumps({
                    "timestamp": datetime.utcnow().isoformat(),
                    "step": "agent_exists",
                    "agent_id": agent_id
                }, indent=2))
                return None
            agent = None
            if agent_type == AgentType.ORCHESTRATOR:
                agent = OrchestratorAgent()
                if agent_id != "orchestrator_main":
                    agent.agent_id = agent_id
            elif agent_type == AgentType.HEALTH:
                # Use specialized health agent
                agent = HealthAgent()
                if agent_id != "health_specialized":
                    agent.agent_id = agent_id
            elif agent_type == AgentType.PRODUCTIVITY:
                # Use specialized productivity agent
                agent = ProductivityAgent()
                if agent_id != "productivity_specialized":
                    agent.agent_id = agent_id
            elif agent_type == AgentType.FINANCE:
                # Use specialized finance agent
                from .specialized_agents import FinanceAgent
                agent = FinanceAgent()
                if agent_id != "finance_specialized":
                    agent.agent_id = agent_id
            elif agent_type == AgentType.SCHEDULING:
                # Use specialized scheduling agent
                from .specialized_agents import SchedulingAgent
                agent = SchedulingAgent()
                if agent_id != "scheduling_specialized":
                    agent.agent_id = agent_id
            elif agent_type == AgentType.JOURNAL:
                # Use specialized journal agent
                from .specialized_agents import JournalAgent
                agent = JournalAgent()
                if agent_id != "journal_specialized":
                    agent.agent_id = agent_id
            else:
                # Use generic agent for other types
                agent = await self._create_generic_agent(
                    agent_type=agent_type,
                    agent_id=agent_id,
                    custom_capabilities=custom_capabilities,
                    custom_prompt=custom_prompt,
                    skip_llm_init=skip_llm_init
                )
            if agent:
                if custom_capabilities:
                    for capability in custom_capabilities:
                        agent.add_capability(capability)
                if self.registry.register_agent(agent):
                    logger.info(json.dumps({
                        "timestamp": datetime.utcnow().isoformat(),
                        "step": "agent_created",
                        "agent_id": agent_id,
                        "agent_type": agent_type.value
                    }, indent=2))
                    return agent
                else:
                    logger.error(json.dumps({
                        "timestamp": datetime.utcnow().isoformat(),
                        "step": "agent_register_failed",
                        "agent_id": agent_id
                    }, indent=2))
                    return None
            else:
                logger.error(json.dumps({
                    "timestamp": datetime.utcnow().isoformat(),
                    "step": "agent_create_failed",
                    "agent_type": agent_type.value,
                    "agent_id": agent_id
                }, indent=2))
                return None
        except Exception as e:
            logger.error(json.dumps({
                "timestamp": datetime.utcnow().isoformat(),
                "step": "agent_creation_error",
                "agent_type": agent_type.value,
                "agent_id": agent_id,
                "error": str(e)
            }, indent=2))
            return None

    async def _create_generic_agent(self,
            agent_type: AgentType,
            agent_id: str,
            custom_capabilities: Optional[List[AgentCapability]] = None,
            custom_prompt: Optional[str] = None,
            skip_llm_init: bool = False) -> Optional[BaseAgent]:
        """Create a generic agent for non-orchestrator types. No LLM calls during creation if skip_llm_init is True."""
        try:
            default_capabilities = self._get_default_capabilities(agent_type)
            system_prompt = custom_prompt or get_agent_prompt(agent_type)
            class GenericAgent(BaseAgent):
                async def execute(self, state) -> dict:
                    """Basic execution for generic agents. Always returns a dict."""
                    try:
                        from ..llm.service import get_llm_service
                        from ..llm.base import CompletionRequest, ChatMessage
                        llm_service = await get_llm_service()
                        user_input = state.get("user_input", "")
                        request = CompletionRequest(
                            messages=[
                                ChatMessage(role="system", content=self.system_prompt),
                                ChatMessage(role="user", content=user_input)
                            ],
                            max_tokens=500,
                            temperature=0.7
                        )
                        response = await llm_service.chat_completion(request)
                        logger.info(json.dumps({
                            "timestamp": datetime.utcnow().isoformat(),
                            "step": "agent_llm_response",
                            "agent_id": self.agent_id,
                            "response_type": str(type(response)),
                            "response_content": response.content[:100] + "..." if len(response.content) > 100 else response.content
                        }, indent=2))
                        result = {
                            "response": response.content,
                            "reasoning": {
                                "agent_id": self.agent_id,
                                "step": "agent_llm_response",
                                "method": "llm_completion"
                            }
                        }
                        logger.debug("Agent %s returned: %s", self.agent_id, result)
                        return result
                    except Exception as e:
                        logger.error(json.dumps({
                            "timestamp": datetime.utcnow().isoformat(),
                            "step": "agent_execute_llm_error",
                            "agent_id": self.agent_id,
                            "error": str(e)
                        }, indent=2))
                        # Only fallback to skip if there's an error or skip_llm_init is True
                        if skip_llm_init:
                            logger.info(json.dumps({
                                "timestamp": datetime.utcnow().isoformat(),
                                "response": "LLM call skipped for agent.",
                                "step": "agent_execute_skipped_llm",
                                "agent_id": self.agent_id
                            }, indent=2))
                            result = {
                                "response": None,
                                "reasoning": {
                                    "agent_id": self.agent_id,
                                    "skipped_llm": True,
                                    "note": "LLM disabled or unavailable"
                                }
                            }
                        else:
                            result = {
                                "response": f"I'm a {self.agent_type.value} agent. I encountered an issue: {str(e)}",
                                "reasoning": {
                                    "agent_id": self.agent_id,
                                    "step": "agent_execute_llm_error",
                                    "error": str(e)
                                }
                            }
                        logger.debug("Agent %s returned: %s", self.agent_id, result)
                        return result
            agent = GenericAgent(
                agent_id=agent_id,
                agent_type=agent_type,
                capabilities=default_capabilities,
                system_prompt=system_prompt
            )
            return agent
        except Exception as e:
            logger.error(json.dumps({
                "timestamp": datetime.utcnow().isoformat(),
                "step": "generic_agent_creation_error",
                "agent_type": agent_type.value,
                "agent_id": agent_id,
                "error": str(e)
            }, indent=2))
            return None
    
    def _get_default_capabilities(self, agent_type: AgentType) -> List[AgentCapability]:
        """Get default capabilities for each agent type."""
        capabilities_map = {
            AgentType.PRODUCTIVITY: [
                AgentCapability(
                    name="task_management",
                    description="Manage tasks, goals, and productivity tracking",
                    required_tools=["google_sheets", "calendar"]
                ),
                AgentCapability(
                    name="goal_tracking",
                    description="Track and analyze goal progress",
                    required_tools=["analytics", "reporting"]
                ),
                AgentCapability(
                    name="productivity_analysis",
                    description="Analyze productivity patterns and suggest improvements",
                    required_tools=["data_analysis"]
                )
            ],
            AgentType.HEALTH: [
                AgentCapability(
                    name="habit_tracking",
                    description="Track and manage health habits",
                    required_tools=["data_storage", "reminders"]
                ),
                AgentCapability(
                    name="wellness_monitoring",
                    description="Monitor wellness metrics and trends",
                    required_tools=["analytics", "visualization"]
                ),
                AgentCapability(
                    name="routine_management",
                    description="Manage daily and weekly health routines",
                    required_tools=["scheduling", "notifications"]
                )
            ],
            AgentType.FINANCE: [
                AgentCapability(
                    name="expense_tracking",
                    description="Track and categorize expenses",
                    required_tools=["google_sheets", "data_analysis"]
                ),
                AgentCapability(
                    name="budget_management",
                    description="Manage budgets and financial goals",
                    required_tools=["analytics", "reporting"]
                ),
                AgentCapability(
                    name="financial_analysis",
                    description="Analyze spending patterns and financial health",
                    required_tools=["data_analysis", "visualization"]
                )
            ],
            AgentType.SCHEDULING: [
                AgentCapability(
                    name="calendar_management",
                    description="Manage calendar events and scheduling",
                    required_tools=["google_calendar", "scheduling"]
                ),
                AgentCapability(
                    name="appointment_booking",
                    description="Book and manage appointments",
                    required_tools=["calendar", "notifications"]
                ),
                AgentCapability(
                    name="time_optimization",
                    description="Optimize time allocation and scheduling",
                    required_tools=["analytics", "optimization"]
                )
            ],
            AgentType.JOURNAL: [
                AgentCapability(
                    name="reflection_guidance",
                    description="Guide users through reflection exercises",
                    required_tools=["prompting", "conversation"]
                ),
                AgentCapability(
                    name="mood_tracking",
                    description="Track and analyze mood patterns",
                    required_tools=["data_storage", "analytics"]
                ),
                AgentCapability(
                    name="growth_insights",
                    description="Provide insights on personal growth",
                    required_tools=["analysis", "reporting"]
                )
            ],
            AgentType.GENERAL: [
                AgentCapability(
                    name="general_assistance",
                    description="Provide general help and information",
                    required_tools=["conversation", "knowledge_base"]
                ),
                AgentCapability(
                    name="agent_coordination",
                    description="Coordinate with other agents",
                    required_tools=["communication", "routing"]
                ),
                AgentCapability(
                    name="fallback_support",
                    description="Handle requests when other agents are unavailable",
                    required_tools=["conversation", "basic_tools"]
                )
            ]
        }
        
        return capabilities_map.get(agent_type, [])
    
    @traceable(name="initialize_agent_ecosystem")
    async def initialize_agent_ecosystem(self, 
                                        agent_types: Optional[List[AgentType]] = None) -> Dict[str, Any]:
        """
        Initialize the complete agent ecosystem.
        
        Args:
            agent_types: List of agent types to create (None for all)
            
        Returns:
            Initialization results
        """
        try:
            if self._initialized:
                logger.warning("Agent ecosystem already initialized")
                return {"status": "already_initialized"}
            
            # Default to creating all agent types
            if agent_types is None:
                agent_types = list(AgentType)
            
            # Ensure orchestrator is first
            if AgentType.ORCHESTRATOR in agent_types:
                agent_types.remove(AgentType.ORCHESTRATOR)
                agent_types.insert(0, AgentType.ORCHESTRATOR)
            
            created_agents = []
            failed_agents = []
            logger.info(f"Initializing agents: {[a.value for a in agent_types]}")
            # Create agents
            for agent_type in agent_types:
                logger.info(f"Creating agent of type: {agent_type}")
                agent = await self.create_agent(agent_type)
                if agent:
                    logger.info(f"Agent created: {agent.agent_id} ({agent_type.value})")
                    created_agents.append(agent.agent_id)
                else:
                    logger.error(f"Agent creation failed for type: {agent_type}")
                    failed_agents.append(agent_type.value)
            # Log all agents in registry after creation
            logger.info(f"All agent IDs in registry after init: {self.registry.get_agent_ids()}")
            # Start communication protocol
            await start_communication_protocol()
            
            # Mark as initialized
            self._initialized = True
            
            result = {
                "status": "initialized",
                "created_agents": created_agents,
                "failed_agents": failed_agents,
                "total_agents": len(created_agents),
                "communication_started": True,
                "langsmith_enabled": self._langsmith_client is not None,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Agent ecosystem initialized: {len(created_agents)} agents created")
            return result
            
        except Exception as e:
            logger.error(f"Failed to initialize agent ecosystem: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def shutdown_agent_ecosystem(self) -> Dict[str, Any]:
        """Shutdown the agent ecosystem."""
        try:
            if not self._initialized:
                return {"status": "not_initialized"}
            
            # Stop communication protocol
            await self.communication.stop()
            
            # Clear registry
            agent_count = len(self.registry.get_all_agents())
            self.registry.clear_registry()
            
            # Mark as not initialized
            self._initialized = False
            
            result = {
                "status": "shutdown",
                "agents_removed": agent_count,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info("Agent ecosystem shutdown complete")
            return result
            
        except Exception as e:
            logger.error(f"Failed to shutdown agent ecosystem: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def get_ecosystem_status(self) -> Dict[str, Any]:
        """Get the current status of the agent ecosystem."""
        try:
            registry_stats = self.registry.get_registry_stats()
            communication_stats = self.communication.get_protocol_stats()
            
            return {
                "initialized": self._initialized,
                "langsmith_enabled": self._langsmith_client is not None,
                "registry_stats": registry_stats,
                "communication_stats": communication_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting ecosystem status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    @traceable(name="create_custom_agent")
    async def create_custom_agent(self,
                                 agent_id: str,
                                 agent_type: AgentType,
                                 capabilities: List[AgentCapability],
                                 system_prompt: str,
                                 metadata: Optional[Dict[str, Any]] = None) -> Optional[BaseAgent]:
        """Create a custom agent with specific configuration."""
        try:
            agent = await self.create_agent(
                agent_type=agent_type,
                agent_id=agent_id,
                custom_capabilities=capabilities,
                custom_prompt=system_prompt
            )
            
            if agent and metadata:
                agent.context.update(metadata)
            
            return agent
            
        except Exception as e:
            logger.error(f"Error creating custom agent: {e}")
            return None
    
    def is_initialized(self) -> bool:
        """Check if the ecosystem is initialized."""
        return self._initialized


# Global factory instance
_agent_factory: Optional[AgentFactory] = None


def get_agent_factory() -> AgentFactory:
    """Get the global agent factory instance."""
    global _agent_factory
    
    if _agent_factory is None:
        _agent_factory = AgentFactory()
    
    return _agent_factory


async def initialize_agents(agent_types: Optional[List[AgentType]] = None) -> Dict[str, Any]:
    """Initialize the agent ecosystem."""
    factory = get_agent_factory()
    return await factory.initialize_agent_ecosystem(agent_types)


async def shutdown_agents() -> Dict[str, Any]:
    """Shutdown the agent ecosystem."""
    factory = get_agent_factory()
    return await factory.shutdown_agent_ecosystem()