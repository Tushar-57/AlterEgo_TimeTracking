"""
Ollama LLM provider implementation using LangChain.
"""

import asyncio
import time
import aiohttp
from typing import List, AsyncGenerator, Optional, Dict, Any
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from .base import (
    BaseLLMProvider, 
    LLMProviderType, 
    CompletionRequest, 
    CompletionResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    HealthCheckResult,
    ChatMessage
)


class OllamaProvider(BaseLLMProvider):
    """Ollama provider implementation using LangChain."""
    
    def __init__(
        self, 
        endpoint: str = "http://localhost:11434",
        model: str = "llama3.2:3b",
        max_tokens: int = 4000,
        temperature: float = 0.7
    ):
        super().__init__(LLMProviderType.OLLAMA)
        self.endpoint = endpoint.rstrip('/')
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        # LangChain components
        self._chat_model: Optional[Ollama] = None
        self._embeddings_model: Optional[OllamaEmbeddings] = None
    
    async def initialize(self) -> None:
        """Initialize Ollama provider with LangChain."""
        try:
            # Initialize chat model
            self._chat_model = Ollama(
                base_url=self.endpoint,
                model=self.model,
                temperature=self.temperature,
            )
            
            # Initialize embeddings model (using same model for embeddings)
            self._embeddings_model = OllamaEmbeddings(
                base_url=self.endpoint,
                model=self.model
            )
            
            # Test connection
            health_result = await self.health_check()
            if not health_result.is_healthy:
                raise Exception(f"Health check failed: {health_result.error}")
            
            self._is_initialized = True
            
        except Exception as e:
            raise Exception(f"Failed to initialize Ollama provider: {str(e)}")
    
    def _format_messages_for_ollama(self, messages: List[ChatMessage]) -> str:
        """Format messages for Ollama (which expects a single prompt string)."""
        formatted_parts = []
        
        for msg in messages:
            if msg.role == "system":
                formatted_parts.append(f"System: {msg.content}")
            elif msg.role == "user":
                formatted_parts.append(f"Human: {msg.content}")
            elif msg.role == "assistant":
                formatted_parts.append(f"Assistant: {msg.content}")
            else:
                formatted_parts.append(f"Human: {msg.content}")
        
        # Add assistant prompt at the end
        formatted_parts.append("Assistant:")
        
        return "\n\n".join(formatted_parts)
    
    async def chat_completion(self, request: CompletionRequest) -> CompletionResponse:
        """Generate a chat completion using Ollama."""
        if not self._is_initialized or not self._chat_model:
            raise Exception("Provider not initialized")
        
        try:
            # Format messages for Ollama
            prompt = self._format_messages_for_ollama(request.messages)
            
            # Update model parameters if provided in request
            model_kwargs = {}
            if request.temperature is not None:
                model_kwargs["temperature"] = request.temperature
            
            if model_kwargs:
                # Create a new model instance with updated parameters
                chat_model = Ollama(
                    base_url=self.endpoint,
                    model=self.model,
                    **model_kwargs
                )
            else:
                chat_model = self._chat_model
            
            # Generate completion
            response = await chat_model.ainvoke(prompt)
            
            return CompletionResponse(
                content=response.strip(),
                model=self.model
            )
            
        except Exception as e:
            raise Exception(f"Ollama completion failed: {str(e)}")
    
    async def chat_completion_stream(self, request: CompletionRequest) -> AsyncGenerator[str, None]:
        """Generate a streaming chat completion using Ollama."""
        if not self._is_initialized or not self._chat_model:
            raise Exception("Provider not initialized")
        
        try:
            # For now, use non-streaming completion and yield the result
            # This is a fallback due to LangChain version compatibility issues
            completion_response = await self.chat_completion(request)
            
            # Simulate streaming by yielding the complete response
            # In a real implementation, you might want to chunk the response
            if completion_response.content:
                yield completion_response.content
                    
        except Exception as e:
            raise Exception(f"Ollama streaming completion failed: {str(e)}")
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings using Ollama."""
        if not self._is_initialized or not self._embeddings_model:
            raise Exception("Provider not initialized")
        
        try:
            # Generate embedding
            embedding = await self._embeddings_model.aembed_query(request.text)
            
            return EmbeddingResponse(
                embedding=embedding,
                model=self.model
            )
            
        except Exception as e:
            raise Exception(f"Ollama embedding generation failed: {str(e)}")
    
    async def health_check(self) -> HealthCheckResult:
        """Check Ollama provider health."""
        start_time = time.time()
        
        try:
            # Check if Ollama server is running
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.endpoint}/api/tags") as response:
                    if response.status != 200:
                        raise Exception(f"Ollama server returned status {response.status}")
                    
                    data = await response.json()
                    available_models = [model["name"] for model in data.get("models", [])]
                    
                    # Check if our model is available
                    if self.model not in available_models:
                        raise Exception(f"Model '{self.model}' not found. Available models: {available_models}")
            
            # Test a simple completion
            if self._chat_model:
                test_response = await self._chat_model.ainvoke("Hello")
                if not test_response:
                    raise Exception("Empty response from model")
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                is_healthy=True,
                provider_type=self.provider_type,
                model=self.model,
                response_time_ms=response_time
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return HealthCheckResult(
                is_healthy=False,
                provider_type=self.provider_type,
                model=self.model,
                error=str(e),
                response_time_ms=response_time
            )
    
    async def get_available_models_async(self) -> List[str]:
        """Get available Ollama models from the server."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.endpoint}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        return [model["name"] for model in data.get("models", [])]
                    else:
                        return []
        except Exception:
            return []
    
    def get_available_models(self) -> List[str]:
        """Get available Ollama models (synchronous version)."""
        # Common Ollama models - in a real implementation, 
        # you might want to cache the async result
        return [
            "llama2",
            "llama2:13b",
            "llama2:70b",
            "codellama",
            "codellama:13b",
            "mistral",
            "mixtral",
            "neural-chat",
            "starling-lm"
        ]