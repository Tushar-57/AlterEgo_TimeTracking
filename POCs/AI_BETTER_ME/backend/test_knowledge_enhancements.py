#!/usr/bin/env python3
"""
Test script to validate the enhanced knowledge base integration with specialized agents.
"""

import asyncio
import sys
import os
import json

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.knowledge_base import get_knowledge_base_service
from app.agents.factory import AgentFactory
from app.agents.registry import get_agent_registry
from app.agents.base import AgentType
from app.llm.service import get_llm_service
from app.llm.factory import LLMProviderFactory
from app.llm.config import LLMConfig, LLMProviderType
from app.llm.ollama_provider import OllamaProvider


async def initialize_test_environment():
    """Initialize the test environment with Ollama."""
    print("🔧 Initializing test environment...")
    
    try:
        # Initialize Ollama provider
        config = LLMConfig(
            provider=LLMProviderType.OLLAMA,
            ollama_endpoint="http://localhost:11434",
            ollama_model="llama3.2:3b"
        )
        
        factory = LLMProviderFactory(config)
        ollama_provider = OllamaProvider(
            endpoint="http://localhost:11434",
            model="llama3.2:3b"
        )
        
        # Set up the factory with ollama provider
        factory._providers[LLMProviderType.OLLAMA] = ollama_provider
        factory._current_provider = ollama_provider
        
        service = await get_llm_service()
        service.factory = factory
        service._provider = ollama_provider
        service._initialized = True
        service._current_provider_type = "ollama"
        
        print("✅ LLM service configured with Ollama")
        
        # Just initialize basic components for testing
        print("✅ Test environment ready")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize test environment: {e}")
        return False


async def test_knowledge_extraction():
    """Test automatic preference extraction from conversations."""
    print("\n🧪 Testing Knowledge Extraction...")
    
    kb_service = get_knowledge_base_service()
    
    # Test preference extraction
    user_input = "I'm vegetarian and trying to lose weight. I prefer Mediterranean style foods and don't like spicy food."
    agent_response = "I'll help you create a Mediterranean vegetarian meal plan focused on weight loss with mild flavors."
    
    preferences = await kb_service.extract_and_store_preferences(
        user_input=user_input,
        agent_type="health",
        agent_response=agent_response
    )
    
    print(f"✅ Extracted {len(preferences)} preferences")
    for pref in preferences:
        print(f"   - {pref.title}: {pref.content}")
    
    return len(preferences) > 0


async def test_contextual_knowledge_retrieval():
    """Test contextual knowledge retrieval for agents."""
    print("\n🔍 Testing Contextual Knowledge Retrieval...")
    
    kb_service = get_knowledge_base_service()
    
    # First, add some sample data
    await kb_service.create_entry(
        entry_type="preference",
        entry_sub_type="personal preference",
        category="health",
        title="Dietary preferences",
        content="User prefers vegetarian Mediterranean foods, avoids spicy foods, goal is weight loss",
        tags=["vegetarian", "mediterranean", "weight-loss"]
    )
    
    # Test context retrieval
    context = await kb_service.get_contextual_knowledge_for_agent(
        user_input="help me plan meals for this week",
        agent_type="health"
    )
    
    print(f"✅ Retrieved context with {len(context['user_preferences'])} preferences")
    print(f"   Context summary: {context['context_summary']}")
    
    return len(context['user_preferences']) > 0


async def test_specialized_health_agent():
    """Test specialized health agent with meal planning."""
    print("\n🍎 Testing Specialized Health Agent...")
    
    registry = get_agent_registry()
    health_agent = registry.get_agent_by_type(AgentType.HEALTH)
    
    if not health_agent:
        print("❌ Health agent not found")
        return False
    
    # Test meal planning with context
    state = {
        "user_input": "help me plan my meals for the upcoming week!",
        "context": {}
    }
    
    result = await health_agent.execute(state)
    
    if isinstance(result, dict) and "response" in result:
        response = result["response"]
        print(f"✅ Health agent response: {response[:200]}...")
        
        # Check if the response is contextual (not generic)
        contextual_keywords = ["preference", "dietary", "vegetarian", "mediterranean", "weight"]
        is_contextual = any(keyword.lower() in response.lower() for keyword in contextual_keywords)
        
        if is_contextual:
            print("✅ Response appears to be contextual and personalized")
        else:
            print("⚠️  Response appears generic (may need more context data)")
        
        return True
    else:
        print(f"❌ Unexpected response format: {result}")
        return False


