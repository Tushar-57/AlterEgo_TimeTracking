"""
Main Orchestrator Agent - Primary coordinator for the AI agent ecosystem.
"""
import logging
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
from langchain_core.messages import HumanMessage, AIMessage
from .base import BaseAgent, AgentType, AgentCapability, AgentState
from .prompts import PromptLibrary, get_agent_prompt
from .registry import get_agent_registry
from .communication import get_communication_protocol, MessageType
from ..llm.service import get_llm_service
from ..llm.base import CompletionRequest, ChatMessage
from ..services.knowledge_base import get_knowledge_base_service
logger = logging.getLogger(__name__)

class OrchestratorAgent(BaseAgent):
    """Main orchestrator agent that coordinates all other agents."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="intent_classification",
                description="Classify user intents and route to appropriate agents",
                parameters={"confidence_threshold": 0.7}
            ),
            AgentCapability(
                name="agent_coordination",
                description="Coordinate between multiple agents for complex tasks",
                parameters={"max_handoffs": 3}
            ),
            AgentCapability(
                name="conversation_management",
                description="Maintain conversation context and continuity",
                parameters={"context_window": 10}
            ),
            AgentCapability(
                name="user_interaction",
                description="Primary interface for user interactions",
                parameters={"response_style": "helpful_and_clear"}
            )
        ]
        
        system_prompt = get_agent_prompt(AgentType.ORCHESTRATOR)
        
        super().__init__(
            agent_id="orchestrator_main",
            agent_type=AgentType.ORCHESTRATOR,
            capabilities=capabilities,
            system_prompt=system_prompt
        )
        
        self.registry = get_agent_registry()
        self.communication = get_communication_protocol()
        self.knowledge_base = get_knowledge_base_service()
        
        # Intent classification patterns
        self.intent_patterns = {
            AgentType.PRODUCTIVITY: [
                r'\b(task|todo|goal|productivity|work|project|deadline|priority)\b',
                r'\b(organize|plan|schedule|manage|track|complete)\b',
                r'\b(efficient|focus|time management|workflow)\b'
            ],
            AgentType.HEALTH: [
                r'\b(health|wellness|exercise|fitness|habit|routine)\b',
                r'\b(sleep|diet|nutrition|workout|meditation|mindfulness)\b',
                r'\b(healthy|wellbeing|self-care|energy)\b'
            ],
            AgentType.FINANCE: [
            r'\b(money|budget|expense|spending|financial|finance)\b',
                r'\b(save|saving|investment|income|cost|price)\b',
                r'\b(bank|account|transaction|bill|payment)\b'
            ],
            AgentType.SCHEDULING: [
                r'\b(calendar|appointment|meeting|schedule|time|date)\b',
                r'\b(book|reserve|plan|arrange|organize|reschedule)\b',
                r'\b(available|busy|free|conflict|timing)\b'
            ],
            AgentType.JOURNAL: [
                r'\b(journal|reflect|reflection|mood|feeling|emotion)\b',
                r'\b(diary|thoughts|gratitude|mindset|growth)\b',
                r'\b(celebrate|achievement|milestone|progress)\b'
            ]
        }
    
    async def execute(self, state: AgentState):
        """Execute the orchestrator's main logic. Returns dict to merge into state for LangGraph workflow."""
        logger.debug("Orchestrator.execute START state=%s", state)
        try:
            user_input = state.get("user_input", "")
            context = state.get("context", {})
            conversation_id = state.get("conversation_id", None)
            agent_id = state.get("agent", self.agent_id)

            # Robustly get user preferences
            try:
                user_preferences = await self.knowledge_base.get_user_preferences()
                if hasattr(user_preferences, "model_dump"):
                    user_preferences_dict = user_preferences.model_dump()
                elif isinstance(user_preferences, dict):
                    user_preferences_dict = user_preferences
                else:
                    user_preferences_dict = {}
            except Exception as e:
                logger.warning(f"Failed to parse stored preferences: {e}. Using defaults.")
                user_preferences_dict = {}

            # Classify intent
            intent_result = await self._classify_intent(user_input, context)
            target_agent_type = intent_result.get("agent_type")
            confidence = intent_result.get("confidence", 0.0)

            reasoning = {
                "step": "intent_classification",
                "intent_result": intent_result,
                "user_preferences": user_preferences_dict,
                "conversation_id": conversation_id,
                "agent_id": agent_id
            }

            # If confidence is low or no specific agent identified, handle directly
            if confidence < 0.7 or target_agent_type == AgentType.GENERAL:
                response = await self._handle_directly(user_input, context)
                reasoning.update({
                    "step": "direct_response",
                    "reason": "Low confidence or general intent; handled by orchestrator."
                })
                
                # Return only new fields to be merged into state
                logger.debug("Orchestrator.execute RETURNING direct response to merge into state")
                return {
                    "response": response,
                    "reasoning": reasoning
                }

            # Check if we should hand off to a specialized agent
            if target_agent_type and target_agent_type != AgentType.ORCHESTRATOR:
                # Find the best agent for the task
                target_agents = self.registry.get_agents_by_type(target_agent_type)

                if target_agents:
                    target_agent = target_agents[0]  # Get first available agent
                    
                    # Execute the target agent directly
                    target_response = await target_agent.execute(state)
                    
                    reasoning.update({
                        "step": "agent_delegation",
                        "target_agent": target_agent.agent_id,
                        "reason": f"Intent classified as {target_agent_type.value} with confidence {confidence}. Delegated to specialized agent."
                    })
                    
                    # Extract response from target agent result
                    response = None
                    if isinstance(target_response, str):
                        response = target_response
                    elif isinstance(target_response, dict) and "response" in target_response:
                        response = target_response["response"]
                    elif isinstance(target_response, tuple) and len(target_response) == 2:
                        response = target_response[0]
                    else:
                        # Fallback: handle directly
                        response = await self._handle_directly(user_input, context)
                        reasoning["reason"] = "Target agent response was invalid; handled by orchestrator."
                    
                    logger.debug("Orchestrator.execute RETURNING delegated response to merge into state")
                    return {
                        "response": response,
                        "reasoning": reasoning
                    }
                else:
                    # No specialized agent available, handle directly
                    response = await self._handle_directly(user_input, context)
                    reasoning.update({
                        "step": "direct_response",
                        "reason": "No specialized agent available; handled by orchestrator."
                    })
                    logger.debug("Orchestrator.execute RETURNING fallback response (no agent available)")
                    return {
                        "response": response,
                        "reasoning": reasoning
                    }

            # Handle directly if no handoff needed
            response = await self._handle_directly(user_input, context)
            reasoning.update({
                "step": "direct_response",
                "reason": "No handoff needed; handled by orchestrator."
            })
            logger.debug("Orchestrator.execute RETURNING direct response (fallback)")
            return {
                "response": response,
                "reasoning": reasoning
            }

        except Exception as e:
            logger.error(f"Error in orchestrator execute: {e}", exc_info=True)
            return {
                "response": f"I apologize, but I encountered an error while processing your request: {str(e)}",
                "reasoning": {"error": str(e), "agent_id": self.agent_id}
            }

        except Exception as e:
            logger.error(f"Error in orchestrator execution: {e}")
            return (
                "I apologize, but I encountered an issue processing your request. Let me try to help you in a different way. Could you please rephrase your request?",
                {"error": str(e), "step": "exception"}
            )
    
    async def _classify_intent(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Classify user intent to determine appropriate agent."""
        try:
            # First, try pattern-based classification for speed
            pattern_result = self._pattern_based_classification(user_input)
            if pattern_result["confidence"] > 0.8:
                return pattern_result
            
            # Use LLM for more complex classification
            llm_result = await self._llm_based_classification(user_input, context)
            
            # Combine results, preferring LLM if confidence is high
            if llm_result["confidence"] > pattern_result["confidence"]:
                return llm_result
            else:
                return pattern_result
                
        except Exception as e:
            logger.error(f"Error in intent classification: {e}")
            return {"agent_type": AgentType.GENERAL, "confidence": 0.5, "reason": "Classification error"}
    
    def _pattern_based_classification(self, user_input: str) -> Dict[str, Any]:
        """Classify intent using regex patterns (compiled, case-insensitive)."""
        import re
        user_input_lower = user_input.lower()
        scores = {}

        for agent_type, patterns in self.intent_patterns.items():
            score = 0
            matches = []
            for pattern in patterns:
                # compile with IGNORECASE to be robust
                try:
                    regex = re.compile(pattern, flags=re.IGNORECASE)
                except re.error:
                    # fall back to a safe word match (escape)
                    regex = re.compile(re.escape(pattern), flags=re.IGNORECASE)

                found = regex.findall(user_input)
                if found:
                    score += len(found)
                    matches.extend(found)

            if score > 0:
                scores[agent_type] = {
                    "score": score,
                    "matches": matches,
                    # Normalize confidence a bit more sensibly
                    "confidence": min(0.2 + (score * 0.25), 0.99)
                }

        if not scores:
            return {"agent_type": AgentType.GENERAL, "confidence": 0.3, "reason": "No pattern matches"}

        best_agent = max(scores.keys(), key=lambda k: scores[k]["score"])
        result = scores[best_agent]
        return {
            "agent_type": best_agent,
            "confidence": result["confidence"],
            "reason": f"Pattern matches: {', '.join(map(str, result['matches']))}",
            "method": "pattern_based"
        }
    
    async def _llm_based_classification(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        try:
            llm_service = await get_llm_service()
            classification_prompt = PromptLibrary.get_intent_classification_prompt(user_input)
            classification_prompt += "\n\nReturn ONLY a JSON object like: {\"agent_type\": \"PRODUCTIVITY\", \"confidence\": 0.86, \"reason\": \"short explanation\"}"

            if context:
                context_str = "\n".join([f"- {k}: {v}" for k, v in context.items()])
                classification_prompt += f"\n\nAdditional Context:\n{context_str}"

            request = CompletionRequest(
                messages=[
                    ChatMessage(role="system", content="You are an expert at classifying user intents for routing to specialized AI agents."),
                    ChatMessage(role="user", content=classification_prompt)
                ],
                max_tokens=150,
                temperature=0.0
            )

            response = await llm_service.chat_completion(request)
            response_text = response.content.strip()

            # attempt to parse JSON
            try:
                import json
                parsed = json.loads(response_text)
                agent_label = parsed.get("agent_type", "GENERAL").upper()
                confidence = float(parsed.get("confidence", 0.5))
                # map label to AgentType enum
                agent_type = next((a for a in AgentType if a.value.upper() == agent_label or a.name == agent_label), AgentType.GENERAL)
                return {"agent_type": agent_type, "confidence": confidence, "reason": parsed.get("reason", response_text), "method": "llm_based"}
            except Exception:
                # fallback: scan for token names
                for agent in AgentType:
                    if agent.value.upper() in response_text.upper() or agent.name in response_text:
                        return {"agent_type": agent, "confidence": 0.75, "reason": response_text, "method": "llm_based"}
                return {"agent_type": AgentType.GENERAL, "confidence": 0.4, "reason": response_text, "method": "llm_based"}
        except Exception as e:
            logger.error(f"Error in LLM-based classification: {e}")
            return {"agent_type": AgentType.GENERAL, "confidence": 0.3, "reason": f"LLM classification error: {str(e)}"}
    
    async def _handle_directly(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle the request directly without handoff."""
        try:
            llm_service = await get_llm_service()
            
            # Get relevant context from knowledge base
            relevant_context = await self.knowledge_base.get_relevant_context(
                query=user_input,
                max_results=3
            )
            
            # Build context-aware prompt
            context_info = []
            if relevant_context:
                context_info.append("Relevant context from your knowledge base:")
                for ctx in relevant_context:
                    context_info.append(f"- {ctx.entry.title}: {ctx.entry.content[:200]}...")
            
            # Create the completion request
            messages = [
                ChatMessage(role="system", content=self.system_prompt),
                ChatMessage(role="user", content=user_input)
            ]
            
            if context_info:
                context_message = ChatMessage(
                    role="system", 
                    content="\n".join(context_info)
                )
                messages.insert(-1, context_message)
            
            request = CompletionRequest(
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            response = await llm_service.chat_completion(request)
            
            # Store interaction in knowledge base
            await self.knowledge_base.add_interaction_history(
                agent_type="orchestrator",
                user_input=user_input,
                agent_response=response.content,
                context=context
            )
            
            return response.content
            
        except Exception as e:
            logger.error(f"Error handling request directly: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing it or let me know if you'd like help with something specific?"
    
    def _get_handoff_scenario(self, agent_type: AgentType) -> str:
        """Get the appropriate handoff scenario key for an agent type."""
        scenario_map = {
            AgentType.PRODUCTIVITY: "task_management",
            AgentType.HEALTH: "health_wellness",
            AgentType.FINANCE: "financial_planning",
            AgentType.SCHEDULING: "scheduling",
            AgentType.JOURNAL: "reflection_journaling",
            AgentType.GENERAL: "general_inquiry"
        }
        return scenario_map.get(agent_type, "general_inquiry")
    
    def should_handoff(self, user_input: str, context: Dict[str, Any]) -> bool:
        """Determine if this request should be handed off to a specialist."""
        # The orchestrator always evaluates for handoff in its main execute method
        # This method is used by the base class workflow
        return False  # We handle handoff logic in execute()
    
    async def handle_agent_response(self, agent_id: str, response: str, original_input: str) -> str:
        """Handle response from a specialized agent."""
        try:
            # Add some orchestrator context to the response
            enhanced_response = f"{response}\n\nIs there anything else I can help you with today?"
            
            # Store the interaction
            await self.knowledge_base.add_interaction_history(
                agent_type="orchestrator_coordination",
                user_input=original_input,
                agent_response=enhanced_response,
                context={"delegated_to": agent_id}
            )
            
            return enhanced_response
            
        except Exception as e:
            logger.error(f"Error handling agent response: {e}")
            return response  # Return original response if enhancement fails
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status from orchestrator perspective."""
        try:
            registry_stats = self.registry.get_registry_stats()
            communication_stats = self.communication.get_protocol_stats()
            knowledge_stats = await self.knowledge_base.get_stats()
            
            return {
                "orchestrator_status": self.get_status_info(),
                "registry_stats": registry_stats,
                "communication_stats": communication_stats,
                "knowledge_base_stats": knowledge_stats.model_dump(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
    
    async def handle_complex_request(self, user_input: str, required_agents: List[AgentType]) -> str:
        """Handle complex requests that require multiple agents."""
        try:
            responses = []
            
            for agent_type in required_agents:
                agents = self.registry.get_agents_by_type(agent_type)
                if agents:
                    agent = agents[0]
                    # This would involve more complex coordination logic
                    # For now, we'll just note that this capability exists
                    responses.append(f"Coordinating with {agent_type.value} agent...")
            
            if responses:
                return "I'm coordinating with multiple specialists to handle your complex request: " + ", ".join(responses)
            else:
                return "I'll handle this complex request step by step for you."
                
        except Exception as e:
            logger.error(f"Error handling complex request: {e}")
            return "I'll work on your request, though I may need to handle it in parts."


def create_orchestrator_agent() -> OrchestratorAgent:
    """Factory function to create an orchestrator agent."""
    return OrchestratorAgent()