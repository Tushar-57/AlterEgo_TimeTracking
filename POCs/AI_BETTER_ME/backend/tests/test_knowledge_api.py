"""
Integration tests for the knowledge base API endpoints.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from main import app
from app.models.knowledge import KnowledgeEntryType


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_knowledge_service():
    """Create a mock knowledge base service."""
    mock_service = AsyncMock()
    
    # Mock create_entry
    async def mock_create_entry(*args, **kwargs):
        from app.models.knowledge import KnowledgeEntry
        return KnowledgeEntry(
            entry_id="test-123",
            entry_type=kwargs.get('entry_type', KnowledgeEntryType.PREFERENCE),
            category=kwargs.get('category', 'test'),
            title=kwargs.get('title', 'Test Entry'),
            content=kwargs.get('content', 'Test content')
        )
    
    mock_service.create_entry = mock_create_entry
    
    # Mock get_entry
    async def mock_get_entry(entry_id):
        if entry_id == "test-123":
            from app.models.knowledge import KnowledgeEntry
            return KnowledgeEntry(
                entry_id="test-123",
                entry_type=KnowledgeEntryType.PREFERENCE,
                category="test",
                title="Test Entry",
                content="Test content"
            )
        return None
    
    mock_service.get_entry = mock_get_entry
    
    # Mock search
    async def mock_search(query):
        from app.models.knowledge import KnowledgeEntry, KnowledgeSearchResult
        entry = KnowledgeEntry(
            entry_id="test-123",
            entry_type=KnowledgeEntryType.PREFERENCE,
            category="test",
            title="Test Entry",
            content="Test content"
        )
        return [KnowledgeSearchResult(entry=entry, similarity_score=0.9)]
    
    mock_service.search = mock_search
    
    # Mock get_user_preferences
    async def mock_get_user_preferences():
        from app.models.knowledge import UserPreferences
        return UserPreferences()
    
    mock_service.get_user_preferences = mock_get_user_preferences
    
    # Mock get_stats
    async def mock_get_stats():
        from app.models.knowledge import KnowledgeStats
        from datetime import datetime
        return KnowledgeStats(
            total_entries=1,
            entries_by_type={KnowledgeEntryType.PREFERENCE: 1},
            entries_by_category={"test": 1},
            last_updated=datetime.utcnow(),
            embedding_model="test_model"
        )
    
    mock_service.get_stats = mock_get_stats
    
    return mock_service


class TestKnowledgeAPI:
    """Test the knowledge base API endpoints."""
    
    def test_create_entry(self, client, mock_knowledge_service):
        """Test creating a knowledge entry via API."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.post("/api/knowledge/entries", json={
                "entry_type": "preference",
                "category": "productivity",
                "title": "Work Schedule",
                "content": "I prefer to work from 9 AM to 5 PM",
                "tags": ["schedule", "work"]
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["entry_id"] == "test-123"
            assert data["title"] == "Test Entry"
            assert data["category"] == "test"
    
    def test_get_entry(self, client, mock_knowledge_service):
        """Test retrieving a knowledge entry via API."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.get("/api/knowledge/entries/test-123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["entry_id"] == "test-123"
            assert data["title"] == "Test Entry"
    
    def test_get_entry_not_found(self, client, mock_knowledge_service):
        """Test retrieving a non-existent entry."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.get("/api/knowledge/entries/nonexistent")
            
            assert response.status_code == 404
    
    def test_search_knowledge_base(self, client, mock_knowledge_service):
        """Test searching the knowledge base via API."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.post("/api/knowledge/search", json={
                "query_text": "work schedule",
                "limit": 5,
                "similarity_threshold": 0.7
            })
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["entry"]["title"] == "Test Entry"
            assert data[0]["similarity_score"] == 0.9
    
    def test_get_user_preferences(self, client, mock_knowledge_service):
        """Test getting user preferences via API."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.get("/api/knowledge/preferences")
            
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == "single_user"
            assert "productivity" in data
            assert "health" in data
    
    def test_get_knowledge_stats(self, client, mock_knowledge_service):
        """Test getting knowledge base statistics via API."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.get("/api/knowledge/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total_entries"] == 1
            assert "preference" in data["entries_by_type"]
            assert "test" in data["entries_by_category"]
    
    def test_get_relevant_context(self, client, mock_knowledge_service):
        """Test getting relevant context via API."""
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            response = client.get("/api/knowledge/context", params={
                "query": "productivity tips",
                "agent_type": "productivity",
                "max_results": 3
            })
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["entry"]["title"] == "Test Entry"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])