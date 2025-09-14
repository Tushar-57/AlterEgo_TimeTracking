"""
AI Agent Framework Package

This package provides a comprehensive agent framework built on LangGraph with:
- Base agent classes and types
- Agent registry for managing active agents
- Communication protocol for inter-agent messaging
- Orchestrator agent for coordinating specialized agents
- Agent factory for creating and initializing agents
- Prompt library for agent-specific prompts
- LangSmith integration for observability
"""

from .base import (
    BaseAgent,
    AgentType,
    AgentStatus,
    AgentCapability,
    AgentTask,
    AgentMessage,
    AgentState,
    TaskPriority,
    TaskStatus
)

from .registry import (
    AgentRegistry,
    get_agent_registry,
    reset_agent_registry
)

from .communication import (
    CommunicationProtocol,
    MessageType,
    MessagePriority,
    get_communication_protocol,
    start_communication_protocol,
    stop_communication_protocol
)

from .orchestrator import (
    OrchestratorAgent,
    create_orchestrator_agent
)

from .factory import (
    AgentFactory,
    get_agent_factory,
    initialize_agents,
    shutdown_agents
)

from .prompts import (
    PromptLibrary,
    get_agent_prompt
)

__all__ = [
    # Base classes and types
    "BaseAgent",
    "AgentType", 
    "AgentStatus",
    "AgentCapability",
    "AgentTask",
    "AgentMessage",
    "AgentState",
    "TaskPriority",
    "TaskStatus",
    
    # Registry
    "AgentRegistry",
    "get_agent_registry",
    "reset_agent_registry",
    
    # Communication
    "CommunicationProtocol",
    "MessageType",
    "MessagePriority", 
    "get_communication_protocol",
    "start_communication_protocol",
    "stop_communication_protocol",
    
    # Orchestrator
    "OrchestratorAgent",
    "create_orchestrator_agent",
    
    # Factory
    "AgentFactory",
    "get_agent_factory",
    "initialize_agents",
    "shutdown_agents",
    
    # Prompts
    "PromptLibrary",
    "get_agent_prompt"
]