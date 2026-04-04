"""
FAISS-based vector store for knowledge base embeddings.
"""

import os
import pickle
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import faiss
from datetime import datetime

from ..models.knowledge import KnowledgeEntry, KnowledgeSearchResult

logger = logging.getLogger(__name__)


class VectorStore:
    """FAISS-based vector store for storing and retrieving embeddings."""
    
    def __init__(self, dimension: int = 1536, index_path: str = "data/vector_index"):
        """
        Initialize the vector store.
        
        Args:
            dimension: Dimension of the embeddings (1536 for standardized embeddings across providers)
            index_path: Path to store the FAISS index and metadata
        """
        self.dimension = dimension
        self.index_path = index_path
        self.metadata_path = f"{index_path}_metadata.pkl"
        
        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        self.entry_metadata: Dict[int, KnowledgeEntry] = {}
        self.id_to_faiss_id: Dict[str, int] = {}
        self.next_faiss_id = 0
        
        # Load existing index if available
        self._load_index()
    
    def _load_index(self) -> None:
        """Load existing FAISS index and metadata from disk."""
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
                # Load FAISS index
                self.index = faiss.read_index(self.index_path)
                
                # Load metadata
                with open(self.metadata_path, 'rb') as f:
                    data = pickle.load(f)
                    self.entry_metadata = data.get('entry_metadata', {})
                    self.id_to_faiss_id = data.get('id_to_faiss_id', {})
                    self.next_faiss_id = data.get('next_faiss_id', 0)
                
                logger.info(f"Loaded vector store with {self.index.ntotal} entries")
            else:
                logger.info("No existing vector store found, starting fresh")
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            # Reset to empty state on error
            self.index = faiss.IndexFlatIP(self.dimension)
            self.entry_metadata = {}
            self.id_to_faiss_id = {}
            self.next_faiss_id = 0
    
    def _save_index(self) -> None:
        """Save FAISS index and metadata to disk."""
        try:
            # Save FAISS index
            faiss.write_index(self.index, self.index_path)
            
            # Save metadata
            metadata = {
                'entry_metadata': self.entry_metadata,
                'id_to_faiss_id': self.id_to_faiss_id,
                'next_faiss_id': self.next_faiss_id
            }
            
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(metadata, f)
            
            logger.debug(f"Saved vector store with {self.index.ntotal} entries")
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")
            raise
    
    def add_entry(self, entry: KnowledgeEntry, embedding: List[float]) -> None:
        """
        Add a knowledge entry with its embedding to the vector store.
        
        Args:
            entry: The knowledge entry to add
            embedding: The embedding vector for the entry
        """
        try:
            # Normalize embedding for cosine similarity
            embedding_array = np.array([embedding], dtype=np.float32)
            faiss.normalize_L2(embedding_array)
            
            # Add to FAISS index
            faiss_id = self.next_faiss_id
            self.index.add(embedding_array)
            
            # Store metadata
            self.entry_metadata[faiss_id] = entry
            self.id_to_faiss_id[entry.entry_id] = faiss_id
            self.next_faiss_id += 1
            
            # Update entry with embedding
            entry.embedding = embedding
            
            # Save to disk
            self._save_index()
            
            logger.debug(f"Added entry {entry.entry_id} to vector store")
        except Exception as e:
            logger.error(f"Failed to add entry to vector store: {e}")
            raise
    
    def update_entry(self, entry: KnowledgeEntry, embedding: List[float]) -> None:
        """
        Update an existing entry in the vector store.
        
        Args:
            entry: The updated knowledge entry
            embedding: The new embedding vector
        """
        try:
            if entry.entry_id in self.id_to_faiss_id:
                # Remove old entry
                self.remove_entry(entry.entry_id)
            
            # Add updated entry
            self.add_entry(entry, embedding)
            
            logger.debug(f"Updated entry {entry.entry_id} in vector store")
        except Exception as e:
            logger.error(f"Failed to update entry in vector store: {e}")
            raise
    
    def remove_entry(self, entry_id: str) -> bool:
        """
        Remove an entry from the vector store.
        
        Args:
            entry_id: ID of the entry to remove
            
        Returns:
            True if entry was removed, False if not found
        """
        try:
            if entry_id not in self.id_to_faiss_id:
                return False
            
            faiss_id = self.id_to_faiss_id[entry_id]
            
            # FAISS doesn't support direct removal, so we rebuild the index
            # This is acceptable for a single-user system with moderate data
            remaining_entries = []
            remaining_embeddings = []
            
            for fid, entry in self.entry_metadata.items():
                if fid != faiss_id and entry.embedding:
                    remaining_entries.append(entry)
                    remaining_embeddings.append(entry.embedding)
            
            # Rebuild index
            self.index = faiss.IndexFlatIP(self.dimension)
            self.entry_metadata = {}
            self.id_to_faiss_id = {}
            self.next_faiss_id = 0
            
            # Re-add remaining entries
            for entry, embedding in zip(remaining_entries, remaining_embeddings):
                self.add_entry(entry, embedding)
            
            logger.debug(f"Removed entry {entry_id} from vector store")
            return True
        except Exception as e:
            logger.error(f"Failed to remove entry from vector store: {e}")
            return False
    
    def search(self, query_embedding: List[float], k: int = 10, 
               similarity_threshold: float = 0.7) -> List[KnowledgeSearchResult]:
        """
        Search for similar entries in the vector store.
        
        Args:
            query_embedding: The query embedding vector
            k: Number of results to return
            similarity_threshold: Minimum similarity score (0-1)
            
        Returns:
            List of search results with similarity scores
        """
        try:
            if self.index.ntotal == 0:
                return []
            
            # Normalize query embedding
            query_array = np.array([query_embedding], dtype=np.float32)
            faiss.normalize_L2(query_array)
            
            # Search in FAISS index
            scores, indices = self.index.search(query_array, min(k, self.index.ntotal))
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:  # No more results
                    break
                
                similarity_score = float(score)
                if similarity_score >= similarity_threshold:
                    entry = self.entry_metadata.get(idx)
                    if entry:
                        results.append(KnowledgeSearchResult(
                            entry=entry,
                            similarity_score=similarity_score
                        ))
            
            logger.debug(f"Vector search returned {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Failed to search vector store: {e}")
            return []
    
    def get_entry(self, entry_id: str) -> Optional[KnowledgeEntry]:
        """
        Get a specific entry by ID.
        
        Args:
            entry_id: ID of the entry to retrieve
            
        Returns:
            The knowledge entry if found, None otherwise
        """
        try:
            if entry_id in self.id_to_faiss_id:
                faiss_id = self.id_to_faiss_id[entry_id]
                return self.entry_metadata.get(faiss_id)
            return None
        except Exception as e:
            logger.error(f"Failed to get entry from vector store: {e}")
            return None
    
    def get_embedding(self, entry_id: str) -> Optional[List[float]]:
        """
        Get the embedding for a specific entry.
        
        Args:
            entry_id: ID of the entry to get embedding for
            
        Returns:
            The embedding vector if found, None otherwise
        """
        try:
            entry = self.get_entry(entry_id)
            if entry and hasattr(entry, 'embedding') and entry.embedding:
                return entry.embedding
            return None
        except Exception as e:
            logger.error(f"Failed to get embedding from vector store: {e}")
            return None
    
    def get_all_embeddings(self) -> Dict[str, List[float]]:
        """
        Get all embeddings in the vector store.
        
        Returns:
            Dictionary mapping entry IDs to their embeddings
        """
        try:
            embeddings = {}
            for entry_id, faiss_id in self.id_to_faiss_id.items():
                entry = self.entry_metadata.get(faiss_id)
                if entry and hasattr(entry, 'embedding') and entry.embedding:
                    embeddings[entry_id] = entry.embedding
            return embeddings
        except Exception as e:
            logger.error(f"Failed to get all embeddings from vector store: {e}")
            return {}
    
    def get_all_entries(self) -> List[KnowledgeEntry]:
        """
        Get all entries in the vector store.
        
        Returns:
            List of all knowledge entries
        """
        try:
            return list(self.entry_metadata.values())
        except Exception as e:
            logger.error(f"Failed to get all entries from vector store: {e}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the vector store.
        
        Returns:
            Dictionary with statistics
        """
        try:
            return {
                'total_entries': self.index.ntotal,
                'dimension': self.dimension,
                'index_size_mb': os.path.getsize(self.index_path) / (1024 * 1024) if os.path.exists(self.index_path) else 0,
                'last_updated': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get vector store stats: {e}")
            return {}
    
    def clear(self) -> None:
        """Clear all entries from the vector store."""
        try:
            self.index = faiss.IndexFlatIP(self.dimension)
            self.entry_metadata = {}
            self.id_to_faiss_id = {}
            self.next_faiss_id = 0
            self._save_index()
            logger.info("Cleared vector store")
        except Exception as e:
            logger.error(f"Failed to clear vector store: {e}")
            raise


# Global vector store instance
_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get the global vector store instance."""
    global _vector_store
    
    if _vector_store is None:
        _vector_store = VectorStore()
    
    return _vector_store