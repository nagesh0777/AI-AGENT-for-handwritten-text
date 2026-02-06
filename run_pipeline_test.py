import requests
import sys
import subprocess
import os

base_url = "http://localhost:8080/api/auth"

user = {"username": "debug_user", "password": "password", "email": "debug@example.com"}

# Register
print("Registering...")
try:
    resp = requests.post(f"{base_url}/register", json=user)
    print(f"Register status: {resp.status_code}, body: {resp.text}")
except Exception as e:
    print(f"Register failed locally: {e}")
    sys.exit(1)

# Login
print("Logging in...")
try:
    resp = requests.post(f"{base_url}/login", json=user)
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code}, {resp.text}")
        sys.exit(1)
    data = resp.json()
    token = data.get("token")
    if not token:
        print(f"No token in response: {data}")
        sys.exit(1)
    print(f"Token obtained: {token[:10]}...")
except Exception as e:
    print(f"Login request failed: {e}")
    sys.exit(1)

# Run test_upload.py
print("\nRunning test_upload.py...")
result = subprocess.run(["python", "test_upload.py", token], capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)

if result.returncode != 0:
    print("test_upload.py failed execution")
    sys.exit(1)

# Extract ID from STDOUT (hacky but works for now)
import json
import time

try:
    # stdout line: Response: {"status":"PROCESSING","id":1}
    for line in result.stdout.splitlines():
        if line.startswith("Response:"):
            json_str = line.replace("Response: ", "").strip()
            form_data = json.loads(json_str)
            form_id = form_data.get("id")
            break
    
    if form_id:
        print(f"Polling status for Form ID: {form_id}")
        headers = {"Authorization": f"Bearer {token}"}
        for _ in range(10):
            time.sleep(1)
            resp = requests.get(f"http://localhost:8080/api/forms/history", headers=headers)
            forms = resp.json()
            target_form = next((f for f in forms if f["id"] == form_id), None)
            if target_form:
                status = target_form["status"]
                print(f"Current Status: {status}")
                if status in ["COMPLETED", "FAILED"]:
                    break
            else:
                print("Form not found in history?")
    else:
        print("Could not extract Form ID")

except Exception as e:
    print(f"Error polling: {e}")

