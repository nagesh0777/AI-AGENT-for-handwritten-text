import requests
import os

BASE_URL = "http://localhost:8080/api"

def test_upload_real():
    # No login needed
    headers = {}
    
    # 2. Upload real file
    # Use one of the existing files in uploads
    file_path = "c:/Users/aseuro/Desktop/task/backend/uploads/aca0b545-e15a-4e42-b731-9093fde3483c_WIN_20260206_09_52_05_Pro.jpg"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, "rb") as f:
        files = {'file': (os.path.basename(file_path), f, 'image/jpeg')}
        r = requests.post(f"{BASE_URL}/forms/upload", headers=headers, files=files)
        print(f"Upload Status: {r.status_code}")
        print(f"Upload Response: {r.text}")

if __name__ == "__main__":
    test_upload_real()
