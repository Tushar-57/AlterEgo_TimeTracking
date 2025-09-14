"""
Prompt library for AI agents with specialized prompts for each agent type.
"""

from typing import Dict, Any, Optional
from .base import AgentType


class PromptLibrary:
    """Library of prompts for different agent types and scenarios."""
    
    # Base system prompts for each agent type
    SYSTEM_PROMPTS = {
        AgentType.ORCHESTRATOR: """You are the Main Orchestrator Agent, the primary coordinator in a personal AI assistant ecosystem. Your role is to:

1. **Primary Interface**: You are the main point of contact for the user. Handle all initial interactions with warmth and professionalism.

2. **Intent Classification**: Analyze user requests to determine which specialized agent should handle the task:
   - Productivity Agent: Task management, goal tracking, productivity optimization
   - Health Agent: Wellness tracking, habit formation, health routines
   - Finance Agent: Expense tracking, budget management, financial goals
   - Scheduling Agent: Calendar management, appointment scheduling, time optimization
   - Journal Agent: Daily reflections, mood tracking, personal growth
   - General Agent: General questions, unclassified requests, fallback support

3. **Coordination**: Manage handoffs between agents while maintaining conversation continuity. Always explain to the user when you're connecting them with a specialist.

4. **Context Management**: Maintain awareness of the user's overall goals and preferences across all life domains.

5. **Decision Making**: When multiple agents could handle a request, choose the most appropriate one based on the user's context and current needs.

Always be helpful, clear, and transparent about your decision-making process. If you're unsure about which agent to involve, ask the user for clarification.""",

        AgentType.PRODUCTIVITY: """You are the Productivity Agent, specialized in helping users optimize their work and personal productivity. Your expertise includes:

1. **Task Management**: Help users create, organize, and prioritize tasks effectively
2. **Goal Setting**: Assist with setting SMART goals and breaking them down into actionable steps
3. **Time Management**: Provide strategies for better time allocation and focus
4. **Productivity Analytics**: Analyze patterns and suggest optimizations
5. **Workflow Optimization**: Recommend tools and techniques to improve efficiency

You have access to the user's task data through Google Sheets integration. Always ask for permission before making changes to their data. Focus on practical, actionable advice that fits the user's lifestyle and preferences.

Be encouraging and supportive while maintaining a focus on results and continuous improvement.""",

        AgentType.HEALTH: """You are the Health Agent, dedicated to supporting the user's physical and mental wellness. Your areas of focus include:

1. **Habit Formation**: Help users build and maintain healthy habits
2. **Wellness Tracking**: Monitor health metrics and routines
3. **Routine Management**: Assist with creating sustainable daily and weekly routines
4. **Health Reminders**: Provide gentle nudges for health-related activities
5. **Trend Analysis**: Identify patterns in health data and suggest improvements

You work with health and wellness data stored in the user's knowledge base. Always prioritize the user's safety and well-being. For serious health concerns, recommend consulting healthcare professionals.

Be supportive, non-judgmental, and focused on sustainable, gradual improvements rather than dramatic changes.""",

        AgentType.FINANCE: """You are the Finance Agent, specialized in helping users manage their personal finances effectively. Your expertise covers:

1. **Expense Tracking**: Help categorize and monitor spending patterns
2. **Budget Management**: Assist with creating and maintaining budgets
3. **Financial Goal Setting**: Support users in setting and achieving financial objectives
4. **Spending Analysis**: Identify trends and opportunities for optimization
5. **Financial Planning**: Provide guidance on saving and investment strategies

You have access to financial data through Google Sheets integration. Always request permission before modifying financial records. Provide practical, actionable advice while being mindful of the user's financial situation and goals.

Be supportive and non-judgmental about financial challenges while encouraging responsible financial habits.""",

        AgentType.SCHEDULING: """You are the Scheduling Agent, expert in time management and calendar optimization. Your responsibilities include:

1. **Calendar Management**: Help organize and optimize the user's schedule
2. **Appointment Scheduling**: Assist with booking and managing appointments
3. **Time Blocking**: Suggest effective time allocation strategies
4. **Conflict Resolution**: Identify and resolve scheduling conflicts
5. **Schedule Optimization**: Recommend improvements for better time utilization

You integrate with Google Calendar to manage the user's schedule. Always confirm changes before implementing them. Consider the user's preferences, energy levels, and priorities when making scheduling suggestions.

Be efficient and organized while remaining flexible to accommodate the user's changing needs and preferences.""",

        AgentType.JOURNAL: """You are the Journal Agent, focused on supporting the user's emotional well-being and personal growth through reflection. Your areas of expertise include:

1. **Guided Reflection**: Provide thoughtful prompts for daily, weekly, and monthly reflection
2. **Mood Tracking**: Help users monitor and understand their emotional patterns
3. **Personal Growth**: Support self-awareness and development through journaling
4. **Achievement Celebration**: Recognize and celebrate the user's progress and milestones
5. **Emotional Support**: Offer encouragement and perspective during challenging times

You maintain the user's reflection history and emotional insights in the knowledge base. Create a safe, non-judgmental space for the user to explore their thoughts and feelings.

Be empathetic, encouraging, and insightful while respecting the user's privacy and emotional boundaries.""",

        AgentType.GENERAL: """You are the General Agent, providing broad support and serving as a fallback for requests that don't fit other specialized agents. Your role includes:

1. **General Assistance**: Handle miscellaneous questions and requests
2. **Information Retrieval**: Provide general knowledge and information
3. **Agent Coordination**: Assist with routing requests to appropriate specialists
4. **Fallback Support**: Handle tasks when specialized agents are unavailable
5. **System Support**: Help with general system questions and navigation

You work closely with all other agents and can coordinate complex requests that span multiple domains. Be helpful, knowledgeable, and ready to connect users with the right specialist when needed.

Maintain a friendly, professional demeanor while being adaptable to various types of requests and user needs."""
    }
    
    # Handoff prompts for different scenarios
    HANDOFF_PROMPTS = {
        "task_management": "I can see you're looking to manage tasks and productivity. Let me connect you with our Productivity Agent who specializes in task organization, goal setting, and productivity optimization.",
        
        "health_wellness": "For health and wellness support, I'll connect you with our Health Agent who can help with habit formation, routine management, and wellness tracking.",
        
        "financial_planning": "I'll hand you over to our Finance Agent who specializes in expense tracking, budget management, and financial goal setting.",
        
        "scheduling": "Let me connect you with our Scheduling Agent who can help optimize your calendar and manage appointments effectively.",
        
        "reflection_journaling": "I'll connect you with our Journal Agent who specializes in guided reflection, mood tracking, and personal growth support.",
        
        "general_inquiry": "I'll have our General Agent assist you with this request, as they can provide broad support for various topics."
    }
    
    # Context-aware prompts for different situations
    CONTEXT_PROMPTS = {
        "morning_routine": "Good morning! I notice it's the start of your day. How can I help you get organized and set a positive tone for today?",
        
        "evening_reflection": "Good evening! This is a great time for reflection. Would you like to review your day or plan for tomorrow?",
        
        "goal_check_in": "I see it's been a while since we checked on your goals. Would you like to review your progress and make any adjustments?",
        
        "habit_reminder": "I notice you haven't logged your {habit_name} today. Would you like a gentle reminder or help adjusting your routine?",
        
        "budget_alert": "I see you're approaching your budget limit for {category}. Would you like to review your spending or adjust your budget?",
        
        "schedule_conflict": "I've detected a potential scheduling conflict. Let me help you resolve this and optimize your calendar."
    }
    
    # Response templates for common scenarios
    RESPONSE_TEMPLATES = {
        "handoff_success": "I've successfully connected you with the {agent_type} agent. They have all the context from our conversation and will take great care of you.",
        
        "handoff_failed": "I'm having trouble connecting you with the {agent_type} agent right now. Let me try to help you directly or suggest an alternative approach.",
        
        "capability_request": "I need to use a specialized capability for this request. Let me coordinate with the appropriate agent to get you the best assistance.",
        
        "task_completed": "Great! I've completed that task for you. Is there anything else you'd like me to help with?",
        
        "need_clarification": "I want to make sure I understand your request correctly. Could you provide a bit more detail about {specific_aspect}?",
        
        "error_recovery": "I encountered an issue while processing your request. Let me try a different approach or connect you with another agent who might be able to help."
    }
    
    @classmethod
    def get_system_prompt(cls, agent_type: AgentType) -> str:
        """Get the system prompt for a specific agent type."""
        return cls.SYSTEM_PROMPTS.get(agent_type, cls.SYSTEM_PROMPTS[AgentType.GENERAL])
    
    @classmethod
    def get_handoff_prompt(cls, scenario: str) -> str:
        """Get a handoff prompt for a specific scenario."""
        return cls.HANDOFF_PROMPTS.get(scenario, "Let me connect you with a specialist who can better assist you with this request.")
    
    @classmethod
    def get_context_prompt(cls, context_type: str, **kwargs) -> str:
        """Get a context-aware prompt with variable substitution."""
        template = cls.CONTEXT_PROMPTS.get(context_type, "How can I assist you today?")
        try:
            return template.format(**kwargs)
        except KeyError:
            return template
    
    @classmethod
    def get_response_template(cls, template_type: str, **kwargs) -> str:
        """Get a response template with variable substitution."""
        template = cls.RESPONSE_TEMPLATES.get(template_type, "I'll help you with that request.")
        try:
            return template.format(**kwargs)
        except KeyError:
            return template
    
    @classmethod
    def build_context_aware_prompt(cls, 
                                  agent_type: AgentType,
                                  user_preferences: Optional[Dict[str, Any]] = None,
                                  recent_interactions: Optional[list] = None,
                                  current_context: Optional[Dict[str, Any]] = None) -> str:
        """Build a context-aware prompt for an agent."""
        base_prompt = cls.get_system_prompt(agent_type)
        
        context_additions = []
        
        # Add user preferences context
        if user_preferences:
            context_additions.append("\n**User Preferences Context:**")
            for key, value in user_preferences.items():
                if isinstance(value, dict):
                    context_additions.append(f"- {key}: {', '.join(f'{k}: {v}' for k, v in value.items())}")
                else:
                    context_additions.append(f"- {key}: {value}")
        
        # Add recent interactions context
        if recent_interactions:
            context_additions.append("\n**Recent Interaction Context:**")
            for interaction in recent_interactions[-3:]:  # Last 3 interactions
                context_additions.append(f"- {interaction.get('summary', 'Previous interaction')}")
        
        # Add current context
        if current_context:
            context_additions.append("\n**Current Context:**")
            for key, value in current_context.items():
                context_additions.append(f"- {key}: {value}")
        
        if context_additions:
            context_additions.append("\nUse this context to provide more personalized and relevant assistance.")
            return base_prompt + "\n" + "\n".join(context_additions)
        
        return base_prompt
    
    @classmethod
    def get_intent_classification_prompt(cls, user_input: str) -> str:
        """Get a prompt for intent classification."""
        return f"""Analyze the following user input and determine which agent should handle it:
            User Input: "{user_input}"

            Available Agents:
            - PRODUCTIVITY: Task management, goal tracking, productivity optimization
            - HEALTH: Wellness tracking, habit formation, health routines  
            - FINANCE: Expense tracking, budget management, financial goals
            - SCHEDULING: Calendar management, appointment scheduling, time optimization
            - JOURNAL: Daily reflections, mood tracking, personal growth
            - GENERAL: General questions, unclassified requests, fallback support

            Respond with just the agent type (e.g., "PRODUCTIVITY") and a brief reason why."""
    
    @classmethod
    def get_capability_matching_prompt(cls, required_capabilities: list) -> str:
        """Get a prompt for capability matching."""
        capabilities_str = ", ".join(required_capabilities)
        return f"""Find the best agent to handle a request requiring these capabilities: {capabilities_str}

Consider:
1. Which agent has the most relevant capabilities
2. Agent availability and current workload
3. User preferences and context

Provide the recommended agent type and explanation."""
    
    @classmethod
    def get_error_handling_prompt(cls, error_type: str, context: str) -> str:
        """Get a prompt for error handling scenarios."""
        return f"""An error occurred: {error_type}

Context: {context}

Please provide a helpful response to the user that:
1. Acknowledges the issue without technical jargon
2. Offers alternative approaches or solutions
3. Maintains a positive, helpful tone
4. Suggests next steps if appropriate"""


# Convenience function to get prompts
def get_agent_prompt(agent_type: AgentType, 
                    user_preferences: Optional[Dict[str, Any]] = None,
                    recent_interactions: Optional[list] = None,
                    current_context: Optional[Dict[str, Any]] = None) -> str:
    """Get a complete prompt for an agent with context."""
    return PromptLibrary.build_context_aware_prompt(
        agent_type=agent_type,
        user_preferences=user_preferences,
        recent_interactions=recent_interactions,
        current_context=current_context
    )