#!/usr/bin/env python3
"""
Debug script to check LLM configuration loading.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.llm.config import LLMConfig

def debug_config():
    """Debug configuration loading."""
    
    print("🔍 Debugging LLM Configuration...")
    
    # Load .env file explicitly
    from dotenv import load_dotenv
    load_dotenv()
    
    # Print environment variables
    print("\n📋 Environment Variables:")
    for key, value in os.environ.items():
        if key.startswith(('LLM_', 'OPENAI_', 'OLLAMA_')):
            if 'API_KEY' in key:
                print(f"  {key}: {value[:10]}..." if value else f"  {key}: None")
            else:
                print(f"  {key}: {value}")
    
    # Load configuration
    print("\n⚙️ Loading Configuration...")
    config = LLMConfig.from_env(dict(os.environ))
    
    print(f"  Provider: {config.provider}")
    print(f"  Fallback enabled: {config.fallback_enabled}")
    print(f"  Fallback provider: {config.fallback_provider}")
    print(f"  OpenAI model: {config.openai_model}")
    print(f"  Ollama endpoint: {config.ollama_endpoint}")
    print(f"  Ollama model: {config.ollama_model}")
    
    # Test provider configs
    print("\n🔧 Provider Configurations:")
    try:
        from app.llm.base import LLMProviderType
        
        openai_config = config.get_provider_config(LLMProviderType.OPENAI)
        print(f"  OpenAI config: {openai_config}")
        
        ollama_config = config.get_provider_config(LLMProviderType.OLLAMA)
        print(f"  Ollama config: {ollama_config}")
        
    except Exception as e:
        print(f"  Error getting provider configs: {e}")

if __name__ == "__main__":
    debug_config()