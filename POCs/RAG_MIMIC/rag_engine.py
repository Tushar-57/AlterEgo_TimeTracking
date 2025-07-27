# import json
# import os
# from typing import List, Dict, Any, Optional
# import openai
# import numpy as np
# from sklearn.metrics.pairwise import cosine_similarity
# from datetime import datetime
# import logging

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# class RAGEngine:
#     def __init__(self, knowledge_base_path: str = "KnowledgeBase", personal_config_path: str = "KnowledgeBase/Personal.json"):
#         """
#         Initialize the RAG Engine with OpenAI embeddings and chat completion
        
#         Args:
#             knowledge_base_path: Path to the knowledge base directory
#             personal_config_path: Path to the personal config with API key
#         """
#         self.knowledge_base_path = knowledge_base_path
#         self.personal_config_path = personal_config_path
#         self.knowledge_base = {}
#         self.embeddings = {}
#         self.client = None
        
#         # Load configuration and initialize OpenAI
#         self._load_personal_config()
#         self._load_knowledge_base()
#         self._create_embeddings()
        
#     def _load_personal_config(self):
#         """Load personal configuration including OpenAI API key"""
#         api_key = None
        
#         # First, try to get API key from environment variables
#         api_key = os.getenv('OPENAI_API_KEY')
#         if api_key:
#             logger.info("Found OpenAI API key in environment variables")
#         else:
#             # Fallback to personal config file
#             try:
#                 if os.path.exists(self.personal_config_path):
#                     with open(self.personal_config_path, 'r') as f:
#                         content = f.read().strip()
#                         if content:
#                             config = json.loads(content)
#                             api_key = config.get('openai_api_key')
#                             if api_key:
#                                 logger.info("Found OpenAI API key in personal config file")
#                             else:
#                                 logger.warning("OpenAI API key not found in personal config")
#                         else:
#                             logger.warning("Personal config file is empty")
#                 else:
#                     logger.warning(f"Personal config file not found: {self.personal_config_path}")
#             except Exception as e:
#                 logger.error(f"Error loading personal config: {e}")
        
#         # Initialize OpenAI client if API key is found
#         if api_key:
#             try:
#                 openai.api_key = api_key
#                 self.client = openai.OpenAI(api_key=api_key)
#                 logger.info("OpenAI client initialized successfully")
#             except Exception as e:
#                 logger.error(f"Error initializing OpenAI client: {e}")
#         else:
#             logger.error("No OpenAI API key found in environment variables or config file")
    
#     def _load_knowledge_base(self):
#         """Load all knowledge base files"""
#         if not os.path.exists(self.knowledge_base_path):
#             logger.error(f"Knowledge base path not found: {self.knowledge_base_path}")
#             return
            
#         for filename in os.listdir(self.knowledge_base_path):
#             # if filename.endswith('.json') and filename != 'Personal.json':  # Skip personal config
#             if filename.endswith('.json'):  # Skip personal config
#                 file_path = os.path.join(self.knowledge_base_path, filename)
#                 try:
#                     with open(file_path, 'r') as f:
#                         content = f.read().strip()
#                         if content:
#                             data = json.loads(content)
#                             category = filename.replace('.json', '')
#                             self.knowledge_base[category] = data
#                             logger.info(f"Loaded knowledge base: {category}")
#                         else:
#                             logger.warning(f"Empty knowledge base file: {filename}")
#                 except Exception as e:
#                     logger.error(f"Error loading {filename}: {e}")
    
#     def _create_embeddings(self):
#         """Create embeddings for all knowledge base entries using OpenAI"""
#         if not self.client:
#             logger.error("OpenAI client not initialized. Cannot create embeddings.")
#             return
            
#         logger.info("Creating embeddings for knowledge base using OpenAI...")
        
#         for category, data in self.knowledge_base.items():
#             category_texts = []
#             document_metadata = []  # Store metadata for each document
            
#             if isinstance(data, dict):
#                 for key, value in data.items():
#                     if isinstance(value, dict):
#                         # Handle nested structures like key_points.json
#                         if 'title' in value and 'description' in value:
#                             # Main entry
#                             text = f"{key}: {value.get('title', '')} - {value.get('description', '')}"
#                             category_texts.append(text)
#                             document_metadata.append({
#                                 'key': key,
#                                 'type': 'main_entry',
#                                 'title': value.get('title', ''),
#                                 'description': value.get('description', '')
#                             })
                            
