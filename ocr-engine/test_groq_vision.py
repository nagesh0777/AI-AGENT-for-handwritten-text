import os
import base64
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

def test_vision():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY not found")
        return

    llm = ChatGroq(model="llama-3.2-11b-vision-preview", groq_api_key=api_key)
    
    # Simple message test first
    try:
        response = llm.invoke("Hi, are you a vision model?")
        print(f"Response: {response.content}")
    except Exception as e:
        print(f"Simple invoke failed: {e}")

if __name__ == "__main__":
    test_vision()
