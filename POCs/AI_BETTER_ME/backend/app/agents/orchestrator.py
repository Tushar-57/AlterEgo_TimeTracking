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
from ..services.interaction_recorder import get_interaction_recorder
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
        self.llm_service = None  # Will be initialized async when needed
        
        # Intent classification patterns - Enhanced with better coverage
        self.intent_patterns = {
            AgentType.PRODUCTIVITY: [
                r'\b(task|todo|goal|work|project|deadline|priority)\b',
                r'\b(organize|manage|track|complete|accomplish|optimize|streamline)\b',
                r'\b(efficient|focus|time management|workflow|deliverable|milestone)\b',
                r'\b(meeting|agenda|assignment|schedule task|plan work)\b',
                r'\b(productive|efficiency|performance|output)\b'
            ],
            AgentType.HEALTH: [
                r'\b(health|wellness|exercise|fitness|habit|routine|workout)\b',
                r'\b(sleep|diet|nutrition|meal|food|eating|cook|recipe)\b',
                r'\b(healthy|wellbeing|self-care|energy|vitality)\b',
                r'\b(meditation|mindfulness|stress|mental health)\b',
                r'\b(meal planning|menu|grocery|calories|protein|vitamins)\b',
                r'\b(weight|body|physical|cardio|strength|yoga)\b'
            ],
            AgentType.FINANCE: [
                r'\b(money|budget|expense|spending|financial|finance)\b',
                r'\b(save|saving|investment|income|cost|price|salary)\b',
                r'\b(bank|account|transaction|bill|payment|purchase)\b',
                r'\b(retirement|insurance|loan|credit|debt|portfolio)\b'
            ],
            AgentType.SCHEDULING: [
                r'\b(calendar|appointment|meeting|schedule|time|date)\b',
                r'\b(book|reserve|plan|arrange|organize|reschedule)\b',
                r'\b(available|busy|free|conflict|timing|when)\b',
                r'\b(reminder|event|deadline|booking|slot)\b'
            ],
            AgentType.JOURNAL: [
                r'\b(journal|reflect|reflection|mood|feeling|emotion)\b',
                r'\b(diary|thoughts|gratitude|mindset|growth|personal)\b',
                r'\b(celebrate|achievement|milestone|memory)\b',
                r'\b(insight|learning|experience|breakthrough|retrospective)\b',
                r'\b(daily reflection|weekly reflection|progress reflection)\b',
                r'\b(reflect on|look back|think about|ponder|contemplate)\b',
                r'\b(progress|development|self-improvement|personal growth)\b'
            ]
        }
    
    async def execute(self, state: AgentState):
        """Execute the orchestrator's main logic. Returns dict to merge into state for LangGraph workflow."""
        logger.debug("Orchestrator.execute START state=%s", state)
        try:
            # Handle various input types from LangGraph
            if isinstance(state, str):
                # If state is a string, treat it as user_input and create proper state dict
                user_input = state
                context = {}
                conversation_id = None
                agent_id = self.agent_id
                # Create proper state dict for processing
                state = {
                    "user_input": user_input,
                    "context": context,
                    "conversation_id": conversation_id,
                    "agent": agent_id
                }
            elif isinstance(state, dict):
                # Normal case - state is already a dict
                user_input = state.get("user_input", "")
                context = state.get("context", {})
                conversation_id = state.get("conversation_id", None)
                agent_id = state.get("agent", self.agent_id)
            else:
                # Fallback for other types
                logger.warning(f"Unexpected state type: {type(state)}, treating as empty input")
                user_input = str(state) if state else ""
                context = {}
                conversation_id = None
                agent_id = self.agent_id
                state = {
                    "user_input": user_input,
                    "context": context,
                    "conversation_id": conversation_id,
                    "agent": agent_id
                }

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
                "classification": {
                    "agent_type": str(target_agent_type.value) if target_agent_type else "general",
                    "confidence": round(confidence, 2),
                    "reason": intent_result.get("reason", "Intent classification performed")
                },
                "steps": [
                    {
                        "agent": "orchestrator",
                        "action": "Analyzing user request and classifying intent",
                        "result": f"Identified as {target_agent_type.value if target_agent_type else 'general'} task"
                    }
                ]
            }

            # If confidence is reasonable and we have a specific agent, delegate
            if confidence >= 0.5 and target_agent_type and target_agent_type != AgentType.GENERAL:
                reasoning["steps"].append({
                    "agent": "orchestrator",
                    "action": f"Delegating to {target_agent_type.value} agent",
                    "result": f"High confidence ({confidence:.2f}) in agent selection"
                })
                
                # Delegate to appropriate agent
                delegation_result = await self._delegate_to_agent(target_agent_type, user_input, context)
                if delegation_result:
                    reasoning.update({
                        "finalAgent": target_agent_type.value,
                        "handoff": {
                            "from": "orchestrator",
                            "to": target_agent_type.value,
                            "reason": f"Intent classified as {target_agent_type.value} with {confidence:.2f} confidence"
                        }
                    })
                    reasoning["steps"].append({
                        "agent": target_agent_type.value,
                        "action": "Processing specialized request",
                        "result": "Request handled by specialist"
                    })
                    return {
                        "response": delegation_result,
                        "reasoning": reasoning
                    }
            
            # If confidence is low or delegation failed, handle directly
            reasoning["steps"].append({
                "agent": "orchestrator",
                "action": "Handling request directly due to low confidence or delegation failure",
                "result": "Processing with general capabilities"
            })
            
            response = await self._handle_directly(user_input, context)
            reasoning.update({
                "finalAgent": "orchestrator"
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
                    
                    reasoning["handoff"] = {
                        "from": "orchestrator",
                        "to": str(target_agent_type.value),
                        "reason": f"Delegating {target_agent_type.value} request to specialized agent"
                    }
                    
                    reasoning["steps"].append({
                        "agent": "orchestrator",
                        "action": f"Delegating to {target_agent_type.value} agent",
                        "result": f"Handoff to {target_agent.agent_id}"
                    })
                    
                    # Execute the target agent directly
                    target_response = await target_agent.execute(state)
                    
                    reasoning["steps"].append({
                        "agent": str(target_agent_type.value),
                        "action": "Processing specialized request",
                        "result": "Generated response using domain expertise and contextual knowledge"
                    })
                    
                    reasoning.update({
                        "finalAgent": str(target_agent_type.value)
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
                        reasoning["error"] = "Target agent response was invalid; handled by orchestrator."
                    
                    # Intelligently record interaction if not already done by specialized agent
                    if not hasattr(target_agent, '__class__') or 'specialized' not in target_agent.__class__.__name__.lower():
                        try:
                            recorder = get_interaction_recorder()
                            await recorder.record_if_valuable(
                                user_input=user_input,
                                agent_response=response,
                                agent_type=str(target_agent_type.value)
                            )
                        except Exception as e:
                            logger.warning(f"Failed to record interaction: {e}")
                    
                    logger.debug("Orchestrator.execute RETURNING delegated response to merge into state")
                    return {
                        "response": response,
                        "reasoning": reasoning
                    }
                else:
                    # No specialized agent available, handle directly
                    reasoning["steps"].append({
                        "agent": "orchestrator",
                        "action": "No specialized agent available, handling directly",
                        "result": "Using general capabilities"
                    })
                    
                    response = await self._handle_directly(user_input, context)
                    reasoning.update({
                        "finalAgent": "orchestrator",
                        "error": f"No {target_agent_type.value} agent available"
                    })
                    logger.debug("Orchestrator.execute RETURNING fallback response (no agent available)")
                    return {
                        "response": response,
                        "reasoning": reasoning
                    }

            # Handle directly if no handoff needed
            reasoning["steps"].append({
                "agent": "orchestrator",
                "action": "Processing request with general capabilities",
                "result": "No specialized routing needed"
            })
            
            response = await self._handle_directly(user_input, context)
            reasoning.update({
                "finalAgent": "orchestrator"
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
                "reasoning": {
                    "error": str(e),
                    "finalAgent": "orchestrator",
                    "steps": [
                        {
                            "agent": "orchestrator",
                            "action": "Error handling",
                            "result": f"Exception: {str(e)}"
                        }
                    ]
                }
            }
    
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
        """Handle requests directly without handoff, providing rich, contextual responses."""
        try:
            # Get relevant knowledge from knowledge base
            knowledge_context = ""
            try:
                if self.knowledge_base:
                    knowledge_results = await self.knowledge_base.search_knowledge(user_input)
                    if knowledge_results:
                        knowledge_context = "\nRelevant context from previous interactions:\n"
                        for result in knowledge_results[:3]:  # Top 3 most relevant
                            knowledge_context += f"- {result.get('content', '')}\n"
            except Exception as e:
                logger.warning(f"Knowledge search failed: {e}")
                knowledge_context = ""
            
            # Create a comprehensive system prompt using the prompt library
            base_prompt = PromptLibrary.get_orchestrator_prompt()
            
            # Enhanced system prompt with context awareness
            enhanced_system_prompt = f"""{base_prompt}\n\n**Enhanced Capabilities:**\n- I have access to knowledge from your previous interactions\n- I can provide detailed, personalized responses based on your history\n- I understand context from your ongoing conversations\n- I can suggest relevant actions and next steps\n\n**Response Guidelines:**\n- Provide comprehensive, helpful answers\n- Include relevant examples when appropriate\n- Suggest follow-up actions or questions\n- Reference past conversations when relevant\n- Be conversational but informative\n- Use structured formatting when it helps clarity\n\n**Available Specialized Agents:**\n- 🚀 **Productivity Agent**: Task management, goal tracking, workflow optimization\n- 🌿 **Health Agent**: Wellness tracking, habit formation, health routines\n- 💰 **Finance Agent**: Expense tracking, budgeting, financial planning\n- 📅 **Scheduling Agent**: Calendar management, time optimization\n- 📝 **Journal Agent**: Daily reflections, mood tracking, personal growth\n- 🤖 **General Agent**: Fallback for general questions and assistance\n\nIf a query would benefit from a specialized agent, I should mention that option.{knowledge_context}"""

            # Create enhanced user prompt with context
            enhanced_user_input = f"""User Query: {user_input}\n\nConversation Context:\n- Conversation ID: {context.get('conversation_id', 'New conversation')}\n- Previous interactions: {len(context.get('conversation_history', []))} messages\n- User timezone: {context.get('timezone', 'Not specified')}\n- Current time: {context.get('current_time', 'Not available')}\n\nPlease provide a comprehensive, helpful response that addresses the user's query directly."""

            # Initialize LLM service if needed
            if self.llm_service is None:
                self.llm_service = await get_llm_service()

            # Use the LLM service to generate a rich response
            request = CompletionRequest(
                messages=[
                    ChatMessage(role="system", content=enhanced_system_prompt),
                    ChatMessage(role="user", content=enhanced_user_input)
                ],
                max_tokens=800,
                temperature=0.6  # Slightly lower for more focused responses
            )
            
            response = await self.llm_service.chat_completion(request)
            response_text = response.content.strip()
            
            # Analyze the response to provide better reasoning
            response_analysis = self._analyze_response_quality(user_input, response_text)
            
            return {
                "response": response_text,
                "reasoning": {
                    "intent": "general_query",
                    "confidence": 0.85,
                    "finalAgent": "orchestrator",
                    "analysis": f"Direct handling with enhanced context. Response quality: {response_analysis['quality']}",
                    "actionsTaken": [
                        "Enhanced context gathering",
                        "Knowledge base search",
                        "Comprehensive response generation",
                        f"Response analysis: {response_analysis['metrics']}"
                    ],
                    "knowledgeUsed": len(knowledge_context) > 0,
                    "responseMetrics": response_analysis
                },
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error in _handle_directly: {e}")
            
            # Enhanced error response
            error_prompt = PromptLibrary.get_error_response_prompt()
            fallback_response = f"{error_prompt} I encountered a technical issue while processing your request about '{user_input[:50]}...'. Please try rephrasing your question or ask something else."
            
            return {
                "response": fallback_response,
                "reasoning": {
                    "intent": "error",
                    "confidence": 0.0,
                    "finalAgent": "orchestrator",
                    "analysis": f"Error in enhanced direct handling: {str(e)}",
                    "actionsTaken": ["Error handling", "Fallback response generation"],
                    "errorDetails": str(e)
                },
                "status": "error"
            }

    def _analyze_response_quality(self, user_input: str, response: str) -> Dict[str, Any]:
        """Analyze response quality for improvement insights."""
        metrics = {
            "length": len(response),
            "word_count": len(response.split()),
            "has_structure": any(marker in response for marker in ["**", "*", "-", "1.", "2.", "3."]),
            "has_examples": any(word in response.lower() for word in ["example", "for instance", "such as"]),
            "has_actionable": any(word in response.lower() for word in ["you can", "try", "consider", "would you like"]),
            "addresses_query": user_input.lower()[:20] in response.lower() or any(word in response.lower() for word in user_input.lower().split()[:5])
        }
        
        # Calculate quality score
        quality_score = 0
        if metrics["word_count"] > 20: quality_score += 1
        if metrics["has_structure"]: quality_score += 1
        if metrics["has_examples"]: quality_score += 1
        if metrics["has_actionable"]: quality_score += 1
        if metrics["addresses_query"]: quality_score += 1
        
        quality_levels = ["Poor", "Basic", "Good", "Excellent", "Outstanding"]
        quality = quality_levels[min(quality_score, 4)]
        
        return {
            "quality": quality,
            "score": quality_score,
            "metrics": metrics
        }

    async def _delegate_to_agent(self, target_agent_type: AgentType, user_input: str, context: Dict[str, Any]) -> str:
        """Delegate the request to the appropriate specialist agent."""
        try:
            # Get the target agent from registry
            target_agent = self.registry.get_agent_by_type(target_agent_type)
            if not target_agent:
                logger.warning(f"Target agent {target_agent_type.value} not found in registry")
                return None
            
            # Create agent state for delegation
            agent_state = {
                "user_input": user_input,
                "context": context,
                "conversation_id": context.get("conversation_id"),
                "agent": target_agent.agent_id
            }
            
            # Execute the agent
            result = await target_agent.execute(agent_state)
            
            # Extract response from result
            if isinstance(result, dict):
                response = result.get("response")
                if response:
                    logger.info(f"Successfully delegated to {target_agent_type.value} agent")
                    return response
            elif isinstance(result, str):
                logger.info(f"Successfully delegated to {target_agent_type.value} agent")
                return result
            
            logger.warning(f"Invalid response from {target_agent_type.value} agent: {result}")
            return None
            
        except Exception as e:
            logger.error(f"Error delegating to {target_agent_type.value} agent: {e}")
            return None
    
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
            
            # Intelligently record the coordination interaction
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=original_input,
                agent_response=enhanced_response,
                agent_type="orchestrator"
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