#                             # Handle sub-events if they exist
#                             if 'key_event_map' in value:
#                                 for event_key, event_value in value['key_event_map'].items():
#                                     event_text = f"{key} - {event_key}: {event_value.get('title', '')} - {event_value.get('description', '')}"
#                                     category_texts.append(event_text)
#                                     document_metadata.append({
#                                         'key': f"{key}.{event_key}",
#                                         'type': 'sub_event',
#                                         'parent': key,
#                                         'title': event_value.get('title', ''),
#                                         'description': event_value.get('description', ''),
#                                         'metadata': event_value.get('metadata', {})
#                                     })
#                         else:
#                             # Simple key-value pair
#                             text = f"{key}: {json.dumps(value, indent=2)}"
#                             category_texts.append(text)
#                             document_metadata.append({
#                                 'key': key,
#                                 'type': 'simple_entry',
#                                 'content': value
#                             })
#                     elif isinstance(value, list):
#                         text = f"{key}: {', '.join(map(str, value))}"
#                         category_texts.append(text)
#                         document_metadata.append({
#                             'key': key,
#                             'type': 'list_entry',
#                             'content': value
#                         })
#                     else:
#                         text = f"{key}: {value}"
#                         category_texts.append(text)
#                         document_metadata.append({
#                             'key': key,
#                             'type': 'simple_entry',
#                             'content': value
#                         })
                    
#             elif isinstance(data, list):
#                 for i, item in enumerate(data):
#                     if isinstance(item, dict):
#                         text = f"Item {i+1}: {json.dumps(item, indent=2)}"
#                     else:
#                         text = f"Item {i+1}: {str(item)}"
#                     category_texts.append(text)
#                     document_metadata.append({
#                         'key': f"item_{i+1}",
#                         'type': 'list_item',
#                         'content': item
#                     })
            
#             if category_texts:
#                 try:
#                     # Create embeddings using OpenAI's text-embedding-3-small model
#                     response = self.client.embeddings.create(
#                         model="text-embedding-3-small",
#                         input=category_texts
#                     )
                    
#                     embeddings = np.array([embedding.embedding for embedding in response.data])
                    
#                     self.embeddings[category] = {
#                         'texts': category_texts,
#                         'embeddings': embeddings,
#                         'metadata': document_metadata
#                     }
#                     logger.info(f"Created {len(category_texts)} embeddings for {category}")
                    
#                 except Exception as e:
#                     logger.error(f"Error creating embeddings for {category}: {e}")
    
#     def retrieve_relevant_context(self, query: str, top_k: int = 5) -> Dict[str, Any]:
#         """
#         Retrieve the most relevant context from knowledge base using OpenAI embeddings
        
#         Args:
#             query: User query
#             top_k: Number of top relevant documents to retrieve
            
#         Returns:
#             Dictionary with relevant context, metadata, and retrieval reasoning
#         """
#         retrieval_log = {
#             'query': query,
#             'search_process': [],
#             'total_documents_searched': 0,
#             'categories_searched': [],
#             'similarity_threshold': 0.2
#         }
        
#         if not self.client:
#             retrieval_log['error'] = 'OpenAI client not available'
#             return {'contexts': [], 'retrieval_log': retrieval_log}
            
#         try:
#             # Create embedding for the query
#             query_response = self.client.embeddings.create(
#                 model="text-embedding-3-small",
#                 input=[query]
#             )
#             query_embedding = np.array([query_response.data[0].embedding])
#             retrieval_log['query_embedding_created'] = True
            
#             relevant_contexts = []
            
#             for category, data in self.embeddings.items():
#                 if not data['texts']:
#                     retrieval_log['search_process'].append(f"Skipped {category}: No documents")
#                     continue
                
#                 retrieval_log['categories_searched'].append(category)
#                 category_doc_count = len(data['texts'])
#                 retrieval_log['total_documents_searched'] += category_doc_count
                    
#                 # Calculate cosine similarity
#                 similarities = cosine_similarity(query_embedding, data['embeddings'])[0]
                
