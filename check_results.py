import requests
import json

base_url = "http://localhost:8080/api"

# Login
login_res = requests.post(f"{base_url}/auth/login", json={"username": "debug_user", "password": "password"})
token = login_res.json()["token"]

headers = {"Authorization": f"Bearer {token}"}

# Get history to find the latest form
history_res = requests.get(f"{base_url}/forms/history", headers=headers)
forms = history_res.json()
if forms:
    latest_id = forms[0]["id"]
    print(f"Viewing results for Form ID: {latest_id}")
    results_res = requests.get(f"{base_url}/forms/{latest_id}/results", headers=headers)
    print(json.dumps(results_res.json(), indent=2))
else:
    print("No history found")
