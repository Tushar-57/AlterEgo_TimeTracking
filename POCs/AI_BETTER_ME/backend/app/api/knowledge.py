"""
API endpoints for knowledge base operations.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..models.knowledge import (
    KnowledgeEntry,
    KnowledgeEntryType,
    KnowledgeQuery,
    KnowledgeSearchResult,
    KnowledgeStats,
    UserPreferences,
    KnowledgeEntrySubType
)
from ..services.knowledge_base import get_knowledge_base_service

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


class CreateEntryRequest(BaseModel):
    """Request model for creating knowledge entries."""
    entry_type: KnowledgeEntryType
    entry_sub_type: KnowledgeEntrySubType
    category: str
    title: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class UpdateEntryRequest(BaseModel):
    """Request model for updating knowledge entries."""
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class SearchRequest(BaseModel):
    """Request model for searching knowledge base."""
    query_text: str
    categories: Optional[List[str]] = None
    entry_types: Optional[List[KnowledgeEntryType]] = None
    tags: Optional[List[str]] = None
    limit: int = 10
    similarity_threshold: float = 0.7


class InteractionHistoryRequest(BaseModel):
    """Request model for adding interaction history."""
    agent_type: str
    user_input: str
    agent_response: str
    context: Optional[Dict[str, Any]] = None


@router.post("/entries", response_model=KnowledgeEntry)
async def create_entry(request: CreateEntryRequest):
    """Create a new knowledge base entry."""
    try:
        kb_service = get_knowledge_base_service()
        entry = await kb_service.create_entry(
            entry_type=request.entry_type,
            category=request.category,
            entry_sub_type=KnowledgeEntrySubType,
            title=request.title,
            content=request.content,
            metadata=request.metadata,
            tags=request.tags
        )
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create entry: {str(e)}")


@router.get("/entries/{entry_id}", response_model=Optional[KnowledgeEntry])
async def get_entry(entry_id: str):
    """Get a knowledge entry by ID."""
    try:
        kb_service = get_knowledge_base_service()
        entry = await kb_service.get_entry(entry_id)
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get entry: {str(e)}")


@router.put("/entries/{entry_id}", response_model=Optional[KnowledgeEntry])
async def update_entry(entry_id: str, request: UpdateEntryRequest):
    """Update a knowledge entry."""
    try:
        kb_service = get_knowledge_base_service()
        entry = await kb_service.update_entry(
            entry_id=entry_id,
            title=request.title,
            content=request.content,
            metadata=request.metadata,
            tags=request.tags
        )
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update entry: {str(e)}")


@router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    """Delete a knowledge entry."""
    try:
        kb_service = get_knowledge_base_service()
        success = await kb_service.delete_entry(entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"message": "Entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete entry: {str(e)}")


@router.post("/search", response_model=List[KnowledgeSearchResult])
async def search_knowledge_base(request: SearchRequest):
    """Search the knowledge base using RAG."""
    try:
        kb_service = get_knowledge_base_service()
        query = KnowledgeQuery(
            query_text=request.query_text,
            categories=request.categories,
            entry_types=request.entry_types,
            tags=request.tags,
            limit=request.limit,
            similarity_threshold=request.similarity_threshold
        )
        results = await kb_service.search(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search knowledge base: {str(e)}")


@router.get("/entries", response_model=List[KnowledgeEntry])
async def get_all_entries(
    category: Optional[str] = Query(None, description="Filter by category"),
    entry_type: Optional[KnowledgeEntryType] = Query(None, description="Filter by entry type")
):
    """Get all knowledge entries with optional filters."""
    try:
        kb_service = get_knowledge_base_service()
        entries = await kb_service.get_all_entries(category=category, entry_type=entry_type)
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get entries: {str(e)}")


@router.get("/preferences", response_model=UserPreferences)
async def get_user_preferences():
    """Get user preferences."""
    try:
        kb_service = get_knowledge_base_service()
        preferences = await kb_service.get_user_preferences()
        return preferences
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")


@router.put("/preferences", response_model=Dict[str, bool])
async def update_user_preferences(preferences: UserPreferences):
    """Update user preferences."""
    try:
        kb_service = get_knowledge_base_service()
        success = await kb_service.update_user_preferences(preferences)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")


class AddPreferenceRequest(BaseModel):
    """Request model for adding new preferences."""
    category: str
    key: str
    value: Any
    description: Optional[str] = None


@router.post("/preferences/add", response_model=Dict[str, bool])
async def add_user_preference(request: AddPreferenceRequest):
    """Add a new user preference."""
    try:
        kb_service = get_knowledge_base_service()
        success = await kb_service.add_user_preference(
            category=request.category,
            key=request.key,
            value=request.value,
            description=request.description
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add preference: {str(e)}")


@router.delete("/preferences/{category}/{key}", response_model=Dict[str, bool])
async def remove_user_preference(category: str, key: str):
    """Remove a user preference."""
    try:
        kb_service = get_knowledge_base_service()
        success = await kb_service.remove_user_preference(category, key)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove preference: {str(e)}")


@router.get("/preferences/categories", response_model=List[str])
async def get_preference_categories():
    """Get all available preference categories."""
    try:
        kb_service = get_knowledge_base_service()
        categories = await kb_service.get_preference_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preference categories: {str(e)}")


@router.post("/interactions", response_model=KnowledgeEntry)
async def add_interaction_history(request: InteractionHistoryRequest):
    """Add an interaction to the history."""
    try:
        kb_service = get_knowledge_base_service()
        entry = await kb_service.add_interaction_history(
            agent_type=request.agent_type,
            user_input=request.user_input,
            agent_response=request.agent_response,
            context=request.context
        )
        return entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add interaction history: {str(e)}")


@router.get("/context", response_model=List[KnowledgeSearchResult])
async def get_relevant_context(
    query: str = Query(..., description="Query to find relevant context for"),
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    max_results: int = Query(5, description="Maximum number of results")
):
    """Get relevant context for an agent query using RAG."""
    try:
        kb_service = get_knowledge_base_service()
        context = await kb_service.get_relevant_context(
            query=query,
            agent_type=agent_type,
            max_results=max_results
        )
        return context
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get relevant context: {str(e)}")


@router.get("/stats", response_model=KnowledgeStats)
async def get_knowledge_stats():
    """Get knowledge base statistics."""
    try:
        kb_service = get_knowledge_base_service()
        stats = await kb_service.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.delete("/clear")
async def clear_knowledge_base():
    """Clear all entries from the knowledge base."""
    try:
        kb_service = get_knowledge_base_service()
        success = await kb_service.clear_all()
        return {"success": success, "message": "Knowledge base cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear knowledge base: {str(e)}")


class EmbeddingVisualizationData(BaseModel):
    """Data model for embedding visualization."""
    entry_id: str
    title: str
    content: str
    category: str
    entry_type: str
    tags: List[str]
    embedding: List[float]
    position_3d: List[float]  # [x, y, z] coordinates for 3D visualization
    created_at: str
    updated_at: str


@router.get("/embeddings/visualization", response_model=List[EmbeddingVisualizationData])
async def get_embeddings_for_visualization():
    """Get all embeddings with 3D coordinates for visualization."""
    try:
        kb_service = get_knowledge_base_service()
        visualization_data = await kb_service.get_embeddings_visualization_data()
        return visualization_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get embeddings visualization data: {str(e)}")


@router.get("/embeddings/{entry_id}/details")
async def get_embedding_details(entry_id: str):
    """Get detailed information about a specific embedding."""
    try:
        kb_service = get_knowledge_base_service()
        details = await kb_service.get_embedding_details(entry_id)
        if not details:
            raise HTTPException(status_code=404, detail="Embedding not found")
        return details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get embedding details: {str(e)}")