import streamlit as st
import os
import json
from datetime import datetime
from typing import List, Dict, Any
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

# Import your RAG engine
try:
    from rag_engine import RAGEngine
except ImportError:
    st.error("❌ Could not import RAG engine. Make sure rag_engine.py is in the same directory.")
    st.stop()

# Page configuration
st.set_page_config(
    page_title="🧠 Personal RAG Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
.stChat {
    padding: 1rem;
}

.user-message {
    background-color: #e3f2fd;
    padding: 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    border-left: 4px solid #2196f3;
}

.assistant-message {
    background-color: #f3e5f5;
    padding: 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    border-left: 4px solid #9c27b0;
}

.context-item {
    background-color: #fff3e0;
    padding: 0.5rem;
    border-radius: 5px;
    margin: 0.2rem 0;
    border-left: 3px solid #ff9800;
    font-size: 0.8rem;
}

.metric-card {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 10px;
    margin: 0.5rem;
    text-align: center;
}

.sidebar-section {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 10px;
}
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def initialize_rag_engine():
    """Initialize RAG engine with caching"""
    try:
        engine = RAGEngine()
        return engine
    except Exception as e:
        st.error(f"Failed to initialize RAG engine: {e}")
        return None

def display_chain_of_thought(retrieval_log: Dict[str, Any]):
    """Display detailed reasoning for how retrieved contexts were selected."""
    st.subheader("🔍 Chain of Thought - Retrieval Process")
    st.json(retrieval_log)
    """Display context sources in an expandable section"""
    if context_used:
        with st.expander(f"📚 Sources Used ({len(context_used)} items)", expanded=False):
            for i, ctx in enumerate(context_used, 1):
                score_color = "🟢" if ctx['score'] > 0.7 else "🟡" if ctx['score'] > 0.4 else "🔴"
                
                st.markdown(f"""
                <div class="context-item">
                    <strong>{score_color} Source {i}</strong> (Relevance: {ctx['score']:.3f})<br>
                    <strong>Category:</strong> {ctx['category']}<br>
                    <strong>Content:</strong> {ctx['text'][:200]}{'...' if len(ctx['text']) > 200 else ''}
                </div>
                """, unsafe_allow_html=True)

def display_knowledge_details(rag_engine):
    """Display detailed knowledge base information and embeddings"""
    summary = rag_engine.get_knowledge_base_summary()
    
    if not summary:
        st.info("📭 No knowledge base found.")
        return
    
    for category, info in summary.items():
        doc_list = rag_engine.embeddings.get(category, {}).get('metadata', [])
        
        st.subheader(f"Category: {category} - {info['entries']} entries")
        
        # Display documents and metadata
        for doc in doc_list:
            st.markdown(f"**{doc['key']}** - {doc['type']}")
            if doc['type'] == 'main_entry':
                st.markdown(f"- Title: {doc.get('title', '')}")
                st.markdown(f"- Description: {doc.get('description', '')[:200]}{'...' if len(doc.get('description', '')) > 200 else ''}")
                if 'metadata' in doc:
                    st.json(doc['metadata'])
                with st.expander("View Full Entry"):
                    st.json(doc)
            elif doc['type'] in ['sub_event', 'simple_entry', 'list_entry', 'list_item']:
                st.json(doc)

            st.markdown("---")
    """Display knowledge base analytics"""
    summary = rag_engine.get_knowledge_base_summary()
    
    if not summary:
        st.info("📭 No knowledge base found.")
        return
    
    # Create metrics
    total_entries = sum(info['entries'] for info in summary.values())
    categories = len(summary)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("📊 Total Entries", total_entries)
    with col2:
        st.metric("📁 Categories", categories)
    with col3:
        if rag_engine.embeddings:
            total_embeddings = sum(len(emb['texts']) for emb in rag_engine.embeddings.values())
            st.metric("🧠 Embeddings", total_embeddings)
        else:
            st.metric("🧠 Embeddings", 0)
    
    # Category breakdown chart
    if summary:
        df = pd.DataFrame([
            {"Category": cat, "Entries": info['entries']} 
            for cat, info in summary.items()
        ])
        
        fig = px.bar(df, x='Category', y='Entries', 
                    title="Knowledge Base Distribution",
                    color='Entries',
                    color_continuous_scale='viridis')
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)

