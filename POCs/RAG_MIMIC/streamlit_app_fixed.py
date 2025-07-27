# import streamlit as st
# import os
# import json
# from datetime import datetime
# from typing import List, Dict, Any
# import plotly.express as px
# import plotly.graph_objects as go
# import pandas as pd

# # Import your RAG engine
# try:
#     from rag_engine import RAGEngine
# except ImportError:
#     st.error("❌ Could not import RAG engine. Make sure rag_engine.py is in the same directory.")
#     st.stop()

# # Page configuration
# st.set_page_config(
#     page_title="🧠 Personal RAG Assistant",
#     page_icon="🤖",
#     layout="wide",
#     initial_sidebar_state="expanded"
# )

# # Custom CSS for better styling
# st.markdown("""
# <style>
# .context-item {
#     background-color: #fff3e0;
#     padding: 0.5rem;
#     border-radius: 5px;
#     margin: 0.2rem 0;
#     border-left: 3px solid #ff9800;
#     font-size: 0.8rem;
# }

# .retrieval-log {
#     background-color: #f0f8f0;
#     padding: 0.5rem;
#     border-radius: 5px;
#     margin: 0.2rem 0;
#     border-left: 3px solid #4caf50;
#     font-size: 0.8rem;
# }

# .document-card {
#     background-color: #f5f5f5;
#     padding: 1rem;
#     border-radius: 10px;
#     margin: 0.5rem 0;
#     border: 1px solid #ddd;
# }
# </style>
# """, unsafe_allow_html=True)

# @st.cache_resource
# def initialize_rag_engine():
#     """Initialize RAG engine with caching"""
#     try:
#         engine = RAGEngine()
#         return engine
#     except Exception as e:
#         st.error(f"Failed to initialize RAG engine: {e}")
#         return None

# def display_retrieval_reasoning(retrieval_log: Dict[str, Any]):
#     """Display detailed Chain-of-Thought for retrieval process"""
#     with st.expander("🔍 Chain of Thought - How I Found This Information", expanded=False):
#         st.write("**Query Analysis:**")
#         st.write(f"- Original question: {retrieval_log.get('query', 'N/A')}")
#         st.write(f"- Documents searched: {retrieval_log.get('total_documents_searched', 0)}")
#         st.write(f"- Categories searched: {', '.join(retrieval_log.get('categories_searched', []))}")
#         st.write(f"- Similarity threshold: {retrieval_log.get('similarity_threshold', 0.2)}")
        
#         st.write("**Search Process:**")
#         for step in retrieval_log.get('search_process', []):
#             st.write(f"- {step}")
        
#         if 'final_results' in retrieval_log:
#             results = retrieval_log['final_results']
#             st.write("**Final Results:**")
#             st.write(f"- Total relevant documents found: {results.get('total_relevant_found', 0)}")
#             st.write(f"- Documents returned: {results.get('returned_count', 0)}")
            
#             if results.get('score_range'):
#                 st.write(f"- Relevance scores: {results['score_range']['highest']:.3f} to {results['score_range']['lowest']:.3f}")

# def display_context_sources(context_used: List[Dict[str, Any]]):
#     """Display context sources in an expandable section"""
#     if context_used:
#         with st.expander(f"📚 Sources Used ({len(context_used)} items)", expanded=False):
#             for i, ctx in enumerate(context_used, 1):
#                 score_color = "🟢" if ctx['score'] > 0.7 else "🟡" if ctx['score'] > 0.4 else "🔴"
                
#                 st.markdown(f"""
#                 <div class="context-item">
#                     <strong>{score_color} Source {i}</strong> (Relevance: {ctx['score']:.3f})<br>
#                     <strong>Category:</strong> {ctx['category']}<br>
#                     <strong>Content:</strong> {ctx['text'][:200]}{'...' if len(ctx['text']) > 200 else ''}
#                 </div>
#                 """, unsafe_allow_html=True)
                
#                 # Show metadata if available (without nested expander)
#                 if 'metadata' in ctx:
#                     st.write(f"**🔍 Document Details - Source {i}:**")
#                     st.json(ctx['metadata'])

# def display_knowledge_base_visualization(rag_engine):
#     """Display comprehensive knowledge base visualization"""
#     st.header("📊 Knowledge Base Explorer")
    
