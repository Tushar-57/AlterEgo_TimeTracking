# Backend Documentation

## Overview

The backend is organized to support an AI-powered time tracking and knowledge management system. It is modular, with clear separation of concerns, making it extensible and maintainable.

### Top-Level Structure

- `config.py`, `debug_config.py`: Configuration files for environment and debugging.
- `main.py`: Main entry point for backend execution.
- `requirements.txt`: Python dependencies.
- `start_server.py`: Script to start the backend server.
- `test_providers.py`, `test_setup.py`: Test scripts for provider and setup validation.
- `app/`: Core application logic, subdivided into agents, API, LLM, models, services.
- `data/`: Storage for vector indices and metadata.
- `examples/`: Example scripts and demos.
- `tests/`: Unit and integration tests.

---

## Detailed Module Breakdown

### 1. Configuration

- **`config.py` / `debug_config.py`**
  - Define environment variables, API keys, debug flags, and other settings.
  - Used throughout the backend for consistent configuration management.

### 2. Entry Points

- **`main.py`**
  - The main script to launch backend processes.
  - Initializes core components and orchestrates startup.

- **`start_server.py`**
  - Starts the backend server (likely a REST API or similar).
  - Loads configuration and application modules.

### 3. Application Core (`app/`)

#### a. Agents (`app/agents/`)

- **Purpose:** Encapsulate logic for different agent types (AI, orchestrators, communication).
- **Files:**
  - `base.py`: Abstract base class for agents.
  - `communication.py`: Handles agent communication protocols.
  - `factory.py`: Factory for creating agent instances.
  - `orchestrator.py`: Orchestrates agent interactions and workflows.
  - `prompts.py`: Stores and manages prompt templates for agents.
  - `registry.py`: Registers and manages available agents.

#### b. API (`app/api/`)

- **Purpose:** Exposes backend functionalities via API endpoints.
- **Files:**
  - `knowledge.py`: API for knowledge base operations (CRUD, search, etc.).
  - `__init__.py`: API module initialization.

#### c. LLM Providers (`app/llm/`)

- **Purpose:** Integrates with Large Language Models (LLMs) for AI capabilities.
- **Files:**
  - `base.py`: Abstract base for LLM providers.
  - `config.py`: LLM-specific configuration.
  - `factory.py`: Factory for LLM provider instantiation.
  - `ollama_provider.py`: Integration with Ollama LLM.
  - `openai_provider.py`: Integration with OpenAI LLM.
  - `service.py`: Service layer for LLM operations.

#### d. Models (`app/models/`)

- **Purpose:** Data models for knowledge and other entities.
- **Files:**
  - `knowledge.py`: Defines the structure and schema for knowledge items.

#### e. Services (`app/services/`)

- **Purpose:** Business logic and data management.
- **Files:**
  - `knowledge_base.py`: Manages the knowledge base (add, update, search).
  - `vector_store.py`: Handles vector storage for embeddings and similarity search.

---

### 4. Data Storage (`data/`)

- **`vector_index`**: Stores vector representations for fast similarity search.
- **`vector_index_metadata.pkl`**: Metadata for vector indices.

---

### 5. Examples (`examples/`)

- **Purpose:** Demonstrate backend features and usage.
- **Files:**
  - `knowledge_base_demo.py`: Shows knowledge base operations.
  - `knowledge_enhancements_demo.py`: Demonstrates knowledge enhancement features.
  - `llm_provider_demo.py`: Example usage of LLM providers.
  - `populate_sample_data.py`: Script to populate the system with sample data.
  - `test_api_endpoints.py`: Tests API endpoints.
  - `test_embeddings.py`: Tests embedding functionalities.

---

### 6. Tests (`tests/`)

- **Purpose:** Ensure reliability and correctness.
- **Files:**
  - `test_agents.py`: Tests agent logic.
  - `test_knowledge_api.py`: Tests API endpoints for knowledge.
  - `test_knowledge_base.py`: Tests knowledge base service.
  - `test_knowledge_enhancements.py`: Tests knowledge enhancement logic.
  - `test_llm_providers.py`: Tests LLM provider integrations.

---

## Hierarchy and Wiring

- **Configuration** is loaded first, providing settings to all modules.
- **Main entry points** (`main.py`, `start_server.py`) initialize the application, set up agents, services, and APIs.
- **Agents** interact with LLM providers and services to process tasks.
- **API** exposes endpoints for frontend or external integrations.
- **LLM Providers** are abstracted for easy switching or extension.
- **Models** define the data structure for knowledge and other entities.
- **Services** implement business logic, using models and data storage.
- **Data** is stored in vector indices for efficient retrieval and similarity search.
- **Examples** and **tests** provide usage patterns and ensure code quality.

---

## Extending the Backend

- To add new agent types, create a new class in `app/agents/` and register it in `registry.py`.
- To support new LLMs, implement a provider in `app/llm/` and update the factory.
- To add new API endpoints, extend `app/api/` and update routing logic.
- For new business logic, add services in `app/services/`.

---

## Best Practices

- Follow the modular structure for maintainability.
- Use configuration files for environment-specific settings.
- Write tests for new features in the `tests/` directory.
- Use example scripts to validate and demonstrate new functionalities.

---

## File: backend.md

This documentation will be saved as `backend.md` in your backend folder for future reference.
