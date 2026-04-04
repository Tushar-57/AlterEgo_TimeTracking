"""
LLM provider configuration management.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

from .base import LLMProviderType


class LLMConfig(BaseModel):
    """LLM provider configuration."""
    
    # Provider selection
    provider: LLMProviderType = LLMProviderType.OLLAMA  # Default to Ollama
    fallback_enabled: bool = True
    fallback_provider: Optional[LLMProviderType] = LLMProviderType.OPENAI  # OpenAI as fallback
    
    # OpenAI configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    openai_base_url: Optional[str] = None
    
    # Ollama configuration
    ollama_endpoint: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    
    # Common parameters
    max_tokens: int = 4000
    temperature: float = 0.7
    
    # Health check settings
    health_check_timeout: float = 30.0
    health_check_interval: float = 300.0  # 5 minutes
    
    class Config:
        use_enum_values = True
    
    def get_provider_config(self, provider_type: LLMProviderType) -> Dict[str, Any]:
        """Get configuration for a specific provider."""
        if provider_type == LLMProviderType.OPENAI:
            return {
                "api_key": self.openai_api_key,
                "model": self.openai_model,
                "base_url": self.openai_base_url,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }
        elif provider_type == LLMProviderType.OLLAMA:
            return {
                "endpoint": self.ollama_endpoint,
                "model": self.ollama_model,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }
        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")
    
    def validate_provider_config(self, provider_type: LLMProviderType) -> bool:
        """Validate configuration for a specific provider."""
        if provider_type == LLMProviderType.OPENAI:
            return bool(self.openai_api_key and self.openai_model)
        elif provider_type == LLMProviderType.OLLAMA:
            return bool(self.ollama_endpoint and self.ollama_model)
        else:
            return False
    
    @classmethod
    def from_env(cls, env_vars: Dict[str, str]) -> "LLMConfig":
        """Create configuration from environment variables."""
        return cls(
            provider=LLMProviderType(env_vars.get("LLM_PROVIDER", "openai")),
            fallback_enabled=env_vars.get("LLM_FALLBACK_ENABLED", "true").lower() == "true",
            fallback_provider=LLMProviderType(env_vars.get("LLM_FALLBACK_PROVIDER", "ollama")) if env_vars.get("LLM_FALLBACK_PROVIDER") else None,
            
            openai_api_key=env_vars.get("OPENAI_API_KEY"),
            openai_model=env_vars.get("OPENAI_MODEL", "gpt-3.5-turbo"),
            openai_base_url=env_vars.get("OPENAI_BASE_URL"),
            
            ollama_endpoint=env_vars.get("OLLAMA_ENDPOINT", "http://localhost:11434"),
            ollama_model=env_vars.get("OLLAMA_MODEL", "llama3.2:3b"),
            
            max_tokens=int(env_vars.get("LLM_MAX_TOKENS", "4000")),
            temperature=float(env_vars.get("LLM_TEMPERATURE", "0.7")),
            
            health_check_timeout=float(env_vars.get("LLM_HEALTH_CHECK_TIMEOUT", "30.0")),
            health_check_interval=float(env_vars.get("LLM_HEALTH_CHECK_INTERVAL", "300.0"))
        )