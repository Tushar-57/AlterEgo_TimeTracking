"""
Base agent framework with LangGraph integration.
"""

import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, List, Optional, Set, TypedDict
from enum import Enum
from pydantic import BaseModel, Field

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables import Runnable
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from ..utils.logging import get_agent_logger, LogCategory

logger = get_agent_logger(__name__, LogCategory.AGENT)


class AgentType(str, Enum):
    """Types of agents in the ecosystem."""
    ORCHESTRATOR = "orchestrator"
    PRODUCTIVITY = "productivity"
    HEALTH = "health"
    FINANCE = "finance"
    SCHEDULING = "scheduling"
    JOURNAL = "journal"
    GENERAL = "general"


class AgentStatus(str, Enum):
    """Agent status states."""
    IDLE = "idle"
    ACTIVE = "active"
    BUSY = "busy"
    ERROR = "error"
    OFFLINE = "offline"


class TaskPriority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    """Task status states."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

#TO-DO: Give agent a personality with tone, user preference you already have in alterego.
class AgentCapability(BaseModel):
    """Represents a capability that an agent can perform."""
    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    required_tools: List[str] = Field(default_factory=list)


class AgentTask(BaseModel):
    """Represents a task assigned to an agent."""
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    agent_type: AgentType
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    dependencies: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)


class AgentMessage(BaseModel):
    """Message for inter-agent communication."""
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_agent: str
    to_agent: str
    message_type: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    requires_response: bool = False


class AgentState(TypedDict):
    """State structure for LangGraph agents."""
    messages: List[BaseMessage]
    current_task: Optional[AgentTask]
    context: Dict[str, Any]
    agent_id: str
    agent_type: AgentType
    status: AgentStatus
    last_active: datetime
    session_id: str
    user_input: str
    agent_response: str
    next_agent: Optional[str]
    handoff_context: Dict[str, Any]


class BaseAgent(ABC):
    """Base class for all agents in the ecosystem."""
    
    def __init__(self, 
                 agent_id: str,
                 agent_type: AgentType,
                 capabilities: List[AgentCapability],
                 system_prompt: str = ""):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.capabilities = capabilities
        self.system_prompt = system_prompt
        self.status = AgentStatus.IDLE
        self.current_task: Optional[AgentTask] = None
        self.context: Dict[str, Any] = {}
        self.last_active = datetime.utcnow()
        self.message_history: List[AgentMessage] = []
        
        # LangGraph components
        self.graph: Optional[StateGraph] = None
        self.checkpointer = MemorySaver()
        self._compiled_graph: Optional[Runnable] = None
        
        # Initialize the agent
        self._initialize_graph()
    
    def _initialize_graph(self) -> None:
        """Initialize the LangGraph workflow for this agent."""
        try:
            # Create the state graph
            workflow = StateGraph(AgentState)
            
            # Add nodes
            workflow.add_node("process_input", self._process_input)
            workflow.add_node("execute_task", self._execute_task)
            workflow.add_node("generate_response", self._generate_response)
            workflow.add_node("handle_handoff", self._handle_handoff)
            
            # Set entry point
            workflow.set_entry_point("process_input")
            
            # Add edges
            workflow.add_conditional_edges(
                "process_input",
                self._should_handoff,
                {
                    "handoff": "handle_handoff",
                    "execute": "execute_task"
                }
            )
            
            workflow.add_edge("execute_task", "generate_response")
            workflow.add_edge("generate_response", END)
            workflow.add_edge("handle_handoff", END)
            
            # Compile the graph
            self.graph = workflow
            self._compiled_graph = workflow.compile(checkpointer=self.checkpointer)
            
            logger.info(f"Initialized LangGraph workflow for agent {self.agent_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize graph for agent {self.agent_id}: {e}")
            raise
    
    async def _process_input(self, state: AgentState) -> AgentState:
        """Process incoming input and update state."""
        try:
            # Update agent status
            state["status"] = AgentStatus.ACTIVE
            state["last_active"] = datetime.utcnow()
            
            # Add system message if not present
            if not any(isinstance(msg, SystemMessage) for msg in state["messages"]):
                system_msg = SystemMessage(content=self.system_prompt)
                state["messages"].insert(0, system_msg)
            
            # Process the user input
            user_input = state.get("user_input", "")
            if user_input:
                human_msg = HumanMessage(content=user_input)
                state["messages"].append(human_msg)
            
            # Update context with agent-specific information
            state["context"].update({
                "agent_capabilities": [cap.name for cap in self.capabilities],
                "agent_type": self.agent_type.value,
                "processing_timestamp": datetime.utcnow().isoformat()
            })
            
            return state
            
        except Exception as e:
            logger.error(f"Error processing input in agent {self.agent_id}: {e}")
            state["status"] = AgentStatus.ERROR
            return state
    
    async def _execute_task(self, state: AgentState) -> AgentState:
        """Execute the main task logic."""
        try:
            # Update status
            state["status"] = AgentStatus.BUSY
            
            # Execute agent-specific logic
            response = await self.execute(state)
            
            # Update state with response
            state["agent_response"] = response
            state["status"] = AgentStatus.ACTIVE
            
            return state
            
        except Exception as e:
            logger.error(f"Error executing task in agent {self.agent_id}: {e}")
            state["status"] = AgentStatus.ERROR
            state["agent_response"] = f"Error executing task: {str(e)}"
            return state
    
    async def _generate_response(self, state: AgentState) -> AgentState:
        """Generate the final response."""
        try:
            response = state.get("agent_response", "")
            
            # Add AI message to conversation
            if response:
                ai_msg = AIMessage(content=response)
                state["messages"].append(ai_msg)
            
            # Update status
            state["status"] = AgentStatus.IDLE
            state["last_active"] = datetime.utcnow()
            
            return state
            
        except Exception as e:
            logger.error(f"Error generating response in agent {self.agent_id}: {e}")
            state["status"] = AgentStatus.ERROR
            return state
    
    async def _handle_handoff(self, state: AgentState) -> AgentState:
        """Handle handoff to another agent."""
        try:
            next_agent = state.get("next_agent")
            if next_agent:
                # Prepare handoff context
                handoff_context = {
                    "from_agent": self.agent_id,
                    "to_agent": next_agent,
                    "original_input": state.get("user_input", ""),
                    "context": state.get("context", {}),
                    "handoff_reason": state.get("handoff_context", {}).get("reason", ""),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                state["handoff_context"] = handoff_context
                state["agent_response"] = f"Handing off to {next_agent} agent for specialized assistance."
            
            state["status"] = AgentStatus.IDLE
            return state
            
        except Exception as e:
            logger.error(f"Error handling handoff in agent {self.agent_id}: {e}")
            state["status"] = AgentStatus.ERROR
            return state
    
    def _should_handoff(self, state: AgentState) -> str:
        """Determine if task should be handed off to another agent."""
        try:
            # Check if this agent should handle the task
            user_input = state.get("user_input", "").lower()
            
            # Agent-specific handoff logic (to be overridden)
            if self.should_handoff(user_input, state.get("context", {})):
                next_agent = self.determine_handoff_target(user_input, state.get("context", {}))
                if next_agent:
                    state["next_agent"] = next_agent
                    return "handoff"
            
            return "execute"
            
        except Exception as e:
            logger.error(f"Error determining handoff in agent {self.agent_id}: {e}")
            return "execute"
    
    @abstractmethod
    async def execute(self, state: AgentState) -> str:
        """Execute the agent's main logic. Must be implemented by subclasses."""
        pass
    
    def should_handoff(self, user_input: str, context: Dict[str, Any]) -> bool:
        """Determine if this agent should hand off the task. Override in subclasses."""
        return False
    
    def determine_handoff_target(self, user_input: str, context: Dict[str, Any]) -> Optional[str]:
        """Determine which agent to hand off to. Override in subclasses."""
        return None
    
    async def process_message(self, 
                            user_input: str, 
                            session_id: str = None,
                            context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a message through the agent's workflow."""
        try:
            if not self._compiled_graph:
                raise Exception("Agent graph not compiled")
            
            # Create initial state
            initial_state: AgentState = {
                "messages": [],
                "current_task": self.current_task,
                "context": context or {},
                "agent_id": self.agent_id,
                "agent_type": self.agent_type,
                "status": self.status,
                "last_active": datetime.utcnow(),
                "session_id": session_id or str(uuid.uuid4()),
                "user_input": user_input,
                "agent_response": "",
                "next_agent": None,
                "handoff_context": {}
            }
            
            # Run the workflow
            config = {"configurable": {"thread_id": session_id or "default"}}
            result = await self._compiled_graph.ainvoke(initial_state, config)
            
            # Update agent state
            self.status = result["status"]
            self.last_active = result["last_active"]
            self.context.update(result["context"])
            
            return {
                "response": result["agent_response"],
                "status": result["status"].value,
                "next_agent": result.get("next_agent"),
                "handoff_context": result.get("handoff_context"),
                "messages": [msg.content for msg in result["messages"] if isinstance(msg, (HumanMessage, AIMessage))]
            }
            
        except Exception as e:
            logger.error(f"Error processing message in agent {self.agent_id}: {e}")
            return {
                "response": f"Error processing request: {str(e)}",
                "status": AgentStatus.ERROR.value,
                "next_agent": None,
                "handoff_context": {},
                "messages": []
            }
    
    def add_capability(self, capability: AgentCapability) -> None:
        """Add a new capability to the agent."""
        self.capabilities.append(capability)
        logger.info(f"Added capability '{capability.name}' to agent {self.agent_id}")
    
    def remove_capability(self, capability_name: str) -> bool:
        """Remove a capability from the agent."""
        for i, cap in enumerate(self.capabilities):
            if cap.name == capability_name:
                del self.capabilities[i]
                logger.info(f"Removed capability '{capability_name}' from agent {self.agent_id}")
                return True
        return False
    
    def has_capability(self, capability_name: str) -> bool:
        """Check if agent has a specific capability."""
        return any(cap.name == capability_name for cap in self.capabilities)
    
    def get_capability_names(self) -> List[str]:
        """Get list of capability names."""
        return [cap.name for cap in self.capabilities]
    
    def send_message(self, to_agent: str, message_type: str, content: str, 
                    metadata: Dict[str, Any] = None, requires_response: bool = False) -> AgentMessage:
        """Send a message to another agent."""
        message = AgentMessage(
            from_agent=self.agent_id,
            to_agent=to_agent,
            message_type=message_type,
            content=content,
            metadata=metadata or {},
            requires_response=requires_response
        )
        
        self.message_history.append(message)
        logger.debug(f"Agent {self.agent_id} sent message to {to_agent}: {message_type}")
        
        return message
    
    def receive_message(self, message: AgentMessage) -> None:
        """Receive a message from another agent."""
        self.message_history.append(message)
        logger.debug(f"Agent {self.agent_id} received message from {message.from_agent}: {message.message_type}")
    
    def get_status_info(self) -> Dict[str, Any]:
        """Get current status information."""
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type.value,
            "status": self.status.value,
            "capabilities": self.get_capability_names(),
            "current_task": self.current_task.model_dump() if self.current_task else None,
            "last_active": self.last_active.isoformat(),
            "message_count": len(self.message_history),
            "context_keys": list(self.context.keys())
        }
    
    def update_context(self, key: str, value: Any) -> None:
        """Update agent context."""
        self.context[key] = value
        logger.debug(f"Updated context for agent {self.agent_id}: {key}")
    
    def clear_context(self) -> None:
        """Clear agent context."""
        self.context.clear()
        logger.debug(f"Cleared context for agent {self.agent_id}")