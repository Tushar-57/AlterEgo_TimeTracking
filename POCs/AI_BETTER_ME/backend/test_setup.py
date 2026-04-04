"""Basic test to verify backend setup is working."""

import sys
import importlib.util

def test_imports():
    """Test that all required packages can be imported."""
    required_packages = [
        'fastapi',
        'uvicorn',
        'pydantic',
        'python_dotenv',
        'langchain',
        'langgraph',
        'langsmith',
        'faiss',
        'numpy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            # Handle special cases
            if package == 'python_dotenv':
                import dotenv
            elif package == 'faiss':
                import faiss
            else:
                __import__(package)
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    else:
        print("\n✅ All required packages are installed!")
        return True

def test_config():
    """Test that configuration can be loaded."""
    try:
        from config import settings
        print(f"✅ Configuration loaded - API will run on {settings.api_host}:{settings.api_port}")
        return True
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

def test_fastapi():
    """Test that FastAPI app can be created."""
    try:
        from main import app
        print("✅ FastAPI app created successfully")
        return True
    except Exception as e:
        print(f"❌ FastAPI app error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing AI Agent Ecosystem Backend Setup\n")
    
    tests = [
        ("Package imports", test_imports),
        ("Configuration", test_config),
        ("FastAPI app", test_fastapi)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        if not test_func():
            all_passed = False
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 All tests passed! Backend setup is ready.")
        print("\nTo start the server:")
        print("uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("❌ Some tests failed. Please check the setup.")
        sys.exit(1)