#     summary = rag_engine.get_knowledge_base_summary()
    
#     if not summary:
#         st.info("📭 No knowledge base found.")
#         return
    
#     # Overview metrics
#     total_entries = sum(info['entries'] for info in summary.values())
#     categories = len(summary)
#     total_embeddings = sum(len(rag_engine.embeddings.get(cat, {}).get('texts', [])) for cat in summary.keys())
    
#     col1, col2, col3 = st.columns(3)
#     with col1:
#         st.metric("📊 Total Entries", total_entries)
#     with col2:
#         st.metric("📁 Categories", categories)
#     with col3:
#         st.metric("🧠 Embeddings", total_embeddings)
    
#     # Category breakdown chart
#     if summary:
#         df = pd.DataFrame([
#             {"Category": cat, "Entries": info['entries']} 
#             for cat, info in summary.items()
#         ])
        
#         fig = px.bar(df, x='Category', y='Entries', 
#                     title="Knowledge Base Distribution",
#                     color='Entries',
#                     color_continuous_scale='viridis')
#         fig.update_layout(height=300)
#         st.plotly_chart(fig, use_container_width=True)
    
#     # Detailed document explorer
#     st.subheader("🗂️ Document Explorer")
    
#     selected_category = st.selectbox("Select a category to explore:", list(summary.keys()))
    
#     if selected_category and selected_category in rag_engine.embeddings:
#         embedding_data = rag_engine.embeddings[selected_category]
        
#         st.write(f"**Category: {selected_category}**")
#         st.write(f"Documents: {len(embedding_data.get('texts', []))}")
        
#         # Show individual documents
#         if 'metadata' in embedding_data:
#             # Use tabs instead of nested expanders
#             doc_tabs = st.tabs([f"Doc {i+1}: {metadata.get('key', 'Unknown')[:20]}{'...' if len(metadata.get('key', '')) > 20 else ''}" 
#                                for i, metadata in enumerate(embedding_data['metadata'])])
            
#             for i, (tab, text, metadata) in enumerate(zip(doc_tabs, embedding_data['texts'], embedding_data['metadata'])):
#                 with tab:
#                     st.write("**Content:**")
#                     st.write(text)
#                     st.write("**Metadata:**")
#                     st.json(metadata)
                    
#                     # Show embedding info
#                     if 'embeddings' in embedding_data and i < len(embedding_data['embeddings']):
#                         embedding_vector = embedding_data['embeddings'][i]
#                         st.write(f"**Embedding:** {len(embedding_vector)} dimensions")
                        
#                         # Show embedding visualization (first 10 dimensions)
#                         if len(embedding_vector) >= 10:
#                             fig = px.bar(
#                                 x=list(range(10)), 
#                                 y=embedding_vector[:10],
#                                 title=f"Embedding Vector (First 10 Dimensions) - Document {i+1}"
#                             )
#                             fig.update_layout(height=200)
#                             st.plotly_chart(fig, use_container_width=True)

# def main():
#     """Main Streamlit application"""
    
#     # Header
#     st.title("🧠 Personal RAG Assistant")
#     st.markdown("Ask questions about your personal knowledge base using AI-powered retrieval and generation.")
    
#     # Initialize RAG engine
#     rag_engine = initialize_rag_engine()
#     if not rag_engine:
#         st.stop()
    
#     # Main content tabs
#     tab1, tab2 = st.tabs(["💬 Chat", "📊 Knowledge Base Explorer"])
    
#     with tab2:
#         display_knowledge_base_visualization(rag_engine)
    
#     with tab1:
#         # Sidebar
#         with st.sidebar:
#             st.header("⚙️ Configuration")
            
#             # Check API key status
#             if rag_engine.client:
#                 st.success("✅ OpenAI API Key: Connected")
#             else:
#                 st.error("❌ OpenAI API Key: Not Found")
#                 st.info("💡 Set OPENAI_API_KEY environment variable or add to Personal.json")
            
#             # Quick overview
#             summary = rag_engine.get_knowledge_base_summary()
#             if summary:
#                 st.header("📊 Quick Stats")
#                 total_entries = sum(info['entries'] for info in summary.values())
#                 st.metric("Total Entries", total_entries)
#                 st.metric("Categories", len(summary))
            
#             st.header("🛠️ Quick Actions")
            