def main():
    """Main Streamlit application"""
    
    # Header
    st.title("🧠 Personal RAG Assistant")
    st.markdown("Ask questions about your personal knowledge base using AI-powered retrieval and generation.")
    
    # Initialize RAG engine
    rag_engine = initialize_rag_engine()
    if not rag_engine:
        st.stop()
    
    # Sidebar
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        # Check API key status
        if rag_engine.client:
            st.success("✅ OpenAI API Key: Connected")
        else:
            st.error("❌ OpenAI API Key: Not Found")
            st.info("💡 Set OPENAI_API_KEY environment variable or add to Personal.json")
        
        st.header("📊 Knowledge Base Stats")
        display_knowledge_details(rag_engine)
        
        st.header("🛠️ Quick Actions")
        
        # Quick test queries
        st.subheader("🎯 Quick Test Queries")
        test_queries = [
            "What are my achievements?",
            "Tell me about my internships",
            "What certifications do I have?",
            "What movies did I watch?",
            "Tell me about my workshops"
        ]
        
        for query in test_queries:
            if st.button(f"💬 {query}", key=f"test_{query}"):
                st.session_state['selected_query'] = query
        
        # Knowledge management
        st.subheader("➕ Add Knowledge")
        with st.form("add_knowledge_form"):
            category = st.text_input("Category", placeholder="e.g., Knowledge, Personal")
            key = st.text_input("Key/Topic", placeholder="e.g., Python Skills")
            value = st.text_area("Value/Information", placeholder="Describe what you know...")
            
            if st.form_submit_button("Add Knowledge"):
                if category and key and value:
                    success = rag_engine.add_knowledge(category, key, value)
                    if success:
                        st.success(f"✅ Added: {category}.{key}")
                        st.rerun()
                    else:
                        st.error("❌ Failed to add knowledge")
                else:
                    st.warning("Please fill all fields")
    
    # Main chat interface
    st.header("💬 Chat Interface")
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []
        # Add welcome message
        st.session_state.messages.append({
            "role": "assistant",
            "content": "👋 Hi! I'm your personal RAG assistant. Ask me anything about your knowledge base!",
            "context": []
        })
    
    # Handle selected query from sidebar
    if 'selected_query' in st.session_state:
        query = st.session_state['selected_query']
        del st.session_state['selected_query']
        
        # Add user message
        st.session_state.messages.append({"role": "user", "content": query})
        
        # Process query
        with st.spinner("🔍 Searching knowledge base..."):
            try:
                result = rag_engine.query(query)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": result['response'],
                    "context": result['contexts'],
                    "retrieval_log": result['retrieval_log']
                })
            except Exception as e:
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": f"❌ Error processing query: {str(e)}",
                    "context": []
                })
    
    # Display chat messages
    for message in st.session_state.messages:
        if message["role"] == "user":
            with st.chat_message("user"):
                st.write(message["content"])
        else:
            with st.chat_message("assistant"):
                st.write(message["content"])
                if "context" in message and message["context"]:
                    display_context_sources(message["context"])
    
    # Chat input
    if prompt := st.chat_input("Ask me anything about your knowledge base..."):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message immediately
        with st.chat_message("user"):
            st.write(prompt)
        
        # Process and display assistant response
        with st.chat_message("assistant"):
            with st.spinner("🔍 Searching knowledge base..."):
                try:
                    result = rag_engine.query(prompt)
                    
                    # Display response
                    st.write(result['response'])
                    
                    # Display context sources
                    if result['context_used']:
                        display_context_sources(result['context_used'])
                    
                    # Add response with reasoning
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": result['response'],
                        "context": result['contexts'],
                        "retrieval_log": result['retrieval_log']
                    })
                    
                    # Display retrieval log if available
                    if 'retrieval_log' in result:
                        display_chain_of_thought(result['retrieval_log'])
                    
                except Exception as e:
                    error_msg = f"❌ Error processing query: {str(e)}"
                    st.error(error_msg)
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": error_msg,
                        "context": []
                    })
    
    # Footer with controls
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🗑️ Clear Chat"):
            st.session_state.messages = []
            st.rerun()
    
    with col2:
        if st.button("📊 Show Analytics"):
            st.session_state.show_analytics = not st.session_state.get('show_analytics', False)
    
    with col3:
        chat_export = {
            "timestamp": datetime.now().isoformat(),
            "messages": st.session_state.messages
        }
        st.download_button(
            "💾 Export Chat",
            data=json.dumps(chat_export, indent=2),
            file_name=f"rag_chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )
    
    # Analytics section
    if st.session_state.get('show_analytics', False):
        st.header("📈 Chat Analytics")
        
        if len(st.session_state.messages) > 1:
            # Message count by role
            message_counts = {}
            for msg in st.session_state.messages:
                role = msg['role']
                message_counts[role] = message_counts.get(role, 0) + 1
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig = px.pie(
                    values=list(message_counts.values()),
                    names=list(message_counts.keys()),
                    title="Message Distribution"
                )
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                # Context usage analysis
                context_usage = []
                for msg in st.session_state.messages:
                    if msg['role'] == 'assistant' and 'context' in msg:
                        context_usage.append(len(msg['context']))
                
                if context_usage:
                    fig = go.Figure(data=go.Histogram(x=context_usage, nbinsx=10))
                    fig.update_layout(title="Context Items Distribution",
                                    xaxis_title="Number of Context Items",
                                    yaxis_title="Frequency")
                    st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    main()
