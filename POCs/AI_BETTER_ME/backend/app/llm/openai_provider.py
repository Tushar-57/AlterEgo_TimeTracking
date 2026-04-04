"""
OpenAI LLM provider implementation using LangChain.
"""

import asyncio
import time
from typing import List, AsyncGenerator, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
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


class OpenAIProvider(BaseLLMProvider):
    """OpenAI provider implementation using LangChain."""
    
    def __init__(
        self, 
        api_key: str, 
        model: str = "gpt-3.5-turbo",
        base_url: Optional[str] = None,
        max_tokens: int = 4000,
        temperature: float = 0.7
    ):
        super().__init__(LLMProviderType.OPENAI)
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        # LangChain components
        self._chat_model: Optional[ChatOpenAI] = None
        self._embeddings_model: Optional[OpenAIEmbeddings] = None
    
    async def initialize(self) -> None:
        """Initialize OpenAI provider with LangChain."""
        try:
            # Initialize chat model
            chat_kwargs = {
                "model": self.model,
                "openai_api_key": self.api_key,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }
            if self.base_url:
                chat_kwargs["openai_api_base"] = self.base_url
            
            self._chat_model = ChatOpenAI(**chat_kwargs)
            
            # Initialize embeddings model
            embedding_kwargs = {
                "openai_api_key": self.api_key,
            }
            if self.base_url:
                embedding_kwargs["openai_api_base"] = self.base_url
            
            self._embeddings_model = OpenAIEmbeddings(**embedding_kwargs)
            
            # Test connection
            health_result = await self.health_check()
            if not health_result.is_healthy:
                raise Exception(f"Health check failed: {health_result.error}")
            
            self._is_initialized = True
            
        except Exception as e:
            raise Exception(f"Failed to initialize OpenAI provider: {str(e)}")
    
    def _convert_messages(self, messages: List[ChatMessage]) -> List:
        """Convert ChatMessage objects to LangChain message format."""
        langchain_messages = []
        for msg in messages:
            if msg.role == "system":
                langchain_messages.append(SystemMessage(content=msg.content))
            elif msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
            else:
                # Default to human message for unknown roles
                langchain_messages.append(HumanMessage(content=msg.content))
        return langchain_messages
    
    async def chat_completion(self, request: CompletionRequest) -> CompletionResponse:
        """Generate a chat completion using OpenAI."""
        if not self._is_initialized or not self._chat_model:
            raise Exception("Provider not initialized")
        
        try:
            # Convert messages to LangChain format
            messages = self._convert_messages(request.messages)
            
            # Update model parameters if provided in request
            if request.max_tokens or request.temperature:
                model_kwargs = {}
                if request.max_tokens:
                    model_kwargs["max_tokens"] = request.max_tokens
                if request.temperature is not None:
                    model_kwargs["temperature"] = request.temperature
                
                # Create a new model instance with updated parameters
                chat_model = self._chat_model.bind(**model_kwargs)
            else:
                chat_model = self._chat_model
            
            # Generate completion
            response = await chat_model.ainvoke(messages)
            
            # Get usage metadata if available
            usage = getattr(response, 'usage_metadata', None)
            if usage and not isinstance(usage, dict):
                usage = None  # Ignore non-dict usage data
            
            return CompletionResponse(
                content=response.content,
                model=self.model,
                usage=usage
            )
            
        except Exception as e:
            raise Exception(f"OpenAI completion failed: {str(e)}")
    
    async def chat_completion_stream(self, request: CompletionRequest) -> AsyncGenerator[str, None]:
        """Generate a streaming chat completion using OpenAI."""
        if not self._is_initialized or not self._chat_model:
            raise Exception("Provider not initialized")
        
        try:
            # Convert messages to LangChain format
            messages = self._convert_messages(request.messages)
            
            # Update model parameters if provided in request
            if request.max_tokens or request.temperature:
                model_kwargs = {}
                if request.max_tokens:
                    model_kwargs["max_tokens"] = request.max_tokens
                if request.temperature is not None:
                    model_kwargs["temperature"] = request.temperature
                
                chat_model = self._chat_model.bind(**model_kwargs)
            else:
                chat_model = self._chat_model
            
            # Generate streaming completion
            async for chunk in chat_model.astream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    yield chunk.content
                    
        except Exception as e:
            raise Exception(f"OpenAI streaming completion failed: {str(e)}")
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings using OpenAI."""
        if not self._is_initialized or not self._embeddings_model:
            raise Exception("Provider not initialized")
        
        try:
            # Generate embedding
            embedding = await self._embeddings_model.aembed_query(request.text)
            
            return EmbeddingResponse(
                embedding=embedding,
                model="text-embedding-ada-002"  # Default OpenAI embedding model
            )
            
        except Exception as e:
            raise Exception(f"OpenAI embedding generation failed: {str(e)}")
    
    async def health_check(self) -> HealthCheckResult:
        """Check OpenAI provider health."""
        start_time = time.time()
        
        try:
            if not self._chat_model:
                # Try to create a temporary model for health check
                temp_model = ChatOpenAI(
                    model=self.model,
                    openai_api_key=self.api_key,
                    max_tokens=10,
                    temperature=0
                )
            else:
                temp_model = self._chat_model
            
            # Simple test message
            test_message = [HumanMessage(content="Hello")]
            response = await temp_model.ainvoke(test_message)
            
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
    
    def get_available_models(self) -> List[str]:
        """Get available OpenAI models."""
        return [
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k", 
            "gpt-4o-mini",
            "gpt-4o-mini-2024-07-18"
        ]