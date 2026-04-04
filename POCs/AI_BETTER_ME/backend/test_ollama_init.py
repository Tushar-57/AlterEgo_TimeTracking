#!/usr/bin/env python3
"""
Simple script to test Ollama initialization and switch provider.
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.getcwd())

async def test_ollama_direct():
    """Test direct Ollama provider initialization."""
    
    print("🔧 Testing Direct Ollama Initialization")
    print("=" * 50)
    
    try:
        from app.llm.ollama_provider import OllamaProvider
        from app.llm.base import CompletionRequest, ChatMessage
        
        # Create Ollama provider directly
        provider = OllamaProvider()
        print("✅ Ollama provider created")
        
        # Initialize the provider
        await provider.initialize()
        print("✅ Ollama provider initialized")
        
        # Test completion
        request = CompletionRequest(
            messages=[
                ChatMessage(role="system", content="You are a helpful assistant."),
                ChatMessage(role="user", content="Say hello!")
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        response = await provider.chat_completion(request)
        print(f"✅ Test response: {response.content[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def test_service_with_ollama():
    """Test the LLM service initialization with Ollama only."""
    
    print("\n🔧 Testing LLM Service with Ollama")
    print("=" * 50)
    
    try:
        from app.llm.config import LLMConfig
        from app.llm.factory import LLMProviderFactory
        from app.llm.service import LLMService
        from app.llm.base import LLMProviderType
        
        # Create config for Ollama
        config = LLMConfig(
            provider=LLMProviderType.OLLAMA,
            openai_api_key="dummy",  # Not used for Ollama
            ollama_endpoint="http://localhost:11434",
            ollama_model="llama3.2:3b"
        )
        
        # Create factory with config
        factory = LLMProviderFactory(config)
        print("✅ Factory created with config")
        
        # Try to create Ollama provider directly without health check
        ollama_provider = await factory._create_provider_by_type(LLMProviderType.OLLAMA, skip_health_check=True)
        print("✅ Ollama provider created without health check")
        
        # Create service with the provider
        service = LLMService()
        service._provider = ollama_provider
        service._initialized = True
        service._current_provider_type = "ollama"
        
        print(f"✅ LLM service initialized with provider: {service._current_provider_type}")
        
        # Test a simple request
        from app.llm.base import CompletionRequest, ChatMessage
        
        request = CompletionRequest(
            messages=[
                ChatMessage(role="user", content="Hello, how are you?")
            ],
            max_tokens=50
        )
        
        response = await service.chat_completion(request)
        print(f"✅ Service test response: {response.content[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    async def main():
        # Test direct Ollama
        ollama_works = await test_ollama_direct()
        
        # Test service if direct works
        if ollama_works:
            service_works = await test_service_with_ollama()
        else:
            service_works = False
        
        print(f"\n🎯 Results:")
        print(f"   Direct Ollama: {'✅' if ollama_works else '❌'}")
        print(f"   LLM Service: {'✅' if service_works else '❌'}")
        
        return ollama_works and service_works
    
    asyncio.run(main())
