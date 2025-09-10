# AI Agent Ecosystem

A personal AI assistant system with specialized agents for productivity, health, finance, scheduling, and journaling and n other aspects of life, as dynamic as you are.

## Project Structure

```
ai-agent-ecosystem/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── agents/         # AI agent implementations
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic services
│   ├── config.py           # Configuration management
│   ├── main.py             # FastAPI application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
├── shared/                 # Shared types and utilities
│   └── types.ts            # TypeScript type definitions
├── data/                   # Data storage (created at runtime)
├── credentials/            # Service credentials (not in git)
└── .env.example            # Environment configuration template
```

## Quick Start

### Backend Setup

1. Create a Python virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment configuration:
```bash
cp ../.env.example .env
# Edit .env with your configuration
```

4. Run the backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000 and will proxy API requests to the backend at http://localhost:8000.

## Features

- **Multi-Agent System**: Specialized AI agents for different life domains
- **LLM Provider Flexibility**: Support for both OpenAI API and local Ollama models
- **Interactive Knowledge Base**: RAG-powered system for personalized assistance
- **Google Services Integration**: Optional integration with Google Sheets and Calendar
- **Telegram Bot**: Mobile notifications and quick interactions
- **Dark/Light Theme**: Responsive UI with theme support

## Configuration

Copy `.env.example` to `.env` and configure:

- **LLM Provider**: Choose between OpenAI API or local Ollama
- **Google Services**: Optional integration for enhanced functionality
- **Telegram Bot**: Optional mobile interface
- **LangSmith**: Optional monitoring and debugging

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Testing
```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Architecture

The system uses:
- **FastAPI** for the backend API
- **React + Vite** for the frontend
- **LangGraph** for agent orchestration
- **FAISS** for vector storage and RAG
- **LangSmith** for monitoring (optional)

## License
This project is for my personal use, take proper rights before commercial use.