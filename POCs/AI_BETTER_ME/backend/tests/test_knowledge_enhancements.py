"""
Tests for the enhanced knowledge base features.
"""

import pytest
import json
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.api.knowledge import router
from app.services.knowledge_base import KnowledgeBaseService
from app.models.knowledge import UserPreferences


@pytest.fixture
def mock_knowledge_service():
    """Mock knowledge base service."""
    service = AsyncMock(spec=KnowledgeBaseService)
    return service


class TestManualPreferences:
    """Test manual preference addition functionality."""
    
    @pytest.mark.asyncio
    async def test_add_user_preference(self, mock_knowledge_service):
        """Test adding a new user preference."""
        mock_knowledge_service.add_user_preference.return_value = True
        
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            from fastapi import FastAPI
            app = FastAPI()
            app.include_router(router)
            client = TestClient(app)
            
            response = client.post("/api/knowledge/preferences/add", json={
                "category": "productivity",
                "key": "custom_setting",
                "value": "test_value",
                "description": "A test preference"
            })
            
            assert response.status_code == 200
            assert response.json()["success"] is True
            
            mock_knowledge_service.add_user_preference.assert_called_once_with(
                category="productivity",
                key="custom_setting", 
                value="test_value",
                description="A test preference"
            )
    
    @pytest.mark.asyncio
    async def test_remove_user_preference(self, mock_knowledge_service):
        """Test removing a user preference."""
        mock_knowledge_service.remove_user_preference.return_value = True
        
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            from fastapi import FastAPI
            app = FastAPI()
            app.include_router(router)
            client = TestClient(app)
            
            response = client.delete("/api/knowledge/preferences/productivity/custom_setting")
            
            assert response.status_code == 200
            assert response.json()["success"] is True
            
            mock_knowledge_service.remove_user_preference.assert_called_once_with(
                "productivity", "custom_setting"
            )
    
    @pytest.mark.asyncio
    async def test_get_preference_categories(self, mock_knowledge_service):
        """Test getting preference categories."""
        mock_knowledge_service.get_preference_categories.return_value = [
            "productivity", "health", "finance", "journal"
        ]
        
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            from fastapi import FastAPI
            app = FastAPI()
            app.include_router(router)
            client = TestClient(app)
            
            response = client.get("/api/knowledge/preferences/categories")
            
            assert response.status_code == 200
            categories = response.json()
            assert "productivity" in categories
            assert "health" in categories
            assert len(categories) == 4


class TestEmbeddingsVisualization:
    """Test 3D embeddings visualization functionality."""
    
    @pytest.mark.asyncio
    async def test_get_embeddings_visualization_data(self, mock_knowledge_service):
        """Test getting embeddings data for visualization."""
        mock_data = [
            {
                "entry_id": "test_id_1",
                "title": "Test Entry 1",
                "content": "Test content 1",
                "category": "productivity",
                "entry_type": "preference",
                "tags": ["test"],
                "embedding": [0.1, 0.2, 0.3],
                "position_3d": [1.0, 2.0, 3.0],
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00"
            }
        ]
        
        mock_knowledge_service.get_embeddings_visualization_data.return_value = mock_data
        
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            from fastapi import FastAPI
            app = FastAPI()
            app.include_router(router)
            client = TestClient(app)
            
            response = client.get("/api/knowledge/embeddings/visualization")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["entry_id"] == "test_id_1"
            assert data[0]["position_3d"] == [1.0, 2.0, 3.0]
    
    @pytest.mark.asyncio
    async def test_get_embedding_details(self, mock_knowledge_service):
        """Test getting detailed information about an embedding."""
        mock_details = {
            "entry": {
                "entry_id": "test_id_1",
                "title": "Test Entry",
                "content": "Test content",
                "category": "productivity",
                "entry_type": "preference",
                "tags": ["test"],
                "metadata": {},
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00"
            },
            "embedding_info": {
                "has_embedding": True,
                "embedding_dimension": 1536,
                "embedding_preview": [0.1, 0.2, 0.3, 0.4, 0.5]
            },
            "similar_entries": [
                {
                    "entry_id": "similar_1",
                    "title": "Similar Entry",
                    "similarity_score": 0.85,
                    "category": "productivity",
                    "entry_type": "preference"
                }
            ],
            "statistics": {
                "content_length": 12,
                "tag_count": 1,
                "metadata_keys": []
            }
        }
        
        mock_knowledge_service.get_embedding_details.return_value = mock_details
        
        with patch('app.api.knowledge.get_knowledge_base_service', return_value=mock_knowledge_service):
            from fastapi import FastAPI
            app = FastAPI()
            app.include_router(router)
            client = TestClient(app)
            
            response = client.get("/api/knowledge/embeddings/test_id_1/details")
            
            assert response.status_code == 200
            details = response.json()
            assert details["entry"]["entry_id"] == "test_id_1"
            assert details["embedding_info"]["has_embedding"] is True
            assert len(details["similar_entries"]) == 1
            assert details["similar_entries"][0]["similarity_score"] == 0.85


class TestKnowledgeBaseServiceEnhancements:
    """Test the enhanced knowledge base service methods."""
    
    @pytest.mark.asyncio
    async def test_add_user_preference_service(self):
        """Test the add_user_preference service method."""
        service = KnowledgeBaseService()
        
        # Mock the get_user_preferences and update_user_preferences methods
        with patch.object(service, 'get_user_preferences') as mock_get, \
             patch.object(service, 'update_user_preferences') as mock_update:
            
            # Mock current preferences
            mock_prefs = UserPreferences()
            mock_get.return_value = mock_prefs
            mock_update.return_value = True
            
            result = await service.add_user_preference(
                category="productivity",
                key="test_key",
                value="test_value",
                description="Test description"
            )
            
            assert result is True
            mock_get.assert_called_once()
            mock_update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_remove_user_preference_service(self):
        """Test the remove_user_preference service method."""
        service = KnowledgeBaseService()
        
        with patch.object(service, 'get_user_preferences') as mock_get, \
             patch.object(service, 'update_user_preferences') as mock_update:
            
            # Mock current preferences with the key to remove
            mock_prefs = UserPreferences()
            mock_prefs.productivity = {"test_key": "test_value"}
            mock_get.return_value = mock_prefs
            mock_update.return_value = True
            
            result = await service.remove_user_preference("productivity", "test_key")
            
            assert result is True
            mock_get.assert_called_once()
            mock_update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_preference_categories_service(self):
        """Test the get_preference_categories service method."""
        service = KnowledgeBaseService()
        
        with patch.object(service, 'get_user_preferences') as mock_get:
            mock_prefs = UserPreferences()
            mock_get.return_value = mock_prefs
            
            categories = await service.get_preference_categories()
            
            # Should return the default UserPreferences categories
            assert isinstance(categories, list)
            assert len(categories) > 0
            mock_get.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__])