#!/bin/bash

# AI Agent Ecosystem Setup Script

echo "🚀 Setting up AI Agent Ecosystem..."

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data
mkdir -p credentials

# Backend setup
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

cd ..

# Frontend setup
echo "⚛️ Setting up React frontend..."
cd frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating environment configuration..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Don't forget to configure your .env file!"