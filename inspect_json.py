import requests
import json

base_url = "http://localhost:8080/api"
login_res = requests.post(f"{base_url}/auth/login", json={"username": "debug_user", "password": "password"})
token = login_res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}
history_res = requests.get(f"{base_url}/forms/history", headers=headers)
forms = history_res.json()
if forms:
    latest_id = forms[0]["id"]
    results_res = requests.get(f"{base_url}/forms/{latest_id}/results", headers=headers)
    data = results_res.json()
    print("--- STRUCTURED JSON ---")
    print(data.get("structuredJson"))
    print("--- RAW TEXT ---")
    print(data.get("rawText"))