#             # Quick test queries
#             st.subheader("🎯 Quick Test Queries")
#             test_queries = [
#                 "What are my achievements?",
#                 "Tell me about my internships",
#                 "What certifications do I have?",
#                 "What movies did I watch?",
#                 "Tell me about my workshops"
#             ]
            
#             for query in test_queries:
#                 if st.button(f"💬 {query}", key=f"test_{query}"):
#                     st.session_state['selected_query'] = query
            
#             # Knowledge management
#             st.subheader("➕ Add Knowledge")
#             with st.form("add_knowledge_form"):
#                 category = st.text_input("Category", placeholder="e.g., Knowledge, Personal")
#                 key = st.text_input("Key/Topic", placeholder="e.g., Python Skills")
#                 value = st.text_area("Value/Information", placeholder="Describe what you know...")
                
#                 if st.form_submit_button("Add Knowledge"):
#                     if category and key and value:
#                         success = rag_engine.add_knowledge(category, key, value)
#                         if success:
#                             st.success(f"✅ Added: {category}.{key}")
#                             st.rerun()
#                         else:
#                             st.error("❌ Failed to add knowledge")
#                     else:
#                         st.warning("Please fill all fields")
        
#         # Main chat interface
#         st.header("💬 Chat Interface")
        
#         # Initialize chat history
#         if "messages" not in st.session_state:
#             st.session_state.messages = []
#             # Add welcome message
#             st.session_state.messages.append({
#                 "role": "assistant",
#                 "content": "👋 Hi! I'm your personal RAG assistant. Ask me anything about your knowledge base!",
#                 "context": [],
#                 "retrieval_log": {}
#             })
        
#         # Handle selected query from sidebar
#         if 'selected_query' in st.session_state:
#             query = st.session_state['selected_query']
#             del st.session_state['selected_query']
            
#             # Add user message
#             st.session_state.messages.append({"role": "user", "content": query})
            
#             # Process query
#             with st.spinner("🔍 Searching knowledge base..."):
#                 try:
#                     result = rag_engine.query(query)
#                     st.session_state.messages.append({
#                         "role": "assistant",
#                         "content": result['response'],
#                         "context": result.get('contexts', []),
#                         "retrieval_log": result.get('retrieval_log', {})
#                     })
#                 except Exception as e:
#                     st.session_state.messages.append({
#                         "role": "assistant",
#                         "content": f"❌ Error processing query: {str(e)}",
#                         "context": [],
#                         "retrieval_log": {}
#                     })
        
#         # Display chat messages
#         for message in st.session_state.messages:
#             if message["role"] == "user":
#                 with st.chat_message("user"):
#                     st.write(message["content"])
#             else:
#                 with st.chat_message("assistant"):
#                     st.write(message["content"])
#                     if message.get("context"):
#                         display_context_sources(message["context"])
#                     if message.get("retrieval_log"):
#                         display_retrieval_reasoning(message["retrieval_log"])
        
#         # Chat input
#         if prompt := st.chat_input("Ask me anything about your knowledge base..."):
#             # Add user message
#             st.session_state.messages.append({"role": "user", "content": prompt})
            
#             # Display user message immediately
#             with st.chat_message("user"):
#                 st.write(prompt)
            
#             # Process and display assistant response
#             with st.chat_message("assistant"):
#                 with st.spinner("🔍 Searching knowledge base..."):
#                     try:
#                         result = rag_engine.query(prompt)
                        
#                         # Display response
#                         st.write(result['response'])
                        
#                         # Display context sources and reasoning
#                         if result.get('contexts'):
#                             display_context_sources(result['contexts'])
                        
#                         if result.get('retrieval_log'):
#                             display_retrieval_reasoning(result['retrieval_log'])
                        
#                         # Add to session state
#                         st.session_state.messages.append({
#                             "role": "assistant",
#                             "content": result['response'],
#                             "context": result.get('contexts', []),
#                             "retrieval_log": result.get('retrieval_log', {})
#                         })
                        
#                     except Exception as e:
#                         error_msg = f"❌ Error processing query: {str(e)}"
#                         st.error(error_msg)
#                         st.session_state.messages.append({
#                             "role": "assistant",
#                             "content": error_msg,
#                             "context": [],
#                             "retrieval_log": {}
#                         })
        
