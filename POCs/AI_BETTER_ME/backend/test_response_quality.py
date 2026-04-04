#!/usr/bin/env python3
"""
Test script for response quality improvements.
Tests the enhanced orchestrator and format_response_final_step functionality.
"""

import asyncio
import sys
import os
import json

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.agents.factory import AgentFactory
from app.langgraph.workflow import AgentGraphWorkflow

#!/usr/bin/env python3
"""
Test script for response quality improvements.
Tests the enhanced orchestrator and format_response_final_step functionality.
"""

import asyncio
import sys
import os
import json

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.agents.factory import AgentFactory
from app.langgraph.workflow import AgentGraphWorkflow

async def initialize_ollama_service():
    """Initialize LLM service with Ollama provider directly."""
    try:
        from app.llm.config import LLMConfig
        from app.llm.factory import LLMProviderFactory
        from app.llm.service import LLMService
        from app.llm.base import LLMProviderType
        from app.llm.ollama_provider import OllamaProvider

        print("🔧 Initializing Ollama service...")
        
        # Create and initialize Ollama provider directly
        ollama_provider = OllamaProvider()
        await ollama_provider.initialize()
        print("✅ Ollama provider initialized")
        
        # Create config for proper service setup
        config = LLMConfig(
            provider=LLMProviderType.OLLAMA,
            openai_api_key="dummy",
            ollama_endpoint="http://localhost:11434",
            ollama_model="llama3.2:3b"
        )
        
        # Create factory and service
        factory = LLMProviderFactory(config)
        factory._providers[LLMProviderType.OLLAMA] = ollama_provider
        factory._current_provider = ollama_provider
        
        # Create service
        service = LLMService()
        service.factory = factory
        service._provider = ollama_provider
        service._initialized = True
        service._current_provider_type = "ollama"
        
        # Set the global service
        import app.llm.service as service_module
        service_module._llm_service = service
        
        print("✅ LLM service configured with Ollama")
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize Ollama service: {e}")
        return False

async def test_response_quality():
    """Test the enhanced response quality with various query types."""
    
    print("🧪 Testing Enhanced Response Quality")
    print("=" * 50)
    
    # Initialize Ollama service first
    if not await initialize_ollama_service():
        print("❌ Cannot proceed without LLM service")
        return False
    
    # Initialize the agent ecosystem
    try:
        factory = AgentFactory()
        await factory.initialize_agent_ecosystem()
        print("✅ Agent ecosystem initialized")
    except Exception as e:
        print(f"❌ Failed to initialize agents: {e}")
        return False
    
    # Initialize workflow
    try:
        workflow = AgentGraphWorkflow()
        compiled_workflow = workflow.graph.compile()
        print("✅ LangGraph workflow compiled")
    except Exception as e:
        print(f"❌ Failed to compile workflow: {e}")
        return False
    
    # Test cases for different types of queries
    test_cases = [
        {
            "name": "Simple Greeting",
            "input": "Hello, how are you?",
            "expected_improvements": ["greeting", "engagement", "follow-up"]
        },
        {
            "name": "Task Management Query",
            "input": "Help me organize my tasks for today",
            "expected_improvements": ["actionable", "structured", "productivity"]
        },
        {
            "name": "Health Question",
            "input": "What are some good habits for better sleep?",
            "expected_improvements": ["examples", "tips", "health"]
        },
        {
            "name": "General Knowledge",
            "input": "What's the weather like?",
            "expected_improvements": ["helpful", "alternative", "context"]
        },
        {
            "name": "Complex Request",
            "input": "I want to improve my productivity and manage my time better while also taking care of my health",
            "expected_improvements": ["comprehensive", "multi-aspect", "actionable"]
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases):
        print(f"\n🔍 Test {i+1}: {test_case['name']}")
        print(f"Query: '{test_case['input']}'")
        print("-" * 40)
        
        try:
            # Create test state
            initial_state = {
                "user_input": test_case["input"],
                "conversation_id": f"test_conv_{i+1}",
                "context": {
                    "conversation_id": f"test_conv_{i+1}",
                    "current_time": "2024-01-15 10:30:00",
                    "timezone": "UTC",
                    "conversation_history": []
                }
            }
            
            # Run through the workflow
            final_state = await compiled_workflow.ainvoke(initial_state)
            
            # Extract results
            response = final_state.get("response", "No response")
            reasoning = final_state.get("reasoning", {})
            formatting_applied = final_state.get("formatting_applied", False)
            
            # Analyze the response
            analysis = analyze_response_improvements(response, test_case["expected_improvements"])
            
            print(f"📤 Response Length: {len(response)} characters")
            print(f"🎯 Final Agent: {reasoning.get('finalAgent', 'unknown')}")
            print(f"✨ Formatting Applied: {formatting_applied}")
            print(f"📊 Quality Score: {analysis['score']}/5")
            
            if len(response) > 200:
                print(f"📝 Response Preview: {response[:200]}...")
            else:
                print(f"📝 Full Response: {response}")
            
            # Check for improvements
            improvements_found = analysis['improvements_found']
            print(f"🔍 Improvements Detected: {', '.join(improvements_found) if improvements_found else 'None'}")
            
            results.append({
                "test_case": test_case["name"],
                "success": len(response) > 50 and analysis['score'] >= 2,
                "response_length": len(response),
                "quality_score": analysis['score'],
                "formatting_applied": formatting_applied,
                "improvements_found": improvements_found
            })
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "test_case": test_case["name"],
                "success": False,
                "error": str(e)
            })
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 RESPONSE QUALITY TEST RESULTS")
    print("=" * 50)
    
    successful_tests = sum(1 for r in results if r.get("success", False))
    total_tests = len(results)
    
    for result in results:
        status = "✅" if result.get("success", False) else "❌"
        print(f"{status} {result['test_case']}")
        if "error" in result:
            print(f"   Error: {result['error']}")
        elif result.get("success", False):
            print(f"   Quality: {result.get('quality_score', 0)}/5, Length: {result.get('response_length', 0)} chars")
    
    print(f"\n🎯 Overall Success Rate: {successful_tests}/{total_tests} ({100*successful_tests/total_tests:.1f}%)")
    
    if successful_tests == total_tests:
        print("🎉 All response quality tests passed!")
        return True
    else:
        print("⚠️ Some response quality tests failed.")
        return False

def analyze_response_improvements(response: str, expected_improvements: list) -> dict:
    """Analyze response for quality improvements."""
    
    improvements_found = []
    score = 0
    
    # Check for various improvement indicators
    response_lower = response.lower()
    
    # Structure and formatting
    if any(marker in response for marker in ["**", "*", "-", "1.", "2.", "3.", "•"]):
        improvements_found.append("structured")
        score += 1
    
    # Engagement and personality
    if any(word in response_lower for word in ["hello", "hi", "great", "wonderful", "excited", "happy"]):
        improvements_found.append("engaging")
        score += 1
    
    # Actionable content
    if any(phrase in response_lower for phrase in ["you can", "try", "consider", "would you like", "let me", "here's how"]):
        improvements_found.append("actionable")
        score += 1
    
    # Examples and tips
    if any(word in response_lower for word in ["example", "for instance", "such as", "tip", "suggestion"]):
        improvements_found.append("examples")
        score += 1
    
    # Follow-up and continuity
    if any(phrase in response_lower for phrase in ["anything else", "follow up", "let me know", "questions", "help you"]):
        improvements_found.append("follow-up")
        score += 1
    
    return {
        "score": score,
        "improvements_found": improvements_found,
        "total_length": len(response),
        "word_count": len(response.split())
    }

if __name__ == "__main__":
    asyncio.run(test_response_quality())
