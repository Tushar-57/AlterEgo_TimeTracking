# 🤖 AI Agent Ecosystem

> **A Personal AI Assistant System with Multi-Agent Architecture**

A sophisticated personal AI assistant system featuring specialized agents for productivity, health, finance, scheduling, and journaling. Built with LangGraph orchestration, RAG-powered knowledge management, and multi-modal interfaces for comprehensive life management.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Latest-orange.svg)](https://github.com/langchain-ai/langgraph)

---

## 🌟 **Features**

### 🎯 **Multi-Agent Intelligence**
- **Orchestrator Agent**: Central coordinator handling intent classification and agent delegation
- **Productivity Agent**: Task management, goal tracking, workflow optimization
- **Health Agent**: Wellness tracking, habit formation, meal planning, exercise routines
- **Finance Agent**: Expense tracking, budget management, financial goal setting
- **Scheduling Agent**: Calendar management, appointment booking, time optimization
- **Journal Agent**: Daily reflections, mood tracking, personal growth insights
- **General Agent**: Fallback handling for uncategorized requests

### 🧠 **Advanced Knowledge Management**
- **RAG-Powered Context**: FAISS vector store for semantic search and retrieval
- **Adaptive Learning**: Automatic preference extraction and pattern recognition
- **Interactive Knowledge Base**: View, edit, and manage your personal data
- **Context-Aware Responses**: Personalized assistance based on learned preferences

### ⚡ **Performance Optimized**
- **Graph Caching**: 40x performance improvement (5+ minutes → 3m28s response time)
- **Provider Fallback**: OpenAI ↔ Ollama automatic switching
- **Optimized Embeddings**: Efficient vector operations with graceful degradation

### 🌐 **Multi-Modal Interfaces**
- **Web Interface**: React-based chat UI with dark/light themes
- **Voice Support**: Speech-to-text and text-to-speech capabilities
- **Mobile Ready**: Responsive design for all devices
- **Developer Tools**: LangGraph Studio integration for workflow visualization

---

## 🏗️ **Architecture**

```
ai-agent-ecosystem/
├── 🖥️  backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── agents/                 # AI Agent Implementations
│   │   │   ├── orchestrator.py     # Main coordinator agent
│   │   │   ├── specialized.py      # Domain-specific agents
│   │   │   ├── base.py             # Agent base classes
│   │   │   ├── factory.py          # Agent lifecycle management
│   │   │   └── registry.py         # Active agent tracking
│   │   ├── llm/                    # LLM Provider Layer
│   │   │   ├── factory.py          # Provider creation & switching
│   │   │   ├── openai_provider.py  # OpenAI integration
│   │   │   ├── ollama_provider.py  # Local Ollama integration
│   │   │   └── service.py          # LLM service abstraction
│   │   ├── services/               # Core Business Logic
│   │   │   ├── knowledge_base.py   # RAG & knowledge management
│   │   │   └── vector_store.py     # FAISS vector operations
│   │   ├── api/                    # REST API Endpoints
│   │   ├── models/                 # Data Models & Schemas
│   │   └── langgraph/              # Workflow Definitions
│   ├── main.py                     # FastAPI App + Graph Caching
│   └── requirements.txt            # Python Dependencies
├── 🎨 frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/               # Chat interface components
│   │   │   ├── settings/           # Provider management UI
│   │   │   └── ui/                 # Reusable UI components
│   │   └── App.tsx                 # Main app with provider status
│   ├── package.json
│   └── vite.config.ts
├── 📊 data/                        # Runtime Data Storage
│   ├── vector_index                # FAISS vector database
│   └── knowledge/                  # Knowledge base entries
├── 🔐 credentials/                 # Service Credentials
└── 📚 shared/                      # Shared Types & Utilities
```

---

## 🚀 **Quick Start**

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **OpenAI API Key** (optional) or **Ollama** (local)

### 1️⃣ **Backend Setup**

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your API keys and preferences
```

### 2️⃣ **Frontend Setup**

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3️⃣ **Start the System**

#### Option A: Development Mode
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend  
cd frontend
npm run dev
```

#### Option B: LangGraph Development Server
```bash
# Backend with LangGraph Studio
cd backend
LANGCHAIN_TRACING_V2=false langgraph dev --allow-blocking

# Frontend
cd frontend
npm run dev
```

### 4️⃣ **Access the Application**
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **LangGraph Studio**: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024

---

## ⚙️ **Configuration**

### Environment Variables

Create `.env` file in the project root:

```bash
# === LLM PROVIDER CONFIGURATION ===
LLM_PROVIDER=ollama                      # Primary: ollama | openai
OPENAI_API_KEY=sk-your-openai-key-here   # Required for OpenAI
OLLAMA_ENDPOINT=http://localhost:11434   # Ollama server URL
OLLAMA_MODEL=llama3.2:3b                 # Ollama model name

# === OPTIONAL SERVICES ===
GOOGLE_CREDENTIALS_PATH=./credentials/google.json  # Google Services
TELEGRAM_BOT_TOKEN=your-telegram-token   # Telegram integration
LANGSMITH_API_KEY=your-langsmith-key     # Monitoring & debugging

# === PERFORMANCE SETTINGS ===
VECTOR_STORE_PATH=./data/vector_index    # FAISS storage location
KNOWLEDGE_BASE_PATH=./data/knowledge     # Knowledge entries
```

### LLM Provider Setup

#### OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`: `OPENAI_API_KEY=sk-your-key-here`
3. Set `LLM_PROVIDER=openai`

#### Ollama Setup (Recommended for Privacy)
1. Install [Ollama](https://ollama.ai/)
2. Pull a model: `ollama pull llama3.2:3b`
3. Start server: `ollama serve`
4. Set `LLM_PROVIDER=ollama`

---

## 🎮 **Usage**

### Basic Interaction

```bash
# Ask the health agent for meal planning
"Can you help with tomorrow's meal planning and gym workout?"

# Get productivity assistance
"Help me organize my tasks for this week"

# Financial guidance
"Show me my expense patterns and budget recommendations"

# Schedule management
"What's my availability tomorrow afternoon?"

# Personal reflection
"I'd like to journal about today's achievements"
```

### Advanced Features

#### Quick Actions (Frontend)
- Pre-defined action buttons for common requests
- One-click access to specialized agent functions
- Context-aware suggestions based on time of day

#### Voice Interaction
```python
# Run the voice interface
cd backend
python -m app.voice.interface

# Or use the Streamlit voice app
streamlit run voice_app.py
```

#### Knowledge Management
- **View Knowledge**: Web interface → Settings → Knowledge Base
- **Edit Preferences**: Interactive UI for preference modification
- **Export Data**: Download your knowledge base and chat history

---

## 🛠️ **Development**

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test

# Integration tests
python test_improvements.py
```

### Performance Monitoring

#### Graph Caching System
The system includes optimized graph caching that reduces response times by 97%:

```python
# Global cache prevents recreation on every request
_dev_graph_cache = None

def get_graph_for_dev():
    global _dev_graph_cache
    if _dev_graph_cache is None:
        _dev_graph_cache = create_graph()
    return _dev_graph_cache
```

#### LangSmith Integration
```bash
# Enable detailed tracing (optional)
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=your-langsmith-key
export LANGCHAIN_PROJECT=AlterEgo
```

### Adding New Agents

1. **Create Agent Class**:
```python
# backend/app/agents/new_agent.py
from app.agents.base import BaseAgent, AgentType

class NewAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id=f"new_agent_{uuid.uuid4()}",
            agent_type=AgentType.NEW,
            capabilities=["capability1", "capability2"],
            prompt=get_agent_prompt(AgentType.NEW)
        )
    
    async def execute(self, user_input: str, context: Dict[str, Any]) -> Dict[str, Any]:
        # Implementation here
        pass
```

2. **Register in Factory**:
```python
# backend/app/agents/factory.py
async def initialize_agent_ecosystem():
    new_agent = NewAgent()
    registry.register_agent(new_agent)
```

3. **Add to Orchestrator**:
```python
# Update intent classification to route to new agent
```

---

## 📊 **Monitoring & Debugging**

### Performance Metrics
- **Response Time**: Optimized from 5+ minutes to ~3.5 minutes
- **Graph Recreation**: Reduced from 40+ per request to 1 (cached)
- **Memory Usage**: Efficient vector operations with graceful degradation
- **Provider Failover**: 13-second OpenAI → Ollama fallback time

### Logging Configuration
```python
# Comprehensive logging across all components
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Health Checks
```bash
# API Health
curl http://localhost:8000/health

# LLM Provider Status
curl http://localhost:8000/api/llm/status

# Agent Registry Status
curl http://localhost:8000/api/agents/status
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### 1. LangGraph Server Issues
```bash
# Kill existing processes
pkill -f "langgraph dev"

# Restart with optimizations
cd backend
LANGCHAIN_TRACING_V2=false langgraph dev --allow-blocking
```

#### 2. Provider Connection Issues
```bash
# Check Ollama status
ollama list
ollama serve

# Test OpenAI connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### 3. Vector Store Issues
```bash
# Reset vector store
rm -rf data/vector_index*
# Restart backend to regenerate
```

### Performance Issues

#### Graph Recreation Problem
- **Symptom**: Slow response times (5+ minutes)
- **Solution**: Ensure graph caching is enabled in `main.py`
- **Verification**: Look for "Single graph creation" in logs

#### LangSmith Recursion Errors
- **Symptom**: "maximum recursion depth exceeded" errors
- **Solution**: Set `LANGCHAIN_TRACING_V2=false`
- **Impact**: Disables tracing but maintains functionality

---

## 🚀 **Deployment**

### Local Production

```bash
# Build frontend
cd frontend
npm run build

# Serve with backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

# Serve frontend with nginx or serve
npx serve -s frontend/dist -l 3000
```

### Docker Deployment

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# frontend/Dockerfile  
FROM node:18-alpine
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
```

---

## 🤝 **Contributing**

### Development Workflow

1. **Fork & Clone**
```bash
git clone https://github.com/yourusername/ai-agent-ecosystem.git
cd ai-agent-ecosystem
```

2. **Create Feature Branch**
```bash
git checkout -b feature/new-agent-type
```

3. **Make Changes**
- Follow the existing code patterns
- Add tests for new functionality
- Update documentation

4. **Test Changes**
```bash
# Run all tests
./run_tests.sh

# Test performance
python test_improvements.py
```

5. **Submit PR**
- Include clear description
- Reference related issues
- Ensure CI passes

### Code Style

```bash
# Backend formatting
black backend/
isort backend/

# Frontend formatting
cd frontend
npm run lint
npm run format
```

---

## 📈 **Roadmap**

### Current Version (v1.0)
- ✅ Multi-agent architecture with LangGraph orchestration
- ✅ RAG-powered knowledge management
- ✅ OpenAI/Ollama provider support
- ✅ Performance optimization (graph caching)
- ✅ React web interface
- ✅ Voice interaction capabilities

### Upcoming Features (v1.1)
- 🔄 Telegram bot integration
- 🔄 Google Services integration (Sheets, Calendar)
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics dashboard
- 🔄 Custom agent creation tools

### Future Enhancements (v2.0+)
- 🔮 Multi-user support
- 🔮 Advanced workflow automation
- 🔮 Plugin system for third-party integrations
- 🔮 AI model fine-tuning capabilities
- 🔮 Distributed deployment options

---

## 📝 **License**

This project is for personal use. Please obtain proper rights before any commercial use.

---

## 🙏 **Acknowledgments**

- **LangChain & LangGraph** for the agent orchestration framework
- **OpenAI** for advanced language models
- **Ollama** for local LLM capabilities
- **FastAPI** for the robust API framework
- **React & Vite** for the modern frontend stack

---

## 📞 **Support**

For issues, questions, or feature requests:

1. **Check Documentation**: Review this README and `/docs` folder
2. **Search Issues**: Look through existing GitHub issues
3. **Create Issue**: Open a new issue with detailed information
4. **Join Discussion**: Participate in GitHub Discussions

---

<div align="center">

**Built with ❤️ for Personal AI Assistance**

[⭐ Star this repo](https://github.com/yourusername/ai-agent-ecosystem) • [🐛 Report Bug](https://github.com/yourusername/ai-agent-ecosystem/issues) • [💡 Request Feature](https://github.com/yourusername/ai-agent-ecosystem/issues)

</div>