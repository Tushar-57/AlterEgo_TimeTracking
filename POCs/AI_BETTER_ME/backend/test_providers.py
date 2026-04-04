#!/usr/bin/env python3
"""
Test script to verify LLM providers are working correctly.
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.llm import get_llm_service, ChatMessage, CompletionRequest, LLMProviderType

async def test_providers():
    """Test both OpenAI and Ollama providers."""
    
    print("🧪 Testing LLM Providers...")
    
    try:
        # Get the LLM service
        llm_service = await get_llm_service()
        print(f"✅ LLM Service initialized")
        
        # Check current provider
        current_provider = llm_service.get_current_provider()
        print(f"📍 Current provider: {current_provider}")
        
        # Test health check
        print("\n❤️ Testing health check...")
        health_status = await llm_service.health_check()
        for provider_type, health in health_status.items():
            status = "✅ Healthy" if health.is_healthy else f"❌ Unhealthy: {health.error}"
            print(f"  {provider_type}: {status}")
            if health.response_time_ms:
                print(f"    Response time: {health.response_time_ms:.2f}ms")
                print(f"    Model: {health.model}")
        
        # Test chat completion with current provider
        print(f"\n💬 Testing chat completion with {current_provider}...")
        request = CompletionRequest(
            messages=[
                ChatMessage(role="system", content="You are a helpful assistant. Respond briefly."),
                ChatMessage(role="user", content="Hello! What provider are you using?")
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        response = await llm_service.chat_completion(request)
        print(f"Response: {response.content}")
        
        # Test provider switching
        print(f"\n🔄 Testing provider switching...")
        
        # Switch to Ollama if currently on OpenAI, or vice versa
        target_provider = LLMProviderType.OLLAMA if current_provider == LLMProviderType.OPENAI else LLMProviderType.OPENAI
        
        print(f"Switching to {target_provider}...")
        success = await llm_service.switch_provider(target_provider)
        
        if success:
            print(f"✅ Successfully switched to {target_provider}")
            
            # Test with new provider
            new_response = await llm_service.chat_completion(request)
            print(f"Response from {target_provider}: {new_response.content}")
        else:
            print(f"❌ Failed to switch to {target_provider}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_providers())