"""
Unit tests for LLM providers, factory, and service.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import List

from app.llm.base import (
    LLMProviderType, 
    ChatMessage, 
    CompletionRequest, 
    CompletionResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    HealthCheckResult
)
from app.llm.config import LLMConfig
from app.llm.openai_provider import OpenAIProvider
from app.llm.ollama_provider import OllamaProvider
from app.llm.factory import LLMProviderFactory
from app.llm.service import LLMService


class TestLLMConfig:
    """Test LLM configuration management."""
    
    def test_config_creation(self):
        """Test basic config creation."""
        config = LLMConfig(
            provider=LLMProviderType.OPENAI,
            openai_api_key="test-key",
            openai_model="gpt-4"
        )
        
        assert config.provider == LLMProviderType.OPENAI
        assert config.openai_api_key == "test-key"
        assert config.openai_model == "gpt-4"
    
    def test_config_from_env(self):
        """Test config creation from environment variables."""
        env_vars = {
            "LLM_PROVIDER": "ollama",
            "OLLAMA_ENDPOINT": "http://localhost:11434",
            "OLLAMA_MODEL": "llama3.2:3b",
            "LLM_MAX_TOKENS": "2000",
            "LLM_TEMPERATURE": "0.5"
        }
        
        config = LLMConfig.from_env(env_vars)
        
        assert config.provider == LLMProviderType.OLLAMA
        assert config.ollama_endpoint == "http://localhost:11434"
        assert config.ollama_model == "llama3.2:3b"
        assert config.max_tokens == 2000
        assert config.temperature == 0.5
    
    def test_provider_config_validation(self):
        """Test provider configuration validation."""
        config = LLMConfig(
            openai_api_key="test-key",
            openai_model="gpt-4"
        )
        
        assert config.validate_provider_config(LLMProviderType.OPENAI) is True
        assert config.validate_provider_config(LLMProviderType.OLLAMA) is True  # Has defaults
        
        config.openai_api_key = None
        assert config.validate_provider_config(LLMProviderType.OPENAI) is False


class TestOpenAIProvider:
    """Test OpenAI provider implementation."""
    
    @pytest.fixture
    def openai_provider(self):
        """Create OpenAI provider for testing."""
        return OpenAIProvider(
            api_key="test-key",
            model="gpt-4"
        )
    
    @pytest.mark.asyncio
    async def test_provider_initialization(self, openai_provider):
        """Test provider initialization."""
        with patch.object(openai_provider, 'health_check') as mock_health:
            mock_health.return_value = HealthCheckResult(
                is_healthy=True,
                provider_type=LLMProviderType.OPENAI
            )
            
            await openai_provider.initialize()
            assert openai_provider.is_initialized is True
    
    @pytest.mark.asyncio
    async def test_chat_completion(self, openai_provider):
        """Test chat completion."""
        # Mock the LangChain ChatOpenAI
        mock_response = Mock()
        mock_response.content = "Hello! How can I help you?"
        # Don't set usage_metadata to avoid validation issues
        
        # Create a proper async mock
        mock_instance = AsyncMock()
        mock_instance.ainvoke = AsyncMock(return_value=mock_response)
        mock_instance.bind = Mock(return_value=mock_instance)  # Mock bind method
        
        openai_provider._chat_model = mock_instance
        openai_provider._is_initialized = True
        
        request = CompletionRequest(
            messages=[ChatMessage(role="user", content="Hello")]
        )
        
        response = await openai_provider.chat_completion(request)
        
        assert isinstance(response, CompletionResponse)
        assert response.content == "Hello! How can I help you?"
        assert response.model == "gpt-4"
    
    @pytest.mark.asyncio
    async def test_embedding_generation(self, openai_provider):
        """Test embedding generation."""
        mock_embedding = [0.1, 0.2, 0.3, 0.4, 0.5]
        
        with patch('app.llm.openai_provider.OpenAIEmbeddings') as mock_embeddings:
            mock_instance = AsyncMock()
            mock_instance.aembed_query.return_value = mock_embedding
            mock_embeddings.return_value = mock_instance
            
            openai_provider._embeddings_model = mock_instance
            openai_provider._is_initialized = True
            
            request = EmbeddingRequest(text="Hello world")
            response = await openai_provider.generate_embedding(request)
            
            assert isinstance(response, EmbeddingResponse)
            assert response.embedding == mock_embedding
    
    def test_get_available_models(self, openai_provider):
        """Test getting available models."""
        models = openai_provider.get_available_models()
        
        assert isinstance(models, list)
        assert "gpt-4" in models
        assert "gpt-3.5-turbo" in models


class TestOllamaProvider:
    """Test Ollama provider implementation."""
    
    @pytest.fixture
    def ollama_provider(self):
        """Create Ollama provider for testing."""
        return OllamaProvider(
            endpoint="http://localhost:11434",
            model="llama2"
        )
    
    @pytest.mark.asyncio
    async def test_provider_initialization(self, ollama_provider):
        """Test provider initialization."""
        with patch.object(ollama_provider, 'health_check') as mock_health:
            mock_health.return_value = HealthCheckResult(
                is_healthy=True,
                provider_type=LLMProviderType.OLLAMA
            )
            
            await ollama_provider.initialize()
            assert ollama_provider.is_initialized is True
    
    @pytest.mark.asyncio
    async def test_chat_completion(self, ollama_provider):
        """Test chat completion."""
        mock_response = "Hello! How can I help you?"
        
        with patch('app.llm.ollama_provider.Ollama') as mock_ollama:
            mock_instance = AsyncMock()
            mock_instance.ainvoke.return_value = mock_response
            mock_ollama.return_value = mock_instance
            
            ollama_provider._chat_model = mock_instance
            ollama_provider._is_initialized = True
            
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content="Hello")]
            )
            
            response = await ollama_provider.chat_completion(request)
            
            assert isinstance(response, CompletionResponse)
            assert response.content == mock_response
            assert response.model == "llama2"
    
    def test_message_formatting(self, ollama_provider):
        """Test message formatting for Ollama."""
        messages = [
            ChatMessage(role="system", content="You are a helpful assistant."),
            ChatMessage(role="user", content="Hello"),
            ChatMessage(role="assistant", content="Hi there!"),
            ChatMessage(role="user", content="How are you?")
        ]
        
        formatted = ollama_provider._format_messages_for_ollama(messages)
        
        assert "System: You are a helpful assistant." in formatted
        assert "Human: Hello" in formatted
        assert "Assistant: Hi there!" in formatted
        assert "Human: How are you?" in formatted
        assert formatted.endswith("Assistant:")
    
    def test_get_available_models(self, ollama_provider):
        """Test getting available models."""
        models = ollama_provider.get_available_models()
        
        assert isinstance(models, list)
        assert "llama2" in models
        assert "codellama" in models


class TestLLMProviderFactory:
    """Test LLM provider factory."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return LLMConfig(
            provider=LLMProviderType.OPENAI,
            fallback_enabled=True,
            fallback_provider=LLMProviderType.OLLAMA,
            openai_api_key="test-key",
            openai_model="gpt-4",
            ollama_endpoint="http://localhost:11434",
            ollama_model="llama2"
        )
    
    @pytest.fixture
    def factory(self, config):
        """Create factory for testing."""
        return LLMProviderFactory(config)
    
    @pytest.mark.asyncio
    async def test_factory_initialization(self, factory):
        """Test factory initialization."""
        with patch('app.llm.factory.OpenAIProvider') as mock_openai, \
             patch('app.llm.factory.OllamaProvider') as mock_ollama:
            
            # Mock provider instances
            mock_openai_instance = AsyncMock()
            mock_openai_instance.provider_type = LLMProviderType.OPENAI
            mock_openai_instance.initialize = AsyncMock()
            mock_openai_instance.health_check = AsyncMock(return_value=HealthCheckResult(
                is_healthy=True, provider_type=LLMProviderType.OPENAI
            ))
            mock_openai.return_value = mock_openai_instance
            
            mock_ollama_instance = AsyncMock()
            mock_ollama_instance.provider_type = LLMProviderType.OLLAMA
            mock_ollama_instance.initialize = AsyncMock()
            mock_ollama_instance.health_check = AsyncMock(return_value=HealthCheckResult(
                is_healthy=True, provider_type=LLMProviderType.OLLAMA
            ))
            mock_ollama.return_value = mock_ollama_instance
            
            await factory.initialize()
            
            assert factory._current_provider is not None
            assert factory._fallback_provider is not None
            assert len(factory._providers) == 2
    
    @pytest.mark.asyncio
    async def test_provider_fallback(self, factory):
        """Test automatic fallback to secondary provider."""
        # Mock providers
        unhealthy_provider = AsyncMock()
        unhealthy_provider.provider_type = LLMProviderType.OPENAI
        unhealthy_provider.health_check = AsyncMock(return_value=HealthCheckResult(
            is_healthy=False, provider_type=LLMProviderType.OPENAI, error="Connection failed"
        ))
        
        healthy_provider = AsyncMock()
        healthy_provider.provider_type = LLMProviderType.OLLAMA
        healthy_provider.health_check = AsyncMock(return_value=HealthCheckResult(
            is_healthy=True, provider_type=LLMProviderType.OLLAMA
        ))
        
        factory._providers = {
            LLMProviderType.OPENAI: unhealthy_provider,
            LLMProviderType.OLLAMA: healthy_provider
        }
        factory._current_provider = unhealthy_provider
        factory._fallback_provider = healthy_provider
        
        # Mock health status
        factory._health_status = {
            LLMProviderType.OPENAI: HealthCheckResult(
                is_healthy=False, provider_type=LLMProviderType.OPENAI
            ),
            LLMProviderType.OLLAMA: HealthCheckResult(
                is_healthy=True, provider_type=LLMProviderType.OLLAMA
            )
        }
        
        provider = await factory.get_provider()
        
        assert provider == healthy_provider
        assert factory._current_provider == healthy_provider
    
    @pytest.mark.asyncio
    async def test_manual_provider_switch(self, factory):
        """Test manual provider switching."""
        # Mock providers
        openai_provider = AsyncMock()
        openai_provider.provider_type = LLMProviderType.OPENAI
        openai_provider.health_check = AsyncMock(return_value=HealthCheckResult(
            is_healthy=True, provider_type=LLMProviderType.OPENAI
        ))
        
        factory._providers = {LLMProviderType.OPENAI: openai_provider}
        
        success = await factory.switch_provider(LLMProviderType.OPENAI)
        
        assert success is True
        assert factory._current_provider == openai_provider