#                 # Get all results with scores for this category
#                 category_results = []
#                 for idx, similarity in enumerate(similarities):
#                     if similarity > retrieval_log['similarity_threshold']:
#                         context_data = {
#                             'category': category,
#                             'text': data['texts'][idx],
#                             'score': float(similarity),
#                             'document_index': idx
#                         }
                        
#                         # Add metadata if available
#                         if 'metadata' in data and idx < len(data['metadata']):
#                             context_data['metadata'] = data['metadata'][idx]
                            
#                         category_results.append(context_data)
#                         relevant_contexts.append(context_data)
                
#                 # Log category search results
#                 if category_results:
#                     best_score = max(r['score'] for r in category_results)
#                     retrieval_log['search_process'].append(
#                         f"{category}: Found {len(category_results)} relevant docs (best score: {best_score:.3f})"
#                     )
#                 else:
#                     retrieval_log['search_process'].append(
#                         f"{category}: No documents above threshold (searched {category_doc_count} docs)"
#                     )
            
#             # Sort by relevance score and return top_k overall
#             relevant_contexts.sort(key=lambda x: x['score'], reverse=True)
#             final_contexts = relevant_contexts[:top_k]
            
#             retrieval_log['final_results'] = {
#                 'total_relevant_found': len(relevant_contexts),
#                 'returned_count': len(final_contexts),
#                 'score_range': {
#                     'highest': final_contexts[0]['score'] if final_contexts else 0,
#                     'lowest': final_contexts[-1]['score'] if final_contexts else 0
#                 } if final_contexts else None
#             }
            
#             return {
#                 'contexts': final_contexts,
#                 'retrieval_log': retrieval_log
#             }
            
#         except Exception as e:
#             logger.error(f"Error retrieving relevant context: {e}")
#             retrieval_log['error'] = str(e)
#             return {'contexts': [], 'retrieval_log': retrieval_log}
    
#     def generate_response_with_cot(self, query: str, context: List[Dict[str, Any]]) -> str:
#         """
#         Generate response using Chain-of-Thought prompting with OpenAI chat completion
        
#         Args:
#             query: User query
#             context: Retrieved relevant context
            
#         Returns:
#             Generated response with reasoning
#         """
#         if not self.client:
#             return "OpenAI client not available. Please check your API key configuration."
        
#         if not context:
#             return "I couldn't find relevant information in your knowledge base for that query."
        
#         try:
#             # Prepare context for the prompt
#             context_text = "\n".join([
#                 f"[{ctx['category']}] {ctx['text']} (relevance: {ctx['score']:.3f})" 
#                 for ctx in context
#             ])
            
#             system_prompt = """You are an intelligent personal assistant with access to the user's personal knowledge base. 
            
#             Your task is to:
#             1. Analyze the user's question carefully
#             2. Review the provided context from their knowledge base
#             3. Think step-by-step about how to best answer using the available information
#             4. Provide a helpful, personalized response
            
#             Use Chain-of-Thought reasoning: explain your thinking process briefly before giving your final answer.
            
#             If the context doesn't contain sufficient information, acknowledge this and suggest what additional information might be helpful."""
            
#             user_prompt = f"""Here's the context from the user's personal knowledge base:

# {context_text}

# User's Question: {query}

# Please think through this step-by-step:
# 1. What is the user asking?
# 2. What relevant information do I have from their knowledge base?
# 3. How can I best use this information to help them?
# 4. What would be the most helpful response?

# Provide your reasoning and then your final answer."""

#             response = self.client.chat.completions.create(
#                 model="gpt-4o-mini",  # Using GPT-4o-mini for better reasoning
#                 messages=[
#                     {"role": "system", "content": system_prompt},
#                     {"role": "user", "content": user_prompt}
#                 ],
#                 max_tokens=500,
#                 temperature=0.7
#             )
            
#             return response.choices[0].message.content.strip()
            
#         except Exception as e:
#             logger.error(f"Error generating response: {e}")
#             return f"I encountered an error while processing your request: {str(e)}"
    
#     def add_knowledge(self, category: str, key: str, value: Any) -> bool:
#         """
#         Add new knowledge to the knowledge base and update embeddings
        
#         Args:
#             category: Knowledge category (e.g., 'Knowledge', 'Relationship')
#             key: Knowledge key
#             value: Knowledge value
            
