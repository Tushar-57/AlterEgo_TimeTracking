import os
import json
import io
import numpy as np
import streamlit as st
import plotly.express as px
import pandas as pd
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from st_audiorec import st_audiorec
from openai import OpenAI
import plotly.graph_objects as go
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

# Set your OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Or hardcode: "your-api-key-here"

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Load or initialize categories
categories_file = "categories.json"
try:
    with open(categories_file, 'r') as f:
        categories = json.load(f)
except FileNotFoundError:
    categories = ["personal", "work", "hobbies", "health", "finance"]
    with open(categories_file, 'w') as f:
        json.dump(categories, f)

kb_files = {cat: f"{cat}.json" for cat in categories}

# Initialize LLM and embeddings
llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, model="gpt-4o-mini", temperature=0.3)
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Function to transcribe audio bytes using OpenAI Audio API
def transcribe_audio(wav_bytes):
    try:
        # Create a BytesIO object from the WAV bytes
        audio_file = io.BytesIO(wav_bytes)
        
        # Transcribe using OpenAI's Audio API (default to JSON format)
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.wav", audio_file, "audio/wav")
        )
        return transcription.text.lower() if transcription.text else None
    except Exception as e:
        st.error(f"Transcription error: {e}")
        return None

# Function to load knowledge base for a category
def load_kb(category):
    kb_file = kb_files.get(category, f"{category}.json")
    try:
        with open(kb_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# Function to save knowledge base for a category
def save_kb(category, data):
    kb_file = kb_files.get(category, f"{category}.json")
    with open(kb_file, 'w') as f:
        json.dump(data, f, indent=4)

# Chat prompt for suggesting a new category if 'other'
suggest_category_system_message = """
Based on the user input, suggest a new category name that would fit this information best.
Output only the suggested category name.
"""
suggest_category_user_message = "User input: {input}"
suggest_category_prompt = ChatPromptTemplate.from_messages(
    [("system", suggest_category_system_message), ("user", suggest_category_user_message)]
)
suggest_category_chain = suggest_category_prompt | llm | StrOutputParser()

# Chat prompt for analyzing input
analyze_system_message = """
You are an AI that analyzes user input and decides whether to update an existing knowledge base entry or create a new one.
Based on the user input and existing similar entries, determine if this is an update or a new entry.
- If update, specify the ID of the entry to update and the updated JSON object.
- If new, provide the new JSON object (without ID).

Also, if key information is missing or could be refined, provide up to 3 followup questions as a list.

Output strictly in JSON format:
{{
  "action": "update" or "new",
  "id": <id if update, else null>,
  "object": <json_object>,
  "questions": ["question1", "question2", "question3"] or []
}}
"""
analyze_user_message = """
User input: {input}

Existing similar entries in the knowledge base (if any): {relevant}
"""
analyze_prompt = ChatPromptTemplate.from_messages(
    [("system", analyze_system_message), ("user", analyze_user_message)]
)
analyze_chain = analyze_prompt | llm | JsonOutputParser()

# New: Chat prompt for validating the JSON object
validate_system_message = """
You are a validator for JSON objects in a knowledge base. Check if the provided JSON object has logical and complete fields based on the user input.
- Ensure field names are meaningful (e.g., "challenges" should not be "problems faced" if it's not accurate).
- Suggest corrections if needed, or confirm it's valid.

Output strictly in JSON format:
{{
  "valid": true or false,
  "corrected_object": <corrected_json_object if invalid, else null>,
  "reason": "Explanation if invalid"
}}
"""
validate_user_message = """
User input: {input}
JSON object: {object}
"""
validate_prompt = ChatPromptTemplate.from_messages(
    [("system", validate_system_message), ("user", validate_user_message)]
)
validate_chain = validate_prompt | llm | JsonOutputParser()

# Helper function to perform the update (with validation)
def perform_update(analysis, category, kb_data, context):
    action = analysis.get("action")
    obj = analysis.get("object")
    if not obj or not isinstance(obj, dict):
        st.error("Invalid analysis object.")
        return

    # Validate the object
    validation = validate_chain.invoke({
        "input": context,
        "object": json.dumps(obj)
    })
    if not validation.get("valid", True):
        st.warning(f"Validation failed: {validation.get('reason')}")
        obj = validation.get("corrected_object", obj)  # Use corrected if provided
        st.info("Using corrected object.")

    if action == "new":
        max_id = max([entry["id"] for entry in kb_data if "id" in entry], default=0)
        new_id = max_id + 1
        obj["id"] = new_id
        kb_data.append(obj)
        st.info(f"Added new entry with ID {new_id} to {category}.")
    elif action == "update":
        update_id = analysis.get("id")
        if update_id is None:
            st.error("No ID provided for update.")
            return
        for entry in kb_data:
            if entry.get("id") == update_id:
                entry.update(obj)
                st.info(f"Updated entry with ID {update_id} in {category}.")
                break
        else:
            st.error(f"ID {update_id} not found in {category}.")
            return
    else:
        st.error("Invalid action in analysis.")
        return

    save_kb(category, kb_data)

# Function to get category scores using embeddings
def get_category_scores(input_text):
    # Create documents for categories (simple description or just name)
    category_docs = [Document(page_content=cat, metadata={"category": cat}) for cat in categories]
    if category_docs:
        vectorstore = FAISS.from_documents(category_docs, embeddings)
        similarities = vectorstore.similarity_search_with_score(input_text, k=len(categories))
        scores = {doc.metadata["category"]: score for doc, score in similarities}
        return sorted(scores.items(), key=lambda x: x[1], reverse=True)  # Higher score = more similar
    return []

def display_network_graph(rag_engine):
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
                                                color=[], colorbar=dict(thickness=15, title=dict(text='Node Connections', side='right'),
                                                                         xanchor='left')))
            
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
    else:
        st.info("No embeddings available for visualization.")