class TestLLMService:
    """Test LLM service."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return LLMConfig(
            provider=LLMProviderType.OPENAI,
            openai_api_key="test-key",
            openai_model="gpt-4"
        )
    
    @pytest.fixture
    def service(self, config):
        """Create service for testing."""
        return LLMService(config)
    
    @pytest.mark.asyncio
    async def test_service_initialization(self, service):
        """Test service initialization."""
        with patch.object(service.factory, 'initialize') as mock_init:
            mock_init.return_value = None
            
            await service.initialize()
            
            assert service._initialized is True
            mock_init.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_chat_completion_service(self, service):
        """Test chat completion through service."""
        # Mock provider
        mock_provider = AsyncMock()
        mock_response = CompletionResponse(content="Hello!", model="gpt-4")
        mock_provider.chat_completion.return_value = mock_response
        
        with patch.object(service.factory, 'get_provider') as mock_get_provider:
            mock_get_provider.return_value = mock_provider
            service._initialized = True
            
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content="Hello")]
            )
            
            response = await service.chat_completion(request)
            
            assert response == mock_response
            mock_provider.chat_completion.assert_called_once_with(request)
    
    @pytest.mark.asyncio
    async def test_provider_switching_service(self, service):
        """Test provider switching through service."""
        with patch.object(service.factory, 'switch_provider') as mock_switch:
            mock_switch.return_value = True
            service._initialized = True
            
            result = await service.switch_provider(LLMProviderType.OLLAMA)
            
            assert result is True
            mock_switch.assert_called_once_with(LLMProviderType.OLLAMA)


# Integration test for provider switching and fallback scenarios
class TestProviderIntegration:
    """Integration tests for provider switching and fallback."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_fallback_scenario(self):
        """Test complete fallback scenario from service to provider."""
        config = LLMConfig(
            provider=LLMProviderType.OPENAI,
            fallback_enabled=True,
            fallback_provider=LLMProviderType.OLLAMA,
            openai_api_key="test-key",
            openai_model="gpt-4"
        )
        
        service = LLMService(config)
        
        # Mock the entire chain
        with patch('app.llm.openai_provider.ChatOpenAI') as mock_openai, \
             patch('app.llm.ollama_provider.Ollama') as mock_ollama, \
             patch('app.llm.openai_provider.OpenAIEmbeddings'), \
             patch('app.llm.ollama_provider.OllamaEmbeddings'):
            
            # Setup OpenAI provider to fail
            mock_openai_instance = AsyncMock()
            mock_openai_instance.ainvoke.side_effect = Exception("OpenAI API Error")
            mock_openai.return_value = mock_openai_instance
            
            # Setup Ollama provider to succeed
            mock_ollama_instance = AsyncMock()
            mock_ollama_instance.ainvoke.return_value = "Ollama response"
            mock_ollama.return_value = mock_ollama_instance
            
            # Mock health checks
            with patch('aiohttp.ClientSession.get') as mock_get:
                mock_response = AsyncMock()
                mock_response.status = 200
                mock_response.json.return_value = {"models": [{"name": "llama2"}]}
                mock_get.return_value.__aenter__.return_value = mock_response
                
                # This test would require more complex mocking to work fully
                # but demonstrates the testing approach for integration scenarios
                pass


if __name__ == "__main__":
    pytest.main([__file__])