#         Returns:
#             Success status
#         """
#         try:
#             file_path = os.path.join(self.knowledge_base_path, f"{category}.json")
            
#             # Load existing data
#             if os.path.exists(file_path):
#                 with open(file_path, 'r') as f:
#                     content = f.read().strip()
#                     data = json.loads(content) if content else {}
#             else:
#                 data = {}
            
#             # Add new knowledge
#             data[key] = value
            
#             # Save updated data
#             with open(file_path, 'w') as f:
#                 json.dump(data, f, indent=2)
            
#             # Update in-memory knowledge base
#             self.knowledge_base[category] = data
            
#             # Recreate embeddings for this category
#             self._create_category_embeddings(category, data)
            
#             logger.info(f"Added knowledge: {category}.{key}")
#             return True
            
#         except Exception as e:
#             logger.error(f"Error adding knowledge: {e}")
#             return False
    
#     def _create_category_embeddings(self, category: str, data: Dict[str, Any]):
#         """Create embeddings for a specific category using OpenAI"""
#         if not self.client:
#             return
            
#         category_texts = []
        
#         if isinstance(data, dict):
#             for key, value in data.items():
#                 if isinstance(value, dict):
#                     text = f"{key}: {json.dumps(value, indent=2)}"
#                 elif isinstance(value, list):
#                     text = f"{key}: {', '.join(map(str, value))}"
#                 else:
#                     text = f"{key}: {value}"
#                 category_texts.append(text)
        
#         if category_texts:
#             try:
#                 response = self.client.embeddings.create(
#                     model="text-embedding-3-small",
#                     input=category_texts
#                 )
                
#                 embeddings = np.array([embedding.embedding for embedding in response.data])
                
#                 self.embeddings[category] = {
#                     'texts': category_texts,
#                     'embeddings': embeddings
#                 }
#             except Exception as e:
#                 logger.error(f"Error creating embeddings for {category}: {e}")
    
#     def query(self, user_query: str) -> Dict[str, Any]:
#         """
#         Main query method that combines retrieval and generation with CoT
        
#         Args:
#             user_query: User's question or query
            
#         Returns:
#             Dictionary containing response and metadata
#         """
#         logger.info(f"Processing query: {user_query}")
        
#         # Retrieve relevant context
#         retrieval_result = self.retrieve_relevant_context(user_query)
#         contexts = retrieval_result['contexts']
#         retrieval_log = retrieval_result['retrieval_log']
        
#         # Generate response with Chain-of-Thought
#         response = self.generate_response_with_cot(user_query, contexts)
        
#         return {
#             'query': user_query,
#             'response': response,
#             'contexts': contexts,
#             'context_used': contexts,  # For backward compatibility
#             'retrieval_log': retrieval_log,
#             'num_context_items': len(contexts),
#             'timestamp': datetime.now().isoformat()
#         }
    
#     def get_knowledge_base_summary(self) -> Dict[str, Any]:
#         """Get a summary of the current knowledge base"""
#         summary = {}
#         for category, data in self.knowledge_base.items():
#             if isinstance(data, dict):
#                 summary[category] = {
#                     'type': 'dictionary',
#                     'entries': len(data),
#                     'keys': list(data.keys())[:5]  # Show first 5 keys
#                 }
#             elif isinstance(data, list):
#                 summary[category] = {
#                     'type': 'list',
#                     'entries': len(data)
#                 }
#         return summary

