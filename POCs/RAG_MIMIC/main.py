#!/usr/bin/env python3
"""
Personal RAG Application - Main Driver

This is the main entry point for your Personal RAG (Retrieval-Augmented Generation) system.
It provides multiple ways to interact with your knowledge base:

1. Interactive Chat Mode - Natural conversation with your knowledge base
2. Single Query Mode - Ask one question and get an answer
3. Batch Test Mode - Test multiple queries at once
4. Knowledge Management - Add/update your knowledge base

Usage:
    python main.py                    # Interactive chat mode
    python main.py --query "question" # Single query mode
    python main.py --test             # Run test queries
    python main.py --summary          # Show knowledge base summary
"""

import argparse
import sys
import json
from datetime import datetime
from typing import List, Dict, Any

try:
    from rag_engine import RAGEngine
    from chat_interface import ChatInterface
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all required files are in the same directory.")
    sys.exit(1)

class RAGDriver:
    def __init__(self):
        """Initialize the RAG driver"""
        print("🚀 Starting Personal RAG System...")
        try:
            self.rag_engine = RAGEngine()
            print("✅ RAG Engine initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize RAG Engine: {e}")
            print("Please check your Personal.json file and API key configuration.")
            sys.exit(1)
    
    def run_chat_mode(self):
        """Run interactive chat mode"""
        print("🗣️ Starting Interactive Chat Mode...")
        chat = ChatInterface()
        chat.run()
    
    def run_single_query(self, query: str):
        """Run a single query and display results"""
        print(f"🔍 Processing single query: {query}")
        print("-" * 60)
        
        try:
            result = self.rag_engine.query(query)
            
            print(f"❓ Query: {result['query']}")
            print(f"🤖 Response: {result['response']}")
            
            if result['context_used']:
                print(f"\n📝 Context used ({len(result['context_used'])} items):")
                for i, ctx in enumerate(result['context_used'], 1):
                    print(f"  {i}. [{ctx['category']}] {ctx['text'][:80]}{'...' if len(ctx['text']) > 80 else ''}")
                    print(f"     Relevance score: {ctx['score']:.3f}")
            else:
                print("\n📝 No relevant context found in knowledge base")
            
            print(f"\n⏰ Processed at: {result['timestamp']}")
            
        except Exception as e:
            print(f"❌ Error processing query: {e}")
    
    def run_test_mode(self):
        """Run predefined test queries to evaluate RAG performance"""
        print("🧪 Running Test Mode - Evaluating RAG Performance...")
        print("=" * 60)
        
        # Define test queries
        test_queries = [
            "What are my hobbies?",
            "Tell me about my work experience",
            "What do I know about Python?",
            "Who are my close friends?",
            "What are my goals?",
            "What projects am I working on?",
            "Tell me something interesting",
            "What's my favorite food?",
            "What skills do I have?",
            "What are my recent learnings?"
        ]
        
        results = []
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n🔍 Test {i}/{len(test_queries)}: {query}")
            print("-" * 40)
            
            try:
                result = self.rag_engine.query(query)
                
                print(f"✅ Response: {result['response'][:150]}{'...' if len(result['response']) > 150 else ''}")
                print(f"📊 Context items: {result['num_context_items']}")
                
                if result['context_used']:
                    avg_score = sum(ctx['score'] for ctx in result['context_used']) / len(result['context_used'])
                    print(f"📈 Avg relevance: {avg_score:.3f}")
                
                results.append({
                    'query': query,
                    'success': True,
                    'context_items': result['num_context_items'],
                    'avg_score': avg_score if result['context_used'] else 0
                })
                
            except Exception as e:
                print(f"❌ Error: {e}")
                results.append({
                    'query': query,
                    'success': False,
                    'error': str(e)
                })
        
        # Display summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        print(f"✅ Successful queries: {len(successful)}/{len(test_queries)}")
        print(f"❌ Failed queries: {len(failed)}")
        
        if successful:
            avg_context_items = sum(r['context_items'] for r in successful) / len(successful)
            avg_relevance = sum(r['avg_score'] for r in successful) / len(successful)
            print(f"📊 Average context items per query: {avg_context_items:.1f}")
            print(f"📈 Average relevance score: {avg_relevance:.3f}")
        
        if failed:
            print(f"\n❌ Failed queries:")
            for r in failed:
                print(f"  • {r['query']}: {r['error']}")
    
    def show_summary(self):
        """Show knowledge base summary"""
        print("📚 KNOWLEDGE BASE SUMMARY")
        print("=" * 60)
        
        summary = self.rag_engine.get_knowledge_base_summary()
        
        if not summary:
            print("📭 No knowledge base found.")
            print("Add some knowledge files to get started!")
            return
        
        total_entries = 0
        for category, info in summary.items():
            print(f"\n📁 {category.upper()}:")
            print(f"   Type: {info['type']}")
            print(f"   Entries: {info['entries']}")
            total_entries += info['entries']
            
            if 'keys' in info and info['keys']:
                print(f"   Sample keys: {', '.join(info['keys'])}")
        
        print(f"\n📊 Total entries across all categories: {total_entries}")
        
        # Show embedding status
        embedding_info = {}
        for category in summary.keys():
            if category in self.rag_engine.embeddings:
                embedding_info[category] = len(self.rag_engine.embeddings[category]['texts'])
        
        if embedding_info:
            print(f"\n🧠 Embeddings created:")
            for category, count in embedding_info.items():
                print(f"   {category}: {count} embeddings")
    
    def interactive_knowledge_manager(self):
        """Interactive knowledge management"""
        print("🛠️ KNOWLEDGE MANAGEMENT MODE")
        print("=" * 60)
        print("Add new knowledge to your personal knowledge base.")
        print("Type 'quit' to exit this mode.\n")
        
        while True:
            try:
                category = input("📁 Category (e.g., Knowledge, Personal, Relationship): ").strip()
                if category.lower() == 'quit':
                    break
                
                key = input("🔑 Key/Topic: ").strip()
                if key.lower() == 'quit':
                    break
                
                value = input("💭 Value/Information: ").strip()
                if value.lower() == 'quit':
                    break
                
                if category and key and value:
                    success = self.rag_engine.add_knowledge(category, key, value)
                    if success:
                        print(f"✅ Added: {category}.{key} = {value}\n")
                    else:
                        print(f"❌ Failed to add knowledge. Check logs.\n")
                else:
                    print("❌ Please provide all fields (category, key, value)\n")
                    
            except KeyboardInterrupt:
                print("\n👋 Exiting knowledge management mode.")
                break

