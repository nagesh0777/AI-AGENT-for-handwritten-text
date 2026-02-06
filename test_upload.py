import requests
import sys

url = "http://localhost:8080/api/forms/upload"
token = sys.argv[1]
headers = {"Authorization": f"Bearer {token}"}
files = {'file': ('test_image.png', open('test_image.png', 'rb'), 'image/png')}

try:
    response = requests.post(url, headers=headers, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
