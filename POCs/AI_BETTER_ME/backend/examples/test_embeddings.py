"""
Test script to check embeddings generation and visualization data.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.knowledge_base import get_knowledge_base_service
from app.services.vector_store import get_vector_store


async def test_embeddings():
    """Test embeddings and visualization data."""
    print("🔍 Testing Embeddings and Visualization Data")
    print("=" * 50)
    
    kb_service = get_knowledge_base_service()
    vector_store = get_vector_store()
    
    # Check what entries we have
    all_entries = vector_store.get_all_entries()
    print(f"📊 Total entries in vector store: {len(all_entries)}")
    
    if all_entries:
        print("\n📋 Entries found:")
        for i, entry in enumerate(all_entries[:5]):  # Show first 5
            print(f"  {i+1}. {entry.title} ({entry.entry_type.value}) - {entry.category}")
            
            # Check if entry has embedding
            embedding = vector_store.get_embedding(entry.entry_id)
            if embedding:
                print(f"     ✅ Has embedding (dimension: {len(embedding)})")
            else:
                print(f"     ❌ No embedding")
    
    # Test visualization data generation
    print(f"\n🎨 Testing visualization data generation...")
    try:
        viz_data = await kb_service.get_embeddings_visualization_data()
        print(f"✅ Generated {len(viz_data)} visualization points")
        
        if viz_data:
            sample = viz_data[0]
            print(f"📍 Sample point:")
            print(f"   Title: {sample['title']}")
            print(f"   Category: {sample['category']}")
            print(f"   Type: {sample['entry_type']}")
            print(f"   Position: {sample['position_3d']}")
        
    except Exception as e:
        print(f"❌ Failed to generate visualization data: {e}")
        import traceback
        traceback.print_exc()
    
    # Test knowledge base stats
    print(f"\n📈 Testing knowledge base stats...")
    try:
        stats = await kb_service.get_stats()
        print(f"✅ Stats retrieved:")
        print(f"   Total entries: {stats.total_entries}")
        print(f"   By type: {stats.entries_by_type}")
        print(f"   By category: {stats.entries_by_category}")
        print(f"   Embedding model: {stats.embedding_model}")
    except Exception as e:
        print(f"❌ Failed to get stats: {e}")


if __name__ == "__main__":
    asyncio.run(test_embeddings())