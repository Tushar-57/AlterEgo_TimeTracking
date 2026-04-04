"""
Script to populate the knowledge base with sample data for testing.
"""

import asyncio
import sys
import os
from app.services.knowledge_base import get_knowledge_base_service
from app.models.knowledge import KnowledgeEntrySubType, KnowledgeEntryType
 
# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def populate_sample_data():
    """Populate the knowledge base with sample data."""
    print("🌱 Populating Knowledge Base with Sample Data")
    print("=" * 50)
    
    kb_service = get_knowledge_base_service()
    
    # Sample entries to create (use Enum values, not raw strings)
    from app.models.knowledge import KnowledgeEntryType, KnowledgeEntrySubType
    sample_entries = [
        {
            "entry_type": KnowledgeEntryType.PREFERENCE,
            "entry_sub_type": KnowledgeEntrySubType.WORK_PREFERENCE,
            "category": "productivity",
            "title": "Work Hours",
            "content": "09:00-17:00",
            "metadata": {"source": "user"},
            "tags": ["work", "schedule"]
        },
        {
            "entry_type": KnowledgeEntryType.PREFERENCE,
            "entry_sub_type": KnowledgeEntrySubType.HEALTH_INTERACTION,
            "category": "health",
            "title": "Exercise Goal",
            "content": "60 minutes minimum daily",
            "metadata": {"source": "user"},
            "tags": ["health", "exercise"]
        },
        {
            "entry_type": KnowledgeEntryType.INSIGHT,
            "entry_sub_type": KnowledgeEntrySubType.IMPORTANT_INSIGHT,
            "category": "journal",
            "title": "Reflection",
            "content": "Gratitude improves mood.",
            "metadata": {"source": "journal"},
            "tags": ["reflection", "mood"]
        }
    ]
    # Example: create entries in the knowledge base
    for entry in sample_entries:
        await kb_service.create_entry(
            entry_type=entry["entry_type"],
            entry_sub_type=entry["entry_sub_type"],
            category=entry["category"],
            title=entry["title"],
            content=entry["content"],
            metadata=entry["metadata"],
            tags=entry["tags"]
        )
    sample_entries = [
        {
            "type": KnowledgeEntryType.PREFERENCE,
            "category": "productivity",
            "entry_sub_type": "work preference",
            "title": "Work Schedule Preference",
            "content": "User's offical full-time work timings is 9 AM to 5 PM, and user prefers to have a tea and work after coming back home around at 6:00 PM with 1 to 2 hours focused personal work sessions followed by dinner and call or work. Likes to be consistent with working for both professional and personal work aspects.",
            "tags": ["work", "schedule", "pomodoro", "focus", "morning", "personal work"]
        },
        {
            "type": KnowledgeEntryType.PREFERENCE,
            "category": "health",
            "title": "Exercise Goals",
            "entry_sub_type": "personal preference",
            "content": "User wants to exercise 60 minutes daily, preferably after coming from office. Enjoys heavy strength workouts like back and chest. Has a goal to have a sexy body within 6 months.",
            "tags": ["exercise", "weight", "dieting", "lifting", "sexy body", "evening"]
        },
        {
            "type": KnowledgeEntryType.PREFERENCE,
            "category": "finance",
            "entry_sub_type": "personal preference",
            "title": "Budget Categories",
            "content": "User tracks expenses without any much categories, but some reoccuring payments are food ($400/month), transportation ($200/month), rent ($650/month), and savings ($2500/month). Prefers to review budget weekly with recording new expenses every 2nd day.",
            "tags": ["budget", "expenses", "savings", "weekly-review", "rent", "outside food"]
        },
        {
            "type": KnowledgeEntryType.PREFERENCE,
            "category": "journal",
            "title": "Reflection Routine",
            "entry_sub_type": "personal preference",
            "content": "User enjoys daily evening reflection at 10 PM. Focuses on gratitude (1 best things done today), and goals for tomorrow or any pointer to followup from. Finds this practice helps with sleep and mental clarity.",
            "tags": ["reflection", "gratitude", "evening", "sleep", "mental-clarity", "journaling", "planning", "next day"]
        },
        {
            "type": KnowledgeEntryType.INTERACTION,
            "category": "productivity",
            "title": "Task Prioritization Discussion",
            "entry_sub_type": "work interaction",
            "content": "User discussed using the Eisenhower Matrix for task prioritization. Prefers to focus on important but not urgent tasks to prevent last-minute stress. Wants to batch similar tasks together.",
            "tags": ["prioritization", "eisenhower-matrix", "batching", "stress-management"]
        },
        {
            "type": KnowledgeEntryType.INTERACTION,
            "category": "health",
            "entry_sub_type": "health interaction",
            "title": "Nutrition Preferences",
            "content": "User mentioned preferring 2-3 meals everyday and wants to increase protein intake since going to gym. Struggles with staying hydrated throughout the day.",
            "tags": ["nutrition", "Multiple meals", "protein", "meal-prep", "hydration"]
        },
        {
            "type": KnowledgeEntryType.PATTERN,
            "category": "productivity",
            "entry_sub_type": "subconcious patterns",
            "title": "Peak Performance Hours",
            "content": "Analysis shows user is most productive between 9-11 AM and 12-3:30 PM. Productivity drops significantly after 10 PM. Works best with a specific and finalize goal in users mind.",
            "tags": ["productivity", "peak-hours", "work streak", "energy-levels", "clarity"]
        },
        {
            "type": KnowledgeEntryType.PATTERN,
            "category": "journal",
            "title": "Gratitude Themes",
            "entry_sub_type": "concious pattern",
            "content": "User consistently expresses gratitude for family, opportunities, nature and being a human. Shows increased positivity on days when targeted goals or tasks are completed.",
            "tags": ["gratitude", "family", "health", "learning", "nature", "positivity", "opportunities"]
        },
        {
            "type": KnowledgeEntryType.INSIGHT,
            "category": "health",
            "title": "Working out",
            "entry_sub_type": "important insight",
            "content": "User haven't started working out and is planning to start by next week in the evening after coming back from work after having something to eat for workout energy.",
            "tags": ["exercise", "consistency", "morning", "mood", "scheduling"]
        }, 
        {
            "type": KnowledgeEntryType.INSIGHT,
            "category": "finance",
            "title": "Spending Behavior Analysis",
            "entry_sub_type": "misc insight",
            "content": "User tends to overspend on entertainment. Implementing a 24-hour waiting period for non-essential purchases over $50 has reduced impulse buying by 60%.",
            "tags": ["spending", "stress", "impulse-buying", "waiting-period", "entertainment"]
        }
    ]
    
    created_count = 0
    # Fetch all existing entries once
    existing_entries = await kb_service.get_all_entries()
    for entry_data in sample_entries:
        # Check for duplicate by title and content
        duplicate = False
        for existing in existing_entries:
            if existing.title == entry_data["title"] and existing.content == entry_data["content"]:
                duplicate = True
                break
        if duplicate:
            print(f"⚠️ Skipped duplicate: {entry_data['title']}")
            continue
        # Robust Enum conversion
        entry_type = entry_data["type"]
        entry_sub_type = entry_data.get("entry_sub_type", None)
        try:
            if isinstance(entry_type, str):
                entry_type = KnowledgeEntryType(entry_type)
            if entry_sub_type and isinstance(entry_sub_type, str):
                entry_sub_type = KnowledgeEntrySubType(entry_sub_type)
        except Exception as enum_err:
            print(f"❌ Enum conversion error for '{entry_data['title']}': {enum_err}")
            continue
        try:
            entry = await kb_service.create_entry(
                entry_type=entry_type,
                category=entry_data["category"],
                entry_sub_type=entry_sub_type,
                title=entry_data["title"],
                content=entry_data["content"],
                tags=entry_data["tags"]
            )
            created_count += 1
            print(f"✅ Created: {entry.title}")
        except Exception as e:
            print(f"❌ Failed to create '{entry_data['title']}': {e}")
    
    print(f"\n📊 Successfully created {created_count} knowledge base entries")
    
    # Get stats
    try:
        stats = await kb_service.get_stats()
        print(f"📈 Total entries in knowledge base: {stats.total_entries}")
        print(f"📋 Entries by type: {stats.entries_by_type}")
        print(f"🏷️  Entries by category: {stats.entries_by_category}")
    except Exception as e:
        print(f"❌ Failed to get stats: {e}")
    
    print("\n🎉 Sample data population complete!")


if __name__ == "__main__":
    asyncio.run(populate_sample_data())