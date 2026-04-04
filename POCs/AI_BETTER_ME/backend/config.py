"""Configuration management for the AI Agent Ecosystem backend."""

import os
from typing import Optional
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    
    # LLM Provider Configuration
    llm_provider: str = "ollama"  # "openai" or "ollama" - Default to Ollama for speed and no quotas
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-3.5-turbo"
    ollama_endpoint: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    
    # LangSmith Configuration
    langsmith_api_key: Optional[str] = None
    langsmith_project: str = "ai-agent-ecosystem"
    
    # Database Configuration
    faiss_index_path: str = "./data/faiss_index"
    knowledge_base_path: str = "./data/knowledge_base.json"
    
    # Google Services Configuration
    google_credentials_path: Optional[str] = None
    google_sheets_enabled: bool = False
    google_calendar_enabled: bool = False
    
    # Telegram Bot Configuration
    telegram_bot_token: Optional[str] = None
    telegram_enabled: bool = False
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()