#!/usr/bin/env python3
"""
Populate sample health data for testing contextual meal planning.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from app.services.knowledge_base import get_knowledge_base_service


async def populate_health_data():
    """Populate the knowledge base with sample health data."""
    print("🔧 Populating knowledge base with sample health data...")
    
    kb_service = get_knowledge_base_service()
    
    # Add health preferences
    health_preferences = [
        ("dietary_goal", "weight_loss", "User wants to lose weight and eat healthier"),
        ("food_preference", "low_carb", "User prefers low-carb meals and avoids pasta/bread"),
        ("protein_preference", "grilled_chicken", "User likes grilled chicken and fish"),
        ("diet_type", "vegetarian", "User follows a vegetarian diet"),
        ("meal_prep", "batch_cooking", "User likes to meal prep and batch cook on weekends"),
        ("exercise_frequency", "3_times_week", "User exercises 3 times per week"),
        ("cooking_time", "30_minutes", "User prefers meals that take 30 minutes or less"),
        ("avoid_foods", "spicy_food", "User dislikes very spicy food"),
        ("cooking_skill", "intermediate", "User has intermediate cooking skills"),
        ("budget", "moderate", "User has a moderate budget for groceries")
    ]
    
    for key, value, description in health_preferences:
        await kb_service.add_user_preference("health", key, value, description)
        print(f"   ✅ Added preference: {key} = {value}")
    
    # Add sample health interactions
    health_interactions = [
        ("I want to lose weight and eat healthier meals", "I'll help you create a balanced meal plan focusing on nutritious, low-calorie options."),
        ("I love grilled chicken and vegetables but want more variety", "Great choices! I can suggest different cooking methods and seasonings for variety."),
        ("I'm trying to avoid carbs and sugar", "I'll focus on protein-rich, low-carb meal options that are satisfying and nutritious."),
        ("I exercise 3 times a week and need good pre/post workout meals", "Perfect! I'll consider your activity level and suggest appropriate fuel and recovery meals."),
        ("I usually meal prep on Sundays for the whole week", "Excellent habit! I'll provide meal prep-friendly recipes that store well."),
        ("I have about 30 minutes to cook on weekdays", "I'll focus on quick, efficient recipes that fit your schedule."),
        ("I'm vegetarian but still want high protein meals", "I'll suggest plant-based protein sources like legumes, tofu, and quinoa."),
        ("I don't like very spicy food", "I'll keep seasonings mild and suggest alternatives to spicy ingredients.")
    ]
    
    for user_input, agent_response in health_interactions:
        await kb_service.add_interaction_history(
            agent_type="health",
            user_input=user_input,
            agent_response=agent_response,
            context={"domain": "health", "populated": True}
        )
        print(f"   ✅ Added interaction about: {user_input[:50]}...")
    
    print(f"\n🎉 Successfully populated knowledge base with:")
    print(f"   • {len(health_preferences)} health preferences")
    print(f"   • {len(health_interactions)} health interactions")
    print("\n🚀 Knowledge base is now ready for contextual meal planning!")


if __name__ == "__main__":
    asyncio.run(populate_health_data())
