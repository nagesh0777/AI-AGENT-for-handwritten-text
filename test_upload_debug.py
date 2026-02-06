import requests
import json

BASE_URL = "http://localhost:8080/api"

def test_upload():
    # 1. Login
    login_data = {"username": "debug_user", "password": "password"}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        return
    
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Upload
    files = {'file': ('test.png', b'fake image data', 'image/png')}
    r = requests.post(f"{BASE_URL}/forms/upload", headers=headers, files=files)
    print(f"Upload Status: {r.status_code}")
    print(f"Upload Response: {r.text}")

if __name__ == "__main__":
    test_upload()