import json
import os
from typing import List, Dict, Any, Optional
import openai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, knowledge_base_path: str = "KnowledgeBase", personal_config_path: str = "KnowledgeBase/Personal.json"):
        """
        Initialize the RAG Engine with OpenAI embeddings and chat completion
        
        Args:
            knowledge_base_path: Path to the knowledge base directory
            personal_config_path: Path to the personal config with API key
        """
        self.knowledge_base_path = knowledge_base_path
        self.personal_config_path = personal_config_path
        self.knowledge_base = {}
        self.embeddings = {}
        self.client = None
        
        # Load configuration and initialize OpenAI
        self._load_personal_config()
        self._load_knowledge_base()
        self._create_embeddings()
        
    def _load_personal_config(self):
        """Load personal configuration including OpenAI API key"""
        api_key = None
        
        # First, try to get API key from environment variables
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            logger.info("Found OpenAI API key in environment variables")
        else:
            # Fallback to personal config file
            try:
                if os.path.exists(self.personal_config_path):
                    with open(self.personal_config_path, 'r') as f:
                        content = f.read().strip()
                        if content:
                            config = json.loads(content)
                            api_key = config.get('openai_api_key')
                            if api_key:
                                logger.info("Found OpenAI API key in personal config file")
                            else:
                                logger.warning("OpenAI API key not found in personal config")
                        else:
                            logger.warning("Personal config file is empty")
                else:
                    logger.warning(f"Personal config file not found: {self.personal_config_path}")
            except Exception as e:
                logger.error(f"Error loading personal config: {e}")
        
        # Initialize OpenAI client if API key is found
        if api_key:
            try:
                openai.api_key = api_key
                self.client = openai.OpenAI(api_key=api_key)
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing OpenAI client: {e}")
        else:
            logger.error("No OpenAI API key found in environment variables or config file")
    
    def _load_knowledge_base(self):
        """Load all knowledge base files"""
        if not os.path.exists(self.knowledge_base_path):
            logger.error(f"Knowledge base path not found: {self.knowledge_base_path}")
            return
            
        for filename in os.listdir(self.knowledge_base_path):
            if filename.endswith('.json'):  # Skip personal config
                file_path = os.path.join(self.knowledge_base_path, filename)
                try:
                    with open(file_path, 'r') as f:
                        content = f.read().strip()
                        if content:
                            data = json.loads(content)
                            category = filename.replace('.json', '')
                            self.knowledge_base[category] = data
                            logger.info(f"Loaded knowledge base: {category}")
                        else:
                            logger.warning(f"Empty knowledge base file: {filename}")
                except Exception as e:
                    logger.error(f"Error loading {filename}: {e}")
    
    def _create_embeddings(self):
        """Create embeddings for all knowledge base entries using OpenAI"""
        if not self.client:
            logger.error("OpenAI client not initialized. Cannot create embeddings.")
            return
            
        logger.info("Creating embeddings for knowledge base using OpenAI...")
        
        for category, data in self.knowledge_base.items():
            category_texts = []
            document_metadata = []  # Store metadata for each document
            
            if isinstance(data, dict):
                for key, value in data.items():
                    if isinstance(value, dict):
                        # Handle nested structures like key_points.json
                        if 'title' in value and 'description' in value:
                            # Main entry
                            text = f"{key}: {value.get('title', '')} - {value.get('description', '')}"
                            category_texts.append(text)
                            document_metadata.append({
                                'key': key,
                                'type': 'main_entry',
                                'title': value.get('title', ''),
                                'description': value.get('description', '')
                            })
                            
                            # Handle sub-events if they exist
                            if 'key_event_map' in value:
                                for event_key, event_value in value['key_event_map'].items():
                                    event_text = f"{key} - {event_key}: {event_value.get('title', '')} - {event_value.get('description', '')}"
                                    category_texts.append(event_text)
                                    document_metadata.append({
                                        'key': f"{key}.{event_key}",
                                        'type': 'sub_event',
                                        'parent': key,
                                        'title': event_value.get('title', ''),
                                        'description': event_value.get('description', ''),
                                        'metadata': event_value.get('metadata', {})
                                    })
                        else:
                            # Simple key-value pair
                            text = f"{key}: {json.dumps(value, indent=2)}"
                            category_texts.append(text)
                            document_metadata.append({
                                'key': key,
                                'type': 'simple_entry',
                                'content': value
                            })
                    elif isinstance(value, list):
                        text = f"{key}: {', '.join(map(str, value))}"
                        category_texts.append(text)
                        document_metadata.append({
                            'key': key,
                            'type': 'list_entry',
                            'content': value
                        })
                    else:
                        text = f"{key}: {value}"
                        category_texts.append(text)
                        document_metadata.append({
                            'key': key,
                            'type': 'simple_entry',
                            'content': value
                        })
                    
            elif isinstance(data, list):
                for i, item in enumerate(data):
                    if isinstance(item, dict):
                        text = f"Item {i+1}: {json.dumps(item, indent=2)}"
                    else:
                        text = f"Item {i+1}: {str(item)}"
                    category_texts.append(text)
                    document_metadata.append({
                        'key': f"item_{i+1}",
                        'type': 'list_item',
                        'content': item
                    })
            
            if category_texts:
                try:
                    # Create embeddings using OpenAI's text-embedding-3-small model
                    response = self.client.embeddings.create(
                        model="text-embedding-3-small",
                        input=category_texts
                    )
                    
                    embeddings = np.array([embedding.embedding for embedding in response.data])
                    
                    self.embeddings[category] = {
                        'texts': category_texts,
                        'embeddings': embeddings,
                        'metadata': document_metadata
                    }
                    logger.info(f"Created {len(category_texts)} embeddings for {category}")
                    
                except Exception as e:
                    logger.error(f"Error creating embeddings for {category}: {e}")
    
    def retrieve_relevant_context(self, query: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Retrieve the most relevant context from knowledge base using OpenAI embeddings
        
        Args:
            query: User query
            top_k: Number of top relevant documents to retrieve
            
        Returns:
            Dictionary with relevant context, metadata, and retrieval reasoning
        """
        retrieval_log = {
            'query': query,
            'search_process': [],
            'total_documents_searched': 0,
            'categories_searched': [],
            'similarity_threshold': 0.2
        }
        
        if not self.client:
            retrieval_log['error'] = 'OpenAI client not available'
            return {'contexts': [], 'retrieval_log': retrieval_log}
            
        try:
            # Create embedding for the query
            query_response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=[query]
            )
            query_embedding = np.array([query_response.data[0].embedding])
            retrieval_log['query_embedding_created'] = True
            
            relevant_contexts = []
            
            for category, data in self.embeddings.items():
                if not data['texts']:
                    retrieval_log['search_process'].append(f"Skipped {category}: No documents")
                    continue
                
                retrieval_log['categories_searched'].append(category)
                category_doc_count = len(data['texts'])
                retrieval_log['total_documents_searched'] += category_doc_count
                    
                # Calculate cosine similarity
                similarities = cosine_similarity(query_embedding, data['embeddings'])[0]
                
                # Get all results with scores for this category
                category_results = []
                for idx, similarity in enumerate(similarities):
                    if similarity > retrieval_log['similarity_threshold']:
                        context_data = {
                            'category': category,
                            'text': data['texts'][idx],
                            'score': float(similarity),
                            'document_index': idx
                        }
                        
                        # Add metadata if available
                        if 'metadata' in data and idx < len(data['metadata']):
                            context_data['metadata'] = data['metadata'][idx]
                            
                        category_results.append(context_data)
                        relevant_contexts.append(context_data)
                
                # Log category search results
                if category_results:
                    best_score = max(r['score'] for r in category_results)
                    retrieval_log['search_process'].append(
                        f"{category}: Found {len(category_results)} relevant docs (best score: {best_score:.3f})"
                    )
                else:
                    retrieval_log['search_process'].append(
                        f"{category}: No documents above threshold (searched {category_doc_count} docs)"
                    )
            
            # Sort by relevance score and return top_k overall
            relevant_contexts.sort(key=lambda x: x['score'], reverse=True)
            final_contexts = relevant_contexts[:top_k]
            
            retrieval_log['final_results'] = {
                'total_relevant_found': len(relevant_contexts),
                'returned_count': len(final_contexts),
                'score_range': {
                    'highest': final_contexts[0]['score'] if final_contexts else 0,
                    'lowest': final_contexts[-1]['score'] if final_contexts else 0
                } if final_contexts else None
            }
            
            return {
                'contexts': final_contexts,
                'retrieval_log': retrieval_log
            }
            
        except Exception as e:
            logger.error(f"Error retrieving relevant context: {e}")
            retrieval_log['error'] = str(e)
            return {'contexts': [], 'retrieval_log': retrieval_log}
    
    def generate_response_with_cot(self, query: str, context: List[Dict[str, Any]], history: List[Dict[str, str]] = []) -> str:
        """
        Generate response using Chain-of-Thought prompting with OpenAI chat completion
        
        Args:
            query: User query
            context: Retrieved relevant context
            history: Optional conversation history
            
        Returns:
            Generated response with reasoning
        """
        if not self.client:
            return "OpenAI client not available. Please check your API key configuration."
        
        if not context:
            return "I couldn't find relevant information in your knowledge base for that query."
        
        try:
            # Prepare context for the prompt
            context_text = "\n".join([
                f"[{ctx['category']}] {ctx['text']} (relevance: {ctx['score']:.3f})" 
                for ctx in context
            ])
            
            system_prompt = """You are an intelligent personal assistant with access to the user's personal knowledge base. 
            
            Your task is to:
            1. Analyze the user's question carefully
            2. Review the provided context from their knowledge base
            3. Think step-by-step about how to best answer using the available information
            4. Provide a helpful, personalized response
            
            Use Chain-of-Thought reasoning: explain your thinking process briefly before giving your final answer.
            
            If the context doesn't contain sufficient information, acknowledge this and suggest what additional information might be helpful.
            - Most Importantly, don't over answer, keep a concise tone within maximum 2 lines."""
            
            user_prompt = f"""Here's the context from the user's personal knowledge base:

{context_text}

User's Question: {query}

Please think through this step-by-step:
1. What is the user asking?
2. What relevant information do I have from their knowledge base?
3. How can I best use this information to help them?
4. What would be the most helpful response?

Provide your reasoning and then your final answer."""

            messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_prompt}]

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using GPT-4o-mini for better reasoning
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"I encountered an error while processing your request: {str(e)}"
    
    def add_knowledge(self, category: str, key: str, value: Any) -> bool:
        """
        Add new knowledge to the knowledge base and update embeddings
        
        Args:
            category: Knowledge category (e.g., 'Knowledge', 'Relationship')
            key: Knowledge key
            value: Knowledge value
            
        Returns:
            Success status
        """
        try:
            file_path = os.path.join(self.knowledge_base_path, f"{category}.json")
            
            # Load existing data
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    content = f.read().strip()
                    data = json.loads(content) if content else {}
            else:
                data = {}
            
            # Add new knowledge
            data[key] = value
            
            # Save updated data
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Update in-memory knowledge base
            self.knowledge_base[category] = data
            
            # Recreate embeddings for this category
            self._create_category_embeddings(category, data)
            
            logger.info(f"Added knowledge: {category}.{key}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding knowledge: {e}")
            return False
    
    def _create_category_embeddings(self, category: str, data: Dict[str, Any]):
        """Create embeddings for a specific category using OpenAI"""
        if not self.client:
            return
            
        category_texts = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, dict):
                    text = f"{key}: {json.dumps(value, indent=2)}"
                elif isinstance(value, list):
                    text = f"{key}: {', '.join(map(str, value))}"
                else:
                    text = f"{key}: {value}"
                category_texts.append(text)
        
        if category_texts:
            try:
                response = self.client.embeddings.create(
                    model="text-embedding-3-small",
                    input=category_texts
                )
                
                embeddings = np.array([embedding.embedding for embedding in response.data])
                
                self.embeddings[category] = {
                    'texts': category_texts,
                    'embeddings': embeddings
                }
            except Exception as e:
                logger.error(f"Error creating embeddings for {category}: {e}")
    
    def query(self, user_query: str, history: List[Dict[str, str]] = []) -> Dict[str, Any]:
        """
        Main query method that combines retrieval and generation with CoT
        
        Args:
            user_query: User's question or query
            history: Optional conversation history
            
        Returns:
            Dictionary containing response and metadata
        """
        logger.info(f"Processing query: {user_query}")
        
        # Retrieve relevant context
        retrieval_result = self.retrieve_relevant_context(user_query)
        contexts = retrieval_result['contexts']
        retrieval_log = retrieval_result['retrieval_log']
        
        # Generate response with Chain-of-Thought
        response = self.generate_response_with_cot(user_query, contexts, history)
        
        return {
            'query': user_query,
            'response': response,
            'contexts': contexts,
            'context_used': contexts,  # For backward compatibility
            'retrieval_log': retrieval_log,
            'num_context_items': len(contexts),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_knowledge_base_summary(self) -> Dict[str, Any]:
        """Get a summary of the current knowledge base"""
        summary = {}
        for category, data in self.knowledge_base.items():
            if isinstance(data, dict):
                summary[category] = {
                    'type': 'dictionary',
                    'entries': len(data),
                    'keys': list(data.keys())[:5]  # Show first 5 keys
                }
            elif isinstance(data, list):
                summary[category] = {
                    'type': 'list',
                    'entries': len(data)
                }
        return summary