#         # Footer with controls
#         st.markdown("---")
#         col1, col2, col3 = st.columns(3)
        
#         with col1:
#             if st.button("🗑️ Clear Chat"):
#                 st.session_state.messages = []
#                 st.rerun()
        
#         with col2:
#             if st.button("📊 Refresh Data"):
#                 st.cache_resource.clear()
#                 st.rerun()
        
#         with col3:
#             chat_export = {
#                 "timestamp": datetime.now().isoformat(),
#                 "messages": st.session_state.messages
#             }
#             st.download_button(
#                 "💾 Export Chat",
#                 data=json.dumps(chat_export, indent=2),
#                 file_name=f"rag_chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
#                 mime="application/json"
#             )

# if __name__ == "__main__":
#     main()

import streamlit as st
import os
import json
from datetime import datetime
from typing import List, Dict, Any
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
import networkx as nx
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter

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
.context-item {
    background-color: #fff3e0;
    padding: 0.5rem;
    border-radius: 5px;
    margin: 0.2rem 0;
    border-left: 3px solid #ff9800;
    font-size: 0.8rem;
}

.retrieval-log {
    background-color: #f0f8f0;
    padding: 0.5rem;
    border-radius: 5px;
    margin: 0.2rem 0;
    border-left: 3px solid #4caf50;
    font-size: 0.8rem;
}

