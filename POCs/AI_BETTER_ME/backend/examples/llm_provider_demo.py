"""
Demo script showing how to use the LLM provider abstraction layer.
"""

import asyncio
import os
import sys
from app.llm import (
    LLMService,
    LLMConfig,
    LLMProviderType,
    ChatMessage,
    CompletionRequest,
    EmbeddingRequest
)
sys.path.append('..')

async def demo_llm_providers():
    """Demonstrate LLM provider usage."""
    
    # Load configuration from environment (recommended approach)
    config = LLMConfig.from_env(dict(os.environ))
    
    # Initialize service
    service = LLMService(config)
    
    try:
        await service.initialize()
        print(f"✅ LLM service initialized with provider: {service.get_current_provider()}")
        
        # Test chat completion
        print("\n🤖 Testing chat completion...")
        request = CompletionRequest(
            messages=[
                ChatMessage(role="system", content="You are a helpful assistant."),
                ChatMessage(role="user", content="Hello! Can you help me?")
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        response = await service.chat_completion(request)
        print(f"Response: {response.content}")
        print(f"Model used: {response.model}")
        
        # Test embedding generation
        print("\n🔍 Testing embedding generation...")
        embedding_request = EmbeddingRequest(text="Hello world")
        embedding_response = await service.generate_embedding(embedding_request)
        print(f"Embedding dimensions: {len(embedding_response.embedding)}")
        print(f"First 5 values: {embedding_response.embedding[:5]}")
        
        # Test health check
        print("\n❤️ Testing health check...")
        health_status = await service.health_check()
        for provider_type, health in health_status.items():
            status = "✅ Healthy" if health.is_healthy else f"❌ Unhealthy: {health.error}"
            print(f"{provider_type}: {status}")
            if health.response_time_ms:
                print(f"  Response time: {health.response_time_ms:.2f}ms")
        
        # Test provider switching
        print("\n🔄 Testing provider switching...")
        if config.fallback_provider:
            success = await service.switch_provider(config.fallback_provider)
            if success:
                print(f"✅ Switched to {config.fallback_provider}")
                
                # Test completion with new provider
                response = await service.chat_completion(request)
                print(f"Response from {config.fallback_provider}: {response.content[:100]}...")
            else:
                print(f"❌ Failed to switch to {config.fallback_provider}")
        
        # Test streaming completion
        print("\n📡 Testing streaming completion...")
        request.messages = [ChatMessage(role="user", content="Count from 1 to 5")]
        
        print("Streaming response: ", end="")
        async for chunk in service.chat_completion_stream(request):
            print(chunk, end="", flush=True)
        print("\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        await service.shutdown()
        print("\n🛑 Service shutdown complete")


async def demo_configuration():
    """Demonstrate configuration management."""
    
    print("🔧 Configuration Demo")
    print("=" * 50)
    
    # Load from environment
    env_config = LLMConfig.from_env(dict(os.environ))
    print(f"Provider from env: {env_config.provider}")
    print(f"OpenAI model: {env_config.openai_model}")
    print(f"Ollama endpoint: {env_config.ollama_endpoint}")
    print(f"Fallback enabled: {env_config.fallback_enabled}")
    
    # Validate configurations
    print(f"\nOpenAI config valid: {env_config.validate_provider_config(LLMProviderType.OPENAI)}")
    print(f"Ollama config valid: {env_config.validate_provider_config(LLMProviderType.OLLAMA)}")
    
    # Get provider-specific config
    openai_config = env_config.get_provider_config(LLMProviderType.OPENAI)
    print(f"\nOpenAI config: {openai_config}")


if __name__ == "__main__":
    print("🚀 LLM Provider Demo")
    print("=" * 50)
    
    # Run configuration demo
    asyncio.run(demo_configuration())
    
    print("\n")
    
    # Run provider demo
    asyncio.run(demo_llm_providers())