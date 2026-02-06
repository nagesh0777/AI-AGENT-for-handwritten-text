import os
import base64
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

# Create a tiny dummy image (1x1 black pixel)
image_data = base64.b64encode(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82').decode('utf-8')

llm = ChatOpenAI(model="gpt-4o", max_tokens=100)

try:
    response = llm.invoke([
        HumanMessage(
            content=[
                {"type": "text", "text": "What is in this image?"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}}
            ]
        )
    ])
    print("Success:")
    print(response.content)
except Exception as e:
    print(f"Error: {e}")
