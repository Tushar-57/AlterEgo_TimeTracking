"""
Knowledge base service providing CRUD operations and RAG functionality.
"""
import json
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from ..models.knowledge import (
    KnowledgeEntry,
    KnowledgeEntrySubType, 
    KnowledgeEntryType, 
    KnowledgeQuery, 
    KnowledgeSearchResult,
    KnowledgeStats,
    UserPreferences
)
from ..llm.service import get_llm_service
from ..llm.base import EmbeddingRequest
from .vector_store import get_vector_store

logger = logging.getLogger(__name__)


class KnowledgeBaseService:
    """Service for managing knowledge base operations and RAG functionality."""
    
    def __init__(self):
        self.vector_store = get_vector_store()
        self._user_preferences: Optional[UserPreferences] = None
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using the configured LLM provider."""
        try:
            llm_service = await get_llm_service()
            
            # Check if service is properly initialized
            if not llm_service:
                logger.warning("LLM service not initialized, using dummy embedding")
                # Return a dummy embedding to allow functionality to continue
                return [0.0] * 1536  # Standard embedding dimension for compatibility
                
            request = EmbeddingRequest(text=text)
            response = await llm_service.generate_embedding(request)
            return response.embedding
        except ImportError as e:
            logger.warning(f"Missing dependencies for embedding generation: {e}")
            # Return a dummy embedding for graceful degradation
            return [0.0] * 1536
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
            # Return a dummy embedding for graceful degradation
            return [0.0] * 1536

    async def search_knowledge(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant knowledge entries based on a query."""
        try:
            # Generate embedding for the query
            query_embedding = await self._generate_embedding(query)
            
            # Search the vector store
            results = self.vector_store.search(query_embedding, limit)
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "content": result.get("content", ""),
                    "score": result.get("score", 0.0),
                    "metadata": result.get("metadata", {})
                })
            
            return formatted_results
            
        except Exception as e:
            logger.warning(f"Knowledge search failed: {e}")
            # Return empty results for graceful degradation
            return []
    
    async def create_entry(self, 
                          entry_type: KnowledgeEntryType,
                          entry_sub_type:KnowledgeEntrySubType,
                          category: str,
                          title: str,
                          content: str,
                          metadata: Optional[Dict[str, Any]] = None,
                          tags: Optional[List[str]] = None) -> KnowledgeEntry:
        """
        Create a new knowledge base entry.
        
        Args:
            entry_type: Type of the entry
            category: Category of the entry
            title: Human-readable title
            content: The actual content
            metadata: Additional metadata
            tags: Tags for categorization
            
        Returns:
            The created knowledge entry
        """
        try:
            # Generate unique ID
            entry_id = str(uuid.uuid4())
            
            # Create entry
            entry = KnowledgeEntry(
                entry_id=entry_id,
                entry_type=entry_type,
                category=category,
                entry_sub_type=entry_sub_type,
                title=title,
                content=content,
                metadata=metadata or {},
                tags=tags or []
            )
            
            # Generate embedding for the content
            embedding_text = f"{title} {content} {' '.join(tags or [])}"
            embedding = await self._generate_embedding(embedding_text)
            
            # Add to vector store
            self.vector_store.add_entry(entry, embedding)
            
            logger.info(f"Created knowledge entry: {entry_id}")
            return entry
        except Exception as e:
            logger.error(f"Failed to create knowledge entry: {e}")
            raise
    
    async def get_entry(self, entry_id: str) -> Optional[KnowledgeEntry]:
        """
        Retrieve a knowledge entry by ID.
        
        Args:
            entry_id: ID of the entry to retrieve
            
        Returns:
            The knowledge entry if found, None otherwise
        """
        try:
            return self.vector_store.get_entry(entry_id)
        except Exception as e:
            logger.error(f"Failed to get knowledge entry {entry_id}: {e}")
            return None
    
    async def update_entry(self, 
                          entry_id: str,
                          title: Optional[str] = None,
                          content: Optional[str] = None,
                          metadata: Optional[Dict[str, Any]] = None,
                          tags: Optional[List[str]] = None) -> Optional[KnowledgeEntry]:
        """
        Update an existing knowledge entry.
        
        Args:
            entry_id: ID of the entry to update
            title: New title (optional)
            content: New content (optional)
            metadata: New metadata (optional)
            tags: New tags (optional)
            
        Returns:
            The updated entry if successful, None otherwise
        """
        try:
            # Get existing entry
            existing_entry = self.vector_store.get_entry(entry_id)
            if not existing_entry:
                logger.warning(f"Entry {entry_id} not found for update")
                return None
            
            # Update fields
            updated_entry = existing_entry.model_copy()
            if title is not None:
                updated_entry.title = title
            if content is not None:
                updated_entry.content = content
            if metadata is not None:
                updated_entry.metadata.update(metadata)
            if tags is not None:
                updated_entry.tags = tags
            
            updated_entry.updated_at = datetime.utcnow()
            
            # Generate new embedding
            embedding_text = f"{updated_entry.title} {updated_entry.content} {' '.join(updated_entry.tags)}"
            embedding = await self._generate_embedding(embedding_text)
            
            # Update in vector store
            self.vector_store.update_entry(updated_entry, embedding)
            
            logger.info(f"Updated knowledge entry: {entry_id}")
            return updated_entry
        except Exception as e:
            logger.error(f"Failed to update knowledge entry {entry_id}: {e}")
            return None
    
    async def delete_entry(self, entry_id: str) -> bool:
        """
        Delete a knowledge entry.
        
        Args:
            entry_id: ID of the entry to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            success = self.vector_store.remove_entry(entry_id)
            if success:
                logger.info(f"Deleted knowledge entry: {entry_id}")
            else:
                logger.warning(f"Entry {entry_id} not found for deletion")
            return success
        except Exception as e:
            logger.error(f"Failed to delete knowledge entry {entry_id}: {e}")
            return False
    
    async def search(self, query: KnowledgeQuery) -> List[KnowledgeSearchResult]:
        """
        Search the knowledge base using RAG.
        
        Args:
            query: The search query
            
        Returns:
            List of search results
        """
        try:
            # Generate embedding for query
            query_embedding = await self._generate_embedding(query.query_text)
            
            # Search vector store
            results = self.vector_store.search(
                query_embedding=query_embedding,
                k=query.limit,
                similarity_threshold=query.similarity_threshold
            )
            
            # Filter by categories, types, and tags if specified
            filtered_results = []
            for result in results:
                entry = result.entry
                
                # Filter by categories
                if query.categories and entry.category not in query.categories:
                    continue
                
                # Filter by entry types
                if query.entry_types and entry.entry_type not in query.entry_types:
                    continue
                
                # Filter by tags
                if query.tags and not any(tag in entry.tags for tag in query.tags):
                    continue
                
                filtered_results.append(result)
            
            logger.debug(f"Knowledge search returned {len(filtered_results)} results")
            return filtered_results
        except ImportError as e:
            logger.warning(f"Knowledge search failed due to missing dependencies: {e}")
            return []
        except Exception as e:
            logger.warning(f"Failed to search knowledge base: {e}")
            return []
    
    async def get_all_entries(self, 
                             category: Optional[str] = None,
                             entry_type: Optional[KnowledgeEntryType] = None) -> List[KnowledgeEntry]:
        """
        Get all knowledge entries, optionally filtered by category or type.
        
        Args:
            category: Filter by category (optional)
            entry_type: Filter by entry type (optional)
            
        Returns:
            List of knowledge entries
        """
        try:
            all_entries = self.vector_store.get_all_entries()
            
            # Apply filters
            filtered_entries = []
            for entry in all_entries:
                if category and entry.category != category:
                    continue
                if entry_type and entry.entry_type != entry_type:
                    continue
                filtered_entries.append(entry)
            
            return filtered_entries
        except Exception as e:
            logger.error(f"Failed to get all entries: {e}")
            return []
    
    async def get_user_preferences(self) -> UserPreferences:
        """
        Get user preferences, loading from knowledge base or creating defaults.
        
        Returns:
            User preferences object
        """
        try:
            if self._user_preferences is None:
                    import os, json
                    prefs_path = os.path.join(os.path.dirname(__file__), "user_preferences.json")
                    try:
                        if os.path.exists(prefs_path):
                            with open(prefs_path) as f:
                                data = f.read().strip()
                                if not data:
                                    raise ValueError("Empty preferences file")
                                prefs_dict = json.loads(data)
                                return UserPreferences(**prefs_dict)
                    except Exception as e:
                        logger.warning(f"Failed to parse stored preferences: {e}. Using defaults.")
                    # Always fallback to defaults
                    return UserPreferences()
            return self._user_preferences
        except Exception as e:
            logger.error(f"Failed to get user preferences: {e}")
            return UserPreferences()
                # ...existing code...
    
    async def update_user_preferences(self, preferences: UserPreferences) -> bool:
        """
        Update user preferences in the knowledge base.
        
        Args:
            preferences: Updated preferences
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self._user_preferences = preferences
            return await self._save_user_preferences()
        except Exception as e:
            logger.error(f"Failed to update user preferences: {e}")
            return False
    
    async def add_user_preference(self, category: str, key: str, value: Any, description: Optional[str] = None) -> bool:
        """
        Add a new user preference.
        
        Args:
            category: Category of the preference (e.g., 'productivity', 'health')
            key: Key name for the preference
            value: Value of the preference
            description: Optional description of the preference
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get current preferences
            current_prefs = await self.get_user_preferences()
            
            # Convert to dict for manipulation
            prefs_dict = current_prefs.model_dump()
            
            # Ensure category exists
            if category not in prefs_dict:
                prefs_dict[category] = {}
            
            # Add the new preference
            prefs_dict[category][key] = value
            
            # If description provided, store it in metadata
            if description:
                metadata_key = f"__{key}_description"
                prefs_dict[category][metadata_key] = description
            
            # Update preferences
            updated_prefs = UserPreferences(**prefs_dict)
            success = await self.update_user_preferences(updated_prefs)
            
            if success:
                logger.info(f"Added user preference: {category}.{key} = {value}")
            
            return success
        except Exception as e:
            logger.error(f"Failed to add user preference {category}.{key}: {e}")
            return False
    
    async def remove_user_preference(self, category: str, key: str) -> bool:
        """
        Remove a user preference.
        
        Args:
            category: Category of the preference
            key: Key name for the preference
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get current preferences
            current_prefs = await self.get_user_preferences()
            
            # Convert to dict for manipulation
            prefs_dict = current_prefs.model_dump()
            
            # Check if category and key exist
            if category not in prefs_dict or key not in prefs_dict[category]:
                logger.warning(f"Preference {category}.{key} not found for removal")
                return False
            
            # Remove the preference
            del prefs_dict[category][key]
            
            # Also remove description if it exists
            description_key = f"__{key}_description"
            if description_key in prefs_dict[category]:
                del prefs_dict[category][description_key]
            
            # Update preferences
            updated_prefs = UserPreferences(**prefs_dict)
            success = await self.update_user_preferences(updated_prefs)
            
            if success:
                logger.info(f"Removed user preference: {category}.{key}")
            
            return success
        except Exception as e:
            logger.error(f"Failed to remove user preference {category}.{key}: {e}")
            return False
    
    async def get_preference_categories(self) -> List[str]:
        """
        Get all available preference categories.
        
        Returns:
            List of preference category names
        """
        try:
            current_prefs = await self.get_user_preferences()
            prefs_dict = current_prefs.model_dump()
            return list(prefs_dict.keys())
        except Exception as e:
            logger.error(f"Failed to get preference categories: {e}")
            return []
    
    async def _save_user_preferences(self) -> bool:
        """Save user preferences to knowledge base."""
        try:
            if not self._user_preferences:
                return False
            
            # Check if preferences entry already exists
            existing_entries = await self.get_all_entries(
                category="system",
                entry_type=KnowledgeEntryType.PREFERENCE
            )
            
            prefs_json = self._user_preferences.model_dump_json(indent=2)
            
            if existing_entries:
                # Update existing entry
                entry = existing_entries[0]
                await self.update_entry(
                    entry_id=entry.entry_id,
                    content=prefs_json,
                    metadata={"last_updated": datetime.utcnow().isoformat()}
                )
            else:
                # Create new entry
                await self.create_entry(
                    entry_type=KnowledgeEntryType.PREFERENCE,
                    category="system",
                    entry_sub_type=KnowledgeEntrySubType.OTHER_PREFERENCE,
                    title="User Preferences",
                    content=prefs_json,
                    metadata={"created": datetime.utcnow().isoformat()},
                    tags=["preferences", "settings", "configuration"]
                )
            
            return True
        except Exception as e:
            logger.error(f"Failed to save user preferences: {e}")
            return False
    
    async def add_interaction_history(self, 
                                    agent_type: str,
                                    user_input: str,
                                    agent_response: str,
                                    context: Optional[Dict[str, Any]] = None) -> KnowledgeEntry:
        """
        Add an interaction to the history for learning purposes.
        
        Args:
            agent_type: Type of agent that handled the interaction
            user_input: User's input
            agent_response: Agent's response
            context: Additional context information
        
        Returns:
            The created interaction entry
        """
        try:
            interaction_content = f"User: {user_input}\nAgent ({agent_type}): {agent_response}"
            return await self.create_entry(
                entry_type=KnowledgeEntryType.INTERACTION,
                entry_sub_type=KnowledgeEntrySubType.PERSONAL_INTERACTION,
                category=agent_type,
                title=f"Interaction with {agent_type}",
                content=interaction_content,
                metadata={
                    "agent_type": agent_type,
                    "timestamp": datetime.utcnow().isoformat(),
                    "context": context or {},
                    "user_input_length": len(user_input),
                    "response_length": len(agent_response)
                },
                tags=["interaction", "history", agent_type]
            )
        except Exception as e:
            logger.error(f"Failed to add interaction history: {e}")
            raise

    async def extract_and_store_preferences(self, 
                                          user_input: str, 
                                          agent_type: str,
                                          agent_response: str) -> List[KnowledgeEntry]:
        """
        Extract and store user preferences from conversation.
        
        Args:
            user_input: User's input
            agent_type: Type of agent handling the request
            agent_response: Agent's response
            
        Returns:
            List of created preference entries
        """
        try:
            # Use LLM to extract preferences from the conversation
            llm_service = await get_llm_service()
            if not llm_service:
                logger.warning("LLM service not available for preference extraction")
                return []
            
            # Simplified and faster preference extraction prompt
            extraction_prompt = f"""
            Extract user preferences from this conversation:

            User: {user_input}
            Agent: {agent_response}

            Find explicit preferences like:
            - Foods they like/dislike
            - Exercise habits
            - Goals mentioned
            - Schedule preferences
            - Budget constraints

            Return JSON list:
            [{{"category": "health", "key": "preference_name", "value": "preference_value"}}]

            Return [] if no clear preferences found.
            """
            
            from ..llm.base import CompletionRequest, ChatMessage
            request = CompletionRequest(
                messages=[ChatMessage(role="user", content=extraction_prompt)],
                temperature=0.1,
                max_tokens=500  # Reduced for faster response
            )
            
            response = await llm_service.chat_completion(request)
            
            # Parse the response with better error handling
            try:
                import json
                # Try to extract JSON from response
                response_text = response.content.strip()
                
                # Handle cases where response might have extra text
                if '[' in response_text and ']' in response_text:
                    start = response_text.find('[')
                    end = response_text.rfind(']') + 1
                    json_text = response_text[start:end]
                else:
                    json_text = response_text
                
                preferences_data = json.loads(json_text)
                created_entries = []
                
                # Handle simplified format
                for pref in preferences_data:
                    if isinstance(pref, dict) and 'category' in pref and 'key' in pref and 'value' in pref:
                        # Store preference using the existing method
                        success = await self.add_user_preference(
                            category=pref['category'],
                            key=pref['key'],
                            value=pref['value'],
                            description=f"Extracted from conversation: {pref['value']}"
                        )
                        if success:
                            # Create a knowledge entry for tracking
                            entry = await self.create_entry(
                                entry_type=KnowledgeEntryType.PREFERENCE,
                                entry_sub_type=KnowledgeEntrySubType.PERSONAL_PREFERENCE,
                                category=pref['category'],
                                title=f"{pref['key']} preference",
                                content=f"User preference: {pref['key']} = {pref['value']}",
                                metadata={
                                    "extracted_from_interaction": True,
                                    "agent_type": agent_type,
                                    "timestamp": datetime.utcnow().isoformat()
                                },
                                tags=[pref['category'], "preference", "extracted", agent_type]
                            )
                            if entry:
                                created_entries.append(entry)
                
                logger.info(f"Successfully extracted {len(created_entries)} preferences")
                return created_entries
                
            except (json.JSONDecodeError, KeyError, TypeError) as e:
                logger.warning(f"Failed to parse preferences extraction response: {e}")
                logger.debug(f"Response content: {response.content}")
                return []
                
        except Exception as e:
            logger.error(f"Failed to extract preferences: {e}")
            return []

    async def get_contextual_knowledge_for_agent(self, 
                                                user_input: str,
                                                agent_type: str,
                                                max_results: int = 10) -> Dict[str, Any]:
        """
        Get relevant knowledge context for an agent based on user input.
        
        Args:
            user_input: User's current input
            agent_type: Type of agent requesting context
            max_results: Maximum number of results per category
            
        Returns:
            Dictionary containing relevant context organized by type
        """
        try:
            # Get user preferences for this agent type
            preferences = await self.get_user_preferences()
            agent_preferences = getattr(preferences, agent_type.lower(), {})
            
            # Search for relevant interactions
            search_query = KnowledgeQuery(
                query_text=user_input,
                categories=[agent_type],
                entry_types=[KnowledgeEntryType.INTERACTION, KnowledgeEntryType.PREFERENCE, KnowledgeEntryType.PATTERN],
                limit=max_results,
                similarity_threshold=0.6
            )
            
            search_results = await self.search(search_query)
            
            # Search for cross-category relevant information
            general_search = KnowledgeQuery(
                query_text=user_input,
                limit=max_results,
                similarity_threshold=0.7
            )
            
            general_results = await self.search(general_search)
            
            # Organize results by type
            context = {
                "agent_preferences": agent_preferences,
                "relevant_interactions": [
                    {
                        "content": result.entry.content,
                        "metadata": result.entry.metadata,
                        "similarity": result.similarity_score,
                        "created_at": result.entry.created_at.isoformat()
                    }
                    for result in search_results 
                    if result.entry.entry_type == KnowledgeEntryType.INTERACTION
                ][:5],
                "user_preferences": [
                    {
                        "content": result.entry.content,
                        "category": result.entry.category,
                        "metadata": result.entry.metadata,
                        "similarity": result.similarity_score
                    }
                    for result in search_results 
                    if result.entry.entry_type == KnowledgeEntryType.PREFERENCE
                ][:5],
                "patterns_and_insights": [
                    {
                        "content": result.entry.content,
                        "metadata": result.entry.metadata,
                        "similarity": result.similarity_score
                    }
                    for result in general_results
                    if result.entry.entry_type in [KnowledgeEntryType.PATTERN, KnowledgeEntryType.INSIGHT]
                ][:3],
                "context_summary": self._generate_context_summary(user_input, agent_type, search_results)
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Failed to get contextual knowledge: {e}")
            return {
                "agent_preferences": {},
                "relevant_interactions": [],
                "user_preferences": [],
                "patterns_and_insights": [],
                "context_summary": "Unable to retrieve context due to system error."
            }

    def _generate_context_summary(self, user_input: str, agent_type: str, search_results: List) -> str:
        """Generate a context summary for the agent."""
        if not search_results:
            return f"No previous context found for {agent_type} requests."
        
        relevant_count = len([r for r in search_results if r.similarity_score > 0.7])
        categories = set(r.entry.category for r in search_results)
        
        summary = f"Found {len(search_results)} related entries ({relevant_count} highly relevant) "
        summary += f"across categories: {', '.join(categories)}. "
        
        # Get most recent interaction
        recent_interactions = [r for r in search_results if r.entry.entry_type == KnowledgeEntryType.INTERACTION]
        if recent_interactions:
            most_recent = max(recent_interactions, key=lambda x: x.entry.created_at)
            summary += f"Most recent similar interaction was on {most_recent.entry.created_at.strftime('%Y-%m-%d')}."
        
        return summary
    
    async def get_relevant_context(self, 
                                  query: str,
                                  agent_type: Optional[str] = None,
                                  max_results: int = 5) -> List[KnowledgeSearchResult]:
        """
        Get relevant context for an agent query using RAG.
        
        Args:
            query: The query to find context for
            agent_type: Filter by specific agent type (optional)
            max_results: Maximum number of context entries to return
            
        Returns:
            List of relevant knowledge entries
        """
        try:
            search_query = KnowledgeQuery(
                query_text=query,
                categories=[agent_type] if agent_type else None,
                limit=max_results,
                similarity_threshold=0.6
            )
            
            return await self.search(search_query)
        except Exception as e:
            logger.error(f"Failed to get relevant context: {e}")
            return []
    
    async def get_stats(self) -> KnowledgeStats:
        """
        Get statistics about the knowledge base.
        
        Returns:
            Knowledge base statistics
        """
        try:
            all_entries = self.vector_store.get_all_entries()
            
            # Count by type
            entries_by_type = {}
            for entry_type in KnowledgeEntryType:
                entries_by_type[entry_type] = sum(1 for e in all_entries if e.entry_type == entry_type)
            
            # Count by category
            entries_by_category = {}
            for entry in all_entries:
                entries_by_category[entry.category] = entries_by_category.get(entry.category, 0) + 1
            
            # Get current LLM model for embedding info
            llm_service = await get_llm_service()
            current_provider = llm_service.get_current_provider()
            embedding_model = f"{current_provider}_embedding" if current_provider else "unknown"
            
            return KnowledgeStats(
                total_entries=len(all_entries),
                entries_by_type=entries_by_type,
                entries_by_category=entries_by_category,
                last_updated=max((e.updated_at for e in all_entries), default=datetime.utcnow()),
                embedding_model=embedding_model
            )
        except Exception as e:
            logger.error(f"Failed to get knowledge base stats: {e}")
            return KnowledgeStats(
                total_entries=0,
                entries_by_type={},
                entries_by_category={},
                last_updated=datetime.utcnow(),
                embedding_model="unknown"
            )
    
    async def clear_all(self) -> bool:
        """
        Clear all entries from the knowledge base.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.vector_store.clear()
            self._user_preferences = None
            logger.info("Cleared all knowledge base entries")
            return True
        except Exception as e:
            logger.error(f"Failed to clear knowledge base: {e}")
            return False
    
    async def get_embeddings_visualization_data(self) -> List[Dict[str, Any]]:
        """
        Get all embeddings with 3D coordinates for visualization.
        
        Returns:
            List of embedding visualization data
        """
        try:
            # Get all entries and their embeddings
            all_entries = self.vector_store.get_all_entries()
            embeddings_data = []
            
            if not all_entries:
                return []
            
            # Get embeddings from vector store
            embeddings = []
            entries_info = []
            
            for entry in all_entries:
                # Get embedding from vector store
                embedding = self.vector_store.get_embedding(entry.entry_id)
                if embedding is not None:
                    embeddings.append(embedding)
                    entries_info.append(entry)
            
            if not embeddings:
                return []
            
            # Try to use PCA for dimensionality reduction, fallback to simple projection
            try:
                from sklearn.decomposition import PCA
                import numpy as np
                
                # Reduce dimensionality to 3D using PCA
                embeddings_array = np.array(embeddings)
                pca = PCA(n_components=3)
                positions_3d = pca.fit_transform(embeddings_array)
                
                # Normalize positions to a reasonable range for visualization
                positions_3d = positions_3d * 10  # Scale up for better visualization
                
                logger.info("Using PCA for dimensionality reduction")
                
            except Exception as pca_error:
                logger.warning(f"PCA failed ({pca_error}), using fallback projection")
                
                # Fallback: use first 3 dimensions of embeddings or create simple projection
                positions_3d = []
                for i, embedding in enumerate(embeddings):
                    # Use first 3 dimensions if available, otherwise create simple 2D projection
                    if len(embedding) >= 3:
                        x, y, z = embedding[0] * 50, embedding[1] * 50, embedding[2] * 50
                    else:
                        # Create a simple circular arrangement
                        import math
                        angle = (i / len(embeddings)) * 2 * math.pi
                        radius = 20
                        x = radius * math.cos(angle)
                        y = radius * math.sin(angle)
                        z = (i % 5 - 2) * 5  # Vary height
                    
                    positions_3d.append([x, y, z])
            
            # Create visualization data with similarity connections
            for i, (entry, position) in enumerate(zip(entries_info, positions_3d)):
                # Calculate similarities to other entries for connection data
                similarities = []
                current_embedding = embeddings[i]
                
                for j, other_embedding in enumerate(embeddings):
                    if i != j:
                        # Calculate cosine similarity
                        import numpy as np
                        similarity = np.dot(current_embedding, other_embedding) / (
                            np.linalg.norm(current_embedding) * np.linalg.norm(other_embedding)
                        )
                        if similarity > 0.7:  # Only include high similarity connections
                            similarities.append({
                                "target_id": entries_info[j].entry_id,
                                "similarity": float(similarity)
                            })
                
                visualization_data = {
                    "entry_id": entry.entry_id,
                    "title": entry.title,
                    "content": entry.content[:200] + "..." if len(entry.content) > 200 else entry.content,
                    "category": entry.category,
                    "entry_type": entry.entry_type.value,
                    "tags": entry.tags,
                    "embedding": embeddings[i][:10] if len(embeddings[i]) > 10 else embeddings[i],  # First 10 dims for preview
                    "position_3d": position if isinstance(position, list) else position.tolist(),
                    "created_at": entry.created_at.isoformat(),
                    "updated_at": entry.updated_at.isoformat(),
                    "similarities": similarities[:5]  # Top 5 most similar entries
                }
                embeddings_data.append(visualization_data)
            
            logger.info(f"Generated visualization data for {len(embeddings_data)} embeddings")
            return embeddings_data
            
        except Exception as e:
            logger.error(f"Failed to get embeddings visualization data: {e}")
            return []
    
    async def get_embedding_details(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific embedding.
        
        Args:
            entry_id: ID of the entry to get details for
            
        Returns:
            Detailed embedding information or None if not found
        """
        try:
            entry = self.vector_store.get_entry(entry_id)
            if not entry:
                return None
            
            embedding = self.vector_store.get_embedding(entry_id)
            
            # Find similar entries
            if embedding:
                similar_results = self.vector_store.search(
                    query_embedding=embedding,
                    k=6,  # Get 6 to exclude the entry itself
                    similarity_threshold=0.5
                )
                
                # Filter out the entry itself
                similar_entries = [
                    {
                        "entry_id": result.entry.entry_id,
                        "title": result.entry.title,
                        "similarity_score": result.similarity_score,
                        "category": result.entry.category,
                        "entry_type": result.entry.entry_type.value
                    }
                    for result in similar_results
                    if result.entry.entry_id != entry_id
                ][:5]  # Top 5 similar entries
            else:
                similar_entries = []
            
            details = {
                "entry": {
                    "entry_id": entry.entry_id,
                    "title": entry.title,
                    "content": entry.content,
                    "category": entry.category,
                    "entry_type": entry.entry_type.value,
                    "tags": entry.tags,
                    "metadata": entry.metadata,
                    "created_at": entry.created_at.isoformat(),
                    "updated_at": entry.updated_at.isoformat()
                },
                "embedding_info": {
                    "has_embedding": embedding is not None,
                    "embedding_dimension": len(embedding) if embedding else 0,
                    "embedding_preview": embedding[:10] if embedding else None  # First 10 dimensions
                },
                "similar_entries": similar_entries,
                "statistics": {
                    "content_length": len(entry.content),
                    "tag_count": len(entry.tags),
                    "metadata_keys": list(entry.metadata.keys())
                }
            }
            
            return details
            
        except Exception as e:
            logger.error(f"Failed to get embedding details for {entry_id}: {e}")
            return None


# Global service instance
_knowledge_base_service: Optional[KnowledgeBaseService] = None


def get_knowledge_base_service() -> KnowledgeBaseService:
    """Get the global knowledge base service instance."""
    global _knowledge_base_service
    
    if _knowledge_base_service is None:
        _knowledge_base_service = KnowledgeBaseService()
    
    return _knowledge_base_service