def display_word_frequency(rag_engine):
    all_text = ' '.join([' '.join(data.get('texts', [])) for data in rag_engine.embeddings.values()])
    word_counts = Counter(all_text.lower().split())
    top_words = word_counts.most_common(20)
    df_words = pd.DataFrame(top_words, columns=['Word', 'Frequency'])
    
    fig_words = px.bar(df_words, x='Frequency', y='Word', orientation='h',
                       title="Top 20 Words in Knowledge Base")
    st.plotly_chart(fig_words, use_container_width=True)

# Streamlit app
st.title("Knowledge Base Updater with Voice Input")

if 'step' not in st.session_state:
    st.session_state.step = 'initial_record'
    st.session_state.context = ""
    st.session_state.category = None
    st.session_state.questions = []
    st.session_state.current_question_index = 0
    st.session_state.answers = []
    st.session_state.transcribed_text = ""
    st.session_state.category_scores = []
    st.session_state.rag_engine = RAGEngine()  # Initialize RAG engine for viz
    st.session_state.logs = []  # For frontend logs

# Function to add log to frontend
def add_log(message, level='info'):
    st.session_state.logs.append((message, level))
    # Display all logs with colors and separators
    st.markdown("---")
    for log_msg, log_level in st.session_state.logs:
        if log_level == 'info':
            st.info(log_msg)
        elif log_level == 'warning':
            st.warning(log_msg)
        elif log_level == 'error':
            st.error(log_msg)
    st.markdown("---")

# Step 1: Record initial input
if st.session_state.step == 'initial_record':
    st.header("Record Your Initial Input")
    st.write("Click the button below to start recording. Speak your input and stop when done.")
    initial_audio = st_audiorec()
    if initial_audio is not None:
        with st.spinner("Transcribing..."):
            transcribed_text = transcribe_audio(initial_audio)
            add_log("Transcription complete", 'info')
        if transcribed_text:
            st.session_state.transcribed_text = transcribed_text
            st.session_state.step = 'validate_transcript'
            st.rerun()
        else:
            st.error("Failed to transcribe. Please try again.")
            add_log("Transcription failed", 'error')

# Step 1.5: Validate and edit transcript
elif st.session_state.step == 'validate_transcript':
    st.header("Validate Transcription")
    st.write("Is this transcription correct? You can edit it below.")
    edited_text = st.text_area("Transcribed Text:", value=st.session_state.transcribed_text, height=100)
    col1, col2 = st.columns(2)
    if col1.button("Confirm"):
        st.session_state.context = edited_text
        st.session_state.step = 'classify'
        st.rerun()
    if col2.button("Re-record"):
        st.session_state.step = 'initial_record'
        st.rerun()


