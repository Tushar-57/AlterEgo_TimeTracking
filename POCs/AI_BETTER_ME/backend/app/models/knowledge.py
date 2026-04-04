"""
Knowledge base data models for storing user preferences and interaction history.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum
from app.llm import LLMConfig
import os


class KnowledgeEntryType(str, Enum):
    """Types of knowledge entries."""
    PREFERENCE = "preference"
    INTERACTION = "interaction"
    PATTERN = "pattern"
    INSIGHT = "insight"
    MEMORY = "memory"


# Unified Enum for all subtypes
class KnowledgeEntrySubType(str, Enum):
    PERSONAL_PREFERENCE = "personal preference"
    WORK_PREFERENCE = "work preference"
    OTHER_PREFERENCE = "other preference"
    PERSONAL_INTERACTION = "personal interaction"
    DEEP_PERSONAL_INTERACTION = "deep personal interaction"
    WORK_INTERACTION = "work interaction"
    MISC_INTERACTION = "misc interaction"
    HEALTH_INTERACTION = "health interaction"
    CONCIOUS_PATTERNS = "concious patterns"
    SUBCONCIOUS_PATTERNS = "subconcious patterns"
    IMPORTANT_INSIGHT = "important insight"
    MISC_INSIGHT = "misc insight"
    CORE_MEMORY = "core memory"
    REMAINDER_MEMORY = "reaminder memory"
    EMOTIONAL_MEMORY = "emotional memory"

class KnowledgeEntry(BaseModel):
    @classmethod
    def from_dict(cls, data):
        # Convert string to Enum if needed
        if isinstance(data.get("entry_type"), str):
            data["entry_type"] = KnowledgeEntryType(data["entry_type"])
        if isinstance(data.get("entry_sub_type"), str):
            data["entry_sub_type"] = KnowledgeEntrySubType(data["entry_sub_type"])
        return cls(**data)
    """A single knowledge base entry."""
    entry_id: str = Field(..., description="Unique identifier for the entry")
    user_id: str = Field(default="single_user", description="User identifier")
    entry_type: KnowledgeEntryType = Field(..., description="Type of knowledge entry")
    entry_sub_type: KnowledgeEntrySubType = Field(..., description="Sub Type of knowledge entry")
    category: str = Field(..., description="Category of the knowledge (e.g., productivity, health)")
    title: str = Field(..., description="Human-readable title for the entry")
    content: str = Field(..., description="The actual content/data")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    embedding: Optional[List[float]] = Field(default=None, description="Vector embedding for similarity search")


class UserPreferences(BaseModel):
    """User preferences schema."""
    user_id: str = Field(default="single_user")
    
    # Productivity preferences
    productivity: Dict[str, Any] = Field(default_factory=lambda: {
        "work_hours": "09:00-17:00",
        "break_preferences": "pomodoro",
        "priority_system": "eisenhower",
        "task_categories": ["work", "personal", "learning"]
    })
    
    # Health preferences
    health: Dict[str, Any] = Field(default_factory=lambda: {
        "exercise_goals": "60 minutes minimum daily",
        "sleep_schedule": "00:00-07:30",
        "dietary_preferences": ["Vegetarian"],
        "health_metrics": ["diet","sleep", "exercise", "mood"]
    })
    
    # Finance preferences
    finance: Dict[str, Any] = Field(default_factory=lambda: {
        "budget_categories": ["food", "transport", "entertainment", "rent"],
        "savings_goals": 2100,
        "expense_tracking": "weekly",
        "currency": "USD"
    })
    
    # Journal preferences
    journal: Dict[str, Any] = Field(default_factory=lambda: {
        "reflection_frequency": "daily",
        "check_in_time": "22:00",
        "reflection_topics": ["gratitude", "challenges", "goals"],
        "mood_tracking": True
    })
    
    # LLM provider preferences
    llm_provider: Dict[str, Any] = Field(default_factory=lambda: {
        "provider": "openai",
        "openai_model": "gpt-3.5-turbo",
        "ollama_model": "llama3.2:3b",
        "fallback_enabled": True
    })
    
    # General preferences
    general: Dict[str, Any] = Field(default_factory=lambda: {
        "timezone": "UTC",
        "language": "en",
        "notification_preferences": {
            "web": True,
            "telegram": False
        }
    })


class KnowledgeQuery(BaseModel):
    """Query model for knowledge base searches."""
    query_text: str = Field(..., description="Text to search for")
    categories: Optional[List[str]] = Field(default=None, description="Categories to filter by")
    entry_types: Optional[List[KnowledgeEntryType]] = Field(default=None, description="Entry types to filter by")
    tags: Optional[List[str]] = Field(default=None, description="Tags to filter by")
    limit: int = Field(default=10, description="Maximum number of results")
    similarity_threshold: float = Field(default=0.7, description="Minimum similarity score")


class KnowledgeSearchResult(BaseModel):
    """Result from a knowledge base search."""
    entry: KnowledgeEntry
    similarity_score: float = Field(..., description="Similarity score (0-1)")
    relevance_explanation: Optional[str] = Field(default=None, description="Why this result is relevant")


class KnowledgeStats(BaseModel):
    """Statistics about the knowledge base."""
    total_entries: int
    entries_by_type: Dict[KnowledgeEntryType, int]
    entries_by_category: Dict[str, int]
    last_updated: datetime
    embedding_model: str