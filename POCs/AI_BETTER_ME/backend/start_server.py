#!/usr/bin/env python3
"""
Startup script for the AI Agent Ecosystem backend server.
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables
os.environ.setdefault("PYTHONPATH", str(backend_dir))

if __name__ == "__main__":
    print("🚀 Starting AI Agent Ecosystem Backend...")
    print(f"📁 Backend directory: {backend_dir}")
    print(f"🐍 Python path: {sys.path[0]}")
    
    try:
        # Import and run the FastAPI app
        from main import app
        
        print("✅ FastAPI app loaded successfully")
        print("🌐 Starting server on http://localhost:8000")
        print("📚 API docs available at http://localhost:8000/docs")
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)