def main():
    """Main function with argument parsing"""
    parser = argparse.ArgumentParser(
        description="Personal RAG (Retrieval-Augmented Generation) System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                           # Interactive chat mode
  python main.py --query "What are my hobbies?"  # Single query
  python main.py --test                    # Run test queries
  python main.py --summary                 # Show knowledge base summary
  python main.py --manage                  # Manage knowledge base
        """
    )
    
    parser.add_argument(
        "--query", "-q",
        type=str,
        help="Ask a single question"
    )
    
    parser.add_argument(
        "--test", "-t",
        action="store_true",
        help="Run test queries to evaluate RAG performance"
    )
    
    parser.add_argument(
        "--summary", "-s",
        action="store_true",
        help="Show knowledge base summary"
    )
    
    parser.add_argument(
        "--manage", "-m",
        action="store_true",
        help="Interactive knowledge management mode"
    )
    
    parser.add_argument(
        "--chat", "-c",
        action="store_true",
        help="Run interactive chat mode (default)"
    )
    
    args = parser.parse_args()
    
    # Initialize driver
    try:
        driver = RAGDriver()
    except Exception as e:
        print(f"❌ Failed to initialize RAG system: {e}")
        return 1
    
    # Execute based on arguments
    if args.query:
        driver.run_single_query(args.query)
    elif args.test:
        driver.run_test_mode()
    elif args.summary:
        driver.show_summary()
    elif args.manage:
        driver.interactive_knowledge_manager()
    else:
        # Default to chat mode
        driver.run_chat_mode()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