.document-card {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    border: 1px solid #ddd;
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

def display_retrieval_reasoning(retrieval_log: Dict[str, Any]):
    """Display detailed Chain-of-Thought for retrieval process"""
    with st.expander("🔍 Chain of Thought - How I Found This Information", expanded=False):
        st.write("**Query Analysis:**")
        st.write(f"- Original question: {retrieval_log.get('query', 'N/A')}")
        st.write(f"- Documents searched: {retrieval_log.get('total_documents_searched', 0)}")
        st.write(f"- Categories searched: {', '.join(retrieval_log.get('categories_searched', []))}")
        st.write(f"- Similarity threshold: {retrieval_log.get('similarity_threshold', 0.2)}")
        
        st.write("**Search Process:**")
        for step in retrieval_log.get('search_process', []):
            st.write(f"- {step}")
        
        if 'final_results' in retrieval_log:
            results = retrieval_log['final_results']
            st.write("**Final Results:**")
            st.write(f"- Total relevant documents found: {results.get('total_relevant_found', 0)}")
            st.write(f"- Documents returned: {results.get('returned_count', 0)}")
            
            if results.get('score_range'):
                st.write(f"- Relevance scores: {results['score_range']['highest']:.3f} to {results['score_range']['lowest']:.3f}")

def display_context_sources(context_used: List[Dict[str, Any]]):
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
                
                # Show metadata if available (without nested expander)
                if 'metadata' in ctx:
                    st.write(f"**🔍 Document Details - Source {i}:**")
                    st.json(ctx['metadata'])

def display_knowledge_base_visualization(rag_engine):
    """Display comprehensive knowledge base visualization"""
    st.header("📊 Knowledge Base Explorer")
    
    summary = rag_engine.get_knowledge_base_summary()
    
    if not summary:
        st.info("📭 No knowledge base found.")
        return
    
    # Overview metrics
    total_entries = sum(info['entries'] for info in summary.values())
    categories = len(summary)
    total_embeddings = sum(len(rag_engine.embeddings.get(cat, {}).get('texts', [])) for cat in summary.keys())
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("📊 Total Entries", total_entries)
    with col2:
        st.metric("📁 Categories", categories)
    with col3:
        st.metric("🧠 Embeddings", total_embeddings)
    
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
    
    # Detailed document explorer
    st.subheader("🗂️ Document Explorer")
    
    selected_category = st.selectbox("Select a category to explore:", list(summary.keys()))
    
    search_query = st.text_input("Search documents by key or content:")
    
    if selected_category and selected_category in rag_engine.embeddings:
        embedding_data = rag_engine.embeddings[selected_category]
        
        st.write(f"**Category: {selected_category}**")
        st.write(f"Documents: {len(embedding_data.get('texts', []))}")
        
        # Filter documents based on search
        filtered_docs = []
        for i, (text, metadata) in enumerate(zip(embedding_data['texts'], embedding_data['metadata'])):
            if not search_query or search_query.lower() in metadata.get('key', '').lower() or search_query.lower() in text.lower():
                filtered_docs.append((i, text, metadata))
        
        if filtered_docs:
            for i, text, metadata in filtered_docs:
                with st.expander(f"Document {metadata.get('key', 'Unknown')}"):
                    st.write("**Content:**")
                    st.write(text)
                    st.write("**Metadata:**")
                    st.json(metadata)
                    
                    # Show embedding info
                    if 'embeddings' in embedding_data and i < len(embedding_data['embeddings']):
                        embedding_vector = embedding_data['embeddings'][i]
                        st.write(f"**Embedding:** {len(embedding_vector)} dimensions")
                        
                        # Show embedding visualization (first 10 dimensions)
                        if len(embedding_vector) >= 10:
                            fig = px.bar(
                                x=list(range(10)), 
                                y=embedding_vector[:10],
                                title=f"Embedding Vector (First 10 Dimensions)"
                            )
                            fig.update_layout(height=200)
                            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No documents match the search query.")
    
    # Embedding Visualization
    st.subheader("🧠 Embedding Visualization")
    all_embeddings = []
    all_labels = []
    all_categories = []
    for cat, data in rag_engine.embeddings.items():
        if 'embeddings' in data and 'metadata' in data:
            all_embeddings.extend(data['embeddings'])
            all_labels.extend([f"{cat}: {md.get('key', 'Unknown')}" for md in data['metadata']])
            all_categories.extend([cat] * len(data['embeddings']))
    
    if all_embeddings:
        all_emb_array = np.array(all_embeddings)
        if len(all_emb_array) < 2:
            st.info("Not enough embeddings (need at least 2) for t-SNE visualization.")
        else:
            perplexity_value = min(30, len(all_emb_array) - 1)  # Dynamic perplexity to avoid error
            tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity_value)
            reduced = tsne.fit_transform(all_emb_array)
        
        df_tsne = pd.DataFrame({
            'x': reduced[:, 0],
            'y': reduced[:, 1],
            'label': all_labels,
            'category': all_categories
        })
        
        fig_tsne = px.scatter(df_tsne, x='x', y='y', color='category',
                              hover_data=['label'],
                              title="t-SNE Visualization of Embeddings")
        st.plotly_chart(fig_tsne, use_container_width=True)
    else:
        st.info("No embeddings available for visualization.")
    
    # Network Graph
    st.subheader("🔗 Knowledge Network Graph")
    if len(all_emb_array) < 50:  # Limit for performance
        sim_matrix = cosine_similarity(all_emb_array)
        G = nx.Graph()
        for i, label in enumerate(all_labels):
            G.add_node(label, category=all_categories[i])
        
        for i in range(len(all_emb_array)):
            for j in range(i + 1, len(all_emb_array)):
                if sim_matrix[i, j] > 0.5:
                    G.add_edge(all_labels[i], all_labels[j], weight=sim_matrix[i, j])
        
        pos = nx.spring_layout(G)
        edge_x, edge_y = [], []
        for edge in G.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])
        
        edge_trace = go.Scatter(x=edge_x, y=edge_y, line=dict(width=0.5, color='#888'),
                                hoverinfo='none', mode='lines')
        
        node_x, node_y = [], []
        for node in G.nodes():
            x, y = pos[node]
            node_x.append(x)
            node_y.append(y)
        
        node_trace = go.Scatter(x=node_x, y=node_y, mode='markers',
                                hoverinfo='text',
                                marker=dict(showscale=True, colorscale='YlGnBu', size=10,
                                            color=[], colorbar=dict(thickness=15, title='Node Connections',
                                                                     xanchor='left', titleside='right')))
        
        node_adjacencies = [len(list(G.neighbors(node))) for node in G.nodes()]
        node_text = [f"{node} (#connections: {adj})" for node, adj in zip(G.nodes(), node_adjacencies)]
        node_trace.marker.color = node_adjacencies
        node_trace.text = node_text
        
        fig_network = go.Figure(data=[edge_trace, node_trace],
                                layout=go.Layout(title='Knowledge Base Network', showlegend=False,
                                                 hovermode='closest', margin=dict(b=20,l=5,r=5,t=40),
                                                 xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                                                 yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)))
        st.plotly_chart(fig_network, use_container_width=True)
    else:
        st.info("Network graph skipped: Too many embeddings for visualization.")
    
    # Advanced Metrics: Word Frequency
    st.subheader("📈 Word Frequency Analysis")
    all_text = ' '.join([' '.join(data.get('texts', [])) for data in rag_engine.embeddings.values()])
    word_counts = Counter(all_text.lower().split())
    top_words = word_counts.most_common(20)
    df_words = pd.DataFrame(top_words, columns=['Word', 'Frequency'])
    
    fig_words = px.bar(df_words, x='Frequency', y='Word', orientation='h',
                       title="Top 20 Words in Knowledge Base")
    st.plotly_chart(fig_words, use_container_width=True)
    
    # Export KB
    st.subheader("📥 Export Knowledge Base")
    flat_data = []
    for cat, data in rag_engine.knowledge_base.items():
        if isinstance(data, dict):
            for key, value in data.items():
                flat_data.append({'Category': cat, 'Key': key, 'Value': str(value)})
        elif isinstance(data, list):
            for i, item in enumerate(data):
                flat_data.append({'Category': cat, 'Key': f'item_{i+1}', 'Value': str(item)})
    
    if flat_data:
        df_export = pd.DataFrame(flat_data)
        csv = df_export.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download as CSV",
            data=csv,
            file_name="knowledge_base.csv",
            mime="text/csv"
        )
    else:
        st.info("No data to export.")

