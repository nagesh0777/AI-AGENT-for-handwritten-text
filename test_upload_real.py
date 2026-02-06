import requests
import json
import os

BASE_URL = "http://localhost:8080/api"

def test_upload_real():
    # 1. Login
    login_data = {"username": "debug_user", "password": "password"}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Upload real file
    file_path = "c:/Users/aseuro/Desktop/task/backend/uploads/aca0b545-e15a-4e42-b731-9093fde3483c_WIN_20260206_09_52_05_Pro.jpg"
    with open(file_path, "rb") as f:
        files = {'file': (os.path.basename(file_path), f, 'image/jpeg')}
        r = requests.post(f"{BASE_URL}/forms/upload", headers=headers, files=files)
        print(f"Upload Status: {r.status_code}")
        print(f"Upload Response: {r.text}")

if __name__ == "__main__":
    test_upload_real()
