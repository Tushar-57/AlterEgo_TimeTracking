"""
LLM provider factory with health checks and fallback mechanisms.
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from .base import BaseLLMProvider, LLMProviderType, HealthCheckResult
from .config import LLMConfig
from .openai_provider import OpenAIProvider
from .ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)


class LLMProviderFactory:
    """Factory for creating and managing LLM providers with health checks and fallback."""
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self._providers: Dict[LLMProviderType, BaseLLMProvider] = {}
        self._health_status: Dict[LLMProviderType, HealthCheckResult] = {}
        self._last_health_check: Dict[LLMProviderType, datetime] = {}
        self._current_provider: Optional[BaseLLMProvider] = None
        self._fallback_provider: Optional[BaseLLMProvider] = None
    
    async def initialize(self) -> None:
        """Initialize the factory and providers."""
        try:
            # Initialize primary provider
            primary_provider = await self._create_provider_by_type(self.config.provider)
            if primary_provider:
                self._providers[self.config.provider] = primary_provider
                self._current_provider = primary_provider
                logger.info(f"Initialized primary provider: {self.config.provider}")
            
            # Initialize fallback provider if enabled
            if (self.config.fallback_enabled and 
                self.config.fallback_provider and 
                self.config.fallback_provider != self.config.provider):
                
                fallback_provider = await self._create_provider_by_type(self.config.fallback_provider)
                if fallback_provider:
                    self._providers[self.config.fallback_provider] = fallback_provider
                    self._fallback_provider = fallback_provider
                    logger.info(f"Initialized fallback provider: {self.config.fallback_provider}")
                    
                    # If primary provider failed but fallback succeeded, use fallback as current
                    if not self._current_provider:
                        self._current_provider = fallback_provider
                        logger.info(f"Using fallback provider as current: {self.config.fallback_provider}")
            
            if not self._current_provider:
                raise Exception("No providers could be initialized")
                raise Exception("No providers could be initialized")
                
        except Exception as e:
            logger.error(f"Failed to initialize LLM providers: {e}")
            raise
    
    def _get_provider_class(self, provider_type: LLMProviderType):
        """Get the provider class for a given provider type."""
        if provider_type == LLMProviderType.OPENAI:
            return OpenAIProvider
        elif provider_type == LLMProviderType.OLLAMA:
            return OllamaProvider
        else:
            raise ValueError(f"Unsupported provider type: {provider_type}")

    async def _create_provider(self, config: LLMConfig, skip_health_check: bool = False) -> BaseLLMProvider:
        """Create LLM provider based on configuration."""
        provider_cls = self._get_provider_class(config.provider)
        
        # Create provider instance
        provider = provider_cls(
            api_key=config.api_key,
            model=config.model,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            base_url=config.base_url
        )
        
        # Initialize the provider only if not skipping health check
        if not skip_health_check:
            await provider.initialize()
        
        return provider
    
    async def _create_provider_by_type(self, provider_type: LLMProviderType, skip_health_check: bool = False) -> Optional[BaseLLMProvider]:
        """Create LLM provider by type using default config."""
        try:
            # Get provider configuration
            provider_config_dict = self.config.get_provider_config(provider_type)
            
            # Create provider directly with the right constructor
            provider_cls = self._get_provider_class(provider_type)
            
            if provider_type == LLMProviderType.OPENAI:
                provider = provider_cls(
                    api_key=provider_config_dict["api_key"],
                    model=provider_config_dict["model"],
                    max_tokens=provider_config_dict["max_tokens"],
                    temperature=provider_config_dict["temperature"],
                    base_url=provider_config_dict["base_url"]
                )
            elif provider_type == LLMProviderType.OLLAMA:
                provider = provider_cls(
                    endpoint=provider_config_dict["endpoint"],
                    model=provider_config_dict["model"],
                    max_tokens=provider_config_dict["max_tokens"],
                    temperature=provider_config_dict["temperature"]
                )
            else:
                logger.error(f"Unsupported provider type: {provider_type}")
                return None
            
            # Initialize the provider only if not skipping health check
            if not skip_health_check:
                await provider.initialize()
            
            return provider
            
        except Exception as e:
            logger.error(f"Failed to create provider {provider_type}: {e}")
            return None
    
    async def get_provider(self) -> BaseLLMProvider:
        """Get the current active provider with automatic fallback."""
        # Check if we need to perform health checks
        await self._check_provider_health()
        
        # Return current provider if healthy
        if (self._current_provider and 
            self._is_provider_healthy(self._current_provider.provider_type)):
            return self._current_provider
        
        # Try fallback if primary is unhealthy
        if (self._fallback_provider and 
            self._is_provider_healthy(self._fallback_provider.provider_type)):
            logger.warning(f"Switching to fallback provider: {self._fallback_provider.provider_type}")
            self._current_provider = self._fallback_provider
            return self._current_provider
        
        # If both are unhealthy, try to reinitialize primary
        if self._current_provider:
            try:
                await self._current_provider.initialize()
                health = await self._current_provider.health_check()
                self._health_status[self._current_provider.provider_type] = health
                self._last_health_check[self._current_provider.provider_type] = datetime.now()
                
                if health.is_healthy:
                    return self._current_provider
            except Exception as e:
                logger.error(f"Failed to reinitialize primary provider: {e}")
        
        raise Exception("No healthy providers available")
    
    async def _check_provider_health(self) -> None:
        """Check health of all providers if needed."""
        now = datetime.now()
        
        for provider_type, provider in self._providers.items():
            last_check = self._last_health_check.get(provider_type)
            
            # Check if we need to perform health check
            if (not last_check or 
                now - last_check > timedelta(seconds=self.config.health_check_interval)):
                
                try:
                    health = await asyncio.wait_for(
                        provider.health_check(),
                        timeout=self.config.health_check_timeout
                    )
                    self._health_status[provider_type] = health
                    self._last_health_check[provider_type] = now
                    
                    if not health.is_healthy:
                        logger.warning(f"Provider {provider_type} is unhealthy: {health.error}")
                    
                except asyncio.TimeoutError:
                    logger.error(f"Health check timeout for provider: {provider_type}")
                    self._health_status[provider_type] = HealthCheckResult(
                        is_healthy=False,
                        provider_type=provider_type,
                        error="Health check timeout"
                    )
                    self._last_health_check[provider_type] = now
                    
                except Exception as e:
                    logger.error(f"Health check failed for provider {provider_type}: {e}")
                    self._health_status[provider_type] = HealthCheckResult(
                        is_healthy=False,
                        provider_type=provider_type,
                        error=str(e)
                    )
                    self._last_health_check[provider_type] = now
    
    def _is_provider_healthy(self, provider_type: LLMProviderType) -> bool:
        """Check if a provider is currently healthy."""
        health = self._health_status.get(provider_type)
        return health is not None and health.is_healthy
    
    async def switch_provider(self, provider_type: LLMProviderType, skip_health_check: bool = False) -> bool:
        """Manually switch to a specific provider."""
        try:
            if provider_type not in self._providers:
                # Try to create the provider if it doesn't exist
                provider = await self._create_provider_by_type(provider_type, skip_health_check)
                if not provider:
                    return False
                self._providers[provider_type] = provider
            
            provider = self._providers[provider_type]
            
            if skip_health_check:
                # Skip health check and just switch
                self._current_provider = provider
                logger.info(f"Switched to provider: {provider_type} (health check skipped)")
                return True
            else:
                # Check health
                health = await provider.health_check()
                self._health_status[provider_type] = health
                self._last_health_check[provider_type] = datetime.now()
                
                if health.is_healthy:
                    self._current_provider = provider
                    logger.info(f"Switched to provider: {provider_type}")
                    return True
                else:
                    logger.error(f"Cannot switch to unhealthy provider {provider_type}: {health.error}")
                    return False
                
        except Exception as e:
            logger.error(f"Failed to switch to provider {provider_type}: {e}")
            return False
    
    def get_health_status(self) -> Dict[LLMProviderType, HealthCheckResult]:
        """Get health status of all providers."""
        return self._health_status.copy()
    
    def get_current_provider_type(self) -> Optional[LLMProviderType]:
        """Get the type of the current active provider."""
        return self._current_provider.provider_type if self._current_provider else None
    
    async def shutdown(self) -> None:
        """Shutdown all providers."""
        logger.info("Shutting down LLM providers")
        # Note: LangChain providers don't typically need explicit shutdown,
        # but we could add cleanup logic here if needed
        self._providers.clear()
        self._current_provider = None
        self._fallback_provider = None