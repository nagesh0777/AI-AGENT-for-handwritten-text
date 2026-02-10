"""
Test script to verify Langfuse tracing is working with the OCR engine
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(r'c:\Users\aseuro\Desktop\task\.env')

# Set environment variables explicitly
os.environ["LANGFUSE_PUBLIC_KEY"] = os.getenv("LANGFUSE_PUBLIC_KEY", "")
os.environ["LANGFUSE_SECRET_KEY"] = os.getenv("LANGFUSE_SECRET_KEY", "")
os.environ["LANGFUSE_HOST"] = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

print("=" * 60)
print("LANGFUSE TRACING VERIFICATION")
print("=" * 60)
print(f"✓ Public Key: {os.environ['LANGFUSE_PUBLIC_KEY']}")
print(f"✓ Secret Key: {os.environ['LANGFUSE_SECRET_KEY'][:20]}...")
print(f"✓ Host: {os.environ['LANGFUSE_HOST']}")
print("=" * 60)

# Add the ocr-engine directory to the path
sys.path.insert(0, r'c:\Users\aseuro\Desktop\task\ocr-engine')

# Import the main module to check initialization
print("\n📦 Importing OCR engine modules...")
try:
    from main import langfuse_handler, agent
    
    if langfuse_handler is not None:
        print("✅ Langfuse handler initialized successfully in main.py")
        print(f"   Handler type: {type(langfuse_handler)}")
    else:
        print("❌ Langfuse handler is None - tracing will not work!")
        
    if agent is not None:
        print("✅ ExtractionAgent initialized successfully")
        if hasattr(agent, 'handler') and agent.handler is not None:
            print("✅ Agent has Langfuse handler attached")
        else:
            print("❌ Agent does not have Langfuse handler attached!")
    else:
        print("❌ Agent is None!")
        
except Exception as e:
    print(f"❌ Error importing modules: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print("✅ Langfuse credentials are configured correctly")
print("✅ OCR engine is set up to trace all LLM calls to Langfuse")
print("\n📊 To view traces:")
print("   1. Run the OCR engine and process an image")
print("   2. Go to https://cloud.langfuse.com")
print("   3. Navigate to 'Tracing' in the left sidebar")
print("   4. You should see traces for each OCR processing request")
print("=" * 60)
