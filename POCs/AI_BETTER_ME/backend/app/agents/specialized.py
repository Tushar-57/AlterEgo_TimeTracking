"""
Specialized agent implementations with domain-specific logic and context awareness.
"""

import logging
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from .base import BaseAgent, AgentType, AgentCapability, AgentState
from .prompts import get_agent_prompt
from ..llm.service import get_llm_service
from ..llm.base import CompletionRequest, ChatMessage
from ..services.knowledge_base import get_knowledge_base_service
from ..models.knowledge import KnowledgeEntryType
from ..services.interaction_recorder import get_interaction_recorder

logger = logging.getLogger(__name__)


class HealthAgent(BaseAgent):
    """Specialized agent for health, wellness, and nutrition management."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="meal_planning",
                description="Create personalized meal plans based on dietary preferences and goals",
                parameters={"dietary_restrictions": True, "nutrition_goals": True}
            ),
            AgentCapability(
                name="habit_tracking",
                description="Track and analyze health habits and routines",
                parameters={"habit_types": ["exercise", "sleep", "nutrition", "mood"]}
            ),
            AgentCapability(
                name="wellness_coaching",
                description="Provide personalized wellness advice and motivation",
                parameters={"coaching_style": "supportive", "goal_oriented": True}
            )
        ]
        
        super().__init__(
            agent_id="health_specialized",
            agent_type=AgentType.HEALTH,
            capabilities=capabilities,
            system_prompt=get_agent_prompt(AgentType.HEALTH)
        )
        self.knowledge_base = get_knowledge_base_service()

    async def execute(self, state: AgentState) -> Dict[str, Any]:
        """Execute health-related requests with contextual awareness."""
        try:
            user_input = state.get("user_input", "")
            logger.info(f"HealthAgent executing request: {user_input}")
            
            # Get relevant context from knowledge base
            context = await self.knowledge_base.get_contextual_knowledge_for_agent(
                user_input=user_input,
                agent_type="health",
                max_results=10
            )
            
            logger.info(f"Retrieved context with keys: {list(context.keys())}")
            logger.info(f"Context details: {context}")
            
            # Check if this is a meal planning request
            if self._is_meal_planning_request(user_input):
                logger.info("Processing as meal planning request")
                response = await self._handle_meal_planning(user_input, context)
            elif self._is_habit_tracking_request(user_input):
                logger.info("Processing as habit tracking request")
                response = await self._handle_habit_tracking(user_input, context)
            else:
                logger.info("Processing as general health query")
                response = await self._handle_general_health_query(user_input, context)
            
            # Intelligently record interaction if valuable
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=user_input,
                agent_response=response,
                agent_type="health"
            )
            
            # Extract and store any new preferences
            await self.knowledge_base.extract_and_store_preferences(
                user_input=user_input,
                agent_type="health",
                agent_response=response
            )
            
            return {
                "response": response,
                "reasoning": {
                    "agent_type": "health",
                    "context_used": len(context.get("relevant_interactions", [])) + len(context.get("user_preferences", [])),
                    "specialized_handling": True
                }
            }
            
        except Exception as e:
            logger.error(f"Health agent execution failed: {e}")
            return {
                "response": "I apologize, but I encountered an issue while processing your health request. Please try again.",
                "reasoning": {"error": str(e), "agent_type": "health"}
            }

    def _is_meal_planning_request(self, user_input: str) -> bool:
        """Check if the request is about meal planning."""
        meal_keywords = ["meal", "food", "recipe", "nutrition", "diet", "eating", "breakfast", "lunch", "dinner", "cook", "plan"]
        return any(keyword in user_input.lower() for keyword in meal_keywords)

    def _is_habit_tracking_request(self, user_input: str) -> bool:
        """Check if the request is about habit tracking."""
        habit_keywords = ["habit", "routine", "track", "exercise", "workout", "sleep", "water", "steps"]
        return any(keyword in user_input.lower() for keyword in habit_keywords)

    async def _handle_meal_planning(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle meal planning requests with personalized context."""
        try:
            logger.info(f"Handling meal planning with context: {context}")
            
            # Build context-aware prompt
            context_info = self._build_meal_planning_context(context)
            logger.info(f"Built context info: {context_info}")
            
            meal_planning_prompt = f"""
            You are a health and nutrition expert helping with meal planning. Use the following context about the user:

            {context_info}

            User Request: {user_input}

            Based on the user's preferences and dietary requirements, provide a detailed and personalized response that includes:
            1. Specific meal suggestions that match their dietary preferences
            2. Consideration of their health goals and restrictions
            3. Practical preparation tips
            4. Nutritional benefits

            Make the response actionable and tailored to their specific needs.
            """
            
            llm_service = await get_llm_service()
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=meal_planning_prompt)],
                temperature=0.7,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            logger.info(f"Generated meal planning response: {response.content[:200]}...")
            return response.content
            
        except Exception as e:
            logger.error(f"Meal planning failed: {e}")
            return "I'd be happy to help with meal planning! Could you tell me about your dietary preferences, any restrictions, and your health goals?"

    def _build_meal_planning_context(self, context: Dict[str, Any]) -> str:
        """Build meal planning context from user's knowledge base."""
        context_parts = []
        
        # Add dietary preferences
        health_prefs = context.get("agent_preferences", {})
        if health_prefs:
            dietary_info = health_prefs.get("dietary_preferences", [])
            if dietary_info:
                context_parts.append(f"Dietary Preferences: {', '.join(dietary_info)}")
            
            health_goals = health_prefs.get("exercise_goals", "")
            if health_goals:
                context_parts.append(f"Health Goals: {health_goals}")

        # Add relevant user preferences
        user_prefs = context.get("user_preferences", [])
        for pref in user_prefs[:3]:  # Top 3 most relevant
            context_parts.append(f"User Preference: {pref['content']}")

        # Add recent relevant interactions
        interactions = context.get("relevant_interactions", [])
        if interactions:
            recent_interaction = interactions[0]
            context_parts.append(f"Recent Context: {recent_interaction['content'][:200]}...")

        if not context_parts:
            return "No specific dietary preferences or health information available. Please ask the user for their preferences."
        
        return "\n".join(context_parts)

    async def _handle_habit_tracking(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle habit tracking requests."""
        # Implementation for habit tracking
        return "I'll help you track your health habits. Based on your request, I can assist with monitoring exercise, sleep, nutrition, or mood patterns."

    async def _handle_general_health_query(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general health queries with context."""
        try:
            context_summary = context.get("context_summary", "")
            
            health_prompt = f"""
            You are a knowledgeable health and wellness coach. Consider this context about the user:

            Context: {context_summary}

            User Query: {user_input}

            Provide helpful, personalized health advice that takes into account their background and previous interactions.
            Be supportive and practical in your suggestions.
            """
            
            llm_service = await get_llm_service()
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=health_prompt)],
                temperature=0.7,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"General health query failed: {e}")
            return "I'm here to help with your health and wellness goals. How can I assist you today?"


