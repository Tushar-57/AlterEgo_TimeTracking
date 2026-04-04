"""
Test script to verify API endpoints are working.
"""

import asyncio
import sys
import os
import json

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.knowledge_base import get_knowledge_base_service


async def test_api_endpoints():
    """Test the API endpoints that the frontend calls."""
    print("🌐 Testing API Endpoints")
    print("=" * 50)
    
    kb_service = get_knowledge_base_service()
    
    # Test /api/knowledge/entries
    print("1. Testing knowledge entries...")
    try:
        entries = await kb_service.get_all_entries()
        print(f"✅ Found {len(entries)} entries")
        if entries:
            print(f"   Sample: {entries[0].title} ({entries[0].entry_type.value})")
    except Exception as e:
        print(f"❌ Failed to get entries: {e}")
    
    # Test /api/knowledge/preferences
    print("\n2. Testing user preferences...")
    try:
        preferences = await kb_service.get_user_preferences()
        print(f"✅ Got preferences with {len(preferences.model_dump())} categories")
        print(f"   Categories: {list(preferences.model_dump().keys())}")
    except Exception as e:
        print(f"❌ Failed to get preferences: {e}")
    
    # Test /api/knowledge/stats
    print("\n3. Testing knowledge stats...")
    try:
        stats = await kb_service.get_stats()
        print(f"✅ Got stats:")
        print(f"   Total entries: {stats.total_entries}")
        print(f"   By type: {dict(stats.entries_by_type)}")
        print(f"   By category: {stats.entries_by_category}")
    except Exception as e:
        print(f"❌ Failed to get stats: {e}")
    
    # Test /api/knowledge/embeddings/visualization
    print("\n4. Testing embeddings visualization...")
    try:
        viz_data = await kb_service.get_embeddings_visualization_data()
        print(f"✅ Got {len(viz_data)} visualization points")
        if viz_data:
            sample = viz_data[0]
            print(f"   Sample point: {sample['title']} at {sample['position_3d']}")
    except Exception as e:
        print(f"❌ Failed to get visualization data: {e}")
    
    # Test preference categories
    print("\n5. Testing preference categories...")
    try:
        categories = await kb_service.get_preference_categories()
        print(f"✅ Got {len(categories)} preference categories: {categories}")
    except Exception as e:
        print(f"❌ Failed to get preference categories: {e}")
    
    print("\n🎉 API endpoint testing complete!")


if __name__ == "__main__":
    asyncio.run(test_api_endpoints())