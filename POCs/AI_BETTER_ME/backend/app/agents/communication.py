"""
Agent communication protocol for inter-agent messaging and coordination.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Callable, Awaitable
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from collections import defaultdict, deque

from .base import AgentMessage, AgentType, BaseAgent
from .registry import get_agent_registry

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    """Types of inter-agent messages."""
    HANDOFF = "handoff"
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    BROADCAST = "broadcast"
    STATUS_UPDATE = "status_update"
    TASK_ASSIGNMENT = "task_assignment"
    TASK_COMPLETION = "task_completion"
    ERROR = "error"
    HEARTBEAT = "heartbeat"


class MessagePriority(str, Enum):
    """Message priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class MessageHandler:
    """Handler for specific message types."""
    message_type: MessageType
    handler_func: Callable[[AgentMessage], Awaitable[Optional[AgentMessage]]]
    agent_id: str


class CommunicationProtocol:
    """Protocol for managing inter-agent communication."""
    
    def __init__(self):
        self.registry = get_agent_registry()
        self._message_handlers: Dict[str, Dict[MessageType, MessageHandler]] = defaultdict(dict)
        self._message_queue: deque = deque()
        self._pending_responses: Dict[str, AgentMessage] = {}
        self._conversation_threads: Dict[str, List[AgentMessage]] = defaultdict(list)
        self._is_running = False
        self._processing_task: Optional[asyncio.Task] = None
    
    def register_handler(self, 
                        agent_id: str, 
                        message_type: MessageType,
                        handler_func: Callable[[AgentMessage], Awaitable[Optional[AgentMessage]]]) -> None:
        """
        Register a message handler for an agent.
        
        Args:
            agent_id: ID of the agent registering the handler
            message_type: Type of message to handle
            handler_func: Async function to handle the message
        """
        handler = MessageHandler(
            message_type=message_type,
            handler_func=handler_func,
            agent_id=agent_id
        )
        
        self._message_handlers[agent_id][message_type] = handler
        logger.debug(f"Registered handler for {message_type} on agent {agent_id}")
    
    def unregister_handler(self, agent_id: str, message_type: MessageType) -> bool:
        """
        Unregister a message handler.
        
        Args:
            agent_id: ID of the agent
            message_type: Type of message handler to remove
            
        Returns:
            True if handler was removed, False if not found
        """
        if agent_id in self._message_handlers:
            if message_type in self._message_handlers[agent_id]:
                del self._message_handlers[agent_id][message_type]
                logger.debug(f"Unregistered handler for {message_type} on agent {agent_id}")
                return True
        return False
    
    async def send_message(self, 
                          from_agent: str,
                          to_agent: str,
                          message_type: MessageType,
                          content: str,
                          metadata: Optional[Dict[str, Any]] = None,
                          priority: MessagePriority = MessagePriority.NORMAL,
                          requires_response: bool = False,
                          timeout_seconds: Optional[int] = None) -> Optional[AgentMessage]:
        """
        Send a message from one agent to another.
        
        Args:
            from_agent: ID of the sending agent
            to_agent: ID of the receiving agent
            message_type: Type of the message
            content: Message content
            metadata: Additional metadata
            priority: Message priority
            requires_response: Whether a response is expected
            timeout_seconds: Timeout for response (if requires_response is True)
            
        Returns:
            Response message if requires_response is True, None otherwise
        """
        try:
            # Create the message
            message = AgentMessage(
                from_agent=from_agent,
                to_agent=to_agent,
                message_type=message_type.value,
                content=content,
                metadata=metadata or {},
                requires_response=requires_response
            )
            
            # Add priority to metadata
            message.metadata["priority"] = priority.value
            
            # Add to conversation thread
            thread_id = f"{from_agent}-{to_agent}"
            self._conversation_threads[thread_id].append(message)
            
            # Queue the message for processing
            self._message_queue.append(message)
            
            logger.debug(f"Queued message from {from_agent} to {to_agent}: {message_type}")
            
            # If response is required, wait for it
            if requires_response:
                return await self._wait_for_response(message, timeout_seconds or 30)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to send message from {from_agent} to {to_agent}: {e}")
            return None
    
    async def broadcast_message(self,
                               from_agent: str,
                               message_type: MessageType,
                               content: str,
                               target_types: Optional[List[AgentType]] = None,
                               exclude_agents: Optional[List[str]] = None,
                               metadata: Optional[Dict[str, Any]] = None,
                               priority: MessagePriority = MessagePriority.NORMAL) -> int:
        """
        Broadcast a message to multiple agents.
        
        Args:
            from_agent: ID of the sending agent
            message_type: Type of the message
            content: Message content
            target_types: List of agent types to target (None for all)
            exclude_agents: List of agent IDs to exclude
            metadata: Additional metadata
            priority: Message priority
            
        Returns:
            Number of agents the message was sent to
        """
        try:
            exclude_set = set(exclude_agents or [])
            exclude_set.add(from_agent)  # Don't send to self
            
            target_agents = []
            
            if target_types:
                for agent_type in target_types:
                    agents = self.registry.get_agents_by_type(agent_type)
                    target_agents.extend([a for a in agents if a.agent_id not in exclude_set])
            else:
                all_agents = self.registry.get_all_agents()
                target_agents = [a for a in all_agents if a.agent_id not in exclude_set]
            
            # Send message to each target agent
            sent_count = 0
            for agent in target_agents:
                await self.send_message(
                    from_agent=from_agent,
                    to_agent=agent.agent_id,
                    message_type=message_type,
                    content=content,
                    metadata=metadata,
                    priority=priority,
                    requires_response=False
                )
                sent_count += 1
            
            logger.debug(f"Broadcast message from {from_agent} to {sent_count} agents")
            return sent_count
            
        except Exception as e:
            logger.error(f"Failed to broadcast message from {from_agent}: {e}")
            return 0
    
    async def handoff_task(self,
                          from_agent: str,
                          to_agent: str,
                          task_description: str,
                          context: Dict[str, Any],
                          original_input: str) -> bool:
        """
        Hand off a task from one agent to another.
        
        Args:
            from_agent: ID of the agent handing off the task
            to_agent: ID of the agent receiving the task
            task_description: Description of the task being handed off
            context: Context information for the task
            original_input: Original user input that triggered the task
            
        Returns:
            True if handoff was successful, False otherwise
        """
        try:
            handoff_metadata = {
                "task_description": task_description,
                "context": context,
                "original_input": original_input,
                "handoff_timestamp": datetime.utcnow().isoformat()
            }
            
            response = await self.send_message(
                from_agent=from_agent,
                to_agent=to_agent,
                message_type=MessageType.HANDOFF,
                content=f"Task handoff: {task_description}",
                metadata=handoff_metadata,
                priority=MessagePriority.HIGH,
                requires_response=True,
                timeout_seconds=10
            )
            
            if response and response.metadata.get("handoff_accepted", False):
                logger.info(f"Task successfully handed off from {from_agent} to {to_agent}")
                return True
            else:
                logger.warning(f"Task handoff rejected from {from_agent} to {to_agent}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to handoff task from {from_agent} to {to_agent}: {e}")
            return False
    
    async def request_capability(self,
                                from_agent: str,
                                capability_name: str,
                                parameters: Dict[str, Any],
                                preferred_agent: Optional[str] = None) -> Optional[AgentMessage]:
        """
        Request a specific capability from available agents.
        
        Args:
            from_agent: ID of the requesting agent
            capability_name: Name of the required capability
            parameters: Parameters for the capability request
            preferred_agent: Preferred agent to handle the request
            
        Returns:
            Response from the handling agent, or None if no agent available
        """
        try:
            # Find agents with the required capability
            capable_agents = self.registry.get_agents_by_capability(capability_name)
            
            if not capable_agents:
                logger.warning(f"No agents found with capability: {capability_name}")
                return None
            
            # Choose target agent
            target_agent = None
            if preferred_agent and preferred_agent in [a.agent_id for a in capable_agents]:
                target_agent = preferred_agent
            else:
                # Choose the first available agent
                available_agents = [a for a in capable_agents if a.agent_id != from_agent]
                if available_agents:
                    target_agent = available_agents[0].agent_id
            
            if not target_agent:
                logger.warning(f"No available agents for capability: {capability_name}")
                return None
            
            # Send the capability request
            request_metadata = {
                "capability_name": capability_name,
                "parameters": parameters,
                "request_timestamp": datetime.utcnow().isoformat()
            }
            
            response = await self.send_message(
                from_agent=from_agent,
                to_agent=target_agent,
                message_type=MessageType.REQUEST,
                content=f"Capability request: {capability_name}",
                metadata=request_metadata,
                priority=MessagePriority.NORMAL,
                requires_response=True,
                timeout_seconds=30
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to request capability {capability_name} from {from_agent}: {e}")
            return None
    
    async def _wait_for_response(self, original_message: AgentMessage, timeout_seconds: int) -> Optional[AgentMessage]:
        """Wait for a response to a message."""
        try:
            # Store the message as pending
            self._pending_responses[original_message.message_id] = original_message
            
            # Wait for response with timeout
            start_time = datetime.utcnow()
            while (datetime.utcnow() - start_time).total_seconds() < timeout_seconds:
                # Check if response has arrived
                response_key = f"response_to_{original_message.message_id}"
                if response_key in self._pending_responses:
                    response = self._pending_responses.pop(response_key)
                    self._pending_responses.pop(original_message.message_id, None)
                    return response
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
            
            # Timeout occurred
            self._pending_responses.pop(original_message.message_id, None)
            logger.warning(f"Response timeout for message {original_message.message_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error waiting for response: {e}")
            return None
    
    async def _process_message_queue(self) -> None:
        """Process messages in the queue."""
        while self._is_running:
            try:
                if not self._message_queue:
                    await asyncio.sleep(0.1)
                    continue
                
                # Get next message (priority queue would be better for production)
                message = self._message_queue.popleft()
                
                # Process the message
                await self._handle_message(message)
                
            except Exception as e:
                logger.error(f"Error processing message queue: {e}")
                await asyncio.sleep(1)  # Prevent tight error loop
    
    async def _handle_message(self, message: AgentMessage) -> None:
        """Handle a single message."""
        try:
            # Check if target agent exists
            target_agent = self.registry.get_agent(message.to_agent)
            if not target_agent:
                logger.warning(f"Target agent {message.to_agent} not found for message")
                return
            
            # Deliver message to target agent
            target_agent.receive_message(message)
            
            # Check if there's a registered handler
            if (message.to_agent in self._message_handlers and 
                MessageType(message.message_type) in self._message_handlers[message.to_agent]):
                
                handler = self._message_handlers[message.to_agent][MessageType(message.message_type)]
                
                try:
                    # Call the handler
                    response = await handler.handler_func(message)
                    
                    # If handler returned a response and original message required one
                    if response and message.requires_response:
                        # Store the response
                        response_key = f"response_to_{message.message_id}"
                        self._pending_responses[response_key] = response
                        
                        # Add to conversation thread
                        thread_id = f"{message.to_agent}-{message.from_agent}"
                        self._conversation_threads[thread_id].append(response)
                    
                except Exception as e:
                    logger.error(f"Error in message handler for {message.to_agent}: {e}")
                    
                    # Send error response if required
                    if message.requires_response:
                        error_response = AgentMessage(
                            from_agent=message.to_agent,
                            to_agent=message.from_agent,
                            message_type=MessageType.ERROR.value,
                            content=f"Error processing message: {str(e)}",
                            metadata={"error": True, "original_message_id": message.message_id}
                        )
                        
                        response_key = f"response_to_{message.message_id}"
                        self._pending_responses[response_key] = error_response
            
            logger.debug(f"Processed message from {message.from_agent} to {message.to_agent}")
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def start(self) -> None:
        """Start the communication protocol."""
        if self._is_running:
            logger.warning("Communication protocol already running")
            return
        
        self._is_running = True
        self._processing_task = asyncio.create_task(self._process_message_queue())
        logger.info("Started communication protocol")
    
    async def stop(self) -> None:
        """Stop the communication protocol."""
        if not self._is_running:
            return
        
        self._is_running = False
        
        if self._processing_task:
            self._processing_task.cancel()
            try:
                await self._processing_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Stopped communication protocol")
    
    def get_conversation_history(self, agent1: str, agent2: str) -> List[AgentMessage]:
        """Get conversation history between two agents."""
        thread1 = f"{agent1}-{agent2}"
        thread2 = f"{agent2}-{agent1}"
        
        messages = []
        messages.extend(self._conversation_threads.get(thread1, []))
        messages.extend(self._conversation_threads.get(thread2, []))
        
        # Sort by timestamp
        messages.sort(key=lambda m: m.timestamp)
        return messages
    
    def get_protocol_stats(self) -> Dict[str, Any]:
        """Get communication protocol statistics."""
        return {
            "is_running": self._is_running,
            "queue_size": len(self._message_queue),
            "pending_responses": len(self._pending_responses),
            "conversation_threads": len(self._conversation_threads),
            "registered_handlers": sum(len(handlers) for handlers in self._message_handlers.values()),
            "total_messages_in_threads": sum(len(messages) for messages in self._conversation_threads.values())
        }
    
    def clear_conversation_history(self, max_age_hours: int = 24) -> int:
        """Clear old conversation history."""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        cleared_count = 0
        
        for thread_id in list(self._conversation_threads.keys()):
            messages = self._conversation_threads[thread_id]
            # Keep only recent messages
            recent_messages = [m for m in messages if m.timestamp > cutoff_time]
            
            if len(recent_messages) != len(messages):
                cleared_count += len(messages) - len(recent_messages)
                if recent_messages:
                    self._conversation_threads[thread_id] = recent_messages
                else:
                    del self._conversation_threads[thread_id]
        
        return cleared_count


# Global protocol instance
_communication_protocol: Optional[CommunicationProtocol] = None


def get_communication_protocol() -> CommunicationProtocol:
    """Get the global communication protocol instance."""
    global _communication_protocol
    
    if _communication_protocol is None:
        _communication_protocol = CommunicationProtocol()
    
    return _communication_protocol


async def start_communication_protocol() -> None:
    """Start the global communication protocol."""
    protocol = get_communication_protocol()
    await protocol.start()


async def stop_communication_protocol() -> None:
    """Stop the global communication protocol."""
    global _communication_protocol
    
    if _communication_protocol:
        await _communication_protocol.stop()
        _communication_protocol = None