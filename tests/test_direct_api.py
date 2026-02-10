
import os
from dotenv import load_dotenv
import requests

# Load .env from project root
load_dotenv(r'c:\Users\aseuro\Desktop\task\.env')

# Explicitly set environment variables
os.environ["LANGFUSE_PUBLIC_KEY"] = os.getenv("LANGFUSE_PUBLIC_KEY", "")
os.environ["LANGFUSE_SECRET_KEY"] = os.getenv("LANGFUSE_SECRET_KEY", "")
os.environ["LANGFUSE_HOST"] = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

print(f"Testing Langfuse credentials...")
print(f"PublicKey: {os.environ['LANGFUSE_PUBLIC_KEY']}")
print(f"SecretKey: {os.environ['LANGFUSE_SECRET_KEY'][:15]}...")
print(f"Host: {os.environ['LANGFUSE_HOST']}")

# Test direct API call
url = f"{os.environ['LANGFUSE_HOST']}/api/public/ingestion"
headers = {
    "Content-Type": "application/json"
}
auth = (os.environ['LANGFUSE_PUBLIC_KEY'], os.environ['LANGFUSE_SECRET_KEY'])

test_payload = {
    "batch": [
        {
            "id": "test-trace-123",
            "type": "trace-create",
            "timestamp": "2026-02-10T06:24:00.000Z",
            "body": {
                "id": "test-trace-123",
                "name": "Direct API Test",
                "timestamp": "2026-02-10T06:24:00.000Z"
            }
        }
    ]
}

print("\n🔄 Testing direct API call to Langfuse...")
try:
    response = requests.post(url, json=test_payload, headers=headers, auth=auth)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200 or response.status_code == 207:
        print("\n✅ Direct API call successful! Credentials are valid!")
    else:
        print(f"\n❌ API call failed with status {response.status_code}")
        print("This might indicate:")
        print("  1. Invalid credentials")
        print("  2. Project/organization mismatch")
        print("  3. API endpoint issue")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
