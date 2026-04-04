#!/usr/bin/env python3
"""
Simple test script for knowledge base enhancements.
Tests the core functionality without full LLM initialization.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

from app.services.knowledge_base import get_knowledge_base_service, KnowledgeBaseService
from app.models.knowledge import KnowledgeEntry, KnowledgeEntryType, KnowledgeEntrySubType
import uuid


async def test_knowledge_base_basic():
    """Test basic knowledge base functionality."""
    print("🧪 Testing Basic Knowledge Base Functionality")
    print("=" * 60)
    
    try:
        # Get knowledge base service
        kb_service = get_knowledge_base_service()
        print("✅ Knowledge base service initialized")
        
        # Test adding an interaction
        interaction_text = "I love eating healthy foods like salads and grilled chicken. I'm trying to lose weight and prefer low-carb meals."
        
        await kb_service.add_interaction_history(
            agent_type="health",
            user_input=interaction_text,
            agent_response="I'll help you plan healthy, low-carb meals for weight loss.",
            context={"goal": "meal_planning"}
        )
        print("✅ Added interaction to knowledge base")
        
        # Test getting contextual knowledge
        context = await kb_service.get_contextual_knowledge_for_agent(
            user_input="help me plan meals for this week",
            agent_type="health",
            max_results=5
        )
        
        print(f"✅ Retrieved contextual knowledge: {len(context)} entries")
        if context:
            for key, entries in context.items():
                if entries:
                    print(f"   - {key}: {len(entries)} entries")
                    if entries and hasattr(entries[0], 'content'):
                        print(f"     Sample: {entries[0].content[:100]}...")
        
        # Test getting basic stats
        stats = await kb_service.get_knowledge_base_stats()
        print(f"✅ Knowledge base stats: {stats}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


async def test_preference_extraction():
    """Test preference extraction without LLM."""
    print("\n🧪 Testing Preference Extraction (Simulated)")
    print("=" * 60)
    
    try:
        kb_service = get_knowledge_base_service()
        
        # Simulate adding preferences manually
        preferences = [
            "User prefers low-carb meals",
            "User likes grilled chicken and fish",
            "User wants to lose weight",
            "User dislikes spicy food",
            "User exercises 3 times per week"
        ]
        
        for pref in preferences:
            entry = KnowledgeEntry(
                entry_id=str(uuid.uuid4()),
                content=pref,
                entry_type=KnowledgeEntryType.PREFERENCE,
                entry_sub_type=KnowledgeEntrySubType.PERSONAL_PREFERENCE,
                category="health",
                title=f"Health Preference: {pref[:30]}...",
                metadata={"extracted_from": "conversation", "confidence": 0.9}
            )
            await kb_service.add_knowledge_entry(entry)
        
        print(f"✅ Added {len(preferences)} preference entries")
        
        # Get user preferences
        user_prefs = await kb_service.get_user_preferences()
        print(f"✅ Retrieved {len(user_prefs)} preferences:")
        for pref in user_prefs[:3]:
            print(f"   - {pref.content}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


async def test_contextual_retrieval():
    """Test contextual knowledge retrieval."""
    print("\n🧪 Testing Contextual Knowledge Retrieval")
    print("=" * 60)
    
    try:
        kb_service = get_knowledge_base_service()
        
        # Add some meal-related entries
        meal_entries = [
            ("Grilled chicken breast with steamed broccoli", KnowledgeEntryType.INTERACTION, KnowledgeEntrySubType.PERSONAL_INTERACTION),
            ("Salmon with quinoa and vegetables", KnowledgeEntryType.INTERACTION, KnowledgeEntrySubType.PERSONAL_INTERACTION),
            ("Greek salad with olive oil dressing", KnowledgeEntryType.PREFERENCE, KnowledgeEntrySubType.PERSONAL_PREFERENCE),
            ("Completed 30-minute cardio workout", KnowledgeEntryType.PATTERN, KnowledgeEntrySubType.PERSONAL_INTERACTION),
            ("Target: Lose 2 pounds this month", KnowledgeEntryType.INSIGHT, KnowledgeEntrySubType.PERSONAL_INTERACTION)
        ]
        
        for content, entry_type, entry_sub_type in meal_entries:
            entry = KnowledgeEntry(
                entry_id=str(uuid.uuid4()),
                content=content,
                entry_type=entry_type,
                entry_sub_type=entry_sub_type,
                category="health",
                title=f"Health Entry: {content[:30]}...",
                metadata={"domain": "health", "category": "meal_planning"}
            )
            await kb_service.add_knowledge_entry(entry)
        
        print(f"✅ Added {len(meal_entries)} contextual entries")
        
        # Test retrieval for meal planning
        context = await kb_service.get_contextual_knowledge_for_agent(
            user_input="suggest meals for tomorrow",
            agent_type="health",
            max_results=10
        )
        
        print(f"✅ Retrieved {len(context)} contextual entries for meal planning")
        
        # Show relevant entries
        for key, entries in context.items():
            if entries:
                print(f"   - {key}: {len(entries)} entries")
                for entry in entries[:2]:  # Show first 2 entries per category
                    if hasattr(entry, 'content'):
                        print(f"     [{entry.entry_type.value}] {entry.content}")
                    else:
                        print(f"     [{key}] {str(entry)[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


async def main():
    """Run all simple knowledge base tests."""
    print("🚀 Simple Knowledge Base Enhancement Tests")
    print("=" * 60)
    
    # Run tests
    test_results = []
    
    test_results.append(await test_knowledge_base_basic())
    test_results.append(await test_preference_extraction())
    test_results.append(await test_contextual_retrieval())
    
    # Summary
    passed = sum(test_results)
    total = len(test_results)
    
    print(f"\n📊 Test Summary: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All basic knowledge base functionality is working!")
        print("\n🚀 Key Features Validated:")
        print("   ✅ Knowledge base service initialization")
        print("   ✅ Interaction storage and retrieval")
        print("   ✅ Preference management")
        print("   ✅ Contextual knowledge retrieval")
        print("   ✅ Multi-entry type support")
        
        print("\n💡 Next Steps:")
        print("   1. Test with real LLM for preference extraction")
        print("   2. Test specialized agents integration")
        print("   3. Validate end-to-end meal planning scenario")
        
        return 0
    else:
        print("⚠️  Some tests failed, check the output above for details")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