class ProductivityAgent(BaseAgent):
    """Specialized agent for productivity, task management, and goal tracking."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="task_management",
                description="Create, organize, and track tasks and projects",
                parameters={"priority_levels": True, "deadline_tracking": True}
            ),
            AgentCapability(
                name="goal_setting",
                description="Set and track personal and professional goals",
                parameters={"smart_goals": True, "progress_tracking": True}
            ),
            AgentCapability(
                name="time_management",
                description="Optimize time usage and scheduling",
                parameters={"time_blocking": True, "productivity_analysis": True}
            ),
            AgentCapability(
                name="workflow_optimization",
                description="Improve workflows and productivity systems",
                parameters={"automation_suggestions": True, "efficiency_tips": True}
            )
        ]
        
        super().__init__(
            agent_id="productivity_specialized",
            agent_type=AgentType.PRODUCTIVITY,
            capabilities=capabilities,
            system_prompt=get_agent_prompt(AgentType.PRODUCTIVITY)
        )
        
        self.knowledge_base = get_knowledge_base_service()
    
    async def execute(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute productivity-related requests with contextual knowledge."""
        try:
            logger.info(f"ProductivityAgent processing: {user_input}")
            
            # Get contextual knowledge from knowledge base
            contextual_knowledge = await self.knowledge_base.get_contextual_knowledge_for_agent(
                user_input=user_input,
                agent_type="productivity",
                max_results=10
            )
            
            # Determine productivity task type
            if any(keyword in user_input.lower() for keyword in ["task", "todo", "organize", "project"]):
                response = await self._handle_task_management(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["goal", "objective", "target", "achieve"]):
                response = await self._handle_goal_setting(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["time", "schedule", "productivity", "focus"]):
                response = await self._handle_time_management(user_input, contextual_knowledge)
            else:
                response = await self._handle_general_productivity(user_input, contextual_knowledge)
            
            # Intelligently record interaction if valuable
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=user_input,
                agent_response=response,
                agent_type="productivity"
            )
            
            return {"response": response, "status": "success"}
            
        except Exception as e:
            logger.error(f"ProductivityAgent execution failed: {e}")
            return {"response": "I'm having trouble with productivity assistance right now. Please try again later.", "status": "error"}
    
    async def _handle_task_management(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle task management requests."""
        try:
            task_context = self._build_productivity_context(context, "tasks")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📋 I'd be happy to help you manage your tasks! What tasks would you like to organize?"
            
            prompt = f"""
            As a productivity coach, help the user with task management and organization.
            
            User Request: {user_input}
            Task Context: {task_context}
            
            Provide:
            1. Task organization strategies (using Eisenhower Matrix or similar)
            2. Priority recommendations based on their work style
            3. Deadline and milestone suggestions
            4. Task breakdown for complex projects
            5. Tracking and review methods
            
            Use emojis and format nicely with actionable task management advice.
            """
            
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Task management failed: {e}")
            return "📋 I'd be happy to help you manage your tasks! What specific tasks would you like to organize?"
    
    async def _handle_goal_setting(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle goal setting and tracking requests."""
        try:
            goal_context = self._build_productivity_context(context, "goals")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "🎯 I'd love to help you set and achieve your goals! What goals are you working on?"
            
            prompt = f"""
            As a goal-setting expert, help the user create and track meaningful goals.
            
            User Request: {user_input}
            Goal Context: {goal_context}
            
            Provide:
            1. SMART goal framework application
            2. Goal breakdown into actionable steps
            3. Progress tracking recommendations
            4. Motivation and accountability strategies
            5. Timeline and milestone suggestions
            
            Use emojis and format nicely with structured goal-setting guidance.
            """
            
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Goal setting failed: {e}")
            return "🎯 I'd love to help you set and achieve your goals! What specific goals would you like to work on?"
    
    async def _handle_time_management(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle time management and productivity optimization."""
        try:
            time_context = self._build_productivity_context(context, "time")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "⏰ I'd be happy to help optimize your time! What time management challenges are you facing?"
            
            prompt = f"""
            As a time management expert, help the user optimize their productivity and time usage.
            
            User Request: {user_input}
            Time Management Context: {time_context}
            
            Provide:
            1. Time blocking strategies for their schedule
            2. Productivity techniques (Pomodoro, deep work, etc.)
            3. Focus and concentration tips
            4. Energy management recommendations
            5. Work-life balance suggestions
            
            Use emojis and format nicely with practical time management advice.
            """
            
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Time management failed: {e}")
            return "⏰ I'd be happy to help optimize your time! What specific time management areas would you like to improve?"
    
    async def _handle_general_productivity(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general productivity queries."""
        try:
            productivity_context = self._build_productivity_context(context, "general")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "🚀 I'm here to boost your productivity! What can I help you with?"
            
            prompt = f"""
            As a productivity expert, provide helpful advice for the user's productivity question.
            
            User Request: {user_input}
            Productivity Context: {productivity_context}
            
            Provide relevant productivity advice, tips, and recommendations based on their question.
            Use emojis and format nicely with clear, actionable information.
            """
            
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"General productivity failed: {e}")
            return "🚀 I'm here to boost your productivity! What specific area would you like help with?"
    
    def _build_productivity_context(self, context: Dict[str, Any], productivity_type: str) -> str:
        """Build productivity context from available knowledge."""
        context_parts = []
        
        # Add agent preferences (productivity preferences from knowledge base)
        if "agent_preferences" in context and context["agent_preferences"]:
            prefs = context["agent_preferences"]
            if isinstance(prefs, dict):
                productivity_prefs = {k: v for k, v in prefs.items() if any(term in k.lower() for term in ["work", "task", "goal", "time", "productivity", "schedule"])}
                if productivity_prefs:
                    context_parts.append(f"Productivity preferences: {productivity_prefs}")
        
        # Add context summary
        if "context_summary" in context and context["context_summary"]:
            context_parts.append(f"Previous productivity context: {context['context_summary']}")
        
        return " | ".join(context_parts) if context_parts else f"No specific {productivity_type} context available"


class FinanceAgent(BaseAgent):
    """Specialized agent for financial management, budgeting, and expense tracking."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="budget_management",
                description="Create and manage personal budgets based on income and expenses",
                parameters={"income_tracking": True, "expense_categories": True}
            ),
            AgentCapability(
                name="expense_tracking",
                description="Track and categorize expenses with insights and recommendations",
                parameters={"category_analysis": True, "spending_patterns": True}
            ),
            AgentCapability(
                name="financial_goals",
                description="Set and track financial goals like savings, debt reduction, investments",
                parameters={"goal_tracking": True, "progress_monitoring": True}
            ),
            AgentCapability(
                name="financial_advice",
                description="Provide personalized financial advice and recommendations",
                parameters={"risk_assessment": True, "investment_suggestions": True}
            )
        ]
        
        super().__init__(
            agent_id=f"finance_{uuid.uuid4().hex[:8]}",
            agent_type=AgentType.FINANCE,
            capabilities=capabilities,
            system_prompt=get_agent_prompt(AgentType.FINANCE)
        )
        
        self.knowledge_base = get_knowledge_base_service()
    
    async def execute(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute finance-related requests with contextual knowledge."""
        try:
            logger.info(f"FinanceAgent processing: {user_input}")
            
            # Get contextual knowledge from knowledge base
            contextual_knowledge = await self.knowledge_base.get_contextual_knowledge_for_agent(
                user_input=user_input,
                agent_type="finance",
                max_results=10
            )
            
            # Determine finance task type
            if any(keyword in user_input.lower() for keyword in ["budget", "budgeting", "monthly budget"]):
                response = await self._handle_budget_planning(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["expense", "spending", "track expenses"]):
                response = await self._handle_expense_tracking(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["save", "savings", "financial goal"]):
                response = await self._handle_financial_goals(user_input, contextual_knowledge)
            else:
                response = await self._handle_general_finance(user_input, contextual_knowledge)
            
            # Intelligently record interaction if valuable
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=user_input,
                agent_response=response,
                agent_type="finance"
            )
            
            return {"response": response, "status": "success"}
            
        except Exception as e:
            logger.error(f"FinanceAgent execution failed: {e}")
            return {"response": "I'm having trouble with financial analysis right now. Please try again later.", "status": "error"}
    
    async def _handle_budget_planning(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle budget planning requests."""
        try:
            budget_context = self._build_finance_context(context, "budget")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "💰 I'd be happy to help with budget planning! Could you share your monthly income and main expense categories?"
            
            prompt = f"""
            As a financial advisor, create a personalized budget plan based on the user's request and financial context.
            
            User Request: {user_input}
            Financial Context: {budget_context}
            
            Provide a detailed budget plan with:
            1. Budget breakdown by categories (housing, food, transportation, etc.)
            2. Savings recommendations (50/30/20 rule or adjusted for their situation)
            3. Specific actionable tips for their financial situation
            4. Monthly tracking suggestions
            
            Use emojis and format nicely with clear sections.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Budget planning failed: {e}")
            return "💰 I'd be happy to help you create a personalized budget! Could you share your monthly income and main expense categories so I can provide specific recommendations?"
    
    async def _handle_expense_tracking(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle expense tracking requests."""
        try:
            expense_context = self._build_finance_context(context, "expenses")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📊 I'd be happy to help track your expenses! What specific expenses would you like to track?"
            
            prompt = f"""
            As a financial advisor, help the user with expense tracking and analysis.
            
            User Request: {user_input}
            Expense Context: {expense_context}
            
            Provide:
            1. Expense tracking recommendations and tools
            2. Category suggestions for their lifestyle
            3. Analysis of spending patterns if available
            4. Tips to reduce unnecessary expenses
            5. Monthly review suggestions
            
            Use emojis and format nicely with actionable advice.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Expense tracking failed: {e}")
            return "📊 I'd be happy to help you track your expenses effectively! What specific expense categories would you like to focus on?"
    
    async def _handle_financial_goals(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle financial goal setting and tracking."""
        try:
            goals_context = self._build_finance_context(context, "goals")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "🎯 I'd be happy to help with your financial goals! What specific financial objectives do you have in mind?"
            
            prompt = f"""
            As a financial advisor, help the user set and achieve their financial goals.
            
            User Request: {user_input}
            Financial Goals Context: {goals_context}
            
            Provide:
            1. SMART financial goal framework
            2. Specific savings strategies for their goals
            3. Timeline recommendations
            4. Progress tracking methods
            5. Motivation and milestone celebration ideas
            
            Use emojis and format nicely with actionable steps.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Financial goals failed: {e}")
            return "🎯 I'd be happy to help you set and achieve your financial goals! What specific financial objectives do you have in mind?"
    
    async def _handle_general_finance(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general financial queries."""
        try:
            finance_context = self._build_finance_context(context, "general")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "💰 I'm here to help with your financial questions! What specific financial topic would you like assistance with?"
            
            prompt = f"""
            As a financial advisor, provide helpful advice for the user's financial question.
            
            User Request: {user_input}
            Financial Context: {finance_context}
            
            Provide relevant financial advice, tips, and recommendations based on their question.
            Use emojis and format nicely with clear, actionable information.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"General finance failed: {e}")
            return "💰 I'm here to help with your financial questions! What specific financial topic would you like assistance with?"
    
    def _build_finance_context(self, context: Dict[str, Any], finance_type: str) -> str:
        """Build financial context from available knowledge."""
        context_parts = []
        
        # Add agent preferences (financial preferences from knowledge base)
        if "agent_preferences" in context and context["agent_preferences"]:
            prefs = context["agent_preferences"]
            if isinstance(prefs, dict):
                finance_prefs = {k: v for k, v in prefs.items() if any(term in k.lower() for term in ["finance", "budget", "income", "expense", "saving"])}
                if finance_prefs:
                    context_parts.append(f"Financial preferences: {finance_prefs}")
        
        # Add context summary
        if "context_summary" in context and context["context_summary"]:
            context_parts.append(f"Previous financial context: {context['context_summary']}")
        
        return " | ".join(context_parts) if context_parts else f"No specific {finance_type} context available"


class SchedulingAgent(BaseAgent):
    """Specialized agent for calendar management, scheduling, and time optimization."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="calendar_management",
                description="Manage appointments, meetings, and calendar events",
                parameters={"event_scheduling": True, "conflict_resolution": True}
            ),
            AgentCapability(
                name="time_optimization",
                description="Optimize daily schedules and time allocation",
                parameters={"schedule_analysis": True, "time_blocking": True}
            ),
            AgentCapability(
                name="appointment_booking",
                description="Book and manage appointments with proper time allocation",
                parameters={"availability_checking": True, "reminder_setting": True}
            ),
            AgentCapability(
                name="schedule_analytics",
                description="Analyze time usage and provide schedule optimization insights",
                parameters={"time_tracking": True, "efficiency_analysis": True}
            )
        ]
        
        super().__init__(
            agent_id=f"scheduling_{uuid.uuid4().hex[:8]}",
            agent_type=AgentType.SCHEDULING,
            capabilities=capabilities,
            system_prompt=get_agent_prompt(AgentType.SCHEDULING)
        )
        
        self.knowledge_base = get_knowledge_base_service()
    
    async def execute(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute scheduling-related requests with contextual knowledge."""
        try:
            logger.info(f"SchedulingAgent processing: {user_input}")
            
            # Get contextual knowledge from knowledge base
            contextual_knowledge = await self.knowledge_base.get_contextual_knowledge_for_agent(
                user_input=user_input,
                agent_type="scheduling",
                max_results=10
            )
            
            # Determine scheduling task type
            if any(keyword in user_input.lower() for keyword in ["schedule", "calendar", "appointment", "meeting"]):
                response = await self._handle_scheduling(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["time block", "optimize", "time management"]):
                response = await self._handle_time_optimization(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["book", "booking", "available", "availability"]):
                response = await self._handle_appointment_booking(user_input, contextual_knowledge)
            else:
                response = await self._handle_general_scheduling(user_input, contextual_knowledge)
            
            # Intelligently record interaction if valuable
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=user_input,
                agent_response=response,
                agent_type="scheduling"
            )
            
            return {"response": response, "status": "success"}
            
        except Exception as e:
            logger.error(f"SchedulingAgent execution failed: {e}")
            return {"response": "I'm having trouble with scheduling right now. Please try again later.", "status": "error"}
    
    async def _handle_scheduling(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general scheduling requests."""
        try:
            schedule_context = self._build_schedule_context(context, "general")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📅 I'd be happy to help with your scheduling! What would you like to schedule?"
            
            prompt = f"""
            As a scheduling assistant, help the user with their calendar and scheduling needs.
            
            User Request: {user_input}
            Schedule Context: {schedule_context}
            
            Provide:
            1. Specific scheduling recommendations
            2. Time slot suggestions based on their preferences
            3. Calendar organization tips
            4. Conflict resolution if needed
            5. Follow-up reminders
            
            Use emojis and format nicely with clear time recommendations.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Scheduling failed: {e}")
            return "📅 I'd be happy to help you with scheduling! What specific appointment or event would you like to schedule?"
    
    async def _handle_time_optimization(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle time optimization and time blocking requests."""
        try:
            time_context = self._build_schedule_context(context, "optimization")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "⏰ I'd be happy to help optimize your time! What areas of your schedule would you like to improve?"
            
            prompt = f"""
            As a time management expert, help the user optimize their schedule and time usage.
            
            User Request: {user_input}
            Time Management Context: {time_context}
            
            Provide:
            1. Time blocking strategies
            2. Schedule optimization recommendations
            3. Productivity time slot identification
            4. Break and rest period suggestions
            5. Weekly schedule template
            
            Use emojis and format nicely with actionable time management advice.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Time optimization failed: {e}")
            return "⏰ I'd be happy to help you optimize your time! What specific areas of your schedule would you like to improve?"
    
    async def _handle_appointment_booking(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle appointment booking requests."""
        try:
            booking_context = self._build_schedule_context(context, "booking")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📞 I'd be happy to help you book appointments! What type of appointment do you need to schedule?"
            
            prompt = f"""
            As a scheduling assistant, help the user with appointment booking and management.
            
            User Request: {user_input}
            Booking Context: {booking_context}
            
            Provide:
            1. Appointment booking guidance
            2. Optimal time slot recommendations
            3. Preparation checklist for the appointment
            4. Reminder and follow-up suggestions
            5. Calendar integration tips
            
            Use emojis and format nicely with practical booking advice.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Appointment booking failed: {e}")
            return "📞 I'd be happy to help you book appointments! What type of appointment do you need to schedule?"
    
    async def _handle_general_scheduling(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general scheduling queries."""
        try:
            schedule_context = self._build_schedule_context(context, "general")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📅 I'm here to help with your scheduling needs! What would you like assistance with?"
            
            prompt = f"""
            As a scheduling assistant, provide helpful advice for the user's scheduling question.
            
            User Request: {user_input}
            Schedule Context: {schedule_context}
            
            Provide relevant scheduling advice, tips, and recommendations based on their question.
            Use emojis and format nicely with clear, actionable information.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"General scheduling failed: {e}")
            return "📅 I'm here to help with your scheduling needs! What would you like assistance with?"
    
    def _build_schedule_context(self, context: Dict[str, Any], schedule_type: str) -> str:
        """Build scheduling context from available knowledge."""
        context_parts = []
        
        # Add agent preferences (scheduling preferences from knowledge base)
        if "agent_preferences" in context and context["agent_preferences"]:
            prefs = context["agent_preferences"]
            if isinstance(prefs, dict):
                schedule_prefs = {k: v for k, v in prefs.items() if any(term in k.lower() for term in ["schedule", "time", "work", "meeting", "appointment"])}
                if schedule_prefs:
                    context_parts.append(f"Scheduling preferences: {schedule_prefs}")
        
        # Add context summary
        if "context_summary" in context and context["context_summary"]:
            context_parts.append(f"Previous scheduling context: {context['context_summary']}")
        
        return " | ".join(context_parts) if context_parts else f"No specific {schedule_type} context available"


class JournalAgent(BaseAgent):
    """Specialized agent for journaling, reflection, and personal growth tracking."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="daily_reflection",
                description="Guide daily journaling and reflection practices",
                parameters={"mood_tracking": True, "gratitude_practice": True}
            ),
            AgentCapability(
                name="goal_tracking",
                description="Track personal growth goals and milestones",
                parameters={"progress_monitoring": True, "achievement_celebration": True}
            ),
            AgentCapability(
                name="habit_formation",
                description="Support habit building and behavior change",
                parameters={"habit_tracking": True, "streak_monitoring": True}
            ),
            AgentCapability(
                name="emotional_wellness",
                description="Support emotional processing and mental wellness",
                parameters={"mood_analysis": True, "stress_management": True}
            )
        ]
        
        super().__init__(
            agent_id=f"journal_{uuid.uuid4().hex[:8]}",
            agent_type=AgentType.JOURNAL,
            capabilities=capabilities,
            system_prompt=get_agent_prompt(AgentType.JOURNAL)
        )
        
        self.knowledge_base = get_knowledge_base_service()
    
    async def execute(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute journaling-related requests with contextual knowledge."""
        try:
            logger.info(f"JournalAgent processing: {user_input}")
            
            # Get contextual knowledge from knowledge base
            contextual_knowledge = await self.knowledge_base.get_contextual_knowledge_for_agent(
                user_input=user_input,
                agent_type="journal",
                max_results=10
            )
            
            # Determine journaling task type
            if any(keyword in user_input.lower() for keyword in ["journal", "reflection", "reflect", "mood"]):
                response = await self._handle_daily_journaling(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["goal", "progress", "achievement", "milestone"]):
                response = await self._handle_goal_tracking(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["habit", "streak", "routine", "consistency"]):
                response = await self._handle_habit_tracking(user_input, contextual_knowledge)
            elif any(keyword in user_input.lower() for keyword in ["feeling", "emotion", "stress", "wellness"]):
                response = await self._handle_emotional_wellness(user_input, contextual_knowledge)
            else:
                response = await self._handle_general_journaling(user_input, contextual_knowledge)
            
            # Intelligently record interaction if valuable
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=user_input,
                agent_response=response,
                agent_type="journal"
            )
            
            return {"response": response, "status": "success"}
            
        except Exception as e:
            logger.error(f"JournalAgent execution failed: {e}")
            return {"response": "I'm having trouble with journaling assistance right now. Please try again later.", "status": "error"}
    
    async def _handle_daily_journaling(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle daily journaling and reflection requests."""
        try:
            journal_context = self._build_journal_context(context, "reflection")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📝 I'd be happy to guide your journaling practice! What would you like to reflect on today?"
            
            prompt = f"""
            As a thoughtful journaling guide, help the user with their daily reflection and journaling practice.
            
            User Request: {user_input}
            Journal Context: {journal_context}
            
            Provide:
            1. Thoughtful reflection prompts
            2. Guided questions for deeper insight
            3. Mood and emotion processing support
            4. Gratitude practice suggestions
            5. Personal growth observations
            
            Use emojis and format nicely with gentle, encouraging guidance.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.4,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Daily journaling failed: {e}")
            return "📝 I'd be happy to guide your journaling practice! What would you like to reflect on today?"
    
    async def _handle_goal_tracking(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle goal tracking and milestone celebration."""
        try:
            goals_context = self._build_journal_context(context, "goals")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "🎯 I'd love to help you track your goals! What goals are you working on?"
            
            prompt = f"""
            As a personal growth coach, help the user with goal tracking and achievement recognition.
            
            User Request: {user_input}
            Goals Context: {goals_context}
            
            Provide:
            1. Goal progress assessment
            2. Milestone recognition and celebration
            3. Next steps and action items
            4. Motivation and encouragement
            5. Course correction suggestions if needed
            
            Use emojis and format nicely with motivational, supportive guidance.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Goal tracking failed: {e}")
            return "🎯 I'd love to help you track your goals! What goals are you working on?"
    
    async def _handle_habit_tracking(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle habit tracking and formation support."""
        try:
            habits_context = self._build_journal_context(context, "habits")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "🔄 I'd be happy to help with your habit tracking! What habits are you building?"
            
            prompt = f"""
            As a habit formation expert, help the user with habit tracking and consistency building.
            
            User Request: {user_input}
            Habits Context: {habits_context}
            
            Provide:
            1. Habit streak recognition and motivation
            2. Consistency strategies and tips
            3. Barrier identification and solutions
            4. Habit stacking suggestions
            5. Small wins celebration
            
            Use emojis and format nicely with encouraging, practical advice.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.3,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Habit tracking failed: {e}")
            return "🔄 I'd be happy to help with your habit tracking! What habits are you building?"
    
    async def _handle_emotional_wellness(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle emotional processing and wellness support."""
        try:
            wellness_context = self._build_journal_context(context, "wellness")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "💙 I'm here to support your emotional wellness! How are you feeling today?"
            
            prompt = f"""
            As a supportive wellness companion, help the user with emotional processing and mental wellness.
            
            User Request: {user_input}
            Wellness Context: {wellness_context}
            
            Provide:
            1. Emotional validation and support
            2. Gentle processing questions
            3. Stress management techniques
            4. Self-care suggestions
            5. Professional help recommendations if needed
            
            Use emojis and format nicely with compassionate, supportive guidance.
            Note: If serious mental health concerns are expressed, gently suggest professional support.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.4,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Emotional wellness failed: {e}")
            return "💙 I'm here to support your emotional wellness! How are you feeling today?"
    
    async def _handle_general_journaling(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general journaling queries."""
        try:
            journal_context = self._build_journal_context(context, "general")
            
            llm_service = await get_llm_service()
            if not llm_service:
                return "📖 I'm here to support your journaling journey! What would you like to explore?"
            
            prompt = f"""
            As a journaling companion, provide helpful support for the user's personal reflection needs.
            
            User Request: {user_input}
            Journal Context: {journal_context}
            
            Provide relevant journaling guidance, prompts, and support based on their question.
            Use emojis and format nicely with gentle, encouraging information.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=prompt)],
                temperature=0.4,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"General journaling failed: {e}")
            return "📖 I'm here to support your journaling journey! What would you like to explore?"
    
    def _build_journal_context(self, context: Dict[str, Any], journal_type: str) -> str:
        """Build journaling context from available knowledge."""
        context_parts = []
        
        # Add agent preferences (journaling preferences from knowledge base)
        if "agent_preferences" in context and context["agent_preferences"]:
            prefs = context["agent_preferences"]
            if isinstance(prefs, dict):
                journal_prefs = {k: v for k, v in prefs.items() if any(term in k.lower() for term in ["journal", "mood", "goal", "habit", "reflection", "wellness"])}
                if journal_prefs:
                    context_parts.append(f"Journaling preferences: {journal_prefs}")
        
        # Add context summary
        if "context_summary" in context and context["context_summary"]:
            context_parts.append(f"Previous journaling context: {context['context_summary']}")
        
        return " | ".join(context_parts) if context_parts else f"No specific {journal_type} context available"
    """Specialized agent for productivity, task management, and goal tracking."""
    
    def __init__(self):
        capabilities = [
            AgentCapability(
                name="task_management",
                description="Create, organize, and prioritize tasks based on user goals",
                parameters={"priority_systems": ["eisenhower", "abcd", "custom"]}
            ),
            AgentCapability(
                name="goal_setting",
                description="Help set and track SMART goals",
                parameters={"goal_types": ["short_term", "long_term", "projects"]}
            ),
            AgentCapability(
                name="productivity_analysis",
                description="Analyze productivity patterns and suggest improvements",
                parameters={"analysis_period": "weekly", "metrics": ["completion_rate", "focus_time"]}
            )
        ]
        
        super().__init__(
            agent_id="productivity_specialized",
            agent_type=AgentType.PRODUCTIVITY,
            capabilities=capabilities,
            system_prompt=get_agent_prompt(AgentType.PRODUCTIVITY)
        )
        self.knowledge_base = get_knowledge_base_service()

    async def execute(self, state: AgentState) -> Dict[str, Any]:
        """Execute productivity-related requests with contextual awareness."""
        try:
            user_input = state.get("user_input", "")
            
            # Get relevant context
            context = await self.knowledge_base.get_contextual_knowledge_for_agent(
                user_input=user_input,
                agent_type="productivity",
                max_results=10
            )
            
            # Determine specific productivity action needed
            if self._is_task_request(user_input):
                response = await self._handle_task_management(user_input, context)
            elif self._is_goal_request(user_input):
                response = await self._handle_goal_setting(user_input, context)
            else:
                response = await self._handle_general_productivity(user_input, context)
            
            # Intelligently record interaction if valuable
            recorder = get_interaction_recorder()
            await recorder.record_if_valuable(
                user_input=user_input,
                agent_response=response,
                agent_type="productivity"
            )
            
            await self.knowledge_base.extract_and_store_preferences(
                user_input=user_input,
                agent_type="productivity",
                agent_response=response
            )
            
            return {
                "response": response,
                "reasoning": {
                    "agent_type": "productivity",
                    "context_used": len(context.get("relevant_interactions", [])) + len(context.get("user_preferences", [])),
                    "specialized_handling": True
                }
            }
            
        except Exception as e:
            logger.error(f"Productivity agent execution failed: {e}")
            return {
                "response": "I apologize, but I encountered an issue while processing your productivity request. Please try again.",
                "reasoning": {"error": str(e), "agent_type": "productivity"}
            }

    def _is_task_request(self, user_input: str) -> bool:
        """Check if the request is about task management."""
        task_keywords = ["task", "todo", "project", "deadline", "work", "assignment", "organize"]
        return any(keyword in user_input.lower() for keyword in task_keywords)

    def _is_goal_request(self, user_input: str) -> bool:
        """Check if the request is about goal setting."""
        goal_keywords = ["goal", "objective", "target", "aim", "achieve", "accomplish"]
        return any(keyword in user_input.lower() for keyword in goal_keywords)

    async def _handle_task_management(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle task management with user context."""
        try:
            # Build context for task management
            context_info = self._build_productivity_context(context)
            
            task_prompt = f"""
            You are a productivity expert helping with task management. Use this context about the user:

            {context_info}

            User Request: {user_input}

            Based on their work preferences and past patterns, provide specific, actionable advice for:
            1. How to structure or prioritize the task/project
            2. Suggested approach based on their preferred methods
            3. Timeline recommendations
            4. Any relevant tools or techniques

            Make it practical and tailored to their working style.
            """
            
            llm_service = await get_llm_service()
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=task_prompt)],
                temperature=0.7,
                max_tokens=1000
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"Task management failed: {e}")
            return "I'd be happy to help you organize your tasks! Could you tell me more about what you're working on and any specific challenges you're facing?"

    def _build_productivity_context(self, context: Dict[str, Any]) -> str:
        """Build productivity context from user's knowledge base."""
        context_parts = []
        
        # Add productivity preferences
        prod_prefs = context.get("agent_preferences", {})
        if prod_prefs:
            work_hours = prod_prefs.get("work_hours", "")
            if work_hours:
                context_parts.append(f"Preferred Work Hours: {work_hours}")
            
            priority_system = prod_prefs.get("priority_system", "")
            if priority_system:
                context_parts.append(f"Priority System: {priority_system}")
            
            task_categories = prod_prefs.get("task_categories", [])
            if task_categories:
                context_parts.append(f"Task Categories: {', '.join(task_categories)}")

        # Add relevant preferences
        user_prefs = context.get("user_preferences", [])
        for pref in user_prefs[:3]:
            context_parts.append(f"User Preference: {pref['content']}")

        # Add recent context
        interactions = context.get("relevant_interactions", [])
        if interactions:
            recent_interaction = interactions[0]
            context_parts.append(f"Recent Context: {recent_interaction['content'][:200]}...")

        if not context_parts:
            return "No specific productivity preferences available. Please ask the user about their work style and preferences."
        
        return "\n".join(context_parts)

    async def _handle_goal_setting(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle goal setting requests."""
        return "I'll help you set and track meaningful goals. Let me know what you'd like to achieve and I can help you break it down into actionable steps."

    async def _handle_general_productivity(self, user_input: str, context: Dict[str, Any]) -> str:
        """Handle general productivity queries."""
        try:
            context_summary = context.get("context_summary", "")
            
            productivity_prompt = f"""
            You are a productivity coach. Consider this context about the user:

            Context: {context_summary}

            User Query: {user_input}

            Provide personalized productivity advice that takes into account their background and working patterns.
            Focus on actionable strategies they can implement immediately.
            """
            
            llm_service = await get_llm_service()
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=productivity_prompt)],
                temperature=0.7,
                max_tokens=800
            )
            
            response = await llm_service.chat_completion(request)
            return response.content
            
        except Exception as e:
            logger.error(f"General productivity query failed: {e}")
            return "I'm here to help boost your productivity! What specific area would you like to improve?"
