# Before running this program, install the required packages:
# pip install langchain langchain-openai langchain-community faiss-cpu openai speechrecognition pyaudio

# Note: PyAudio may require system dependencies (e.g., portaudio on macOS/Linux).
# Set your OpenAI API key as an environment variable or hardcode it below (not recommended for security).

import os
import json
import speech_recognition as sr
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Set your OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Or hardcode: "your-api-key-here"

# Define initial categories and knowledge base files
categories = ["personal", "work", "hobbies", "health", "finance"]
kb_files = {cat: f"{cat}.json" for cat in categories}

# Initialize LLM and embeddings
llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, model="gpt-4o-mini", temperature=0.3)
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

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

# Function to listen and transcribe user speech using OpenAI Whisper API
def listen_and_transcribe():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        audio = r.listen(source)
    print("Transcribing...")
    try:
        text = r.recognize_whisper_api(audio, api_key=OPENAI_API_KEY)
        print(f"Transcribed: {text}")
        return text.lower() if text else None
    except sr.UnknownValueError:
        print("Could not understand audio")
        return None
    except sr.RequestError as e:
        print(f"Could not request results; {e}")
        return None

# Chat prompt for classifying the category
classify_system_message = """
You are a classifier. Classify the following user input into one of the categories: {categories}.
Choose the most relevant category. If none of the categories fit well, output 'other'.
Only output the category name or 'other'.
"""
classify_user_message = "User input: {input}"
classify_prompt = ChatPromptTemplate.from_messages(
    [("system", classify_system_message), ("user", classify_user_message)]
)
classify_chain = classify_prompt | llm | StrOutputParser()

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

# Chat prompt for analyzing input, retrieving similar entries, and deciding update/new + followups
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

# Main function to run the program
def main():
    # Listen to initial user input
    initial_text = listen_and_transcribe()
    if not initial_text:
        print("No input detected. Exiting.")
        return

    # Classify category
    category_response = classify_chain.invoke({"categories": ", ".join(categories), "input": initial_text}).strip().lower()
    
    if category_response == 'other':
        # Suggest a new category
        suggested_category = suggest_category_chain.invoke({"input": initial_text}).strip().lower()
        print(f"Suggested new category: {suggested_category}. Is this correct? (yes/no/suggest another)")
        confirmation = listen_and_transcribe()
        if confirmation == 'yes':
            category = suggested_category
        elif confirmation == 'suggest another':
            print("What category should it be?")
            category = listen_and_transcribe()
        else:
            print("Using existing categories. Exiting.")
            return
    else:
        if category_response not in [c.lower() for c in categories]:
            print(f"Invalid category detected: {category_response}. Exiting.")
            return
        category = category_response
        print(f"Detected category: {category}. Is this correct? (yes/no)")
        confirmation = listen_and_transcribe()
        if confirmation != 'yes':
            print("What is the correct category?")
            category = listen_and_transcribe()
            if not category:
                print("No category provided. Exiting.")
                return

    # Add to categories and kb_files if new
    if category not in categories:
        categories.append(category)
        kb_files[category] = f"{category}.json"
        print(f"Created new category: {category}")

    # Load existing KB
    kb_data = load_kb(category)

    # Create documents for RAG (vector store)
    documents = [Document(page_content=json.dumps(entry), metadata={"id": entry.get("id")}) for entry in kb_data if "id" in entry]
    if documents:
        vectorstore = FAISS.from_documents(documents, embeddings)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})  # Retrieve top 3 similar
        relevant_docs = retriever.invoke(initial_text)
        relevant = "\n".join([doc.page_content for doc in relevant_docs])
    else:
        relevant = "No existing entries."

    # Initial analysis
    context = initial_text
    analysis = analyze_chain.invoke({"input": context, "relevant": relevant})

    # Handle followup questions (up to 3)
    questions = analysis.get("questions", [])
    if questions:
        print("Asking followup questions...")
        for q in questions[:3]:  # Ensure up to 3
            print(f"Followup: {q}")
            answer = listen_and_transcribe()
            if answer:
                context += f"\nQ: {q}\nA: {answer}"

        # Re-analyze with updated context
        analysis = analyze_chain.invoke({"input": context, "relevant": relevant})

    # Update or create based on final analysis
    action = analysis.get("action")
    obj = analysis.get("object")
    if not obj or not isinstance(obj, dict):
        print("Invalid object in analysis. Exiting.")
        return

    if action == "new":
        # Assign new ID
        max_id = max([entry["id"] for entry in kb_data if "id" in entry], default=0)
        new_id = max_id + 1
        obj["id"] = new_id
        kb_data.append(obj)
        print(f"Added new entry with ID {new_id} to {category}.")
    elif action == "update":
        update_id = analysis.get("id")
        if update_id is None:
            print("No ID provided for update. Exiting.")
            return
        # Find and update entry
        for entry in kb_data:
            if entry.get("id") == update_id:
                entry.update(obj)
                print(f"Updated entry with ID {update_id} in {category}.")
                break
        else:
            print(f"ID {update_id} not found in {category}. Exiting.")
            return
    else:
        print("Invalid action in analysis. Exiting.")
        return

    # Save updated KB
    save_kb(category, kb_data)
    print("Knowledge base updated successfully.")

if __name__ == "__main__":
    main()