# Step 2: Classify category with retrieval and visualization
elif st.session_state.step == 'classify':
    st.header("Classifying Category")
    with st.spinner("Computing category similarities..."):
        category_scores = get_category_scores(st.session_state.context)
        st.session_state.category_scores = category_scores
        add_log("Category similarities computed", 'info')

    if category_scores:
        # Visualization: Bar chart of similarity scores
        df = pd.DataFrame({
            "Category": [cat for cat, score in category_scores],
            "Similarity Score": [score for cat, score in category_scores]
        })
        fig = px.bar(df, x="Category", y="Similarity Score", title="Category Similarity Scores")
        st.plotly_chart(fig)

        # Select top category or custom
        top_category = category_scores[0][0] if category_scores else 'other'
        st.write(f"Top suggested category: {top_category}")
        col1, col2, col3 = st.columns(3)
        if col1.button("Use Top Category"):
            st.session_state.category = top_category
            st.session_state.step = 'analyze'
            st.rerun()
        if col2.button("Choose Another"):
            selected_category = st.selectbox("Select from top categories:", [cat for cat, _ in category_scores[:3]])
            if selected_category and st.button("Confirm Selection"):
                st.session_state.category = selected_category
                st.session_state.step = 'analyze'
                st.rerun()
        custom_category = col3.text_input("Suggest a new category:")
        if custom_category and col3.button("Use Custom"):
            category = custom_category.lower()
            if category not in categories:
                categories.append(category)
                with open(categories_file, 'w') as f:
                    json.dump(categories, f)
                kb_files[category] = f"{category}.json"
            st.session_state.category = category
            st.session_state.step = 'analyze'
            st.rerun()
    else:
        # Fallback to suggesting new
        with st.spinner("Suggesting new category..."):
            suggested_category = suggest_category_chain.invoke({
                "input": st.session_state.context
            }).strip().lower()
        st.write(f"Suggested new category: {suggested_category}")
        col1, col2 = st.columns(2)
        if col1.button("Yes"):
            category = suggested_category
            if category not in categories:
                categories.append(category)
                with open(categories_file, 'w') as f:
                    json.dump(categories, f)
                kb_files[category] = f"{category}.json"
            st.session_state.category = category
            st.session_state.step = 'analyze'
            st.rerun()
        if col2.button("No"):
            st.session_state.step = 'initial_record'
            st.rerun()
        # Add visualizations at human-in-loop
        st.subheader("Knowledge Base Visualizations")
        display_network_graph(st.session_state.rag_engine)
        display_word_frequency(st.session_state.rag_engine)
        display_sub_categories(category)


# Step 3: Analyze input
elif st.session_state.step == 'analyze':
    st.header("Analyzing Input")
    category = st.session_state.category
    kb_data = load_kb(category)
    documents = [Document(page_content=json.dumps(entry), metadata={"id": entry.get("id")}) for entry in kb_data if "id" in entry]
    if documents:
        with st.spinner("Building vector store..."):
            vectorstore = FAISS.from_documents(documents, embeddings)
            retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
            relevant_docs = retriever.invoke(st.session_state.context)
            relevant = "\n".join([doc.page_content for doc in relevant_docs])
            add_log("Retrieval complete: Found relevant entries", 'info')
    else:
        relevant = "No existing entries."
        add_log("No existing entries in KB", 'warning')
    
    with st.spinner("Analyzing..."):
        analysis = analyze_chain.invoke({
            "input": st.session_state.context,
            "relevant": relevant
        })
        add_log("Analysis complete", 'info')
    
    questions = analysis.get("questions", [])
    if questions:
        st.session_state.questions = questions[:3]  # Limit to 3
        st.session_state.answers = []
        st.session_state.current_question_index = 0
        st.session_state.step = 'followup'
        st.rerun()
    else:
        # Perform update or new with validation
        perform_update(analysis, category, kb_data, st.session_state.context)
        st.session_state.step = 'done'
        st.rerun()

# Step 4: Handle follow-up questions
elif st.session_state.step == 'followup':
    st.header("Follow-up Questions")
    current_index = st.session_state.current_question_index
    if current_index < len(st.session_state.questions):
        question = st.session_state.questions[current_index]
        st.write(f"Question {current_index + 1}: {question}")
        followup_audio = st_audiorec()
        if followup_audio is not None:
            with st.spinner("Transcribing..."):
                answer = transcribe_audio(followup_audio)
            if answer:
                st.success(f"Answer: {answer}")
                st.session_state.answers.append(answer)
                st.session_state.current_question_index += 1
                st.rerun()
            else:
                st.error("Failed to transcribe. Please try again.")
    else:
        # Build updated context
        updated_context = st.session_state.context
        for q, a in zip(st.session_state.questions, st.session_state.answers):
            updated_context += f"\nQ: {q}\nA: {a}"
        
        # Re-analyze
        category = st.session_state.category
        kb_data = load_kb(category)
        documents = [Document(page_content=json.dumps(entry), metadata={"id": entry.get("id")}) for entry in kb_data if "id" in entry]
        if documents:
            vectorstore = FAISS.from_documents(documents, embeddings)
            retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
            relevant_docs = retriever.invoke(updated_context)
            relevant = "\n".join([doc.page_content for doc in relevant_docs])
        else:
            relevant = "No existing entries."
        
        with st.spinner("Re-analyzing..."):
            analysis = analyze_chain.invoke({
                "input": updated_context,
                "relevant": relevant
            })
        
        # Perform update or new with validation
        perform_update(analysis, category, kb_data, updated_context)
        st.session_state.step = 'done'
        st.rerun()

# Step 5: Done
elif st.session_state.step == 'done':
    st.header("Update Complete")
    st.success("Knowledge base updated successfully!")
    if st.button("Start Over"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

def display_sub_categories(category):
    # Assume rag_engine instance or integrate; for simplicity, skip if not main focus, or add RAGEngine import
    rag = RAGEngine()
    sub_cats = rag.get_sub_categories(category)
    if sub_cats:
        st.subheader("Sub-Categories")
        for sub, items in sub_cats.items():
            with st.expander(sub):
                st.json(items)