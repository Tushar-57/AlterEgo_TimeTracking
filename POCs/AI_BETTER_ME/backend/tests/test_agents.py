"""
Unit tests for the agent framework components.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch

from app.agents.base import (
    BaseAgent, AgentType, AgentStatus, AgentCapability, 
    AgentTask, AgentMessage, TaskPriority, TaskStatus
)
from app.agents.registry import AgentRegistry
from app.agents.communication import CommunicationProtocol, MessageType, MessagePriority
from app.agents.orchestrator import OrchestratorAgent
from app.agents.factory import AgentFactory
from app.agents.prompts import PromptLibrary


class MockAgent(BaseAgent):
    """Mock agent implementation for testing."""
    
    async def execute(self, state) -> str:
        return f"Test agent {self.agent_id} executed with input: {state.get('user_input', '')}"


@pytest.fixture
def test_capability():
    """Create a test capability."""
    return AgentCapability(
        name="test_capability",
        description="A test capability",
        parameters={"param1": "value1"},
        required_tools=["tool1", "tool2"]
    )


@pytest.fixture
def test_agent(test_capability):
    """Create a test agent."""
    return MockAgent(
        agent_id="test_agent_1",
        agent_type=AgentType.GENERAL,
        capabilities=[test_capability],
        system_prompt="You are a test agent."
    )


@pytest.fixture
def agent_registry():
    """Create a fresh agent registry."""
    return AgentRegistry()


@pytest.fixture
def communication_protocol():
    """Create a communication protocol."""
    return CommunicationProtocol()


class TestBaseAgent:
    """Test the BaseAgent class."""
    
    def test_agent_initialization(self, test_agent, test_capability):
        """Test agent initialization."""
        assert test_agent.agent_id == "test_agent_1"
        assert test_agent.agent_type == AgentType.GENERAL
        assert test_agent.status == AgentStatus.IDLE
        assert len(test_agent.capabilities) == 1
        assert test_agent.capabilities[0] == test_capability
        assert test_agent.system_prompt == "You are a test agent."
        assert test_agent.graph is not None
        assert test_agent._compiled_graph is not None
    
    def test_capability_management(self, test_agent):
        """Test capability management methods."""
        # Test has_capability
        assert test_agent.has_capability("test_capability")
        assert not test_agent.has_capability("nonexistent_capability")
        
        # Test get_capability_names
        names = test_agent.get_capability_names()
        assert "test_capability" in names
        
        # Test add_capability
        new_capability = AgentCapability(name="new_capability", description="New test capability")
        test_agent.add_capability(new_capability)
        assert test_agent.has_capability("new_capability")
        assert len(test_agent.capabilities) == 2
        
        # Test remove_capability
        assert test_agent.remove_capability("new_capability")
        assert not test_agent.has_capability("new_capability")
        assert len(test_agent.capabilities) == 1
        
        # Test remove nonexistent capability
        assert not test_agent.remove_capability("nonexistent_capability")
    
    def test_message_handling(self, test_agent):
        """Test message sending and receiving."""
        # Test send_message
        message = test_agent.send_message(
            to_agent="target_agent",
            message_type="test_message",
            content="Test content",
            metadata={"key": "value"},
            requires_response=True
        )
        
        assert message.from_agent == test_agent.agent_id
        assert message.to_agent == "target_agent"
        assert message.message_type == "test_message"
        assert message.content == "Test content"
        assert message.metadata["key"] == "value"
        assert message.requires_response is True
        assert len(test_agent.message_history) == 1
        
        # Test receive_message
        incoming_message = AgentMessage(
            from_agent="sender_agent",
            to_agent=test_agent.agent_id,
            message_type="incoming_test",
            content="Incoming content"
        )
        
        test_agent.receive_message(incoming_message)
        assert len(test_agent.message_history) == 2
    
    def test_status_info(self, test_agent):
        """Test status information retrieval."""
        status_info = test_agent.get_status_info()
        
        assert status_info["agent_id"] == test_agent.agent_id
        assert status_info["agent_type"] == test_agent.agent_type.value
        assert status_info["status"] == test_agent.status.value
        assert "test_capability" in status_info["capabilities"]
        assert "last_active" in status_info
        assert "message_count" in status_info
    
    def test_context_management(self, test_agent):
        """Test context management."""
        # Test update_context
        test_agent.update_context("key1", "value1")
        assert test_agent.context["key1"] == "value1"
        
        test_agent.update_context("key2", {"nested": "value"})
        assert test_agent.context["key2"]["nested"] == "value"
        
        # Test clear_context
        test_agent.clear_context()
        assert len(test_agent.context) == 0
    
    @pytest.mark.asyncio
    async def test_process_message(self, test_agent):
        """Test message processing through the agent workflow."""
        result = await test_agent.process_message(
            user_input="Hello, test agent!",
            session_id="test_session",
            context={"test_key": "test_value"}
        )
        
        assert "response" in result
        assert "status" in result
        assert "Hello, test agent!" in result["response"]
        assert result["status"] == AgentStatus.IDLE.value


class TestAgentRegistry:
    """Test the AgentRegistry class."""
    
    def test_agent_registration(self, agent_registry, test_agent):
        """Test agent registration and unregistration."""
        # Test registration
        assert agent_registry.register_agent(test_agent)
        assert agent_registry.get_agent(test_agent.agent_id) == test_agent
        
        # Test duplicate registration
        assert not agent_registry.register_agent(test_agent)
        
        # Test unregistration
        assert agent_registry.unregister_agent(test_agent.agent_id)
        assert agent_registry.get_agent(test_agent.agent_id) is None
        
        # Test unregistering nonexistent agent
        assert not agent_registry.unregister_agent("nonexistent_agent")
    
    def test_agent_retrieval_by_type(self, agent_registry):
        """Test retrieving agents by type."""
        # Create agents of different types
        agent1 = MockAgent("agent1", AgentType.PRODUCTIVITY, [], "")
        agent2 = MockAgent("agent2", AgentType.PRODUCTIVITY, [], "")
        agent3 = MockAgent("agent3", AgentType.HEALTH, [], "")
        
        agent_registry.register_agent(agent1)
        agent_registry.register_agent(agent2)
        agent_registry.register_agent(agent3)
        
        # Test retrieval by type
        productivity_agents = agent_registry.get_agents_by_type(AgentType.PRODUCTIVITY)
        assert len(productivity_agents) == 2
        assert agent1 in productivity_agents
        assert agent2 in productivity_agents
        
        health_agents = agent_registry.get_agents_by_type(AgentType.HEALTH)
        assert len(health_agents) == 1
        assert agent3 in health_agents
        
        # Test empty type
        finance_agents = agent_registry.get_agents_by_type(AgentType.FINANCE)
        assert len(finance_agents) == 0
    
    def test_agent_retrieval_by_capability(self, agent_registry):
        """Test retrieving agents by capability."""
        capability1 = AgentCapability(name="capability1", description="Test capability 1")
        capability2 = AgentCapability(name="capability2", description="Test capability 2")
        
        agent1 = MockAgent("agent1", AgentType.GENERAL, [capability1], "")
        agent2 = MockAgent("agent2", AgentType.GENERAL, [capability1, capability2], "")
        agent3 = MockAgent("agent3", AgentType.GENERAL, [capability2], "")
        
        agent_registry.register_agent(agent1)
        agent_registry.register_agent(agent2)
        agent_registry.register_agent(agent3)
        
        # Test retrieval by capability
        cap1_agents = agent_registry.get_agents_by_capability("capability1")
        assert len(cap1_agents) == 2
        assert agent1 in cap1_agents
        assert agent2 in cap1_agents
        
        cap2_agents = agent_registry.get_agents_by_capability("capability2")
        assert len(cap2_agents) == 2
        assert agent2 in cap2_agents
        assert agent3 in cap2_agents
        
        # Test nonexistent capability
        nonexistent_agents = agent_registry.get_agents_by_capability("nonexistent")
        assert len(nonexistent_agents) == 0
    
    def test_find_best_agent_for_task(self, agent_registry):
        """Test finding the best agent for a task."""
        capability1 = AgentCapability(name="task_management", description="Task management")
        capability2 = AgentCapability(name="scheduling", description="Scheduling")
        
        agent1 = MockAgent("agent1", AgentType.PRODUCTIVITY, [capability1], "")
        agent2 = MockAgent("agent2", AgentType.SCHEDULING, [capability1, capability2], "")
        agent3 = MockAgent("agent3", AgentType.GENERAL, [capability2], "")
        
        agent_registry.register_agent(agent1)
        agent_registry.register_agent(agent2)
        agent_registry.register_agent(agent3)
        
        # Test finding agent with preferred type
        best_agent = agent_registry.find_best_agent_for_task(
            required_capabilities=["task_management"],
            preferred_type=AgentType.PRODUCTIVITY
        )
        assert best_agent == agent1
        
        # Test finding agent without preferred type
        best_agent = agent_registry.find_best_agent_for_task(
            required_capabilities=["scheduling"]
        )
        assert best_agent in [agent2, agent3]  # Either could be chosen
        
        # Test no suitable agent
        best_agent = agent_registry.find_best_agent_for_task(
            required_capabilities=["nonexistent_capability"]
        )
        assert best_agent is None
    
    def test_registry_stats(self, agent_registry):
        """Test registry statistics."""
        # Empty registry
        stats = agent_registry.get_registry_stats()
        assert stats["total_agents"] == 0
        
        # Add some agents
        agent1 = MockAgent("agent1", AgentType.PRODUCTIVITY, [], "")
        agent2 = MockAgent("agent2", AgentType.HEALTH, [], "")
        agent_registry.register_agent(agent1)
        agent_registry.register_agent(agent2)
        
        stats = agent_registry.get_registry_stats()
        assert stats["total_agents"] == 2
        assert stats["agents_by_type"]["productivity"] == 1
        assert stats["agents_by_type"]["health"] == 1
        assert stats["agents_by_status"]["idle"] == 2
    
    def test_health_check(self, agent_registry):
        """Test registry health check."""
        agent1 = MockAgent("agent1", AgentType.GENERAL, [], "")
        agent2 = MockAgent("agent2", AgentType.GENERAL, [], "")
        agent2.status = AgentStatus.ERROR
        
        agent_registry.register_agent(agent1)
        agent_registry.register_agent(agent2)
        
        health = agent_registry.health_check()
        assert "agent1" in health["healthy_agents"]
        assert "agent2" in health["unhealthy_agents"]
        assert health["total_agents"] == 2


class TestCommunicationProtocol:
    """Test the CommunicationProtocol class."""
    
    @pytest.mark.asyncio
    async def test_message_sending(self, communication_protocol):
        """Test message sending."""
        # Mock handler
        async def mock_handler(message):
            return AgentMessage(
                from_agent=message.to_agent,
                to_agent=message.from_agent,
                message_type="response",
                content=f"Response to: {message.content}"
            )
        
        communication_protocol.register_handler("agent2", MessageType.REQUEST, mock_handler)
        
        # Start the protocol
        await communication_protocol.start()
        
        try:
            # Send message with response
            response = await communication_protocol.send_message(
                from_agent="agent1",
                to_agent="agent2",
                message_type=MessageType.REQUEST,
                content="Test request",
                requires_response=True,
                timeout_seconds=1
            )
            
            # Give some time for processing
            await asyncio.sleep(0.2)
            
            # Note: In a real test, we'd need to mock the registry and agents
            # For now, we just test that the method doesn't crash
            
        finally:
            await communication_protocol.stop()
    
    def test_handler_registration(self, communication_protocol):
        """Test message handler registration."""
        async def test_handler(message):
            return None
        
        # Test registration
        communication_protocol.register_handler("agent1", MessageType.REQUEST, test_handler)
        assert "agent1" in communication_protocol._message_handlers
        assert MessageType.REQUEST in communication_protocol._message_handlers["agent1"]
        
        # Test unregistration
        assert communication_protocol.unregister_handler("agent1", MessageType.REQUEST)
        assert MessageType.REQUEST not in communication_protocol._message_handlers.get("agent1", {})
        
        # Test unregistering nonexistent handler
        assert not communication_protocol.unregister_handler("agent1", MessageType.RESPONSE)
    
    def test_protocol_stats(self, communication_protocol):
        """Test protocol statistics."""
        stats = communication_protocol.get_protocol_stats()
        
        assert "is_running" in stats
        assert "queue_size" in stats
        assert "pending_responses" in stats
        assert "conversation_threads" in stats
        assert "registered_handlers" in stats


class TestOrchestratorAgent:
    """Test the OrchestratorAgent class."""
    
    @pytest.mark.asyncio
    async def test_orchestrator_creation(self):
        """Test orchestrator agent creation."""
        with patch('app.agents.orchestrator.get_llm_service'):
            orchestrator = OrchestratorAgent()
            
            assert orchestrator.agent_type == AgentType.ORCHESTRATOR
            assert orchestrator.agent_id == "orchestrator_main"
            assert orchestrator.has_capability("intent_classification")
            assert orchestrator.has_capability("agent_coordination")
    
    def test_pattern_based_classification(self):
        """Test pattern-based intent classification."""
        with patch('app.agents.orchestrator.get_llm_service'):
            orchestrator = OrchestratorAgent()
            
            # Test productivity classification
            result = orchestrator._pattern_based_classification("I need to manage my tasks")
            assert result["agent_type"] == AgentType.PRODUCTIVITY
            assert result["confidence"] > 0
            
            # Test health classification - use more specific health terms
            result = orchestrator._pattern_based_classification("I want to track my health and wellness")
            assert result["agent_type"] == AgentType.HEALTH
            
            # Test finance classification
            result = orchestrator._pattern_based_classification("Help me with my budget and expenses")
            assert result["agent_type"] == AgentType.FINANCE
            
            # Test scheduling classification
            result = orchestrator._pattern_based_classification("I need to schedule an appointment")
            assert result["agent_type"] == AgentType.SCHEDULING
            
            # Test no match
            result = orchestrator._pattern_based_classification("Hello there")
            assert result["agent_type"] == AgentType.GENERAL


class TestAgentFactory:
    """Test the AgentFactory class."""
    
    @pytest.mark.asyncio
    async def test_factory_initialization(self):
        """Test factory initialization."""
        with patch('app.agents.factory.get_agent_registry'), \
             patch('app.agents.factory.get_communication_protocol'):
            factory = AgentFactory()
            assert factory is not None
            assert not factory.is_initialized()
    
    @pytest.mark.asyncio
    async def test_orchestrator_creation(self):
        """Test orchestrator agent creation."""
        with patch('app.agents.factory.get_agent_registry') as mock_registry, \
             patch('app.agents.factory.get_communication_protocol'), \
             patch('app.agents.orchestrator.get_llm_service'):
            
            mock_registry.return_value.get_agent.return_value = None
            mock_registry.return_value.register_agent.return_value = True
            
            factory = AgentFactory()
            agent = await factory.create_agent(AgentType.ORCHESTRATOR)
            
            assert agent is not None
            assert agent.agent_type == AgentType.ORCHESTRATOR


class TestPromptLibrary:
    """Test the PromptLibrary class."""
    
    def test_system_prompts(self):
        """Test system prompt retrieval."""
        # Test getting system prompt for each agent type
        for agent_type in AgentType:
            prompt = PromptLibrary.get_system_prompt(agent_type)
            assert isinstance(prompt, str)
            assert len(prompt) > 0
    
    def test_handoff_prompts(self):
        """Test handoff prompt retrieval."""
        prompt = PromptLibrary.get_handoff_prompt("task_management")
        assert isinstance(prompt, str)
        assert "Productivity Agent" in prompt
        
        # Test default prompt
        prompt = PromptLibrary.get_handoff_prompt("nonexistent_scenario")
        assert isinstance(prompt, str)
    
    def test_context_prompts(self):
        """Test context-aware prompt generation."""
        prompt = PromptLibrary.get_context_prompt("morning_routine")
        assert isinstance(prompt, str)
        assert "morning" in prompt.lower()
        
        # Test with variables
        prompt = PromptLibrary.get_context_prompt("habit_reminder", habit_name="exercise")
        assert "exercise" in prompt
    
    def test_response_templates(self):
        """Test response template generation."""
        template = PromptLibrary.get_response_template("handoff_success", agent_type="productivity")
        assert isinstance(template, str)
        assert "productivity" in template
    
    def test_context_aware_prompt_building(self):
        """Test building context-aware prompts."""
        user_preferences = {
            "productivity": {"work_hours": "9-5"},
            "health": {"exercise_goal": "30min daily"}
        }
        
        recent_interactions = [
            {"summary": "Discussed task management"},
            {"summary": "Set up workout routine"}
        ]
        
        current_context = {
            "time_of_day": "morning",
            "last_activity": "planning"
        }
        
        prompt = PromptLibrary.build_context_aware_prompt(
            agent_type=AgentType.PRODUCTIVITY,
            user_preferences=user_preferences,
            recent_interactions=recent_interactions,
            current_context=current_context
        )
        
        assert isinstance(prompt, str)
        assert "work_hours: 9-5" in prompt
        assert "morning" in prompt
        assert "task management" in prompt


class TestAgentTask:
    """Test the AgentTask model."""
    
    def test_task_creation(self):
        """Test task creation with defaults."""
        task = AgentTask(
            title="Test Task",
            description="A test task",
            agent_type=AgentType.PRODUCTIVITY
        )
        
        assert task.title == "Test Task"
        assert task.description == "A test task"
        assert task.agent_type == AgentType.PRODUCTIVITY
        assert task.priority == TaskPriority.MEDIUM
        assert task.status == TaskStatus.PENDING
        assert isinstance(task.task_id, str)
        assert isinstance(task.created_at, datetime)
        assert isinstance(task.updated_at, datetime)


class TestAgentMessage:
    """Test the AgentMessage model."""
    
    def test_message_creation(self):
        """Test message creation with defaults."""
        message = AgentMessage(
            from_agent="agent1",
            to_agent="agent2",
            message_type="test",
            content="Test message"
        )
        
        assert message.from_agent == "agent1"
        assert message.to_agent == "agent2"
        assert message.message_type == "test"
        assert message.content == "Test message"
        assert isinstance(message.message_id, str)
        assert isinstance(message.timestamp, datetime)
        assert message.requires_response is False


if __name__ == "__main__":
    pytest.main([__file__])