def main():
    """Main Streamlit application"""
    
    # Header
    st.title("🧠 Personal RAG Assistant")
    st.markdown("Ask questions about your personal knowledge base using AI-powered retrieval and generation.")
    
    # Initialize RAG engine
    rag_engine = initialize_rag_engine()
    if not rag_engine:
        st.stop()
    
    # Main content tabs
    tab1, tab2 = st.tabs(["💬 Chat", "📊 Knowledge Base Explorer"])
    
    with tab2:
        display_knowledge_base_visualization(rag_engine)
    
    with tab1:
        # Sidebar
        with st.sidebar:
            st.header("⚙️ Configuration")
            
            # Check API key status
            if rag_engine.client:
                st.success("✅ OpenAI API Key: Connected")
            else:
                st.error("❌ OpenAI API Key: Not Found")
                st.info("💡 Set OPENAI_API_KEY environment variable or add to Personal.json")
            
            # Quick overview
            summary = rag_engine.get_knowledge_base_summary()
            if summary:
                st.header("📊 Quick Stats")
                total_entries = sum(info['entries'] for info in summary.values())
                st.metric("Total Entries", total_entries)
                st.metric("Categories", len(summary))
            
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
                "context": [],
                "retrieval_log": {}
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
                        "context": result.get('contexts', []),
                        "retrieval_log": result.get('retrieval_log', {})
                    })
                except Exception as e:
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": f"❌ Error processing query: {str(e)}",
                        "context": [],
                        "retrieval_log": {}
                    })
        
        # Display chat messages
        for message in st.session_state.messages:
            if message["role"] == "user":
                with st.chat_message("user"):
                    st.write(message["content"])
            else:
                with st.chat_message("assistant"):
                    st.write(message["content"])
                    if message.get("context"):
                        display_context_sources(message["context"])
                    if message.get("retrieval_log"):
                        display_retrieval_reasoning(message["retrieval_log"])
        
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
                        
                        # Display context sources and reasoning
                        if result.get('contexts'):
                            display_context_sources(result['contexts'])
                        
                        if result.get('retrieval_log'):
                            display_retrieval_reasoning(result['retrieval_log'])
                        
                        # Add to session state
                        st.session_state.messages.append({
                            "role": "assistant",
                            "content": result['response'],
                            "context": result.get('contexts', []),
                            "retrieval_log": result.get('retrieval_log', {})
                        })
                        
                    except Exception as e:
                        error_msg = f"❌ Error processing query: {str(e)}"
                        st.error(error_msg)
                        st.session_state.messages.append({
                            "role": "assistant",
                            "content": error_msg,
                            "context": [],
                            "retrieval_log": {}
                        })
        
        # Footer with controls
        st.markdown("---")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🗑️ Clear Chat"):
                st.session_state.messages = []
                st.rerun()
        
        with col2:
            if st.button("📊 Refresh Data"):
                st.cache_resource.clear()
                st.rerun()
        
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

if __name__ == "__main__":
    main()