"""
Base LLM provider interface and common types.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator
from pydantic import BaseModel
from enum import Enum


class LLMProviderType(str, Enum):
    """Supported LLM provider types."""
    OPENAI = "openai"
    OLLAMA = "ollama"


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str  # "system", "user", "assistant"
    content: str


class CompletionRequest(BaseModel):
    """Completion request model."""
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 4000
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False


class CompletionResponse(BaseModel):
    """Completion response model."""
    content: str
    usage: Optional[Dict[str, Any]] = None
    model: Optional[str] = None


class EmbeddingRequest(BaseModel):
    """Embedding request model."""
    text: str
    model: Optional[str] = None


class EmbeddingResponse(BaseModel):
    """Embedding response model."""
    embedding: List[float]
    model: Optional[str] = None


class HealthCheckResult(BaseModel):
    """Health check result model."""
    is_healthy: bool
    provider_type: LLMProviderType
    model: Optional[str] = None
    error: Optional[str] = None
    response_time_ms: Optional[float] = None


class BaseLLMProvider(ABC):
    """Base abstract class for LLM providers."""
    
    def __init__(self, provider_type: LLMProviderType):
        self.provider_type = provider_type
        self._is_initialized = False
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the provider (e.g., validate credentials, test connection)."""
        pass
    
    @abstractmethod
    async def chat_completion(self, request: CompletionRequest) -> CompletionResponse:
        """Generate a chat completion."""
        pass
    
    @abstractmethod
    async def chat_completion_stream(self, request: CompletionRequest) -> AsyncGenerator[str, None]:
        """Generate a streaming chat completion."""
        pass
    
    @abstractmethod
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embeddings for text."""
        pass
    
    @abstractmethod
    async def health_check(self) -> HealthCheckResult:
        """Check if the provider is healthy and accessible."""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """Get list of available models for this provider."""
        pass
    
    @property
    def is_initialized(self) -> bool:
        """Check if provider is initialized."""
        return self._is_initialized