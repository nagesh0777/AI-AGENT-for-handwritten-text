
import os
from dotenv import load_dotenv
from langfuse.langchain import CallbackHandler
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

# Load .env from project root
load_dotenv(r'c:\Users\aseuro\Desktop\task\.env')

# Explicitly set environment variables for Langfuse
os.environ["LANGFUSE_PUBLIC_KEY"] = os.getenv("LANGFUSE_PUBLIC_KEY", "")
os.environ["LANGFUSE_SECRET_KEY"] = os.getenv("LANGFUSE_SECRET_KEY", "")
os.environ["LANGFUSE_HOST"] = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

print(f"PublicKey: {os.environ['LANGFUSE_PUBLIC_KEY']}")
print(f"SecretKey: {os.environ['LANGFUSE_SECRET_KEY'][:10]}...")
print(f"Host: {os.environ['LANGFUSE_HOST']}")

try:
    # Initialize Langfuse CallbackHandler (reads from environment variables)
    langfuse_handler = CallbackHandler()
    print("✅ Langfuse CallbackHandler initialized successfully")
    
    # Test with a simple LLM call
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1
    )
    
    print("\n🔄 Testing LLM call with Langfuse tracing...")
    response = llm.invoke(
        [HumanMessage(content="Say 'Hello from Langfuse test!'")],
        config={"callbacks": [langfuse_handler]}
    )
    
    print(f"✅ LLM Response: {response.content}")
    print("\n✅ Langfuse tracing is configured!")
    print("⚠️  If you see a 401 error above, your Langfuse credentials may be incorrect.")
    print("   Please verify your LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY in .env")
    print("   You can get new credentials from: https://cloud.langfuse.com")
    
except Exception as e:
    print(f"❌ Langfuse Test Failed: {e}")
    import traceback
    traceback.print_exc()
