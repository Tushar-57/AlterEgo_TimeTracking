#!/usr/bin/env python3
"""
Test script for enhanced intent classification and agent delegation.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.getcwd())

async def test_intent_classification():
    """Test the enhanced intent classification with meal planning and other edge cases."""
    
    print("🧪 Testing Enhanced Intent Classification")
    print("=" * 60)
    
    # Initialize Ollama service first
    try:
        from app.llm.config import LLMConfig
        from app.llm.factory import LLMProviderFactory
        from app.llm.service import LLMService
        from app.llm.base import LLMProviderType
        from app.llm.ollama_provider import OllamaProvider
        
        # Create and initialize Ollama provider directly
        ollama_provider = OllamaProvider()
        await ollama_provider.initialize()
        
        # Create config and service
        config = LLMConfig(
            provider=LLMProviderType.OLLAMA,
            openai_api_key="dummy",
            ollama_endpoint="http://localhost:11434",
            ollama_model="llama3.2:3b"
        )
        
        factory = LLMProviderFactory(config)
        factory._providers[LLMProviderType.OLLAMA] = ollama_provider
        factory._current_provider = ollama_provider
        
        service = LLMService()
        service.factory = factory
        service._provider = ollama_provider
        service._initialized = True
        service._current_provider_type = "ollama"
        
        import app.llm.service as service_module
        service_module._llm_service = service
        
        print("✅ LLM service configured with Ollama")
    except Exception as e:
        print(f"❌ Failed to initialize Ollama service: {e}")
        return False
    
    # Initialize agents
    try:
        from app.agents.factory import AgentFactory
        factory = AgentFactory()
        await factory.initialize_agent_ecosystem()
        print("✅ Agent ecosystem initialized")
    except Exception as e:
        print(f"❌ Failed to initialize agents: {e}")
        return False
    
    # Get orchestrator for testing
    try:
        from app.agents.registry import get_agent_registry
        registry = get_agent_registry()
        orchestrator = registry.get_agent_by_type(AgentType.ORCHESTRATOR)
        if not orchestrator:
            print("❌ Orchestrator agent not found")
            return False
        print("✅ Orchestrator agent ready")
    except Exception as e:
        print(f"❌ Failed to get orchestrator: {e}")
        return False
    
    # Test cases that should route to specific agents
    test_cases = [
        {
            "input": "Help with Meal Planning for Next Week 🍴",
            "expected_agent": "health",
            "description": "Meal planning should route to health agent"
        },
        {
            "input": "I need to organize my tasks for the project deadline",
            "expected_agent": "productivity", 
            "description": "Task organization should route to productivity agent"
        },
        {
            "input": "Track my monthly expenses and create a budget",
            "expected_agent": "finance",
            "description": "Budget and expense tracking should route to finance agent"
        },
        {
            "input": "Schedule a meeting with my team for next Tuesday",
            "expected_agent": "scheduling",
            "description": "Meeting scheduling should route to scheduling agent"
        },
        {
            "input": "I want to reflect on my progress this week",
            "expected_agent": "journal",
            "description": "Reflection should route to journal agent"
        },
        {
            "input": "What's the weather like today?",
            "expected_agent": "general",
            "description": "Weather query should be handled as general"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases):
        print(f"\n🔍 Test {i+1}: {test_case['description']}")
        print(f"Input: '{test_case['input']}'")
        print("-" * 50)
        
        try:
            # Test intent classification
            context = {"conversation_id": f"test_{i+1}"}
            intent_result = await orchestrator._classify_intent(test_case["input"], context)
            
            classified_agent = intent_result.get("agent_type")
            confidence = intent_result.get("confidence", 0.0)
            reason = intent_result.get("reason", "No reason provided")
            
            # Check if classification is correct
            expected = test_case["expected_agent"].upper()
            actual = classified_agent.value.upper() if classified_agent else "UNKNOWN"
            
            success = actual == expected
            
            print(f"📊 Classified as: {actual}")
            print(f"🎯 Expected: {expected}")
            print(f"📈 Confidence: {confidence:.2f}")
            print(f"💭 Reason: {reason}")
            print(f"✅ Correct: {'YES' if success else 'NO'}")
            
            # Test full workflow
            if success and confidence >= 0.5:
                print(f"🔄 Testing full delegation...")
                try:
                    state = {
                        "user_input": test_case["input"],
                        "context": context,
                        "conversation_id": f"test_{i+1}"
                    }
                    
                    result = await orchestrator.execute(state)
                    response = result.get("response", "No response")
                    reasoning = result.get("reasoning", {})
                    final_agent = reasoning.get("finalAgent", "unknown")
                    
                    print(f"📤 Final Agent: {final_agent}")
                    print(f"📝 Response Preview: {response[:100]}...")
                    
                    results.append({
                        "test_case": test_case["description"],
                        "input": test_case["input"],
                        "expected": expected,
                        "classified": actual,
                        "confidence": confidence,
                        "final_agent": final_agent,
                        "classification_correct": success,
                        "delegation_correct": final_agent.upper() == expected,
                        "overall_success": success and (final_agent.upper() == expected)
                    })
                    
                except Exception as e:
                    print(f"❌ Delegation failed: {e}")
                    results.append({
                        "test_case": test_case["description"],
                        "classification_correct": success,
                        "delegation_correct": False,
                        "overall_success": False,
                        "error": str(e)
                    })
            else:
                results.append({
                    "test_case": test_case["description"],
                    "classification_correct": success,
                    "delegation_correct": False,
                    "overall_success": False,
                    "low_confidence": confidence < 0.5
                })
                
        except Exception as e:
            print(f"❌ Error: {e}")
            results.append({
                "test_case": test_case["description"],
                "classification_correct": False,
                "delegation_correct": False, 
                "overall_success": False,
                "error": str(e)
            })
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INTENT CLASSIFICATION TEST RESULTS")
    print("=" * 60)
    
    classification_successes = sum(1 for r in results if r.get("classification_correct", False))
    delegation_successes = sum(1 for r in results if r.get("delegation_correct", False))
    overall_successes = sum(1 for r in results if r.get("overall_success", False))
    total_tests = len(results)
    
    for result in results:
        status = "✅" if result.get("overall_success", False) else "❌"
        print(f"{status} {result['test_case']}")
        if "error" in result:
            print(f"   Error: {result['error']}")
        elif not result.get("overall_success", False):
            issues = []
            if not result.get("classification_correct", False):
                issues.append("classification")
            if not result.get("delegation_correct", False):
                issues.append("delegation")
            if result.get("low_confidence", False):
                issues.append("low confidence")
            print(f"   Issues: {', '.join(issues)}")
    
    print(f"\n🎯 Classification Success: {classification_successes}/{total_tests} ({100*classification_successes/total_tests:.1f}%)")
    print(f"🔄 Delegation Success: {delegation_successes}/{total_tests} ({100*delegation_successes/total_tests:.1f}%)")
    print(f"🏆 Overall Success: {overall_successes}/{total_tests} ({100*overall_successes/total_tests:.1f}%)")
    
    if overall_successes == total_tests:
        print("🎉 All intent classification and delegation tests passed!")
        return True
    else:
        print("⚠️ Some tests failed - need to improve classification or delegation.")
        return False

if __name__ == "__main__":
    # Import AgentType here to avoid import issues
    from app.agents.base import AgentType
    asyncio.run(test_intent_classification())
