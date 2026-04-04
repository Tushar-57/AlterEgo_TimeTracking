"""
Agent registry for managing active agents and their capabilities.
"""

import logging
from typing import Dict, List, Optional, Set, Any
from datetime import datetime, timedelta
from collections import defaultdict

from .base import BaseAgent, AgentType, AgentStatus, AgentMessage, AgentCapability

logger = logging.getLogger(__name__)


class AgentRegistry:
    """Registry for managing active agents and their capabilities."""
    
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        self._agents_by_type: Dict[AgentType, List[BaseAgent]] = defaultdict(list)
        self._capabilities_index: Dict[str, List[BaseAgent]] = defaultdict(list)
        self._message_queue: List[AgentMessage] = []
        self._orchestrator_agent: Optional[BaseAgent] = None
    
    def register_agent(self, agent: BaseAgent) -> bool:
        """
        Register an agent in the registry.
        
        Args:
            agent: The agent to register
            
        Returns:
            True if registered successfully, False if agent already exists
        """
        try:
            if agent.agent_id in self._agents:
                logger.warning(f"Agent {agent.agent_id} already registered")
                return False
            
            # Register the agent
            self._agents[agent.agent_id] = agent
            self._agents_by_type[agent.agent_type].append(agent)
            
            # Index capabilities
            for capability in agent.capabilities:
                self._capabilities_index[capability.name].append(agent)
            
            # Set orchestrator reference
            if agent.agent_type == AgentType.ORCHESTRATOR:
                self._orchestrator_agent = agent
            
            logger.info(f"Registered agent: {agent.agent_id} ({agent.agent_type.value})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to register agent {agent.agent_id}: {e}")
            return False
    
    def unregister_agent(self, agent_id: str) -> bool:
        """
        Unregister an agent from the registry.
        
        Args:
            agent_id: ID of the agent to unregister
            
        Returns:
            True if unregistered successfully, False if agent not found
        """
        try:
            if agent_id not in self._agents:
                logger.warning(f"Agent {agent_id} not found for unregistration")
                return False
            
            agent = self._agents[agent_id]
            
            # Remove from main registry
            del self._agents[agent_id]
            
            # Remove from type index
            if agent in self._agents_by_type[agent.agent_type]:
                self._agents_by_type[agent.agent_type].remove(agent)
            
            # Remove from capabilities index
            for capability in agent.capabilities:
                if agent in self._capabilities_index[capability.name]:
                    self._capabilities_index[capability.name].remove(agent)
            
            # Clear orchestrator reference if needed
            if agent.agent_type == AgentType.ORCHESTRATOR:
                self._orchestrator_agent = None
            
            logger.info(f"Unregistered agent: {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unregister agent {agent_id}: {e}")
            return False
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """
        Get an agent by ID.
        
        Args:
            agent_id: ID of the agent to retrieve
            
        Returns:
            The agent if found, None otherwise
        """
        return self._agents.get(agent_id)
    
    def get_agents_by_type(self, agent_type: AgentType) -> List[BaseAgent]:
        """
        Get all agents of a specific type.
        
        Args:
            agent_type: The agent type to search for
            
        Returns:
            List of agents of the specified type
        """
        return self._agents_by_type.get(agent_type, [])

    def get_agent_by_type(self, agent_type: AgentType) -> Optional[BaseAgent]:
        """
        Get the first agent of a specific type.
        
        Args:
            agent_type: The agent type to search for
            
        Returns:
            First agent of the specified type, or None if not found
        """
        agents = self.get_agents_by_type(agent_type)
        return agents[0] if agents else None
    
    def get_agents_by_capability(self, capability_name: str) -> List[BaseAgent]:
        """
        Get all agents that have a specific capability.
        
        Args:
            capability_name: Name of the capability
            
        Returns:
            List of agents with the specified capability
        """
        return self._capabilities_index[capability_name].copy()
    
    def get_available_agents(self, exclude_status: Set[AgentStatus] = None) -> List[BaseAgent]:
        """
        Get all available agents (not in excluded status).
        
        Args:
            exclude_status: Set of statuses to exclude
            
        Returns:
            List of available agents
        """
        if exclude_status is None:
            exclude_status = {AgentStatus.ERROR, AgentStatus.OFFLINE}
        
        available_agents = []
        for agent in self._agents.values():
            if agent.status not in exclude_status:
                available_agents.append(agent)
        
        return available_agents
    
    def get_orchestrator_agent(self) -> Optional[BaseAgent]:
        """
        Get the orchestrator agent.
        
        Returns:
            The orchestrator agent if registered, None otherwise
        """
        return self._orchestrator_agent
    
    def find_best_agent_for_task(self, 
                                required_capabilities: List[str],
                                preferred_type: Optional[AgentType] = None,
                                exclude_agents: Set[str] = None) -> Optional[BaseAgent]:
        """
        Find the best agent for a task based on capabilities and preferences.
        
        Args:
            required_capabilities: List of required capability names
            preferred_type: Preferred agent type
            exclude_agents: Set of agent IDs to exclude
            
        Returns:
            The best matching agent or None if no suitable agent found
        """
        try:
            if exclude_agents is None:
                exclude_agents = set()
            
            candidate_agents = []
            
            # First, try to find agents with preferred type
            if preferred_type:
                type_agents = self.get_agents_by_type(preferred_type)
                for agent in type_agents:
                    if (agent.agent_id not in exclude_agents and 
                        agent.status in {AgentStatus.IDLE, AgentStatus.ACTIVE}):
                        # Check if agent has all required capabilities
                        agent_capabilities = agent.get_capability_names()
                        if all(cap in agent_capabilities for cap in required_capabilities):
                            candidate_agents.append((agent, 2))  # Higher priority for preferred type
            
            # Then, find any agents with required capabilities
            for capability in required_capabilities:
                capable_agents = self.get_agents_by_capability(capability)
                for agent in capable_agents:
                    if (agent.agent_id not in exclude_agents and 
                        agent.status in {AgentStatus.IDLE, AgentStatus.ACTIVE}):
                        # Check if agent has all required capabilities
                        agent_capabilities = agent.get_capability_names()
                        if all(cap in agent_capabilities for cap in required_capabilities):
                            # Avoid duplicates
                            if not any(a[0].agent_id == agent.agent_id for a in candidate_agents):
                                candidate_agents.append((agent, 1))  # Lower priority
            
            if not candidate_agents:
                return None
            
            # Sort by priority (higher first), then by status (idle first), then by last active (most recent first)
            candidate_agents.sort(key=lambda x: (
                -x[1],  # Priority (descending)
                0 if x[0].status == AgentStatus.IDLE else 1,  # Idle agents first
                -x[0].last_active.timestamp()  # Most recently active first
            ))
            
            return candidate_agents[0][0]
            
        except Exception as e:
            logger.error(f"Error finding best agent for task: {e}")
            return None
    
    def route_message(self, message: AgentMessage) -> bool:
        """
        Route a message to the target agent.
        
        Args:
            message: The message to route
            
        Returns:
            True if message was delivered, False otherwise
        """
        try:
            target_agent = self.get_agent(message.to_agent)
            if not target_agent:
                logger.warning(f"Target agent {message.to_agent} not found for message routing")
                return False
            
            target_agent.receive_message(message)
            logger.debug(f"Routed message from {message.from_agent} to {message.to_agent}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to route message: {e}")
            return False
    
    def broadcast_message(self, 
                         message: AgentMessage, 
                         target_types: Optional[List[AgentType]] = None,
                         exclude_agents: Set[str] = None) -> int:
        """
        Broadcast a message to multiple agents.
        
        Args:
            message: The message to broadcast
            target_types: List of agent types to target (None for all)
            exclude_agents: Set of agent IDs to exclude
            
        Returns:
            Number of agents that received the message
        """
        try:
            if exclude_agents is None:
                exclude_agents = set()
            
            delivered_count = 0
            
            for agent in self._agents.values():
                # Skip excluded agents
                if agent.agent_id in exclude_agents:
                    continue
                
                # Skip sender
                if agent.agent_id == message.from_agent:
                    continue
                
                # Filter by target types
                if target_types and agent.agent_type not in target_types:
                    continue
                
                # Create a copy of the message for each recipient
                agent_message = AgentMessage(
                    from_agent=message.from_agent,
                    to_agent=agent.agent_id,
                    message_type=message.message_type,
                    content=message.content,
                    metadata=message.metadata.copy(),
                    requires_response=message.requires_response
                )
                
                agent.receive_message(agent_message)
                delivered_count += 1
            
            logger.debug(f"Broadcast message to {delivered_count} agents")
            return delivered_count
            
        except Exception as e:
            logger.error(f"Failed to broadcast message: {e}")
            return 0
    
    def get_registry_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the agent registry.
        
        Returns:
            Dictionary containing registry statistics
        """
        try:
            # Count agents by type
            agents_by_type = {}
            for agent_type in AgentType:
                agents_by_type[agent_type.value] = len(self._agents_by_type[agent_type])
            
            # Count agents by status
            agents_by_status = defaultdict(int)
            for agent in self._agents.values():
                agents_by_status[agent.status.value] += 1
            
            # Get capability distribution
            capability_distribution = {}
            for capability, agents in self._capabilities_index.items():
                capability_distribution[capability] = len(agents)
            
            # Calculate uptime statistics
            now = datetime.utcnow()
            active_agents = [a for a in self._agents.values() if a.status != AgentStatus.OFFLINE]
            avg_last_active = None
            if active_agents:
                total_seconds = sum((now - agent.last_active).total_seconds() for agent in active_agents)
                avg_last_active = total_seconds / len(active_agents)
            
            return {
                "total_agents": len(self._agents),
                "agents_by_type": agents_by_type,
                "agents_by_status": dict(agents_by_status),
                "capability_distribution": capability_distribution,
                "has_orchestrator": self._orchestrator_agent is not None,
                "active_agents": len(active_agents),
                "average_idle_time_seconds": avg_last_active,
                "message_queue_size": len(self._message_queue)
            }
            
        except Exception as e:
            logger.error(f"Failed to get registry stats: {e}")
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on all registered agents.
        
        Returns:
            Health check results
        """
        try:
            healthy_agents = []
            unhealthy_agents = []
            offline_agents = []
            
            for agent in self._agents.values():
                if agent.status == AgentStatus.OFFLINE:
                    offline_agents.append(agent.agent_id)
                elif agent.status == AgentStatus.ERROR:
                    unhealthy_agents.append(agent.agent_id)
                else:
                    healthy_agents.append(agent.agent_id)
            
            # Check for stale agents (not active for more than 1 hour)
            now = datetime.utcnow()
            stale_threshold = timedelta(hours=1)
            stale_agents = []
            
            for agent in self._agents.values():
                if now - agent.last_active > stale_threshold:
                    stale_agents.append(agent.agent_id)
            
            return {
                "total_agents": len(self._agents),
                "healthy_agents": healthy_agents,
                "unhealthy_agents": unhealthy_agents,
                "offline_agents": offline_agents,
                "stale_agents": stale_agents,
                "orchestrator_available": self._orchestrator_agent is not None,
                "timestamp": now.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to perform health check: {e}")
            return {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
    
    def cleanup_stale_agents(self, max_idle_hours: int = 24) -> int:
        """
        Clean up agents that have been idle for too long.
        
        Args:
            max_idle_hours: Maximum idle time in hours before cleanup
            
        Returns:
            Number of agents cleaned up
        """
        try:
            now = datetime.utcnow()
            stale_threshold = timedelta(hours=max_idle_hours)
            stale_agents = []
            
            for agent_id, agent in self._agents.items():
                if (agent.status == AgentStatus.IDLE and 
                    now - agent.last_active > stale_threshold):
                    stale_agents.append(agent_id)
            
            # Remove stale agents
            cleanup_count = 0
            for agent_id in stale_agents:
                if self.unregister_agent(agent_id):
                    cleanup_count += 1
            
            if cleanup_count > 0:
                logger.info(f"Cleaned up {cleanup_count} stale agents")
            
            return cleanup_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup stale agents: {e}")
            return 0
    
    def get_all_agents(self) -> List[BaseAgent]:
        """Get all registered agents."""
        return list(self._agents.values())
    
    def get_agent_ids(self) -> List[str]:
        """Get all registered agent IDs."""
        return list(self._agents.keys())
    
    def clear_registry(self) -> None:
        """Clear all agents from the registry."""
        self._agents.clear()
        self._agents_by_type.clear()
        self._capabilities_index.clear()
        self._message_queue.clear()
        self._orchestrator_agent = None
        logger.info("Cleared agent registry")


# Global registry instance
_agent_registry: Optional[AgentRegistry] = None


def get_agent_registry() -> AgentRegistry:
    """Get the global agent registry instance."""
    global _agent_registry
    
    if _agent_registry is None:
        _agent_registry = AgentRegistry()
    
    return _agent_registry


def reset_agent_registry() -> AgentRegistry:
    """Reset the global agent registry instance."""
    global _agent_registry
    
    _agent_registry = AgentRegistry()
    return _agent_registry