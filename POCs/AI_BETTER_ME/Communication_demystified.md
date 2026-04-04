# Communication_demystified.md

## Overview
This document explains the design, flow, and working of the `CommunicationProtocol` in your agent ecosystem, focusing on how agent capabilities are discovered and used for inter-agent messaging, handoffs, and coordination.

---

## 1. Purpose of CommunicationProtocol
- Manages all inter-agent communication: direct messages, broadcasts, handoffs, capability requests, and responses.
- Ensures agents can coordinate, delegate, and respond to tasks in a scalable, asynchronous manner.

---

## 2. Key Concepts & Classes

### AgentMessage
- Represents a message sent between agents.
- Contains sender, receiver, type, content, metadata, and response requirements.

### MessageType
- Enum for message categories: HANDOFF, REQUEST, RESPONSE, NOTIFICATION, BROADCAST, etc.

### MessagePriority
- Enum for priority: LOW, NORMAL, HIGH, URGENT.

### MessageHandler
- Associates a message type with a handler function for a specific agent.

### CommunicationProtocol
- Central class for managing message queues, handlers, threads, and responses.

---

## 3. Flow of Communication

### a. Registering Handlers
- Agents register async handler functions for specific message types.
- Handlers are stored in `_message_handlers` by agent and message type.

### b. Sending Messages
- `send_message()` creates an `AgentMessage` and queues it for processing.
- If a response is required, waits asynchronously for a reply (with timeout).
- Adds message to conversation thread for history.

### c. Broadcasting Messages
- `broadcast_message()` sends a message to all agents (or filtered by type), excluding the sender.
- Uses `send_message()` for each target agent.

### d. Task Handoff
- `handoff_task()` sends a HANDOFF message from one agent to another, with context and original input.
- Waits for a response indicating acceptance or rejection.

### e. Capability Request (Key Focus)
- `request_capability()` is used when an agent needs a specific capability (e.g., "intent_classification", "task_management").
- Finds all agents registered with the required capability using `get_agents_by_capability()` from the registry.
- Selects the preferred agent if specified, otherwise the first available agent (excluding the requester).
- Sends a REQUEST message to the target agent, including capability name and parameters in metadata.
- Waits for a response from the agent, which should process the request and reply.
- Returns the response message (or None if no agent found or timeout).

---

## 4. Message Queue Processing
- `_process_message_queue()` runs in the background, dequeuing messages and delivering them to target agents.
- Calls the registered handler for the message type if available.
- If a response is required, stores the response for retrieval by the original sender.

---

## 5. Conversation History & Stats
- All messages are stored in conversation threads for history and debugging.
- `get_conversation_history()` retrieves all messages between two agents.
- `get_protocol_stats()` provides queue size, pending responses, registered handlers, etc.

---

## 6. Example Capability Request Flow

1. Agent A needs "task_management" capability.
2. Agent A calls `request_capability("task_management", params)`.
3. Protocol finds all agents with "task_management" capability.
4. Selects Agent B (preferred or first available).
5. Sends REQUEST message to Agent B.
6. Agent B's handler processes the request and replies.
7. Agent A receives the response.

---

## 7. Extensibility
- New capabilities can be added by registering them in agent classes and the registry.
- Handlers for new message types can be registered for custom flows.
- Protocol supports handoff, broadcast, and direct messaging for flexible workflows.

---

## 8. Error Handling
- Logs warnings if no agent found for capability.
- Handles timeouts and errors in message delivery and handler execution.
- Returns None or error messages for failed requests.

---

## 9. Summary
The `CommunicationProtocol` enables robust, asynchronous, and capability-driven coordination between agents. It abstracts message delivery, capability discovery, and response management, allowing agents to delegate, collaborate, and specialize as required by your ecosystem design.

---

## 10. Code Reference: Capability Request
```python
async def request_capability(self, from_agent, capability_name, parameters, preferred_agent=None):
    capable_agents = self.registry.get_agents_by_capability(capability_name)
    # ...select target agent...
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
```

---

## 11. How to Extend
- Register new capabilities in agent classes and registry.
- Register handler functions for new message types.
- Use protocol methods for handoff, broadcast, and direct messaging as needed.