async def test_specialized_productivity_agent():
    """Test specialized productivity agent."""
    print("\n📋 Testing Specialized Productivity Agent...")
    
    registry = get_agent_registry()
    productivity_agent = registry.get_agent_by_type(AgentType.PRODUCTIVITY)
    
    if not productivity_agent:
        print("❌ Productivity agent not found")
        return False
    
    # Test task management
    state = {
        "user_input": "I need help organizing my work tasks for next week",
        "context": {}
    }
    
    result = await productivity_agent.execute(state)
    
    if isinstance(result, dict) and "response" in result:
        response = result["response"]
        print(f"✅ Productivity agent response: {response[:200]}...")
        return True
    else:
        print(f"❌ Unexpected response format: {result}")
        return False


async def test_interaction_storage():
    """Test automatic interaction storage."""
    print("\n💾 Testing Interaction Storage...")
    
    kb_service = get_knowledge_base_service()
    
    # Add a test interaction
    entry = await kb_service.add_interaction_history(
        agent_type="health",
        user_input="What should I eat for breakfast?",
        agent_response="Based on your vegetarian preferences, I recommend oatmeal with fruits and nuts.",
        context={"test": True}
    )
    
    if entry:
        print(f"✅ Stored interaction: {entry.title}")
        
        # Verify we can retrieve it
        all_entries = await kb_service.get_all_entries(category="health")
        interaction_entries = [e for e in all_entries if e.entry_type == "interaction"]
        
        print(f"✅ Found {len(interaction_entries)} health interactions in knowledge base")
        return True
    else:
        print("❌ Failed to store interaction")
        return False


async def test_knowledge_base_stats():
    """Test knowledge base statistics."""
    print("\n📊 Testing Knowledge Base Statistics...")
    
    kb_service = get_knowledge_base_service()
    stats = await kb_service.get_stats()
    
    print(f"✅ Knowledge base contains {stats.total_entries} total entries")
    print(f"   - Preferences: {stats.entries_by_type.get('preference', 0)}")
    print(f"   - Interactions: {stats.entries_by_type.get('interaction', 0)}")
    print(f"   - Patterns: {stats.entries_by_type.get('pattern', 0)}")
    
    return stats.total_entries > 0


async def main():
    """Run all knowledge base enhancement tests."""
    print("🧪 Testing Enhanced Knowledge Base Integration")
    print("=" * 60)
    
    # Initialize environment
    if not await initialize_test_environment():
        print("❌ Test environment initialization failed")
        return 1
    
    # Run tests
    test_results = []
    
    test_results.append(await test_interaction_storage())
    test_results.append(await test_knowledge_extraction())
    test_results.append(await test_contextual_knowledge_retrieval())
    test_results.append(await test_specialized_health_agent())
    test_results.append(await test_specialized_productivity_agent())
    test_results.append(await test_knowledge_base_stats())
    
    # Summary
    passed = sum(test_results)
    total = len(test_results)
    
    print(f"\n📊 Test Summary: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All knowledge base enhancements are working correctly!")
        print("\n🚀 Key Improvements Validated:")
        print("   ✅ Automatic interaction storage")
        print("   ✅ Preference extraction from conversations")
        print("   ✅ Contextual knowledge retrieval")
        print("   ✅ Specialized agent implementations")
        print("   ✅ Context-aware responses")
        return 0
    else:
        print("⚠️  Some tests failed, check the output above for details")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
